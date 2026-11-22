import 'server-only';
import index from '@/content/index.json';
import { temaLoaders } from '@/content/loaders';

export type Item = [string, string];
export type Apartado = {
  id: string;
  titulo: string;
  grupo: string | null;
  resumen: Item[];
  completo: Item[];
  img: string | null;
  terminos: string[];
};
export type Seccion = { n: number; titulo: string; apartados: Apartado[] };
export type Pregunta = {
  id: string;
  tipo: 'test' | 'verdadero_falso' | 'completar_huecos' | 'emparejar' | 'arrastrar_texto' | 'arrastrar_sobre_imagen';
  enunciado: string;
  seccion: number;
  actividad?: string;
  revisar?: boolean;
  opciones?: string[];
  respuesta_correcta?: string;
  elementos?: { elemento: string; respuesta_correcta: string }[];
  opciones_disponibles?: string[];
  huecos?: { hueco: number; opciones?: string[]; respuesta_correcta: string }[];
  fichas?: string[];
  zonas?: { zona: number; respuesta_correcta: string }[];
  imagen?: string;
};
export type Tema = {
  slug: string;
  nombre: string;
  modulo: number;
  moduloCorto: string;
  duracion: string;
  objetivos: string[];
  secciones: Seccion[];
  preguntas: Pregunta[];
};
export type TemaMeta = {
  slug: string;
  nombre: string;
  duracion: string;
  nApartados: number;
  nPreguntas: number;
  secciones: { n: number; titulo: string; nApartados: number; nPreguntas: number }[];
};
export type Modulo = { n: number; nombre: string; corto: string; temas: TemaMeta[] };

export function getModulos(): Modulo[] {
  return (index as { modulos: Modulo[] }).modulos;
}

export function getTemaMeta(slug: string) {
  for (const m of getModulos()) {
    const t = m.temas.find((x) => x.slug === slug);
    if (t) return { modulo: m, tema: t };
  }
  return null;
}

export async function getTema(slug: string): Promise<Tema | null> {
  const load = temaLoaders[slug];
  if (!load) return null;
  const mod = await load();
  return mod.default as Tema;
}

export function totals() {
  const ms = getModulos();
  const temas = ms.flatMap((m) => m.temas);
  return {
    modulos: ms.length,
    temas: temas.length,
    apartados: temas.reduce((a, t) => a + t.nApartados, 0),
    preguntas: temas.reduce((a, t) => a + t.nPreguntas, 0),
  };
}
