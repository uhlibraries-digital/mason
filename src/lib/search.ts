import { IObject } from "./project";

export function queryObjects(objs: ReadonlyArray<IObject>, query: string): ReadonlyArray<string> {
  return objs.filter((obj) => {
    return hasQuery(obj, query)
  }).map((obj) => {
    return obj.uuid
  })
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