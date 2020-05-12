import {
  IObject,
  containerToPath,
  FilePurpose
} from './project'
import { BcDamsMap } from './map'
import { IProgress } from './app-state'
import { Parser } from 'json2csv'
import {
  writeFile,
  copyFile,
  lstatSync
} from 'fs'
import * as mkdirp from 'mkdirp'
import * as filesize from 'filesize'
import {
  basename,
  dirname
} from 'path'

interface IFileCopyProgress {
  readonly totalSize: number
}

export async function exportMetadata(
  objects: ReadonlyArray<IObject>,
  map: ReadonlyArray<BcDamsMap> | null,
  filepath: string,
  progressCallback: (progress: IProgress) => void
): Promise<any> {

  if (!map) {
    return Promise.reject(new Error('No access map defined'))
  }

  const fields = map.filter(field => field.visible)
    .map((field) => {
      return { label: field.label, value: `${field.namespace}.${field.name}` }
    })

  const data = objects.map((item, index) => {
    progressCallback({
      value: index / objects.length,
      description: `Exporting data for '${item.title}'`
    })

    return { ...item.metadata }
  })

  progressCallback({
    value: undefined,
    description: 'Creating csv...'
  })

  const csvStr = getCsv(fields, data)
  return writeToFile(filepath, csvStr)
    .then(() => progressCallback({ value: 1 }))
}

export async function exportShotlist(
  objects: ReadonlyArray<IObject>,
  filepath: string,
  progressCallback: (progress: IProgress) => void
): Promise<any> {

  const fields = ['Title', 'Location', 'Notes']
  const data = objects.map((item, index) => {
    progressCallback({
      value: index / objects.length,
      description: `Exporting data for '${item.title}'`
    })

    return {
      "Title": item.title,
      "Location": containerToPath(item.containers[0]),
      "Notes": item.productionNotes
    }
  })

  const csvStr = getCsv(fields, data)
  return writeToFile(filepath, csvStr)
    .then(() => progressCallback({ value: 1 }))
}


export async function exportModifiedMasters(
  objects: ReadonlyArray<IObject>,
  map: ReadonlyArray<BcDamsMap> | null,
  filepath: string,
  projectFilePath: string,
  progressCallback: (progress: IProgress) => void
): Promise<any> {

  if (!map) {
    return Promise.reject(new Error('No access map defined'))
  }

  const projectPath = dirname(projectFilePath)

  mkdirp.sync(filepath)

  let total = 0
  const mmObjects = objects.filter((item) => {
    const fileCount = item.files.filter(file => file.purpose === FilePurpose.ModifiedMaster).length
    total += fileCount
    return fileCount !== 0
  })
  total += mmObjects.length

  const fields = [{ label: 'parts', value: 'parts' }].concat(
    map.filter(field => field.visible)
      .map((field) => {
        return { label: field.label, value: `${field.namespace}.${field.name}` }
      })
  )

  let count = 0
  let data: Array<any> = []
  for (const item of mmObjects) {
    progressCallback({
      value: (count++) / total,
      description: `Exporting data for '${item.title}'`
    })

    data.push({ ...item.metadata, "parts": "object" })

    const files = item.files.filter(file => file.purpose === FilePurpose.ModifiedMaster)
    for (const file of files) {
      const filename = exportFilename(item.do_ark, projectFilePath, basename(file.path))
      const src = `${projectPath}${file.path}`
      const part = `${dirname(file.path)}/${filename}`
      const dest = `${filepath}${part}`
      mkdirp.sync(dirname(dest))
      await copyProjectFile(src, dest, (progress) => {
        const size = filesize(progress.totalSize, { round: 1 })
        progressCallback({
          value: (count++) / total,
          description: `Exporting data for '${item.title}'`,
          subdescription: `Copying file: ${basename(file.path)} (${size})`
        })
      })
      data.push({ "parts": part.replace('//', '/') })
    }
  }

  progressCallback({
    value: undefined,
    description: 'Creating csv...'
  })

  const csvStr = getCsv(fields, data)
  const totalFiles = total - mmObjects.length
  return writeToFile(`${filepath}/metadata.csv`, csvStr)
    .then(() => progressCallback({
      value: 1,
      description: `Exported ${mmObjects.length} objects and ${totalFiles} files`
    }))
}

function getCsv(fields: any, data: ReadonlyArray<unknown>): string {
  const parser = new Parser({ fields })
  return parser.parse(data)
}


const writeToFile = (filepath: string, data: string) => {
  return new Promise((resolve, reject) => {
    writeFile(filepath, data, 'utf8', (err) => {
      if (err) {
        return reject(err)
      }
      return resolve()
    })
  })
}

const copyProjectFile = (
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
      resolve()
    })
  })
}

function exportFilename(ark: string, projectfile: string, filename: string): string {
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