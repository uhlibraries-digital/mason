import * as React from 'react'

export interface IRadioBoxItem {
  readonly title: string
  readonly description?: string
}

interface IRadioBoxProps {
  readonly items: ReadonlyArray<IRadioBoxItem>
  readonly selectedIndex: number

  readonly onSelectionChange: (index: number) => void
}

export class RadioBox extends React.Component<IRadioBoxProps, {}> {

  public render() {
    return (
      <ul className="radio-box-options">
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

interface IRadioItem {
  readonly title: string
  readonly description?: string
  readonly index: number
  readonly isSelected: boolean

  readonly onClick: (index: number) => void
}

export class RadioItem extends React.Component<IRadioItem, {}> {

  public render() {
    const className = this.props.isSelected ? 'selected' : undefined

    const description = this.props.description ? (
      <p>{this.props.description}</p>
    ) : undefined

    return (
      <li
        onClick={this.onClick}
        className={className}
      >
        <div className="title">{this.props.title}</div>
        {description}
      </li>
    )
  }

  public onClick = (event: React.MouseEvent) => {
    this.props.onClick(this.props.index)
  }
}