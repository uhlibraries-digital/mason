import { compare } from 'compare-versions'
import * as OS from 'os'
import { UAParser } from 'ua-parser-js'

export function getOS() {
  if (__DARWIN__) {
    const parser = new UAParser()
    const os = parser.getOS()
    return `${os.name} ${os.version}`
  }
  else if (__WIN32__) {
    return `Windows ${OS.release()}`
  }
  else {
    return `${OS.type()} ${OS.release()}`
  }
}

export function isMacOsMajaveOrLater() {
  if (__DARWIN__) {
    const parser = new UAParser()
    const os = parser.getOS()

    if (os.version === undefined) {
      return false
    }

    return compare(os.version, '10.13.0', '>=')
  }
  return false
}

export function isWindows10Build17666OrLater() {
  if (__WIN32__) {
    const version = OS.release()

    if (version === undefined) {
      return false
    }

    return compare(version, '10.0.17666', '>=')
  }
  return false
}