export interface ConfigEmpresa {
  id: number;
  nome_empresa: string;
  cnpj: string;
  responsavel_tecnico: string;
  cargo_responsavel: string;
  registro_profissional: string;
  email: string;
  telefone: string;
  cidade_uf: string;
  updated_at?: string;
}

export interface MateriaPrima {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  categoria: string;
  unidade_medida: string;
  custo_unitario: number;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_critico?: number;
  created_at: string;
  updated_at: string;
}

export interface PostoCapacidade {
  id: number;
  nome_posto: string;
  setor: string;
  capacidade_max_periodo: number;
  unidade_capacidade: string;
  turnos: number;
  eficiencia_oee: number;
  responsavel_setor: string;
  status: 'ATIVO' | 'MANUTENCAO' | 'INATIVO';
}

export interface ProdutoInsumo {
  id?: number;
  produto_id?: number;
  materia_prima_id: number;
  quantidade_necessaria: number;
  observacoes?: string;
  mp_codigo?: string;
  mp_nome?: string;
  mp_unidade?: string;
  mp_custo?: number;
  mp_estoque?: number;
}

export interface ProdutoEtapa {
  id?: number;
  produto_id?: number;
  ordem: number;
  nome_etapa: string;
  duracao_minutos: number;
  posto_trabalho_id?: number | null;
  nome_posto?: string;
  setor?: string;
  instrucoes?: string;
}

export interface Produto {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  categoria: string;
  especificacoes_tecnicas: string;
  tempo_processo_minutos: number;
  unidade_medida: string;
  preco_venda_sugerido: number;
  estoque_acabado: number;
  custo_insumos?: number;
  insumos?: ProdutoInsumo[];
  etapas?: ProdutoEtapa[];
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: number;
  codigo: string;
  nome: string;
  tipo_pessoa: 'PJ' | 'PF';
  cpf_cnpj: string;
  contato_nome: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  uf: string;
  observacoes: string;
  created_at: string;
}

export interface Fornecedor {
  id: number;
  codigo: string;
  nome: string;
  cnpj: string;
  contato_nome: string;
  telefone: string;
  email: string;
  endereco: string;
  produtos_fornecidos: string;
  prazo_medio_dias: number;
  observacoes: string;
  created_at: string;
}

export interface PedidoItem {
  id?: number;
  pedido_id?: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  quantidade_atendida?: number;
  prod_codigo?: string;
  prod_nome?: string;
  tempo_processo_minutos?: number;
  unidade_medida?: string;
}

export interface Pedido {
  id: number;
  numero_pedido: string;
  cliente_id: number;
  cliente_nome?: string;
  cliente_cnpj?: string;
  cliente_telefone?: string;
  cliente_cidade?: string;
  data_pedido: string;
  data_entrega_prometida: string;
  prioridade: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
  status: 'ORCAMENTO' | 'APROVADO' | 'EM_PRODUCAO' | 'CONCLUIDO' | 'ENTREGUE' | 'CANCELADO';
  valor_total: number;
  observacoes: string;
  itens?: PedidoItem[];
  ops?: {
    id: number;
    numero_op: string;
    status: string;
    quantidade_planejada: number;
    quantidade_produzida: number;
    data_fim_prevista: string;
  }[];
  created_at: string;
}

export interface OrdemProducaoMaterial {
  id: number;
  ordem_producao_id: number;
  materia_prima_id: number;
  quantidade_planejada: number;
  quantidade_consumida: number;
  status_separacao: 'PENDENTE' | 'SEPARADO' | 'CONSUMIDO';
  mp_codigo?: string;
  mp_nome?: string;
  mp_unidade?: string;
  mp_estoque_atual?: number;
  mp_custo?: number;
}

export interface OrdemProducao {
  id: number;
  numero_op: string;
  pedido_id?: number | null;
  numero_pedido?: string;
  pedido_data_entrega?: string;
  cliente_nome?: string;
  cliente_contato?: string;
  cliente_telefone?: string;
  cliente_cidade?: string;
  cliente_uf?: string;
  produto_id: number;
  prod_codigo?: string;
  prod_nome?: string;
  prod_descricao?: string;
  especificacoes_tecnicas?: string;
  prod_unidade?: string;
  tempo_processo_minutos?: number;
  quantidade_planejada: number;
  quantidade_produzida: number;
  quantidade_refugo: number;
  data_emissao: string;
  data_inicio_prevista: string;
  data_fim_prevista: string;
  data_inicio_real?: string | null;
  data_conclusao_real?: string | null;
  status: 'PLANEJADA' | 'AGUARDANDO_INSUMOS' | 'EM_PRODUCAO' | 'CONTROLE_QUALIDADE' | 'CONCLUIDA' | 'CANCELADA';
  prioridade: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
  responsavel_tecnico: string;
  operador_baixa?: string | null;
  observacoes_producao?: string;
  materiais?: OrdemProducaoMaterial[];
  etapas?: ProdutoEtapa[];
  empresa?: ConfigEmpresa;
  estoque_suficiente?: boolean;
  tempo_total_horas?: number;
  tempo_total_estimado_min?: number;
  created_at: string;
}

export interface DashboardStats {
  total_ops: number;
  ops_por_status: {
    PLANEJADA: number;
    AGUARDANDO_INSUMOS: number;
    EM_PRODUCAO: number;
    CONTROLE_QUALIDADE: number;
    CONCLUIDA: number;
    CANCELADA: number;
  };
  total_pedidos: number;
  faturamento_total: number;
  materias_criticas: {
    id: number;
    codigo: string;
    nome: string;
    unidade_medida: string;
    estoque_atual: number;
    estoque_minimo: number;
  }[];
  postos_capacidade: {
    id: number;
    nome_posto: string;
    setor: string;
    capacidade_max_periodo: number;
    unidade_capacidade: string;
    eficiencia_oee: number;
    status: string;
  }[];
  taxa_pontualidade: number;
  ordens_recentes: OrdemProducao[];
}

export interface MovimentacaoEstoque {
  id: number;
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'CONSUMO_OP' | 'ENTRADA_OP';
  materia_prima_id?: number | null;
  produto_id?: number | null;
  ordem_producao_id?: number | null;
  quantidade: number;
  data_movimento: string;
  usuario: string;
  justificativa: string;
}
