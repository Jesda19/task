/** @type {import('jest').Config} */
module.exports = {
  // Preset para TypeScript
  preset: 'ts-jest',

  // Entorno de testing
  testEnvironment: 'node',

  // Directorio raíz
  rootDir: './src',

  // Patrones de archivos de test
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
    '**/*.test.ts',
    '**/*.spec.ts'
  ],

  // Archivos a ignorar
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'clover'],

  // Archivos para coverage
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/__tests__/**',
    '!**/coverage/**',
    '!src/app.ts' // Archivo principal, difícil de testear
  ],

  // Threshold de coverage
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],

  // Module name mapping para imports absolutos
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^@routes/(.*)$': '<rootDir>/routes/$1'
  },

  // Transformaciones
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },

  // Variables de entorno para tests
  setupFiles: ['<rootDir>/__tests__/env.setup.ts'],

  // Timeouts
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks entre tests
  clearMocks: true,

  // Restore mocks después de cada test
  restoreMocks: true,

  // Error on deprecated features
  errorOnDeprecated: true,

  // Detectar tests abiertos
  detectOpenHandles: true,

  // Forzar salida después de tests
  forceExit: true,

  // Reporters adicionales
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Task Management API - Test Report'
      }
    ]
  ],

  // Configuración específica para ts-jest
  globals: {
    'ts-jest': {
      tsconfig: {
        compilerOptions: {
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020'],
          moduleResolution: 'node',
          declaration: false,
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true
        }
      }
    }
  }
};
