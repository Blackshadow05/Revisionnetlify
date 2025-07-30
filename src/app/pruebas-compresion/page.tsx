'use client';

import dynamic from 'next/dynamic';

const CompressionTester = dynamic(() => import('@/components/CompressionTester'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Cargando laboratorio de compresión...</p>
      </div>
    </div>
  )
});

export default function PruebasCompresion() {
  return <CompressionTester />;
}
