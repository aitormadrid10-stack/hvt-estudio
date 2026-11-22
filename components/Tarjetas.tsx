'use client';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RichItems } from './Rich';
import { Check, Flip, Redo } from './icons';

export type Card = { id: string; s: number; sec: string; front: string; back: [string, string][]; img: string | null };
type Estado = 'sabe' | 'repasar';
type Filtro = 'todas' | 'repasar' | 'nuevas';

function shuffle<T>(a: T[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export default function Tarjetas({ slug, cards, estados, secciones }: { slug: string; cards: Card[]; estados: Record<string, Estado>; secciones: { n: number; titulo: string }[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [est, setEst] = useState<Record<string, Estado>>(estados);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [sec, setSec] = useState<number | 0>(0);
  const [mezclar, setMezclar] = useState(false);
  const [deck, setDeck] = useState<string[] | null>(null);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ronda, setRonda] = useState<Record<string, Estado>>({});
  const byId = useMemo(() => Object.fromEntries(cards.map((c) => [c.id, c])), [cards]);

  const pool = cards.filter((c) => (sec === 0 || c.s === sec) && (filtro === 'todas' || (filtro === 'repasar' ? est[c.id] === 'repasar' : !est[c.id])));
  const cuenta = (f: Filtro) => cards.filter((c) => (sec === 0 || c.s === sec) && (f === 'todas' || (f === 'repasar' ? est[c.id] === 'repasar' : !est[c.id]))).length;

  function empezar(ids?: string[]) {
    const base = ids ?? pool.map((c) => c.id);
    setDeck(mezclar ? shuffle(base) : base);
    setI(0); setFlipped(false); setRonda({});
  }

  async function marcar(e: Estado) {
    if (!deck) return;
    const id = deck[i];
    setEst({ ...est, [id]: e });
    setRonda({ ...ronda, [id]: e });
    setFlipped(false);
    setI(i + 1);
    await supabase.from('tarjetas').upsert({ tema: slug, apartado: id, estado: e, updated_at: new Date().toISOString() });
  }

  const sabe = deck ? deck.filter((id) => ronda[id] === 'sabe').length : 0;
  const rep = deck ? deck.filter((id) => ronda[id] === 'repasar').length : 0;

  if (!deck) {
    return (
      <main className="page" style={{ maxWidth: 720, paddingBottom: 64 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="cap" style={{ padding: '0 16px' }}>Qué tarjetas</span>
          <div className="grp" role="radiogroup" aria-label="Qué tarjetas" style={{ overflow: 'hidden' }}>
            {([['todas', 'Todas'], ['repasar', 'Las que marqué para repasar'], ['nuevas', 'Las que aún no he visto']] as [Filtro, string][]).map(([f, l]) => (
              <button key={f} type="button" role="radio" aria-checked={filtro === f} className={filtro === f ? 'src on' : 'src'} onClick={() => setFiltro(f)}>
                <span>{l}</span><span className="sub" style={{ fontSize: 14 }}>{cuenta(f)}</span><span className="ck"><Check size={18} w={2.6} /></span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label htmlFor="sec" className="cap" style={{ padding: '0 16px' }}>Sección</label>
          <select id="sec" className="pop" style={{ height: 44, alignSelf: 'flex-start' }} value={sec} onChange={(e) => setSec(Number(e.target.value))}>
            <option value={0}>Todo el tema</option>
            {secciones.map((s) => <option key={s.n} value={s.n}>{s.n}. {s.titulo}</option>)}
          </select>
        </div>
        <div className="grp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
          <span style={{ fontSize: 16 }}>Mezclar el orden</span>
          <button type="button" role="switch" aria-checked={mezclar} aria-label="Mezclar el orden" className={mezclar ? 'sw on' : 'sw'} onClick={() => setMezclar(!mezclar)} />
        </div>
        <button type="button" className="btn b-pri big" style={{ alignSelf: 'flex-start' }} disabled={!pool.length} onClick={() => empezar()}>
          {pool.length ? `Empezar (${pool.length})` : 'No hay tarjetas con este filtro'}
        </button>
      </main>
    );
  }

  const done = i >= deck.length;
  const card = byId[deck[Math.min(i, deck.length - 1)]];

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 64px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div className="glass" style={{ display: 'flex', overflow: 'hidden' }}>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 22px' }}><b className="t2" style={{ color: 'var(--okink)' }}>{sabe}</b><span className="sub" style={{ fontSize: 13 }}>Me la sé</span></span>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 22px', boxShadow: 'inset 1px 0 0 var(--sep)' }}><b className="t2" style={{ color: 'var(--ink)' }}>{rep}</b><span className="sub" style={{ fontSize: 13 }}>Repasar</span></span>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 22px', boxShadow: 'inset 1px 0 0 var(--sep)' }}><b className="t2">{Math.max(deck.length - i, 0)}</b><span className="sub" style={{ fontSize: 13 }}>Quedan</span></span>
      </div>

      {!done ? (
        <div className="stage">
          <span className="blob" aria-hidden="true" style={{ width: 340, height: 340, top: -10, left: '8%', background: 'var(--accent)' }} />
          <span className="blob" aria-hidden="true" style={{ width: 300, height: 300, top: 120, right: '6%', background: '#0A84FF', animationDelay: '-5s' }} />
          <span className="blob" aria-hidden="true" style={{ width: 220, height: 220, top: 220, left: '30%', background: '#BF5AF2', animationDelay: '-9s' }} />
          <div className="scene in" key={card.id + i}>
            <button type="button" className={flipped ? 'flip back-on' : 'flip'} aria-label={flipped ? 'Volver a la pregunta' : 'Ver la respuesta'} onClick={() => setFlipped(!flipped)}>
              <span className="face front">
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span className="sub" style={{ fontSize: 14 }}>{card.s}. {card.sec}</span>
                  <span className="sub" style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{i + 1} de {deck.length}</span>
                </span>
                <span className="t0" style={{ fontSize: 'clamp(26px, 5vw, 38px)' }}>{card.front}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, color: 'var(--ink)' }}><Flip />Toca para ver la respuesta</span>
              </span>
              <span className="face rear">
                <span className="sub" style={{ fontSize: 14 }}>{card.front}</span>
                <span className="body"><RichItems items={card.back} /></span>
              </span>
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
            <button type="button" className="btn b-glass big" disabled={!flipped} onClick={() => marcar('repasar')}><Redo />Repasar</button>
            <button type="button" className="btn b-ok big" disabled={!flipped} onClick={() => marcar('sabe')}><Check size={20} w={2.4} />Me la sé</button>
          </div>
          <span className="sub" style={{ fontSize: 14 }}>{flipped ? 'Las que marques para repasar las puedes volver a practicar al final.' : 'Piensa la respuesta y voltea la tarjeta.'}</span>
        </div>
      ) : (
        <div className="stage">
          <span className="blob" aria-hidden="true" style={{ width: 320, height: 320, top: -20, left: '10%', background: 'var(--accent)' }} />
          <span className="blob" aria-hidden="true" style={{ width: 280, height: 280, top: 60, right: '8%', background: '#30D158', animationDelay: '-6s' }} />
          <section className="glass in" style={{ width: '100%', maxWidth: 620, padding: '40px 32px', borderRadius: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
            <span className="sub" style={{ fontSize: 15 }}>Ronda terminada</span>
            <h2 className="t1" style={{ margin: 0 }}>{sabe} de {deck.length} dominadas</h2>
            <p className="sub" style={{ margin: 0, fontSize: 16 }}>{rep ? 'Repasa ahora las marcadas, mientras están frescas.' : 'Todas dominadas. Pasa al test para comprobarlo.'}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 10 }}>
              {rep > 0 && <button type="button" className="btn b-pri big" onClick={() => empezar(deck.filter((id) => ronda[id] === 'repasar'))}>Repasar las {rep} marcadas</button>}
              <button type="button" className="btn b-glass big" onClick={() => setDeck(null)}>Otra ronda</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
