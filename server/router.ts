import { WebSocket } from 'ws';
import {
  SocketMessage,
  SocketMessageWrapper,
  SocketMessageType,
  RemoteCommand,
  RemoteCommandType,
  KeyCommand,
  TextCommand,
  TouchMoveCommand,
  AppLaunchCommand
} from '../src/types/remote';
import { sessionManager } from './sessionManager';
import { inputController } from './adb/inputController';
import { appManager } from './adb/appManager';
import { deviceDiscovery, DeviceStatus } from './adb/deviceDiscovery';
import crypto from 'crypto';

export class CommandRouter {
  public handleMessage(ws: WebSocket, rawMessage: string) {
    // Handle Heartbeat PING
    if (rawMessage === 'PING') {
      ws.send('PONG');
      const session = sessionManager.getSessionByWs(ws);
      if (session) {
        session.isAlive = true;
        session.lastPing = Date.now();
      }
      return;
    }

    let wrapper: SocketMessageWrapper;
    try {
      wrapper = JSON.parse(rawMessage);
    } catch (err) {
      console.error('[Router] Malformed JSON received:', err);
      // Can't ACK if we can't parse the wrapper ID
      return;
    }

    if (!wrapper || !wrapper.id || !wrapper.message) {
      console.error('[Router] Invalid message wrapper structure');
      return;
    }

    const { id, message } = wrapper;

    try {
      this.routeMessage(ws, message)
        .then(() => {
          this.sendAck(ws, id, 'success');
        })
        .catch((err) => {
          console.error(`[Router] Error routing message ${id}:`, err);
          this.sendAck(ws, id, 'failure');
          this.sendError(ws, 'ROUTING_ERROR', err instanceof Error ? err.message : 'Unknown routing error');
        });
    } catch (err) {
      console.error(`[Router] Synchronous Error routing message ${id}:`, err);
      this.sendAck(ws, id, 'failure');
      this.sendError(ws, 'ROUTING_ERROR', err instanceof Error ? err.message : 'Unknown routing error');
    }
  }

  private async routeMessage(ws: WebSocket, message: SocketMessage): Promise<void> {
    if (message.type !== SocketMessageType.COMMAND) {
      console.log(`[Router] Received non-command message type: ${message.type}`);
      return;
    }

    const command = message.payload as RemoteCommand;
    const session = sessionManager.getSessionByWs(ws);

    if (!session) {
      throw new Error('No active session found for WebSocket');
    }

    switch (command.type) {
      case RemoteCommandType.DEVICE_LIST_REQUEST:
        await this.handleDeviceListRequest(ws);
        break;
      case RemoteCommandType.APP_LIST_REQUEST:
        await this.handleAppListRequest(session, ws);
        break;
      case RemoteCommandType.DEVICE_SELECT:
        this.handleDeviceSelect(session, command.payload.deviceId);
        break;
      case RemoteCommandType.ADB_CONNECT:
        const { ip, port } = (command as any).payload;
        const connected = await deviceDiscovery.connect(ip, port || 5555);
        if (connected) {
          // If successful, send device list back so client sees it
          await this.handleDeviceListRequest(ws);
        } else {
          throw new Error(`Failed to connect to ${ip}`);
        }
        break;
      case RemoteCommandType.KEY:
      case RemoteCommandType.TEXT:
      case RemoteCommandType.TOUCH_MOVE:
      case RemoteCommandType.TOUCH_TAP:
      case RemoteCommandType.TOUCH_SCROLL:
      case RemoteCommandType.VOLUME:
      case RemoteCommandType.POWER:
      case RemoteCommandType.APP_LAUNCH:
        await this.handleRemoteControlCommand(session, command);
        break;
      default:
        console.warn(`[Router] Unhandled command type: ${(command as any).type}`);
    }
  }

  private async handleDeviceListRequest(ws: WebSocket) {
    const adbDevices = await deviceDiscovery.getDevices();
    const adbDeviceIds = new Set(adbDevices.map(d => d.id));

    // Mark missing devices as offline
    sessionManager.getAllDevices().forEach(dev => {
      if (!adbDeviceIds.has(dev.id)) {
        dev.isConnected = false;
        sessionManager.updateDevice(dev);
      }
    });

    adbDevices.forEach(adbDev => {
      // Create a friendly name based on ID or use discovered name
      const name = adbDev.name || (adbDev.id.includes(':') ? `TV (${adbDev.id.split(':')[0]})` : `Device (${adbDev.id})`);
      // For localhost/emulator use a generic type since we don't know without running getprop
      const device: any = {
        id: adbDev.id,
        name: name,
        type: adbDev.type || 'AndroidTV',
        ipAddress: adbDev.id.split(':')[0],
        isConnected: adbDev.status === DeviceStatus.ONLINE,
      };
      sessionManager.updateDevice(device);
    });

    const devices = sessionManager.getAllDevices();
    const responseMessage: SocketMessageWrapper = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: {
        type: SocketMessageType.DEVICE_LIST,
        payload: { devices }
      }
    };
    ws.send(JSON.stringify(responseMessage));
  }

  private async handleAppListRequest(session: any, ws: WebSocket) {
    if (!session.selectedDeviceId) {
      throw new Error('No device selected');
    }
    const apps = await appManager.getInstalledApps(session.selectedDeviceId);
    const responseMessage: SocketMessageWrapper = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: {
        type: SocketMessageType.APP_LIST,
        payload: { apps }
      }
    };
    ws.send(JSON.stringify(responseMessage));
  }

  private handleDeviceSelect(session: any, deviceId: string) {
    if (!deviceId) {
      session.selectedDeviceId = null;
      console.log(`[Router] Session ${session.id} disconnected device`);
      return;
    }
    const device = sessionManager.getDevice(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found in registry`);
    }
    session.selectedDeviceId = deviceId;
    console.log(`[Router] Session ${session.id} selected device ${deviceId}`);
  }

  private async handleRemoteControlCommand(session: any, command: RemoteCommand): Promise<void> {
    const deviceId = session.selectedDeviceId;
    if (!deviceId) {
      throw new Error('No device selected');
    }

    const device = sessionManager.getDevice(deviceId);
    if (!device) {
      throw new Error(`Target device ${deviceId} no longer exists`);
    }

    // Translate typed commands into ADB operations
    switch (command.type) {
      case RemoteCommandType.KEY: {
        const keyCmd = command as KeyCommand;
        await inputController.sendKey(deviceId, keyCmd.payload.key);
        break;
      }
      case RemoteCommandType.TEXT: {
        const textCmd = command as TextCommand;
        await inputController.sendText(deviceId, textCmd.payload.text);
        break;
      }
      case RemoteCommandType.TOUCH_MOVE:
      case RemoteCommandType.TOUCH_SCROLL: {
        const moveCmd = command as TouchMoveCommand;
        await inputController.handleTouchMove(deviceId, moveCmd.payload.dx, moveCmd.payload.dy);
        break;
      }
      case RemoteCommandType.TOUCH_TAP: {
        await inputController.handleTouchTap(deviceId);
        break;
      }
      case RemoteCommandType.APP_LAUNCH: {
        const appCmd = command as AppLaunchCommand;
        await appManager.launchApp(deviceId, appCmd.payload.appId);
        break;
      }
      // Note: VOLUME and POWER could be mapped to keys or intent broadcasts.
      // Here we leave them to be fully filled out based on device OS capabilities.
      default:
        console.log(`[ADB Bridge] Skipping unmapped command ${command.type} for ${device.name}`);
    }
  }

  private sendAck(ws: WebSocket, messageId: string, status: 'success' | 'failure') {
    const ackWrapper: SocketMessageWrapper = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: {
        type: SocketMessageType.ACK,
        payload: { messageId, status }
      }
    };
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(ackWrapper));
    }
  }

  private sendError(ws: WebSocket, code: string, message: string) {
    const errorWrapper: SocketMessageWrapper = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: {
        type: SocketMessageType.ERROR,
        payload: { code, message }
      }
    };
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(errorWrapper));
    }
  }
}

export const commandRouter = new CommandRouter();
