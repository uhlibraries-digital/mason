import * as React from 'react'
import { Dispatcher } from '../../lib/dispatcher'
import {
  Dialog,
  DialogContent,
  DialogFooter
} from '../dialog'
import {
  Button,
  ButtonGroup
} from '../button'
import { Row } from '../layout'
import { TextBox } from '../form'
import { electronStore } from '../../lib/stores'

interface IAvalonPromptProps {
  readonly dispatcher: Dispatcher

  readonly onDismissed: () => void
}

interface IAvalonPromptState {
  readonly username: string
  readonly offsettime: string
}

export class AvalonPrompt extends React.Component<IAvalonPromptProps, IAvalonPromptState> {

  constructor(props: IAvalonPromptProps) {
    super(props)

    const username = String(electronStore.get('avalon-username', ''))
    const offsettime = String(electronStore.get('avalon-offsettime', '00:00:30'))

    this.state = {
      username: username,
      offsettime: offsettime
    }
  }

  public render() {
    return (
      <Dialog
        id="avalon-username"
        title="Avalon Export Options"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSave}
      >
        <DialogContent>
          <Row>
            <TextBox
              label="Username/Email"
              value={this.state.username}
              onValueChanged={this.onChange}
            />
          </Row>
          <Row>
            <TextBox
              label="Thumbnail offset time (HH:MM:SS)"
              value={this.state.offsettime}
              onValueChanged={this.onChange}
            />
          </Row>
        </DialogContent>
        <DialogFooter>
          <ButtonGroup>
            <Button type="submit">Next</Button>
            <Button onClick={this.props.onDismissed}>Cancel</Button>
          </ButtonGroup>
        </DialogFooter>
      </Dialog>
    )
  }

  private onChange = (value: string) => {
    this.setState({ username: value })
  }

  private onSave = () => {
    electronStore.set('avalon-username', this.state.username)
    electronStore.set('avalon-offsettime', this.state.offsettime)
    this.props.dispatcher.exportAvalonPackage(this.state.username, this.state.offsettime)
    this.props.onDismissed()
  }

}