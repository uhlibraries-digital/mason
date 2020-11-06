import * as React from 'react'
import { Dispatcher } from '../../lib/dispatcher'
import {
  Dialog,
  DialogFooter
} from '../dialog'
import {
  Button,
  ButtonGroup
} from '../button'
import { TabBar } from '../tab-bar'
import { electronStore } from '../../lib/stores'
import {
  IConvertSetting,
  IConvertTypeSetting
} from '../../lib/app-state'
import { ImageOption } from './image-option'
import { TextOption } from './text-option'

interface IConvertOptionsProps {
  readonly dispatcher: Dispatcher

  readonly onDismissed: () => void
}

interface IConvertOptionsState {
  readonly settings: IConvertTypeSetting
  readonly selectedTabIndex: number
}

enum ConvertTab {
  Image = 0,
  Text = 1
}

const imagePathKey = 'image-profilepath'
const textPathKey = 'text-profilepath'

export class ConvertOptions extends React.Component<IConvertOptionsProps, IConvertOptionsState> {


  public constructor(props: IConvertOptionsProps) {
    super(props)

    const imageProfile = String(electronStore.get(imagePathKey, ''))
    const textProfile = String(electronStore.get(textPathKey, ''))

    const settings: IConvertTypeSetting = {
      image: {
        profile: imageProfile,
        quality: 90,
        resize: 100,
        resizeEnabled: false,
        resampleEnabled: false,
        resample: 150,
        tileSize: '256x256'
      },
      text: {
        profile: textProfile,
        quality: 90,
        resize: 100,
        resizeEnabled: false,
        resampleEnabled: false,
        resample: 150,
        tileSize: ''
      }
    }

    this.state = {
      settings: settings,
      selectedTabIndex: 0
    }
  }

  public render() {
    return (
      <Dialog
        id="convert-options"
        title="Convert Options"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSave}
      >
        <TabBar
          onTabClicked={this.onTabClicked}
          selectedIndex={this.state.selectedTabIndex}
        >
          <span>Image</span>
          <span>Text</span>
        </TabBar>
        {this.renderActiveTab()}
        <DialogFooter>
          {this.renderActiveButtons()}
        </DialogFooter>
      </Dialog>
    )
  }

  private onTabClicked = (index: number) => {
    this.setState({ selectedTabIndex: index })
  }

  private renderActiveButtons() {
    return (
      <ButtonGroup>
        <Button type="submit">Save</Button>
        <Button onClick={this.props.onDismissed}>Cancel</Button>
      </ButtonGroup>
    )
  }

  private renderActiveTab() {
    const index = this.state.selectedTabIndex
    switch (index) {
      case ConvertTab.Image:
        return (
          <ImageOption
            setting={this.state.settings.image}
            onSettingChanged={this.onImageSettingChange}
          />
        )
      case ConvertTab.Text:
        return (
          <TextOption
            setting={this.state.settings.text}
            onSettingChanged={this.onTextSettingChange}
          />
        )
    }

    return null
  }

  private onSave = () => {
    electronStore.set(imagePathKey, this.state.settings.image.profile)
    electronStore.set(textPathKey, this.state.settings.text.profile)

    this.props.dispatcher.convertImages(this.state.settings)

    this.props.onDismissed()
  }

  private onImageSettingChange = (setting: IConvertSetting) => {
    const settings = this.state.settings
    settings.image = setting
    this.setState({ settings: settings })
  }

  private onTextSettingChange = (setting: IConvertSetting) => {
    const settings = this.state.settings
    settings.text = setting
    this.setState({ settings: settings })
  }

}