'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PuestoService } from '@/lib/puesto-service';
import { PuestoDataItem } from '@/types/puesto';
import PageTitle from '@/components/ui/PageTitle';

interface SectionProps {
  title: string;
  records: PuestoDataItem[];
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}

function Section({ title, records, icon, colorClass, bgClass }: SectionProps) {
  return (
    <section className="mb-8">
      <div className={`bg-[#1a1f35]/95 rounded-xl p-6 border border-gray-600/50 backdrop-blur-sm`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg ${colorClass} bg-opacity-20`}>
            {icon}
          </div>
          <h3 className={`text-xl font-bold ${colorClass}`}>
            {title}
          </h3>
          <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${colorClass} bg-opacity-20 border border-current border-opacity-30`}>
            {records.length}
          </span>
        </div>
        
        {records.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700/50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg font-medium">No hay registros</p>
            <p className="text-gray-500 text-sm mt-1">No se encontraron elementos para esta categoría</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {records.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/60 border border-gray-600/50 rounded-xl p-5 hover:bg-slate-700/60 transition-all duration-300 hover:border-gray-500/70 hover:shadow-lg hover:shadow-black/20"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm shadow-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                          </svg>
                          {item.tipo}
                        </div>
                        <h4 className="text-white font-bold text-lg leading-tight">
                          {item.nombre}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-amber-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                          </svg>
                          <span className="text-amber-400 font-bold text-base px-2 py-1 bg-amber-400/20 rounded-md border border-amber-400/30">
                            {item.casita}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
                        </svg>
                        <span className="text-gray-300 text-sm">
                          {item.detalle || 'Sin detalle específico'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m0-3.75A1.125 1.125 0 013.375 9h.75m0 0h4.5m0 0a1.5 1.5 0 011.5-1.5m0 0h6m-3 0a1.5 1.5 0 011.5 1.5m0 0v1.5m0 0h4.5a1.125 1.125 0 011.125 1.125v3.75M8.25 18.75V16.5a1.5 1.5 0 011.5-1.5h6a1.5 1.5 0 011.5 1.5v2.25m-3-6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        </svg>
                        <span className="text-gray-300 text-sm">
                          Placa: <span className="font-mono font-medium">{item.placa || 'N/A'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-700/50 rounded-lg border border-gray-600/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.horaIngreso ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Ingreso</p>
                        <p className="text-white font-medium">
                          {item.horaIngreso || 'Pendiente'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-700/50 rounded-lg border border-gray-600/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.horaSalida ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m1.5-6l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Salida</p>
                        <p className="text-white font-medium">
                          {item.horaSalida || 'Pendiente'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function PendientesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const [pendingTours, setPendingTours] = useState<PuestoDataItem[]>([]);
  const [pendingCheckIns, setPendingCheckIns] = useState<PuestoDataItem[]>([]);
  const [pendingCheckOuts, setPendingCheckOuts] = useState<PuestoDataItem[]>([]);
  const [completedTours, setCompletedTours] = useState<PuestoDataItem[]>([]);
  const [completedCheckIns, setCompletedCheckIns] = useState<PuestoDataItem[]>([]);
  const [completedCheckOuts, setCompletedCheckOuts] = useState<PuestoDataItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      const today = new Date();
      // Convertir a formato DD/MM/YYYY como se guarda en Supabase
      const day = today.getDate().toString().padStart(2, '0');
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear();
      const fechaFormato = `${day}/${month}/${year}`;
      
      console.log('🔍 Buscando registros para fecha:', fechaFormato);
      setDebugInfo(`Buscando registros para fecha: ${fechaFormato}`);
      
      const records = await PuestoService.getRecordsByDate(fechaFormato);
      
      console.log('📊 Total de registros encontrados:', records.length);
      console.log('📋 Registros completos:', records);
      
      let debugText = `Fecha buscada: ${fechaFormato}\nTotal registros: ${records.length}\n`;
      
      // Mostrar algunos registros de ejemplo
      if (records.length > 0) {
        console.log('📝 Ejemplo de registro:', records[0]);
        console.log('📅 Fechas encontradas:', records.map(r => r.fecha));
        debugText += `Fechas en registros: ${records.map(r => r.fecha).join(', ')}\n`;
        debugText += `Tipos en registros: ${records.map(r => r.tipo).join(', ')}\n`;
      } else {
        debugText += 'No se encontraron registros\n';
        
        // Intentar obtener todos los registros para debug
        const allRecords = await PuestoService.getAllRecords();
        console.log('📊 Total registros en tabla:', allRecords.length);
        if (allRecords.length > 0) {
          console.log('📅 Todas las fechas en tabla:', allRecords.map(r => r.fecha));
          debugText += `Total en tabla: ${allRecords.length}\n`;
          debugText += `Fechas en tabla: ${allRecords.slice(0, 5).map(r => r.fecha).join(', ')}\n`;
        }
      }

      setDebugInfo(debugText);

      const isPending = (item: PuestoDataItem) => !item.horaIngreso || !item.horaSalida;
      const isComplete = (item: PuestoDataItem) => item.horaIngreso && item.horaSalida;

      const pendingToursData = records.filter(r => r.tipo === 'Tour' && isPending(r));
      const pendingCheckInsData = records.filter(r => r.tipo === 'Check in' && isPending(r));
      const pendingCheckOutsData = records.filter(r => r.tipo === 'Check out' && isPending(r));
      const completedToursData = records.filter(r => r.tipo === 'Tour' && isComplete(r));
      const completedCheckInsData = records.filter(r => r.tipo === 'Check in' && isComplete(r));
      const completedCheckOutsData = records.filter(r => r.tipo === 'Check out' && isComplete(r));
      
      console.log('🎯 Clasificación de registros:');
      console.log('Tours pendientes:', pendingToursData.length);
      console.log('Check in pendientes:', pendingCheckInsData.length);
      console.log('Check out pendientes:', pendingCheckOutsData.length);
      console.log('Tours completados:', completedToursData.length);
      console.log('Check in completados:', completedCheckInsData.length);
      console.log('Check out completados:', completedCheckOutsData.length);

      setPendingTours(pendingToursData);
      setPendingCheckIns(pendingCheckInsData);
      setPendingCheckOuts(pendingCheckOutsData);
      setCompletedTours(completedToursData);
      setCompletedCheckIns(completedCheckInsData);
      setCompletedCheckOuts(completedCheckOutsData);
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      setDebugInfo(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const today = new Date();
  const fechaHoy = today.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Función para determinar qué secciones mostrar según el filtro
  const shouldShowPending = filter === 'all' || filter === 'pending';
  const shouldShowCompleted = filter === 'all' || filter === 'completed';

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: '#334d50',
        backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)'
      }}
    >
      {/* Fondo decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#c9a45c]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <main className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/50 rounded-full border border-gray-600/50 backdrop-blur-sm mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-[#c9a45c] to-[#f0c987] rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-800">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <span className="text-[#c9a45c] font-medium">Puesto 01</span>
          </div>
          
          <PageTitle size="md" className="mb-4">Control de Pendientes</PageTitle>
          <p className="text-xl text-gray-300 capitalize">
            {fechaHoy}
          </p>
        </div>

        {/* Botones de acción y filtros */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          {/* Botón Volver */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium border border-gray-600/20 relative overflow-hidden"
          >
            {/* Efecto de brillo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0cb35]/80 to-transparent animate-[slide_2s_ease-in-out_infinite] z-0"></div>
            <div className="relative z-10 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </div>
          </button>

          {/* Filtros */}
          <div className="flex items-center gap-3">
            <span className="text-gray-300 text-sm font-medium">Mostrar:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'all'
                    ? 'bg-[#c9a45c] text-[#1a1f35] shadow-lg'
                    : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'pending'
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'completed'
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                }`}
              >
                Completados
              </button>
            </div>
          </div>
        </div>

        {/* Debug info panel eliminado */}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-4 border-[#c9a45c] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xl text-gray-300">Cargando datos...</span>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Columna de Pendientes */}
            {shouldShowPending && (
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-orange-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-orange-400">Pendientes</h2>
                </div>
                
                <Section 
                  title="Tours pendientes de ingreso" 
                  records={pendingTours} 
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-yellow-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                    </svg>
                  }
                  colorClass="text-yellow-400"
                  bgClass="bg-gradient-to-br from-yellow-500/10 to-orange-500/10"
                />
                
                <Section 
                  title="Check in pendientes" 
                  records={pendingCheckIns} 
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-orange-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                  }
                  colorClass="text-orange-400"
                  bgClass="bg-gradient-to-br from-orange-500/10 to-red-500/10"
                />
                
                <Section 
                  title="Check out pendientes" 
                  records={pendingCheckOuts} 
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-red-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m1.5-6l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  }
                  colorClass="text-red-400"
                  bgClass="bg-gradient-to-br from-red-500/10 to-pink-500/10"
                />
              </div>
            )}

            {/* Columna de Completados */}
            {shouldShowCompleted && (
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-green-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-green-400">Completados</h2>
                </div>
                
                <Section 
                  title="Tours que ya ingresaron" 
                  records={completedTours} 
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  colorClass="text-emerald-400"
                  bgClass="bg-gradient-to-br from-emerald-500/10 to-teal-500/10"
                />
                
                <Section 
                  title="Check in que ya ingresaron" 
                  records={completedCheckIns} 
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-rose-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  colorClass="text-rose-400"
                  bgClass="bg-gradient-to-br from-rose-500/10 to-pink-500/10"
                />
                
                <Section 
                  title="Check out que ya salieron" 
                  records={completedCheckOuts} 
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  colorClass="text-blue-400"
                  bgClass="bg-gradient-to-br from-blue-500/10 to-indigo-500/10"
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 