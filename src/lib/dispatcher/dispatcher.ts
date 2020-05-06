import { AppStore } from '../stores'
import { Popup, PopupType, IUpdateState } from '../app-state'
import { FilePurpose } from '../project'

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

  public clearError(error: Error): Promise<void> {
    return this.appStore._clearError(error)
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

  public setObjectNote(uuid: string, note: string): Promise<void> {
    return this.appStore._setObjectNote(uuid, note)
  }

  public setObjectTitle(uuid: string, title: string): Promise<void> {
    return this.appStore._setObjectTitle(uuid, title)
  }

  public setSavedState(saved: boolean): Promise<void> {
    return this.appStore._setSavedState(saved)
  }

  public save(): Promise<void> {
    return this.appStore._save()
  }

  public open(): Promise<void> {
    return this.appStore._open()
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

  public removeObject(uuid: string): Promise<void> {
    return this.appStore._removeObject(uuid)
  }

  public showProjectNote(): Promise<void> {
    return this.appStore._showPopup({ type: PopupType.Note })
  }

  public showObjectTitle(): Promise<void> {
    return this.appStore._showPopup({ type: PopupType.Title })
  }

  public showAutoFill(): Promise<void> {
    return this.appStore._showPopup({ type: PopupType.Autofill })
  }

  public setObject(uuid: string): Promise<void> {
    return this.appStore._setObject(uuid)
  }

  public setMultipleObjects(selection: ReadonlyArray<string>): Promise<void> {
    return this.appStore._setMultipleObjects(selection)
  }

  public autofillMetadata(identifier: string, value: string): Promise<void> {
    return this.appStore._autofillMetadata(identifier, value)
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

  public setUpdateAvailableVisibility(visible: boolean): Promise<any> {
    return this.appStore._setUpdateAvailableVisibility(visible)
  }

  public updateNow() {
    return this.appStore._updateNow()
  }

  public saveMetadata(uuid: string, metadata: any): Promise<any> {
    return this.appStore._saveMetadata(uuid, metadata)
  }

  public updateVocabulary(): Promise<any> {
    return this.appStore._updateVocabulary()
  }

  public updateFileAssignment(): Promise<any> {
    return this.appStore._updateFileAssignment()
  }

}