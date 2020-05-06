export interface IMenuItem {
  readonly label?: string
  readonly action?: () => void
  readonly type?: 'separator'
  readonly enabled?: boolean
  readonly role?: string
}