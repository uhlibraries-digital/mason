import { Parser } from 'json2csv'
import {
  writeFile,
  copyFile,
  lstatSync
} from 'fs'
import { basename } from 'path'


export interface IFileCopyProgress {
  readonly totalSize: number
}

/**
 * Parse data to CSV using json2csv parser
 * @param fields 
 * @param data 
 */

export function getCsv(fields: any, data: ReadonlyArray<unknown>, opts?: any): string {
  const options = opts ? { ...opts, fields } : { fields }

  const parser = new Parser(options)
  return parser.parse(data)
}

/**
 * Writes string to file
 * @param filepath 
 * @param data 
 */

export const writeToFile = (filepath: string, data: string) => {
  return new Promise((resolve, reject) => {
    writeFile(filepath, data, 'utf8', (err) => {
      if (err) {
        return reject(err)
      }
      return resolve(null)
    })
  })
}

/**
 * Copy files from project to export location
 * @param src 
 * @param dest 
 * @param progressCallback 
 */
export const copyProjectFile = (
  src: string,
  dest: string,
  progressCallback: (process: IFileCopyProgress) => void
) => {
  return new Promise((resolve, reject) => {
    const state = lstatSync(src)
    const totalSize = state.size
    progressCallback({
      totalSize: totalSize
    })
    copyFile(src, dest, (err) => {
      if (err) {
        return reject(err)
      }
      resolve(null)
    })
  })
}

/**
 * Returns new filename for export using arks
 * @param ark 
 * @param projectfile 
 * @param filename 
 */
export function exportFilename(ark: string, projectfile: string, filename: string): string {
  if (ark === '' || projectfile === '') {
    return filename
  }

  const match = filename.match(/^[0-9]{4,}_(.*)/)
  if (!match) {
    return filename.replace(/_[a-z]{2}\./, '.')
  }

  const name = basename(projectfile, '.carp').replace(' ', '_')
  const id = String(ark.split('/').slice(-1))

  return `${name}_${id}_${match[1]}`
}

/**
 * Convert Rights string to correct URI
 * @param value
 */
export function rightsToUri(value: string): string {
  switch (value) {
    case 'Copyright Not Evaluated':
      return 'http://rightsstatements.org/vocab/CNE/1.0/'
    case 'In Copyright':
      return 'http://rightsstatements.org/vocab/InC/1.0/'
    case 'In Copyright - Copyright Owner Unlocatable or Unidentifiable':
      return 'http://rightsstatements.org/vocab/InC-RUU/1.0/'
    case 'In Copyright - Educational Use Permitted':
      return 'http://rightsstatements.org/vocab/InC-EDU/1.0/'
    case 'No Copyright - United States':
      return 'http://rightsstatements.org/vocab/NoC-US/1.0/'
    case 'Public Domain':
      return 'https://creativecommons.org/publicdomain/mark/1.0/'
    case 'Rights Undetermined':
      return 'http://rightsstatements.org/vocab/UND/1.0/'
  }
  return ''
}