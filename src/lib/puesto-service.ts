import { supabase } from './supabase';
import { PuestoRecord, PuestoDataItem, mapToDatabase, mapFromDatabase } from '@/types/puesto';

// NOTA: Nombre exacto de la tabla en Supabase
const TABLE_NAME = 'Puesto_01'; // Nombre real de la tabla

export class PuestoService {
  // Obtener todos los registros
  static async getAllRecords(): Promise<PuestoDataItem[]> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error al obtener registros:', error);
        throw new Error(`Error al cargar los datos: ${error.message}`);
      }

      return data ? data.map(mapFromDatabase) : [];
    } catch (error) {
      console.error('Error en getAllRecords:', error);
      throw error;
    }
  }

  // Crear un nuevo registro
  static async createRecord(item: Omit<PuestoDataItem, 'id'>): Promise<PuestoDataItem> {
    try {
      const dbRecord = mapToDatabase({ ...item, id: 0 });
      
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([dbRecord])
        .select()
        .single();

      if (error) {
        console.error('Error al crear registro:', error);
        throw new Error(`Error al guardar: ${error.message}`);
      }

      return mapFromDatabase(data);
    } catch (error) {
      console.error('Error en createRecord:', error);
      throw error;
    }
  }

  // Actualizar un registro existente
  static async updateRecord(id: number, item: Omit<PuestoDataItem, 'id'>): Promise<PuestoDataItem> {
    try {
      const dbRecord = mapToDatabase({ ...item, id });
      
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(dbRecord)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar registro:', error);
        throw new Error(`Error al actualizar: ${error.message}`);
      }

      return mapFromDatabase(data);
    } catch (error) {
      console.error('Error en updateRecord:', error);
      throw error;
    }
  }

  // Eliminar un registro
  static async deleteRecord(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar registro:', error);
        throw new Error(`Error al eliminar: ${error.message}`);
      }
    } catch (error) {
      console.error('Error en deleteRecord:', error);
      throw error;
    }
  }

  // Obtener un registro por ID
  static async getRecordById(id: number): Promise<PuestoDataItem | null> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Registro no encontrado
        }
        console.error('Error al obtener registro:', error);
        throw new Error(`Error al cargar el registro: ${error.message}`);
      }

      return data ? mapFromDatabase(data) : null;
    } catch (error) {
      console.error('Error en getRecordById:', error);
      throw error;
    }
  }

  // Buscar registros por rango de fechas
  static async getRecordsByDateRange(fechaDesde: string, fechaHasta: string): Promise<PuestoDataItem[]> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .gte('Fecha', fechaDesde)
        .lte('Fecha', fechaHasta)
        .order('Fecha', { ascending: true });
      if (error) {
        console.error('Error al buscar por rango de fechas:', error);
        throw new Error(`Error al buscar registros: ${error.message}`);
      }
      return data ? data.map(mapFromDatabase) : [];
    } catch (error) {
      console.error('Error en getRecordsByDateRange:', error);
      throw error;
    }
  }

  // Buscar registros por fecha
  static async getRecordsByDate(fecha: string): Promise<PuestoDataItem[]> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('Fecha', fecha)
        .order('id', { ascending: false });

      if (error) {
        console.error('Error al buscar por fecha:', error);
        throw new Error(`Error al buscar registros: ${error.message}`);
      }

      return data ? data.map(mapFromDatabase) : [];
    } catch (error) {
      console.error('Error en getRecordsByDate:', error);
      throw error;
    }
  }

  // Verificar conexión con la tabla
  static async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .select('id')
        .limit(1);

      if (error) {
        console.error('Error de conexión con la tabla:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error al verificar conexión:', error);
      return false;
    }
  }
}
