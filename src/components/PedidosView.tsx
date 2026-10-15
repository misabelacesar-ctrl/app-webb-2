import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Calendar,
  Layers,
  ArrowRight,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  PlusCircle,
  FileText
} from 'lucide-react';
import { Pedido, PedidoItem, Cliente, Produto } from '../types';

interface PedidosViewProps {
  pedidos: Pedido[];
  clientes: Cliente[];
  produtos: Produto[];
  onRefresh: () => void;
  onCreatePedido: (data: Partial<Pedido>) => Promise<void>;
  onDeletePedido: (id: number) => Promise<void>;
  onGerarOp: (pedidoId: number) => Promise<void>;
}

export const PedidosView: React.FC<PedidosViewProps> = ({
  pedidos,
  clientes,
  produtos,
  onRefresh,
  onCreatePedido,
  onDeletePedido,
  onGerarOp,
}) => {
  const [search, setSearch] = useState('');
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [gerandoOpId, setGerandoOpId] = useState<number | null>(null);

  // Form states for new order
  const todayStr = new Date().toISOString().split('T')[0];
  const targetDeliveryStr = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];

  const [clienteId, setClienteId] = useState<number>(clientes[0]?.id || 0);
  const [dataPedido, setDataPedido] = useState<string>(todayStr);
  const [dataEntrega, setDataEntrega] = useState<string>(targetDeliveryStr);
  const [prioridade, setPrioridade] = useState<'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE'>('NORMAL');
  const [observacoes, setObservacoes] = useState<string>('');
  const [itens, setItens] = useState<{ produto_id: number; quantidade: number; preco_unitario: number }[]>([
    {
      produto_id: produtos[0]?.id || 0,
      quantidade: 5,
      preco_unitario: produtos[0]?.preco_venda_sugerido || 100,
    },
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleAddItem = () => {
    const prod = produtos[0];
    setItens([
      ...itens,
      {
        produto_id: prod?.id || 0,
        quantidade: 1,
        preco_unitario: prod?.preco_venda_sugerido || 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...itens];
    if (field === 'produto_id') {
      const pId = Number(val);
      const selectedProd = produtos.find((p) => p.id === pId);
      updated[index] = {
        ...updated[index],
        produto_id: pId,
        preco_unitario: selectedProd ? selectedProd.preco_venda_sugerido : 0,
      };
    } else {
      updated[index] = { ...updated[index], [field]: Number(val) };
    }
    setItens(updated);
  };

  const totalCalculado = itens.reduce((acc, curr) => acc + (curr.quantidade * curr.preco_unitario), 0);

  const handleSalvarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) {
      setFormError('Selecione um cliente.');
      return;
    }
    if (itens.length === 0) {
      setFormError('Adicione pelo menos um item ao pedido.');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    try {
      await onCreatePedido({
        cliente_id: Number(clienteId),
        data_pedido: dataPedido,
        data_entrega_prometida: dataEntrega,
        prioridade,
        status: 'APROVADO',
        observacoes,
        itens: itens.map((i) => ({
          produto_id: i.produto_id,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
        })),
      });
      setIsNovoModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao criar pedido.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDispararGerarOp = async (pedidoId: number) => {
    setGerandoOpId(pedidoId);
    try {
      await onGerarOp(pedidoId);
    } finally {
      setGerandoOpId(null);
    }
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    return (
      p.numero_pedido.toLowerCase().includes(search.toLowerCase()) ||
      (p.cliente_nome && p.cliente_nome.toLowerCase().includes(search.toLowerCase())) ||
      (p.observacoes && p.observacoes.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Carteira de Pedidos de Venda
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
              {pedidos.length} pedidos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre os pedidos dos clientes e dispare a geração automática de Ordens de Produção (OPs) com explosão de BOM.
          </p>
        </div>

        <button
          onClick={() => {
            if (clientes.length > 0 && !clienteId) setClienteId(clientes[0].id);
            setIsNovoModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Pedido de Venda
        </button>
      </div>

      {/* Search */}
      <div className="relative bg-white p-3.5 rounded-xl border border-slate-200">
        <Search className="w-4 h-4 text-slate-400 absolute left-6 top-5.5" />
        <input
          type="text"
          placeholder="Buscar pedido por número, cliente ou observações..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Cards de Pedidos */}
      <div className="space-y-4">
        {pedidosFiltrados.map((ped) => {
          const hasOps = ped.ops && ped.ops.length > 0;
          return (
            <div
              key={ped.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition"
            >
              {/* Pedido Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-slate-950">
                        {ped.numero_pedido}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        ped.status === 'CONCLUIDO' ? 'bg-emerald-100 text-emerald-800' :
                        ped.status === 'EM_PRODUCAO' ? 'bg-purple-100 text-purple-800' :
                        ped.status === 'APROVADO' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {ped.status.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        ped.prioridade === 'URGENTE' ? 'bg-red-50 text-red-700 border-red-200' :
                        ped.prioridade === 'ALTA' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {ped.prioridade}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 mt-0.5">
                      Cliente: <span className="text-slate-950">{ped.cliente_nome}</span>
                      {ped.cliente_cidade && <span className="text-slate-400 font-normal"> ({ped.cliente_cidade})</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Botão de Geração de OP do Pedido */}
                  <button
                    onClick={() => handleDispararGerarOp(ped.id)}
                    disabled={gerandoOpId === ped.id}
                    title="Gera ordens de produção automaticamente para os produtos deste pedido calculando matérias-primas necessárias"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {gerandoOpId === ped.id ? 'Gerando OPs...' : 'Gerar Ordem de Produção (OP)'}
                  </button>

                  <button
                    onClick={() => onDeletePedido(ped.id)}
                    title="Excluir Pedido"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Informações de Datas e Valor */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Data Emissão</span>
                  <span className="font-semibold text-slate-800">{ped.data_pedido}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Prazo de Entrega</span>
                  <span className="font-bold text-slate-950">{ped.data_entrega_prometida}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Valor do Pedido</span>
                  <span className="font-extrabold text-emerald-700">
                    R$ {ped.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">OPs Vinculadas</span>
                  {hasOps ? (
                    <span className="font-bold text-purple-700">
                      {ped.ops!.map((o) => o.numero_op).join(', ')}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Nenhuma OP gerada</span>
                  )}
                </div>
              </div>

              {/* Itens do Pedido */}
              <div className="mt-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                  Itens Contratados:
                </span>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase">
                      <tr>
                        <th className="py-2 px-3">Código</th>
                        <th className="py-2 px-3">Produto</th>
                        <th className="py-2 px-3 text-center">Tempo/Un</th>
                        <th className="py-2 px-3 text-right">Qtd Pedida</th>
                        <th className="py-2 px-3 text-right">Qtd Produzida</th>
                        <th className="py-2 px-3 text-right">Preço Unit.</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ped.itens && ped.itens.map((it) => (
                        <tr key={it.id || it.produto_id}>
                          <td className="py-2 px-3 font-mono text-slate-600">{it.prod_codigo}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{it.prod_nome}</td>
                          <td className="py-2 px-3 text-center text-slate-500 font-mono">
                            {it.tempo_processo_minutos ? `${it.tempo_processo_minutos} min` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {it.quantidade} {it.unidade_medida || 'un'}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                            {it.quantidade_atendida || 0} {it.unidade_medida || 'un'}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            R$ {it.preco_unitario.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-950">
                            R$ {(it.quantidade * it.preco_unitario).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}

        {pedidosFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">Nenhum pedido de venda encontrado.</p>
            <p className="text-xs text-slate-400 mt-1">Clique em "Novo Pedido de Venda" para iniciar.</p>
          </div>
        )}
      </div>

      {/* Modal Novo Pedido */}
      {isNovoModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Novo Pedido de Venda</h3>
              </div>
              <button
                onClick={() => setIsNovoModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarPedido} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cliente *
                  </label>
                  <select
                    value={clienteId}
                    onChange={(e) => setClienteId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} {c.cidade ? `(${c.cidade})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Prioridade
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Data do Pedido *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataPedido}
                    onChange={(e) => setDataPedido(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Data Prometida de Entrega *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataEntrega}
                    onChange={(e) => setDataEntrega(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Itens do Pedido */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase">
                    Itens e Produtos do Pedido:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Produto
                  </button>
                </div>

                <div className="space-y-2">
                  {itens.map((it, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <div className="flex-1 min-w-[200px]">
                        <select
                          value={it.produto_id}
                          onChange={(e) => handleItemChange(idx, 'produto_id', e.target.value)}
                          className="w-full p-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white"
                        >
                          {produtos.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.codigo} - {p.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qtd"
                          value={it.quantidade}
                          onChange={(e) => handleItemChange(idx, 'quantidade', e.target.value)}
                          className="w-full p-1.5 border border-slate-300 rounded text-xs text-center font-bold"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="R$ Preço"
                          value={it.preco_unitario}
                          onChange={(e) => handleItemChange(idx, 'preco_unitario', e.target.value)}
                          className="w-full p-1.5 border border-slate-300 rounded text-xs text-right font-medium"
                        />
                      </div>

                      {itens.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-right pt-2.5 font-bold text-slate-900 text-sm">
                  Valor Total: R$ {totalCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Observações do Pedido
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Requisitos de transporte, cor, embalagem ou local de entrega..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNovoModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {formLoading ? 'Salvando...' : 'Salvar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
