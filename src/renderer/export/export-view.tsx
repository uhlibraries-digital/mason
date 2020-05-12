import * as React from 'react'
import { Dispatcher } from '../../lib/dispatcher'
import { IProgress } from '../../lib/app-state'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Row } from '../layout'
import { Button } from '../button'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

interface IExportViewProps {
  readonly dispatcher: Dispatcher
  readonly label: string
  readonly icon: IconDefinition
  readonly progress: IProgress
  readonly done: boolean
}

export class ExportView extends React.Component<IExportViewProps, {}> {

  public render() {
    return (
      <div className="export-container">
        <div className="title-container">
          <FontAwesomeIcon
            className="icon"
            icon={this.props.icon}
            size="5x"
          />
          <div className="title">{this.props.label}</div>
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