import { IObject } from './project'
import { IProgress } from './app-state'

export const convert = async (
  projectFilePath: string,
  objects: ReadonlyArray<IObject>,
  profile: string,
  quality: number,
  resize: number | boolean,
  resample: number | boolean,
  tileSize: string,
  processCallback: (progress: IProgress) => void
) => {

}

export const convertImage = async (
  src: string,
  dest: string,
  options: ReadonlyArray<string>
) => {

}