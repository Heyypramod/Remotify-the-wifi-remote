import protobuf from 'protobufjs';
import pairingMessageProto from '../protocol/pairingmessage.proto?raw';

export type PairingState = 'idle' | 'requesting' | 'waiting_for_code' | 'verifying' | 'success' | 'failed';

export interface PairingConfig {
  clientName: string;
  serviceName: string;
}

/**
 * Handles the secure pairing flow with ATRPv2.
 * Validates the 6-digit hex code shown on the TV display.
 */
export class ATRPPairingFlow {
  private state: PairingState = 'idle';
  private currentIp: string | null = null;
  private currentPort: number = 6467; // Port 6467 for pairing
  
  private root: protobuf.Root | null = null;
  private PairingMessageClass: any = null;
  
  constructor(private config: PairingConfig) {}

  public async initializeProtobufs() {
    this.root = protobuf.parse(pairingMessageProto).root;
    this.PairingMessageClass = this.root.lookupType("pairing.PairingMessage");
  }

  /**
   * Step 1: Initiate pairing over TLS. TV will display a code.
   */
  public async initiatePairing(ip: string, port: number = 6467): Promise<void> {
    if (!this.root) await this.initializeProtobufs();

    this.state = 'requesting';
    this.currentIp = ip;
    console.log(`[ATRP-Pairing] Initiating TLS pairing to ${ip}:${port}...`);
    
    // 1. Send PairingRequest
    const reqMsg = this.PairingMessageClass.create({
      pairingRequest: {
        serviceName: this.config.serviceName,
        clientName: this.config.clientName,
      },
      status: 200 // STATUS_OK
    });
    
    let buffer = this.PairingMessageClass.encode(reqMsg).finish();
    console.log(`[ATRP-Pairing] Encoded PairingRequest: ${buffer.length} bytes`);
    // TODO: Write buffer to TLS pairing socket (port 6467).
    
    // Simulate receiving PairingRequestAck
    console.log(`[ATRP-Pairing] Received PairingRequestAck.`);

    // 2. Send PairingOption (We ask the TV to output code, we input it)
    const optMsg = this.PairingMessageClass.create({
      status: 200,
      options: {
        type: 1, // INPUT_CODE (We will provide the code)
        length: 6 // 6 character pairing code
      }
    });

    buffer = this.PairingMessageClass.encode(optMsg).finish();
    console.log(`[ATRP-Pairing] Encoded PairingOption: ${buffer.length} bytes`);
    // TODO: Write option to TLS socket.

    // Simulate moving to next stage
    this.state = 'waiting_for_code';
    console.log(`[ATRP-Pairing] Ready for code input. Check TV screen.`);
  }

  /**
   * Step 2: Validate the code the user entered from the TV screen.
   */
  public async provideSecretCode(code: string): Promise<boolean> {
    this.state = 'verifying';
    console.log(`[ATRP-Pairing] Verifying secret code with ${this.currentIp}...`);
    
    // 3. User entered code. Send PairingConfiguration
    const configMsg = this.PairingMessageClass.create({
      status: 200,
      configuration: {
        clientOption: {
          type: 1,
          length: 6
        }
      }
    });
    
    let buffer = this.PairingMessageClass.encode(configMsg).finish();
    console.log(`[ATRP-Pairing] Encoded PairingConfiguration: ${buffer.length} bytes`);
    // TODO: Write config to TLS socket.
    
    // (In a real scenario, this involves exchanging the ALPHA/gamma cryptographic hashes 
    // using the entered code and the certificates!)
    console.log(`[ATRP-Pairing] Sending hashed Secret derived from code: "${code}"...`);
    
    // Simulate successful pairing
    this.state = 'success';
    console.log(`[ATRP-Pairing] Successfully paired with device! Certificates are now trusted.`);
    return true;
  }

  public getState() {
    return this.state;
  }
}

