"use client";

import {
  useState,
  useMemo,
  memo,
  useCallback,
  Suspense,
  lazy,
  useEffect,
  useRef,
} from "react";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/lib/supabase";
import {
  uploadNotaToCloudinary,
  uploadEvidenciaToCloudinary,
  getCloudinaryThumbnailUrl,
} from "@/lib/cloudinary";

import { useRevisionData } from "@/hooks/useRevisionData";
import DetallesSkeleton from "@/components/ui/DetallesSkeleton";
import LoadingButton from "@/components/ui/LoadingButton";
import FadeIn from "@/components/ui/FadeIn";
import ClickableImage from "@/components/ui/ClickableImage";

// 🚀 CODE SPLITTING: Lazy load de componentes no críticos
const ImageModal = lazy(() => import("@/components/revision/ImageModal"));
const InfoCard = lazy(() => import("@/components/ui/InfoCard"));

// 🚀 LAZY LOADING: Componentes de tarjetas individuales
const CasitaCard = lazy(() => import("@/components/revision/cards/CasitaCard"));
const FechaCard = lazy(() => import("@/components/revision/cards/FechaCard"));
const RevisorCard = lazy(
  () => import("@/components/revision/cards/RevisorCard")
);
const RevisionItemCard = lazy(
  () => import("@/components/revision/cards/RevisionItemCard")
);

import { Revision } from "@/types/revision";

const DetalleRevision = memo(() => {
  const params = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  // 🚀 OPTIMIZACIÓN: Hook personalizado para carga de datos
  const {
    revision,
    notas,
    registroEdiciones,
    loading,
    secondaryLoading,
    error,
    hasNotas,
    hasRegistroEdiciones,
    loadSecondaryData,
    refetchRevision,
    refetchSecondaryData,
  } = useRevisionData(params.id);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState<string | null>(null);
  const [modalEvidenciaNumber, setModalEvidenciaNumber] = useState<
    number | undefined
  >(undefined);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalInitialIndex, setModalInitialIndex] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Revision | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Archivos seleccionados para evidencias durante el modo edición
  const [newEvidenceFiles, setNewEvidenceFiles] = useState<{
    evidencia_01?: File;
    evidencia_02?: File;
    evidencia_03?: File;
  }>({});
  // Previews locales para mostrar las nuevas evidencias seleccionadas
  const [evidencePreviews, setEvidencePreviews] = useState<{
    evidencia_01?: string;
    evidencia_02?: string;
    evidencia_03?: string;
  }>({});

  // Estados para el formulario de notas
  const [showNotaForm, setShowNotaForm] = useState(false);
  const [isSubmittingNota, setIsSubmittingNota] = useState(false);
  const [nuevaNota, setNuevaNota] = useState({
    Usuario: "",
    nota: "",
    evidencia: null as File | null,
  });

  const { userRole, user } = useAuth();

  // 🚀 OPTIMIZACIÓN: Memoizar fieldLabels para evitar recreación
  const fieldLabels: Record<string, string> = useMemo(
    () => ({
      casita: "Casita",
      quien_revisa: "Quien Revisa",
      caja_fuerte: "Caja Fuerte",
      puertas_ventanas: "Puertas y Ventanas",
      chromecast: "Chromecast",
      binoculares: "Binoculares",
      trapo_binoculares: "Trapo Binoculares",
      speaker: "Speaker",
      usb_speaker: "USB Speaker",
      controles_tv: "Controles TV",
      secadora: "Secadora",
      accesorios_secadora: "Accesorios Secadora",
      steamer: "Steamer",
      bolsa_vapor: "Bolsa Vapor",
      plancha_cabello: "Plancha Cabello",
      bulto: "Bulto",
      sombrero: "Sombrero",
      bolso_yute: "Bolso Yute",
      camas_ordenadas: "Camas Ordenadas",
      cola_caballo: "Cola Caballo",
      evidencia_01: "Evidencia 1",
      evidencia_02: "Evidencia 2",
      evidencia_03: "Evidencia 3",
      notas: "Notas",
      created_at: "Fecha de Creación",
    }),
    []
  );

  // 🚀 OPTIMIZACIÓN: Función de formateo de fechas
  const formatearFechaParaMostrar = useCallback((fechaISO: string): string => {
    try {
      const fecha = new Date(fechaISO);
      const dia = fecha.getDate().toString().padStart(2, "0");
      const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
      const año = fecha.getFullYear();
      const horas = fecha.getHours().toString().padStart(2, "0");
      const minutos = fecha.getMinutes().toString().padStart(2, "0");
      return `${dia}-${mes}-${año} ${horas}:${minutos}`;
    } catch (error) {
      return fechaISO;
    }
  }, []);

  // 🚀 OPTIMIZACIÓN: Memoizar handlers de modal
  const openModal = useCallback(
    (imgUrl: string, evidenciaNumber?: number) => {
      // Recolectar todas las imágenes disponibles
      const allImages: string[] = [];

      // Si es una evidencia de revisión (evidenciaNumber definido), incluir solo las evidencias de revisión
      if (evidenciaNumber !== undefined) {
        // Agregar evidencia_01 si existe
        if (revision?.evidencia_01) {
          allImages.push(revision.evidencia_01);
        }

        // Agregar evidencia_02 si existe
        if (revision?.evidencia_02) {
          allImages.push(revision.evidencia_02);
        }

        // Agregar evidencia_03 si existe
        if (revision?.evidencia_03) {
          allImages.push(revision.evidencia_03);
        }
      } else {
        // Si es una evidencia de nota, incluir solo esa imagen
        allImages.push(imgUrl);
      }

      // Encontrar el índice de la imagen actual
      const initialIndex = allImages.findIndex((img) => img === imgUrl);

      setModalImages(allImages);
      setModalInitialIndex(initialIndex >= 0 ? initialIndex : 0);
      setModalImg(imgUrl);
      setModalOpen(true);
      setModalEvidenciaNumber(evidenciaNumber);
    },
    [revision]
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalImg(null);
    setModalEvidenciaNumber(undefined);
    setModalImages([]);
    setModalInitialIndex(0);
  }, []);

  // 🚀 OPTIMIZACIÓN: Memoizar handlers de edición
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditedData(revision);
  }, [revision]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedData(null);
    // Limpiar selecciones de nuevas evidencias y liberar object URLs
    setNewEvidenceFiles({});
    setEvidencePreviews((prev) => {
      Object.values(prev).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      return {};
    });
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!revision || !editedData || !supabase) return;

    try {
      setIsSubmitting(true);

      // Obtener fecha y hora local del dispositivo en formato ISO para PostgreSQL
      const now = new Date();
      const fechaFormateada = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
      ).toISOString();

      // Si hay nuevas evidencias seleccionadas, comprimir y subir antes de guardar
      const updatedData: Revision = { ...editedData } as Revision;
      const evidenceKeys: (keyof Revision)[] = [
        "evidencia_01",
        "evidencia_02",
        "evidencia_03",
      ];
      for (const key of evidenceKeys) {
        const file = (newEvidenceFiles as any)[key] as File | undefined;
        if (file) {
          try {
            const compressed = await comprimirImagenWebP(file);
            const url = await uploadEvidenciaToCloudinary(compressed);
            (updatedData as any)[key] = url;
          } catch (err) {
            showError("Error al subir una de las evidencias");
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Preparar datos para actualizar (sin modificar created_at)
      const { created_at, ...dataToUpdate } = updatedData;

      // Actualizar los datos en revisiones_casitas (preservando fecha original)
      const { error: updateError } = await supabase
        .from("revisiones_casitas")
        .update(dataToUpdate)
        .eq("id", revision.id);

      if (updateError) {
        showError("Error al guardar los cambios");
        return;
      }

      // Guardar el registro de cambios en Registro_ediciones
      const cambios = Object.entries(updatedData).reduce(
        (acc, [key, value]) => {
          // Lista de campos válidos para registrar cambios
          const validFields: (keyof Revision)[] = [
            "casita",
            "quien_revisa",
            "caja_fuerte",
            "puertas_ventanas",
            "chromecast",
            "binoculares",
            "trapo_binoculares",
            "speaker",
            "usb_speaker",
            "controles_tv",
            "secadora",
            "accesorios_secadora",
            "steamer",
            "bolsa_vapor",
            "plancha_cabello",
            "bulto",
            "sombrero",
            "bolso_yute",
            "camas_ordenadas",
            "cola_caballo",
            "evidencia_01",
            "evidencia_02",
            "evidencia_03",
            "notas",
          ];

          // Solo procesar campos válidos
          if (!validFields.includes(key as keyof Revision)) {
            return acc;
          }

          // Verificación adicional de que la propiedad existe
          if (!revision.hasOwnProperty(key)) {
            return acc;
          }

          // Acceso seguro usando bracket notation con any
          const valorAnterior = (revision as any)[key];
          if (value !== valorAnterior) {
            const registro = {
              "Usuario que Edito": user || "Usuario",
              Dato_anterior: `[${revision.id}] ${key}: ${String(
                valorAnterior || ""
              )}`,
              Dato_nuevo: `[${revision.id}] ${key}: ${String(value || "")}`,
              created_at: fechaFormateada,
            };

            acc.push(registro);
          }
          return acc;
        },
        [] as any[]
      );

      if (cambios.length > 0) {
        const { data: insertData, error: registroError } = await supabase
          .from("Registro_ediciones")
          .insert(cambios)
          .select();

        if (registroError) {
          // No bloquear la edición por error en el registro
        } else {
        }
      } else {
      }

      setIsEditing(false);
      setEditedData(null);
      // Limpiar selecciones y previews tras guardar
      setNewEvidenceFiles({});
      setEvidencePreviews((prev) => {
        Object.values(prev).forEach((url) => {
          if (url) URL.revokeObjectURL(url);
        });
        return {};
      });
      showSuccess("Cambios guardados correctamente");

      // Recargar datos críticos y secundarios después de editar
      await refetchRevision();
      await refetchSecondaryData();
    } catch (error: any) {
      showError(`Error al guardar los cambios: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    revision,
    editedData,
    supabase,
    user,
    showError,
    showSuccess,
    refetchRevision,
    refetchSecondaryData,
    newEvidenceFiles,
  ]);

  const handleInputChange = useCallback(
    (field: keyof Revision, value: string) => {
      if (!editedData) return;
      setEditedData({ ...editedData, [field]: value });
    },
    [editedData]
  );

  // Handler de cambio de archivo para evidencias
  const handleEvidenceInputChange = useCallback(
    (key: "evidencia_01" | "evidencia_02" | "evidencia_03") =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          setNewEvidenceFiles((prev) => ({ ...prev, [key]: file }));
          setEvidencePreviews((prev) => {
            // Liberar URL previa si existía
            if (prev[key]) URL.revokeObjectURL(prev[key]!);
            return { ...prev, [key]: URL.createObjectURL(file) };
          });
        }
      },
    []
  );

  // 🚀 FUNCIONES PARA MANEJO DE NOTAS
  const comprimirImagenWebP = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      let objectUrl: string | null = null;

      img.onload = () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
        }

        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/webp",
                  lastModified: Date.now(),
                });

                resolve(compressedFile);
              } else {
                reject(new Error("No se pudo generar el blob de la imagen"));
              }
            },
            "image/webp",
            0.8
          );
        } else {
          reject(new Error("No se pudo obtener el contexto del canvas"));
        }
      };

      img.onerror = () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
        reject(new Error("Error al cargar la imagen"));
      };

      objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
    });
  }, []);

  // Handler de archivo para nueva nota (imagen opcional)
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setNuevaNota((prev) => ({ ...prev, evidencia: file }));
    },
    []
  );

  // Envío del formulario de nueva nota
  const handleSubmitNota = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!supabase) {
        showError("No se pudo conectar con la base de datos");
        return;
      }

      try {
        setIsSubmittingNota(true);

        // Subir evidencia si existe
        let evidenciaUrl: string | null = null;
        if (nuevaNota.evidencia) {
          const compressed = await comprimirImagenWebP(nuevaNota.evidencia);
          evidenciaUrl = await uploadNotaToCloudinary(compressed);
        }

        const now = new Date();
        const fechaLocal = new Date(
          now.getTime() - now.getTimezoneOffset() * 60000
        );

        const { error } = await supabase.from("Notas").insert([
          {
            fecha: fechaLocal.toISOString(),
            Casita: revision?.casita || "",
            Usuario: nuevaNota.Usuario || "Usuario",
            nota: nuevaNota.nota,
            Evidencia: evidenciaUrl,
            // Asociar la nota con la revisión: usar revision.id cuando esté disponible,
            // y fallback a params.id (ambos convertidos a string).
            revision_id: String(revision?.id ?? params.id),
          },
        ]);

        if (error) throw error;

        // Después de insertar, actualizar el conteo de notas en revisiones_casitas
        try {
          const { count, error: countError } = await supabase
            .from("Notas")
            .select("id", { count: "exact", head: true })
            .eq("revision_id", String(revision?.id ?? params.id));

          if (!countError) {
            // notas_count en la tabla es VARCHAR según el esquema; guardamos como string
            await supabase
              .from("revisiones_casitas")
              .update({ notas_count: String(count ?? 0) })
              .eq("id", revision?.id ?? params.id);
          } else {
            console.warn("No se pudo obtener el conteo de notas:", countError);
          }
        } catch (err) {
          console.warn("Error actualizando notas_count:", err);
        }

        showSuccess("Nota guardada correctamente");
        setNuevaNota({ Usuario: "", nota: "", evidencia: null });
        setShowNotaForm(false);

        // Actualizar lista de notas/historial
        await refetchSecondaryData();
      } catch (err: any) {
        showError(err.message || "Error al guardar la nota");
      } finally {
        setIsSubmittingNota(false);
      }
    },
    [
      supabase,
      revision?.casita,
      nuevaNota,
      user,
      showError,
      showSuccess,
      refetchSecondaryData,
      comprimirImagenWebP,
    ]
  );

  // 🚀 FUNCIÓN PARA PARSEAR DATOS DE EDICIÓN
  const parseEditData = useCallback(
    (dataString: string) => {
      // Formato esperado: [UUID] campo: valor
      const match = dataString.match(/^\[([a-f0-9-]+)\]\s+([^:]+):\s*(.*)$/);
      if (match) {
        const [, id, fieldName, value] = match;
        const displayName = fieldLabels[fieldName.trim()] || fieldName.trim();
        return {
          id,
          fieldName: fieldName.trim(),
          displayName,
          value: value.trim(),
        };
      }
      return {
        id: "",
        fieldName: "",
        displayName: "Campo desconocido",
        value: dataString,
      };
    },
    [fieldLabels]
  );

  // 🚀 FUNCIÓN PARA DETERMINAR SI UN CAMPO DEBE MOSTRARSE
  const shouldShowField = useCallback(
    (key: keyof Revision, value: any) => {
      // Nunca mostrar estos campos
      if (key === "id") return false;

      // Siempre mostrar el campo notas, aunque esté vacío
      if (key === "notas") return true;

      // Siempre mostrar casita (especialmente en modo edición), aunque esté vacío
      if (key === "casita") return true;

      // Mostrar siempre los campos de evidencia en modo edición, aunque estén vacíos
      if (
        key === "evidencia_01" ||
        key === "evidencia_02" ||
        key === "evidencia_03"
      ) {
        if (isEditing) return true;
      }

      // Para otros campos, verificar si tienen valor
      // El número 0 cuenta como valor válido
      if (value === 0) return true;

      // Verificar si el valor está vacío (null, undefined, string vacía o solo espacios)
      if (value === null || value === undefined) return false;
      if (typeof value === "string" && value.trim() === "") return false;

      return true;
    },
    [isEditing]
  );

  // 🚀 OPTIMIZACIÓN: Renderizar campo individual
  const renderField = useCallback(
    (key: keyof Revision, value: any) => {
      // Usar la función para determinar si mostrar el campo
      if (!shouldShowField(key, value)) return null;

      const label = fieldLabels[key] || key;
      const nonEditableFields = [
        "id",
        "quien_revisa",
        "created_at",
        "evidencia_01",
        "evidencia_02",
        "evidencia_03",
        "notas_count",
      ];

      // Campos principales con estilo especial
      if (key === "casita") {
        return (
          <FadeIn key={key} delay={100}>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xl shadow-gray-200/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#c9a45c]/10 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-[#c9a45c] rounded-lg flex items-center justify-center shadow-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-700">{label}</h3>
                </div>
                {isEditing && user ? (
                  <>
                    <input
                      type="text"
                      value={String(
                        (editedData?.[key] as string) ?? revision?.casita ?? ""
                      )}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-colors"
                      placeholder={`Editar ${
                        label?.toLowerCase() || "campo"
                      }...`}
                    />
                    <div className="flex justify-end mt-3">
                      <LoadingButton
                        onClick={handleSaveEdit}
                        loading={isSubmitting}
                        variant="success"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Actualizar
                      </LoadingButton>
                    </div>
                  </>
                ) : (
                  <p className="text-3xl font-black text-[#c9a45c]">
                    {value || (
                      <span className="text-gray-400 italic text-lg">
                        Sin información
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </FadeIn>
        );
      }

      if (key === "created_at") {
        return (
          <FadeIn key={key} delay={200}>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xl shadow-gray-200/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-700">
                    Fecha de Revisión
                  </h3>
                </div>
                <p className="text-xl font-bold text-blue-600">
                  {value ? (
                    formatearFechaParaMostrar(value)
                  ) : (
                    <span className="text-gray-400 italic text-base">
                      Sin información
                    </span>
                  )}
                </p>
              </div>
            </div>
          </FadeIn>
        );
      }

      if (key === "quien_revisa") {
        return (
          <FadeIn key={key} delay={300}>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xl shadow-gray-200/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-700">
                    Revisado por
                  </h3>
                </div>
                <p className="text-xl font-bold text-green-600">
                  {value || (
                    <span className="text-gray-500 italic text-base">
                      Sin información
                    </span>
                  )}
                </p>
              </div>
            </div>
          </FadeIn>
        );
      }

      // Campos de imagen
      if (
        key === "evidencia_01" ||
        key === "evidencia_02" ||
        key === "evidencia_03"
      ) {
        const delays = {
          evidencia_01: 400,
          evidencia_02: 500,
          evidencia_03: 600,
        } as const;
        const k = key as "evidencia_01" | "evidencia_02" | "evidencia_03";
        const previewUrl = evidencePreviews[k];
        const imageToShow = previewUrl || (value as string | undefined);
        return (
          <FadeIn key={key} delay={delays[k]}>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
              <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">
                {label}
              </h3>
              <div className="flex flex-col gap-3">
                {imageToShow ? (
                  <ClickableImage
                    src={getCloudinaryThumbnailUrl(imageToShow, 400, 300)}
                    alt={label}
                    onClick={() =>
                      openModal(
                        imageToShow,
                        parseInt(key.replace("evidencia_", ""))
                      )
                    }
                  />
                ) : (
                  <p className="text-gray-400 italic font-medium">Sin imagen</p>
                )}
                {isEditing && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEvidenceInputChange(k)}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                )}
              </div>
            </div>
          </FadeIn>
        );
      }

      // Campo de notas
      if (key === "notas") {
        return (
          <FadeIn key={key} delay={700}>
            <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-600/50">
              <h3 className="text-sm font-semibold text-[#ff8c42] mb-2 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                  />
                </svg>
                {label}
              </h3>
              {isEditing && editedData ? (
                <textarea
                  value={editedData[key] as string}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="w-full px-3 py-2 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-colors resize-none"
                  rows={4}
                  placeholder="Escribe las notas aquí..."
                />
              ) : (
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {value || (
                    <span className="text-gray-500 italic">
                      Sin notas registradas
                    </span>
                  )}
                </p>
              )}
              {isEditing && (
                <div className="flex justify-end mt-2">
                  <LoadingButton
                    onClick={handleSaveEdit}
                    loading={isSubmitting}
                    variant="success"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Actualizar
                  </LoadingButton>
                </div>
              )}
            </div>
          </FadeIn>
        );
      }

      // Campos regulares
      return (
        <FadeIn
          key={key}
          delay={Math.min(800, 100 * Object.keys(fieldLabels).indexOf(key))}
        >
          <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-600/50">
            <h3 className="text-sm font-semibold text-[#ff8c42] mb-2">
              {label}
            </h3>
            {isEditing && editedData && !nonEditableFields.includes(key) ? (
              <input
                type="text"
                value={editedData[key] as string}
                onChange={(e) => handleInputChange(key, e.target.value)}
                className="w-full px-3 py-2 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-colors"
                placeholder={`Editar ${label?.toLowerCase() || "campo"}...`}
              />
            ) : (
              <p className="text-gray-300">
                {value || (
                  <span className="text-gray-500 italic">Sin información</span>
                )}
              </p>
            )}
          </div>
        </FadeIn>
      );
    },
    [
      fieldLabels,
      isEditing,
      editedData,
      handleInputChange,
      openModal,
      formatearFechaParaMostrar,
      shouldShowField,
      evidencePreviews,
      user,
    ]
  );

  // 🚀 VALIDACIÓN: Verificar que existe ID de revisión
  if (!params.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1f35] to-[#2d3748] flex items-center justify-center p-4">
        <FadeIn>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-red-400 font-bold text-lg mb-2">
              ID de revisión no válido
            </h3>
            <p className="text-gray-300 mb-4">
              No se pudo encontrar el ID de la revisión
            </p>
            <LoadingButton onClick={() => router.back()} variant="danger">
              Volver
            </LoadingButton>
          </div>
        </FadeIn>
      </div>
    );
  }

  // 🚀 LOADING INSTANTÁNEO: Mostrar skeleton mientras carga
  if (loading) {
    return <DetallesSkeleton />;
  }

  // 🚀 ERROR HANDLING
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1f35] to-[#2d3748] flex items-center justify-center p-4">
        <FadeIn>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-red-400 font-bold text-lg mb-2">
              Error al cargar
            </h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <LoadingButton
              onClick={() => window.location.reload()}
              variant="danger"
            >
              Reintentar
            </LoadingButton>
          </div>
        </FadeIn>
      </div>
    );
  }

  if (!revision) {
    return <DetallesSkeleton />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-20 bg-white">
      {/* Header */}
      <div className="max-w-4xl mx-auto pt-12 px-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.back()}
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm text-gray-400 group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 group-hover:text-gray-600 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
          </div>

          <div className="flex gap-3">
            {isEditing ? (
              <button
                onClick={handleCancelEdit}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
              >
                Cancelar
              </button>
            ) : (
              <button
                onClick={handleEdit}
                className="px-6 py-3 bg-white text-gray-800 font-bold rounded-2xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm flex items-center gap-2 border border-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Banner informativo sobre datos adicionales disponibles - Rediseñado */}
      {(hasNotas || hasRegistroEdiciones) && (
        <div className="max-w-4xl mx-auto px-6 mb-8">
          <FadeIn delay={200}>
            <div className="bg-white/50 backdrop-blur-sm border border-white rounded-[32px] p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm font-medium">
                  {hasNotas && hasRegistroEdiciones
                    ? "Notas e historial disponibles al final"
                    : hasRegistroEdiciones
                    ? "Historial disponible al final"
                    : "Notas adicionales disponibles al final"}
                </p>
              </div>
              <button 
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                className="text-blue-500 text-sm font-bold px-4 py-2 hover:bg-blue-50 rounded-xl transition-colors"
              >
                Ver ahora
              </button>
            </div>
          </FadeIn>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 mb-12">

        {/* GALERÍA DE IMÁGENES - Preview de la primera imagen (o segunda si no hay primera) */}
        {(revision?.evidencia_01 || revision?.evidencia_02) && (
          <FadeIn delay={50}>
            <div className="rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div
                className="relative group cursor-pointer"
                onClick={() => {
                  const allImages: string[] = [];
                  if (revision?.evidencia_01) allImages.push(revision.evidencia_01);
                  if (revision?.evidencia_02) allImages.push(revision.evidencia_02);
                  if (revision?.evidencia_03) allImages.push(revision.evidencia_03);
                   
                  setModalImages(allImages);
                  setModalInitialIndex(0);
                  setModalImg(allImages[0]);
                  setModalEvidenciaNumber(1);
                  setModalOpen(true);
                }}
              >
                <ClickableImage
                  src={getCloudinaryThumbnailUrl(revision?.evidencia_01 || revision?.evidencia_02 || '', 800, 450)}
                  alt="Evidencia"
                  onClick={() => {}}
                  className="w-full"
                  containerClassName="w-full"
                />
              </div>
            </div>
          </FadeIn>
        )}

        {/* GRUPO PRINCIPAL: Información Base */}
        <FadeIn delay={100}>
          <div className="bg-white rounded-[32px] p-4 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="w-11 h-11 sm:w-14 sm:h-14 bg-amber-50 rounded-[22px] flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-7 sm:w-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-base sm:text-xl font-black text-gray-800 tracking-tight">Información General</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Tarjeta unificada de información básica */}
              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Casita */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Casita</p>
                      {isEditing && user ? (
                        <input
                          type="text"
                          value={String((editedData?.casita as string) ?? revision?.casita ?? "")}
                          onChange={(e) => handleInputChange('casita', e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      ) : (
                        <p className="text-base font-black text-gray-800 truncate">{revision.casita || <span className="text-gray-400 font-medium italic">Sin info</span>}</p>
                      )}
                    </div>
                  </div>

                  {/* Fecha de Revisión */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shadow-sm flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Fecha</p>
                      <p className="text-sm font-bold text-gray-800 truncate">{revision.created_at ? formatearFechaParaMostrar(revision.created_at) : <span className="text-gray-400 italic">Sin info</span>}</p>
                    </div>
                  </div>

                  {/* Revisado por */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500 shadow-sm flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Revisor</p>
                      <p className="text-sm font-bold text-gray-800 truncate">{revision.quien_revisa || <span className="text-gray-400 italic">Sin info</span>}</p>
                    </div>
                  </div>

                  {/* Puertas y Ventanas */}
                  {shouldShowField('puertas_ventanas', revision.puertas_ventanas) && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shadow-sm flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Puertas</p>
                        {isEditing && editedData ? (
                          <input
                            type="text"
                            value={editedData.puertas_ventanas as string || ''}
                            onChange={(e) => handleInputChange('puertas_ventanas', e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-800"
                          />
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            revision.puertas_ventanas === 'Ok' || revision.puertas_ventanas === 'Limpia' || revision.puertas_ventanas === 'Si' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {String(revision.puertas_ventanas)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Caja Fuerte */}
                  {shouldShowField('caja_fuerte', revision.caja_fuerte) && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 shadow-sm flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Caja Fuerte</p>
                        {isEditing && editedData ? (
                          <input
                            type="text"
                            value={editedData.caja_fuerte as string || ''}
                            onChange={(e) => handleInputChange('caja_fuerte', e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-800"
                          />
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            revision.caja_fuerte === 'Ok' || revision.caja_fuerte === 'Limpia' || revision.caja_fuerte === 'Si' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {String(revision.caja_fuerte)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </FadeIn>

        {/* LIST SECTION HELPER COMPONENT (internal use) */}
        {(() => {
          const RenderSection = ({ title, icon, items, themeColor, delay }: { title: string, icon: React.ReactNode, items: string[], themeColor: string, delay: number }) => {
            return (
              <FadeIn delay={delay}>
                <div className="bg-white rounded-[32px] p-4 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-[22px] flex items-center justify-center shadow-sm ${
                      themeColor === 'blue' ? 'bg-blue-50 text-blue-500' :
                      themeColor === 'green' ? 'bg-emerald-50 text-emerald-500' :
                      themeColor === 'purple' ? 'bg-purple-50 text-purple-500' :
                      themeColor === 'orange' ? 'bg-orange-50 text-orange-500' : 'bg-gray-50 text-gray-500'
                    }`}>
                      {icon}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">{title}</h2>
                  </div>

                  <div className="space-y-3">
                    {items.map((key) => {
                      const value = revision[key as keyof Revision];
                      if (!shouldShowField(key as keyof Revision, value)) return null;

                      // Dinamic Icon and Colors for Items
                      const itemIconMap: Record<string, { icon: React.ReactNode, bg: string, text: string }> = {
                        chromecast: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.1 15H3a9 9 0 0 1 9 9v.9m-11.9-3A6 6 0 0 1 6 24M1 21a3 3 0 0 1 3 3M1 18V5a2 2 0 0 1 2-2h18C22.1 3 23 3.9 23 5v14a2 2 0 0 1-2 2h-6.1" /></svg>, bg: 'bg-blue-50', text: 'text-blue-500' },
                        speaker: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>, bg: 'bg-emerald-50', text: 'text-emerald-500 text-sm' },
                        usb_speaker: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v5m0 11v4M5 12h5m4 0h5M7 7l10 10M17 7L7 17" /></svg>, bg: 'bg-amber-50', text: 'text-amber-500' },
                        controles_tv: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" /></svg>, bg: 'bg-purple-50', text: 'text-purple-500' },
                        binoculares: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>, bg: 'bg-rose-50', text: 'text-rose-500' },
                        trapo_binoculares: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>, bg: 'bg-gray-100', text: 'text-gray-500' },
                        secadora: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, bg: 'bg-blue-50', text: 'text-blue-500' },
                        accesorios_secadora: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>, bg: 'bg-cyan-50', text: 'text-cyan-500' },
                        steamer: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343a7.99 7.99 0 012.344 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, bg: 'bg-indigo-50', text: 'text-indigo-500' },
                        bolsa_vapor: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>, bg: 'bg-pink-50', text: 'text-pink-500' },
                        plancha_cabello: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>, bg: 'bg-violet-50', text: 'text-violet-500' },
                        bulto: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>, bg: 'bg-orange-50', text: 'text-orange-500' },
                        sombrero: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21v-4a2 2 0 00-2-2h-2V9a5 5 0 00-10 0v4H5a2 2 0 00-2 2v4h18z" /></svg>, bg: 'bg-amber-100', text: 'text-amber-600' },
                        bolso_yute: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>, bg: 'bg-yellow-50', text: 'text-yellow-600' },
                        cola_caballo: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>, bg: 'bg-sky-50', text: 'text-sky-500' },
                        camas_ordenadas: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>, bg: 'bg-teal-50', text: 'text-teal-500' },
                      };

                      const itemUI = itemIconMap[key] || { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>, bg: 'bg-gray-50', text: 'text-gray-400' };
                      
                      const isZeroOrNo = value === 0 || value === '0' || value === 'No';
                      const isSiOrGood = value === 'Si' || value === 'Limpia' || value === 'Ok' || (typeof value === 'number' && value > 0) || (typeof value === 'string' && parseInt(value) > 0);

                      return (
                        <div key={key} className="flex items-center justify-between p-2 sm:p-3 rounded-2xl transition-all hover:bg-gray-50/50 group">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className={`w-9 h-9 sm:w-11 sm:h-11 ${itemUI.bg} rounded-xl flex items-center justify-center ${itemUI.text} shadow-sm group-hover:scale-110 transition-transform`}>
                              {itemUI.icon}
                            </div>
                            <span className="text-[14px] sm:text-[17px] font-black text-gray-800">{fieldLabels[key]}</span>
                          </div>

                          {isEditing && editedData ? (
                            <input
                              type="text"
                              value={editedData[key as keyof Revision] as string || ''}
                              onChange={(e) => handleInputChange(key as keyof Revision, e.target.value)}
                              className="w-14 sm:w-16 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-center text-gray-950 text-xs sm:text-sm focus:ring-2 focus:ring-blue-100"
                            />
                          ) : (
                            <div className={`min-w-[36px] sm:min-w-[42px] h-[28px] sm:h-[34px] rounded-full flex items-center justify-center px-2 sm:px-3 text-[12px] sm:text-[15px] font-black shadow-sm ${
                              isSiOrGood ? 'bg-emerald-100 text-emerald-800' :
                              isZeroOrNo ? 'bg-rose-100 text-rose-800' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {String(value)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </FadeIn>
            );
          };

          return (
            <div className="space-y-6">
              <RenderSection
                title="1: Electrónicos"
                icon={<svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                items={['chromecast', 'speaker', 'usb_speaker', 'controles_tv', 'secadora', 'accesorios_secadora', 'steamer', 'bolsa_vapor', 'plancha_cabello']}
                themeColor="blue"
                delay={200}
              />
              <RenderSection
                title="2: Equipamiento"
                icon={<svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                items={['binoculares', 'trapo_binoculares', 'bulto', 'sombrero', 'bolso_yute', 'cola_caballo']}
                themeColor="orange"
                delay={300}
              />
              <RenderSection
                title="3: Habitación"
                icon={<svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                items={['camas_ordenadas']}
                themeColor="purple"
                delay={400}
              />


              {/* Observaciones Finales - Rediseñadas */}
              <FadeIn delay={600}>
                <div className="bg-white rounded-[32px] p-4 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 bg-cyan-50 rounded-[22px] flex items-center justify-center text-cyan-500 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">Observaciones Finales</h2>
                  </div>
                  <div className="bg-gray-50/50 rounded-2xl p-4 sm:p-6 border border-gray-100">
                    {renderField('notas', revision.notas)}
                  </div>
                </div>
              </FadeIn>
            </div>
          );
        })()}
      </div>

      {/* Sección de Notas Adicionales Existentes - Rediseñada */}
      {notas.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 mb-8">
          <FadeIn delay={700}>
            <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-purple-50 rounded-[22px] flex items-center justify-center text-purple-500 shadow-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-7 w-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight">
                    Notas Adicionales ({notas.length})
                  </h3>
                </div>
              </div>

              <div className="space-y-6">
                {notas.map((nota, index) => (
                  <FadeIn key={nota.id} delay={100 + index * 50}>
                    <div className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-100 hover:bg-gray-50 transition-colors group">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm font-black text-sm">
                              {(nota as any).Usuario?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <p className="text-gray-800 font-bold uppercase tracking-wide text-sm">
                                {(nota as any).Usuario || "Usuario"}
                              </p>
                              <p className="text-gray-400 text-xs font-semibold">
                                {(nota as any).fecha ? formatearFechaParaMostrar((nota as any).fecha) : "Sin fecha"}
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-600 leading-relaxed text-[17px]">
                            {(nota as any).nota}
                          </p>
                        </div>
                        
                        {(nota as any).Evidencia && (
                          <div className="md:w-48 flex-shrink-0">
                            <div className="rounded-2xl overflow-hidden shadow-sm border-4 border-white">
                              <ClickableImage
                                src={getCloudinaryThumbnailUrl((nota as any).Evidencia, 400, 300)}
                                alt="Evidencia de nota"
                                onClick={() => openModal((nota as any).Evidencia)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      )}

      {/* Botón para cargar notas si no se han mostrado */}
      {hasNotas && notas.length === 0 && !showNotaForm && (
        <div className="max-w-4xl mx-auto px-6 mb-8">
          <FadeIn delay={750}>
            <button
              onClick={() => loadSecondaryData()}
              disabled={secondaryLoading}
              className="w-full bg-white border border-gray-100 p-6 rounded-[32px] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-4 group active:scale-[0.99]"
            >
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                {secondaryLoading ? (
                  <div className="w-6 h-6 border-3 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
                  </svg>
                )}
              </div>
              <div className="text-left">
                <span className="block text-gray-800 font-black text-lg">Cargar Notas Adicionales</span>
                <span className="text-gray-400 text-sm font-medium">Se han encontrado comentarios registrados</span>
              </div>
            </button>
          </FadeIn>
        </div>
      )}

      {/* Historial de Ediciones - Rediseñado */}
      {hasRegistroEdiciones && (
        <div className="max-w-4xl mx-auto px-6 mb-8">
          <FadeIn delay={800}>
            <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-blue-50 rounded-[22px] flex items-center justify-center text-blue-500 shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">
                  Historial de Ediciones
                </h3>
              </div>

              {registroEdiciones.length > 0 ? (
                <div className="space-y-4">
                  {registroEdiciones.map((edicion, index) => {
                    const anterior = parseEditData((edicion as any).Dato_anterior);
                    const nuevo = parseEditData((edicion as any).Dato_nuevo);
                    const isEvidence = anterior.fieldName.includes("evidencia");

                    return (
                      <FadeIn key={(edicion as any).id || index} delay={100 + index * 50}>
                        <div className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-100 group">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-50 font-black">
                                {(edicion as any)["Usuario que Edito"]?.charAt(0)?.toUpperCase() || "E"}
                              </div>
                              <div>
                                <p className="text-gray-800 font-bold text-sm">
                                  {(edicion as any)["Usuario que Edito"] || "Usuario"}
                                </p>
                                <p className="text-gray-400 text-xs font-semibold">
                                  {formatearFechaParaMostrar((edicion as any).created_at)}
                                </p>
                              </div>
                            </div>
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
                              {anterior.displayName}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                              <span className="block text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Anterior</span>
                              {isEvidence ? (
                                <div className="mt-1 w-20 h-20 rounded-lg overflow-hidden border-2 border-white shadow-sm">
                                  <ClickableImage
                                    src={getCloudinaryThumbnailUrl(anterior.value, 200, 200)}
                                    alt="Anterior"
                                    onClick={() => openModal(anterior.value)}
                                  />
                                </div>
                              ) : (
                                <span className="text-gray-600 font-medium break-all">{anterior.value || "Vacío"}</span>
                              )}
                            </div>
                            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                              <span className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Nuevo</span>
                              {isEvidence ? (
                                <div className="mt-1 w-20 h-20 rounded-lg overflow-hidden border-2 border-white shadow-sm">
                                  <ClickableImage
                                    src={getCloudinaryThumbnailUrl(nuevo.value, 200, 200)}
                                    alt="Nuevo"
                                    onClick={() => openModal(nuevo.value)}
                                  />
                                </div>
                              ) : (
                                <span className="text-gray-800 font-black break-all">{nuevo.value || "Vacío"}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </FadeIn>
                    );
                  })}
                </div>
              ) : (
                <button
                  onClick={() => loadSecondaryData()}
                  disabled={secondaryLoading}
                  className="w-full bg-gray-50 border border-gray-100 p-6 rounded-[32px] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-4 group active:scale-[0.99]"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    {secondaryLoading ? (
                      <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="text-left">
                    <span className="block text-gray-800 font-black text-lg">Ver Historial Completo</span>
                    <span className="text-gray-400 text-sm font-medium">Consultar cambios realizados anteriormente</span>
                  </div>
                </button>
              )}
            </div>
          </FadeIn>
        </div>
      )}

      {/* SECCIÓN AGREGAR NOTA AL FINAL - Rediseñada */}
      <div className="max-w-4xl mx-auto px-6 mb-12">
        {showNotaForm ? (
          <FadeIn delay={100}>
            <div className="bg-white rounded-[32px] p-8 shadow-[0_20px_50px_rgb(0,0,0,0.1)] border border-pink-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-pink-50 rounded-[22px] flex items-center justify-center text-pink-500 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight">Nueva Nota</h3>
                </div>
                <button 
                  onClick={() => setShowNotaForm(false)}
                  className="w-10 h-10 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitNota} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Usuario</label>
                    <input
                      type="text"
                      value={nuevaNota.Usuario}
                      onChange={(e) => setNuevaNota({ ...nuevaNota, Usuario: e.target.value })}
                      placeholder="Tu nombre"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-800 focus:ring-4 focus:ring-pink-50 focus:border-pink-200 outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Evidencia (Opcional)</label>
                    <div className="relative group">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full bg-gray-50 border border-gray-100 border-dashed rounded-2xl px-6 py-4 text-gray-500 flex items-center justify-between group-hover:bg-gray-100 group-hover:border-pink-200 transition-all">
                        <span className="truncate">{nuevaNota.evidencia ? (nuevaNota.evidencia as any).name : "Seleccionar imagen"}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Mensaje de la Nota</label>
                  <textarea
                    value={nuevaNota.nota}
                    onChange={(e) => setNuevaNota({ ...nuevaNota, nota: e.target.value })}
                    placeholder="Escribe aquí los detalles o aclaraciones..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-800 focus:ring-4 focus:ring-pink-50 focus:border-pink-200 outline-none transition-all resize-none h-40"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingNota}
                  className="w-full bg-pink-500 text-white font-black py-5 rounded-[22px] hover:bg-pink-600 transition-all active:scale-[0.98] shadow-xl shadow-pink-100 flex items-center justify-center gap-3 text-lg"
                >
                  {isSubmittingNota ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                  {isSubmittingNota ? "Guardando Nota..." : "Publicar Nota"}
                </button>
              </form>
            </div>
          </FadeIn>
        ) : (
          <FadeIn delay={100}>
            <button
              onClick={() => setShowNotaForm(true)}
              className="w-full bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-4 group active:scale-[0.98]"
            >
              <div className="w-16 h-16 bg-pink-50 rounded-[22px] flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="text-left">
                <span className="block text-gray-800 font-black text-2xl tracking-tight">Agregar una Nota</span>
                <span className="text-gray-400 font-semibold tracking-wide">Dejar un comentario o aclaración sobre esta revisión</span>
              </div>
            </button>
          </FadeIn>
        )}
      </div>

      <Suspense fallback={null}>
        <ImageModal
          key={`modal-${modalOpen ? 'open' : 'closed'}-${Date.now()}`}
          isOpen={modalOpen}
          images={modalImages}
          initialIndex={modalInitialIndex}
          casita={revision?.casita}
          evidenciaNumber={modalEvidenciaNumber}
          onClose={closeModal}
        />
      </Suspense>

      {/* Botón flotante de guardar (solo visible en modo edición) */}
      {isEditing && (
        <button
          onClick={handleSaveEdit}
          disabled={isSubmitting}
          className="fixed bottom-24 right-6 z-50 bg-emerald-500 text-white rounded-full shadow-2xl shadow-emerald-500/40 hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 px-6 py-4 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Guardar
            </>
          )}
        </button>
      )}
    </div>
  );
});


DetalleRevision.displayName = "DetalleRevision";

export default DetalleRevision;
