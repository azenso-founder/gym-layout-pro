// ==========================================
// API: Seed — Crea proyecto inicial con las máquinas del Excel
// POST /api/seed
// Toma los datos de data/machines.ts y los inserta como proyecto
// ==========================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Datos del Excel — Planta Baja
const plantaBajaRaw = [
  { nombre: 'Hack Squat', n: 2, N: 1, largo: 2.232, ancho: 1.62, alto: 1.5, K: 0.15 },
  { nombre: 'Pendulum Squat', n: 2, N: 1, largo: 2.26, ancho: 1.341, alto: 1.5, K: 0.15 },
  { nombre: 'Extensión de cuádriceps + Leg curl dual', n: 1, N: 1, largo: 1.38, ancho: 1.065, alto: 1.3, K: 0.12 },
  { nombre: 'Extensión de gemelos parado', n: 1, N: 2, largo: 1.31, ancho: 1.26, alto: 1.5, K: 0.12 },
  { nombre: 'Extensión de gemelos sentado', n: 1, N: 1, largo: 1.485, ancho: 0.705, alto: 1.2, K: 0.12 },
  { nombre: 'Back Extension', n: 1, N: 1, largo: 1.465, ancho: 0.475, alto: 1.0, K: 0.15 },
  { nombre: 'Banca Ajustable + Abdomen', n: 3, N: 1, largo: 1.62, ancho: 0.76, alto: 1.0, K: 0.10 },
  { nombre: 'Poleas', n: 4, N: 1, largo: 1.993, ancho: 1.03, alto: 2.2, K: 0.15 },
  { nombre: 'Smith Machine', n: 2, N: 2, largo: 2.11, ancho: 2.19, alto: 2.2, K: 0.15 },
  { nombre: 'Smith Power Rack', n: 2, N: 3, largo: 1.96, ancho: 1.535, alto: 2.2, K: 0.12 },
  { nombre: 'Rack', n: 2, N: 3, largo: 1.54, ancho: 1.72, alto: 2.0, K: 0.12 },
  { nombre: 'Prensa 45°', n: 2, N: 2, largo: 2.15, ancho: 1.62, alto: 1.5, K: 0.12 },
  { nombre: 'Aducción + Abducción', n: 1, N: 1, largo: 1.47, ancho: 1.4, alto: 1.5, K: 0.10 },
  { nombre: 'Super Squat Machine', n: 1, N: 2, largo: 1.96, ancho: 1.62, alto: 1.5, K: 0.10 },
  { nombre: 'Belt Squat', n: 1, N: 2, largo: 2.032, ancho: 1.412, alto: 1.5, K: 0.10 },
  { nombre: 'Bulgara', n: 1, N: 1, largo: 0.69, ancho: 0.69, alto: 1.0, K: 0.05 },
  { nombre: 'Hip Thrust Machine', n: 2, N: 1, largo: 1.955, ancho: 1.85, alto: 1.0, K: 0.10 },
  { nombre: 'Trotadora', n: 3, N: 1, largo: 2.1, ancho: 1.0, alto: 1.5, K: 0.08 },
  { nombre: 'Escaladora', n: 3, N: 1, largo: 1.35, ancho: 0.85, alto: 2.0, K: 0.08 },
  { nombre: 'Bicicleta', n: 3, N: 1, largo: 1.41, ancho: 0.56, alto: 1.2, K: 0.08 },
  { nombre: 'Leg Curl Acostado', n: 1, N: 1, largo: 1.94, ancho: 1.17, alto: 1.3, K: 0.08 },
  { nombre: 'Extensión de Cuádriceps con disco', n: 2, N: 1, largo: 1.48, ancho: 1.22, alto: 1.2, K: 0.08 },
  { nombre: 'Leg Curl Sentado', n: 1, N: 1, largo: 1.94, ancho: 1.17, alto: 1.3, K: 0.08 },
];

// Datos del Excel — Planta Alta
const plantaAltaRaw = [
  { nombre: 'Dumbbell Rack', n: 8, N: 1, largo: 2.12, ancho: 0.595, alto: 1.2, K: 0.15 },
  { nombre: 'Press Banca Inclinado', n: 1, N: 2, largo: 1.91, ancho: 1.695, alto: 1.2, K: 0.10 },
  { nombre: 'Press Banca Plano', n: 1, N: 2, largo: 1.926, ancho: 1.65, alto: 1.0, K: 0.10 },
  { nombre: 'Banca', n: 7, N: 1, largo: 1.29, ancho: 0.68, alto: 0.5, K: 0.10 },
  { nombre: 'Preacher Curl', n: 1, N: 1, largo: 1.3, ancho: 0.84, alto: 1.0, K: 0.10 },
  { nombre: 'Smith Machine', n: 1, N: 3, largo: 2.11, ancho: 2.19, alto: 2.2, K: 0.10 },
  { nombre: 'Dips y Abdomen Vertical', n: 1, N: 1, largo: 1.195, ancho: 0.77, alto: 1.8, K: 0.05 },
  { nombre: 'Remo en T', n: 2, N: 1, largo: 1.785, ancho: 0.85, alto: 1.2, K: 0.05 },
  { nombre: 'Multi Estación (8 estaciones)', n: 1, N: 4, largo: 5.78, ancho: 3.42, alto: 2.2, K: 0.10 },
  { nombre: 'Multi Estación (4 estaciones)', n: 1, N: 3, largo: 3.75, ancho: 1.635, alto: 2.2, K: 0.10 },
  { nombre: 'Seated Row', n: 1, N: 1, largo: 1.5, ancho: 1.42, alto: 1.5, K: 0.10 },
  { nombre: 'Iso Lateral High Row', n: 1, N: 2, largo: 2.11, ancho: 1.12, alto: 1.8, K: 0.10 },
  { nombre: 'Lat Pulldown con disco', n: 1, N: 1, largo: 2.09, ancho: 0.82, alto: 2.0, K: 0.10 },
  { nombre: 'Preacher Curl Disco', n: 1, N: 1, largo: 1.2, ancho: 1.22, alto: 1.0, K: 0.10 },
  { nombre: 'Tríceps Extension con Disco', n: 1, N: 2, largo: 1.17, ancho: 1.17, alto: 1.5, K: 0.10 },
  { nombre: 'Flat Bench Press con Discos', n: 1, N: 2, largo: 1.5, ancho: 2.25, alto: 1.2, K: 0.10 },
  { nombre: 'Incline Bench Press con Discos', n: 1, N: 2, largo: 2.35, ancho: 1.5, alto: 1.2, K: 0.10 },
  { nombre: 'Seated Chest Press', n: 1, N: 1, largo: 2.0, ancho: 1.5, alto: 1.8, K: 0.10 },
  { nombre: 'Seated Shoulder Press', n: 1, N: 1, largo: 2.25, ancho: 1.65, alto: 1.5, K: 0.10 },
];

const PIXELS_PER_METER = 50;
const m2px = (m: number) => m * PIXELS_PER_METER;

function inferCategoria(nombre: string) {
  const n = nombre.toLowerCase();
  if (/trotadora|escaladora|bicicleta|cardio|elíptic/.test(n)) return 'cardio';
  if (/hack|squat|prensa|pierna|cuádricep|gemelo|leg|adduc|hip thrust|belt squat|bulgara|pendulum/.test(n)) return 'piernas';
  if (/press banca|banca|preacher|curl|pecho|hombro|chest|shoulder|incline bench|flat bench/.test(n)) return 'tren_superior';
  if (/rack|smith|power/.test(n)) return 'racks';
  if (/polea|cable|pulldown|row|remo|lat|seated row|high row|multi.*estac/.test(n)) return 'poleas';
  if (/back extension|dips|abdomen|accesori|funcional|triceps extension/.test(n)) return 'accesorios';
  if (/dumbb|mancuerna/.test(n)) return 'racks';
  return 'accesorios';
}

function tiemposPorCategoria(nombre: string) {
  const n = nombre.toLowerCase();
  if (/trotadora|bicicleta|escaladora|elíptic/.test(n)) return { min: 15, moda: 25, max: 45 };
  if (/hack|prensa|smith|pendulum|super squat/.test(n)) return { min: 8, moda: 12, max: 18 };
  if (/extensión.*cuádricep|leg curl|gemelo|adduc/.test(n)) return { min: 4, moda: 6, max: 10 };
  if (/press banca|flat bench|incline bench/.test(n)) return { min: 6, moda: 10, max: 15 };
  if (/polea|pulldown|row|remo|lat|high row|seated row|multi.*estac|seated.*press|chest.*press|shoulder/.test(n)) return { min: 4, moda: 7, max: 10 };
  if (/back extension|dips|abdomen|bulgara|preacher|curl|triceps/.test(n)) return { min: 3, moda: 5, max: 8 };
  if (/hip thrust|belt squat|banca ajustable/.test(n)) return { min: 6, moda: 10, max: 15 };
  return { min: 4, moda: 7, max: 10 };
}

function generateMachineInstances(rawList: typeof plantaBajaRaw, planta: 'baja' | 'alta') {
  const machines: any[] = [];
  const gap = m2px(0.5);
  const startX = m2px(1);
  const startY = m2px(1.5);
  let cursorX = startX;
  let cursorY = startY;
  let rowMaxH = 0;
  const maxWidth = m2px(20);

  for (const raw of rawList) {
    for (let i = 0; i < raw.n; i++) {
      const mw = m2px(raw.largo);
      const mh = m2px(raw.ancho);

      if (cursorX + mw > maxWidth && cursorX > startX) {
        cursorX = startX;
        cursorY += rowMaxH + gap;
        rowMaxH = 0;
      }

      const x = cursorX + mw / 2;
      const y = cursorY + mh / 2;
      cursorX += mw + gap;
      rowMaxH = Math.max(rowMaxH, mh);

      const id = crypto.randomUUID();
      machines.push({
        id,
        templateId: `${raw.nombre.toLowerCase().replace(/\s+/g, '-')}-${planta}`,
        nombre: raw.n > 1 ? `${raw.nombre} #${i + 1}` : raw.nombre,
        categoria: inferCategoria(raw.nombre),
        largo: raw.largo,
        ancho: raw.ancho,
        alto: raw.alto,
        N: raw.N,
        K: raw.K,
        x,
        y,
        rotation: 0,
        planta,
        locked: false,
        placed: true,
        tiempoServicio: tiemposPorCategoria(raw.nombre),
        capacidad: 1,
      });
    }
  }
  return machines;
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Verificar que sea admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  if (profile?.plan !== 'admin') {
    return NextResponse.json({ error: 'Solo admin puede hacer seed' }, { status: 403 });
  }

  // Verificar que no haya proyectos ya (evitar duplicados)
  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({
      error: 'Ya tienes proyectos creados. Elimínalos primero si quieres hacer seed nuevamente.',
      existingCount: existing.length,
    }, { status: 409 });
  }

  try {
    // Generar máquinas
    const machinesBaja = generateMachineInstances(plantaBajaRaw, 'baja');
    const machinesAlta = generateMachineInstances(plantaAltaRaw, 'alta');

    // 1. Crear proyecto
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .insert({
        owner_id: user.id,
        name: 'FIREFIT Valdivia',
        gym_name: 'FIREFIT Valdivia',
        description: 'Proyecto principal — Layout gimnasio Firefit Valdivia. Datos importados del Excel de superficies.',
        global_config: {
          seededAt: new Date().toISOString(),
          imgCalibrations: {
            baja: { imgWidth: 21.2, imgHeight: 30, offsetX: 0, offsetY: 0 },
            alta: { imgWidth: 21.2, imgHeight: 30, offsetX: 0, offsetY: 0 },
          },
        },
      })
      .select('id')
      .single();

    if (projErr || !project) {
      console.error('Seed: error creating project', projErr);
      return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 });
    }

    // 2. Crear Planta Baja
    const { data: floorBaja } = await supabase
      .from('project_floors')
      .insert({
        project_id: project.id,
        name: 'Planta Baja',
        sort_order: 0,
        area_m2: 265,
      })
      .select('id')
      .single();

    if (floorBaja) {
      await supabase.from('floor_configurations').insert({
        floor_id: floorBaja.id,
        project_id: project.id,
        name: 'Configuración A',
        sort_order: 0,
        is_active: true,
        layout_data: machinesBaja,
        guerchet_summary: {
          totalMachines: machinesBaja.length,
          calculatedAt: new Date().toISOString(),
        },
      });
    }

    // 3. Crear Planta Alta
    const { data: floorAlta } = await supabase
      .from('project_floors')
      .insert({
        project_id: project.id,
        name: 'Planta Alta',
        sort_order: 1,
        area_m2: 285,
      })
      .select('id')
      .single();

    if (floorAlta) {
      await supabase.from('floor_configurations').insert({
        floor_id: floorAlta.id,
        project_id: project.id,
        name: 'Configuración A',
        sort_order: 0,
        is_active: true,
        layout_data: machinesAlta,
        guerchet_summary: {
          totalMachines: machinesAlta.length,
          calculatedAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      projectId: project.id,
      summary: {
        machinesBaja: machinesBaja.length,
        machinesAlta: machinesAlta.length,
        totalMachines: machinesBaja.length + machinesAlta.length,
      },
    });
  } catch (err) {
    console.error('Seed error:', err);
    return NextResponse.json({ error: 'Error durante el seed' }, { status: 500 });
  }
}
