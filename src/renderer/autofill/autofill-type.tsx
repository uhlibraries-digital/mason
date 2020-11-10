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
import { ProcessingType } from '../../lib/project'

interface IAutofillTypeProps {
  readonly dispatcher: Dispatcher

  readonly onDismissed: () => void
}

interface IAutofillTypeState {
  readonly processingType: ProcessingType
}

export class AutofillType extends React.Component<IAutofillTypeProps, IAutofillTypeState> {

  public constructor(props: IAutofillTypeProps) {
    super(props)

    this.state = {
      processingType: ProcessingType.Unknown
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
    this.props.dispatcher.autofillProcessingType(this.state.processingType)

    this.props.onDismissed()
  }

  public render() {
    const types: ReadonlyArray<IRadioBoxItem> = [
      { title: 'Image' },
      { title: 'Text' },
      { title: 'Video' },
      { title: 'Sound ' }
    ]
    const selected = this.processingSelection(this.state.processingType)

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

  private processingSelection(type: ProcessingType) {
    switch (type) {
      case ProcessingType.Text:
        return 1
      case ProcessingType.Video:
        return 2
      case ProcessingType.Sound:
        return 3
    }
    return 0
  }

  private indexToType(index: number): ProcessingType {
    switch (index) {
      case 1:
        return ProcessingType.Text
      case 2:
        return ProcessingType.Video
      case 3:
        return ProcessingType.Sound
    }

    return ProcessingType.Image
  }

  private onSelectedTypeChange = (index: number) => {
    const type = this.indexToType(index)
    this.setState({ processingType: type })
  }

}