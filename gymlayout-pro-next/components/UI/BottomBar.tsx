// ==========================================
// Barra inferior — Tabs de módulos
// ==========================================

import { FiLayout, FiGrid, FiPlay, FiBarChart2, FiDownload } from 'react-icons/fi';
import useStore from '@/stores/useStore';
import type { AppTab } from '@/types';

const tabs: { id: AppTab; icon: React.ReactNode; label: string }[] = [
  { id: 'layout', icon: <FiLayout />, label: 'Layout' },
  { id: 'slp', icon: <FiGrid />, label: 'SLP' },
  { id: 'simulacion', icon: <FiPlay />, label: 'Simulación' },
  { id: 'metricas', icon: <FiBarChart2 />, label: 'Métricas' },
  { id: 'export', icon: <FiDownload />, label: 'Exportar' },
];

export default function BottomBar() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);

  return (
    <div className="h-10 bg-zinc-900 border-t border-zinc-700 flex items-center px-4 shrink-0">
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-t-md text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-orange-400 border-t-2 border-orange-400'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
