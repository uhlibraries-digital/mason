import * as React from 'react'
import { faCheckSquare } from "@fortawesome/free-regular-svg-icons"
import { Dispatcher } from '../../lib/dispatcher';
import { ToolbarButton } from './button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as Icons from "@fortawesome/free-solid-svg-icons"

export interface ISelectionButtonProps {
  readonly dispatcher: Dispatcher
  readonly selected: boolean
  readonly disabled?: boolean

  readonly onClick?: () => void
}

export class SelectionButton extends React.Component<ISelectionButtonProps, {}> {

  private onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (this.props.onClick) {
      this.props.onClick()
    }
  }

  public render() {
    const className = this.props.selected ? 'selected' : undefined
    const arrow = this.props.selected ? Icons.faCaretUp : Icons.faCaretDown

    return (
      <ToolbarButton
        title="Archival Selection"
        disabled={this.props.disabled}
        icon={faCheckSquare}
        className={className}
        onClick={this.onClick}
      >
        <FontAwesomeIcon
          className="icon"
          icon={arrow}
          size="lg"
        />
      </ToolbarButton>
    )
  }
}