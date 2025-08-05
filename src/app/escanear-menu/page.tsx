'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { analyzeMenuImage } from '@/lib/gemini';
import { guardarMenu } from '@/lib/menuService';
import { extraerFechaMenu, formatearFecha } from '@/lib/dateUtils';
import { extraerMenusDiarios, MenuDiario } from '@/lib/menuParser';
import { supabase } from '@/lib/supabase';

export default function EscanearMenu() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savingDayIndex, setSavingDayIndex] = useState<number | null>(null);
  const [menuData, setMenuData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [menuGuardado, setMenuGuardado] = useState(false);
  const [fechaDetectada, setFechaDetectada] = useState<string | null>(null);
  const [menusDiarios, setMenusDiarios] = useState<MenuDiario[]>([]);
  const [confirmReplace, setConfirmReplace] = useState<{show: boolean, dia: MenuDiario | null, index: number | null, isGeneral: boolean}>({show: false, dia: null, index: null, isGeneral: false});
  const [pendingMenus, setPendingMenus] = useState<{dia: MenuDiario, index: number}[]>([]);
  const [isReplacing, setIsReplacing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMenuData(null);
      setError(null);
      setSuccess(null);
      setMenuGuardado(false);
      setFechaDetectada(null);
      setMenusDiarios([]);
    }
  };

  // Función para verificar si existe un menú en una fecha específica
  const checkExistingMenu = async (fecha: string) => {
    try {
      const { data, error } = await supabase
        .from('menus')
        .select('id, fecha_menu, contenido_menu')
        .eq('fecha_menu', fecha)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      return data; // null si no existe, objeto si existe
    } catch (err) {
      console.error('Error al verificar menú existente:', err);
      return null;
    }
  };

  const handleScanMenu = async () => {
    if (!selectedImage) {
      setError('Por favor selecciona una imagen primero');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setMenuData(null);
    setMenusDiarios([]);

    try {
      const result = await analyzeMenuImage(selectedImage);
      setMenuData(result);
      
      // Detectar fecha del menú
      if (result.texto) {
        const fecha = extraerFechaMenu(result.texto);
        setFechaDetectada(fecha);
        
        // Extraer los menús diarios del texto
        const diasMenu = extraerMenusDiarios(result.texto);
        setMenusDiarios(diasMenu);
      }
    } catch (err) {
      console.error('Error al escanear el menú:', err);
      setError('Error al escanear el menú. Por favor intenta con otra imagen.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGuardarMenu = async () => {
    if (!menuData?.texto || menusDiarios.length === 0) {
      setError('No hay menús diarios para guardar');
      return;
    }
    
    // Verificar duplicados antes de comenzar
    const duplicates = [];
    for (const dia of menusDiarios) {
      const existing = await checkExistingMenu(dia.fecha);
      if (existing) {
        duplicates.push(dia);
      }
    }
    
    if (duplicates.length > 0) {
      // Mostrar confirmación para todos los duplicados
      setConfirmReplace({
        show: true,
        dia: null, // null indica que es para todos
        index: null,
        isGeneral: true
      });
      setPendingMenus(menusDiarios.map((dia, index) => ({dia, index})));
      return;
    }
    
    // Si no hay duplicados, proceder normalmente
    await executeGeneralSave(false);
  };
  
  const executeGeneralSave = async (forceReplace: boolean) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    const diasGuardados: string[] = [];
    const diasErrores: string[] = [];
    const diasActualizados: string[] = [];
    
    for (let index = 0; index < menusDiarios.length; index++) {
      const dia = menusDiarios[index];
      
      // Activar el botón específico del día
      setSavingDayIndex(index);
      
      try {
        const contenidoMenu = {
          dia_semana: dia.dia_semana,
          fecha: dia.fecha,
          comidas: dia.comidas
        };
        
        // Verificar si existe y decidir acción
        const existingMenu = await checkExistingMenu(dia.fecha);
        let result;
        
        if (existingMenu && forceReplace) {
          // Actualizar registro existente
          result = await supabase
            .from('menus')
            .update({
              contenido_menu: JSON.stringify(contenidoMenu)
            })
            .eq('fecha_menu', dia.fecha);
          diasActualizados.push(dia.dia_semana);
        } else if (!existingMenu) {
          // Insertar nuevo registro
          result = await supabase
            .from('menus')
            .insert([
              {
                fecha_menu: dia.fecha,
                contenido_menu: JSON.stringify(contenidoMenu)
              }
            ]);
          diasGuardados.push(dia.dia_semana);
        } else {
          // Existe pero no se va a reemplazar, saltar
          continue;
        }
        
        if (result.error) {
          throw result.error;
        }
        
      } catch (err) {
        console.error(`Error al guardar ${dia.dia_semana}:`, err);
        diasErrores.push(dia.dia_semana);
      }
      
      // Esperar 2 segundos antes de continuar con el siguiente día
      if (index < menusDiarios.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    setSavingDayIndex(null);
    setIsLoading(false);
    
    // Mostrar resumen de resultados
    const totalSuccess = diasGuardados.length + diasActualizados.length;
    if (diasErrores.length === 0) {
      let message = `¡Menú procesado correctamente! `;
      if (diasGuardados.length > 0) {
        message += `Guardados: ${diasGuardados.join(', ')}. `;
      }
      if (diasActualizados.length > 0) {
        message += `Actualizados: ${diasActualizados.join(', ')}.`;
      }
      setSuccess(message);
    } else {
      setError(`Procesamiento parcial: ${totalSuccess} días procesados, ${diasErrores.length} días con error (${diasErrores.join(', ')})`);
    }
    
    setMenuGuardado(true);
  };

  const handleGuardarMenuDia = async (dia: MenuDiario, index: number, forceReplace: boolean = false) => {
    setSavingDayIndex(index);
    setError(null);
    setSuccess(null);
    
    try {
      // Verificar si ya existe un menú para esta fecha
      if (!forceReplace) {
        const existingMenu = await checkExistingMenu(dia.fecha);
        if (existingMenu) {
          // Mostrar diálogo de confirmación
          setConfirmReplace({
            show: true,
            dia: dia,
            index: index,
            isGeneral: false
          });
          setSavingDayIndex(null);
          return;
        }
      }
      
      const contenidoMenu = {
        dia_semana: dia.dia_semana,
        fecha: dia.fecha,
        comidas: dia.comidas
      };
      
      let result;
      if (forceReplace) {
        // Actualizar el registro existente
        result = await supabase
          .from('menus')
          .update({
            contenido_menu: JSON.stringify(contenidoMenu)
          })
          .eq('fecha_menu', dia.fecha);
      } else {
        // Insertar nuevo registro
        result = await supabase
          .from('menus')
          .insert([
            {
              fecha_menu: dia.fecha,
              contenido_menu: JSON.stringify(contenidoMenu)
            }
          ]);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      const action = forceReplace ? 'actualizado' : 'guardado';
      setSuccess(`¡Menú del ${dia.dia_semana} (${formatearFecha(dia.fecha)}) ${action} correctamente!`);
    } catch (err) {
      console.error('Error al guardar el menú del día:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al guardar el menú del ${dia.dia_semana}: ${errorMessage}`);
    } finally {
      setSavingDayIndex(null);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setMenuData(null);
    setError(null);
    setSuccess(null);
    setMenuGuardado(false);
    setFechaDetectada(null);
    setMenusDiarios([]);
    setConfirmReplace({show: false, dia: null, index: null, isGeneral: false});
    setPendingMenus([]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Funciones para manejar confirmaciones de reemplazo
  const handleConfirmReplace = async () => {
    setIsReplacing(true);
    if (confirmReplace.isGeneral) {
      // Reemplazar todos los menús
      await executeGeneralSave(true);
    } else if (confirmReplace.dia && confirmReplace.index !== null) {
      // Reemplazar un menú específico
      await handleGuardarMenuDia(confirmReplace.dia, confirmReplace.index, true);
    }
    setIsReplacing(false);
    setConfirmReplace({show: false, dia: null, index: null, isGeneral: false});
    setPendingMenus([]);
  };
  
  const handleCancelReplace = () => {
    setConfirmReplace({show: false, dia: null, index: null, isGeneral: false});
    setPendingMenus([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Escanear Menú
          </h1>
          <Link 
            href="/menus" 
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-purple-500/30 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Ver Menús
          </Link>
        </div>
        <p className="text-gray-400 mb-8 text-center">
          Selecciona una imagen del menú para extraer la información automáticamente
        </p>

        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-6 mb-8">
          <div className="mb-6">
            <label className="block text-lg font-medium mb-3 text-gray-200">
              Seleccionar imagen del menú
            </label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-3 file:px-4
                file:rounded-xl file:border-0
                file:text-sm file:font-semibold
                file:bg-gradient-to-r file:from-green-600 file:to-emerald-700
                file:text-white hover:file:from-green-500 hover:file:to-emerald-600
                file:cursor-pointer file:transition-all"
            />
            
            <p className="mt-2 text-sm text-gray-500">
              Formatos soportados: JPG, PNG, WEBP
            </p>
          </div>
          


          {previewUrl && (
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-3 text-gray-200">Vista previa</h2>
              <div className="flex justify-center">
                <img 
                  src={previewUrl} 
                  alt="Vista previa del menú" 
                  className="max-h-96 rounded-xl border border-gray-700 shadow-lg object-contain"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={handleScanMenu}
              disabled={!selectedImage || isLoading || savingDayIndex !== null}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                !selectedImage || isLoading || savingDayIndex !== null
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white shadow-lg hover:shadow-green-500/30 transform hover:scale-[1.02]'
              }`}
            >
              {isLoading ? 'Escaneando...' : 'Escanear Menú'}
            </button>
          
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-gray-500/30 transform hover:scale-[1.02]"
          >
            Limpiar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-red-300">Error</h3>
          </div>
          <p className="mt-2 text-red-200">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-900/50 border border-green-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h3 className="text-lg font-medium text-green-300">¡Éxito!</h3>
          </div>
          <p className="mt-2 text-green-200">{success}</p>
        </div>
      )}

      {menuData && (
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-green-400">Menú Extraído</h2>
              <button 
                onClick={() => navigator.clipboard.writeText(menuData.texto)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar Texto
              </button>
            </div>
              

            
            {menusDiarios.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-purple-400">
                    Días Detectados ({menusDiarios.length})
                  </h3>
                  {menusDiarios.length > 1 && (
                    <span className="text-sm bg-purple-900/50 px-3 py-1 rounded-lg border border-purple-700 text-purple-300">
                      Del {formatearFecha(menusDiarios[0]?.fecha)} al {formatearFecha(menusDiarios[menusDiarios.length - 1]?.fecha)}
                    </span>
                  )}
                </div>
                
                {/* Botón general para guardar todos los menús */}
                {menusDiarios.length > 1 && (
                  <div className="mb-4">
                    <button
                      onClick={handleGuardarMenu}
                      disabled={isLoading || savingDayIndex !== null}
                      className={`w-full px-6 py-3 rounded-xl font-medium transition-all ${
                        isLoading || savingDayIndex !== null
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-500 hover:to-purple-600 text-white shadow-lg hover:shadow-blue-500/30 transform hover:scale-[1.02]'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        {isLoading ? 'Guardando todos los menús...' : `Guardar Todos los Menús (${menusDiarios.length} días)`}
                      </div>
                    </button>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Se guardarán todos los menús secuencialmente. También puedes guardar días individuales usando los botones de abajo.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menusDiarios.map((dia, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-green-400">{dia.dia_semana}</h4>
                        <span className="text-sm px-3 py-1 bg-purple-900/50 text-purple-300 rounded-lg border border-purple-800 font-medium">
                          {formatearFecha(dia.fecha)}
                        </span>
                      </div>
                      <ul className="list-disc pl-5 text-sm text-gray-300 mb-3">
                        {dia.comidas.map((comida, i) => (
                          <li key={i}>{comida}</li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleGuardarMenuDia(dia, index)}
                        disabled={savingDayIndex !== null}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                          savingDayIndex === index
                            ? 'bg-green-700 text-white cursor-not-allowed'
                            : savingDayIndex !== null
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white shadow-lg hover:shadow-green-500/30'
                        }`}
                      >
                        {savingDayIndex === index ? 'Guardando...' : `Guardar ${dia.dia_semana}`}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-center text-gray-500 text-sm mt-12">
          <p>Selecciona una imagen clara del menú semanal para obtener los resultados más precisos</p>
        </div>
      </div>
      
      {/* Modal de confirmación para reemplazar menús */}
      {confirmReplace.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-bold text-yellow-400">Menú ya existe</h3>
            </div>
            
            <div className="mb-6">
              {confirmReplace.isGeneral ? (
                <div>
                  <p className="text-gray-300 mb-3">
                    Se encontraron menús existentes para algunas fechas. ¿Deseas reemplazar todos los menús existentes?
                  </p>
                  <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Menús que se procesarán:</p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {menusDiarios.map((dia, index) => (
                        <li key={index} className="flex justify-between">
                          <span>{dia.dia_semana}</span>
                          <span className="text-purple-400">{formatearFecha(dia.fecha)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                confirmReplace.dia && (
                  <p className="text-gray-300">
                    Ya existe un menú para el <strong>{confirmReplace.dia.dia_semana}</strong> ({formatearFecha(confirmReplace.dia.fecha)}). 
                    ¿Deseas reemplazarlo con el nuevo contenido?
                  </p>
                )
              )}
            </div>
            
            <div className="flex gap-3">
              {isReplacing ? (
                <div className="flex flex-col items-center w-full py-4">
                  <svg className="animate-spin h-8 w-8 text-yellow-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <span className="text-yellow-300 font-semibold">Reemplazando...</span>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleCancelReplace}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    disabled={isReplacing}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmReplace}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-500 hover:to-orange-600 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-yellow-500/30"
                    disabled={isReplacing}
                  >
                    {confirmReplace.isGeneral ? 'Reemplazar Todos' : 'Reemplazar'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
