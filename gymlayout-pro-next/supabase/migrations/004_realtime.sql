-- ===========================================
-- MIGRACIÓN 004: REALTIME
-- ===========================================

-- Habilitar Realtime en las tablas necesarias
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_floors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.floor_configurations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_collaborators;
