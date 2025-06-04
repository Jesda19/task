import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Importar configuraciones y servicios
import { setupSwagger } from './config/swagger';
import { firebaseConfig } from './config/firebase';
import { TodoClient } from './services/TodoClient';
import { FirebaseService } from './services/FirebaseService';

// Importar rutas
import tasksRouter from './routes/tasks';

// Cargar variables de entorno
dotenv.config();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Verificación de salud del sistema
 *     description: Endpoint para verificar el estado de la aplicación y sus dependencias
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Sistema funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: Uno o más servicios no están disponibles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */

class TaskManagementApp {
  private app: Application;
  private port: number;
  private startTime: Date;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.startTime = new Date();

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSwagger();
  }

  private initializeMiddlewares(): void {
    // Seguridad básica con Helmet
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
            fontSrc: ["'self'", 'fonts.gstatic.com'],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'validator.swagger.io']
          }
        }
      })
    );

    // CORS
    this.app.use(
      cors({
        origin:
          process.env.NODE_ENV === 'production'
            ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
            : true,
        credentials: true
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // límite de requests
      message: {
        error: 'Too many requests',
        details: 'Please try again later',
        timestamp: new Date().toISOString()
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    this.app.use('/api/', limiter);

    // Parsing de JSON
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
      });

      next();
    });
  }

  private initializeRoutes(): void {
    // Ruta de bienvenida
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'Task Management API',
        version: '1.0.0',
        documentation: '/swagger-ui.html',
        health: '/api/health',
        endpoints: {
          tasks: '/api/tasks',
          swagger: '/api/swagger.json'
        }
      });
    });

    // Health check endpoint
    this.app.get('/api/health', async (req: Request, res: Response) => {
      try {
        const todoClient = new TodoClient();
        const firebaseService = FirebaseService.getInstance();

        // Verificar servicios
        const [externalApiHealth, firebaseHealth] = await Promise.allSettled([
          todoClient.healthCheck(),
          firebaseService.healthCheck()
        ]);

        const externalApiStatus =
          externalApiHealth.status === 'fulfilled' && externalApiHealth.value;
        const firebaseStatus = firebaseHealth.status === 'fulfilled' && firebaseHealth.value;

        const allHealthy = externalApiStatus && firebaseStatus;
        const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);

        const healthData = {
          status: allHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          services: {
            external_api: externalApiStatus,
            firebase: firebaseStatus
          },
          uptime,
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        };

        res.status(allHealthy ? 200 : 503).json(healthData);
      } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Health check failed',
          uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000)
        });
      }
    });

    // Rutas de la API
    this.app.use('/api/tasks', tasksRouter);

    // Ruta 404 para API
    this.app.use('/api/*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Endpoint not found',
        details: `The endpoint ${req.method} ${req.path} does not exist`,
        timestamp: new Date().toISOString(),
        available_endpoints: [
          'GET /api/health',
          'GET /api/tasks',
          'POST /api/tasks',
          'GET /api/tasks/:id',
          'PUT /api/tasks/:id',
          'DELETE /api/tasks/:id'
        ]
      });
    });
  }

  private initializeErrorHandling(): void {
    // Error handler global
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', error);

      // No enviar stack trace en producción
      const isDevelopment = process.env.NODE_ENV === 'development';

      res.status(500).json({
        error: 'Internal server error',
        details: isDevelopment ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        ...(isDevelopment && { stack: error.stack })
      });
    });

    // 404 handler para rutas no encontradas
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Route not found',
        details: `Cannot ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString(),
        suggestion: 'Visit /swagger-ui.html for API documentation'
      });
    });
  }

  private initializeSwagger(): void {
    setupSwagger(this.app);
  }

  public async start(): Promise<void> {
    try {
      // Verificar configuración de Firebase
      console.log('Checking Firebase configuration...');
      const isFirebaseConfigured = firebaseConfig.isConfigured();

      if (isFirebaseConfigured) {
        const firebaseConnected = await firebaseConfig.testConnection();
        if (firebaseConnected) {
          console.log('✅ Firebase connected successfully');
        } else {
          console.warn('⚠️  Firebase configured but connection test failed');
        }
      } else {
        console.warn('⚠️  Firebase not configured - running in mock mode');
        console.log('To configure Firebase, set these environment variables:');
        console.log('- FIREBASE_PROJECT_ID');
        console.log('- FIREBASE_PRIVATE_KEY');
        console.log('- FIREBASE_CLIENT_EMAIL');
        console.log('Or set GOOGLE_APPLICATION_CREDENTIALS path');
      }

      // Verificar servicio externo
      console.log('Checking external service...');
      const todoClient = new TodoClient();
      const externalServiceHealthy = await todoClient.healthCheck();

      if (externalServiceHealthy) {
        console.log('✅ External service (JSONPlaceholder) connected successfully');
      } else {
        console.warn('⚠️  External service not available');
      }

      // Iniciar servidor
      this.app.listen(this.port, () => {
        console.log('🚀 Task Management API started successfully!');
        console.log(`📡 Server running on port ${this.port}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('');
        console.log('📚 Available endpoints:');
        console.log(`   • API Documentation: http://localhost:${this.port}/swagger-ui.html`);
        console.log(`   • Health Check: http://localhost:${this.port}/api/health`);
        console.log(`   • Tasks API: http://localhost:${this.port}/api/tasks`);
        console.log(`   • OpenAPI Spec: http://localhost:${this.port}/api/swagger.json`);
        console.log('');
      });

      // Manejo graceful de shutdown
      process.on('SIGTERM', this.shutdown.bind(this));
      process.on('SIGINT', this.shutdown.bind(this));
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private shutdown(): void {
    console.log('🛑 Received shutdown signal, shutting down gracefully...');
    process.exit(0);
  }

  public getApp(): Application {
    return this.app;
  }
}

// Inicializar y ejecutar la aplicación
if (require.main === module) {
  const app = new TaskManagementApp();
  app.start().catch(error => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}

export default TaskManagementApp;
