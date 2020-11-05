import * as React from 'react'
import { RadioItem } from './radiobox'

export interface IVerticalRadioBoxItem {
  readonly title: string
  readonly description?: string
}

interface IVerticalRadioBoxProps {
  readonly items: ReadonlyArray<IVerticalRadioBoxItem>
  readonly selectedIndex: number

  readonly onSelectionChange: (index: number) => void
}

export class VerticalRadioBox extends React.Component<IVerticalRadioBoxProps, {}> {

  public render() {
    return (
      <ul className="vertical-radio-box-options">
        {this.renderItems()}
      </ul>
    )
  }

  public renderItems() {

    return this.props.items.map((item, index) => {
      const isSelected = index === this.props.selectedIndex

      return (
        <RadioItem
          title={item.title}
          description={item.description}
          index={index}
          key={index}
          isSelected={isSelected}
          onClick={this.onItemClick}
        />
      )
    })

  }

  private onItemClick = (index: number) => {
    if (index !== this.props.selectedIndex) {
      this.props.onSelectionChange(index)
    }
  }

}