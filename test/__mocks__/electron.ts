export const shell = {
  moveItemToTrash: jest.fn(),
}

export const remote = {
  app: {
    on: jest.fn(),
    getPath: jest.fn()
  },
  nativeTheme: {
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
    shouldUseDarkColors: jest.fn().mockImplementation(() => true),
  },
}

export const ipcRenderer = {
  on: jest.fn(),
  send: jest.fn(),
}
