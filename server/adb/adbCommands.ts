import { RemoteKey } from '../../src/types/remote';

/**
 * Maps RemoteKey enums to Android KeyEvents.
 * Reference: https://developer.android.com/reference/android/view/KeyEvent
 */
export const KeyMap: Record<RemoteKey, number> = {
  [RemoteKey.HOME]: 3,       // KEYCODE_HOME
  [RemoteKey.BACK]: 4,       // KEYCODE_BACK
  [RemoteKey.ENTER]: 66,     // KEYCODE_ENTER
  [RemoteKey.PLAY_PAUSE]: 85,// KEYCODE_MEDIA_PLAY_PAUSE
  [RemoteKey.VOLUME_UP]: 24, // KEYCODE_VOLUME_UP
  [RemoteKey.VOLUME_DOWN]: 25,// KEYCODE_VOLUME_DOWN
  [RemoteKey.DPAD_UP]: 19,   // KEYCODE_DPAD_UP
  [RemoteKey.DPAD_DOWN]: 20, // KEYCODE_DPAD_DOWN
  [RemoteKey.DPAD_LEFT]: 21, // KEYCODE_DPAD_LEFT
  [RemoteKey.DPAD_RIGHT]: 22,// KEYCODE_DPAD_RIGHT
  [RemoteKey.POWER]: 26,     // KEYCODE_POWER
  [RemoteKey.MUTE]: 164,     // KEYCODE_VOLUME_MUTE
  [RemoteKey.VOICE_ASSIST]: 231, // KEYCODE_VOICE_ASSIST
};

export class AdbCommands {
  static keyEvent(keyCode: number): string {
    return `shell input keyevent ${keyCode}`;
  }

  static textInput(text: string): string {
    // Note: spaces and special characters require escaping in ADB shell
    // A more robust implementation would use base64 encoding and decode on device, 
    // or properly escape special characters.
    const escapedText = text.replace(/ /g, '%s').replace(/[&\\|;$><`"']/g, '\\$&');
    return `shell input text "${escapedText}"`;
  }

  static launchApp(packageName: string): string {
    return `shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`;
  }

  static getInstalledPackages(): string {
    return 'shell pm list packages -3'; // -3 for 3rd party apps
  }

  static getActiveApp(): string {
    return `shell dumpsys window windows | grep -E 'mCurrentFocus|mFocusedApp' || true`;
  }
}
