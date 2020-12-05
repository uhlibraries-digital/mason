import * as React from 'react'
import moment from 'moment'

const SECOND = 1000
const MINUTE = SECOND * 60

interface IRelativeTimeProps {
  readonly date: Date
}

interface IRelativeTimeState {
  readonly absoluteText: string
  readonly relativeText: string
}

export class RelativeTime extends React.Component<IRelativeTimeProps, IRelativeTimeState> {

  public constructor(props: IRelativeTimeProps) {
    super(props)

    this.state = {
      absoluteText: '',
      relativeText: ''
    }
  }

  public componentDidMount() {
    this.updateWithDate(this.props.date)
  }

  private updateWithDate(date: Date) {
    const past = moment(date)
    const now = moment()
    const diff = past.diff(now)
    const duration = Math.abs(diff)
    const absoluteText = past.format('LLLL')
    const relativeText = past.from(now)

    if (duration < MINUTE) {
      this.setState({ absoluteText, relativeText: 'just now' })
    }
    else {
      this.setState({ absoluteText, relativeText })
    }
  }

  public render() {
    return (
      <span title={this.state.absoluteText}>{this.state.relativeText}</span>
    )
  }


}