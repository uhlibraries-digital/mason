import * as React from 'react'
import classNames from 'classnames'
import { basename } from 'path'
import { IFile, FilePurpose } from '../../lib/project'
import { Button } from '../button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as Icons from "@fortawesome/free-solid-svg-icons"

interface IFilesProps {
  readonly files: ReadonlyArray<IFile>
  readonly type: FilePurpose
  readonly label: string

  readonly onFileDrop?: (path: string, type: FilePurpose) => void
  readonly onAddFileClick?: (type: FilePurpose) => void
  readonly onMoveFileDrop?: (path: string, type: FilePurpose) => void
  readonly onRemoveFile?: (path: string) => void
  readonly onOpenFile?: (path: string) => void
}

export class Files extends React.Component<IFilesProps, {}> {
  public render() {
    const className = classNames('file-items', this.props.type)

    return (
      <div
        className={className}
        onDrop={this.onDrop}
        onDragOver={this.onDragOver}
      >
        <div className="header">
          <span>{this.props.label}</span>
          <Button
            onClick={this.onAddFileClick}
          >
            <FontAwesomeIcon
              icon={Icons.faPlus}
            />
          </Button>
        </div>
        <div className="contents">
          <ul className="file-list">
            {this.renderFiles()}
          </ul>
        </div>
      </div>
    )
  }

  private renderFiles() {
    const files = Array.from(this.props.files).sort((a, b) => {
      return a.path.localeCompare(b.path)
    })

    return files.map((file, index) => {
      return (
        <File
          key={index}
          index={index}
          path={file.path}
          onRemoveFile={this.props.onRemoveFile}
          onOpenFile={this.props.onOpenFile}
        >
          {basename(file.path)}
        </File>
      )
    })
  }

  private onAddFileClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (this.props.onAddFileClick) {
      this.props.onAddFileClick(this.props.type)
    }
  }

  private onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    this.preventEventDefaults(event)

    const dropFile = event.dataTransfer.getData('text')

    if (dropFile !== '') {
      if (this.props.onMoveFileDrop) {
        this.props.onMoveFileDrop(dropFile, this.props.type)
      }
    }
    else if (event.dataTransfer.files) {
      const files = event.dataTransfer.files
      for (let file of files) {
        if (this.props.onFileDrop) {
          this.props.onFileDrop(file.path, this.props.type)
        }
      }
    }
  }

  private onDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    this.preventEventDefaults(event);
  }

  private preventEventDefaults = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault()
    event.stopPropagation()
  }

}

interface IFileProps {
  readonly index: number
  readonly className?: string
  readonly path?: string

  readonly onRemoveFile?: (path: string) => void
  readonly onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void
  readonly onOpenFile?: (path: string) => void
}

export class File extends React.Component<IFileProps, {}> {
  public render() {
    const className = classNames('file-list-item', this.props.className)

    return (
      <li
        className={className}
        key={this.props.index}
      >
        <div
          className="filename"
          draggable={true}
          onDragStart={this.onDragStart}
          onClick={this.onOpenFile}
        >
          {this.props.children}
        </div>
        <Button
          className="remove-button"
          onClick={this.onClick}
        >
          <FontAwesomeIcon
            icon={Icons.faTrash}
            size="lg"
          />
        </Button>
      </li>
    )
  }

  private onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (this.props.onRemoveFile && this.props.path) {
      this.props.onRemoveFile(this.props.path)
    }
  }

  private onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('text', this.props.path || '')
  }

  private onOpenFile = (event: React.MouseEvent<HTMLDivElement>) => {
    if (this.props.onOpenFile && this.props.path) {
      this.props.onOpenFile(this.props.path)
    }
  }
}