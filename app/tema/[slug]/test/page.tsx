import { notFound } from 'next/navigation';
import { getTema } from '@/lib/content';
import { getUser } from '@/lib/supabase/server';
import TemaHeader from '@/components/TemaHeader';
import TestRunner from '@/components/TestRunner';

export default async function TestPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ s?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const tema = await getTema(slug);
  if (!tema) notFound();
  const { supabase, userId } = await getUser();
  let falladas: string[] = [];
  let mejor: number | null = null;
  if (userId) {
    const [f, it] = await Promise.all([
      supabase.from('falladas').select('pregunta').eq('tema', slug).range(0, 1999),
      supabase.from('intentos').select('total, aciertos').eq('tema', slug).order('created_at', { ascending: false }).limit(200),
    ]);
    falladas = (f.data ?? []).map((r) => r.pregunta);
    for (const r of it.data ?? []) {
      const nota = (r.aciertos / r.total) * 10;
      if (mejor === null || nota > mejor) mejor = nota;
    }
  }
  const secciones = tema.secciones
    .map((s) => ({ n: s.n, titulo: s.titulo, count: tema.preguntas.filter((p) => p.seccion === s.n).length }))
    .filter((s) => s.count > 0);
  const inicial = Number(sp.s);
  return (
    <div style={{ minHeight: '100vh' }}>
      <TemaHeader slug={slug} nombre="Test" modo="test" sub={tema.nombre} backHref={`/tema/${slug}`} backLabel="Resumen" />
      <TestRunner
        slug={slug}
        preguntas={tema.preguntas}
        secciones={secciones}
        falladas={falladas}
        mejor={mejor}
        seccionInicial={secciones.some((s) => s.n === inicial) ? inicial : 0}
      />
    </div>
  );
}
