import {
  ConfigEmpresa,
  MateriaPrima,
  Produto,
  PostoCapacidade,
  Cliente,
  Fornecedor,
  Pedido,
  OrdemProducao,
  DashboardStats,
  MovimentacaoEstoque
} from '../types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido na requisição' }));
    throw new Error(errorData.error || `Erro HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Configurações
  getConfig: () => fetch('/api/config').then((r) => handleResponse<ConfigEmpresa>(r)),
  updateConfig: (data: Partial<ConfigEmpresa>) =>
    fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<ConfigEmpresa>(r)),

  // Matérias-Primas
  getMateriasPrimas: () => fetch('/api/materias-primas').then((r) => handleResponse<MateriaPrima[]>(r)),
  createMateriaPrima: (data: Partial<MateriaPrima>) =>
    fetch('/api/materias-primas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<MateriaPrima>(r)),
  updateMateriaPrima: (id: number, data: Partial<MateriaPrima>) =>
    fetch(`/api/materias-primas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<MateriaPrima>(r)),
  deleteMateriaPrima: (id: number) =>
    fetch(`/api/materias-primas/${id}`, { method: 'DELETE' }).then((r) => handleResponse<{ success: boolean; message?: string }>(r)),
  ajustarEstoqueMP: (id: number, data: { quantidade: number; tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE'; justificativa: string; usuario?: string }) =>
    fetch(`/api/materias-primas/${id}/ajustar-estoque`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<MateriaPrima>(r)),

  // Produtos & Fichas Técnicas (BOM)
  getProdutos: () => fetch('/api/produtos').then((r) => handleResponse<Produto[]>(r)),
  getProduto: (id: number) => fetch(`/api/produtos/${id}`).then((r) => handleResponse<Produto>(r)),
  createProduto: (data: Partial<Produto>) =>
    fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ success: boolean; id: number }>(r)),
  updateProduto: (id: number, data: Partial<Produto>) =>
    fetch(`/api/produtos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ success: boolean; id: number }>(r)),
  deleteProduto: (id: number) =>
    fetch(`/api/produtos/${id}`, { method: 'DELETE' }).then((r) => handleResponse<{ success: boolean }>(r)),

  // Capacidade Produtiva / Postos de Trabalho
  getPostosCapacidade: () => fetch('/api/postos-capacidade').then((r) => handleResponse<PostoCapacidade[]>(r)),
  createPostoCapacidade: (data: Partial<PostoCapacidade>) =>
    fetch('/api/postos-capacidade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<PostoCapacidade>(r)),
  updatePostoCapacidade: (id: number, data: Partial<PostoCapacidade>) =>
    fetch(`/api/postos-capacidade/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<PostoCapacidade>(r)),
  deletePostoCapacidade: (id: number) =>
    fetch(`/api/postos-capacidade/${id}`, { method: 'DELETE' }).then((r) => handleResponse<{ success: boolean }>(r)),

  // Clientes
  getClientes: () => fetch('/api/clientes').then((r) => handleResponse<Cliente[]>(r)),
  createCliente: (data: Partial<Cliente>) =>
    fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Cliente>(r)),
  updateCliente: (id: number, data: Partial<Cliente>) =>
    fetch(`/api/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Cliente>(r)),
  deleteCliente: (id: number) =>
    fetch(`/api/clientes/${id}`, { method: 'DELETE' }).then((r) => handleResponse<{ success: boolean }>(r)),

  // Fornecedores
  getFornecedores: () => fetch('/api/fornecedores').then((r) => handleResponse<Fornecedor[]>(r)),
  createFornecedor: (data: Partial<Fornecedor>) =>
    fetch('/api/fornecedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Fornecedor>(r)),
  updateFornecedor: (id: number, data: Partial<Fornecedor>) =>
    fetch(`/api/fornecedores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Fornecedor>(r)),
  deleteFornecedor: (id: number) =>
    fetch(`/api/fornecedores/${id}`, { method: 'DELETE' }).then((r) => handleResponse<{ success: boolean }>(r)),

  // Pedidos
  getPedidos: () => fetch('/api/pedidos').then((r) => handleResponse<Pedido[]>(r)),
  createPedido: (data: Partial<Pedido>) =>
    fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ success: boolean; id: number; numero_pedido: string }>(r)),
  updatePedido: (id: number, data: Partial<Pedido>) =>
    fetch(`/api/pedidos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ success: boolean; id: number }>(r)),
  deletePedido: (id: number) =>
    fetch(`/api/pedidos/${id}`, { method: 'DELETE' }).then((r) => handleResponse<{ success: boolean }>(r)),
  gerarOpDoPedido: (id: number) =>
    fetch(`/api/pedidos/${id}/gerar-op`, { method: 'POST' }).then((r) => handleResponse<{ success: boolean; message: string; ops: string[] }>(r)),

  // Ordens de Produção (PCP)
  getOrdensProducao: () => fetch('/api/ordens-producao').then((r) => handleResponse<OrdemProducao[]>(r)),
  getOrdemProducao: (id: number) => fetch(`/api/ordens-producao/${id}`).then((r) => handleResponse<OrdemProducao>(r)),
  createOrdemProducao: (data: Partial<OrdemProducao>) =>
    fetch('/api/ordens-producao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ success: boolean; id: number; numero_op: string }>(r)),
  updateStatusOp: (id: number, status: string) =>
    fetch(`/api/ordens-producao/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then((r) => handleResponse<{ success: boolean; status: string }>(r)),
  darBaixaOp: (id: number, data: {
    quantidade_produzida: number;
    quantidade_refugo: number;
    operador_baixa: string;
    observacoes_producao: string;
    dar_baixa_materiais: boolean;
    adicionar_estoque_acabado: boolean;
    status_final?: string;
  }) =>
    fetch(`/api/ordens-producao/${id}/baixa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
  deleteOrdemProducao: (id: number) =>
    fetch(`/api/ordens-producao/${id}`, { method: 'DELETE' }).then((r) => handleResponse<{ success: boolean }>(r)),

  // Dashboard & Métricas
  getDashboardStats: () => fetch('/api/dashboard/stats').then((r) => handleResponse<DashboardStats>(r)),

  // Reset de dados de demonstração
  resetDatabase: () =>
    fetch('/api/db/reset', { method: 'POST' }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
};
