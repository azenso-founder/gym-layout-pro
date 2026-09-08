// ==========================================
// API: Proyectos — GET (listar) + POST (crear)
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProjectSchema } from '@/lib/security/validate';
import { rateLimit } from '@/lib/security/rateLimit';

// GET /api/projects — Listar proyectos del usuario
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // RLS se encarga de filtrar — el usuario solo ve los suyos + colaboraciones
  const { data, error } = await supabase
    .from('projects')
    .select(
      `id, name, description, gym_name, thumbnail_url,
       version, is_template, created_at, updated_at,
       owner:profiles!owner_id(id, display_name, avatar_url)`
    )
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Error al obtener proyectos' }, { status: 500 });
  }

  return NextResponse.json({ projects: data });
}

// POST /api/projects — Crear proyecto
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Rate limiting
  const { allowed, retryAfter } = rateLimit(`${user.id}:create_project`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  // Parsear y validar body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verificar límite de proyectos
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, projects_count')
    .eq('id', user.id)
    .single();

  if (profile) {
    const maxProjects = profile.plan === 'free' ? 3 : 999999;
    if (profile.projects_count >= maxProjects) {
      return NextResponse.json(
        { error: 'Límite de proyectos alcanzado. Actualiza a Pro.', code: 'PLAN_LIMIT' },
        { status: 403 }
      );
    }
  }

  // Crear proyecto
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      gym_name: parsed.data.gymName,
      global_config: {},
    })
    .select('id')
    .single();

  if (projectError) {
    console.error('Error creating project:', projectError);
    return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 });
  }

  // Crear pisos iniciales con configuración default
  for (let i = 0; i < parsed.data.initialFloors.length; i++) {
    const floor = parsed.data.initialFloors[i];
    const { data: floorData } = await supabase
      .from('project_floors')
      .insert({
        project_id: project.id,
        name: floor.name,
        area_m2: floor.areaM2 || null,
        sort_order: i,
      })
      .select('id')
      .single();

    if (floorData) {
      // Crear configuración default "Configuración A" para cada piso
      await supabase.from('floor_configurations').insert({
        floor_id: floorData.id,
        project_id: project.id,
        name: 'Configuración A',
        sort_order: 0,
        is_active: true,
        layout_data: [],
      });
    }
  }

  return NextResponse.json({ projectId: project.id }, { status: 201 });
}
