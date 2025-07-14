'use client';

import { useState, useRef, useEffect } from 'react';

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (audioBlob: Blob) => void;
}

const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({ isOpen, onClose, onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsRecording(false);
      setAudioBlob(null);
      setError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isOpen]);

  const startRecording = async () => {
    setError(null);
    setAudioBlob(null);

    if (!window.isSecureContext) {
        setError('La grabación de audio solo está disponible en conexiones seguras (HTTPS).');
        return;
    }

    const getUserMedia = (constraints: MediaStreamConstraints) => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return navigator.mediaDevices.getUserMedia(constraints);
      }
      const legacyGetUserMedia = 
        (navigator as any).webkitGetUserMedia || 
        (navigator as any).mozGetUserMedia;

      if (!legacyGetUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
      }

      return new Promise<MediaStream>((resolve, reject) => {
        legacyGetUserMedia.call(navigator, constraints, resolve, reject);
      });
    };

    if (!navigator.mediaDevices && !((navigator as any).webkitGetUserMedia || (navigator as any).mozGetUserMedia)) {
      setError('La grabación de audio no es soportada en este navegador.');
      return;
    }

    try {
      const stream = await getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(
        (type) => MediaRecorder.isTypeSupported(type)
      );

      if (!mimeType) {
        setError('No se encontró un formato de audio soportado.');
        return;
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorderRef.current.onerror = (event: any) => {
        setError(`Error de MediaRecorder: ${event.error.message}`);
        setIsRecording(false);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err: any) {
      let errorMessage = 'Error al acceder al micrófono.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Permiso para acceder al micrófono denegado. Revisa la configuración de tu navegador.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No se encontró un dispositivo de micrófono.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'El micrófono ya está en uso por otra aplicación.';
      }
      setError(errorMessage);
      console.error('Error al iniciar grabación:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSave = () => {
    if (audioBlob) {
      onSave(audioBlob);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md m-4">
        <h2 className="text-xl font-bold mb-4 text-white">Grabar Nota de Voz</h2>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-red-200 text-sm">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-col items-center space-y-4">
          <div className="relative h-20 w-20 flex items-center justify-center">
            {isRecording && (
              <div className="absolute h-full w-full bg-red-500 rounded-full animate-pulse"></div>
            )}
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className={`z-10 h-16 w-16 rounded-full flex items-center justify-center transition-colors duration-200 ${isRecording ? 'bg-red-700 hover:bg-red-800' : 'bg-blue-600 hover:bg-blue-700'}`}
              aria-label={isRecording ? 'Detener grabación' : 'Iniciar grabación'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isRecording 
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12v12H6z" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                }
              </svg>
            </button>
          </div>
          <p className="text-gray-300 text-sm h-5">
            {isRecording ? 'Grabando...' : (audioBlob ? 'Grabación finalizada' : 'Toca para grabar')}
          </p>

          {audioBlob && (
            <div className="w-full pt-4">
              <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={!audioBlob || isRecording} className="btn-primary">Guardar</button>
        </div>
      </div>
    </div>
  );
};

export default AudioRecorderModal;
