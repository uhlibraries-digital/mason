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

  const processObjects = objects.filter((item) => {
    const type = (item.metadata['dcterms.type'] || '').toLowerCase()
    return type === 'image' || type === 'text'
  })
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
    const type = item.metadata['dcterms.type'].toLowerCase()

    const files = item.files.filter(file => file.purpose === FilePurpose.ModifiedMaster)
    for (const file of files) {
      const normalizePath = normalize(file.path)
      const accessFilename = filenameWithPurposeSuffix(normalizePath, FilePurpose.Access)
      const parsedPath = parse(accessFilename)
      const src = `${projectPath}/${normalizePath}`
      const dest = `${projectPath}/${dirname(normalizePath)}/${parsedPath.name}.tif`

      const imgSrc = __WIN32__ ? `"${src}"` : src
      const imgDest = __WIN32__ ? `"${dest}"` : dest

      if (type === 'image') {
        progressCallback({
          value: (counter++) / total,
          description: `Processing '${item.title}'`,
          subdescription: `Converting '${basename(src)}'`
        })
        try {
          await convertImage(
            imgSrc,
            `ptif:${imgDest}`,
            options.concat(['-define', `tiff:tile-geometry=${tileSize}`])
          )
        } catch (e) {
          return Promise.reject(new Error(`${e.message}`))
        }
      }
    }
  }

  progressCallback({
    value: 1,
    description: `Completed converting ${total} files across ${processObjects.length} objects`
  })

  return Promise.resolve()
}

const convertImage = async (
  src: string,
  dest: string,
  options: ReadonlyArray<string>,
): Promise<any> => {

  return convert(src, dest, options)
}

const totalProcesses = (objects: ReadonlyArray<IObject>) => {
  const total = objects.map((item) => {
    const files = item.files.filter(file => file.purpose === FilePurpose.ModifiedMaster)
    return files.length
  })
    .reduce((a, b) => a + b, 0)

  return total
}