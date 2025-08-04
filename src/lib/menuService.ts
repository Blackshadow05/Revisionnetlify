import { supabase } from './supabase';
import { extraerFechaMenu } from './dateUtils';
import { extraerMenusDiarios, MenuDiario } from './menuParser';

/**
 * Interfaz para el objeto de menú semanal
 */
export interface Menu {
  id?: string;
  fecha_menu: string;
  contenido_menu: string;
  fecha_escaneo?: string;
  nombre_menu?: string;
  activo?: boolean;
  created_at?: string;
  dias_menu?: MenuDiario[];
}

/**
 * Interfaz para el objeto de menú diario en la base de datos
 */
export interface MenuDiarioDB {
  id?: string;
  fecha: string;
  dia_semana: string;
  comidas: string[];
  menu_semanal_id: string;
  created_at?: string;
}

/**
 * Guarda un menú escaneado en la base de datos
 * @param contenidoMenu Texto del menú escaneado
 * @param nombreMenu Nombre opcional para el menú
 * @returns Objeto con datos del menú guardado o error
 */
export async function guardarMenu(contenidoMenu: string, nombreMenu?: string): Promise<{ data: Menu | null; error: any }> {
  try {
    // Extraer fecha del texto del menú para el menú semanal
    const fechaMenu = extraerFechaMenu(contenidoMenu);
    
    // Extraer los menús diarios del texto
    const menusDiarios = extraerMenusDiarios(contenidoMenu);
    
    // Preparar datos para insertar el menú semanal
    const menuData: Menu = {
      fecha_menu: fechaMenu,
      contenido_menu: contenidoMenu,
      nombre_menu: nombreMenu || `Menú escaneado ${new Date().toLocaleDateString('es-ES')}`,
      activo: true
    };
    
    // Insertar el menú semanal en Supabase
    const { data: menuSemanal, error: errorSemanal } = await supabase
      .from('menus')
      .insert(menuData)
      .select()
      .single();
      
    if (errorSemanal) {
      console.error('Error al guardar el menú semanal:', errorSemanal);
      return { data: null, error: errorSemanal };
    }
    
    // Si se encontraron menús diarios, guardarlos
    if (menusDiarios.length > 0 && menuSemanal?.id) {
      // Preparar datos para insertar los menús diarios
      const menusDiariosData = menusDiarios.map(menu => ({
        fecha: menu.fecha,
        dia_semana: menu.dia_semana,
        comidas: menu.comidas,
        menu_semanal_id: menuSemanal.id
      }));
      
      // Insertar los menús diarios en Supabase
      const { error: errorDiarios } = await supabase
        .from('menu_diario')
        .insert(menusDiariosData);
        
      if (errorDiarios) {
        console.error('Error al guardar los menús diarios:', errorDiarios);
        // No retornamos error aquí, ya que el menú semanal se guardó correctamente
      }
      
      // Agregar los menús diarios al resultado
      return { 
        data: { ...menuSemanal, dias_menu: menusDiarios },
        error: null 
      };
    }
    
    return { data: menuSemanal, error: null };
  } catch (error) {
    console.error('Error inesperado al guardar el menú:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene todos los menús guardados
 * @param soloActivos Si es true, solo devuelve menús activos
 * @returns Lista de menús o error
 */
export async function obtenerMenus(soloActivos = true): Promise<{ data: Menu[] | null; error: any }> {
  try {
    let query = supabase
      .from('menus')
      .select('*')
      .order('fecha_menu', { ascending: false });
      
    if (soloActivos) {
      query = query.eq('activo', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error al obtener menús:', error);
      return { data: null, error };
    }
    
    // Para cada menú, obtener sus menús diarios
    if (data && data.length > 0) {
      const menusConDias = await Promise.all(data.map(async (menu) => {
        const { data: menusDiarios } = await supabase
          .from('menu_diario')
          .select('*')
          .eq('menu_semanal_id', menu.id)
          .order('fecha', { ascending: true });
          
        return {
          ...menu,
          dias_menu: menusDiarios || []
        };
      }));
      
      return { data: menusConDias, error: null };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error inesperado al obtener menús:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene un menú por su ID
 * @param id ID del menú a obtener
 * @returns Objeto con datos del menú o error
 */
export async function obtenerMenuPorId(id: string): Promise<{ data: Menu | null; error: any }> {
  try {
    // Obtener el menú semanal
    const { data: menu, error: errorMenu } = await supabase
      .from('menus')
      .select('*')
      .eq('id', id)
      .single();
      
    if (errorMenu) {
      console.error('Error al obtener el menú:', errorMenu);
      return { data: null, error: errorMenu };
    }
    
    // Obtener los menús diarios asociados
    const { data: menusDiarios, error: errorDiarios } = await supabase
      .from('menu_diario')
      .select('*')
      .eq('menu_semanal_id', id)
      .order('fecha', { ascending: true });
      
    if (errorDiarios) {
      console.error('Error al obtener los menús diarios:', errorDiarios);
      // No retornamos error aquí, ya que el menú semanal se obtuvo correctamente
    }
    
    return { 
      data: { ...menu, dias_menu: menusDiarios || [] }, 
      error: null 
    };
  } catch (error) {
    console.error('Error inesperado al obtener el menú:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene el menú de un día específico por fecha
 * @param fecha Fecha en formato YYYY-MM-DD
 * @returns Objeto con datos del menú diario o error
 */
export async function obtenerMenuPorFecha(fecha: string): Promise<{ data: MenuDiarioDB | null; error: any }> {
  try {
    // Obtener el menú diario por fecha
    const { data, error } = await supabase
      .from('menu_diario')
      .select('*')
      .eq('fecha', fecha)
      .single();
      
    if (error) {
      console.error(`Error al obtener el menú para la fecha ${fecha}:`, error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Error inesperado al obtener el menú para la fecha ${fecha}:`, error);
    return { data: null, error };
  }
}

/**
 * Actualiza el estado activo de un menú
 * @param id ID del menú a actualizar
 * @param activo Nuevo estado activo
 * @returns Objeto con datos del menú actualizado o error
 */
export async function actualizarEstadoMenu(id: string, activo: boolean): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from('menus')
      .update({ activo })
      .eq('id', id);
      
    if (error) {
      console.error(`Error al actualizar estado del menú con ID ${id}:`, error);
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error(`Error inesperado al actualizar estado del menú con ID ${id}:`, error);
    return { success: false, error };
  }
}
