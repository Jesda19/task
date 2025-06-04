/**
 * Script para configurar variables de entorno automáticamente
 * Lee el archivo firebase-service-account.json y genera el .env
 * Ejecutar: node scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Paths de archivos
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../firebase-service-account.json');
const ENV_EXAMPLE_PATH = path.join(__dirname, '../.env.example');
const ENV_PATH = path.join(__dirname, '../.env');

// Función para hacer preguntas al usuario
function askQuestion(question, defaultValue = '') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    const prompt = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
    rl.question(prompt, answer => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

// Función para leer el archivo de service account
function readServiceAccount() {
  try {
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      console.log('❌ No se encontró firebase-service-account.json');
      console.log('📥 Descarga el archivo desde Firebase Console:');
      console.log('   1. Ve a Configuración del proyecto > Cuentas de servicio');
      console.log('   2. Haz clic en "Generar nueva clave privada"');
      console.log('   3. Guarda el archivo como firebase-service-account.json');
      return null;
    }
    
    const data = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error leyendo firebase-service-account.json:', error.message);
    return null;
  }
}

// Función para leer el .env.example
function readEnvExample() {
  try {
    if (!fs.existsSync(ENV_EXAMPLE_PATH)) {
      console.log('⚠️  No se encontró .env.example, usando configuración por defecto');
      return '';
    }
    return fs.readFileSync(ENV_EXAMPLE_PATH, 'utf8');
  } catch (error) {
    console.error('❌ Error leyendo .env.example:', error.message);
    return '';
  }
}

// Función para generar el contenido del .env
function generateEnvContent(serviceAccount, envExample, userInputs) {
  let envContent = '';
  
  // Agregar header
  envContent += '# Task Management API - Environment Configuration\n';
  envContent += `# Generated on: ${new Date().toISOString()}\n\n`;
  
  // Configuración del servidor
  envContent += '# Server Configuration\n';
  envContent += `NODE_ENV=${userInputs.nodeEnv}\n`;
  envContent += `PORT=${userInputs.port}\n\n`;
  
  // Configuración de Firebase
  envContent += '# Firebase Configuration\n';
  if (userInputs.useServiceAccountFile) {
    envContent += 'GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json\n';
    envContent += `FIREBASE_PROJECT_ID=${serviceAccount.project_id}\n\n`;
  } else {
    envContent += `FIREBASE_PROJECT_ID=${serviceAccount.project_id}\n`;
    envContent += `FIREBASE_PRIVATE_KEY_ID=${serviceAccount.private_key_id}\n`;
    envContent += `FIREBASE_PRIVATE_KEY="${serviceAccount.private_key}"\n`;
    envContent += `FIREBASE_CLIENT_EMAIL=${serviceAccount.client_email}\n`;
    envContent += `FIREBASE_CLIENT_ID=${serviceAccount.client_id}\n\n`;
  }
  
  // Configuración de CORS
  envContent += '# CORS Configuration\n';
  envContent += `ALLOWED_ORIGINS=${userInputs.allowedOrigins}\n\n`;
  
  // Configuración de API Externa
  envContent += '# External API Configuration\n';
  envContent += `EXTERNAL_API_URL=${userInputs.externalApiUrl}\n`;
  envContent += `EXTERNAL_API_TIMEOUT=${userInputs.apiTimeout}\n\n`;
  
  // Rate Limiting
  envContent += '# Rate Limiting\n';
  envContent += `RATE_LIMIT_WINDOW=${userInputs.rateLimitWindow}\n`;
  envContent += `RATE_LIMIT_MAX=${userInputs.rateLimitMax}\n\n`;
  
  // Logging
  envContent += '# Logging\n';
  envContent += `LOG_LEVEL=${userInputs.logLevel}\n`;
  
  return envContent;
}

// Función para validar configuración de Firebase
async function validateFirebaseConfig(serviceAccount) {
  console.log('\n🔍 Validando configuración de Firebase...');
  
  try {
    // Verificar campos requeridos
    const requiredFields = ['project_id', 'private_key', 'client_email', 'client_id', 'private_key_id'];
    const missingFields = requiredFields.filter(field => !serviceAccount[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Campos faltantes en service account:', missingFields.join(', '));
      return false;
    }
    
    // Verificar formato de la clave privada
    if (!serviceAccount.private_key.includes('BEGIN PRIVATE KEY')) {
      console.log('❌ Formato de clave privada inválido');
      return false;
    }
    
    // Verificar formato del email
    if (!serviceAccount.client_email.includes('@') || !serviceAccount.client_email.includes('.iam.gserviceaccount.com')) {
      console.log('❌ Formato de client_email inválido');
      return false;
    }
    
    console.log('✅ Configuración de Firebase válida');
    return true;
  } catch (error) {
    console.error('❌ Error validando configuración:', error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 Configuración automática de variables de entorno');
  console.log('='.repeat(60));
  
  try {
    // Leer service account
    const serviceAccount = readServiceAccount();
    if (!serviceAccount) {
      process.exit(1);
    }
    
    // Validar configuración
    const isValid = await validateFirebaseConfig(serviceAccount);
    if (!isValid) {
      process.exit(1);
    }
    
    console.log('\n📋 Información del proyecto Firebase:');
    console.log(`   🏷️  Project ID: ${serviceAccount.project_id}`);
    console.log(`   📧 Client Email: ${serviceAccount.client_email}`);
    console.log(`   🔑 Private Key ID: ${serviceAccount.private_key_id}`);
    
    // Verificar si ya existe .env
    if (fs.existsSync(ENV_PATH)) {
      const overwrite = await askQuestion('\n⚠️  El archivo .env ya existe. ¿Sobrescribir? (y/N)', 'n');
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('❌ Operación cancelada.');
        process.exit(0);
      }
    }
    
    // Recopilar inputs del usuario
    console.log('\n📝 Configuración del entorno:');
    
    const userInputs = {
      nodeEnv: await askQuestion('Entorno (development/production)', 'development'),
      port: await askQuestion('Puerto del servidor', '3000'),
      useServiceAccountFile: (await askQuestion('¿Usar archivo de service account? (y/N)', 'y')).toLowerCase() === 'y',
      allowedOrigins: await askQuestion('Orígenes permitidos para CORS', 'http://localhost:3000,http://localhost:3001'),
      externalApiUrl: await askQuestion('URL de API externa', 'https://jsonplaceholder.typicode.com'),
      apiTimeout: await askQuestion('Timeout de API (ms)', '10000'),
      rateLimitWindow: await askQuestion('Ventana de rate limiting (ms)', '900000'),
      rateLimitMax: await askQuestion('Máximo requests por ventana', userInputs?.nodeEnv === 'production' ? '100' : '1000'),
      logLevel: await askQuestion('Nivel de logging', userInputs?.nodeEnv === 'production' ? 'info' : 'debug')
    };
    
    // Generar contenido del .env
    const envExample = readEnvExample();
    const envContent = generateEnvContent(serviceAccount, envExample, userInputs);
    
    // Escribir archivo .env
    fs.writeFileSync(ENV_PATH, envContent);
    
    console.log('\n✅ Archivo .env creado exitosamente!');
    console.log('\n📁 Archivos configurados:');
    console.log('   • firebase-service-account.json ✅');
    console.log('   • .env ✅');
    
    // Mostrar próximos pasos
    console.log('\n🎯 Próximos pasos:');
    console.log('1. Ejecuta: npm install');
    console.log('2. Configura Firebase: node scripts/setup-firebase.js');
    console.log('3. Inicia la aplicación: npm run dev');
    console.log('4. Prueba la API: http://localhost:' + userInputs.port + '/api/health');
    
    // Advertencias de seguridad
    console.log('\n🛡️  Notas de seguridad:');
    console.log('• No subas firebase-service-account.json a Git');
    console.log('• No subas .env a Git');
    console.log('• Usa variables de entorno en producción');
    console.log('• Configura reglas de seguridad en Firebase Console');
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
    process.exit(1);
  }
}

// Función para mostrar ayuda
function showHelp() {
  console.log('📖 Uso del script de configuración:');
  console.log('');
  console.log('node scripts/setup-env.js');
  console.log('');
  console.log('Pre-requisitos:');
  console.log('• firebase-service-account.json descargado desde Firebase Console');
  console.log('• Node.js instalado');
  console.log('');
  console.log('El script configurará automáticamente:');
  console.log('• Variables de entorno en .env');
  console.log('• Configuración de Firebase');
  console.log('• Configuración del servidor');
  console.log('• Configuración de seguridad básica');
}

// Verificar argumentos de línea de comandos
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}