/**
 * Utilidades para procesar y extraer información de menús
 */

/**
 * Interfaz para un día de menú
 */
export interface MenuDiario {
  fecha: string;       // Fecha en formato YYYY-MM-DD
  dia_semana: string;  // Nombre del día (Lunes, Martes, etc.)
  comidas: string[];   // Lista de comidas para ese día
}

/**
 * Extrae los días y comidas de un texto de menú
 * @param textoMenu Texto completo del menú
 * @returns Array de objetos MenuDiario
 */
export function procesarMenuDiario(textoMenu: string): MenuDiario[] {
  const resultado: MenuDiario[] = [];
  
  // Expresión regular para encontrar días con formato "Día DD de Mes"
  // Captura: grupo 1 = día semana, grupo 2 = número día, grupo 3 = mes
  const regexDia = /\*\*([\wáéíóúÁÉÍÓÚüÜñÑ]+)\s+(\d{1,2})\s+de\s+([\wáéíóúÁÉÍÓÚüÜñÑ]+)\*\*/gi;
  
  // Mapeo de nombres de meses a números
  const meses: Record<string, string> = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08', 
    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
  };
  
  // Año actual (2025)
  const año = 2025;
  
  // Dividir el texto en secciones por día
  const secciones = textoMenu.split(/\*\*[^*]+\*\*/);
  
  // Extraer los encabezados de días
  const encabezados = textoMenu.match(regexDia) || [];
  
  // Procesar cada sección (ignoramos la primera que suele ser la introducción)
  for (let i = 0; i < encabezados.length; i++) {
    // Obtener el encabezado actual
    const encabezado = encabezados[i];
    
    // Extraer información del día usando regex
    const regexInfo = /\*\*([\wáéíóúÁÉÍÓÚüÜñÑ]+)\s+(\d{1,2})\s+de\s+([\wáéíóúÁÉÍÓÚüÜñÑ]+)\*\*/i;
    const infoMatch = encabezado.match(regexInfo);
    
    if (infoMatch) {
      const diaSemana = infoMatch[1].trim();
      const diaMes = infoMatch[2].padStart(2, '0');
      const mes = infoMatch[3].toLowerCase();
      
      // Crear fecha en formato YYYY-MM-DD
      const fecha = `${año}-${meses[mes] || '01'}-${diaMes}`;
      
      // Obtener el contenido de la sección (el texto después del encabezado)
      const contenido = i + 1 < secciones.length ? secciones[i + 1] : '';
      
      // Extraer las comidas (elementos con formato de lista)
      const comidas = contenido
        .split('*')
        .map(item => item.trim())
        .filter(item => item && item !== '\n' && !item.startsWith('**'));
      
      // Añadir al resultado
      resultado.push({
        fecha,
        dia_semana: diaSemana,
        comidas
      });
    }
  }
  
  return resultado;
}

/**
 * Función alternativa para procesar menús con formato diferente
 * @param textoMenu Texto del menú
 * @returns Array de objetos MenuDiario
 */
export function procesarMenuAlternativo(textoMenu: string): MenuDiario[] {
  const resultado: MenuDiario[] = [];
  
  // Dividir el texto por líneas
  const lineas = textoMenu.split('\n');
  
  // Variables para seguimiento
  let diaActual: string | null = null;
  let fechaActual: string | null = null;
  let comidasActuales: string[] = [];
  
  // Expresiones regulares
  const regexDia = /^\s*\*?\*?([Ll]unes|[Mm]artes|[Mm]i[ée]rcoles|[Jj]ueves|[Vv]iernes|[Ss][áa]bado|[Dd]omingo)\s+(\d{1,2})\s+de\s+([Ee]nero|[Ff]ebrero|[Mm]arzo|[Aa]bril|[Mm]ayo|[Jj]unio|[Jj]ulio|[Aa]gosto|[Ss]eptiembre|[Oo]ctubre|[Nn]oviembre|[Dd]iciembre)\*?\*?/;
  const regexComida = /^\s*\*\s+(.+)$/;
  
  // Mapeo de nombres de meses a números
  const meses: Record<string, string> = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08', 
    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
  };
  
  // Año actual (2025)
  const año = 2025;
  
  // Procesar cada línea
  for (const linea of lineas) {
    // Verificar si es un encabezado de día
    const matchDia = linea.match(regexDia);
    
    if (matchDia) {
      // Si ya teníamos un día en proceso, guardarlo
      if (diaActual && fechaActual && comidasActuales.length > 0) {
        resultado.push({
          fecha: fechaActual,
          dia_semana: diaActual,
          comidas: comidasActuales
        });
      }
      
      // Iniciar nuevo día
      diaActual = matchDia[1].charAt(0).toUpperCase() + matchDia[1].slice(1).toLowerCase();
      const diaMes = matchDia[2].padStart(2, '0');
      const mes = matchDia[3].toLowerCase();
      fechaActual = `${año}-${meses[mes] || '01'}-${diaMes}`;
      comidasActuales = [];
    } else {
      // Verificar si es un elemento de comida
      const matchComida = linea.match(regexComida);
      
      if (matchComida && diaActual) {
        comidasActuales.push(matchComida[1].trim());
      }
    }
  }
  
  // Guardar el último día procesado
  if (diaActual && fechaActual && comidasActuales.length > 0) {
    resultado.push({
      fecha: fechaActual,
      dia_semana: diaActual,
      comidas: comidasActuales
    });
  }
  
  return resultado;
}

/**
 * Procesa el texto del menú utilizando múltiples estrategias
 * @param textoMenu Texto del menú
 * @returns Array de objetos MenuDiario
 */
export function extraerMenusDiarios(textoMenu: string): MenuDiario[] {
  // Intentar con el primer método
  let resultado = procesarMenuDiario(textoMenu);
  
  // Si no se encontraron días, intentar con el método alternativo
  if (resultado.length === 0) {
    resultado = procesarMenuAlternativo(textoMenu);
  }
  
  return resultado;
}
