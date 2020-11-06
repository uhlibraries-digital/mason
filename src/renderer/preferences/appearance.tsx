import * as React from 'react'
import { supportsDarkMode } from '../../lib/dark-mode'
import { Theme } from '../../lib/theme'
import { DialogContent } from '../dialog'
import {
  Checkbox,
  CheckboxValue,
  VerticalRadioBox
} from '../form'
import { IRadioBoxItem } from '../form/radiobox'

import { Row } from '../layout'

const themes: ReadonlyArray<IRadioBoxItem> = [
  { title: 'Light', description: 'The default theme' },
  { title: 'Dark', description: 'What goes bump in the night' }
]

interface IAppearanceProps {
  readonly selectedTheme: Theme
  readonly automaticallySwitchTheme: boolean
  readonly onSelectedThemeChange: (theme: Theme) => void
  readonly onAutoThemeChange: (value: boolean) => void
}


export class Appearance extends React.Component<IAppearanceProps, {}> {


  public render() {
    const selectedIndex = this.props.selectedTheme === Theme.Dark ? 1 : 0

    return (
      <DialogContent>
        <Row>
          <VerticalRadioBox
            items={themes}
            selectedIndex={selectedIndex}
            onSelectionChange={this.onSelectionChange}
          />
        </Row>
        {this.renderAutoSwitchTheme()}
      </DialogContent>
    )
  }

  private renderAutoSwitchTheme() {
    if (!supportsDarkMode()) {
      return null
    }

    const value = this.props.automaticallySwitchTheme ? CheckboxValue.On : CheckboxValue.Off

    return (
      <Row>
        <Checkbox
          label="Automatically switch theme to match system theme"
          value={value}
          onChange={this.onAutoSwitchChange}
        />
      </Row>
    )
  }

  private onSelectionChange = (index: number) => {
    if (index === 1) {
      this.props.onSelectedThemeChange(Theme.Dark)
    }
    else {
      this.props.onSelectedThemeChange(Theme.Light)
    }
  }

  private onAutoSwitchChange = (event: React.FormEvent<HTMLInputElement>) => {
    this.props.onAutoThemeChange(event.currentTarget.checked)
  }
}