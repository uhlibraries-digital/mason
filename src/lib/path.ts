import * as Path from 'path'
import fileUrl from 'file-url'

export function encodePathAsUrl(...pathSegments: string[]): string {
  const path = Path.resolve(...pathSegments)
  return fileUrl(path)
}

export function staticPath(): string {
  return process.env.NODE_ENV === 'development' ?
    __static :
    Path.dirname(__dirname) + '/static'
}

export function normalize(path: string): string {
  return path.replace(/\\/g, '/').replace('//', '/')
}

export function normalizeWithOS(path: string): string {
  return __WIN32__ ? 
    path.replace('/', '\\') :
    normalize(path)
}