/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚀 NETLIFY OPTIMIZADO: Configuración específica para evitar problemas de hydratación
  reactStrictMode: false, // Deshabilitado para producción en Netlify
  
  // 🔧 OUTPUT: Configuración específica para Netlify con API routes
  output: 'standalone', // Usar 'standalone' para soportar API routes
  trailingSlash: true, // Netlify funciona mejor con trailing slashes
  
  // 🖼️ IMÁGENES: Optimización para Netlify
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dhd61lan4.cloudinary.net',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
    ],
  },
  
  // 🌍 VARIABLES DE ENTORNO
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    GOOGLE_SHEETS_CLIENT_EMAIL: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    GOOGLE_SHEETS_PRIVATE_KEY: process.env.GOOGLE_SHEETS_PRIVATE_KEY
  },
  
  // 🔒 HEADERS OPTIMIZADOS PARA NETLIFY
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      // Headers adicionales para evitar problemas de hydratación
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // 🔄 WEBPACK: Configuración optimizada
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // ⚡ CONFIGURACIÓN DE RENDIMIENTO
  poweredByHeader: false,
  
  // 🚫 DESHABILITAR CARACTERÍSTICAS PROBLEMÁTICAS EN NETLIFY
  experimental: {
    scrollRestoration: true,
  },
  // Asegurarse de que no haya configuraciones obsoletas
};

module.exports = nextConfig;