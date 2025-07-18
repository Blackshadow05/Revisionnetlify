// Archivo de configuraci�n personalizado para Tailwind CSS v4 con registro de errores
const logger = require('./logger');

try {
  logger.log('Iniciando configuraci�n de Tailwind CSS v4');
  
  // Intentar cargar Tailwind CSS
  const tailwindcss = require('tailwindcss');
  logger.log(Versi�n de Tailwind CSS cargada: );
  
  // Intentar cargar el plugin de PostCSS
  const postcssPlugin = require('@tailwindcss/postcss');
  logger.log('Plugin de PostCSS para Tailwind CSS v4 cargado correctamente');
  
  // Registrar la configuraci�n actual
  const config = {
    content: [
      './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    plugins: [],
  };
  
  logger.log(Configuraci�n de Tailwind CSS: );
  
  module.exports = config;
} catch (error) {
  logger.error('Error al configurar Tailwind CSS v4', error);
  
  // Configuraci�n de respaldo
  module.exports = {
    content: [
      './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    plugins: [],
  };
}
