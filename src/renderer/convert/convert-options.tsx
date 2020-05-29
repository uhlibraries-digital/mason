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
import { TextBox, Checkbox, CheckboxValue } from '../form'
import { Row } from '../layout'

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
  readonly resample: boolean
}

export class ConvertOptions extends React.Component<IConvertOptionsProps, IConvertOptionsState> {


  public constructor(props: IConvertOptionsProps) {
    super(props)

    this.state = {
      profile: '',
      quality: 90,
      resize: 100,
      resizeEnabled: false,
      tileSize: '255x255',
      resample: false
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

  private onQualityChange = (value: string) => {
    const quality = Number(value) || ''

    this.setState({ quality: quality })
  }

  private onTileSize = (value: string) => {
    this.setState({ tileSize: value })
  }

  private onResizeChange = (value: string) => {
    this.setState({ resize: value })
  }

  private onResizeCheckChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked
    this.setState({ resizeEnabled: value })
  }

  private onSave = () => {
    console.log('TODO')
  }

}