import { EdtfHumanizer } from "../../src/lib/edtf-humanizer"

describe('edtf humanizer', () => {

  it('returns unknown', () => {
    const humanizer = new EdtfHumanizer('')
    expect(humanizer.humanize()).toEqual('unknown')
  })

  it('returns approximate date', () => {
    const humanizer = new EdtfHumanizer('~2020')
    expect(humanizer.humanize()).toEqual('approximately 2020')
  })

  it('returns month day, year', () => {
    const humanizer = new EdtfHumanizer('2020-01-10')
    expect(humanizer.humanize()).toEqual('January 10, 2020')
  })

  describe('set dates', () => {
    it('returns exclusive set', () => {
      const humanizer = new EdtfHumanizer('[2020-04, 2020-05]')
      expect(humanizer.humanize()).toEqual('April 2020 or May 2020')
    })

    it('returns inclusive set', () => {
      const humanizer = new EdtfHumanizer('{2020-04, 2020-05}')
      expect(humanizer.humanize()).toEqual('April 2020 and May 2020')
    })

    it('returns open before exclusive set', () => {
      const humanizer = new EdtfHumanizer('[..2020]')
      expect(humanizer.humanize()).toEqual('Before 2020')
    })

    it('returns open after exclusive set', () => {
      const humanizer = new EdtfHumanizer('[2020..]')
      expect(humanizer.humanize()).toEqual('2020 and later')
    })
  })

  it('returns uncertain date', () => {
    const humanizer = new EdtfHumanizer('2020?')
    expect(humanizer.humanize()).toEqual('2020?')
  })

  it('returns seasonal', () => {
    const humanizer = new EdtfHumanizer('2020-22')
    expect(humanizer.humanize()).toEqual('Summer 2020')
  })

  it('returns interval month year', () => {
    const humanizer = new EdtfHumanizer('2020-04/2020-05')
    expect(humanizer.humanize()).toEqual('April 2020-May 2020')
  })

  it('returns decade', () => {
    const humanizer = new EdtfHumanizer('202X')
    expect(humanizer.humanize()).toEqual('2020s')
  })

})