import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { ChevLeft } from './icons';

export default function TemaHeader({ slug, nombre, sub, modo, backHref = '/', backLabel = 'Inicio', right }: {
  slug: string;
  nombre: string;
  sub?: string;
  modo: 'resumen' | 'tarjetas' | 'test';
  backHref?: string;
  backLabel?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="page">
      <div className="topbar">
        <Link href={backHref} className="back"><ChevLeft />{backLabel}</Link>
        <ThemeToggle />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          {sub && <span className="sub" style={{ fontSize: 15 }}>{sub}</span>}
          <h1 className="t0" style={{ margin: 0 }}>{nombre}</h1>
        </div>
        {right}
      </div>
      <nav aria-label="Modo de estudio" className="seg" style={{ alignSelf: 'flex-start' }}>
        <Link href={`/tema/${slug}`} className={modo === 'resumen' ? 'sg on' : 'sg'} aria-current={modo === 'resumen' ? 'page' : undefined}>Resumen</Link>
        <Link href={`/tema/${slug}/tarjetas`} className={modo === 'tarjetas' ? 'sg on' : 'sg'} aria-current={modo === 'tarjetas' ? 'page' : undefined}>Tarjetas</Link>
        <Link href={`/tema/${slug}/test`} className={modo === 'test' ? 'sg on' : 'sg'} aria-current={modo === 'test' ? 'page' : undefined}>Test</Link>
      </nav>
    </header>
  );
}
