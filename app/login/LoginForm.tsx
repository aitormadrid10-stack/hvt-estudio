'use client';
import { useActionState } from 'react';
import { sendLink, type LoginState } from './actions';

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendLink, { ok: false, msg: '' });
  if (state.ok) {
    return (
      <div className="in" role="status" style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center' }}>
        <span className="t2">Revisa tu correo</span>
        <span className="sub" style={{ fontSize: 15, lineHeight: 1.5 }}>
          Te hemos enviado un enlace a <b style={{ color: 'var(--txt)' }}>{state.email}</b>. Ábrelo en este mismo dispositivo para entrar.
        </span>
      </div>
    );
  }
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input type="hidden" name="next" value={next} />
      <label htmlFor="email" className="sub" style={{ fontSize: 14 }}>Email</label>
      <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="tu@email.com" className="input" />
      {state.msg && <span role="alert" style={{ color: 'var(--badink)', fontSize: 14 }}>{state.msg}</span>}
      <button type="submit" className="btn b-pri big" disabled={pending} style={{ marginTop: 4 }}>
        {pending ? 'Enviando…' : 'Enviarme el enlace'}
      </button>
      <span className="sub" style={{ fontSize: 13, textAlign: 'center' }}>Sin contraseña: entras con un enlace que llega a tu correo.</span>
    </form>
  );
}
