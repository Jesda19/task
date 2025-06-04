import swaggerJSDoc from 'swagger-jsdoc';
import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Task Management API',
    version: '1.0.0',
    description: `
      API de gestión de tareas que integra servicios externos con Firebase.
      
      Esta API permite:
      - Gestionar tareas mediante operaciones CRUD
      - Sincronizar con servicios externos (JSONPlaceholder)
      - Persistir datos en Firebase Firestore
      - Evitar duplicados mediante merge inteligente
      
      **Características principales:**
      - Integración con servicio externo de tareas
      - Persistencia en Firebase Cloud Firestore
      - Documentación automática con OpenAPI 3.0
      - Soporte para contenedores Docker
      - Rate limiting y seguridad básica
    `,
    contact: {
      name: 'API Support',
      email: 'support@taskmanagement.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url:
        process.env.NODE_ENV === 'production'
          ? 'https://task-api.example.com/api'
          : 'http://localhost:3000/api',
      description:
        process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }
  ],
  tags: [
    {
      name: 'Tasks',
      description: 'Operaciones de gestión de tareas'
    },
    {
      name: 'Health',
      description: 'Endpoints de salud y monitoreo'
    }
  ],
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Mensaje de error'
          },
          details: {
            type: 'string',
            description: 'Detalles adicionales del error'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp del error'
          }
        },
        required: ['error']
      },
      HealthCheck: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'unhealthy'],
            description: 'Estado general del sistema'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp del check'
          },
          services: {
            type: 'object',
            properties: {
              external_api: {
                type: 'boolean',
                description: 'Estado del servicio externo'
              },
              firebase: {
                type: 'boolean',
                description: 'Estado de Firebase'
              }
            }
          },
          uptime: {
            type: 'number',
            description: 'Tiempo en funcionamiento en segundos'
          }
        }
      }
    },
    responses: {
      BadRequest: {
        description: 'Solicitud inválida',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Validation failed',
              details: 'Title is required',
              timestamp: '2024-12-01T10:30:00Z'
            }
          }
        }
      },
      NotFound: {
        description: 'Recurso no encontrado',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Task not found',
              details: 'No task found with ID: 123',
              timestamp: '2024-12-01T10:30:00Z'
            }
          }
        }
      },
      InternalServerError: {
        description: 'Error interno del servidor',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Internal server error',
              details: 'An unexpected error occurred',
              timestamp: '2024-12-01T10:30:00Z'
            }
          }
        }
      }
    }
  }
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/models/*.ts', './src/app.ts']
};

export const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Application): void => {
  // Configurar Swagger UI
  app.use(
    '/swagger-ui.html',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6 }
    `,
      customSiteTitle: 'Task Management API Documentation',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2
      }
    })
  );

  // Endpoint para obtener la especificación OpenAPI en JSON
  app.get('/api/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Endpoint alternativo para la documentación
  app.get('/docs', (req, res) => {
    res.redirect('/swagger-ui.html');
  });

  console.log('Swagger documentation available at:');
  console.log('- http://localhost:3000/swagger-ui.html');
  console.log('- http://localhost:3000/docs');
  console.log('- OpenAPI spec: http://localhost:3000/api/swagger.json');
};
