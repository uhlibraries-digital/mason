import {
  IObject,
  containerToPath
} from './project'
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