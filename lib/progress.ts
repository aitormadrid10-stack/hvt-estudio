import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Apartados estudiados por tema: { slug: Set(ids) } */
export async function getProgreso(supabase: SupabaseClient, tema?: string) {
  let q = supabase.from('progreso').select('tema, apartado').range(0, 4999);
  if (tema) q = q.eq('tema', tema);
  const { data } = await q;
  const map: Record<string, string[]> = {};
  for (const r of data ?? []) (map[r.tema] ??= []).push(r.apartado);
  return map;
}

export async function getPerfil(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from('perfiles').select('ultimo_tema, ultima_seccion').eq('id', userId).maybeSingle();
  return data as { ultimo_tema: string | null; ultima_seccion: number | null } | null;
}
