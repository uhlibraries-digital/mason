import * as React from 'react'
import { getThemeName, Theme } from '../lib/theme';

interface IAppThemeProps {
  readonly theme: Theme
}

export class AppTheme extends React.PureComponent<IAppThemeProps> {
  public componentDidMount() {
    this.setTheme()
  }

  public componentDidUpdate() {
    this.setTheme()
  }

  public componentWillUnmount() {
    this.clearTheme()
  }

  private setTheme() {
    const themeClassName = `theme-${getThemeName(this.props.theme)}`
    const body = document.body

    if (body.classList.contains(themeClassName)) {
      return
    }

    this.clearTheme()
    body.classList.add(themeClassName)
  }

  private clearTheme() {
    const body = document.body

    for (const className of body.classList) {
      if (className.startsWith('theme-')) {
        body.classList.remove(className)
      }
    }
  }

  public render() {
    return null
  }
}