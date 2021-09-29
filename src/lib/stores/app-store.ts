import {
  IAppState,
  Popup,
  IPreferences,
  PopupType,
  IActivity,
  IUpdateState,
  ViewType,
  MetadataAutofillType,
  IProgress,
  ExportType,
  SoundEffect,
  IConvertTypeOption
} from '../app-state'
import { TypedBaseStore } from './base-store'
import {
  MapStore,
  VocabularyStore,
  AnalyticsStore
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
  orphanObject,
  updateFileAssignment,
  newArchivalObject,
  nextItemNumberFromContainer,
  addToContainer,
  moveContainerFiles,
  sortObjectsByLocation,
  ProcessingType
} from '../project'
import {
  prefLabel,
  IVocabulary,
  IVocabularyMapRange
} from '../vocabulary'
import { dirname, basename } from 'path'
import { shell } from '../app-shell'
import { electronStore } from './electron-store'
import {
  ArchivesSpaceStore,
  ArchivesSpaceArchivalObject,
  ArchivesSpaceContainer,
  ArchivesSpaceResource
} from './archives-space-store'
import {
  BcDamsMap,
  defaultFieldDelemiter
} from '../map'
import { range } from '../range'
import {
  Minter,
  IErc,
  ArkType
} from '../minter'
import {
  exportMetadata,
  exportShotlist,
  exportModifiedMasters,
  exportArmandPackage,
  exportAvalonPackage,
  exportPreservationSips
} from '../export'
import { createAccess } from '../converter'
import { version } from '../imagemagick'
import {
  getAutoSwitchTheme,
  getTheme,
  setAutoSwitchTheme,
  setTheme,
  Theme
} from '../theme'
import { themeChangeMonitor } from '../theme-change-monitor'
import {
  isDarkModeEnabled,
  supportsDarkMode
} from '../dark-mode'

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
  private preservationMap: ReadonlyArray<BcDamsMap> | null = null
  private vocabulary: ReadonlyArray<IVocabulary> = []
  private vocabularyRanges: ReadonlyArray<IVocabularyMapRange> = []
  private selectedView: ViewType | null = null
  private progress: IProgress = { value: undefined }
  private progressComplete: boolean = false
  private selectedExportType: ExportType | null = null
  private soundEffect: SoundEffect | null = null
  private selectedTheme: Theme = Theme.Light
  private automaticallySwitchTheme: boolean = false

  public readonly archivesSpaceStore: ArchivesSpaceStore
  private readonly mapStore: MapStore
  private readonly vocabStore: VocabularyStore
  private readonly analyticsStore: AnalyticsStore

  public constructor() {
    super()

    this.archivesSpaceStore = new ArchivesSpaceStore()
    this.mapStore = new MapStore()
    this.vocabStore = new VocabularyStore()
    this.analyticsStore = new AnalyticsStore()

    this.wireupStoreEventHandlers()
  }

  private wireupStoreEventHandlers() {
    this.mapStore.onDidError(err => this._pushError(err))
    this.mapStore.onDidUpdate(() => {
      this.accessMap = this.mapStore.getAccessMap()
      this.preservationMap = this.mapStore.getPreservationMap()
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

    this.archivesSpaceStore.onDidError(err => this._pushError(err))

  }

  private getSelectedObjects(): ReadonlyArray<IObject> {
    if (this.selectedObjects.length) {
      const newObjects: Array<IObject> = []
      this.selectedObjects.forEach((uuid) => {
        const item = this.project.objects.find(item => item.uuid === uuid)
        if (item) {
          newObjects.push(item)
        }
      })
      return newObjects
    }

    return this.project.objects
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
      selectedView: this.selectedView,
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
      preservationMap: this.preservationMap,
      updateState: this.updateState,
      vocabulary: this.vocabulary,
      vocabularyRanges: this.vocabularyRanges,
      progress: this.progress,
      progressComplete: this.progressComplete,
      selectedExportType: this.selectedExportType,
      soundEffect: this.soundEffect,
      selectedTheme: this.selectedTheme,
      automaticallySwitchTheme: this.automaticallySwitchTheme
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

    this.archivesSpaceStore.load(
      this.preferences.aspace.apiEndpoint, this.preferences.aspace.username)

    this.sidebarWidth = parseInt(String(electronStore.get('sidebarWidth')), 10) ||
      defaultSidebarWidth

    this.automaticallySwitchTheme = getAutoSwitchTheme()

    if (this.automaticallySwitchTheme) {
      this.selectedTheme = isDarkModeEnabled()
        ? Theme.Dark
        : Theme.Light
      setTheme(this.selectedTheme)
    }
    else {
      this.selectedTheme = getTheme()
    }

    themeChangeMonitor.onThemeChanged(theme => {
      if (this.automaticallySwitchTheme) {
        this.selectedTheme = theme
        this.emitUpdate()
      }
    })

    this.emitUpdateNow()
  }

  public loadVocabularyRangesFromMap() {
    if (!this.accessMap || !this.vocabulary) {
      return
    }

    this.vocabStore.clearVocabularyRages()
    this.accessMap.forEach((field) => {
      field.range.forEach((fieldRange) => {
        const rangePrefLabel = fieldRange.uri ? fieldRange.label : ''
        this.vocabStore.loadVocabularyRange(rangePrefLabel)
      })
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

  public async _showView(view: ViewType): Promise<void> {
    this.selectedView = view
    this.emitUpdate()
  }

  public _closeView(): Promise<any> {
    this.selectedView = null
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

    this.analyticsStore.exception(error.message)

    return Promise.resolve()
  }

  public _clearError(error: Error): Promise<void> {
    this.errors = this.errors.filter(e => e !== error)
    this.emitUpdate()

    return Promise.resolve()
  }

  public _playSoundEffect(sound: SoundEffect): Promise<void> {
    this.soundEffect = sound
    this.emitUpdate()
    return Promise.resolve()
  }

  public _clearSoundEffect(): Promise<void> {
    this.soundEffect = null
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

    this.archivesSpaceStore.setEndpoint(endpoint)
    this.archivesSpaceStore.setUsernamePassword(username, password)
    this.archivesSpaceStore.load(endpoint, username)

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

  public _setTheme(theme: Theme): Promise<any> {
    this.selectedTheme = theme
    setTheme(theme)
    this.emitUpdate()

    return Promise.resolve()
  }

  public _setAutomaticThemeChange(value: boolean): Promise<any> {
    if (!supportsDarkMode()) {
      return Promise.resolve()
    }

    setAutoSwitchTheme(value)
    this.automaticallySwitchTheme = value

    if (this.automaticallySwitchTheme) {
      this.selectedTheme = isDarkModeEnabled()
        ? Theme.Dark
        : Theme.Light
      setTheme(this.selectedTheme)
    }

    this.emitUpdate()

    return Promise.resolve()
  }

  public async _setProjectTitle(title: string): Promise<any> {
    if (title.match(/https?:\/\/.*\/ark:\/\d+\/.*$/)) {
      this.project.collectionArkUrl = title
      try {
        title = await prefLabel(title)
      }
      catch (err: any) {
        this._pushError(err)
      }
    }

    this.project.collectionTitle = title
    this.savedState = false

    this.emitUpdate()

    return Promise.resolve()
  }

  public async _setProjectType(type: ProjectType): Promise<any> {
    if (this.project.type !== type) {
      this.project.objects = []
    }
    this.project.type = type
    this.savedState = false

    this.emitUpdate()
    return Promise.resolve()
  }

  public async _setProjectResource(uri: string): Promise<any> {
    if (this.project.resource !== uri) {
      this.project.objects = []
    }
    this.project.resource = uri
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

  public async _toggleProcessingType(uuid: string): Promise<any> {
    const newObjects = Array.from(this.project.objects)
    const objectIndex = newObjects.findIndex((object) => {
      return object.uuid === uuid
    })
    const processingType = newObjects[objectIndex].processing_type

    if (processingType === ProcessingType.Unknown || processingType === undefined) {
      newObjects[objectIndex].processing_type = ProcessingType.Image
    }
    else if (processingType === ProcessingType.Image) {
      newObjects[objectIndex].processing_type = ProcessingType.Text
    }
    else if (processingType === ProcessingType.Text) {
      newObjects[objectIndex].processing_type = ProcessingType.Unknown
    }

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
    range(0, num).map(() => {
      const object: IObject = newObject(newObjects.length + 1)
      newObjects.push(object)
    })

    this.project.objects = newObjects
    this.savedState = false

    createContainerFilesystem(
      this.projectPath,
      this.project.objects
    )

    this.emitUpdate()

    return Promise.resolve()
  }

  public async _addArchivalObject(ref: string, position: number): Promise<any> {
    const newObjects = Array.from(this.project.objects)
    const archivalObject = await this.archivesSpaceStore.getArchivalObject(
      ref) as ArchivesSpaceArchivalObject
    const containers = await this.archivesSpaceStore.getContainer(
      ref, archivalObject) as ReadonlyArray<ArchivesSpaceContainer>

    const newObject = newArchivalObject(archivalObject, containers)
    const lastItem = newObjects.findIndex(o => o.parent_uri === ref)
    const insertIndex = lastItem > -1 ? lastItem : position

    if (insertIndex === -1) {
      newObjects.push(newObject)
    }
    else {
      newObjects.splice(insertIndex, 0, newObject)
    }

    this.project.objects = newObjects
    this.savedState = false
    this.emitUpdate()

    return Promise.resolve()
  }

  public async _removeArchivalObject(ref: string): Promise<any> {
    const newObjects = Array.from(this.project.objects)
    const objectIndex = newObjects.findIndex(o => o.uri === ref)
    newObjects.splice(objectIndex, 1)

    this.project.objects = newObjects
    this.savedState = false
    this.emitUpdate()

    return Promise.resolve()
  }

  public async _addArchivalObjectItems(ref: string, position: number, num: number): Promise<any> {
    const newObjects = Array.from(this.project.objects)
    const parentContainers = await this.archivesSpaceStore.getContainer(ref)
    const lastAOItem = newObjects.filter(o => o.parent_uri === ref).pop()
    const insertIndex = lastAOItem ? newObjects.findIndex(o => o.uuid === lastAOItem.uuid) + 1 :
      position

    const startItemNumber = lastAOItem ? nextItemNumberFromContainer(lastAOItem.containers[0]) : 1

    range(0, num).map((r, index) => {
      const indicator = startItemNumber + index
      const item = newObject(indicator, true)
      const container = addToContainer(parentContainers[0], 'Item', String(indicator))

      item.containers = [container]
      item.parent_uri = ref
      item.metadata = {
        'uhlib.aSpaceUri': ref
      }

      newObjects.splice(insertIndex + index, 0, item)
    })

    this.project.objects = newObjects
    this.savedState = false
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
    } catch (err: any) {
      this._pushError(err)
      return
    }

    this.savedState = false
    this.project.objects = newObjects

    this._clearActivity('insert-object')
    this.emitUpdate()
    return Promise.resolve()
  }

  public async _removeObject(uuid: string, updateLocation?: boolean): Promise<any> {
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
        if (updateLocation) {
          for (let i = objectIndex; i < newObjects.length; i++) {
            const item = newObjects[i]
            newObjects[i] = updateContainerLocation(item, i + 1, this.projectPath)
          }
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
      this.analyticsStore.event('Object', 'select')
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

  public async _addFiles(
    objectUuid: string,
    purpose: FilePurpose
  ): Promise<any> {

    return this._completeOpenInDesktop({
      title: "Add Files",
      buttonLabel: "Add",
      properties: [
        'openFile',
        'multiSelections'
      ]
    })
      .then((filePaths) => {
        filePaths.forEach((file: string) => {
          this._addFile(objectUuid, file, purpose)
        });
      })
      .catch((err) => {
        console.warn(err)
      })
      .then(() => this.emitUpdate())
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
    const newObject = newObjects[objectIndex]
    const newFilename = filenameWithPurposeSuffix(basename(path), purpose)
    const newPath = `/Files/${containerToPath(newObject.containers[0])}${newFilename}`

    if (fileExists(newPath, newObject.files)) {
      return
    }

    this._pushActivity({ key: 'moving', description: 'Moving files' })

    moveFileToContainer(path, newObject.containers[0], this.projectPath)
      .then((movedPath) => {
        renameWithPurposeSuffix(String(movedPath), purpose)
        const newFiles = Array.from(newObject.files)
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

    return this._completeSaveInDesktop({
      title: "Save Project",
      buttonLabel: "Save",
      filters: [
        {
          name: "Project File",
          extensions: ["carp"]
        }
      ]
    })
      .then(filepath => this._saveProject(filepath))
      .catch(reason => console.warn(reason))
  }

  public async _saveAs(): Promise<any> {
    const savePath = this.projectFilePath
    this.projectFilePath = ''
    return this._save()
      .catch(() => this.projectFilePath = savePath)
  }

  public async _open(): Promise<any> {
    return this._completeOpenInDesktop({
      title: "Open Project",
      buttonLabel: "Open",
      filters: [
        {
          name: "Project File",
          extensions: ["carp"]
        }
      ]
    })
      .then(filepaths => this._openProject(filepaths[0]))
      .catch(reason => this._pushError(reason))
  }

  public async _completeSaveInDesktop(options: Electron.SaveDialogOptions): Promise<any> {
    const window = remote.getCurrentWindow()
    const { filePath } = await remote.dialog.showSaveDialog(window, options)
    return filePath ? filePath : Promise.reject(new Error('Save dialog canceled'))
  }

  public async _completeOpenInDesktop(options: Electron.OpenDialogOptions): Promise<any> {
    const window = remote.getCurrentWindow()
    const { filePaths } = await remote.dialog.showOpenDialog(window, options)
    return filePaths.length ? filePaths : Promise.reject(new Error('Open canceled'))
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
    this.analyticsStore.event('Metadata', 'update vocabulary')
    this.vocabStore.loadVocabulary(this.preferences.vocabulary.url)
      .catch(err => this._clearActivity('vocabulary'))
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
        this.analyticsStore.event('Project', 'save')
      })
  }

  public async _openProject(filepath: string): Promise<any> {
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
        this.analyticsStore.event('Project', 'open')
      })
      .catch(err => this._clearActivity('open'))
  }

  public _setUpdateAvailableVisibility(visable: boolean): Promise<any> {
    this.isUpdateAvailable = visable
    this.emitUpdate()

    return Promise.resolve()
  }

  public _updateNow() {
    ipcRenderer.send('update-now')
  }

  public _checkForUpdates() {
    ipcRenderer.send('check-for-updates')
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

  public _savePmArk(uuid: string, ark: string): Promise<any> {
    const newObjects = Array.from(this.project.objects)
    const objectIndex = newObjects.findIndex(object => object.uuid === uuid)
    newObjects[objectIndex].pm_ark = ark

    this.project.objects = newObjects
    this.emitUpdate()
    this.analyticsStore.event('Metadata', 'pm ark change')

    return Promise.resolve()
  }

  public _saveDoArk(uuid: string, ark: string): Promise<any> {
    const newObjects = Array.from(this.project.objects)
    const objectIndex = newObjects.findIndex(object => object.uuid === uuid)
    newObjects[objectIndex].do_ark = ark

    this.project.objects = newObjects
    this.emitUpdate()
    this.analyticsStore.event('Metadata', 'do ark change')

    return Promise.resolve()
  }

  public async _saveASpaceUri(uuid: string, uri: string): Promise<any> {
    const newObjects = Array.from(this.project.objects)
    const objectIndex = newObjects.findIndex(object => object.uuid === uuid)
    const item = newObjects[objectIndex]

    if (this.project.type === ProjectType.NonArchival) {
      this._pushError(new Error("Can't change ArchivesSpace URI to a non-archival collection"))
      return Promise.resolve()
    }

    if (item.uri !== '' && item.uri !== undefined) {
      const conflictIndex = newObjects.findIndex(o => o.uri === uri)
      if (conflictIndex > -1) {
        this._pushError(new Error(
          'Another object has the same ArchivesSpace URI. Please merge files or correct.'
        ))
        return Promise.resolve()
      }
      item.uri = uri
    }
    else if (item.parent_uri !== '' && item.parent_uri !== undefined) {
      item.parent_uri = uri
    }
    else {
      this._pushError(new Error(
        'No previous ArchivesSpace URI detected for this object. ' +
        'Please add this object through the Archival Selection.'
      ))
      return Promise.resolve()
    }

    const newContainers = await this.archivesSpaceStore.getContainer(uri)
    if (item.artificial) {
      const lastAOItem = newObjects.filter(o => o.parent_uri === uri && o.uuid !== item.uuid).pop()
      const nextItemNumber = lastAOItem ? nextItemNumberFromContainer(lastAOItem.containers[0]) : 1

      const container = addToContainer(newContainers[0], 'Item', String(nextItemNumber))
      try {
        const newItem = moveContainerFiles(item, item.containers[0], container, this.projectPath)
        item.containers = [container]
        item.files = newItem.files
      } catch (e: any) {
        this._pushError(e)
        return Promise.resolve()
      }
    }
    else {
      const newItem = moveContainerFiles(
        item, item.containers[0], newContainers[0], this.projectPath)
      item.containers = newContainers
      item.files = newItem.files
    }

    newObjects[objectIndex] = item

    // forces objects-view component to update
    this.project.objects = []
    this.emitUpdate()

    this.project.objects = sortObjectsByLocation(newObjects)
    this.savedState = false
    this.emitUpdate()
    this.analyticsStore.event('Metadata', 'aspace uri change')

    return Promise.resolve()
  }

  public _autofillMetadata(identifier: string, value: string, type: MetadataAutofillType): Promise<any> {
    if (!this.selectedObjects.length) {
      return Promise.resolve()
    }
    this._pushActivity({ key: 'autofill', description: 'Autofilling Metadata' })
    const newObjects = Array.from(this.project.objects)
    this.selectedObjects.map((itemUuid) => {
      const objectIndex = newObjects.findIndex(item => item.uuid === itemUuid)
      const metadata = newObjects[objectIndex].metadata

      if (type === MetadataAutofillType.Replace) {
        metadata[identifier] = value
      }
      else {
        const values = String(metadata[identifier]).split(defaultFieldDelemiter)
        values.push(value)
        metadata[identifier] = values.join(defaultFieldDelemiter)
      }

      newObjects[objectIndex].metadata = metadata
    })

    this.project.objects = newObjects
    this._clearActivity('autofill')
    this.emitUpdate()
    this.analyticsStore.event('Metadata', 'autofill')

    if (this.projectFilePath !== '') {
      this._pushActivity({ key: 'save', description: 'Saving project' })
      return saveProject(this.projectFilePath, this.project)
        .then(() => this._clearActivity('save'))
    }

    return Promise.resolve()
  }

  public _autofillProcessingType(type: ProcessingType): Promise<any> {
    if (!this.selectedObjects.length) {
      return Promise.resolve()
    }

    this._pushActivity({ key: 'processing-type', description: 'Changing processing type' })
    const newObjects = Array.from(this.project.objects)
    this.selectedObjects.map((itemUuid) => {
      const objectIndex = newObjects.findIndex(item => item.uuid === itemUuid)
      newObjects[objectIndex].processing_type = type
    })

    this.project.objects = newObjects
    this._clearActivity('processing-type')
    this.savedState = false
    this.emitUpdate()
    this.analyticsStore.event('Files', 'Autofill Processing Type')

    return Promise.resolve()
  }

  public _updateFileAssignment(): Promise<any> {
    this._pushActivity({ key: 'update-files', description: 'Updating file assignment' })
    const newObjects = Array.from(this.project.objects)

    updateFileAssignment(newObjects, this.projectPath)
      .then(() => {
        this.project.objects = newObjects
        this.savedState = false
        this.emitUpdate()
        this.analyticsStore.event('Files', 'file assignment')
      })
      .catch(err => this._pushError(err))
      .then(() => this._clearActivity('update-files'))

    return Promise.resolve()
  }

  public _mintArks(type: ArkType): Promise<any> {
    if (this.selectedView === ViewType.Mint ||
      this.selectedView === ViewType.Export ||
      this.selectedView === ViewType.Convert
    ) {
      return Promise.resolve()
    }

    this.selectedView = ViewType.Mint
    this.progressComplete = false
    this.progress = { value: undefined }

    const actDest = type === ArkType.Access ? 'access' : 'preservation'

    this._pushActivity({ key: 'mint', description: `Minting ${actDest} ARKs` })
    this.analyticsStore.event('ARK Minting', actDest)

    const pwrid = remote.powerSaveBlocker.start('prevent-app-suspension')

    const erc: IErc | undefined = this.preferences.minter.ercWho ?
      { who: this.preferences.minter.ercWho } : undefined
    const prefix = type === ArkType.Access ? this.preferences.minter.accessPrefix :
      this.preferences.minter.preservationPrefix

    const minter = new Minter(
      this.preferences.minter.endpoint,
      this.preferences.minter.apiKey,
      prefix,
      type,
      erc)

    return minter.mint(
      this.project.objects,
      (progress: IProgress) => {
        this.progress = progress
        this.emitUpdate()
      }
    )
      .then((mintedObjects) => {
        this.progressComplete = true
        this.project.objects = mintedObjects
        if (this.projectFilePath !== '') {
          this._pushActivity({ key: 'save', description: 'Saving project' })
          return saveProject(this.projectFilePath, this.project)
            .then(() => this._clearActivity('save'))
        }
        return
      })
      .catch((err) => {
        this.progressComplete = true
        this._closeView()
        this._pushError(err)
      })
      .then(() => {
        remote.powerSaveBlocker.stop(pwrid)
        this._clearActivity('mint')
        this.emitUpdate()
      })
  }

  public _closeExport(): Promise<any> {
    this.selectedView = ViewType.Object
    this.selectedExportType = null
    this.progressComplete = false
    this.progress = { value: undefined, description: '', subdescription: '' }

    this.emitUpdate()

    return Promise.resolve()
  }

  public _exportMetadata(): Promise<any> {
    if (this.selectedView === ViewType.Mint ||
      this.selectedView === ViewType.Export ||
      this.selectedView === ViewType.Convert
    ) {
      return Promise.resolve()
    }

    this._pushActivity({ key: 'export', description: 'Exporting Metadata' })
    this.analyticsStore.event('Export', 'metadata')
    this.selectedView = ViewType.Export
    this.selectedExportType = ExportType.Metadata
    this.progress = { value: undefined, description: 'Choosing export location...' }
    this.progressComplete = false
    this.emitUpdate()

    const pwrid = remote.powerSaveBlocker.start('prevent-app-suspension')

    this._completeSaveInDesktop({
      title: "Export Metadata",
      defaultPath: 'metadata.csv',
      buttonLabel: "Export",
      filters: [
        { name: 'Comma-separated values', extensions: ['csv'] }
      ]
    })
      .then((filepath) => {
        return exportMetadata(
          this.project.objects,
          this.accessMap,
          filepath,
          (progress: IProgress) => {
            this.progress = progress
            this.emitUpdate()
          })
          .then(() => {
            this.progressComplete = true
            this._playSoundEffect('success')
          })
      })
      .catch((err) => {
        this._playSoundEffect('failure')
        this._pushError(new Error('Metadata export failed'))
        this._pushError(err)
        this._closeExport()
      })
      .then(() => {
        this._clearActivity('export')
        remote.powerSaveBlocker.stop(pwrid)
        this.emitUpdate()
      })

    return Promise.resolve()
  }

  public _exportShotlist(): Promise<any> {
    if (this.selectedView === ViewType.Mint ||
      this.selectedView === ViewType.Export ||
      this.selectedView === ViewType.Convert
    ) {
      return Promise.resolve()
    }

    this._pushActivity({ key: 'export', description: 'Exporting Shotlist' })
    this.analyticsStore.event('Export', 'shotlist')
    this.selectedView = ViewType.Export
    this.selectedExportType = ExportType.Shotlist
    this.progress = { value: undefined, description: 'Choosing export location...' }
    this.progressComplete = false
    this.emitUpdate()

    const pwrid = remote.powerSaveBlocker.start('prevent-app-suspension')

    this._completeSaveInDesktop({
      title: "Export Shotlist",
      defaultPath: 'shotlist.csv',
      buttonLabel: "Export",
      filters: [
        { name: 'Comma-separated values', extensions: ['csv'] }
      ]
    })
      .then((filepath) => {
        return exportShotlist(
          this.project.objects,
          filepath,
          (progress: IProgress) => {
            this.progress = progress
            this.emitUpdate()
          })
          .then(() => {
            this.progressComplete = true
            this._playSoundEffect('success')
          })
      })
      .catch((err) => {
        this._playSoundEffect('failure')
        this._pushError(new Error('Shotlist export failed'))
        this._pushError(err)
        this._closeExport()
      })
      .then(() => {
        this._clearActivity('export')
        remote.powerSaveBlocker.stop(pwrid)
        this.emitUpdate()
      })

    return Promise.resolve()
  }

  public async _exportModifiedMasters(): Promise<any> {
    if (
      this.selectedView === ViewType.Mint ||
      this.selectedView === ViewType.Export ||
      this.selectedView === ViewType.Convert
    ) {
      return Promise.resolve()
    }

    this._pushActivity({ key: 'export', description: 'Exporting Modified Masters' })
    this.analyticsStore.event('Export', 'modified masters')
    this.selectedView = ViewType.Export
    this.selectedExportType = ExportType.ModifiedMasters
    this.progress = { value: undefined, description: 'Choosing export location...' }
    this.progressComplete = false
    this.emitUpdate()

    const pwrid = remote.powerSaveBlocker.start('prevent-app-suspension')

    let defaultPath = 'Untitled'
    if (this.project.type === ProjectType.Archival) {
      try {
        const resource = await this.archivesSpaceStore.getResource(
          this.project.resource) as ArchivesSpaceResource
        defaultPath = resource.id_0
      } catch (e) {
        this._playSoundEffect('failure')
        this._pushError(new Error('Modified Masters export failed'))
        this._closeExport()
        remote.powerSaveBlocker.stop(pwrid)
        this.emitUpdate()
        return Promise.resolve()
      }
    }

    this._completeSaveInDesktop({
      title: "Export Modified Masters",
      defaultPath: defaultPath,
      buttonLabel: "Export"
    })
      .then((filepath) => {
        return exportModifiedMasters(
          this.project.objects,
          this.accessMap,
          filepath,
          this.projectFilePath,
          (progress: IProgress) => {
            this.progress = progress
            this.emitUpdate()
          })
          .then(() => {
            this.progressComplete = true
            this._playSoundEffect('success')
          })
      })
      .catch((err) => {
        this._playSoundEffect('failure')
        this._pushError(new Error('Modified Masters export failed'))
        this._pushError(err)
        this._closeExport()
      })
      .then(() => {
        this._clearActivity('export')
        remote.powerSaveBlocker.stop(pwrid)
        this.emitUpdate()
      })

    return Promise.resolve()
  }

  public async _exportArmandPackage(): Promise<any> {
    if (this.selectedView === ViewType.Mint ||
      this.selectedView === ViewType.Export ||
      this.selectedView === ViewType.Convert
    ) {
      return Promise.resolve()
    }

    await this._mintArks(ArkType.Access)

    this._pushActivity({ key: 'export', description: 'Exporting Armand Package' })
    this.analyticsStore.event('Export', 'armand package')
    this.selectedView = ViewType.Export
    this.selectedExportType = ExportType.Armand
    this.progress = { value: undefined, description: 'Choosing export location...' }
    this.progressComplete = false
    this.emitUpdate()

    const pwrid = remote.powerSaveBlocker.start('prevent-app-suspension')

    let defaultPath = 'Untitled'
    if (this.project.type === ProjectType.Archival) {
      try {
        const resource = await this.archivesSpaceStore.getResource(
          this.project.resource) as ArchivesSpaceResource
        defaultPath = resource.id_0
      } catch (e) {
        this._playSoundEffect('failure')
        this._pushError(new Error('Aramnd package export failed'))
        this._closeExport()
        this._clearActivity('export')
        return Promise.resolve()
      }

    }

    this._completeSaveInDesktop({
      title: "Export Armand Package",
      defaultPath: defaultPath,
      buttonLabel: "Export"
    })
      .then((filepath) => {
        return exportArmandPackage(
          this.project.objects,
          this.accessMap,
          filepath,
          this.projectFilePath,
          (progress: IProgress) => {
            this.progress = progress
            this.emitUpdate()
          }
        )
          .then(() => {
            this.progressComplete = true
            this._playSoundEffect('success')
          })
      })
      .catch((err) => {
        this._playSoundEffect('failure')
        this._pushError(new Error('Aramnd package export failed'))
        this._pushError(err)
        this._closeExport()
      })
      .then(() => {
        this._clearActivity('export')
        remote.powerSaveBlocker.stop(pwrid)
        this.emitUpdate()
      })



    return Promise.resolve()
  }

  public async _exportAvalonPackage(username: string, offset: string): Promise<any> {
    if (this.selectedView === ViewType.Mint ||
      this.selectedView === ViewType.Export ||
      this.selectedView === ViewType.Convert
    ) {
      return Promise.resolve()
    }

    await this._mintArks(ArkType.Access)

    this._pushActivity({ key: 'export', description: 'Exporting Avalon Package' })
    this.analyticsStore.event('Export', 'avalon package')
    this.selectedView = ViewType.Export
    this.selectedExportType = ExportType.Avalon
    this.progress = { value: undefined, description: 'Choosing export location...' }
    this.progressComplete = false
    this.emitUpdate()

    const pwrid = remote.powerSaveBlocker.start('prevent-app-suspension')

    let defaultPath = 'Untitled'
    if (this.project.type === ProjectType.Archival) {
      try {
        const resource = await this.archivesSpaceStore.getResource(
          this.project.resource) as ArchivesSpaceResource
        defaultPath = resource.id_0
      } catch (e) {
        this._playSoundEffect('failure')
        this._pushError(new Error('Avalon package export failed'))
        this._closeExport()
        this._clearActivity('export')
        return Promise.resolve()
      }

    }

    this._completeSaveInDesktop({
      title: "Export Avalon Package",
      defaultPath: defaultPath,
      buttonLabel: "Export"
    })
      .then((filepath) => {
        return exportAvalonPackage(
          username,
          offset,
          this.project.objects,
          this.accessMap,
          filepath,
          this.projectFilePath,
          (progress: IProgress) => {
            this.progress = progress
            this.emitUpdate()
          }
        )
          .then(() => {
            this.progressComplete = true
            this._playSoundEffect('success')
          })
      })
      .catch((err) => {
        this._playSoundEffect('failure')
        this._pushError(new Error('Avalon package export failed'))
        this._pushError(err)
        this._closeExport()
      })
      .then(() => {
        this._clearActivity('export')
        remote.powerSaveBlocker.stop(pwrid)
        this.emitUpdate()
      })



    return Promise.resolve()
  }

  public _saveAic(aic: string): Promise<any> {
    this.project.aic = aic
    this.emitUpdate()

    saveProject(this.projectFilePath, this.project)

    return Promise.resolve()
  }

  public async _exportPreservation(mint: boolean): Promise<any> {
    if (this.selectedView === ViewType.Mint ||
      this.selectedView === ViewType.Export ||
      this.selectedView === ViewType.Convert
    ) {
      return Promise.resolve()
    }

    if (mint) {
      await this._mintArks(ArkType.Preservation)
    }

    this._pushActivity({ key: 'export', description: 'Exporting Preservation SIPs' })
    this.analyticsStore.event('Export', 'preservation')
    this.selectedView = ViewType.Export
    this.selectedExportType = ExportType.SIP
    this.progress = { value: undefined, description: 'Choosing export location...' }
    this.progressComplete = false
    this.emitUpdate()

    const pwrid = remote.powerSaveBlocker.start('prevent-app-suspension')

    let defaultPath = 'Untitled'
    if (this.project.type === ProjectType.Archival) {
      try {
        const resource = await this.archivesSpaceStore.getResource(
          this.project.resource) as ArchivesSpaceResource
        defaultPath = resource.id_0

        const externalDoc = resource.external_documents.find((doc) => {
          return doc.location && /ark:\/\d+\/.*$/.test(doc.location)
        })
        this.project.collectionArkUrl = externalDoc ? externalDoc.location : ''
        this.project.collectionTitle = externalDoc ? externalDoc.title : this.project.collectionTitle
      } catch (e) {
        this._playSoundEffect('failure')
        this._pushError(new Error('Preservation SIP export failed'))
        this._closeExport()
        this._clearActivity('export')
        return Promise.resolve()
      }
    }

    this._completeSaveInDesktop({
      title: "Export SIP Package",
      defaultPath: defaultPath,
      buttonLabel: "Export"
    })
      .then((filepath) => {
        return exportPreservationSips(
          this.project.aic,
          this.project.objects,
          this.preservationMap,
          this.project.collectionArkUrl || '',
          this.project.collectionTitle,
          filepath,
          this.projectFilePath,
          (progress: IProgress) => {
            this.progress = progress
            this.emitUpdate()
          }
        )
          .then(() => {
            this.progressComplete = true
            this._playSoundEffect('success')
          })
      })
      .catch((err) => {
        this._playSoundEffect('failure')
        this._pushError(new Error('Preservation SIP export failed'))
        this._pushError(err)
        this._closeExport()
      })
      .then(() => {
        this._clearActivity('export')
        remote.powerSaveBlocker.stop(pwrid)
        this.emitUpdate()
      })

    return Promise.resolve()
  }

  public async _convertImagesPreCheck(): Promise<any> {

    const imkVersion = await version()
    if (!imkVersion) {
      this._pushError(
        new Error('ImageMagick needs to be installed to create access files')
      )
      return
    }

    const checkObjects = this.getSelectedObjects()

    const typeObjects = checkObjects.filter((item) => {
      return item.processing_type === ProcessingType.Image
        || item.processing_type === ProcessingType.Text
    })
    if (!typeObjects.length) {
      this._pushError(
        new Error("No objects available. Only objects of processing type 'Image' or 'Text' can be converted.")
      )
      return
    }

    const acObjects = checkObjects.filter((item) => {
      if (item) {
        const files = item.files.filter(file => file.purpose === FilePurpose.Access)
        return files.length > 0
      }
      return false
    })

    if (acObjects.length) {
      this._showPopup({ type: PopupType.OverwritePrompt })
    }
    else {
      this._showPopup({ type: PopupType.AccessConvertOptions })
    }

    return Promise.resolve()
  }

  public _convertImages(options: IConvertTypeOption): Promise<any> {
    if (this.selectedView === ViewType.Mint ||
      this.selectedView === ViewType.Export ||
      this.selectedView === ViewType.Convert
    ) {
      return Promise.resolve()
    }

    this._pushActivity({ key: 'convert', description: 'Creating Access files' })
    this.analyticsStore.event('Files', 'convert access files')
    this.selectedView = ViewType.Convert
    this.progress = { value: undefined, description: 'Initializing' }
    this.progressComplete = false
    this.emitUpdate()

    const pwrid = remote.powerSaveBlocker.start('prevent-app-suspension')

    const convertObjects = this.getSelectedObjects()

    createAccess(
      this.projectPath,
      convertObjects,
      options,
      (progress: IProgress) => {
        this.progress = progress
        this.emitUpdate()
      }
    )
      .then(() => {
        this._playSoundEffect('success')
        return this._updateFileAssignment()
          .then(() => {
            if (this.projectFilePath !== '') {
              this._pushActivity({ key: 'save', description: 'Saving project' })
              return saveProject(this.projectFilePath, this.project)
                .then(() => {
                  this.savedState = true
                  this._clearActivity('save')
                })
            }
            return
          })
      })
      .catch((e) => {
        this._playSoundEffect('failure')
        this._pushError(e)
        this.selectedView = ViewType.Object
      })
      .then(() => {
        this._clearActivity('convert')
        remote.powerSaveBlocker.stop(pwrid)
        this.progressComplete = true
        this.emitUpdate()
      })

    return Promise.resolve()
  }

}