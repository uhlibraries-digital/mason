import * as React from 'react'

interface INoteProps {
  readonly note: string
}

export class Note extends React.Component<INoteProps, {}> {
  public render() {
    if (this.props.note === '') {
      return null
    }

    return (
      <div className="note-container">
        {this.props.note}
      </div>
    )
  }
}