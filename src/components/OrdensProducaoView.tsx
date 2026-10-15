import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Package,
  Calendar,
  Layers,
  LayoutGrid,
  List,
  Trash2,
  CheckCircle,
  ShieldAlert
} from 'lucide-react';
import { OrdemProducao, Produto, Pedido, ConfigEmpresa } from '../types';

interface OrdensProducaoViewProps {
  ordens: OrdemProducao[];
  produtos: Produto[];
  pedidos: Pedido[];
  config: ConfigEmpresa | null;
  onRefresh: () => void;
  onOpenNovaOrdem: () => void;
  onOpenImprimir: (op: OrdemProducao) => void;
  onOpenBaixa: (op: OrdemProducao) => void;
  onUpdateStatus: (id: number, status: string) => Promise<void>;
  onDeleteOp: (id: number) => Promise<void>;
}

export const OrdensProducaoView: React.FC<OrdensProducaoViewProps> = ({
  ordens,
  produtos,
  pedidos,
  config,
  onRefresh,
  onOpenNovaOrdem,
  onOpenImprimir,
  onOpenBaixa,
  onUpdateStatus,
  onDeleteOp,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'tabela'>('kanban');
  const [search, setSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('TODAS');

  const statusColumns: { id: OrdemProducao['status']; label: string; color: string; border: string; bg: string }[] = [
    { id: 'PLANEJADA', label: '1. Planejada', color: 'text-blue-700', border: 'border-blue-200', bg: 'bg-blue-50/50' },
    { id: 'AGUARDANDO_INSUMOS', label: '2. Aguardando Insumos', color: 'text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50/50' },
    { id: 'EM_PRODUCAO', label: '3. Em Produção', color: 'text-purple-700', border: 'border-purple-200', bg: 'bg-purple-50/50' },
    { id: 'CONTROLE_QUALIDADE', label: '4. Controle de Qualidade', color: 'text-cyan-700', border: 'border-cyan-200', bg: 'bg-cyan-50/50' },
    { id: 'CONCLUIDA', label: '5. Concluída', color: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50/50' },
  ];

  const getNextStatus = (current: string): string | null => {
    switch (current) {
      case 'PLANEJADA':
        return 'AGUARDANDO_INSUMOS';
      case 'AGUARDANDO_INSUMOS':
        return 'EM_PRODUCAO';
      case 'EM_PRODUCAO':
        return 'CONTROLE_QUALIDADE';
      case 'CONTROLE_QUALIDADE':
        return 'CONCLUIDA';
      default:
        return null;
    }
  };

  const getNextStatusLabel = (current: string): string => {
    switch (current) {
      case 'PLANEJADA':
        return 'Reservar Insumos';
      case 'AGUARDANDO_INSUMOS':
        return 'Iniciar Produção';
      case 'EM_PRODUCAO':
        return 'Enviar p/ Qualidade';
      case 'CONTROLE_QUALIDADE':
        return 'Concluir OP';
      default:
        return 'Avançar';
    }
  };

  const hoje = new Date().toISOString().split('T')[0];

  const ordensFiltradas = ordens.filter((op) => {
    const matchSearch =
      op.numero_op.toLowerCase().includes(search.toLowerCase()) ||
      (op.prod_nome && op.prod_nome.toLowerCase().includes(search.toLowerCase())) ||
      (op.cliente_nome && op.cliente_nome.toLowerCase().includes(search.toLowerCase())) ||
      (op.numero_pedido && op.numero_pedido.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = filtroStatus === 'TODOS' || op.status === filtroStatus;
    const matchPrioridade = filtroPrioridade === 'TODAS' || op.prioridade === filtroPrioridade;

    return matchSearch && matchStatus && matchPrioridade;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Acompanhamento de Ordens de Produção (PCP)
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
              {ordens.length} ordens
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie o chão de fábrica em tempo real, emita ordens de produção impressas e registre baixas operacionais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switcher Kanban / Tabela */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('tabela')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'tabela' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Tabela
            </button>
          </div>

          <button
            onClick={onOpenNovaOrdem}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Ordem (OP)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por OP, produto, pedido ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="PLANEJADA">Planejada</option>
            <option value="AGUARDANDO_INSUMOS">Aguardando Insumos</option>
            <option value="EM_PRODUCAO">Em Produção</option>
            <option value="CONTROLE_QUALIDADE">Controle de Qualidade</option>
            <option value="CONCLUIDA">Concluída</option>
          </select>

          <select
            value={filtroPrioridade}
            onChange={(e) => setFiltroPrioridade(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <option value="TODAS">Todas as Prioridades</option>
            <option value="URGENTE">Urgente</option>
            <option value="ALTA">Alta</option>
            <option value="NORMAL">Normal</option>
            <option value="BAIXA">Baixa</option>
          </select>
        </div>
      </div>

      {/* VIEW: KANBAN BOARD */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {statusColumns.map((col) => {
            const colOps = ordensFiltradas.filter((op) => op.status === col.id);
            return (
              <div
                key={col.id}
                className={`rounded-2xl border ${col.border} ${col.bg} p-3 flex flex-col min-h-[480px] shadow-xs`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <span className={`text-xs font-extrabold uppercase tracking-wide ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                    {colOps.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colOps.map((op) => {
                    const isAtrasado = op.status !== 'CONCLUIDA' && op.data_fim_prevista < hoje;
                    const nextSt = getNextStatus(op.status);

                    return (
                      <div
                        key={op.id}
                        className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs hover:shadow-md transition space-y-2.5"
                      >
                        {/* Card Top */}
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {op.numero_op}
                            </span>
                            {op.prioridade === 'URGENTE' && (
                              <span className="ml-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 animate-pulse">
                                Urgente
                              </span>
                            )}
                            {op.prioridade === 'ALTA' && (
                              <span className="ml-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                                Alta
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onOpenImprimir(op)}
                              title="Emitir / Imprimir Folha de OP"
                              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteOp(op.id)}
                              title="Excluir Ordem"
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div>
                          <div className="font-bold text-xs text-slate-900 line-clamp-2">
                            {op.prod_nome}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center justify-between mt-0.5">
                            <span>Qtd: <b className="text-slate-900">{op.quantidade_planejada} {op.prod_unidade}</b></span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {op.tempo_total_horas}h carga
                            </span>
                          </div>
                        </div>

                        {/* Order & Client Info */}
                        <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-1.5 flex flex-col gap-0.5">
                          {op.cliente_nome ? (
                            <span className="truncate">Cliente: <b className="text-slate-700">{op.cliente_nome}</b></span>
                          ) : (
                            <span className="text-slate-400 italic">Estoque Interno</span>
                          )}
                          {op.numero_pedido && (
                            <span>Pedido: <b className="text-slate-700">{op.numero_pedido}</b></span>
                          )}
                        </div>

                        {/* Prazo e Atraso */}
                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                          <span className={`flex items-center gap-1 ${isAtrasado ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                            <Calendar className="w-3 h-3" />
                            {op.data_fim_prevista}
                          </span>
                          {isAtrasado && (
                            <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1 rounded flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Atrasada
                            </span>
                          )}
                        </div>

                        {/* Responsible Badge */}
                        <div className="text-[9px] text-slate-400 truncate">
                          Resp: <span className="font-medium text-slate-600">{op.responsavel_tecnico}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                          {/* Baixa button if not concluded */}
                          {op.status !== 'CONCLUIDA' ? (
                            <button
                              onClick={() => onOpenBaixa(op)}
                              className="flex-1 py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 transition flex items-center justify-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Dar Baixa
                            </button>
                          ) : (
                            <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Concluída ({op.quantidade_produzida} un)
                            </div>
                          )}

                          {/* Quick advance to next state */}
                          {nextSt && (
                            <button
                              onClick={() => onUpdateStatus(op.id, nextSt)}
                              title={`Avançar para: ${getNextStatusLabel(op.status)}`}
                              className="p-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold transition flex items-center gap-1 shrink-0"
                            >
                              <span>{getNextStatusLabel(op.status)}</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {colOps.length === 0 && (
                    <div className="h-32 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs italic">
                      Nenhuma ordem
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW: TABLE */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">OP #</th>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Destino / Cliente</th>
                  <th className="py-3 px-4 text-center">Qtd Planejada</th>
                  <th className="py-3 px-4 text-center">Qtd Produzida</th>
                  <th className="py-3 px-4">Prazo Entrega</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Prioridade</th>
                  <th className="py-3 px-4">Resp. Técnico</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordensFiltradas.map((op) => {
                  const isAtrasado = op.status !== 'CONCLUIDA' && op.data_fim_prevista < hoje;

                  return (
                    <tr key={op.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {op.numero_op}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {op.prod_nome}
                        <div className="text-[10px] font-mono text-slate-400 font-normal">{op.prod_codigo}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {op.cliente_nome ? (
                          <>
                            <div className="font-medium">{op.cliente_nome}</div>
                            {op.numero_pedido && <div className="text-[10px] text-slate-400">Pedido: {op.numero_pedido}</div>}
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Estoque Interno</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {op.quantidade_planejada} {op.prod_unidade}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-emerald-700">
                        {op.quantidade_produzida} {op.prod_unidade}
                        {op.quantidade_refugo > 0 && (
                          <div className="text-[10px] text-red-500 font-normal">Perda: {op.quantidade_refugo}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`font-semibold ${isAtrasado ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                          {op.data_fim_prevista}
                        </span>
                        {isAtrasado && (
                          <span className="block text-[9px] text-red-500 font-bold uppercase">Atrasada</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          op.status === 'CONCLUIDA' ? 'bg-emerald-100 text-emerald-800' :
                          op.status === 'EM_PRODUCAO' ? 'bg-purple-100 text-purple-800' :
                          op.status === 'CONTROLE_QUALIDADE' ? 'bg-cyan-100 text-cyan-800' :
                          op.status === 'AGUARDANDO_INSUMOS' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {op.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold uppercase ${
                          op.prioridade === 'URGENTE' ? 'text-red-700' :
                          op.prioridade === 'ALTA' ? 'text-amber-700' : 'text-slate-600'
                        }`}>
                          {op.prioridade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 text-xs truncate max-w-[150px]">
                        {op.responsavel_tecnico}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenImprimir(op)}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Imprimir Folha de OP"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {op.status !== 'CONCLUIDA' && (
                            <button
                              onClick={() => onOpenBaixa(op)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg transition"
                              title="Dar Baixa"
                            >
                              Baixa
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteOp(op.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Excluir Ordem"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
