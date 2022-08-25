import * as React from 'react'
import classNames from 'classnames'
import {
  BcDamsMap,
  BcDamsMapObligation,
  defaultFieldDelemiter
} from '../../lib/map'
import { Row } from '../layout'
import { LinkButton } from '../button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as Icons from "@fortawesome/free-solid-svg-icons"
import { IVocabulary } from '../../lib/vocabulary'
import { EdtfHumanize } from './edtf-humanize'
import { MetadataValue } from './metadata-value'
import { FieldButton } from './field-button'
import { ISearchResults } from '../../lib/search'

const edtf = require('edtf');

interface IMetadataFieldProps {
  readonly field: BcDamsMap
  readonly value: string
  readonly identifier: string
  readonly range: ReadonlyArray<IVocabulary>
  readonly defaultValue?: string
  readonly searchResults: ISearchResults | null

  readonly onValueChange?: (identifier: string, value: string) => void
}

interface IMetadataFieldState {
  readonly value: string
  readonly showVocabulary: boolean
  readonly locked: boolean
}

export class MetadataField extends React.Component<IMetadataFieldProps, IMetadataFieldState> {

  private defaultValueUsed: boolean = false

  constructor(props: IMetadataFieldProps) {
    super(props)

    this.state = {
      value: this.props.value,
      showVocabulary: false,
      locked: !this.props.field.editable
    }
  }

  public componentDidMount() {
    this.handleDefaultValue(this.props.value, this.props.defaultValue)
  }

  public UNSAFE_componentWillReceiveProps(nextProps: IMetadataFieldProps) {
    this.setState({
      value: nextProps.value,
      showVocabulary: false
    })
    this.defaultValueUsed = false
    this.handleDefaultValue(nextProps.value, nextProps.defaultValue)
  }

  private handleDefaultValue(value: string, defaultValue?: string) {
    if (!this.defaultValueUsed && defaultValue && value === '') {
      this.defaultValueUsed = true
      this.setState({ value: defaultValue })
      if (this.props.onValueChange) {
        this.props.onValueChange(this.props.identifier, defaultValue)
      }
    }
  }

  public render() {
    return (
      <Row className="metadata-field">
        <div className="label-container">
          {this.renderLabel()}
          {this.renderLock()}
          {this.renderObligation()}
          {this.renderValid()}
        </div>
        {this.renderDescription()}
        {this.renderFields()}
      </Row>
    )
  }

  private renderLabel() {
    if (this.props.field.uri) {
      return (
        <label>
          <LinkButton
            tabIndex={-1}
            uri={this.props.field.uri}
          >
            {this.props.field.label}
          </LinkButton>
        </label>
      )
    }

    return (
      <label>{this.props.field.label}</label>
    )
  }

  private renderLock() {
    const lock = this.state.locked
    if (this.props.field.editable) {
      return null
    }
    if (lock) {
      return (
        <span
          className="lock"
          onClick={this.onLockChange}
        >
          <FontAwesomeIcon
            icon={Icons.faLock}
            title="Field Locked"
          />
        </span>
      )
    }

    return (
      <span
        className="lock open"
        onClick={this.onLockChange}
      >
        <FontAwesomeIcon
          icon={Icons.faLockOpen}
          title="Field Unlocked"
        />
      </span>
    )

  }

  private renderObligation() {
    const value = this.state.value

    const className = classNames('obligation', this.props.field.obligation)

    if (this.props.field.repeatable) {
      const values = value.split(defaultFieldDelemiter)
      if (!values.includes('')) {
        return null
      }
    }
    else if (value !== '') {
      return null
    }

    switch (this.props.field.obligation) {
      case BcDamsMapObligation.Required:
        return (
          <span className={className}>
            <FontAwesomeIcon
              icon={Icons.faExclamationCircle}
              title="Required"
            />
          </span>
        )
      case BcDamsMapObligation.stronglyRecommended:
        return (
          <span className={className}>
            <FontAwesomeIcon
              icon={Icons.faExclamation}
              title="Strongly recommended"
            />
          </span>
        )
      case BcDamsMapObligation.Recommended:
        return (
          <span className={className}>
            <FontAwesomeIcon
              icon={Icons.faThumbsUp}
              title="Recommended"
            />
          </span>
        )
    }

    return null
  }

  private renderValid() {
    const value = this.state.value

    if (this.isValidValue(value)) {
      return null
    }
    if (this.props.field.repeatable) {
      const values = value.split(defaultFieldDelemiter)
      const checks = values.filter((value) => {
        return !this.isValidValue(value)
      })
      if (checks.length === 0) {
        return null
      }
    }

    return (
      <span className="invalid">
        <FontAwesomeIcon
          icon={Icons.faExclamationTriangle}
          title="Invalid"
        />
      </span>
    )
  }

  private isValidValue(value: string): boolean {
    if (value === '') {
      return true
    }
    if (this.props.identifier === 'dc.date') {
      try {
        edtf(value)
      } catch (e) {
        return false
      }
    }
    if (this.props.range.length === 0) {
      return true
    }

    const vocab = this.props.range.find(
      range => range.prefLabel.toLowerCase() === value.toLowerCase())

    return vocab !== undefined
  }

  private renderDescription() {
    return (
      <div className="field-description">
        {this.props.field.definition}
      </div>
    )
  }

  private renderFields() {
    const disabled = this.state.locked

    if (this.props.field.repeatable) {
      const values = this.state.value.split(defaultFieldDelemiter)
      return values.map((value, index) => {
        const valid = this.isValidValue(value)
        return (
          <div
            key={index}
            className="field-container"
          >

            <MetadataValue
              disabled={disabled}
              field={this.props.field}
              range={this.props.range}
              value={value}
              defaultValue={this.props.defaultValue}
              valid={valid}
              index={index}
              identifier={this.props.identifier}
              searchResults={this.props.searchResults}
              onChange={this.onChange}
              onBlur={this.onBlur}
              onKeyDown={this.onKeyDown}
              onSelectChange={this.onSelectChange}
            />
            {this.renderButtons(index)}
            {this.renderEdtfDate(value)}
          </div>
        )
      })
    }

    const valid = this.isValidValue(this.state.value)
    return (
      <div className="field-container">
        <MetadataValue
          disabled={disabled}
          field={this.props.field}
          range={this.props.range}
          value={this.state.value}
          defaultValue={this.props.defaultValue}
          valid={valid}
          searchResults={this.props.searchResults}
          onChange={this.onChange}
          onBlur={this.onBlur}
          onKeyDown={this.onKeyDown}
          onSelectChange={this.onSelectChange}
        />
        {this.renderEdtfDate(this.state.value)}
      </div>
    )
  }

  private renderEdtfDate(value: string) {
    if (value === '') {
      return null
    }
    if (this.props.identifier !== 'dc.date') {
      return null
    }

    return (
      <EdtfHumanize
        date={value}
      />
    )
  }

  private renderButtons(index: number) {
    if (!this.props.field.repeatable) {
      return null
    }

    const buttons = [(
      <FieldButton
        key={0}
        index={index}
        onClick={this.addFieldValue}
      >
        <FontAwesomeIcon
          icon={Icons.faPlus}
        />
      </FieldButton>
    ),
    (
      <FieldButton
        key={1}
        index={index}
        onClick={this.subtractFieldValue}
      >
        <FontAwesomeIcon
          icon={Icons.faMinus}
        />
      </FieldButton>
    )
    ]

    return (
      <div className="buttons">
        {buttons}
      </div>
    )
  }

  private onChange = (value: string, index?: number) => {
    if (index !== undefined && this.props.field.repeatable) {
      const values = this.state.value.split(defaultFieldDelemiter)
      values[index] = value
      value = values.join(defaultFieldDelemiter)
    }
    this.setState({ value: value })
  }

  private onSelectChange = (value: string, index?: number) => {
    if (index !== undefined && this.props.field.repeatable) {
      const values = this.state.value.split(defaultFieldDelemiter)
      values[index] = value
      value = values.join(defaultFieldDelemiter)
    }
    this.setState({ value: value })

    if (this.props.onValueChange) {
      this.props.onValueChange(this.props.identifier, value)
    }
  }

  private addFieldValue = (index: number) => {
    if (this.props.field.repeatable) {
      const values = this.state.value.split(defaultFieldDelemiter)
      values.splice(index + 1, 0, '')

      this.setState({ value: values.join(defaultFieldDelemiter) })
    }
  }

  private subtractFieldValue = (index: number) => {
    if (this.props.field.repeatable) {
      const values = this.state.value.split(defaultFieldDelemiter)
      values.splice(index, 1)

      const value = values.join(defaultFieldDelemiter)

      this.setState({ value: value })

      if (this.props.onValueChange) {
        this.props.onValueChange(this.props.identifier, value)
      }
    }
  }

  private onBlur = () => {
    if (this.props.onValueChange) {
      this.props.onValueChange(this.props.identifier, this.state.value)
    }
  }

  private onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.keyCode === 13 && this.props.onValueChange) {
      this.props.onValueChange(this.props.identifier, this.state.value)
    }
  }

  private onLockChange = (event: React.MouseEvent<HTMLSpanElement>) => {
    this.setState({ locked: !this.state.locked })
  }

}