import { extname } from 'path'
import { IObject } from './project'
import { readFile } from 'fs'
import { BcDamsMap } from './map'
import parseXlsx from 'excel'
import { parse } from 'csv-parse'

interface IRecord {
  [key: string]: string
}

export async function importMetadata (
  filepath: string,
  objects: ReadonlyArray<IObject>,
  map: ReadonlyArray<BcDamsMap> | null
): Promise<ReadonlyArray<IObject>> {
    if (objects.length === 0) {
      return Promise.reject(new Error('Sorry, please open the project this metadata belongs to first.'))
    }
    if (!map) {
      return Promise.reject(new Error('Access MAP is not set. Please check your settings.'))
    }
    
    const newObjects = Array.from(objects)
    const records = await parseFile(filepath)
    console.log('records', records)

    if (!records) {
      return Promise.reject(new Error('Unsupported file type or no metadata to import.'))
    }
    
    for(const record of records) {
      if (!('ID' in record)) {
        return Promise.reject(new Error("This doesn't appear to be a metadata file from a existing project."))
      }

      const indx = newObjects.findIndex(obj => obj.uuid === record['ID'])
      if (indx === -1) {
        return Promise.reject(new Error(`Can't find object to update in project file. "${record['Title']}" has a invalid ID.`))
      }

      for(const [label, value] of Object.entries(record)) {
        const mapField = fieldByLabel(label, map)
        if (mapField) {
          const namespace = `${mapField.namespace}.${mapField.name}`
          newObjects[indx].metadata[namespace] = value
        }
      }
    }

    return Promise.resolve(newObjects)
}

const isCsv = (path: string): boolean => {
  const ext = extname(path).slice(1).toLowerCase()
  return ext === 'csv'
}

const isExcel = (path: string): boolean => {
  const ext = extname(path).slice(1).toLowerCase()
  return ext === 'xlsx'
}

async function parseFile(path: string): Promise<ReadonlyArray<IRecord> | null> {
  if (isCsv(path)) {
    return parseCsv(path)
  }
  if (isExcel(path)) {
    return parseExcel(path)
  }
  return Promise.resolve(null)
}

async function parseCsv(path: string): Promise<ReadonlyArray<IRecord>> {
  return new Promise((resolve, reject) => {
    readFile(path, 'utf8', (err, data) => {
      if (err) {
        return reject(err)
      }
      const parser = parse({
        columns: true,
        skip_empty_lines: true
      })

      let records: Array<IRecord> = []
      parser
        .on('readable', () => {
          let record: IRecord
          while((record = parser.read()) !== null) {
            records.push(record)
          }
        })
        .on('error', (err) => {
          return reject(err)
        })
        .on('end', () => {
          return resolve(records)
        })

      parser.write(data)
      parser.end()
    })
  })
}

async function parseExcel(path: string): Promise<ReadonlyArray<IRecord>> {
  return new Promise((resolve, reject) => {
    parseXlsx(path)
      .then((data: any) => {
        let records: Array<IRecord> = []
        const keys = data.shift() as Array<string>
        data.forEach((row: any) => {
          let record: IRecord = {}
          row.forEach((cell: any, index: number) => {
            const key = keys[index]
            record[key] = cell
          })
          records.push(record)
        })
        return resolve(records)
      })
      .catch((err: any) => {
        return reject(err)
      })
  })
}

const fieldByLabel = (label: string, map: ReadonlyArray<BcDamsMap>): BcDamsMap | undefined => {
  return map.find(field => field.label.toLowerCase() === label.toLowerCase())
}