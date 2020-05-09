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
import {
  IAppState,
  PopupType,
  Popup,
  IUpdateState,
  UpdateStatus,
  ViewType,
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
      (event: Electron.IpcMessageEvent, { name }: { name: MenuEvent }) => {
        this.onMenuEvent(name)
      }
    )

    ipcRenderer.on(
      'update-changed',
      (event: Electron.IpcMessageEvent, { state }: { state: IUpdateState }) => {
        const status = state.status
        if (status === UpdateStatus.UpdateReady) {
          this.props.dispatcher.setUpdateAvailableVisibility(true)
        }
        this.props.dispatcher.setUpdateState(state)
      }
    )

    ipcRenderer.on(
      'update-error',
      (event: Electron.IpcMessageEvent, { error }: { error: Error }) => {
        this.props.dispatcher.setUpdateAvailableVisibility(false)
      }
    )

    // ipcRenderer.on(
    //   'window-closing',
    //   (event: Electron.IpcMessageEvent) => {
    //     if (this.state.activities.length === 0) {
    //       closeWindow()
    //     }
    //     else {
    //       this.props.appStore._pushError(new Error("Waiting for all activities to end before closing..."))
    //     }
    //   }
    // )

    window.onbeforeunload = (e: BeforeUnloadEvent) => {
      if (this.state.activities.length) {
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
            />
          </UiView>
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
            appName={remote.app.getName()}
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

    return (
      <ToolbarButton
        title={project.collectionTitle}
        description={type}
        icon={Icons.faNewspaper}
        className="project-button"
        onClick={this.showProjectPopup}
      />
    )
  }

  private renderProjectSaveButton() {
    return (
      <SaveButton
        dispatcher={this.props.dispatcher}
        saveState={this.state.savedState}
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

    return (
      <SelectionButton
        dispatcher={this.props.dispatcher}
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