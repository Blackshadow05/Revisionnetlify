'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onShowReportModal?: () => void;
}

interface MenuItemWithHref {
  name: string;
  href: string;
  icon: React.ReactElement;
  color: string;
  show: boolean;
}

interface MenuItemWithClick {
  name: string;
  onClick: () => void;
  icon: React.ReactElement;
  color: string;
  show: boolean;
}

type MenuItem = MenuItemWithHref | MenuItemWithClick;

export default function Sidebar({ isOpen, onClose, onShowReportModal }: SidebarProps) {
  const router = useRouter();
  const { isLoggedIn, userRole, user, logout } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevenir scroll del body cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isVisible) return null;

  const handleLinkClick = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleReportClick = () => {
    onClose();
    onShowReportModal?.();
  };

  const menuItems = [
    {
      title: 'Herramientas',
      items: [
        {
          name: 'Unir Imágenes',
          href: '/unir-imagenes',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          ),
          color: 'text-blue-400',
          show: user === 'Esteban B' // 🔒 Solo visible para Esteban B
        },
        {
          name: 'Gestión Usuarios',
          href: '/gestion-usuarios',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          ),
          color: 'text-purple-400',
          show: userRole === 'SuperAdmin'
        },
        {
          name: 'Revisiones In/Out',
          href: '/check-in-out',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3h12.75" />
            </svg>
          ),
          color: 'text-orange-400',
          show: isLoggedIn
        },
        {
          name: 'Menús',
          href: '/menus',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
            </svg>
          ),
          color: 'text-green-400',
          show: isLoggedIn
        },
        {
          name: 'Puesto 01',
          href: '/puesto-01',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          ),
          color: 'text-emerald-400',
          show: isLoggedIn
        },
        {
          name: 'Estadísticas',
          href: '/estadisticas',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          ),
          color: 'text-yellow-400',
          show: isLoggedIn
        },
        {
          name: 'Pendientes P-01',
          href: '/pendientes-p01',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18M3 7.5h18M3 12h18M3 16.5h18M3 21h18" />
            </svg>
          ),
          color: 'text-cyan-400',
          show: isLoggedIn
        },
      ]
    },
    {
      title: 'Reportes',
      items: [
        {
          name: 'Exportar Reporte',
          onClick: handleReportClick,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          ),
          color: 'text-green-400',
          show: userRole === 'SuperAdmin'
        },
        {
          name: 'Reportes',
          href: '/reportes',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.75m-16.5 0h.008v.008H3v-.008z" />
            </svg>
          ),
          color: 'text-blue-400',
          show: isLoggedIn
        }
      ]
    }
  ];

  return (
    <>
      {/* Overlay con blur */}
      <div 
        className={`fixed inset-0 z-[60] transition-all duration-300 ${
          isOpen 
            ? 'backdrop-blur-sm bg-black/50 opacity-100' 
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full z-[70] transition-all duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '320px' }}
      >
        {/* Glassmorphism background */}
        <div className="h-full relative overflow-hidden">
          {/* Fondo principal con glassmorphism */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e2538]/95 via-[#2a3347]/90 to-[#1a1f35]/95 backdrop-blur-xl border-r border-[#c9a45c]/20" />
          
          {/* Efectos de gradiente adicionales */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#c9a45c]/10 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#f0c987]/5 to-transparent" />
          
          {/* Contenido del sidebar */}
          <div className="relative h-full flex flex-col">
            {/* Header */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#3a4357] rounded-xl flex items-center justify-center shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#c9a45c]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Menú
                    </h2>
                    <p className="text-xs text-gray-400">Herramientas y opciones</p>
                  </div>
                </div>
                
                {/* Botón cerrar */}
                <button
                  onClick={onClose}
                  className="w-8 h-8 bg-[#3a4357] rounded-lg flex items-center justify-center shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)] transition-all duration-200 hover:scale-105 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.1)]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Información del usuario */}
            {user && (
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#3a4357] rounded-full flex items-center justify-center shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-[#c9a45c]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{user}</p>
                    <p className="text-[#c9a45c] text-sm font-medium">{userRole}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Menú items */}
            <div className="flex-1 overflow-y-auto py-4">
              {menuItems.map((section, sectionIndex) => (
                <div key={section.title} className="mb-6">
                  {/* Título de sección */}
                  <div className="px-6 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-[#3a4357]" />
                      <h3 className="text-xs font-bold text-[#c9a45c] uppercase tracking-wider">
                        {section.title}
                      </h3>
                      <div className="h-px flex-1 bg-[#3a4357]" />
                    </div>
                  </div>

                  {/* Items del menú */}
                  <div className="space-y-1 px-3">
                    {section.items
                      .filter(item => item.show)
                      .map((item, itemIndex) => (
                        <div key={item.name} className="relative group">
                          {'href' in item && item.href ? (
                            <button
                              onClick={() => handleLinkClick(item.href)}
                              className="w-full flex items-center gap-3 px-3 py-3 text-white rounded-xl transition-all duration-300 hover:bg-[#4a5367] group relative overflow-hidden shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.1)]"
                            >
                              <div className={`${item.color} group-hover:scale-110 transition-transform duration-200 relative z-10`}>
                                {item.icon}
                              </div>
                              <span className="font-medium relative z-10">
                                {item.name}
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={item.onClick}
                              className="w-full flex items-center gap-3 px-3 py-3 text-white rounded-xl transition-all duration-300 hover:bg-[#4a5367] group relative overflow-hidden shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.1)]"
                            >
                              <div className={`${item.color} group-hover:scale-110 transition-transform duration-200 relative z-10`}>
                                {item.icon}
                              </div>
                              <span className="font-medium relative z-10">
                                {item.name}
                              </span>
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer con botón de logout */}
            {isLoggedIn && (
              <div className="p-6">
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 text-red-300 rounded-xl transition-all duration-300 hover:bg-[#4a5367] group relative overflow-hidden shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.1)]"
                >
                  <div className="text-red-400 group-hover:scale-110 transition-transform duration-200 relative z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                  </div>
                  <span className="font-medium relative z-10">
                    Cerrar Sesión
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 