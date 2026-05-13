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
    private const val ALIAS = "RemotifyClientKey"
    private const val ANDROID_KEYSTORE = "AndroidKeyStore"

    fun getSslContext(): SSLContext {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
        keyStore.load(null)

        if (!keyStore.containsAlias(ALIAS)) {
            generateKeyPair()
        }

        val keyManagerFactory = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm())
        keyManagerFactory.init(keyStore, null)

        // For Android TV Remote v2, we must trust the server implicitly (or verify its hash, but for now we trust all and save the hash later).
        val trustAllCerts = arrayOf<X509TrustManager>(object : X509TrustManager {
            override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
            override fun checkClientTrusted(certs: Array<X509Certificate>, authType: String) {}
            override fun checkServerTrusted(certs: Array<X509Certificate>, authType: String) {}
        })

        val sslContext = SSLContext.getInstance("TLSv1.2")
        sslContext.init(keyManagerFactory.keyManagers, trustAllCerts, java.security.SecureRandom())
        return sslContext
    }

    private fun generateKeyPair() {
        val kpg = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, ANDROID_KEYSTORE)
        val parameterSpec = KeyGenParameterSpec.Builder(
            ALIAS,
            KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
        ).run {
            setDigests(KeyProperties.DIGEST_SHA256, KeyProperties.DIGEST_SHA512)
            setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1)
            setKeySize(2048)
            // It automatically generates a self-signed certificate, which can be extracted via keyStore.getCertificate(ALIAS)
            build()
        }
        kpg.initialize(parameterSpec)
        kpg.generateKeyPair()
    }

    // Helper to get our client certificate if we need its hash for pairing
    fun getClientCertificate(): X509Certificate? {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
        keyStore.load(null)
        val cert = keyStore.getCertificate(ALIAS)
        return cert as? X509Certificate
    }
}
