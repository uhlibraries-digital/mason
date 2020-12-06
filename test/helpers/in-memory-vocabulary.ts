import * as Path from 'path'
import { readFile } from 'fs'
import { VocabularyStore } from '../../src/lib/stores'
import { IVocabulary } from '../../src/lib/vocabulary'

export class InMemoryVocabularyStore extends VocabularyStore {
  private vocabulary: ReadonlyArray<IVocabulary> = []

  public async loadVocabulary(): Promise<void> {
    const vocabularyFixturePath = Path.join(
      __dirname,
      '..',
      'fixtures',
      'vocabulary.ttl'
    )

    return new Promise((resolve, reject) => {
      readFile(vocabularyFixturePath, 'utf8', (err, data) => {
        if (err) {
          return reject()
        }

        this.vocabulary = this.parse(data)

        return resolve()
      })
    })
  }

  public getVocabulary(): ReadonlyArray<IVocabulary> {
    return this.vocabulary
  }

}