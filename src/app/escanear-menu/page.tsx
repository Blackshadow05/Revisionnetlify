'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { analyzeMenuImage } from '@/lib/gemini';
import { guardarMenu } from '@/lib/menuService';
import { extraerFechaMenu, formatearFecha } from '@/lib/dateUtils';
import { extraerMenusDiarios, MenuDiario } from '@/lib/menuParser';

export default function EscanearMenu() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [menuData, setMenuData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [menuGuardado, setMenuGuardado] = useState<boolean>(false);
  const [fechaDetectada, setFechaDetectada] = useState<string | null>(null);
  const [nombreMenu, setNombreMenu] = useState<string>('');
  const [menusDiarios, setMenusDiarios] = useState<MenuDiario[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nombreMenuRef = useRef<HTMLInputElement>(null);

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
    if (!menuData?.texto) {
      setError('No hay contenido de menú para guardar');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { data, error } = await guardarMenu(menuData.texto, nombreMenu);
      
      if (error) {
        throw error;
      }
      
      // Mostrar mensaje de éxito con información de los días guardados
      if (menusDiarios.length > 0) {
        setSuccess(
          `¡Menú guardado correctamente! Se han guardado ${menusDiarios.length} días de menú ` +
          `desde ${formatearFecha(menusDiarios[0]?.fecha || '')} ` +
          `hasta ${formatearFecha(menusDiarios[menusDiarios.length - 1]?.fecha || '')}`
        );
      } else {
        setSuccess(`¡Menú guardado correctamente! Fecha detectada: ${formatearFecha(data?.fecha_menu || '')}`);
      }
      
      setNombreMenu('');
      setMenuGuardado(true);
    } catch (err) {
      console.error('Error al guardar el menú:', err);
      setError('Error al guardar el menú en la base de datos.');
    } finally {
      setIsLoading(false);
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
    setNombreMenu('');
    setMenusDiarios([]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (nombreMenuRef.current) {
      nombreMenuRef.current.value = '';
    }
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
          
          <div className="mb-6">
            <label className="block text-lg font-medium mb-3 text-gray-200">
              Nombre del menú (opcional)
            </label>
            
            <input
              ref={nombreMenuRef}
              type="text"
              value={nombreMenu}
              onChange={(e) => setNombreMenu(e.target.value)}
              placeholder="Ej: Menú semanal comedor principal"
              className="w-full px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
            />
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
              disabled={!selectedImage || isLoading}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                !selectedImage || isLoading
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white shadow-lg hover:shadow-green-500/30 transform hover:scale-[1.02]'
              }`}
            >
              {isLoading ? 'Escaneando...' : 'Escanear Menú'}
            </button>
            
            {menuData && !menuGuardado && (
              <button
                onClick={handleGuardarMenu}
                disabled={isLoading}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  isLoading
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg hover:shadow-blue-500/30 transform hover:scale-[1.02]'
                }`}
              >
                {isLoading ? 'Guardando...' : menusDiarios.length > 0 ? `Guardar ${menusDiarios.length} días de menú` : 'Guardar en Base de Datos'}
              </button>
            )}
            
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
            
            <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-green-400">Resultado</h3>
                {fechaDetectada && (
                  <span className="text-sm bg-blue-900/50 px-3 py-1 rounded-lg border border-blue-700 text-blue-300">
                    Fecha detectada: {formatearFecha(fechaDetectada)}
                  </span>
                )}
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-200 whitespace-pre-wrap">{menuData.texto}</p>
              </div>
            </div>
            
            {menusDiarios.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-purple-400 mb-3">
                  Días Detectados ({menusDiarios.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menusDiarios.map((dia, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-green-400">{dia.dia_semana}</h4>
                        <span className="text-xs px-2 py-1 bg-purple-900/50 text-purple-300 rounded-full border border-purple-800">
                          {formatearFecha(dia.fecha)}
                        </span>
                      </div>
                      <ul className="list-disc pl-5 text-sm text-gray-300">
                        {dia.comidas.map((comida, i) => (
                          <li key={i}>{comida}</li>
                        ))}
                      </ul>
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
    </div>
  );
}
