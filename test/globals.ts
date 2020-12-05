// These constants are defined by Webpack at build time, but since tests aren't
// built with Webpack we need to make sure these exist at runtime.
const g: any = global
g['__WIN32__'] = process.platform === 'win32'
g['__DARWIN__'] = process.platform === 'darwin'
g['__LINUX__'] = process.platform === 'linux'
g['__DEV__'] = 'false'