import * as React from 'react'
import { staticPath, encodePathAsUrl } from '../../lib/path'
import {
  Button,
  ButtonGroup
} from '../button'

const MultiObjectImage = encodePathAsUrl(
  staticPath(),
  'multiple-selected.svg'
)

interface IMultipleObjectsProps {
  readonly onShowAutofill: () => void
  readonly onCreateAccessFiles: () => void
  readonly onShowAutofillType: () => void
}

export class MultipleObjects extends React.Component<IMultipleObjectsProps, {}> {

  public render() {
    return (
      <div id="multiple-objects">
        <img src={MultiObjectImage} className="multiple-objects-image" />
        <div className="multiple-objects-text">
          Select an option for multiple objects
        </div>
        <ButtonGroup>
          <Button
            type="submit"
            onClick={this.onCreateAccessFiles}
          >
            Create Access Files
          </Button>
          <Button
            type="submit"
            onClick={this.onShowTypeChange}
          >
            Change Processing Type
          </Button>
          <Button
            type="submit"
            onClick={this.onShowAutofill}
          >
            Autofill Metadata
          </Button>
        </ButtonGroup>
      </div>
    )
  }

  private onShowAutofill = () => {
    this.props.onShowAutofill()
  }

  private onCreateAccessFiles = () => {
    this.props.onCreateAccessFiles()
  }

  private onShowTypeChange = () => {
    this.props.onShowAutofillType()
  }

}