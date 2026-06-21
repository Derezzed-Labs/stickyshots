const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('library', {
  onData: (callback) => {
    ipcRenderer.on('library-data', (event, data) => callback(data));
  },
  download: (id) => ipcRenderer.send('library-download', id),
  repin: (id) => ipcRenderer.send('library-repin', id),
  bringToFront: () => ipcRenderer.send('library-bring-to-front'),
  clearLibrary: () => ipcRenderer.send('library-clear'),
  minimize: () => ipcRenderer.send('library-minimize'),
  maximize: () => ipcRenderer.send('library-maximize'),
  close: () => ipcRenderer.send('library-close'),
  onMaximizedState: (callback) => {
    ipcRenderer.on('window-maximized', (event, isMaximized) => callback(isMaximized));
  },
});
