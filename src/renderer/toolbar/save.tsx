import * as React from 'react'
import * as classNames from 'classnames'
import { faSave } from "@fortawesome/free-regular-svg-icons"
import { Dispatcher } from '../../lib/dispatcher';
import { ToolbarButton } from './button';

export interface ISaveButtonProps {
  readonly dispatcher: Dispatcher
  readonly saveState: boolean
  readonly disabled?: boolean
}

export class SaveButton extends React.Component<ISaveButtonProps, {}> {

  private onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    this.props.dispatcher.save()
  }

  public render() {
    const className = classNames('save-button', this.props.saveState ? 'saved' : 'needs-saving')
    const title = this.props.saveState ? 'Saved' : 'Save'

    return (
      <ToolbarButton
        title={title}
        className={className}
        icon={faSave}
        disabled={this.props.saveState || this.props.disabled}
        onClick={this.onClick}
      >
        {this.props.children}
      </ToolbarButton>
    )
  }
}