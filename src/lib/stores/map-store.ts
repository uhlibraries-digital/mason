import { BaseStore } from './base-store'
import rp from 'request-promise'
import { BcDamsMap } from '../map'

export class MapStore extends BaseStore {

  private preservationUrl: string = ''
  private accessUrl: string = ''

  private preservationMap: ReadonlyArray<BcDamsMap> | null = null
  private accessMap: ReadonlyArray<BcDamsMap> | null = null

  public async updateMaps(): Promise<any> {
    const options = {
      uri: '',
      simple: false,
      json: true,
      resolveWithFullResponse: true
    }
    if (this.preservationUrl !== '') {
      options.uri = this.preservationUrl
      this.preservationMap = await rp(options)
        .then((response) => {
          if (response.statusCode !== 200) {
            this.emitError(new Error(`Preservation Map ${response.statusCode}: ${response.statusMessage}`))
            return
          }
          return response.body
        })
    }
    if (this.accessUrl !== '') {
      options.uri = this.accessUrl
      this.accessMap = await rp(options)
        .then((response) => {
          if (response.statusCode !== 200) {
            this.emitError(new Error(`Access Map ${response.statusCode}: ${response.statusMessage}`))
            return
          }
          return response.body
        })
    }

    this.emitUpdate()
  }

  public getPreservationMap(): ReadonlyArray<BcDamsMap> | null {
    return this.preservationMap
  }

  public getAccessMap(): ReadonlyArray<BcDamsMap> | null {
    return this.accessMap
  }

  public setMapUrls(preservationUrl: string, accessUrl: string) {
    this.preservationUrl = preservationUrl
    this.accessUrl = accessUrl
    this.updateMaps()
  }

  public setPreservationMapUrl(url: string) {
    this.preservationUrl = url
    this.updateMaps()
  }

  public setAccessMapUrl(url: string) {
    this.accessUrl = url
    this.updateMaps()
  }
}