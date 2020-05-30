import * as React from 'react'

import { Dialog, DialogContent, DialogFooter } from './dialog'
import { Button, ButtonGroup } from './button'
import { Row } from './layout'
import { staticPath, encodePathAsUrl } from '../lib/path'
import { version } from '../lib/imagemagick'

const LogoImage = encodePathAsUrl(
  staticPath(),
  'icon-logo.png'
)

interface IAboutProps {
  readonly appName: string
  readonly appVersion: string
  readonly onDismissed: () => void
}

interface IAboutState {
  readonly imageMagickVersion: string
}

export class About extends React.Component<IAboutProps, IAboutState> {

  constructor(props: IAboutProps) {
    super(props)

    this.getImageMagickVersion()
    this.state = {
      imageMagickVersion: ''
    }
  }

  private async getImageMagickVersion() {
    const v = await version()
    const value = v ? v : 'Not installed'
    this.setState({ imageMagickVersion: value })
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
          <p>ImageMagick: {this.state.imageMagickVersion}</p>
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