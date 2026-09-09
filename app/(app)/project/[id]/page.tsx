// ==========================================
// Project Editor Page — Editor principal (adapta el App.tsx existente)
// Wraps the existing editor components in the new SaaS context
// ==========================================

'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';

// Importar editor dinámicamente para evitar SSR con Konva (requiere window)
const ProjectEditor = dynamic(() => import('@/components/Editor/ProjectEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-zinc-950">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-zinc-500">Cargando editor...</span>
      </div>
    </div>
  ),
});

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id } = use(params);
  return <ProjectEditor projectId={id} />;
}
