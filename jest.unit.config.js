module.exports = {
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testMatch: ['**/unit/**/*-test.ts{,x}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['<rootDir>/test/globals.ts'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/*.d.*',
    // ignore index files
    '!**/index.ts',
  ],
  reporters: ['default'],
  coverageReporters: ['text-summary', 'json', 'html', 'cobertura'],
  globals: {
    'ts-jest': {
      useBabelConfig: true,
    },
  },
}
