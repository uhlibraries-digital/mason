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
import { IObject } from '../../lib/project'
import { PopupType } from '../../lib/app-state'

interface IAicPromptProps {
  readonly dispatcher: Dispatcher
  readonly aic: string
  readonly objects: ReadonlyArray<IObject>

  readonly onDismissed: () => void
}

interface IAicPromptState {
  readonly aic: string
}

export class AicPrompt extends React.Component<IAicPromptProps, IAicPromptState> {
  constructor(props: IAicPromptProps) {
    super(props)

    this.state = {
      aic: this.props.aic
    }
  }


  public render() {
    return (
      <Dialog
        id="aic-prompt"
        title="Enter AIC"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSave}
      >
        <DialogContent>
          <Row>
            <TextBox
              label="Archival Information Collection (AIC)"
              value={this.state.aic}
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
    this.setState({ aic: value })
  }

  private onSave = () => {
    this.props.dispatcher.saveAic(this.state.aic)
    this.props.onDismissed()

    const objects = this.props.objects
    const missing = objects.filter(item => item.pm_ark === '' || item.pm_ark === undefined).length
    if (missing > 0) {
      this.props.dispatcher.showPopup({ type: PopupType.PreservationExport })
    }
    else {
      this.props.dispatcher.exportPreservation(false)
    }
  }

}