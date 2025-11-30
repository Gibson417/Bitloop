import { app, BrowserWindow, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
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

// Handle app ready event
app.whenReady().then(() => {
  createWindow();

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
