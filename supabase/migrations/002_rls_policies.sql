-- ===========================================
-- MIGRACIÓN 002: POLÍTICAS RLS
-- ===========================================

-- ───────────────── PROFILES ─────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ───────────────── PROJECTS ─────────────────
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    owner_id = auth.uid()
    OR is_public = TRUE
    OR id IN (
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND role = 'editor' AND accepted_at IS NOT NULL
    )
  );

CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE USING (owner_id = auth.uid());

-- ───────────────── COLLABORATORS ─────────────────
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collaborators_select" ON public.project_collaborators
  FOR SELECT USING (
    user_id = auth.uid()
    OR project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

CREATE POLICY "collaborators_insert" ON public.project_collaborators
  FOR INSERT WITH CHECK (
    invited_by = auth.uid()
    AND project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

CREATE POLICY "collaborators_update" ON public.project_collaborators
  FOR UPDATE USING (
    user_id = auth.uid()
    OR project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

CREATE POLICY "collaborators_delete" ON public.project_collaborators
  FOR DELETE USING (
    user_id = auth.uid()
    OR project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

-- ───────────────── PROJECT FLOORS ─────────────────
ALTER TABLE public.project_floors ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "snapshots_select" ON public.project_snapshots
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

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

CREATE POLICY "presence_select" ON public.project_presence
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM public.project_collaborators
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

CREATE POLICY "presence_upsert" ON public.project_presence
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "presence_update" ON public.project_presence
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "presence_delete" ON public.project_presence
  FOR DELETE USING (user_id = auth.uid());

-- ───────────────── AUDIT LOG ─────────────────
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_select_own" ON public.audit_log
  FOR SELECT USING (user_id = auth.uid());
