import * as Url from 'url'
import { shell } from 'electron'

export function openDirectorySafe(path: string) {
  if (__DARWIN__) {
    const directoryURL = Url.format({
      pathname: path,
      protocol: 'file:',
      slashes: true,
    })

    shell.openExternal(directoryURL)
  } else {
    shell.openItem(path)
  }
}
