import * as React from 'react'
import * as classNames from 'classnames'
import {
  IconDefinition,
  IconPrefix,
  IconName,
  IconLookup,
  faCaretDown
} from "@fortawesome/free-solid-svg-icons"
import { ToolbarButton } from './button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export type DropdownState = 'open' | 'closed'

export interface IToolbarDropdownProps {
  readonly title?: string
  readonly description?: string | JSX.Element
  readonly className?: string
  readonly icon?: IconDefinition | [IconPrefix, IconName] | IconLookup
}

export class ToolbarDropdown extends React.Component<IToolbarDropdownProps, {}> {


  private renderDropdownArrow() {
    return (
      <FontAwesomeIcon
        icon={faCaretDown}
        size="lg"
      />
    )
  }

  public render() {
    const className = classNames('toolbar-dropdown', this.props.className)

    return (
      <div
        className={className}
      >
        <ToolbarButton
          icon={this.props.icon}
          title={this.props.title}
          description={this.props.description}
        >
          {this.props.children}
          {this.renderDropdownArrow()}
        </ToolbarButton>
      </div>
    )
  }
}