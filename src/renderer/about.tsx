import * as React from 'react'

import { Dialog, DialogContent, DialogFooter } from './dialog'
import { Button, ButtonGroup } from './button'
import { Row, Loading } from './layout'
import { staticPath, encodePathAsUrl } from '../lib/path'
import { version } from '../lib/imagemagick'
import { IUpdateState, UpdateStatus } from '../lib/app-state'
import { RelativeTime } from './relative-time'

const LogoImage = encodePathAsUrl(
  staticPath(),
  'icon-logo.png'
)

interface IAboutProps {
  readonly appName: string
  readonly appVersion: string
  readonly updateState: IUpdateState | null
  readonly onCheckForUpdates: () => void
  readonly onUpdateNow: () => void
  readonly onDismissed: () => void
}

interface IAboutState {
  readonly imageMagickVersion: string
}

export class About extends React.Component<IAboutProps, IAboutState> {

  constructor(props: IAboutProps) {
    super(props)

    this.state = {
      imageMagickVersion: 'Unknown'
    }
  }

  public componentDidMount() {
    version().then((version: string | boolean) => {
      const value = version ? String(version) : 'Not installed'
      this.setState({ imageMagickVersion: value })
    })
  }

  private renderUpdateDetails() {
    if (__LINUX__) {
      return null
    }

    if (__DEV__) {
      return (
        <p>
          The application is currently running in development mode and
          will not recieve any updates.
        </p>
      )
    }

    const updateState = this.props.updateState
    if (!updateState) {
      return (
        <p>Unknown update status</p>
      )
    }

    switch (updateState.status) {
      case UpdateStatus.Checking:
        return this.renderCheckingForUpdate()
      case UpdateStatus.UpdateAvailable:
        return this.renderUpdateAvailable()
      case UpdateStatus.UpdateNotAvailable:
        return this.renderUpdateNotAvailable()
      case UpdateStatus.UpdateReady:
        return this.renderUpdateReady()
      default:
        return (
          <p>Unknown status update {updateState.status}</p>
        )
    }


  }

  private renderCheckingForUpdate() {
    return (
      <Row className="update-status">
        <Loading />
        <span>Checking for updates...</span>
      </Row>
    )
  }

  private renderUpdateAvailable() {
    return (
      <Row className="update-status">
        <Loading />
        <span>Downlaoding update...</span>
      </Row>
    )
  }

  private renderUpdateNotAvailable() {
    const lastChecked = this.props.updateState ? this.props.updateState.lastCheck : null

    if (!lastChecked) {
      return null
    }

    return (
      <p className="update-status">
        You have the latest version of Mason (last checked{' '}
        <RelativeTime date={lastChecked} />)
      </p>
    )
  }

  private renderUpdateReady() {
    return (
      <p className="update-status">
        An update has been downloaded and is ready to be installed.
      </p>
    )
  }

  public renderUpdateButton() {
    if (__DEV__) {
      return null
    }
    if (!this.props.updateState) {
      return null
    }

    const updateStatus = this.props.updateState.status

    switch (updateStatus) {
      case UpdateStatus.UpdateReady:
        return (
          <Row>
            <Button onClick={this.props.onUpdateNow}>
              Quit and Install Update
            </Button>
          </Row>
        )
      case UpdateStatus.UpdateNotAvailable:
      case UpdateStatus.Checking:
      case UpdateStatus.UpdateAvailable:
        const disabled = updateStatus !== UpdateStatus.UpdateNotAvailable

        return (
          <Row>
            <Button
              disabled={disabled}
              onClick={this.props.onCheckForUpdates}
            >
              Check for Updates
            </Button>
          </Row>
        )
    }

  }

  public render() {
    return (
      <Dialog
        id="about"
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <Row className="logo">
            <img src={LogoImage} />
          </Row>
          <h2>{this.props.appName}</h2>
          <p>Version {this.props.appVersion}</p>
          <p>ImageMagick version: {this.state.imageMagickVersion}</p>
          {this.renderUpdateDetails()}
          {this.renderUpdateButton()}
        </DialogContent>
        <DialogFooter>
          <ButtonGroup>
            <Button
              onClick={this.props.onDismissed}
            >
              Close
            </Button>
          </ButtonGroup>
        </DialogFooter>
      </Dialog>
    )
  }
}