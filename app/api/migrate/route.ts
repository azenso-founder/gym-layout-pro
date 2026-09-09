// ==========================================
// API: Migración — Importa datos de localStorage al proyecto del usuario
// POST /api/migrate
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  let body: {
    projectName: string;
    gymName: string;
    machines: unknown[];
    zones: unknown[];
    floorRooms: unknown[];
    imageLayers: unknown[];
    customMeasures: unknown[];
    imgCalibrations: Record<string, unknown>;
    slpRelations: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  if (!body.projectName) {
    return NextResponse.json({ error: 'Nombre de proyecto requerido' }, { status: 400 });
  }

  try {
    // 1. Crear el proyecto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        owner_id: user.id,
        name: body.projectName,
        gym_name: body.gymName || '',
        global_config: {
          migratedFromLocalStorage: true,
          migratedAt: new Date().toISOString(),
          imgCalibrations: body.imgCalibrations || {},
          customMeasures: body.customMeasures || [],
          imageLayers: body.imageLayers || [],
        },
      })
      .select('id')
      .single();

    if (projectError || !project) {
      console.error('Error creating project:', projectError);
      return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 });
    }

    // 2. Separar máquinas por planta
    const machinesBaja = (body.machines || []).filter((m: any) => m.planta === 'baja');
    const machinesAlta = (body.machines || []).filter((m: any) => m.planta === 'alta');

    // Separar floorRooms por planta
    const roomsBaja = (body.floorRooms || []).filter((r: any) => r.planta === 'baja');
    const roomsAlta = (body.floorRooms || []).filter((r: any) => r.planta === 'alta');

    // 3. Crear Planta Baja
    const { data: floorBaja, error: floorBajaError } = await supabase
      .from('project_floors')
      .insert({
        project_id: project.id,
        name: 'Planta Baja',
        sort_order: 0,
        area_m2: 265,
        zones: roomsBaja,
        metadata: {
          imgCalibration: body.imgCalibrations?.baja || {},
        },
      })
      .select('id')
      .single();

    if (floorBajaError || !floorBaja) {
      console.error('Error creating floor baja:', floorBajaError);
      return NextResponse.json({ error: 'Error al crear planta baja' }, { status: 500 });
    }

    // 4. Crear configuración para Planta Baja con las máquinas
    const { error: configBajaError } = await supabase
      .from('floor_configurations')
      .insert({
        floor_id: floorBaja.id,
        project_id: project.id,
        name: 'Configuración A',
        sort_order: 0,
        is_active: true,
        layout_data: machinesBaja,
        guerchet_summary: calculateGuerchetSummary(machinesBaja),
      });

    if (configBajaError) {
      console.error('Error creating config baja:', configBajaError);
    }

    // 5. Crear Planta Alta
    const { data: floorAlta, error: floorAltaError } = await supabase
      .from('project_floors')
      .insert({
        project_id: project.id,
        name: 'Planta Alta',
        sort_order: 1,
        area_m2: 285,
        zones: roomsAlta,
        metadata: {
          imgCalibration: body.imgCalibrations?.alta || {},
        },
      })
      .select('id')
      .single();

    if (floorAltaError || !floorAlta) {
      console.error('Error creating floor alta:', floorAltaError);
      return NextResponse.json({ error: 'Error al crear planta alta' }, { status: 500 });
    }

    // 6. Crear configuración para Planta Alta con las máquinas
    const { error: configAltaError } = await supabase
      .from('floor_configurations')
      .insert({
        floor_id: floorAlta.id,
        project_id: project.id,
        name: 'Configuración A',
        sort_order: 0,
        is_active: true,
        layout_data: machinesAlta,
        guerchet_summary: calculateGuerchetSummary(machinesAlta),
      });

    if (configAltaError) {
      console.error('Error creating config alta:', configAltaError);
    }

    // 7. Guardar relaciones SLP en global_config
    if (body.slpRelations && Object.keys(body.slpRelations).length > 0) {
      await supabase
        .from('projects')
        .update({
          global_config: {
            migratedFromLocalStorage: true,
            migratedAt: new Date().toISOString(),
            imgCalibrations: body.imgCalibrations || {},
            customMeasures: body.customMeasures || [],
            imageLayers: body.imageLayers || [],
            slpRelations: body.slpRelations,
          },
        })
        .eq('id', project.id);
    }

    return NextResponse.json({
      success: true,
      projectId: project.id,
      summary: {
        machinesBaja: machinesBaja.length,
        machinesAlta: machinesAlta.length,
        roomsBaja: roomsBaja.length,
        roomsAlta: roomsAlta.length,
        slpRelations: Object.keys(body.slpRelations || {}).length,
      },
    });
  } catch (err) {
    console.error('Migration error:', err);
    return NextResponse.json({ error: 'Error durante la migración' }, { status: 500 });
  }
}

/** Calcula resumen Guerchet para un conjunto de máquinas */
function calculateGuerchetSummary(machines: any[]) {
  const placed = machines.filter((m: any) => m.placed);
  let totalSt = 0;
  let count = 0;

  for (const m of placed) {
    const Ss = (m.largo || 0) * (m.ancho || 0);
    const Sg = Ss * (m.N || 1);
    const Se = (m.K || 0.1) * (Ss + Sg);
    totalSt += Ss + Sg + Se;
    count++;
  }

  return {
    totalSt: Math.round(totalSt * 100) / 100,
    machineCount: count,
    calculatedAt: new Date().toISOString(),
  };
}
