module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@maplibre/.*|@gorhom/.*|@tanstack/.*)',
  ],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
}
