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
  readonly dispatcher: Dispatcher
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
    this.props.dispatcher.pushActivity({ key: 'aspace-tree', description: 'Loading Archival tree' })
    const tree = await this.props.archivesSpaceStore.buildResourceTree(uri) as ArchivesSpaceTree
    const treePositions = this.flattenTree(tree.children)
    this.props.dispatcher.clearActivity('aspace-tree')
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
          onRemoveItem={this.onRemoveItem}
          onRemove={this.removeArchivalObject}
          onAppendItems={this.appendArchivalObjectItem}
          onNoteClick={this.onNoteClick}
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
    this.props.dispatcher.addArchivalObject(ref, insertPosition)
  }

  private removeArchivalObject = (ref: string) => {
    this.props.dispatcher.removeArchivalObject(ref)
  }

  private appendArchivalObjectItem = (ref: string, title: string, num: number) => {
    const insertPosition = this.getPositionInTree(ref)
    this.props.dispatcher.addArchivalObjectItems(ref, title, insertPosition, num)
  }

  private onRemoveItem = (uuid: string) => {
    this.props.dispatcher.removeObject(uuid)
  }

  private onNoteClick = (uuid: string) => {
    this.props.dispatcher.showProjectNote()
    this.props.dispatcher.setObject(uuid)
  }

  private getPositionInTree(ref: string): number {
    const tree = this.state.tree
    const treePositions = this.state.treePositions
    if (!tree || !treePositions.length) {
      return -1
    }

    const positionItemIndex = treePositions.findIndex(t => t.ref === ref)
    const insertItem = treePositions.find((t, index) => index > positionItemIndex && t.objectIndex !== -1)
    if (insertItem) {
      return insertItem.objectIndex
    }

    let prevPositionIndex = -1
    let insertIndex = -1
    this.props.objects.every((item, index) => {
      const currentPositionIndex = treePositions.findIndex(t => t.ref === item.parent_uri)
      if (positionItemIndex < currentPositionIndex && currentPositionIndex > prevPositionIndex) {
        insertIndex = index
        return false
      }
      prevPositionIndex = currentPositionIndex
      return true
    })

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