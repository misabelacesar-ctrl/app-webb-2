import React from 'react';
import {
  Factory,
  BarChart3,
  ClipboardList,
  ShoppingCart,
  Boxes,
  Cpu,
  Users2,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { ConfigEmpresa } from '../types';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  config: ConfigEmpresa | null;
  onOpenConfig: () => void;
  onResetSeed: () => void;
  isResetting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  config,
  onOpenConfig,
  onResetSeed,
  isResetting,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard & PCP', icon: BarChart3 },
    { id: 'ops', label: 'Ordens de Produção (OP)', icon: ClipboardList },
    { id: 'pedidos', label: 'Pedidos de Venda', icon: ShoppingCart },
    { id: 'produtos', label: 'Fichas Técnicas & BOM', icon: Boxes },
    { id: 'materias', label: 'Matérias-Primas', icon: Boxes },
    { id: 'capacidade', label: 'Capacidade Produtiva', icon: Cpu },
    { id: 'parceiros', label: 'Clientes & Fornecedores', icon: Users2 },
    { id: 'relatorios', label: 'Relatórios & Auditoria', icon: FileSpreadsheet },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      {/* Top corporate bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">
                {config?.nome_empresa || 'PCP Manufatura ERP'}
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PCP Ativo
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Planejamento e Controle de Produção Industrial
            </p>
          </div>
        </div>

        {/* Responsável Técnico em destaque */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenConfig}
            title="Clique para editar o Responsável Técnico e dados da empresa"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 transition text-left group"
          >
            <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                Responsável Técnico
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              </div>
              <div className="font-semibold text-slate-200 group-hover:text-amber-300 transition">
                {config?.responsavel_tecnico || 'Não Definido'}
              </div>
            </div>
          </button>

          <button
            onClick={onOpenConfig}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Configurações da Empresa"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onResetSeed}
            disabled={isResetting}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
            title="Restaurar dados iniciais de demonstração"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Exemplo Demo</span>
          </button>
        </div>
      </div>

      {/* Primary navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
