# AirDrop for Windows

> High-performance, modern Windows desktop application for transferring files to and from Apple devices (iPhone, iPad, Mac) using Apple AirDrop protocol interoperability and high-speed local Wi-Fi.

![AirDrop for Windows UI](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/radio.svg)

---

## Features

- **Apple AirDrop Protocol Compatibility**:
  - Implements reverse-engineered Apple AirDrop endpoints: `/Discover`, `/Ask`, `/Upload`, `/Cancel`.
  - Supports Apple Binary Plist metadata parsing and generation (`application/x-apple-binary-plist`).
  - Direct streaming disk writes for high-speed multi-gigabyte transfers (4K video, camera roll batches).
- **Dual-Engine Architecture**:
  1. **Native AirDrop Engine**: Directly interfaces with Apple's AirDrop protocol stack over AWDL/OWL.
  2. **Universal Local Bridge Engine**: Provides a zero-install local Wi-Fi web portal (`http://<pc-ip>:8770`) allowing any iPhone or Android on the network to immediately upload files without needing third-party software.
- **Modern Windows 11 Fluent UI/UX**:
  - **Dynamic Radar / Sonar View**: Concentric animated sonar pulses detecting nearby Apple devices (iPhone, MacBook, iPad) positioned dynamically with real-time signal strength.
  - **Direct Drag & Drop**: Drop files anywhere on the app or directly onto a target device avatar to initiate instant transfer.
  - **Incoming Invitation Modal**: Authentic Apple-style AirDrop incoming prompt with accept/decline actions, file counts, and thumbnail previews.
  - **Live Transfer Activity Drawer**: Real-time throughput (MB/s), progress percentage ring, time remaining, and "Open in Downloads" shortcuts.
  - **Synthesized AirDrop Chimes**: Native Web Audio API sound effects recreating Apple's classic AirDrop chimes.
  - **Privacy & Security**: Apple-standard 10-minute temporary visibility window, "Contacts Only" mode, and local encrypted TLS transfers.

---

## Architecture Overview

```
+----------------------------------------------------------------------------------------------------+
|                                      Apple Ecosystem Device                                        |
|                          [iOS / iPadOS / macOS Native AirDrop Share Sheet]                         |
+----------------------------------------------------------------------------------------------------+
                                      |                                  ^
                    BLE Discovery &   |                                  |  AirDrop HTTP / CPIO
                    Proximity Beacon  v                                  v  Over AWDL (or LAN)
+----------------------------------------------------------------------------------------------------+
|                                    AirDrop for Windows App                                         |
|                                                                                                    |
|   +------------------------------------+          +--------------------------------------------+   |
|   |         Modern Fluent UI           |          |           Background Core Daemon           |   |
|   |   - Interactive Radar / Sonar      |          |   - BLE Beacon Broadcaster & Scanner       |   |
|   |   - Drag & Drop Target             |<-------->|   - AirDrop Protocol State Machine (HTTP)  |   |
|   |   - Tray & Windows Notifications   |          |   - Binary Plist & CPIO Archive Processor  |   |
|   +------------------------------------+          +--------------------------------------------+   |
+----------------------------------------------------------------------------------------------------+
```

---

## Project Structure

```
airdrop_windows/
├── server/                     # Rust AirDrop Protocol Daemon
│   ├── Cargo.toml              # Tokio, Axum, Tower, Plist dependencies
│   └── src/
│       └── main.rs             # AirDrop HTTP /Discover, /Ask, /Upload handlers
├── src/                        # React + TypeScript Frontend
│   ├── components/
│   │   ├── TitleBar.tsx        # Fluent title bar with status & visibility controls
│   │   ├── RadarView.tsx       # Animated concentric radar canvas with device cards
│   │   ├── DropZone.tsx        # Drag-and-drop dock and file staging manager
│   │   ├── IncomingTransferModal.tsx # Apple AirDrop invitation prompt
│   │   ├── ActiveTransfersDrawer.tsx # Real-time transfer monitor
│   │   ├── MobileConnectModal.tsx    # QR code and local web portal guide
│   │   └── SettingsModal.tsx   # Device name, downloads folder, and AWDL options
│   ├── services/
│   │   └── airdropService.ts   # Device discovery & transfer lifecycle coordinator
│   ├── types/
│   │   └── airdrop.ts          # Core data models and protocol types
│   ├── utils/
│   │   └── sound.ts            # Web Audio API synthesized AirDrop sound effects
│   ├── App.tsx                 # Main application view
│   ├── index.css               # Tailwind CSS v4 & custom radar keyframe animations
│   └── main.tsx
├── package.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites

- **Node.js** (v20+ or v22+) & **npm**
- **Rust & Cargo** (1.75+ or newer)

### 1. Run the Frontend (UI / Radar Interface)

```bash
# Start development UI server
npm run dev
```

Open `http://localhost:5173` in your browser.

### 2. Run the AirDrop Protocol Server (Backend)

```bash
# Start the Rust AirDrop Daemon
npm run server
```

The daemon will start listening on port `8770`:
- **Apple AirDrop Endpoints**: `http://0.0.0.0:8770/Discover`, `/Ask`, `/Upload`
- **Mobile Web AirDrop Portal**: `http://0.0.0.0:8770/`

### 3. Build for Production

```bash
npm run build
```

Production assets will be output to the `dist/` directory.

---

## License

MIT License.
