package com.remotify.app

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyPairGenerator
import java.security.KeyStore
import javax.net.ssl.KeyManagerFactory
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager
import java.security.cert.X509Certificate

object TlsManager {
    private const val TAG = "TlsManager"
    private const val ALIAS = "RemotifyClientKey"
    private const val ANDROID_KEYSTORE = "AndroidKeyStore"

    fun getSslContext(): SSLContext {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
        keyStore.load(null)

        if (!keyStore.containsAlias(ALIAS)) {
            Log.i(TAG, "Generating new client keypair and certificate")
            generateKeyPair()
        }

        val keyManagerFactory = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm())
        keyManagerFactory.init(keyStore, null)

        val trustManager = object : X509TrustManager {
            override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
            override fun checkClientTrusted(certs: Array<X509Certificate>, authType: String) {
                ProtocolLogger.logTlsHandshake("Client Trusted Verify", "authType=$authType")
            }
            override fun checkServerTrusted(certs: Array<X509Certificate>, authType: String) {
                // ATRPv2 uses self-signed server certs. 
                // In production, we should compare the cert hash with the one verified during pairing.
                if (certs.isNotEmpty()) {
                    ProtocolLogger.logCertificate(certs[0], "Server")
                }
            }
        }

        val sslContext = SSLContext.getInstance("TLSv1.2")
        sslContext.init(keyManagerFactory.keyManagers, arrayOf(trustManager), java.security.SecureRandom())
        return sslContext
    }

    private fun generateKeyPair() {
        // Android KeyStore automatically generates a self-signed certificate when KeyPair is generated with specific specs
        val kpg = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, ANDROID_KEYSTORE)
        val parameterSpec = KeyGenParameterSpec.Builder(
            ALIAS,
            KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
        ).run {
            setDigests(KeyProperties.DIGEST_SHA256, KeyProperties.DIGEST_SHA512)
            setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1)
            setKeySize(2048)
            setCertificateSubject(javax.security.auth.x500.X500Principal("CN=Remotify"))
            build()
        }
        kpg.initialize(parameterSpec)
        kpg.generateKeyPair()
    }

    fun getClientCertificate(): X509Certificate? {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
        keyStore.load(null)
        return keyStore.getCertificate(ALIAS) as? X509Certificate
    }
}
