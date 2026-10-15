import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpDown,
  Edit2,
  Trash2,
  Check,
  X,
  Layers,
  TrendingDown,
  DollarSign,
  PackageCheck
} from 'lucide-react';
import { MateriaPrima } from '../types';

interface MateriasPrimasViewProps {
  materias: MateriaPrima[];
  onRefresh: () => void;
  onCreateMateria: (data: Partial<MateriaPrima>) => Promise<void>;
  onUpdateMateria: (id: number, data: Partial<MateriaPrima>) => Promise<void>;
  onDeleteMateria: (id: number) => Promise<void>;
  onAjustarEstoque: (id: number, data: { quantidade: number; tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE'; justificativa: string; usuario?: string }) => Promise<void>;
}

export const MateriasPrimasView: React.FC<MateriasPrimasViewProps> = ({
  materias,
  onRefresh,
  onCreateMateria,
  onUpdateMateria,
  onDeleteMateria,
  onAjustarEstoque,
}) => {
  const [search, setSearch] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODAS');

  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [isAjusteOpen, setIsAjusteOpen] = useState(false);
  const [ajusteItem, setAjusteItem] = useState<MateriaPrima | null>(null);
  const [ajusteTipo, setAjusteTipo] = useState<'ENTRADA' | 'SAIDA' | 'AJUSTE'>('ENTRADA');
  const [ajusteQtd, setAjusteQtd] = useState<number>(10);
  const [ajusteJustificativa, setAjusteJustificativa] = useState<string>('Recebimento de nota fiscal');

  // Form states
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Metais');
  const [unidade, setUnidade] = useState('kg');
  const [custo, setCusto] = useState<number>(0);
  const [estoqueAtual, setEstoqueAtual] = useState<number>(0);
  const [estoqueMinimo, setEstoqueMinimo] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenCreate = () => {
    setEditingId(null);
    setCodigo(`MP-${String(materias.length + 1).padStart(3, '0')}`);
    setNome('');
    setDescricao('');
    setCategoria('Metais');
    setUnidade('kg');
    setCusto(10);
    setEstoqueAtual(50);
    setEstoqueMinimo(15);
    setError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (m: MateriaPrima) => {
    setEditingId(m.id);
    setCodigo(m.codigo);
    setNome(m.nome);
    setDescricao(m.descricao || '');
    setCategoria(m.categoria || 'Geral');
    setUnidade(m.unidade_medida || 'un');
    setCusto(m.custo_unitario);
    setEstoqueAtual(m.estoque_atual);
    setEstoqueMinimo(m.estoque_minimo);
    setError(null);
    setIsFormOpen(true);
  };

  const handleOpenAjuste = (m: MateriaPrima) => {
    setAjusteItem(m);
    setAjusteTipo('ENTRADA');
    setAjusteQtd(10);
    setAjusteJustificativa('Recebimento de compras / almoxarifado');
    setIsAjusteOpen(true);
  };

  const handleSaveMateria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !nome.trim()) {
      setError('Código e Nome são obrigatórios.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload: Partial<MateriaPrima> = {
        codigo: codigo.trim(),
        nome: nome.trim(),
        descricao: descricao.trim(),
        categoria,
        unidade_medida: unidade,
        custo_unitario: Number(custo),
        estoque_atual: Number(estoqueAtual),
        estoque_minimo: Number(estoqueMinimo),
      };

      if (editingId) {
        await onUpdateMateria(editingId, payload);
      } else {
        await onCreateMateria(payload);
      }
      setIsFormOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar matéria-prima.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ajusteItem) return;
    setLoading(true);
    try {
      await onAjustarEstoque(ajusteItem.id, {
        quantidade: Number(ajusteQtd),
        tipo: ajusteTipo,
        justificativa: ajusteJustificativa,
        usuario: 'Almoxarife Responsável',
      });
      setIsAjusteOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao ajustar estoque.');
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const totalItens = materias.length;
  const valorTotalEstoque = materias.reduce((acc, curr) => acc + (curr.estoque_atual * curr.custo_unitario), 0);
  const criticos = materias.filter((m) => m.estoque_atual <= m.estoque_minimo);

  const categorias = Array.from(new Set(materias.map((m) => m.categoria))).filter(Boolean);

  const materiasFiltradas = materias.filter((m) => {
    const matchSearch =
      m.nome.toLowerCase().includes(search.toLowerCase()) ||
      m.codigo.toLowerCase().includes(search.toLowerCase()) ||
      (m.descricao && m.descricao.toLowerCase().includes(search.toLowerCase()));

    const matchCat = categoriaFiltro === 'TODAS' || m.categoria === categoriaFiltro;

    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Almoxarifado & Matérias-Primas
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
              {totalItens} insumos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle os insumos industriais, custos unitários, estoques de segurança e reposição para a produção.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Matéria-Prima
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total de Insumos</span>
            <div className="text-lg font-extrabold text-slate-900">{totalItens} itens</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Valor em Estoque</span>
            <div className="text-lg font-extrabold text-emerald-700">
              R$ {valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${criticos.length > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Alerta de Reposição</span>
            <div className={`text-lg font-extrabold ${criticos.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {criticos.length} insumos críticos
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por código, nome ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
        >
          <option value="TODAS">Todas as Categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Nome da Matéria-Prima</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-center">Unidade</th>
                <th className="py-3 px-4 text-right">Custo Unitário</th>
                <th className="py-3 px-4 text-right">Estoque Atual</th>
                <th className="py-3 px-4 text-right">Estoque Mínimo</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materiasFiltradas.map((m) => {
                const isCritico = m.estoque_atual <= m.estoque_minimo;
                return (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.codigo}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{m.nome}</div>
                      {m.descricao && <div className="text-[10px] text-slate-500">{m.descricao}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{m.categoria}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">{m.unidade_medida}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      R$ {m.custo_unitario.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-bold ${isCritico ? 'text-red-600' : 'text-slate-900'}`}>
                        {m.estoque_atual.toLocaleString('pt-BR')} {m.unidade_medida}
                      </span>
                      {isCritico && (
                        <span className="block text-[9px] text-red-500 font-bold uppercase">Reposição Crítica</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {m.estoque_minimo.toLocaleString('pt-BR')} {m.unidade_medida}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-800">
                      R$ {(m.estoque_atual * m.custo_unitario).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenAjuste(m)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition"
                          title="Ajustar Estoque (Entrada/Saída)"
                        >
                          Ajustar
                        </button>
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteMateria(m.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Criar/Editar */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingId ? 'Editar Matéria-Prima' : 'Nova Matéria-Prima'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMateria} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoria</label>
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unidade de Medida</label>
                  <input
                    type="text"
                    placeholder="kg, m, un, m², litro"
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição</label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Especificações do fornecedor, espessura, acabamento..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={custo}
                    onChange={(e) => setCusto(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estoque Atual</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={estoqueAtual}
                    onChange={(e) => setEstoqueAtual(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={estoqueMinimo}
                    onChange={(e) => setEstoqueMinimo(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-red-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-xs cursor-pointer"
                >
                  {loading ? 'Salvando...' : 'Salvar Matéria-Prima'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajuste de Estoque */}
      {isAjusteOpen && ajusteItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Ajuste de Estoque</h3>
              </div>
              <button
                onClick={() => setIsAjusteOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAjuste} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">{ajusteItem.nome}</div>
                <div className="text-slate-500 mt-0.5">
                  Estoque Atual: <b className="text-slate-900">{ajusteItem.estoque_atual} {ajusteItem.unidade_medida}</b>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Movimentação</label>
                <select
                  value={ajusteTipo}
                  onChange={(e) => setAjusteTipo(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="ENTRADA">ENTRADA (Compra / Recebimento)</option>
                  <option value="SAIDA">SAÍDA (Ajuste de Quebra / Descarte)</option>
                  <option value="AJUSTE">AJUSTE DIRETO (Definir novo saldo absoluto)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quantidade ({ajusteItem.unidade_medida})</label>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  required
                  value={ajusteQtd}
                  onChange={(e) => setAjusteQtd(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Justificativa Operacional</label>
                <input
                  type="text"
                  required
                  value={ajusteJustificativa}
                  onChange={(e) => setAjusteJustificativa(e.target.value)}
                  placeholder="Ex: NF 12948 do fornecedor AçoFort"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAjusteOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition shadow-xs cursor-pointer"
                >
                  {loading ? 'Salvando...' : 'Confirmar Movimentação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
