import * as React from 'react'
import {
  BcDamsMap,
} from '../../lib/map'
import { MetadataField } from './metadata-field'
import { IVocabularyMapRange, IVocabulary } from '../../lib/vocabulary'

interface IMetadataViewProps {
  readonly objectTitle: string
  readonly objectPmArk: string
  readonly objectDoArk: string
  readonly metadata: any
  readonly map: ReadonlyArray<BcDamsMap> | null
  readonly vocabularyRanges: ReadonlyArray<IVocabularyMapRange>
  readonly searchQuery?: string

  readonly onMetadataChange?: (metadata: any) => void
  readonly onDoArkChange?: (ark: string) => void
  readonly onPmArkChange?: (ark: string) => void
  readonly onASpaceUriChange?: (uri: string) => void
}

interface IMetadataViewState {
  readonly metadata: any
}

export class MetadataView extends React.Component<IMetadataViewProps, IMetadataViewState> {

  constructor(props: IMetadataViewProps) {
    super(props)

    this.state = {
      metadata: this.props.metadata
    }
  }

  public UNSAFE_componentWillReceiveProps(nextProps: IMetadataViewProps) {
    this.setState({ metadata: nextProps.metadata })
  }

  public render() {
    return (
      <div className="metadata-view">
        {this.renderFields()}
      </div>
    )
  }

  public renderFields() {
    if (!this.props.map) {
      return null
    }

    return this.props.map.map((field: BcDamsMap, index) => {
      if (!field.visible) {
        return null
      }

      const identifier = `${field.namespace}.${field.name}`
      const value = this.state.metadata[identifier] || ''

      let nodes: Array<IVocabulary> = []
      field.range.forEach((fieldRange) => {
        const range = this.props.vocabularyRanges.find(
          node => node.prefLabel.toLowerCase() === fieldRange.label.toLowerCase())

        if (range) {
          nodes = nodes.concat(range.nodes)
        }
      })

      const defaultValue = this.defaultValue(identifier, value)

      return (
        <MetadataField
          key={index}
          field={field}
          value={value}
          defaultValue={defaultValue}
          searchQuery={this.props.searchQuery}
          identifier={identifier}
          range={nodes}
          onValueChange={this.onValueChange}
        />
      )
    })
  }

  private onValueChange = (identifier: string, value: string) => {
    const metadata = this.state.metadata
    metadata[identifier] = value
    this.setState({ metadata: metadata })

    if (identifier === 'dcterms.source' && this.props.onPmArkChange) {
      this.props.onPmArkChange(value)
    }
    else if (identifier === 'edm.isShownAt' && this.props.onDoArkChange) {
      this.props.onDoArkChange(value)
    }
    else if (identifier === 'uhlib.aSpaceUri' && this.props.onASpaceUriChange) {
      this.props.onASpaceUriChange(value)
    }

    if (this.props.onMetadataChange) {
      this.props.onMetadataChange(metadata)
    }
  }

  private defaultValue(identifier: string, value: string): string | undefined {
    if (value !== '') {
      return undefined
    }

    switch (identifier) {
      case 'dcterms.title':
        return this.props.objectTitle
      case 'dcterms.source':
        return this.props.objectPmArk
      case 'edm.isShownAt':
        return this.props.objectDoArk
    }

    return undefined
  }
}

