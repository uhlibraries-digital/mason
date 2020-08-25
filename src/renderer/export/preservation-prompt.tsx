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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons'

interface IPreservationPromptProps {
  readonly dispatcher: Dispatcher

  readonly onDismissed: () => void
}

export class PreservationPrompt extends React.Component<IPreservationPromptProps, {}> {
  public render() {
    return (
      <Dialog
        id="preservation-prompt"
        title="Preservation Export"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSave}
      >
        <DialogContent>
          <FontAwesomeIcon
            className="icon"
            icon={faQuestionCircle}
            size="3x"
          />
          <p>Some objects do not have preservation ARKs. Do you want to mint them before export?</p>
        </DialogContent>
        <DialogFooter>
          <ButtonGroup>
            <Button type="submit">Yes</Button>
            <Button onClick={this.onNoClick}>No</Button>
          </ButtonGroup>
        </DialogFooter>
      </Dialog>
    )
  }

  private onSave = () => {
    this.props.dispatcher.exportPreservation(true)
    this.props.onDismissed()
  }

  private onNoClick = () => {
    this.props.dispatcher.exportPreservation(false)
    this.props.onDismissed()
  }

}