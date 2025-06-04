import { Router, Request, Response } from 'express';
import { TodoClient } from '../services/TodoClient';
import { FirebaseService } from '../services/FirebaseService';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../models/Task';

const router = Router();
const todoClient = new TodoClient();
const firebaseService = FirebaseService.getInstance();

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Obtiene todas las tareas
 *     description: Obtiene tareas del servicio externo y Firebase, realizando merge sin duplicados
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filtrar tareas por ID de usuario
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [external, firebase, all]
 *         description: Filtrar por origen de las tareas
 *         example: all
 *     responses:
 *       200:
 *         description: Lista de tareas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       example: 25
 *                     external:
 *                       type: number
 *                       example: 200
 *                     firebase:
 *                       type: number
 *                       example: 5
 *                     merged:
 *                       type: number
 *                       example: 20
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, source = 'all' } = req.query;

    let externalTasks: Task[] = [];
    let firebaseTasks: Task[] = [];

    // Obtener tareas según el filtro de origen
    if (source === 'all' || source === 'external') {
      try {
        if (userId) {
          externalTasks = await todoClient.getTasksByUserId(userId as string);
        } else {
          externalTasks = await todoClient.getAllTasks();
        }
      } catch (error) {
        console.error('Error fetching external tasks:', error);
        // Continuar con tareas de Firebase si el servicio externo falla
      }
    }

    if (source === 'all' || source === 'firebase') {
      try {
        if (userId) {
          firebaseTasks = await firebaseService.getTasksByUserId(userId as string);
        } else {
          firebaseTasks = await firebaseService.getAllTasks();
        }
      } catch (error) {
        console.error('Error fetching Firebase tasks:', error);
        // Continuar con tareas externas si Firebase falla
      }
    }

    // Realizar merge evitando duplicados
    const mergedTasks = mergeTasks(externalTasks, firebaseTasks);

    const meta = {
      total: mergedTasks.length,
      external: externalTasks.length,
      firebase: firebaseTasks.length,
      merged: mergedTasks.filter(t => t.source === 'merged').length
    };

    return res.json({
      success: true,
      data: mergedTasks,
      meta
    });
  } catch (error) {
    console.error('Error in GET /tasks:', error);
    return res.status(500).json({
      error: 'Failed to fetch tasks',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Obtiene una tarea específica por ID
 *     description: Busca la tarea en el servicio externo y Firebase
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la tarea
 *         example: "1"
 *     responses:
 *       200:
 *         description: Tarea encontrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id = '' } = req.params;

    // Buscar en servicio externo
    let task: Task | null = null;

    try {
      task = await todoClient.getTaskById(id);
    } catch (error) {
      console.error('Error fetching from external service:', error);
    }

    // Si no se encuentra en el servicio externo, buscar en Firebase
    if (!task) {
      try {
        task = await firebaseService.getTaskById(id);
      } catch (error) {
        console.error('Error fetching from Firebase:', error);
      }
    }

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        details: `No task found with ID: ${id}`,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error(`Error in GET /tasks/${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Failed to fetch task',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Crea una nueva tarea
 *     description: Crea la tarea en el servicio externo y la guarda también en Firebase
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *           examples:
 *             simple:
 *               summary: Tarea simple
 *               value:
 *                 title: "Nueva tarea de ejemplo"
 *                 completed: false
 *             detailed:
 *               summary: Tarea con descripción
 *               value:
 *                 title: "Tarea detallada"
 *                 description: "Esta es una tarea con descripción completa"
 *                 completed: false
 *                 userId: "1"
 *     responses:
 *       201:
 *         description: Tarea creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     saved_to_external:
 *                       type: boolean
 *                       example: true
 *                     saved_to_firebase:
 *                       type: boolean
 *                       example: true
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const taskData: CreateTaskRequest = req.body;

    // Validar datos requeridos
    if (!taskData.title || taskData.title.trim() === '') {
      return res.status(400).json({
        error: 'Validation failed',
        details: 'Title is required and cannot be empty',
        timestamp: new Date().toISOString()
      });
    }

    let externalTask: Task | null = null;
    let firebaseTask: Task | null = null;
    let savedToExternal = false;
    let savedToFirebase = false;

    // Crear en servicio externo
    try {
      externalTask = await todoClient.createTask(taskData);
      savedToExternal = true;
      console.log('Task created in external service:', externalTask.id);
    } catch (error) {
      console.error('Error creating task in external service:', error);
    }

    // Crear en Firebase
    try {
      firebaseTask = await firebaseService.createTask(taskData);
      savedToFirebase = true;
      console.log('Task created in Firebase:', firebaseTask.id);
    } catch (error) {
      console.error('Error creating task in Firebase:', error);
    }

    // Si no se pudo crear en ningún lado, error
    if (!externalTask && !firebaseTask) {
      return res.status(500).json({
        error: 'Failed to create task',
        details: 'Could not create task in any service',
        timestamp: new Date().toISOString()
      });
    }

    // Retornar la tarea creada (preferir la del servicio externo)
    const resultTask = externalTask || firebaseTask!;

    return res.status(201).json({
      success: true,
      data: resultTask,
      meta: {
        saved_to_external: savedToExternal,
        saved_to_firebase: savedToFirebase
      }
    });
  } catch (error) {
    console.error('Error in POST /tasks:', error);
    return res.status(500).json({
      error: 'Failed to create task',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Actualiza una tarea existente
 *     description: Actualiza la tarea en el servicio externo y Firebase si existe
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la tarea a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskRequest'
 *           examples:
 *             complete:
 *               summary: Marcar como completada
 *               value:
 *                 completed: true
 *             update_title:
 *               summary: Actualizar título
 *               value:
 *                 title: "Título actualizado"
 *                 description: "Nueva descripción"
 *     responses:
 *       200:
 *         description: Tarea actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id = '' } = req.params;
    const updates: UpdateTaskRequest = req.body;

    let updatedTask: Task | null = null;

    // Intentar actualizar en servicio externo
    try {
      updatedTask = await todoClient.updateTask(id, updates);
    } catch (error) {
      console.error('Error updating task in external service:', error);
    }

    // Intentar actualizar en Firebase
    try {
      const firebaseUpdated = await firebaseService.updateTask(id, updates);
      if (firebaseUpdated && !updatedTask) {
        updatedTask = firebaseUpdated;
      }
    } catch (error) {
      console.error('Error updating task in Firebase:', error);
    }

    if (!updatedTask) {
      return res.status(404).json({
        error: 'Task not found',
        details: `No task found with ID: ${id}`,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    console.error(`Error in PUT /tasks/${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Failed to update task',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Elimina una tarea
 *     description: Elimina la tarea del servicio externo y Firebase
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la tarea a eliminar
 *     responses:
 *       200:
 *         description: Tarea eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Task deleted successfully"
 *                 meta:
 *                   type: object
 *                   properties:
 *                     deleted_from_external:
 *                       type: boolean
 *                     deleted_from_firebase:
 *                       type: boolean
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id = '' } = req.params;

    let deletedFromExternal = false;
    let deletedFromFirebase = false;

    // Eliminar del servicio externo
    try {
      deletedFromExternal = await todoClient.deleteTask(id);
    } catch (error) {
      console.error('Error deleting task from external service:', error);
    }

    // Eliminar de Firebase
    try {
      deletedFromFirebase = await firebaseService.deleteTask(id);
    } catch (error) {
      console.error('Error deleting task from Firebase:', error);
    }

    if (!deletedFromExternal && !deletedFromFirebase) {
      return res.status(404).json({
        error: 'Task not found',
        details: `No task found with ID: ${id}`,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      message: 'Task deleted successfully',
      meta: {
        deleted_from_external: deletedFromExternal,
        deleted_from_firebase: deletedFromFirebase
      }
    });
  } catch (error) {
    console.error(`Error in DELETE /tasks/${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Failed to delete task',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Función helper para hacer merge de tareas evitando duplicados
 */
function mergeTasks(externalTasks: Task[], firebaseTasks: Task[]): Task[] {
  const taskMap = new Map<string, Task>();

  // Añadir tareas de Firebase primero
  firebaseTasks.forEach(task => {
    taskMap.set(task.id, task);
  });

  // Añadir tareas externas, evitando duplicados por título + userId
  externalTasks.forEach(externalTask => {
    // Buscar si existe una tarea similar en Firebase
    const duplicateKey = `${externalTask.title.trim().toLowerCase()}_${externalTask.userId}`;
    const existingFirebaseTask = firebaseTasks.find(
      fbTask => `${fbTask.title.trim().toLowerCase()}_${fbTask.userId}` === duplicateKey
    );

    if (existingFirebaseTask) {
      // Merge de datos: Firebase tiene prioridad, pero agregamos datos faltantes del externo
      const mergedTask: Task = {
        ...existingFirebaseTask,
        source: 'merged',
        // Si Firebase no tiene descripción pero external sí, usarla
        description: existingFirebaseTask.description || externalTask.description
      };
      taskMap.set(existingFirebaseTask.id, mergedTask);
    } else {
      // No hay duplicado, agregar la tarea externa
      taskMap.set(externalTask.id, externalTask);
    }
  });

  return Array.from(taskMap.values()).sort((a, b) => {
    // Ordenar por fecha de actualización (más recientes primero)
    const aDate = a.updatedAt || a.createdAt || new Date(0);
    const bDate = b.updatedAt || b.createdAt || new Date(0);
    return bDate.getTime() - aDate.getTime();
  });
}

export default router;
