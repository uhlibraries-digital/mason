import * as React from 'react';

import { Dispatcher } from '../../lib/dispatcher'
import { Resizeable } from '../resizeable'
import { Objects } from './objects'
import { IObject, ProjectType } from '../../lib/project'
import { BcDamsMap } from '../../lib/map'
import { IVocabularyMapRange } from '../../lib/vocabulary'
import { ISearchResults } from '../../lib/search';

interface IObjectsViewProps {
  readonly type: ProjectType
  readonly objects: ReadonlyArray<IObject>
  readonly sidebarWidth: number
  readonly dispatcher: Dispatcher
  readonly selectedObjectUuid?: string
  readonly selectedObjects?: ReadonlyArray<string>
  readonly searchResults: ISearchResults | null
  readonly accessMap: ReadonlyArray<BcDamsMap> | null
  readonly vocabularyRanges: ReadonlyArray<IVocabularyMapRange>
}

interface IObjectsViewState {
  maxSidebarWidth: number
  minSidebarWidth: number
  selectedObjectUuid: string
  selectedObjects: ReadonlyArray<string>
  page: number
  totalPages: number
  pagedObjects: Array<IObject>
}

const objectPageSize = 1000

export class ObjectsView extends React.Component<
  IObjectsViewProps,
  IObjectsViewState
> {

  private objectsRef: Objects | null = null

  public constructor(props: IObjectsViewProps) {
    super(props)

    this.state = {
      maxSidebarWidth: 400,
      minSidebarWidth: 230,
      selectedObjectUuid: this.props.selectedObjectUuid || '',
      selectedObjects: this.props.selectedObjects || [],
      page: 1,
      totalPages: Math.ceil(props.objects.length / objectPageSize),
      pagedObjects: this.getPagedObjects(props.objects, 1)
    }
  }

  public UNSAFE_componentWillReceiveProps(nextProps: IObjectsViewProps) {
    if (this.props.objects.length !== nextProps.objects.length) {
      this.setState({
        totalPages: Math.ceil(nextProps.objects.length / objectPageSize),
        pagedObjects: this.getPagedObjects(nextProps.objects, this.state.page)
      })
    }
    if (this.props.selectedObjectUuid !== nextProps.selectedObjectUuid) {
      this.setState({
        selectedObjectUuid: nextProps.selectedObjectUuid || ''
      })
      if (nextProps.searchResults && this.objectsRef) {
        const uuid = nextProps.selectedObjectUuid || ''
        const index = nextProps.objects.findIndex((item) => item.uuid === uuid)
        const page = Math.ceil((index + 1) / objectPageSize)

        if (page > 0 && page !== this.state.page) {
          this.setState({
            page: page,
            pagedObjects: this.getPagedObjects(this.props.objects, page)
          })
        }

        this.objectsRef.scrollToUuid(uuid)
      }
    }
  }

  private onObjectsRef = (objects: Objects | null) => {
    this.objectsRef = objects
  }

  private handleSidebarResize = (width: number) => {
    this.props.dispatcher.setSidebarWidth(width)
  }

  private handleSidebarReset = () => {
    this.props.dispatcher.resetSidebarWidth()
  }

  private onObjectClicked = (uuid: string) => {
    this.setState({ selectedObjectUuid: uuid })
    this.props.dispatcher.setObject(uuid)
  }

  private onAppendObjects = (num: number) => {
    this.props.dispatcher.appendObjects(num)
  }

  private onEditNote = (uuid: string) => {
    this.setState({ selectedObjectUuid: uuid })
    this.props.dispatcher.showProjectNote()
    this.props.dispatcher.setObject(uuid)
  }

  private onShowFolder = (uuid: string) => {
    this.props.dispatcher.showContainerFolder(uuid)
  }

  private onTypeToggle = (uuid: string) => {
    this.props.dispatcher.toggleProcessingType(uuid)
  }

  private onInsertObject = (uuid: string, position: 'above' | 'below') => {
    this.props.dispatcher.insertObject(uuid, position, 1)
  }

  private onRemoveObject = (uuid: string) => {
    this.props.dispatcher.removeObject(uuid, true)
  }

  private onPageChanged = (page: number) => {
    this.setState({
      page: page,
      pagedObjects: this.getPagedObjects(this.props.objects, page),
      selectedObjectUuid: ''
    })
    this.props.dispatcher.setObject('')
  }

  private getPagedObjects(objects: ReadonlyArray<IObject>, page: number): Array<IObject> {
    const pageStart = (page - 1) * objectPageSize
    const pageEnd = pageStart + objectPageSize
    const pagedObjects = objects
      .slice(pageStart, pageEnd)

    return pagedObjects
  }

  private onObjectSelectionChange = (selection: ReadonlyArray<string>) => {
    this.props.dispatcher.setMultipleObjects(selection)
  }

  public render() {

    return (
      <Resizeable
        id="object-sidebar"
        width={this.props.sidebarWidth}
        maximumWidth={this.state.maxSidebarWidth}
        minimumWidth={this.state.minSidebarWidth}
        onResize={this.handleSidebarResize}
        onReset={this.handleSidebarReset}
      >
        <Objects
          type={this.props.type}
          objects={this.state.pagedObjects}
          page={this.state.page}
          totalPages={this.state.totalPages}
          totalObjects={this.props.objects.length}
          accessMap={this.props.accessMap}
          vocabularyRanges={this.props.vocabularyRanges}
          selectedObjectUuid={this.state.selectedObjectUuid}
          selectedObjects={this.state.selectedObjects}
          searchResults={this.props.searchResults}
          ref={this.onObjectsRef}
          onObjectClicked={this.onObjectClicked}
          onObjectSelectionChange={this.onObjectSelectionChange}
          onAppendObjects={this.onAppendObjects}
          onEditNote={this.onEditNote}
          onShowFolder={this.onShowFolder}
          onTypeToggle={this.onTypeToggle}
          onInsertObject={this.onInsertObject}
          onRemoveObject={this.onRemoveObject}
          onPageChanged={this.onPageChanged}
        />
      </Resizeable>
    )
  }
}