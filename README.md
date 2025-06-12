# 📱 Task Management Frontend

Interfaz de usuario moderna y responsive para la gestión de tareas, construida
con tecnologías web estándar.

## 🎯 Características

### ✨ **Funcionalidades**

- **CRUD Completo**: Crear, leer, actualizar y eliminar tareas
- **Filtros Avanzados**: Por estado, origen, usuario y búsqueda de texto
- **Estadísticas en Tiempo Real**: Contadores de tareas totales, completadas y
  pendientes
- **Interfaz Responsive**: Adaptada para desktop, tablet y móvil
- **Notificaciones Toast**: Feedback visual para todas las acciones
- **Auto-refresh**: Actualización automática cada 5 minutos
- **Validación de Formularios**: Validación en tiempo real con mensajes de error

### 🎨 **Diseño**

- **UI Moderna**: Diseño limpio con componentes tipo card
- **Tema Claro**: Colores profesionales y tipografía legible
- **Iconografía**: Font Awesome para iconos consistentes
- **Animaciones Suaves**: Transiciones y hover effects
- **Loading States**: Spinners y skeletons para mejor UX

### 🔧 **Tecnologías**

- **HTML5**: Estructura semántica y accesible
- **CSS3**: Grid, Flexbox, Custom Properties y responsive design
- **JavaScript ES6+**: Módulos, clases, async/await y fetch API
- **Font Awesome**: Iconografía profesional

## 📁 Estructura del Proyecto

```
frontend/
├── index.html              # Página principal
├── styles.css              # Estilos globales
├── js/
│   ├── app.js              # Lógica principal de la aplicación
│   ├── task-service.js     # Servicio para comunicación con API
│   └── ui-components.js    # Componentes y utilidades de UI
└── README.md               # Esta documentación
```

## 🚀 Instalación y Uso

### **Integración con tu Backend Existente**

El frontend está diseñado para funcionar directamente con tu backend Express. Ya
actualicé tu `src/app.ts` para servir los archivos estáticos.

```bash
# Desde la raíz de tu proyecto
npm run dev

# El frontend estará disponible en:
# http://localhost:3000/
```

### **Estructura Esperada**

```
task/                        # Tu proyecto actual
├── src/                     # Backend (ya existe)
├── frontend/                # 👈 NUEVA CARPETA
│   ├── index.html          # Página principal
│   ├── styles.css          # Estilos
│   ├── js/
│   │   ├── task-service.js # Servicio API
│   │   ├── ui-components.js # Componentes UI
│   │   └── app.js          # Aplicación principal
│   └── README.md           # Documentación
├── package.json            # Ya existe
├── .env                    # Ya existe
└── ...                     # Otros archivos existentes
```

## 📱 Uso de la Aplicación

### **Dashboard Principal**

- **Estadísticas**: Vista rápida de todas las métricas importantes
- **Filtros**: Herramientas para encontrar tareas específicas
- **Grid de Tareas**: Visualización en tarjetas de todas las tareas

### **Gestión de Tareas**

#### **Crear Nueva Tarea**

1. Clic en **"Nueva Tarea"**
2. Completar formulario:
   - **Título**: Requerido, máximo 500 caracteres
   - **Descripción**: Opcional, máximo 5000 caracteres
   - **Usuario**: ID del usuario asignado
   - **Estado**: Completada o pendiente
3. Clic en **"Guardar Tarea"**

#### **Editar Tarea**

1. Clic en el ícono **✏️** en la tarjeta de tarea
2. Modificar campos necesarios
3. Clic en **"Guardar Tarea"**

#### **Cambiar Estado**

- Clic en el ícono **✅** para marcar como completada
- Clic en el ícono **↩️** para marcar como pendiente

#### **Eliminar Tarea**

1. Clic en el ícono **🗑️** en la tarjeta de tarea
2. Confirmar eliminación en el modal

### **Filtros y Búsqueda**

#### **Filtros Disponibles**

- **Estado**: Todas, Completadas, Pendientes
- **Origen**: Todos, Externas, Firebase, Fusionadas
- **Usuario**: Filtrar por ID de usuario específico
- **Búsqueda**: Buscar en título, descripción y usuario

#### **Búsqueda de Texto**

- Búsqueda en tiempo real con debounce
- Busca en título, descripción y usuario
- Case-insensitive

### **Keyboard Shortcuts**

- **Escape**: Cerrar modales abiertos
- **Enter**: Enviar formulario (cuando está en foco)

## 🎨 Personalización

### **Colores y Tema**

Editar variables CSS en `styles.css`:

```css
:root {
  --primary-color: #3b82f6; /* Color principal */
  --success-color: #10b981; /* Color de éxito */
  --warning-color: #f59e0b; /* Color de advertencia */
  --danger-color: #ef4444; /* Color de peligro */
  --background-color: #f8fafc; /* Fondo principal */
  --surface-color: #ffffff; /* Fondo de tarjetas */
  --text-primary: #1f2937; /* Texto principal */
  --text-secondary: #6b7280; /* Texto secundario */
  --border-radius: 12px; /* Radio de borde */
}
```

### **Responsive Breakpoints**

```css
/* Tablet */
@media (max-width: 768px) {
}

/* Mobile */
@media (max-width: 480px) {
}
```

## 🔧 API Integration

### **Endpoints Utilizados**

| Método   | Endpoint         | Descripción                |
| -------- | ---------------- | -------------------------- |
| `GET`    | `/api/health`    | Verificar estado de la API |
| `GET`    | `/api/tasks`     | Obtener todas las tareas   |
| `GET`    | `/api/tasks/:id` | Obtener tarea específica   |
| `POST`   | `/api/tasks`     | Crear nueva tarea          |
| `PUT`    | `/api/tasks/:id` | Actualizar tarea           |
| `DELETE` | `/api/tasks/:id` | Eliminar tarea             |

### **Formato de Datos**

#### **Task Object**

```javascript
{
  "id": "123",
  "title": "Título de la tarea",
  "description": "Descripción opcional",
  "completed": false,
  "userId": "1",
  "createdAt": "2024-12-01T10:30:00Z",
  "updatedAt": "2024-12-01T15:45:00Z",
  "source": "external" // external, firebase, merged
}
```

#### **API Response**

```javascript
{
  "success": true,
  "data": [...tasks],
  "meta": {
    "total": 25,
    "external": 20,
    "firebase": 5,
    "merged": 0
  }
}
```

## 🐛 Troubleshooting

### **Problemas Comunes**

#### **Frontend No Se Carga**

```
Cannot GET /
```

**Verificar**:

1. Carpeta `frontend/` existe en la raíz del proyecto
2. Archivo `frontend/index.html` existe
3. Backend ejecutándose correctamente

#### **Tareas No Se Cargan**

```
Error al cargar las tareas
```

**Verificar**:

1. API backend funcionando: http://localhost:3000/api/health
2. Firebase configurado correctamente
3. Console del navegador para errores

#### **Estilos No Se Aplican**

**Verificar**:

1. Archivo `styles.css` en la carpeta `frontend/`
2. Links correctos en `index.html`
3. Sin errores 404 en Network tab

### **Debug y Logging**

Abrir **Developer Tools** (F12) y verificar:

#### **Console**

```javascript
// Ver estado de la aplicación
taskApp.getDetailedStats();

// Ver tareas cargadas
taskApp.tasks;

// Ver filtros actuales
taskApp.currentFilters;

// Probar servicio manualmente
await taskService.getAllTasks();
```

#### **Network Tab**

- Verificar requests a `/api/`
- Revisar códigos de respuesta
- Examinar payloads y responses

## 🚀 Características Avanzadas

### **Auto-refresh**

- Actualización automática cada 5 minutos
- Solo si no hay actividad reciente
- Configurable en `app.js`

### **Filtros Inteligentes**

- Debounce en búsqueda para optimizar rendimiento
- Filtros combinables
- Persistencia durante la sesión

### **Notificaciones Toast**

- Feedback inmediato para todas las acciones
- Auto-dismiss configurable
- Diferentes tipos: success, error, warning

### **Estados de Loading**

- Spinners para operaciones async
- Estados vacíos informativos
- Manejo de errores elegante

## 📊 Performance

### **Optimizaciones Implementadas**

- **Debounce en búsqueda**: Evita requests excesivos
- **Auto-refresh inteligente**: Solo si no hay actividad reciente
- **Loading states**: Feedback visual inmediato
- **Error handling**: Manejo robusto de errores de red
- **Local filtering**: Filtros aplicados en cliente

### **Métricas Recomendadas**

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **First Input Delay**: < 100ms
- **Cumulative Layout Shift**: < 0.1

## 🛡️ Security

### **Medidas Implementadas**

- **XSS Prevention**: Escape de HTML en contenido dinámico
- **Content Security Policy**: Headers de seguridad (configurados en backend)
- **Input Validation**: Validación en frontend y backend
- **Error Handling**: No exposición de información sensible

## 🤝 Contribución

### **Código Style**

- **JavaScript**: ES6+ con async/await
- **CSS**: BEM methodology para clases
- **HTML**: Semántico y accesible
- **Comments**: JSDoc para funciones principales

### **Testing Manual**

```bash
# Pruebas recomendadas
1. Crear, editar, eliminar tareas
2. Probar todos los filtros
3. Verificar responsive design
4. Testear con API desconectada
5. Probar keyboard shortcuts
6. Verificar notificaciones toast
```

---

**¿Preguntas?** Consulta la documentación de la API en `/swagger-ui.html` o
revisa los logs de la consola del navegador.
