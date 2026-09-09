// ==========================================
// API: Proyecto específico — GET/PUT/DELETE
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateProjectSchema } from '@/lib/security/validate';
import { rateLimit } from '@/lib/security/rateLimit';

// GET /api/projects/[id] — Obtener proyecto con pisos y configuraciones
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // RLS filtra automáticamente
  const { data: project, error } = await supabase
    .from('projects')
    .select(
      `*, 
       floors:project_floors(
         id, name, sort_order, area_m2, floor_plan_url, scale_config, perimeter, zones, metadata,
         configurations:floor_configurations(
           id, name, sort_order, color_tag, is_active, is_locked, 
           layout_data, guerchet_summary, slp_score, simulation_results, notes
         )
       ),
       owner:profiles!owner_id(id, display_name, avatar_url, email)`
    )
    .eq('id', id)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ project });
}

// PUT /api/projects/[id] — Actualizar proyecto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Rate limiting
  const { allowed } = rateLimit(`${user.id}:update_project`, 60, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Construir updates dinámicamente (solo campos enviados)
  const updates: Record<string, unknown> = {
    last_edited_by: user.id,
    version: undefined, // Se incrementará abajo
  };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.gymName !== undefined) updates.gym_name = parsed.data.gymName;
  if (parsed.data.globalConfig !== undefined) updates.global_config = parsed.data.globalConfig;

  // Incrementar versión
  const { data: current } = await supabase
    .from('projects')
    .select('version')
    .eq('id', id)
    .single();

  if (current) {
    updates.version = current.version + 1;
  }

  // RLS verifica permisos automáticamente
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Error al actualizar proyecto' }, { status: 500 });
  }

  return NextResponse.json({ success: true, version: updates.version });
}

// DELETE /api/projects/[id] — Eliminar proyecto
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // RLS solo permite al owner eliminar
  const { error } = await supabase.from('projects').delete().eq('id', id);

  if (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Error al eliminar proyecto' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
