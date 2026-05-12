export enum RemoteCommandType {
  KEY = 'KEY',
  TEXT = 'TEXT',
  TOUCH_MOVE = 'TOUCH_MOVE',
  TOUCH_TAP = 'TOUCH_TAP',
  TOUCH_SCROLL = 'TOUCH_SCROLL',
  VOLUME = 'VOLUME',
  POWER = 'POWER',
  APP_LAUNCH = 'APP_LAUNCH',
  APP_LIST_REQUEST = 'APP_LIST_REQUEST',
  APP_LIST_RESPONSE = 'APP_LIST_RESPONSE',
  DEVICE_SELECT = 'DEVICE_SELECT',
  DEVICE_LIST_REQUEST = 'DEVICE_LIST_REQUEST',
  DEVICE_LIST_RESPONSE = 'DEVICE_LIST_RESPONSE',
  CONNECTION_STATUS = 'CONNECTION_STATUS',
  ADB_CONNECT = 'ADB_CONNECT',
}

export enum RemoteKey {
  HOME = 'HOME',
  BACK = 'BACK',
  ENTER = 'ENTER',
  PLAY_PAUSE = 'PLAY_PAUSE',
  VOLUME_UP = 'VOLUME_UP',
  VOLUME_DOWN = 'VOLUME_DOWN',
  DPAD_UP = 'DPAD_UP',
  DPAD_DOWN = 'DPAD_DOWN',
  DPAD_LEFT = 'DPAD_LEFT',
  DPAD_RIGHT = 'DPAD_RIGHT',
  POWER = 'POWER',
  MUTE = 'MUTE',
  VOICE_ASSIST = 'VOICE_ASSIST',
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR',
}

export enum DeviceType {
  AndroidTV = 'AndroidTV',
  GoogleTV = 'GoogleTV',
  FireTV = 'FireTV',
  Chromecast = 'Chromecast',
}

export interface RemoteDevice {
  id: string;
  name: string;
  type: DeviceType;
  ipAddress: string;
  isConnected: boolean;
}

// -----------------------------------------------------------------------------
// COMMAND PAYLOADS (RemoteCommand)
// -----------------------------------------------------------------------------

export interface KeyCommand {
  type: RemoteCommandType.KEY;
  payload: {
    key: RemoteKey;
  };
}

export interface TextCommand {
  type: RemoteCommandType.TEXT;
  payload: {
    text: string;
  };
}

export interface TouchMoveCommand {
  type: RemoteCommandType.TOUCH_MOVE;
  payload: {
    dx: number;
    dy: number;
  };
}

export interface TouchTapCommand {
  type: RemoteCommandType.TOUCH_TAP;
  payload?: undefined;
}

export interface TouchScrollCommand {
  type: RemoteCommandType.TOUCH_SCROLL;
  payload: {
    dx: number;
    dy: number;
  };
}

export interface VolumeCommand {
  type: RemoteCommandType.VOLUME;
  payload: {
    level: number; // 0-100 percentage or delta
    isMute?: boolean;
  };
}

export interface PowerCommand {
  type: RemoteCommandType.POWER;
  payload: {
    isOn: boolean;
  };
}

export interface AppLaunchCommand {
  type: RemoteCommandType.APP_LAUNCH;
  payload: {
    appId: string;
  };
}

export interface AppListRequestCommand {
  type: RemoteCommandType.APP_LIST_REQUEST;
}

export interface AppListResponseCommand {
  type: RemoteCommandType.APP_LIST_RESPONSE;
  payload: {
    apps: { packageName: string; name: string; isActive?: boolean }[];
  };
}

export interface DeviceSelectCommand {
  type: RemoteCommandType.DEVICE_SELECT;
  payload: {
    deviceId: string;
  };
}

export interface DeviceListRequestCommand {
  type: RemoteCommandType.DEVICE_LIST_REQUEST;
  payload?: undefined;
}

export interface DeviceListResponseCommand {
  type: RemoteCommandType.DEVICE_LIST_RESPONSE;
  payload: {
    devices: RemoteDevice[];
  };
}

export interface ConnectionStatusCommand {
  type: RemoteCommandType.CONNECTION_STATUS;
  payload: {
    status: ConnectionState;
    deviceId?: string;
  };
}

export interface AdbConnectCommand {
  type: RemoteCommandType.ADB_CONNECT;
  payload: {
    ip: string;
    port?: number;
  };
}

/**
 * Discriminated union of all remote commands across the system.
 */
export type RemoteCommand =
  | KeyCommand
  | TextCommand
  | TouchMoveCommand
  | TouchTapCommand
  | TouchScrollCommand
  | VolumeCommand
  | PowerCommand
  | AppLaunchCommand
  | AppListRequestCommand
  | AppListResponseCommand
  | DeviceSelectCommand
  | DeviceListRequestCommand
  | DeviceListResponseCommand
  | ConnectionStatusCommand
  | AdbConnectCommand;


// -----------------------------------------------------------------------------
// WEBSOCKET MESSAGES (SocketMessage)
// -----------------------------------------------------------------------------

export enum SocketMessageType {
  COMMAND = 'COMMAND',
  EVENT = 'EVENT',
  ERROR = 'ERROR',
  ACK = 'ACK',
  DEVICE_LIST = 'DEVICE_LIST',
  APP_LIST = 'APP_LIST',
}

export interface SocketCommandMessage {
  type: SocketMessageType.COMMAND;
  payload: RemoteCommand;
}

export interface SocketEventMessage {
  type: SocketMessageType.EVENT;
  payload: {
    event: string;
    data: unknown;
  };
}

export interface SocketErrorMessage {
  type: SocketMessageType.ERROR;
  payload: {
    code: string;
    message: string;
  };
}

export interface SocketAckMessage {
  type: SocketMessageType.ACK;
  payload: {
    messageId: string;
    status: 'success' | 'failure';
  };
}

export interface SocketDeviceListMessage {
  type: SocketMessageType.DEVICE_LIST;
  payload: {
    devices: RemoteDevice[];
  };
}

export interface SocketAppListMessage {
  type: SocketMessageType.APP_LIST;
  payload: {
    apps: { packageName: string; name: string; isActive?: boolean }[];
  };
}

/**
 * Discriminated union of all messages sent over the WebSocket pipeline.
 */
export type SocketMessage =
  | SocketCommandMessage
  | SocketEventMessage
  | SocketErrorMessage
  | SocketAckMessage
  | SocketDeviceListMessage
  | SocketAppListMessage;

/**
 * Wrapper for all WebSocket messages requiring idempotency or ACKs.
 */
export interface SocketMessageWrapper {
  id: string; // Unique message correlation ID
  timestamp: string; // ISO string 
  message: SocketMessage;
}
