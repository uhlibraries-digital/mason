import { encodePathAsUrl, normalize } from "../../src/lib/path"

describe('path', () => {

  describe('encodePathAsUrl', () => {
    if (__WIN32__) {
      it('normalizes path separators on Windows', () => {
        const dirName = 'C:/Users/watkins\\AppData\\Local\\Mason\\resources\\app'
        const uri = encodePathAsUrl(dirName, 'folder/file.html')
        expect(uri).toStartWith('file:///C:/Users/watkins/AppData/Local/')
      })

      it('encodes spaces and hashes', () => {
        const dirName = 'C:/Users/S Watkins\\AppData\\Local\\Mason\\resources\\app'
        const uri = encodePathAsUrl(dirName, 'index.html')
        expect(uri).toStartWith('file:///C:/Users/S%20Watkins/')
      })
    }

    if (__DARWIN__ || __LINUX__) {
      it('encodes spaces and hashes', () => {
        const dirName = '/Users/S Watkins\\AppData\\Local\\Mason\\resources\\app'
        const uri = encodePathAsUrl(dirName, 'index.html')
        expect(uri).toStartWith('file:///Users/S%20Watkins/')
      })
    }
  })

  describe('normilize', () => {
    if (__WIN32__) {
      it('normalizes path separators', () => {
        const dirName = 'C:/Users/watkins//AppData\\Local\\Mason\\resources\\app'
        const path = normalize(dirName)
        expect(path).toStartWith('C:/Users/watkins/AppData/Local')
      })
    }

    if (__DARWIN__ || __LINUX__) {
      it('normalizes path separators', () => {
        const dirName = '/Users/watkins//AppData\\Local\\Mason\\resources\\app'
        const path = normalize(dirName)
        expect(path).toStartWith('/Users/watkins/AppData/Local')
      })
    }
  })
})