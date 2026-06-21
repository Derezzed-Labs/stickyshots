const dot = document.getElementById('dot');
const statusText = document.getElementById('status-text');

chrome.runtime.sendMessage({ type: 'CHECK_APP_STATUS' }, (response) => {
  if (response?.running) {
    dot.classList.add('online');
    const port = response.port ? ` (port ${response.port})` : '';
    statusText.textContent = `StickyShots app is running${port}`;
  } else {
    dot.classList.add('offline');
    statusText.textContent = 'StickyShots app is not running';
  }
});
