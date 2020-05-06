import * as React from 'react'

import { DialogContent } from '../dialog'
import { Row } from '../layout'
import { TextBox } from '../form'

interface IArchivesSpaceProps {
  readonly publicUrl: string
  readonly endpoint: string
  readonly username: string
  readonly password: string

  readonly onPublicUrlChanged: (url: string) => void
  readonly onEndpointChanged: (endpoint: string) => void
  readonly onUsernameChanged: (username: string) => void
  readonly onPasswordChanged: (password: string) => void
}

export class ArchivesSpace extends React.Component<IArchivesSpaceProps, {}> {
  public render() {
    return (
      <DialogContent>
        <Row>
          <TextBox
            label="Public URL"
            value={this.props.publicUrl}
            onValueChanged={this.props.onPublicUrlChanged}
            autoFocus={true}
          />
        </Row>
        <Row>
          <TextBox
            label="Endpoint"
            value={this.props.endpoint}
            onValueChanged={this.props.onEndpointChanged}
          />
        </Row>
        <Row>
          <TextBox
            label="Username"
            value={this.props.username}
            onValueChanged={this.props.onUsernameChanged}
          />
        </Row>
        <Row>
          <TextBox
            label="Password"
            value={this.props.password}
            type="password"
            onValueChanged={this.props.onPasswordChanged}
          />
        </Row>
      </DialogContent>
    )
  }
}