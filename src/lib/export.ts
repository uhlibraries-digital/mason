import {
  IObject,
  containerToPath,
  FilePurpose
} from './project'
import { BcDamsMap, defaultFieldDelemiter } from './map'
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
import { range } from './range'

interface IFileCopyProgress {
  readonly totalSize: number
}

interface IAvalonField {
  readonly identifier: string
  readonly size: number
  readonly label: string
  readonly type: string
  readonly files: number
}

/**
 * Export metadata
 * 
 * @param objects 
 * @param map 
 * @param filepath 
 * @param progressCallback 
 */
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

/**
 * Export shotlist
 * 
 * @param objects 
 * @param filepath 
 * @param progressCallback 
 */
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

/**
 * Export modified masters
 * 
 * @param objects 
 * @param map 
 * @param filepath 
 * @param projectFilePath 
 * @param progressCallback 
 */

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

/**
 * Export Armand package
 * 
 * @param objects 
 * @param map 
 * @param filepath 
 * @param projectFilePath 
 * @param progressCallback 
 */

export async function exportArmandPackage(
  objects: ReadonlyArray<IObject>,
  map: ReadonlyArray<BcDamsMap> | null,
  filepath: string,
  projectFilePath: string,
  progressCallback: (progress: IProgress) => void
): Promise<any> {

  if (!map) {
    return Promise.reject(new Error('No access map defined'))
  }

  progressCallback({ value: undefined, description: 'Preparing package' })

  const projectPath = dirname(projectFilePath)
  mkdirp.sync(filepath)

  let total = 0
  let counter = 0
  const acObjects = objects.filter((item) => {
    const fileCount = item.files.filter(file => file.purpose === FilePurpose.Access).length
    total += fileCount
    return fileCount !== 0
  })
  total += acObjects.length

  const fields = [
    { label: 'Object Type', value: 'object_type' },
    { label: 'Filename', value: 'filename' }
  ].concat(
    map.filter(field => field.visible)
      .map((field) => {
        return { label: field.label, value: `${field.namespace}.${field.name}` }
      })
  )
    .concat({ label: 'doUuid', value: 'douuid' })

  let data: Array<any> = []
  for (const item of acObjects) {
    progressCallback({
      value: (counter++) / total,
      description: `Exporting data for '${item.title}'`
    })
    data.push({
      ...item.metadata,
      "object_type": item.metadata['dcterms.type'] || 'Generic',
      'douuid': item.uuid
    })

    const files = item.files.filter(file => file.purpose === FilePurpose.Access)
    for (const file of files) {
      const filename = exportFilename(item.do_ark, projectFilePath, basename(file.path))
      const src = `${projectPath}${file.path}`
      const dest = `${filepath}/${filename}`
      await copyProjectFile(src, dest, (progress) => {
        const size = filesize(progress.totalSize, { round: 1 })
        progressCallback({
          value: (counter++) / total,
          description: `Exporting data for '${item.title}'`,
          subdescription: `Copying file: ${basename(file.path)} (${size})`
        })
      })
      data.push({
        "object_type": "File",
        "filename": filename
      })
    }
  }

  const csvStr = getCsv(fields, data)
  const totalFiles = total - acObjects.length
  return writeToFile(`${filepath}/${basename(filepath)}.csv`, csvStr)
    .then(() => progressCallback({
      value: 1,
      description: `Exported ${acObjects.length} objects and ${totalFiles} files`
    }))
}

/**
 * Export Avalon package
 * 
 * @param username
 * @param objects 
 * @param map 
 * @param filepath 
 * @param projectFilePath 
 * @param progressCallback 
 */
export async function exportAvalonPackage(
  username: string,
  offset: string,
  objects: ReadonlyArray<IObject>,
  map: ReadonlyArray<BcDamsMap> | null,
  filepath: string,
  projectFilePath: string,
  progressCallback: (progress: IProgress) => void
): Promise<any> {

  if (!map) {
    return Promise.reject(new Error('No access map defined'))
  }

  progressCallback({ value: undefined, description: 'Preparing package' })

  const projectPath = dirname(projectFilePath)
  const dates = objects.filter(item => item.metadata['dc.date'] !== '')
  if (!dates.length) {
    return Promise.reject(new Error('One or more objects are missing dates'))
  }

  mkdirp.sync(`${filepath}/content`)

  let total = 0
  let counter = 0
  const acObjects = objects.filter((item) => {
    const fileCount = item.files.filter(file => file.purpose === FilePurpose.Access).length
    total += fileCount
    return fileCount !== 0
  })
  total += acObjects.length

  const fields = getAvalonFields(map, objects)
  const data: Array<any> = []
  for (const item of acObjects) {
    progressCallback({
      value: (counter++) / total,
      description: `Exporting data for '${item.title}'`
    })

    let metadata: any = {}
    map.forEach((field) => {
      const identifier = `${field.namespace}.${field.name}`
      if (field.repeatable) {
        const values = item.metadata[identifier].split(defaultFieldDelemiter)
        values.forEach((value: string, index: number) => {
          metadata[`${identifier}.${index}`] = value
          if (value !== '' && field.crosswalk && field.crosswalk.avalon.type) {
            metadata[`${identifier}.type.${index}`] = field.crosswalk.avalon.type
          }
        })
      }
      else {
        const value = item.metadata[identifier]
        metadata[identifier] = value
        if (value !== '' && field.crosswalk && field.crosswalk.avalon.type) {
          metadata[`${identifier}.type`] = field.crosswalk.avalon.type
        }
      }
    })

    const files = item.files.filter(file => file.purpose === FilePurpose.Access)
    let filedata: any = {}
    for (const index in files) {
      const file = files[index]
      const filename = exportFilename(item.do_ark, projectFilePath, basename(file.path))
      const src = `${projectPath}${file.path}`
      const dest = `${filepath}/content/${filename}`
      await copyProjectFile(src, dest, (progress) => {
        const size = filesize(progress.totalSize, { round: 1 })
        progressCallback({
          value: (counter++) / total,
          description: `Exporting data for '${item.title}'`,
          subdescription: `Copying file: ${basename(file.path)} (${size})`
        })
      })
      filedata[`file.${index}`] = `content/${filename}`
      filedata[`offset.${index}`] = offset
    }

    data.push({
      ...metadata,
      ...filedata,
      "douuid": item.uuid,
      "douuid.type": "douuid"
    })
  }

  const initalStr = ['Batch Ingest', username].concat(new Array(fields.length - 2)).join(',') + "\n"
  const csvStr = initalStr + getCsv(fields, data)
  const totalFiles = total - acObjects.length
  return writeToFile(`${filepath}/batch_manifest.csv`, csvStr)
    .then(() => progressCallback({
      value: 1,
      description: `Exported ${acObjects.length} objects and ${totalFiles} files`
    }))
}

/**
 * Parse data to CSV using json2csv parser
 * @param fields 
 * @param data 
 */

function getCsv(fields: any, data: ReadonlyArray<unknown>, opts?: any): string {
  const options = opts ? { opts, fields } : { fields }

  const parser = new Parser(options)
  return parser.parse(data)
}

/**
 * Writes string to file
 * @param filepath 
 * @param data 
 */

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

/**
 * Copy files from project to export location
 * @param src 
 * @param dest 
 * @param progressCallback 
 */
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

/**
 * Returns new filename for export using arks
 * @param ark 
 * @param projectfile 
 * @param filename 
 */
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

function getAvalonFields(
  map: ReadonlyArray<BcDamsMap>,
  objects: ReadonlyArray<IObject>
): ReadonlyArray<IAvalonField> {


  const hasRelatedItems = objects.filter(
    item => item.metadata['dcterms.relation'] !== '').length > 0

  const avalonFields = map
    .filter((field) => field.visible && field.crosswalk && field.crosswalk.avalon)
    .map((field) => {
      const identifier = `${field.namespace}.${field.name}`
      let max = 0
      let maxFiles = 0
      objects.forEach((item) => {
        const metadata = item.metadata[identifier]
        const size = field.repeatable ? metadata.split(defaultFieldDelemiter).length : -1
        const fileSize = item.files.filter(file => file.purpose === FilePurpose.Access).length

        max = Math.max(max, size)
        maxFiles = Math.max(maxFiles, fileSize)
      })

      return {
        identifier: identifier,
        size: max,
        label: field.crosswalk.avalon.label,
        type: field.crosswalk.avalon.type,
        files: maxFiles
      }
    })

  let fields: Array<any> = []
  avalonFields.forEach((avField) => {
    if (avField.identifier === 'dcterms.relation' && !hasRelatedItems) {
      return
    }

    if (avField.size) {
      range(0, avField.size).forEach((k, index) => {
        if (avField.identifier === 'dcterms.relation' && hasRelatedItems) {
          fields.push({ label: 'Related Item Label', value: `dcterms.relation.label.${index}` })
        }
        fields.push({ label: avField.label, value: `${avField.identifier}.${index}` })
        if (avField.type) {
          fields.push({ label: `${avField.label} Type`, value: `${avField.identifier}.type.${index}` })
        }
      })
    }
    else {
      if (avField.identifier === 'dcterms.relation' && hasRelatedItems) {
        fields.push({ label: 'Related Item Label', value: `dcterms.relation.label` })
      }
      fields.push({ label: avField.label, value: avField.identifier })
      if (avField.type) {
        fields.push({ label: `${avField.label} Type`, value: `${avField.identifier}.type` })
      }
    }
  })
  fields.push({ label: 'other identifier', value: 'douuid' })
  fields.push({ label: 'other identifier Type', value: 'douuid.type' })

  const maxFiles = avalonFields.reduce((acc, curr) => {
    return acc.files > curr.files ? acc : curr
  }).files
  range(0, maxFiles).forEach((k, index) => {
    fields.push({ label: "File", value: `file.${index}` })
    fields.push({ label: "Offset", value: `offset.${index}` })
  })

  return fields
}