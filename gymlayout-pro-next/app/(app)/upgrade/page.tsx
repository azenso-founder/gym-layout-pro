// ==========================================
// Upgrade Page — Página de upgrade a Pro
// ==========================================

'use client';

import Link from 'next/link';
import { PLANS } from '@/lib/billing/plans';

export default function UpgradePage() {
  const handleCheckout = async (interval: 'month' | 'year') => {
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        alert('Error al iniciar checkout');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-3">
          Upgrade a{' '}
          <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            Pro
          </span>
        </h1>
        <p className="text-sm text-zinc-500">
          Desbloquea todas las funcionalidades para profesionales
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Monthly */}
        <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
          <h3 className="text-sm font-medium text-zinc-400 mb-1">Mensual</h3>
          <p className="text-3xl font-bold mb-4">
            ${PLANS.pro.priceMonthly.toLocaleString('es-CL')}
            <span className="text-sm text-zinc-500 font-normal"> CLP/mes</span>
          </p>
          <button
            onClick={() => handleCheckout('month')}
            className="w-full py-2.5 text-sm font-medium border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Suscribirse mensual
          </button>
        </div>

        {/* Yearly */}
        <div className="p-6 rounded-xl bg-gradient-to-b from-orange-500/5 to-transparent border border-orange-500/20 relative">
          <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold">
            Ahorra 33%
          </div>
          <h3 className="text-sm font-medium text-zinc-400 mb-1">Anual</h3>
          <p className="text-3xl font-bold mb-4">
            ${PLANS.pro.priceYearly.toLocaleString('es-CL')}
            <span className="text-sm text-zinc-500 font-normal"> CLP/año</span>
          </p>
          <button
            onClick={() => handleCheckout('year')}
            className="w-full py-2.5 text-sm font-semibold text-white btn-gradient rounded-lg"
          >
            Suscribirse anual
          </button>
        </div>
      </div>

      {/* Feature comparison */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-zinc-400 font-medium">Funcionalidad</th>
              <th className="text-center px-4 py-3 text-zinc-400 font-medium">Free</th>
              <th className="text-center px-4 py-3 text-orange-400 font-medium">Pro</th>
            </tr>
          </thead>
          <tbody className="text-xs text-zinc-300">
            {[
              ['Proyectos', '3', 'Ilimitados'],
              ['Pisos por proyecto', '3', '20'],
              ['Configs por piso', '3', '20'],
              ['Editor de layout', '✓', '✓'],
              ['Guerchet + SLP', '✓', '✓'],
              ['Simulación DES', '✓', '✓'],
              ['Exportar PNG', '✓', '✓'],
              ['Exportar PDF', '✗', '✓'],
              ['Exportar SIMIO', '✗', '✓'],
              ['Colaboración real-time', '✗', '✓'],
              ['Comparación side-by-side', '✗', '✓'],
              ['Historial de versiones', '5', 'Ilimitado'],
              ['Máquinas personalizadas', '10', 'Ilimitadas'],
            ].map(([feature, free, pro]) => (
              <tr key={feature} className="border-b border-zinc-800/50">
                <td className="px-4 py-2.5">{feature}</td>
                <td className="text-center px-4 py-2.5 text-zinc-500">{free}</td>
                <td className="text-center px-4 py-2.5">{pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-center mt-8">
        <Link href="/dashboard" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          ← Volver al dashboard
        </Link>
      </div>
    </div>
  );
}
