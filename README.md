# Remotify

A modern Wi-Fi remote for Android TV and Google TV.

Remotify is a gesture-first Android TV remote focused on:
- fast native connectivity
- smooth touchpad navigation
- low-latency interaction
- seamless pairing
- modern Material 3 design

Unlike traditional ADB-based remotes, Remotify is being built around the native Android TV Remote Protocol with direct device discovery and secure local communication.

---

## Features

- Android TV & Google TV discovery over Wi-Fi
- Native mDNS / DNS-SD scanning
- Secure pairing flow
- Gesture-first touchpad navigation
- Number pad support
- Automatic reconnect handling
- Modern responsive UI
- Native Android networking layer (Kotlin + Capacitor)

---

## Architecture

```text
React UI
↓
Capacitor Bridge
↓
Native Kotlin Engine
↓
Android TV Remote Protocol
↓
Android TV / Google TV
```

The frontend handles:
- UI
- gestures
- animations
- interaction states

The native Kotlin layer handles:
- discovery
- TLS sockets
- pairing
- protobuf transport
- reconnect logic
- heartbeat management

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- TailwindCSS
- Capacitor

### Native Android
- Kotlin
- Android NsdManager
- TLS sockets
- Android TV Remote Protocol

---

## Current Status

Remotify is currently transitioning from an experimental prototype into a fully native Android TV remote platform.

Implemented:
- native Android TV discovery
- Capacitor Kotlin plugin bridge
- connection lifecycle architecture
- pairing flow scaffolding
- native transport abstraction
- gesture-first remote foundation

In Progress:
- production-grade ATRPv2 cryptography
- protobuf validation
- native touchpad packet transport
- reconnect hardening
- real-device protocol verification

---

## Supported Devices

Target support:
- Android TV
- Google TV
- Chromecast with Google TV
- NVIDIA Shield

Not supported:
- Samsung Tizen TVs
- LG webOS TVs
- Fire TV proprietary protocols

---

## Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Run Android build:

```bash
npx cap sync android
```

Open Android Studio:

```bash
npx cap open android
```

---

## Vision

Remotify aims to deliver a premium Android TV remote experience comparable to:
- Google TV Remote
- Apple TV Remote
- NVIDIA Shield Remote

Focused on:
- low latency
- reliability
- native networking
- gesture navigation
- clean interaction design

---

## License

MIT
