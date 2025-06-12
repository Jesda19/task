/**
 * App.js - Aplicación principal de gestión de tareas
 * Maneja toda la lógica de la aplicación y eventos de la interfaz
 */

class TaskApp {
  constructor() {
    this.tasks = [];
    this.filteredTasks = [];
    this.currentFilters = {
      status: 'all',
      source: 'firebase',
      userId: 'all',
      search: ''
    };
    this.isLoading = false;
    this.lastLoadTime = null;

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  /**
   * Inicializa la aplicación
   */
  async init() {
    console.log('🚀 Inicializando Task Management App...');

    try {
      this.setupEventListeners();
      await this.checkAPIHealth();
      await this.loadTasks();

      console.log('✅ Aplicación inicializada correctamente');
    } catch (error) {
      console.error('❌ Error inicializando aplicación:', error);
      uiComponents.showErrorState('Error al inicializar la aplicación');
      uiComponents.showToast('Error al inicializar la aplicación', 'error');
    }
  }

  /**
   * Configura todos los event listeners
   */
  setupEventListeners() {
    // Botones principales
    document.getElementById('addTaskBtn')?.addEventListener('click', () => this.openTaskModal());
    document.getElementById('refreshBtn')?.addEventListener('click', () => this.loadTasks());

    // Formulario de tarea
    document.getElementById('taskForm')?.addEventListener('submit', e => this.handleTaskSubmit(e));

    // Filtros
    document.getElementById('statusFilter')?.addEventListener('change', e => {
      this.currentFilters.status = e.target.value;
      this.applyFilters();
    });

    document.getElementById('sourceFilter')?.addEventListener('change', e => {
      this.currentFilters.source = e.target.value;
      this.applyFilters();
    });

    document.getElementById('userFilter')?.addEventListener('change', e => {
      this.currentFilters.userId = e.target.value;
      this.applyFilters();
    });

    // Búsqueda con debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      const debouncedSearch = uiComponents.debounce(value => {
        this.currentFilters.search = value;
        this.applyFilters();
      }, 300);

      searchInput.addEventListener('input', e => {
        debouncedSearch(e.target.value);
      });
    }

    // Cerrar modales con escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        uiComponents.closeTaskModal();
        uiComponents.closeDeleteModal();
      }
    });

    // Cerrar modales al hacer clic en el overlay
    document.getElementById('taskModal')?.addEventListener('click', e => {
      if (e.target.classList.contains('modal-overlay')) {
        uiComponents.closeTaskModal();
      }
    });

    document.getElementById('deleteModal')?.addEventListener('click', e => {
      if (e.target.classList.contains('modal-overlay')) {
        uiComponents.closeDeleteModal();
      }
    });

    // Auto-refresh cada 5 minutos
    setInterval(() => {
      if (!this.isLoading && this.lastLoadTime) {
        const timeSinceLastLoad = Date.now() - this.lastLoadTime;
        if (timeSinceLastLoad > 5 * 60 * 1000) {
          // 5 minutos
          console.log('🔄 Auto-refresh de tareas');
          this.loadTasks(false); // Cargar sin mostrar loading spinner
        }
      }
    }, 60000); // Verificar cada minuto
  }

  /**
   * Verifica el estado de salud de la API
   */
  async checkAPIHealth() {
    try {
      console.log('🏥 Verificando estado de la API...');
      const health = await taskService.healthCheck();

      if (health.status === 'healthy') {
        console.log('✅ API funcionando correctamente');
        return true;
      } else {
        console.warn('⚠️ API reporta estado no saludable:', health);
        uiComponents.showToast('La API reporta problemas de conectividad', 'warning');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verificando API:', error);
      uiComponents.showToast('No se puede conectar con el servidor', 'error');
      throw error;
    }
  }

  /**
   * Carga todas las tareas desde la API
   * @param {boolean} showLoading - Si mostrar el spinner de carga
   */
  async loadTasks(showLoading = true) {
    if (this.isLoading) {
      console.log('⏳ Ya hay una carga en progreso...');
      return;
    }

    try {
      this.isLoading = true;

      if (showLoading) {
        uiComponents.showLoading(true);
      }

      console.log('📥 Cargando tareas...');
      const response = await taskService.getAllTasks();

      if (response.success && Array.isArray(response.data)) {
        this.tasks = response.data;
        this.lastLoadTime = Date.now();

        console.log(`✅ ${this.tasks.length} tareas cargadas correctamente`);

        // Actualizar UI
        this.updateStats();
        this.updateUserFilter();
        this.applyFilters();

        uiComponents.showToast(`Se cargaron ${this.tasks.length} tareas`, 'success', '', 2000);
      } else {
        throw new Error('Respuesta inválida de la API');
      }
    } catch (error) {
      console.error('❌ Error cargando tareas:', error);
      uiComponents.showErrorState(error.message);
      uiComponents.showToast('Error al cargar las tareas', 'error');
    } finally {
      this.isLoading = false;
      if (showLoading) {
        uiComponents.showLoading(false);
      }
    }
  }

  /**
   * Aplica los filtros actuales a las tareas
   */
  applyFilters() {
    try {
      this.filteredTasks = taskService.filterTasks(this.tasks, this.currentFilters);
      this.renderTasks();

      console.log(
        `🔍 Filtros aplicados: ${this.filteredTasks.length}/${this.tasks.length} tareas mostradas`
      );
    } catch (error) {
      console.error('❌ Error aplicando filtros:', error);
      uiComponents.showToast('Error al filtrar tareas', 'error');
    }
  }

  /**
   * Renderiza las tareas en la interfaz
   */
  renderTasks() {
    const container = document.getElementById('tasksContainer');
    if (!container) return;

    if (this.filteredTasks.length === 0) {
      container.innerHTML = '';
      uiComponents.showEmptyState(true);
      return;
    }

    uiComponents.showEmptyState(false);
    container.innerHTML = uiComponents.renderTaskCards(this.filteredTasks);
  }

  /**
   * Actualiza las estadísticas en la interfaz
   */
  updateStats() {
    try {
      const stats = taskService.calculateStats(this.tasks);
      uiComponents.updateStats(stats);
    } catch (error) {
      console.error('❌ Error actualizando estadísticas:', error);
    }
  }

  /**
   * Actualiza el filtro de usuarios
   */
  updateUserFilter() {
    try {
      uiComponents.updateUserFilter(this.tasks);
    } catch (error) {
      console.error('❌ Error actualizando filtro de usuarios:', error);
    }
  }

  /**
   * Abre el modal para crear/editar tarea
   * @param {string} taskId - ID de la tarea (para edición)
   */
  openTaskModal(taskId = null) {
    let task = null;

    if (taskId) {
      task = this.tasks.find(t => t.id === taskId);
      if (!task) {
        uiComponents.showToast('Tarea no encontrada', 'error');
        return;
      }
    }

    uiComponents.openTaskModal(task);
  }

  /**
   * Maneja el envío del formulario de tarea
   * @param {Event} event - Evento del formulario
   */
  async handleTaskSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const taskData = {
      title: document.getElementById('taskTitle').value?.trim() || '',
      description: document.getElementById('taskDescription').value?.trim() || '',
      completed: document.getElementById('taskCompleted').checked,
      userId: document.getElementById('taskUserId').value?.trim() || ''
    };

    const taskId = document.getElementById('taskId').value;

    try {
      // Validar datos
      const validation = taskService.validateTaskData(taskData);
      if (!validation.isValid) {
        uiComponents.showFormErrors(validation.errors);
        return;
      }

      // Mostrar loading en el botón
      uiComponents.setButtonLoading('saveTaskBtn', true, 'Guardando...');

      let result;
      let message;

      if (taskId) {
        // Actualizar tarea existente
        console.log(`📝 Actualizando tarea ${taskId}...`);
        result = await taskService.updateTask(taskId, taskData);
        message = 'Tarea actualizada correctamente';
      } else {
        // Crear nueva tarea
        console.log('📝 Creando nueva tarea...');
        result = await taskService.createTask(taskData);
        message = 'Tarea creada correctamente';
      }

      if (result.success) {
        console.log('✅', message);
        uiComponents.showToast(message, 'success');
        uiComponents.closeTaskModal();
        await this.loadTasks(false); // Recargar sin spinner
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('❌ Error guardando tarea:', error);
      uiComponents.showToast(error.message, 'error');
    } finally {
      uiComponents.setButtonLoading('saveTaskBtn', false);
    }
  }

  /**
   * Alterna el estado completado de una tarea
   * @param {string} taskId - ID de la tarea
   * @param {boolean} completed - Nuevo estado
   */
  async toggleTaskComplete(taskId, completed) {
    try {
      console.log(
        `🔄 Cambiando estado de tarea ${taskId} a ${completed ? 'completada' : 'pendiente'}...`
      );

      const result = await taskService.toggleTaskComplete(taskId, completed);

      if (result.success) {
        const message = completed
          ? 'Tarea marcada como completada'
          : 'Tarea marcada como pendiente';
        console.log('✅', message);
        uiComponents.showToast(message, 'success', '', 2000);
        await this.loadTasks(false);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('❌ Error cambiando estado de tarea:', error);
      uiComponents.showToast(error.message, 'error');
    }
  }

  /**
   * Abre el modal de confirmación para eliminar tarea
   * @param {string} taskId - ID de la tarea
   */
  confirmDeleteTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) {
      uiComponents.showToast('Tarea no encontrada', 'error');
      return;
    }

    uiComponents.openDeleteModal(task);
  }

  /**
   * Elimina una tarea después de confirmación
   * @param {string} taskId - ID de la tarea
   */
  async deleteTaskConfirmed(taskId) {
    try {
      console.log(`🗑️ Eliminando tarea ${taskId}...`);

      uiComponents.setButtonLoading('confirmDeleteBtn', true, 'Eliminando...');

      const result = await taskService.deleteTask(taskId);

      if (result.success) {
        console.log('✅ Tarea eliminada correctamente');
        uiComponents.showToast('Tarea eliminada correctamente', 'success');
        uiComponents.closeDeleteModal();
        await this.loadTasks(false);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('❌ Error eliminando tarea:', error);
      uiComponents.showToast(error.message, 'error');
    } finally {
      uiComponents.setButtonLoading('confirmDeleteBtn', false);
    }
  }

  /**
   * Copia el ID de una tarea al portapapeles
   * @param {string} taskId - ID de la tarea
   */
  async copyTaskId(taskId) {
    try {
      const success = await uiComponents.copyToClipboard(taskId);
      if (success) {
        uiComponents.showToast('ID copiado al portapapeles', 'success', '', 2000);
      } else {
        uiComponents.showToast('Error al copiar ID', 'error');
      }
    } catch (error) {
      console.error('❌ Error copiando ID:', error);
      uiComponents.showToast('Error al copiar ID', 'error');
    }
  }

  /**
   * Exporta las tareas a JSON
   */
  exportTasks() {
    try {
      const dataStr = JSON.stringify(this.tasks, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      uiComponents.showToast('Tareas exportadas correctamente', 'success');
    } catch (error) {
      console.error('❌ Error exportando tareas:', error);
      uiComponents.showToast('Error al exportar tareas', 'error');
    }
  }

  /**
   * Obtiene estadísticas detalladas
   * @returns {Object} - Estadísticas detalladas
   */
  getDetailedStats() {
    const stats = taskService.calculateStats(this.tasks);

    return {
      ...stats,
      completionRate: stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0,
      sourcesBreakdown: {
        external: stats.external,
        firebase: stats.firebase,
        merged: stats.merged
      },
      lastUpdate: this.lastLoadTime ? new Date(this.lastLoadTime).toLocaleString() : 'Nunca'
    };
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters() {
    this.currentFilters = {
      status: 'all',
      source: 'all',
      userId: 'all',
      search: ''
    };

    // Actualizar controles de filtros
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('sourceFilter').value = 'all';
    document.getElementById('userFilter').value = 'all';
    document.getElementById('searchInput').value = '';

    this.applyFilters();
    uiComponents.showToast('Filtros limpiados', 'success', '', 2000);
  }
}

// Funciones globales para eventos onClick en HTML
window.openTaskModal = taskId => taskApp.openTaskModal(taskId);
window.toggleTask = (taskId, completed) => taskApp.toggleTaskComplete(taskId, completed);
window.editTask = taskId => taskApp.openTaskModal(taskId);
window.deleteTask = taskId => taskApp.confirmDeleteTask(taskId);
window.confirmDeleteTask = taskId => taskApp.deleteTaskConfirmed(taskId);
window.loadTasks = () => taskApp.loadTasks();
window.closeTaskModal = () => uiComponents.closeTaskModal();
window.closeDeleteModal = () => uiComponents.closeDeleteModal();

// Inicializar aplicación
const taskApp = new TaskApp();

// Exponer instancia globalmente para debugging
window.taskApp = taskApp;

console.log('📱 Task Management App cargada');
