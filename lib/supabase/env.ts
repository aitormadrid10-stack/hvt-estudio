/**
 * Base de datos de la app. Prioridad:
 * 1) NEXT_PUBLIC_HVT_SUPABASE_URL / NEXT_PUBLIC_HVT_SUPABASE_KEY (proyecto con las tablas de HVT)
 * 2) Las variables que crea la integración de Supabase en Vercel.
 */
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_HVT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!;
export const SUPABASE_KEY = (process.env.NEXT_PUBLIC_HVT_SUPABASE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
