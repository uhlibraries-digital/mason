import { v4 } from 'uuid'
import { padLeft } from './string'
import {
  writeFile,
  readFile,
  renameSync,
  copyFile,
  readdir,
  access,
  constants,
  existsSync,
  readdirSync
} from 'fs'
import mkdirp from 'mkdirp'
import { basename, parse, dirname } from 'path'
import {
  BcDamsMap,
  BcDamsMapObligation,
  defaultFieldDelemiter
} from './map'
import { IVocabularyMapRange, IVocabulary } from './vocabulary'
import { ArchivesSpaceArchivalObject, ArchivesSpaceContainer } from './stores/archives-space-store'

const edtf = require('edtf')

export enum ProjectType {
  Archival = "findingaid",
  NonArchival = "standard"
}

export enum FilePurpose {
  Preservation = "preservation",
  Access = "access-copy",
  ModifiedMaster = "modified-master",
  SubmissionDocumentation = "sub-documents"
}

export interface IProject {
  type: ProjectType
  resource: string
  collectionTitle: string
  collectionArkUrl: string
  aic: string
  objects: ReadonlyArray<IObject>
}

export interface IObject {
  uuid: string
  artificial: boolean
  title: string
  dates: ReadonlyArray<string>
  containers: ReadonlyArray<IContainer>
  level: string
  uri: string | null
  parent_uri: string | null
  productionNotes: string
  do_ark: string
  pm_ark: string
  metadata: any
  files: ReadonlyArray<IFile>
}

export interface IContainer {
  top_container: ITopContainer | null
  type_1: string | null
  indicator_1: string | null
  type_2: string | null
  indicator_2: string | null
  type_3: string | null
  indicator_3: string | null
}

export interface ITopContainer {
  ref: string
}

export interface IFile {
  path: string
  purpose: FilePurpose
}

export function newObject(index: number, artificial: boolean = false): IObject {
  const title = `Item ${padLeft(index, 3, '0')}`

  return {
    uuid: v4(),
    artificial: artificial,
    title: title,
    dates: [],
    containers: [{
      top_container: null,
      type_1: 'Item',
      indicator_1: String(index),
      type_2: null,
      indicator_2: null,
      type_3: null,
      indicator_3: null
    }],
    level: 'item',
    uri: null,
    parent_uri: null,
    productionNotes: '',
    do_ark: '',
    pm_ark: '',
    metadata: {
      'dcterms.title': title
    },
    files: []
  }
}

export function newArchivalObject(
  archivalObject: ArchivesSpaceArchivalObject,
  containers: ReadonlyArray<ArchivesSpaceContainer>
): IObject {

  const dates = archivalObject.dates
    .filter(d => d.begin || d.end)
    .map(d => `${d.begin}${(d.end ? `/${d.end}` : '')}`)
  const dateStr = dates.join(defaultFieldDelemiter)

  return {
    uuid: v4(),
    artificial: false,
    title: archivalObject.title,
    dates: dates,
    containers: containers,
    level: archivalObject.level,
    uri: archivalObject.uri,
    parent_uri: null,
    productionNotes: '',
    do_ark: '',
    pm_ark: '',
    metadata: {
      'dcterms.title': archivalObject.title,
      'dc.date': dateStr,
      'uhlib.aSpaceUri': archivalObject.uri
    },
    files: []
  }
}

export const nextItemNumberFromContainer = (container: IContainer) => {
  if (container.type_3 && container.type_3.toLowerCase() === 'item') {
    return Number(container.indicator_3) + 1 || 1
  }
  else if (container.type_2 && container.type_2.toLowerCase() === 'item') {
    return Number(container.indicator_2) + 1 || 1
  }
  else if (container.type_1 && container.type_1.toLowerCase() === 'item') {
    return Number(container.indicator_1) + 1 || 1
  }

  return 1
}

export const addToContainer = (container: IContainer, type: string, indicator: string) => {
  const newContainer = { ...container }
  if (!container.type_1) {
    newContainer.type_1 = type
    newContainer.indicator_1 = indicator
  }
  else if (!container.type_2) {
    newContainer.type_2 = type
    newContainer.indicator_2 = indicator
  }
  else if (!container.type_3) {
    newContainer.type_3 = type
    newContainer.indicator_3 = indicator
  }

  return newContainer
}

export const containerToString = (container: IContainer | null) => {
  if (!container) {
    return ''
  }

  return `${container.type_1} ${container.indicator_1}` +
    (container.type_2 ? `, ${container.type_2} ${container.indicator_2}` : '') +
    (container.type_3 ? `, ${container.type_3} ${container.indicator_3}` : '')
}

export const containerToPath = (container: IContainer | null) => {
  if (!container) {
    return ''
  }

  const path = `${container.type_1}_${padLeft(container.indicator_1, 3, '0')}/` +
    (container.type_2 ?
      `${container.type_2}_${padLeft(container.indicator_2, 3, '0')}/`
      : '') +
    (container.type_3 ?
      `${container.type_3}_${padLeft(container.indicator_3, 3, '0')}/`
      : '')

  return path.replace(' ', '_')
}

export function renameTitleAndContainer(item: IObject, indicator: number): IObject {
  const newItem: IObject = JSON.parse(JSON.stringify(item))
  if (!newItem.title || newItem.title.match(/^Item \d+$/)) {
    const title = `Item ${padLeft(indicator, 3, '0')}`
    newItem.title = title
    newItem.metadata['dcterms.title'] = title
  }

  const containers = Array.from(newItem.containers)
  const container = containers[0]
  if (container.type_1 && container.type_1.toLowerCase() === 'item') {
    containers[0].indicator_1 = String(indicator)
  }
  else if (container.type_2 && container.type_2.toLowerCase() === 'item') {
    containers[0].indicator_2 = String(indicator)
  }
  else if (container.type_3 && container.type_3.toLowerCase() === 'item') {
    containers[0].indicator_3 = String(indicator)
  }
  newItem.containers = containers

  return newItem
}

export const saveProject = (filepath: string, project: IProject) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(project)
    writeFile(filepath, data, 'utf8', (err) => {
      if (err) {
        return reject(err)
      }
      return resolve()
    })
  })
}

export const openProject = (filepath: string) => {
  return new Promise((resolve, reject) => {
    readFile(filepath, 'utf8', (err, data) => {
      if (err) {
        return reject(err)
      }
      try {
        const project = JSON.parse(data) as IProject
        return resolve(project)
      }
      catch (err) {
        return reject(err)
      }
    })
  })
}

export async function createContainerFilesystem(
  projectpath: string,
  objects: ReadonlyArray<IObject>
) {
  if (projectpath === '') {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    objects.map((item) => {
      createObjectContainerFilesystem(projectpath, item)
    })
  })
}

export async function createObjectContainerFilesystem(
  projectpath: string,
  item: IObject
) {
  if (projectpath === '') {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const path = containerToPath(item.containers[0])
    access(`${projectpath}/Files/${path}`, constants.F_OK, (err) => {
      if (err) {
        mkdirp(`${projectpath}/Files/${path}`, (err) => {
          return err ? reject() : resolve()
        })
      }
    })
  })
}

export async function readContainerFilesystem(
  projectpath: string,
  container: IContainer
): Promise<any> {

  return new Promise((resolve, reject) => {
    if (projectpath === '') {
      return resolve([])
    }

    const containerPath = containerToPath(container)
    const path = `${projectpath}/Files/${containerPath}`

    readdir(path, (err, files) => {
      if (err) {
        console.warn(err)
        return resolve([])
      }

      const newFiles: ReadonlyArray<IFile> = files
        .filter((file) => {
          return file.slice(0, 1) !== '.' && file !== 'Thumbs.db'
        })
        .map((file) => {
          return {
            path: `/Files/${containerPath}${file}`,
            purpose: purposeFromFilename(file)
          }
        })

      return resolve(newFiles)
    })
  })
}

export const fileExists = (path: string, files: ReadonlyArray<IFile>) => {
  const fileExist = files.findIndex((file) => {
    return file.path === path
  })
  return fileExist !== -1
}

export const moveFileToContainer = (
  src: string,
  container: IContainer,
  projectpath: string
) => {

  return new Promise((resolve, reject) => {
    if (projectpath === '') {
      const err = new Error("Can't move file because project is not saved, please save and try again")
      return reject(err)
    }

    const containerPath = `${projectpath}/Files/${containerToPath(container)}`
    access(containerPath, constants.F_OK, (err) => {
      if (err) {
        const directoryErr = new Error(`Directory does not exist '${containerPath}'. Try saving the project and try again.`)
        return reject(directoryErr)
      }
      const destPath = `${containerPath}${basename(src)}`
      try {
        renameSync(src, destPath)
      }
      catch (err) {
        if (err.message.indexOf("cross-device link not permitted") !== -1) {
          copyFile(src, destPath, (err) => {
            if (err) {
              return reject(err)
            }
            resolve()
          })
        }
        return reject(err)
      }
      resolve(destPath)
    })
  })

}

export const moveFile = (src: string, dest: string) => {
  return new Promise((resolve, reject) => {
    access(dest, constants.F_OK, (err) => {
      if (!err) {
        return reject(new Error(`File '${dest}' already exists`))
      }
      try {
        renameSync(src, dest)
      } catch (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

export const filenameWithPurposeSuffix = (
  file: IFile | string,
  purpose?: FilePurpose
) => {
  const parsedPath = (typeof file === 'string') ? parse(file) : parse(file.path)
  const filePurpose = (typeof file === 'string') ? purpose : file.purpose
  const filenamePurpose = parsedPath.name.substr(-3)
  let newFilename = (filenamePurpose === '_pm' || filenamePurpose === '_mm' || filenamePurpose == '_ac') ?
    parsedPath.name.slice(0, -3) :
    parsedPath.name

  if (filePurpose === FilePurpose.Preservation) {
    newFilename += '_pm'
  }
  if (filePurpose === FilePurpose.ModifiedMaster) {
    newFilename += '_mm'
  }
  if (filePurpose === FilePurpose.Access) {
    newFilename += '_ac'
  }

  return `${newFilename}${parsedPath.ext}`
}

export const renameWithPurposeSuffix = (
  src: string,
  purpose: FilePurpose
) => {
  return new Promise((resolve, reject) => {
    const newFilename = filenameWithPurposeSuffix(src, purpose)
    const dest = `${dirname(src)}/${newFilename}`
    try {
      renameSync(src, dest)
    }
    catch (err) {
      return reject(err)
    }
    resolve()
  })
}

export const purposeFromFilename = (filename: string) => {
  const parsedPath = parse(filename)
  const filenamePurpose = parsedPath.name.substr(-3)

  switch (filenamePurpose) {
    case '_pm':
      return FilePurpose.Preservation
    case '_mm':
      return FilePurpose.ModifiedMaster
    case '_ac':
      return FilePurpose.Access
  }

  return FilePurpose.SubmissionDocumentation
}

export const orphanFile = (src: string, projectpath: string) => {
  return new Promise((resolve, reject) => {
    if (projectpath === '') {
      return resolve()
    }

    const path = src.replace(`${projectpath}/Files/`, '')
    const orphanPath = `${projectpath}/Orphaned/${path}`
    mkdirp.sync(dirname(orphanPath))
    try {
      renameSync(src, orphanPath)
    } catch (err) {
      return reject(err)
    }
    resolve()
  })
}

export const orphanObject = (item: IObject, projectpath: string) => {
  return new Promise((resolve, reject) => {
    if (projectpath === '') {
      return resolve()
    }

    const orphanPath = `${projectpath}/Orphaned/`
    const containerPath = containerToPath(item.containers[0])
    const src = `${projectpath}/Files/${containerPath}`

    mkdirp.sync(orphanPath)

    let dest = `${orphanPath}${containerPath}`
    const orgDest = dest
    let destCounter = 1
    while (existsSync(dest)) {
      dest = `${orgDest.slice(0, -1)}-${destCounter++}/`
    }

    try {
      renameSync(src, dest)
    } catch (err) { }

    resolve()
  })
}

export const filesChanged = (
  a: ReadonlyArray<IFile>,
  b: ReadonlyArray<IFile>
) => {
  if (a.length !== b.length) {
    return true
  }

  for (let objectA of a) {
    const found = b.find((objectB) => {
      return objectB.path === objectA.path
    })
    if (!found) {
      return true
    }
  }

  return false
}

export const updateFileAssignment = (items: ReadonlyArray<IObject>, projectpath: string) => {
  return new Promise((resolve, reject) => {
    if (projectpath === '') {
      return reject(new Error('No project path found. Please save and try again'))
    }
    return resolve(
      items.map((item) => {
        const filepath = `/Files/${containerToPath(item.containers[0])}`
        const fullpath = `${projectpath}${filepath}`
        try {
          const dirFiles = readdirSync(fullpath)
          const files = dirFiles.filter((name) => {
            return (!(/(^|\/)\.[^\/\.]/g).test(name)) && name !== 'Thumbs.db'
          })
            .map((name) => {
              const file: IFile = {
                path: `${filepath}/${name}`,
                purpose: purposeFromFilename(name)
              }
              return file
            })
          item.files = files

          return files
        } catch (err) {
          return reject(err)
        }
      })
    )
  })
}

export function updateContainerLocation(
  item: IObject,
  location: number,
  projectpath: string,
): IObject {
  const newItem = renameTitleAndContainer(item, location)

  if (projectpath === '') {
    return newItem
  }

  const oldPath = `${projectpath}/Files/${containerToPath(item.containers[0])}`
  const newPath = `${projectpath}/Files/${containerToPath(newItem.containers[0])}`

  if (existsSync(newPath)) {
    throw new Error(`Directory '${newPath}' already exists`)
  }

  try {
    renameSync(oldPath, newPath)
  } catch (err) {
    throw err
  }
  newItem.files.map((file) => {
    file.path = `${newPath}${basename(file.path)}`
  })


  return newItem
}

export const isValidObject = (
  item: IObject,
  accessMap: ReadonlyArray<BcDamsMap> | null,
  vocabularyRanges: ReadonlyArray<IVocabularyMapRange>
) => {

  if (!accessMap) {
    return true
  }

  const badFields = accessMap.filter((field) => {
    const identifier = `${field.namespace}.${field.name}`
    const value = item.metadata[identifier] || ''

    if (field.obligation === BcDamsMapObligation.Required) {
      if (value === '') {
        return true
      }
    }

    const range = vocabularyRanges.find((node) => {
      return node.prefLabel.toLowerCase() === field.range[0].label.toLowerCase()
    })
    if (field.repeatable) {
      const values = value.split(defaultFieldDelemiter)
      const badValues = values.filter((value: string) => {
        if (identifier === 'dc.date') {
          return !isValidDate(value)
        }
        return range ? !isValidValue(value, range.nodes) : false
      })
      if (badValues.length) {
        return true
      }
    }
    else if (identifier === 'dc.date') {
      return !isValidDate(value)
    }

    return range ? !isValidValue(value, range.nodes) : false
  })

  return badFields.length === 0
}

export const isValidValue = (value: string, nodes: ReadonlyArray<IVocabulary>) => {
  if (value === '') {
    return true
  }
  const foundRange = nodes.find((range) => {
    return range.prefLabel.toLowerCase() === value.toLowerCase()
  })
  return foundRange !== undefined
}

export const isValidDate = (dateString: string) => {
  if (dateString === '') {
    return true
  }
  try {
    edtf(dateString)
  } catch (e) {
    return false
  }
  return true
}