import { getUser } from '@/lib/supabase/server';
import { getModulos, getTemaMeta, totals } from '@/lib/content';
import { getPerfil, getProgreso } from '@/lib/progress';
import HomeView, { type HomeMod } from '@/components/HomeView';

export default async function Home() {
  const { supabase, userId, email } = await getUser();
  const [prog, perfil] = userId ? await Promise.all([getProgreso(supabase), getPerfil(supabase, userId)]) : [{} as Record<string, string[]>, null];
  const mods: HomeMod[] = getModulos().map((m) => {
    const temas = m.temas.map((t) => ({
      slug: t.slug,
      nombre: t.nombre,
      pct: Math.round(((prog[t.slug]?.length ?? 0) / Math.max(1, t.nApartados)) * 100),
    }));
    const done = m.temas.reduce((a, t) => a + (prog[t.slug]?.length ?? 0), 0);
    const all = m.temas.reduce((a, t) => a + t.nApartados, 0);
    return {
      n: m.n,
      nombre: m.nombre,
      corto: m.corto,
      temas,
      pct: Math.round((done / Math.max(1, all)) * 100),
      meta: `${m.temas.length} temas · ${m.temas.reduce((a, t) => a + t.nPreguntas, 0)} preguntas`,
    };
  });

  let cont: { slug: string; nombre: string; seccion: string | null; s: number | null; pct: number } | null = null;
  const slug = perfil?.ultimo_tema ?? mods[0].temas[0].slug;
  const meta = getTemaMeta(slug);
  if (meta) {
    const sec = meta.tema.secciones.find((s) => s.n === perfil?.ultima_seccion) ?? null;
    cont = {
      slug,
      nombre: meta.tema.nombre,
      seccion: sec ? sec.titulo : null,
      s: sec ? sec.n : null,
      pct: Math.round(((prog[slug]?.length ?? 0) / Math.max(1, meta.tema.nApartados)) * 100),
    };
  }
  return <HomeView mods={mods} totals={totals()} cont={cont} started={!!perfil?.ultimo_tema} email={email} />;
}
