'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Usuario {
  id: string;
  Usuario: string;
  Rol: string;
  permanent_reset_token: string | null;
}

export default function ResetPassword() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      if (!token) {
        setError('Token no válido');
        setLoading(false);
        return;
      }

      if (!supabase) {
        throw new Error('No se pudo conectar con la base de datos');
      }

      // Buscar usuario con este token
      const { data, error } = await supabase
        .from('Usuarios')
        .select('id, Usuario, Rol, permanent_reset_token')
        .eq('permanent_reset_token', token)
        .single();

      if (error || !data) {
        setError('Enlace no válido o expirado');
        setLoading(false);
        return;
      }

      setUsuario(data);
      setLoading(false);
    } catch (error: unknown) {
      console.error('Error validating token:', error);
      setError('Error al validar el enlace');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    if (!usuario || !supabase) {
      setError('Error interno del sistema');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Actualizar solo la contraseña del usuario
      const { error } = await supabase
        .from('Usuarios')
        .update({
          password_hash: newPassword
        })
        .eq('id', usuario.id);

      if (error) throw error;

      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (error: unknown) {
      console.error('Error updating password:', error);
      setError('Error al actualizar la contraseña');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9a45c] mx-auto mb-4"></div>
          <p className="text-white">Validando enlace...</p>
        </div>
      </main>
    );
  }

  if (error && !usuario) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-[#1e2538] rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Enlace No Válido</h1>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full px-4 py-2 bg-[#c9a45c] text-white rounded-lg hover:bg-[#d4b06c] transition-all"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-[#1e2538] rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">¡Contraseña Actualizada!</h1>
            <p className="text-gray-300 mb-6">
              Tu contraseña ha sido actualizada exitosamente. Serás redirigido al inicio en unos segundos.
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full px-4 py-2 bg-[#c9a45c] text-white rounded-lg hover:bg-[#d4b06c] transition-all"
            >
              Ir al Inicio Ahora
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center py-8">
      <div className="max-w-md w-full mx-4">
        <div className="bg-[#1e2538] rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#c9a45c]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#c9a45c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Cambiar Contraseña</h1>
            <p className="text-gray-300">
              Usuario: <span className="font-semibold text-[#c9a45c]">{usuario?.Usuario}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a3347] border border-[#3d4659] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c] focus:border-[#c9a45c]"
                  placeholder="Ingresa tu nueva contraseña"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#2a3347] border border-[#3d4659] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c] focus:border-[#c9a45c]"
                placeholder="Confirma tu nueva contraseña"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-[#c9a45c] text-white rounded-lg hover:bg-[#d4b06c] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#3d4659]">
            <button
              onClick={() => router.push('/')}
              className="w-full px-4 py-2 text-gray-400 hover:text-white transition-all text-sm"
            >
              ← Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}