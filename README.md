# stickyshots

![Release](https://img.shields.io/github/v/release/aadidoesitbetter/stickyshots)
![License](https://img.shields.io/badge/license-MIT-blue)
![Stars](https://img.shields.io/github/stars/aadidoesitbetter/stickyshots?style=social)

Float any image as a draggable sticky note on top of any app, anywhere on your screen.

Right click any image on the web → it appears as a floating, draggable, resizable sticky note that hovers above every application on your desktop. Perfect for reference images, inspiration boards, or quick visual lookups.

No cloud. No accounts. Everything stays on your machine.

![StickyShots Showcase](demo.png)

## Quick Start
- **[Download App (Windows)](https://github.com/aadidoesitbetter/stickyshots/releases/download/v1.0.0/stickyshots_release.exe)**
- **[Download Chrome Extension](https://github.com/aadidoesitbetter/stickyshots/releases/download/v1.0.0/stickyshots_extension.zip)**
- **[View Releases](https://github.com/aadidoesitbetter/stickyshots/releases)**

## Why StickyShots?
- **Need a reference image while coding?** Float it.
- **Designing with inspiration boards?** Float them all.
- **Research without alt-tabbing?** Float links as images.

## Features

- Floats above everything, even fullscreen games and apps
- Auto fits to image size, no awkward cropping or padding
- Sleek, minimal UI 
- Session-based library, images live in memory, download what you want to keep
- Completely private all data stays local, no syncing, no tracking
- Intuitive controls drag, resize, lock position, duplicate, download

## Installation

Option 1: Download Pre-Built (Recommended for most users)

1. Download the latest release assets:
   - Windows App: [stickyshots_release.exe](https://github.com/aadidoesitbetter/stickyshots/releases/download/v1.0.0/stickyshots_release.exe)
   - Chrome Extension: [stickyshots_extension.zip](https://github.com/aadidoesitbetter/stickyshots/releases/download/v1.0.0/stickyshots_extension.zip)
   - Developers (Full Source): [stickyshots_dev_release.zip](https://github.com/aadidoesitbetter/stickyshots/releases/download/v1.0.0/stickyshots_dev_release.zip)

2. Install the Chrome extension:
   - Download and extract `stickyshots_extension.zip` to a folder on your computer
   - Open Chrome and navigate to `chrome://extensions`
   - Enable **Developer mode** (toggle in the top right corner)
   - Click **Load unpacked**
   - Select the extracted `chrome-extension` folder

3. Run the desktop app and keep it running in your system tray
4. Right-click any image and select "Send to StickyShots"

Option 2: Build from Source (For developers)

```bash
# Clone the repo
git clone https://github.com/aadidoesitbetter/stickyshots.git
cd stickyshots

# Install dependencies
cd app
npm install

# Run locally
npm start

# Or build an installer for your OS
npm run dist        # current platform
npm run dist:mac    # macOS .dmg
npm run dist:win    # Windows .exe  
npm run dist:linux  # Linux .AppImage
```

How It Works

1. Desktop app (Electron) — runs in your system tray, listens on http://127.0.0.1:8743 by default
2. Chrome extension — adds a right-click menu on images, sends them to the local app
3. Sticky notes — frameless, transparent, always-on-top windows render each image
4. Library — right-click tray icon → "Open Library" to see all images, re-pin, or download

Port conflict? The app auto-detects if port 8743 is busy and tries 8744–8800. The extension automatically finds the right port.

Usage

On the Desktop App

- Drag — click and hold anywhere on the note (slight tilt animation)
- Resize — drag the bottom-right corner
- Lock — pins the note in place (hover to see controls)
- Duplicate — creates a copy
- Download — save the image to disk
- Close — removes the note (image stays in library until you close the app)
- Library — right-click tray icon → "Open Library" to see all images, re-pin, or download
- Check for Updates — (currently in progress, coming in the next version)

From the Browser

1. Find any image online
2. Right-click it → "Send to StickyShots"
3. Check the extension popup to confirm the desktop app is running
4. Image appears as a floating note on your screen

Privacy

- All images stay on your machine — zero network requests after receiving the image
- Session-based — close the app and everything clears from memory
- No tracking — no analytics, no telemetry, no accounts
- Open source — audit the code yourself

Troubleshooting

"StickyShots app is not running"
- Make sure the desktop app is open (check your system tray / menu bar)
- Restart the app if needed

Image won't send from a website
- Some sites block cross-origin image fetches. The app tries three strategies:
  1. Fetch via the page's context (works for ~95% of cases)
  2. Direct fetch (works for CORS-permissive sites)
  3. Server-side fetch (ultimate fallback, works even with hotlink protection)
- If all fail, the site is aggressively blocking downloads

Port conflict error
- The app needs ports 8743–8800 available. Close other apps using these ports and restart.

Extension not loading
- Go to chrome://extensions and ensure Developer mode is on
- Click Reload on the StickyShots card if you updated the extension

Development

Project Structure

```
stickyshots/
├── app/                       # Desktop app (Electron + Node.js)
│   ├── src/
│   │   ├── main.js           # Main process (server, tray, windows)
│   │   ├── note.html/js      # Sticky note UI
│   │   ├── library.html/js   # Image library window
│   │   └── preload.js        # IPC bridges
│   └── package.json          # Electron build config
├── chrome-extension/          # Chrome extension (MV3)
│   ├── manifest.json
│   ├── background.js         # Context menu, image fetch
│   ├── content.js            # Content script (runs on pages)
│   └── icons/
└── .github/workflows/
    └── build.yml             # GitHub Actions CI/CD
```

Key Technologies

- Electron: cross-platform desktop framework
- Node.js: HTTP server, IPC, file I/O
- Chrome Extensions API (MV3): context menus, messaging
- HTML/CSS/JavaScript: UI rendering

Contributing

Pull requests welcome! Areas to improve:

- [ ] Tauri port (smaller binary, native Rust backend)
- [ ] Image annotations / markup
- [ ] Keyboard shortcuts
- [ ] Hotkey to toggle library
- [ ] Auto-screenshot capability

License

MIT — build on top of this, use it however you want.

Questions? Open an issue on GitHub.