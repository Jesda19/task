# Task Management API - Makefile
# Comandos útiles para desarrollo y deployment

.PHONY: help install dev build start test clean docker-build docker-run docker-stop lint format setup-firebase

# Variables
APP_NAME=task-management-api
DOCKER_IMAGE=$(APP_NAME):latest
CONTAINER_NAME=$(APP_NAME)-container
PORT=3000

# Colores para output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
NC=\033[0m # No Color

help: ## Mostrar esta ayuda
	@echo "$(BLUE)Task Management API - Comandos Disponibles$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

install: ## Instalar dependencias
	@echo "$(BLUE)📦 Instalando dependencias...$(NC)"
	npm ci
	@echo "$(GREEN)✅ Dependencias instaladas$(NC)"

dev: ## Ejecutar en modo desarrollo
	@echo "$(BLUE)🚀 Iniciando servidor de desarrollo...$(NC)"
	npm run dev

build: ## Compilar aplicación para producción
	@echo "$(BLUE)🔨 Compilando aplicación...$(NC)"
	npm run build
	@echo "$(GREEN)✅ Compilación completada$(NC)"

start: build ## Iniciar aplicación en modo producción
	@echo "$(BLUE)🚀 Iniciando servidor de producción...$(NC)"
	npm start

test: ## Ejecutar tests
	@echo "$(BLUE)🧪 Ejecutando tests...$(NC)"
	npm test

test-coverage: ## Ejecutar tests con coverage
	@echo "$(BLUE)🧪 Ejecutando tests con coverage...$(NC)"
	npm run test:coverage

lint: ## Ejecutar linter
	@echo "$(BLUE)🔍 Ejecutando linter...$(NC)"
	npm run lint

format: ## Formatear código
	@echo "$(BLUE)✨ Formateando código...$(NC)"
	npm run format

clean: ## Limpiar archivos generados
	@echo "$(BLUE)🧹 Limpiando archivos...$(NC)"
	rm -rf dist/
	rm -rf node_modules/
	rm -rf coverage/
	rm -f *.log
	@echo "$(GREEN)✅ Limpieza completada$(NC)"

setup-env: ## Configurar archivo de entorno
	@echo "$(BLUE)⚙️  Configurando entorno...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(YELLOW)📝 Archivo .env creado desde .env.example$(NC)"; \
		echo "$(YELLOW)⚠️  Por favor, edita .env con tus configuraciones$(NC)"; \
	else \
		echo "$(GREEN)✅ Archivo .env ya existe$(NC)"; \
	fi

setup-firebase: ## Ayuda para configurar Firebase
	@echo "$(BLUE)🔥 Configuración de Firebase$(NC)"
	@echo ""
	@echo "$(YELLOW)1. Ve a https://console.firebase.google.com/$(NC)"
	@echo "$(YELLOW)2. Crea un nuevo proyecto o selecciona uno existente$(NC)"
	@echo "$(YELLOW)3. Habilita Cloud Firestore$(NC)"
	@echo "$(YELLOW)4. Ve a Configuración > Cuentas de servicio$(NC)"
	@echo "$(YELLOW)5. Genera una nueva clave privada$(NC)"
	@echo "$(YELLOW)6. Descarga el archivo JSON$(NC)"
	@echo "$(YELLOW)7. Guárdalo como 'firebase-service-account.json'$(NC)"
	@echo "$(YELLOW)8. Actualiza tu archivo .env$(NC)"
	@echo ""

# Docker commands
docker-build: ## Construir imagen Docker
	@echo "$(BLUE)🐳 Construyendo imagen Docker...$(NC)"
	docker build -t $(DOCKER_IMAGE) .
	@echo "$(GREEN)✅ Imagen Docker construida: $(DOCKER_IMAGE)$(NC)"

docker-run: docker-build ## Ejecutar contenedor Docker
	@echo "$(BLUE)🐳 Ejecutando contenedor Docker...$(NC)"
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p $(PORT):3000 \
		--env-file .env \
		$(DOCKER_IMAGE)
	@echo "$(GREEN)✅ Contenedor ejecutándose en http://localhost:$(PORT)$(NC)"

docker-stop: ## Detener contenedor Docker
	@echo "$(BLUE)🐳 Deteniendo contenedor Docker...$(NC)"
	@docker stop $(CONTAINER_NAME) 2>/dev/null || true
	@docker rm $(CONTAINER_NAME) 2>/dev/null || true
	@echo "$(GREEN)✅ Contenedor detenido$(NC)"

docker-logs: ## Ver logs del contenedor
	@echo "$(BLUE)🐳 Logs del contenedor:$(NC)"
	docker logs -f $(CONTAINER_NAME)

docker-compose-up: ## Ejecutar con Docker Compose
	@echo "$(BLUE)🐳 Iniciando con Docker Compose...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Servicios iniciados$(NC)"

docker-compose-down: ## Detener Docker Compose
	@echo "$(BLUE)🐳 Deteniendo Docker Compose...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Servicios detenidos$(NC)"

docker-compose-dev: ## Ejecutar en modo desarrollo con Docker Compose
	@echo "$(BLUE)🐳 Iniciando desarrollo con Docker Compose...$(NC)"
	docker-compose --profile development up -d
	@echo "$(GREEN)✅ Desarrollo iniciado$(NC)"

# Health checks
health-check: ## Verificar salud de la aplicación
	@echo "$(BLUE)🏥 Verificando salud de la aplicación...$(NC)"
	@curl -s http://localhost:$(PORT)/api/health | jq . || \
		echo "$(RED)❌ Aplicación no disponible en puerto $(PORT)$(NC)"

api-test: ## Probar endpoints básicos
	@echo "$(BLUE)🧪 Probando endpoints básicos...$(NC)"
	@echo "$(YELLOW)GET /api/health:$(NC)"
	@curl -s http://localhost:$(PORT)/api/health | jq .
	@echo ""
	@echo "$(YELLOW)GET /api/tasks:$(NC)"
	@curl -s http://localhost:$(PORT)/api/tasks | jq '.data[0:3]' || true
	@echo ""

# Development helpers
install-dev: ## Instalación completa para desarrollo
	@$(MAKE) clean
	@$(MAKE) install
	@$(MAKE) setup-env
	@echo "$(GREEN)✅ Entorno de desarrollo configurado$(NC)"
	@echo "$(YELLOW)🔥 No olvides configurar Firebase con: make setup-firebase$(NC)"

deploy-check: ## Verificar preparación para deploy
	@echo "$(BLUE)🚀 Verificando preparación para deploy...$(NC)"
	@npm run build
	@npm run lint
	@npm test
	@echo "$(GREEN)✅ Aplicación lista para deploy$(NC)"

# Monitoring
monitor: ## Monitorear aplicación en ejecución
	@echo "$(BLUE)📊 Monitoreando aplicación...$(NC)"
	@while true; do \
		echo "$(YELLOW)$$(date): Health check...$(NC)"; \
		curl -s http://localhost:$(PORT)/api/health | jq '.status' || echo "$(RED)❌ Error$(NC)"; \
		sleep 30; \
	done

# Backup
backup-env: ## Hacer backup del archivo .env
	@echo "$(BLUE)💾 Haciendo backup de .env...$(NC)"
	@if [ -f .env ]; then \
		cp .env .env.backup.$$(date +%Y%m%d_%H%M%S); \
		echo "$(GREEN)✅ Backup creado$(NC)"; \
	else \
		echo "$(RED)❌ No se encontró archivo .env$(NC)"; \
	fi

# Quick start
quick-start: install-dev ## Inicio rápido (instalación + desarrollo)
	@echo "$(GREEN)🎉 Iniciando aplicación...$(NC)"
	@$(MAKE) dev