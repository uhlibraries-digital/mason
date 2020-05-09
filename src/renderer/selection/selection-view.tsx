import * as React from 'react';

import { Dispatcher } from '../../lib/dispatcher'
import { ArchivesSpaceStore } from '../../lib/stores'
import { ArchivesSpaceTree, ArchivesSpaceChild } from '../../lib/stores/archives-space-store'
import { TreeNode } from './tree-node'
import { IObject } from '../../lib/project';


interface TreePositionItem {
  readonly ref: string
  readonly uuid: string
  readonly objectIndex: number
}

interface ISelectionViewProps {
  readonly dispacher: Dispatcher
  readonly resourceUri: string
  readonly archivesSpaceStore: ArchivesSpaceStore
  readonly objects: ReadonlyArray<IObject>
}

interface ISelctionViewState {
  readonly tree: ArchivesSpaceTree | null
  readonly treePositions: ReadonlyArray<TreePositionItem>
}

export class SelectionView extends React.Component<ISelectionViewProps, ISelctionViewState> {

  constructor(props: ISelectionViewProps) {
    super(props)

    this.getResourceTree(this.props.resourceUri)
    this.state = {
      tree: null,
      treePositions: []
    }
  }

  public componentDidUpdate(prevProps: ISelectionViewProps, prevState: ISelctionViewState) {
    if (this.props.resourceUri !== prevProps.resourceUri) {
      this.getResourceTree(this.props.resourceUri)
    }
    if (this.props.objects.length !== prevProps.objects.length && this.state.tree) {
      const treePositions = this.flattenTree(this.state.tree.children)
      this.setState({ treePositions })
    }
  }

  private async getResourceTree(uri: string) {
    if (uri === '') {
      return
    }
    this.props.dispacher.pushActivity({ key: 'aspace-tree', description: 'Loading Archival tree' })
    const tree = await this.props.archivesSpaceStore.getResourceTree(uri) as ArchivesSpaceTree
    const treePositions = this.flattenTree(tree.children)
    this.props.dispacher.clearActivity('aspace-tree')
    this.setState({
      tree: tree,
      treePositions: treePositions
    })
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
    const treePositions = this.state.treePositions
    if (!tree || !treePositions.length) {
      return -1
    }

    const positionItemIndex = treePositions.findIndex(t => t.ref === ref)
    const insertItem = treePositions.find((t, index) => index > positionItemIndex && t.objectIndex !== -1)
    const insertIndex = insertItem ? insertItem.objectIndex : -1

    return insertIndex
  }

  private flattenTree(nodes: ReadonlyArray<ArchivesSpaceChild>): ReadonlyArray<TreePositionItem> {
    let list: Array<TreePositionItem> = []
    nodes.map((node) => {
      const objectIndex = this.props.objects.findIndex(o => o.uri === node.record_uri)
      list.push({
        ref: node.record_uri,
        objectIndex: objectIndex,
        uuid: ''
      })
      list = list.concat(this.flattenTree(node.children))
    })
    return list
  }


}