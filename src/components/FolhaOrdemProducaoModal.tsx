import React, { useRef } from 'react';
import {
  Printer,
  X,
  Factory,
  ShieldCheck,
  QrCode,
  Calendar,
  AlertTriangle,
  User,
  Package,
  Layers,
  Wrench,
  CheckSquare
} from 'lucide-react';
import { OrdemProducao } from '../types';

interface FolhaOrdemProducaoModalProps {
  op: OrdemProducao | null;
  onClose: () => void;
}

export const FolhaOrdemProducaoModal: React.FC<FolhaOrdemProducaoModalProps> = ({ op, onClose }) => {
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!op) return null;

  const handlePrint = () => {
    window.print();
  };

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case 'URGENTE':
        return 'bg-red-100 text-red-800 border-red-300 font-bold';
      case 'ALTA':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
      case 'BAIXA':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-w-none print:w-full print:h-auto print:max-h-none print:rounded-none">
        {/* Top actions bar (hidden on print) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm tracking-wide">
              Emissão de Ordem de Produção — {op.numero_op}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir OP (A4 / PDF)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable document area */}
        <div ref={printContentRef} className="p-6 sm:p-8 overflow-y-auto print:p-2 print:overflow-visible text-slate-900 font-sans text-xs">
          {/* Header da Empresa & Identificação */}
          <div className="border-b-2 border-slate-800 pb-4 mb-4 flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-slate-900 text-amber-400 rounded-lg flex items-center justify-center border border-slate-700">
                <Factory className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase">
                  {op.empresa?.nome_empresa || 'MetalTech Manufatura & Design Ltda'}
                </h1>
                <p className="text-slate-600 font-medium">
                  CNPJ: {op.empresa?.cnpj || '28.945.102/0001-83'} | {op.empresa?.cidade_uf || 'São Bernardo do Campo - SP'}
                </p>
                <p className="text-slate-500">
                  Tel: {op.empresa?.telefone || '(11) 4892-3300'} | E-mail: {op.empresa?.email || 'pcp@metaltechdesign.ind.br'}
                </p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="px-3 py-1 bg-slate-900 text-amber-400 font-mono font-bold text-base rounded border border-slate-800 tracking-wider">
                {op.numero_op}
              </div>
              <div className="mt-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                FOLHA DE CHÃO DE FÁBRICA
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                <QrCode className="w-4 h-4 text-slate-700" />
                <span className="font-mono">REF-{op.id * 892}</span>
              </div>
            </div>
          </div>

          {/* Dados Principais do Planejamento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 mb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Data de Emissão</span>
              <span className="font-semibold text-slate-900">{op.data_emissao}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Prazo de Entrega (Término)</span>
              <span className="font-bold text-slate-950">{op.data_fim_prevista}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Prioridade</span>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] border uppercase ${getPrioridadeBadge(op.prioridade)}`}>
                {op.prioridade}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Status Operacional</span>
              <span className="font-bold text-amber-700 uppercase">{op.status.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Dados do Pedido e Cliente (se houver) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="border border-slate-200 rounded-lg p-3 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Cliente / Destino da Produção
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {op.cliente_nome ? op.cliente_nome : 'Produção Interna para Estoque de Segurança'}
              </div>
              {op.cliente_contato && (
                <div className="text-slate-600 text-[11px] mt-0.5">
                  Contato: {op.cliente_contato} {op.cliente_telefone && `• ${op.cliente_telefone}`}
                </div>
              )}
              {op.cliente_cidade && (
                <div className="text-slate-500 text-[10px]">
                  Localidade: {op.cliente_cidade} - {op.cliente_uf}
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Origem & Rastreabilidade do Pedido
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {op.numero_pedido ? `Venda: ${op.numero_pedido}` : 'Demanda Autônoma do PCP'}
              </div>
              <div className="text-slate-600 text-[11px] mt-0.5">
                Tempo Estimado Unitário: <span className="font-semibold">{op.tempo_processo_minutos || 60} minutos</span>
              </div>
              <div className="text-slate-500 text-[10px]">
                Carga Total Prevista: <span className="font-semibold">{Math.round((((op.tempo_processo_minutos || 60) * op.quantidade_planejada) / 60) * 10) / 10} horas-homem</span>
              </div>
            </div>
          </div>

          {/* Especificação do Produto */}
          <div className="border border-slate-300 rounded-lg p-3.5 mb-4 bg-amber-50/40">
            <div className="flex flex-wrap justify-between items-start gap-2 border-b border-amber-200/60 pb-2 mb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                  Produto a Fabricar
                </span>
                <h2 className="text-base font-extrabold text-slate-950">
                  {op.prod_nome} <span className="text-slate-500 font-mono text-xs font-normal">({op.prod_codigo})</span>
                </h2>
              </div>
              <div className="bg-amber-500 text-slate-950 font-black text-sm px-3 py-1 rounded shadow-xs">
                QUANTIDADE: {op.quantidade_planejada} {op.prod_unidade || 'un'}
              </div>
            </div>

            {op.especificacoes_tecnicas && (
              <div className="mt-1">
                <span className="text-[10px] uppercase font-bold text-slate-700 block mb-0.5">
                  Especificações Técnicas & Tolerâncias de Manufatura:
                </span>
                <p className="text-slate-800 bg-white p-2 rounded border border-slate-200 text-[11px] leading-relaxed whitespace-pre-line font-mono">
                  {op.especificacoes_tecnicas}
                </p>
              </div>
            )}
          </div>

          {/* 1. Lista de Separação de Matérias-Primas (Picking Almoxarifado) */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                1. Lista de Separação de Matérias-Primas (Almoxarifado / BOM)
              </h3>
              <span className="text-[10px] text-slate-500 italic">
                Separar antes de iniciar o roteiro
              </span>
            </div>
            <div className="border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold">
                    <th className="py-1.5 px-2.5 w-16">Código</th>
                    <th className="py-1.5 px-2.5">Descrição do Insumo</th>
                    <th className="py-1.5 px-2.5 text-right w-24">Qtd Calculada</th>
                    <th className="py-1.5 px-2.5 w-16">Unid</th>
                    <th className="py-1.5 px-2.5 text-center w-24">Status Separação</th>
                    <th className="py-1.5 px-2.5 text-center w-28">Visto Almoxarife</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {op.materiais && op.materiais.length > 0 ? (
                    op.materiais.map((mat) => (
                      <tr key={mat.id} className="hover:bg-slate-50/50">
                        <td className="py-1.5 px-2.5 font-mono text-slate-600">{mat.mp_codigo}</td>
                        <td className="py-1.5 px-2.5 font-medium text-slate-900">{mat.mp_nome}</td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-slate-950">
                          {mat.quantidade_planejada.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-600">{mat.mp_unidade}</td>
                        <td className="py-1.5 px-2.5 text-center">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            mat.status_separacao === 'CONSUMIDO' ? 'bg-emerald-100 text-emerald-800' :
                            mat.status_separacao === 'SEPARADO' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {mat.status_separacao}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-center">
                          <div className="w-full border-b border-dashed border-slate-400 h-4"></div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-2 px-2.5 text-center text-slate-400 italic">
                        Nenhum insumo cadastrado na ficha técnica.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Roteiro Operacional de Fabricação & Postos */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                2. Roteiro Operacional de Fabricação & Apontamentos de Chão de Fábrica
              </h3>
              <span className="text-[10px] text-slate-500 italic">
                Rubricar cada etapa após execução
              </span>
            </div>
            <div className="border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold">
                    <th className="py-1.5 px-2 w-10 text-center">#</th>
                    <th className="py-1.5 px-2 w-48">Etapa / Posto de Trabalho</th>
                    <th className="py-1.5 px-2">Instruções de Trabalho & Segurança</th>
                    <th className="py-1.5 px-2 w-16 text-center">Tempo Est.</th>
                    <th className="py-1.5 px-2 w-28 text-center">Início / Término</th>
                    <th className="py-1.5 px-2 w-24 text-center">Operador / Visto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {op.etapas && op.etapas.length > 0 ? (
                    op.etapas.map((etapa) => (
                      <tr key={etapa.id || etapa.ordem} className="hover:bg-slate-50/50">
                        <td className="py-2 px-2 text-center font-bold text-slate-600">{etapa.ordem}</td>
                        <td className="py-2 px-2">
                          <div className="font-bold text-slate-900">{etapa.nome_etapa}</div>
                          <div className="text-[10px] text-slate-500">{etapa.nome_posto || 'Posto Geral'}</div>
                        </td>
                        <td className="py-2 px-2 text-slate-700 text-[10px] leading-tight">
                          {etapa.instrucoes || 'Executar conforme desenho técnico e padrões de qualidade da empresa.'}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-slate-800">
                          {etapa.duracao_minutos} min
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="border border-slate-300 rounded px-1 py-0.5 text-[9px] text-slate-400">
                            __:__ às __:__
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="w-full border-b border-slate-400 h-4"></div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-2 px-2.5 text-center text-slate-400 italic">
                        Roteiro padrão não detalhado para este produto.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Checklist de Inspeção de Qualidade & Liberação */}
          <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 mb-4">
            <h3 className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 text-[11px] mb-2">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              3. Controle de Qualidade & Encerramento Operacional
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div className="border border-slate-200 bg-white p-2 rounded">
                <span className="font-semibold text-slate-600 block text-[10px] uppercase">Qtd Aprovada:</span>
                <div className="text-base font-extrabold text-emerald-700 mt-1">
                  {op.quantidade_produzida > 0 ? `${op.quantidade_produzida} ${op.prod_unidade}` : '____ un'}
                </div>
              </div>
              <div className="border border-slate-200 bg-white p-2 rounded">
                <span className="font-semibold text-slate-600 block text-[10px] uppercase">Qtd Refugada / Sucata:</span>
                <div className="text-base font-extrabold text-red-600 mt-1">
                  {op.quantidade_refugo > 0 ? `${op.quantidade_refugo} ${op.prod_unidade}` : '0 un'}
                </div>
              </div>
              <div className="border border-slate-200 bg-white p-2 rounded">
                <span className="font-semibold text-slate-600 block text-[10px] uppercase">Operador Responsável:</span>
                <div className="text-xs font-semibold text-slate-900 mt-1 truncate">
                  {op.operador_baixa || '____________________'}
                </div>
              </div>
              <div className="border border-slate-200 bg-white p-2 rounded">
                <span className="font-semibold text-slate-600 block text-[10px] uppercase">Data Conclusão Real:</span>
                <div className="text-xs font-semibold text-slate-900 mt-1">
                  {op.data_conclusao_real || '____/____/________'}
                </div>
              </div>
            </div>

            {op.observacoes_producao && (
              <div className="mt-2 text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                <span className="font-bold">Observações de Produção / Qualidade: </span>
                {op.observacoes_producao}
              </div>
            )}
          </div>

          {/* Assinatura Oficial do Responsável Técnico (Requisito obrigatório) */}
          <div className="border-2 border-slate-800 rounded-xl p-4 bg-slate-50/80 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Responsável Técnico Autorizador do PCP
                </span>
                <div className="font-extrabold text-slate-950 text-sm">
                  {op.responsavel_tecnico || op.empresa?.responsavel_tecnico || 'Eng. Responsável Técnico'}
                </div>
                <div className="text-slate-600 text-[11px]">
                  {op.empresa?.cargo_responsavel || 'Gerente de Engenharia & PCP'} • {op.empresa?.registro_profissional || 'CREA-SP 506.842.119-0'}
                </div>
              </div>
            </div>

            <div className="w-full sm:w-64 text-center">
              <div className="border-b-2 border-slate-900 pb-1 mb-1 h-8 flex items-end justify-center">
                <span className="text-[9px] text-slate-400 italic">Assinatura do Responsável Técnico</span>
              </div>
              <div className="text-[10px] text-slate-600 font-medium">
                Data de Liberação Técnica: {op.data_emissao}
              </div>
            </div>
          </div>

          <div className="mt-3 text-[9px] text-slate-400 text-center">
            Documento emitido pelo Sistema PCP Manufatura ERP • ID da Ordem: #{op.id} • Via única para acompanhamento fabril.
          </div>
        </div>
      </div>
    </div>
  );
};
