/**
 * Script para configurar Firebase Firestore con datos iniciales
 * Ejecutar: node scripts/setup-firebase.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Configurar Firebase Admin SDK
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

// Datos de ejemplo para la colección tasks
const sampleTasks = [
  {
    title: "Configurar Firebase",
    description: "Establecer la base de datos y autenticación",
    completed: true,
    userId: "1",
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    title: "Implementar API REST",
    description: "Crear endpoints para operaciones CRUD",
    completed: true,
    userId: "1",
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    title: "Integrar servicios externos",
    description: "Conectar con JSONPlaceholder API",
    completed: false,
    userId: "2",
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    title: "Documentar API con Swagger",
    description: "Crear documentación completa de la API",
    completed: false,
    userId: "1",
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    title: "Dockerizar aplicación",
    description: "Crear Dockerfile y configurar contenedores",
    completed: false,
    userId: "3",
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  }
];

// Función para configurar la colección tasks
async function setupTasksCollection() {
  try {
    console.log('🔥 Configurando colección "tasks" en Firebase...');
    
    // Verificar si la colección ya tiene datos
    const existingTasks = await db.collection('tasks').get();
    
    if (!existingTasks.empty) {
      console.log(`⚠️  La colección ya tiene ${existingTasks.size} documentos.`);
      const answer = await askQuestion('¿Deseas eliminar los datos existentes y crear nuevos? (y/N): ');
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ Operación cancelada.');
        return;
      }
      
      // Eliminar documentos existentes
      const batch = db.batch();
      existingTasks.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log('🗑️  Datos existentes eliminados.');
    }
    
    // Agregar tareas de ejemplo
    const batch = db.batch();
    
    sampleTasks.forEach(task => {
      const docRef = db.collection('tasks').doc();
      batch.set(docRef, task);
    });
    
    await batch.commit();
    
    console.log('✅ Colección "tasks" configurada exitosamente!');
    console.log(`📝 Se agregaron ${sampleTasks.length} tareas de ejemplo.`);
    
    // Mostrar algunas tareas creadas
    const createdTasks = await db.collection('tasks').limit(3).get();
    console.log('\n📋 Tareas de ejemplo creadas:');
    createdTasks.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   • ${data.title} (${data.completed ? '✅' : '⏳'})`);
    });
    
  } catch (error) {
    console.error('❌ Error configurando Firebase:', error);
    process.exit(1);
  }
}

// Función para configurar índices
async function setupIndexes() {
  console.log('\n🔍 Configurando índices...');
  
  // Los índices se crean automáticamente cuando se realizan queries
  // Pero podemos crear algunos consultas para generar los índices necesarios
  try {
    // Query por userId
    await db.collection('tasks').where('userId', '==', '1').limit(1).get();
    
    // Query por completed
    await db.collection('tasks').where('completed', '==', false).limit(1).get();
    
    // Query ordenado por createdAt
    await db.collection('tasks').orderBy('createdAt', 'desc').limit(1).get();
    
    console.log('✅ Índices básicos inicializados.');
    console.log('💡 Los índices compuestos se crearán automáticamente según las consultas.');
    
  } catch (error) {
    console.log('⚠️  Algunos índices requieren configuración manual en Firebase Console.');
  }
}

// Función para verificar configuración
async function verifySetup() {
  console.log('\n🔍 Verificando configuración...');
  
  try {
    // Verificar conexión
    const testDoc = await db.collection('tasks').limit(1).get();
    console.log('✅ Conexión a Firestore exitosa.');
    
    // Verificar operaciones CRUD
    const testTaskRef = db.collection('tasks').doc();
    await testTaskRef.set({
      title: 'TEST_TASK_DELETE_ME',
      completed: false,
      userId: 'test',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });
    
    const createdDoc = await testTaskRef.get();
    if (createdDoc.exists) {
      console.log('✅ Operación CREATE verificada.');
    }
    
    await testTaskRef.update({
      completed: true,
      updatedAt: admin.firestore.Timestamp.now()
    });
    console.log('✅ Operación UPDATE verificada.');
    
    await testTaskRef.delete();
    console.log('✅ Operación DELETE verificada.');
    
    // Verificar query
    const queryResult = await db.collection('tasks')
      .where('completed', '==', false)
      .limit(1)
      .get();
    console.log('✅ Operación QUERY verificada.');
    
    console.log('\n🎉 ¡Firebase está completamente configurado y funcionando!');
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

// Función para mostrar información de configuración
function showConfiguration() {
  console.log('\n📋 Información de configuración:');
  console.log('='.repeat(50));
  console.log(`🏷️  Proyecto ID: ${serviceAccount.project_id}`);
  console.log(`📧 Client Email: ${serviceAccount.client_email}`);
  console.log(`🔑 Private Key ID: ${serviceAccount.private_key_id}`);
  console.log('\n🌍 Variables de entorno necesarias:');
  console.log(`FIREBASE_PROJECT_ID=${serviceAccount.project_id}`);
  console.log(`FIREBASE_CLIENT_EMAIL=${serviceAccount.client_email}`);
  console.log(`FIREBASE_PRIVATE_KEY_ID=${serviceAccount.private_key_id}`);
  console.log('FIREBASE_PRIVATE_KEY="[la clave privada completa]"');
  console.log('\n💡 O simplemente usa:');
  console.log('GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json');
}

// Función helper para input de usuario
function askQuestion(question) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Función principal
async function main() {
  console.log('🚀 Configuración de Firebase para Task Management API');
  console.log('='.repeat(60));
  
  try {
    showConfiguration();
    
    const proceed = await askQuestion('\n¿Continuar con la configuración? (Y/n): ');
    if (proceed.toLowerCase() === 'n' || proceed.toLowerCase() === 'no') {
      console.log('❌ Configuración cancelada.');
      process.exit(0);
    }
    
    await setupTasksCollection();
    await setupIndexes();
    await verifySetup();
    
    console.log('\n🎯 Próximos pasos:');
    console.log('1. Copia el archivo firebase-service-account.json a tu proyecto');
    console.log('2. Configura las variables de entorno en tu archivo .env');
    console.log('3. Ejecuta tu aplicación: npm run dev');
    console.log('4. Prueba el endpoint: http://localhost:3000/api/tasks');
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  setupTasksCollection,
  setupIndexes,
  verifySetup
};