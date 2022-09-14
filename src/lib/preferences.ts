import { electronStore } from './stores'

export enum PreferencesTab {
  ArchivesSpace = 0,
  Map = 1,
  Minter = 2,
  Vocabulary = 3,
  Appearance = 4
}

const pageSizeKey = 'objectPageSize'
const defaultPageSize: number = 600

export function getObjectPageSize(): number {
  return Number(electronStore.get(pageSizeKey)) || defaultPageSize
}

export function setObjectPageSize(size: number) {
  electronStore.set(pageSizeKey, size)
}