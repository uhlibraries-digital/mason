import {
  IProject,
  openProject
} from '../../src/lib/project'
import {
  ISearchResults,
  queryObjects
} from '../../src/lib/search'
import { getFixtureStandardProjectPath } from '../helpers/project'

describe('Search', () => {
  let standardProject: IProject

  describe('find term in objects', () => {
    beforeEach(async () => {
      const projectPath = getFixtureStandardProjectPath()
      standardProject = await openProject(projectPath) as IProject
    })

    it('not null', () => {
      const found: ISearchResults | null = queryObjects(standardProject.objects, 'item')
      expect(found).not.toBeNull()
    })

    it('returns total results', () => {
      const found: ISearchResults | null = queryObjects(standardProject.objects, 'item')
      expect(found?.total).toBe(4)
    })

  })
})