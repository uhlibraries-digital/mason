import {
  IObject,
  containerToString
} from '../project'
import { BcDamsMap } from '../map'
import { IProgress } from '../app-state'
import {
  getCsv,
  writeToFile
} from './export'

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
  fields.push({ label: 'Location', value: 'location' })

  const data = objects.map((item, index) => {
    progressCallback({
      value: index / objects.length,
      description: `Exporting data for '${item.title}'`
    })

    const metadata = {
      ...item.metadata,
      location: containerToString(item.containers[0])
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