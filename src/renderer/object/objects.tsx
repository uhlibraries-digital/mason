import * as React from 'react'
import classNames from 'classnames'
import { IMenuItem } from '../../lib/menu-item'
import {
  IObject,
  ProjectType,
  containerToString,
  isValidObject,
  ProcessingType,
  FilePurpose
} from '../../lib/project'
import { AppendObjects } from './append'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as SolidIcons from "@fortawesome/free-solid-svg-icons"
import * as RegularIcons from "@fortawesome/free-regular-svg-icons"
import { showContextualMenu } from '../main-process-proxy'
import { Button } from '../button'
import { BcDamsMap } from '../../lib/map'
import { IVocabularyMapRange } from '../../lib/vocabulary'

interface IObjectsProps {
  readonly type: ProjectType
  readonly objects: ReadonlyArray<IObject>
  readonly selectedObjectUuid: string
  readonly selectedObjects: ReadonlyArray<string>
  readonly searchResultsObjects?: ReadonlyArray<string>
  readonly page: number
  readonly totalPages: number
  readonly totalObjects: number
  readonly accessMap: ReadonlyArray<BcDamsMap> | null
  readonly vocabularyRanges: ReadonlyArray<IVocabularyMapRange>

  readonly onObjectClicked: (uuid: string) => void
  readonly onObjectSelectionChange: (selection: ReadonlyArray<string>) => void
  readonly onAppendObjects: (num: number) => void
  readonly onRemoveObject: (uuid: string) => void
  readonly onEditNote: (uuid: string) => void
  readonly onTypeToggle: (uuid: string) => void
  readonly onShowFolder?: (uuid: string) => void
  readonly onInsertObject: (uuid: string, position: 'above' | 'below') => void
  readonly onPageChanged: (page: number) => void
}

interface IObjectsState {
  readonly selectedObjects: ReadonlyArray<string>
}

export class Objects extends React.Component<IObjectsProps, IObjectsState> {

  private list: HTMLDivElement | null = null

  constructor(props: IObjectsProps) {
    super(props)

    this.state = {
      selectedObjects: this.props.selectedObjects
    }
  }

  private onRef = (element: HTMLDivElement | null) => {
    if (element === null && this.list !== null) {
      this.list.removeEventListener('select-all', this.onSelectAll)
    }

    this.list = element

    if (element !== null) {
      element.addEventListener('select-all', this.onSelectAll)
    }
  }

  private onSelectAll = (event: Event) => {
    event.preventDefault()
    const uuidSelection: ReadonlyArray<string> = this.props.objects.map((item) => {
      return item.uuid
    })
    this.setState({ selectedObjects: uuidSelection })
    this.props.onObjectSelectionChange(uuidSelection)
  }

  private onPrevPage = () => {
    const page = Math.max(this.props.page - 1, 0)
    this.props.onPageChanged(page)
  }

  private onNextPage = () => {
    const page = Math.min(this.props.page + 1, this.props.totalPages)
    this.props.onPageChanged(page)
  }

  public render() {
    const pageText = `page ${this.props.page}` +
      ((this.props.totalPages > 1) ? ` of ${this.props.totalPages}` : '')
    const prevDisabled = this.props.page <= 1
    const nextDisabled = this.props.page === this.props.totalPages ||
      this.props.totalPages === 0

    return (
      <div className="object-list-contents">
        <div className="header">
          <Button
            onClick={this.onPrevPage}
            className="prev-page"
            disabled={prevDisabled}
          >
            <FontAwesomeIcon
              icon={SolidIcons.faAngleLeft}
              size="1x"
            />
          </Button>
          {this.props.totalObjects} objects, {pageText}
          <Button
            onClick={this.onNextPage}
            className="next-page"
            disabled={nextDisabled}
          >
            <FontAwesomeIcon
              icon={SolidIcons.faAngleRight}
              size="1x"
            />
          </Button>
        </div>
        <div
          ref={this.onRef}
          className="object-list-container scrollbar"
          tabIndex={-1}
        >
          <ul className="object-list">
            {this.renderObjects()}
          </ul>
        </div>
        {this.renderInsert()}
      </div>
    )
  }

  private renderInsert() {
    if (this.props.type === ProjectType.Archival) {
      return null
    }
    return (
      <AppendObjects
        onAppendObjectClicked={this.props.onAppendObjects}
      />
    )
  }

  private renderObjects() {
    if (!this.props.objects) {
      return null
    }

    return this.props.objects.map((child, index) => {
      const selected = child.uuid === this.props.selectedObjectUuid ||
        this.state.selectedObjects.findIndex(uuid => child.uuid === uuid) !== -1
      const searching = this.props.searchResultsObjects ?
        this.props.searchResultsObjects.findIndex(uuid => child.uuid === uuid) !== -1 : false
      const container = containerToString.call(
        this,
        child.containers[0] || null
      )
      const type = child.metadata['dcterms.type'] || ''

      const hasNotoes = child.productionNotes !== ''
      const hasFiles = child.files.length > 0
      const missingAccess = child.files.filter(
        file => file.purpose === FilePurpose.Access
      ).length === 0
      const missingPreservation = child.files.filter(
        file => file.purpose === FilePurpose.Preservation
      ).length === 0
      const missingModifinedMaster = child.files.filter(
        file => file.purpose === FilePurpose.ModifiedMaster
      ).length === 0

      const isValid = isValidObject.call(
        this,
        child,
        this.props.accessMap,
        this.props.vocabularyRanges
      )


      return (
        <ObjectItem
          index={index}
          uuid={child.uuid}
          selected={selected}
          searching={searching}
          isValid={isValid}
          key={index}

          onClick={this.onObjectClicked}
          onDoubleClick={this.onObjectDoubleClicked}
          onContextMenu={this.onObjectContextMenu}
        >
          <ObjectIcon
            uuid={child.uuid}
            hasNotoes={hasNotoes}
            hasFiles={hasFiles}
            missingAccess={missingAccess}
            missingModifinedMaster={missingModifinedMaster}
            missingPreservation={missingPreservation}
            processingType={child.processing_type}
            onNoteClick={this.props.onEditNote}
            onTypeClick={this.props.onTypeToggle}
          />
          <ObjectDescription
            title={child.title}
            type={type}
            container={container}
          />
        </ObjectItem>
      )
    })
  }

  private onObjectClicked = (uuid: string, event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault()
    const isShortcutKey = __DARWIN__ ? event.metaKey : event.ctrlKey
    if (isShortcutKey) {
      const newSelectedObjects = Array.from(this.state.selectedObjects)
      // Push in the first selected object since this is the first 
      // time we've done a multiple selection
      if (!newSelectedObjects.length) {
        newSelectedObjects.push(this.props.selectedObjectUuid)
      }
      newSelectedObjects.push(uuid)
      this.setState({ selectedObjects: newSelectedObjects })
      this.props.onObjectSelectionChange(newSelectedObjects)
    }
    else if (event.shiftKey) {
      event.stopPropagation()
      const begin = this.props.objects.findIndex(
        item => item.uuid === this.props.selectedObjectUuid)
      const end = this.props.objects.findIndex(
        item => item.uuid === uuid) + 1
      const newObjects = this.props.objects.slice(begin, end)
      const newSelectedObjects = newObjects.map(item => item.uuid)
      this.setState({ selectedObjects: newSelectedObjects })
      this.props.onObjectSelectionChange(newSelectedObjects)
    }
    else {
      this.setState({ selectedObjects: [] })
      this.props.onObjectClicked(uuid)
      this.props.onObjectSelectionChange([])
    }
  }

  private onObjectDoubleClicked = (uuid: string) => {
    if (this.state.selectedObjects.length === 0 && this.props.onShowFolder) {
      this.props.onShowFolder(uuid)
    }
  }

  private onObjectContextMenu = (uuid: string, event: React.MouseEvent<HTMLLIElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (this.props.type === ProjectType.NonArchival) {
      const items: IMenuItem[] = [
        {
          label: 'Insert Object Above',
          action: () => this.props.onInsertObject(uuid, 'above')
        },
        {
          label: 'Insert Object Below',
          action: () => this.props.onInsertObject(uuid, 'below')
        },
        { type: 'separator' },
        {
          label: 'Edit Note',
          action: () => this.props.onEditNote(uuid)
        },
        { type: 'separator' },
        {
          label: 'Remove Object',
          action: () => this.props.onRemoveObject(uuid)
        }
      ]
      showContextualMenu.call(this, items)
    }
    else {
      const items: IMenuItem[] = [
        {
          label: 'Edit Note',
          action: () => this.props.onEditNote(uuid)
        }
      ]
      showContextualMenu.call(this, items)
    }

  }
}

interface IObjectItemProps {
  readonly index: number
  readonly selected: boolean
  readonly searching: boolean
  readonly uuid: string
  readonly isValid: boolean
  readonly onClick?: (uuid: string, event: React.MouseEvent<HTMLElement>) => void
  readonly onDoubleClick?: (uuid: string) => void
  readonly onContextMenu?: (uuid: string, event: React.MouseEvent<HTMLLIElement>) => void
}

class ObjectItem extends React.Component<IObjectItemProps, {}> {

  private onClick = (event: React.MouseEvent<HTMLElement>) => {
    if (this.props.onClick) {
      this.props.onClick(this.props.uuid, event)
    }
  }

  private onDoubleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (this.props.onDoubleClick) {
      this.props.onDoubleClick(this.props.uuid)
    }
  }

  private onContextMenu = (event: React.MouseEvent<HTMLLIElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (this.props.onContextMenu) {
      this.props.onContextMenu(this.props.uuid, event)
    }

  }

  public render() {
    const selected = this.props.selected
    const notValid = !this.props.isValid
    const searching = this.props.searching
    const className = classNames('object-item', { selected }, { notValid }, { searching })

    return (
      <li
        className={className}
        onClick={this.onClick}
        onDoubleClick={this.onDoubleClick}
        onContextMenu={this.onContextMenu}
      >
        {this.props.children}
      </li>
    )
  }
}

interface IObjectDescriptionProps {
  readonly title: string
  readonly container: string
  readonly type: string
}

class ObjectDescription extends React.Component<
  IObjectDescriptionProps,
  {}
> {

  public render() {
    return (
      <div className="object-description">
        <div className="title">
          {this.props.title}
        </div>
        <div className="type">
          {this.props.type}
        </div>
        <div className="container">
          {this.props.container}
        </div>
      </div>
    )
  }

}

interface IObjectIconProps {
  readonly uuid: string
  readonly hasNotoes: boolean
  readonly hasFiles: boolean
  readonly processingType: ProcessingType
  readonly missingAccess: boolean
  readonly missingPreservation: boolean
  readonly missingModifinedMaster: boolean

  readonly onNoteClick?: (uuid: string) => void
  readonly onFolderClick?: (uuid: string) => void
  readonly onTypeClick?: (uuid: string) => void
}

class ObjectIcon extends React.Component<IObjectIconProps, {}> {
  public render() {
    const hasNotes = this.props.hasNotoes

    const noteIcon = hasNotes
      ? SolidIcons.faClipboard : RegularIcons.faClipboard

    const noteClass = classNames('icon', { hasNotes })

    return (
      <div className="object-icon">
        <div
          className={noteClass}
          onClick={this.onNoteClick}
        >
          <FontAwesomeIcon
            icon={noteIcon}
            size="lg"
          />
        </div>
        {this.renderFileIcon()}
        {this.renderTypeIcon()}
      </div>
    )
  }

  private renderFileIcon() {
    const hasFiles = this.props.hasFiles
    const missingAccess = this.props.missingAccess
    const missingModifinedMaster = this.props.missingModifinedMaster
    const missingPreservation = this.props.missingPreservation

    const fileIcon = hasFiles
      ? SolidIcons.faFolder : RegularIcons.faFolder

    const fileClass = classNames('icon', { hasFiles })
    const missingClass = classNames(
      { missingAccess },
      { missingModifinedMaster },
      { missingPreservation }
    )

    if (hasFiles && missingAccess) {
      return (
        <div
          className={fileClass}
          onClick={this.onFolderClick}
        >
          <FontAwesomeIcon
            className={missingClass}
            icon={SolidIcons.faFolderOpen}
            size="lg"
          />
        </div>
      )
    }

    return (
      <div
        className={fileClass}
        onClick={this.onFolderClick}
      >
        <FontAwesomeIcon
          icon={fileIcon}
          size="lg"

        />
      </div>
    )
  }

  private renderTypeIcon() {
    const icon = this.ProcessingTypeIcon(this.props.processingType)

    return (
      <div
        className="icon type"
        onClick={this.onTypeClick}
      >
        <FontAwesomeIcon
          icon={icon}
          size="lg"
        />
      </div>
    )
  }

  private ProcessingTypeIcon(type: ProcessingType): RegularIcons.IconDefinition | SolidIcons.IconDefinition {
    switch (type) {
      case ProcessingType.Image:
        return RegularIcons.faImage
      case ProcessingType.Text:
        return RegularIcons.faFileAlt
      case ProcessingType.Video:
        return SolidIcons.faVideo
      case ProcessingType.Sound:
        return SolidIcons.faVolumeUp
    }

    return RegularIcons.faQuestionCircle
  }

  private onNoteClick = (event: React.MouseEvent<HTMLElement>) => {
    if (this.props.onNoteClick) {
      this.props.onNoteClick(this.props.uuid)
    }
  }

  private onFolderClick = (event: React.MouseEvent<HTMLElement>) => {
    if (this.props.onFolderClick) {
      this.props.onFolderClick(this.props.uuid)
    }
  }

  private onTypeClick = (event: React.MouseEvent<HTMLElement>) => {
    if (this.props.onTypeClick) {
      this.props.onTypeClick(this.props.uuid)
    }
  }
}