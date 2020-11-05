import { electronStore } from './stores'

export enum Theme {
  Light,
  Dark
}

const themeKey = 'theme'

export function getThemeName(theme: Theme): string {
  switch (theme) {
    case Theme.Light:
      return 'light'
    case Theme.Dark:
      return 'dark'
  }
}

export function getTheme(): Theme {
  return electronStore.get(themeKey) === 'dark'
    ? Theme.Dark
    : Theme.Light
}

export function setTheme(theme: Theme) {
  electronStore.set(themeKey, getThemeName(theme))
}