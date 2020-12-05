import { IObject, FilePurpose } from "./project";
import { IProgress } from "./app-state";
import rp from 'request-promise'

export interface IErc {
  readonly who?: string
  readonly what?: string
  readonly when?: string
  readonly where?: string
}

export enum ArkType {
  Access,
  Preservation
}

export class Minter {


  public constructor(
    private endpoint: string,
    private apiKey: string,
    private prefix: string,
    private type: ArkType,
    private ercDefault?: IErc | undefined
  ) { }

  public async mint(
    objects: ReadonlyArray<IObject>,
    progressCallback: (progress: IProgress) => void
  ): Promise<ReadonlyArray<IObject>> {

    if (this.endpoint === '') {
      return Promise.reject(new Error('No endpoint set for minter. Please check preferences and try again.'))
    }

    const newObjects = Array.from(objects)

    progressCallback({ value: undefined, description: 'Getting things together' })

    let count = 0
    let mintedCount = 0
    let skippedCount = 0
    for (let index in newObjects) {
      const item = newObjects[index]
      progressCallback({
        value: (count++) / objects.length,
        description: `Minting '${item.title}'`
      })
      if (!this.hasArk(item) && this.hasFiles(item)) {
        const newItem = await this._process(item)
        newObjects[index] = newItem
        mintedCount++
      }
      else {
        skippedCount++
      }
    }

    progressCallback({
      value: 1,
      description: `Minted ${mintedCount} ARKs ${skippedCount ? `and skipped ${skippedCount}` : ''}`
    })

    return Promise.resolve(newObjects)
  }

  private async _process(item: IObject) {
    const ark = await this._mintArk(item)
    const metadata = item.metadata

    if (this.type === ArkType.Access) {
      metadata['edm.isShownAt'] = item.do_ark = ark
    }
    else if (this.type === ArkType.Preservation) {
      metadata['dcterms.source'] = item.pm_ark = ark
    }
    item.metadata = metadata

    return item
  }

  private async _mintArk(item: IObject): Promise<any> {
    const erc = this.getErc(item)

    const options = {
      method: 'post',
      uri: `${this.endpoint}/arks/mint/${this.prefix}`,
      headers: {
        'api-key': this.apiKey
      },
      body: {
        ...erc
      },
      simple: false,
      json: true,
      resolveWithFullResponse: true
    }

    return rp(options)
      .then((response) => {
        if (response.statusCode !== 200) {
          console.error(response)
          return Promise.reject(new Error(response.statusCode + ': ' + response.error.error))
        }
        return response.body.id
      })
  }

  private hasArk(item: IObject): boolean {
    if (
      this.type === ArkType.Access &&
      (item.do_ark !== '' && item.do_ark !== undefined)
    ) {
      return true
    }
    if (
      this.type === ArkType.Preservation &&
      (item.pm_ark !== '' && item.pm_ark !== undefined)
    ) {
      return true
    }
    return false
  }

  private getErc(item: IObject): IErc {
    const metadata = item.metadata

    if (this.type === ArkType.Preservation) {
      return {
        ...this.ercDefault,
        what: metadata['dcterms.title']
      }
    }
    return {
      who: metadata['dcterms.creator'] || 'unknown',
      what: metadata['dcterms.title'],
      when: metadata['dc.date'] || 'unknown'
    }
  }

  private hasFiles(item: IObject): boolean {
    if (this.type === ArkType.Access) {
      const files = item.files.filter(file => file.purpose === FilePurpose.Access).length
      return files > 0
    }
    if (this.type === ArkType.Preservation) {
      const files = item.files.filter(file => file.purpose === FilePurpose.Preservation).length
      return files > 0
    }
    return true
  }



}