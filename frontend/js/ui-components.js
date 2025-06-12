/**
 * UI Components - Componentes y utilidades para la interfaz de usuario
 * Maneja la renderización de elementos y las interacciones
 */

class UIComponents {
  constructor() {
    this.toastId = 0;
  }

  /**
   * Renderiza una tarjeta de tarea
   * @param {Object} task - Datos de la tarea
   * @returns {string} - HTML de la tarjeta
   */
  renderTaskCard(task) {
    const statusClass = task.completed ? 'completed' : 'pending';
    const statusIcon = task.completed ? 'fas fa-check-circle' : 'fas fa-clock';
    const statusText = task.completed ? 'Completada' : 'Pendiente';

    const sourceClass = taskService.getSourceColor(task.source);
    const sourceIcon = taskService.getSourceIcon(task.source);
    const sourceName = this.getSourceName(task.source);

    const createdDate = taskService.formatDate(task.createdAt);
    const updatedDate = taskService.formatDate(task.updatedAt);

    return `
            <div class="task-card ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-status ${statusClass}">
                        <i class="${statusIcon}"></i>
                        ${statusText}
                    </div>
                    <div class="task-actions">
                        <button class="action-btn toggle" onclick="toggleTask('${task.id}', ${!task.completed})" 
                                title="${task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}">
                            <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                        </button>
                        <button class="action-btn edit" onclick="editTask('${task.id}')" title="Editar tarea">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteTask('${task.id}')" title="Eliminar tarea">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="task-content">
                    <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                    ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
                    <div class="task-meta">
                        <div class="task-meta-item">
                            <i class="fas fa-user"></i>
                            Usuario: ${task.userId || 'Sin asignar'}
                        </div>
                        <div class="task-meta-item">
                            <i class="fas fa-calendar-plus"></i>
                            Creada: ${createdDate}
                        </div>
                        ${
                          task.updatedAt !== task.createdAt
                            ? `
                            <div class="task-meta-item">
                                <i class="fas fa-calendar-edit"></i>
                                Actualizada: ${updatedDate}
                            </div>
                        `
                            : ''
                        }
                    </div>
                </div>
            </div>
        `;
  }

  /**
   * Renderiza múltiples tarjetas de tareas
   * @param {Array} tasks - Lista de tareas
   * @returns {string} - HTML de todas las tarjetas
   */
  renderTaskCards(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return '';
    }

    return tasks.map(task => this.renderTaskCard(task)).join('');
  }

  /**
   * Actualiza las estadísticas en la interfaz
   * @param {Object} stats - Estadísticas calculadas
   */
  updateStats(stats) {
    const elements = {
      totalTasks: document.getElementById('totalTasks'),
      completedTasks: document.getElementById('completedTasks'),
      pendingTasks: document.getElementById('pendingTasks'),
      externalTasks: document.getElementById('externalTasks')
    };

    // Actualizar contadores con animación
    Object.keys(elements).forEach(key => {
      const element = elements[key];
      if (element) {
        const statKey = key
          .replace('Tasks', '')
          .replace('total', 'total')
          .replace('completed', 'completed')
          .replace('pending', 'pending')
          .replace('external', 'external');
        const value = stats[statKey] || 0;
        this.animateNumber(element, parseInt(element.textContent) || 0, value);
      }
    });
  }

  /**
   * Anima el cambio de un número
   * @param {HTMLElement} element - Elemento a animar
   * @param {number} from - Valor inicial
   * @param {number} to - Valor final
   */
  animateNumber(element, from, to) {
    if (from === to) return;

    const duration = 500;
    const steps = 20;
    const stepValue = (to - from) / steps;
    const stepDuration = duration / steps;
    let current = from;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += stepValue;

      if (step >= steps) {
        element.textContent = to;
        clearInterval(timer);
      } else {
        element.textContent = Math.round(current);
      }
    }, stepDuration);
  }

  /**
   * Actualiza el filtro de usuarios con las opciones disponibles
   * @param {Array} tasks - Lista de tareas
   */
  updateUserFilter(tasks) {
    const userFilter = document.getElementById('userFilter');
    if (!userFilter || !Array.isArray(tasks)) return;

    // Obtener usuarios únicos
    const users = new Set();
    tasks.forEach(task => {
      if (task.userId) {
        users.add(task.userId);
      }
    });

    // Mantener el valor seleccionado actual
    const currentValue = userFilter.value;

    // Limpiar opciones existentes (excepto "Todos")
    userFilter.innerHTML = '<option value="all">Todos</option>';

    // Agregar opciones de usuarios
    Array.from(users)
      .sort()
      .forEach(userId => {
        const option = document.createElement('option');
        option.value = userId;
        option.textContent = `Usuario ${userId}`;
        userFilter.appendChild(option);
      });

    // Restaurar valor seleccionado si existe
    if (currentValue && Array.from(userFilter.options).some(opt => opt.value === currentValue)) {
      userFilter.value = currentValue;
    }
  }

  /**
   * Muestra un toast de notificación
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de toast (success, error, warning)
   * @param {string} title - Título opcional
   * @param {number} duration - Duración en ms
   */
  showToast(message, type = 'success', title = '', duration = 5000) {
    const toastId = `toast-${++this.toastId}`;
    const container = document.getElementById('toastContainer');

    if (!container) {
      console.warn('Toast container not found');
      return;
    }

    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle'
    };

    const titles = {
      success: title || 'Éxito',
      error: title || 'Error',
      warning: title || 'Advertencia'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = toastId;
    toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${this.escapeHtml(message)}</div>
            </div>
            <button class="toast-close" onclick="uiComponents.closeToast('${toastId}')">
                <i class="fas fa-times"></i>
            </button>
        `;

    container.appendChild(toast);

    // Mostrar toast con animación
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

    // Auto-cerrar después del tiempo especificado
    if (duration > 0) {
      setTimeout(() => {
        this.closeToast(toastId);
      }, duration);
    }

    return toastId;
  }

  /**
   * Cierra un toast específico
   * @param {string} toastId - ID del toast a cerrar
   */
  closeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (!toast) return;

    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  /**
   * Muestra el estado de carga
   * @param {boolean} show - Si mostrar o ocultar
   */
  showLoading(show = true) {
    const elements = {
      loading: document.getElementById('loadingSpinner'),
      content: document.getElementById('tasksContainer'),
      empty: document.getElementById('emptyState'),
      error: document.getElementById('errorState')
    };

    Object.values(elements).forEach(el => {
      if (el) el.classList.remove('show');
    });

    if (show && elements.loading) {
      elements.loading.classList.add('show');
    }
  }

  /**
   * Muestra el estado vacío
   * @param {boolean} show - Si mostrar o ocultar
   */
  showEmptyState(show = true) {
    const elements = {
      loading: document.getElementById('loadingSpinner'),
      content: document.getElementById('tasksContainer'),
      empty: document.getElementById('emptyState'),
      error: document.getElementById('errorState')
    };

    Object.values(elements).forEach(el => {
      if (el) el.classList.remove('show');
    });

    if (show && elements.empty) {
      elements.empty.classList.add('show');
    }

    if (!show && elements.content) {
      elements.content.style.display = 'grid';
    }
  }

  /**
   * Muestra el estado de error
   * @param {string} message - Mensaje de error
   * @param {boolean} show - Si mostrar o ocultar
   */
  showErrorState(message = 'Ha ocurrido un error inesperado', show = true) {
    const elements = {
      loading: document.getElementById('loadingSpinner'),
      content: document.getElementById('tasksContainer'),
      empty: document.getElementById('emptyState'),
      error: document.getElementById('errorState'),
      errorMessage: document.getElementById('errorMessage')
    };

    Object.values(elements).forEach(el => {
      if (el && el.id !== 'errorMessage') el.classList.remove('show');
    });

    if (show) {
      if (elements.error) {
        elements.error.classList.add('show');
      }
      if (elements.errorMessage) {
        elements.errorMessage.textContent = message;
      }
    }
  }

  /**
   * Abre el modal de tarea
   * @param {Object} task - Datos de la tarea (para edición)
   */
  openTaskModal(task = null) {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    const title = document.getElementById('modalTitle');

    if (!modal || !form) return;

    // Resetear formulario
    form.reset();
    this.clearFormErrors();

    if (task) {
      // Modo edición
      title.textContent = 'Editar Tarea';
      document.getElementById('taskId').value = task.id;
      document.getElementById('taskTitle').value = task.title;
      document.getElementById('taskDescription').value = task.description || '';
      document.getElementById('taskUserId').value = task.userId || '';
      document.getElementById('taskCompleted').checked = task.completed;
    } else {
      // Modo creación
      title.textContent = 'Nueva Tarea';
      document.getElementById('taskId').value = '';
      document.getElementById('taskUserId').value = '1'; // Valor por defecto
    }

    modal.classList.add('show');
    document.getElementById('taskTitle').focus();
  }

  /**
   * Cierra el modal de tarea
   */
  closeTaskModal() {
    const modal = document.getElementById('taskModal');
    if (modal) {
      modal.classList.remove('show');
      this.clearFormErrors();
    }
  }

  /**
   * Abre el modal de confirmación de eliminación
   * @param {Object} task - Datos de la tarea a eliminar
   */
  openDeleteModal(task) {
    const modal = document.getElementById('deleteModal');
    const taskTitle = document.getElementById('deleteTaskTitle');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    if (!modal || !task) return;

    if (taskTitle) {
      taskTitle.textContent = task.title;
    }

    if (confirmBtn) {
      confirmBtn.onclick = () => window.confirmDeleteTask(task.id);
    }

    modal.classList.add('show');
  }

  /**
   * Cierra el modal de confirmación de eliminación
   */
  closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  /**
   * Muestra errores de validación en el formulario
   * @param {Object} errors - Objeto con errores de validación
   */
  showFormErrors(errors) {
    this.clearFormErrors();

    Object.keys(errors).forEach(field => {
      const errorElement = document.getElementById(`${field}Error`);
      const inputElement = document.getElementById(
        `task${field.charAt(0).toUpperCase() + field.slice(1)}`
      );

      if (errorElement) {
        errorElement.textContent = errors[field];
      }

      if (inputElement) {
        inputElement.classList.add('error');
      }
    });
  }

  /**
   * Limpia los errores de validación del formulario
   */
  clearFormErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    const inputElements = document.querySelectorAll('.form-input.error, .form-textarea.error');

    errorElements.forEach(el => (el.textContent = ''));
    inputElements.forEach(el => el.classList.remove('error'));
  }

  /**
   * Actualiza el indicador de carga de un botón
   * @param {string} buttonId - ID del botón
   * @param {boolean} loading - Si está cargando
   * @param {string} loadingText - Texto durante la carga
   */
  setButtonLoading(buttonId, loading = true, loadingText = 'Cargando...') {
    const button = document.getElementById(buttonId);
    if (!button) return;

    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.innerHTML;
      button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    } else {
      button.disabled = false;
      if (button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
        delete button.dataset.originalText;
      }
    }
  }

  /**
   * Obtiene el nombre legible del origen de la tarea
   * @param {string} source - Origen de la tarea
   * @returns {string} - Nombre legible
   */
  getSourceName(source) {
    switch (source) {
      case 'external':
        return 'Externa';
      case 'firebase':
        return 'Firebase';
      case 'merged':
        return 'Fusionada';
      default:
        return 'Desconocida';
    }
  }

  /**
   * Escapa caracteres HTML para prevenir XSS
   * @param {string} text - Texto a escapar
   * @returns {string} - Texto escapado
   */
  escapeHtml(text) {
    if (!text) return '';

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Debounce para optimizar búsquedas
   * @param {Function} func - Función a ejecutar
   * @param {number} wait - Tiempo de espera en ms
   * @returns {Function} - Función con debounce
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Confirma una acción antes de ejecutarla
   * @param {string} message - Mensaje de confirmación
   * @param {Function} callback - Función a ejecutar si se confirma
   */
  confirmAction(message, callback) {
    if (confirm(message)) {
      callback();
    }
  }

  /**
   * Copia texto al portapapeles
   * @param {string} text - Texto a copiar
   * @returns {Promise<boolean>} - Si se copió exitosamente
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback para navegadores sin soporte
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        textArea.remove();
        return result;
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }

  /**
   * Formatea un número con separadores de miles
   * @param {number} number - Número a formatear
   * @returns {string} - Número formateado
   */
  formatNumber(number) {
    return new Intl.NumberFormat('es-ES').format(number);
  }

  /**
   * Trunca texto a una longitud específica
   * @param {string} text - Texto a truncar
   * @param {number} maxLength - Longitud máxima
   * @returns {string} - Texto truncado
   */
  truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}

// Crear instancia global de componentes UI
window.uiComponents = new UIComponents();
