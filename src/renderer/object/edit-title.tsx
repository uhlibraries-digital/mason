import * as React from 'react'
import { Dispatcher } from '../../lib/dispatcher'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Button, ButtonGroup } from '../button'
import { Row } from '../layout'
import { TextBox } from '../form'
import { IObject } from '../../lib/project';


interface IEditTitleProps {
  readonly dispatcher: Dispatcher
  readonly objects: ReadonlyArray<IObject>
  readonly selectedObjectUuid: string

  readonly onDismissed: () => void
}

interface IEditTitleState {
  readonly title: string
}

export class EditTitle extends React.Component<
  IEditTitleProps,
  IEditTitleState
  > {

  constructor(props: IEditTitleProps) {
    super(props)

    const object: IObject | undefined = this.props.objects.find(
      (child) => {
        return child.uuid === this.props.selectedObjectUuid
      })

    this.state = {
      title: object ? object.title : ''
    }
  }

  public render() {
    return (
      <Dialog
        id="object-title"
        title="Edit Title"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSave}
      >
        <DialogContent>
          <Row>
            <TextBox
              value={this.state.title}
              onValueChanged={this.onTitleChanged}
              autoFocus={true}
              autoSelectAll={true}
            />
          </Row>
        </DialogContent>
        <DialogFooter>
          {this.renderActiveButtons()}
        </DialogFooter>
      </Dialog>
    )
  }

  private onTitleChanged = (title: string) => {
    this.setState({ title: title })
  }

  private renderActiveButtons() {
    return (
      <ButtonGroup>
        <Button type="submit">Save</Button>
        <Button onClick={this.props.onDismissed}>Cancel</Button>
      </ButtonGroup>
    )
  }

  private onSave = async () => {
    this.props.dispatcher.setObjectTitle(
      this.props.selectedObjectUuid,
      this.state.title
    )

    this.props.onDismissed()
  }

}
