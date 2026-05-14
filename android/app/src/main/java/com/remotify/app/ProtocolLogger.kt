package com.remotify.app

import android.util.Log
import com.google.protobuf.MessageLite
import java.security.MessageDigest
import java.security.cert.X509Certificate

object ProtocolLogger {
    private const val TAG = "ATRP_PROTOCOL"

    fun logTx(messageType: String, message: MessageLite) {
        val size = message.serializedSize
        Log.d(TAG, ">>> [TX] Type: $messageType | Size: $size bytes")
        Log.v(TAG, "Payload: $message")
    }

    fun logRx(messageType: String, message: MessageLite) {
        val size = message.serializedSize
        Log.d(TAG, "<<< [RX] Type: $messageType | Size: $size bytes")
        Log.v(TAG, "Payload: $message")
    }

    fun logTlsHandshake(status: String, details: String = "") {
        Log.i(TAG, "[TLS] Handshake $status: $details")
    }

    fun logCertificate(cert: X509Certificate, source: String) {
        try {
            val digest = MessageDigest.getInstance("SHA-256")
            val fingerprint = digest.digest(cert.encoded).joinToString(":") { "%02X".format(it) }
            Log.i(TAG, "[TLS] $source Certificate")
            Log.d(TAG, "  Subject: ${cert.subjectDN}")
            Log.d(TAG, "  Issuer: ${cert.issuerDN}")
            Log.d(TAG, "  Fingerprint (SHA-256): $fingerprint")
        } catch (e: Exception) {
            Log.e(TAG, "[TLS] Error logging certificate fingerprint", e)
        }
    }

    fun logStateChange(category: String, oldState: String, newState: String) {
        Log.i(TAG, "[STATE] $category: $oldState -> $newState")
    }

    fun logError(category: String, message: String, throwable: Throwable? = null) {
        Log.e(TAG, "[ERROR] $category: $message", throwable)
    }

    fun toHex(data: ByteArray): String {
        return data.joinToString(" ") { "%02X".format(it) }
    }
}
