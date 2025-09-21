export interface Revision {
  id: number;
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
  camas_ordenadas: string;
  cola_caballo: string;
  evidencia_01: string;
  evidencia_02: string;
  evidencia_03: string;
  notas: string;
  created_at: string;
  datos_anteriores?: Record<string, unknown>;
  datos_actuales?: Record<string, unknown>;
}

export interface RevisionData {
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
  cola_caballo: string;
  plancha_cabello: string;
  bulto: string;
  sombrero: string;
  bolso_yute: string;
  camas_ordenadas: string;
  evidencia_01: string;
  evidencia_02: string;
  evidencia_03: string;
  fecha_edicion: string;
  quien_edito: string;
  datos_anteriores?: Record<string, unknown>;
  datos_actuales?: Record<string, unknown>;
  notas: string;
  notas_count: number;
}

export interface FileData {
  evidencia_01: File | null;
  evidencia_02: File | null;
  evidencia_03: File | null;
}

export interface CompressionStatus {
  status: 'idle' | 'compressing' | 'completed' | 'error';
  progress: number;
  stage: string;
  error?: string;
}

export interface FileSizes {
  original: number;
  compressed: number;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export type EvidenceField = 'evidencia_01' | 'evidencia_02' | 'evidencia_03';

// Interface para el menú del día
export interface MenuData {
  id?: string;
  fecha_menu: string;
  dia_semana: string;
  contenido_menu: string;
  activo?: boolean;
}

// Interface para datos de compresión
export interface CompressionLog {
  timestamp: number;
  message: string;
  data?: Record<string, unknown>;
}

// Interface para errores
export interface AppError extends Error {
  code?: string;
  details?: Record<string, unknown>;
}