'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import searchIndex from '@/content/search.json';
import ThemeToggle from './ThemeToggle';
import Ring from './Ring';
import { Book, Bolt, Check, Chev, Lines, List, Logout, Search, X } from './icons';

export type HomeMod = { n: number; nombre: string; corto: string; pct: number; meta: string; temas: { slug: string; nombre: string; pct: number }[] };
type Entry = { t: string; slug: string; s: number | null; a: string | null; tema: string };

const fold = (s: string) => Array.from(s).map((c) => c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()).join('');
const IDX = (searchIndex as Entry[]).map((e) => ({ ...e, f: fold(e.t) }));

export default function HomeView({ mods, totals, cont, started, email }: {
  mods: HomeMod[];
  totals: { modulos: number; temas: number; apartados: number; preguntas: number };
  cont: { slug: string; nombre: string; seccion: string | null; s: number | null; pct: number } | null;
  started: boolean;
  email: string | null;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Record<number, boolean>>(() => Object.fromEntries(mods.map((m) => [m.n, true])));
  const [sheet, setSheet] = useState(false);
  const query = q.trim();

  const results = useMemo(() => {
    if (!query) return [];
    const fq = fold(query);
    const len = Array.from(fq).length;
    const out: (Entry & { pre: string; hit: string; post: string })[] = [];
    for (const e of IDX) {
      const at = e.f.indexOf(fq);
      if (at === -1) continue;
      const ch = Array.from(e.t);
      out.push({ ...e, pre: ch.slice(0, at).join(''), hit: ch.slice(at, at + len).join(''), post: ch.slice(at + len).join('') });
      if (out.length >= 40) break;
    }
    return out.sort((a, b) => Number(a.a !== null) - Number(b.a !== null));
  }, [query]);

  const href = (e: Entry) => (e.a ? `/tema/${e.slug}?s=${e.s}#a-${e.a}` : `/tema/${e.slug}`);

  return (
    <div className="shell">
      <nav aria-label="Temario" className={sheet ? 'side open' : 'side'}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', textDecoration: 'none' }}>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent)', display: 'grid', placeItems: 'center', color: '#000' }}><Bolt /></span>
            <span className="t3">HVT Estudio</span>
          </Link>
          <button type="button" className="ib mobile-only" aria-label="Cerrar temario" onClick={() => setSheet(false)}><X size={18} w={2.2} /></button>
        </div>
        <label className="search">
          <Search />
          <span className="vh">Buscar en el temario</span>
          <input type="search" placeholder="Buscar" value={q} onChange={(e) => { setQ(e.target.value); }} onKeyDown={(e) => e.key === 'Enter' && setSheet(false)} />
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {mods.map((m) => (
            <div key={m.n} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <button type="button" className={open[m.n] ? 'mh open' : 'mh'} aria-expanded={!!open[m.n]} onClick={() => setOpen({ ...open, [m.n]: !open[m.n] })}>
                <Chev className="chev" />
                <span style={{ flex: 1 }}>{m.corto}</span>
              </button>
              {open[m.n] && (
                <div className="temas" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {m.temas.map((t) => (
                    <Link key={t.slug} href={`/tema/${t.slug}`} className={cont?.slug === t.slug && started ? 'row on' : 'row'} onClick={() => setSheet(false)}>
                      {t.pct >= 100 ? <span className="donec"><Check size={13} w={3.5} /></span> : <Ring pct={t.pct} />}
                      <span style={{ flex: 1 }}>{t.nombre}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, boxShadow: '0 -1px 0 var(--sep)' }}>
          {email && <span className="sub" style={{ fontSize: 12, padding: '0 10px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</span>}
          <form action="/auth/salir" method="post">
            <button type="submit" className="row" style={{ color: 'var(--txt2)' }}><Logout />Cerrar sesión</button>
          </form>
        </div>
      </nav>

      <main className="mainc">
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <button type="button" className="btn b-pla mobile-only" style={{ paddingLeft: 4 }} onClick={() => setSheet(true)}><List />Temario</button>
            <span />
            <ThemeToggle />
          </div>

          <label className="search mobile-only" style={{ height: 40 }}>
            <Search />
            <span className="vh">Buscar en el temario</span>
            <input type="search" placeholder="Buscar en el temario" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>

          {query ? (
            <section aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <h1 className="t1" style={{ margin: 0 }}>Resultados para «{query}»</h1>
                <span className="sub" style={{ fontSize: 15 }}>{results.length === 1 ? '1 resultado' : `${results.length}${results.length >= 40 ? '+' : ''} resultados`}</span>
              </div>
              {results.length ? (
                <div className="grp" style={{ overflow: 'hidden' }}>
                  {results.map((r, i) => (
                    <Link key={r.slug + (r.a ?? '') + i} href={href(r)} className="res" style={{ boxShadow: i ? 'inset 0 1px 0 var(--sep)' : 'none' }}>
                      <span style={{ width: 34, height: 34, flex: 'none', borderRadius: 9, display: 'grid', placeItems: 'center', background: r.a ? 'var(--ctl)' : 'var(--accent)', color: r.a ? 'var(--txt2)' : '#000' }}>{r.a ? <Lines /> : <Book />}</span>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: 16, fontWeight: 600 }}>{r.pre}<mark>{r.hit}</mark>{r.post}</span>
                        <span className="sub" style={{ fontSize: 13 }}>{r.tema}</span>
                      </span>
                      <span style={{ color: 'var(--txt2)' }}><Chev size={16} /></span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grp" style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                  <span className="t3">Sin resultados para «{query}»</span>
                  <span className="sub" style={{ fontSize: 15 }}>Prueba con otra palabra. La búsqueda ignora tildes y mayúsculas.</span>
                </div>
              )}
            </section>
          ) : (
            <>
              <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="sub" style={{ fontSize: 15 }}>Mantenimiento y seguridad en vehículos híbridos y eléctricos</span>
                <h1 className="t0" style={{ margin: 0 }}>Tu estudio</h1>
              </header>

              {cont && (
                <section className="grp" style={{ padding: 28, display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: 112, height: 112, flex: 'none' }}>
                    <span style={{ position: 'absolute', inset: 0 }}><Ring pct={cont.pct} size={112} hole={44} /></span>
                    <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><span className="t2" style={{ fontVariantNumeric: 'tabular-nums' }}>{cont.pct} %</span></span>
                  </div>
                  <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span className="sub" style={{ fontSize: 14 }}>{started ? 'Continúa donde lo dejaste' : 'Empieza por aquí'}</span>
                    <h2 className="t1" style={{ margin: 0, fontSize: 28 }}>{cont.nombre}</h2>
                    {cont.seccion && <span className="sub" style={{ fontSize: 15 }}>{cont.seccion}</span>}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <Link href={`/tema/${cont.slug}${cont.s ? `?s=${cont.s}` : ''}`} className="btn b-pri">{started ? 'Seguir el resumen' : 'Empezar'}</Link>
                    <Link href={`/tema/${cont.slug}/test`} className="btn b-sec">Hacer test</Link>
                  </div>
                </section>
              )}

              <section className="grp stats">
                <div><div className="t1">{totals.modulos}</div><div className="sub" style={{ fontSize: 14, marginTop: 2 }}>módulos</div></div>
                <div><div className="t1">{totals.temas}</div><div className="sub" style={{ fontSize: 14, marginTop: 2 }}>temas</div></div>
                <div><div className="t1">{totals.apartados}</div><div className="sub" style={{ fontSize: 14, marginTop: 2 }}>apartados resumidos</div></div>
                <div style={{ boxShadow: 'none' }}><div className="t1">{totals.preguntas}</div><div className="sub" style={{ fontSize: 14, marginTop: 2 }}>preguntas de test</div></div>
              </section>

              {mods.map((m) => (
                <section key={m.n} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <h2 className="t2" style={{ margin: 0 }}>{m.nombre}</h2>
                    <span className="sub" style={{ fontSize: 14 }}>{m.meta} · {m.pct} %</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
                    {m.temas.map((t) => (
                      <Link key={t.slug} href={`/tema/${t.slug}`} className="mcard">
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {t.pct >= 100 ? <span className="donec" style={{ width: 28, height: 28 }}><Check size={15} w={3.5} /></span> : <Ring pct={t.pct} size={28} hole={9} />}
                          <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{t.pct} %</span>
                        </span>
                        <span className="t3" style={{ minHeight: 44 }}>{t.nombre}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
