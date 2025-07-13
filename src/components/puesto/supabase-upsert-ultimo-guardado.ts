import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function upsertUltimoGuardado() {
  // Usa la hora local del dispositivo, formato timestamp sin zona horaria
  const ahora = new Date();
  // Construir string local YYYY-MM-DD HH:mm:ss
  const fechaLocal = [
    ahora.getFullYear(),
    String(ahora.getMonth() + 1).padStart(2, '0'),
    String(ahora.getDate()).padStart(2, '0')
  ].join('-') + ' ' + [
    String(ahora.getHours()).padStart(2, '0'),
    String(ahora.getMinutes()).padStart(2, '0'),
    String(ahora.getSeconds()).padStart(2, '0')
  ].join(':');
  const { error } = await supabase
    .from('Ultimos_guardados')
    .upsert([
      { id: 1, Fecha: fechaLocal, Dato_guardado: 'puesto-01' }
    ], { onConflict: 'id' });
  if (error) {
    console.error('Error al guardar en Ultimos_guardados:', error);
  }
}
