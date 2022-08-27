import * as React from 'react'
import { TextBox } from '../form'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTimes,
  faArrowUp,
  faArrowDown
} from '@fortawesome/free-solid-svg-icons'
import { SearchButton } from './search-button'

interface ISearchProps {
  readonly totalResults: number
  readonly onDismissed: () => void
  readonly onSearch: (query: string) => void
  readonly onMoveSearch: (direction: 'next' | 'previous') => void
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
    const resultString = this.props.totalResults === 0 ?
      'No Results' : `${this.props.totalResults} found`

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
        <div className="search-total">
          {resultString}
        </div>
        {this.renderButtons()}
      </div>
    )
  }

  private renderButtons() {
    const disabled = this.props.totalResults <= 1

    return (
      <div className="buttons">
        <SearchButton
          disabled={disabled}
          onClick={this.previousSearch}
        >
          <FontAwesomeIcon
            icon={faArrowUp}
          />
        </SearchButton>
        <SearchButton
          disabled={disabled}
          onClick={this.nextSearch}
        >
          <FontAwesomeIcon
            icon={faArrowDown}
          />
        </SearchButton>
        <SearchButton
          onClick={this.onClose}
        >
          <FontAwesomeIcon
            icon={faTimes}
          />
        </SearchButton>
      </div>
    )
  }

  private onClose = () => {
    this.props.onDismissed()
  }

  private previousSearch = () => {
    this.props.onMoveSearch('previous')
  }

  private nextSearch = () => {
    this.props.onMoveSearch('next')
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