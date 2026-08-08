const { contextBridge, ipcRenderer } = require('electron');

// Expose secure APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Example IPC communication
  // invokeSync: () => ipcRenderer.invoke('sync-google-drive')
});
