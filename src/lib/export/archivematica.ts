import {
  IObject,
  FilePurpose,
  IFile
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
  writeToFile,
  getCsv,
  IFileCopyProgress
} from './export'
import { padLeft } from '../string'
import { normalize } from '../path'
import { deepCopy } from '../copy'
import filesize from 'filesize'
import * as mkdirp from 'mkdirp'

/**
 * Export preservation SIPs for Archivematica
 * 
 * @param objects 
 * @param map 
 * @param filepath 
 * @param projectFilePath 
 * @param progressCallback 
 */
export async function exportPreservationSips(
  aic: string,
  objects: ReadonlyArray<IObject>,
  map: ReadonlyArray<BcDamsMap> | null,
  collectionUrl: string,
  collectionTitle: string,
  filepath: string,
  projectFilePath: string,
  progressCallback: (progress: IProgress) => void
): Promise<any> {

  if (!map) {
    return Promise.reject(new Error('No preservation map defined'))
  }

  progressCallback({ value: undefined, description: 'Preparing package' })

  const newObjects = deepCopy(objects) as ReadonlyArray<IObject>
  const found = collectionUrl.match(/ark:\/\d+\/.*$/)
  const collectionArk = found ? found[0] : ''

  let total = 0
  let counter = 0
  const pmObjects = newObjects.filter((item) => {
    const fileCount = item.files.filter(file => file.purpose === FilePurpose.Preservation).length
    const subFileCount = item.files.filter(file => file.purpose === FilePurpose.SubmissionDocumentation).length
    total += fileCount + (fileCount > 0 ? subFileCount : 0)
    return fileCount !== 0
  })
  total += pmObjects.length

  const fields = [{ label: 'parts', value: 'parts' }]
    .concat(
      map.map((field) => {
        return { label: `${field.namespace}.${field.name}`, value: `${field.namespace}.${field.name}` }
      })
    )
    .concat([
      { label: 'uhlib.doUuid', value: 'uhlib.doUuid' },
      { label: 'partOfAIC', value: 'partOfAIC' }
    ])

  for (const index in pmObjects) {
    const item = pmObjects[index]
    const sipDirName = sipDirectory(item, index)
    const path = `${filepath}/${basename(filepath)}_${sipDirName}`

    progressCallback({
      value: (counter++) / total,
      description: `Exporting data for '${item.title}'`
    })

    mkdirp.sync(`${path}/metadata/submissionDocumentation`)
    mkdirp.sync(`${path}/objects/${sipDirName}`)
    mkdirp.sync(`${path}/logs`)

    item.metadata['dcterms.identifier'] = item.pm_ark
    item.metadata['dcterms.isPartOf'] = collectionArk
    item.metadata['uhlib.note'] = collectionTitle

    const data = [{
      'parts': `objects/${sipDirName}`,
      ...item.metadata,
      'uhlib.doUuid': item.uuid,
      'partOfAIC': aic
    }]

    const csv = getCsv(fields, data)
    await writeToFile(`${path}/metadata/metadata.csv`, csv)

    const pmFiles = item.files.filter(file => file.purpose === FilePurpose.Preservation)
    const subFiles = item.files.filter(file => file.purpose === FilePurpose.SubmissionDocumentation)

    for (const file of pmFiles) {
      await copyPreservationFile(
        item,
        file,
        `${path}/objects/${sipDirName}`,
        projectFilePath,
        (progress) => {
          const size = filesize(progress.totalSize, { round: 1 })
          progressCallback({
            value: (counter++) / total,
            description: `Exporting data for '${item.title}'`,
            subdescription: `Copying preservation file: ${basename(file.path)} (${size})`
          })
        })
    }

    for (const file of subFiles) {
      await copyPreservationFile(
        item,
        file,
        `${path}/metadata/submissionDocumentation`,
        projectFilePath,
        (progress) => {
          const size = filesize(progress.totalSize, { round: 1 })
          progressCallback({
            value: (counter++) / total,
            description: `Exporting data for '${item.title}'`,
            subdescription: `Copying submission document file: ${basename(file.path)} (${size})`
          })
        })
    }

  }

  const totalFiles = total - pmObjects.length
  progressCallback({
    value: 1,
    description: `Exported ${pmObjects.length} objects and ${totalFiles} files`
  })

  return Promise.resolve()
}

async function copyPreservationFile(
  item: IObject,
  file: IFile,
  filepath: string,
  projectFilePath: string,
  progressCallback: (progress: IFileCopyProgress) => void
): Promise<any> {
  const normalizedPath = normalize(file.path)
  const projectPath = dirname(projectFilePath)
  const filename = exportFilename(item.do_ark, projectFilePath, basename(normalizedPath))
  const src = `${projectPath}/${normalizedPath}`
  const dest = `${filepath}/${filename}`
  await copyProjectFile(src, dest, (progress) => {
    progressCallback(progress)
  })
}

/**
 * Returns a the directory name used for the SIP package
 * 
 * @param item 
 * @param index 
 */
function sipDirectory(item: IObject, index: number | string): string {
  return item.pm_ark ? String(item.pm_ark.split('/').slice(-1)) :
    padLeft(index, 3, '0')
}