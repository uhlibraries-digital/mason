import * as React from 'react'
import { Dispatcher } from '../../lib/dispatcher'
import { IProgress } from '../../lib/app-state'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserAstronaut } from '@fortawesome/free-solid-svg-icons'
import { Row } from '../layout'
import { Button } from '../button'

interface IMintViewProps {
  readonly dispatcher: Dispatcher
  readonly progress: IProgress
  readonly done: boolean
}

export class MintView extends React.Component<IMintViewProps, {}> {

  public render() {
    return (
      <div className="mint-container">
        <div className="title-container">
          <FontAwesomeIcon
            className="icon"
            icon={faUserAstronaut}
            size="5x"
          />
          <div className="title">Minting ARKs</div>
        </div>
        <progress value={this.props.progress.value} />
        <div className="details">{this.props.progress.description}</div>
        <div className="subdetails">{this.props.progress.subdescription}</div>
        {this.renderDone()}
      </div>
    )
  }

  private renderDone() {
    if (this.props.done) {
      return (
        <Row className="done-button">
          <Button
            onClick={this.onClick}
            type="submit"
          >
            Done
          </Button>
        </Row>
      )
    }
    return null
  }

  private onClick = () => {
    this.props.dispatcher.closeView()
  }
}