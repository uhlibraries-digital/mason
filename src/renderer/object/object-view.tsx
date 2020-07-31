import * as React from 'react';

import { Dispatcher } from '../../lib/dispatcher'
import { IObject, FilePurpose } from '../../lib/project'
import { BlankObject } from './blank-object'
import { Note } from '../note'
import { FilesView } from '../files'
import { ObjectViewTab } from '../../lib/app-state'
import { TabBar } from '../tab-bar'
import { BcDamsMap } from '../../lib/map'
import { MetadataView } from '../metadata'
import { IVocabularyMapRange } from '../../lib/vocabulary';
import { MultipleObjects } from './multiple-objects';
import { ViewFindingAid } from '../findingaid';

interface IObjectViewProps {
  readonly dispatcher: Dispatcher
  readonly object: IObject | null
  readonly selectedObjects: ReadonlyArray<string>
  readonly accessMap: ReadonlyArray<BcDamsMap> | null
  readonly vocabularyRanges: ReadonlyArray<IVocabularyMapRange>
  readonly findingAidPublicUrl: string
}

interface IObjectViewState {
  readonly selectedIndex: ObjectViewTab
}

export class ObjectView extends React.Component<IObjectViewProps, IObjectViewState> {

  public constructor(props: IObjectViewProps) {
    super(props)

    this.state = {
      selectedIndex: ObjectViewTab.Files
    }
  }

  private onTabClicked = (index: number) => {
    this.setState({ selectedIndex: index })
  }

  public render() {
    return (
      <div className="object">
        <TabBar
          onTabClicked={this.onTabClicked}
          selectedIndex={this.state.selectedIndex}
        >
          <span>Files</span>
          <span>Metadata</span>
        </TabBar>
        {this.renderObject()}
      </div>
    )
  }

  private renderObject() {
    if (!this.props.object) {
      return this.renderBlankObject()
    }
    if (this.props.selectedObjects.length > 0) {
      return this.renderMultipleObjects()
    }

    return (
      <div className="object-contents scrollbar">
        {this.renderFindingAidLink()}
        <Note
          note={this.props.object.productionNotes}
        />
        {this.renderActiveTab()}
      </div>
    )
  }

  private renderFindingAidLink() {
    if (!this.props.object) {
      return null
    }

    const uri = this.props.object.uri || this.props.object.parent_uri || null
    if (!uri) {
      return null
    }
    const url = `${this.props.findingAidPublicUrl}${uri}`

    return (
      <ViewFindingAid
        url={url}
      />
    )
  }

  private renderActiveTab() {
    if (!this.props.object) {
      return this.renderBlankObject()
    }

    const index = this.state.selectedIndex
    switch (index) {
      case ObjectViewTab.Files:
        return (
          <FilesView
            files={this.props.object.files}
            onAddFile={this.onAddFile}
            onAddFileClick={this.onAddFileClick}
            onMoveFile={this.onMovieFile}
            onRemoveFile={this.onRemoveFile}
            onOpenFile={this.onOpenFile}
          />
        )
      case ObjectViewTab.Metadata:
        return (
          <MetadataView
            objectTitle={this.props.object.title}
            objectDoArk={this.props.object.do_ark}
            objectPmArk={this.props.object.pm_ark}
            metadata={this.props.object.metadata}
            map={this.props.accessMap}
            vocabularyRanges={this.props.vocabularyRanges}
            onMetadataChange={this.onMetadataChange}
            onDoArkChange={this.onDoArkChange}
            onPmArkChange={this.onPmArkChange}
            onASpaceUriChange={this.onASpaceUriChange}
          />
        )
    }

    return null

  }

  private renderBlankObject() {
    return (
      <BlankObject />
    )
  }

  private renderMultipleObjects() {
    return (
      <MultipleObjects
        onShowAutofill={this.onShowAutofill}
        onCreateAccessFiles={this.onCreateAccessFiles}
      />
    )
  }

  private onShowAutofill = () => {
    this.props.dispatcher.showAutoFill()
  }

  private onCreateAccessFiles = () => {
    this.props.dispatcher.convertImagesPreCheck()
  }

  private onAddFile = (path: string, purpose: FilePurpose) => {
    if (!this.props.object) {
      return
    }

    this.props.dispatcher.addFile(
      this.props.object.uuid,
      path,
      purpose
    )
  }

  private onAddFileClick = (purpose: FilePurpose) => {
    if (!this.props.object) {
      return
    }

    this.props.dispatcher.addFiles(this.props.object.uuid, purpose)
  }

  private onRemoveFile = (path: string) => {
    if (!this.props.object) {
      return
    }
    this.props.dispatcher.removeFile(this.props.object.uuid, path)
  }

  private onMovieFile = (path: string, purpose: FilePurpose) => {
    if (!this.props.object) {
      return
    }
    this.props.dispatcher.moveFilePurpose(this.props.object.uuid, path, purpose)
  }

  private onOpenFile = (path: string) => {
    if (!this.props.object) {
      return
    }
    this.props.dispatcher.openFile(path)
  }

  private onMetadataChange = (metadata: any) => {
    if (!this.props.object) {
      return
    }
    this.props.dispatcher.saveMetadata(this.props.object.uuid, metadata)
  }

  private onPmArkChange = (ark: string) => {
    if (!this.props.object) {
      return
    }
    this.props.dispatcher.savePmArk(this.props.object.uuid, ark)
  }

  private onDoArkChange = (ark: string) => {
    if (!this.props.object) {
      return
    }
    this.props.dispatcher.saveDoArk(this.props.object.uuid, ark)
  }

  private onASpaceUriChange = (uri: string) => {
    if (!this.props.object) {
      return
    }
    this.props.dispatcher.saveASpaceUri(this.props.object.uuid, uri)
  }
}