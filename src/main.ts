import { createClerkBridge } from '@clerk/electron'
import { storage } from '@clerk/electron/storage'
import { app, BrowserWindow } from 'electron'
import started from 'electron-squirrel-startup'
import path from 'node:path'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

// Registers Clerk's IPC handlers and token storage. Call it before app.whenReady().
const clerk = createClerkBridge({
  storage: storage(),
})

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }
}

// On Windows and Linux, Clerk forwards OAuth deep links through Electron's
// single-instance lock. Skip the bootstrap in the process that is quitting.
if (clerk.isPrimaryInstance) {
  app.on('ready', createWindow)
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  clerk.cleanup()
})
