import { IObject } from './project'
import { BcDamsMap } from './map'
import { IProgress } from './app-state'
import { Parser } from 'json2csv'
import { writeFile } from 'fs'



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

  const parser = new Parser({ fields })
  const csvStr = parser.parse(data)
  return writeToFile(filepath, csvStr)
    .then(() => progressCallback({ value: 1 }))
}

export const writeToFile = (filepath: string, data: string) => {
  return new Promise((resolve, reject) => {
    writeFile(filepath, data, 'utf8', (err) => {
      if (err) {
        return reject(err)
      }
      return resolve()
    })
  })
}