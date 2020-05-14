import * as React from 'react'
import { CSSTransitionGroup } from 'react-transition-group'
import { ipcRenderer, remote } from 'electron'
import { MenuEvent } from '../main/menu'
import { Dispatcher } from '../lib/dispatcher'
import { AppStore } from '../lib/stores'
import {
  ToolbarButton,
  Toolbar,
  SaveButton,
  Activity,
  SelectionButton
} from './toolbar'
import { Project } from './project'
import { UiView } from './ui-view'
import { AppError } from './app-error'
import { Preferences } from './preferences'
import { About } from './about'
import * as Icons from '@fortawesome/free-regular-svg-icons'
import * as SolidIcons from '@fortawesome/free-solid-svg-icons'
import {
  IAppState,
  PopupType,
  Popup,
  IUpdateState,
  UpdateStatus,
  ViewType,
  ExportType,
} from '../lib/app-state'
import { ProjectType } from '../lib/project'
import { ObjectsView, ObjectView, EditTitle } from './object'
import { EditNote } from './note'
import {
  registerContextualMenuActionDispatcher
} from './main-process-proxy'
import { UpdateAvailable } from './updates'
import { Autofill } from './autofill/autofill'
import { SelectionView } from './selection'
import { MintView } from './mint'
import { ExportView, AvalonPrompt, PreservationPrompt } from './export'


interface IAppProps {
  readonly appStore: AppStore
  readonly dispatcher: Dispatcher
}

export const dialogTransitionEnterTimeout = 250
export const dialogTransitionLeaveTimeout = 100


export class App extends React.Component<IAppProps, IAppState> {

  public constructor(props: IAppProps) {
    super(props)

    registerContextualMenuActionDispatcher()

    props.dispatcher.loadInitialState()

    this.state = props.appStore.getState()
    props.appStore.onDidUpdate(state => {
      this.setState(state)
    })

    ipcRenderer.on(
      'menu-event',
      (event: Electron.IpcRendererEvent, { name }: { name: MenuEvent }) => {
        this.onMenuEvent(name)
      }
    )

    ipcRenderer.on(
      'update-changed',
      (event: Electron.IpcRendererEvent, { state }: { state: IUpdateState }) => {
        const status = state.status
        if (status === UpdateStatus.UpdateReady) {
          this.props.dispatcher.setUpdateAvailableVisibility(true)
        }
        this.props.dispatcher.setUpdateState(state)
      }
    )

    ipcRenderer.on(
      'update-error',
      (event: Electron.IpcRendererEvent, { error }: { error: Error }) => {
        this.props.dispatcher.setUpdateAvailableVisibility(false)
      }
    )

    window.onbeforeunload = (e: BeforeUnloadEvent) => {
      if (this.state.activities.length && !__DEV__) {
        this.props.appStore._pushError(new Error("Waiting for all activities to end before closing."))
        e.returnValue = false
      }
    }

  }

  private onMenuEvent(name: MenuEvent): any {
    switch (name) {
      case 'new-window':
        return this.props.dispatcher.newWindow()
      case 'open-project':
        return this.props.dispatcher.open()
      case 'save-project':
        return this.props.dispatcher.save()
      case 'show-preferences':
        return this.props.dispatcher.showPopup({ type: PopupType.Preferences })
      case 'show-about':
        return this.props.dispatcher.showPopup({ type: PopupType.About })
      case 'update-vocabulary':
        return this.props.dispatcher.updateVocabulary()
      case 'select-all':
        return this.selectAll()
      case 'update-files':
        return this.props.dispatcher.updateFileAssignment()
      case 'mint-ac':
        return this.props.dispatcher.mintAccessArks()
      case 'mint-pm':
        return this.props.dispatcher.mintPreservationArks()
      case 'export-metadata':
        return this.props.dispatcher.exportMetadata()
      case 'export-shotlist':
        return this.props.dispatcher.exportShotlist()
      case 'export-mm':
        return this.props.dispatcher.exportModifiedMasters()
      case 'export-armand':
        return this.props.dispatcher.exportArmandPackage()
      case 'export-avalon':
        return this.props.dispatcher.showPopup({ type: PopupType.AvalonExport })
      case 'export-sip':
        return this.checkPreservationBeforeExport()
    }
  }

  private selectAll() {
    const event = new CustomEvent('select-all', {
      bubbles: true,
      cancelable: true
    })
    if (document.activeElement && document.activeElement.dispatchEvent(event)) {
      remote.getCurrentWebContents().selectAll()
    }
  }

  private renderApp() {

    switch (this.state.selectedView) {
      case ViewType.Export:
        return (
          <UiView id="export-view">
            {this.renderExportView()}
          </UiView>
        )
      case ViewType.Mint:
        return (
          <UiView id="mint-view">
            <MintView
              dispatcher={this.props.dispatcher}
              progress={this.state.progress}
              done={this.state.progressComplete}
            />
          </UiView>
        )
      case ViewType.Selection:
        return (
          <UiView id="selection">
            <SelectionView
              dispacher={this.props.dispatcher}
              archivesSpaceStore={this.props.appStore.archivesSpaceStore}
              resourceUri={this.state.project.resource}
              objects={this.state.project.objects}
            />
          </UiView>
        )

      default:
        return (
          <UiView id="project">
            <ObjectsView
              dispatcher={this.props.dispatcher}
              sidebarWidth={this.state.sidebarWidth}
              selectedObjectUuid={this.state.selectedObjectUuid}
              objects={this.state.project.objects}
              type={this.state.project.type}
              accessMap={this.state.accessMap}
              vocabularyRanges={this.state.vocabularyRanges}
            />
            <ObjectView
              dispatcher={this.props.dispatcher}
              object={this.state.selectedObject}
              selectedObjects={this.state.selectedObjects}
              accessMap={this.state.accessMap}
              vocabularyRanges={this.state.vocabularyRanges}
              findingAidPublicUrl={this.state.preferences.aspace.publicUrl}
            />
          </UiView>
        )

    }
    return null
  }

  private renderExportView() {
    switch (this.state.selectedExportType) {
      case ExportType.Metadata:
        return (
          <ExportView
            label="Export Metadata"
            icon={SolidIcons.faPaperPlane}
            dispatcher={this.props.dispatcher}
            progress={this.state.progress}
            done={this.state.progressComplete}
          />
        )
      case ExportType.Shotlist:
        return (
          <ExportView
            label="Export Shotlist"
            icon={SolidIcons.faListAlt}
            dispatcher={this.props.dispatcher}
            progress={this.state.progress}
            done={this.state.progressComplete}
          />
        )
      case ExportType.SIP:
        return (
          <ExportView
            label="Export SIPs"
            icon={SolidIcons.faBriefcase}
            dispatcher={this.props.dispatcher}
            progress={this.state.progress}
            done={this.state.progressComplete}
          />
        )
      case ExportType.Armand:
        return (
          <ExportView
            label="Export Armand Package"
            icon={SolidIcons.faCubes}
            dispatcher={this.props.dispatcher}
            progress={this.state.progress}
            done={this.state.progressComplete}
          />
        )
      case ExportType.Avalon:
        return (
          <ExportView
            label="Export Avalon Package"
            icon={SolidIcons.faFilm}
            dispatcher={this.props.dispatcher}
            progress={this.state.progress}
            done={this.state.progressComplete}
          />
        )
      case ExportType.ModifiedMasters:
        return (
          <ExportView
            label="Export Modified Masters"
            icon={SolidIcons.faCameraRetro}
            dispatcher={this.props.dispatcher}
            progress={this.state.progress}
            done={this.state.progressComplete}
          />
        )
    }
    return null
  }

  private onPopupDismissed = () => this.props.dispatcher.closePopup()

  private renderPopup() {
    return (
      <CSSTransitionGroup
        transitionName="modal"
        component="div"
        transitionEnterTimeout={dialogTransitionEnterTimeout}
        transitionLeaveTimeout={dialogTransitionLeaveTimeout}
      >
        {this.popupContent()}
      </CSSTransitionGroup>
    )
  }

  private popupContent(): JSX.Element | null {
    const popup = this.state.currentPopup

    if (!popup) {
      return null
    }

    switch (popup.type) {
      case PopupType.Preferences:
        return (
          <Preferences
            dispatcher={this.props.dispatcher}
            preferences={this.state.preferences}
            onDismissed={this.onPopupDismissed}
          />
        )
      case PopupType.About:
        return (
          <About
            appName={remote.app.name}
            appVersion={remote.app.getVersion()}
            onDismissed={this.onPopupDismissed}
          />
        )
      case PopupType.Project:
        return (
          <Project
            dispatcher={this.props.dispatcher}
            project={this.state.project}
            archivesSpaceStore={this.props.appStore.archivesSpaceStore}
            onDismissed={this.onPopupDismissed}
          />
        )
      case PopupType.Note:
        return (
          <EditNote
            dispatcher={this.props.dispatcher}
            onDismissed={this.onPopupDismissed}
            selectedObjectUuid={this.state.selectedObjectUuid}
            objects={this.state.project.objects}
          />
        )
      case PopupType.Title:
        return (
          <EditTitle
            dispatcher={this.props.dispatcher}
            onDismissed={this.onPopupDismissed}
            selectedObjectUuid={this.state.selectedObjectUuid}
            objects={this.state.project.objects}
          />
        )
      case PopupType.Autofill:
        return (
          <Autofill
            dispatcher={this.props.dispatcher}
            onDismissed={this.onPopupDismissed}
            selectedObjects={this.state.selectedObjects}
            accessMap={this.state.accessMap}
            vocabularyRanges={this.state.vocabularyRanges}
          />
        )
      case PopupType.AvalonExport:
        return (
          <AvalonPrompt
            dispatcher={this.props.dispatcher}
            onDismissed={this.onPopupDismissed}
          />
        )
      case PopupType.PreservationExport:
        return (
          <PreservationPrompt
            dispatcher={this.props.dispatcher}
            onDismissed={this.onPopupDismissed}
          />
        )
    }
    return null
  }

  private renderAppError() {
    return (
      <AppError
        errors={this.state.errors}
        onClearError={this.clearError}
        onShowPopup={this.showPopup}
      />
    )
  }

  private renderProjectToolbarButton() {
    const project = this.state.project
    const type = project.type === ProjectType.Archival ?
      'Archival Collection' : 'Non-Archival Collection'

    const disabled = this.state.selectedView === ViewType.Mint ||
      this.state.selectedView === ViewType.Export

    return (
      <ToolbarButton
        title={project.collectionTitle}
        disabled={disabled}
        description={type}
        icon={Icons.faNewspaper}
        className="project-button"
        onClick={this.showProjectPopup}
      />
    )
  }

  private renderProjectSaveButton() {

    const disabled = this.state.selectedView === ViewType.Mint ||
      this.state.selectedView === ViewType.Export

    return (
      <SaveButton
        dispatcher={this.props.dispatcher}
        saveState={this.state.savedState}
        disabled={disabled}
      />
    )
  }

  private renderProjectActivity() {
    return (
      <Activity
        activities={this.state.activities}
      />
    )
  }

  private renderProjectSelectionButton() {
    if (this.state.project.type === ProjectType.NonArchival) {
      return null
    }

    const selected = this.state.selectedView === ViewType.Selection
    const disabled = this.state.selectedView === ViewType.Mint ||
      this.state.selectedView === ViewType.Export

    return (
      <SelectionButton
        dispatcher={this.props.dispatcher}
        disabled={disabled}
        selected={selected}
        onClick={this.showSelectionView}
      />
    )
  }

  private renderUpdateBanner() {
    if (!this.state.isUpdateAvailable) {
      return null
    }

    return (
      <UpdateAvailable
        onDismissed={this.onUpdateAvailableDismissed}
        onUpdateNow={this.onUpdateNow}
      />
    )
  }

  private checkPreservationBeforeExport() {
    const objects = this.state.project.objects
    const missing = objects.filter(item => item.pm_ark === '').length
    if (missing > 0) {
      this.props.dispatcher.showPopup({ type: PopupType.PreservationExport })
    }
    else {
      this.props.dispatcher.exportPreservation(false)
    }
  }

  private clearError = (error: Error) => this.props.dispatcher.clearError(error)

  private showPopup = (popup: Popup) => {
    this.props.dispatcher.showPopup(popup)
  }

  private showProjectPopup = (event: React.MouseEvent<HTMLButtonElement>) => {
    this.showPopup({ type: PopupType.Project })
  }

  private showSelectionView = () => {
    if (this.state.selectedView === ViewType.Selection) {
      this.props.dispatcher.closeView()
    }
    else {
      this.props.dispatcher.showView(ViewType.Selection)
    }
  }

  private onUpdateAvailableDismissed = () =>
    this.props.dispatcher.setUpdateAvailableVisibility(false)

  private onUpdateNow = () =>
    this.props.dispatcher.updateNow()

  public render() {

    return (
      <div id="app-container">
        <Toolbar id="app-toolbar">
          {this.renderProjectToolbarButton()}
          {this.renderProjectSelectionButton()}
          {this.renderProjectActivity()}
          {this.renderProjectSaveButton()}
        </Toolbar>
        {this.renderUpdateBanner()}
        {this.renderApp()}
        {this.renderPopup()}
        {this.renderAppError()}
      </div>
    )
  }
}