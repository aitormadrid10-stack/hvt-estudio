'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RichItems } from './Rich';
import Ring from './Ring';
import { Check, ChevDown, Expand } from './icons';

type Apartado = { id: string; titulo: string; grupo: string | null; resumen: [string, string][]; completo: [string, string][]; img: string | null; terminos: string[] };

export default function TemaResumen({ slug, meta, objetivos, secciones, seccion, prev, next, estudiados, nPreguntasSeccion }: {
  slug: string;
  meta: string;
  objetivos: string[];
  secciones: { n: number; titulo: string; ids: string[] }[];
  seccion: { n: number; titulo: string; apartados: Apartado[] };
  prev: { n: number; titulo: string } | null;
  next: { n: number; titulo: string } | null;
  estudiados: string[];
  nPreguntasSeccion: number;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [done, setDone] = useState<Set<string>>(() => new Set(estudiados));
  const [more, setMore] = useState<Record<string, boolean>>({});
  const [img, setImg] = useState<{ src: string; alt: string } | null>(null);
  const [err, setErr] = useState('');
  const total = secciones.reduce((a, s) => a + s.ids.length, 0);
  const pct = Math.round((done.size / Math.max(1, total)) * 100);
  const secDone = seccion.apartados.filter((a) => done.has(a.id)).length;

  useEffect(() => {
    if (!img) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setImg(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [img]);

  async function toggle(id: string) {
    const on = !done.has(id);
    const nextSet = new Set(done);
    if (on) nextSet.add(id); else nextSet.delete(id);
    setDone(nextSet);
    setErr('');
    const { error } = on
      ? await supabase.from('progreso').upsert({ tema: slug, apartado: id })
      : await supabase.from('progreso').delete().eq('tema', slug).eq('apartado', id);
    if (error) {
      setDone(done);
      setErr('No se pudo guardar. Revisa la conexión e inténtalo otra vez.');
    }
  }

  async function marcarSeccion() {
    const ids = seccion.apartados.map((a) => a.id).filter((id) => !done.has(id));
    if (!ids.length) return;
    const nextSet = new Set(done);
    ids.forEach((id) => nextSet.add(id));
    setDone(nextSet);
    const { error } = await supabase.from('progreso').upsert(ids.map((apartado) => ({ tema: slug, apartado })));
    if (error) { setDone(done); setErr('No se pudo guardar. Revisa la conexión e inténtalo otra vez.'); }
  }

  return (
    <div className="page" style={{ paddingTop: 0, paddingBottom: 64 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <span className="sub" style={{ fontSize: 15 }}>{meta}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Ring pct={pct} size={32} hole={10} />
          <span className="t3" style={{ fontVariantNumeric: 'tabular-nums' }}>{pct} %</span>
          <span className="sub" style={{ fontSize: 14 }}>estudiado</span>
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start', paddingTop: 8 }}>
        <aside style={{ flex: '1 1 260px', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="cap" style={{ padding: '0 16px' }}>Secciones</span>
          <nav className="grp" style={{ overflow: 'hidden' }} aria-label="Secciones del tema">
            {secciones.map((s) => {
              const d = s.ids.filter((id) => done.has(id)).length;
              const complete = d === s.ids.length && s.ids.length > 0;
              return (
                <Link key={s.n} href={`/tema/${slug}?s=${s.n}`} className={s.n === seccion.n ? 'toc on' : 'toc'} aria-current={s.n === seccion.n ? 'true' : undefined}>
                  <span style={{ flex: 1 }}>{s.n}. {s.titulo}</span>
                  {complete ? <span className="donec"><Check size={13} w={3.5} /></span> : <span className="sub" style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{d}/{s.ids.length}</span>}
                </Link>
              );
            })}
          </nav>
          {nPreguntasSeccion > 0 && (
            <div className="grp" style={{ marginTop: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="t3">¿Lo tienes claro?</span>
              <span className="sub" style={{ fontSize: 14, lineHeight: 1.4 }}>Ponte a prueba con las {nPreguntasSeccion} preguntas de esta sección.</span>
              <Link href={`/tema/${slug}/test?s=${seccion.n}`} className="btn b-pri" style={{ alignSelf: 'flex-start' }}>Test de la sección</Link>
            </div>
          )}
        </aside>

        <main style={{ flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {objetivos.length > 0 && (
            <details className="grp" style={{ padding: '16px 24px' }}>
              <summary className="t3" style={{ cursor: 'pointer' }}>Objetivos del tema</summary>
              <ul className="body" style={{ margin: '12px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 16 }}>
                {objetivos.map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </details>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '0 4px' }}>
            <h2 className="t1" style={{ margin: 0, fontSize: 28 }}>{seccion.n}. {seccion.titulo}</h2>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="sub" style={{ fontSize: 15 }}>{secDone} de {seccion.apartados.length} estudiados</span>
              {secDone < seccion.apartados.length && <button type="button" className="btn b-pla" style={{ height: 36, padding: '0 10px' }} onClick={marcarSeccion}>Marcar todos</button>}
            </span>
          </div>
          {err && <div role="alert" className="grp" style={{ padding: '12px 16px', color: 'var(--badink)', fontSize: 15 }}>{err}</div>}

          {seccion.apartados.map((a, i) => {
            const on = done.has(a.id);
            const open = !!more[a.id];
            const hasMore = a.completo.length > 0 && JSON.stringify(a.completo) !== JSON.stringify(a.resumen);
            return (
              <article key={a.id} id={`a-${a.id}`} className={on ? 'grp card done' : 'grp card'} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, scrollMarginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <span className="sub" style={{ fontSize: 13 }}>Apartado {seccion.n}.{i + 1}{a.grupo ? ` · ${a.grupo}` : ''}</span>
                    <h3 className="t2" style={{ margin: 0 }}>{a.titulo}</h3>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: 'var(--txt2)', flex: 'none', cursor: 'pointer' }}>
                    <span className="vh">{a.titulo}: </span>{on ? 'Estudiado' : 'Sin estudiar'}
                    <button type="button" role="switch" aria-checked={on} aria-label={`Estudiado: ${a.titulo}`} className={on ? 'sw on' : 'sw'} onClick={() => toggle(a.id)} />
                  </label>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
                  <div className="body" style={{ flex: '1 1 340px', minWidth: 0 }}>
                    {a.resumen.length ? <RichItems items={a.resumen} /> : <p className="sub">Este apartado es sobre todo visual: mira la imagen.</p>}
                  </div>
                  {a.img && (
                    <button type="button" className="zoom" style={{ flex: '0 1 260px' }} onClick={() => setImg({ src: a.img!, alt: a.titulo })} aria-label={`Ampliar imagen: ${a.titulo}`}>
                      <img src={a.img} alt={a.titulo} loading="lazy" />
                      <span className="zi" aria-hidden="true"><Expand /></span>
                    </button>
                  )}
                </div>
                {a.terminos.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{a.terminos.map((t) => <span key={t} className="chip">{t}</span>)}</div>
                )}
                {hasMore && (
                  <div style={{ boxShadow: 'inset 0 1px 0 var(--sep)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button type="button" className={open ? 'more open' : 'more'} aria-expanded={open} onClick={() => setMore({ ...more, [a.id]: !open })}>
                      {open ? 'Ocultar texto completo' : 'Ver texto completo'}<ChevDown />
                    </button>
                    {open && <div className="body full in"><RichItems items={a.completo} /></div>}
                  </div>
                )}
              </article>
            );
          })}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 8 }}>
            {prev ? <Link href={`/tema/${slug}?s=${prev.n}`} className="btn b-sec navbtn">← {prev.n}. {prev.titulo}</Link> : <span />}
            {next ? <Link href={`/tema/${slug}?s=${next.n}`} className="btn b-pri navbtn">{next.n}. {next.titulo} →</Link> : <Link href={`/tema/${slug}/test`} className="btn b-pri">Hacer el test del tema</Link>}
          </div>
        </main>
      </div>

      {img && (
        <button type="button" className="lb" aria-label="Cerrar imagen ampliada" onClick={() => setImg(null)}>
          <img src={img.src} alt={img.alt} />
        </button>
      )}
    </div>
  );
}
