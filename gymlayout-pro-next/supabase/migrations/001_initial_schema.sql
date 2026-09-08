-- ===========================================
-- MIGRACIÓN 001: ESQUEMA INICIAL
-- GymLayout Pro SaaS — Supabase PostgreSQL
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
  projects_count INTEGER NOT NULL DEFAULT 0,
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
  gym_name TEXT DEFAULT '',
  global_config JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
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
-- ───────────────────────────────────────────
CREATE TABLE public.project_floors (
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

CREATE INDEX idx_floors_project ON public.project_floors(project_id);
CREATE INDEX idx_floors_sort ON public.project_floors(project_id, sort_order);

CREATE TRIGGER floors_updated_at
  BEFORE UPDATE ON public.project_floors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ───────────────────────────────────────────
-- TABLA: floor_configurations (variantes de layout por piso)
-- ───────────────────────────────────────────
CREATE TABLE public.floor_configurations (
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
-- TABLA: project_collaborators
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
-- TABLA: machine_library (biblioteca personal)
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
  service_time_min NUMERIC(6,2) DEFAULT 3,
  service_time_mode NUMERIC(6,2) DEFAULT 5,
  service_time_max NUMERIC(6,2) DEFAULT 8,
  capacity INTEGER DEFAULT 1 CHECK (capacity >= 1),
  custom_shape JSONB,
  color TEXT DEFAULT '#4CAF50',
  is_global BOOLEAN NOT NULL DEFAULT FALSE,
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
-- TABLA: audit_log (registro de acciones)
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
