import { deepCopy } from "../../src/lib/copy"

describe('object copy', () => {

  it('deep copies an object', () => {
    const original = { name: 'somename', files: [{ filename: 'somefilename' }] }
    const newFilename = 'newfilename'

    const copy = deepCopy(original)
    copy.files[0].filename = newFilename

    expect(original.files[0].filename).not.toEqual(newFilename)

  })
})