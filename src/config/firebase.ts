import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export class FirebaseConfig {
  private static instance: FirebaseConfig;
  private app: admin.app.App;
  private db: FirebaseFirestore.Firestore;

  private constructor() {
    try {
      // Configuración para desarrollo local usando variables de entorno
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        // Para desarrollo, puedes usar la autenticación con archivo de clave de servicio
        const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        
        if (serviceAccount) {
          this.app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID
          });
        } else {
          // Configuración alternativa con variables de entorno individuales
          const firebaseConfig = {
            type: 'service_account',
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
          };

          this.app = admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID
          });
        }
      } else {
        // Para producción, usa las credenciales automáticas de Google Cloud
        this.app = admin.initializeApp();
      }

      this.db = getFirestore(this.app);
      
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      
      // Para casos donde Firebase no está configurado, creamos una instancia mock
      this.app = {} as admin.app.App;
      this.db = {} as FirebaseFirestore.Firestore;
      
      console.warn('Firebase running in mock mode - check your configuration');
    }
  }

  public static getInstance(): FirebaseConfig {
    if (!FirebaseConfig.instance) {
      FirebaseConfig.instance = new FirebaseConfig();
    }
    return FirebaseConfig.instance;
  }

  public getFirestore(): FirebaseFirestore.Firestore {
    return this.db;
  }

  public getApp(): admin.app.App {
    return this.app;
  }

  public async testConnection(): Promise<boolean> {
    try {
      // Intenta hacer una operación simple para verificar la conexión
      await this.db.collection('health_check').doc('test').get();
      return true;
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      return false;
    }
  }

  public isConfigured(): boolean {
    return this.app && this.db && typeof this.db.collection === 'function';
  }
}

// Instancia singleton para uso en toda la aplicación
export const firebaseConfig = FirebaseConfig.getInstance();