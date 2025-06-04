/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - completed
 *       properties:
 *         id:
 *           type: string
 *           description: ID único de la tarea
 *           example: "1"
 *         title:
 *           type: string
 *           description: Título de la tarea
 *           example: "Completar proyecto de Node.js"
 *         completed:
 *           type: boolean
 *           description: Estado de completitud de la tarea
 *           example: false
 *         userId:
 *           type: string
 *           description: ID del usuario propietario
 *           example: "1"
 *         description:
 *           type: string
 *           description: Descripción detallada de la tarea
 *           example: "Desarrollar API REST con Express y Firebase"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *           example: "2024-12-01T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *           example: "2024-12-01T15:45:00Z"
 *         source:
 *           type: string
 *           enum: [external, firebase, merged]
 *           description: Origen de la tarea
 *           example: "external"
 *     CreateTaskRequest:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           description: Título de la tarea
 *           example: "Nueva tarea"
 *         completed:
 *           type: boolean
 *           description: Estado inicial de la tarea
 *           example: false
 *         description:
 *           type: string
 *           description: Descripción de la tarea
 *           example: "Descripción detallada de la nueva tarea"
 *         userId:
 *           type: string
 *           description: ID del usuario
 *           example: "1"
 *     UpdateTaskRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Título de la tarea
 *         completed:
 *           type: boolean
 *           description: Estado de la tarea
 *         description:
 *           type: string
 *           description: Descripción de la tarea
 */

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  userId?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  source?: 'external' | 'firebase' | 'merged';
  externalId?: string;
}

export interface CreateTaskRequest {
  title: string;
  completed?: boolean;
  description?: string;
  userId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  completed?: boolean;
  description?: string;
}

export interface ExternalTodoResponse {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
}

export class TaskEntity implements Task {
  public id: string;
  public title: string;
  public completed: boolean;
  public userId?: string;
  public description?: string;
  public createdAt?: Date;
  public updatedAt?: Date;
  public source?: 'external' | 'firebase' | 'merged';
  public externalId?: string;

  constructor(data: Partial<Task>) {
    this.id = data.id || '';
    this.title = data.title || '';
    this.completed = data.completed || false;
    this.userId = data.userId;
    this.description = data.description;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.source = data.source || 'external';
    this.externalId = data.externalId;
  }

  public static fromExternalTodo(todo: ExternalTodoResponse): TaskEntity {
    return new TaskEntity({
      id: todo.id.toString(),
      title: todo.title,
      completed: todo.completed,
      userId: todo.userId.toString(),
      source: 'external',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  public static fromFirebaseDoc(id: string, data: any): TaskEntity {
    return new TaskEntity({
      id,
      title: data.title,
      completed: data.completed,
      userId: data.userId,
      description: data.description,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      source: 'firebase'
    });
  }

  public toFirebaseDoc(): Record<string, any> {
    return {
      title: this.title,
      completed: this.completed,
      userId: this.userId,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}