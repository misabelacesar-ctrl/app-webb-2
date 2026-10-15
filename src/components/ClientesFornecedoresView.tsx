import React, { useState } from 'react';
import {
  Users2,
  Building2,
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Package
} from 'lucide-react';
import { Cliente, Fornecedor } from '../types';

interface ClientesFornecedoresViewProps {
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  onRefresh: () => void;
  onCreateCliente: (data: Partial<Cliente>) => Promise<void>;
  onUpdateCliente: (id: number, data: Partial<Cliente>) => Promise<void>;
  onDeleteCliente: (id: number) => Promise<void>;
  onCreateFornecedor: (data: Partial<Fornecedor>) => Promise<void>;
  onUpdateFornecedor: (id: number, data: Partial<Fornecedor>) => Promise<void>;
  onDeleteFornecedor: (id: number) => Promise<void>;
}

export const ClientesFornecedoresView: React.FC<ClientesFornecedoresViewProps> = ({
  clientes,
  fornecedores,
  onRefresh,
  onCreateCliente,
  onUpdateCliente,
  onDeleteCliente,
  onCreateFornecedor,
  onUpdateFornecedor,
  onDeleteFornecedor,
}) => {
  const [activeTab, setActiveTab] = useState<'clientes' | 'fornecedores'>('clientes');
  const [search, setSearch] = useState('');

  // Modais
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [clienteEditId, setClienteEditId] = useState<number | null>(null);

  const [isFornModalOpen, setIsFornModalOpen] = useState(false);
  const [fornEditId, setFornEditId] = useState<number | null>(null);

  // States Cliente Form
  const [cliCodigo, setCliCodigo] = useState('');
  const [cliNome, setCliNome] = useState('');
  const [cliTipo, setCliTipo] = useState<'PJ' | 'PF'>('PJ');
  const [cliDoc, setCliDoc] = useState('');
  const [cliContato, setCliContato] = useState('');
  const [cliTel, setCliTel] = useState('');
  const [cliEmail, setCliEmail] = useState('');
  const [cliEnd, setCliEnd] = useState('');
  const [cliCidade, setCliCidade] = useState('');
  const [cliUf, setCliUf] = useState('SP');
  const [cliObs, setCliObs] = useState('');

  // States Fornecedor Form
  const [fornCodigo, setFornCodigo] = useState('');
  const [fornNome, setFornNome] = useState('');
  const [fornCnpj, setFornCnpj] = useState('');
  const [fornContato, setFornContato] = useState('');
  const [fornTel, setFornTel] = useState('');
  const [fornEmail, setFornEmail] = useState('');
  const [fornEnd, setFornEnd] = useState('');
  const [fornProdutos, setFornProdutos] = useState('');
  const [fornPrazo, setFornPrazo] = useState<number>(3);
  const [fornObs, setFornObs] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handlers Cliente
  const handleOpenCreateCliente = () => {
    setClienteEditId(null);
    setCliCodigo(`CLI-${String(clientes.length + 1).padStart(3, '0')}`);
    setCliNome('');
    setCliTipo('PJ');
    setCliDoc('');
    setCliContato('');
    setCliTel('');
    setCliEmail('');
    setCliEnd('');
    setCliCidade('');
    setCliUf('SP');
    setCliObs('');
    setError(null);
    setIsClienteModalOpen(true);
  };

  const handleOpenEditCliente = (c: Cliente) => {
    setClienteEditId(c.id);
    setCliCodigo(c.codigo);
    setCliNome(c.nome);
    setCliTipo(c.tipo_pessoa || 'PJ');
    setCliDoc(c.cpf_cnpj || '');
    setCliContato(c.contato_nome || '');
    setCliTel(c.telefone || '');
    setCliEmail(c.email || '');
    setCliEnd(c.endereco || '');
    setCliCidade(c.cidade || '');
    setCliUf(c.uf || 'SP');
    setCliObs(c.observacoes || '');
    setError(null);
    setIsClienteModalOpen(true);
  };

  const handleSaveCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliNome.trim()) {
      setError('O nome do cliente é obrigatório.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: Partial<Cliente> = {
        codigo: cliCodigo,
        nome: cliNome.trim(),
        tipo_pessoa: cliTipo,
        cpf_cnpj: cliDoc,
        contato_nome: cliContato,
        telefone: cliTel,
        email: cliEmail,
        endereco: cliEnd,
        cidade: cliCidade,
        uf: cliUf,
        observacoes: cliObs,
      };

      if (clienteEditId) {
        await onUpdateCliente(clienteEditId, payload);
      } else {
        await onCreateCliente(payload);
      }
      setIsClienteModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar cliente.');
    } finally {
      setLoading(false);
    }
  };

  // Handlers Fornecedor
  const handleOpenCreateFornecedor = () => {
    setFornEditId(null);
    setFornCodigo(`FORN-${String(fornecedores.length + 1).padStart(2, '0')}`);
    setFornNome('');
    setFornCnpj('');
    setFornContato('');
    setFornTel('');
    setFornEmail('');
    setFornEnd('');
    setFornProdutos('');
    setFornPrazo(3);
    setFornObs('');
    setError(null);
    setIsFornModalOpen(true);
  };

  const handleOpenEditFornecedor = (f: Fornecedor) => {
    setFornEditId(f.id);
    setFornCodigo(f.codigo);
    setFornNome(f.nome);
    setFornCnpj(f.cnpj || '');
    setFornContato(f.contato_nome || '');
    setFornTel(f.telefone || '');
    setFornEmail(f.email || '');
    setFornEnd(f.endereco || '');
    setFornProdutos(f.produtos_fornecidos || '');
    setFornPrazo(f.prazo_medio_dias || 3);
    setFornObs(f.observacoes || '');
    setError(null);
    setIsFornModalOpen(true);
  };

  const handleSaveFornecedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornNome.trim()) {
      setError('O nome do fornecedor é obrigatório.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: Partial<Fornecedor> = {
        codigo: fornCodigo,
        nome: fornNome.trim(),
        cnpj: fornCnpj,
        contato_nome: fornContato,
        telefone: fornTel,
        email: fornEmail,
        endereco: fornEnd,
        produtos_fornecidos: fornProdutos,
        prazo_medio_dias: Number(fornPrazo),
        observacoes: fornObs,
      };

      if (fornEditId) {
        await onUpdateFornecedor(fornEditId, payload);
      } else {
        await onCreateFornecedor(payload);
      }
      setIsFornModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar fornecedor.');
    } finally {
      setLoading(false);
    }
  };

  const clientesFiltrados = clientes.filter((c) => {
    return (
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.codigo.toLowerCase().includes(search.toLowerCase()) ||
      (c.contato_nome && c.contato_nome.toLowerCase().includes(search.toLowerCase())) ||
      (c.cidade && c.cidade.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const fornecedoresFiltrados = fornecedores.filter((f) => {
    return (
      f.nome.toLowerCase().includes(search.toLowerCase()) ||
      f.codigo.toLowerCase().includes(search.toLowerCase()) ||
      (f.produtos_fornecidos && f.produtos_fornecidos.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Parceiros: Clientes & Fornecedores
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastros base para emissão de pedidos de venda e fornecimento de matérias-primas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'clientes' ? (
            <button
              onClick={handleOpenCreateCliente}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Cliente
            </button>
          ) : (
            <button
              onClick={handleOpenCreateFornecedor}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Fornecedor
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('clientes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'clientes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Clientes ({clientes.length})
          </button>
          <button
            onClick={() => setActiveTab('fornecedores')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'fornecedores' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Fornecedores ({fornecedores.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={activeTab === 'clientes' ? "Buscar cliente por nome ou cidade..." : "Buscar fornecedor ou materiais..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Content Clientes */}
      {activeTab === 'clientes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientesFiltrados.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {c.codigo}
                    </span>
                    <span className="ml-2 text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      {c.tipo_pessoa}
                    </span>
                    <h3 className="font-bold text-slate-950 text-base mt-1.5 leading-snug">
                      {c.nome}
                    </h3>
                    {c.cpf_cnpj && <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.cpf_cnpj}</div>}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditCliente(c)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCliente(c.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mt-3 text-xs text-slate-600">
                  {c.contato_nome && (
                    <div className="font-medium text-slate-800">
                      Contato: {c.contato_nome}
                    </div>
                  )}
                  {c.telefone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.telefone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.endereco && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{c.endereco} - {c.cidade}/{c.uf}</span>
                    </div>
                  )}
                </div>
              </div>

              {c.observacoes && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 italic">
                  "{c.observacoes}"
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Content Fornecedores */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fornecedoresFiltrados.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {f.codigo}
                    </span>
                    <h3 className="font-bold text-slate-950 text-base mt-1.5 leading-snug">
                      {f.nome}
                    </h3>
                    {f.cnpj && <div className="text-[11px] text-slate-400 font-mono mt-0.5">{f.cnpj}</div>}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditFornecedor(f)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteFornecedor(f.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mt-3 text-xs text-slate-600">
                  {f.produtos_fornecidos && (
                    <div className="p-2 bg-amber-50/50 rounded-lg border border-amber-100 text-[11px] text-slate-700">
                      <span className="font-bold text-amber-900 block mb-0.5">Produtos Fornecidos:</span>
                      {f.produtos_fornecidos}
                    </div>
                  )}
                  {f.contato_nome && (
                    <div className="font-medium text-slate-800">
                      Contato: {f.contato_nome}
                    </div>
                  )}
                  {f.telefone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{f.telefone}</span>
                    </div>
                  )}
                  {f.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{f.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Prazo Médio:
                </span>
                <span className="font-bold text-slate-900">{f.prazo_medio_dias} dias úteis</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cliente */}
      {isClienteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {clienteEditId ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button onClick={() => setIsClienteModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCliente} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código</label>
                  <input type="text" required value={cliCodigo} onChange={(e) => setCliCodigo(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs font-bold" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razão Social / Nome *</label>
                  <input type="text" required value={cliNome} onChange={(e) => setCliNome(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo Pessoa</label>
                  <select value={cliTipo} onChange={(e) => setCliTipo(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg text-xs">
                    <option value="PJ">Pessoa Jurídica (PJ)</option>
                    <option value="PF">Pessoa Física (PF)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CNPJ / CPF</label>
                  <input type="text" value={cliDoc} onChange={(e) => setCliDoc(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contato Responsável</label>
                  <input type="text" value={cliContato} onChange={(e) => setCliContato(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telefone / WhatsApp</label>
                  <input type="text" value={cliTel} onChange={(e) => setCliTel(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail</label>
                <input type="email" value={cliEmail} onChange={(e) => setCliEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cidade</label>
                  <input type="text" value={cliCidade} onChange={(e) => setCliCidade(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">UF</label>
                  <input type="text" value={cliUf} onChange={(e) => setCliUf(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Endereço Completo</label>
                <input type="text" value={cliEnd} onChange={(e) => setCliEnd(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs" />
              </div>

              <div className="pt-3 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setIsClienteModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold">Cancelar</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-amber-500 hover:bg-amber-400 font-bold text-xs rounded-lg text-slate-950">
                  {loading ? 'Salvando...' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fornecedor */}
      {isFornModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {fornEditId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h3>
              <button onClick={() => setIsFornModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFornecedor} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código</label>
                  <input type="text" required value={fornCodigo} onChange={(e) => setFornCodigo(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs font-bold" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razão Social / Nome *</label>
                  <input type="text" required value={fornNome} onChange={(e) => setFornNome(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CNPJ</label>
                  <input type="text" value={fornCnpj} onChange={(e) => setFornCnpj(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Prazo Médio (dias)</label>
                  <input type="number" min="1" value={fornPrazo} onChange={(e) => setFornPrazo(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-xs font-bold" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Produtos / Insumos Fornecidos</label>
                <input type="text" value={fornProdutos} onChange={(e) => setFornProdutos(e.target.value)} placeholder="Ex: Tubos de aço, Chapas MDF, Tintas epóxi..." className="w-full px-3 py-2 border rounded-lg text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contato</label>
                  <input type="text" value={fornContato} onChange={(e) => setFornContato(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telefone</label>
                  <input type="text" value={fornTel} onChange={(e) => setFornTel(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail</label>
                <input type="email" value={fornEmail} onChange={(e) => setFornEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Endereço / Cidade</label>
                <input type="text" value={fornEnd} onChange={(e) => setFornEnd(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs" />
              </div>

              <div className="pt-3 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setIsFornModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold">Cancelar</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-amber-500 hover:bg-amber-400 font-bold text-xs rounded-lg text-slate-950">
                  {loading ? 'Salvando...' : 'Salvar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
