// This script runs in the page's context, so fetch() calls look like they're
// coming from the page itself — bypassing CORS restrictions on sites like Pinterest.

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'FETCH_IMAGE') {
    const { url } = msg;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          sendResponse({
            ok: true,
            dataUrl: reader.result,
            mimeType: blob.type,
          });
        };
        reader.onerror = () => {
          sendResponse({ ok: false, error: 'FileReader failed' });
        };
        reader.readAsDataURL(blob);
      })
      .catch((err) => {
        sendResponse({ ok: false, error: err.message });
      });
    return true; // keep channel open for async response
  }
});
