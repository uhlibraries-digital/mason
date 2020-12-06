import { electronStore } from '../../src/lib/stores/electron-store'

describe('local storage', () => {
  const stringKey = 'some-string-key'

  beforeEach(() => {
    electronStore.delete(stringKey)
  })

  it('round trips a string value', () => {
    const expected = 'this string should be there'

    electronStore.set(stringKey, expected)
    expect(electronStore.get(stringKey)).toEqual(expected)
  })

  it('returns default string', () => {
    const defaultValue = 'this is a default string'
    const actual = electronStore.get(stringKey, defaultValue)

    expect(actual).toEqual(defaultValue)
  })
})