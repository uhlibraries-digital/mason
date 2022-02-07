import {
  IObject,
  FilePurpose,
  filenameWithPurposeSuffix,
  ProcessingType
} from './project'
import {
  IConvertOptions,
  IConvertTypeOption,
  IProgress
} from './app-state'
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
import isImage from 'is-image'

export const createAccess = async (
  projectPath: string,
  objects: ReadonlyArray<IObject>,
  typeOption: IConvertTypeOption,
  progressCallback: (progress: IProgress) => void
): Promise<any> => {

  const processObjects = objects.filter((object) => {
    return object.processing_type === ProcessingType.Image
      || object.processing_type === ProcessingType.Text
  })
  const total = totalProcesses(processObjects)

  let counter = 0
  for (const item of processObjects) {
    const isText = item.processing_type === ProcessingType.Text
    const convertOptions: IConvertOptions = isText ? typeOption.text : typeOption.image
    const options = getOptions(convertOptions)

    /* add option for tile geometry for images */
    if (!isText) {
      options.push('-define')
      options.push(`tiff:tile-geometry=${convertOptions.tileSize}`)
    }
    else { /* add option to delete multiple layers for text */
      options.push('-delete')
      options.push('1--1')
    }

    const files = item.files.filter(file => file.purpose === FilePurpose.ModifiedMaster
      && isImage(file.path))
    for (const file of files) {
      const normalizePath = normalize(file.path)
      const accessFilename = filenameWithPurposeSuffix(normalizePath, FilePurpose.Access)
      const parsedPath = parse(accessFilename)
      const src = `${projectPath}/${normalizePath}`
      const dest = `${projectPath}/${dirname(normalizePath)}/${parsedPath.name}`

      const imgDestFilename = isText ? `${dest}.jpg` : `${dest}.tif`
      const imgDest = isText ? imgDestFilename : `ptif:${imgDestFilename}`

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
          options
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

const getOptions = (convertOptions: IConvertOptions): Array<string> => {
  const options = [
    '-colorspace',
    'sRGB',
    '-compress',
    'jpeg',
    '-quality',
    String(convertOptions.quality)
  ]

  if (convertOptions.profile !== '') {
    options.push('-profile')
    options.push(convertOptions.profile)
  }

  if (convertOptions.resizeEnabled) {
    options.push('-resize')
    options.push(`${convertOptions.resize}`)
  }
  if (convertOptions.resampleEnabled) {
    options.push('-units')
    options.push('PixelsPerInch')
    options.push('-resample')
    options.push(String(convertOptions.resample))
  }

  return options
}