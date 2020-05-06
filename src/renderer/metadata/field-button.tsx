import * as React from 'react'
import { Button } from '../button'

interface IFieldButtonProps {
  readonly index: number
  readonly onClick?: (index: number) => void
}

export class FieldButton extends React.Component<IFieldButtonProps, {}> {
  public render() {
    return (
      <Button
        tabIndex={-1}
        onClick={this.onClick}
      >
        {this.props.children}
      </Button>
    )
  }

  private onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (this.props.onClick) {
      this.props.onClick(this.props.index)
    }
  }
}