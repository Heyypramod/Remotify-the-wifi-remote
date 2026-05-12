import { adbService } from './adbService';
import { AdbCommands } from './adbCommands';

export interface AppMetadata {
  packageName: string;
  name: string; // The user-friendly label (requires extracting from device, mock for now)
  isActive?: boolean;
}

export class AppManager {
  /**
   * Retrieves a list of installed third-party apps on the device.
   */
  public async getInstalledApps(deviceId: string): Promise<AppMetadata[]> {
    try {
      const output = await adbService.executeOnDevice(
        deviceId, 
        AdbCommands.getInstalledPackages()
      );
      
      let activePackage = '';
      try {
        const activeOutput = await adbService.executeOnDevice(
          deviceId,
          AdbCommands.getActiveApp()
        );
        // Extracts package from string like: mCurrentFocus=Window{... u0 com.netflix.ninja/com.netflix.ninja.MainActivity}
        const match = activeOutput.match(/ ([a-zA-Z0-9.]+)\//);
        if (match && match[1]) {
          activePackage = match[1];
        }
      } catch (e) {
        // Ignored
      }
      
      const packages = output.split('\n')
        .map(line => line.replace('package:', '').trim())
        .filter(pkg => pkg.length > 0);

      // Getting actual app labels requires using `aapt` or querying `PackageManager` via a helper script.
      // For a production bridge, you might deploy a small dummy APK to stream this, or use dumpsys.
      // Here we mock the app names based on common packages.
      return packages.map(pkg => ({
        packageName: pkg,
        name: this.guessAppName(pkg),
        isActive: pkg === activePackage
      }));
    } catch (error) {
      console.error(`[AppManager] Failed to list apps for ${deviceId}`, error);
      return [];
    }
  }

  /**
   * Launches an app using monkey or intent.
   */
  public async launchApp(deviceId: string, packageName: string): Promise<boolean> {
    try {
      await adbService.executeOnDevice(
        deviceId,
        AdbCommands.launchApp(packageName)
      );
      return true;
    } catch (error) {
      console.error(`[AppManager] Failed to launch ${packageName} on ${deviceId}`, error);
      return false;
    }
  }

  private guessAppName(pkg: string): string {
    if (pkg.includes('netflix')) return 'Netflix';
    if (pkg.includes('youtube')) return 'YouTube';
    if (pkg.includes('spotify')) return 'Spotify';
    if (pkg.includes('disney')) return 'Disney+';
    if (pkg.includes('primevideo')) return 'Prime Video';
    
    // Fallback: capitalize last part of package
    const parts = pkg.split('.');
    const last = parts[parts.length - 1];
    return last.charAt(0).toUpperCase() + last.slice(1);
  }
}

export const appManager = new AppManager();
