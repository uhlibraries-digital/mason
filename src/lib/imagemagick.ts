import { spawn, exec } from 'promisify-child-process'

export const version = async () => {
  try {
    const { stdout } = await exec('magick -version')

    if (!stdout) {
      return false
    }

    const match = stdout.toString().match(/ImageMagick ([^\s]+)/)

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
    encoding: 'utf8'
  }).catch(e => { throw new Error(`${e.message}: ${e.stderr}`) })
}