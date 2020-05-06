import * as React from 'react'

import { DialogContent } from '../dialog'
import { Row } from '../layout'
import { TextBox } from '../form'

interface IMapProps {
  readonly preservationUrl: string
  readonly accessUrl: string

  readonly onPreservationUrlChanged: (url: string) => void
  readonly onAccessUrlChanged: (url: string) => void
}

export class Map extends React.Component<IMapProps, {}> {
  public render() {
    return (
      <DialogContent>
        <Row>
          <TextBox
            label="Preservation MAP URL"
            value={this.props.preservationUrl}
            onValueChanged={this.props.onPreservationUrlChanged}
            autoFocus={true}
          />
        </Row>
        <Row>
          <TextBox
            label="Access MAP URL"
            value={this.props.accessUrl}
            onValueChanged={this.props.onAccessUrlChanged}
          />
        </Row>
      </DialogContent>
    )
  }
}