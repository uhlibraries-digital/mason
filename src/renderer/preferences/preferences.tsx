import * as React from 'react'
import { Dispatcher } from '../../lib/dispatcher'
import { Dialog, DialogFooter } from '../dialog'
import { Button, ButtonGroup } from '../button'
import { IPreferences } from '../../lib/app-state'
import { PreferencesTab } from '../../lib/preferences'
import { TabBar } from '../tab-bar'
import { ArchivesSpace } from './archivesspace'
import { Map } from './map'
import { Minter } from './minter'
import { Vocabulary } from './vocabulary'
import { TokenStore } from '../../lib/stores/token-store'
import { Appearance } from './appearance'
import { Theme } from '../../lib/theme'

interface IPreferencesProps {
  readonly dispatcher: Dispatcher
  readonly preferences: IPreferences
  readonly selectedTheme: Theme
  readonly onDismissed: () => void
}

interface IPreferencesState {
  readonly selectedIndex: PreferencesTab
  readonly aspacePublicUrl: string
  readonly aspaceEndpoint: string
  readonly aspaceUsername: string
  readonly aspacePassword: string
  readonly mapPreservationUrl: string
  readonly mapAccessUrl: string
  readonly minterEndpoint: string
  readonly minterPreservationPrefix: string
  readonly minterAccessPrefix: string
  readonly minterApiKey: string
  readonly minterErcWho: string
  readonly vocabularyUrl: string
  readonly selectedTheme: Theme
}

export class Preferences extends React.Component<
  IPreferencesProps,
  IPreferencesState
  > {

  public constructor(props: IPreferencesProps) {
    super(props)

    this.state = {
      selectedIndex: PreferencesTab.ArchivesSpace,
      aspacePublicUrl: this.props.preferences.aspace.publicUrl,
      aspaceEndpoint: this.props.preferences.aspace.apiEndpoint,
      aspaceUsername: this.props.preferences.aspace.username,
      aspacePassword: '',
      mapPreservationUrl: this.props.preferences.map.preservationUrl,
      mapAccessUrl: this.props.preferences.map.accessUrl,
      minterEndpoint: this.props.preferences.minter.endpoint,
      minterPreservationPrefix: this.props.preferences.minter.preservationPrefix,
      minterAccessPrefix: this.props.preferences.minter.accessPrefix,
      minterApiKey: this.props.preferences.minter.apiKey,
      minterErcWho: this.props.preferences.minter.ercWho,
      vocabularyUrl: this.props.preferences.vocabulary.url,
      selectedTheme: this.props.selectedTheme
    }

    this.getArchivesSpacePassword(this.props.preferences.aspace.username)
  }

  private onSave = async () => {
    this.props.dispatcher.setPreferencesArchivesSpace(
      this.state.aspacePublicUrl,
      this.state.aspaceEndpoint,
      this.state.aspaceUsername,
      this.state.aspacePassword
    )

    this.props.dispatcher.setPreferencesMap(
      this.state.mapPreservationUrl,
      this.state.mapAccessUrl
    )

    this.props.dispatcher.setPreferencesMinter(
      this.state.minterEndpoint,
      this.state.minterPreservationPrefix,
      this.state.minterAccessPrefix,
      this.state.minterApiKey,
      this.state.minterErcWho
    )

    this.props.dispatcher.setPreferencesVocabulary(
      this.state.vocabularyUrl
    )

    this.props.dispatcher.setTheme(
      this.state.selectedTheme
    )

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

  private onTabClicked = (index: number) => {
    this.setState({ selectedIndex: index })
  }

  private renderActiveTab() {
    const index = this.state.selectedIndex
    switch (index) {
      case PreferencesTab.ArchivesSpace:
        return (
          <ArchivesSpace
            publicUrl={this.state.aspacePublicUrl}
            endpoint={this.state.aspaceEndpoint}
            username={this.state.aspaceUsername}
            password={this.state.aspacePassword}

            onPublicUrlChanged={this.onPublicUrlChanged}
            onEndpointChanged={this.onASpaceEndpointChanged}
            onUsernameChanged={this.onUsernameChanged}
            onPasswordChanged={this.onPasswordChanged}
          />
        )
      case PreferencesTab.Map:
        return (
          <Map
            preservationUrl={this.state.mapPreservationUrl}
            accessUrl={this.state.mapAccessUrl}
            onPreservationUrlChanged={this.onPreservationUrlChanged}
            onAccessUrlChanged={this.onAccessUrlChanged}
          />
        )
      case PreferencesTab.Minter:
        return (
          <Minter
            endpoint={this.state.minterEndpoint}
            preservationPrefix={this.state.minterPreservationPrefix}
            accessPrefix={this.state.minterAccessPrefix}
            apiKey={this.state.minterApiKey}
            ercWho={this.state.minterErcWho}

            onEndpointChanged={this.onMinterEndpointChanged}
            onPreservationPrefixChanged={this.onMinterPreservationPrefixChanged}
            onAccessPrefixChanged={this.onMinterAccessPrefixChanged}
            onApiKeyChanged={this.onMinterApiKeyChanged}
            onErcWhoChanged={this.onMinterErcWhoChanged}
          />
        )
      case PreferencesTab.Vocabulary:
        return (
          <Vocabulary
            vocabularyUrl={this.state.vocabularyUrl}
            onVocabularyUrlChange={this.onVocabularyUrlChange}
          />
        )
      case PreferencesTab.Appearance:
        return (
          <Appearance
            selectedTheme={this.state.selectedTheme}
            onSelectedThemeChange={this.onSelectedThemeChange}
          />
        )
    }

    return null
  }


  public render() {
    return (
      <Dialog
        id="preferences"
        title="Preferences"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSave}
      >
        <TabBar
          onTabClicked={this.onTabClicked}
          selectedIndex={this.state.selectedIndex}
        >
          <span>ArchivesSpace</span>
          <span>MAP</span>
          <span>Minter</span>
          <span>Vocabulary</span>
          <span>Appearance</span>
        </TabBar>
        {this.renderActiveTab()}
        <DialogFooter>
          {this.renderActiveButtons()}
        </DialogFooter>
      </Dialog>
    )
  }

  private onPublicUrlChanged = (url: string) => {
    this.setState({ aspacePublicUrl: url })
  }

  private onASpaceEndpointChanged = (endpoint: string) => {
    this.setState({ aspaceEndpoint: endpoint })
  }

  private onUsernameChanged = (username: string) => {
    this.setState({ aspaceUsername: username })
  }

  private onPasswordChanged = (password: string) => {
    this.setState({ aspacePassword: password })
  }

  private onPreservationUrlChanged = (url: string) => {
    this.setState({ mapPreservationUrl: url })
  }

  private onAccessUrlChanged = (url: string) => {
    this.setState({ mapAccessUrl: url })
  }

  private onMinterEndpointChanged = (endpoint: string) => {
    this.setState({ minterEndpoint: endpoint })
  }

  private onMinterPreservationPrefixChanged = (prefix: string) => {
    this.setState({ minterPreservationPrefix: prefix })
  }

  private onMinterAccessPrefixChanged = (prefix: string) => {
    this.setState({ minterAccessPrefix: prefix })
  }

  private onMinterApiKeyChanged = (key: string) => {
    this.setState({ minterApiKey: key })
  }

  private onMinterErcWhoChanged = (who: string) => {
    this.setState({ minterErcWho: who })
  }

  private async getArchivesSpacePassword(username: string): Promise<any> {
    try {
      const password = await TokenStore.getItem('mason/archivesspace', username) || ''
      this.setState({ aspacePassword: String(password) })
    }
    catch (e) { }
  }

  private onVocabularyUrlChange = (url: string) => {
    this.setState({ vocabularyUrl: url })
  }

  private onSelectedThemeChange = (theme: Theme) => {
    this.setState({ selectedTheme: theme })
  }

}