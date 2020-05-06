import {
  IAppState,
  Popup,
  IPreferences,
  PopupType,
  IActivity,
  IUpdateState
} from '../app-state'
import { TypedBaseStore } from './base-store'
import {
  MapStore,
  VocabularyStore
} from '../stores'
import { remote, ipcRenderer } from 'electron'
import {
  IProject,
  ProjectType,
  IObject,
  IFile,
  newObject,
  saveProject,
  openProject,
  createContainerFilesystem,
  FilePurpose,
  fileExists,
  containerToPath,
  filenameWithPurposeSuffix,
  moveFileToContainer,
  renameWithPurposeSuffix,
  orphanFile,
  readContainerFilesystem,
  filesChanged,
  moveFile,
  updateContainerLocation,
  createObjectContainerFilesystem,
  orphanObject
} from '../project'
import {
  prefLabel,
  IVocabulary,
  IVocabularyMapRange
} from '../vocabulary'
import { dirname, basename } from 'path'
import { shell } from '../app-shell'
import { electronStore } from './electron-store'
import { ArchivesSpaceStore, IArchivesSpaceStoreState } from './archives-space-store'
import { BcDamsMap } from '../map'

/* Global constants */

const defaultSidebarWidth: number = 200

const defaultPreferences: IPreferences = {
  aspace: {
    publicUrl: '',
    apiEndpoint: '',
    username: ''
  },
  map: {
    preservationUrl: '',
    accessUrl: ''
  },
  minter: {
    endpoint: '',
    preservationPrefix: '',
    accessPrefix: '',
    apiKey: '',
    ercWho: ''
  },
  vocabulary: {
    url: ''
  }
}

const defaultProject: IProject = {
  type: ProjectType.NonArchival,
  resource: '',
  collectionArkUrl: '',
  collectionTitle: 'Untitled',
  aic: '',
  objects: []
}


export class AppStore extends TypedBaseStore<IAppState> {

  private emitQueued = false

  private currentPopup: Popup | null = null
  private errors: ReadonlyArray<Error> = new Array<Error>()
  private activities: ReadonlyArray<IActivity> = new Array<IActivity>()
  private preferences: IPreferences = defaultPreferences
  private savedState: boolean = false
  private project: IProject = defaultProject
  private sidebarWidth: number = defaultSidebarWidth
  private selectedObject: IObject | null = null
  private selectedObjectUuid: string = ''
  private selectedObjects: ReadonlyArray<string> = []
  private projectFilePath: string = ''
  private projectPath: string = ''
  private isUpdateAvailable: boolean = false
  private updateState: IUpdateState | null = null
  private accessMap: ReadonlyArray<BcDamsMap> | null = null
  private vocabulary: ReadonlyArray<IVocabulary> = []
  private vocabularyRanges: ReadonlyArray<IVocabularyMapRange> = []

  private readonly archivesSpaceStore: ArchivesSpaceStore
  private readonly mapStore: MapStore
  private readonly vocabStore: VocabularyStore

  public constructor(
    archivesSpaceStore: ArchivesSpaceStore
  ) {
    super()

    this.archivesSpaceStore = archivesSpaceStore
    this.mapStore = new MapStore()
    this.vocabStore = new VocabularyStore()

    this.wireupStoreEventHandlers()
  }

  private wireupStoreEventHandlers() {
    this.archivesSpaceStore.onDidUpdate(data =>
      this.onArchivesSpaceStoreUpdated(data)
    )

    this.mapStore.onDidError(err => this._pushError(err))
    this.mapStore.onDidUpdate(() => {
      this.accessMap = this.mapStore.getAccessMap()
      this.loadVocabularyRangesFromMap()
    })

    this.vocabStore.onDidError((err) => {
      this._clearActivity('vocabulary')
      this._pushError(err)
    })
    this.vocabStore.onDidUpdate(() => {
      this.vocabulary = this.vocabStore.getVocabulary()
      this.loadVocabularyRangesFromMap()
      this._clearActivity('vocabulary')
    })

  }

  protected emitUpdate() {
    if (this.emitQueued) {
      return
    }
    this.emitQueued = true
    this.emitUpdateNow()
  }

  private emitUpdateNow() {
    this.emitQueued = false
    const state = this.getState()
    super.emitUpdate(state)
  }

  public getState(): IAppState {
    return {
      currentPopup: this.currentPopup,
      errors: this.errors,
      activities: this.activities,
      preferences: this.preferences,
      savedState: this.savedState,
      project: this.project,
      sidebarWidth: this.sidebarWidth,
      selectedObject: this.selectedObject,
      selectedObjectUuid: this.selectedObjectUuid,
      selectedObjects: this.selectedObjects,
      projectFilePath: this.projectFilePath,
      projectPath: this.projectPath,
      isUpdateAvailable: this.isUpdateAvailable,
      accessMap: this.accessMap,
      updateState: this.updateState,
      vocabulary: this.vocabulary,
      vocabularyRanges: this.vocabularyRanges
    }
  }

  public async loadInitialState() {
    this.preferences = JSON.parse(
      String(electronStore.get('preferences', 'null'))
    ) as IPreferences

    if (!this.preferences) {
      this.preferences = defaultPreferences
      this._showPopup({ type: PopupType.Preferences })
    }

    this.mapStore.setMapUrls(
      this.preferences.map.preservationUrl,
      this.preferences.map.accessUrl
    )

    this._updateVocabulary()
    this.vocabulary = this.vocabStore.getVocabulary()

    this.sidebarWidth = parseInt(String(electronStore.get('sidebarWidth')), 10) ||
      defaultSidebarWidth

    this.emitUpdateNow()
  }

  public loadVocabularyRangesFromMap() {
    if (!this.accessMap || !this.vocabulary) {
      return
    }

    this.accessMap.map((field) => {
      const fieldRange = field.range[0]
      const rangePrefLabel = fieldRange.uri ? fieldRange.label : ''
      this.vocabStore.loadVocabularyRange(rangePrefLabel)
    })
    this.vocabularyRanges = this.vocabStore.getVocabularyRanges()
    this.emitUpdate()
  }

  public _newWindow(): Promise<void> {
    ipcRenderer.send('new-window')
    return Promise.resolve()
  }

  public _setSidebarWidth(width: number): Promise<void> {
    this.sidebarWidth = width
    electronStore.set('sidebarWidth', width.toString())
    this.emitUpdate()

    return Promise.resolve()
  }

  public _resetSidebarWidth(): Promise<void> {
    this.sidebarWidth = defaultSidebarWidth
    electronStore.delete('sidebarWidth')
    this.emitUpdate()

    return Promise.resolve()
  }

  public async _showPopup(popup: Popup): Promise<void> {
    this._closePopup()

    this.currentPopup = popup
    this.emitUpdate()
  }

  public _closePopup(): Promise<any> {
    this.currentPopup = null
    this.emitUpdate()

    return Promise.resolve()
  }

  public _setSavedState(saved: boolean): Promise<any> {
    this.savedState = saved

    this.emitUpdate()

    return Promise.resolve()
  }

  public _pushError(error: Error): Promise<void> {
    const newErrors = Array.from(this.errors)
    newErrors.push(error)
    this.errors = newErrors
    this.emitUpdate()

    return Promise.resolve()
  }

  public _clearError(error: Error): Promise<void> {
    this.errors = this.errors.filter(e => e !== error)
    this.emitUpdate()

    return Promise.resolve()
  }

  public _setPreferencesArchivesSpace(
    publicUrl: string,
    endpoint: string,
    username: string,
    password: string
  ): Promise<any> {

    this.preferences.aspace.publicUrl = publicUrl
    this.preferences.aspace.apiEndpoint = endpoint
    this.preferences.aspace.username = username

    const currentState = this.archivesSpaceStore.getState()
    this.archivesSpaceStore.setState({
      ...currentState,
      endpoint: endpoint,
      username: username,
      password: password
    })

    electronStore.set('preferences', JSON.stringify(this.preferences))
    this.emitUpdate()

    return Promise.resolve()
  }

  public _setPreferencesMap(preservationUrl: string, accessUrl: string): Promise<any> {

    this.preferences.map.preservationUrl = preservationUrl
    this.preferences.map.accessUrl = accessUrl

    this.mapStore.setMapUrls(preservationUrl, accessUrl)

    electronStore.set('preferences', JSON.stringify(this.preferences))
    this.emitUpdate()

    return Promise.resolve()
  }

  public _setPreferencesMinter(
    endpoint: string,
    preservationPrefix: string,
    accessPrefix: string,
    apiKey: string,
    ercWho: string
  ): Promise<any> {

    this.preferences.minter.endpoint = endpoint
    this.preferences.minter.preservationPrefix = preservationPrefix
    this.preferences.minter.accessPrefix = accessPrefix
    this.preferences.minter.apiKey = apiKey
    this.preferences.minter.ercWho = ercWho

    electronStore.set('preferences', JSON.stringify(this.preferences))
    this.emitUpdate()

    return Promise.resolve()
  }

  public _setPreferencesVocabulary(url: string): Promise<any> {
    this.preferences.vocabulary.url = url

    this._updateVocabulary()
    electronStore.set('preferences', JSON.stringify(this.preferences))
    this.emitUpdate()

    return Promise.resolve()
  }

  public async _setProjectTitle(title: string): Promise<any> {
    if (title.match(/https?:\/\/.*\/ark:\/\d+\/.*$/)) {
      this.project.collectionArkUrl = title
      try {
        title = await prefLabel(title)
      }
      catch (err) {
        this._pushError(err)
      }
    }

    this.project.collectionTitle = title
    this.savedState = false

    this.emitUpdate()

    return Promise.resolve()
  }

  public async _setObjectNote(uuid: string, note: string): Promise<any> {
    const newObjects = Array.from(this.project.objects)
    const objectIndex = newObjects.findIndex((object) => {
      return object.uuid === uuid
    })
    newObjects[objectIndex].productionNotes = note

    this.project.objects = newObjects
    this.savedState = false
    this.emitUpdate()

    return Promise.resolve()
  }

  public async _setObjectTitle(uuid: string, title: string): Promise<any> {
    const newObjects = Array.from(this.project.objects)
    const objectIndex = newObjects.findIndex((object) => {
      return object.uuid === uuid
    })
    newObjects[objectIndex].title = title

    this.project.objects = newObjects
    this.savedState = false
    this.emitUpdate()

    return Promise.resolve()
  }

  public async _appendObjects(num: number): Promise<any> {
    const newObjects = Array.from(this.project.objects)
    for (let i = 0; i < num; i++) {
      const object: IObject = newObject(newObjects.length + 1)
      newObjects.push(object)
    }

    this.project.objects = newObjects
    this.savedState = false

    createContainerFilesystem(
      this.projectPath,
      this.project.objects
    )

    this.emitUpdate()

    return Promise.resolve()
  }

  public async _insertObjects(
    uuid: string,
    position: 'above' | 'below'
  ): Promise<any> {
    this._pushActivity({ key: 'insert-object', description: 'Inserting new object' })
    const newObjects = Array.from(this.project.objects)
    const objectIndex = newObjects.findIndex(object => object.uuid === uuid)
    const objectIndexInsert = position === 'below' ? objectIndex + 1 : Math.max(objectIndex, 0)

    const newItem: IObject = newObject(objectIndexInsert + 1)

    newObjects.splice(objectIndexInsert, 0, newItem)

    try {
      for (let i = newObjects.length - 1; i > objectIndexInsert; i--) {
        const item = newObjects[i]
        newObjects[i] = updateContainerLocation(item, i + 1, this.projectPath)
      }
      this._pushActivity({ key: 'insert-filesystem', description: 'Moving object directories' })
      createObjectContainerFilesystem(this.projectPath, newItem)
        .then(() => this._clearActivity('insert-filesystem'))
        .catch((err) => {
          throw err
        })
    } catch (err) {
      this._pushError(err)
      return
    }

    this.savedState = false
    this.project.objects = newObjects

    this._clearActivity('insert-object')
    this.emitUpdate()
    return Promise.resolve()
  }

  public async _removeObject(uuid: string): Promise<any> {
    this._pushActivity({ key: 'removing-object', description: 'Removing object' })
    const newObjects = Array.from(this.project.objects)
    const objectIndex = newObjects.findIndex(object => object.uuid === uuid)
    if (objectIndex === -1) {
      return
    }

    const removedObject = newObjects[objectIndex]
    newObjects.splice(objectIndex, 1)
    orphanObject(removedObject, this.projectPath)
      .then(() => {
        for (let i = objectIndex; i < newObjects.length; i++) {
          const item = newObjects[i]
          newObjects[i] = updateContainerLocation(item, i + 1, this.projectPath)
        }
        this.project.objects = newObjects
        this.savedState = false
        this.emitUpdate()
      })
      .catch((err) => {
        this._pushError(err)
      })
      .then(() => {
        this._clearActivity('removing-object')
      })
  }

  public async _setObject(uuid: string): Promise<any> {
    this.selectedObjectUuid = uuid
    this.selectedObject = this.project.objects.find((object) => {
      return object.uuid === uuid
    }) || null

    if (this.selectedObject) {
      this._pushActivity({ key: 'files', description: 'Getting files list' })
      readContainerFilesystem(
        this.projectPath,
        this.selectedObject.containers[0]
      )
        .then((newFiles) => {
          this._clearActivity('files')
          if (this.selectedObject && filesChanged(newFiles, this.selectedObject.files)) {
            return this._replaceFiles(uuid, newFiles)
          }
          return
        })
    }

    this.emitUpdate()

    return Promise.resolve()
  }

  public async _setMultipleObjects(selection: ReadonlyArray<string>): Promise<any> {
    this.selectedObjects = selection
    this.emitUpdate()

    return Promise.resolve()
  }

  public async _addFile(
    objectUuid: string,
    path: string,
    purpose: FilePurpose
  ): Promise<any> {

    const newObjects = Array.from(this.project.objects)
    const objectIndex = newObjects.findIndex((object) => {
      return object.uuid === objectUuid
    })
    const object = newObjects[objectIndex]
    const newFiles = Array.from(object.files)
    const newFilename = filenameWithPurposeSuffix(basename(path), purpose)
    const newPath = `/Files/${containerToPath(object.containers[0])}${newFilename}`

    if (fileExists(newPath, newFiles)) {
      return
    }

    this._pushActivity({ key: 'moving', description: 'Moving files' })

    moveFileToContainer(path, object.containers[0], this.projectPath)
      .then((movedPath) => {
        renameWithPurposeSuffix(String(movedPath), purpose)
        newFiles.push({
          path: newPath,
          purpose: purpose
        })
        newFiles.sort((a, b) => {
          return a.path.localeCompare(b.path)
        })

        newObjects[objectIndex].files = newFiles
        this.project.objects = newObjects
        this.savedState = false

        this._clearActivity('moving')

        this.emitUpdate()
      })
      .catch((err) => {
        this._clearActivity('moving')
        this._pushError(err)
      })

    return Promise.resolve()
  }

  public async _openFile(path: string): Promise<any> {
    const filepath = `${this.projectPath}${path}`
    if (!shell.openItem(filepath)) {
      this._pushError(new Error(`Unable to open '${filepath}'`))
    }
    return Promise.resolve()
  }

  public async _removeFile(
    objectUuid: string,
    path: string
  ): Promise<any> {

    const newObjects = Array.from(this.project.objects)
    const objectIndex = newObjects.findIndex((object) => {
      return object.uuid === objectUuid
    })
    const newFiles = Array.from(newObjects[objectIndex].files)
    const fileIndex = newFiles.findIndex((file) => {
      return file.path === path
    })
    newFiles.splice(fileIndex, 1)

    newObjects[objectIndex].files = newFiles
    this.project.objects = newObjects
    this.savedState = false

    orphanFile(`${this.projectPath}${path}`, this.projectPath)
      .catch(err => this._pushError(err))

    this.emitUpdate()

    return Promise.resolve()

  }

  public async _moveFilePurpose(
    objectUuid: string,
    path: string,
    purpose: FilePurpose
  ): Promise<any> {

    const newObjects = Array.from(this.project.objects)
    const objectIndex = newObjects.findIndex((object) => {
      return object.uuid === objectUuid
    })
    const newFiles = Array.from(newObjects[objectIndex].files)
    const newFilename = filenameWithPurposeSuffix(basename(path), purpose)
    const fileIndex = newFiles.findIndex((file) => {
      return file.path === path
    })

    const src = `${this.projectPath}${path}`
    const dest = `${this.projectPath}${dirname(path)}/${newFilename}`
    if (src === dest) {
      return Promise.resolve()
    }

    moveFile(src, dest)
      .then(() => {
        newFiles[fileIndex] = {
          path: `${dirname(path)}/${newFilename}`,
          purpose: purpose
        }
        newObjects[objectIndex].files = newFiles
        this.project.objects = newObjects
        this.savedState = false

        this.emitUpdate()
      })
      .catch(err => this._pushError(err))



    return Promise.resolve()
  }

  public async _replaceFiles(
    objectUuid: string,
    files: ReadonlyArray<IFile>
  ): Promise<any> {
    const newObjects = Array.from(this.project.objects)
    const objectIndex = newObjects.findIndex((object) => {
      return object.uuid === objectUuid
    })
    newObjects[objectIndex].files = files
    this.project.objects = newObjects
    this.savedState = false

    this.emitUpdate()

    return Promise.resolve()
  }

  public async _save(): Promise<any> {
    if (this.projectFilePath !== '') {
      return this._saveProject(this.projectFilePath)
    }

    return this._completeSaveInDesktop()
      .then(filepath => this._saveProject(filepath))
      .catch(reason => console.warn(reason))
  }

  public async _open(): Promise<any> {
    return this._completeOpenInDesktop()
      .then(filepaths => this._openProject(filepaths[0]))
      .catch(reason => this._pushError(reason))
  }

  public async _completeSaveInDesktop(): Promise<any> {
    return new Promise((resolve, reject) => {

      const url = remote.dialog.showSaveDialog({
        title: "Save Project",
        buttonLabel: "Save",
        filters: [
          {
            name: "Caprenters Project File",
            extensions: ["carp"]
          }
        ]
      })
      if (url) {
        resolve(url)
        return
      }
      reject('No project location set')
    })
  }

  public async _completeOpenInDesktop(): Promise<any> {
    return new Promise((resolve, reject) => {
      const urls = remote.dialog.showOpenDialog({
        title: "Open Project",
        buttonLabel: "Open",
        filters: [
          {
            name: "Carpenters Project File",
            extensions: ["carp"]
          }
        ]
      })
      if (urls) {
        resolve(urls)
        return
      }
      reject('Open canceled')
    })
  }

  public async _showContainerFolder(uuid: string): Promise<any> {
    const object = this.project.objects.find((obj) => {
      return obj.uuid === uuid
    })
    if (!object) {
      return
    }

    const path = `${this.projectPath}/Files/${containerToPath(object.containers[0])}`
    shell.showItemInFolder(path)

    return Promise.resolve()
  }

  public async _pushActivity(activity: IActivity): Promise<any> {
    const newActivities = Array.from(this.activities)
    newActivities.push(activity)
    this.activities = newActivities
    this.emitUpdate()
    return Promise.resolve()
  }

  public async _clearActivity(key: string): Promise<any> {
    this.activities = this.activities.filter(a => a.key !== key)
    this.emitUpdate()
    return Promise.resolve()
  }

  public async _updateVocabulary(): Promise<any> {
    this._pushActivity({ key: 'vocabulary', description: 'Updating vocabulary' })
    this.vocabStore.loadVocabulary(this.preferences.vocabulary.url)
  }

  private async _saveProject(filepath: string): Promise<any> {
    this._pushActivity({ key: 'save', description: 'Saving project' })
    return saveProject(filepath, this.project)
      .then(() => {
        this.savedState = true
        this.projectFilePath = filepath
        this.projectPath = dirname(filepath)

        createContainerFilesystem(
          dirname(filepath),
          this.project.objects
        )
        this._clearActivity('save')

        this.emitUpdate()
      })
  }

  private async _openProject(filepath: string): Promise<any> {
    this._pushActivity({ key: 'open', description: 'Opening project' })
    return openProject(filepath)
      .then((project) => {
        this.savedState = true
        this.projectFilePath = filepath
        this.projectPath = dirname(filepath)
        this.project = project as IProject
        this.selectedObject = null
        this.selectedObjectUuid = ''
        this.selectedObjects = []
        this._clearActivity('open')
        this.emitUpdate()
      })
  }

  public _setUpdateAvailableVisibility(visable: boolean): Promise<any> {
    this.isUpdateAvailable = visable
    this.emitUpdate()

    return Promise.resolve()
  }

  public _updateNow() {
    ipcRenderer.send('update-now')
  }

  public _setUpdateState(state: IUpdateState): Promise<any> {
    this.updateState = state
    this.emitUpdate()

    return Promise.resolve()
  }

  public _saveMetadata(uuid: string, metadata: any): Promise<any> {
    const newObjects = Array.from(this.project.objects)
    const objectIndex = newObjects.findIndex(object => object.uuid === uuid)
    newObjects[objectIndex].metadata = metadata

    if (metadata['dcterms.title'] && metadata['dcterms.title'] !== '') {
      newObjects[objectIndex].title = metadata['dcterms.title']
    }

    this.project.objects = newObjects
    this.emitUpdate()

    if (this.projectFilePath !== '') {
      this._pushActivity({ key: 'save', description: 'Saving project' })
      return saveProject(this.projectFilePath, this.project)
        .then(() => this._clearActivity('save'))
    }

    return Promise.resolve()
  }

  public _autofillMetadata(identifier: string, value: string): Promise<any> {
    if (!this.selectedObjects.length) {
      return Promise.resolve()
    }
    this._pushActivity({ key: 'autofill', description: 'Autofilling Metadata' })
    const newObjects = Array.from(this.project.objects)
    this.selectedObjects.map((itemUuid) => {
      const objectIndex = newObjects.findIndex(item => item.uuid === itemUuid)
      const metadata = newObjects[objectIndex].metadata
      metadata[identifier] = value

      newObjects[objectIndex].metadata = metadata
    })

    this.project.objects = newObjects
    this._clearActivity('autofill')
    this.emitUpdate()

    if (this.projectFilePath !== '') {
      this._pushActivity({ key: 'save', description: 'Saving project' })
      return saveProject(this.projectFilePath, this.project)
        .then(() => this._clearActivity('save'))
    }

    return Promise.resolve()
  }

  private onArchivesSpaceStoreUpdated(data: IArchivesSpaceStoreState | null) {
    if (!data) {
      return
    }

    // TODO: Get archivesspace data
  }

}