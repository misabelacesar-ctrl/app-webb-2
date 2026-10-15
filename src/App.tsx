/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
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
} from './types';

import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { OrdensProducaoView } from './components/OrdensProducaoView';
import { PedidosView } from './components/PedidosView';
import { ProdutosFichaTecnicaView } from './components/ProdutosFichaTecnicaView';
import { MateriasPrimasView } from './components/MateriasPrimasView';
import { CapacidadeView } from './components/CapacidadeView';
import { ClientesFornecedoresView } from './components/ClientesFornecedoresView';
import { RelatoriosView } from './components/RelatoriosView';

import { NovaOrdemModal } from './components/NovaOrdemModal';
import { FolhaOrdemProducaoModal } from './components/FolhaOrdemProducaoModal';
import { BaixaOrdemModal } from './components/BaixaOrdemModal';
import { ConfiguracoesModal } from './components/ConfiguracoesModal';

import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Application Data States
  const [config, setConfig] = useState<ConfigEmpresa | null>(null);
  const [materias, setMaterias] = useState<MateriaPrima[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [postos, setPostos] = useState<PostoCapacidade[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Loading and Notification States
  const [loading, setLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modais
  const [isNovaOrdemOpen, setIsNovaOrdemOpen] = useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [opParaImprimir, setOpParaImprimir] = useState<OrdemProducao | null>(null);
  const [opParaBaixa, setOpParaBaixa] = useState<OrdemProducao | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Carregamento principal de dados
  const loadData = useCallback(async () => {
    try {
      const [
        cfgData,
        matData,
        prodData,
        postData,
        cliData,
        fornData,
        pedData,
        ordData,
        statData
      ] = await Promise.all([
        api.getConfig(),
        api.getMateriasPrimas(),
        api.getProdutos(),
        api.getPostosCapacidade(),
        api.getClientes(),
        api.getFornecedores(),
        api.getPedidos(),
        api.getOrdensProducao(),
        api.getDashboardStats(),
      ]);

      setConfig(cfgData);
      setMaterias(matData);
      setProdutos(prodData);
      setPostos(postData);
      setClientes(cliData);
      setFornecedores(fornData);
      setPedidos(pedData);
      setOrdens(ordData);
      setStats(statData);
    } catch (err: any) {
      console.error('Erro ao carregar dados do PCP ERP:', err);
      showToast('Erro ao sincronizar com banco de dados.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ações de Configuração e Responsável Técnico
  const handleSaveConfig = async (data: Partial<ConfigEmpresa>) => {
    try {
      const updated = await api.updateConfig(data);
      setConfig(updated);
      showToast('Configurações e Responsável Técnico atualizados com sucesso!');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar configurações.', 'error');
      throw err;
    }
  };

  const handleResetSeed = async () => {
    if (!confirm('Deseja restaurar o banco de dados com os dados de demonstração completos (produtos, clientes, fornecedores e OPs)?')) {
      return;
    }
    setIsResetting(true);
    try {
      await api.resetDatabase();
      await loadData();
      showToast('Banco de dados restaurado com dados de demonstração!');
    } catch (err: any) {
      showToast('Erro ao restaurar banco de dados.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Ações de Ordem de Produção
  const handleCreateOrdem = async (data: Partial<OrdemProducao>) => {
    try {
      await api.createOrdemProducao(data);
      showToast('Ordem de Produção criada com sucesso!');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao criar ordem.', 'error');
      throw err;
    }
  };

  const handleUpdateStatusOp = async (id: number, status: string) => {
    try {
      await api.updateStatusOp(id, status);
      showToast(`Status atualizado para: ${status.replace('_', ' ')}`);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao alterar status.', 'error');
    }
  };

  const handleBaixaOp = async (data: {
    quantidade_produzida: number;
    quantidade_refugo: number;
    operador_baixa: string;
    observacoes_producao: string;
    dar_baixa_materiais: boolean;
    adicionar_estoque_acabado: boolean;
    status_final: string;
  }) => {
    if (!opParaBaixa) return;
    try {
      await api.darBaixaOp(opParaBaixa.id, data);
      showToast(`Baixa da OP ${opParaBaixa.numero_op} realizada com sucesso!`);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao realizar baixa.', 'error');
      throw err;
    }
  };

  const handleDeleteOp = async (id: number) => {
    if (!confirm('Tem certeza que deseja cancelar e excluir esta Ordem de Produção?')) return;
    try {
      await api.deleteOrdemProducao(id);
      showToast('Ordem de Produção excluída.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir ordem.', 'error');
    }
  };

  // Ações de Pedidos
  const handleCreatePedido = async (data: Partial<Pedido>) => {
    try {
      await api.createPedido(data);
      showToast('Pedido de venda cadastrado com sucesso!');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao cadastrar pedido.', 'error');
      throw err;
    }
  };

  const handleDeletePedido = async (id: number) => {
    if (!confirm('Deseja excluir este pedido de venda?')) return;
    try {
      await api.deletePedido(id);
      showToast('Pedido excluído com sucesso.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir pedido.', 'error');
    }
  };

  const handleGerarOpDePedido = async (pedidoId: number) => {
    try {
      const res = await api.gerarOpDoPedido(pedidoId);
      showToast(res.message || 'Ordens de Produção geradas com sucesso!');
      await loadData();
      setCurrentTab('ops');
    } catch (err: any) {
      showToast(err.message || 'Erro ao gerar OPs do pedido.', 'error');
    }
  };

  // Ações de Produtos
  const handleCreateProduto = async (data: Partial<Produto>) => {
    try {
      await api.createProduto(data);
      showToast('Produto e ficha técnica criados com sucesso!');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao criar produto.', 'error');
      throw err;
    }
  };

  const handleUpdateProduto = async (id: number, data: Partial<Produto>) => {
    try {
      await api.updateProduto(id, data);
      showToast('Ficha técnica atualizada com sucesso!');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar produto.', 'error');
      throw err;
    }
  };

  const handleDeleteProduto = async (id: number) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    try {
      await api.deleteProduto(id);
      showToast('Produto excluído com sucesso.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir produto.', 'error');
    }
  };

  // Ações de Matérias-Primas
  const handleCreateMateria = async (data: Partial<MateriaPrima>) => {
    try {
      await api.createMateriaPrima(data);
      showToast('Matéria-prima cadastrada.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao cadastrar matéria-prima.', 'error');
      throw err;
    }
  };

  const handleUpdateMateria = async (id: number, data: Partial<MateriaPrima>) => {
    try {
      await api.updateMateriaPrima(id, data);
      showToast('Matéria-prima atualizada.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar matéria-prima.', 'error');
      throw err;
    }
  };

  const handleDeleteMateria = async (id: number) => {
    if (!confirm('Deseja excluir esta matéria-prima?')) return;
    try {
      await api.deleteMateriaPrima(id);
      showToast('Matéria-prima excluída.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir matéria-prima.', 'error');
    }
  };

  const handleAjustarEstoqueMP = async (
    id: number,
    data: { quantidade: number; tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE'; justificativa: string; usuario?: string }
  ) => {
    try {
      await api.ajustarEstoqueMP(id, data);
      showToast('Movimentação de estoque registrada com sucesso.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao ajustar estoque.', 'error');
      throw err;
    }
  };

  // Ações de Postos de Capacidade
  const handleCreatePosto = async (data: Partial<PostoCapacidade>) => {
    try {
      await api.createPostoCapacidade(data);
      showToast('Posto de trabalho cadastrado.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao cadastrar posto.', 'error');
      throw err;
    }
  };

  const handleUpdatePosto = async (id: number, data: Partial<PostoCapacidade>) => {
    try {
      await api.updatePostoCapacidade(id, data);
      showToast('Posto de trabalho atualizado.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar posto.', 'error');
      throw err;
    }
  };

  const handleDeletePosto = async (id: number) => {
    if (!confirm('Deseja excluir este posto de trabalho?')) return;
    try {
      await api.deletePostoCapacidade(id);
      showToast('Posto de trabalho excluído.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir posto.', 'error');
    }
  };

  // Ações de Clientes e Fornecedores
  const handleCreateCliente = async (data: Partial<Cliente>) => {
    try {
      await api.createCliente(data);
      showToast('Cliente cadastrado com sucesso.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao cadastrar cliente.', 'error');
      throw err;
    }
  };

  const handleUpdateCliente = async (id: number, data: Partial<Cliente>) => {
    try {
      await api.updateCliente(id, data);
      showToast('Cliente atualizado.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar cliente.', 'error');
      throw err;
    }
  };

  const handleDeleteCliente = async (id: number) => {
    if (!confirm('Deseja excluir este cliente?')) return;
    try {
      await api.deleteCliente(id);
      showToast('Cliente excluído.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir cliente.', 'error');
    }
  };

  const handleCreateFornecedor = async (data: Partial<Fornecedor>) => {
    try {
      await api.createFornecedor(data);
      showToast('Fornecedor cadastrado.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao cadastrar fornecedor.', 'error');
      throw err;
    }
  };

  const handleUpdateFornecedor = async (id: number, data: Partial<Fornecedor>) => {
    try {
      await api.updateFornecedor(id, data);
      showToast('Fornecedor atualizado.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar fornecedor.', 'error');
      throw err;
    }
  };

  const handleDeleteFornecedor = async (id: number) => {
    if (!confirm('Deseja excluir este fornecedor?')) return;
    try {
      await api.deleteFornecedor(id);
      showToast('Fornecedor excluído.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir fornecedor.', 'error');
    }
  };

  const handleAbrirImprimirOp = async (op: OrdemProducao) => {
    try {
      const completa = await api.getOrdemProducao(op.id);
      setOpParaImprimir(completa);
    } catch {
      setOpParaImprimir(op);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-bold transition-all transform animate-in fade-in slide-in-from-bottom-3 ${
            toastMessage.type === 'error'
              ? 'bg-red-600 text-white border-red-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-red-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/20 rounded-lg ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header com Navegação e Responsável Técnico */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        config={config}
        onOpenConfig={() => setIsConfigOpen(true)}
        onResetSeed={handleResetSeed}
        isResetting={isResetting}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:m-0 print:max-w-none">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-semibold">Inicializando PCP Manufatura ERP...</p>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                ordens={ordens}
                config={config}
                onNavigateTab={setCurrentTab}
                onOpenImprimir={handleAbrirImprimirOp}
                onOpenBaixa={(op) => setOpParaBaixa(op)}
                onOpenConfig={() => setIsConfigOpen(true)}
              />
            )}

            {currentTab === 'ops' && (
              <OrdensProducaoView
                ordens={ordens}
                produtos={produtos}
                pedidos={pedidos}
                config={config}
                onRefresh={loadData}
                onOpenNovaOrdem={() => setIsNovaOrdemOpen(true)}
                onOpenImprimir={handleAbrirImprimirOp}
                onOpenBaixa={(op) => setOpParaBaixa(op)}
                onUpdateStatus={handleUpdateStatusOp}
                onDeleteOp={handleDeleteOp}
              />
            )}

            {currentTab === 'pedidos' && (
              <PedidosView
                pedidos={pedidos}
                clientes={clientes}
                produtos={produtos}
                onRefresh={loadData}
                onCreatePedido={handleCreatePedido}
                onDeletePedido={handleDeletePedido}
                onGerarOp={handleGerarOpDePedido}
              />
            )}

            {currentTab === 'produtos' && (
              <ProdutosFichaTecnicaView
                produtos={produtos}
                materiasPrimas={materias}
                postos={postos}
                onRefresh={loadData}
                onCreateProduto={handleCreateProduto}
                onUpdateProduto={handleUpdateProduto}
                onDeleteProduto={handleDeleteProduto}
              />
            )}

            {currentTab === 'materias' && (
              <MateriasPrimasView
                materias={materias}
                onRefresh={loadData}
                onCreateMateria={handleCreateMateria}
                onUpdateMateria={handleUpdateMateria}
                onDeleteMateria={handleDeleteMateria}
                onAjustarEstoque={handleAjustarEstoqueMP}
              />
            )}

            {currentTab === 'capacidade' && (
              <CapacidadeView
                postos={postos}
                onRefresh={loadData}
                onCreatePosto={handleCreatePosto}
                onUpdatePosto={handleUpdatePosto}
                onDeletePosto={handleDeletePosto}
              />
            )}

            {currentTab === 'parceiros' && (
              <ClientesFornecedoresView
                clientes={clientes}
                fornecedores={fornecedores}
                onRefresh={loadData}
                onCreateCliente={handleCreateCliente}
                onUpdateCliente={handleUpdateCliente}
                onDeleteCliente={handleDeleteCliente}
                onCreateFornecedor={handleCreateFornecedor}
                onUpdateFornecedor={handleUpdateFornecedor}
                onDeleteFornecedor={handleDeleteFornecedor}
              />
            )}

            {currentTab === 'relatorios' && (
              <RelatoriosView
                ordens={ordens}
                config={config}
                produtos={produtos}
                materias={materias}
              />
            )}
          </>
        )}
      </main>

      {/* Footer corporativo */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-[11px] text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <b>{config?.nome_empresa || 'MetalTech Manufatura & Design Ltda'}</b> • Sistema de Planejamento e Controle de Produção (ERP-PCP)
          </span>
          <span className="text-slate-400">
            Responsável Técnico Ativo: <b className="text-slate-700">{config?.responsavel_tecnico || 'Não Definido'}</b>
          </span>
        </div>
      </footer>

      {/* MODAIS GLOBAIS */}
      <NovaOrdemModal
        isOpen={isNovaOrdemOpen}
        onClose={() => setIsNovaOrdemOpen(false)}
        produtos={produtos}
        pedidos={pedidos}
        config={config}
        onSubmit={handleCreateOrdem}
      />

      <FolhaOrdemProducaoModal
        op={opParaImprimir}
        onClose={() => setOpParaImprimir(null)}
      />

      <BaixaOrdemModal
        op={opParaBaixa}
        onClose={() => setOpParaBaixa(null)}
        onSubmit={handleBaixaOp}
      />

      <ConfiguracoesModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSave={handleSaveConfig}
        onResetSeed={handleResetSeed}
        isResetting={isResetting}
      />
    </div>
  );
}
