import * as React from 'react'

interface IToolbarProps {
  readonly id?: string
}

export class Toolbar extends React.Component<IToolbarProps, {}> {
  public render() {
    return (
      <div id={this.props.id} className="toolbar">
        {this.props.children}
      </div>
    )
  }
}