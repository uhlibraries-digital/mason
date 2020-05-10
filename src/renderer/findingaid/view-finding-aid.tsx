import * as React from 'react'
import { LinkButton } from '../button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArchive } from "@fortawesome/free-solid-svg-icons"

interface IViewFindingAidProps {
  readonly url: string
}

export class ViewFindingAid extends React.Component<IViewFindingAidProps, {}> {

  public render() {
    return (
      <div className="view-finding-aid">
        <FontAwesomeIcon
          icon={faArchive}
          size="lg"
          className="icon"
        />
        <LinkButton uri={this.props.url}>
          View Finding Aid
        </LinkButton>
      </div>
    )
  }
}