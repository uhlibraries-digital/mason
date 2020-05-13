import * as React from 'react'
import { Dispatcher } from '../../lib/dispatcher'
import {
  Dialog,
  DialogContent,
  DialogFooter
} from '../dialog'
import {
  Button,
  ButtonGroup
} from '../button'
import { Row } from '../layout'
import { Select } from '../form'
import {
  BcDamsMap,
  defaultFieldDelemiter
} from '../../lib/map'
import { IVocabularyMapRange } from '../../lib/vocabulary'
import {
  MetadataValue,
  FieldButton
} from '../metadata'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as Icons from "@fortawesome/free-solid-svg-icons"
import { MetadataAutofillType } from '../../lib/app-state'


interface IAutofillProps {
  readonly dispatcher: Dispatcher
  readonly selectedObjects: ReadonlyArray<string>
  readonly accessMap: ReadonlyArray<BcDamsMap> | null
  readonly vocabularyRanges: ReadonlyArray<IVocabularyMapRange>

  readonly onDismissed: () => void
}

interface IAutofillState {
  readonly value: string
  readonly selectedField: BcDamsMap | null
}

export class Autofill extends React.Component<IAutofillProps, IAutofillState> {

  constructor(props: IAutofillProps) {
    super(props)

    this.state = {
      value: '',
      selectedField: null
    }
  }

  public render() {
    const fieldOptions = this.props.accessMap ?
      this.props.accessMap.map((field, index) => {
        const identifier = `${field.namespace}.${field.name}`
        return (
          <option
            key={index}
            value={identifier}
          >
            {field.label}
          </option>
        )
      })
      : null


    return (
      <Dialog
        id="object-autofill"
        title="Autofill Metadata"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSave}
      >
        <DialogContent>
          <Row>
            <Select
              onChange={this.onSelectFieldChange}
            >
              <option key="o-none" value=""></option>
              {fieldOptions}
            </Select>
          </Row>
          {this.renderFieldValue()}
        </DialogContent>
        <DialogFooter>
          {this.renderActiveButtons()}
        </DialogFooter>
      </Dialog>
    )
  }

  private renderFieldValue() {
    const field = this.state.selectedField
    const map = this.props.accessMap

    if (!field || !map) {
      return this.renderSelectFieldMessage()
    }

    const selectedRange = this.props.vocabularyRanges.find(node =>
      node.prefLabel.toLowerCase() === field.range[0].label.toLowerCase())
    const range = selectedRange ? selectedRange.nodes : []
    const identifier = `${field.namespace}.${field.name}`

    if (field.repeatable) {
      const values = this.state.value.split(defaultFieldDelemiter)
      return values.map((value, index) => {
        return (
          <Row
            key={index}
            className="field-container"
          >
            <MetadataValue
              index={index}
              field={field}
              value={value}
              valid={true}
              range={range}
              identifier={identifier}
              onChange={this.onValueChange}
              onSelectChange={this.onValueChange}
            />
            {this.renderButtons(index)}
          </Row>
        )
      })
    }

    return (
      <Row className="field-container">
        <MetadataValue
          field={field}
          value={this.state.value}
          valid={true}
          range={range}
          identifier={identifier}
          onChange={this.onValueChange}
          onSelectChange={this.onValueChange}
        />
      </Row>
    )
  }

  private renderSelectFieldMessage() {
    return (
      <span>Please select a field to edit</span>
    )
  }

  private renderActiveButtons() {
    const field = this.state.selectedField
    if (field && field.repeatable) {
      return (
        <ButtonGroup>
          <Button type="submit">Replace</Button>
          <Button onClick={this.onSaveInsert}>Insert</Button>
          <Button onClick={this.props.onDismissed}>Cancel</Button>
        </ButtonGroup>
      )
    }

    return (
      <ButtonGroup>
        <Button type="submit">Replace</Button>
        <Button onClick={this.props.onDismissed}>Cancel</Button>
      </ButtonGroup>
    )
  }

  private renderButtons(index: number) {
    const field = this.state.selectedField
    if (!field || !field.repeatable) {
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

  private addFieldValue = (index: number) => {
    const field = this.state.selectedField
    if (field && field.repeatable) {
      const values = this.state.value.split(defaultFieldDelemiter)
      values.splice(index + 1, 0, '')

      this.setState({ value: values.join(defaultFieldDelemiter) })
    }
  }

  private subtractFieldValue = (index: number) => {
    const field = this.state.selectedField
    if (field && field.repeatable) {
      const values = this.state.value.split(defaultFieldDelemiter)
      values.splice(index, 1)

      const value = values.join(defaultFieldDelemiter)
      this.setState({ value: value })
    }
  }

  private onSelectFieldChange = (event: React.FormEvent<HTMLSelectElement>) => {
    if (!this.props.accessMap) {
      return
    }
    const identifier = event.currentTarget.value
    const field = this.props.accessMap.find((f) => {
      const fieldIdentifier = `${f.namespace}.${f.name}`
      return fieldIdentifier === identifier
    }) || null
    this.setState({ selectedField: field })
  }

  private onValueChange = (value: string, index?: number) => {
    const field = this.state.selectedField
    if (index !== undefined && field && field.repeatable) {
      const values = this.state.value.split(defaultFieldDelemiter)
      values[index] = value
      value = values.join(defaultFieldDelemiter)
    }
    this.setState({ value: value })
  }

  private onSaveInsert = (event: React.MouseEvent<HTMLButtonElement>) => {
    this.doSave(MetadataAutofillType.Insert)
  }

  private onSave = async () => {
    this.doSave(MetadataAutofillType.Replace)
  }

  private doSave(type: MetadataAutofillType) {
    const field = this.state.selectedField
    if (!field) {
      return
    }

    const identifier = `${field.namespace}.${field.name}`

    this.props.dispatcher.autofillMetadata(identifier, this.state.value, type)
    this.props.onDismissed()
  }
}