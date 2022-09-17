import {
  IObject,
  FilePurpose
} from '../project'
import {
  BcDamsMap
} from '../map'
import { IProgress } from '../app-state'
import {
  basename,
  dirname
} from 'path'
import {
  exportFilename,
  copyProjectFile,
  rightsToUri,
  writeToFile,
  getCsv
} from './export'
import { normalize } from '../path'
import { deepCopy } from '../copy'
import filesize from 'filesize'
import * as mkdirp from 'mkdirp'


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

  const newObjects = deepCopy(objects) as ReadonlyArray<IObject>

  let total = 0
  let counter = 0
  const acObjects = newObjects.filter((item) => {
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
    item.metadata['dc.rights'] = rightsToUri(item.metadata['dc.rights'])
    data.push({
      ...item.metadata,
      "object_type": item.metadata['dcterms.type'] || 'Generic',
      'douuid': item.uuid
    })

    const files = item.files.filter(file => file.purpose === FilePurpose.Access)
    for (const file of files) {
      const normalizedPath = normalize(file.path)
      const filename = exportFilename(item.do_ark, projectFilePath, basename(normalizedPath))
      const src = `${projectPath}/${file.path}`
      const dest = `${filepath}/${filename}`
      await copyProjectFile(src, dest, (progress) => {
        const size = filesize(progress.totalSize, { round: 1 })
        progressCallback({
          value: (counter++) / total,
          description: `Exporting data for '${item.title}'`,
          subdescription: `Copying file: ${basename(normalizedPath)} (${size})`
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