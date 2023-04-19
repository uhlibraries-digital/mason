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
import {
  IObject,
  containerToString,
  displayTitle,
  hasSelectedChildren
} from '../../lib/project'
import classNames from 'classnames'
import { AppendObjects } from '../object'
import { ItemTreeNode } from './item-tree-node'
import { ItemNote } from './item-note'

interface ITreeNodeProps {
  readonly child: ArchivesSpaceChild
  readonly archivesSpaceStore: ArchivesSpaceStore
  readonly objects: ReadonlyArray<IObject>
  readonly depth: number
  readonly expanded?: boolean

  readonly onSelect?: (ref: string) => void
  readonly onRemove?: (ref: string) => void
  readonly onRemoveItem?: (uuid: string) => void
  readonly onAppendItems?: (parent: string, title: string, num: number) => void
  readonly onNoteClick?: (uuid: string) => void
}

interface ITreeNodeState {
  readonly expanded?: boolean
  readonly checked: boolean
  readonly productionNote: string
}

export class TreeNode extends React.Component<ITreeNodeProps, ITreeNodeState> {

  constructor(props: ITreeNodeProps) {
    super(props)

    const objectIndex = this.props.objects.findIndex(o => o && o.uri === this.props.child.record_uri)
    const checked = objectIndex > -1
    const productionNote = checked ? this.props.objects[objectIndex].productionNotes : ''

    this.state = {
      expanded: this.props.expanded,
      checked: checked,
      productionNote: productionNote
    }
  }

  public render() {
    return (
      <li className="tree-node">
        <div className="tree-node-container">
          {this.renderExpandButton()}
          {this.renderCheckbox()}
          {this.renderProductionNote()}
          {this.renderContent()}
          {this.renderInsertField()}
        </div>
        {this.renderNodes()}
        {this.renderItemNodes()}
      </li>
    )
  }

  private renderContent() {
    const container = containerToString(this.props.child.containers[0])
    return (
      <div
        className="tree-node-content"
        onClick={this.onExpand}
      >
        <div className="title">
          {displayTitle(this.props.child.title, this.props.child.dates)}
        </div>
        <div className="container">{container}</div>
      </div>
    )
  }

  private renderCheckbox() {
    const selected = this.state.checked
    const selectedChildren = hasSelectedChildren(this.props.child, this.props.objects)
    const className = classNames('select-box', { selected }, { selectedChildren })
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

  private renderProductionNote() {
    const note = this.state.productionNote
    return (
      <ItemNote
        note={note}
        onNoteClick={this.onNoteClick}
      />
    )
  }

  private onNoteClick = () => {
    if (this.props.onNoteClick) {
      const item = this.props.objects.find(o => o && o.uri === this.props.child.record_uri)
      if (!item) {
        return
      }

      this.props.onNoteClick(item.uuid)
    }
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
          onNoteClick={this.props.onNoteClick}
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
          onNoteClick={this.props.onNoteClick}
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
      const title = displayTitle(this.props.child.title, this.props.child.dates)
      
      this.props.onAppendItems(this.props.child.record_uri, title, num)
      this.setState({ expanded: true })
    }
  }

}