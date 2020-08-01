import { remote } from 'electron'
import { BaseStore } from './base-store'
import { Visitor } from 'universal-analytics'
import { electronStore } from './electron-store'
import { v4 } from 'uuid'


const uaid = 'UA-174222383-1'

export class AnalyticsStore extends BaseStore {

  private usr: Visitor | null = null

  public constructor() {
    super()

    if (!__DEV__) {
      const userId = String(electronStore.get('userId', v4()))
      electronStore.set('userId', userId)
      this.usr = new Visitor(uaid, userId)

      this.usr.screenview({
        cd: 'Application',
        an: remote.app.name,
        av: remote.app.getVersion()
      }).send()
    }
  }

  public event(category?: string, action?: string, label?: string, value?: string) {
    if (!this.usr) {
      return
    }

    this.usr.event({
      ec: category,
      ea: action,
      el: label,
      ev: value
    }).send()
  }

  public exception(description: string) {
    if (!this.usr) {
      return
    }

    this.usr.exception(description).send()
  }
}