-- ===========================================
-- FIX: Eliminar recursión infinita en políticas RLS
-- Ejecutar en Supabase SQL Editor
-- ===========================================

-- 1. Simplificar profiles: solo ver tu propio perfil
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- 2. Simplificar collaborators: no referenciar projects
DROP POLICY IF EXISTS "collaborators_select" ON public.project_collaborators;
CREATE POLICY "collaborators_select" ON public.project_collaborators
  FOR SELECT USING (
    user_id = auth.uid()
    OR invited_by = auth.uid()
  );

-- 3. Simplificar collaborators insert: solo verificar invited_by
DROP POLICY IF EXISTS "collaborators_insert" ON public.project_collaborators;
CREATE POLICY "collaborators_insert" ON public.project_collaborators
  FOR INSERT WITH CHECK (invited_by = auth.uid());

-- 4. Simplificar collaborators update/delete
DROP POLICY IF EXISTS "collaborators_update" ON public.project_collaborators;
CREATE POLICY "collaborators_update" ON public.project_collaborators
  FOR UPDATE USING (user_id = auth.uid() OR invited_by = auth.uid());

DROP POLICY IF EXISTS "collaborators_delete" ON public.project_collaborators;
CREATE POLICY "collaborators_delete" ON public.project_collaborators
  FOR DELETE USING (user_id = auth.uid() OR invited_by = auth.uid());

-- 5. Projects select: usar función SECURITY DEFINER para romper la recursión
CREATE OR REPLACE FUNCTION public.user_project_ids(uid UUID)
RETURNS SETOF UUID AS $$
  SELECT project_id FROM public.project_collaborators
  WHERE user_id = uid AND accepted_at IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    owner_id = auth.uid()
    OR is_public = TRUE
    OR id IN (SELECT public.user_project_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND role = 'editor' AND accepted_at IS NOT NULL
    )
  );

-- 6. Floors: usar función para evitar recursión
CREATE OR REPLACE FUNCTION public.user_accessible_project_ids(uid UUID)
RETURNS SETOF UUID AS $$
  SELECT id FROM public.projects WHERE owner_id = uid
  UNION
  SELECT project_id FROM public.project_collaborators
  WHERE user_id = uid AND accepted_at IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "floors_select" ON public.project_floors;
CREATE POLICY "floors_select" ON public.project_floors
  FOR SELECT USING (
    project_id IN (SELECT public.user_accessible_project_ids(auth.uid()))
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
    project_id IN (SELECT public.user_accessible_project_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "floors_delete" ON public.project_floors;
CREATE POLICY "floors_delete" ON public.project_floors
  FOR DELETE USING (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

-- 7. Configs: usar la misma función
DROP POLICY IF EXISTS "configs_select" ON public.floor_configurations;
CREATE POLICY "configs_select" ON public.floor_configurations
  FOR SELECT USING (
    project_id IN (SELECT public.user_accessible_project_ids(auth.uid()))
    OR project_id IN (SELECT id FROM public.projects WHERE is_public = TRUE)
  );

DROP POLICY IF EXISTS "configs_insert" ON public.floor_configurations;
CREATE POLICY "configs_insert" ON public.floor_configurations
  FOR INSERT WITH CHECK (
    project_id IN (SELECT public.user_accessible_project_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "configs_update" ON public.floor_configurations;
CREATE POLICY "configs_update" ON public.floor_configurations
  FOR UPDATE USING (
    project_id IN (SELECT public.user_accessible_project_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "configs_delete" ON public.floor_configurations;
CREATE POLICY "configs_delete" ON public.floor_configurations
  FOR DELETE USING (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

-- 8. Snapshots
DROP POLICY IF EXISTS "snapshots_select" ON public.project_snapshots;
CREATE POLICY "snapshots_select" ON public.project_snapshots
  FOR SELECT USING (
    project_id IN (SELECT public.user_accessible_project_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "snapshots_insert" ON public.project_snapshots;
CREATE POLICY "snapshots_insert" ON public.project_snapshots
  FOR INSERT WITH CHECK (
    project_id IN (SELECT public.user_accessible_project_ids(auth.uid()))
  );

-- 9. Presence
DROP POLICY IF EXISTS "presence_select" ON public.project_presence;
CREATE POLICY "presence_select" ON public.project_presence
  FOR SELECT USING (
    project_id IN (SELECT public.user_accessible_project_ids(auth.uid()))
  );
