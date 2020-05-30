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
import {
  TextBox,
  Checkbox,
  CheckboxValue
} from '../form'
import { Row } from '../layout'
import { remote } from 'electron'
import { electronStore } from '../../lib/stores'

interface IConvertOptionsProps {
  readonly dispatcher: Dispatcher

  readonly onDismissed: () => void
}

interface IConvertOptionsState {
  readonly profile: string
  readonly quality: number | string
  readonly resize: number | string
  readonly resizeEnabled: boolean
  readonly tileSize: string
  readonly resampleEnabled: boolean
  readonly resample: number | string
}

export class ConvertOptions extends React.Component<IConvertOptionsProps, IConvertOptionsState> {


  public constructor(props: IConvertOptionsProps) {
    super(props)

    const profile = String(electronStore.get('profilepath', ''))

    this.state = {
      profile: profile,
      quality: 90,
      resize: 100,
      resizeEnabled: false,
      tileSize: '256x256',
      resampleEnabled: false,
      resample: 150
    }
  }

  public render() {
    const resizeCheck = this.state.resizeEnabled ? CheckboxValue.On : CheckboxValue.Off

    return (
      <Dialog
        id="convert-options"
        title="Convert Options"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSave}
      >
        <DialogContent>
          <Row>
            <TextBox
              label="Profile"
              value={this.state.profile}
            />
            <Button onClick={this.showFilePicker}>Choose...</Button>
          </Row>
          <Row>
            <TextBox
              label="Quality"
              value={String(this.state.quality)}
              onValueChanged={this.onQualityChange}
            />
          </Row>
          <Row>
            <TextBox
              label="Tile Size"
              value={this.state.tileSize}
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
              disabled={!this.state.resizeEnabled}
              value={String(this.state.resize)}
              onValueChanged={this.onResizeChange}
            />
          </Row>
          <Row>
            <Checkbox
              label="Resample"
              value={CheckboxValue.Off}
              onChange={this.onResampleCheckChange}
            />
          </Row>
          <Row>
            <TextBox
              disabled={!this.state.resampleEnabled}
              value={String(this.state.resample)}
              onValueChanged={this.onResampleChange}
            />
          </Row>
        </DialogContent>
        <DialogFooter>
          <ButtonGroup>
            <Button type="submit">Continue</Button>
            <Button onClick={this.props.onDismissed}>Cancel</Button>
          </ButtonGroup>
        </DialogFooter>
      </Dialog>
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
    this.setState({ profile: filePaths[0] })
  }

  private onQualityChange = (value: string) => {
    const quality = Number(value) || ''

    this.setState({ quality: quality })
  }

  private onTileSize = (value: string) => {
    this.setState({ tileSize: value })
  }

  private onResizeChange = (value: string) => {
    const resize = Number(value) || ''
    this.setState({ resize: resize })
  }

  private onResizeCheckChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked
    this.setState({ resizeEnabled: value })
  }

  private onResampleChange = (value: string) => {
    const resample = Number(value) || ''
    this.setState({ resample: resample })
  }

  private onResampleCheckChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked
    this.setState({ resampleEnabled: value })
  }

  private onSave = () => {
    electronStore.set('profilepath', this.state.profile)

    const resize = this.state.resizeEnabled ? Number(this.state.resize) || false : false
    const resample = this.state.resampleEnabled ? Number(this.state.resample) || false : false

    this.props.dispatcher.convertImages(
      this.state.profile,
      Number(this.state.quality),
      resize, resample,
      this.state.tileSize
    )
    this.props.onDismissed()
  }

}