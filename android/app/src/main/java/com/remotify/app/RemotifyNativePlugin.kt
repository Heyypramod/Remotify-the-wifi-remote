package com.remotify.app

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.net.wifi.WifiManager
import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.net.InetAddress
import java.util.concurrent.ConcurrentHashMap

@CapacitorPlugin(name = "RemotifyNative")
class RemotifyNativePlugin : Plugin() {

    private val TAG = "RemotifyNative"
    private val SERVICE_TYPE = "_androidtvremote2._tcp."
    
    private var nsdManager: NsdManager? = null
    private var discoveryListener: NsdManager.DiscoveryListener? = null
    private var multicastLock: WifiManager.MulticastLock? = null
    
    private val discoveredDevices = ConcurrentHashMap<String, NsdServiceInfo>()
    private var isDiscovering = false
    
    private var connectionManager: ConnectionManager? = null

    override fun load() {
        super.load()
        nsdManager = context.getSystemService(Context.NSD_SERVICE) as NsdManager
        
        connectionManager = ConnectionManager(
            context,
            onStateChange = { state ->
                val ret = JSObject()
                ret.put("state", state)
                notifyListeners("connectionStateChanged", ret)
            },
            onPairingRequested = { ip ->
                val ret = JSObject()
                ret.put("ip", ip)
                notifyListeners("pairingRequested", ret)
            }
        )
    }

    @PluginMethod
    fun startDiscovery(call: PluginCall) {
        if (isDiscovering) {
            call.resolve(JSObject().apply { put("status", "already_discovering") })
            return
        }

        acquireMulticastLock()
        discoveredDevices.clear()

        discoveryListener = object : NsdManager.DiscoveryListener {
            override fun onDiscoveryStarted(regType: String) {
                Log.d(TAG, "Service discovery started")
                isDiscovering = true
            }

            override fun onServiceFound(service: NsdServiceInfo) {
                Log.d(TAG, "Service discovery found: $service")
                // On some devices the type lacks the trailing dot, so we check both or contains
                if (service.serviceType.contains("_androidtvremote2._tcp")) {
                    nsdManager?.resolveService(service, CustomResolveListener())
                }
            }

            override fun onServiceLost(service: NsdServiceInfo) {
                Log.e(TAG, "Service lost: $service")
                val ip = discoveredDevices.entries.find { it.value.serviceName == service.serviceName }?.key
                if (ip != null) {
                    discoveredDevices.remove(ip)
                    
                    val ret = JSObject().apply {
                        put("ip", ip)
                        put("id", service.serviceName)
                    }
                    notifyListeners("deviceRemoved", ret)
                }
            }

            override fun onDiscoveryStopped(serviceType: String) {
                Log.i(TAG, "Discovery stopped: $serviceType")
                isDiscovering = false
            }

            override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {
                Log.e(TAG, "Discovery failed: Error code:$errorCode")
                stopDiscoveryInternal()
            }

            override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {
                Log.e(TAG, "Stop discovery failed: Error code:$errorCode")
                stopDiscoveryInternal()
            }
        }

        try {
            nsdManager?.discoverServices(SERVICE_TYPE, NsdManager.PROTOCOL_DNS_SD, discoveryListener)
            call.resolve(JSObject().apply { put("status", "discovery_started") })
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start discovery", e)
            call.reject("Failed to start discovery", e)
        }
    }

    @PluginMethod
    fun stopDiscovery(call: PluginCall) {
        stopDiscoveryInternal()
        call.resolve(JSObject().apply { put("status", "discovery_stopped") })
    }

    private fun stopDiscoveryInternal() {
        if (discoveryListener != null) {
            try {
                nsdManager?.stopServiceDiscovery(discoveryListener)
            } catch (e: Exception) {
                Log.e(TAG, "Error stopping discovery", e)
            }
            discoveryListener = null
        }
        isDiscovering = false
        releaseMulticastLock()
    }

    private inner class CustomResolveListener : NsdManager.ResolveListener {
        override fun onResolveFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {
            Log.e(TAG, "Resolve failed: $errorCode")
        }

        override fun onServiceResolved(serviceInfo: NsdServiceInfo) {
            Log.d(TAG, "Resolve Succeeded. $serviceInfo")
            val host: InetAddress = serviceInfo.host ?: return
            val ip = host.hostAddress ?: return
            val port = serviceInfo.port
            val name = serviceInfo.serviceName

            // Deduplicate across IP and service name
            if (!discoveredDevices.containsKey(ip)) {
                discoveredDevices[ip] = serviceInfo
                
                val deviceObj = JSObject().apply {
                    put("id", serviceInfo.serviceName) // Use serviceName as unique ID for mDNS
                    put("name", name)
                    put("ip", ip)
                    put("port", port)
                    put("serviceType", serviceInfo.serviceType)
                }
                notifyListeners("deviceDiscovered", deviceObj)
            }
        }
    }

    private fun acquireMulticastLock() {
        if (multicastLock == null) {
            val wifi = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            multicastLock = wifi.createMulticastLock("RemotifyMulticastLock")
            multicastLock?.setReferenceCounted(true)
            multicastLock?.acquire()
            Log.d(TAG, "MulticastLock acquired")
        }
    }

    private fun releaseMulticastLock() {
        multicastLock?.let {
            if (it.isHeld) {
                it.release()
                Log.d(TAG, "MulticastLock released")
            }
        }
        multicastLock = null
    }

    override fun handleOnPause() {
        super.handleOnPause()
        if (isDiscovering) {
            stopDiscoveryInternal()
        }
    }

    override fun handleOnDestroy() {
        stopDiscoveryInternal()
        super.handleOnDestroy()
    }

    @PluginMethod
    fun connectToDevice(call: PluginCall) {
        val ip = call.getString("ip")
        if (ip == null) {
            call.reject("Must provide an IP address")
            return
        }
        
        connectionManager?.connect(ip)
        
        call.resolve(JSObject().apply {
            put("status", "connecting")
            put("ip", ip)
        })
    }

    @PluginMethod
    fun pairDevice(call: PluginCall) {
        val pin = call.getString("pin")
        if (pin == null) {
            call.reject("Must provide a pairing pin")
            return
        }
        
        connectionManager?.providePin(pin)
        
        call.resolve(JSObject().apply {
            put("status", "pairing_attempted")
        })
    }

    @PluginMethod
    fun disconnect(call: PluginCall) {
        connectionManager?.disconnect()
        
        call.resolve(JSObject().apply {
            put("status", "disconnected")
        })
    }

    @PluginMethod
    fun getConnectionState(call: PluginCall) {
        val state = connectionManager?.getState() ?: "DISCONNECTED"
        call.resolve(JSObject().apply {
            put("state", state)
        })
    }

    @PluginMethod
    fun sendPointer(call: PluginCall) {
        val deltaX = call.getFloat("deltaX") ?: 0f
        val deltaY = call.getFloat("deltaY") ?: 0f
        val direction = call.getString("direction") ?: "UNKNOWN"

        PointerManager.enqueuePointerEvent(deltaX, deltaY, direction)
        call.resolve()
    }

    @PluginMethod
    fun sendTouchState(call: PluginCall) {
        val down = call.getBoolean("down") ?: false
        val direction = if (down) "DOWN" else "UP"
        PointerManager.enqueuePointerEvent(0f, 0f, direction)
        call.resolve()
    }

    @PluginMethod
    fun sendKey(call: PluginCall) {
        val key = call.getString("key") ?: return
        val direction = call.getString("direction") ?: "SHORT"
        connectionManager?.sendKey(key, direction)
        call.resolve()
    }
}
