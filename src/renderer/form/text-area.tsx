import * as React from 'react'
import classNames from 'classnames'

interface ITextAreaProps {
  readonly label?: string
  readonly labelClassName?: string
  readonly textareaClassName?: string
  readonly placeholder?: string
  readonly rows?: number
  readonly value?: string
  readonly autoFocus?: boolean
  readonly disabled?: boolean
  readonly tabIndex?: number
  readonly onChange?: (event: React.FormEvent<HTMLTextAreaElement>) => void
  readonly onValueChanged?: (value: string) => void
  readonly onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
  readonly onTextAreaRef?: (instance: HTMLTextAreaElement | null) => void
  readonly onBlur?: () => void
}

export class TextArea extends React.Component<ITextAreaProps, {}> {

  public render() {
    const className = classNames(
      'text-area-component',
      this.props.labelClassName
    )

    return (
      <label className={className}>
        {this.props.label}

        <textarea
          autoFocus={this.props.autoFocus}
          className={this.props.textareaClassName}
          disabled={this.props.disabled}
          rows={this.props.rows}
          placeholder={this.props.placeholder}
          value={this.props.value}
          tabIndex={this.props.tabIndex}
          onChange={this.onChange}
          onKeyDown={this.props.onKeyDown}
          ref={this.props.onTextAreaRef}
          onBlur={this.onBlur}
        />
      </label>
    )
  }

  private onChange = (event: React.FormEvent<HTMLTextAreaElement>) => {
    if (this.props.onChange) {
      this.props.onChange(event)
    }

    if (this.props.onValueChanged && !event.defaultPrevented) {
      this.props.onValueChanged(event.currentTarget.value)
    }
  }

  private onBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    if (this.props.onBlur) {
      this.props.onBlur()
    }
  }


}