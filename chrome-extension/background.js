const BASE_URL = 'http://127.0.0.1';
const DEFAULT_PORT = 8743;
let cachedPort = DEFAULT_PORT;

// ---- Detect the actual port the Electron app is using ----
async function getAppPort() {
  if (cachedPort && cachedPort !== DEFAULT_PORT) {
    return cachedPort; // use cached port if we already found a non-default one
  }

  // Try to ping the app and extract the port from the response
  for (let port = DEFAULT_PORT; port <= 8800; port++) {
    try {
      const res = await fetch(`${BASE_URL}:${port}/ping`, { timeout: 500 });
      if (res.ok) {
        const data = await res.json();
        if (data.port) {
          cachedPort = data.port;
          return data.port;
        }
        return port;
      }
    } catch {
      // port not available, try next
    }
  }
  throw new Error('StickyShots app not found on any port');
}

// Create the right-click context menu item on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'send-to-stickyshots',
    title: 'Send to StickyShots',
    contexts: ['image'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'send-to-stickyshots') return;
  if (!info.srcUrl) return;

  try {
    await sendImageToApp(info.srcUrl, tab.id);
    notify('Sent to StickyShots', 'The image is now floating as a sticky note.');
  } catch (err) {
    console.error('StickyShots send failed:', err);
    notify(
      'StickyShots send failed',
      err.message || 'Check the DevTools console for details.'
    );
  }
});

// ---- Send image to the Electron app ----
async function sendImageToApp(srcUrl, tabId) {
  const port = await getAppPort();
  const appUrl = `${BASE_URL}:${port}`;

  let dataUrl, mimeType;
  let usedServerFetch = false;

  // Strategy 1: Try content script fetch (browser context, works for most CORS cases)
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'FETCH_IMAGE',
      url: srcUrl,
    });
    if (response?.ok) {
      dataUrl = response.dataUrl;
      mimeType = response.mimeType;
    } else {
      throw new Error(response?.error || 'Content script fetch failed');
    }
  } catch (contentScriptErr) {
    console.log('Content script fetch failed, trying direct fetch...');

    // Strategy 2: Try direct fetch from service worker (works for CORS-permissive sites)
    try {
      const blob = await fetch(srcUrl).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      });
      dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      mimeType = blob.type;
    } catch {
      console.log('Direct fetch also failed, will let server-side fetch handle it...');
      // Strategy 3: Let the Electron app fetch it server-side (ultimate fallback)
      // This bypasses all browser CORS since Electron isn't bound by browser rules
      usedServerFetch = true;
    }
  }

  // Send to the app
  const payload = usedServerFetch
    ? { imageUrl: srcUrl } // let the server fetch it
    : { dataUrl, mimeType };

  const res = await fetch(`${appUrl}/note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`App responded with ${res.status}`);
  }
  return res.json();
}

function notify(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
  });
}

// ---- Allow the popup to ping the app's status ----
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'CHECK_APP_STATUS') {
    getAppPort()
      .then((port) => {
        const appUrl = `${BASE_URL}:${port}`;
        return fetch(`${appUrl}/ping`).then((r) => r.json());
      })
      .then(() => sendResponse({ running: true, port: cachedPort }))
      .catch(() => sendResponse({ running: false }));
    return true; // keep channel open for async response
  }
});

