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