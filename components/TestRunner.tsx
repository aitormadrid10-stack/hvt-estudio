'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Ring from './Ring';
import { Check, Chev, Info, X } from './icons';

type Q = {
  id: string; tipo: string; enunciado: string; seccion: number; revisar?: boolean;
  opciones?: string[]; respuesta_correcta?: string;
  elementos?: { elemento: string; respuesta_correcta: string }[]; opciones_disponibles?: string[];
  huecos?: { hueco: number; opciones?: string[]; respuesta_correcta: string }[]; fichas?: string[];
  zonas?: { zona: number; respuesta_correcta: string }[]; imagen?: string;
};
type Ans = { pick?: string; vals?: Record<number, string> };
type Origen = { kind: 'todo' } | { kind: 'seccion'; n: number } | { kind: 'falladas' };

const TIPO: Record<string, string> = {
  test: 'Elige una respuesta',
  verdadero_falso: 'Verdadero o falso',
  completar_huecos: 'Completa el texto',
  arrastrar_texto: 'Ordena o completa',
  emparejar: 'Relaciona',
  arrastrar_sobre_imagen: 'Identifica en la imagen',
};

function shuffle<T>(a: T[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** Lista de [clave, correcta, opciones] de cada hueco/elemento de la pregunta. */
function slots(q: Q): { key: number; right: string; opts: string[]; label?: string }[] {
  if (q.tipo === 'completar_huecos' || q.tipo === 'arrastrar_texto') {
    return (q.huecos ?? []).map((h) => ({ key: h.hueco, right: h.respuesta_correcta, opts: h.opciones?.length ? h.opciones : q.fichas ?? [] }));
  }
  if (q.tipo === 'emparejar') {
    return (q.elementos ?? []).map((e, i) => ({ key: i, right: e.respuesta_correcta, opts: q.opciones_disponibles ?? [], label: e.elemento }));
  }
  if (q.tipo === 'arrastrar_sobre_imagen') {
    return (q.zonas ?? []).map((z) => ({ key: z.zona, right: z.respuesta_correcta, opts: q.fichas ?? [], label: `Zona ${z.zona}` }));
  }
  return [];
}

function isOpts(q: Q) { return q.tipo === 'test' || q.tipo === 'verdadero_falso'; }

function isRight(q: Q, a?: Ans) {
  if (!a) return false;
  if (isOpts(q)) return a.pick === q.respuesta_correcta;
  return slots(q).every((s) => a.vals?.[s.key] === s.right);
}

function isComplete(q: Q, a?: Ans) {
  if (isOpts(q)) return !!a?.pick;
  return slots(q).every((s) => !!a?.vals?.[s.key]);
}

function splitEnunciado(q: Q) {
  const lines = q.enunciado.split('\n');
  if (lines.length > 1 && !/\[hueco/.test(lines[0])) return { instr: lines[0].trim(), body: lines.slice(1).join('\n') };
  return { instr: '', body: q.enunciado };
}

export default function TestRunner({ slug, preguntas, secciones, falladas, mejor, seccionInicial }: {
  slug: string; preguntas: Q[]; secciones: { n: number; titulo: string; count: number }[]; falladas: string[]; mejor: number | null; seccionInicial: number;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [fails, setFails] = useState<Set<string>>(() => new Set(falladas));
  const [best, setBest] = useState<number | null>(mejor);
  const [origen, setOrigen] = useState<Origen>(seccionInicial ? { kind: 'seccion', n: seccionInicial } : { kind: 'todo' });
  const [count, setCount] = useState<'10' | '20' | '40' | 'Todas'>('10');
  const [phase, setPhase] = useState<'setup' | 'q' | 'result'>('setup');
  const [order, setOrder] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const [ans, setAns] = useState<Record<string, Ans>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const byId = useMemo(() => Object.fromEntries(preguntas.map((p) => [p.id, p])), [preguntas]);

  const poolFor = (o: Origen) => preguntas.filter((p) => o.kind === 'todo' || (o.kind === 'seccion' ? p.seccion === o.n : fails.has(p.id)));
  const pool = poolFor(origen);
  const n = count === 'Todas' ? pool.length : Math.min(pool.length, Number(count));
  const origenLabel = origen.kind === 'todo' ? 'tema' : origen.kind === 'falladas' ? 'falladas' : `seccion-${origen.n}`;

  function start(ids?: string[]) {
    setOrder(ids ?? shuffle(pool.map((p) => p.id)).slice(0, n));
    setI(0); setAns({}); setChecked({}); setSaved(false); setPhase('q');
  }

  async function check(q: Q) {
    setChecked({ ...checked, [q.id]: true });
    const ok = isRight(q, ans[q.id]);
    if (!ok) {
      setFails(new Set(fails).add(q.id));
      await supabase.rpc('registrar_fallo', { p_tema: slug, p_pregunta: q.id });
    } else if (fails.has(q.id)) {
      const f = new Set(fails); f.delete(q.id); setFails(f);
      await supabase.from('falladas').delete().eq('tema', slug).eq('pregunta', q.id);
    }
  }

  async function finish() {
    setPhase('result');
    if (saved) return;
    setSaved(true);
    const aciertos = order.filter((id) => isRight(byId[id], ans[id])).length;
    const nota = (aciertos / order.length) * 10;
    if (best === null || nota > best) setBest(nota);
    await supabase.from('intentos').insert({ tema: slug, origen: origenLabel, total: order.length, aciertos });
  }

  const fmt = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',');

  if (phase === 'setup') {
    const opts: { o: Origen; label: string; c: number }[] = [
      { o: { kind: 'todo' }, label: 'Todo el tema', c: preguntas.length },
      ...secciones.map((s) => ({ o: { kind: 'seccion', n: s.n } as Origen, label: `${s.n}. ${s.titulo}`, c: s.count })),
      { o: { kind: 'falladas' }, label: 'Solo las que fallé', c: fails.size },
    ];
    const same = (a: Origen, b: Origen) => a.kind === b.kind && (a.kind !== 'seccion' || (b.kind === 'seccion' && a.n === b.n));
    return (
      <main className="page in" style={{ maxWidth: 760, paddingBottom: 64 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="cap" style={{ padding: '0 16px' }}>Preguntas de</span>
          <div className="grp" role="radiogroup" aria-label="Origen de las preguntas" style={{ overflow: 'hidden' }}>
            {opts.map(({ o, label, c }) => (
              <button key={label} type="button" role="radio" aria-checked={same(o, origen)} disabled={!c} className={same(o, origen) ? 'src on' : 'src'} onClick={() => setOrigen(o)}>
                <span style={{ flex: 1 }}>{label}</span><span className="sub" style={{ fontSize: 14 }}>{c}</span><span className="ck"><Check size={18} w={2.6} /></span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="cap" style={{ padding: '0 16px' }}>Número de preguntas</span>
          <div className="seg" role="radiogroup" aria-label="Número de preguntas" style={{ alignSelf: 'flex-start' }}>
            {(['10', '20', '40', 'Todas'] as const).map((c) => (
              <button key={c} type="button" role="radio" aria-checked={count === c} className={count === c ? 'sg on' : 'sg'} onClick={() => setCount(c)}>{c}</button>
            ))}
          </div>
        </div>
        <div className="grp" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span className="t3">Mejor nota en este tema</span><span className="sub" style={{ fontSize: 14 }}>Sobre 10</span></span>
          <span className="t1" style={{ fontVariantNumeric: 'tabular-nums' }}>{best === null ? '—' : fmt(best)}</span>
        </div>
        <button type="button" className="btn b-pri big" style={{ alignSelf: 'flex-start' }} disabled={!n} onClick={() => start()}>
          {n ? `Empezar (${n} preguntas)` : 'No hay preguntas aquí'}
        </button>
      </main>
    );
  }

  if (phase === 'result') {
    const res = order.map((id) => ({ q: byId[id], ok: isRight(byId[id], ans[id]) }));
    const hits = res.filter((r) => r.ok).length;
    const pct = Math.round((hits / res.length) * 100);
    const failed = res.filter((r) => !r.ok).map((r) => r.q.id);
    return (
      <main className="page in" style={{ maxWidth: 760, paddingBottom: 64 }}>
        <section className="grp" style={{ padding: '36px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 140, height: 140 }}>
            <span style={{ position: 'absolute', inset: 0 }}><Ring pct={pct} size={140} hole={56} color={pct >= 50 ? 'var(--ok)' : 'var(--bad)'} /></span>
            <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><span className="t1">{fmt((hits / res.length) * 10)}</span></span>
          </div>
          <h2 className="t1" style={{ margin: 0 }}>{pct === 100 ? 'Perfecto' : pct >= 50 ? 'Aprobado' : 'Toca repasar'}</h2>
          <p className="sub" style={{ margin: 0, fontSize: 16 }}>{hits} de {res.length} correctas</p>
        </section>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="cap" style={{ padding: '0 16px' }}>Repaso</span>
          <div className="grp" style={{ overflow: 'hidden' }}>
            {res.map(({ q, ok }, j) => (
              <Link key={q.id} href={`/tema/${slug}?s=${q.seccion}`} className="res" style={{ boxShadow: j ? 'inset 0 1px 0 var(--sep)' : 'none' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: ok ? 'var(--ok)' : 'var(--bad)', color: '#000', display: 'grid', placeItems: 'center', flex: 'none' }}>{ok ? <Check size={13} w={3.5} /> : <X size={13} w={3.5} />}</span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{splitEnunciado(q).body.replace(/\[hueco \d+\]/g, '___')}</span>
                  <span className="sub" style={{ fontSize: 13 }}>{TIPO[q.tipo]} · Sección {q.seccion}</span>
                </span>
                <span style={{ color: 'var(--txt2)' }}><Chev size={16} /></span>
              </Link>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {failed.length > 0 && <button type="button" className="btn b-pri big" onClick={() => start(shuffle(failed))}>Repetir las falladas ({failed.length})</button>}
          <button type="button" className="btn b-sec big" onClick={() => setPhase('setup')}>Nuevo test</button>
        </div>
      </main>
    );
  }

  const q = byId[order[i]];
  const a = ans[q.id] ?? {};
  const chk = !!checked[q.id];
  const ok = chk && isRight(q, a);
  const last = i === order.length - 1;
  const setVal = (k: number, v: string) => setAns({ ...ans, [q.id]: { ...a, vals: { ...(a.vals ?? {}), [k]: v } } });
  const selCls = (val: string, right: string) => (chk ? (val === right ? 'pop ok' : 'pop bad') : val ? 'pop filled' : 'pop');
  const { instr, body } = splitEnunciado(q);
  const sl = slots(q);

  const renderSelect = (k: number, opts: string[], right: string, label: string, key?: number) => {
    const val = a.vals?.[k] ?? '';
    return (
      <span key={key} style={{ display: 'inline' }}>
        <select className={selCls(val, right)} aria-label={label} value={val} disabled={chk} onChange={(e) => setVal(k, e.target.value)}>
          <option value="">Elegir…</option>
          {opts.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        {chk && val !== right && <span className="fix">{right}</span>}
      </span>
    );
  };

  return (
    <main className="page" style={{ maxWidth: 820, paddingBottom: 64 }}>
      <div key={q.id} className="in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="track" style={{ flex: 1, height: 4 }}><div className="fill" style={{ width: `${Math.round(((i + (chk ? 1 : 0)) / order.length) * 100)}%` }} /></div>
          <span className="sub" style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{i + 1} de {order.length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="cap">{TIPO[q.tipo] ?? q.tipo}</span>
          {q.revisar && <span className="badge-rev" title="La respuesta se dedujo del temario; no se pudo comprobar en la plataforma"><Info size={14} />Respuesta sin verificar</span>}
        </div>

        {isOpts(q) && (
          <>
            <p className="t2" style={{ margin: 0, fontSize: 23, lineHeight: 1.35, whiteSpace: 'pre-line' }}>{q.enunciado}</p>
            <div className={chk && !ok ? 'shake' : ''} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(q.opciones ?? []).map((o) => {
                let cls = 'opt', icon: React.ReactNode = null;
                if (chk) {
                  if (o === q.respuesta_correcta && a.pick === o) { cls = 'opt ok'; icon = <Check />; }
                  else if (o === q.respuesta_correcta) { cls = 'opt miss'; icon = <Check />; }
                  else if (a.pick === o) { cls = 'opt bad'; icon = <X />; }
                } else if (a.pick === o) { cls = 'opt sel'; icon = <Check />; }
                return (
                  <button key={o} type="button" className={cls} disabled={chk} aria-pressed={a.pick === o} onClick={() => setAns({ ...ans, [q.id]: { pick: o } })}>
                    <span className="ind">{icon}</span>{o}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {(q.tipo === 'completar_huecos' || q.tipo === 'arrastrar_texto') && (
          <>
            {instr && <p className="t2" style={{ margin: 0, fontSize: 21 }}>{instr}</p>}
            <div className={chk && !ok ? 'grp gaps shake' : 'grp gaps'}>
              {body.split(/\[hueco (\d+)\]/).map((part, k) => {
                if (k % 2 === 0) return <span key={k}>{part}</span>;
                const h = Number(part);
                const s = sl.find((x) => x.key === h);
                return s ? renderSelect(h, s.opts, s.right, `Hueco ${h}`, k) : null;
              })}
            </div>
          </>
        )}

        {(q.tipo === 'emparejar' || q.tipo === 'arrastrar_sobre_imagen') && (
          <>
            <p className="t2" style={{ margin: 0, fontSize: 21, whiteSpace: 'pre-line' }}>{q.enunciado}</p>
            {q.imagen && <div className="qimg"><img src={q.imagen} alt="Imagen de la pregunta con las zonas numeradas" /></div>}
            <div className={chk && !ok ? 'grp shake' : 'grp'} style={{ overflow: 'hidden' }}>
              {sl.map((s, j) => (
                <div key={s.key} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 16px', padding: '14px 18px', boxShadow: j ? 'inset 0 1px 0 var(--sep)' : 'none' }}>
                  <span style={{ flex: '1 1 300px', fontSize: 16, lineHeight: 1.45 }}>{s.label}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, maxWidth: '100%' }}>{renderSelect(s.key, s.opts, s.right, `Respuesta para: ${s.label}`)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {chk && (
          <div className="grp in" role="status" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: ok ? 'var(--ok)' : 'var(--bad)', color: '#000', display: 'grid', placeItems: 'center', flex: 'none' }}>{ok ? <Check size={16} /> : <X size={16} />}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="t3" style={{ color: ok ? 'var(--okink)' : 'var(--badink)' }}>{ok ? 'Correcto' : 'Incorrecto'}</span>
              <span className="sub" style={{ fontSize: 14 }}>{ok ? 'Bien hecho.' : isOpts(q) ? 'La correcta está marcada en verde.' : 'Al lado de cada fallo tienes la respuesta correcta.'}</span>
            </span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn b-pla" onClick={() => setPhase('setup')}>Salir</button>
          {!chk ? (
            <button type="button" className="btn b-pri big" disabled={!isComplete(q, a)} onClick={() => check(q)}>Comprobar</button>
          ) : (
            <button type="button" className="btn b-pri big" onClick={() => (last ? finish() : setI(i + 1))}>{last ? 'Ver resultado' : 'Siguiente'}</button>
          )}
        </div>
      </div>
    </main>
  );
}
