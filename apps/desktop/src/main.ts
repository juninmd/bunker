const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function getStorePath() {
  return path.join(app.getPath('userData'), 'local_storage.json');
}

function getStore() {
  try {
    const storagePath = getStorePath();
    if (fs.existsSync(storagePath)) {
      return JSON.parse(fs.readFileSync(storagePath, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading store', e);
  }
  return {};
}

function saveStore(store: any) {
  try {
    fs.writeFileSync(getStorePath(), JSON.stringify(store));
  } catch (e) {
    console.error('Error writing store', e);
  }
}

ipcMain.handle('storage-get', (event: any, key: string) => {
  const store = getStore();
  return store[key];
});

ipcMain.handle('storage-set', (event: any, values: Record<string, any>) => {
  const store = getStore();
  Object.assign(store, values);
  saveStore(store);
});

ipcMain.handle('storage-remove', (event: any, keys: string[]) => {
  const store = getStore();
  keys.forEach((k: string) => delete store[k]);
  saveStore(store);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: false
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register('CommandOrControl+Shift+L', () => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].show();
      windows[0].focus();
    } else {
      createWindow();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
