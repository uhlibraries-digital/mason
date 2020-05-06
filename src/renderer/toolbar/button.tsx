import * as React from 'react'
import * as classNames from 'classnames'
import { Button } from '../button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  IconDefinition,
  IconPrefix,
  IconName,
  IconLookup
} from "@fortawesome/free-solid-svg-icons"

export interface IToolbarButtonProps {
  readonly title?: string
  readonly description?: string | JSX.Element
  readonly icon?: IconDefinition | [IconPrefix, IconName] | IconLookup
  readonly className?: string
  readonly disabled?: boolean

  readonly onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export class ToolbarButton extends React.Component<IToolbarButtonProps, {}> {

  public render() {
    const icon = this.props.icon ? (
      <FontAwesomeIcon
        className="icon fas"
        icon={this.props.icon}
        mask={['far', 'newspaper']}
        size="lg"
      />
    ) : null

    const className = classNames('toolbar-button', this.props.className)

    return (
      <div
        className={className}
      >
        <Button
          onClick={this.props.onClick}
          disabled={this.props.disabled}
        >
          {icon}
          {this.renderText()}
          {this.props.children}
        </Button>
      </div>
    )
  }

  private renderText() {
    return (
      <div className="text">
        <div className="title">{this.props.title}</div>
        <div className="description">{this.props.description}</div>
      </div>
    )
  }
}