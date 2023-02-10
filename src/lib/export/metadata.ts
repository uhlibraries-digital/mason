import {
  IObject,
  containerToString,
  containerToPath
} from '../project'
import { BcDamsMap } from '../map'
import { IProgress } from '../app-state'
import {
  getCsv,
  writeToFile
} from './export'
import { normalizeWithOS } from '../path'

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
  projectpath: string,
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
  fields.unshift({ label: 'ID', value: 'id' })
  fields.push({ label: 'Location', value: 'location' })
  fields.push({ label: 'File Location', value: 'filelocation'})

  const data = objects.map((item, index) => {
    progressCallback({
      value: index / objects.length,
      description: `Exporting data for '${item.title}'`
    })

    const metadata = {
      id: item.uuid,
      ...item.metadata,
      location: containerToString(item.containers[0]),
      filelocation: normalizeWithOS(`${projectpath}/Files/${containerToPath(item.containers[0])}`)
    }

    return metadata
  })

  progressCallback({
    value: undefined,
    description: 'Creating csv...'
  })

  const csvStr = getCsv(fields, data)
  return writeToFile(filepath, csvStr)
    .then(() => progressCallback({ value: 1 }))
}