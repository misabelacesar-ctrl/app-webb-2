import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Clock,
  Gauge,
  User,
  Activity,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Factory
} from 'lucide-react';
import { PostoCapacidade } from '../types';

interface CapacidadeViewProps {
  postos: PostoCapacidade[];
  onRefresh: () => void;
  onCreatePosto: (data: Partial<PostoCapacidade>) => Promise<void>;
  onUpdatePosto: (id: number, data: Partial<PostoCapacidade>) => Promise<void>;
  onDeletePosto: (id: number) => Promise<void>;
}

export const CapacidadeView: React.FC<CapacidadeViewProps> = ({
  postos,
  onRefresh,
  onCreatePosto,
  onUpdatePosto,
  onDeletePosto,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [setor, setSetor] = useState('Usinagem / Caldeiraria');
  const [capacidade, setCapacidade] = useState<number>(8);
  const [unidade, setUnidade] = useState('horas/dia');
  const [turnos, setTurnos] = useState<number>(1);
  const [oee, setOee] = useState<number>(85);
  const [responsavel, setResponsavel] = useState('');
  const [status, setStatus] = useState<'ATIVO' | 'MANUTENCAO' | 'INATIVO'>('ATIVO');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenCreate = () => {
    setEditingId(null);
    setNome('');
    setSetor('Usinagem / Caldeiraria');
    setCapacidade(8);
    setUnidade('horas/dia');
    setTurnos(1);
    setOee(85);
    setResponsavel('');
    setStatus('ATIVO');
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PostoCapacidade) => {
    setEditingId(p.id);
    setNome(p.nome_posto);
    setSetor(p.setor);
    setCapacidade(p.capacidade_max_periodo);
    setUnidade(p.unidade_capacidade || 'horas/dia');
    setTurnos(p.turnos || 1);
    setOee(p.eficiencia_oee || 85);
    setResponsavel(p.responsavel_setor || '');
    setStatus(p.status || 'ATIVO');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('O nome do posto de trabalho é obrigatório.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: Partial<PostoCapacidade> = {
        nome_posto: nome.trim(),
        setor: setor.trim(),
        capacidade_max_periodo: Number(capacidade),
        unidade_capacidade: unidade,
        turnos: Number(turnos),
        eficiencia_oee: Number(oee),
        responsavel_setor: responsavel.trim(),
        status,
      };

      if (editingId) {
        await onUpdatePosto(editingId, payload);
      } else {
        await onCreatePosto(payload);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar capacidade produtiva.');
    } finally {
      setLoading(false);
    }
  };

  const totalCapacidadeHoras = postos
    .filter((p) => p.status === 'ATIVO')
    .reduce((acc, curr) => acc + (curr.capacidade_max_periodo * curr.turnos), 0);

  const mediaOEE = postos.length > 0
    ? Math.round(postos.reduce((acc, curr) => acc + curr.eficiencia_oee, 0) / postos.length)
    : 85;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Capacidade Produtiva & Postos de Trabalho
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
              {postos.length} postos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Defina a capacidade máxima por período, linhas de montagem, turnos de trabalho e eficiência global (OEE) de cada célula fabril.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Posto / Linha
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Capacidade Ativa Total</span>
            <div className="text-lg font-extrabold text-slate-900">{totalCapacidadeHoras} horas/dia</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Eficiência Média (OEE)</span>
            <div className="text-lg font-extrabold text-emerald-700">{mediaOEE}%</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Postos em Operação</span>
            <div className="text-lg font-extrabold text-slate-900">
              {postos.filter((p) => p.status === 'ATIVO').length} de {postos.length}
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Postos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {postos.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                    p.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    p.status === 'MANUTENCAO' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {p.status}
                  </span>
                  <h3 className="font-bold text-slate-950 text-base mt-1.5 leading-snug">
                    {p.nome_posto}
                  </h3>
                  <div className="text-xs text-slate-500">{p.setor}</div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeletePosto(p.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Informações operacionais */}
              <div className="space-y-2 mt-4 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Capacidade Nominal:</span>
                  <span className="font-extrabold text-slate-950">
                    {p.capacidade_max_periodo} {p.unidade_capacidade}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Turnos de Trabalho:</span>
                  <span className="font-bold text-slate-800">{p.turnos} turno(s)</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Eficiência Prevista (OEE):</span>
                  <span className="font-extrabold text-emerald-700">{p.eficiencia_oee}%</span>
                </div>
                {p.responsavel_setor && (
                  <div className="flex items-center justify-between text-slate-600 border-t border-slate-100 pt-2">
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <User className="w-3 h-3" />
                      Líder do Posto:
                    </span>
                    <span className="font-semibold text-slate-900">{p.responsavel_setor}</span>
                  </div>
                )}
              </div>
            </div>

            {/* OEE Progress bar */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-medium">
                <span>Rendimento do Posto</span>
                <span>{p.eficiencia_oee}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, p.eficiencia_oee)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingId ? 'Editar Posto de Trabalho' : 'Cadastrar Posto de Trabalho'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Posto / Linha *</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Célula de Solda MIG/TIG"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Setor Fabril</label>
                <input
                  type="text"
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  placeholder="Ex: Usinagem, Caldeiraria, Pintura, Montagem..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Capacidade Máxima</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={capacidade}
                    onChange={(e) => setCapacidade(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unidade</label>
                  <input
                    type="text"
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    placeholder="horas/dia ou un/dia"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Turnos de Operação</label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={turnos}
                    onChange={(e) => setTurnos(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Eficiência OEE (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={oee}
                    onChange={(e) => setOee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Responsável / Encarregado</label>
                  <input
                    type="text"
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    placeholder="Nome do operador líder"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="ATIVO">ATIVO</option>
                    <option value="MANUTENCAO">MANUTENÇÃO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </div>
              </div>

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
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-xs cursor-pointer"
                >
                  {loading ? 'Salvando...' : 'Salvar Posto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
