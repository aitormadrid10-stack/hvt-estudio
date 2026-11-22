# HVT Estudio

App para estudiar el CFGS **Mantenimiento y seguridad en sistemas de vehículos híbridos y eléctricos**: resumen por temas, tarjetas y test con las preguntas del curso. Cada persona entra con su email y su progreso se guarda en Supabase.

- **Next.js 16** (App Router) desplegado en **Vercel**.
- **Supabase**: login por enlace al email y tablas de progreso (`supabase/migrations/0001_init.sql`).
- El temario y las preguntas están en `content/` y las imágenes en `public/img` y `public/qimg`.

## Puesta en marcha

### 1. Supabase
1. Crea un proyecto (plan gratis, región Europa).
2. **SQL Editor** → pega y ejecuta `supabase/migrations/0001_init.sql`.
3. **Authentication › URL Configuration**:
   - *Site URL*: la URL de Vercel, p. ej. `https://hvt-estudio.vercel.app`
   - *Redirect URLs*: añade `https://hvt-estudio.vercel.app/auth/callback` y `http://localhost:3000/auth/callback`
4. **Project Settings › API Keys**: copia la *Project URL* y la *Publishable key*.

### 2. Vercel
1. **Add New › Project** → importa este repositorio.
2. En *Environment Variables* añade:
   - `NEXT_PUBLIC_HVT_SUPABASE_URL`
   - `NEXT_PUBLIC_HVT_SUPABASE_KEY` (la publishable key)
3. **Deploy**. Cada push a `main` se publica solo.

### 3. En local
```bash
cp .env.example .env.local   # y rellena las dos claves
npm install
npm run dev
```

## Regenerar el contenido
Si cambian los datos extraídos del curso (`data.json` e `imgs1-3.json`, que no se suben al repo):
```bash
python3 scripts/build_content.py RUTA/A/hvt-app
```

## Notas
- Las preguntas marcadas como **«Respuesta sin verificar»** tienen la respuesta deducida del temario porque no se pudo comprobar en la plataforma.
- El enlace de acceso hay que abrirlo en el mismo navegador donde se pidió.
