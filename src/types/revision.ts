export interface RevisionData {
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
  evidencia_01: File | string;
  evidencia_02: File | string;
  evidencia_03: File | string;
  notas: string;
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
  status: 'idle' | 'uploading' | 'completed' | 'error';
  progress: number;
  stage: string;
}

export type EvidenceField = 'evidencia_01' | 'evidencia_02' | 'evidencia_03'; 