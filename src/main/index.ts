import { app, Menu, ipcMain, shell, BrowserWindow } from 'electron'
import { AppWindow } from './app-window'
import { buildDefaultMenu, buildContextMenu, MenuEvent } from './menu'
import { stat } from 'fs';
import { openDirectorySafe } from './shell'
import { IMenuItem } from '../lib/menu-item'
import { updateStore } from './update-store'

let mainWindow: AppWindow | null = null
const __DEV__ = process.env.NODE_ENV === 'development'

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (__DARWIN__) {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
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

  ipcMain.on('menu-event', (event: Electron.IpcMessageEvent, args: any[]) => {
    const { name }: { name: MenuEvent } = event as any
    if (mainWindow) {
      mainWindow.sendMenuEvent(name)
    }
  })

  ipcMain.on(
    'open-external',
    (event: Electron.IpcMessageEvent, { path }: { path: string }) => {
      const result = shell.openExternal(path)
      event.sender.send('open-external-result', { result })
    }
  )

  ipcMain.on('new-window', (event: Electron.IpcMessageEvent, args: any[]) => {
    createMainWindow()
  })

  ipcMain.on(
    'show-item-in-folder',
    (event: Electron.IpcMessageEvent, { path }: { path: string }) => {
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
    (event: Electron.IpcMessageEvent, items: ReadonlyArray<IMenuItem>) => {
      const menu = buildContextMenu(items, ix =>
        event.sender.send('contextual-menu-action', ix)
      )

      const window = BrowserWindow.fromWebContents(event.sender)
      menu.popup({ window: window })
    }
  )

  ipcMain.on(
    'update-now',
    (event: Electron.IpcMessageEvent, args: any[]) => {
      updateStore.quitAndInstallUpdate()
      app.exit()
    }
  )

  ipcMain.on(
    'window-closed',
    (evnet: Electron.IpcMessageEvent, args: any[]) => {
      if (mainWindow) {
        mainWindow.destroy()
        mainWindow = null
      }
    }
  )

})

function createMainWindow() {
  const window = new AppWindow()

  window.onDidLoad(() => {
    window.show()
  })

  window.onClose((e: any) => {
    e.preventDefault()
    window.sendWindowClosing()
  })

  window.load()

  mainWindow = window
}
