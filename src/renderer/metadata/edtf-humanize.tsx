import * as React from 'react'
import { EdtfHumanizer } from '../../lib/edtf-humanizer'

interface IEdtfHumanizeProps {
  readonly date: string
}

export class EdtfHumanize extends React.Component<IEdtfHumanizeProps, {}> {

  public render() {
    const date = new EdtfHumanizer(this.props.date)
    let humanize
    try {
      humanize = date.humanize()
    } catch (err) {
      humanize = 'unknown'
    }

    return (
      <div className="edtf-humanize">
        {humanize}
      </div>
    )
  }

}