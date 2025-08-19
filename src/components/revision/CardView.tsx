'use client';

import React from 'react';

interface RevisionData {
  id?: string;
  created_at: string;
  casita: string;
  quien_revisa: string;
  caja_fuerte: string;
  puertas_ventanas: string;
  chromecast: string;
  binoculares: string;
  trapo_binoculares: string;
  speaker: string;
  usb_speaker: string;
  controles_tv: string;
  secadora: string;
  accesorios_secadora: string;
  steamer: string;
  bolsa_vapor: string;
  plancha_cabello: string;
  bulto: string;
  sombrero: string;
  bolso_yute: string;
  evidencia_01: string;
  evidencia_02: string;
  evidencia_03: string;
  fecha_edicion: string;
  quien_edito: string;
  datos_anteriores: any;
  datos_actuales: any;
  camas_ordenadas: string;
  cola_caballo: string;
  notas: string;
  notas_count: number;
}

interface CardViewProps {
  data: RevisionData[];
  onCardClick: (id: string) => void;
  onImageClick: (imageUrl: string) => void;
  onShareClick?: (revision: RevisionData) => void;
  loading?: boolean;
}

export default function CardView({ data, onCardClick, onImageClick, onShareClick, loading = false }: CardViewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="bg-gradient-to-br from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md rounded-lg border border-[#3d4659]/50 p-4 animate-pulse">
            <div className="h-4 bg-gray-600/30 rounded mb-3"></div>
            <div className="h-3 bg-gray-600/20 rounded mb-2"></div>
            <div className="h-3 bg-gray-600/20 rounded mb-4"></div>
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-gray-600/20 rounded"></div>
              <div className="h-6 w-16 bg-gray-600/20 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-gray-600/20 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m-15 0A2.25 2.25 0 002.25 12v6.75A2.25 2.25 0 004.5 20.25H9M15 20.25h4.5A2.25 2.25 0 0021.75 18v-6.75A2.25 2.25 0 0019.5 9.878v0M15 20.25v-5.25a1.5 1.5 0 00-1.5-1.5h-3a1.5 1.5 0 00-1.5 1.5v5.25m6 0h-6" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-400 mb-2">
            No se encontraron revisiones
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            No hay revisiones que coincidan con los filtros actuales.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {data.map((revision, index) => {
        // Check if revision has notes or notes_count
        const hasNotes = (revision.notas_count && revision.notas_count > 0) || 
                        (revision.notas && revision.notas.trim() !== '');
        
        return (
          <div
            key={revision.id || index}
            onClick={() => revision.id && onCardClick(revision.id)}
            className={`${
              hasNotes
                ? 'backdrop-blur-md rounded-lg border border-[#3d4659]/50 p-4 hover:border-[#c9a45c]/50 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-[#c9a45c]/10'
                : 'bg-gradient-to-b from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md rounded-lg border border-[#3d4659]/50 p-4 hover:border-[#c9a45c]/50 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-[#c9a45c]/10'
            }`}
            style={hasNotes ? {
              backgroundImage: 'radial-gradient(circle farthest-corner at 50.3% 47.3%, rgba(113,42,92,1) 0.1%, rgba(40,25,46,1) 90%)'
            } : undefined}
          >
          {/* Header con Casita y Estado */}
          <div className="flex justify-between items-start mb-3">
            <h3 className={`text-base font-bold truncate ${
              revision.notas_count && revision.notas_count > 0
                ? 'text-orange-400'
                : 'text-sky-400'
            }`}>
              {revision.casita}
            </h3>
            <span className={`px-1.5 py-0.5 text-xs rounded border font-medium text-right ${
              revision.caja_fuerte === 'Check out'
                ? 'bg-red-500/20 text-red-400 border-red-400/40'
                : revision.caja_fuerte === 'Check in'
                ? 'bg-green-500/20 text-green-400 border-green-400/40'
                : revision.caja_fuerte === 'Upsell'
                ? 'bg-blue-500/20 text-blue-400 border-blue-400/40'
                : revision.caja_fuerte === 'Guardar Upsell'
                ? 'bg-purple-500/20 text-purple-400 border-purple-400/40'
                : 'bg-[#c9a45c]/20 text-[#c9a45c] border-[#c9a45c]/30'
            }`}>
              {revision.caja_fuerte === 'Guardar Upsell' ? (
                <span className="block leading-tight text-center">Guardar<br/>Upsell</span>
              ) : (
                revision.caja_fuerte
              )}
            </span>
          </div>

          {/* Información Principal */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-300">
              <svg className="w-3 h-3 text-[#c9a45c] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="truncate">{revision.quien_revisa}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="w-3 h-3 text-[#c9a45c] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
              </svg>
              <div className="flex items-center gap-1">
                <span className="text-xs">
                  {revision.created_at.split('+')[0].split('T')[0]}
                </span>
                <span className="text-xs">
                  {revision.created_at.split('+')[0].split('T')[1].split(':').slice(0,2).join(':')}
                </span>
              </div>
            </div>
          </div>

          {/* Indicador de Notas - Más compacto */}
          {revision.notas_count && revision.notas_count > 0 && (
            <div className="flex items-center gap-1.5 mb-3 p-1.5 bg-orange-500/10 border border-orange-500/20 rounded">
              <svg className="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-orange-400 text-xs font-medium">
                Hay una nota
              </span>
            </div>
          )}

          {/* Footer con Evidencias y WhatsApp */}
          <div className="flex items-center justify-between pt-2 border-t border-[#3d4659]/50">
            {/* Botón de WhatsApp - Solo si hay imágenes */}
            {(revision.evidencia_01 || revision.evidencia_02 || revision.evidencia_03) && onShareClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShareClick(revision);
                }}
                className="w-5 h-5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 rounded transition-all duration-200 hover:scale-110 flex items-center justify-center"
                title="Compartir en WhatsApp"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106"/>
                </svg>
              </button>
            )}
            
            {/* Botones de evidencias */}
            <div className="flex items-center gap-1">
              {revision.evidencia_01 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageClick(revision.evidencia_01);
                  }}
                  className="w-4 h-4 bg-[#c9a45c]/20 hover:bg-[#c9a45c]/30 border border-[#c9a45c]/40 text-[#c9a45c] rounded text-[10px] transition-all duration-200 hover:scale-110 flex items-center justify-center font-medium"
                  title="Ver evidencia 1"
                >
                  1
                </button>
              )}
              {revision.evidencia_02 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageClick(revision.evidencia_02);
                  }}
                  className="w-4 h-4 bg-[#c9a45c]/20 hover:bg-[#c9a45c]/30 border border-[#c9a45c]/40 text-[#c9a45c] rounded text-[10px] transition-all duration-200 hover:scale-110 flex items-center justify-center font-medium"
                  title="Ver evidencia 2"
                >
                  2
                </button>
              )}
              {revision.evidencia_03 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageClick(revision.evidencia_03);
                  }}
                  className="w-4 h-4 bg-[#c9a45c]/20 hover:bg-[#c9a45c]/30 border border-[#c9a45c]/40 text-[#c9a45c] rounded text-[10px] transition-all duration-200 hover:scale-110 flex items-center justify-center font-medium"
                  title="Ver evidencia 3"
                >
                  3
                </button>
              )}
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}
