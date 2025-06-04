/**
 * Jest setup file
 * Configuración global para todos los tests
 */

import dotenv from 'dotenv';

// Cargar variables de entorno para testing
dotenv.config({ path: '.env.test' });

// Configurar timeout global para tests asincrónicos
jest.setTimeout(10000);

// Mock console methods en tests para reducir noise
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
  // Solo mostrar errores reales, no warnings de Firebase en tests
  console.error = jest.fn((message: string) => {
    if (message.includes('Firebase') || message.includes('Firestore')) {
      return; // Suprimir warnings de Firebase en tests
    }
    originalError(message);
  });

  console.warn = jest.fn((message: string) => {
    if (message.includes('Firebase') || message.includes('not available')) {
      return; // Suprimir warnings de servicios no disponibles
    }
    originalWarn(message);
  });

  // Mantener logs importantes
  console.log = jest.fn((message: string) => {
    if (process.env.JEST_VERBOSE === 'true') {
      originalLog(message);
    }
  });
});

afterAll(() => {
  // Restaurar console methods
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});

// Helper para limpiar mocks entre tests
afterEach(() => {
  jest.clearAllMocks();
});

// Mock global para fetch (si se necesita)
global.fetch = jest.fn();

// Definir tipos globales para testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidTask(): R;
      toHaveValidTaskStructure(): R;
    }
  }
}

// Custom matchers para Task objects
expect.extend({
  toBeValidTask(received: any) {
    const pass =
      typeof received === 'object' &&
      received !== null &&
      typeof received.id === 'string' &&
      typeof received.title === 'string' &&
      typeof received.completed === 'boolean';

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid task`,
        pass: true
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be a valid task with id, title, and completed properties`,
        pass: false
      };
    }
  },

  toHaveValidTaskStructure(received: any) {
    const requiredFields = ['id', 'title', 'completed'];
    const hasAllFields = requiredFields.every(field => received.hasOwnProperty(field));

    if (hasAllFields) {
      return {
        message: () => `expected ${received} not to have valid task structure`,
        pass: true
      };
    } else {
      const missingFields = requiredFields.filter(field => !received.hasOwnProperty(field));
      return {
        message: () =>
          `expected ${received} to have all required fields. Missing: ${missingFields.join(', ')}`,
        pass: false
      };
    }
  }
});

// Helper functions para tests
export const createMockTask = (overrides: any = {}) => ({
  id: '1',
  title: 'Test Task',
  completed: false,
  userId: '1',
  description: 'Test Description',
  createdAt: new Date(),
  updatedAt: new Date(),
  source: 'external' as const,
  ...overrides
});

export const createMockCreateTaskRequest = (overrides: any = {}) => ({
  title: 'New Test Task',
  completed: false,
  description: 'New test description',
  userId: '1',
  ...overrides
});

export const createMockUpdateTaskRequest = (overrides: any = {}) => ({
  title: 'Updated Task',
  completed: true,
  description: 'Updated description',
  ...overrides
});

// Mock para external API responses
export const createMockExternalTodoResponse = (overrides: any = {}) => ({
  id: 1,
  title: 'External Task',
  completed: false,
  userId: 1,
  ...overrides
});

// Utility para esperar promesas
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para testing de errores async
export const expectToThrow = async (fn: () => Promise<any>, expectedError?: string) => {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    if (expectedError && error instanceof Error) {
      expect(error.message).toContain(expectedError);
    }
    return error;
  }
};

// Mock para Firebase
export const mockFirebaseService = {
  isAvailable: jest.fn(() => false),
  getAllTasks: jest.fn(() => Promise.resolve([])),
  getTaskById: jest.fn(() => Promise.resolve(null)),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  getTasksByUserId: jest.fn(() => Promise.resolve([])),
  findTaskByExternalId: jest.fn(() => Promise.resolve(null)),
  saveExternalTaskReference: jest.fn(),
  healthCheck: jest.fn(() => Promise.resolve(false)),
  clearTestTasks: jest.fn()
};

// Mock para TodoClient
export const mockTodoClient = {
  getAllTasks: jest.fn(() => Promise.resolve([])),
  getTaskById: jest.fn(() => Promise.resolve(null)),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  getTasksByUserId: jest.fn(() => Promise.resolve([])),
  healthCheck: jest.fn(() => Promise.resolve(true))
};

// Console spy helpers
export const spyOnConsole = () => ({
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  log: jest.spyOn(console, 'log').mockImplementation(() => {})
});

export const restoreConsole = (spies: any) => {
  Object.values(spies).forEach((spy: any) => spy.mockRestore());
};
