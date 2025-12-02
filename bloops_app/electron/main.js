import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'UNKNOWN - Dot Grid Sequencer'
  });

  // Load the built application from dist folder
  const indexPath = path.join(__dirname, '../dist/index.html');
  
  // Check if the build exists before loading
  if (!fs.existsSync(indexPath)) {
    dialog.showErrorBox(
      'Build Not Found',
      'The application build was not found. Please run "npm run build" first.'
    );
    app.quit();
    return;
  }
  
  mainWindow.loadFile(indexPath);

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
  }
  // Automatically start downloading the update
  autoUpdater.downloadUpdate();
});

autoUpdater.on('update-not-available', (info) => {
  console.log('No updates available');
  if (mainWindow) {
    mainWindow.webContents.send('update-not-available', info);
  }
});

autoUpdater.on('download-progress', (progress) => {
  console.log(`Download progress: ${progress.percent.toFixed(1)}%`);
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progress);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', info);
  }
});

autoUpdater.on('error', (error) => {
  console.error('Auto-updater error:', error);
  if (mainWindow) {
    mainWindow.webContents.send('update-error', error.message || 'Unknown error');
  }
});

// IPC handlers
ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, result };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Handle app ready event
app.whenReady().then(() => {
  createWindow();

  // Check for updates after window is ready (with a small delay)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.log('Update check failed (this is normal if no releases exist):', err.message);
    });
  }, 3000);

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
