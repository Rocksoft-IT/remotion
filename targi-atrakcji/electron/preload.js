const { contextBridge, ipcRenderer } = require('electron');

// Same shape as the sibling Electron app's preload.js, trimmed to what pulpit/scena use.
contextBridge.exposeInMainWorld('deck', {
  onState: (cb) => ipcRenderer.on('state', (_e, payload) => cb(payload)),
  requestState: () => ipcRenderer.send('request-state'),
  sendAction: (action) => ipcRenderer.send('action', action),
  quit: () => ipcRenderer.send('quit-request'),
});
