import { adbService } from './adbService';
import { AdbCommands, KeyMap } from './adbCommands';
import { RemoteKey } from '../../src/types/remote';

// Thresholds for swipe gestures
const SWIPE_THRESHOLD = 30; // Minimum pixels moved to trigger a dpad event
const DEBOUNCE_MS = 200; // prevent overlapping gesture events

export class InputController {
  // We track accumulated touch delta per device to convert analog swiping into discrete DPAD clicks
  private touchAccumulators = new Map<string, { dx: number, dy: number, lastTime: number }>();

  /**
   * Injects a specific key event.
   */
  public async sendKey(deviceId: string, key: RemoteKey): Promise<void> {
    const keyCode = KeyMap[key];
    if (keyCode === undefined) {
      throw new Error(`Unmapped RemoteKey: ${key}`);
    }

    if (key === RemoteKey.HOME) {
      console.log(`[ADB] Executing HOME keyevent`);
    } else if (key === RemoteKey.BACK) {
      console.log(`[ADB] Executing BACK keyevent`);
    } else if (key === RemoteKey.VOLUME_UP) {
      console.log(`[ADB] Executing VOLUME_UP keyevent`);
    } else if (key === RemoteKey.VOLUME_DOWN) {
      console.log(`[ADB] Executing VOLUME_DOWN keyevent`);
    } else if (key === RemoteKey.VOICE_ASSIST) {
      console.log(`[ADB] Executing voice assistant keyevent`);
    }

    try {
      await adbService.executeOnDevice(deviceId, AdbCommands.keyEvent(keyCode));
    } catch (e) {
      if (key === RemoteKey.VOICE_ASSIST) {
        console.log(`[ADB] VOICE_ASSIST keyevent 231 failed, trying fallback 84`);
        await adbService.executeOnDevice(deviceId, AdbCommands.keyEvent(84)); // KEYCODE_SEARCH
      } else {
        throw e;
      }
    }
    
    if (key === RemoteKey.HOME) {
      console.log(`[SUCCESS] HOME command sent`);
    } else if (key === RemoteKey.BACK) {
      console.log(`[SUCCESS] BACK command executed`);
    } else if (key === RemoteKey.VOLUME_UP || key === RemoteKey.VOLUME_DOWN) {
      console.log(`[SUCCESS] Volume command executed`);
    } else if (key === RemoteKey.VOICE_ASSIST) {
      console.log(`[SUCCESS] Voice assistant launched`);
    }
  }

  /**
   * Injects raw text.
   */
  public async sendText(deviceId: string, text: string): Promise<void> {
    if (!text) return;
    console.log(`[ADB] Executing adb input text`);
    await adbService.executeOnDevice(deviceId, AdbCommands.textInput(text));
    console.log(`[SUCCESS] Text sent successfully`);
  }

  /**
   * Handles touch gestures and converts them to focus-based navigation (DPAD).
   */
  public async handleTouchMove(deviceId: string, dx: number, dy: number): Promise<void> {
    const now = Date.now();
    let state = this.touchAccumulators.get(deviceId);
    
    if (!state || (now - state.lastTime > DEBOUNCE_MS * 2)) {
      state = { dx: 0, dy: 0, lastTime: now };
    }

    state.dx += dx;
    state.dy += dy;
    state.lastTime = now;

    // Convert accumulated movement into discrete dpad steps
    if (Math.abs(state.dx) > SWIPE_THRESHOLD) {
      const key = state.dx > 0 ? RemoteKey.DPAD_RIGHT : RemoteKey.DPAD_LEFT;
      state.dx = 0; // Reset X accumulator
      await this.sendKey(deviceId, key);
    } 
    else if (Math.abs(state.dy) > SWIPE_THRESHOLD) {
      const key = state.dy > 0 ? RemoteKey.DPAD_DOWN : RemoteKey.DPAD_UP;
      state.dy = 0; // Reset Y accumulator
      await this.sendKey(deviceId, key);
    }
    
    this.touchAccumulators.set(deviceId, state);
  }

  /**
   * Handles touch taps.
   */
  public async handleTouchTap(deviceId: string): Promise<void> {
    await this.sendKey(deviceId, RemoteKey.ENTER);
  }
}

export const inputController = new InputController();
