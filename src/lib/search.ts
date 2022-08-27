import { IObject } from "./project";

export interface ISearchResults {
  total: number
  objects: ReadonlyArray<string>
  query: string
}

export function queryObjects(objs: ReadonlyArray<IObject>, query: string): ISearchResults | null {
  if (query === '') {
    return null
  }

  const results = objs.filter((obj) => {
    return hasQuery(obj, query)
  }).map((obj) => {
    return obj.uuid
  })

  return {
    total: results.length,
    objects: results,
    query: query
  }
}

function hasQuery(obj: IObject, query: string): boolean {
  const metadata = obj.metadata

  for (const key of Object.keys(metadata)) {
    const value = String(metadata[key]).toLowerCase()
    if (value.indexOf(query.toLowerCase()) > -1) {
      return true
    }
  }

  return false
}