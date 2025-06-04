# Multi-stage build para optimizar el tamaño de la imagen

# Etapa 1: Build
FROM node:18-alpine AS builder

# Metadatos
LABEL maintainer="Tu Nombre <tu.email@ejemplo.com>"
LABEL description="Task Management API - Build Stage"

# Instalar dependencias necesarias para el build
RUN apk add --no-cache python3 make g++

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar todas las dependencias (incluidas las de desarrollo)
RUN npm ci --only=production=false

# Copiar código fuente
COPY src/ ./src/

# Compilar TypeScript a JavaScript
RUN npm run build

# Limpiar dependencias de desarrollo
RUN npm prune --production

# Etapa 2: Runtime
FROM node:18-alpine AS runtime

# Metadatos para la imagen final
LABEL maintainer="Tu Nombre <tu.email@ejemplo.com>"
LABEL description="Task Management API - Production Image"
LABEL version="1.0.0"

# Instalar dumb-init para un mejor manejo de señales
RUN apk add --no-cache dumb-init

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S taskapi -u 1001

# Crear directorio de trabajo
WORKDIR /app

# Cambiar propietario del directorio de trabajo
RUN chown -R taskapi:nodejs /app
USER taskapi

# Copiar archivos compilados desde la etapa de build
COPY --from=builder --chown=taskapi:nodejs /app/dist ./dist
COPY --from=builder --chown=taskapi:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=taskapi:nodejs /app/package*.json ./

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: process.env.PORT || 3000, path: '/api/health', timeout: 2000 }; \
    const request = http.request(options, (res) => { \
        if (res.statusCode === 200) process.exit(0); \
        else process.exit(1); \
    }); \
    request.on('error', () => process.exit(1)); \
    request.end();"

# Comando de inicio con dumb-init para mejor manejo de señales
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]

# Información adicional
LABEL org.opencontainers.image.title="Task Management API"
LABEL org.opencontainers.image.description="API de gestión de tareas con integración Firebase y servicios externos"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/tu-usuario/task-management-api"
LABEL org.opencontainers.image.documentation="https://github.com/tu-usuario/task-management-api/blob/main/README.md"