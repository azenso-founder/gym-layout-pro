// ==========================================
// API: Promover usuario a admin (solo con service_role)
// POST /api/admin/promote
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // Verificar que el request viene con la service role key como header secreto
  const authHeader = request.headers.get('x-admin-key');
  if (authHeader !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Promover a admin usando service role
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ plan: 'admin' })
    .eq('id', user.id);

  if (error) {
    console.error('Error promoting user:', error);
    return NextResponse.json({ error: 'Error al promover usuario' }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId: user.id, plan: 'admin' });
}
