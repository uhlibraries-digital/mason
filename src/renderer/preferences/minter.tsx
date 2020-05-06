import * as React from 'react'

import { DialogContent } from '../dialog'
import { Row } from '../layout'
import { TextBox } from '../form'

interface IMinterProps {
  readonly endpoint: string
  readonly preservationPrefix: string
  readonly accessPrefix: string
  readonly apiKey: string
  readonly ercWho: string

  readonly onEndpointChanged: (endpoint: string) => void
  readonly onPreservationPrefixChanged: (prefix: string) => void
  readonly onAccessPrefixChanged: (prefix: string) => void
  readonly onApiKeyChanged: (key: string) => void
  readonly onErcWhoChanged: (who: string) => void
}

export class Minter extends React.Component<IMinterProps, {}> {
  public render() {
    return (
      <DialogContent>
        <Row>
          <TextBox
            label="Endpoint"
            value={this.props.endpoint}
            onValueChanged={this.props.onEndpointChanged}
            autoFocus={true}
          />
        </Row>
        <Row>
          <TextBox
            label="Preservation Prefix"
            value={this.props.preservationPrefix}
            onValueChanged={this.props.onPreservationPrefixChanged}
          />
        </Row>
        <Row>
          <TextBox
            label="Access Prefix"
            value={this.props.accessPrefix}
            onValueChanged={this.props.onAccessPrefixChanged}
          />
        </Row>
        <Row>
          <TextBox
            label="API Key"
            value={this.props.apiKey}
            onValueChanged={this.props.onApiKeyChanged}
          />
        </Row>
        <Row>
          <TextBox
            label="ERC Who"
            value={this.props.ercWho}
            onValueChanged={this.props.onErcWhoChanged}
          />
        </Row>
      </DialogContent>
    )
  }
}