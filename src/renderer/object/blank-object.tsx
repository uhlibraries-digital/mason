import * as React from 'react'
import { staticPath, encodePathAsUrl } from '../../lib/path'

const BlankObjectImage = encodePathAsUrl(
  staticPath(),
  'blank-object.svg'
)

export class BlankObject extends React.Component<{}, {}> {

  public render() {
    return (
      <div id="blank-object">
        <img src={BlankObjectImage} className="blankobject-image" />
        <div className="blank-object-text">
          Select a object to start editing files and metadata
        </div>
      </div>
    )
  }
}