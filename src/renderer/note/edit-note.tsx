import * as React from 'react'
import { Dispatcher } from '../../lib/dispatcher'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Button, ButtonGroup } from '../button'
import { Row } from '../layout'
import { TextArea } from '../form'
import { IObject } from '../../lib/project';


interface IEditNoteProps {
  readonly dispatcher: Dispatcher
  readonly objects: ReadonlyArray<IObject>
  readonly selectedObjectUuid: string

  readonly onDismissed: () => void
}

interface IEditNoteState {
  readonly note: string
}

export class EditNote extends React.Component<
  IEditNoteProps,
  IEditNoteState
  > {

  constructor(props: IEditNoteProps) {
    super(props)

    const object: IObject | undefined = this.props.objects.find(
      (child) => {
        return child.uuid === this.props.selectedObjectUuid
      })

    this.state = {
      note: object ? object.productionNotes : ''
    }
  }

  public render() {
    return (
      <Dialog
        id="project-note"
        title="Edit Note"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSave}
      >
        <DialogContent>
          <Row>
            <TextArea
              value={this.state.note}
              onValueChanged={this.onNoteChanged}
              autoFocus={true}
            />
          </Row>
        </DialogContent>
        <DialogFooter>
          {this.renderActiveButtons()}
        </DialogFooter>
      </Dialog>
    )
  }

  private onNoteChanged = (note: string) => {
    this.setState({ note: note })
  }

  private renderActiveButtons() {
    return (
      <ButtonGroup>
        <Button type="submit">Save</Button>
        <Button onClick={this.onClearNote}>Clear</Button>
        <Button onClick={this.props.onDismissed}>Cancel</Button>
      </ButtonGroup>
    )
  }

  private onSave = async () => {
    this.props.dispatcher.setObjectNote(
      this.props.selectedObjectUuid,
      this.state.note
    )

    this.props.onDismissed()
  }

  private onClearNote = async () => {
    this.setState({ note: '' })
  }

}
