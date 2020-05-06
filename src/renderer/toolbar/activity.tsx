import * as React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons'
import { IActivity } from '../../lib/app-state';

export interface IActivityProps {
  readonly activities: ReadonlyArray<IActivity>
}

export class Activity extends React.Component<IActivityProps, {}> {

  public render() {
    const currentActivity: IActivity | null =
      this.props.activities.slice(-1).pop() || null
    const spin = this.props.activities.length !== 0
    const activityDescription = currentActivity ?
      currentActivity.description : 'Ready'

    return (
      <div className="toolbar-activity">
        <FontAwesomeIcon
          className="icon"
          icon={faSyncAlt}
          size="lg"
          spin={spin}
        />
        <div className="description">
          {activityDescription}
        </div>
      </div>
    )
  }

}