import * as Path from 'path'

export function getFixtureStandardProjectPath(): string {
  const path = Path.join(
    __dirname,
    '..',
    'fixtures',
    'standard-project',
    'my-project',
    'my-project.carp'
  )

  return path
}

export function getFixtureArchivalProjectPath(): string {
  const path = Path.join(
    __dirname,
    '..',
    'fixtures',
    'archival-project',
    'my-project',
    'my-project.carp'
  )

  return path
}