const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');
const crypto = require('crypto');

const BASE_PORT = 8743;
const MAX_PORT = 8800;
const isMac = process.platform === 'darwin';

// ---- Config file for storing the dynamically-allocated port ----
const userDataDir = app.getPath('userData');
const configFile = path.join(userDataDir, 'config.json');
if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  } catch {
    return {};
  }
}

function saveConfig(config) {
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}

let PORT = BASE_PORT; // will be updated after finding an open port

// ---- Check if a port is available ----
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '127.0.0.1');
  });
}

// ---- Find an open port ----
async function findOpenPort() {
  for (let p = BASE_PORT; p <= MAX_PORT; p++) {
    if (await isPortAvailable(p)) {
      return p;
    }
  }
  return null;
}

// ---- In-memory image library (cleared on app close) ----
const imageLibrary = new Map(); // id -> { dataUrl, mimeType, timestamp }
const deletionTimers = new Map(); // id -> setTimeout handle (3-hour grace period)

const IMAGE_RETENTION_MS = 3 * 60 * 60 * 1000; // 3 hours

let tray = null;
const noteWindows = new Map(); // id -> BrowserWindow
let libraryWindow = null;
let server = null;
let appQuitting = false;

// ---- Create a floating sticky note window for one image ----
function createNoteWindow(id, mimeType, opts = {}) {
  const display = screen.getPrimaryDisplay();
  const defaultW = 280;
  const defaultH = 280;
  const isNew = !opts.width || !opts.height;

  const win = new BrowserWindow({
    width: opts.width || defaultW,
    height: opts.height || defaultH,
    x: opts.x ?? Math.round(display.workArea.x + 80 + Math.random() * 200),
    y: opts.y ?? Math.round(display.workArea.y + 80 + Math.random() * 200),
    frame: false,
    transparent: true,
    hasShadow: true,
    icon: path.join(__dirname, '..', 'assets', 'logo.png'),
    resizable: true,
    minWidth: 100,
    minHeight: 100,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  if (isMac) win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  win.loadFile(path.join(__dirname, 'note.html'));

  win.webContents.on('did-finish-load', () => {
    const imgData = imageLibrary.get(id);
    if (!imgData) {
      win.close();
      return;
    }
    win.webContents.send('init-note', {
      id,
      dataUrl: imgData.dataUrl,
      mimeType,
      locked: opts.locked || false,
      rotation: opts.rotation || 0,
      isNew,
    });
    if (isNew) {
      setTimeout(() => win.show(), 60);
    } else {
      win.show();
    }
  });

  win.on('moved', () => {
    const [x, y] = win.getPosition();
    const state = getSessionState();
    if (state[id]) state[id].x = x;
    if (state[id]) state[id].y = y;
    saveSessionState(state);
  });
  win.on('resized', () => {
    const [width, height] = win.getSize();
    const state = getSessionState();
    if (state[id]) state[id].width = width;
    if (state[id]) state[id].height = height;
    saveSessionState(state);
  });
  win.on('closed', () => {
    noteWindows.delete(id);
    // Image stays in library for 3 hours, then auto-deletes
    if (!deletionTimers.has(id)) {
      const timer = setTimeout(() => {
        imageLibrary.delete(id);
        deletionTimers.delete(id);
        broadcastLibraryUpdate();
      }, IMAGE_RETENTION_MS);
      deletionTimers.set(id, timer);
    }
    const state = getSessionState();
    delete state[id];
    saveSessionState(state);
    broadcastLibraryUpdate();
  });

  noteWindows.set(id, win);
  return win;
}

// ---- Session state (window positions/sizes only, NOT image data) ----
function getSessionState() {
  return Array.from(noteWindows.entries()).reduce((acc, [id, win]) => {
    const [x, y] = win.getPosition();
    const [width, height] = win.getSize();
    acc[id] = { x, y, width, height };
    return acc;
  }, {});
}
function saveSessionState(state) {
  // ephemeral, not persisted — just tracking current layout in memory
}

// ---- Library window (shows all images in current session) ----
function createOrShowLibrary() {
  if (libraryWindow && !libraryWindow.isDestroyed()) {
    libraryWindow.focus();
    return;
  }

  libraryWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 400,
    minHeight: 300,
    frame: false,
    icon: path.join(__dirname, '..', 'assets', 'logo.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'library-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  libraryWindow.on('maximize', () => {
    libraryWindow.webContents.send('window-maximized', true);
  });

  libraryWindow.on('unmaximize', () => {
    libraryWindow.webContents.send('window-maximized', false);
  });

  libraryWindow.loadFile(path.join(__dirname, 'library.html'));

  libraryWindow.webContents.on('did-finish-load', () => {
    sendLibraryData();
  });

  libraryWindow.on('closed', () => {
    libraryWindow = null;
  });
}

function sendLibraryData() {
  if (!libraryWindow || libraryWindow.isDestroyed()) return;
  const images = Array.from(imageLibrary.entries()).map(([id, data]) => ({
    id,
    thumbnail: data.dataUrl.substring(0, 500) + '...', // just the header for the preview
    fullDataUrl: data.dataUrl,
    mimeType: data.mimeType,
    timestamp: data.timestamp,
    isActive: noteWindows.has(id),
  }));
  libraryWindow.webContents.send('library-data', { images });
}

function broadcastLibraryUpdate() {
  sendLibraryData();
}

// ---- Local HTTP server: receives images from Chrome extension ----
function startServer() {
  server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/ping') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, app: 'stickyshots', port: PORT }));
      return;
    }

    if (req.method === 'POST' && req.url === '/note') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 50 * 1024 * 1024) req.destroy();
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const { dataUrl, mimeType, imageUrl } = payload;

          let finalDataUrl = dataUrl;

          // If no dataUrl but an imageUrl, fetch it server-side (bypasses CORS)
          if (!dataUrl && imageUrl) {
            fetchImageServerSide(imageUrl, (err, fetchedDataUrl) => {
              if (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: 'Failed to fetch image: ' + err }));
                return;
              }
              processImage(fetchedDataUrl, mimeType, res);
            });
            return;
          }

          if (!finalDataUrl || !finalDataUrl.startsWith('data:')) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'invalid payload' }));
            return;
          }

          processImage(finalDataUrl, mimeType, res);
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: String(err.message || err) }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'not found' }));
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`StickyShots listening on 127.0.0.1:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Server error:', err.message);
    dialog.showErrorBox(
      'StickyShots Error',
      `Failed to start server on port ${PORT}. Please restart the app or close other applications using this port.`
    );
  });
}

// ---- Helper: process image and create note ----
function processImage(dataUrl, mimeType, res) {
  const id = crypto.randomUUID();
  imageLibrary.set(id, {
    dataUrl,
    mimeType: mimeType || 'image/png',
    timestamp: Date.now(),
  });

  createNoteWindow(id, mimeType || 'image/png', {});
  broadcastLibraryUpdate();

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, id }));
}

// ---- Helper: fetch image server-side to bypass CORS ----
function fetchImageServerSide(imageUrl, callback) {
  const https = require('https');
  const fetchModule = imageUrl.startsWith('https') ? https : require('http');

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  };

  fetchModule.get(imageUrl, options, (res) => {
    if (res.statusCode !== 200) {
      callback(new Error(`HTTP ${res.statusCode}`));
      return;
    }

    let chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const mimeType = res.headers['content-type'] || 'image/png';
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${mimeType};base64,${base64}`;
        callback(null, dataUrl);
      } catch (err) {
        callback(err);
      }
    });
  }).on('error', callback);
}

// ---- IPC from note windows ----
ipcMain.on('note-close', (e, id) => {
  const win = noteWindows.get(id);
  if (win) win.close();
});

ipcMain.on('note-toggle-lock', (e, id, locked) => {
  const state = getSessionState();
  if (state[id]) state[id].locked = locked;
});

ipcMain.on('note-rotate', (e, id, rotation) => {
  const state = getSessionState();
  if (state[id]) state[id].rotation = rotation;
});

ipcMain.on('note-resize-from-corner', (e, id, { width, height }) => {
  const win = noteWindows.get(id);
  if (win) {
    win.setSize(Math.round(width), Math.round(height));
  }
});

ipcMain.on('note-duplicate', (e, id) => {
  const imgData = imageLibrary.get(id);
  if (!imgData) return;
  const newId = crypto.randomUUID();
  imageLibrary.set(newId, imgData);
  const win = noteWindows.get(id);
  const [x, y] = win ? win.getPosition() : [100, 100];
  createNoteWindow(newId, imgData.mimeType, {
    x: x + 24,
    y: y + 24,
  });
  broadcastLibraryUpdate();
});

ipcMain.on('note-fit-to-image', (e, id, { naturalWidth, naturalHeight }) => {
  const win = noteWindows.get(id);
  if (!win || !naturalWidth || !naturalHeight) return;

  const MAX_DIM = 420;
  const MIN_DIM = 110;
  const aspect = naturalWidth / naturalHeight;

  let width, height;
  if (aspect >= 1) {
    width = Math.min(MAX_DIM, Math.max(MIN_DIM, naturalWidth));
    height = Math.round(width / aspect);
  } else {
    height = Math.min(MAX_DIM, Math.max(MIN_DIM, naturalHeight));
    width = Math.round(height * aspect);
  }
  width = Math.max(MIN_DIM, width);
  height = Math.max(MIN_DIM, height);

  win.setSize(width, height);
});

ipcMain.on('note-download', async (e, id) => {
  const imgData = imageLibrary.get(id);
  if (!imgData) return;

  const ext = (() => {
    const map = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };
    return map[imgData.mimeType] || 'png';
  })();

  const filename = `stickyshot-${id}.${ext}`;
  const { filePath } = await dialog.showSaveDialog(noteWindows.get(id) || null, {
    defaultPath: filename,
    filters: [{ name: 'Image', extensions: [ext] }],
  });

  if (!filePath) return;

  try {
    const matches = imgData.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid data URL');
    const buffer = Buffer.from(matches[2], 'base64');
    fs.writeFileSync(filePath, buffer);
  } catch (err) {
    dialog.showErrorBox('Download failed', err.message);
  }
});

// ---- Bring all note windows to front ----
function bringAllNotesToFront() {
  const wins = Array.from(noteWindows.values());
  wins.forEach((win, i) => {
    if (win.isDestroyed()) return;
    // Re-assert alwaysOnTop so the OS truly surfaces the window
    win.setAlwaysOnTop(false);
    win.setAlwaysOnTop(true, 'screen-saver');
    if (win.isMinimized()) win.restore();
    // Stagger slightly so each window pops in sequence and the last one ends up focused
    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.showInactive(); // show without stealing focus from each other
      }
    }, i * 30);
  });
  // Focus the most-recently added note last so it lands on top
  const last = wins[wins.length - 1];
  if (last && !last.isDestroyed()) {
    setTimeout(() => last.focus(), wins.length * 30 + 20);
  }
}

// ---- IPC from library window ----
ipcMain.on('library-bring-to-front', () => bringAllNotesToFront());

ipcMain.on('library-clear', () => {
  for (const win of [...noteWindows.values()]) win.close();
  imageLibrary.clear();
  for (const timer of deletionTimers.values()) clearTimeout(timer);
  deletionTimers.clear();
  broadcastLibraryUpdate();
});

ipcMain.on('library-minimize', () => {
  if (libraryWindow && !libraryWindow.isDestroyed()) {
    libraryWindow.minimize();
  }
});

ipcMain.on('library-maximize', () => {
  if (libraryWindow && !libraryWindow.isDestroyed()) {
    if (libraryWindow.isMaximized()) {
      libraryWindow.unmaximize();
    } else {
      libraryWindow.maximize();
    }
  }
});

ipcMain.on('library-close', () => {
  if (libraryWindow && !libraryWindow.isDestroyed()) {
    libraryWindow.close();
  }
});

ipcMain.on('library-download', async (e, id) => {
  ipcMain.emit('note-download', { sender: {} }, id);
});

ipcMain.on('library-repin', (e, id) => {
  const imgData = imageLibrary.get(id);
  if (!imgData) return;
  // Cancel any pending deletion timer — user is re-pinning this image
  if (deletionTimers.has(id)) {
    clearTimeout(deletionTimers.get(id));
    deletionTimers.delete(id);
  }
  if (noteWindows.has(id)) {
    noteWindows.get(id).focus();
    return;
  }
  createNoteWindow(id, imgData.mimeType, {});
});

// ---- Bring notes (restores closed notes from library) ----
function bringNotes() {
  for (const [id, imgData] of imageLibrary.entries()) {
    if (!noteWindows.has(id)) {
      if (deletionTimers.has(id)) {
        clearTimeout(deletionTimers.get(id));
        deletionTimers.delete(id);
      }
      createNoteWindow(id, imgData.mimeType, {});
    }
  }
  bringAllNotesToFront();
  broadcastLibraryUpdate();
}

// ---- Tray menu ----
function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'logo.png');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
  } catch {
    trayIcon = nativeImage.createEmpty();
  }
  tray = new Tray(trayIcon);
  tray.setToolTip('stickyshots');

  const logoOutlinePath = path.join(__dirname, '..', 'assets', 'logo-outline.png');
  const logoOutline = nativeImage.createFromPath(logoOutlinePath).resize({ width: 16, height: 16 });

  const menu = Menu.buildFromTemplate([
    { 
      label: 'stickyshots', 
      enabled: false,
      icon: logoOutline,
    },
    { type: 'separator' },
    {
      label: 'Open Library',
      click: () => createOrShowLibrary(),
    },
    {
      label: 'Bring Notes',
      click: () => bringNotes(),
    },
    {
      label: 'Clear Notes',
      click: () => {
        for (const win of [...noteWindows.values()]) win.close();
      },
    },
    { type: 'separator' },
    {
      label: 'Check for Updates...',
      click: () => {},
    },
    {
      label: 'Quit stickyshots',
      click: () => {
        appQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
}

// ---- App lifecycle ----
app.whenReady().then(async () => {
  if (isMac) app.dock?.hide();
  
  // Find an open port
  const openPort = await findOpenPort();
  if (!openPort) {
    dialog.showErrorBox(
      'StickyShots Error',
      `Could not find an available port between ${BASE_PORT} and ${MAX_PORT}. Please close other applications and restart.`
    );
    app.quit();
    return;
  }

  PORT = openPort;
  const config = loadConfig();
  config.port = PORT;
  saveConfig(config);

  console.log(`Using port: ${PORT}`);

  startServer();
  createTray();
});

app.on('window-all-closed', (e) => {
  e.preventDefault?.();
});

app.on('before-quit', () => {
  appQuitting = true;
  if (server) server.close();
  // Clear all pending deletion timers
  for (const timer of deletionTimers.values()) clearTimeout(timer);
  deletionTimers.clear();
  imageLibrary.clear();
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}
