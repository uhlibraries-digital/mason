import * as React from 'react'
import { remote } from 'electron'
import { IConvertOptions } from '../../lib/app-state'
import { DialogContent } from '../dialog'
import {
  TextBox,
  Checkbox,
  CheckboxValue
} from '../form'
import { Row } from '../layout'
import { Button } from '../button'

interface IImageOptionProps {
  readonly options: IConvertOptions
  readonly onOptionsChanged: (optiosn: IConvertOptions) => void
}

interface IImageOptionState {
  readonly options: IConvertOptions
}

export class ImageOption extends React.Component<IImageOptionProps, IImageOptionState> {

  public constructor(props: IImageOptionProps) {
    super(props)

    this.state = {
      options: props.options
    }
  }

  public render() {
    const resizeCheck = this.state.options.resizeEnabled ? CheckboxValue.On : CheckboxValue.Off
    const resampleCheck = this.state.options.resampleEnabled ? CheckboxValue.On : CheckboxValue.Off

    return (
      <DialogContent>
        <Row>
          <TextBox
            label="Profile"
            value={this.state.options.profile}
          />
          <Button onClick={this.showFilePicker}>Choose...</Button>
        </Row>
        <Row>
          <TextBox
            label="Quality"
            value={String(this.state.options.quality)}
            onValueChanged={this.onQualityChange}
          />
        </Row>
        <Row>
          <TextBox
            label="Tile Size"
            value={this.state.options.tileSize}
            onValueChanged={this.onTileSize}
          />
        </Row>
        <Row>
          <Checkbox
            label="Resize"
            value={resizeCheck}
            onChange={this.onResizeCheckChange}
          />
        </Row>
        <Row>
          <TextBox
            disabled={!this.state.options.resizeEnabled}
            value={String(this.state.options.resize)}
            onValueChanged={this.onResizeChange}
          />
        </Row>
        <Row>
          <Checkbox
            label="Resample"
            value={resampleCheck}
            onChange={this.onResampleCheckChange}
          />
        </Row>
        <Row>
          <TextBox
            disabled={!this.state.options.resampleEnabled}
            value={String(this.state.options.resample)}
            onValueChanged={this.onResampleChange}
          />
        </Row>
      </DialogContent>
    )
  }

  private showFilePicker = async () => {
    const window = remote.getCurrentWindow()
    const { filePaths } = await remote.dialog.showOpenDialog(window, {
      properties: ['openFile']
    })
    if (filePaths.length === 0) {
      return
    }

    const options = this.state.options
    options.profile = filePaths[0]

    this.setState({ options: options })
  }

  private onQualityChange = (value: string) => {
    const quality = Number(value)

    const options = this.state.options
    options.quality = quality

    this.setState({ options: options })
  }

  private onTileSize = (value: string) => {
    const options = this.state.options
    options.tileSize = value

    this.setState({ options: options })
  }

  private onResizeChange = (value: string) => {
    const resize = Number(value)
    const options = this.state.options
    options.resize = resize

    this.setState({ options: options })
  }

  private onResizeCheckChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked
    const options = this.state.options
    options.resizeEnabled = value

    this.setState({ options: options })
  }

  private onResampleChange = (value: string) => {
    const resample = Number(value)
    const options = this.state.options
    options.resample = resample

    this.setState({ options: options })
  }

  private onResampleCheckChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked
    const options = this.state.options
    options.resampleEnabled = value

    this.setState({ options: options })
  }

}