// Utilidad simple para registrar errores y mensajes de depuración

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(process.cwd(), 'tailwind-debug.log');

// Asegurarse de que el archivo de log existe
try {
  fs.writeFileSync(LOG_FILE, '--- TAILWIND CSS DEBUG LOG ---\n', { flag: 'a' });
} catch (error) {
  console.error('Error al crear archivo de log:', error);
}

const logger = {
  log: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = [] INFO: \n;
    
    console.log(logMessage);
    
    try {
      fs.appendFileSync(LOG_FILE, logMessage);
    } catch (error) {
      console.error('Error al escribir en el archivo de log:', error);
    }
  },
  
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    const errorStack = error?.stack || 'No stack trace';
    const logMessage = [] ERROR: \n\n\n;
    
    console.error(logMessage);
    
    try {
      fs.appendFileSync(LOG_FILE, logMessage);
    } catch (err) {
      console.error('Error al escribir en el archivo de log:', err);
    }
  }
};

module.exports = logger;
