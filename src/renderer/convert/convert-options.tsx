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
  IConvertOptions,
  IConvertTypeOption
} from '../../lib/app-state'
import { ImageOption } from './image-option'
import { TextOption } from './text-option'

interface IConvertOptionsProps {
  readonly dispatcher: Dispatcher

  readonly onDismissed: () => void
}

interface IConvertOptionsState {
  readonly typeOption: IConvertTypeOption
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

    const typeOption: IConvertTypeOption = {
      image: {
        profile: imageProfile,
        quality: 90,
        resize: '100%',
        resizeEnabled: false,
        resampleEnabled: false,
        resample: 150,
        tileSize: '256x256'
      },
      text: {
        profile: textProfile,
        quality: 90,
        resize: '100%',
        resizeEnabled: false,
        resampleEnabled: false,
        resample: 150,
        tileSize: ''
      }
    }

    this.state = {
      typeOption: typeOption,
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
            options={this.state.typeOption.image}
            onOptionsChanged={this.onImageOptionsChange}
          />
        )
      case ConvertTab.Text:
        return (
          <TextOption
            options={this.state.typeOption.text}
            onOptionsChanged={this.onTextOptionsChange}
          />
        )
    }

    return null
  }

  private onSave = () => {
    electronStore.set(imagePathKey, this.state.typeOption.image.profile)
    electronStore.set(textPathKey, this.state.typeOption.text.profile)

    this.props.dispatcher.convertImages(this.state.typeOption)

    this.props.onDismissed()
  }

  private onImageOptionsChange = (options: IConvertOptions) => {
    const typeOption = this.state.typeOption
    typeOption.image = options
    this.setState({ typeOption: typeOption })
  }

  private onTextOptionsChange = (options: IConvertOptions) => {
    const typeOption = this.state.typeOption
    typeOption.text = options
    this.setState({ typeOption: typeOption })
  }

}