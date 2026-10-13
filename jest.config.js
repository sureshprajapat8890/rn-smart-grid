/** @type {import('jest').Config} */
module.exports = {
  preset: '@react-native/jest-preset',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  testTimeout: 20000,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
