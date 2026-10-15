import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'pcp_erp.sqlite');

let dbInstance: Database | null = null;
let SQL: SqlJsStatic | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Aviso: Erro ao carregar arquivo existente de banco de dados, criando novo:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Ativar foreign keys
  dbInstance.run('PRAGMA foreign_keys = ON;');

  initSchema(dbInstance);
  persistDb();

  return dbInstance;
}

export function persistDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Erro ao persistir banco de dados no disco:', err);
  }
}

function initSchema(db: Database) {
  db.run(`
    -- Configuração da Empresa e Responsável Técnico
    CREATE TABLE IF NOT EXISTS config_empresa (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      nome_empresa TEXT NOT NULL,
      cnpj TEXT,
      responsavel_tecnico TEXT NOT NULL,
      cargo_responsavel TEXT,
      registro_profissional TEXT,
      email TEXT,
      telefone TEXT,
      cidade_uf TEXT,
      updated_at TEXT
    );

    -- Matérias-Primas (Insumos)
    CREATE TABLE IF NOT EXISTS materias_primas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      descricao TEXT,
      categoria TEXT NOT NULL,
      unidade_medida TEXT NOT NULL,
      custo_unitario REAL NOT NULL DEFAULT 0,
      estoque_atual REAL NOT NULL DEFAULT 0,
      estoque_minimo REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Clientes
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      tipo_pessoa TEXT NOT NULL DEFAULT 'PJ',
      cpf_cnpj TEXT,
      contato_nome TEXT,
      telefone TEXT,
      email TEXT,
      endereco TEXT,
      cidade TEXT,
      uf TEXT,
      observacoes TEXT,
      created_at TEXT NOT NULL
    );

    -- Fornecedores
    CREATE TABLE IF NOT EXISTS fornecedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      cnpj TEXT,
      contato_nome TEXT,
      telefone TEXT,
      email TEXT,
      endereco TEXT,
      produtos_fornecidos TEXT,
      prazo_medio_dias INTEGER DEFAULT 5,
      observacoes TEXT,
      created_at TEXT NOT NULL
    );

    -- Postos de Trabalho / Capacidade Produtiva
    CREATE TABLE IF NOT EXISTS postos_capacidade (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_posto TEXT NOT NULL,
      setor TEXT NOT NULL,
      capacidade_max_periodo REAL NOT NULL,
      unidade_capacidade TEXT NOT NULL DEFAULT 'horas/dia',
      turnos INTEGER NOT NULL DEFAULT 1,
      eficiencia_oee REAL NOT NULL DEFAULT 85,
      responsavel_setor TEXT,
      status TEXT NOT NULL DEFAULT 'ATIVO'
    );

    -- Produtos Acabados
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      descricao TEXT,
      categoria TEXT NOT NULL,
      especificacoes_tecnicas TEXT,
      tempo_processo_minutos INTEGER NOT NULL DEFAULT 60,
      unidade_medida TEXT NOT NULL DEFAULT 'un',
      preco_venda_sugerido REAL NOT NULL DEFAULT 0,
      estoque_acabado REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Ficha Técnica / BOM (Bill of Materials - Insumos por produto)
    CREATE TABLE IF NOT EXISTS produto_insumos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
      materia_prima_id INTEGER NOT NULL REFERENCES materias_primas(id) ON DELETE RESTRICT,
      quantidade_necessaria REAL NOT NULL,
      observacoes TEXT,
      UNIQUE(produto_id, materia_prima_id)
    );

    -- Etapas de Roteiro de Produção por Produto
    CREATE TABLE IF NOT EXISTS produto_roteiro_etapas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
      ordem INTEGER NOT NULL,
      nome_etapa TEXT NOT NULL,
      duracao_minutos INTEGER NOT NULL,
      posto_trabalho_id INTEGER REFERENCES postos_capacidade(id) ON DELETE SET NULL,
      instrucoes TEXT
    );

    -- Pedidos de Venda
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_pedido TEXT UNIQUE NOT NULL,
      cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
      data_pedido TEXT NOT NULL,
      data_entrega_prometida TEXT NOT NULL,
      prioridade TEXT NOT NULL DEFAULT 'NORMAL',
      status TEXT NOT NULL DEFAULT 'APROVADO',
      valor_total REAL NOT NULL DEFAULT 0,
      observacoes TEXT,
      created_at TEXT NOT NULL
    );

    -- Itens do Pedido
    CREATE TABLE IF NOT EXISTS pedido_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
      produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
      quantidade REAL NOT NULL,
      preco_unitario REAL NOT NULL DEFAULT 0,
      quantidade_atendida REAL NOT NULL DEFAULT 0
    );

    -- Ordens de Produção (OP)
    CREATE TABLE IF NOT EXISTS ordens_producao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_op TEXT UNIQUE NOT NULL,
      pedido_id INTEGER REFERENCES pedidos(id) ON DELETE SET NULL,
      produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
      quantidade_planejada REAL NOT NULL,
      quantidade_produzida REAL NOT NULL DEFAULT 0,
      quantidade_refugo REAL NOT NULL DEFAULT 0,
      data_emissao TEXT NOT NULL,
      data_inicio_prevista TEXT NOT NULL,
      data_fim_prevista TEXT NOT NULL,
      data_inicio_real TEXT,
      data_conclusao_real TEXT,
      status TEXT NOT NULL DEFAULT 'PLANEJADA',
      prioridade TEXT NOT NULL DEFAULT 'NORMAL',
      responsavel_tecnico TEXT NOT NULL,
      operador_baixa TEXT,
      observacoes_producao TEXT,
      created_at TEXT NOT NULL
    );

    -- Materiais Reservados/Consumidos na OP
    CREATE TABLE IF NOT EXISTS ordem_producao_materiais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ordem_producao_id INTEGER NOT NULL REFERENCES ordens_producao(id) ON DELETE CASCADE,
      materia_prima_id INTEGER NOT NULL REFERENCES materias_primas(id) ON DELETE RESTRICT,
      quantidade_planejada REAL NOT NULL,
      quantidade_consumida REAL NOT NULL DEFAULT 0,
      status_separacao TEXT NOT NULL DEFAULT 'PENDENTE'
    );

    -- Histórico de Movimentações de Estoque
    CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      materia_prima_id INTEGER REFERENCES materias_primas(id) ON DELETE SET NULL,
      produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
      ordem_producao_id INTEGER REFERENCES ordens_producao(id) ON DELETE SET NULL,
      quantidade REAL NOT NULL,
      data_movimento TEXT NOT NULL,
      usuario TEXT,
      justificativa TEXT
    );
  `);

  // Se a tabela de config estiver vazia, inserir dados padrão
  const checkConfig = db.exec('SELECT COUNT(*) as count FROM config_empresa');
  const count = checkConfig.length > 0 && checkConfig[0].values[0][0] ? Number(checkConfig[0].values[0][0]) : 0;
  if (count === 0) {
    seedInitialData(db);
  }
}

export function seedInitialData(db: Database) {
  const now = new Date().toISOString().split('T')[0];

  // Limpar tabelas caso seja um reset
  db.run(`
    DELETE FROM movimentacoes_estoque;
    DELETE FROM ordem_producao_materiais;
    DELETE FROM ordens_producao;
    DELETE FROM pedido_itens;
    DELETE FROM pedidos;
    DELETE FROM produto_roteiro_etapas;
    DELETE FROM produto_insumos;
    DELETE FROM produtos;
    DELETE FROM postos_capacidade;
    DELETE FROM fornecedores;
    DELETE FROM clientes;
    DELETE FROM materias_primas;
    DELETE FROM config_empresa;
  `);

  // 1. Configuração da Empresa e Responsável Técnico
  db.run(`
    INSERT INTO config_empresa (
      id, nome_empresa, cnpj, responsavel_tecnico, cargo_responsavel,
      registro_profissional, email, telefone, cidade_uf, updated_at
    ) VALUES (
      1,
      'MetalTech Manufatura & Design Ltda',
      '28.945.102/0001-83',
      'Eng. Carlos Eduardo Ramos',
      'Gerente de Engenharia & PCP',
      'CREA-SP 506.842.119-0',
      'pcp@metaltechdesign.ind.br',
      '(11) 4892-3300',
      'São Bernardo do Campo - SP',
      '${now}'
    );
  `);

  // 2. Fornecedores
  db.run(`
    INSERT INTO fornecedores (codigo, nome, cnpj, contato_nome, telefone, email, endereco, produtos_fornecidos, prazo_medio_dias, observacoes, created_at)
    VALUES
      ('FORN-01', 'AçoFort Perfis e Tubos S.A.', '11.222.333/0001-44', 'Roberto Silva', '(11) 3214-5500', 'vendas@acofort.com.br', 'Av. Industrial, 1400 - Mauá/SP', 'Tubos quadrados 40x40, Cantoneiras, Chapas de Aço Carbono', 3, 'Excelente pontualidade', '${now}'),
      ('FORN-02', 'Painéis WoodArt MDF & Madeiras', '44.555.666/0001-77', 'Ana Beatriz Prado', '(15) 3901-2244', 'contato@woodartpaineis.com.br', 'Rod. Castelo Branco, km 82 - Sorocaba/SP', 'Chapas MDF Naval 18mm, Lâminas Carvalho e Freijó', 5, 'Madeira certificada FSC', '${now}'),
      ('FORN-03', 'Tintas Eletrostáticas ColorMax', '66.777.888/0001-99', 'Marcos Aurélio', '(19) 3450-8900', 'pedidos@colormax.com.br', 'Distrito Industrial II - Campinas/SP', 'Tinta Pó Epóxi Preto Fosco Texturizado, Branco Puro', 2, 'Fornecedor de tintas epóxi certificadas', '${now}'),
      ('FORN-04', 'FixaFácil Fixadores Industriais', '88.999.000/0001-11', 'Juliana Mendes', '(11) 2987-1234', 'sac@fixafacil.com.br', 'Rua dos Parafusos, 350 - Guarulhos/SP', 'Parafusos sextavados M8, Porcas, Arruelas, Sapatas niveladoras', 2, 'Entrega rápida em 48h', '${now}');
  `);

  // 3. Matérias-Primas
  db.run(`
    INSERT INTO materias_primas (codigo, nome, descricao, categoria, unidade_medida, custo_unitario, estoque_atual, estoque_minimo, created_at, updated_at)
    VALUES
      ('MP-001', 'Tubo de Aço Carbono 40x40x1.5mm', 'Tubo quadrado estrutural em barras de 6 metros', 'Metais', 'm', 24.50, 180.0, 50.0, '${now}', '${now}'),
      ('MP-002', 'Chapa de MDF Naval 18mm (Carvalho)', 'Chapa de MDF com acabamento melamínico carvalho 2.75x1.83m', 'Madeiras', 'm²', 68.00, 45.0, 15.0, '${now}', '${now}'),
      ('MP-003', 'Tinta Epóxi a Pó Preto Fosco', 'Tinta em pó para pintura eletrostática cura a 200°C', 'Químicos / Pintura', 'kg', 32.00, 60.0, 20.0, '${now}', '${now}'),
      ('MP-004', 'Parafuso Allen Abaulado M8x45mm', 'Parafuso em aço zincado preto com rosca métrica', 'Fixadores', 'un', 1.20, 850.0, 200.0, '${now}', '${now}'),
      ('MP-005', 'Sapata Regulável Niveladora Emborrachada', 'Pé nivelador anti-risco rosca M8x25mm', 'Acessórios', 'un', 4.50, 240.0, 60.0, '${now}', '${now}'),
      ('MP-006', 'Cantoneira de Aço 1" x 1/8"', 'Barra de cantoneira laminada para reforço de cantos', 'Metais', 'm', 16.80, 95.0, 30.0, '${now}', '${now}'),
      ('MP-007', 'Chapa de Aço Perfurada 1.2mm', 'Chapa decorativa com furos hexagonais para estantes', 'Metais', 'm²', 95.00, 8.0, 12.0, '${now}', '${now}');
  `);

  // 4. Postos de Trabalho / Capacidade Produtiva
  db.run(`
    INSERT INTO postos_capacidade (nome_posto, setor, capacidade_max_periodo, unidade_capacidade, turnos, eficiencia_oee, responsavel_setor, status)
    VALUES
      ('Corte, Dobra e Perfilamento', 'Usinagem / Serralheria', 8.0, 'horas/dia', 1, 88.0, 'Mestre Valdir', 'ATIVO'),
      ('Célula de Solda MIG/TIG', 'Soldagem e Caldeiraria', 8.0, 'horas/dia', 1, 82.0, 'Fabiano Soldador', 'ATIVO'),
      ('Cabine de Pintura Eletrostática', 'Tratamento & Pintura', 7.5, 'horas/dia', 1, 90.0, 'Glauber Pintor', 'ATIVO'),
      ('Marcenaria e Corte CNC', 'Madeira / Acabamento', 8.0, 'horas/dia', 1, 85.0, 'Marceneiro Otávio', 'ATIVO'),
      ('Bancada de Montagem e Embalagem', 'Montagem Final', 8.0, 'horas/dia', 1, 95.0, 'Danilo Supervisor', 'ATIVO');
  `);

  // 5. Produtos
  db.run(`
    INSERT INTO produtos (codigo, nome, descricao, categoria, especificacoes_tecnicas, tempo_processo_minutos, unidade_medida, preco_venda_sugerido, estoque_acabado, created_at, updated_at)
    VALUES
      ('PRD-101', 'Mesa de Trabalho Industrial Loft 160x80cm', 'Mesa corporativa estilo industrial com pés metálicos e tampo em MDF carvalho.', 'Móveis Corporativos', 'Dimensões: 160x80x75cm (LxPxA); Estrutura: Tubo 40x40mm com pintura epóxi preto fosco; Tampo: MDF Naval 18mm com borda engrossada 36mm; Carga máx: 150kg.', 120, 'un', 890.00, 4.0, '${now}', '${now}'),
      ('PRD-102', 'Estante Modular Iron Tower 5 Prateleiras', 'Estante vertical reforçada com perfis de aço e prateleiras em MDF.', 'Móveis Corporativos', 'Dimensões: 90x40x190cm (LxPxA); 5 prateleiras com vão livre de 35cm; Aço carbono tratado com epóxi preto texturizado.', 90, 'un', 720.00, 2.0, '${now}', '${now}'),
      ('PRD-103', 'Banco Alto Banqueta Minimalista IronBar', 'Banqueta alta para bancadas e ilhas com assento em madeira maciça/MDF.', 'Assentos & Cadeiras', 'Dimensões: 35x35x75cm; Estrutura monobloco soldada com apoio para pés e sapatas plásticas; Peso: 4.8kg.', 45, 'un', 240.00, 8.0, '${now}', '${now}');
  `);

  // 6. Ficha Técnica / BOM (Insumos dos produtos)
  // Mesa (PRD-101) -> Tubo de aço (6.5m), MDF (1.4m²), Tinta (0.8kg), Parafusos (16un), Sapatas (4un)
  db.run(`
    INSERT INTO produto_insumos (produto_id, materia_prima_id, quantidade_necessaria, observacoes)
    VALUES
      (1, 1, 6.5, 'Perfis soldados para a base retangular e pernas'),
      (1, 2, 1.4, 'Tampo 160x80cm com acabamento de borda'),
      (1, 3, 0.8, 'Pintura eletrostática da base'),
      (1, 4, 16.0, 'Fixação do tampo na base de aço'),
      (1, 5, 4.0, 'Sapatas nos 4 pés niveladores');
  `);

  // Estante (PRD-102) -> Tubo (12m), Cantoneira (4m), MDF (1.8m²), Tinta (1.2kg), Parafusos (24un), Sapatas (4un)
  db.run(`
    INSERT INTO produto_insumos (produto_id, materia_prima_id, quantidade_necessaria, observacoes)
    VALUES
      (2, 1, 12.0, 'Colunas principais e travessas'),
      (2, 6, 4.0, 'Suportes das prateleiras'),
      (2, 2, 1.8, '5 prateleiras cortadas 90x40cm'),
      (2, 3, 1.2, 'Pintura total da estrutura'),
      (2, 4, 24.0, 'Montagem modular'),
      (2, 5, 4.0, 'Niveladores');
  `);

  // Banqueta (PRD-103) -> Tubo (3.8m), MDF (0.2m²), Tinta (0.4kg), Parafusos (4un), Sapatas (4un)
  db.run(`
    INSERT INTO produto_insumos (produto_id, materia_prima_id, quantidade_necessaria, observacoes)
    VALUES
      (3, 1, 3.8, 'Pés e aro de apoio'),
      (3, 2, 0.2, 'Assento quadrado 32x32cm'),
      (3, 3, 0.4, 'Pintura da armação'),
      (3, 4, 4.0, 'Fixação do assento'),
      (3, 5, 4.0, 'Sapatas antiderrapantes');
  `);

  // 7. Etapas de Roteiro
  // Mesa (PRD-101)
  db.run(`
    INSERT INTO produto_roteiro_etapas (produto_id, ordem, nome_etapa, duracao_minutos, posto_trabalho_id, instrucoes)
    VALUES
      (1, 1, 'Corte e Esquadrejamento de Tubos', 25, 1, 'Cortar peças conforme plano de corte PC-101 com tolerância +-0.5mm'),
      (1, 2, 'Soldagem da Estrutura Metálica', 35, 2, 'Soldagem TIG nos cantos e polimento dos cordões aparentes'),
      (1, 3, 'Pintura Eletrostática Epóxi', 30, 3, 'Desengraxe prévio, aplicação a pó e polimerização em estufa 200°C por 15min'),
      (1, 4, 'Corte e Fita de Borda do Tampo', 15, 4, 'Colagem de borda ABS 1mm nos 4 lados'),
      (1, 5, 'Montagem, Inspeção e Embalagem', 15, 5, 'União tampo/base, verificação de nivelamento e embalagem protetora');
  `);

  // 8. Clientes
  db.run(`
    INSERT INTO clientes (codigo, nome, tipo_pessoa, cpf_cnpj, contato_nome, telefone, email, endereco, cidade, uf, observacoes, created_at)
    VALUES
      ('CLI-001', 'Arquitextura Coworking & Offices', 'PJ', '19.882.341/0001-12', 'Helena Fonseca', '(11) 98765-4321', 'compras@arquitextura.com.br', 'Av. Paulista, 2100 - Cj 802', 'São Paulo', 'SP', 'Cliente corporativo com projetos recorrentes de mobiliário', '${now}'),
      ('CLI-002', 'Studio Alfa Arquitetura de Interiores', 'PJ', '32.114.998/0001-45', 'Lucas Nogueira', '(11) 99123-8877', 'lucas@studioalfa.arq.br', 'Rua Oscar Freire, 850', 'São Paulo', 'SP', 'Exige padrão de acabamento nobre sem respingos de solda', '${now}'),
      ('CLI-003', 'Restaurante & Bar Cervejaria Central', 'PJ', '05.678.910/0001-33', 'Mateus Becker', '(11) 4567-8910', 'financeiro@cervejariacentral.com.br', 'Rua dos Pinheiros, 450', 'São Paulo', 'SP', 'Pedido de banquetas para abertura de nova filial', '${now}');
  `);

  // 9. Pedidos
  db.run(`
    INSERT INTO pedidos (numero_pedido, cliente_id, data_pedido, data_entrega_prometida, prioridade, status, valor_total, observacoes, created_at)
    VALUES
      ('PED-2026-001', 1, '${now}', '2026-10-25', 'ALTA', 'EM_PRODUCAO', 8900.00, 'Lote de 10 mesas para novo andar do coworking', '${now}'),
      ('PED-2026-002', 2, '${now}', '2026-10-28', 'NORMAL', 'APROVADO', 3600.00, '5 estantes para biblioteca do escritório', '${now}'),
      ('PED-2026-003', 3, '${now}', '2026-10-22', 'URGENTE', 'EM_PRODUCAO', 2880.00, '12 banquetas altas para balcão de chopp', '${now}');
  `);

  // Itens dos Pedidos
  db.run(`
    INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario, quantidade_atendida)
    VALUES
      (1, 1, 10.0, 890.00, 4.0),
      (2, 2, 5.0, 720.00, 0.0),
      (3, 3, 12.0, 240.00, 12.0);
  `);

  // 10. Ordens de Produção (OP)
  db.run(`
    INSERT INTO ordens_producao (
      numero_op, pedido_id, produto_id, quantidade_planejada, quantidade_produzida,
      quantidade_refugo, data_emissao, data_inicio_prevista, data_fim_prevista,
      data_inicio_real, data_conclusao_real, status, prioridade, responsavel_tecnico,
      operador_baixa, observacoes_producao, created_at
    ) VALUES
      ('OP-2026-001', 1, 1, 10.0, 4.0, 0.0, '${now}', '${now}', '2026-10-24', '${now}', NULL, 'EM_PRODUCAO', 'ALTA', 'Eng. Carlos Eduardo Ramos', NULL, 'Produção das primeiras 4 unidades concluída na montagem. Faltam 6.', '${now}'),
      ('OP-2026-002', 2, 2, 5.0, 0.0, 0.0, '${now}', '2026-10-18', '2026-10-26', NULL, NULL, 'AGUARDANDO_INSUMOS', 'NORMAL', 'Eng. Carlos Eduardo Ramos', NULL, 'Aguardando corte da cantoneira para estruturação.', '${now}'),
      ('OP-2026-003', 3, 3, 12.0, 12.0, 0.0, '${now}', '${now}', '${now}', '${now}', '${now}', 'CONCLUIDA', 'URGENTE', 'Eng. Carlos Eduardo Ramos', 'Marcio Antunes (Líder Turno)', 'Lote inspecionado e aprovado 100% sem defeitos. Pronto para expedição.', '${now}'),
      ('OP-2026-004', NULL, 1, 4.0, 0.0, 0.0, '${now}', '2026-10-26', '2026-10-29', NULL, NULL, 'PLANEJADA', 'NORMAL', 'Eng. Carlos Eduardo Ramos', NULL, 'Ordem interna para reposição de estoque de segurança.', '${now}');
  `);

  // Materiais das OPs
  // OP-1 (10 Mesas): Tubo (65m), MDF (14m²), Tinta (8kg), Parafusos (160un), Sapatas (40un)
  db.run(`
    INSERT INTO ordem_producao_materiais (ordem_producao_id, materia_prima_id, quantidade_planejada, quantidade_consumida, status_separacao)
    VALUES
      (1, 1, 65.0, 26.0, 'SEPARADO'),
      (1, 2, 14.0, 5.6, 'SEPARADO'),
      (1, 3, 8.0, 3.2, 'SEPARADO'),
      (1, 4, 160.0, 64.0, 'SEPARADO'),
      (1, 5, 40.0, 16.0, 'SEPARADO');
  `);

  // OP-3 (12 Banquetas Concluída)
  db.run(`
    INSERT INTO ordem_producao_materiais (ordem_producao_id, materia_prima_id, quantidade_planejada, quantidade_consumida, status_separacao)
    VALUES
      (3, 1, 45.6, 45.6, 'CONSUMIDO'),
      (3, 2, 2.4, 2.4, 'CONSUMIDO'),
      (3, 3, 4.8, 4.8, 'CONSUMIDO'),
      (3, 4, 48.0, 48.0, 'CONSUMIDO'),
      (3, 5, 48.0, 48.0, 'CONSUMIDO');
  `);

  // Movimentação de estoque histórica
  db.run(`
    INSERT INTO movimentacoes_estoque (tipo, materia_prima_id, produto_id, ordem_producao_id, quantidade, data_movimento, usuario, justificativa)
    VALUES
      ('CONSUMO_OP', 1, NULL, 3, 45.6, '${now}', 'Carlos Eduardo', 'Baixa de tubos para OP-2026-003'),
      ('ENTRADA_OP', NULL, 3, 3, 12.0, '${now}', 'Marcio Antunes', 'Conclusão de 12 banquetas na OP-2026-003');
  `);
}

// Utilitários de execução e query tipados
export function queryAll<T = any>(db: Database, sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(db: Database, sql: string, params: any[] = []): T | null {
  const all = queryAll<T>(db, sql, params);
  return all.length > 0 ? all[0] : null;
}

export function executeRun(db: Database, sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  db.run(sql, params);
  const info = queryOne<{ id: number }>(db, 'SELECT last_insert_rowid() as id');
  persistDb();
  return {
    lastInsertRowid: info?.id || 0,
    changes: 1,
  };
}
