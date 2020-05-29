import { Menu, ipcMain, app } from 'electron'
import { MenuEvent } from './menu-event'

export function buildDefaultMenu(): Menu {
  const template = new Array<Electron.MenuItemConstructorOptions>()
  const separator: Electron.MenuItemConstructorOptions = { type: 'separator' }

  if (__DARWIN__) {
    template.push({
      label: app.name,
      submenu: [
        {
          label: 'About ' + app.name,
          id: 'about',
          click: emit('show-about')
        },
        separator,
        {
          label: 'Preferences...',
          id: 'preferences',
          accelerator: 'CmdOrCtrl+,',
          click: emit('show-preferences')
        },
        separator,
        { role: 'services' as any },
        separator,
        { role: 'hide' as any },
        { role: 'hideothers' as any },
        { role: 'unhide' as any },
        separator,
        { role: 'quit' as any },
      ]
    })
  }

  if (!__DARWIN__) {
    template.push({
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          id: 'new-window',
          click: emit('new-window')
        },
        {
          label: 'Open Project...',
          id: 'open-project',
          accelerator: 'CmdOrCtrl+O',
          click: emit('open-project')
        },
        separator,
        {
          label: 'Save Project',
          id: 'save-project',
          accelerator: 'CmdOrCtrl+S',
          click: emit('save-project')
        },
        separator,
        {
          label: 'Preferences...',
          id: 'preferences',
          click: emit('show-preferences')
        },
        separator,
        {
          label: 'Export',
          submenu: [
            {
              label: 'Preservation SIP',
              click: emit('export-sip')
            },
            {
              label: 'Modified Masters',
              click: emit('export-mm')
            },
            separator,
            {
              label: 'Armand Package',
              click: emit('export-armand')
            },
            {
              label: 'Avalon Package',
              click: emit('export-avalon')
            },
            separator,
            {
              label: 'Shotlist',
              click: emit('export-shotlist')
            },
            {
              label: 'Metadata',
              click: emit('export-metadata')
            }
          ]
        },
        separator,
        { role: 'quit' }
      ]
    })
  }
  else {
    template.push({
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          id: 'new-window',
          click: emit('new-window')
        },
        {
          label: 'Open Project...',
          id: 'open-project',
          accelerator: 'CmdOrCtrl+O',
          click: emit('open-project')
        },
        separator,
        {
          label: 'Save Project',
          id: 'save-project',
          accelerator: 'CmdOrCtrl+S',
          click: emit('save-project')
        },
        separator,
        {
          label: 'Export',
          submenu: [
            {
              label: 'Preservation SIP',
              click: emit('export-sip')
            },
            {
              label: 'Modified Masters',
              click: emit('export-mm')
            },
            separator,
            {
              label: 'Armand Package',
              click: emit('export-armand')
            },
            {
              label: 'Avalon Package',
              click: emit('export-avalon')
            },
            separator,
            {
              label: 'Shotlist',
              click: emit('export-shotlist')
            },
            {
              label: 'Metadata',
              click: emit('export-metadata')
            }
          ]
        },
      ]
    })
  }

  template.push({
    label: __DARWIN__ ? 'Edit' : '&Edit',
    submenu: [
      { role: 'undo', label: __DARWIN__ ? 'Undo' : '&Undo' },
      { role: 'redo', label: __DARWIN__ ? 'Redo' : '&Redo' },
      separator,
      { role: 'cut', label: __DARWIN__ ? 'Cut' : 'Cu&t' },
      { role: 'copy', label: __DARWIN__ ? 'Copy' : '&Copy' },
      { role: 'paste', label: __DARWIN__ ? 'Paste' : '&Paste' },
      {
        label: __DARWIN__ ? 'Select All' : 'Select &all',
        accelerator: 'CmdOrCtrl+A',
        click: emit('select-all')
      },
    ],
  })

  template.push({
    label: __DARWIN__ ? 'View' : '&View',
    submenu: [
      {
        label: 'Toggle Developer Tools',
        accelerator: (() => {
          return __DARWIN__ ? 'Alt+Command+I' : 'Ctrl+Shift+I'
        })(),
        click(item: any, focusedWindow: Electron.BrowserWindow) {
          if (focusedWindow) {
            focusedWindow.webContents.toggleDevTools()
          }
        }
      }
    ]
  })

  // TODO: project menu 
  template.push({
    label: __DARWIN__ ? 'Project' : '&Project',
    submenu: [
      {
        label: 'Mint Preservation ARKs',
        click: emit('mint-pm')
      },
      {
        label: 'Mint Access ARKs',
        click: emit('mint-ac')
      },
      separator,
      {
        label: 'Create Access Files',
        click: emit('create-access')
      },
      separator,
      {
        label: 'Update File Assignment',
        click: emit('update-files')
      },
      {
        label: 'Update Vocabulary',
        click: emit('update-vocabulary')
      }
    ]
  })

  if (!__DARWIN__) {
    template.push({
      label: '&Help',
      submenu: [
        {
          label: '&About ' + app.name,
          id: 'about',
          click: emit('show-about')
        }
      ]
    })
  }

  return Menu.buildFromTemplate(template);
}

type ClickHandler = (
  menuItem: Electron.MenuItem,
  browserWindow: Electron.BrowserWindow,
  event: Electron.Event
) => void

function emit(name: MenuEvent): ClickHandler {
  return (menuItem, window) => {
    if (window) {
      window.webContents.send('menu-event', { name })
    }
    else {
      ipcMain.emit('menu-event', { name })
    }
  }
}