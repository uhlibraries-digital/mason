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
import { PopupType } from '../../lib/app-state'

interface IOverwritePromptProps {
  readonly dispatcher: Dispatcher
  readonly overwriteLength: number
  readonly onDismissed: () => void
}

export class OverwritePrompt extends React.Component<IOverwritePromptProps, {}> {
  public render() {
    const objText = this.props.overwriteLength > 1 ? 'objects' : 'object'

    return (
      <Dialog
        id="overwrite-prompt"
        title="Overwrite"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSave}
      >
        <DialogContent>
          <FontAwesomeIcon
            className="icon"
            icon={faQuestionCircle}
            size="3x"
          />
          <p>Access files already exist for {this.props.overwriteLength} {objText}. Do you want to overwrite?</p>
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
    this.props.onDismissed()
    this.props.dispatcher.showPopup({ type: PopupType.AccessConvertOptions })
  }

  private onNoClick = () => {
    this.props.onDismissed()
  }

}