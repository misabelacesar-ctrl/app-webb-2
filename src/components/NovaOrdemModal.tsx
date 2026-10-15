import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  X,
  AlertTriangle,
  Package,
  Calendar,
  Layers,
  Clock,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Produto, Pedido, OrdemProducao, ConfigEmpresa } from '../types';

interface NovaOrdemModalProps {
  isOpen: boolean;
  onClose: () => void;
  produtos: Produto[];
  pedidos: Pedido[];
  config: ConfigEmpresa | null;
  onSubmit: (data: Partial<OrdemProducao>) => Promise<void>;
}

export const NovaOrdemModal: React.FC<NovaOrdemModalProps> = ({
  isOpen,
  onClose,
  produtos,
  pedidos,
  config,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const targetDateStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [produtoId, setProdutoId] = useState<number>(produtos[0]?.id || 0);
  const [quantidade, setQuantidade] = useState<number>(5);
  const [pedidoId, setPedidoId] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>(todayStr);
  const [dataFim, setDataFim] = useState<string>(targetDateStr);
  const [prioridade, setPrioridade] = useState<'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE'>('NORMAL');
  const [responsavel, setResponsavel] = useState<string>(config?.responsavel_tecnico || '');
  const [observacoes, setObservacoes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config?.responsavel_tecnico && !responsavel) {
      setResponsavel(config.responsavel_tecnico);
    }
  }, [config]);

  const produtoSelecionado = produtos.find((p) => p.id === Number(produtoId));
  const tempoTotalHoras = produtoSelecionado
    ? Math.round(((produtoSelecionado.tempo_processo_minutos * quantidade) / 60) * 10) / 10
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoId) {
      setError('Selecione um produto para a ordem de produção.');
      return;
    }
    if (quantidade <= 0) {
      setError('A quantidade deve ser maior que zero.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        produto_id: Number(produtoId),
        quantidade_planejada: Number(quantidade),
        pedido_id: pedidoId ? Number(pedidoId) : null,
        data_inicio_prevista: dataInicio,
        data_fim_prevista: dataFim,
        prioridade,
        responsavel_tecnico: responsavel.trim() || (config?.responsavel_tecnico || 'Engenheiro PCP'),
        observacoes_producao: observacoes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar ordem de produção.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Nova Ordem de Produção (OP)</h3>
              <p className="text-xs text-slate-400">Emissão avulsa ou vinculada a pedido</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Seleção do Produto e Quantidade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Produto a Fabricar (Ficha Técnica) *
              </label>
              <select
                value={produtoId}
                onChange={(e) => setProdutoId(Number(e.target.value))}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
              >
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} - {p.nome} ({p.tempo_processo_minutos} min/un)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Qtd Planejada *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Vínculo de Pedido (Opcional) e Prioridade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Vincular a Pedido de Venda (Opcional)
              </label>
              <select
                value={pedidoId}
                onChange={(e) => setPedidoId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="">Sem pedido (Produção para Estoque)</option>
                {pedidos.map((ped) => (
                  <option key={ped.id} value={ped.id}>
                    {ped.numero_pedido} - {ped.cliente_nome} (Entrega: {ped.data_entrega_prometida})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Prioridade da Ordem
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="BAIXA">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
          </div>

          {/* Prazos de Produção */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Data Prevista de Início *
              </label>
              <input
                type="date"
                required
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Prazo Limite / Conclusão Prevista *
              </label>
              <input
                type="date"
                required
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Responsável Técnico Autorizador */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
              <span>Responsável Técnico Autorizador *</span>
              <span className="text-[10px] text-blue-600 font-normal">Assinará nos documentos oficiais</span>
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Ex: Eng. Carlos Eduardo Ramos (CREA-SP)"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Observações da Ordem */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Instruções e Observações de Fabricação
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Instruções de lote, acabamento especial, embalagem ou requisitos do cliente..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Resumo da Carga de Fabricação e BOM */}
          {produtoSelecionado && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Cálculo de Carga Fabril:
                </span>
                <span className="text-amber-800">
                  {tempoTotalHoras} horas de trabalho estimadas
                </span>
              </div>
              <div className="text-[11px] text-slate-600">
                A lista de materiais (BOM) com todos os insumos necessários será calculada e reservada automaticamente no sistema ao emitir esta OP.
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Criando Ordem...' : 'Emitir Ordem de Produção'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
