import LoginForm from './LoginForm';
import ThemeToggle from '@/components/ThemeToggle';
import { Bolt } from '@/components/icons';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, right: 20 }}><ThemeToggle /></div>
      <div className="grp" style={{ width: '100%', maxWidth: 400, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <span style={{ width: 56, height: 56, borderRadius: 15, background: 'var(--accent)', display: 'grid', placeItems: 'center', color: '#000' }}><Bolt size={30} /></span>
          <h1 className="t1" style={{ margin: 0 }}>HVT Estudio</h1>
          <span className="sub" style={{ fontSize: 15 }}>Mantenimiento y seguridad en vehículos híbridos y eléctricos</span>
        </div>
        {sp.error && <span role="alert" style={{ color: 'var(--badink)', fontSize: 14, textAlign: 'center' }}>El enlace ha caducado o ya se usó. Pide uno nuevo.</span>}
        <LoginForm next={sp.next ?? '/'} />
      </div>
    </main>
  );
}
