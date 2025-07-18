import { supabase } from './supabase';

/**
 * Servicio para gestionar tokens permanentes de reseteo de contraseña
 * Solo el SuperAdmin puede generar, regenerar o revocar estos tokens
 */

export class ResetTokenService {
  /**
   * Genera un token único y seguro para un usuario
   * @param userId - ID del usuario
   * @returns Token generado
   */
  static generateToken(userId: string): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 15);
    const secret = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-secret';
    
    // Crear un hash simple pero único
    const combined = `${userId}-${timestamp}-${random}-${secret}`;
    const token = btoa(combined).replace(/[+/=]/g, '').substring(0, 32);
    
    return token;
  }

  /**
   * Genera y asigna un token permanente a un usuario
   * @param userId - ID del usuario
   * @returns Token generado o null si hay error
   */
  static async generatePermanentToken(userId: string): Promise<string | null> {
    try {
      if (!supabase) {
        throw new Error('No se pudo conectar con la base de datos');
      }

      const token = this.generateToken(userId);

      const { error } = await supabase
        .from('Usuarios')
        .update({ permanent_reset_token: token })
        .eq('id', userId);

      if (error) throw error;

      return token;
    } catch (error) {
      console.error('Error generating permanent token:', error);
      return null;
    }
  }

  /**
   * Revoca el token permanente de un usuario
   * @param userId - ID del usuario
   * @returns true si se revocó exitosamente
   */
  static async revokePermanentToken(userId: string): Promise<boolean> {
    try {
      if (!supabase) {
        throw new Error('No se pudo conectar con la base de datos');
      }

      const { error } = await supabase
        .from('Usuarios')
        .update({ permanent_reset_token: null })
        .eq('id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error revoking permanent token:', error);
      return false;
    }
  }

  /**
   * Regenera un token permanente para un usuario (revoca el anterior y crea uno nuevo)
   * @param userId - ID del usuario
   * @returns Nuevo token generado o null si hay error
   */
  static async regeneratePermanentToken(userId: string): Promise<string | null> {
    try {
      // Primero revocar el token actual
      await this.revokePermanentToken(userId);
      
      // Luego generar uno nuevo
      return await this.generatePermanentToken(userId);
    } catch (error) {
      console.error('Error regenerating permanent token:', error);
      return null;
    }
  }

  /**
   * Valida si un token existe y es válido
   * @param token - Token a validar
   * @returns Usuario asociado al token o null si no es válido
   */
  static async validateToken(token: string): Promise<any | null> {
    try {
      if (!supabase || !token) {
        return null;
      }

      const { data, error } = await supabase
        .from('Usuarios')
        .select('id, Usuario, Rol, permanent_reset_token')
        .eq('permanent_reset_token', token)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error validating token:', error);
      return null;
    }
  }

  /**
   * Obtiene todos los usuarios con sus tokens (solo para SuperAdmin)
   * @returns Lista de usuarios con información de tokens
   */
  static async getAllUsersWithTokens(): Promise<any[]> {
    try {
      if (!supabase) {
        throw new Error('No se pudo conectar con la base de datos');
      }

      const { data, error } = await supabase
        .from('Usuarios')
        .select('id, Usuario, Rol, permanent_reset_token, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching users with tokens:', error);
      return [];
    }
  }

  /**
   * Genera la URL completa para resetear contraseña
   * @param token - Token del usuario
   * @returns URL completa
   */
  static generateResetUrl(token: string): string {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    return `${baseUrl}/reset-password/${token}`;
  }
}