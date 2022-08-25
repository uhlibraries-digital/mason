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

  let total = 0
  const results = objs.filter((obj) => {
    const found = hasQuery(obj, query)
    total += found
    return found > 0
  }).map((obj) => {
    return obj.uuid
  })

  return {
    total: total,
    objects: results,
    query: query
  }
}

function hasQuery(obj: IObject, query: string): number {
  const metadata = obj.metadata
  let total = 0

  for (const key of Object.keys(metadata)) {
    const value = String(metadata[key]).toLowerCase()
    if (value.indexOf(query.toLowerCase()) > -1) {
      total++
    }
  }

  return total
}