const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('stickyShots', {
  onInit: (callback) => {
    ipcRenderer.on('init-note', (event, data) => callback(data));
  },
  close: (id) => ipcRenderer.send('note-close', id),
  toggleLock: (id, locked) => ipcRenderer.send('note-toggle-lock', id, locked),
  rotate: (id, rotation) => ipcRenderer.send('note-rotate', id, rotation),
  resize: (id, size) => ipcRenderer.send('note-resize-from-corner', id, size),
  duplicate: (id) => ipcRenderer.send('note-duplicate', id),
  download: (id) => ipcRenderer.send('note-download', id),
  fitToImage: (id, dims) => ipcRenderer.send('note-fit-to-image', id, dims),
});
