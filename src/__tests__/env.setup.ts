/**
 * Environment setup for tests
 * Configura variables de entorno específicas para testing
 */

// Configurar NODE_ENV para tests
process.env.NODE_ENV = 'test';

// Puerto para tests (diferente al de desarrollo)
process.env.PORT = '3001';

// Configuración de Firebase para tests (mock)
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_PRIVATE_KEY = 'mock-private-key';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
process.env.FIREBASE_CLIENT_ID = 'mock-client-id';

// Configuración de rate limiting más permisiva para tests
process.env.RATE_LIMIT_WINDOW = '900000'; // 15 minutos
process.env.RATE_LIMIT_MAX = '1000'; // 1000 requests

// Log level para tests
process.env.LOG_LEVEL = 'error'; // Solo mostrar errores en tests

// External API configuration para tests
process.env.EXTERNAL_API_URL = 'https://jsonplaceholder.typicode.com';
process.env.EXTERNAL_API_TIMEOUT = '5000';

// CORS para tests
process.env.ALLOWED_ORIGINS = 'http://localhost:3001,http://localhost:3000';

// Configuraciones específicas para Jest
process.env.JEST_VERBOSE = 'false'; // Cambiar a 'true' para más detalle

// Timezone para consistencia en tests
process.env.TZ = 'UTC';
