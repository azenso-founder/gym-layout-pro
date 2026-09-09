-- ===========================================
-- MIGRACIÓN CONSOLIDADA: SCHEMA + RLS + REALTIME
-- GymLayout Pro SaaS — Supabase PostgreSQL
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ===========================================

-- ═══════════════════════════════════════════
-- PARTE 1: SCHEMA INICIAL
-- ═══════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ───────────────── PROFILES ─────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'admin')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_expires_at TIMESTAMPTZ,
  projects_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ───────────────── PROJECTS ─────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Proyecto sin título',
  description TEXT DEFAULT '',
  thumbnail_url TEXT,
  gym_name TEXT DEFAULT '',
  global_config JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  version INTEGER NOT NULL DEFAULT 1,
  last_edited_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_template ON public.projects(is_template) WHERE is_template = TRUE;
CREATE INDEX IF NOT EXISTS idx_projects_public ON public.projects(is_public) WHERE is_public = TRUE;

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

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

DROP TRIGGER IF EXISTS projects_count_trigger ON public.projects;
CREATE TRIGGER projects_count_trigger
  AFTER INSERT OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_projects_count();

-- ───────────────── PROJECT FLOORS ─────────────────
CREATE TABLE IF NOT EXISTS public.project_floors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Piso 1',
  sort_order INTEGER NOT NULL DEFAULT 0,
  area_m2 NUMERIC(10,2),
  floor_plan_url TEXT,
  scale_config JSONB,
  perimeter JSONB,
  zones JSONB DEFAULT '[]'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_floors_project ON public.project_floors(project_id);
CREATE INDEX IF NOT EXISTS idx_floors_sort ON public.project_floors(project_id, sort_order);

DROP TRIGGER IF EXISTS floors_updated_at ON public.project_floors;
CREATE TRIGGER floors_updated_at
  BEFORE UPDATE ON public.project_floors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ───────────────── FLOOR CONFIGURATIONS ─────────────────
CREATE TABLE IF NOT EXISTS public.floor_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_id UUID NOT NULL REFERENCES public.project_floors(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Configuración A',
  sort_order INTEGER NOT NULL DEFAULT 0,
  color_tag TEXT DEFAULT '#4CAF50',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  layout_data JSONB NOT NULL DEFAULT '[]'::JSONB,
  guerchet_summary JSONB DEFAULT '{}'::JSONB,
  slp_score NUMERIC(5,2),
  simulation_results JSONB DEFAULT '{}'::JSONB,
  notes TEXT DEFAULT '',
  created_from UUID REFERENCES public.floor_configurations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_configs_floor ON public.floor_configurations(floor_id);
CREATE INDEX IF NOT EXISTS idx_configs_project ON public.floor_configurations(project_id);
CREATE INDEX IF NOT EXISTS idx_configs_active ON public.floor_configurations(floor_id, is_active) WHERE is_active = TRUE;

DROP TRIGGER IF EXISTS configs_updated_at ON public.floor_configurations;
CREATE TRIGGER configs_updated_at
  BEFORE UPDATE ON public.floor_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

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

DROP TRIGGER IF EXISTS single_active_config ON public.floor_configurations;
CREATE TRIGGER single_active_config
  BEFORE INSERT OR UPDATE OF is_active ON public.floor_configurations
  FOR EACH ROW WHEN (NEW.is_active = TRUE)
  EXECUTE FUNCTION public.ensure_single_active_config();

-- ───────────────── PROJECT COLLABORATORS ─────────────────
CREATE TABLE IF NOT EXISTS public.project_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_collaborators_project ON public.project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON public.project_collaborators(user_id);

-- ───────────────── MACHINE LIBRARY ─────────────────
CREATE TABLE IF NOT EXISTS public.machine_library (
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
  default_quantity INTEGER NOT NULL DEFAULT 1 CHECK (default_quantity >= 1 AND default_quantity <= 20),
  default_sides INTEGER NOT NULL DEFAULT 1 CHECK (default_sides >= 1 AND default_sides <= 8),
  default_k NUMERIC(4,3) NOT NULL DEFAULT 0.10 CHECK (default_k > 0 AND default_k <= 1),
  service_time_min NUMERIC(6,2) DEFAULT 3,
  service_time_mode NUMERIC(6,2) DEFAULT 5,
  service_time_max NUMERIC(6,2) DEFAULT 8,
  capacity INTEGER DEFAULT 1 CHECK (capacity >= 1),
  custom_shape JSONB,
  color TEXT DEFAULT '#4CAF50',
  is_global BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machines_owner ON public.machine_library(owner_id);
CREATE INDEX IF NOT EXISTS idx_machines_global ON public.machine_library(is_global) WHERE is_global = TRUE;

-- ───────────────── PROJECT SNAPSHOTS ─────────────────
CREATE TABLE IF NOT EXISTS public.project_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_project ON public.project_snapshots(project_id);

-- ───────────────── PROJECT PRESENCE ─────────────────
CREATE TABLE IF NOT EXISTS public.project_presence (
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

CREATE OR REPLACE FUNCTION public.cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM public.project_presence WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────── AUDIT LOG ─────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_log(created_at DESC);


-- ═══════════════════════════════════════════
-- PARTE 2: POLÍTICAS RLS
-- ═══════════════════════════════════════════

-- ───────────────── PROFILES ─────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
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

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ───────────────── PROJECTS ─────────────────
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    owner_id = auth.uid()
    OR is_public = TRUE
    OR id IN (
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND role = 'editor' AND accepted_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE USING (owner_id = auth.uid());

-- ───────────────── COLLABORATORS ─────────────────
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "collaborators_select" ON public.project_collaborators;
CREATE POLICY "collaborators_select" ON public.project_collaborators
  FOR SELECT USING (
    user_id = auth.uid()
    OR project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "collaborators_insert" ON public.project_collaborators;
CREATE POLICY "collaborators_insert" ON public.project_collaborators
  FOR INSERT WITH CHECK (
    invited_by = auth.uid()
    AND project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "collaborators_update" ON public.project_collaborators;
CREATE POLICY "collaborators_update" ON public.project_collaborators
  FOR UPDATE USING (
    user_id = auth.uid()
    OR project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "collaborators_delete" ON public.project_collaborators;
CREATE POLICY "collaborators_delete" ON public.project_collaborators
  FOR DELETE USING (
    user_id = auth.uid()
    OR project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

-- ───────────────── PROJECT FLOORS ─────────────────
ALTER TABLE public.project_floors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "floors_select" ON public.project_floors;
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

DROP POLICY IF EXISTS "floors_insert" ON public.project_floors;
CREATE POLICY "floors_insert" ON public.project_floors
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "floors_update" ON public.project_floors;
CREATE POLICY "floors_update" ON public.project_floors
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND role = 'editor' AND accepted_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "floors_delete" ON public.project_floors;
CREATE POLICY "floors_delete" ON public.project_floors
  FOR DELETE USING (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

-- ───────────────── FLOOR CONFIGURATIONS ─────────────────
ALTER TABLE public.floor_configurations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "configs_select" ON public.floor_configurations;
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

DROP POLICY IF EXISTS "configs_insert" ON public.floor_configurations;
CREATE POLICY "configs_insert" ON public.floor_configurations
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND role = 'editor' AND accepted_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "configs_update" ON public.floor_configurations;
CREATE POLICY "configs_update" ON public.floor_configurations
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND role = 'editor' AND accepted_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "configs_delete" ON public.floor_configurations;
CREATE POLICY "configs_delete" ON public.floor_configurations
  FOR DELETE USING (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

-- ───────────────── MACHINE LIBRARY ─────────────────
ALTER TABLE public.machine_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "machines_select" ON public.machine_library;
CREATE POLICY "machines_select" ON public.machine_library
  FOR SELECT USING (owner_id = auth.uid() OR is_global = TRUE);

DROP POLICY IF EXISTS "machines_insert" ON public.machine_library;
CREATE POLICY "machines_insert" ON public.machine_library
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "machines_update" ON public.machine_library;
CREATE POLICY "machines_update" ON public.machine_library
  FOR UPDATE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "machines_delete" ON public.machine_library;
CREATE POLICY "machines_delete" ON public.machine_library
  FOR DELETE USING (owner_id = auth.uid());

-- ───────────────── SNAPSHOTS ─────────────────
ALTER TABLE public.project_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "snapshots_select" ON public.project_snapshots;
CREATE POLICY "snapshots_select" ON public.project_snapshots
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "snapshots_insert" ON public.project_snapshots;
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

DROP POLICY IF EXISTS "presence_select" ON public.project_presence;
CREATE POLICY "presence_select" ON public.project_presence
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "presence_upsert" ON public.project_presence;
CREATE POLICY "presence_upsert" ON public.project_presence
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "presence_update" ON public.project_presence;
CREATE POLICY "presence_update" ON public.project_presence
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "presence_delete" ON public.project_presence;
CREATE POLICY "presence_delete" ON public.project_presence
  FOR DELETE USING (user_id = auth.uid());

-- ───────────────── AUDIT LOG ─────────────────
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_select_own" ON public.audit_log;
CREATE POLICY "audit_select_own" ON public.audit_log
  FOR SELECT USING (user_id = auth.uid());


-- ═══════════════════════════════════════════
-- PARTE 3: REALTIME
-- ═══════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_floors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.floor_configurations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_collaborators;
