import {
  IObject,
  FilePurpose
} from '../project'
import { BcDamsMap } from '../map'
import { IProgress } from '../app-state'
import {
  basename,
  dirname
} from 'path'
import {
  exportFilename,
  copyProjectFile,
  getCsv,
  writeToFile
} from './export'
import { normalize } from '../path'
import * as mkdirp from 'mkdirp'
import filesize from 'filesize'


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
      const normalizedPath = normalize(file.path)
      const filename = exportFilename(item.do_ark, projectFilePath, basename(normalizedPath))
      const src = `${projectPath}/${file.path}`
      const part = `${dirname(normalizedPath)}/${filename}`
      const dest = `${filepath}/${part}`
      mkdirp.sync(dirname(dest))

      await copyProjectFile(src, dest, (progress) => {
        const size = filesize(progress.totalSize, { round: 1 })
        progressCallback({
          value: (count++) / total,
          description: `Exporting data for '${item.title}'`,
          subdescription: `Copying file: ${basename(normalizedPath)} (${size})`
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