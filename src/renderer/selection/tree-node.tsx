import * as React from 'react'
import { Button } from '../button'
import {
  ArchivesSpaceChild,
  ArchivesSpaceStore
} from '../../lib/stores/archives-space-store'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSquare } from "@fortawesome/free-regular-svg-icons"
import {
  faCheckSquare,
  faCaretDown,
  faCaretRight
} from "@fortawesome/free-solid-svg-icons"
import { IObject, containerToString } from '../../lib/project'
import * as classNames from 'classnames'
import { AppendObjects } from '../object'
import { ItemTreeNode } from './item-tree-node'

interface ITreeNodeProps {
  readonly child: ArchivesSpaceChild
  readonly archivesSpaceStore: ArchivesSpaceStore
  readonly objects: ReadonlyArray<IObject>
  readonly depth: number
  readonly expanded?: boolean

  readonly onSelect?: (ref: string) => void
  readonly onRemove?: (ref: string) => void
  readonly onRemoveItem?: (uuid: string) => void
  readonly onAppendItems?: (parent: string, num: number) => void
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
          {this.renderInsertField()}
        </div>
        {this.renderNodes()}
        {this.renderItemNodes()}
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
      <div
        className="tree-node-content"
        onClick={this.onExpand}
      >
        <div className="title">
          {this.props.child.title}
        </div>
        <div className="container">{this.state.container}</div>
      </div>
    )
  }

  private renderCheckbox() {
    const selected = this.state.checked
    const className = classNames('select-box', { selected })
    const icon = selected ? faCheckSquare : faSquare

    return (
      <div
        className={className}
        onClick={this.onChange}
      >
        <FontAwesomeIcon
          className="icon"
          icon={icon}
          size="lg"
        />
      </div>
    )
  }

  private renderExpandButton() {
    const hasItems = this.props.objects.findIndex(i => i.parent_uri === this.props.child.record_uri) > -1

    if (!this.props.child.children.length && !hasItems) {
      return (
        <div className="button-spacer"></div>
      )
    }

    const icon = this.state.expanded ? faCaretDown : faCaretRight

    return (
      <Button onClick={this.onExpand}>
        <FontAwesomeIcon
          className="icon"
          icon={icon}
          size="lg"
        />
      </Button>
    )
  }

  private renderInsertField() {
    return (
      <AppendObjects
        onAppendObjectClicked={this.onAppendObjectClicked}
      />
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
          onAppendItems={this.props.onAppendItems}
          onRemoveItem={this.props.onRemoveItem}
        />
      )
    })

    return (
      <ul className="tree-nodes">
        {nodes}
      </ul>
    )
  }

  private renderItemNodes() {
    if (!this.state.expanded) {
      return null
    }

    const items = this.props.objects.filter(item => item.parent_uri === this.props.child.record_uri)

    const nodes = items.map((item, index) => {
      const selected = this.props.objects.findIndex(i => i.uuid === item.uuid) > -1

      return (
        <ItemTreeNode
          key={index}
          item={item}
          selected={selected}
          onRemove={this.props.onRemoveItem}
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

  private onChange = (event: React.MouseEvent<HTMLDivElement>) => {
    const checked = !this.state.checked
    if (checked && this.props.onSelect) {
      this.props.onSelect(this.props.child.record_uri)
    }
    else if (this.props.onRemove) {
      this.props.onRemove(this.props.child.record_uri)
    }
    this.setState({ checked })
  }

  private onAppendObjectClicked = (num: number) => {
    if (this.props.onAppendItems) {
      this.props.onAppendItems(this.props.child.record_uri, num)
      this.setState({ expanded: true })
    }
  }

}