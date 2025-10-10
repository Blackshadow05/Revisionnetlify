import Link from 'next/link';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { formatearFecha } from '@/lib/dateUtils';
import BackButton from '@/components/ui/BackButton';
import { MenuSkeleton } from '@/components/ui/MenuSkeleton';

interface Menu {
  id: string;
  fecha_menu: string;
  contenido_menu: string;
}

interface MenuDiario {
  dia_semana: string;
  fecha: string;
  comidas: string[];
}

// Server-side data fetching
async function getMenusRecientes(): Promise<Menu[]> {
  try {
    const { data, error } = await supabase
      .from('menus')
      .select('id, fecha_menu, contenido_menu') // Only select required columns
      .order('fecha_menu', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error al cargar menús:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error inesperado al cargar menús:', error);
    return [];
  }
}

// Pre-parse menu content on server
function parseMenuContent(contenidoMenu: string): MenuDiario | null {
  try {
    const parsed = JSON.parse(contenidoMenu);
    return parsed;
  } catch (err) {
    console.error('Error al parsear contenido del menú:', err);
    return null;
  }
}

function renderComidas(comidas: string[]) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-green-400 mb-2">🍽️ Comidas del día</h4>
      <ul className="text-sm text-gray-300 space-y-1">
        {comidas.map((item, idx) => (
          <li key={idx} className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function MenusPage() {
  // Server-side data fetching
  const menus = await getMenusRecientes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <BackButton href="/" iconOnly ariaLabel="Volver al inicio" />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
              Menús Recientes
            </h1>
          </div>
          <Link 
            href="/escanear-menu" 
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-green-500/30 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Escanear Menú
          </Link>
        </div>

        {menus.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-400 mb-2">No hay menús guardados</h3>
            <p className="text-gray-500 mb-6">Comienza escaneando tu primer menú</p>
            <Link 
              href="/escanear-menu"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-green-500/30"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Escanear Menú
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {menus.map((menu) => {
              const menuContent = parseMenuContent(menu.contenido_menu);
              return (
                <div key={menu.id} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-6 hover:border-purple-500/50 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {menuContent?.dia_semana || 'Menú'}
                      </h3>
                      <p className="text-sm text-purple-400">
                        {formatearFecha(menu.fecha_menu)}
                      </p>
                    </div>
                  </div>

                  {menuContent ? (
                    <div className="mb-4">
                      {renderComidas(menuContent.comidas)}
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="text-sm text-gray-400 bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                        <p className="whitespace-pre-wrap">{menu.contenido_menu}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                    <span className="text-xs text-gray-500">
                      Fecha: {formatearFecha(menu.fecha_menu)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
