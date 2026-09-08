// ==========================================
// Supabase — Cliente admin (service_role)
// SOLO para server-side — bypassa RLS
// NUNCA importar desde código del cliente
// ==========================================

import { createClient } from '@supabase/supabase-js';

// Este cliente bypassa RLS — usar con extrema precaución
// Solo para webhooks de Stripe, audit logs, y operaciones admin
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
