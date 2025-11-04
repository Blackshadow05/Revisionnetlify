'use client';

import { useState } from 'react';
import ClickableImage from '@/components/ui/ClickableImage';
import { getConsistentImageUrl, getCloudinaryThumbnailUrl } from '@/lib/cloudinary';

// Ejemplos de URLs en ambos formatos
const testUrls = [
  {
    name: 'URL completa de Cloudinary',
    url: 'https://res.cloudinary.com/dhd61lan4/image/upload/f_auto,q_auto/v1762177581/Evidencias/Noviembre%202025/1000422384_rnmg3j.webp'
  },
  {
    name: 'URL relativa',
    url: 'Evidencias/Noviembre 2025/evidencia_evidencia1_1762177486'
  },
  {
    name: 'Otra URL relativa',
    url: 'notas/2024/11/ejemplo_nota_123456789'
  }
];

export default function PruebaUrlsImagenes() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedImage(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Prueba de URLs de Imágenes</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">URLs de Prueba</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testUrls.map((test, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">{test.name}</h3>
                <p className="text-sm text-gray-400 mb-4 break-all">{test.url}</p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">URL Consistente:</h4>
                  <p className="text-xs text-blue-400 break-all">
                    {getConsistentImageUrl(test.url)}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Thumbnail (400x300):</h4>
                  <p className="text-xs text-green-400 break-all mb-2">
                    {getCloudinaryThumbnailUrl(test.url, 400, 300)}
                  </p>
                  <ClickableImage
                    src={getCloudinaryThumbnailUrl(test.url, 400, 300)}
                    alt={`Imagen de prueba: ${test.name}`}
                    onClick={() => openModal(test.url)}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal simple para vista ampliada */}
        {modalOpen && selectedImage && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={closeModal}
                className="absolute -top-12 right-0 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img
                src={getConsistentImageUrl(selectedImage)}
                alt="Imagen ampliada"
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const consistentUrl = getConsistentImageUrl(selectedImage);
                  if (target.src !== consistentUrl) {
                    target.src = consistentUrl;
                  } else if (target.src !== selectedImage) {
                    target.src = selectedImage;
                  }
                }}
              />
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-300">URL original:</p>
                <p className="text-xs text-gray-400 break-all">{selectedImage}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}