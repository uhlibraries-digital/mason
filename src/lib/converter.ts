import {
  IObject,
  FilePurpose,
  filenameWithPurposeSuffix
} from './project'
import { IProgress } from './app-state'
import { normalize } from './path'
import {
  dirname,
  parse,
  basename
} from 'path'
import {
  convert
} from './imagemagick'
import {
  existsSync,
  unlinkSync
} from 'fs'

export const createAccess = async (
  projectPath: string,
  objects: ReadonlyArray<IObject>,
  profile: string,
  quality: number,
  resize: number | boolean,
  resample: number | boolean,
  tileSize: string,
  progressCallback: (progress: IProgress) => void
): Promise<any> => {

  const processObjects = Array.from(objects)
  const total = totalProcesses(processObjects)

  const options = [
    '-colorspace',
    'sRGB',
    '-compress',
    'jpeg',
    '-quality',
    String(quality)
  ]

  if (profile !== '') {
    options.push('-profile')
    options.push(profile)
  }

  if (resize) {
    options.push('-resize')
    options.push(`${resize}%`)
  }
  if (resample) {
    options.push('-units')
    options.push('PixelsPerInch')
    options.push('-resample')
    options.push(String(resample))
  }

  let counter = 0
  for (const item of processObjects) {
    const isText = item.text

    const files = item.files.filter(file => file.purpose === FilePurpose.ModifiedMaster)
    for (const file of files) {
      const normalizePath = normalize(file.path)
      const accessFilename = filenameWithPurposeSuffix(normalizePath, FilePurpose.Access)
      const parsedPath = parse(accessFilename)
      const src = `${projectPath}/${normalizePath}`
      const dest = `${projectPath}/${dirname(normalizePath)}/${parsedPath.name}`

      const imgDestFilename = (!isText) ? `${dest}.tif` : `${dest}.jpg`
      const imgDest = (!isText) ? `ptif:${imgDestFilename}` : imgDestFilename
      const imgOptions = (!isText) ? options.concat(['-define', `tiff:tile-geometry=${tileSize}`])
        : options

      progressCallback({
        value: (counter++) / total,
        description: `Processing '${item.title}'`,
        subdescription: `Converting '${basename(src)}' to '${basename(imgDest)}'`
      })

      if (existsSync(imgDestFilename)) {
        try {
          unlinkSync(imgDestFilename)
        } catch (e) {
          console.warn(`Couldn't delete ${imgDestFilename}, letting ImageMagick overwrite: ${e.message}`)
        }
      }

      try {
        await convert(
          src,
          imgDest,
          imgOptions
        )
      } catch (e) {
        return Promise.reject(new Error(`${e.message}`))
      }
    }
  }

  progressCallback({
    value: 1,
    description: `Completed converting ${total} files across ${processObjects.length} objects`
  })

  return Promise.resolve()
}

const totalProcesses = (objects: ReadonlyArray<IObject>) => {
  const total = objects.map((item) => {
    const files = item.files.filter(file => file.purpose === FilePurpose.ModifiedMaster)
    return files.length
  })
    .reduce((a, b) => a + b, 0)

  return total
}