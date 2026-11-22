-- HVT Estudio: progreso de cada usuario. El temario vive en el repo (content/).

create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  ultimo_tema text,
  ultima_seccion int,
  updated_at timestamptz not null default now()
);

create table if not exists public.progreso (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tema text not null,
  apartado text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, tema, apartado)
);

create table if not exists public.tarjetas (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tema text not null,
  apartado text not null,
  estado text not null check (estado in ('sabe', 'repasar')),
  updated_at timestamptz not null default now(),
  primary key (user_id, tema, apartado)
);

create table if not exists public.intentos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tema text not null,
  origen text not null,
  total int not null check (total > 0),
  aciertos int not null check (aciertos >= 0),
  created_at timestamptz not null default now()
);
create index if not exists intentos_user_tema on public.intentos (user_id, tema, created_at desc);

create table if not exists public.falladas (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tema text not null,
  pregunta text not null,
  veces int not null default 1,
  ultima timestamptz not null default now(),
  primary key (user_id, tema, pregunta)
);

alter table public.perfiles enable row level security;
alter table public.progreso enable row level security;
alter table public.tarjetas enable row level security;
alter table public.intentos enable row level security;
alter table public.falladas enable row level security;

create policy "perfil propio" on public.perfiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "progreso propio" on public.progreso for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "tarjetas propias" on public.tarjetas for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "intentos propios" on public.intentos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "falladas propias" on public.falladas for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Suma un fallo (o lo crea) sin carreras.
create or replace function public.registrar_fallo(p_tema text, p_pregunta text)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.falladas (user_id, tema, pregunta)
  values ((select auth.uid()), p_tema, p_pregunta)
  on conflict (user_id, tema, pregunta)
  do update set veces = public.falladas.veces + 1, ultima = now();
$$;

grant execute on function public.registrar_fallo(text, text) to authenticated;
