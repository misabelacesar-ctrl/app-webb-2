import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { getDb, persistDb, queryAll, queryOne, seedInitialData } from './src/server/db.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Inicializar SQLite
  const db = await getDb();

  // ==========================================
  // ROTAS DA API REST
  // ==========================================

  // 1. Configuração da Empresa e Responsável Técnico
  app.get('/api/config', (_req: Request, res: Response) => {
    try {
      const config = queryOne(db, 'SELECT * FROM config_empresa WHERE id = 1');
      res.json(config || {});
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/config', (req: Request, res: Response) => {
    try {
      const {
        nome_empresa, cnpj, responsavel_tecnico, cargo_responsavel,
        registro_profissional, email, telefone, cidade_uf
      } = req.body;

      const now = new Date().toISOString();
      db.run(`
        UPDATE config_empresa SET
          nome_empresa = ?,
          cnpj = ?,
          responsavel_tecnico = ?,
          cargo_responsavel = ?,
          registro_profissional = ?,
          email = ?,
          telefone = ?,
          cidade_uf = ?,
          updated_at = ?
        WHERE id = 1
      `, [nome_empresa, cnpj, responsavel_tecnico, cargo_responsavel, registro_profissional, email, telefone, cidade_uf, now]);

      persistDb();
      const updated = queryOne(db, 'SELECT * FROM config_empresa WHERE id = 1');
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Matérias-Primas (Insumos)
  app.get('/api/materias-primas', (_req: Request, res: Response) => {
    try {
      const rows = queryAll(db, `
        SELECT m.*,
          CASE WHEN m.estoque_atual <= m.estoque_minimo THEN 1 ELSE 0 END AS estoque_critico
        FROM materias_primas m
        ORDER BY m.nome ASC
      `);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/materias-primas', (req: Request, res: Response) => {
    try {
      const { codigo, nome, descricao, categoria, unidade_medida, custo_unitario, estoque_atual, estoque_minimo } = req.body;
      const now = new Date().toISOString().split('T')[0];

      db.run(`
        INSERT INTO materias_primas (codigo, nome, descricao, categoria, unidade_medida, custo_unitario, estoque_atual, estoque_minimo, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [codigo, nome, descricao || '', categoria || 'Geral', unidade_medida || 'un', Number(custo_unitario) || 0, Number(estoque_atual) || 0, Number(estoque_minimo) || 0, now, now]);

      persistDb();
      const novo = queryOne(db, 'SELECT * FROM materias_primas WHERE id = last_insert_rowid()');
      res.status(201).json(novo);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/materias-primas/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { codigo, nome, descricao, categoria, unidade_medida, custo_unitario, estoque_atual, estoque_minimo } = req.body;
      const now = new Date().toISOString().split('T')[0];

      db.run(`
        UPDATE materias_primas SET
          codigo = ?, nome = ?, descricao = ?, categoria = ?, unidade_medida = ?,
          custo_unitario = ?, estoque_atual = ?, estoque_minimo = ?, updated_at = ?
        WHERE id = ?
      `, [codigo, nome, descricao, categoria, unidade_medida, Number(custo_unitario) || 0, Number(estoque_atual) || 0, Number(estoque_minimo) || 0, now, id]);

      persistDb();
      const updated = queryOne(db, 'SELECT * FROM materias_primas WHERE id = ?', [id]);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/materias-primas/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      // Checar se está sendo usado em alguma ficha técnica
      const emUso = queryOne(db, 'SELECT COUNT(*) as total FROM produto_insumos WHERE materia_prima_id = ?', [id]);
      if (emUso && emUso.total > 0) {
        return res.status(400).json({
          error: `Esta matéria-prima está vinculada à ficha técnica de ${emUso.total} produto(s). Remova-a das fichas antes de excluir.`
        });
      }

      db.run('DELETE FROM materias_primas WHERE id = ?', [id]);
      persistDb();
      res.json({ success: true, message: 'Matéria-prima excluída com sucesso.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Ajuste manual de estoque de matéria-prima
  app.post('/api/materias-primas/:id/ajustar-estoque', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { quantidade, tipo, justificativa, usuario } = req.body;
      const mp = queryOne(db, 'SELECT * FROM materias_primas WHERE id = ?', [id]);
      if (!mp) return res.status(404).json({ error: 'Matéria-prima não encontrada' });

      const qtd = Number(quantidade);
      let novoEstoque = Number(mp.estoque_atual);
      if (tipo === 'ENTRADA') novoEstoque += qtd;
      else if (tipo === 'SAIDA') novoEstoque = Math.max(0, novoEstoque - qtd);
      else if (tipo === 'AJUSTE') novoEstoque = qtd;

      const now = new Date().toISOString();
      db.run('UPDATE materias_primas SET estoque_atual = ?, updated_at = ? WHERE id = ?', [novoEstoque, now.split('T')[0], id]);
      db.run(`
        INSERT INTO movimentacoes_estoque (tipo, materia_prima_id, quantidade, data_movimento, usuario, justificativa)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [tipo, id, qtd, now, usuario || 'Almoxarifado', justificativa || 'Ajuste operacional']);

      persistDb();
      const updated = queryOne(db, 'SELECT * FROM materias_primas WHERE id = ?', [id]);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 3. Produtos e Fichas Técnicas (BOM)
  app.get('/api/produtos', (_req: Request, res: Response) => {
    try {
      const produtos = queryAll(db, 'SELECT * FROM produtos ORDER BY nome ASC');
      // Adicionar insumos e etapas para cada produto
      const produtosCompletos = produtos.map((prod) => {
        const insumos = queryAll(db, `
          SELECT pi.*, mp.codigo as mp_codigo, mp.nome as mp_nome, mp.unidade_medida as mp_unidade, mp.custo_unitario as mp_custo, mp.estoque_atual as mp_estoque
          FROM produto_insumos pi
          JOIN materias_primas mp ON pi.materia_prima_id = mp.id
          WHERE pi.produto_id = ?
        `, [prod.id]);

        const etapas = queryAll(db, `
          SELECT pre.*, pc.nome_posto, pc.setor
          FROM produto_roteiro_etapas pre
          LEFT JOIN postos_capacidade pc ON pre.posto_trabalho_id = pc.id
          WHERE pre.produto_id = ?
          ORDER BY pre.ordem ASC
        `, [prod.id]);

        const custoEstimado = insumos.reduce((acc, curr) => acc + (curr.quantidade_necessaria * curr.mp_custo), 0);

        return {
          ...prod,
          custo_insumos: custoEstimado,
          insumos,
          etapas,
        };
      });

      res.json(produtosCompletos);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/produtos/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const prod = queryOne(db, 'SELECT * FROM produtos WHERE id = ?', [id]);
      if (!prod) return res.status(404).json({ error: 'Produto não encontrado' });

      const insumos = queryAll(db, `
        SELECT pi.*, mp.codigo as mp_codigo, mp.nome as mp_nome, mp.unidade_medida as mp_unidade, mp.custo_unitario as mp_custo, mp.estoque_atual as mp_estoque
        FROM produto_insumos pi
        JOIN materias_primas mp ON pi.materia_prima_id = mp.id
        WHERE pi.produto_id = ?
      `, [id]);

      const etapas = queryAll(db, `
        SELECT pre.*, pc.nome_posto, pc.setor
        FROM produto_roteiro_etapas pre
        LEFT JOIN postos_capacidade pc ON pre.posto_trabalho_id = pc.id
        WHERE pre.produto_id = ?
        ORDER BY pre.ordem ASC
      `, [id]);

      const custoEstimado = insumos.reduce((acc, curr) => acc + (curr.quantidade_necessaria * curr.mp_custo), 0);

      res.json({
        ...prod,
        custo_insumos: custoEstimado,
        insumos,
        etapas,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/produtos', (req: Request, res: Response) => {
    try {
      const {
        codigo, nome, descricao, categoria, especificacoes_tecnicas,
        tempo_processo_minutos, unidade_medida, preco_venda_sugerido, estoque_acabado,
        insumos, etapas
      } = req.body;

      const now = new Date().toISOString().split('T')[0];

      db.run(`
        INSERT INTO produtos (codigo, nome, descricao, categoria, especificacoes_tecnicas, tempo_processo_minutos, unidade_medida, preco_venda_sugerido, estoque_acabado, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        codigo, nome, descricao || '', categoria || 'Geral', especificacoes_tecnicas || '',
        Number(tempo_processo_minutos) || 60, unidade_medida || 'un',
        Number(preco_venda_sugerido) || 0, Number(estoque_acabado) || 0, now, now
      ]);

      const prodNovo = queryOne(db, 'SELECT id FROM produtos WHERE codigo = ?', [codigo]);
      const produtoId = prodNovo.id;

      // Inserir insumos da BOM
      if (Array.isArray(insumos)) {
        for (const item of insumos) {
          if (item.materia_prima_id && item.quantidade_necessaria > 0) {
            db.run(`
              INSERT INTO produto_insumos (produto_id, materia_prima_id, quantidade_necessaria, observacoes)
              VALUES (?, ?, ?, ?)
            `, [produtoId, Number(item.materia_prima_id), Number(item.quantidade_necessaria), item.observacoes || '']);
          }
        }
      }

      // Inserir etapas de roteiro
      if (Array.isArray(etapas)) {
        let order = 1;
        for (const etapa of etapas) {
          if (etapa.nome_etapa) {
            db.run(`
              INSERT INTO produto_roteiro_etapas (produto_id, ordem, nome_etapa, duracao_minutos, posto_trabalho_id, instrucoes)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [
              produtoId, order++, etapa.nome_etapa, Number(etapa.duracao_minutos) || 0,
              etapa.posto_trabalho_id ? Number(etapa.posto_trabalho_id) : null, etapa.instrucoes || ''
            ]);
          }
        }
      }

      persistDb();
      res.status(201).json({ id: produtoId, success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/produtos/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const {
        codigo, nome, descricao, categoria, especificacoes_tecnicas,
        tempo_processo_minutos, unidade_medida, preco_venda_sugerido, estoque_acabado,
        insumos, etapas
      } = req.body;

      const now = new Date().toISOString().split('T')[0];

      db.run(`
        UPDATE produtos SET
          codigo = ?, nome = ?, descricao = ?, categoria = ?, especificacoes_tecnicas = ?,
          tempo_processo_minutos = ?, unidade_medida = ?, preco_venda_sugerido = ?,
          estoque_acabado = ?, updated_at = ?
        WHERE id = ?
      `, [
        codigo, nome, descricao, categoria, especificacoes_tecnicas,
        Number(tempo_processo_minutos) || 60, unidade_medida,
        Number(preco_venda_sugerido) || 0, Number(estoque_acabado) || 0, now, id
      ]);

      // Atualizar insumos (BOM)
      if (Array.isArray(insumos)) {
        db.run('DELETE FROM produto_insumos WHERE produto_id = ?', [id]);
        for (const item of insumos) {
          if (item.materia_prima_id && item.quantidade_necessaria > 0) {
            db.run(`
              INSERT INTO produto_insumos (produto_id, materia_prima_id, quantidade_necessaria, observacoes)
              VALUES (?, ?, ?, ?)
            `, [id, Number(item.materia_prima_id), Number(item.quantidade_necessaria), item.observacoes || '']);
          }
        }
      }

      // Atualizar etapas
      if (Array.isArray(etapas)) {
        db.run('DELETE FROM produto_roteiro_etapas WHERE produto_id = ?', [id]);
        let order = 1;
        for (const etapa of etapas) {
          if (etapa.nome_etapa) {
            db.run(`
              INSERT INTO produto_roteiro_etapas (produto_id, ordem, nome_etapa, duracao_minutos, posto_trabalho_id, instrucoes)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [
              id, order++, etapa.nome_etapa, Number(etapa.duracao_minutos) || 0,
              etapa.posto_trabalho_id ? Number(etapa.posto_trabalho_id) : null, etapa.instrucoes || ''
            ]);
          }
        }
      }

      persistDb();
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/produtos/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const emOP = queryOne(db, 'SELECT COUNT(*) as total FROM ordens_producao WHERE produto_id = ?', [id]);
      if (emOP && emOP.total > 0) {
        return res.status(400).json({
          error: `Este produto possui ${emOP.total} Ordem(ns) de Produção associadas e não pode ser excluído.`
        });
      }

      db.run('DELETE FROM produto_roteiro_etapas WHERE produto_id = ?', [id]);
      db.run('DELETE FROM produto_insumos WHERE produto_id = ?', [id]);
      db.run('DELETE FROM produtos WHERE id = ?', [id]);
      persistDb();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 4. Capacidade Produtiva / Postos de Trabalho
  app.get('/api/postos-capacidade', (_req: Request, res: Response) => {
    try {
      const rows = queryAll(db, 'SELECT * FROM postos_capacidade ORDER BY id ASC');
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/postos-capacidade', (req: Request, res: Response) => {
    try {
      const { nome_posto, setor, capacidade_max_periodo, unidade_capacidade, turnos, eficiencia_oee, responsavel_setor, status } = req.body;
      db.run(`
        INSERT INTO postos_capacidade (nome_posto, setor, capacidade_max_periodo, unidade_capacidade, turnos, eficiencia_oee, responsavel_setor, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [nome_posto, setor, Number(capacidade_max_periodo) || 8, unidade_capacidade || 'horas/dia', Number(turnos) || 1, Number(eficiencia_oee) || 85, responsavel_setor || '', status || 'ATIVO']);
      persistDb();
      const novo = queryOne(db, 'SELECT * FROM postos_capacidade WHERE id = last_insert_rowid()');
      res.status(201).json(novo);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/postos-capacidade/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { nome_posto, setor, capacidade_max_periodo, unidade_capacidade, turnos, eficiencia_oee, responsavel_setor, status } = req.body;
      db.run(`
        UPDATE postos_capacidade SET
          nome_posto = ?, setor = ?, capacidade_max_periodo = ?, unidade_capacidade = ?,
          turnos = ?, eficiencia_oee = ?, responsavel_setor = ?, status = ?
        WHERE id = ?
      `, [nome_posto, setor, Number(capacidade_max_periodo) || 8, unidade_capacidade || 'horas/dia', Number(turnos) || 1, Number(eficiencia_oee) || 85, responsavel_setor || '', status || 'ATIVO', id]);
      persistDb();
      const updated = queryOne(db, 'SELECT * FROM postos_capacidade WHERE id = ?', [id]);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/postos-capacidade/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      db.run('DELETE FROM postos_capacidade WHERE id = ?', [id]);
      persistDb();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 5. Clientes
  app.get('/api/clientes', (_req: Request, res: Response) => {
    try {
      const rows = queryAll(db, 'SELECT * FROM clientes ORDER BY nome ASC');
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/clientes', (req: Request, res: Response) => {
    try {
      const { codigo, nome, tipo_pessoa, cpf_cnpj, contato_nome, telefone, email, endereco, cidade, uf, observacoes } = req.body;
      const now = new Date().toISOString().split('T')[0];

      db.run(`
        INSERT INTO clientes (codigo, nome, tipo_pessoa, cpf_cnpj, contato_nome, telefone, email, endereco, cidade, uf, observacoes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [codigo, nome, tipo_pessoa || 'PJ', cpf_cnpj, contato_nome, telefone, email, endereco, cidade, uf, observacoes, now]);

      persistDb();
      const novo = queryOne(db, 'SELECT * FROM clientes WHERE id = last_insert_rowid()');
      res.status(201).json(novo);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/clientes/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { codigo, nome, tipo_pessoa, cpf_cnpj, contato_nome, telefone, email, endereco, cidade, uf, observacoes } = req.body;

      db.run(`
        UPDATE clientes SET
          codigo = ?, nome = ?, tipo_pessoa = ?, cpf_cnpj = ?, contato_nome = ?,
          telefone = ?, email = ?, endereco = ?, cidade = ?, uf = ?, observacoes = ?
        WHERE id = ?
      `, [codigo, nome, tipo_pessoa, cpf_cnpj, contato_nome, telefone, email, endereco, cidade, uf, observacoes, id]);

      persistDb();
      const updated = queryOne(db, 'SELECT * FROM clientes WHERE id = ?', [id]);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/clientes/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const emPedidos = queryOne(db, 'SELECT COUNT(*) as total FROM pedidos WHERE cliente_id = ?', [id]);
      if (emPedidos && emPedidos.total > 0) {
        return res.status(400).json({ error: `Este cliente possui ${emPedidos.total} pedido(s) vinculados e não pode ser excluído.` });
      }

      db.run('DELETE FROM clientes WHERE id = ?', [id]);
      persistDb();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 6. Fornecedores
  app.get('/api/fornecedores', (_req: Request, res: Response) => {
    try {
      const rows = queryAll(db, 'SELECT * FROM fornecedores ORDER BY nome ASC');
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/fornecedores', (req: Request, res: Response) => {
    try {
      const { codigo, nome, cnpj, contato_nome, telefone, email, endereco, produtos_fornecidos, prazo_medio_dias, observacoes } = req.body;
      const now = new Date().toISOString().split('T')[0];

      db.run(`
        INSERT INTO fornecedores (codigo, nome, cnpj, contato_nome, telefone, email, endereco, produtos_fornecidos, prazo_medio_dias, observacoes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [codigo, nome, cnpj, contato_nome, telefone, email, endereco, produtos_fornecidos, Number(prazo_medio_dias) || 5, observacoes, now]);

      persistDb();
      const novo = queryOne(db, 'SELECT * FROM fornecedores WHERE id = last_insert_rowid()');
      res.status(201).json(novo);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/fornecedores/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { codigo, nome, cnpj, contato_nome, telefone, email, endereco, produtos_fornecidos, prazo_medio_dias, observacoes } = req.body;

      db.run(`
        UPDATE fornecedores SET
          codigo = ?, nome = ?, cnpj = ?, contato_nome = ?, telefone = ?,
          email = ?, endereco = ?, produtos_fornecidos = ?, prazo_medio_dias = ?, observacoes = ?
        WHERE id = ?
      `, [codigo, nome, cnpj, contato_nome, telefone, email, endereco, produtos_fornecidos, Number(prazo_medio_dias) || 5, observacoes, id]);

      persistDb();
      const updated = queryOne(db, 'SELECT * FROM fornecedores WHERE id = ?', [id]);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/fornecedores/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      db.run('DELETE FROM fornecedores WHERE id = ?', [id]);
      persistDb();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 7. Pedidos de Venda
  app.get('/api/pedidos', (_req: Request, res: Response) => {
    try {
      const pedidos = queryAll(db, `
        SELECT p.*, c.nome as cliente_nome, c.cpf_cnpj as cliente_cnpj, c.telefone as cliente_telefone, c.cidade as cliente_cidade
        FROM pedidos p
        JOIN clientes c ON p.cliente_id = c.id
        ORDER BY p.id DESC
      `);

      const pedidosCompletos = pedidos.map((ped) => {
        const itens = queryAll(db, `
          SELECT pi.*, pr.codigo as prod_codigo, pr.nome as prod_nome, pr.tempo_processo_minutos, pr.unidade_medida
          FROM pedido_itens pi
          JOIN produtos pr ON pi.produto_id = pr.id
          WHERE pi.pedido_id = ?
        `, [ped.id]);

        const ops = queryAll(db, `
          SELECT id, numero_op, status, quantidade_planejada, quantidade_produzida, data_fim_prevista
          FROM ordens_producao
          WHERE pedido_id = ?
        `, [ped.id]);

        return {
          ...ped,
          itens,
          ops,
        };
      });

      res.json(pedidosCompletos);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/pedidos', (req: Request, res: Response) => {
    try {
      const { cliente_id, data_pedido, data_entrega_prometida, prioridade, status, observacoes, itens } = req.body;
      const now = new Date().toISOString().split('T')[0];

      // Gerar número de pedido sequencial
      const countRow = queryOne(db, 'SELECT COUNT(*) as total FROM pedidos');
      const numPedido = `PED-${new Date().getFullYear()}-${String((countRow?.total || 0) + 1).padStart(3, '0')}`;

      let valorTotal = 0;
      if (Array.isArray(itens)) {
        valorTotal = itens.reduce((acc, curr) => acc + (Number(curr.quantidade || 0) * Number(curr.preco_unitario || 0)), 0);
      }

      db.run(`
        INSERT INTO pedidos (numero_pedido, cliente_id, data_pedido, data_entrega_prometida, prioridade, status, valor_total, observacoes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        numPedido, Number(cliente_id), data_pedido || now, data_entrega_prometida || now,
        prioridade || 'NORMAL', status || 'APROVADO', valorTotal, observacoes || '', now
      ]);

      const pedidoCriado = queryOne(db, 'SELECT id FROM pedidos WHERE numero_pedido = ?', [numPedido]);
      const pedidoId = pedidoCriado.id;

      if (Array.isArray(itens)) {
        for (const item of itens) {
          if (item.produto_id && item.quantidade > 0) {
            db.run(`
              INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario, quantidade_atendida)
              VALUES (?, ?, ?, ?, 0)
            `, [pedidoId, Number(item.produto_id), Number(item.quantidade), Number(item.preco_unitario) || 0]);
          }
        }
      }

      persistDb();
      res.status(201).json({ success: true, id: pedidoId, numero_pedido: numPedido });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/pedidos/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { cliente_id, data_pedido, data_entrega_prometida, prioridade, status, observacoes, itens } = req.body;

      let valorTotal = 0;
      if (Array.isArray(itens)) {
        valorTotal = itens.reduce((acc, curr) => acc + (Number(curr.quantidade || 0) * Number(curr.preco_unitario || 0)), 0);
      }

      db.run(`
        UPDATE pedidos SET
          cliente_id = ?, data_pedido = ?, data_entrega_prometida = ?, prioridade = ?,
          status = ?, valor_total = ?, observacoes = ?
        WHERE id = ?
      `, [
        Number(cliente_id), data_pedido, data_entrega_prometida, prioridade,
        status, valorTotal, observacoes, id
      ]);

      if (Array.isArray(itens)) {
        db.run('DELETE FROM pedido_itens WHERE pedido_id = ?', [id]);
        for (const item of itens) {
          if (item.produto_id && item.quantidade > 0) {
            db.run(`
              INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario, quantidade_atendida)
              VALUES (?, ?, ?, ?, ?)
            `, [id, Number(item.produto_id), Number(item.quantidade), Number(item.preco_unitario) || 0, Number(item.quantidade_atendida) || 0]);
          }
        }
      }

      persistDb();
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/pedidos/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      db.run('DELETE FROM pedido_itens WHERE pedido_id = ?', [id]);
      db.run('DELETE FROM pedidos WHERE id = ?', [id]);
      persistDb();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Geração automática de Ordens de Produção a partir de um Pedido
  app.post('/api/pedidos/:id/gerar-op', (req: Request, res: Response) => {
    try {
      const pedidoId = Number(req.params.id);
      const pedido = queryOne(db, 'SELECT * FROM pedidos WHERE id = ?', [pedidoId]);
      if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });

      const config = queryOne(db, 'SELECT responsavel_tecnico FROM config_empresa WHERE id = 1');
      const respTecnico = config?.responsavel_tecnico || 'Responsável Técnico PCP';

      const itens = queryAll(db, 'SELECT * FROM pedido_itens WHERE pedido_id = ?', [pedidoId]);
      if (itens.length === 0) {
        return res.status(400).json({ error: 'O pedido não possui itens para produzir.' });
      }

      const opsCriadas: string[] = [];
      const now = new Date().toISOString().split('T')[0];

      for (const item of itens) {
        // Quantidade a produzir = quantidade total - atendida
        const qtdRestante = Number(item.quantidade) - Number(item.quantidade_atendida || 0);
        if (qtdRestante <= 0) continue;

        // Gerar número único da OP
        const countOpRow = queryOne(db, 'SELECT COUNT(*) as total FROM ordens_producao');
        const numOp = `OP-${new Date().getFullYear()}-${String((countOpRow?.total || 0) + 1).padStart(3, '0')}`;

        db.run(`
          INSERT INTO ordens_producao (
            numero_op, pedido_id, produto_id, quantidade_planejada, quantidade_produzida,
            quantidade_refugo, data_emissao, data_inicio_prevista, data_fim_prevista,
            status, prioridade, responsavel_tecnico, created_at
          ) VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, 'PLANEJADA', ?, ?, ?)
        `, [
          numOp, pedidoId, item.produto_id, qtdRestante,
          now, now, pedido.data_entrega_prometida,
          pedido.prioridade || 'NORMAL', respTecnico, now
        ]);

        const opCriada = queryOne(db, 'SELECT id FROM ordens_producao WHERE numero_op = ?', [numOp]);
        const opId = opCriada.id;

        // Fazer a explosão de materiais (BOM) para esta OP
        const insumosProduto = queryAll(db, 'SELECT * FROM produto_insumos WHERE produto_id = ?', [item.produto_id]);
        for (const insumo of insumosProduto) {
          const qtdTotalNecessaria = Number(insumo.quantidade_necessaria) * qtdRestante;
          db.run(`
            INSERT INTO ordem_producao_materiais (ordem_producao_id, materia_prima_id, quantidade_planejada, quantidade_consumida, status_separacao)
            VALUES (?, ?, ?, 0, 'PENDENTE')
          `, [opId, insumo.materia_prima_id, qtdTotalNecessaria]);
        }

        opsCriadas.push(numOp);
      }

      // Atualizar status do pedido para EM_PRODUCAO
      db.run("UPDATE pedidos SET status = 'EM_PRODUCAO' WHERE id = ?", [pedidoId]);

      persistDb();
      res.json({
        success: true,
        message: `${opsCriadas.length} Ordem(ns) de Produção gerada(s) com sucesso.`,
        ops: opsCriadas,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 8. Ordens de Produção (PCP Core)
  app.get('/api/ordens-producao', (_req: Request, res: Response) => {
    try {
      const ops = queryAll(db, `
        SELECT
          op.*,
          pr.codigo as prod_codigo,
          pr.nome as prod_nome,
          pr.unidade_medida as prod_unidade,
          pr.tempo_processo_minutos,
          ped.numero_pedido,
          ped.data_entrega_prometida as pedido_data_entrega,
          cli.nome as cliente_nome
        FROM ordens_producao op
        JOIN produtos pr ON op.produto_id = pr.id
        LEFT JOIN pedidos ped ON op.pedido_id = ped.id
        LEFT JOIN clientes cli ON ped.cliente_id = cli.id
        ORDER BY
          CASE op.status
            WHEN 'EM_PRODUCAO' THEN 1
            WHEN 'AGUARDANDO_INSUMOS' THEN 2
            WHEN 'CONTROLE_QUALIDADE' THEN 3
            WHEN 'PLANEJADA' THEN 4
            WHEN 'CONCLUIDA' THEN 5
            ELSE 6
          END,
          op.data_fim_prevista ASC
      `);

      // Anexar materiais de cada OP
      const opsCompletas = ops.map((op) => {
        const materiais = queryAll(db, `
          SELECT opm.*, mp.codigo as mp_codigo, mp.nome as mp_nome, mp.unidade_medida as mp_unidade, mp.estoque_atual as mp_estoque_atual
          FROM ordem_producao_materiais opm
          JOIN materias_primas mp ON opm.materia_prima_id = mp.id
          WHERE opm.ordem_producao_id = ?
        `, [op.id]);

        // Verificar se há estoque suficiente para os materiais pendentes
        const estoqueSuficiente = materiais.every((m) => m.mp_estoque_atual >= m.quantidade_planejada);

        return {
          ...op,
          materiais,
          estoque_suficiente: estoqueSuficiente,
          tempo_total_horas: Math.round(((op.tempo_processo_minutos * op.quantidade_planejada) / 60) * 10) / 10,
        };
      });

      res.json(opsCompletas);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Detalhes completos da OP para impressão / folha de processo
  app.get('/api/ordens-producao/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const op = queryOne(db, `
        SELECT
          op.*,
          pr.codigo as prod_codigo,
          pr.nome as prod_nome,
          pr.descricao as prod_descricao,
          pr.especificacoes_tecnicas,
          pr.unidade_medida as prod_unidade,
          pr.tempo_processo_minutos,
          ped.numero_pedido,
          ped.data_entrega_prometida as pedido_data_entrega,
          cli.nome as cliente_nome,
          cli.contato_nome as cliente_contato,
          cli.telefone as cliente_telefone,
          cli.cidade as cliente_cidade,
          cli.uf as cliente_uf
        FROM ordens_producao op
        JOIN produtos pr ON op.produto_id = pr.id
        LEFT JOIN pedidos ped ON op.pedido_id = ped.id
        LEFT JOIN clientes cli ON ped.cliente_id = cli.id
        WHERE op.id = ?
      `, [id]);

      if (!op) return res.status(404).json({ error: 'Ordem de Produção não encontrada' });

      // Dados da empresa e responsável
      const config = queryOne(db, 'SELECT * FROM config_empresa WHERE id = 1');

      // Materiais (Lista de separação / Picking list)
      const materiais = queryAll(db, `
        SELECT opm.*, mp.codigo as mp_codigo, mp.nome as mp_nome, mp.unidade_medida as mp_unidade, mp.estoque_atual as mp_estoque_atual, mp.custo_unitario as mp_custo
        FROM ordem_producao_materiais opm
        JOIN materias_primas mp ON opm.materia_prima_id = mp.id
        WHERE opm.ordem_producao_id = ?
      `, [id]);

      // Roteiro de fabricação / etapas operacionais para chão de fábrica
      const etapas = queryAll(db, `
        SELECT pre.*, pc.nome_posto, pc.setor
        FROM produto_roteiro_etapas pre
        LEFT JOIN postos_capacidade pc ON pre.posto_trabalho_id = pc.id
        WHERE pre.produto_id = ?
        ORDER BY pre.ordem ASC
      `, [op.produto_id]);

      res.json({
        ...op,
        empresa: config,
        materiais,
        etapas,
        tempo_total_estimado_min: op.tempo_processo_minutos * op.quantidade_planejada,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Criar OP avulsa (ou para estoque)
  app.post('/api/ordens-producao', (req: Request, res: Response) => {
    try {
      const {
        produto_id, quantidade_planejada, pedido_id,
        data_inicio_prevista, data_fim_prevista, prioridade, observacoes_producao, responsavel_tecnico
      } = req.body;

      const now = new Date().toISOString().split('T')[0];
      const countOpRow = queryOne(db, 'SELECT COUNT(*) as total FROM ordens_producao');
      const numOp = `OP-${new Date().getFullYear()}-${String((countOpRow?.total || 0) + 1).padStart(3, '0')}`;

      const config = queryOne(db, 'SELECT responsavel_tecnico FROM config_empresa WHERE id = 1');
      const resp = responsavel_tecnico || config?.responsavel_tecnico || 'Engenharia / PCP';

      db.run(`
        INSERT INTO ordens_producao (
          numero_op, pedido_id, produto_id, quantidade_planejada, quantidade_produzida,
          quantidade_refugo, data_emissao, data_inicio_prevista, data_fim_prevista,
          status, prioridade, responsavel_tecnico, observacoes_producao, created_at
        ) VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, 'PLANEJADA', ?, ?, ?, ?)
      `, [
        numOp, pedido_id ? Number(pedido_id) : null, Number(produto_id), Number(quantidade_planejada),
        now, data_inicio_prevista || now, data_fim_prevista || now,
        prioridade || 'NORMAL', resp, observacoes_producao || '', now
      ]);

      const novaOp = queryOne(db, 'SELECT id FROM ordens_producao WHERE numero_op = ?', [numOp]);
      const opId = novaOp.id;

      // Inserir lista de materiais calculada automaticamente a partir da BOM do produto
      const insumos = queryAll(db, 'SELECT * FROM produto_insumos WHERE produto_id = ?', [Number(produto_id)]);
      for (const insumo of insumos) {
        const qtdTotal = Number(insumo.quantidade_necessaria) * Number(quantidade_planejada);
        db.run(`
          INSERT INTO ordem_producao_materiais (ordem_producao_id, materia_prima_id, quantidade_planejada, quantidade_consumida, status_separacao)
          VALUES (?, ?, ?, 0, 'PENDENTE')
        `, [opId, insumo.materia_prima_id, qtdTotal]);
      }

      persistDb();
      res.status(201).json({ success: true, id: opId, numero_op: numOp });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Atualizar status da OP
  app.put('/api/ordens-producao/:id/status', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      const now = new Date().toISOString();

      let sql = 'UPDATE ordens_producao SET status = ? WHERE id = ?';
      const params = [status, id];

      // Se passou para EM_PRODUCAO, preencher data_inicio_real se vazia
      if (status === 'EM_PRODUCAO') {
        sql = `
          UPDATE ordens_producao SET
            status = ?,
            data_inicio_real = COALESCE(data_inicio_real, ?)
          WHERE id = ?
        `;
        params.splice(1, 0, now.split('T')[0]);
      }

      db.run(sql, params);
      persistDb();
      res.json({ success: true, status });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Baixa / Conclusão de Ordem de Produção
  app.post('/api/ordens-producao/:id/baixa', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const {
        quantidade_produzida,
        quantidade_refugo,
        operador_baixa,
        observacoes_producao,
        dar_baixa_materiais,
        adicionar_estoque_acabado,
        status_final
      } = req.body;

      const op = queryOne(db, 'SELECT * FROM ordens_producao WHERE id = ?', [id]);
      if (!op) return res.status(404).json({ error: 'Ordem de Produção não encontrada' });

      const now = new Date().toISOString();
      const dataHoje = now.split('T')[0];
      const qtdProduzida = Number(quantidade_produzida);
      const qtdRefugo = Number(quantidade_refugo || 0);

      // 1. Atualizar OP
      const novoStatus = status_final || 'CONCLUIDA';
      db.run(`
        UPDATE ordens_producao SET
          quantidade_produzida = ?,
          quantidade_refugo = ?,
          operador_baixa = ?,
          observacoes_producao = COALESCE(?, observacoes_producao),
          data_conclusao_real = ?,
          status = ?
        WHERE id = ?
      `, [qtdProduzida, qtdRefugo, operador_baixa || 'Operador Responsável', observacoes_producao, dataHoje, novoStatus, id]);

      // 2. Baixa de estoque de matérias-primas se solicitado
      if (dar_baixa_materiais) {
        const materiais = queryAll(db, 'SELECT * FROM ordem_producao_materiais WHERE ordem_producao_id = ?', [id]);
        for (const mat of materiais) {
          // Consumo proporcional à quantidade produzida
          const consumoCalculado = (mat.quantidade_planejada / op.quantidade_planejada) * qtdProduzida;
          db.run(`
            UPDATE ordem_producao_materiais SET
              quantidade_consumida = ?,
              status_separacao = 'CONSUMIDO'
            WHERE id = ?
          `, [consumoCalculado, mat.id]);

          // Descontar do estoque da matéria-prima
          db.run(`
            UPDATE materias_primas SET
              estoque_atual = MAX(0, estoque_atual - ?),
              updated_at = ?
            WHERE id = ?
          `, [consumoCalculado, dataHoje, mat.materia_prima_id]);

          // Registrar no histórico de movimentação
          db.run(`
            INSERT INTO movimentacoes_estoque (tipo, materia_prima_id, ordem_producao_id, quantidade, data_movimento, usuario, justificativa)
            VALUES ('CONSUMO_OP', ?, ?, ?, ?, ?, ?)
          `, [mat.materia_prima_id, id, consumoCalculado, now, operador_baixa || 'PCP Baixa', `Consumo baixa OP ${op.numero_op}`]);
        }
      }

      // 3. Adicionar produto acabado no estoque se solicitado
      if (adicionar_estoque_acabado && qtdProduzida > 0) {
        db.run(`
          UPDATE produtos SET
            estoque_acabado = estoque_acabado + ?,
            updated_at = ?
          WHERE id = ?
        `, [qtdProduzida, dataHoje, op.produto_id]);

        db.run(`
          INSERT INTO movimentacoes_estoque (tipo, produto_id, ordem_producao_id, quantidade, data_movimento, usuario, justificativa)
          VALUES ('ENTRADA_OP', ?, ?, ?, ?, ?, ?)
        `, [op.produto_id, id, qtdProduzida, now, operador_baixa || 'PCP Baixa', `Entrada de produção OP ${op.numero_op}`]);
      }

      // 4. Se a OP pertence a um pedido, atualizar quantidade atendida no item do pedido
      if (op.pedido_id) {
        db.run(`
          UPDATE pedido_itens SET
            quantidade_atendida = quantidade_atendida + ?
          WHERE pedido_id = ? AND produto_id = ?
        `, [qtdProduzida, op.pedido_id, op.produto_id]);

        // Verificar se todos os itens do pedido foram atendidos
        const itensPedido = queryAll(db, 'SELECT quantidade, quantidade_atendida FROM pedido_itens WHERE pedido_id = ?', [op.pedido_id]);
        const todoAtendido = itensPedido.every((i) => i.quantidade_atendida >= i.quantidade);
        if (todoAtendido) {
          db.run("UPDATE pedidos SET status = 'CONCLUIDO' WHERE id = ?", [op.pedido_id]);
        }
      }

      persistDb();
      res.json({ success: true, message: `Ordem ${op.numero_op} baixada com sucesso!` });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/ordens-producao/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      db.run('DELETE FROM ordem_producao_materiais WHERE ordem_producao_id = ?', [id]);
      db.run('DELETE FROM ordens_producao WHERE id = ?', [id]);
      persistDb();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 9. Relatórios & Dashboard KPIs
  app.get('/api/dashboard/stats', (_req: Request, res: Response) => {
    try {
      const totalOpsRow = queryOne(db, 'SELECT COUNT(*) as total FROM ordens_producao');
      const opsPorStatus = queryAll(db, `
        SELECT status, COUNT(*) as total
        FROM ordens_producao
        GROUP BY status
      `);

      const statusMap: Record<string, number> = {
        PLANEJADA: 0,
        AGUARDANDO_INSUMOS: 0,
        EM_PRODUCAO: 0,
        CONTROLE_QUALIDADE: 0,
        CONCLUIDA: 0,
        CANCELADA: 0
      };
      opsPorStatus.forEach((r) => {
        statusMap[r.status] = Number(r.total);
      });

      // Total de pedidos
      const totalPedidosRow = queryOne(db, 'SELECT COUNT(*) as total FROM pedidos');
      const totalFaturamentoRow = queryOne(db, 'SELECT SUM(valor_total) as faturamento FROM pedidos');

      // Matérias-primas críticas (abaixo do estoque mínimo)
      const materiasCriticas = queryAll(db, `
        SELECT id, codigo, nome, unidade_medida, estoque_atual, estoque_minimo
        FROM materias_primas
        WHERE estoque_atual <= estoque_minimo
        ORDER BY (estoque_atual - estoque_minimo) ASC
      `);

      // Capacidade produtiva dos postos
      const postos = queryAll(db, `
        SELECT id, nome_posto, setor, capacidade_max_periodo, unidade_capacidade, eficiencia_oee, status
        FROM postos_capacidade
      `);

      // Ordens recentes
      const ordensRecentes = queryAll(db, `
        SELECT op.*, pr.nome as prod_nome, ped.numero_pedido
        FROM ordens_producao op
        JOIN produtos pr ON op.produto_id = pr.id
        LEFT JOIN pedidos ped ON op.pedido_id = ped.id
        ORDER BY op.id DESC
        LIMIT 6
      `);

      // Indicador de pontualidade (On-Time Delivery)
      const concluidas = queryAll(db, `
        SELECT data_fim_prevista, data_conclusao_real
        FROM ordens_producao
        WHERE status = 'CONCLUIDA' AND data_conclusao_real IS NOT NULL
      `);
      let pontuais = 0;
      concluidas.forEach((c) => {
        if (c.data_conclusao_real <= c.data_fim_prevista) pontuais++;
      });
      const taxaEntregaPontual = concluidas.length > 0 ? Math.round((pontuais / concluidas.length) * 100) : 100;

      res.json({
        total_ops: totalOpsRow?.total || 0,
        ops_por_status: statusMap,
        total_pedidos: totalPedidosRow?.total || 0,
        faturamento_total: totalFaturamentoRow?.faturamento || 0,
        materias_criticas: materiasCriticas,
        postos_capacidade: postos,
        taxa_pontualidade: taxaEntregaPontual,
        ordens_recentes: ordensRecentes,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reset / Recarregar dados de demonstração
  app.post('/api/db/reset', (_req: Request, res: Response) => {
    try {
      seedInitialData(db);
      persistDb();
      res.json({ success: true, message: 'Dados de demonstração restaurados com sucesso!' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // VITE / STATIC CLIENT INTEGRATION
  // ==========================================
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PCP Manufatura ERP] Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[PCP Manufatura ERP] Falha ao iniciar servidor:', err);
});
