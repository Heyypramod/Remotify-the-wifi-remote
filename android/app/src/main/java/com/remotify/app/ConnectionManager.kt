package com.remotify.app

import android.content.Context
import android.util.Log
import kotlinx.coroutines.*
import java.net.InetSocketAddress
import javax.net.ssl.*
import com.remotify.app.proto.RemoteMessage
import com.remotify.app.proto.RemotePingRequest
import com.remotify.app.proto.RemotePingResponse
import com.remotify.app.proto.RemoteKeyInject
import com.remotify.app.proto.RemoteKeyCode
import com.remotify.app.proto.RemoteDirection

class ConnectionManager(
    private val context: Context,
    private val onStateChange: (String) -> Unit,
    private val onPairingRequested: (String) -> Unit
) {
    private val TAG = "ConnectionManager"
    private var currentIp: String? = null
    private var socket: SSLSocket? = null
    private var job: Job? = null
    private var heartbeatJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private var state = "DISCONNECTED"

    init {
        PointerManager.initialize(scope) { message ->
            sendPayload(message)
        }
    }
    
    fun updateState(newState: String) {
        if (state != newState) {
            ProtocolLogger.logStateChange("Connection", state, newState)
            state = newState
            onStateChange(newState)
        }
    }

    fun connect(ip: String) {
        if (currentIp == ip && state == "CONNECTED") return
        currentIp = ip
        job?.cancel()
        
        job = scope.launch {
            updateState("CONNECTING")
            try {
                // 1. Check if we have credentials
                val hasCredentials = hasTrustedCredentials(ip)
                if (!hasCredentials) {
                    updateState("PAIRING")
                    // Start pairing flow
                    PairingManager.initiatePairing(ip, onPairingRequested)
                    updateState("WAITING_FOR_PAIRING_PIN")
                    return@launch
                }

                // 2. Establish TLS Connection
                establishTlsConnection(ip, 6467)
                
            } catch (e: Exception) {
                Log.e(TAG, "Connection failed", e)
                updateState("FAILED")
                scheduleReconnect()
            }
        }
    }

    private suspend fun establishTlsConnection(ip: String, port: Int) {
        Log.i(TAG, "Establishing TLS connection to $ip:$port")
        withContext(Dispatchers.IO) {
            val sslContext = TlsManager.getSslContext()
            socket = sslContext.socketFactory.createSocket() as SSLSocket
            socket?.connect(InetSocketAddress(ip, port), 10000)
            socket?.startHandshake()
            
            updateState("CONNECTED")
            startHeartbeat()
            readLoop()
        }
    }

    private suspend fun readLoop() {
        try {
            val input = socket?.inputStream ?: return
            while (isActive) {
                // Parse delimited message from stream (handles varint length and fragmentation)
                val message = RemoteMessage.parseDelimitedFrom(input)
                if (message == null) {
                    ProtocolLogger.logError("Transport", "Socket stream returned null (Server disconnected)")
                    throw Exception("Socket closed by remote")
                }
                ProtocolLogger.logRx(message.messageCase.name, message)
                handleProtobufMessage(message)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Read loop error", e)
            handleDisconnect()
        }
    }

    private fun handleProtobufMessage(message: RemoteMessage) {
        if (message.hasPingRequest()) {
            val pingVal = message.pingRequest.val1
            val pong = RemotePingResponse.newBuilder().setVal1(pingVal).build()
            val outMsg = RemoteMessage.newBuilder().setPingResponse(pong).build()
            sendPayload(outMsg)
        }
    }

    fun providePin(pin: String) {
        val ip = currentIp ?: return
        scope.launch {
            try {
                updateState("PAIRING")
                val success = PairingManager.providePin(pin)
                if (success) {
                    saveTrustedCredentials(ip)
                    establishTlsConnection(ip, 6467)
                } else {
                    updateState("FAILED")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Pairing failed", e)
                updateState("FAILED")
            }
        }
    }

    private fun startHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = scope.launch {
            while (isActive) {
                delay(5000)
                sendPing()
            }
        }
    }

    fun sendPing() {
        val ping = RemotePingRequest.newBuilder().setVal1(2).build()
        val outMsg = RemoteMessage.newBuilder().setPingRequest(ping).build()
        sendPayload(outMsg)
    }

    fun sendKey(keyCode: String, direction: String) {
        val remoteKey = when (keyCode) {
            "HOME" -> RemoteKeyCode.KEYCODE_HOME
            "BACK" -> RemoteKeyCode.KEYCODE_BACK
            "DPAD_UP" -> RemoteKeyCode.KEYCODE_DPAD_UP
            "DPAD_DOWN" -> RemoteKeyCode.KEYCODE_DPAD_DOWN
            "DPAD_LEFT" -> RemoteKeyCode.KEYCODE_DPAD_LEFT
            "DPAD_RIGHT" -> RemoteKeyCode.KEYCODE_DPAD_RIGHT
            "ENTER" -> RemoteKeyCode.KEYCODE_DPAD_CENTER
            "VOLUME_UP" -> RemoteKeyCode.KEYCODE_VOLUME_UP
            "VOLUME_DOWN" -> RemoteKeyCode.KEYCODE_VOLUME_DOWN
            "POWER" -> RemoteKeyCode.KEYCODE_POWER
            else -> RemoteKeyCode.KEYCODE_UNKNOWN
        }

        val remoteDir = when (direction) {
            "DOWN" -> RemoteDirection.START_LONG
            "UP" -> RemoteDirection.END_LONG
            "SHORT" -> RemoteDirection.SHORT
            else -> RemoteDirection.SHORT
        }

        val keyInject = RemoteKeyInject.newBuilder()
            .setKeyCode(remoteKey)
            .setDirection(remoteDir)
            .build()

        val message = RemoteMessage.newBuilder()
            .setRemoteKeyInject(keyInject)
            .build()

        sendPayload(message)
    }

    fun sendPayload(message: RemoteMessage) {
        if (state != "CONNECTED" || socket == null) return
        scope.launch {
            try {
                withContext(Dispatchers.IO) {
                    val out = socket?.outputStream ?: return@withContext
                    ProtocolLogger.logTx(message.messageCase.name, message)
                    message.writeDelimitedTo(out)
                    out.flush()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to send payload", e)
                handleDisconnect()
            }
        }
    }

    private fun handleDisconnect() {
        try {
            socket?.close()
        } catch(e: Exception) {}
        socket = null
        heartbeatJob?.cancel()
        if (state != "DISCONNECTED") {
            updateState("RECONNECTING")
            scheduleReconnect()
        }
    }

    fun disconnect() {
        job?.cancel()
        heartbeatJob?.cancel()
        currentIp = null
        try {
            socket?.close()
        } catch(e: Exception) {}
        socket = null
        updateState("DISCONNECTED")
    }

    private fun scheduleReconnect() {
        val ip = currentIp ?: return
        job = scope.launch {
            delay(5000) // 5s backoff
            if (currentIp != null) {
                connect(ip)
            }
        }
    }

    fun getState(): String {
        return state
    }

    private fun hasTrustedCredentials(ip: String): Boolean {
        val prefs = context.getSharedPreferences("ATRP_PREFS", Context.MODE_PRIVATE)
        return prefs.getBoolean("trusted_$ip", false)
    }

    private fun saveTrustedCredentials(ip: String) {
        val prefs = context.getSharedPreferences("ATRP_PREFS", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("trusted_$ip", true).apply()
    }
}
