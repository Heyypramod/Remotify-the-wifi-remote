package com.remotify.app

import android.content.Context
import android.util.Log
import kotlinx.coroutines.*
import java.net.InetSocketAddress
import javax.net.ssl.*
import com.remotify.app.proto.RemoteMessage
import com.remotify.app.proto.RemotePingRequest
import com.remotify.app.proto.RemotePingResponse

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
                    throw Exception("Socket closed by remote")
                }
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

    private fun sendPing() {
        val ping = RemotePingRequest.newBuilder().setVal1(2).build()
        val outMsg = RemoteMessage.newBuilder().setPingRequest(ping).build()
        sendPayload(outMsg)
    }

    fun sendPayload(message: RemoteMessage) {
        if (state != "CONNECTED" || socket == null) return
        scope.launch {
            try {
                withContext(Dispatchers.IO) {
                    val out = socket?.outputStream ?: return@withContext
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
