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
import { RadioBox } from '../form'
import { IRadioBoxItem } from '../form/radiobox'
import { Row } from '../layout'

interface IAutofillTypeProps {
  readonly dispatcher: Dispatcher

  readonly onDismissed: () => void
}

interface IAutofillTypeState {
  readonly isText: boolean
}

export class AutofillType extends React.Component<IAutofillTypeProps, IAutofillTypeState> {

  public constructor(props: IAutofillTypeProps) {
    super(props)

    this.state = {
      isText: false
    }
  }

  private renderActiveButtons() {
    return (
      <ButtonGroup>
        <Button type="submit">Change</Button>
        <Button onClick={this.props.onDismissed}>Cancel</Button>
      </ButtonGroup>
    )
  }

  private onSave = () => {
    this.props.dispatcher.autofillAccessType(this.state.isText)

    this.props.onDismissed()
  }

  public render() {
    const types: ReadonlyArray<IRadioBoxItem> = [
      { title: 'Image' },
      { title: 'Text' }
    ]
    const selected = this.state.isText ? 1 : 0

    return (
      <Dialog
        id="object-typechange"
        title="Change Access Image Processing Type"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSave}
      >
        <DialogContent>
          <Row className="access-type-selection">
            <RadioBox
              items={types}
              selectedIndex={selected}
              onSelectionChange={this.onSelectedTypeChange}
            />
          </Row>
        </DialogContent>
        <DialogFooter>
          {this.renderActiveButtons()}
        </DialogFooter>
      </Dialog>
    )
  }

  private onSelectedTypeChange = (index: number) => {
    this.setState({ isText: index === 1 })
  }

}