import Link from 'next/link';
export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="grp" style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <span className="t2">No encontramos esa página</span>
        <Link href="/" className="btn b-pri">Volver al inicio</Link>
      </div>
    </main>
  );
}
