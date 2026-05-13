/**
 * Android TV Remote Protocol v2 (ATRPv2) Communication Layer.
 * Operates over TLS on Port 6466 using Protocol Buffers.
 */
import protobuf from 'protobufjs';
import remoteMessageProto from './remotemessage.proto?raw';

export enum RemoteKeyCode {
  KEYCODE_UNKNOWN = 0,
  KEYCODE_HOME = 3,
  KEYCODE_BACK = 4,
  KEYCODE_DPAD_UP = 19,
  KEYCODE_DPAD_DOWN = 20,
  KEYCODE_DPAD_LEFT = 21,
  KEYCODE_DPAD_RIGHT = 22,
  KEYCODE_DPAD_CENTER = 23,
  KEYCODE_VOLUME_UP = 24,
  KEYCODE_VOLUME_DOWN = 25,
  KEYCODE_POWER = 26,
}

export enum KeyAction {
  DOWN = 1, // START_LONG
  UP = 2,   // END_LONG
  SHORT = 3, // SHORT
}

export class AndroidTVProtocolClient {
  private ip: string;
  private port: number = 6466; // Standard ATRPv2 control port
  private isConnected = false;
  private root: protobuf.Root | null = null;
  private RemoteMessageClass: any = null;

  // Heartbeat tracking
  private pingInterval: any = null;
  private pongTimeout: any = null;
  private lastPingVal: number = 0;
  
  // Callbacks
  public onDisconnect: (() => void) | null = null;

  constructor(ip: string) {
    this.ip = ip;
  }

  /**
   * Initializes the protobuf schemas
   */
  public async initializeProtobufs() {
    this.root = protobuf.parse(remoteMessageProto).root;
    this.RemoteMessageClass = this.root.lookupType("remotemessage.RemoteMessage");
  }

  /**
   * Connect to the TV using the client certificate created during the pairing phase.
   * 
   * TLS Assumptions:
   * - Connection MUST establish mutual TLS (mTLS).
   * - The device expects the exact client certificate generated during pairing.
   * - Certificate verification on the TV side requires our client certificate.
   * - In a browser environment, this requires a native Capacitor TLS socket plugin, 
   *   as standard WebSockets or fetch cannot perform mTLS over raw TCP.
   */
  public async connect(timeoutMs = 10000): Promise<void> {
    if (!this.root) await this.initializeProtobufs();
    
    console.log(`[ATRP] Attempting TLS connection to ${this.ip}:${this.port}...`);
    
    // Simulate connection timeout and establishing
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Connection timed out"));
      }, timeoutMs);

      // TODO: Init Capacitor TLS Socket -> handshake -> ready
      setTimeout(() => {
        clearTimeout(timer);
        this.isConnected = true;
        console.log(`[ATRP] Connected to ${this.ip}.`);
        this.startHeartbeat();
        resolve();
      }, 500); // Simulate network delay
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 5000); // Send ping every 5 seconds
  }

  private stopHeartbeat() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
  }

  private sendPing() {
    if (!this.isConnected || !this.RemoteMessageClass) return;

    this.lastPingVal = Math.floor(Math.random() * 10000);
    console.log(`[ATRP] Sending Ping: ${this.lastPingVal}`);

    const message = this.RemoteMessageClass.create({
      pingRequest: {
        val1: this.lastPingVal
      }
    });

    const buffer = this.RemoteMessageClass.encode(message).finish();
    const payload = new Uint8Array(buffer.length + 1);
    payload[0] = buffer.length;
    payload.set(buffer, 1);

    // TODO: Write buffer to socket.

    // Expect pong within 3 seconds
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
    this.pongTimeout = setTimeout(() => {
      console.warn(`[ATRP] Pong timeout for ${this.ip}. Connection assumed dead.`);
      this.handleConnectionLost();
    }, 3000);
    
    // Simulating pong response for validation phase
    setTimeout(() => {
       this.handlePong(this.lastPingVal);
    }, 100);
  }

  public handlePong(val1: number) {
    if (val1 === this.lastPingVal) {
      if (this.pongTimeout) clearTimeout(this.pongTimeout);
      // console.log(`[ATRP] Received valid Pong.`);
    }
  }

  private handleConnectionLost() {
    this.disconnect();
    if (this.onDisconnect) {
      this.onDisconnect();
    }
  }

  /**
   * Send a standard KeyEvent Protobuf payload to the TV.
   */
  public async sendKey(keycode: RemoteKeyCode, action: KeyAction): Promise<void> {
    if (!this.isConnected || !this.RemoteMessageClass) {
      throw new Error('Not connected or protobufs not initialized.');
    }
    
    console.log(`[ATRP] Sending RemoteKeyCode: ${keycode}, Action: ${action} to ${this.ip}`);
    
    // Construct Protobuf Message
    const message = this.RemoteMessageClass.create({
      remoteKeyInject: {
        keyCode: keycode,
        direction: action
      }
    });
    
    const buffer = this.RemoteMessageClass.encode(message).finish();
    
    // Prefix payload with exactly 1 byte containing the length of the protobuf payload
    const payload = new Uint8Array(buffer.length + 1);
    payload[0] = buffer.length;
    payload.set(buffer, 1);

    // TODO: Send `payload` buffer over the active TLS socket.
    console.log(`[ATRP] Encoded buffer size: ${payload.length} bytes (simulated socket write)`);
  }

  /**
   * Specific test helper for the HOME command.
   */
  public async sendHome(): Promise<void> {
    await this.sendKey(RemoteKeyCode.KEYCODE_HOME, KeyAction.SHORT);
  }

  public disconnect() {
    this.isConnected = false;
    this.stopHeartbeat();
    console.log(`[ATRP] Disconnected from ${this.ip}`);
  }
}

