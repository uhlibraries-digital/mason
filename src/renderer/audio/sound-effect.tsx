import * as React from 'react'
import { encodePathAsUrl, staticPath } from '../../lib/path'

interface ISoundEffectProps {
  readonly sound: string
  readonly onDismissed: () => void
}

export class SoundEffect extends React.Component<ISoundEffectProps, {}> {

  private audio: HTMLAudioElement | null = null

  public componentDidMount() {
    if (this.props.sound === '') {
      return
    }

    const sound = encodePathAsUrl(
      staticPath(),
      `${this.props.sound}.mp3`
    )

    this.audio = new Audio(sound)
    this.audio.addEventListener('ended', () => { this.onEnded() })
    this.audio.play()
  }

  public componentWillUnmount() {
    if (!this.audio) {
      return
    }
    this.audio.removeEventListener('ended', () => { this.onEnded() })
  }

  private onEnded() {
    this.props.onDismissed()
  }

  public render() {
    return (
      <div className="audio-container"></div>
    )
  }

}