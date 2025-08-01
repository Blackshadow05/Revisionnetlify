'use client';

// Forzar nueva ejecución del workflow
// Página de gestión de usuarios - Permite crear, editar y eliminar usuarios del sistema
// Solo accesible para usuarios con rol SuperAdmin

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ResetTokenService } from '@/lib/reset-token-service';


interface Usuario {
  id: string | null;
  Usuario: string;
  password_hash: string;
  Rol: string;
  created_at: string;
  permanent_reset_token: string | null;
}

export default function GestionUsuarios() {
  const router = useRouter();
  const { userRole } = useAuth();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevoUsuario, setNuevoUsuario] = useState<Omit<Usuario, 'id' | 'created_at'>>({
    Usuario: '',
    password_hash: '',
    Rol: '',
    permanent_reset_token: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (!userRole) {
          console.log('Esperando carga del rol...');
          return;
        }

        console.log('Rol actual:', userRole);
        
        if (userRole !== 'SuperAdmin') {
          console.log('Acceso denegado: Rol no autorizado');
          router.push('/');
          return;
        }

        await fetchUsuarios();
      } catch (error) {
        console.error('Error al verificar acceso:', error);
        setError('Error al verificar permisos de acceso');
      }
    };

    checkAccess();
  }, [userRole, router]);

  const fetchUsuarios = async () => {
    try {
      if (!supabase) {
        throw new Error('No se pudo conectar con la base de datos');
      }

      console.log('Iniciando fetch de usuarios...');
      const { data, error } = await supabase
        .from('Usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error en la consulta:', error);
        throw error;
      }

      console.log('Usuarios obtenidos:', data?.length);
      setUsuarios(data || []);
    } catch (error: any) {
      console.error('Error al cargar usuarios:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('No se pudo conectar con la base de datos');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (isEditing && editingId) {
        // Actualizar usuario existente
        const { error } = await supabase
          .from('Usuarios')
          .update({
            Usuario: nuevoUsuario.Usuario,
            password_hash: nuevoUsuario.password_hash,
            Rol: nuevoUsuario.Rol
          })
          .eq('id', editingId);

        if (error) throw error;
        console.log('Usuario actualizado correctamente');
      } else {
        // Crear nuevo usuario
        const { error } = await supabase
          .from('Usuarios')
          .insert([{
            Usuario: nuevoUsuario.Usuario,
            password_hash: nuevoUsuario.password_hash,
            Rol: nuevoUsuario.Rol,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
        console.log('Usuario creado correctamente');
      }

      setNuevoUsuario({
        Usuario: '',
        password_hash: '',
        Rol: '',
        permanent_reset_token: null
      });
      setIsEditing(false);
      setEditingId(null);
      setError(null);
      await fetchUsuarios();
    } catch (error: any) {
      console.error('Error al procesar usuario:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setNuevoUsuario({
      Usuario: usuario.Usuario,
      password_hash: '', // Campo vacío al editar
      Rol: usuario.Rol,
      permanent_reset_token: usuario.permanent_reset_token
    });
    setIsEditing(true);
    setEditingId(usuario.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsHighlighting(true);
    setTimeout(() => setIsHighlighting(false), 2000);
  };

  const handleDelete = (usuario: Usuario) => {
    setUsuarioToDelete(usuario);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!usuarioToDelete?.id) return;

    if (!supabase) {
      setError('No se pudo conectar con la base de datos');
      return;
    }

    try {
      const { error } = await supabase
        .from('Usuarios')
        .delete()
        .eq('id', usuarioToDelete.id);

      if (error) throw error;
      await fetchUsuarios();
      setShowDeleteModal(false);
      setUsuarioToDelete(null);
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      setError(error.message);
    }
  };

  const handleCancel = () => {
    setNuevoUsuario({
      Usuario: '',
      password_hash: '',
      Rol: '',
      permanent_reset_token: null
    });
    setIsEditing(false);
    setEditingId(null);
  };

  // Funciones para gestionar tokens permanentes
  const handleGenerateToken = async (usuario: Usuario) => {
    if (!usuario.id) return;
    
    setSelectedUser(usuario);
    setTokenLoading(true);
    setShowTokenModal(true);
    
    try {
      const token = await ResetTokenService.generatePermanentToken(usuario.id);
      if (token) {
        setGeneratedToken(token);
        await fetchUsuarios(); // Refrescar la lista
      } else {
        setError('Error al generar el token');
      }
    } catch (error) {
      console.error('Error generating token:', error);
      setError('Error al generar el token');
    } finally {
      setTokenLoading(false);
    }
  };

  const handleRegenerateToken = async (usuario: Usuario) => {
    if (!usuario.id) return;
    
    setSelectedUser(usuario);
    setTokenLoading(true);
    setShowTokenModal(true);
    
    try {
      const token = await ResetTokenService.regeneratePermanentToken(usuario.id);
      if (token) {
        setGeneratedToken(token);
        await fetchUsuarios(); // Refrescar la lista
      } else {
        setError('Error al regenerar el token');
      }
    } catch (error) {
      console.error('Error regenerating token:', error);
      setError('Error al regenerar el token');
    } finally {
      setTokenLoading(false);
    }
  };

  const handleRevokeToken = async (usuario: Usuario) => {
    if (!usuario.id) return;
    
    if (!confirm(`¿Estás seguro de que deseas revocar el enlace de reseteo para ${usuario.Usuario}?`)) {
      return;
    }
    
    try {
      const success = await ResetTokenService.revokePermanentToken(usuario.id);
      if (success) {
        await fetchUsuarios(); // Refrescar la lista
      } else {
        setError('Error al revocar el token');
      }
    } catch (error) {
      console.error('Error revoking token:', error);
      setError('Error al revocar el token');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      // Intentar usar la API moderna de clipboard primero
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showCopyFeedback();
        return;
      }
      
      // Fallback para móviles y contextos no seguros
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        showCopyFeedback();
      } catch (err) {
        console.error('Error copying text: ', err);
        // Mostrar el texto en un alert como último recurso
        alert(`Copia este enlace manualmente:\n\n${text}`);
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Error copying to clipboard: ', err);
      // Mostrar el texto en un alert como último recurso
      alert(`Copia este enlace manualmente:\n\n${text}`);
    }
  };

  const showCopyFeedback = () => {
    // Mostrar feedback visual
    const button = document.activeElement as HTMLButtonElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = '¡Copiado!';
      button.style.backgroundColor = '#10b981'; // Verde
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = ''; // Restaurar color original
      }, 2000);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Cargando...</div>;
  if (error) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-500">Error: {error}</div>;

  return (
    <main className="min-h-screen bg-slate-900 py-8">
      {/* Modal para mostrar token generado */}
      {showTokenModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1e2538] rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#c9a45c]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#c9a45c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Enlace de Reseteo Generado
              </h3>
              <p className="text-gray-300 mb-4">
                Para: <span className="font-semibold text-[#c9a45c]">{selectedUser.Usuario}</span>
              </p>
            </div>

            {tokenLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9a45c] mx-auto mb-4"></div>
                <p className="text-gray-300">Generando enlace...</p>
              </div>
            ) : generatedToken ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Enlace Permanente:
                  </label>
                  <div className="bg-[#2a3347] border border-[#3d4659] rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ResetTokenService.generateResetUrl(generatedToken)}
                        readOnly
                        className="flex-1 bg-transparent text-gray-300 text-sm focus:outline-none"
                      />
                      <button
                        onClick={() => copyToClipboard(ResetTokenService.generateResetUrl(generatedToken))}
                        className="px-3 py-1 bg-[#c9a45c] text-white rounded hover:bg-[#d4b06c] transition-all text-sm"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-300">
                      <p className="font-medium mb-1">Información importante:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Este enlace es permanente hasta que lo revoques</li>
                        <li>• Solo permite cambiar la contraseña, no el usuario</li>
                        <li>• Comparte este enlace de forma segura</li>
                        <li>• Puedes regenerar o revocar este enlace en cualquier momento</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-red-400">Error al generar el enlace</p>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTokenModal(false);
                  setSelectedUser(null);
                  setGeneratedToken(null);
                }}
                className="px-4 py-2 bg-[#3d4659] text-gray-300 rounded-lg hover:bg-[#4a5568] transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && usuarioToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-[#1e2538] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">¿Eliminar Usuario?</h3>
              <p className="text-gray-300">
                ¿Estás seguro de que deseas eliminar el usuario <span className="font-semibold text-[#c9a45c]">{usuarioToDelete.Usuario}</span>?
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUsuarioToDelete(null);
                }}
                className="px-4 py-2 bg-[#3d4659] text-gray-300 rounded-lg hover:bg-[#4a5568] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4">
        <div className={`bg-[#1e2538] rounded-lg shadow-xl p-6 border-2 ${isHighlighting ? 'border-[#c9a45c]' : 'border-transparent'} transition-colors duration-1000`}>
          <div className="flex items-center mb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-white bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 rounded-xl hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl relative overflow-hidden border border-gray-600/40 hover:border-gray-500/60 font-medium flex items-center justify-center gap-2"
              style={{ padding: '10px 18px' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0cb35]/80 to-transparent animate-[slide_2s_ease-in-out_infinite] z-0"></div>
              <div className="relative z-10 flex items-center gap-2">
                ← Volver
              </div>
            </button>
            <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4 mb-6">
            <div className="col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Usuario</label>
              <input
                type="text"
                required
                value={nuevoUsuario.Usuario}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, Usuario: e.target.value })}
                className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-[#2a3347] border border-[#3d4659] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c] text-sm sm:text-base"
              />
            </div>
            <div className="col-span-1">
              <div className="mb-4">
                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={nuevoUsuario.password_hash}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password_hash: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[#2a3347] border border-[#3d4659] text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]"
                    placeholder="Contraseña"
                    required={!isEditing}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Rol</label>
              <select
                required
                value={nuevoUsuario.Rol}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, Rol: e.target.value })}
                className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-[#2a3347] border border-[#3d4659] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c] text-sm sm:text-base"
              >
                <option value="">Seleccionar rol</option>
                <option value="SuperAdmin">SuperAdmin</option>
                <option value="admin">admin</option>
                <option value="user">user</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex flex-col sm:flex-row justify-end gap-2 mt-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all transform hover:scale-[1.02] shadow-[0_8px_16px_rgb(0_0_0/0.2)] hover:shadow-[0_12px_24px_rgb(0_0_0/0.3)] relative overflow-hidden border border-red-500/20 hover:border-red-400/40"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all transform hover:scale-[1.02] shadow-[0_8px_16px_rgb(0_0_0/0.2)] hover:shadow-[0_12px_24px_rgb(0_0_0/0.3)] relative overflow-hidden border-2 border-white/40 hover:border-white/60"
              >
                {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Usuario' : 'Crear Usuario')}
              </button>
            </div>
          </form>
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}
          {/* Tabla solo visible en escritorio/tablet */}
          <div className="overflow-x-auto rounded-md mt-4 hidden sm:block">
            <table className="w-full min-w-[500px] text-sm sm:text-base">
              <thead>
                <tr className="bg-[#2a3347]">
                  <th className="px-2 sm:px-4 py-2 text-left text-gray-300 whitespace-nowrap">Usuario</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-gray-300 whitespace-nowrap">Rol</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-gray-300 whitespace-nowrap">Enlace Reset</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-gray-300 whitespace-nowrap">Fecha de Creación</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-gray-300 whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b border-[#3d4659]">
                    <td className="px-2 sm:px-4 py-2 text-gray-300 whitespace-nowrap">{usuario.Usuario}</td>
                    <td className="px-2 sm:px-4 py-2 text-gray-300 whitespace-nowrap">{usuario.Rol}</td>
                    <td className="px-2 sm:px-4 py-2">
                      <div className="flex flex-col gap-1">
                        {usuario.permanent_reset_token ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setSelectedUser(usuario);
                                setGeneratedToken(usuario.permanent_reset_token);
                                setShowTokenModal(true);
                              }}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-all"
                              title="Ver enlace existente"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => handleRegenerateToken(usuario)}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-all"
                              title="Regenerar enlace"
                            >
                              Regenerar
                            </button>
                            <button
                              onClick={() => handleRevokeToken(usuario)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-all"
                              title="Revocar enlace"
                            >
                              Revocar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleGenerateToken(usuario)}
                            className="px-2 py-1 bg-[#c9a45c] text-white rounded text-xs hover:bg-[#d4b06c] transition-all"
                            title="Generar enlace de reseteo"
                          >
                            Generar
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-2 text-gray-300 whitespace-nowrap text-xs">{new Date(usuario.created_at).toLocaleDateString()}</td>
                    <td className="px-2 sm:px-4 py-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleEdit(usuario)}
                          className="w-full sm:w-auto px-3 py-1 bg-[#c9a45c] text-white rounded hover:bg-[#d4b06c] transition-all text-xs sm:text-sm md:text-base"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(usuario)}
                          className="w-full sm:w-auto px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-all text-xs sm:text-sm md:text-base"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards solo visibles en móvil */}
          <div className="block sm:hidden mt-4 space-y-4">
            {usuarios.map((usuario) => (
              <div key={usuario.id} className="bg-[#232c41] rounded-lg shadow p-4 flex flex-col gap-3 border border-[#3d4659]">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#c9a45c]">Usuario:</span>
                  <span className="text-gray-300">{usuario.Usuario}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#c9a45c]">Rol:</span>
                  <span className="text-gray-300">{usuario.Rol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#c9a45c]">Creado:</span>
                  <span className="text-gray-300 text-xs">{new Date(usuario.created_at).toLocaleDateString()}</span>
                </div>
                
                {/* Sección de Enlace Reset */}
                <div className="border-t border-[#3d4659] pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-[#c9a45c]">Enlace Reset:</span>
                    <span className="text-gray-300 text-xs">
                      {usuario.permanent_reset_token ? 'Activo' : 'No generado'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {usuario.permanent_reset_token ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedUser(usuario);
                            setGeneratedToken(usuario.permanent_reset_token);
                            setShowTokenModal(true);
                          }}
                          className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-all"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleRegenerateToken(usuario)}
                          className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-all"
                        >
                          Regenerar
                        </button>
                        <button
                          onClick={() => handleRevokeToken(usuario)}
                          className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-all"
                        >
                          Revocar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleGenerateToken(usuario)}
                        className="w-full px-2 py-1 bg-[#c9a45c] text-white rounded text-xs hover:bg-[#d4b06c] transition-all"
                      >
                        Generar Enlace
                      </button>
                    )}
                  </div>
                </div>

                {/* Acciones principales */}
                <div className="flex gap-2 mt-2 border-t border-[#3d4659] pt-3">
                  <button
                    onClick={() => handleEdit(usuario)}
                    className="w-full px-3 py-1 bg-[#c9a45c] text-white rounded hover:bg-[#d4b06c] transition-all text-xs"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(usuario)}
                    className="w-full px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-all text-xs"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}