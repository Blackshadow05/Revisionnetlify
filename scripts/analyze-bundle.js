#!/usr/bin/env node

// 🚀 CODE SPLITTING: Script para analizar el bundle y generar reporte
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando análisis de bundle...\n');

try {
  // Limpiar builds anteriores
  console.log('🧹 Limpiando builds anteriores...');
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { stdio: 'inherit' });
  }

  // Ejecutar build con análisis
  console.log('📦 Construyendo aplicación con análisis...');
  execSync('ANALYZE=true npm run build', { stdio: 'inherit' });

  console.log('\n✅ Análisis completado!');
  console.log('📊 El reporte del bundle se abrirá automáticamente en tu navegador.');
  console.log('\n📋 Métricas clave a revisar:');
  console.log('   • Tamaño del bundle principal');
  console.log('   • Chunks separados por librerías');
  console.log('   • Componentes lazy-loaded');
  console.log('   • Dependencias más pesadas');

} catch (error) {
  console.error('❌ Error durante el análisis:', error.message);
  process.exit(1);
}