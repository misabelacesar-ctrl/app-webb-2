import React, { useState } from 'react';
import {
  CheckCircle2,
  X,
  AlertTriangle,
  Package,
  Layers,
  User,
  FileText,
  Boxes
} from 'lucide-react';
import { OrdemProducao } from '../types';

interface BaixaOrdemModalProps {
  op: OrdemProducao | null;
  onClose: () => void;
  onSubmit: (data: {
    quantidade_produzida: number;
    quantidade_refugo: number;
    operador_baixa: string;
    observacoes_producao: string;
    dar_baixa_materiais: boolean;
    adicionar_estoque_acabado: boolean;
    status_final: string;
  }) => Promise<void>;
}

export const BaixaOrdemModal: React.FC<BaixaOrdemModalProps> = ({ op, onClose, onSubmit }) => {
  if (!op) return null;

  const [qtdProduzida, setQtdProduzida] = useState<number>(op.quantidade_planejada);
  const [qtdRefugo, setQtdRefugo] = useState<number>(0);
  const [operador, setOperador] = useState<string>('Operador do Turno');
  const [observacoes, setObservacoes] = useState<string>(
    op.observacoes_producao || 'Produção finalizada em conformidade com as especificações técnicas.'
  );
  const [darBaixaMateriais, setDarBaixaMateriais] = useState<boolean>(true);
  const [addEstoqueAcabado, setAddEstoqueAcabado] = useState<boolean>(true);
  const [statusFinal, setStatusFinal] = useState<string>('CONCLUIDA');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qtdProduzida < 0) {
      setError('A quantidade produzida não pode ser negativa.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        quantidade_produzida: Number(qtdProduzida),
        quantidade_refugo: Number(qtdRefugo) || 0,
        operador_baixa: operador.trim(),
        observacoes_producao: observacoes.trim(),
        dar_baixa_materiais: darBaixaMateriais,
        adicionar_estoque_acabado: addEstoqueAcabado,
        status_final: statusFinal,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao processar baixa da ordem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Baixa & Conclusão de Ordem de Produção</h3>
              <p className="text-xs text-slate-400">OP: {op.numero_op} • {op.prod_nome}</p>
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

          {/* Dados resumidos da OP */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Qtd Planejada</span>
              <span className="font-bold text-slate-900 text-sm">{op.quantidade_planejada} {op.prod_unidade}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Cliente / Destino</span>
              <span className="font-semibold text-slate-800 truncate block">{op.cliente_nome || 'Estoque Interno'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Prazo Prometido</span>
              <span className="font-semibold text-slate-800">{op.data_fim_prevista}</span>
            </div>
          </div>

          {/* Quantidades Produzidas e Refugo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Quantidade Aprovada (Produzida) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={qtdProduzida}
                  onChange={(e) => setQtdProduzida(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">
                  {op.prod_unidade || 'un'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Quantidade Refugada (Perda)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={qtdRefugo}
                  onChange={(e) => setQtdRefugo(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-red-700 focus:outline-hidden focus:ring-2 focus:ring-red-400"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">
                  {op.prod_unidade || 'un'}
                </span>
              </div>
            </div>
          </div>

          {/* Operador e Status Final */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Operador / Responsável pela Baixa *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={operador}
                  onChange={(e) => setOperador(e.target.value)}
                  placeholder="Nome do operador ou supervisor"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Status Final da Ordem
              </label>
              <select
                value={statusFinal}
                onChange={(e) => setStatusFinal(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="CONCLUIDA">CONCLUÍDA (100% Finalizada)</option>
                <option value="CONTROLE_QUALIDADE">CONTROLE DE QUALIDADE (Aguardando Inspeção)</option>
              </select>
            </div>
          </div>

          {/* Observações de Qualidade */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Observações Operacionais & Qualidade
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva detalhes do lote produzido, testes dimensionais ou justificativa de refugo..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Integração de Estoques (Checkboxes operacionais) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Ações Automáticas no Sistema ERP:
            </span>

            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={darBaixaMateriais}
                onChange={(e) => setDarBaixaMateriais(e.target.checked)}
                className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
              />
              <div>
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  Dar baixa proporcional no estoque de matérias-primas (BOM)
                </span>
                <p className="text-[11px] text-slate-500">
                  Descontará os insumos calculados desta OP no almoxarifado geral.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={addEstoqueAcabado}
                onChange={(e) => setAddEstoqueAcabado(e.target.checked)}
                className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
              />
              <div>
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                  Acrescentar {qtdProduzida} {op.prod_unidade} ao estoque de produtos acabados
                </span>
                <p className="text-[11px] text-slate-500">
                  Registra entrada física do produto acabado para expedição ou venda.
                </p>
              </div>
            </label>
          </div>

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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Processando Baixa...' : 'Confirmar Baixa de Produção'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
