module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testMatch: ['<rootDir>/packages/**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverageFrom: ['packages/**/*.ts', '!packages/**/__tests__/**/*.ts'],
  moduleNameMapper: {
    '^@alliage/webserver/(.*)$': '<rootDir>/packages/webserver/$1',
    '^@alliage/webserver-express/(.*)$': '<rootDir>/packages/webserver-express/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
};
