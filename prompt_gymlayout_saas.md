# Prompt Maestro — GymLayout Pro SaaS (Vercel + Supabase)

> Pega este prompt completo en una sesión nueva de Claude Code. Adjunta el código fuente actual de GymLayout Pro (el proyecto Vite/React ya funcional) como contexto.

---

## PROMPT

Tengo una aplicación funcional llamada **GymLayout Pro** — herramienta de diseño de layout para gimnasios con método Guerchet, SLP y simulación DES. Actualmente corre 100% en el navegador sin backend. Necesito **convertirla en SaaS multi-usuario** conectándola a **Vercel** (deploy) + **Supabase** (auth, DB, realtime, storage).

**REQUISITOS CLAVE DE SEGURIDAD**: Todas las queries a la base de datos deben pasar por **Row Level Security (RLS)** de Supabase y/o **funciones server-side** (Edge Functions / API Routes de Next.js). **NUNCA** exponer queries SQL directas desde el cliente. Toda input del usuario debe sanitizarse. Protección contra XSS, CSRF e inyección SQL es obligatoria.

---

### FASE 0: MIGRACIÓN A NEXT.JS + SETUP INFRAESTRUCTURA

**Migrar de Vite puro a Next.js App Router** (mantener React + TypeScript + Tailwind + Zustand):

```
gymlayout-pro/
├── app/
│   ├── layout.tsx                    # Root layout con providers
│   ├── page.tsx                      # Landing page pública
│   ├── (auth)/
│   │   ├── login/page.tsx            # Login con email/password
│   │   ├── register/page.tsx         # Registro
│   │   ├── forgot-password/page.tsx  # Recuperar contraseña
│   │   └── callback/route.ts         # OAuth callback de Supabase
│   ├── (app)/                        # Rutas protegidas (requieren auth)
│   │   ├── layout.tsx                # Layout con sidebar + navbar
│   │   ├── dashboard/page.tsx        # Lista de proyectos del usuario
│   │   ├── project/[id]/
│   │   │   ├── page.tsx              # Editor principal del proyecto
│   │   │   ├── settings/page.tsx     # Config del proyecto
│   │   │   └── share/page.tsx        # Gestión de colaboradores (Pro)
│   │   ├── templates/page.tsx        # Templates de layout prediseñados
│   │   ├── account/page.tsx          # Perfil + plan + billing
│   │   └── upgrade/page.tsx          # Upgrade a Pro
│   └── api/
│       ├── projects/
│       │   ├── route.ts              # CRUD proyectos (server-side)
│       │   └── [id]/
│       │       ├── route.ts          # GET/PUT/DELETE proyecto específico
│       │       ├── duplicate/route.ts
│       │       ├── export/route.ts   # Exportar proyecto (PDF, SIMIO, etc.)
│       │       ├── collaborators/route.ts  # Gestionar colaboradores
│       │       ├── floors/
│       │       │   ├── route.ts              # CRUD pisos del proyecto
│       │       │   └── [floorId]/
│       │       │       ├── route.ts          # GET/PUT/DELETE piso específico
│       │       │       └── configs/
│       │       │           ├── route.ts      # CRUD configuraciones del piso
│       │       │           ├── [configId]/
│       │       │           │   ├── route.ts  # GET/PUT/DELETE config específica
│       │       │           │   └── duplicate/route.ts
│       │       │           └── compare/route.ts  # Comparar 2 configs
│       ├── machines/route.ts         # Biblioteca de máquinas del usuario
│       ├── upload/route.ts           # Upload de planos (imágenes)
│       ├── billing/
│       │   ├── checkout/route.ts     # Crear sesión de pago
│       │   ├── portal/route.ts       # Portal de billing
│       │   └── webhook/route.ts      # Webhook de Stripe
│       └── health/route.ts           # Health check
├── components/
│   ├── Layout/          # Editor de plano + drag-and-drop (existente)
│   ├── SLP/             # Matriz de relaciones (existente)
│   ├── Simulation/      # Motor DES (existente)
│   ├── MachineEditor/   # CRUD máquinas (existente)
│   ├── Export/          # Exportación (existente)
│   ├── UI/              # Sidebar, toolbar, modals (existente)
│   ├── Auth/            # Componentes de autenticación
│   ├── Dashboard/       # Lista de proyectos, cards
│   ├── FloorManager/    # Tabs de pisos, agregar/eliminar piso
│   ├── ConfigManager/   # Pills de configuraciones, switch, duplicar, comparar
│   ├── Comparison/      # Vista side-by-side de 2 configuraciones
│   ├── Collaboration/   # Cursores remotos, presencia
│   └── Billing/         # Cards de planes, upgrade prompts
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Cliente browser (createBrowserClient)
│   │   ├── server.ts         # Cliente server (createServerClient)
│   │   ├── admin.ts          # Cliente admin (service_role, solo server)
│   │   ├── middleware.ts      # Refresh de sesión en middleware
│   │   └── realtime.ts        # Suscripciones realtime para colaboración
│   ├── auth/
│   │   ├── guards.ts          # Middleware de protección de rutas
│   │   └── hooks.ts           # useUser, useSession, useRequireAuth
│   ├── security/
│   │   ├── sanitize.ts        # Sanitización de inputs (DOMPurify para strings, validación de tipos)
│   │   ├── rateLimit.ts       # Rate limiting por IP/usuario en API routes
│   │   ├── csrf.ts            # Protección CSRF
│   │   └── validate.ts        # Schemas Zod para validar TODA input antes de DB
│   └── billing/
│       ├── stripe.ts          # Stripe SDK server-side
│       ├── plans.ts           # Definición de planes Free/Pro
│       └── limits.ts          # Enforcement de límites por plan
├── stores/              # Zustand stores (existentes + nuevos)
│   ├── projectStore.ts  # Estado del proyecto actual (existente, adaptar)
│   ├── authStore.ts     # Estado de auth
│   └── presenceStore.ts # Presencia de colaboradores
├── engine/              # Lógica existente (sin cambios)
├── types/
│   ├── database.ts      # Tipos generados de Supabase (npx supabase gen types)
│   ├── project.ts       # Interfaces del proyecto
│   └── index.ts         # Re-exports
├── middleware.ts         # Next.js middleware (auth + redirect)
├── supabase/
│   └── migrations/      # Migraciones SQL
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       ├── 003_functions.sql
│       └── 004_realtime.sql
└── .env.local           # Variables de entorno (NUNCA commitear)
```

**Setup inicial:**
```bash
npx create-next-app@latest gymlayout-pro --typescript --tailwind --app --src-dir=false
npm install @supabase/supabase-js @supabase/ssr zustand react-konva konva xlsx zod stripe dompurify
npm install -D supabase @types/dompurify
npx supabase init
npx supabase link --project-ref <TU_PROJECT_REF>
```

**Variables de entorno (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # SOLO server-side, NUNCA en cliente
STRIPE_SECRET_KEY=sk_live_...              # SOLO server-side
STRIPE_WEBHOOK_SECRET=whsec_...            # SOLO server-side
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://gymlayout.pro
```

---

### FASE 1: ESQUEMA DE BASE DE DATOS (Supabase PostgreSQL)

**PRINCIPIO FUNDAMENTAL**: Toda la seguridad se implementa a nivel de base de datos con RLS. El cliente NUNCA construye queries SQL — solo usa los métodos del SDK de Supabase (`from().select()`, `.insert()`, etc.) que generan queries parametrizadas automáticamente.

```sql
-- ===========================================
-- MIGRACIÓN 001: ESQUEMA INICIAL
-- ===========================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ───────────────────────────────────────────
-- TABLA: profiles (extiende auth.users)
-- ───────────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'admin')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_expires_at TIMESTAMPTZ,
  projects_count INTEGER NOT NULL DEFAULT 0,  -- Counter cache para límite Free
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para crear profile automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ───────────────────────────────────────────
-- TABLA: projects (proyectos de layout)
-- ───────────────────────────────────────────
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Proyecto sin título',
  description TEXT DEFAULT '',
  thumbnail_url TEXT,

  -- Metadata del gym
  gym_name TEXT DEFAULT '',

  -- Configuración global del proyecto (SLP matrix, simulation defaults, etc.)
  global_config JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Configuración
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,  -- Para templates compartidos

  -- Versionado
  version INTEGER NOT NULL DEFAULT 1,
  last_edited_by UUID REFERENCES public.profiles(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_projects_template ON public.projects(is_template) WHERE is_template = TRUE;
CREATE INDEX idx_projects_public ON public.projects(is_public) WHERE is_public = TRUE;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Counter cache: actualizar projects_count en profiles
CREATE OR REPLACE FUNCTION public.update_projects_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET projects_count = projects_count + 1 WHERE id = NEW.owner_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET projects_count = projects_count - 1 WHERE id = OLD.owner_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER projects_count_trigger
  AFTER INSERT OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_projects_count();

-- ───────────────────────────────────────────
-- TABLA: project_floors (pisos del proyecto)
-- Un proyecto puede tener N pisos, cada uno con su plano y área.
-- El usuario puede agregar/eliminar pisos dinámicamente.
-- ───────────────────────────────────────────
CREATE TABLE public.project_floors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Piso 1',        -- "Planta Baja", "Piso 2", "Subterráneo", etc.
  sort_order INTEGER NOT NULL DEFAULT 0,       -- Orden de visualización en tabs
  area_m2 NUMERIC(10,2),                       -- Superficie disponible del piso
  floor_plan_url TEXT,                         -- URL de la imagen del plano (Supabase Storage)
  scale_config JSONB,                          -- Calibración de escala (2 puntos + distancia real)
  perimeter JSONB,                             -- Polígono del perímetro (paredes, columnas, puertas)
  zones JSONB DEFAULT '[]'::JSONB,             -- Zonas definidas en este piso
  metadata JSONB DEFAULT '{}'::JSONB,          -- Datos extra (altura techo, notas, etc.)

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_floors_project ON public.project_floors(project_id);
CREATE INDEX idx_floors_sort ON public.project_floors(project_id, sort_order);

CREATE TRIGGER floors_updated_at
  BEFORE UPDATE ON public.project_floors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ───────────────────────────────────────────
-- TABLA: floor_configurations (variantes/configuraciones de layout por piso)
-- 
-- CONCEPTO CLAVE: Cada piso puede tener MÚLTIPLES configuraciones de layout.
-- Ejemplo: "FIREFIT Valdivia" → Planta Baja tiene:
--   - Config A: "Layout Original" (el que ya está montado)
--   - Config B: "Layout Optimizado SLP" (propuesta del algoritmo)
--   - Config C: "Layout Alta Densidad" (más máquinas, menos circulación)
--
-- El usuario alterna entre configs con un click rápido (tabs o dropdown).
-- Cada configuración guarda su propia distribución de máquinas,
-- parámetros Guerchet, resultados de simulación y score SLP.
-- ───────────────────────────────────────────
CREATE TABLE public.floor_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_id UUID NOT NULL REFERENCES public.project_floors(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Configuración A',  -- Nombre descriptivo
  sort_order INTEGER NOT NULL DEFAULT 0,
  color_tag TEXT DEFAULT '#4CAF50',                -- Color para identificar rápido la config

  -- Estado de la configuración
  is_active BOOLEAN NOT NULL DEFAULT FALSE,       -- La configuración actualmente seleccionada
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,       -- Bloqueada para no editar accidentalmente

  -- Datos del layout (las máquinas posicionadas en el plano)
  -- Array de objetos: { machineId, x, y, rotation, locked, n, N, K, ... }
  layout_data JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Resultados calculados (se recalculan al modificar layout)
  guerchet_summary JSONB DEFAULT '{}'::JSONB,    -- { totalSt, available, margin, occupancy }
  slp_score NUMERIC(5,2),                         -- Score de layout 0-100
  simulation_results JSONB DEFAULT '{}'::JSONB,  -- KPIs de la última simulación

  -- Metadata
  notes TEXT DEFAULT '',                          -- Notas del usuario sobre esta config
  created_from UUID REFERENCES public.floor_configurations(id),  -- Si fue duplicada de otra

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_configs_floor ON public.floor_configurations(floor_id);
CREATE INDEX idx_configs_project ON public.floor_configurations(project_id);
CREATE INDEX idx_configs_active ON public.floor_configurations(floor_id, is_active) WHERE is_active = TRUE;

CREATE TRIGGER configs_updated_at
  BEFORE UPDATE ON public.floor_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Asegurar que solo UNA configuración esté activa por piso
CREATE OR REPLACE FUNCTION public.ensure_single_active_config()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = TRUE THEN
    UPDATE public.floor_configurations
    SET is_active = FALSE
    WHERE floor_id = NEW.floor_id AND id != NEW.id AND is_active = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER single_active_config
  BEFORE INSERT OR UPDATE OF is_active ON public.floor_configurations
  FOR EACH ROW WHEN (NEW.is_active = TRUE)
  EXECUTE FUNCTION public.ensure_single_active_config();

-- ───────────────────────────────────────────
-- TABLA: project_collaborators (usuarios con acceso)
-- Solo disponible en plan Pro
-- ───────────────────────────────────────────
CREATE TABLE public.project_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,

  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_collaborators_project ON public.project_collaborators(project_id);
CREATE INDEX idx_collaborators_user ON public.project_collaborators(user_id);

-- ───────────────────────────────────────────
-- TABLA: machine_library (biblioteca personal de máquinas)
-- ───────────────────────────────────────────
CREATE TABLE public.machine_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'cardio', 'rack', 'banca', 'máquina_pierna', 'máquina_upper',
    'polea', 'funcional', 'accesorio', 'smith', 'multiestación', 'otro'
  )),
  width_m NUMERIC(6,3) NOT NULL CHECK (width_m > 0 AND width_m < 50),
  length_m NUMERIC(6,3) NOT NULL CHECK (length_m > 0 AND length_m < 50),
  height_m NUMERIC(6,3) CHECK (height_m > 0 AND height_m < 10),
  default_n INTEGER NOT NULL DEFAULT 1 CHECK (default_n >= 1 AND default_n <= 20),
  default_N INTEGER NOT NULL DEFAULT 1 CHECK (default_N >= 1 AND default_N <= 8),
  default_K NUMERIC(4,3) NOT NULL DEFAULT 0.10 CHECK (default_K > 0 AND default_K <= 1),
  -- Tiempos de servicio para simulación (distribución triangular en minutos)
  service_time_min NUMERIC(6,2) DEFAULT 3,
  service_time_mode NUMERIC(6,2) DEFAULT 5,
  service_time_max NUMERIC(6,2) DEFAULT 8,
  capacity INTEGER DEFAULT 1 CHECK (capacity >= 1),
  custom_shape JSONB,  -- Polígono custom si no es rectángulo
  color TEXT DEFAULT '#4CAF50',
  is_global BOOLEAN NOT NULL DEFAULT FALSE,  -- Templates globales (admin)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_machines_owner ON public.machine_library(owner_id);
CREATE INDEX idx_machines_global ON public.machine_library(is_global) WHERE is_global = TRUE;

-- ───────────────────────────────────────────
-- TABLA: project_snapshots (historial de versiones)
-- ───────────────────────────────────────────
CREATE TABLE public.project_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(project_id, version)
);

CREATE INDEX idx_snapshots_project ON public.project_snapshots(project_id);

-- ───────────────────────────────────────────
-- TABLA: project_presence (presencia en tiempo real)
-- Tabla temporal para cursores de colaboradores
-- ───────────────────────────────────────────
CREATE TABLE public.project_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cursor_x NUMERIC(10,2),
  cursor_y NUMERIC(10,2),
  active_floor INTEGER DEFAULT 0,
  selected_machine_id TEXT,
  color TEXT NOT NULL DEFAULT '#FF5722',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(project_id, user_id)
);

-- Limpiar presencia vieja (> 5 min sin actividad)
CREATE OR REPLACE FUNCTION public.cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM public.project_presence WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────
-- TABLA: audit_log (registro de acciones para seguridad)
-- ───────────────────────────────────────────
CREATE TABLE public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_created ON public.audit_log(created_at DESC);

-- Particionar audit_log por mes para performance (opcional)
-- CREATE TABLE audit_log_y2025m01 PARTITION OF audit_log FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

---

### FASE 2: ROW LEVEL SECURITY (RLS) — LA CAPA MÁS CRÍTICA

```sql
-- ===========================================
-- MIGRACIÓN 002: POLÍTICAS RLS
-- ===========================================

-- ───────────────── PROFILES ─────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Usuarios solo ven su propio perfil y el de colaboradores de sus proyectos
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR id IN (
      SELECT pc.user_id FROM public.project_collaborators pc
      JOIN public.projects p ON p.id = pc.project_id
      WHERE p.owner_id = auth.uid()
    )
    OR id IN (
      SELECT p.owner_id FROM public.projects p
      JOIN public.project_collaborators pc ON pc.project_id = p.id
      WHERE pc.user_id = auth.uid()
    )
  );

-- Solo pueden actualizar su propio perfil (campos permitidos)
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ───────────────── PROJECTS ─────────────────
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Ver: propios + donde soy colaborador + templates públicos
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    owner_id = auth.uid()
    OR is_public = TRUE
    OR id IN (
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

-- Crear: solo propios (el owner_id DEBE ser el usuario autenticado)
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Actualizar: owner o editor colaborador
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND role = 'editor' AND accepted_at IS NOT NULL
    )
  );

-- Eliminar: solo el owner
CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE USING (owner_id = auth.uid());

-- ───────────────── COLLABORATORS ─────────────────
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- Ver: owner del proyecto o el propio colaborador
CREATE POLICY "collaborators_select" ON public.project_collaborators
  FOR SELECT USING (
    user_id = auth.uid()
    OR project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
    )
  );

-- Insertar: solo el owner del proyecto puede invitar
CREATE POLICY "collaborators_insert" ON public.project_collaborators
  FOR INSERT WITH CHECK (
    invited_by = auth.uid()
    AND project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
    )
  );

-- Actualizar: el colaborador puede aceptar su propia invitación, owner puede cambiar rol
CREATE POLICY "collaborators_update" ON public.project_collaborators
  FOR UPDATE USING (
    user_id = auth.uid()
    OR project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
    )
  );

-- Eliminar: owner del proyecto o el propio colaborador (abandonar)
CREATE POLICY "collaborators_delete" ON public.project_collaborators
  FOR DELETE USING (
    user_id = auth.uid()
    OR project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
    )
  );

-- ───────────────── PROJECT FLOORS ─────────────────
ALTER TABLE public.project_floors ENABLE ROW LEVEL SECURITY;

-- Heredan acceso del proyecto padre
CREATE POLICY "floors_select" ON public.project_floors
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
    OR project_id IN (SELECT id FROM public.projects WHERE is_public = TRUE)
  );

CREATE POLICY "floors_insert" ON public.project_floors
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

CREATE POLICY "floors_update" ON public.project_floors
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND role = 'editor' AND accepted_at IS NOT NULL
    )
  );

CREATE POLICY "floors_delete" ON public.project_floors
  FOR DELETE USING (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

-- ───────────────── FLOOR CONFIGURATIONS ─────────────────
ALTER TABLE public.floor_configurations ENABLE ROW LEVEL SECURITY;

-- Heredan acceso del proyecto padre
CREATE POLICY "configs_select" ON public.floor_configurations
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
    OR project_id IN (SELECT id FROM public.projects WHERE is_public = TRUE)
  );

CREATE POLICY "configs_insert" ON public.floor_configurations
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND role = 'editor' AND accepted_at IS NOT NULL
    )
  );

CREATE POLICY "configs_update" ON public.floor_configurations
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND role = 'editor' AND accepted_at IS NOT NULL
    )
  );

CREATE POLICY "configs_delete" ON public.floor_configurations
  FOR DELETE USING (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

-- ───────────────── MACHINE LIBRARY ─────────────────
ALTER TABLE public.machine_library ENABLE ROW LEVEL SECURITY;

-- Ver: propias + globales (templates del admin)
CREATE POLICY "machines_select" ON public.machine_library
  FOR SELECT USING (owner_id = auth.uid() OR is_global = TRUE);

CREATE POLICY "machines_insert" ON public.machine_library
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "machines_update" ON public.machine_library
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "machines_delete" ON public.machine_library
  FOR DELETE USING (owner_id = auth.uid());

-- ───────────────── SNAPSHOTS ─────────────────
ALTER TABLE public.project_snapshots ENABLE ROW LEVEL SECURITY;

-- Ver: si tengo acceso al proyecto
CREATE POLICY "snapshots_select" ON public.project_snapshots
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

-- Crear: si tengo acceso de edición
CREATE POLICY "snapshots_insert" ON public.project_snapshots
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND role = 'editor' AND accepted_at IS NOT NULL
    )
  );

-- ───────────────── PRESENCE ─────────────────
ALTER TABLE public.project_presence ENABLE ROW LEVEL SECURITY;

-- Ver: si tengo acceso al proyecto
CREATE POLICY "presence_select" ON public.project_presence
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

-- Insertar/Actualizar: solo mi propia presencia
CREATE POLICY "presence_upsert" ON public.project_presence
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "presence_update" ON public.project_presence
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "presence_delete" ON public.project_presence
  FOR DELETE USING (user_id = auth.uid());

-- ───────────────── AUDIT LOG ─────────────────
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Solo el propio usuario puede ver sus logs (admin ve todo via service_role)
CREATE POLICY "audit_select_own" ON public.audit_log
  FOR SELECT USING (user_id = auth.uid());

-- Solo server-side puede insertar (via service_role o funciones SECURITY DEFINER)
-- No hay policy de INSERT para anon/authenticated → el cliente NO puede escribir logs directamente
```

---

### FASE 3: FUNCIONES SERVER-SIDE SEGURAS

```sql
-- ===========================================
-- MIGRACIÓN 003: FUNCIONES (SECURITY DEFINER)
-- ===========================================

-- ───────────────────────────────────────────
-- Función: Crear proyecto (con validación de plan)
-- ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_project(
  p_name TEXT,
  p_description TEXT DEFAULT '',
  p_gym_name TEXT DEFAULT '',
  p_floor_count INTEGER DEFAULT 2,
  p_total_area NUMERIC DEFAULT NULL,
  p_initial_data JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_plan TEXT;
  v_count INTEGER;
  v_project_id UUID;
  v_max_projects INTEGER;
BEGIN
  -- Validar autenticación
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Validar inputs (defensa en profundidad)
  IF length(p_name) > 200 THEN
    RAISE EXCEPTION 'Nombre del proyecto demasiado largo (máx 200 caracteres)';
  END IF;
  IF length(p_description) > 2000 THEN
    RAISE EXCEPTION 'Descripción demasiado larga (máx 2000 caracteres)';
  END IF;

  -- Verificar límite de proyectos según plan
  SELECT plan, projects_count INTO v_plan, v_count FROM public.profiles WHERE id = v_user_id;

  v_max_projects := CASE v_plan
    WHEN 'free' THEN 3
    WHEN 'pro' THEN 999999
    WHEN 'admin' THEN 999999
    ELSE 3
  END;

  IF v_count >= v_max_projects THEN
    RAISE EXCEPTION 'Límite de proyectos alcanzado para plan %. Actualiza a Pro para proyectos ilimitados.', v_plan;
  END IF;

  -- Crear proyecto
  INSERT INTO public.projects (owner_id, name, description, gym_name, floor_count, total_area_m2, project_data)
  VALUES (v_user_id, p_name, p_description, p_gym_name, p_floor_count, p_total_area, p_initial_data)
  RETURNING id INTO v_project_id;

  -- Registrar en audit log
  INSERT INTO public.audit_log (user_id, action, resource_type, resource_id, metadata)
  VALUES (v_user_id, 'create', 'project', v_project_id, jsonb_build_object('name', p_name));

  RETURN v_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────
-- Función: Guardar proyecto con versionado
-- ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.save_project(
  p_project_id UUID,
  p_project_data JSONB,
  p_create_snapshot BOOLEAN DEFAULT FALSE
)
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_new_version INTEGER;
  v_has_access BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Verificar acceso de edición
  SELECT EXISTS(
    SELECT 1 FROM public.projects WHERE id = p_project_id AND owner_id = v_user_id
    UNION
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = p_project_id AND user_id = v_user_id AND role = 'editor' AND accepted_at IS NOT NULL
  ) INTO v_has_access;

  IF NOT v_has_access THEN
    RAISE EXCEPTION 'Sin permisos de edición para este proyecto';
  END IF;

  -- Validar tamaño del JSON (máx 10MB para evitar abuso)
  IF pg_column_size(p_project_data) > 10 * 1024 * 1024 THEN
    RAISE EXCEPTION 'Datos del proyecto exceden el tamaño máximo (10MB)';
  END IF;

  -- Actualizar proyecto
  UPDATE public.projects
  SET project_data = p_project_data,
      version = version + 1,
      last_edited_by = v_user_id,
      updated_at = NOW()
  WHERE id = p_project_id
  RETURNING version INTO v_new_version;

  -- Crear snapshot si se pide
  IF p_create_snapshot THEN
    INSERT INTO public.project_snapshots (project_id, version, snapshot_data, created_by)
    VALUES (p_project_id, v_new_version, p_project_data, v_user_id);
  END IF;

  RETURN v_new_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────
-- Función: Invitar colaborador (solo Pro)
-- ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.invite_collaborator(
  p_project_id UUID,
  p_email TEXT,
  p_role TEXT DEFAULT 'viewer'
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_plan TEXT;
  v_target_user_id UUID;
  v_collab_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Verificar que es el owner del proyecto
  IF NOT EXISTS(SELECT 1 FROM public.projects WHERE id = p_project_id AND owner_id = v_user_id) THEN
    RAISE EXCEPTION 'Solo el dueño del proyecto puede invitar colaboradores';
  END IF;

  -- Verificar plan Pro
  SELECT plan INTO v_plan FROM public.profiles WHERE id = v_user_id;
  IF v_plan NOT IN ('pro', 'admin') THEN
    RAISE EXCEPTION 'La colaboración en tiempo real requiere plan Pro';
  END IF;

  -- Validar rol
  IF p_role NOT IN ('viewer', 'editor') THEN
    RAISE EXCEPTION 'Rol inválido. Debe ser viewer o editor';
  END IF;

  -- Buscar usuario por email
  SELECT id INTO v_target_user_id FROM public.profiles WHERE email = p_email;
  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'No existe un usuario con ese email. Debe registrarse primero.';
  END IF;

  -- No puedes invitarte a ti mismo
  IF v_target_user_id = v_user_id THEN
    RAISE EXCEPTION 'No puedes invitarte a ti mismo';
  END IF;

  -- Insertar o actualizar invitación
  INSERT INTO public.project_collaborators (project_id, user_id, role, invited_by)
  VALUES (p_project_id, v_target_user_id, p_role, v_user_id)
  ON CONFLICT (project_id, user_id) DO UPDATE SET role = p_role
  RETURNING id INTO v_collab_id;

  RETURN v_collab_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────
-- Función: Duplicar proyecto
-- ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.duplicate_project(
  p_project_id UUID,
  p_new_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_new_id UUID;
  v_original RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Obtener proyecto original (verificando acceso via RLS implícitamente)
  SELECT * INTO v_original FROM public.projects WHERE id = p_project_id;
  IF v_original IS NULL THEN
    RAISE EXCEPTION 'Proyecto no encontrado o sin acceso';
  END IF;

  -- Usar la función create_project para respetar límites de plan
  v_new_id := public.create_project(
    COALESCE(p_new_name, v_original.name || ' (copia)'),
    v_original.description,
    v_original.gym_name,
    v_original.floor_count,
    v_original.total_area_m2,
    v_original.project_data
  );

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### FASE 4: REALTIME PARA COLABORACIÓN EN TIEMPO REAL (PRO)

```sql
-- ===========================================
-- MIGRACIÓN 004: REALTIME
-- ===========================================

-- Habilitar Realtime en las tablas necesarias
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_floors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.floor_configurations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_collaborators;
```

**Implementar en el cliente (`lib/supabase/realtime.ts`):**

```typescript
// lib/supabase/realtime.ts
import { createBrowserClient } from './client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface PresenceState {
  userId: string
  displayName: string
  cursorX: number
  cursorY: number
  activeFloor: number
  selectedMachineId: string | null
  color: string
}

export class ProjectRealtimeManager {
  private channel: RealtimeChannel | null = null
  private supabase = createBrowserClient()

  /**
   * Suscribirse a cambios de un proyecto en tiempo real.
   * - Broadcast: cursores de otros usuarios (baja latencia, sin persistir)
   * - Presence: quién está conectado
   * - Postgres Changes: cambios en project_data persistidos
   */
  subscribe(
    projectId: string,
    userId: string,
    callbacks: {
      onPresenceSync: (users: PresenceState[]) => void
      onCursorMove: (userId: string, x: number, y: number) => void
      onProjectUpdate: (data: any) => void
      onMachineMove: (userId: string, machineId: string, x: number, y: number) => void
    }
  ) {
    this.channel = this.supabase
      .channel(`project:${projectId}`, {
        config: { presence: { key: userId } }
      })

      // Presencia: quién está conectado
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel!.presenceState<PresenceState>()
        const users = Object.values(state).flat()
        callbacks.onPresenceSync(users)
      })

      // Broadcast: movimientos de cursor (no se persisten, baja latencia)
      .on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
        callbacks.onCursorMove(payload.userId, payload.x, payload.y)
      })

      // Broadcast: movimiento de máquina en tiempo real
      .on('broadcast', { event: 'machine_move' }, ({ payload }) => {
        callbacks.onMachineMove(payload.userId, payload.machineId, payload.x, payload.y)
      })

      // Postgres Changes: guardado de proyecto (persistido)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        (payload) => {
          callbacks.onProjectUpdate(payload.new)
        }
      )

      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Anunciar presencia
          await this.channel!.track({
            userId,
            online_at: new Date().toISOString()
          })
        }
      })
  }

  // Enviar posición del cursor (broadcast, sin persistir)
  sendCursorPosition(userId: string, x: number, y: number) {
    this.channel?.send({
      type: 'broadcast',
      event: 'cursor_move',
      payload: { userId, x, y }
    })
  }

  // Enviar movimiento de máquina en tiempo real
  sendMachineMove(userId: string, machineId: string, x: number, y: number) {
    this.channel?.send({
      type: 'broadcast',
      event: 'machine_move',
      payload: { userId, machineId, x, y }
    })
  }

  unsubscribe() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel)
      this.channel = null
    }
  }
}
```

---

### FASE 5: SEGURIDAD — CAPAS DE PROTECCIÓN

**Capa 1: Validación de inputs con Zod (ANTES de tocar la DB)**

```typescript
// lib/security/validate.ts
import { z } from 'zod'

// Sanitizar strings para prevenir XSS
const safeString = z.string().transform(s => s.replace(/<[^>]*>/g, '').trim())

export const createProjectSchema = z.object({
  name: safeString.min(1, 'El nombre es obligatorio').max(200),
  description: safeString.max(2000).optional().default(''),
  gymName: safeString.max(200).optional().default(''),
  floorCount: z.number().int().min(1).max(10).default(2),
  totalArea: z.number().positive().max(100000).optional(),
  initialData: z.record(z.unknown()).optional().default({})
})

export const saveProjectSchema = z.object({
  projectId: z.string().uuid('ID de proyecto inválido'),
  projectData: z.record(z.unknown()),
  createSnapshot: z.boolean().default(false)
})

export const inviteCollaboratorSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().email('Email inválido'),
  role: z.enum(['viewer', 'editor']).default('viewer')
})

export const machineSchema = z.object({
  name: safeString.min(1).max(100),
  category: z.enum([
    'cardio', 'rack', 'banca', 'máquina_pierna', 'máquina_upper',
    'polea', 'funcional', 'accesorio', 'smith', 'multiestación', 'otro'
  ]),
  widthM: z.number().positive().max(50),
  lengthM: z.number().positive().max(50),
  heightM: z.number().positive().max(10).optional(),
  defaultN: z.number().int().min(1).max(20).default(1),
  defaultSides: z.number().int().min(1).max(8).default(1),
  defaultK: z.number().positive().max(1).default(0.10),
  serviceTimeMin: z.number().positive().default(3),
  serviceTimeMode: z.number().positive().default(5),
  serviceTimeMax: z.number().positive().default(8),
  capacity: z.number().int().positive().default(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#4CAF50'),
})

export const addFloorSchema = z.object({
  projectId: z.string().uuid(),
  name: safeString.min(1).max(100),
  areaM2: z.number().positive().max(100000).optional(),
  sortOrder: z.number().int().min(0).max(50).optional()
})

export const createConfigSchema = z.object({
  floorId: z.string().uuid(),
  name: safeString.min(1).max(100).default('Nueva configuración'),
  duplicateFrom: z.string().uuid().optional(),  // ID de config a duplicar
  colorTag: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#4CAF50')
})

export const saveConfigSchema = z.object({
  configId: z.string().uuid(),
  layoutData: z.array(z.object({
    machineId: z.string(),
    x: z.number(),
    y: z.number(),
    rotation: z.number().min(0).max(360).default(0),
    locked: z.boolean().default(false),
    n: z.number().int().positive(),
    N: z.number().int().positive(),
    K: z.number().positive().max(1),
  })),
  guerchetSummary: z.record(z.unknown()).optional(),
  notes: safeString.max(5000).optional()
})

export const switchConfigSchema = z.object({
  configId: z.string().uuid()
})

// Validar en cada API route:
// const parsed = createProjectSchema.safeParse(body)
// if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
```

**Capa 2: Rate Limiting en API Routes**

```typescript
// lib/security/rateLimit.ts
const rateMap = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  key: string,
  maxRequests: number = 30,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now()
  const entry = rateMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000)
    }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count }
}

// Uso en API route:
// const { allowed, retryAfter } = rateLimit(`${userId}:create_project`, 10, 60_000)
// if (!allowed) return NextResponse.json({ error: 'Rate limit' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } })
```

**Capa 3: Middleware de autenticación (Next.js)**

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Rutas protegidas: redirigir a login si no hay sesión
  if (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/project') ||
      request.nextUrl.pathname.startsWith('/account')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Rutas de auth: redirigir a dashboard si ya hay sesión
  if (request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/register')) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // API routes: verificar autenticación
  if (request.nextUrl.pathname.startsWith('/api/') &&
      !request.nextUrl.pathname.startsWith('/api/health') &&
      !request.nextUrl.pathname.startsWith('/api/billing/webhook')) {
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
  }

  // Headers de seguridad
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com;"
  )

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
```

**Capa 4: API Route ejemplo (CRUD completo seguro)**

```typescript
// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createProjectSchema } from '@/lib/security/validate'
import { rateLimit } from '@/lib/security/rateLimit'

// GET /api/projects — Listar proyectos del usuario
export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // RLS se encarga de filtrar — el usuario solo ve los suyos + colaboraciones
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id, name, description, gym_name, thumbnail_url,
      floor_count, total_area_m2, version, is_template,
      created_at, updated_at,
      owner:profiles!owner_id(id, display_name, avatar_url),
      collaborators:project_collaborators(
        user:profiles!user_id(id, display_name, avatar_url),
        role
      )
    `)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Error al obtener proyectos' }, { status: 500 })
  }

  return NextResponse.json({ projects: data })
}

// POST /api/projects — Crear proyecto
export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Rate limiting
  const { allowed, retryAfter } = rateLimit(`${user.id}:create_project`, 10, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  // Parsear y validar body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = createProjectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Llamar función SQL segura (respeta límites de plan)
  const { data, error } = await supabase.rpc('create_project', {
    p_name: parsed.data.name,
    p_description: parsed.data.description,
    p_gym_name: parsed.data.gymName,
    p_floor_count: parsed.data.floorCount,
    p_total_area: parsed.data.totalArea ?? null,
    p_initial_data: parsed.data.initialData
  })

  if (error) {
    // Mapear errores de PostgreSQL a respuestas HTTP legibles
    if (error.message.includes('Límite de proyectos')) {
      return NextResponse.json({ error: error.message, code: 'PLAN_LIMIT' }, { status: 403 })
    }
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 })
  }

  return NextResponse.json({ projectId: data }, { status: 201 })
}
```

---

### FASE 6: SISTEMA DE PLANES (FREE vs PRO)

```typescript
// lib/billing/plans.ts
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    maxProjects: 3,
    maxFloorsPerProject: 3,          // Máx 3 pisos por proyecto
    maxConfigsPerFloor: 3,           // Máx 3 configuraciones por piso
    features: {
      layoutEditor: true,
      guerchetCalculation: true,
      slpAnalysis: true,
      simulation: true,
      exportPNG: true,
      exportPDF: false,              // Solo Pro
      exportSIMIO: false,            // Solo Pro
      collaboration: false,          // Solo Pro
      sideBySideComparison: false,   // Solo Pro
      customMachineLibrary: 10,      // Máx 10 máquinas custom
      snapshotHistory: 5,            // Últimos 5 snapshots
      realtimePresence: false,       // Solo Pro
    }
  },
  pro: {
    name: 'Pro',
    priceMonthly: 14990,  // CLP (≈ $15 USD)
    priceYearly: 119900,  // CLP (≈ $120 USD, 2 meses gratis)
    maxProjects: Infinity,
    maxFloorsPerProject: 20,         // Hasta 20 pisos
    maxConfigsPerFloor: 20,          // Hasta 20 configuraciones por piso
    features: {
      layoutEditor: true,
      guerchetCalculation: true,
      slpAnalysis: true,
      simulation: true,
      exportPNG: true,
      exportPDF: true,
      exportSIMIO: true,
      collaboration: true,
      sideBySideComparison: true,    // Comparar configs side-by-side
      customMachineLibrary: Infinity,
      snapshotHistory: Infinity,
      realtimePresence: true,
    }
  }
} as const

// Verificar feature disponible
export function canUseFeature(plan: string, feature: keyof typeof PLANS.free.features): boolean | number {
  const planConfig = PLANS[plan as keyof typeof PLANS] ?? PLANS.free
  return planConfig.features[feature]
}
```

**Webhook de Stripe para sincronizar planes:**

```typescript
// app/api/billing/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// IMPORTANTE: Usar service_role solo en server-side para bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      if (userId) {
        await supabaseAdmin.from('profiles').update({
          plan: 'pro',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string
        }).eq('id', userId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await supabaseAdmin.from('profiles').update({
        plan: 'free',
        stripe_subscription_id: null,
        plan_expires_at: null
      }).eq('stripe_subscription_id', subscription.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      // Marcar plan como expirado pero dar gracia de 7 días
      await supabaseAdmin.from('profiles').update({
        plan_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }).eq('stripe_customer_id', invoice.customer as string)
      break
    }
  }

  return NextResponse.json({ received: true })
}
```

---

### FASE 7: STORAGE PARA PLANOS (Supabase Storage)

```sql
-- Bucket para imágenes de planos de gimnasio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'floor-plans',
  'floor-plans',
  false,  -- Privado, acceso controlado via RLS
  10485760,  -- 10MB máx
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
);

-- Política: solo el dueño del proyecto puede subir/ver
CREATE POLICY "floor_plans_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'floor-plans'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "floor_plans_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'floor-plans'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "floor_plans_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'floor-plans'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Bucket para thumbnails de proyectos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true,  -- Público para mostrar en dashboard/templates
  2097152,  -- 2MB máx
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);
```

---

### FASE 8: DEPLOY EN VERCEL

**`vercel.json`:**
```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "regions": ["gru1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ],
  "crons": [
    {
      "path": "/api/cron/cleanup-presence",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Pasos de deploy:**
```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Configurar variables de entorno en Vercel dashboard:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
#    - STRIPE_SECRET_KEY
#    - STRIPE_WEBHOOK_SECRET
#    - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
#    - NEXT_PUBLIC_APP_URL

# 4. Deploy
vercel --prod

# 5. Configurar dominio custom
vercel domains add gymlayout.pro
```

---

### FASE 9: SISTEMA DE PISOS Y CONFIGURACIONES (UX CRÍTICA)

**Modelo conceptual (jerárquico):**
```
Proyecto (ej: "FIREFIT Valdivia")
├── Piso 1: "Planta Baja" (265 m²)
│   ├── Config A: "Layout Original" ← activa (✓)
│   ├── Config B: "Layout Optimizado SLP"
│   └── Config C: "Layout Alta Densidad"
├── Piso 2: "Planta Alta" (285 m²)
│   ├── Config A: "Layout Original" ← activa (✓)
│   └── Config B: "Layout Sin Multi-8"
└── Piso 3: "Terraza" (120 m²)   ← piso agregado después
    └── Config A: "Zona Funcional"
```

**UI del editor — Navegación de pisos y configuraciones:**

1. **Barra de pisos (tabs horizontales superiores, debajo del toolbar)**:
   - Cada piso es un tab: `[Planta Baja (265 m²)] [Planta Alta (285 m²)] [+ Agregar piso]`
   - Click en tab → cambia al piso, mostrando la configuración activa de ese piso
   - Click derecho o botón ⋯ en el tab → menú contextual: Renombrar, Editar área, Cambiar plano, Eliminar piso
   - Drag & drop de tabs para reordenar pisos
   - Botón `[+ Agregar piso]` → modal: nombre, superficie (m²), plano (opcional)

2. **Selector de configuraciones (sub-tabs o pills debajo de los pisos)**:
   ```
   Planta Baja (265 m²)
   ┌──────────────────────────────────────────────────────┐
   │ ● Config A "Original"  ○ Config B "SLP"  ○ Config C  │ [+ Nueva config]  [⟷ Comparar]
   └──────────────────────────────────────────────────────┘
   ```
   - Cada configuración es un **pill/chip con color** (el `color_tag`)
   - La activa tiene punto sólido (●), las demás punto vacío (○)
   - **Click = cambio instantáneo** (no recarga — la data ya está en memoria o se carga lazy)
   - Nombre editable inline (doble click)
   - Hover → tooltip con métricas rápidas: "St: 262 m² | Ocupación: 99% | Score SLP: 78"
   - Icono 🔒 si está bloqueada (no editable)
   - Click derecho o ⋯ → menú: Renombrar, Duplicar, Bloquear/Desbloquear, Establecer como activa, Eliminar
   - Botón `[+ Nueva config]`:
     - Opción 1: "Configuración vacía" (plano limpio, sin máquinas)
     - Opción 2: "Duplicar configuración actual" (copia exacta para experimentar)
     - Opción 3: "Desde optimización SLP" (genera config con el algoritmo genético)

3. **Modo comparación side-by-side** (botón `[⟷ Comparar]`):
   - Divide el canvas en 2 paneles (o overlay semitransparente)
   - Panel izquierdo: Config A (seleccionable via dropdown)
   - Panel derecho: Config B
   - Zoom y pan sincronizados entre ambos paneles
   - Mostrar **diff visual**: máquinas que cambiaron de posición resaltadas, métricas comparadas
   - Tabla comparativa debajo:
     ```
     │ Métrica            │ Config A    │ Config B    │ Diferencia │
     │ Superficie total   │ 262.54 m²   │ 258.12 m²   │ -4.42 m²   │
     │ % Ocupación        │ 99.1%       │ 97.4%       │ -1.7%      │
     │ Score SLP          │ 72          │ 85          │ +13        │
     │ Clientes/hora pico │ 38          │ 42          │ +4         │
     └────────────────────┴─────────────┴─────────────┴────────────┘
     ```

4. **Acciones rápidas entre configuraciones:**
   - `Ctrl+1`, `Ctrl+2`, `Ctrl+3` → Alternar entre configs del piso actual
   - `Ctrl+↑`, `Ctrl+↓` → Cambiar de piso
   - "Copiar máquinas seleccionadas a otra config" → seleccionar máquinas → click derecho → "Copiar a Config B"
   - "Mover máquina a otro piso" → drag de la máquina al tab del otro piso

5. **Dashboard del proyecto (vista resumen antes de entrar al editor):**
   - Cards con thumbnail de cada piso × configuración
   - Métricas clave por card (superficie, ocupación, score)
   - Indicador visual de cuál es la configuración activa por piso
   - Botón "Entrar al editor" abre el piso/config que el usuario seleccione

**Funciones SQL adicionales para pisos y configuraciones:**

```sql
-- Agregar piso a un proyecto
CREATE OR REPLACE FUNCTION public.add_floor(
  p_project_id UUID,
  p_name TEXT,
  p_area_m2 NUMERIC DEFAULT NULL,
  p_sort_order INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_floor_id UUID;
  v_max_sort INTEGER;
  v_plan TEXT;
  v_floor_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  -- Verificar ownership
  IF NOT EXISTS(SELECT 1 FROM public.projects WHERE id = p_project_id AND owner_id = v_user_id) THEN
    RAISE EXCEPTION 'Sin permisos para este proyecto';
  END IF;

  -- Límite de pisos según plan (Free: máx 3 pisos, Pro: máx 20)
  SELECT p.plan INTO v_plan FROM public.profiles p WHERE p.id = v_user_id;
  SELECT COUNT(*) INTO v_floor_count FROM public.project_floors WHERE project_id = p_project_id;

  IF v_plan = 'free' AND v_floor_count >= 3 THEN
    RAISE EXCEPTION 'Plan Free permite máximo 3 pisos. Actualiza a Pro para más.';
  ELSIF v_floor_count >= 20 THEN
    RAISE EXCEPTION 'Máximo 20 pisos por proyecto';
  END IF;

  -- Auto sort_order
  IF p_sort_order IS NULL THEN
    SELECT COALESCE(MAX(sort_order), -1) + 1 INTO v_max_sort
    FROM public.project_floors WHERE project_id = p_project_id;
  ELSE
    v_max_sort := p_sort_order;
  END IF;

  -- Crear piso
  INSERT INTO public.project_floors (project_id, name, area_m2, sort_order)
  VALUES (p_project_id, p_name, p_area_m2, v_max_sort)
  RETURNING id INTO v_floor_id;

  -- Crear configuración default "Config A" para el piso
  INSERT INTO public.floor_configurations (floor_id, project_id, name, sort_order, is_active)
  VALUES (v_floor_id, p_project_id, 'Configuración A', 0, TRUE);

  RETURN v_floor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Duplicar configuración
CREATE OR REPLACE FUNCTION public.duplicate_configuration(
  p_config_id UUID,
  p_new_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_original RECORD;
  v_new_id UUID;
  v_config_count INTEGER;
  v_plan TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  -- Obtener configuración original
  SELECT * INTO v_original FROM public.floor_configurations WHERE id = p_config_id;
  IF v_original IS NULL THEN RAISE EXCEPTION 'Configuración no encontrada'; END IF;

  -- Verificar acceso
  IF NOT EXISTS(
    SELECT 1 FROM public.projects WHERE id = v_original.project_id AND owner_id = v_user_id
    UNION
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = v_original.project_id AND user_id = v_user_id AND role = 'editor'
  ) THEN
    RAISE EXCEPTION 'Sin permisos de edición';
  END IF;

  -- Límite de configs por piso (Free: 3, Pro: 20)
  SELECT p.plan INTO v_plan FROM public.profiles p WHERE p.id = v_user_id;
  SELECT COUNT(*) INTO v_config_count FROM public.floor_configurations WHERE floor_id = v_original.floor_id;

  IF v_plan = 'free' AND v_config_count >= 3 THEN
    RAISE EXCEPTION 'Plan Free permite máximo 3 configuraciones por piso. Actualiza a Pro.';
  ELSIF v_config_count >= 20 THEN
    RAISE EXCEPTION 'Máximo 20 configuraciones por piso';
  END IF;

  -- Duplicar
  INSERT INTO public.floor_configurations (
    floor_id, project_id, name, sort_order, layout_data,
    guerchet_summary, slp_score, simulation_results, notes, created_from
  )
  VALUES (
    v_original.floor_id,
    v_original.project_id,
    COALESCE(p_new_name, v_original.name || ' (copia)'),
    v_original.sort_order + 1,
    v_original.layout_data,
    v_original.guerchet_summary,
    v_original.slp_score,
    v_original.simulation_results,
    v_original.notes,
    v_original.id
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cambiar configuración activa (switch rápido)
CREATE OR REPLACE FUNCTION public.switch_active_config(
  p_config_id UUID
)
RETURNS void AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_config RECORD;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  SELECT * INTO v_config FROM public.floor_configurations WHERE id = p_config_id;
  IF v_config IS NULL THEN RAISE EXCEPTION 'Configuración no encontrada'; END IF;

  -- Verificar acceso (al menos viewer puede cambiar la vista activa)
  IF NOT EXISTS(
    SELECT 1 FROM public.projects WHERE id = v_config.project_id AND owner_id = v_user_id
    UNION
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = v_config.project_id AND user_id = v_user_id AND accepted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Sin acceso a este proyecto';
  END IF;

  -- El trigger ensure_single_active_config se encarga de desactivar las demás
  UPDATE public.floor_configurations SET is_active = TRUE WHERE id = p_config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### FLUJO COMPLETO DEL USUARIO

**Free:**
1. Se registra con email/password → se crea profile con plan='free'
2. Ve dashboard vacío → botón "Nuevo Proyecto"
3. Crea proyecto (máx 3) → se crean pisos iniciales (ej: 2) con 1 config cada uno
4. Importa Excel Guerchet, arrastra máquinas, configura SLP, corre simulación
5. Puede agregar hasta 3 pisos y 3 configuraciones por piso
6. Guarda (auto-save cada 30s + Ctrl+S) → datos van a Supabase via API route segura
7. Exporta PNG del layout → descarga directa
8. Si intenta exportar PDF/SIMIO, invitar colaborador, o crear 4° config → modal de upgrade a Pro

**Pro:**
1. Paga via Stripe ($14.990 CLP/mes) → webhook actualiza plan a 'pro'
2. Proyectos ilimitados, hasta 20 pisos, hasta 20 configs por piso
3. Puede invitar colaboradores por email
4. Colaboración en tiempo real: ven cursores del otro, máquinas se mueven en vivo
5. Exportación completa: PDF, SIMIO, SimPy
6. Historial de versiones ilimitado
7. Biblioteca de máquinas custom ilimitada
8. Modo comparación side-by-side entre configuraciones

---

### CHECKLIST DE SEGURIDAD (OBLIGATORIO)

- [ ] **RLS habilitado** en TODAS las tablas (verificar con `SELECT tablename FROM pg_tables WHERE schemaname='public'`)
- [ ] **Ninguna query SQL construida manualmente** en el cliente — solo `supabase.from().select/insert/update/delete` y `.rpc()`
- [ ] **Zod validation** en TODA input antes de enviar a Supabase
- [ ] **Rate limiting** en todas las API routes
- [ ] **CORS** configurado solo para el dominio de la app
- [ ] **CSP headers** en middleware
- [ ] **service_role key** NUNCA expuesta al cliente (solo en API routes server-side)
- [ ] **Stripe webhook** verificado con `constructEvent()` (no confiar en el body raw)
- [ ] **XSS prevention**: DOMPurify para cualquier HTML renderizado, strings sanitizados
- [ ] **CSRF**: SameSite cookies + verificar Origin header en API routes
- [ ] **SQL injection**: Imposible porque no hay queries manuales — Supabase SDK parametriza todo
- [ ] **Audit log** en operaciones críticas (create, delete, change plan, invite)
- [ ] **No logs de datos sensibles**: nunca loguear passwords, tokens, o project_data completo
- [ ] **Input size limits**: JSONB max 10MB, strings max 2000 chars, archivos max 10MB

---

### NOTAS DE IMPLEMENTACIÓN

1. **Auto-save inteligente**: Debounce de 30 segundos. Solo envía diff del `project_data` si cambió. Indicador visual "Guardando..." / "Guardado ✓" / "Error al guardar ✗".

2. **Conflicto de edición colaborativa**: Usar **CRDT simplificado** — cuando dos editores mueven la misma máquina simultáneamente, el último movimiento gana (last-write-wins), pero el broadcast en tiempo real minimiza conflictos porque ambos ven el cursor del otro.

3. **Offline resilience**: Si pierde conexión, guardar en `localStorage` como fallback y sincronizar al reconectar. Mostrar banner "Modo offline — los cambios se guardarán al reconectar".

4. **Migración de datos existentes**: El primer login del usuario puede importar un JSON guardado localmente (del GymLayout Pro v1 sin backend) para migrar su proyecto.

5. **Performance**: `project_data` es un JSONB grande. Para proyectos con muchas máquinas, considerar lazy loading de datos de simulación (cargarlos solo cuando el usuario abre el tab de simulación).

6. **Tests**: Escribir tests para:
   - Todas las RLS policies (crear 2 usuarios, verificar que uno no ve los proyectos del otro)
   - Límites de plan (usuario Free no puede crear 4° proyecto)
   - Validación de inputs (strings maliciosos, JSON gigantes)
   - Rate limiting (enviar 31 requests en 1 minuto, verificar 429)

7. **Comenta todo el código en español.**

8. **Mantener la funcionalidad existente** (editor de layout, SLP, simulación DES) intacta — solo envolver con auth + persistencia.
