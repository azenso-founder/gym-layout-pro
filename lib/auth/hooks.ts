// ==========================================
// Auth Hooks — useUser, useSession, useRequireAuth
// ==========================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

/** Obtener el usuario actual (reactivo) */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Obtener usuario actual
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Escuchar cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { user, loading };
}

/** Obtener la sesión actual (reactiva) */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { session, loading };
}

/** Requiere autenticación — redirige a login si no hay sesión */
export function useRequireAuth() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  return { user, loading };
}

/** Perfil extendido del usuario (desde la tabla profiles) */
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  plan: 'free' | 'pro' | 'admin';
  projectsCount: number;
  createdAt: string;
}

/** Obtener el perfil completo del usuario (incluye plan, etc.) */
export function useProfile() {
  const { user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, avatar_url, plan, projects_count, created_at')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setProfile({
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        plan: data.plan,
        projectsCount: data.projects_count,
        createdAt: data.created_at,
      });
    }
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (!userLoading) {
      fetchProfile();
    }
  }, [userLoading, fetchProfile]);

  return { profile, loading: userLoading || loading, refetch: fetchProfile };
}
