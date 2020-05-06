import * as React from 'react'
import { TextBox } from '../form'
import { Button } from '../button'

interface IAppendObjectsProps {
  readonly onAppendObjectClicked: (num: number) => void
}

interface IAppendObjectsState {
  readonly num: number
}

export class AppendObjects extends React.Component<IAppendObjectsProps, IAppendObjectsState> {

  public constructor(props: IAppendObjectsProps) {
    super(props)

    this.state = {
      num: 1
    }
  }

  private onValueChanged = (num: string) => {
    this.setState({ num: Number(num) })
  }

  private onClick = (event: React.MouseEvent<HTMLElement>) => {
    this.props.onAppendObjectClicked(this.state.num)
  }

  private onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.keyCode === 13) {
      this.props.onAppendObjectClicked(this.state.num)
    }
  }

  public render() {
    return (
      <div className="object-insert">
        <TextBox
          value={String(this.state.num)}
          onValueChanged={this.onValueChanged}
          placeholder="insert objects"
          className="object-insert-number"
          onKeyDown={this.onKeyDown}
        />
        <Button
          type="submit"
          onClick={this.onClick}
        >Add</Button>
      </div>
    )
  }

}