import { remote } from 'electron'
import {
  isMacOsMajaveOrLater,
  isWindows10Build17666OrLater
} from './os'

export function supportsDarkMode() {
  if (__DARWIN__) {
    return isMacOsMajaveOrLater()
  }
  else if (__WIN32__) {
    return isWindows10Build17666OrLater()
  }
  return false
}

export function isDarkModeEnabled() {
  if (!supportsDarkMode()) {
    return false
  }
  return remote.nativeTheme.shouldUseDarkColors
}