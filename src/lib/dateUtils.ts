/**
 * Utilidades para el manejo de fechas en la aplicación
 */

/**
 * Extrae y formatea fechas del texto del menú
 * @param textoMenu Texto del menú escaneado
 * @returns Fecha en formato YYYY-MM-DD (asumiendo año 2026)
 */
export function extraerFechaMenu(textoMenu: string): string {
  // Patrones comunes de fechas en menús (sin año)
  const patronesFecha = [
    /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi,
    /(\d{1,2})\s+al\s+(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi,
    /(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\s+(\d{1,2})/gi,
    /semana\s+del\s+(\d{1,2})\s+al\s+(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi
  ];
  
  // Mapeo de nombres de meses a números
  const meses: Record<string, string> = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08', 
    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
  };
  
  // Año actual (2026)
  const año = 2026;
  
  // Buscar fechas en el texto
  for (const patron of patronesFecha) {
    const coincidencias = textoMenu.matchAll(patron);
    for (const coincidencia of Array.from(coincidencias)) {
      // Procesar según el tipo de patrón
      if (coincidencia[2] && meses[coincidencia[2].toLowerCase()]) {
        // Patrón: "15 de julio"
        const dia = coincidencia[1].padStart(2, '0');
        const mes = meses[coincidencia[2].toLowerCase()];
        return `${año}-${mes}-${dia}`;
      } else if (coincidencia[3] && meses[coincidencia[3].toLowerCase()]) {
        // Patrón: "10 al 15 de julio" o "semana del 10 al 15 de julio" - tomamos la primera fecha
        const dia = coincidencia[1].padStart(2, '0');
        const mes = meses[coincidencia[3].toLowerCase()];
        return `${año}-${mes}-${dia}`;
      }
    }
  }
  
  // Si no se encuentra una fecha específica, usar la fecha actual
  const hoy = new Date();
  return `${año}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}-${hoy.getDate().toString().padStart(2, '0')}`;
}

/**
 * Formatea una fecha para mostrar en la interfaz
 * @param fecha Fecha en formato YYYY-MM-DD
 * @returns Fecha formateada en español (ej: "15 de julio de 2026")
 */
export function formatearFecha(fecha: string): string {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  // Parsear la fecha manualmente para evitar problemas de zona horaria
  const [año, mesNum, dia] = fecha.split('-').map(Number);
  const mes = meses[mesNum - 1];
  
  return `${dia} de ${mes} de ${año}`;
}
