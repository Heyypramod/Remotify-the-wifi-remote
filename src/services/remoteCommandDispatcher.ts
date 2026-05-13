import {
  RemoteCommand,
  RemoteCommandType,
  SocketMessageType,
  SocketMessageWrapper,
} from '../types/remote';

/**
 * Abstract interface for the lower-level UI-agnostic transport layer.
 * Any protocol (WebSocket, TCP, ADB) can implement this.
 */
export interface RemoteTransport {
  send(message: SocketMessageWrapper): Promise<void>;
}

export type CommandState = 'pending' | 'success' | 'failed' | 'timeout';

export interface DispatcherOptions {
  timeoutMs?: number;
  maxRetries?: number;
  throttleMs?: number; // Base throttle duration for high-frequency events (ms)
}

interface QueuedCommand {
  id: string;
  command: RemoteCommand;
  attempts: number;
  createdAt: number;
  resolve: (value: void) => void;
  reject: (reason: Error) => void;
}

/**
 * Fallback UUID generator if crypto.randomUUID is not available
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16)
  );
}

/**
 * Central Command Dispatcher.
 * 
 * Provides:
 * - Queueing
 * - Validation
 * - Throttling for high frequency events
 * - Execution with timeout and retries
 * - Structured logging
 */
export class RemoteCommandDispatcher {
  private transport: RemoteTransport | null = null;
  private queue: QueuedCommand[] = [];
  private isProcessing: boolean = false;
  
  // Rate limiting states
  private lastExecutedAt = new Map<RemoteCommandType, number>();
  
  // Base configurations
  private readonly config: Required<DispatcherOptions>;

  // High-frequency events that must be throttled to avoid flooding transport
  private readonly throttledTypes = new Set<RemoteCommandType>([
    RemoteCommandType.POINTER,
    RemoteCommandType.TOUCH_MOVE,
    RemoteCommandType.TOUCH_SCROLL,
    RemoteCommandType.VOLUME,
  ]);

  constructor(options?: DispatcherOptions) {
    this.config = {
      timeoutMs: options?.timeoutMs ?? 15000,
      maxRetries: options?.maxRetries ?? 1,
      throttleMs: options?.throttleMs ?? 32, // roughly ~30fps 
    };
  }

  /**
   * Inject or update the active transport layer
   */
  public setTransport(transport: RemoteTransport | null) {
    this.transport = transport;
  }

  /**
   * Main entrypoint for all UI elements to dispatch commands.
   * Returns a promise that resolves upon successful ACK or transit out.
   */
  public async dispatch(command: RemoteCommand): Promise<void> {
    this.validateCommand(command);

    if (this.shouldThrottle(command)) {
      return Promise.resolve(); // Drop safely if heavily throttled
    }

    return new Promise<void>((resolve, reject) => {
      this.queue.push({
        id: generateId(),
        command,
        attempts: 0,
        createdAt: Date.now(),
        resolve,
        reject,
      });

      this.processQueue();
    });
  }

  /**
   * Verifies the structural integrity of a payload before queuing.
   */
  private validateCommand(command: RemoteCommand): void {
    if (!command || !command.type) {
      throw new Error('Invalid command payload: Missing type');
    }

    switch (command.type) {
      case RemoteCommandType.KEY:
        if (!command.payload?.key) throw new Error('KEY command missing "key"');
        break;
      case RemoteCommandType.TEXT:
        if (typeof command.payload?.text !== 'string') throw new Error('TEXT command missing "text"');
        break;
      case RemoteCommandType.POINTER:
        if (typeof command.payload?.deltaX !== 'number' || typeof command.payload?.deltaY !== 'number') {
          throw new Error('POINTER command missing dx/dy constraints');
        }
        break;
      case RemoteCommandType.TOUCH_MOVE:
      case RemoteCommandType.TOUCH_SCROLL:
        if (typeof command.payload?.dx !== 'number' || typeof command.payload?.dy !== 'number') {
          throw new Error(`${command.type} missing strict dx/dy constraints`);
        }
        break;
      case RemoteCommandType.VOLUME:
        if (typeof command.payload?.level !== 'number') throw new Error('VOLUME missing level integer');
        break;
      case RemoteCommandType.APP_LAUNCH:
        if (!command.payload?.appId) throw new Error('APP_LAUNCH missing appId string');
        break;
      case RemoteCommandType.DEVICE_SELECT:
        if (!command.payload?.deviceId) throw new Error('DEVICE_SELECT missing deviceId target');
        break;
    }
  }

  /**
   * Determines if a command should be dropped based on high-frequency fire rate.
   */
  private shouldThrottle(command: RemoteCommand): boolean {
    if (!this.throttledTypes.has(command.type)) {
      return false;
    }

    const now = Date.now();
    const lastAt = this.lastExecutedAt.get(command.type) || 0;

    if (now - lastAt < this.config.throttleMs) {
      return true; // Ignore this burst
    }

    this.lastExecutedAt.set(command.type, now);
    return false;
  }

  /**
   * Async engine routing elements actively from the queue safely.
   */
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift();
        if (!item) continue;

        await this.executeItem(item);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Executes a single command payload with timeout & backoff retries handling.
   */
  private async executeItem(item: QueuedCommand) {
    const startTime = Date.now();
    let state: CommandState = 'pending';
    let lastError: any;

    if (!this.transport) {
      state = 'failed';
      this.logCommand(item.command, state, Date.now() - startTime, 'unknown', new Error('Disconnected transport'));
      item.reject(new Error('Dispatcher failure: Transport missing or disconnected'));
      return;
    }

    // High frequency events (touches, scrolls) shouldn't be backed off and retried,
    // they should aggressively drop. State actions like power/key should retry.
    const maxAttempts = this.throttledTypes.has(item.command.type) 
      ? 1 
      : (this.config.maxRetries + 1);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        item.attempts = attempt;
        
        const wrapper: SocketMessageWrapper = {
          id: item.id,
          timestamp: new Date().toISOString(),
          message: {
            type: SocketMessageType.COMMAND,
            payload: item.command,
          }
        };

        await this.sendWithTimeout(wrapper, this.config.timeoutMs);
        
        state = 'success';
        this.logCommand(item.command, state, Date.now() - startTime, 'active-device');
        item.resolve();
        return;

      } catch (error: any) {
        lastError = error;
        state = error.message?.includes('TIMEOUT') ? 'timeout' : 'failed';
        
        if (attempt < maxAttempts) {
          // Exponential backoff
          await new Promise(r => setTimeout(r, attempt * 200));
        }
      }
    }

    this.logCommand(item.command, state, Date.now() - startTime, 'active-device', lastError);
    item.reject(lastError || new Error(`Command failed after ${maxAttempts} attempts`));
  }

  /**
   * Wraps the raw transport execution in a hard timeout barrier
   */
  private sendWithTimeout(wrapper: SocketMessageWrapper, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.transport) {
        return reject(new Error('Transport disconnected during processing'));
      }

      const timer = setTimeout(() => {
        reject(new Error(`TIMEOUT: Command execution exceeded ${timeoutMs}ms limit`));
      }, timeoutMs);

      this.transport.send(wrapper)
        .then(() => {
          clearTimeout(timer);
          resolve();
        })
        .catch(err => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  /**
   * Outputs command metric history. Useful for hooking into telemetry downstream.
   */
  private logCommand(
    command: RemoteCommand,
    state: CommandState,
    latencyMs: number,
    targetDevice: string,
    error?: any
  ) {
    const timestamp = new Date().toISOString();
    const isError = state === 'failed' || state === 'timeout';

    const logPayload = {
      layer: 'RemoteDispatcher',
      timestamp,
      type: command.type,
      state,
      latencyMs,
      targetDevice,
      payload: 'payload' in command ? command.payload : undefined,
      ...(error && { error: error.message || error }),
    };

    if (isError) {
      console.error(`[RemoteCommand] ❌ ${command.type} ${state.toUpperCase()} (${latencyMs}ms)`, logPayload);
    } else {
      console.log(`[RemoteCommand] ✨ ${command.type} SUCCESS (${latencyMs}ms)`, logPayload);
    }
  }
}

// Singleton export recommended for UI binding limits, though you can instantiate explicitly as well
export const remoteDispatcher = new RemoteCommandDispatcher();
