import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Clock,
  Layers,
  Wrench,
  Edit2,
  Trash2,
  DollarSign,
  Info,
  Check,
  X,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Produto, MateriaPrima, PostoCapacidade, ProdutoInsumo, ProdutoEtapa } from '../types';

interface ProdutosFichaTecnicaViewProps {
  produtos: Produto[];
  materiasPrimas: MateriaPrima[];
  postos: PostoCapacidade[];
  onRefresh: () => void;
  onCreateProduto: (data: Partial<Produto>) => Promise<void>;
  onUpdateProduto: (id: number, data: Partial<Produto>) => Promise<void>;
  onDeleteProduto: (id: number) => Promise<void>;
}

export const ProdutosFichaTecnicaView: React.FC<ProdutosFichaTecnicaViewProps> = ({
  produtos,
  materiasPrimas,
  postos,
  onRefresh,
  onCreateProduto,
  onUpdateProduto,
  onDeleteProduto,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Móveis Industriais');
  const [especificacoes, setEspecificacoes] = useState('');
  const [tempoMinutos, setTempoMinutos] = useState<number>(60);
  const [unidade, setUnidade] = useState('un');
  const [precoVenda, setPrecoVenda] = useState<number>(0);
  const [estoqueAcabado, setEstoqueAcabado] = useState<number>(0);

  // BOM (insumos)
  const [insumos, setInsumos] = useState<ProdutoInsumo[]>([]);
  // Etapas
  const [etapas, setEtapas] = useState<ProdutoEtapa[]>([]);

  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenCreate = () => {
    setEditingId(null);
    setCodigo(`PRD-${100 + produtos.length + 1}`);
    setNome('');
    setDescricao('');
    setCategoria('Móveis Industriais');
    setEspecificacoes('Dimensões: \nEstrutura: \nAcabamento: \nCarga Máxima: ');
    setTempoMinutos(60);
    setUnidade('un');
    setPrecoVenda(0);
    setEstoqueAcabado(0);
    setInsumos([]);
    setEtapas([
      { ordem: 1, nome_etapa: 'Corte e Usinagem', duracao_minutos: 20, posto_trabalho_id: postos[0]?.id || null, instrucoes: '' },
      { ordem: 2, nome_etapa: 'Montagem e Acabamento', duracao_minutos: 40, posto_trabalho_id: postos[1]?.id || null, instrucoes: '' },
    ]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Produto) => {
    setEditingId(p.id);
    setCodigo(p.codigo);
    setNome(p.nome);
    setDescricao(p.descricao || '');
    setCategoria(p.categoria || 'Geral');
    setEspecificacoes(p.especificacoes_tecnicas || '');
    setTempoMinutos(p.tempo_processo_minutos || 60);
    setUnidade(p.unidade_medida || 'un');
    setPrecoVenda(p.preco_venda_sugerido || 0);
    setEstoqueAcabado(p.estoque_acabado || 0);

    setInsumos(p.insumos ? p.insumos.map((i) => ({ ...i })) : []);
    setEtapas(p.etapas ? p.etapas.map((e) => ({ ...e })) : []);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddInsumo = () => {
    if (materiasPrimas.length === 0) return;
    setInsumos([
      ...insumos,
      {
        materia_prima_id: materiasPrimas[0].id,
        quantidade_necessaria: 1,
        observacoes: '',
      },
    ]);
  };

  const handleRemoveInsumo = (index: number) => {
    setInsumos(insumos.filter((_, i) => i !== index));
  };

  const handleInsumoChange = (index: number, field: string, val: any) => {
    const updated = [...insumos];
    updated[index] = { ...updated[index], [field]: val };
    setInsumos(updated);
  };

  const handleAddEtapa = () => {
    setEtapas([
      ...etapas,
      {
        ordem: etapas.length + 1,
        nome_etapa: 'Nova Etapa',
        duracao_minutos: 30,
        posto_trabalho_id: postos[0]?.id || null,
        instrucoes: '',
      },
    ]);
  };

  const handleRemoveEtapa = (index: number) => {
    const updated = etapas.filter((_, i) => i !== index).map((e, idx) => ({ ...e, ordem: idx + 1 }));
    setEtapas(updated);
  };

  const handleEtapaChange = (index: number, field: string, val: any) => {
    const updated = [...etapas];
    updated[index] = { ...updated[index], [field]: val };
    setEtapas(updated);
  };

  // Custo estimado somado do BOM
  const custoTotalInsumos = insumos.reduce((acc, curr) => {
    const mp = materiasPrimas.find((m) => m.id === Number(curr.materia_prima_id));
    return acc + (Number(curr.quantidade_necessaria || 0) * (mp ? Number(mp.custo_unitario) : 0));
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !nome.trim()) {
      setFormError('Código e Nome do produto são obrigatórios.');
      return;
    }

    setLoading(true);
    setFormError(null);
    try {
      const payload: Partial<Produto> = {
        codigo: codigo.trim(),
        nome: nome.trim(),
        descricao: descricao.trim(),
        categoria,
        especificacoes_tecnicas: especificacoes.trim(),
        tempo_processo_minutos: Number(tempoMinutos),
        unidade_medida: unidade,
        preco_venda_sugerido: Number(precoVenda),
        estoque_acabado: Number(estoqueAcabado),
        insumos,
        etapas,
      };

      if (editingId) {
        await onUpdateProduto(editingId, payload);
      } else {
        await onCreateProduto(payload);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar produto.');
    } finally {
      setLoading(false);
    }
  };

  const produtosFiltrados = produtos.filter((p) => {
    return (
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase()) ||
      (p.categoria && p.categoria.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Fichas Técnicas de Produtos & Engenharia (BOM)
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
              {produtos.length} produtos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre os produtos acabados, especificações técnicas, tempo de fabricação e a lista de matérias-primas necessárias (BOM).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Produto / Ficha Técnica
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative bg-white p-3.5 rounded-xl border border-slate-200">
        <Search className="w-4 h-4 text-slate-400 absolute left-6 top-5.5" />
        <input
          type="text"
          placeholder="Buscar produto por nome, código SKU ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {produtosFiltrados.map((prod) => (
          <div
            key={prod.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div>
              {/* Top tag & actions */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {prod.codigo}
                  </span>
                  <span className="ml-2 text-[10px] text-slate-500 font-medium">
                    {prod.categoria}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(prod)}
                    title="Editar Ficha Técnica"
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteProduto(prod.id)}
                    title="Excluir Produto"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title and Description */}
              <div className="mt-3">
                <h3 className="font-bold text-slate-950 text-sm leading-snug">
                  {prod.nome}
                </h3>
                {prod.descricao && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {prod.descricao}
                  </p>
                )}
              </div>

              {/* Specifications preview */}
              {prod.especificacoes_tecnicas && (
                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-700 font-mono line-clamp-3">
                  {prod.especificacoes_tecnicas}
                </div>
              )}

              {/* Key manufacturing metrics */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tempo: <b className="text-slate-900">{prod.tempo_processo_minutos} min</b></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>Insumos: <b className="text-slate-900">{prod.insumos?.length || 0} itens</b></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Custo MP: <b className="text-slate-900">R$ {(prod.custo_insumos || 0).toFixed(2)}</b></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Boxes className="w-3.5 h-3.5 text-purple-500" />
                  <span>Estoque: <b className="text-slate-900">{prod.estoque_acabado} {prod.unidade_medida}</b></span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Preço Sugerido:</span>
              <span className="font-extrabold text-emerald-700 text-sm">
                R$ {prod.preco_venda_sugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Criar/Editar Produto e Ficha Técnica */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingId ? 'Editar Ficha Técnica do Produto' : 'Cadastrar Novo Produto & Ficha Técnica'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código SKU *</label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoria</label>
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tempo Fabricação (minutos) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={tempoMinutos}
                    onChange={(e) => setTempoMinutos(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preço Venda Sugerido (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={precoVenda}
                    onChange={(e) => setPrecoVenda(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição Comercial</label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Breve descrição da aplicação do produto..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Especificações Técnicas (Dimensões, Tolerâncias, Acabamento, Cargas)
                </label>
                <textarea
                  rows={3}
                  value={especificacoes}
                  onChange={(e) => setEspecificacoes(e.target.value)}
                  placeholder="Ex: Dimensões 160x80x75cm; Aço carbono com epóxi preto; Tampo MDF 18mm com borda engrossada 36mm..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* FICHA TÉCNICA (BOM) */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold uppercase text-slate-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-600" />
                      Ficha Técnica: Matérias-Primas Necessárias (BOM)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Insumos consumidos para fabricar 1 unidade de produto acabado.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddInsumo}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Matéria-Prima
                  </button>
                </div>

                <div className="space-y-2">
                  {insumos.map((ins, idx) => {
                    const mp = materiasPrimas.find((m) => m.id === Number(ins.materia_prima_id));
                    const custoItem = mp ? Number(mp.custo_unitario) * Number(ins.quantidade_necessaria) : 0;

                    return (
                      <div key={idx} className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                        <div className="flex-1 min-w-[200px]">
                          <select
                            value={ins.materia_prima_id}
                            onChange={(e) => handleInsumoChange(idx, 'materia_prima_id', Number(e.target.value))}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900"
                          >
                            {materiasPrimas.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.codigo} - {m.nome} ({m.unidade_medida}) - R$ {m.custo_unitario.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-28 flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            placeholder="Qtd"
                            value={ins.quantidade_necessaria}
                            onChange={(e) => handleInsumoChange(idx, 'quantidade_necessaria', Number(e.target.value))}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs text-center font-bold"
                          />
                          <span className="text-[10px] text-slate-500">{mp?.unidade_medida}</span>
                        </div>

                        <div className="w-24 text-right font-semibold text-slate-700">
                          R$ {custoItem.toFixed(2)}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveInsumo(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}

                  {insumos.length === 0 && (
                    <div className="p-3 text-center text-slate-400 text-xs italic">
                      Nenhum insumo vinculado a esta ficha técnica. Clique em "Adicionar Matéria-Prima".
                    </div>
                  )}
                </div>

                <div className="text-right pt-2 font-bold text-slate-900 text-xs">
                  Custo Total de Insumos: <span className="text-emerald-700 font-extrabold text-sm">R$ {custoTotalInsumos.toFixed(2)}</span>
                </div>
              </div>

              {/* ROTEIRO DE PRODUÇÃO */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold uppercase text-slate-900 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-amber-600" />
                      Roteiro de Produção & Postos de Trabalho
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Sequência das etapas operacionais no chão de fábrica.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEtapa}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Etapa
                  </button>
                </div>

                <div className="space-y-2">
                  {etapas.map((et, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      <span className="w-6 font-bold text-slate-400 text-center">{et.ordem}</span>
                      <div className="flex-1 min-w-[160px]">
                        <input
                          type="text"
                          placeholder="Nome da Etapa"
                          value={et.nome_etapa}
                          onChange={(e) => handleEtapaChange(idx, 'nome_etapa', e.target.value)}
                          className="w-full p-1.5 border border-slate-300 rounded text-xs font-semibold"
                        />
                      </div>
                      <div className="w-44">
                        <select
                          value={et.posto_trabalho_id || ''}
                          onChange={(e) => handleEtapaChange(idx, 'posto_trabalho_id', e.target.value ? Number(e.target.value) : null)}
                          className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
                        >
                          <option value="">Posto não definido</option>
                          {postos.map((pst) => (
                            <option key={pst.id} value={pst.id}>
                              {pst.nome_posto}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24 flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="Minutos"
                          value={et.duracao_minutos}
                          onChange={(e) => handleEtapaChange(idx, 'duracao_minutos', Number(e.target.value))}
                          className="w-full p-1.5 border border-slate-300 rounded text-xs text-center font-bold"
                        />
                        <span className="text-[10px] text-slate-400">min</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEtapa(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Salvando...' : 'Salvar Ficha Técnica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
