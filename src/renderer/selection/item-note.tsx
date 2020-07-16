import * as React from 'react'
import * as classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as SolidIcons from "@fortawesome/free-solid-svg-icons"
import * as RegularIcons from "@fortawesome/free-regular-svg-icons"

interface ItemNoteProps {
  readonly note: string

  readonly onNoteClick?: () => void
}


export class ItemNote extends React.Component<ItemNoteProps, {}> {
  public render() {
    const note = this.props.note
    const hasNote = note !== ''

    const noteIcon = hasNote
      ? SolidIcons.faClipboard : RegularIcons.faClipboard

    const noteClass = classNames('note-icon', { hasNote })

    return (
      <div
        className={noteClass}
        onClick={this.onNoteClick}
        title={note}
      >
        <FontAwesomeIcon
          icon={noteIcon}
          size="lg"
        />
      </div>
    )
  }

  private onNoteClick = (event: React.MouseEvent<HTMLElement>) => {
    if (this.props.onNoteClick) {
      this.props.onNoteClick()
    }
  }
}