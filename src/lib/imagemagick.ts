import { spawn, exec } from 'child-process-promise'

export const version = async () => {
  try {
    const { stdout } = await exec('magick -version')
    const match = stdout.match(/ImageMagick ([^\s]+)/)

    if (!match) {
      return false
    }
    else {
      return match[1]
    }
  } catch (err) {
    console.error(err)
    return false
  }
}

export const convert = async (
  src: string,
  dest: string,
  options: ReadonlyArray<string>
) => {

  const args = [src].concat(options).concat([dest])
  return spawn('magick', args, {
    capture: ['stdout', 'stderr']
  }).catch(e => { throw new Error(`${e.message}: ${e.stderr}`) })
}