export interface DiscoveredDevice {
  id: string;
  name: string;
  ip: string;
  port: number;
  type: 'AndroidTV' | 'GoogleTV';
}

/**
 * mDNS Discovery protocol module for Android TV.
 * ATRPv2 devices broadcast over `_androidtvremote2._tcp`.
 */
export class MDNSDiscovery {
  private isScanning = false;
  private listeners: ((devices: DiscoveredDevice[]) => void)[] = [];
  private discoveredDevices = new Map<string, DiscoveredDevice>();
  
  public startScan() {
    if (this.isScanning) return;
    this.isScanning = true;
    console.log('[MDNS] Starting Android TV network scan...');
    // TODO: Implement Capacitor mDNS plugin or WebSocket relay call
  }

  public stopScan() {
    this.isScanning = false;
    console.log('[MDNS] Stopping Android TV network scan...');
  }

  public onDevicesChanged(cb: (devices: DiscoveredDevice[]) => void) {
    this.listeners.push(cb);
    // Send currently known immediately
    if (this.discoveredDevices.size > 0) {
      cb(Array.from(this.discoveredDevices.values()));
    }
  }

  public notify(devices: DiscoveredDevice[]) {
    let changed = false;
    devices.forEach(d => {
      const existing = this.discoveredDevices.get(d.id);
      if (!existing || existing.ip !== d.ip || existing.port !== d.port) {
        this.discoveredDevices.set(d.id, d);
        changed = true;
      }
    });
    
    if (changed) {
      const allDevices = Array.from(this.discoveredDevices.values());
      this.listeners.forEach(cb => cb(allDevices));
    }
  }
}
