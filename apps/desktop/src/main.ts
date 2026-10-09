const { app, BrowserWindow, globalShortcut, ipcMain, nativeTheme } = require('electron');
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

// Google Drive Sync handler
ipcMain.handle('sync-google-drive', async () => {
  return new Promise((resolve, reject) => {
    const authWindow = new BrowserWindow({
      width: 500,
      height: 600,
      show: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const clientId = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'; // Requires user to supply this
    const redirectUri = 'http://localhost/callback'; // Standard desktop loopback pattern (intercepted)
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=https://www.googleapis.com/auth/drive.file`;

    authWindow.loadURL(authUrl);

    let isResolved = false;

    authWindow.webContents.on('will-redirect', async (event: any, url: string) => {
      handleCallback(url);
    });

    authWindow.webContents.on('did-navigate', async (event: any, url: string) => {
        handleCallback(url);
    });

    async function handleCallback(url: string) {
      if (url.includes(redirectUri) && url.includes('access_token=') && !isResolved) {
        isResolved = true;
        authWindow.close();

        try {
          // Extract token from URL fragment
          const hash = url.split('#')[1];
          if (!hash) throw new Error('No token found');
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');

          if (!accessToken) throw new Error('No access_token found in response');

          // Find file ID
          const searchResponse = await fetch('https://www.googleapis.com/drive/v3/files?q=name="passwords.csv" and trashed=false', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const searchData = await searchResponse.json();

          if (!searchData.files || searchData.files.length === 0) {
             throw new Error('passwords.csv not found on Google Drive.');
          }
          const fileId = searchData.files[0].id;

          // Download file
          const downloadResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
             headers: { Authorization: `Bearer ${accessToken}` }
          });

          if (!downloadResponse.ok) {
             throw new Error('Failed to download file');
          }

          const csvText = await downloadResponse.text();
          resolve(csvText);
        } catch (e: any) {
          reject(e.message);
        }
      }
    }

    authWindow.on('closed', () => {
      if (!isResolved) {
        reject('Authentication window closed');
      }
    });
  });
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1120,
    height: 720,
    minWidth: 880,
    minHeight: 560,
    backgroundColor: '#07080c', // evita o flash branco antes da primeira pintura
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: false
    }
  });

  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  nativeTheme.themeSource = 'dark';
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
