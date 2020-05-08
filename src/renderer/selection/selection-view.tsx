import * as React from 'react';

import { Dispatcher } from '../../lib/dispatcher'
import { ArchivesSpaceStore } from '../../lib/stores'
import { ArchivesSpaceTree, ArchivesSpaceChild } from '../../lib/stores/archives-space-store'
import { TreeNode } from './tree-node'
import { IObject } from '../../lib/project';

interface ISelectionViewProps {
  readonly dispacher: Dispatcher
  readonly resourceUri: string
  readonly archivesSpaceStore: ArchivesSpaceStore
  readonly objects: ReadonlyArray<IObject>
}

interface ISelctionViewState {
  readonly tree: ArchivesSpaceTree | null
}

export class SelectionView extends React.Component<ISelectionViewProps, ISelctionViewState> {

  constructor(props: ISelectionViewProps) {
    super(props)

    this.getResourceTree(this.props.resourceUri)
    this.state = {
      tree: null
    }
  }

  public UNSAFE_componentWillReceiveProps(nextProps: ISelectionViewProps) {
    if (this.props.resourceUri !== nextProps.resourceUri) {
      this.getResourceTree(nextProps.resourceUri)
    }
  }

  private async getResourceTree(uri: string) {
    if (uri === '') {
      return
    }
    this.props.dispacher.pushActivity({ key: 'aspace-tree', description: 'Loading Archival tree' })
    const tree = await this.props.archivesSpaceStore.getResourceTree(uri) as ArchivesSpaceTree
    this.props.dispacher.clearActivity('aspace-tree')
    this.setState({ tree })
  }

  public render() {
    const tree = this.state.tree
    if (!tree) {
      return null
    }

    const treeNodes = tree.children.map((node, index) => {
      return (
        <TreeNode
          key={index}
          child={node}
          depth={1}
          objects={this.props.objects}
          archivesSpaceStore={this.props.archivesSpaceStore}
          onSelect={this.addArchivalObject}
          onRemove={this.removeArchivalObject}
        />
      )
    })

    return (
      <div className="selection-tree">
        <div className="title">{tree.title}</div>
        <div className="tree-nodes-content scrollbar">
          <ul className="root-node">
            {treeNodes}
          </ul>
        </div>
      </div>
    )
  }

  private addArchivalObject = (ref: string) => {
    const insertPosition = this.getPositionInTree(ref)
    this.props.dispacher.addArchivalObject(ref, insertPosition)
  }

  private removeArchivalObject = (ref: string) => {
    this.props.dispacher.removeArchivalObject(ref)
  }

  private getPositionInTree(ref: string): number {
    const tree = this.state.tree
    if (!tree) {
      return -1
    }

    const nodeList = this.flatenTree(tree.children)
    return nodeList.findIndex(uri => uri === ref)
  }

  private flatenTree(nodes: ReadonlyArray<ArchivesSpaceChild>): ReadonlyArray<string> {
    let list: Array<string> = []
    nodes.map((node) => {
      list.push(node.record_uri)
      list = list.concat(this.flatenTree(node.children))
    })
    return list
  }


}