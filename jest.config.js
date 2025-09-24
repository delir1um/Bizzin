/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@/(.*)$': '<rootDir>/client/src/$1'
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      isolatedModules: true
    }]
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'server/**/*.ts',
    'shared/**/*.ts',
    '!**/__tests__/**',
    '!**/node_modules/**'
  ]
};