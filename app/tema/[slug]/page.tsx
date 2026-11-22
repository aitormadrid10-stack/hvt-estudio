import { notFound } from 'next/navigation';
import { getTema } from '@/lib/content';
import { getUser } from '@/lib/supabase/server';
import { getPerfil, getProgreso } from '@/lib/progress';
import TemaHeader from '@/components/TemaHeader';
import TemaResumen from '@/components/TemaResumen';

export default async function TemaPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ s?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const tema = await getTema(slug);
  if (!tema) notFound();
  const { supabase, userId } = await getUser();
  const [prog, perfil] = userId ? await Promise.all([getProgreso(supabase, slug), getPerfil(supabase, userId)]) : [{} as Record<string, string[]>, null];

  let n = Number(sp.s);
  if (!tema.secciones.some((s) => s.n === n)) {
    n = perfil?.ultimo_tema === slug && perfil.ultima_seccion ? perfil.ultima_seccion : tema.secciones[0].n;
    if (!tema.secciones.some((s) => s.n === n)) n = tema.secciones[0].n;
  }
  if (userId) {
    await supabase.from('perfiles').upsert({ id: userId, ultimo_tema: slug, ultima_seccion: n, updated_at: new Date().toISOString() });
  }
  const idx = tema.secciones.findIndex((s) => s.n === n);
  const seccion = tema.secciones[idx];
  const total = tema.secciones.reduce((a, s) => a + s.apartados.length, 0);
  const nPreg = tema.preguntas.filter((p) => p.seccion === n).length;

  return (
    <div style={{ minHeight: '100vh' }}>
      <TemaHeader slug={slug} nombre={tema.nombre} modo="resumen" sub={`Módulo ${tema.modulo} · ${tema.moduloCorto}`} />
      <TemaResumen
        slug={slug}
        meta={`${tema.duracion ? tema.duracion + ' · ' : ''}${total} apartados · ${tema.preguntas.length} preguntas`}
        objetivos={idx === 0 ? tema.objetivos : []}
        secciones={tema.secciones.map((s) => ({ n: s.n, titulo: s.titulo, ids: s.apartados.map((a) => a.id) }))}
        seccion={seccion}
        prev={idx > 0 ? { n: tema.secciones[idx - 1].n, titulo: tema.secciones[idx - 1].titulo } : null}
        next={idx < tema.secciones.length - 1 ? { n: tema.secciones[idx + 1].n, titulo: tema.secciones[idx + 1].titulo } : null}
        estudiados={prog[slug] ?? []}
        nPreguntasSeccion={nPreg}
      />
    </div>
  );
}
