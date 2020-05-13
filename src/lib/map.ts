export interface BcDamsMap {
  readonly label: string
  readonly namespace: string
  readonly name: string
  readonly definition: string
  readonly uri: string
  readonly source: string
  readonly crosswalk: BcDamsMapCrosswalk
  readonly range: ReadonlyArray<BcDamsMapRange>
  readonly obligation: BcDamsMapObligation
  readonly type: string
  readonly repeatable: boolean
  readonly input: BcDamsMapInput
  readonly visible: boolean
  readonly editable: boolean
}

export interface BcDamsMapCrosswalk {
  readonly avalon: BcDamsMapValue
}

export interface BcDamsMapValue {
  readonly label: string
  readonly type: string
}

export interface BcDamsMapRange {
  readonly label: string
  readonly values: ReadonlyArray<string>
  readonly uri: string
}

export enum BcDamsMapObligation {
  Required = 'required',
  Recommended = 'recommended',
  Optional = 'optional',
  stronglyRecommended = 'stronglyRecommended',
  requiredWhenAvailable = 'requiredWhenAvailable'

}

export enum BcDamsMapInput {
  Single = 'single',
  Multiple = 'multi'
}

export const defaultFieldDelemiter = '; '