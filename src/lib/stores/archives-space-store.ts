import { BaseStore } from './base-store'
import * as rp from 'request-promise'
import { TokenStore } from './token-store'

export type ArchivesSpaceToken = {
  session: string,
  expires: number
}

export type ArchivesSpaceResource = {
  uri: string,
  title: string
}

export type ArchivesSpaceRepository = {
  agent_representation: ArchivesSpaceRef
  country: string
  create_time: string
  created_by: string
  display_string: string
  is_slug_auto: boolean
  jsonmodel_type: string
  last_modified_by: string
  lock_version: number
  name: string
  oai_is_disabled: boolean
  oai_sets_available: string
  parent_institution_name: string
  publish: boolean
  repo_code: string
  slug: string
  system_mtime: string
  uri: string
  url: string
  user_mtime: string
}

export type ArchivesSpaceRef = {
  ref: string
}

export class ArchivesSpaceStore extends BaseStore {

  private username: string = ''
  private password: string = ''
  private endpoint: string = ''

  private token: ArchivesSpaceToken | null = null

  public async load(endpoint: string, username: string): Promise<any> {
    if (!endpoint || !username) {
      return Promise.reject(new Error('Unable to load ArchivesSpace data. Missing endpoint and/or username'))
    }
    this.endpoint = endpoint
    this.username = username
    try {
      this.password = await TokenStore.getItem('mason/archivesspace', username) || ''
    } catch (err) {
      return Promise.reject(new Error('Unable to get password for ArchivesSpace'))
    }

    const repositories = await this.getRepositories()

    return Promise.resolve(repositories)
  }

  public setEndpoint(endpoint: string) {
    this.endpoint = endpoint
  }

  public setUsernamePassword(username: string, password: string) {
    this.username = username
    this.password = password
    TokenStore.setItem('mason/archivesspace', username, password)
  }

  public async getResources(uri: string): Promise<any> {
    const pagesize = 100
    const result = await this._request(uri, { page_size: pagesize, page: 1, type: ["resource"] })
    let resources: Array<ArchivesSpaceResource> = result.results as Array<ArchivesSpaceResource>
    for (let page = 2; page <= result.last_page; page++) {
      const r = await this._request(uri, { page_size: pagesize, page: page, type: ["resource"] })
      resources = resources.concat(r.results)
    }

    return resources as ReadonlyArray<ArchivesSpaceResource>
  }

  public async getRepositories(): Promise<any> {
    const repositories = await this._request('/repositories') as ReadonlyArray<ArchivesSpaceRepository>
    return repositories
  }

  public async getArchivalObject(uri: string): Promise<any> {
    if (uri === '') return null
    return this._request(uri)
      .catch((error) => {
        throw error
      })
  }

  public async getTopContainer(uri: string): Promise<any> {
    return this._request(uri)
      .catch((error) => {
        throw error
      })
  }

  private async _request(uri: string, params?: any): Promise<any> {
    const today = new Date();
    if (!this.token || this.token.expires <= today.getTime()) {
      try {
        await this._setSessionToken()
      } catch (err) { throw err }
    }

    const options = {
      uri: `${this.endpoint}${uri}`,
      qs: params,
      headers: {
        'X-ArchivesSpace-Session': this.token ? this.token.session : ''
      },
      json: true,
      resolveWithFullResponse: true,
      simple: false
    }

    return rp(options)
      .then((response) => {
        if (response.statusCode !== 200) {
          console.error(response)
          throw new Error(response.statusCode + ': ' + response.statusMessage)
        }
        return response.body
      })
      .catch((error) => {
        throw error
      })
  }


  private async _setSessionToken(): Promise<any> {
    const url = `${this.endpoint}/users/${this.username}/login`

    const options = {
      method: 'POST',
      uri: url,
      form: {
        password: this.password
      },
      resolveWithFullResponse: true,
      json: true
    }
    return rp(options)
      .then((response) => {
        if (response.statusCode !== 200) {
          console.error(response)
          return Promise.reject(new Error(response.statusCode + ': ' + response.error.error))

        }
        const now = new Date()
        this.token = {
          session: response.body.session,
          expires: now.getTime() + (3600 * 1000)
        }
        return this.token
      })
      .catch((err) => {
        return Promise.reject(new Error(`ArchviesSpace: ${err.error.error}`))
      })
  }
}