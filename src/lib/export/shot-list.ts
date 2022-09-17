import {
  getCsv,
  writeToFile
} from './export'
import {
  IObject,
  containerToPath
} from '../project'
import { IProgress } from '../app-state'


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