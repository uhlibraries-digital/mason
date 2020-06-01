import * as React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSyncAlt } from "@fortawesome/free-solid-svg-icons"

export class Loading extends React.Component<{}, {}> {
  public render() {
    return (
      <FontAwesomeIcon
        className="icon"
        icon={faSyncAlt}
        size="lg"
        spin={true}
      />
    )
  }
}