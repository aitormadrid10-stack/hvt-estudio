import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import './globals.css';

export const metadata: Metadata = {
  title: 'HVT Estudio',
  description: 'Estudia el CFGS de mantenimiento y seguridad en vehículos híbridos y eléctricos',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#F2F2F7' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tema = (await cookies()).get('tema')?.value === 'claro' ? 'th-light' : 'th-dark';
  return (
    <html lang="es" className={tema}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" />
      </head>
      <body className="r">{children}</body>
    </html>
  );
}
