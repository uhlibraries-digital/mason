import { BaseStore } from './base-store'
import rp from 'request-promise'
import { TokenStore } from './token-store'
import { capitalize } from '../string'

export type ArchivesSpaceToken = {
  session: string,
  expires: number
}

export type ArchivesSpaceResource = {
  classifications: ReadonlyArray<ArchivesSpaceRef>
  create_time: string
  created_by: string
  dates: ReadonlyArray<ArchivesSpaceDate>
  deaccessions: ReadonlyArray<any>
  ead_id: string
  extents: ReadonlyArray<ArchivesSpaceExtent>
  external_documents: ReadonlyArray<ArchivesSpaceExternalDocument>
  external_ids: ReadonlyArray<any>
  finding_aid_author: string
  findingaid_date: string
  findingaid_filing_title: string
  findingaid_language: string
  findingaid_language_note: string
  findingaid_script: string
  findingiad_title: string
  id_0: string
  instances: ReadonlyArray<ArchivesSpaceInstance>
  is_slug_auto: boolean
  jsonmodel_type: string
  lang_materials: ReadonlyArray<ArchivesSpaceLangMaterial>
  last_modified_by: string
  level: string
  linked_agents: ReadonlyArray<any>
  linked_events: ReadonlyArray<any>
  lock_version: number
  notes: ReadonlyArray<ArchivesSpaceNote>
  publish: boolean
  related_accessions: ReadonlyArray<any>
  repository: ArchivesSpaceRef
  restrictions: boolean
  revision_statements: ReadonlyArray<any>
  rights_statements: ReadonlyArray<any>
  subjects: ReadonlyArray<any>
  suppressed: boolean
  system_mtime: string
  title: string
  tree: ArchivesSpaceRef
  uri: string
  user_mtime: string
}

export type ArchivesSpaceExternalDocument = {
  create_time: string
  created_by: string
  jsonmodel_type: string
  last_modified_by: string
  location: string
  lock_version: number
  publish: boolean
  system_mtime: string
  title: string
  user_mtime: string
}

export type ArchivesSpaceLangMaterial = {
  create_time: string
  jsonmodel_type: string
  language_and_script: any
  lock_version: number
  nodes: ReadonlyArray<ArchivesSpaceNote>
  system_mtime: string
  user_mtime: string
}

export type ArchivesSpaceExtent = {
  create_time: string
  created_by: string
  extent_type: string
  jsonmodel_type: string
  last_modified_by: string
  lock_version: number
  number: string
  portion: string
  system_mtime: string
  user_mtime: string
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

export type ArchivesSpaceTree = {
  children: ReadonlyArray<ArchivesSpaceChild>
  containers: ReadonlyArray<ArchivesSpaceContainer>
  parsed_title: string
  id: number
  jsonmodel_type: string
  level: string
  record_uri: string
  title: string
}

export type ArchivesSpaceChild = {
  children: ReadonlyArray<ArchivesSpaceChild>
  containers: ReadonlyArray<ArchivesSpaceContainer>
  has_children: boolean
  id: number
  level: string
  node_type: string
  record_uri: string
  title: string
}

export type ArchivesSpaceTreeRoot = {
  child_count: number
  jsonmodel_type: string
  level: string
  parsed_title: string
  precomputed_waypoints: any
  slogged_url: string
  title: string
  uri: string
  waypoint_size: number
  waypoints: number
}

export type ArchivesSpaceTreeWaypoint = {
  child_count: number
  jsonmodel_type: string
  level: string
  parent_id: string
  parsed_title: string
  position: number
  slogged_url: string
  title: string
  uri: string
  waypoint_size: number
  waypoints: number
}

export type ArchivesSpaceTreeNode = {
  child_count: number
  jsonmodel_type: string
  position: number
  precomputed_waypoints: any
  title: string
  uri: string
  waypoint_size: number
  waypoints: number
}

export interface ArchivesSpaceContainer {
  top_container: ArchivesSpaceRef | null
  type_1: string | null
  indicator_1: string | null
  type_2: string | null
  indicator_2: string | null
  type_3: string | null
  indicator_3: string | null
}

export interface ArchivesSpaceTopContainer {
  active_restrictions: ReadonlyArray<any>
  collection: ReadonlyArray<ArchivesSpaceCollection>
  container_locations: ReadonlyArray<any>
  create_time: string
  created_by: string
  display_string: string
  indicator: string
  is_linked_to_published_record: boolean
  jsonmodel_type: string
  last_modified_by: string
  lock_version: number
  long_display_string: string
  repository: ArchivesSpaceRef
  restricted: boolean
  series: ReadonlyArray<any>
  system_mtime: string
  type: string
  uri: string
  user_mtime: string
}

export interface ArchivesSpaceCollection {
  display_string: string
  identifier: string
  ref: string
}

export interface ArchivesSpaceArchivalObject {
  ancestors: ReadonlyArray<ArchivesSpaceAncestors>
  create_time: string
  created_by: string
  dates: ReadonlyArray<ArchivesSpaceDate>
  display_string: string
  extends: ReadonlyArray<any>
  external_documents: ReadonlyArray<any>
  external_ids: ReadonlyArray<any>
  has_unpublished_ancestor: boolean
  instances: ReadonlyArray<ArchivesSpaceInstance>
  is_slug_auto: boolean
  jsonmodel_type: string
  lang_materials: ReadonlyArray<any>
  last_modified_by: string
  level: string
  linked_agents: ReadonlyArray<any>
  linked_events: ReadonlyArray<any>
  lock_version: number
  notes: ReadonlyArray<ArchivesSpaceNote>
  parent: ArchivesSpaceRef | null
  position: number
  publish: boolean
  ref_id: string
  repository: ReadonlyArray<ArchivesSpaceRef>
  resource: ReadonlyArray<ArchivesSpaceRef>
  restrictions_apply: boolean
  rights_statements: ReadonlyArray<any>
  subjects: ReadonlyArray<any>
  suppressed: boolean
  system_mtime: string
  title: string
  uri: string
  user_mtime: string
}

export interface ArchivesSpaceInstance {
  create_time: string
  created_type: string
  instance_type: string
  is_representative: boolean
  jsonmodel_type: string
  last_modified_by: string
  lock_version: number
  sub_container: ArchivesSpaceSubContainer
  system_mtime: string
  user_mtime: string
}

export interface ArchivesSpaceSubContainer {
  create_time: string
  created_by: string
  indicator_2: string
  indicator_3: string
  jsonmodel_type: string
  las_modified_by: string
  lock_version: number
  system_mtime: string
  top_container: ArchivesSpaceRef
  type_2: string
  type_3: string
  user_mtime: string
}

export interface ArchivesSpaceNote {
  jsonmodel_type: string
  label: string
  persistent_id: string
  publish: boolean
  subnotes: ReadonlyArray<ArchivesSpaceSubnote>
  type: string
}

export interface ArchivesSpaceSubnote {
  jsonmodel_type: string
  content: string
  publish: boolean
}

export interface ArchivesSpaceDate {
  begin: string
  create_time: string
  created_by: string
  date_type: string
  end: string
  expression: string
  jsonmodel_type: string
  label: string
  last_modified_by: string
  lock_version: number
  system_mtime: string
  user_mtime: string
}

export interface ArchivesSpaceAncestors {
  level: string
  ref: string
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
    if (username === '') {
      return
    }

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

  public async getResourceTree(uri: string): Promise<any> {
    return this._request(`${uri}/tree`)
  }

  public async getResourceTreeRoot(uri: string): Promise<any> {
    return this._request(`${uri}/tree/root`)
  }

  public async getResourceTreeWaypoint(uri: string, offset: number = 0, parent_node?: string): Promise<any> {
    const params = parent_node ? { offset: offset, parent_node: parent_node } : { offset: offset }
    return this._request(`${uri}/tree/waypoint`, params)
  }

  public async getResourceTreeNode(uri: string, node_uri: string): Promise<any> {
    const params = { node_uri: node_uri }
    return this._request(`${uri}/tree/node`, params)
  }

  public async buildResourceTree(uri: string): Promise<ArchivesSpaceTree> {
    const root = await this.getResourceTreeRoot(uri) as ArchivesSpaceTreeRoot
    const children = await this.buildResourceTreeChildren(uri, root.waypoints)

    return Promise.resolve({
      children: children,
      containers: [],
      parsed_title: root.parsed_title,
      id: this._idFromUri(root.uri),
      jsonmodel_type: root.jsonmodel_type,
      level: root.level,
      record_uri: root.uri,
      title: root.title
    })
  }

  public async buildResourceTreeChildren(
    uri: string,
    waypoints: number,
    parent_node?: string
  ): Promise<ReadonlyArray<ArchivesSpaceChild>> {

    let treewaypoints: Array<ArchivesSpaceTreeWaypoint> = []
    for (let w = 0; w < waypoints; w++) {
      const children = await this.getResourceTreeWaypoint(uri, w, parent_node) as ReadonlyArray<ArchivesSpaceTreeWaypoint>
      treewaypoints = treewaypoints.concat(children)
    }

    let children: Array<ArchivesSpaceChild> = []
    for (let i = 0; i < treewaypoints.length; i++) {
      const waypoint = treewaypoints[i]
      const aschildren = waypoint.child_count > 0 ?
        await this.buildResourceTreeChildren(uri, waypoint.waypoints, waypoint.uri) :
        []

      if (!waypoint.title) {
        const node = await this.getResourceTreeNode(uri, waypoint.uri) as ArchivesSpaceTreeNode
        waypoint.title = node.title
      }

      children.push({
        children: aschildren,
        containers: [],
        has_children: waypoint.child_count > 0,
        id: this._idFromUri(waypoint.uri),
        level: waypoint.level,
        node_type: waypoint.jsonmodel_type,
        record_uri: waypoint.uri,
        title: waypoint.title
      })
    }

    return Promise.resolve(children)
  }

  public async getResource(uri: string): Promise<any> {
    return this._request(uri)
  }

  public async getContainer(uri: string, archivalObject?: ArchivesSpaceArchivalObject): Promise<any> {
    const ao = archivalObject ? archivalObject : await this.getArchivalObject(uri) as ArchivesSpaceArchivalObject
    const instances = ao.instances.filter(
      instance => instance.sub_container && instance.sub_container.top_container)

    if (!instances.length) {
      const type = capitalize(ao.level)
      const containers: ReadonlyArray<ArchivesSpaceContainer> = [{
        top_container: null,
        type_1: type,
        indicator_1: String(ao.position + 1),
        type_2: null,
        indicator_2: null,
        type_3: null,
        indicator_3: null
      }]
      return containers
    }

    const containers: Array<ArchivesSpaceContainer> = []
    for (let instance of instances) {
      const top_container =
        await this.getTopContainer(instance.sub_container.top_container.ref) as ArchivesSpaceTopContainer

      containers.push({
        top_container: instance.sub_container.top_container || null,
        type_1: top_container.type || null,
        indicator_1: top_container.indicator || null,
        type_2: instance.sub_container.type_2 || null,
        indicator_2: instance.sub_container.indicator_2 || null,
        type_3: instance.sub_container.type_3 || null,
        indicator_3: instance.sub_container.indicator_3 || null
      })
    }
    return containers
  }

  private async _request(uri: string, params?: any): Promise<any> {
    const today = new Date();
    if (!this.token || this.token.expires <= today.getTime()) {
      try {
        await this._setSessionToken()
      } catch (err) {
        console.error(err)
        this.emitError(err)
        return Promise.reject(err)
      }
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
      .catch((err) => {
        console.error(err)
        const error = err.error.error || err.statusMessage || err
        this.emitError(new Error(`ArchivesSpace: ${error}`))
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
        const error = err.error.error || err
        return Promise.reject(new Error(`ArchivesSpace: ${error}`))
      })
  }

  private _idFromUri(uri: string): number {
    const match = uri.match(/\/(\d+)$/)
    return match ? Number(match[1]) : 0
  }
}