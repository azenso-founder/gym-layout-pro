// ==========================================
// Dashboard — Lista de proyectos del usuario
// ==========================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/lib/auth/hooks';
import { getPlanLimit } from '@/lib/billing/plans';
import MigrationBanner from '@/components/Dashboard/MigrationBanner';

interface Project {
  id: string;
  name: string;
  description: string;
  gym_name: string;
  thumbnail_url: string | null;
  version: number;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin}m`;
  if (diffHrs < 24) return `Hace ${diffHrs}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-CL');
}

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGym, setNewGym] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          gymName: newGym.trim(),
          initialFloors: [
            { name: 'Planta Baja' },
            { name: 'Planta Alta' },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/project/${data.projectId}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Error al crear proyecto');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      alert('Error al eliminar');
    }
  };

  const [seeding, setSeeding] = useState(false);

  const handleSeedData = async () => {
    if (!confirm('¿Importar todas las máquinas del Excel de FIREFIT Valdivia como proyecto?')) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Proyecto creado con ${data.summary.totalMachines} máquinas.\n• Planta Baja: ${data.summary.machinesBaja}\n• Planta Alta: ${data.summary.machinesAlta}`);
        router.push(`/project/${data.projectId}`);
        router.refresh();
      } else {
        alert(data.error || 'Error al importar datos');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setSeeding(false);
    }
  };

  const maxProjects = profile ? getPlanLimit(profile.plan, 'maxProjects') : 3;
  const canCreate = projects.length < maxProjects;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Migration banner — detecta localStorage y ofrece migrar */}
      <MigrationBanner />

      {/* Welcome card */}
      <div className="welcome-gradient rounded-2xl border border-zinc-800/50 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {profileLoading ? (
                <span className="skeleton inline-block w-48 h-7 rounded" />
              ) : (
                `Hola, ${profile?.displayName || 'Usuario'} 👋`
              )}
            </h1>
            <p className="text-sm text-zinc-500">
              {projects.length} proyecto{projects.length !== 1 ? 's' : ''} •{' '}
              {canCreate
                ? `${maxProjects - projects.length} disponible${maxProjects - projects.length !== 1 ? 's' : ''}`
                : 'Límite alcanzado'}
            </p>
          </div>

          <button
            onClick={() => canCreate ? setShowNewModal(true) : router.push('/upgrade')}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
              canCreate
                ? 'text-white btn-gradient'
                : 'text-zinc-500 bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            {canCreate ? '+ Nuevo proyecto' : '🔒 Upgrade para más'}
          </button>
        </div>

        {/* Quick stats */}
        {!loading && projects.length > 0 && (
          <div className="flex items-center gap-6 mt-5 pt-5 border-t border-zinc-800/50">
            <div>
              <div className="text-xl font-bold text-orange-400">{projects.length}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Proyectos</div>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <div className="text-xl font-bold text-zinc-300">{maxProjects}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Máximo</div>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <div className="text-xl font-bold text-zinc-300">
                {projects.length > 0 ? timeAgo(projects[0].updated_at) : '—'}
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Última edición</div>
            </div>
          </div>
        )}
      </div>

      {/* Project grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 rounded-xl skeleton" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 glass-card rounded-2xl">
          {/* Empty state SVG illustration */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20 flex items-center justify-center mb-5">
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="empty-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="36" height="36" rx="8" stroke="url(#empty-grad)" strokeWidth="2" fill="none" opacity="0.5"/>
              <line x1="14" y1="2" x2="14" y2="38" stroke="url(#empty-grad)" strokeWidth="1" opacity="0.3"/>
              <line x1="26" y1="2" x2="26" y2="38" stroke="url(#empty-grad)" strokeWidth="1" opacity="0.3"/>
              <line x1="2" y1="14" x2="38" y2="14" stroke="url(#empty-grad)" strokeWidth="1" opacity="0.3"/>
              <line x1="2" y1="26" x2="38" y2="26" stroke="url(#empty-grad)" strokeWidth="1" opacity="0.3"/>
              <path d="M14 20H26M20 14V26" stroke="url(#empty-grad)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Aún no tienes proyectos</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Crea tu primer proyecto de diseño de layout
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNewModal(true)}
              className="px-6 py-2.5 text-sm font-semibold text-white btn-gradient rounded-xl"
            >
              + Crear proyecto vacío
            </button>
            {profile?.plan === 'admin' && (
              <button
                onClick={handleSeedData}
                disabled={seeding}
                className="px-6 py-2.5 text-sm font-semibold text-orange-400 border border-orange-500/30 rounded-xl hover:bg-orange-500/10 transition-colors disabled:opacity-50"
              >
                {seeding ? '⏳ Importando...' : '📦 Importar datos FIREFIT'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project.id}
              className="project-card group relative bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden cursor-pointer"
              onClick={() => router.push(`/project/${project.id}`)}
            >
              {/* Thumbnail / placeholder */}
              <div className="h-36 bg-zinc-800/30 flex items-center justify-center relative overflow-hidden">
                {project.thumbnail_url ? (
                  <img
                    src={project.thumbnail_url}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-lg" />
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-20">
                      <rect x="2" y="2" width="36" height="36" rx="8" stroke="#f97316" strokeWidth="1.5" fill="none"/>
                      <line x1="14" y1="2" x2="14" y2="38" stroke="#f97316" strokeWidth="0.8" opacity="0.5"/>
                      <line x1="26" y1="2" x2="26" y2="38" stroke="#f97316" strokeWidth="0.8" opacity="0.5"/>
                      <line x1="2" y1="14" x2="38" y2="14" stroke="#f97316" strokeWidth="0.8" opacity="0.5"/>
                      <line x1="2" y1="26" x2="38" y2="26" stroke="#f97316" strokeWidth="0.8" opacity="0.5"/>
                    </svg>
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                  <span className="text-[11px] text-zinc-300 font-medium bg-zinc-900/80 px-3 py-1 rounded-full backdrop-blur-sm">
                    Abrir proyecto →
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-sm truncate group-hover:text-orange-400 transition-colors">
                  {project.name}
                </h3>
                {project.gym_name && (
                  <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                    {project.gym_name}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                      v{project.version}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {timeAgo(project.updated_at)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id, project.name);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-xs text-zinc-600 hover:text-red-400 transition-all p-1 rounded hover:bg-red-500/10"
                    title="Eliminar proyecto"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New project modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-semibold mb-1">Nuevo proyecto</h2>
            <p className="text-xs text-zinc-500 mb-5">Configura tu nuevo proyecto de layout</p>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label htmlFor="project-name" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Nombre del proyecto *
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Layout Planta Industrial Norte"
                  className="w-full px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="gym-name" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Nombre de la empresa
                </label>
                <input
                  id="gym-name"
                  type="text"
                  value={newGym}
                  onChange={(e) => setNewGym(e.target.value)}
                  placeholder="Ej: Acme Industries"
                  className="w-full px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="px-6 py-2.5 text-sm font-semibold text-white btn-gradient rounded-xl disabled:opacity-50"
                >
                  {creating ? 'Creando...' : 'Crear proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
