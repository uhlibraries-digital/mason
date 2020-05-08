import * as React from 'react'
import { Button } from '../button'
import {
  ArchivesSpaceChild,
  ArchivesSpaceStore
} from '../../lib/stores/archives-space-store'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as Icons from "@fortawesome/free-solid-svg-icons"
import { Checkbox, CheckboxValue } from '../form'
import { IObject, containerToString } from '../../lib/project'

interface ITreeNodeProps {
  readonly child: ArchivesSpaceChild
  readonly archivesSpaceStore: ArchivesSpaceStore
  readonly objects: ReadonlyArray<IObject>
  readonly depth: number
  readonly expanded?: boolean

  readonly onSelect?: (ref: string) => void
  readonly onRemove?: (ref: string) => void
}

interface ITreeNodeState {
  readonly expanded?: boolean
  readonly container: string
  readonly checked: boolean
}

export class TreeNode extends React.Component<ITreeNodeProps, ITreeNodeState> {
  private mounted: boolean = false // Avoid React state update on unmounted component error

  constructor(props: ITreeNodeProps) {
    super(props)

    const objectIndex = this.props.objects.findIndex(o => o && o.uri === this.props.child.record_uri)
    const checked = objectIndex > -1

    this.state = {
      expanded: this.props.expanded,
      container: '',
      checked: checked
    }
  }

  public componentDidMount() {
    this.mounted = true
    this.getContainers(this.props.child.record_uri)
  }

  public componentWillUnmount() {
    this.mounted = false
  }

  public render() {
    return (
      <li className="tree-node">
        <div className="tree-node-container">
          {this.renderExpandButton()}
          {this.renderCheckbox()}
          {this.renderContent()}
        </div>
        {this.renderNodes()}
      </li>
    )
  }

  private async getContainers(uri: string) {
    const containers = await this.props.archivesSpaceStore.getContainer(uri)
    if (!containers.length || !this.mounted) {
      return
    }
    const container = containerToString(containers[0])
    this.setState({ container })
  }

  private renderContent() {
    return (
      <div className="tree-node-content">
        <div
          className="title"
          onClick={this.onExpand}
        >
          {this.props.child.title}
        </div>
        <div className="container">{this.state.container}</div>
      </div>
    )
  }

  private renderCheckbox() {
    return (
      <Checkbox
        value={this.state.checked ? CheckboxValue.On : CheckboxValue.Off}
        onChange={this.onChange}
      />
    )
  }

  private renderExpandButton() {
    if (!this.props.child.children.length) {
      return null
    }

    if (this.state.expanded) {
      return (
        <Button onClick={this.onExpand}>
          <FontAwesomeIcon
            className="icon"
            icon={Icons.faCaretDown}
            size="lg"
          />
        </Button>
      )
    }

    return (
      <Button onClick={this.onExpand}>
        <FontAwesomeIcon
          className="icon"
          icon={Icons.faCaretRight}
          size="lg"
        />
      </Button>
    )
  }


  private renderNodes() {
    if (!this.props.child.children.length || !this.state.expanded) {
      return null
    }

    const nodes = this.props.child.children.map((child, index) => {
      return (
        <TreeNode
          key={index}
          child={child}
          depth={this.props.depth + 1}
          objects={this.props.objects}
          archivesSpaceStore={this.props.archivesSpaceStore}
          onSelect={this.props.onSelect}
          onRemove={this.props.onRemove}
        />
      )
    })

    return (
      <ul className="tree-nodes">
        {nodes}
      </ul>
    )
  }

  private onExpand = (event: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLDivElement>) => {
    const expanded = !this.state.expanded
    this.setState({ expanded })
  }

  private onChange = (event: React.FormEvent<HTMLInputElement>) => {
    const checked = event.currentTarget.checked
    if (checked && this.props.onSelect) {
      this.props.onSelect(this.props.child.record_uri)
    }
    else if (this.props.onRemove) {
      this.props.onRemove(this.props.child.record_uri)
    }
    this.setState({ checked })
  }

}