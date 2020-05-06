import * as React from 'react'
import { Files } from './files'
import { IFile, FilePurpose } from '../../lib/project'

interface IFilesViewProps {
  readonly files: ReadonlyArray<IFile>

  readonly onAddFile?: (path: string, type: FilePurpose) => void
  readonly onMoveFile?: (path: string, type: FilePurpose) => void
  readonly onRemoveFile?: (path: string) => void
  readonly onOpenFile?: (path: string) => void
}

export class FilesView extends React.Component<
  IFilesViewProps,
  {}
  > {

  constructor(props: IFilesViewProps) {
    super(props)

    this.state = {
      files: this.props.files
    }
  }

  public render() {
    const preservationFiles = this.filterFiles(FilePurpose.Preservation)
    const accessFiles = this.filterFiles(FilePurpose.Access)
    const modifiedFiles = this.filterFiles(FilePurpose.ModifiedMaster)
    const submissionDocumentationFiles = this.filterFiles(
      FilePurpose.SubmissionDocumentation
    )

    return (
      <div className="file-container">
        <Files
          files={modifiedFiles}
          type={FilePurpose.ModifiedMaster}
          label="Modified Master"
          onFileDrop={this.props.onAddFile}
          onMoveFileDrop={this.props.onMoveFile}
          onRemoveFile={this.props.onRemoveFile}
          onOpenFile={this.props.onOpenFile}
        />
        <Files
          files={accessFiles}
          type={FilePurpose.Access}
          label="Access"
          onFileDrop={this.props.onAddFile}
          onMoveFileDrop={this.props.onMoveFile}
          onRemoveFile={this.props.onRemoveFile}
          onOpenFile={this.props.onOpenFile}
        />
        <Files
          files={preservationFiles}
          type={FilePurpose.Preservation}
          label="Preservation"
          onFileDrop={this.props.onAddFile}
          onMoveFileDrop={this.props.onMoveFile}
          onRemoveFile={this.props.onRemoveFile}
          onOpenFile={this.props.onOpenFile}
        />
        <Files
          files={submissionDocumentationFiles}
          type={FilePurpose.SubmissionDocumentation}
          label="Submission Documentation"
          onFileDrop={this.props.onAddFile}
          onMoveFileDrop={this.props.onMoveFile}
          onRemoveFile={this.props.onRemoveFile}
          onOpenFile={this.props.onOpenFile}
        />
      </div>
    )
  }

  private filterFiles(type: FilePurpose): ReadonlyArray<IFile> {
    return this.props.files.filter((file) => {
      return file.purpose === type
    })
  }

}