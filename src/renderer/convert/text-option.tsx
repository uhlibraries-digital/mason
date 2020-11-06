import * as React from 'react'
import { remote } from 'electron'
import { IConvertSetting } from '../../lib/app-state'
import { DialogContent } from '../dialog'
import {
  TextBox,
  Checkbox,
  CheckboxValue
} from '../form'
import { Row } from '../layout'
import { Button } from '../button'

interface ITextOptionProps {
  readonly setting: IConvertSetting
  readonly onSettingChanged: (setting: IConvertSetting) => void
}

interface ITextOptionState {
  readonly setting: IConvertSetting
}

export class TextOption extends React.Component<ITextOptionProps, ITextOptionState> {

  public constructor(props: ITextOptionProps) {
    super(props)

    this.state = {
      setting: props.setting
    }
  }

  public render() {
    const resizeCheck = this.state.setting.resizeEnabled ? CheckboxValue.On : CheckboxValue.Off
    const resampleCheck = this.state.setting.resampleEnabled ? CheckboxValue.On : CheckboxValue.Off

    return (
      <DialogContent>
        <Row>
          <TextBox
            label="Profile"
            value={this.state.setting.profile}
          />
          <Button onClick={this.showFilePicker}>Choose...</Button>
        </Row>
        <Row>
          <TextBox
            label="Quality"
            value={String(this.state.setting.quality)}
            onValueChanged={this.onQualityChange}
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
            disabled={!this.state.setting.resizeEnabled}
            value={String(this.state.setting.resize)}
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
            disabled={!this.state.setting.resampleEnabled}
            value={String(this.state.setting.resample)}
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

    const setting = this.state.setting
    setting.profile = filePaths[0]

    this.setState({ setting: setting })
  }

  private onQualityChange = (value: string) => {
    const quality = Number(value)

    const setting = this.state.setting
    setting.quality = quality

    this.setState({ setting: setting })
  }

  private onResizeChange = (value: string) => {
    const resize = Number(value)
    const setting = this.state.setting
    setting.resize = resize

    this.setState({ setting: setting })
  }

  private onResizeCheckChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked
    const setting = this.state.setting
    setting.resizeEnabled = value

    this.setState({ setting: setting })
  }

  private onResampleChange = (value: string) => {
    const resample = Number(value)
    const setting = this.state.setting
    setting.resample = resample

    this.setState({ setting: setting })
  }

  private onResampleCheckChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked
    const setting = this.state.setting
    setting.resampleEnabled = value

    this.setState({ setting: setting })
  }

}