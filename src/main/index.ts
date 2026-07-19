import { join } from 'node:path'
import { app, BrowserWindow, shell } from 'electron'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { createIPCHandler } from 'electron-trpc/main'
import { appRouter } from './trpc/router'
import { WorkspaceManager } from './workspace/workspace'
import { buildApplicationMenu, setMenuActionHandlers } from './menu'
import { checkForUpdates } from './updater'

const workspace = new WorkspaceManager()
let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: false,
    backgroundColor: '#f8f9fa',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  createIPCHandler({
    router: appRouter,
    windows: [mainWindow],
    createContext: async () => ({ workspace, getMainWindow: () => mainWindow })
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('net.ozoux.recipes-m')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    setMenuActionHandlers({
      onChangeFolder: () => {
        workspace.close()
        mainWindow?.webContents.send('app:change-folder')
      },
      onShowShortcuts: () => mainWindow?.webContents.send('app:show-shortcuts'),
      onCheckForUpdates: () => checkForUpdates()
    })
    buildApplicationMenu()
    createWindow()

    // Auto-update only makes sense for a packaged, published build — in dev
    // there's no update feed and electron-updater would just error.
    if (app.isPackaged) checkForUpdates()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    workspace.close()
    if (process.platform !== 'darwin') app.quit()
  })
}
