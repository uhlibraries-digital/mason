import { remote } from 'electron'
import { Theme } from './theme'
import {
  Disposable,
  Emitter
} from 'event-kit'
import {
  supportsDarkMode,
  isDarkModeEnabled
} from './dark-mode'

class ThemeChangeMonitor {
  private readonly emitter = new Emitter()

  public constructor() {
    if (supportsDarkMode()) {
      remote.nativeTheme.addListener('updated', this.onThemeNotificationFromOS)
    }
  }

  public dispose() {
    remote.nativeTheme.removeAllListeners()
  }

  public onThemeChanged(fn: (theme: Theme) => void): Disposable {
    return this.emitter.on('theme-changed', fn)
  }

  private onThemeNotificationFromOS = (event: string, userInfo: any) => {
    const theme = isDarkModeEnabled()
      ? Theme.Dark
      : Theme.Light
    this.emitThemeChanged(theme)
  }

  private emitThemeChanged(theme: Theme) {
    this.emitter.emit('theme-changed', theme)
  }

}

export const themeChangeMonitor = new ThemeChangeMonitor()

// this ensures we cleanup any existing subscription on exit
remote.app.on('will-quit', () => {
  themeChangeMonitor.dispose()
})