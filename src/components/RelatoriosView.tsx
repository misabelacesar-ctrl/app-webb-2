import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { OrdemProducao, ConfigEmpresa, Produto, MateriaPrima } from '../types';

interface RelatoriosViewProps {
  ordens: OrdemProducao[];
  config: ConfigEmpresa | null;
  produtos: Produto[];
  materias: MateriaPrima[];
}

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({
  ordens,
  config,
  produtos,
  materias,
}) => {
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');

  const ordensFiltradas = ordens.filter((op) => {
    const matchStatus = filtroStatus === 'TODOS' || op.status === filtroStatus;
    const matchInicio = !dataInicio || op.data_inicio_prevista >= dataInicio;
    const matchFim = !dataFim || op.data_fim_prevista <= dataFim;
    return matchStatus && matchInicio && matchFim;
  });

  const exportarCSV = () => {
    const headers = [
      'Numero_OP',
      'Produto_Codigo',
      'Produto_Nome',
      'Cliente',
      'Pedido',
      'Qtd_Planejada',
      'Qtd_Produzida',
      'Qtd_Refugo',
      'Data_Emissao',
      'Data_Inicio_Prevista',
      'Data_Fim_Prevista',
      'Data_Conclusao_Real',
      'Status',
      'Prioridade',
      'Responsavel_Tecnico',
      'Operador_Baixa'
    ];

    const rows = ordensFiltradas.map((op) => [
      `"${op.numero_op}"`,
      `"${op.prod_codigo || ''}"`,
      `"${op.prod_nome || ''}"`,
      `"${op.cliente_nome || 'Estoque Interno'}"`,
      `"${op.numero_pedido || ''}"`,
      op.quantidade_planejada,
      op.quantidade_produzida,
      op.quantidade_refugo,
      `"${op.data_emissao}"`,
      `"${op.data_inicio_prevista}"`,
      `"${op.data_fim_prevista}"`,
      `"${op.data_conclusao_real || ''}"`,
      `"${op.status}"`,
      `"${op.prioridade}"`,
      `"${op.responsavel_tecnico}"`,
      `"${op.operador_baixa || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_producao_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImprimir = () => {
    window.print();
  };

  // Totais
  const totalPlanejado = ordensFiltradas.reduce((acc, curr) => acc + curr.quantidade_planejada, 0);
  const totalProduzido = ordensFiltradas.reduce((acc, curr) => acc + curr.quantidade_produzida, 0);
  const totalRefugo = ordensFiltradas.reduce((acc, curr) => acc + curr.quantidade_refugo, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Relatório de Acompanhamento de Produção
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
              {ordensFiltradas.length} ordens filtradas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Relatório gerencial consolidado para acompanhamento de metas, refugo, prazos e assinatura técnica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Exportar CSV
          </button>
          <button
            onClick={handleImprimir}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Filters (hidden on print) */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 print:hidden">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filtros:</span>
        </div>

        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
        >
          <option value="TODOS">Todos os Status</option>
          <option value="PLANEJADA">Planejada</option>
          <option value="AGUARDANDO_INSUMOS">Aguardando Insumos</option>
          <option value="EM_PRODUCAO">Em Produção</option>
          <option value="CONTROLE_QUALIDADE">Controle de Qualidade</option>
          <option value="CONCLUIDA">Concluída</option>
        </select>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Início:</span>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="px-2 py-1 border border-slate-300 rounded-lg text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Término:</span>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="px-2 py-1 border border-slate-300 rounded-lg text-xs"
          />
        </div>

        {(dataInicio || dataFim || filtroStatus !== 'TODOS') && (
          <button
            onClick={() => {
              setFiltroStatus('TODOS');
              setDataInicio('');
              setDataFim('');
            }}
            className="text-xs font-bold text-amber-700 hover:underline"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Documento Formatado (Visual na tela e perfeito para impressão) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs print:p-0 print:border-none print:shadow-none">
        {/* Cabeçalho do Relatório */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-base font-extrabold uppercase text-slate-950">
              {config?.nome_empresa || 'MetalTech Manufatura & Design Ltda'}
            </h2>
            <p className="text-xs text-slate-500">
              Departamento de Planejamento e Controle de Produção (PCP) • Relatório Oficial
            </p>
          </div>
          <div className="text-right text-xs">
            <span className="font-semibold text-slate-700">Emissão: </span>
            <span className="font-mono">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        {/* Resumo de Metas */}
        <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Planejado</span>
            <span className="text-lg font-black text-slate-900">{totalPlanejado} un</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Produzido</span>
            <span className="text-lg font-black text-emerald-700">{totalProduzido} un</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Refugado (Perda)</span>
            <span className="text-lg font-black text-red-600">{totalRefugo} un</span>
          </div>
        </div>

        {/* Tabela do Relatório */}
        <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">OP #</th>
                <th className="py-2.5 px-3">Produto</th>
                <th className="py-2.5 px-3">Destino / Cliente</th>
                <th className="py-2.5 px-3 text-right">Planejado</th>
                <th className="py-2.5 px-3 text-right">Produzido</th>
                <th className="py-2.5 px-3 text-center">Início Previsto</th>
                <th className="py-2.5 px-3 text-center">Término Previsto</th>
                <th className="py-2.5 px-3 text-center">Data Real</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {ordensFiltradas.map((op) => (
                <tr key={op.id}>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">{op.numero_op}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">
                    {op.prod_nome}
                    <span className="text-[10px] text-slate-400 font-mono ml-1">({op.prod_codigo})</span>
                  </td>
                  <td className="py-2 px-3 text-slate-700">{op.cliente_nome || 'Estoque'}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{op.quantidade_planejada}</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-700">{op.quantidade_produzida}</td>
                  <td className="py-2 px-3 text-center text-slate-600">{op.data_inicio_prevista}</td>
                  <td className="py-2 px-3 text-center text-slate-600">{op.data_fim_prevista}</td>
                  <td className="py-2 px-3 text-center text-slate-600">{op.data_conclusao_real || '-'}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="font-bold uppercase text-[10px]">
                      {op.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé Oficial com Responsável Técnico */}
        <div className="border-t-2 border-slate-900 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Responsável Técnico Emitente
              </span>
              <div className="font-extrabold text-slate-950 text-sm">
                {config?.responsavel_tecnico || 'Engenharia de Produção'}
              </div>
              <div className="text-slate-600 text-[11px]">
                {config?.cargo_responsavel || 'Gerente de PCP'} • {config?.registro_profissional || 'CREA/CRQ'}
              </div>
            </div>
          </div>

          <div className="w-64 text-center">
            <div className="border-b border-slate-900 h-8 mb-1"></div>
            <span className="text-[10px] text-slate-500 uppercase font-medium">Assinatura do Responsável Técnico</span>
          </div>
        </div>
      </div>
    </div>
  );
};
