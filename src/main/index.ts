import { app, Menu, ipcMain, shell, BrowserWindow } from 'electron'
import { AppWindow } from './app-window'
import { buildDefaultMenu, buildContextMenu, MenuEvent } from './menu'
import { stat } from 'fs';
import { openDirectorySafe } from './shell'
import { IMenuItem } from '../lib/menu-item'
import { updateStore } from './update-store'

let mainWindow: AppWindow | null = null

// quit application when all windows are closed
app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  // Fix macOS $PATH for packaged app
  const fixPath = require('fix-path')
  fixPath()

  createMainWindow()

  let menu = buildDefaultMenu()
  Menu.setApplicationMenu(menu)

  updateStore.onDidChange(state => {
    if (mainWindow) {
      mainWindow.sendUpdateState(state)
    }
  })
  updateStore.onError(error => {
    if (mainWindow) {
      mainWindow.sendUpdateError(error)
    }
  })
  if (!__DEV__) {
    updateStore.checkForUpdates()
  }

  ipcMain.on('menu-event', (event: Electron.IpcMainEvent, args: any[]) => {
    const { name }: { name: MenuEvent } = event as any
    if (mainWindow) {
      mainWindow.sendMenuEvent(name)
    }
  })

  ipcMain.on(
    'open-external',
    (event: Electron.IpcMainEvent, { path }: { path: string }) => {
      const result = shell.openExternal(path)
      event.sender.send('open-external-result', { result })
    }
  )

  ipcMain.on('new-window', (event: Electron.IpcMainEvent, args: any[]) => {
    createMainWindow()
  })

  ipcMain.on(
    'show-item-in-folder',
    (event: Electron.IpcMainEvent, { path }: { path: string }) => {
      stat(path, (err, stats) => {
        if (err) {
          console.error(`Unable to find file at ${path}`)
          return
        }
        if (stats.isDirectory()) {
          openDirectorySafe(path)
        }
        else {
          shell.showItemInFolder(path)
        }
      })
    })

  ipcMain.on(
    'show-contextual-menu',
    (event: Electron.IpcMainEvent, items: ReadonlyArray<IMenuItem>) => {
      const menu = buildContextMenu(items, ix =>
        event.sender.send('contextual-menu-action', ix)
      )
      const window = BrowserWindow.fromWebContents(event.sender) || undefined
      menu.popup({ window: window })
    }
  )

  ipcMain.on(
    'update-now',
    (event: Electron.IpcMainEvent, args: any[]) => {
      updateStore.quitAndInstallUpdate()
      app.exit()
    }
  )

  ipcMain.on(
    'check-for-updates',
    (event: Electron.IpcMainEvent, args: any[]) => {
      updateStore.checkForUpdates()
    }
  )

  ipcMain.on(
    'window-closed',
    (event: Electron.IpcMainEvent, args: any[]) => {
      const window = BrowserWindow.fromWebContents(event.sender)
      if (window) {
        window.close()
      }
    }
  )

})

function createMainWindow() {
  const window = new AppWindow()

  window.onDidLoad(() => {
    window.show()
  })

  // window.onClose((e: any) => {
  //   e.preventDefault()
  //   window.sendWindowClosing()
  // })

  window.load()

  mainWindow = window
}
