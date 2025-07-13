// Tipos para la tabla de Puesto 01 en Supabase
export interface PuestoRecord {
  id?: number;
  Nombre: string;
  Casita: string;
  Detalle: string;
  Tipo: 'Tour' | 'Check in' | 'Check out' | 'Outside Guest';
  Placa: string;
  Hora_ingreso: string;
  Hora_salida: string;
  Oficial_ingreso: string;
  Oficial_salida: string;
  Fecha: string;
}

// Tipo para el mapeo entre la interfaz web y la base de datos
export interface PuestoDataItem {
  id: number;
  nombre: string;
  casita: string;
  detalle: string;
  tipo: 'Tour' | 'Check in' | 'Check out' | 'Outside Guest';
  placa: string;
  horaIngreso: string;
  oficialIngreso: string;
  horaSalida: string;
  oficialSalida: string;
  fecha: string;
}

// Función para convertir de la interfaz web a la base de datos
export const mapToDatabase = (item: PuestoDataItem): Omit<PuestoRecord, 'id'> => {
  const mapped = {
    Nombre: item.nombre,
    Casita: item.casita,
    Detalle: item.detalle,
    Tipo: item.tipo,
    Placa: item.placa,
    Hora_ingreso: item.horaIngreso,
    Hora_salida: item.horaSalida,
    Oficial_ingreso: item.oficialIngreso,
    Oficial_salida: item.oficialSalida,
    Fecha: item.fecha,
  };
  return mapped;
};

// Función para convertir de la base de datos a la interfaz web
export const mapFromDatabase = (record: PuestoRecord): PuestoDataItem => ({
  id: record.id || 0,
  nombre: record.Nombre,
  casita: record.Casita,
  detalle: record.Detalle,
  tipo: record.Tipo,
  placa: record.Placa,
  horaIngreso: record.Hora_ingreso,
  oficialIngreso: record.Oficial_ingreso,
  horaSalida: record.Hora_salida,
  oficialSalida: record.Oficial_salida,
  fecha: record.Fecha,
});
