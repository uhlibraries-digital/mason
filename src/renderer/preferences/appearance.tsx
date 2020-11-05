import * as React from 'react'
import { Theme } from '../../lib/theme'
import { DialogContent } from '../dialog'
import { VerticalRadioBox } from '../form'
import { IRadioBoxItem } from '../form/radiobox'

import { Row } from '../layout'

const themes: ReadonlyArray<IRadioBoxItem> = [
  { title: 'Light', description: 'The default theme' },
  { title: 'Dark', description: 'What goes bump in the night' }
]

interface IAppearanceProps {
  readonly selectedTheme: Theme
  readonly onSelectedThemeChange: (theme: Theme) => void
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
      </DialogContent>
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
}