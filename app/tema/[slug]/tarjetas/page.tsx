import { notFound } from 'next/navigation';
import { getTema } from '@/lib/content';
import { getUser } from '@/lib/supabase/server';
import TemaHeader from '@/components/TemaHeader';
import Tarjetas, { type Card } from '@/components/Tarjetas';

export default async function TarjetasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tema = await getTema(slug);
  if (!tema) notFound();
  const { supabase, userId } = await getUser();
  const estados: Record<string, 'sabe' | 'repasar'> = {};
  if (userId) {
    const { data } = await supabase.from('tarjetas').select('apartado, estado').eq('tema', slug).range(0, 1999);
    for (const r of data ?? []) estados[r.apartado] = r.estado;
  }
  const cards: Card[] = tema.secciones.flatMap((s) =>
    s.apartados
      .filter((a) => a.resumen.length > 0)
      .map((a) => ({ id: a.id, s: s.n, sec: s.titulo, front: a.titulo, back: a.resumen.slice(0, 5), img: a.img })),
  );
  return (
    <div style={{ minHeight: '100vh' }}>
      <TemaHeader slug={slug} nombre="Tarjetas" modo="tarjetas" sub={tema.nombre} backHref={`/tema/${slug}`} backLabel="Resumen" />
      <Tarjetas slug={slug} cards={cards} estados={estados} secciones={tema.secciones.map((s) => ({ n: s.n, titulo: s.titulo }))} />
    </div>
  );
}
