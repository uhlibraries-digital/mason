import {
  IObject,
  FilePurpose,
  filenameWithPurposeSuffix
} from './project'
import {
  IConvertSetting,
  IConvertTypeSetting,
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

export const createAccess = async (
  projectPath: string,
  objects: ReadonlyArray<IObject>,
  settings: IConvertTypeSetting,
  progressCallback: (progress: IProgress) => void
): Promise<any> => {

  const processObjects = Array.from(objects)
  const total = totalProcesses(processObjects)

  let counter = 0
  for (const item of processObjects) {
    const isText = item.text
    const setting: IConvertSetting = isText ? settings.text : settings.image
    const options = getOptions(setting)

    /* add option for tile geometry for images */
    if (!isText) {
      options.push('-define')
      options.push(`tiff:tile-geometry=${setting.tileSize}`)
    }

    const files = item.files.filter(file => file.purpose === FilePurpose.ModifiedMaster)
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

const getOptions = (setting: IConvertSetting): Array<string> => {
  const options = [
    '-colorspace',
    'sRGB',
    '-compress',
    'jpeg',
    '-quality',
    String(setting.quality)
  ]

  if (setting.profile !== '') {
    options.push('-profile')
    options.push(setting.profile)
  }

  if (setting.resizeEnabled) {
    options.push('-resize')
    options.push(`${setting.resize}%`)
  }
  if (setting.resampleEnabled) {
    options.push('-units')
    options.push('PixelsPerInch')
    options.push('-resample')
    options.push(String(setting.resample))
  }

  return options
}