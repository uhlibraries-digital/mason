import { AppStore } from '../stores'
import {
  Popup,
  PopupType,
  IUpdateState,
  IActivity,
  ViewType,
  MetadataAutofillType
} from '../app-state'
import {
  FilePurpose,
  ProjectType
} from '../project'
import { ArkType } from '../minter'
import { Theme } from '../theme'

export class Dispatcher {
  private readonly appStore: AppStore

  public constructor(appStore: AppStore) {
    this.appStore = appStore
  }

  public loadInitialState(): Promise<void> {
    return this.appStore.loadInitialState()
  }

  public showPopup(popup: Popup): Promise<void> {
    return this.appStore._showPopup(popup)
  }

  public closePopup(): Promise<void> {
    return this.appStore._closePopup()
  }

  public showView(type: ViewType): Promise<void> {
    return this.appStore._showView(type)
  }

  public closeView(): Promise<void> {
    return this.appStore._closeView()
  }

  public pushError(error: Error): Promise<void> {
    return this.appStore._pushError(error)
  }

  public clearError(error: Error): Promise<void> {
    return this.appStore._clearError(error)
  }

  public clearSoundEffect(): Promise<void> {
    return this.appStore._clearSoundEffect()
  }

  public setPreferencesArchivesSpace(
    publicUrl: string,
    endpoint: string,
    username: string,
    password: string
  ): Promise<void> {
    return this.appStore._setPreferencesArchivesSpace(
      publicUrl,
      endpoint,
      username,
      password
    )
  }

  public setPreferencesMap(preservationUrl: string, accessUrl: string): Promise<void> {
    return this.appStore._setPreferencesMap(preservationUrl, accessUrl)
  }

  public setPreferencesMinter(
    endpoint: string,
    preservationPrefix: string,
    accessPrefix: string,
    apiKey: string,
    ercWho: string
  ): Promise<void> {
    return this.appStore._setPreferencesMinter(
      endpoint, preservationPrefix, accessPrefix, apiKey, ercWho)
  }

  public setPreferencesVocabulary(url: string): Promise<void> {
    return this.appStore._setPreferencesVocabulary(url)
  }

  public setProjectTitle(title: string): Promise<void> {
    return this.appStore._setProjectTitle(title)
  }

  public setProjectType(type: ProjectType): Promise<void> {
    return this.appStore._setProjectType(type)
  }

  public setProjectResource(uri: string): Promise<void> {
    return this.appStore._setProjectResource(uri)
  }

  public setTheme(theme: Theme): Promise<void> {
    return this.appStore._setTheme(theme)
  }

  public setObjectNote(uuid: string, note: string): Promise<void> {
    return this.appStore._setObjectNote(uuid, note)
  }

  public setObjectTitle(uuid: string, title: string): Promise<void> {
    return this.appStore._setObjectTitle(uuid, title)
  }

  public toggleAccessType(uuid: string): Promise<void> {
    return this.appStore._toggleAccessType(uuid)
  }

  public setSavedState(saved: boolean): Promise<void> {
    return this.appStore._setSavedState(saved)
  }

  public save(): Promise<void> {
    return this.appStore._save()
  }

  public saveAs(): Promise<void> {
    return this.appStore._saveAs()
  }

  public open(): Promise<void> {
    return this.appStore._open()
  }

  public openProject(path: string): Promise<void> {
    return this.appStore._openProject(path)
  }

  public setSidebarWidth(width: number): Promise<void> {
    return this.appStore._setSidebarWidth(width)
  }

  public resetSidebarWidth(): Promise<void> {
    return this.appStore._resetSidebarWidth()
  }

  public appendObjects(num: number): Promise<void> {
    return this.appStore._appendObjects(num)
  }

  public insertObject(uuid: string, position: 'above' | 'below', num: number): Promise<void> {
    return this.appStore._insertObjects(uuid, position)
  }

  public removeObject(uuid: string, updateLocation?: boolean): Promise<void> {
    return this.appStore._removeObject(uuid, updateLocation)
  }

  public showProjectNote(): Promise<void> {
    return this.appStore._showPopup({ type: PopupType.Note })
  }

  public showObjectTitle(): Promise<void> {
    return this.appStore._showPopup({ type: PopupType.Title })
  }

  public addArchivalObject(ref: string, position: number): Promise<void> {
    return this.appStore._addArchivalObject(ref, position)
  }

  public removeArchivalObject(ref: string): Promise<void> {
    return this.appStore._removeArchivalObject(ref)
  }

  public addArchivalObjectItems(ref: string, position: number, num: number): Promise<void> {
    return this.appStore._addArchivalObjectItems(ref, position, num)
  }

  public showAutoFill(): Promise<void> {
    return this.appStore._showPopup({ type: PopupType.Autofill })
  }

  public showAutofillType(): Promise<void> {
    return this.appStore._showPopup({ type: PopupType.AutofillType })
  }

  public setObject(uuid: string): Promise<void> {
    return this.appStore._setObject(uuid)
  }

  public setMultipleObjects(selection: ReadonlyArray<string>): Promise<void> {
    return this.appStore._setMultipleObjects(selection)
  }

  public autofillMetadata(identifier: string, value: string, type: MetadataAutofillType): Promise<void> {
    return this.appStore._autofillMetadata(identifier, value, type)
  }

  public autofillAccessType(text: boolean): Promise<void> {
    return this.appStore._autofillAccessType(text)
  }

  public openFile(path: string): Promise<void> {
    return this.appStore._openFile(path)
  }

  public addFile(
    objectUuid: string,
    path: string,
    type: FilePurpose
  ): Promise<void> {
    return this.appStore._addFile(objectUuid, path, type)
  }

  public addFiles(
    objectUuid: string,
    type: FilePurpose
  ): Promise<void> {
    return this.appStore._addFiles(objectUuid, type)
  }

  public removeFile(objectUuid: string, path: string) {
    return this.appStore._removeFile(objectUuid, path)
  }

  public moveFilePurpose(objectUuid: string, path: string, purpose: FilePurpose) {
    return this.appStore._moveFilePurpose(objectUuid, path, purpose)
  }

  public newWindow(): Promise<void> {
    return this.appStore._newWindow()
  }

  public showContainerFolder(uuid: string): Promise<void> {
    return this.appStore._showContainerFolder(uuid)
  }

  public setUpdateState(state: IUpdateState): Promise<void> {
    return this.appStore._setUpdateState(state)
  }

  public setUpdateAvailableVisibility(visible: boolean): Promise<void> {
    return this.appStore._setUpdateAvailableVisibility(visible)
  }

  public updateNow() {
    return this.appStore._updateNow()
  }

  public checkForUpdates() {
    return this.appStore._checkForUpdates()
  }

  public saveMetadata(uuid: string, metadata: any): Promise<void> {
    return this.appStore._saveMetadata(uuid, metadata)
  }

  public updateVocabulary(): Promise<void> {
    return this.appStore._updateVocabulary()
  }

  public updateFileAssignment(): Promise<void> {
    return this.appStore._updateFileAssignment()
  }

  public pushActivity(activity: IActivity): Promise<void> {
    return this.appStore._pushActivity(activity)
  }

  public clearActivity(key: string): Promise<void> {
    return this.appStore._clearActivity(key)
  }

  public mintAccessArks(): Promise<void> {
    return this.appStore._mintArks(ArkType.Access)
  }

  public mintPreservationArks(): Promise<void> {
    return this.appStore._mintArks(ArkType.Preservation)
  }

  public closeExport(): Promise<void> {
    return this.appStore._closeExport()
  }

  public exportMetadata(): Promise<void> {
    return this.appStore._exportMetadata()
  }

  public exportShotlist(): Promise<void> {
    return this.appStore._exportShotlist()
  }

  public exportModifiedMasters(): Promise<void> {
    return this.appStore._exportModifiedMasters()
  }

  public exportArmandPackage(): Promise<void> {
    return this.appStore._exportArmandPackage()
  }

  public exportAvalonPackage(username: string, offset: string): Promise<void> {
    return this.appStore._exportAvalonPackage(username, offset)
  }

  public exportPreservation(mint: boolean): Promise<void> {
    return this.appStore._exportPreservation(mint)
  }

  public convertImages(
    profile: string,
    quality: number,
    resize: number | boolean,
    resample: number | boolean,
    tileSize: string
  ): Promise<void> {
    return this.appStore._convertImages(profile, quality, resize, resample, tileSize)
  }

  public convertImagesPreCheck(): Promise<void> {
    return this.appStore._convertImagesPreCheck()
  }

  public savePmArk(uuid: string, ark: string): Promise<void> {
    return this.appStore._savePmArk(uuid, ark)
  }

  public saveDoArk(uuid: string, ark: string): Promise<void> {
    return this.appStore._saveDoArk(uuid, ark)
  }

  public saveASpaceUri(uuid: string, uri: string): Promise<void> {
    return this.appStore._saveASpaceUri(uuid, uri)
  }

  public saveAic(aic: string): Promise<void> {
    return this.appStore._saveAic(aic)
  }

}