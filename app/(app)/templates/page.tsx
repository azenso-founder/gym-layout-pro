// ==========================================
// Templates Page — Templates de layout prediseñados
// ==========================================

'use client';

export default function TemplatesPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Plantillas prediseñadas para empezar rápido
          </p>
        </div>
      </div>

      {/* Coming soon placeholder */}
      <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
        <span className="text-5xl mb-4">📋</span>
        <h2 className="text-lg font-semibold mb-2">Próximamente</h2>
        <p className="text-sm text-zinc-500 max-w-md text-center">
          Estamos preparando templates prediseñados para distintos tipos de instalación:
          plantas industriales, centros logísticos, gimnasios, oficinas y más.
        </p>
      </div>
    </div>
  );
}
