// ==========================================
// Dashboard — Lista de proyectos del usuario
// ==========================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/lib/auth/hooks';
import { getPlanLimit } from '@/lib/billing/plans';

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

  const maxProjects = profile ? getPlanLimit(profile.plan, 'maxProjects') : 3;
  const canCreate = projects.length < maxProjects;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            {profileLoading ? (
              <span className="skeleton inline-block w-48 h-7 rounded" />
            ) : (
              `Hola, ${profile?.displayName || 'Usuario'} 👋`
            )}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {projects.length} proyecto{projects.length !== 1 ? 's' : ''} •{' '}
            {canCreate
              ? `${maxProjects - projects.length} disponible${maxProjects - projects.length !== 1 ? 's' : ''}`
              : 'Límite alcanzado'}
          </p>
        </div>

        <button
          onClick={() => canCreate ? setShowNewModal(true) : router.push('/upgrade')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            canCreate
              ? 'text-white btn-gradient'
              : 'text-zinc-500 bg-zinc-800 hover:bg-zinc-700'
          }`}
        >
          {canCreate ? '+ Nuevo proyecto' : '🔒 Upgrade para más'}
        </button>
      </div>

      {/* Project grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl skeleton" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="text-5xl mb-4">🏗️</span>
          <h2 className="text-lg font-semibold mb-2">Aún no tienes proyectos</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Crea tu primer proyecto de diseño de gimnasio
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-6 py-2.5 text-sm font-semibold text-white btn-gradient rounded-lg"
          >
            + Crear primer proyecto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="project-card group relative bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden cursor-pointer hover:border-zinc-700"
              onClick={() => router.push(`/project/${project.id}`)}
            >
              {/* Thumbnail / placeholder */}
              <div className="h-32 bg-zinc-800/50 flex items-center justify-center">
                {project.thumbnail_url ? (
                  <img
                    src={project.thumbnail_url}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl opacity-30">📐</span>
                )}
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
                  <span className="text-[10px] text-zinc-600">
                    v{project.version} • {new Date(project.updated_at).toLocaleDateString('es-CL')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id, project.name);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-xs text-zinc-600 hover:text-red-400 transition-all"
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-semibold mb-4">Nuevo proyecto</h2>
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
                  placeholder="Ej: Layout FIREFIT Valdivia"
                  className="w-full px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="gym-name" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Nombre del gimnasio
                </label>
                <input
                  id="gym-name"
                  type="text"
                  value={newGym}
                  onChange={(e) => setNewGym(e.target.value)}
                  placeholder="Ej: FIREFIT Valdivia"
                  className="w-full px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
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
                  className="px-6 py-2 text-sm font-semibold text-white btn-gradient rounded-lg disabled:opacity-50"
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
