import * as React from 'react'
import { IObject, containerToString } from '../../lib/project';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSquare } from "@fortawesome/free-regular-svg-icons"
import { faCheckSquare } from "@fortawesome/free-solid-svg-icons"
import * as classNames from 'classnames'

interface IItemTreeNodeProps {
  readonly item: IObject
  readonly selected: boolean
  readonly onRemove?: (uuid: string) => void
}

export class ItemTreeNode extends React.Component<IItemTreeNodeProps, {}> {

  public render() {
    return (
      <li className="tree-node">
        <div className="tree-node-container">
          <div className="button-spacer"></div>
          {this.renderCheckbox()}
          {this.renderContent()}
        </div>
      </li>
    )
  }

  private renderCheckbox() {
    const selected = this.props.selected
    const className = classNames('select-box', { selected })
    const icon = selected ? faCheckSquare : faSquare

    return (
      <div
        className={className}
        onClick={this.onClick}
      >
        <FontAwesomeIcon
          className="icon"
          icon={icon}
          size="lg"
        />
      </div>
    )
  }

  private renderContent() {
    const container = containerToString(this.props.item.containers[0])
    return (
      <div className="tree-node-content">
        <div className="title">
          {this.props.item.title}
        </div>
        <div className="container">{container}</div>
      </div>
    )
  }

  private onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (this.props.onRemove) {
      this.props.onRemove(this.props.item.uuid)
    }
  }

}