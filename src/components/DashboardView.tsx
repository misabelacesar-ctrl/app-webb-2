import React from 'react';
import {
  BarChart3,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Factory,
  Gauge,
  TrendingUp,
  ShieldCheck,
  Package,
  Layers,
  ArrowRight,
  Printer,
  ChevronRight
} from 'lucide-react';
import { DashboardStats, OrdemProducao, ConfigEmpresa } from '../types';

interface DashboardViewProps {
  stats: DashboardStats | null;
  ordens: OrdemProducao[];
  config: ConfigEmpresa | null;
  onNavigateTab: (tab: string) => void;
  onOpenImprimir: (op: OrdemProducao) => void;
  onOpenBaixa: (op: OrdemProducao) => void;
  onOpenConfig: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  ordens,
  config,
  onNavigateTab,
  onOpenImprimir,
  onOpenBaixa,
  onOpenConfig,
}) => {
  if (!stats) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Carregando indicadores do PCP...
      </div>
    );
  }

  const {
    total_ops,
    ops_por_status,
    total_pedidos,
    faturamento_total,
    materias_criticas,
    postos_capacidade,
    taxa_pontualidade,
    ordens_recentes,
  } = stats;

  const totalAtivas =
    ops_por_status.PLANEJADA +
    ops_por_status.AGUARDANDO_INSUMOS +
    ops_por_status.EM_PRODUCAO +
    ops_por_status.CONTROLE_QUALIDADE;

  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas & Responsável Técnico */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
              Painel Operacional do PCP
            </span>
            <span className="text-xs text-slate-400">Tempo Real</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {config?.nome_empresa || 'MetalTech Manufatura & Design Ltda'}
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Controle de fluxo fabril, explosão de BOM, ocupação dos postos de trabalho e conformidade das ordens de produção.
          </p>
        </div>

        {/* Card do Responsável Técnico do Usuário */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shrink-0 max-w-sm flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Responsável Técnico
              </span>
              <button
                onClick={onOpenConfig}
                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline"
              >
                Alterar
              </button>
            </div>
            <div className="font-extrabold text-sm text-slate-100 truncate mt-0.5">
              {config?.responsavel_tecnico || 'Não Definido'}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {config?.cargo_responsavel || 'Gerente de PCP'} • {config?.registro_profissional || 'CREA/CRQ'}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* OPs Ativas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">OPs em Andamento</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalAtivas}</span>
            <span className="text-xs text-slate-500 font-medium">de {total_ops} emitidas</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-semibold flex items-center gap-1">
            <span>{ops_por_status.EM_PRODUCAO} em fabricação direta</span>
          </div>
        </div>

        {/* Pontualidade On-Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Entrega no Prazo</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{taxa_pontualidade}%</span>
            <span className="text-xs text-slate-500 font-medium">On-Time</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{ops_por_status.CONCLUIDA} ordens finalizadas</span>
          </div>
        </div>

        {/* Carteira de Vendas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Carteira de Pedidos</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              R$ {(faturamento_total / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-slate-500 font-medium">{total_pedidos} pedidos</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 font-medium">
            Atendimento fabril programado
          </div>
        </div>

        {/* Insumos Críticos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Estoque de Insumos</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              materias_criticas.length > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${materias_criticas.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {materias_criticas.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">insumos abaixo do mínimo</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {materias_criticas.length > 0 ? (
              <span className="text-red-600 font-semibold">Exige compra imediata</span>
            ) : (
              <span className="text-emerald-600 font-semibold">Níveis de segurança OK</span>
            )}
          </div>
        </div>
      </div>

      {/* Distribuição do Status das Ordens de Produção (Pipeline) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-slate-950 text-base">
              Pipeline de Produção Fabril (Fluxo de OPs)
            </h3>
            <p className="text-xs text-slate-500">
              Acompanhe o volume de ordens distribuído em cada estágio do processo.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('ops')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            Ver Kanban Completo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Bar Distribution */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-blue-700 uppercase block">1. Planejadas</span>
            <div className="text-xl font-black text-blue-900 mt-1">{ops_por_status.PLANEJADA}</div>
            <span className="text-[10px] text-blue-600">Aguardando início</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-amber-700 uppercase block">2. Insumos</span>
            <div className="text-xl font-black text-amber-900 mt-1">{ops_por_status.AGUARDANDO_INSUMOS}</div>
            <span className="text-[10px] text-amber-600">Almoxarifado</span>
          </div>

          <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-purple-700 uppercase block">3. Em Produção</span>
            <div className="text-xl font-black text-purple-900 mt-1">{ops_por_status.EM_PRODUCAO}</div>
            <span className="text-[10px] text-purple-600">Nas máquinas / linhas</span>
          </div>

          <div className="bg-cyan-50/70 border border-cyan-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-cyan-700 uppercase block">4. Qualidade</span>
            <div className="text-xl font-black text-cyan-900 mt-1">{ops_por_status.CONTROLE_QUALIDADE}</div>
            <span className="text-[10px] text-cyan-600">Inspeção dimensional</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">5. Concluídas</span>
            <div className="text-xl font-black text-emerald-900 mt-1">{ops_por_status.CONCLUIDA}</div>
            <span className="text-[10px] text-emerald-600">Finalizadas com baixa</span>
          </div>
        </div>
      </div>

      {/* Grid: Postos de Trabalho & OPs Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capacidade Produtiva dos Postos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-950 text-base">
                Eficiência Operacional dos Postos (OEE)
              </h3>
              <p className="text-xs text-slate-500">
                Capacidade instalada e rendimento de cada centro produtivo.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('capacidade')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              Configurar
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {postos_capacidade.map((p) => (
              <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                  <span>{p.nome_posto}</span>
                  <span className="text-emerald-700 font-extrabold">{p.eficiencia_oee}% OEE</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                  <span>Setor: {p.setor}</span>
                  <span>{p.capacidade_max_periodo} {p.unidade_capacidade}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, p.eficiencia_oee)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ordens de Produção Recentes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-950 text-base">
                Ordens de Produção Recentes
              </h3>
              <p className="text-xs text-slate-500">
                Últimas movimentações de produção e emissão de folhas.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('ops')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              Ver Todas
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            {ordens_recentes && ordens_recentes.map((op) => (
              <div
                key={op.id}
                className="p-3 bg-slate-50 hover:bg-slate-100/70 transition rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{op.numero_op}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      op.status === 'CONCLUIDA' ? 'bg-emerald-100 text-emerald-800' :
                      op.status === 'EM_PRODUCAO' ? 'bg-purple-100 text-purple-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {op.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800 truncate mt-0.5">
                    {op.prod_nome}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Qtd: <b>{op.quantidade_planejada} un</b> • Prazo: {op.data_fim_prevista}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onOpenImprimir(op)}
                    title="Imprimir Folha de OP"
                    className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-white rounded-lg border border-slate-200 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  {op.status !== 'CONCLUIDA' && (
                    <button
                      onClick={() => onOpenBaixa(op)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg transition"
                    >
                      Baixa
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
