import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Task, CreateTaskRequest, UpdateTaskRequest, ExternalTodoResponse, TaskEntity } from '../models/Task';

export class TodoClient {
  private axiosInstance: AxiosInstance;
  private readonly baseURL = 'https://jsonplaceholder.typicode.com';

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Interceptor para logging de requests
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`[TodoClient] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[TodoClient] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para logging de responses
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`[TodoClient] Response ${response.status} from ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('[TodoClient] Response error:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Obtiene todas las tareas del servicio externo
   */
  public async getAllTasks(): Promise<Task[]> {
    try {
      const response: AxiosResponse<ExternalTodoResponse[]> = await this.axiosInstance.get('/todos');
      
      return response.data.map(todo => TaskEntity.fromExternalTodo(todo));
    } catch (error) {
      console.error('Error fetching all tasks:', error);
      throw new Error('Failed to fetch tasks from external service');
    }
  }

  /**
   * Obtiene una tarea específica por ID
   */
  public async getTaskById(id: string): Promise<Task | null> {
    try {
      const response: AxiosResponse<ExternalTodoResponse> = await this.axiosInstance.get(`/todos/${id}`);
      
      if (!response.data || !response.data.id) {
        return null;
      }

      return TaskEntity.fromExternalTodo(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error(`Error fetching task ${id}:`, error);
      throw new Error(`Failed to fetch task ${id} from external service`);
    }
  }

  /**
   * Crea una nueva tarea en el servicio externo
   */
  public async createTask(taskData: CreateTaskRequest): Promise<Task> {
    try {
      const payload = {
        title: taskData.title,
        completed: taskData.completed || false,
        userId: parseInt(taskData.userId || '1', 10)
      };

      const response: AxiosResponse<ExternalTodoResponse> = await this.axiosInstance.post('/todos', payload);
      
      const createdTask = TaskEntity.fromExternalTodo(response.data);
      
      // Agregar descripción si fue proporcionada (el API externo no la soporta)
      if (taskData.description) {
        createdTask.description = taskData.description;
      }

      return createdTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task in external service');
    }
  }

  /**
   * Actualiza una tarea existente
   */
  public async updateTask(id: string, updates: UpdateTaskRequest): Promise<Task | null> {
    try {
      // Primero obtenemos la tarea actual
      const currentTask = await this.getTaskById(id);
      if (!currentTask) {
        return null;
      }

      const payload = {
        id: parseInt(id, 10),
        title: updates.title || currentTask.title,
        completed: updates.completed !== undefined ? updates.completed : currentTask.completed,
        userId: parseInt(currentTask.userId || '1', 10)
      };

      const response: AxiosResponse<ExternalTodoResponse> = await this.axiosInstance.put(`/todos/${id}`, payload);
      
      const updatedTask = TaskEntity.fromExternalTodo(response.data);
      updatedTask.updatedAt = new Date();
      
      // Conservar descripción si existía
      if (currentTask.description || updates.description) {
        updatedTask.description = updates.description || currentTask.description;
      }

      return updatedTask;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error(`Error updating task ${id}:`, error);
      throw new Error(`Failed to update task ${id} in external service`);
    }
  }

  /**
   * Elimina una tarea
   */
  public async deleteTask(id: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.delete(`/todos/${id}`);
      
      // JSONPlaceholder siempre retorna 200 para DELETE, incluso si el recurso no existe
      return response.status === 200;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      console.error(`Error deleting task ${id}:`, error);
      throw new Error(`Failed to delete task ${id} from external service`);
    }
  }

  /**
   * Obtiene tareas por usuario ID
   */
  public async getTasksByUserId(userId: string): Promise<Task[]> {
    try {
      const response: AxiosResponse<ExternalTodoResponse[]> = await this.axiosInstance.get(`/todos?userId=${userId}`);
      
      return response.data.map(todo => TaskEntity.fromExternalTodo(todo));
    } catch (error) {
      console.error(`Error fetching tasks for user ${userId}:`, error);
      throw new Error(`Failed to fetch tasks for user ${userId} from external service`);
    }
  }

  /**
   * Verifica la conectividad con el servicio externo
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/todos/1');
      return response.status === 200;
    } catch (error) {
      console.error('External service health check failed:', error);
      return false;
    }
  }
}