const { contextBridge, ipcRenderer } = require('electron');

// Expose secure APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  storageGet: (key: string) => ipcRenderer.invoke('storage-get', key),
  storageSet: (values: Record<string, any>) => ipcRenderer.invoke('storage-set', values),
  storageRemove: (keys: string[]) => ipcRenderer.invoke('storage-remove', keys),
  syncGoogleDrive: () => ipcRenderer.invoke('sync-google-drive')
});
