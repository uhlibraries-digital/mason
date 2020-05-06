import * as React from 'react'
import { Dispatcher } from '../../lib/dispatcher'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Button, ButtonGroup } from '../button'
import { IProject, ProjectType } from '../../lib/project'
import { Row } from '../layout'
import { TextBox } from '../form'

interface IProjectProps {
  readonly dispatcher: Dispatcher
  readonly project: IProject

  readonly onDismissed: () => void
}

interface IProjectState {
  readonly title: string
  readonly type: ProjectType
  readonly resource: string
}

export class Project extends React.Component<
  IProjectProps,
  IProjectState
  > {

  public constructor(props: IProjectProps) {
    super(props)

    const title = this.props.project.collectionArkUrl || this.props.project.collectionTitle

    this.state = {
      title: title,
      type: this.props.project.type,
      resource: this.props.project.resource
    }

  }

  private onSave = async () => {
    this.props.dispatcher.setProjectTitle(this.state.title)

    this.props.onDismissed()
  }

  private renderActiveButtons() {
    return (
      <ButtonGroup>
        <Button type="submit">Save</Button>
        <Button onClick={this.props.onDismissed}>Cancel</Button>
      </ButtonGroup>
    )
  }

  public render() {
    return (
      <Dialog
        id="project-info"
        title="Project"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSave}
      >
        <DialogContent>
          <Row>
            <TextBox
              label="Collection Title or ARK"
              value={this.state.title}
              onValueChanged={this.onTitleChanged}
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

  private onTitleChanged = (title: string) => {
    this.setState({ title: title })
  }


}