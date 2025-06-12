/**
 * TaskService - Servicio para interactuar con la API de tareas
 * Maneja todas las operaciones CRUD y comunicación con el backend
 */

class TaskService {
  constructor() {
    // La URL base se ajusta automáticamente al puerto donde corre el servidor
    this.baseURL = `${window.location.origin}/api`;
    this.endpoints = {
      tasks: '/tasks',
      health: '/health'
    };
  }

  /**
   * Realiza una petición HTTP con manejo de errores
   * @param {string} url - URL del endpoint
   * @param {Object} options - Opciones de fetch
   * @returns {Promise<Object>} - Respuesta de la API
   */
  async request(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      console.log(`[TaskService] ${config.method || 'GET'} ${url}`);

      const response = await fetch(url, config);

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        throw new Error(
          isJson && data.error
            ? `${data.error}: ${data.details || ''}`
            : `HTTP ${response.status}: ${response.statusText}`
        );
      }

      console.log(`[TaskService] ✅ Success:`, data);
      return data;
    } catch (error) {
      console.error(`[TaskService] ❌ Error:`, error);

      // Manejar diferentes tipos de errores
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error(
          'No se puede conectar con el servidor. Verifica que la API esté ejecutándose.'
        );
      }

      if (error.name === 'AbortError') {
        throw new Error('La petición fue cancelada por timeout');
      }

      throw error;
    }
  }

  /**
   * Verificar el estado de salud de la API
   * @returns {Promise<Object>} - Estado de salud
   */
  async healthCheck() {
    const url = `${this.baseURL}${this.endpoints.health}`;
    return await this.request(url);
  }

  /**
   * Obtener todas las tareas
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>} - Lista de tareas
   */
  async getAllTasks(filters = {}) {
    const url = new URL(`${this.baseURL}${this.endpoints.tasks}`);

    // Agregar parámetros de filtro
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== 'all') {
        url.searchParams.append(key, filters[key]);
      }
    });

    return await this.request(url.toString());
  }

  /**
   * Obtener una tarea específica por ID
   * @param {string} id - ID de la tarea
   * @returns {Promise<Object>} - Datos de la tarea
   */
  async getTaskById(id) {
    if (!id) {
      throw new Error('ID de tarea es requerido');
    }

    const url = `${this.baseURL}${this.endpoints.tasks}/${id}`;
    return await this.request(url);
  }

  /**
   * Crear una nueva tarea
   * @param {Object} taskData - Datos de la tarea
   * @returns {Promise<Object>} - Tarea creada
   */
  async createTask(taskData) {
    // Validar datos requeridos
    if (!taskData.title || taskData.title.trim() === '') {
      throw new Error('El título de la tarea es requerido');
    }

    // Limpiar y estructurar datos
    const payload = {
      title: taskData.title.trim(),
      completed: Boolean(taskData.completed),
      description: taskData.description ? taskData.description.trim() : undefined,
      userId: taskData.userId ? taskData.userId.trim() : undefined
    };

    // Remover campos undefined
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    const url = `${this.baseURL}${this.endpoints.tasks}`;
    return await this.request(url, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Actualizar una tarea existente
   * @param {string} id - ID de la tarea
   * @param {Object} updates - Datos a actualizar
   * @returns {Promise<Object>} - Tarea actualizada
   */
  async updateTask(id, updates) {
    if (!id) {
      throw new Error('ID de tarea es requerido');
    }

    // Validar que hay datos para actualizar
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('Datos de actualización son requeridos');
    }

    // Limpiar y estructurar datos
    const payload = {};

    if (updates.title !== undefined) {
      if (updates.title.trim() === '') {
        throw new Error('El título no puede estar vacío');
      }
      payload.title = updates.title.trim();
    }

    if (updates.completed !== undefined) {
      payload.completed = Boolean(updates.completed);
    }

    if (updates.description !== undefined) {
      payload.description = updates.description ? updates.description.trim() : '';
    }

    if (updates.userId !== undefined) {
      payload.userId = updates.userId ? updates.userId.trim() : '';
    }

    const url = `${this.baseURL}${this.endpoints.tasks}/${id}`;
    return await this.request(url, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Eliminar una tarea
   * @param {string} id - ID de la tarea
   * @returns {Promise<Object>} - Resultado de la eliminación
   */
  async deleteTask(id) {
    if (!id) {
      throw new Error('ID de tarea es requerido');
    }

    const url = `${this.baseURL}${this.endpoints.tasks}/${id}`;
    return await this.request(url, {
      method: 'DELETE'
    });
  }

  /**
   * Alternar el estado completado de una tarea
   * @param {string} id - ID de la tarea
   * @param {boolean} completed - Nuevo estado
   * @returns {Promise<Object>} - Tarea actualizada
   */
  async toggleTaskComplete(id, completed) {
    return await this.updateTask(id, { completed });
  }

  /**
   * Obtener estadísticas de las tareas
   * @param {Array} tasks - Lista de tareas
   * @returns {Object} - Estadísticas calculadas
   */
  calculateStats(tasks) {
    if (!Array.isArray(tasks)) {
      return {
        total: 0,
        completed: 0,
        pending: 0,
        external: 0,
        firebase: 0,
        merged: 0,
        byUser: {}
      };
    }

    const stats = {
      total: tasks.length,
      completed: tasks.filter(task => task.completed).length,
      pending: tasks.filter(task => !task.completed).length,
      external: tasks.filter(task => task.source === 'external').length,
      firebase: tasks.filter(task => task.source === 'firebase').length,
      merged: tasks.filter(task => task.source === 'merged').length,
      byUser: {}
    };

    // Estadísticas por usuario
    tasks.forEach(task => {
      const userId = task.userId || 'sin-usuario';
      if (!stats.byUser[userId]) {
        stats.byUser[userId] = {
          total: 0,
          completed: 0,
          pending: 0
        };
      }
      stats.byUser[userId].total++;
      if (task.completed) {
        stats.byUser[userId].completed++;
      } else {
        stats.byUser[userId].pending++;
      }
    });

    return stats;
  }

  /**
   * Filtrar tareas según criterios
   * @param {Array} tasks - Lista de tareas
   * @param {Object} filters - Filtros a aplicar
   * @returns {Array} - Tareas filtradas
   */
  filterTasks(tasks, filters) {
    if (!Array.isArray(tasks)) {
      return [];
    }

    let filtered = [...tasks];

    // Filtrar por estado
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'completed') {
        filtered = filtered.filter(task => task.completed);
      } else if (filters.status === 'pending') {
        filtered = filtered.filter(task => !task.completed);
      }
    }

    // Filtrar por origen
    if (filters.source && filters.source !== 'all') {
      filtered = filtered.filter(task => task.source === filters.source);
    }

    // Filtrar por usuario
    if (filters.userId && filters.userId !== 'all') {
      filtered = filtered.filter(task => task.userId === filters.userId);
    }

    // Filtrar por búsqueda de texto
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim().toLowerCase();
      filtered = filtered.filter(task => {
        return (
          task.title.toLowerCase().includes(searchTerm) ||
          (task.description && task.description.toLowerCase().includes(searchTerm)) ||
          (task.userId && task.userId.toLowerCase().includes(searchTerm))
        );
      });
    }

    return filtered;
  }

  /**
   * Validar datos de tarea
   * @param {Object} taskData - Datos a validar
   * @returns {Object} - Resultado de validación
   */
  validateTaskData(taskData) {
    const errors = {};

    // Validar título
    if (!taskData.title || taskData.title.trim() === '') {
      errors.title = 'El título es requerido';
    } else if (taskData.title.trim().length > 500) {
      errors.title = 'El título no puede exceder 500 caracteres';
    }

    // Validar descripción
    if (taskData.description && taskData.description.length > 5000) {
      errors.description = 'La descripción no puede exceder 5000 caracteres';
    }

    // Validar userId
    if (taskData.userId && taskData.userId.trim().length > 100) {
      errors.userId = 'El ID de usuario no puede exceder 100 caracteres';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Formatear fecha para mostrar
   * @param {string|Date} date - Fecha a formatear
   * @returns {string} - Fecha formateada
   */
  formatDate(date) {
    if (!date) return 'No disponible';

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;

      if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
      }

      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // Si es hoy
      if (diffDays === 0) {
        return dateObj.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      // Si es ayer
      if (diffDays === 1) {
        return 'Ayer';
      }

      // Si es esta semana
      if (diffDays < 7) {
        return `Hace ${diffDays} días`;
      }

      // Fecha completa
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  }

  /**
   * Obtener color del origen de la tarea
   * @param {string} source - Origen de la tarea
   * @returns {string} - Clase CSS del color
   */
  getSourceColor(source) {
    switch (source) {
      case 'external':
        return 'external';
      case 'firebase':
        return 'firebase';
      case 'merged':
        return 'merged';
      default:
        return 'external';
    }
  }

  /**
   * Obtener icono del origen de la tarea
   * @param {string} source - Origen de la tarea
   * @returns {string} - Clase del icono
   */
  getSourceIcon(source) {
    switch (source) {
      case 'external':
        return 'fas fa-cloud';
      case 'firebase':
        return 'fas fa-database';
      case 'merged':
        return 'fas fa-link';
      default:
        return 'fas fa-question';
    }
  }
}

// Crear instancia global del servicio
window.taskService = new TaskService();
