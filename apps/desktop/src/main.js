const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  win.loadFile('src/index.html');
}

app.whenReady().then(() => {
  // Configuração inicial para a funcionalidade de Sincronização Google Drive (.csv)
  ipcMain.handle('sync-drive-csv', async (event, args) => {
    console.log('[BunkerPass Desktop] Simulando sincronização do arquivo passwords.csv do Google Drive...');
    const mockData = [
      { url: 'https://mock.com', username: 'admin', password: '123', grouping: 'Personal' }
    ];
    return { success: true, data: mockData, message: 'Google Drive CSV sync mock concluído com acesso offline.' };
  });

  createWindow();

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
