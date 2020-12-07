import {
  addToContainer,
  containerToPath,
  containerToString,
  IProject,
  nextItemNumberFromContainer,
  openProject
} from "../../src/lib/project"
import {
  getFixtureArchivalProjectPath,
  getFixtureStandardProjectPath
} from "../helpers/project"

describe('Container', () => {
  let standardProject: IProject
  let archivalProject: IProject

  beforeEach(async () => {
    const projectPath = getFixtureStandardProjectPath()
    const archivalPath = getFixtureArchivalProjectPath()

    standardProject = await openProject(projectPath) as IProject
    archivalProject = await openProject(archivalPath) as IProject
  })

  describe('standard project', () => {
    it('next item number', () => {
      const container = standardProject.objects[1].containers[0]
      const actual = nextItemNumberFromContainer(container)
      expect(actual).toBe(3)
    })

    it('returns container as string', () => {
      const container = standardProject.objects[0].containers[0]
      const actual = containerToString(container)
      expect(actual).toEqual('Item 1')
    })

    it('returns container filesystem path', () => {
      const container = standardProject.objects[0].containers[0]
      const actual = containerToPath(container)
      expect(actual).toEqual('Item_001/')
    })

    it('adds item to a container', () => {
      const container = standardProject.objects[0].containers[0]
      const actual = addToContainer(container, 'Item', '2')
      expect(actual).toEqual(
        expect.objectContaining({
          type_2: 'Item',
          indicator_2: '2'
        })
      )
    })

  })

  describe('archival project', () => {
    it('returns container as string', () => {
      const container = archivalProject.objects[0].containers[0]
      const actual = containerToString(container)
      expect(actual).toEqual('Box 1, Folder 1, Item 6')
    })

    it('returns container filesystem path', () => {
      const container = archivalProject.objects[0].containers[0]
      const actual = containerToPath(container)
      expect(actual).toEqual('Box_001/Folder_001/Item_006/')
    })

  })

})