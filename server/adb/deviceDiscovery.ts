import { adbService } from './adbService';
import { Bonjour } from 'bonjour-service';

export enum DeviceStatus {
  ONLINE = 'device',
  OFFLINE = 'offline',
  UNAUTHORIZED = 'unauthorized',
  DISCONNECTED = 'disconnected',
  UNKNOWN = 'unknown',
}

export interface AdbDevice {
  id: string; // usually IP:PORT or serial
  status: DeviceStatus;
  name?: string;
  type?: string;
}

export class DeviceDiscovery {
  private bonjour = new Bonjour();
  private discoveredDevices = new Map<string, AdbDevice>();

  constructor() {
    this.scanNetwork();
  }

  /**
   * Returns a list of connected devices and their statuses.
   */
  public async getDevices(): Promise<AdbDevice[]> {
    try {
      const output = await adbService.execute('devices');
      const adbDevs = this.parseDevicesOutput(output);
      
      // Merge with discovered devices
      const result: AdbDevice[] = [];
      const adbIds = new Set<string>();
      
      for (const dev of adbDevs) {
        // If we previously discovered this device via mDNS, keep its friendly name/type
        if (this.discoveredDevices.has(dev.id)) {
          const cached = this.discoveredDevices.get(dev.id)!;
          dev.name = cached.name;
          dev.type = cached.type;
        }
        result.push(dev);
        adbIds.add(dev.id);
      }
      
      // Also return discovered devices that are not yet connected via ADB
      for (const dev of Array.from(this.discoveredDevices.values())) {
        if (!adbIds.has(dev.id)) {
          result.push(dev);
        }
      }
      
      return result;
    } catch (error) {
      console.error('[DeviceDiscovery] Failed to list devices', error);
      return Array.from(this.discoveredDevices.values());
    }
  }

  public scanNetwork() {
    console.log('[DeviceDiscovery] Scanning network for Android TV devices...');
    
    // Scan for _androidtvremote2._tcp
    this.bonjour.find({ type: 'androidtvremote2' }, (service) => {
      const ip = service.addresses?.find(a => a.includes('.')) || service.addresses?.[0] || service.host;
      if (ip) {
        const id = `${ip}:5555`;
        this.discoveredDevices.set(id, {
          id,
          status: DeviceStatus.DISCONNECTED,
          name: service.name || 'Android TV',
          type: 'AndroidTV'
        });
      }
    });

    // Scan for _googlecast._tcp
    this.bonjour.find({ type: 'googlecast' }, (service) => {
      const ip = service.addresses?.find(a => a.includes('.')) || service.addresses?.[0] || service.host;
      if (ip) {
        const id = `${ip}:5555`;
        if (!this.discoveredDevices.has(id)) {
          this.discoveredDevices.set(id, {
            id,
            status: DeviceStatus.DISCONNECTED,
            name: service.name || 'Chromecast / Google TV',
            type: 'GoogleTV'
          });
        }
      }
    });
  }

  /**
   * Connects to a device over TCP/IP.
   */
  public async connect(ipAddress: string, port = 5555): Promise<boolean> {
    try {
      const target = `${ipAddress}:${port}`;
      const output = await adbService.execute(`connect ${target}`, { timeoutMs: 10000 });
      return output.includes('connected to');
    } catch (error) {
      console.error(`[DeviceDiscovery] Failed to connect to ${ipAddress}:${port}`, error);
      return false;
    }
  }

  /**
   * Disconnects from a device.
   */
  public async disconnect(ipAddress: string, port = 5555): Promise<boolean> {
    try {
      const target = `${ipAddress}:${port}`;
      await adbService.execute(`disconnect ${target}`);
      return true;
    } catch (error) {
      console.error(`[DeviceDiscovery] Failed to disconnect from ${ipAddress}:${port}`, error);
      return false;
    }
  }

  /**
   * Parses the output of `adb devices` into a structured list.
   */
  private parseDevicesOutput(output: string): AdbDevice[] {
    const lines = output.split('\n').map(line => line.trim());
    const devices: AdbDevice[] = [];

    // Skip the first line which is typically "List of devices attached"
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const [id, rawStatus] = line.split(/\s+/);
      let status = DeviceStatus.UNKNOWN;

      if (rawStatus === 'device') status = DeviceStatus.ONLINE;
      else if (rawStatus === 'offline') status = DeviceStatus.OFFLINE;
      else if (rawStatus === 'unauthorized') status = DeviceStatus.UNAUTHORIZED;
      
      devices.push({ id, status });
    }

    return devices;
  }
}

export const deviceDiscovery = new DeviceDiscovery();
