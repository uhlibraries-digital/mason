import * as React from 'react'

export class TitleBar extends React.Component<{}, {}> {
  public render() {
    return (
      <div id="app-title-bar">
        {this.props.children}
      </div>
    )
  }
}