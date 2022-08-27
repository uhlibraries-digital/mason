import * as React from 'react'
import { Button } from '../button'

interface ISearchButtonProps {
  readonly disabled?: boolean
  readonly onClick?: () => void
}

export class SearchButton extends React.Component<ISearchButtonProps, {}> {
  public render() {
    return (
      <Button
        disabled={this.props.disabled}
        onClick={this.onClick}
      >
        {this.props.children}
      </Button>
    )
  }

  private onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (this.props.onClick) {
      this.props.onClick()
    }
  }
}