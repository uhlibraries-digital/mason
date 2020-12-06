import { IVocabulary } from "../../src/lib/vocabulary"
import { InMemoryVocabularyStore } from "../helpers/in-memory-vocabulary"

describe('VocabularyStore', () => {
  let vocabularyStore: InMemoryVocabularyStore
  let vocabulary: ReadonlyArray<IVocabulary>

  beforeEach(async () => {
    vocabularyStore = new InMemoryVocabularyStore()
    await vocabularyStore.loadVocabulary()
    vocabulary = vocabularyStore.getVocabulary()
  })


  describe('parse vocabulary', () => {
    it('has correct number of terms', () => {
      expect(vocabulary).toHaveLength(14319)
    })

    it('contains term', () => {
      expect(vocabulary).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            prefLabel: 'Watkins, Sean'
          })
        ])
      )
    })
  })

  it('range not null', async () => {
    await vocabularyStore.loadVocabularyRange('agent')
    const range = vocabularyStore.getVocabularyRange('agent')
    expect(range).not.toBeNull()
  })

})