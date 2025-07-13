import React from 'react';

interface CompressionStatus {
  status: 'idle' | 'compressing' | 'completed' | 'error';
  progress: number;
  stage: string;
  error?: string;
}

interface FileSizes {
  original: number;
  compressed: number;
}

interface Props {
  status: CompressionStatus;
  fileSizes: FileSizes;
  fieldName: string;
}

export default function CompressionIndicator({ status, fileSizes, fieldName }: Props) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'compressing': return 'text-yellow-400';
      case 'completed': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'compressing':
        return (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'completed':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (status.status === 'idle') return null;

  return (
    <div className="mt-2 p-3 bg-[#1e2538]/50 border border-[#3d4659]/50 rounded-lg backdrop-blur-sm">
      <div className={`flex items-center gap-2 text-sm ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="font-medium">{status.stage}</span>
      </div>
      
      {status.status === 'compressing' && (
        <div className="mt-2">
          <div className="w-full bg-[#3d4659] rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${status.progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 mt-1 text-center">
            {Math.round(status.progress)}%
          </div>
        </div>
      )}
      
      {status.status === 'completed' && fileSizes.original > 0 && (
        <div className="mt-2 text-xs text-gray-300">
          <div className="flex justify-between">
            <span>Original:</span>
            <span>{formatFileSize(fileSizes.original)}</span>
          </div>
          <div className="flex justify-between">
            <span>Comprimida:</span>
            <span className="text-green-400">{formatFileSize(fileSizes.compressed)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Reducción:</span>
            <span className="text-green-400">
              {Math.round(((fileSizes.original - fileSizes.compressed) / fileSizes.original) * 100)}%
            </span>
          </div>
        </div>
      )}
      
      {status.status === 'error' && status.error && (
        <div className="mt-2 text-xs text-red-400">
          {status.error}
        </div>
      )}
    </div>
  );
} 