import { firebaseConfig } from '../config/firebase';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskEntity } from '../models/Task';

export class FirebaseService {
  private static instance: FirebaseService;
  private readonly collectionName = 'tasks';
  private db: FirebaseFirestore.Firestore;

  private constructor() {
    this.db = firebaseConfig.getFirestore();
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Verifica si Firebase está configurado correctamente
   */
  public isAvailable(): boolean {
    return firebaseConfig.isConfigured();
  }

  /**
   * Obtiene todas las tareas de Firestore
   */
  public async getAllTasks(): Promise<Task[]> {
    if (!this.isAvailable()) {
      console.warn('Firebase not available, returning empty array');
      return [];
    }

    try {
      const snapshot = await this.db
        .collection(this.collectionName)
        .orderBy('createdAt', 'desc')
        .get();

      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map(doc => TaskEntity.fromFirebaseDoc(doc.id, doc.data()));
    } catch (error) {
      console.error('Error fetching tasks from Firebase:', error);
      throw new Error('Failed to fetch tasks from Firebase');
    }
  }

  /**
   * Obtiene una tarea específica por ID
   */
  public async getTaskById(id: string): Promise<Task | null> {
    if (!this.isAvailable()) {
      console.warn('Firebase not available');
      return null;
    }

    try {
      const doc = await this.db.collection(this.collectionName).doc(id).get();

      if (!doc.exists) {
        return null;
      }

      return TaskEntity.fromFirebaseDoc(doc.id, doc.data());
    } catch (error) {
      console.error(`Error fetching task ${id} from Firebase:`, error);
      throw new Error(`Failed to fetch task ${id} from Firebase`);
    }
  }

  /**
   * Crea una nueva tarea en Firestore
   */
  public async createTask(taskData: CreateTaskRequest): Promise<Task> {
    if (!this.isAvailable()) {
      throw new Error('Firebase not available');
    }

    try {
      const now = new Date();
      const newTask = new TaskEntity({
        title: taskData.title,
        completed: taskData.completed || false,
        userId: taskData.userId,
        description: taskData.description,
        createdAt: now,
        updatedAt: now,
        source: 'firebase'
      });

      const docRef = await this.db.collection(this.collectionName).add(newTask.toFirebaseDoc());
      newTask.id = docRef.id;

      console.log(`Task created in Firebase with ID: ${docRef.id}`);
      return newTask;
    } catch (error) {
      console.error('Error creating task in Firebase:', error);
      throw new Error('Failed to create task in Firebase');
    }
  }

  /**
   * Actualiza una tarea existente
   */
  public async updateTask(id: string, updates: UpdateTaskRequest): Promise<Task | null> {
    if (!this.isAvailable()) {
      throw new Error('Firebase not available');
    }

    try {
      const docRef = this.db.collection(this.collectionName).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      const updateData: any = {
        ...updates,
        updatedAt: new Date()
      };

      // Remover campos undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await docRef.update(updateData);

      // Obtener la tarea actualizada
      const updatedDoc = await docRef.get();
      return TaskEntity.fromFirebaseDoc(updatedDoc.id, updatedDoc.data());
    } catch (error) {
      console.error(`Error updating task ${id} in Firebase:`, error);
      throw new Error(`Failed to update task ${id} in Firebase`);
    }
  }

  /**
   * Elimina una tarea
   */
  public async deleteTask(id: string): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error('Firebase not available');
    }

    try {
      const doc = await this.db.collection(this.collectionName).doc(id).get();

      if (!doc.exists) {
        return false;
      }

      await this.db.collection(this.collectionName).doc(id).delete();
      console.log(`Task ${id} deleted from Firebase`);
      return true;
    } catch (error) {
      console.error(`Error deleting task ${id} from Firebase:`, error);
      throw new Error(`Failed to delete task ${id} from Firebase`);
    }
  }

  /**
   * Obtiene tareas por usuario ID
   */
  public async getTasksByUserId(userId: string): Promise<Task[]> {
    if (!this.isAvailable()) {
      console.warn('Firebase not available, returning empty array');
      return [];
    }

    try {
      const snapshot = await this.db
        .collection(this.collectionName)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map(doc => TaskEntity.fromFirebaseDoc(doc.id, doc.data()));
    } catch (error) {
      console.error(`Error fetching tasks for user ${userId} from Firebase:`, error);
      throw new Error(`Failed to fetch tasks for user ${userId} from Firebase`);
    }
  }

  /**
   * Busca tareas que coincidan con tareas externas para evitar duplicados
   */
  public async findTaskByExternalId(externalId: string): Promise<Task | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      // Buscar por ID o por combinación de título y userId
      const snapshot = await this.db
        .collection(this.collectionName)
        .where('externalId', '==', externalId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        if (doc) {
          return TaskEntity.fromFirebaseDoc(doc.id, doc.data());
        }
      }

      return null;
    } catch (error) {
      console.error(`Error finding task by external ID ${externalId}:`, error);
      return null;
    }
  }

  /**
   * Guarda referencia a una tarea externa para evitar duplicados
   */
  public async saveExternalTaskReference(externalTask: Task): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const taskWithExternalId = new TaskEntity({
        ...externalTask,
        externalId: externalTask.id,
        source: 'firebase',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await this.db.collection(this.collectionName).add({
        ...taskWithExternalId.toFirebaseDoc(),
        externalId: externalTask.id
      });

      console.log(`External task reference saved for ID: ${externalTask.id}`);
    } catch (error) {
      console.error('Error saving external task reference:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Verifica la conectividad con Firebase
   */
  public async healthCheck(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      // Hacer una operación simple para verificar la conexión
      await this.db.collection('health_check').limit(1).get();
      return true;
    } catch (error) {
      console.error('Firebase health check failed:', error);
      return false;
    }
  }

  /**
   * Limpia tareas de prueba (útil para testing)
   */
  public async clearTestTasks(): Promise<void> {
    if (!this.isAvailable() || process.env.NODE_ENV === 'production') {
      return;
    }

    try {
      const batch = this.db.batch();
      const snapshot = await this.db
        .collection(this.collectionName)
        .where('title', '>=', 'TEST_')
        .get();

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log('Test tasks cleared from Firebase');
    } catch (error) {
      console.error('Error clearing test tasks:', error);
    }
  }
}
