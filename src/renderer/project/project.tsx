import * as React from 'react'
import { Dispatcher } from '../../lib/dispatcher'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Button, ButtonGroup } from '../button'
import { IProject, ProjectType } from '../../lib/project'
import { Row } from '../layout'
import {
  TextBox,
  RadioBox,
  Select
} from '../form'
import { IRadioBoxItem } from '../form/radiobox'
import { ArchivesSpaceStore } from '../../lib/stores'
import {
  ArchivesSpaceRepository,
  ArchivesSpaceResource
} from '../../lib/stores/archives-space-store'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as Icons from "@fortawesome/free-solid-svg-icons"

interface IProjectProps {
  readonly dispatcher: Dispatcher
  readonly project: IProject
  readonly archivesSpaceStore: ArchivesSpaceStore

  readonly onDismissed: () => void
}

interface IProjectState {
  readonly title: string
  readonly type: ProjectType
  readonly resource: string
  readonly repositories: ReadonlyArray<ArchivesSpaceRepository> | null
  readonly selectedRepository: string
  readonly selectedCollection: string
  readonly collections: ReadonlyArray<ArchivesSpaceResource> | null
}

export class Project extends React.Component<
  IProjectProps,
  IProjectState
  > {

  private collectionsLoading: boolean = false

  public constructor(props: IProjectProps) {
    super(props)

    const title = this.props.project.collectionArkUrl || this.props.project.collectionTitle
    const resource = this.props.project.resource || ''
    const repository = resource !== '' ? resource.replace(/\/resources\/\d+/, '') : ''

    if (repository !== '') {
      this.setCollections(repository)
    }
    this.setRepositories()

    this.state = {
      title: title,
      type: this.props.project.type,
      resource: resource,
      repositories: null,
      selectedRepository: repository,
      selectedCollection: resource,
      collections: null
    }

  }

  private async setRepositories() {
    const repositories = await this.props.archivesSpaceStore.getRepositories()
    this.setState({ repositories: repositories })
  }

  private setCollections = async (uri: string) => {
    if (uri === '') {
      this.setState({ collections: null })
    }
    else {
      this.props.dispatcher.pushActivity({
        key: 'aspace-collections',
        description: 'Loading ArchivesSpace collections'
      })
      this.collectionsLoading = true

      const searchUri = `${uri}/search`
      const collections = await this.props.archivesSpaceStore.getResources(searchUri)
      const sortedCollections = collections.sort((a: ArchivesSpaceResource, b: ArchivesSpaceResource) => {
        return a.title.localeCompare(b.title)
      })
      this.props.dispatcher.clearActivity('aspace-collections')
      this.collectionsLoading = false
      this.setState({ collections: sortedCollections })
    }
  }

  private onSave = async () => {
    this.props.dispatcher.setProjectTitle(this.state.title)
    this.props.dispatcher.setProjectType(this.state.type)
    this.props.dispatcher.setProjectResource(this.state.resource)

    this.props.onDismissed()
  }

  private renderActiveButtons() {
    return (
      <ButtonGroup>
        <Button type="submit">Save</Button>
        <Button onClick={this.props.onDismissed}>Cancel</Button>
      </ButtonGroup>
    )
  }

  public render() {
    const types: ReadonlyArray<IRadioBoxItem> = [
      { title: 'Non-Archival Collection' },
      { title: 'Archival Collection ' }
    ]
    const selectedIndex = this.state.type === ProjectType.NonArchival ? 0 : 1

    return (
      <Dialog
        id="project-info"
        title="Project"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSave}
      >
        <DialogContent>
          <Row className="project-type-selection">
            <RadioBox
              items={types}
              selectedIndex={selectedIndex}
              onSelectionChange={this.onSelectedProjectChange}
            />
          </Row>
          {this.renderProjectTypeOptions()}
        </DialogContent>
        <DialogFooter>
          {this.renderActiveButtons()}
        </DialogFooter>
      </Dialog>
    )
  }

  private renderProjectTypeOptions() {
    switch (this.state.type) {
      case ProjectType.NonArchival:
        return (
          <Row>
            <TextBox
              label="Collection Title or ARK"
              value={this.state.title}
              onValueChanged={this.onTitleChanged}
              autoFocus={true}
            />
          </Row>
        )
      case ProjectType.Archival:
        return (
          <Row>
            {this.renderArchivesSpace()}
          </Row>
        )
    }

    return null
  }

  private renderArchivesSpaceRepositories() {
    const repos = this.state.repositories
    const repositoryOptions = repos ? repos.map((repo, index) => {
      return (
        <option
          key={index}
          value={repo.uri}
        >{repo.name}</option>
      )
    }) : null

    return (
      <Select
        label="Repository"
        onChange={this.onRepositoryChange}
        value={this.state.selectedRepository}
      >
        <option key="no-key" value=""></option>
        {repositoryOptions}
      </Select>
    )
  }

  private renderArchivesSpaceCollections() {
    if (this.collectionsLoading) {
      return (
        <div className="aspace-loading">
          <FontAwesomeIcon
            className="icon"
            icon={Icons.faSyncAlt}
            size="lg"
            spin={true}
          />
          <span>Loading collections...</span>
        </div>
      )
    }

    const collections = this.state.collections
    const collectionOptions = collections ? collections.map((collection, index) => {
      return (
        <option
          key={index}
          value={collection.uri}
        >{collection.title}</option>
      )
    }) : null

    return (
      <Select
        label="Collection"
        value={this.state.selectedCollection}
        onChange={this.onCollectionChange}
      >
        <option key="no-key" value=""></option>
        {collectionOptions}
      </Select>
    )
  }

  private renderArchivesSpace() {
    return (
      <div className="archivesspace-options">
        <Row>
          {this.renderArchivesSpaceRepositories()}
        </Row>
        <Row>
          {this.renderArchivesSpaceCollections()}
        </Row>
      </div>
    )
  }

  private onTitleChanged = (title: string) => {
    this.setState({ title: title })
  }

  private onSelectedProjectChange = (index: number) => {
    const type = index === 1 ? ProjectType.Archival : ProjectType.NonArchival
    this.setState({ type: type })
  }

  private onRepositoryChange = (event: React.FormEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value
    this.setState({ selectedRepository: value })
    this.setCollections(value)
  }

  private onCollectionChange = (event: React.FormEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value
    const collection = this.state.collections ?
      this.state.collections.find(coll => coll.uri === value)
      : null
    const title = collection ? collection.title : this.state.title

    this.setState({
      title: title,
      resource: value,
      selectedCollection: value
    })
  }


}