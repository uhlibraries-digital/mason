import {
  IObject,
  FilePurpose
} from '../project'
import {
  BcDamsMap,
  defaultFieldDelemiter
} from '../map'
import { IProgress } from '../app-state'
import {
  basename,
  dirname,
  extname
} from 'path'
import {
  exportFilename,
  copyProjectFile,
  rightsToUri,
  writeToFile,
  getCsv
} from './export'
import { normalize } from '../path'
import { range } from '../range'
import filesize from 'filesize'
import * as mkdirp from 'mkdirp'
import isVideo from 'is-video'
import isAudio from 'is-audio'

interface IAvalonField {
  readonly identifier: string
  readonly size: number
  readonly label: string
  readonly type: string
  readonly files: number
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
  mkdirp.sync(`${filepath}/pdf`)

  let total = 0
  let counter = 0
  const acObjects = objects.filter((item) => {
    const fileCount = item.files.filter(
      file =>
        (file.purpose === FilePurpose.Access &&
          (isVideo(file.path) || isAudio(file.path) || isPdf(file.path))
        ) ||
        (file.purpose === FilePurpose.SubmissionDocumentation && isVtt(file.path))
    ).length
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
        const m = item.metadata[identifier] || ''
        const values = m.split(defaultFieldDelemiter)
        values.forEach((value: string, index: number) => {
          metadata[`${identifier}.${index}`] = identifier === 'dc.rights' ? rightsToUri(value) : value
          if (value !== '' && field.crosswalk && field.crosswalk.avalon.type) {
            metadata[`${identifier}.type.${index}`] = field.crosswalk.avalon.type
          }
        })
      }
      else {
        const value = item.metadata[identifier] || ''
        metadata[identifier] = identifier === 'dc.rights' ? rightsToUri(value) : value
        if (value !== '' && field.crosswalk && field.crosswalk.avalon.type) {
          metadata[`${identifier}.type`] = field.crosswalk.avalon.type
        }
      }
    })

    const files = item.files.filter(
      file =>
        (file.purpose === FilePurpose.Access &&
          (isVideo(file.path) || isAudio(file.path) || isPdf(file.path))
        ) ||
        (file.purpose === FilePurpose.SubmissionDocumentation && isVtt(file.path))
    )
    let filedata: any = {}
    let avIndex: number = 0
    for (const file of files) {
      const normalizedPath = normalize(file.path)
      const filename = exportFilename(item.do_ark, projectFilePath, basename(normalizedPath))
      const src = `${projectPath}/${file.path}`
      const subpath = isPdf(file.path) ? 'pdf' : 'content'
      const dest = `${filepath}/${subpath}/${filename}`
      await copyProjectFile(src, dest, (progress) => {
        const size = filesize(progress.totalSize, { round: 1 })
        progressCallback({
          value: (counter++) / total,
          description: `Exporting data for '${item.title}'`,
          subdescription: `Copying file: ${basename(normalizedPath)} (${size})`
        })
      })
      if (isVideo(file.path) || isAudio(file.path)) {
        filedata[`file.${avIndex}`] = `content/${filename}`
        filedata[`label.${avIndex}`] = filename
        filedata[`offset.${avIndex}`] = isVideo(file.path) ? offset : ''
        avIndex++
      }
    }

    data.push({
      ...metadata,
      ...filedata,
      "douuid": item.uuid,
      "douuid.type": "douuid"
    })
  }

  const initalStr = ['Batch Ingest', username].concat(new Array(fields.length - 2)).join(',')
  let csvStr = getCsv(fields, data, { eol: "\n", defaultValue: "" })

  // Fix issue in Avalon manifest where it doesn't like " in header
  // Fix issue where empty repeatable fields wouldn't include "" string
  const csvRows = csvStr.split("\n")
  const csvShift = csvRows.shift() || ''
  const csvHeader = csvShift.replace(/"/g, '')
  csvRows.unshift(csvHeader)
  csvStr = `${initalStr}\n${csvRows.join("\n")}`

  const totalFiles = total - acObjects.length
  return writeToFile(`${filepath}/batch_manifest.csv`, csvStr)
    .then(() => progressCallback({
      value: 1,
      description: `Exported ${acObjects.length} objects and ${totalFiles} files`
    }))
}

/**
 * Setup fields used for Avalon csv file. Each field with multiple values must
 * have their own column with the same field header.
 * 
 * dcterms.relation field contains Related Item URL but Avalon also requires
 * Related Item Label when available. Since the MAP doesn't support multiple
 * fields for Related Item we only export a blank Related Item Label which
 * will need to be filled in later.
 * 
 * @param map 
 * @param objects 
 */
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
        const metadata = item.metadata[identifier] || ''
        const size = field.repeatable ? metadata.split(defaultFieldDelemiter).length : -1
        const fileSize = item.files.filter(
          file => file.purpose === FilePurpose.Access && (isVideo(file.path) || isAudio(file.path))
        ).length

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
        if (avField.type) {
          fields.push({ label: `${avField.label} Type`, value: `${avField.identifier}.type.${index}` })
        }
        fields.push({ label: avField.label, value: `${avField.identifier}.${index}` })
      })
    }
    else {
      if (avField.identifier === 'dcterms.relation' && hasRelatedItems) {
        fields.push({ label: 'Related Item Label', value: `dcterms.relation.label` })
      }
      if (avField.type) {
        fields.push({ label: `${avField.label} Type`, value: `${avField.identifier}.type` })
      }
      fields.push({ label: avField.label, value: avField.identifier })
    }
  })
  fields.push({ label: 'other identifier Type', value: 'douuid.type' })
  fields.push({ label: 'other identifier', value: 'douuid' })

  const maxFiles = avalonFields.reduce((acc, curr) => {
    return acc.files > curr.files ? acc : curr
  }).files
  range(0, maxFiles).forEach((k, index) => {
    fields.push({ label: "File", value: `file.${index}` })
    fields.push({ label: "Label", value: `label.${index}` })
    fields.push({ label: "Offset", value: `offset.${index}` })
  })

  return fields
}

/**
 * Checks if the files is a vtt file based on file extension
 * @param path
 * @returns 
 */
function isVtt(path: string): boolean {
  const ext = extname(path).slice(1).toLowerCase()
  return ext === 'vtt'
}

/**
 * Checks if the files are a pdf based of file extension
 * @param path
 * @returns
 */
function isPdf(path: string): boolean {
  const ext = extname(path).slice(1).toLocaleLowerCase()
  return ext === 'pdf'
}