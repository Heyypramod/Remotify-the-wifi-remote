import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface AdbExecutionOptions {
  timeoutMs?: number;
  retries?: number;
}

interface QueuedCommand {
  command: string;
  resolve: (value: string) => void;
  reject: (reason: any) => void;
  options: Required<AdbExecutionOptions>;
}

export class AdbService {
  private queue: QueuedCommand[] = [];
  private isProcessing = false;

  public async execute(
    command: string,
    options?: AdbExecutionOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        command,
        resolve,
        reject,
        options: {
          timeoutMs: options?.timeoutMs ?? 10000,
          retries: options?.retries ?? 0,
        },
      });
      this.processQueue();
    });
  }

  public async executeOnDevice(
    deviceId: string,
    command: string,
    options?: AdbExecutionOptions
  ): Promise<string> {
    return this.execute(`-s ${deviceId} ${command}`, options);
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift();
        if (!item) continue;

        await this.runCommand(item);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async runCommand(item: QueuedCommand, attempt = 0) {
    const { command, resolve, reject, options } = item;
    const { timeoutMs, retries } = options;

    try {
      // Note: we use "adb" command globally. 
      // Ensure ADB is installed and added to PATH on the target server.
      const fullCommand = `adb ${command}`;
      // console.log(`[ADB] Executing: ${fullCommand}`);
      
      const { stdout, stderr } = await execAsync(fullCommand, { timeout: timeoutMs });
      
      if (stderr && !this.isWarningOnly(stderr)) {
        throw new Error(stderr.trim());
      }
      
      resolve(stdout.trim());
    } catch (error: any) {
      // Handle missing ADB gracefully for development environments
      if (error.message && (error.message.includes('not found') || error.message.includes('ENOENT'))) {
        if (attempt === 0) {
          console.warn(`[ADB] MOCK MODE: Command "${command}" skipped because "adb" is not installed.`);
        }
        resolve('MOCK_SUCCESS');
        return;
      }

      if (attempt < retries) {
        console.warn(`[ADB] Command failed, retrying (${attempt + 1}/${retries}): ${command}`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // simple backoff
        await this.runCommand(item, attempt + 1);
      } else {
        console.error(`[ADB] Command error: ${command}`, error.message || error);
        reject(error);
      }
    }
  }

  private isWarningOnly(stderr: string): boolean {
    // Some ADB commands output warnings to stderr that aren't critical failures.
    return stderr.toLowerCase().includes('warning:');
  }
}

export const adbService = new AdbService();
