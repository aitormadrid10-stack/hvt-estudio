'use server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type LoginState = { ok: boolean; msg: string; email?: string };

export async function sendLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get('email') || '').trim().toLowerCase();
  const next = String(form.get('next') || '/');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, msg: 'Escribe un email válido.' };
  const h = await headers();
  const origin = h.get('origin') ?? `https://${h.get('x-forwarded-host') ?? h.get('host')}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next.startsWith('/') ? next : '/')}` },
  });
  if (error) {
    const wait = /rate|seconds/i.test(error.message);
    return { ok: false, msg: wait ? 'Has pedido varios enlaces seguidos. Espera un minuto y vuelve a intentarlo.' : 'No se pudo enviar el enlace. Inténtalo de nuevo.' };
  }
  return { ok: true, msg: '', email };
}
