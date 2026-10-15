import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Building2,
  X,
  Check,
  RotateCcw,
  AlertTriangle,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { ConfigEmpresa } from '../types';

interface ConfiguracoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConfigEmpresa | null;
  onSave: (data: Partial<ConfigEmpresa>) => Promise<void>;
  onResetSeed: () => void;
  isResetting?: boolean;
}

export const ConfiguracoesModal: React.FC<ConfiguracoesModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onResetSeed,
  isResetting,
}) => {
  if (!isOpen) return null;

  const [nomeEmpresa, setNomeEmpresa] = useState(config?.nome_empresa || '');
  const [cnpj, setCnpj] = useState(config?.cnpj || '');
  const [responsavel, setResponsavel] = useState(config?.responsavel_tecnico || '');
  const [cargo, setCargo] = useState(config?.cargo_responsavel || '');
  const [registro, setRegistro] = useState(config?.registro_profissional || '');
  const [email, setEmail] = useState(config?.email || '');
  const [telefone, setTelefone] = useState(config?.telefone || '');
  const [cidadeUf, setCidadeUf] = useState(config?.cidade_uf || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setNomeEmpresa(config.nome_empresa || '');
      setCnpj(config.cnpj || '');
      setResponsavel(config.responsavel_tecnico || '');
      setCargo(config.cargo_responsavel || '');
      setRegistro(config.registro_profissional || '');
      setEmail(config.email || '');
      setTelefone(config.telefone || '');
      setCidadeUf(config.cidade_uf || '');
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responsavel.trim()) {
      setError('O nome do Responsável Técnico é obrigatório.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        nome_empresa: nomeEmpresa.trim(),
        cnpj: cnpj.trim(),
        responsavel_tecnico: responsavel.trim(),
        cargo_responsavel: cargo.trim(),
        registro_profissional: registro.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        cidade_uf: cidadeUf.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações.');
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
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Configurações da Empresa & Responsável Técnico</h3>
              <p className="text-xs text-slate-400">Dados estampados nas OPs e relatórios oficiais</p>
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

          {/* Destaque Responsável Técnico (Requisito Explícito) */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Credenciais do Responsável Técnico Oficial</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              O nome cadastrado aqui será impresso automaticamente em todas as Ordens de Produção (OP), fichas de processos e relatórios de acompanhamento como autorizador técnico.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nome do Responsável Técnico *
              </label>
              <input
                type="text"
                required
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Ex: Eng. Mariana Silva ou seu nome"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Cargo / Função
                </label>
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ex: Gerente de Engenharia & PCP"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Registro Profissional
                </label>
                <input
                  type="text"
                  value={registro}
                  onChange={(e) => setRegistro(e.target.value)}
                  placeholder="Ex: CREA-SP 506.842.119-0 ou CRQ"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Dados da Empresa */}
          <div className="space-y-3 pt-1">
            <span className="text-xs font-bold text-slate-800 uppercase block">
              Dados da Indústria / Manufatura:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razão Social</label>
                <input
                  type="text"
                  required
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CNPJ</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telefone</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail do PCP</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cidade / UF da Planta</label>
              <input
                type="text"
                value={cidadeUf}
                onChange={(e) => setCidadeUf(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Reset Demo Data Button */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onResetSeed}
              disabled={isResetting}
              className="text-xs font-medium text-slate-500 hover:text-amber-700 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              Restaurar Dados de Demonstração
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
