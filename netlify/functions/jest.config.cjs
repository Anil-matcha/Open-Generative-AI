module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverageFrom: [
    '*.ts',
    '!jest.config.js'
  ]
};