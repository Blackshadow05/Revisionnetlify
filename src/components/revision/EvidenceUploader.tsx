import React, { useRef, useEffect } from 'react';
import CompressionIndicator from './CompressionIndicator';
import { CompressionStatus, FileSizes } from '@/types/revision';

interface CompressionProgress {
  attempt: number;
  currentSize: number;
  targetSize: number;
  quality: number;
  resolution: string;
  status: 'compressing' | 'compressed' | 'timeout' | 'error';
}

interface Props {
  fieldName: 'evidencia_01' | 'evidencia_02' | 'evidencia_03';
  file: File | null;
  compressedFile: File | null;
  compressionStatus: CompressionStatus;
  fileSizes: FileSizes;
  onFileSelect: (field: 'evidencia_01' | 'evidencia_02' | 'evidencia_03', file: File | null) => void;
  onClearFile: (field: 'evidencia_01' | 'evidencia_02' | 'evidencia_03') => void;
  onImageClick: (imageUrl: string) => void;
  onImageClickFile?: (file: File) => void;
  required?: boolean;
  disabled?: boolean;
  compressionProgress?: CompressionProgress | null;
  isCompressing?: boolean;
}

export default function EvidenceUploader({
  fieldName,
  file,
  compressedFile,
  compressionStatus,
  fileSizes,
  onFileSelect,
  onClearFile,
  onImageClick,
  onImageClickFile,
  required = false,
  disabled = false,
  compressionProgress,
  isCompressing
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUrlRef = useRef<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileSelect(fieldName, selectedFile);
  };

  const handleClearFile = () => {
    onClearFile(fieldName);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFieldLabel = () => {
    const labels = {
      evidencia_01: 'Evidencia 1',
      evidencia_02: 'Evidencia 2', 
      evidencia_03: 'Evidencia 3'
    };
    return labels[fieldName];
  };

  const imageUrl = compressedFile ? URL.createObjectURL(compressedFile) : 
                   file ? URL.createObjectURL(file) : null;

  useEffect(() => {
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
    }
    
    imageUrlRef.current = imageUrl;
    
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = null;
      }
    };
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-3">
      <label className="form-label">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {getFieldLabel()}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="space-y-3">
        {/* Botones de captura y galería */}
        {!file && !compressedFile && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                if (fileInputRef.current && !disabled) {
                  fileInputRef.current.setAttribute('capture', 'environment');
                  fileInputRef.current.click();
                }
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg transition-all duration-200 ${
                disabled
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                  : 'bg-[#c9a45c] hover:bg-[#d4b06c] text-[#1a1f35] shadow-[6px_6px_12px_rgba(0,0,0,0.3),-6px_-6px_12px_rgba(255,255,255,0.1),inset_2px_2px_4px_rgba(255,255,255,0.2),inset_-2px_-2px_4px_rgba(0,0,0,0.1)] hover:shadow-[8px_8px_16px_rgba(0,0,0,0.35),-8px_-8px_16px_rgba(255,255,255,0.15),inset_3px_3px_6px_rgba(255,255,255,0.25),inset_-3px_-3px_6px_rgba(0,0,0,0.15)] transform hover:scale-[1.02] border border-[#d4b06c]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Cámara
            </button>
            
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                if (fileInputRef.current && !disabled) {
                  fileInputRef.current.removeAttribute('capture');
                  fileInputRef.current.click();
                }
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg transition-all duration-200 ${
                disabled
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                  : 'bg-[#2a3347] hover:bg-[#3d4659] text-white shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] hover:shadow-[8px_8px_16px_rgba(0,0,0,0.45),-8px_-8px_16px_rgba(255,255,255,0.08),inset_3px_3px_6px_rgba(255,255,255,0.15),inset_-3px_-3px_6px_rgba(0,0,0,0.25)] transform hover:scale-[1.02] border border-[#3d4659]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Galería
            </button>
          </div>
        )}
        
        {/* Input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Indicador de compresión */}
      {compressionStatus.status !== 'idle' && (
        <CompressionIndicator 
          status={compressionStatus}
          fileSizes={fileSizes}
          fieldName={getFieldLabel()}
        />
      )}

      {/* Vista previa de imagen */}
      {imageUrl && (
        <div className="relative mt-3">
          <div className="relative inline-block">
            <img
              src={imageUrl}
              alt={`Preview ${getFieldLabel()}`}
              className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg border-2 border-[#3d4659] hover:border-[#c9a45c]/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
              onClick={() => {
                // Siempre usar onImageClickFile si está disponible, priorizando el File sobre el URL
                if (onImageClickFile) {
                  if (compressedFile) {
                    onImageClickFile(compressedFile);
                  } else if (file) {
                    onImageClickFile(file);
                  }
                } else if (imageUrl) {
                  // Fallback solo si onImageClickFile no está definido
                  onImageClick(imageUrl);
                }
              }}
            />
            
            {/* Badge de estado de compresión */}
            {compressionStatus.status === 'completed' && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            
            {compressionStatus.status === 'compressing' && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="animate-spin w-3 h-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            
            {/* Botón eliminar */}
            <button
              type="button"
              onClick={handleClearFile}
              className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
              title={`Eliminar ${getFieldLabel()}`}
              aria-label={`Eliminar ${getFieldLabel()}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Indicador de clic para ampliar */}
          <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <span>Clic para ampliar</span>
          </div>
        </div>
      )}
    </div>
  );
} 