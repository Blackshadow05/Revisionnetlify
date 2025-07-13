'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  isLoggedIn: boolean;
  userRole: string | null;
  user: string | null;
  isLoading: boolean;
  login: (usuario: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 🚀 Verificar sesión con manejo de SSR y producción
    const checkAuthStatus = async () => {
      try {
        // Verificar si estamos en el cliente
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }

        // Pequeño delay para evitar problemas de hidratación
        await new Promise(resolve => setTimeout(resolve, 50));

        const storedSession = localStorage.getItem('userSession');
        if (storedSession) {
          try {
            const { usuario, role, timestamp } = JSON.parse(storedSession);
            
            // Verificar que la sesión no sea muy antigua (24 horas)
            const now = new Date().getTime();
            const sessionAge = now - timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 horas
            
            if (sessionAge < maxAge) {
              console.log('✅ Sesión válida encontrada:', usuario);
              setIsLoggedIn(true);
              setUserRole(role);
              setUser(usuario);
            } else {
              console.warn('⚠️ Sesión expirada, limpiando...');
              localStorage.removeItem('userSession');
            }
          } catch (parseError) {
            console.error('❌ Error parsing session:', parseError);
            localStorage.removeItem('userSession');
          }
        } else {
          console.log('ℹ️ No hay sesión guardada');
        }
      } catch (error) {
        console.error('❌ Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (usuario: string, password: string) => {
    try {
      if (!supabase) {
        throw new Error('No se pudo conectar con la base de datos');
      }

      const { data: userData, error } = await supabase
        .from('Usuarios')
        .select('Usuario, Rol, password_hash')
        .eq('Usuario', usuario)
        .single();

      if (error) throw error;

      if (!userData) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar la contraseña
      if (userData.password_hash !== password) {
        throw new Error('Contraseña incorrecta');
      }

      // Guardar la sesión en localStorage
      const sessionData = {
        usuario: userData.Usuario,
        role: userData.Rol,
        timestamp: new Date().getTime()
      };
      localStorage.setItem('userSession', JSON.stringify(sessionData));

      setIsLoggedIn(true);
      setUserRole(userData.Rol);
      setUser(userData.Usuario);
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('userSession');
    setIsLoggedIn(false);
    setUserRole(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userRole, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
} 