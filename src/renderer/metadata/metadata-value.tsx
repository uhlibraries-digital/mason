import * as React from 'react'
import {
  BcDamsMap,
  BcDamsMapInput
} from '../../lib/map'
import {
  TextBox,
  TextArea,
  Select
} from '../form'
import { IVocabulary } from '../../lib/vocabulary'

export type SelectionDirection = 'up' | 'down' | 'enter' | 'escape' | 'tab'

interface IMetadataValueProps {
  readonly field: BcDamsMap
  readonly value: string
  readonly valid: boolean
  readonly range: ReadonlyArray<IVocabulary>
  readonly identifier?: string
  readonly index?: number
  readonly tabIndex?: number
  readonly defaultValue?: string

  readonly onChange: (value: string, index?: number) => void
  readonly onSelectChange: (value: string, index?: number) => void
  readonly onBlur?: () => void
  readonly onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
}

interface IMetadataValueState {
  readonly showList: boolean
  readonly selectedIndex: number
  readonly filteredSuggestions: ReadonlyArray<IVocabulary>
}

export class MetadataValue extends React.Component<IMetadataValueProps, IMetadataValueState> {
  private readonly autocompleteListByIndex = new Map<number, HTMLLIElement>()
  private mounted: boolean = false // Avoid React state update on unmounted component error

  constructor(props: IMetadataValueProps) {
    super(props)

    this.state = {
      showList: false,
      selectedIndex: 0,
      filteredSuggestions: []
    }
  }

  public componentDidMount() {
    this.mounted = true
  }

  public componentWillUnmount() {
    this.mounted = false
    window.removeEventListener('click', () => { this.closeSelection() })
  }

  public render() {
    const className = !this.props.valid ? 'invalid' : ''
    const value = this.props.value

    if (this.props.field.input === BcDamsMapInput.Multiple) {
      return (
        <TextArea
          disabled={!this.props.field.editable}
          value={value}
          onValueChanged={this.onValueChanged}
          onBlur={this.props.onBlur}
          tabIndex={this.props.tabIndex}
          placeholder={this.props.identifier}
          textareaClassName={className}
        />
      )
    }
    if (this.props.field.range[0].values) {
      const options = this.props.field.range[0].values.map((value, index) => {
        return (
          <option
            key={index}
            value={value}
          >
            {value}
          </option>
        )
      })
      return (
        <Select
          value={value}
          disabled={!this.props.field.editable}
          tabIndex={this.props.tabIndex}
          onChange={this.onSelectValueChange}
          onBlur={this.props.onBlur}
          className={className}
        >
          <option key="o-none" value=""></option>
          {options}
        </Select>
      )
    }

    return (
      <React.Fragment>
        <TextBox
          disabled={!this.props.field.editable}
          value={value}
          tabIndex={this.props.tabIndex}
          placeholder={this.props.identifier}
          onValueChanged={this.onValueChanged}
          onBlur={this.onBlur}
          className={className}
          onKeyDown={this.onKeyDown}
        />
        {this.renderVocabularyList()}
      </React.Fragment>
    )
  }

  private onValueChanged = (value: string) => {
    const filter = this.props.range.filter((node) => {
      return node.prefLabel.toLowerCase().indexOf(value.toLowerCase()) > -1
    })

    if (this.props.range.length) {
      if (value === '') {
        this.closeSelection()
      }
      else {
        this.setState({
          showList: true,
          filteredSuggestions: filter
        })
        window.addEventListener('click', () => { this.closeSelection() })
      }
    }
    this.props.onChange(value, this.props.index)
  }

  private onSelectValueChange = (event: React.FormEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value
    this.props.onSelectChange(value, this.props.index)
  }

  private renderVocabularyList() {
    const value = this.props.value

    if (!this.props.range.length || !this.state.showList || value === '') {
      return null
    }

    const filter = this.state.filteredSuggestions
    if (!filter.length) {
      return
    }

    const list = filter.map((option, index) => {
      const className = index === this.state.selectedIndex ? 'selected' : ''
      return (
        <AutocompleteItem
          key={index}
          className={className}
          index={index}
          onListRef={this.onListRef}
          onClick={this.onClickAutocomplete}
        >
          {option.prefLabel}
        </AutocompleteItem>
      )
    })

    return (
      <ul className="vocabulary-autocomplete scrollbar">
        {list}
      </ul>
    )
  }

  private onListRef = (index: number, listRef: HTMLLIElement | null) => {
    if (!listRef) {
      this.autocompleteListByIndex.delete(index)
    }
    else {
      this.autocompleteListByIndex.set(index, listRef)
    }
  }

  private onClickAutocomplete = (index: number) => {
    this.setAutocompleteSelection(index)
  }

  private getDirection(event: React.KeyboardEvent<HTMLInputElement>): SelectionDirection | null {
    switch (event.key) {
      case 'ArrowUp':
        return 'up'
      case 'ArrowDown':
        return 'down'
      case 'Enter':
        return 'enter'
      case 'Tab':
        return 'tab'
      case 'Escape':
        return 'escape'
    }

    return null
  }

  private closeSelection() {
    if (!this.mounted) {
      return
    }

    window.removeEventListener('click', () => { this.closeSelection() })
    this.setState({
      showList: false,
      selectedIndex: 0,
      filteredSuggestions: []
    })
  }

  private setAutocompleteSelection(index: number) {
    if (this.state.filteredSuggestions.length) {
      const value = this.state.filteredSuggestions[index].prefLabel
      this.props.onChange(value, this.props.index)
    }
    this.closeSelection()
  }

  private onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const direction = this.getDirection(event)
    if (this.state.showList && direction) {
      event.preventDefault()
      if (direction === 'enter') {
        this.setAutocompleteSelection(this.state.selectedIndex)
      }
      else if (direction === 'tab') {
        this.setAutocompleteSelection(this.state.selectedIndex)
      }
      else if (direction === 'up') {
        if (this.state.selectedIndex === 0) {
          return
        }
        const newSelectedIndex = this.state.selectedIndex - 1
        this.setState({ selectedIndex: newSelectedIndex })
        const element = this.autocompleteListByIndex.get(newSelectedIndex)!
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
      }
      else if (direction === 'down') {
        if (this.state.selectedIndex >= this.state.filteredSuggestions.length - 1) {
          return
        }
        const newSelectedIndex = this.state.selectedIndex + 1
        const element = this.autocompleteListByIndex.get(newSelectedIndex)!
        this.setState({ selectedIndex: this.state.selectedIndex + 1 })
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
      }
      else if (direction === 'escape') {
        this.closeSelection()
      }
    }
    else {
      if (this.props.onKeyDown) {
        this.props.onKeyDown(event)
      }
    }
  }

  private onBlur = () => {
    if (this.props.onBlur && !this.state.showList) {
      this.props.onBlur()
    }
  }
}

interface IAutocompleteItemProps {
  readonly index: number
  readonly className?: string
  readonly onListRef: (index: number, item: HTMLLIElement | null) => void
  readonly onClick?: (index: number) => void
}

class AutocompleteItem extends React.Component<IAutocompleteItemProps, {}> {

  public render() {
    return (
      <li
        ref={this.onRef}
        key={this.props.index}
        className={this.props.className}
        onClick={this.onClick}
      >
        {this.props.children}
      </li>
    )
  }

  private onRef = (ref: HTMLLIElement | null) => {
    this.props.onListRef(this.props.index, ref)
  }

  private onClick = (event: React.MouseEvent<HTMLLIElement>) => {
    if (this.props.onClick) {
      this.props.onClick(this.props.index)
    }
  }
}
