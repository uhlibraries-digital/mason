import * as React from 'react'
import { TextBox } from '../form'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons'

interface ISearchProps {
  readonly onDismissed: () => void
  readonly onSearch: (query: string) => void
}

interface ISearchState {
  readonly text: string
}

export class Search extends React.Component<ISearchProps, ISearchState> {
  private textBoxRef: TextBox | null = null

  constructor(props: ISearchProps) {
    super(props)

    this.state = {
      text: ''
    }
  }

  public componentDidMount() {
    if (this.textBoxRef) {
      this.textBoxRef.focus()
    }
  }

  public render() {
    return (
      <div className="search" >
        <TextBox
          className='search-field'
          onKeyDown={this.onKeyDown}
          ref={this.onTextBoxRef}
          value={this.state.text}
          placeholder='Search'
          onValueChanged={this.onValueChanged}
        />
        <div
          className="icon"
          onClick={this.onClick}
        >
          <FontAwesomeIcon
            className="icon"
            icon={faTimesCircle}
            size="lg"
          />
        </div>
      </div>
    )
  }

  private onClick = () => {
    this.props.onDismissed()
  }

  private onTextBoxRef = (textbox: TextBox) => {
    this.textBoxRef = textbox
  }

  private onValueChanged = (value: string) => {
    this.setState({ text: value })
  }

  private onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      this.props.onDismissed()
    }
    else if (event.key === 'Enter') {
      this.props.onSearch(this.state.text)
    }
  }

}