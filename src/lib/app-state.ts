import { IProject, IObject } from './project'
import { BcDamsMap } from './map'
import { IVocabulary, IVocabularyMapRange } from './vocabulary'

export enum PopupType {
  Preferences,
  About,
  Project,
  Note,
  Title,
  Autofill
}

export enum ObjectViewTab {
  Files = 0,
  Metadata = 1
}

export type Popup =
  | { type: PopupType.Preferences }
  | { type: PopupType.About }
  | { type: PopupType.Project }
  | { type: PopupType.Note }
  | { type: PopupType.Title }
  | { type: PopupType.Autofill }

export interface IAppState {
  readonly currentPopup: Popup | null
  readonly errors: ReadonlyArray<Error>
  readonly activities: ReadonlyArray<IActivity>
  readonly preferences: IPreferences
  readonly savedState: boolean
  readonly project: IProject
  readonly sidebarWidth: number
  readonly selectedObjectUuid: string
  readonly selectedObject: IObject | null
  readonly selectedObjects: ReadonlyArray<string>
  readonly projectFilePath: string
  readonly projectPath: string
  readonly isUpdateAvailable: boolean
  readonly updateState: IUpdateState | null
  readonly accessMap: ReadonlyArray<BcDamsMap> | null
  readonly vocabulary: ReadonlyArray<IVocabulary>
  readonly vocabularyRanges: ReadonlyArray<IVocabularyMapRange>
}

export interface IArchivesSpace {
  publicUrl: string
  apiEndpoint: string
  username: string
}

export interface IMinter {
  endpoint: string
  preservationPrefix: string
  accessPrefix: string
  apiKey: string
  ercWho: string
}

export interface IMap {
  preservationUrl: string
  accessUrl: string
}

export interface IVocabularyUrl {
  url: string
}

export interface IPreferences {
  aspace: IArchivesSpace
  map: IMap
  minter: IMinter
  vocabulary: IVocabularyUrl
}

export interface IActivity {
  key: string
  description: string
}

export enum UpdateStatus {
  Checking,
  UpdateAvailable,
  UpdateNotAvailable,
  UpdateReady
}

export interface IUpdateState {
  status: UpdateStatus
  lastCheck: Date | null
}