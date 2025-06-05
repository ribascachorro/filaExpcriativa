// server/server.js
// Backend Express + MySQL (mysql2) com CORS, autenticação, vinculação user-patient
import bcrypt from 'bcryptjs';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
const pool = mysql.createPool(process.env.DATABASE_URL);

// Teste de conexão ao banco
(async () => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS now');
    console.log('🔌 Connected to DB at:', rows[0].now);
  } catch (err) {
    console.error('❌ DB connection error:', err);
  }
})();

// Middlewares
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Health-check
app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// Criar usuário (login)
app.post('/users', async (req, res) => {
  const { login, senha, role } = req.body;
  if (!login || !senha || !role) return res.status(400).json({ error: 'Dados incompletos' });
  try {
    const hash = await bcrypt.hash(senha, 10);
    const [result] = await pool.query(
      'INSERT INTO usuarios (login, senha, role) VALUES (?, ?, ?)',
      [login, hash, role]
    );
    res.status(201).json({ id: result.insertId, login, role });
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Login já existe' });
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Login de usuário
app.post('/auth/login', async (req, res) => {
  const { login, senha } = req.body;
  if (!login || !senha) return res.status(400).json({ error: 'Dados incompletos' });
  try {
    const [rows] = await pool.query(
      'SELECT id, senha, role FROM usuarios WHERE login = ?',
      [login]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Credenciais inválidas' });
    const user = rows[0];
    const match = await bcrypt.compare(senha, user.senha);
    if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });
    // RETORNO NOVO: user_id e role para frontend vincular usuário
    res.json({ user_id: user.id, role: user.role });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Criar paciente com vínculo ao usuário
app.post('/patients', async (req, res) => {
  const { name, email, phone, birth_date, insurance_provider, insurance_number, cpf, user_id } = req.body;
  if (!cpf) return res.status(400).json({ error: 'CPF obrigatório' });
  try {
    const [result] = await pool.query(
      `INSERT INTO patients
       (name, email, phone, birth_date, insurance_provider, insurance_number, cpf, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, birth_date, insurance_provider, insurance_number, cpf, user_id || null]
    );
    const [rows] = await pool.query('SELECT * FROM patients WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar paciente:', err);
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT NOVO: Verificar existência de paciente vinculado ao usuário
app.get('/patients/byuser', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id não fornecido' });
  try {
    const [rows] = await pool.query(
      'SELECT * FROM patients WHERE user_id = ?',
      [user_id]
    );
    if (rows.length === 0) return res.json({ exists: false });
    res.json({ exists: true, patient: rows[0] });
  } catch (err) {
    console.error('Erro ao buscar paciente por usuário:', err);
    res.status(500).json({ error: err.message });
  }
});

// Enqueue por CPF (mantém validação existente)
app.post('/queue', async (req, res) => {
  const { cpf, is_priority = false } = req.body;
  if (!cpf) return res.status(400).json({ error: 'CPF não fornecido' });
  try {
    const [pRows] = await pool.query('SELECT id FROM patients WHERE cpf = ?', [cpf]);
    if (pRows.length === 0) return res.status(404).json({ error: 'Paciente não cadastrado' });
    const patient_id = pRows[0].id;
    const [result] = await pool.query(
      'INSERT INTO queue_entries (patient_id, is_priority) VALUES (?, ?)',
      [patient_id, is_priority]
    );
    const [rows] = await pool.query('SELECT * FROM queue_entries WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao entrar na fila:', err);
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT NOVO: Listar fila (somente status = waiting)
// ajustei a consulta para retornar os dados relevantes do paciente
//ta funcionando suave
app.get('/queue', async (req, res) => {
  try {
    const { priority } = req.query;
    let sql = `
      SELECT 
        qe.*,
        p.name,
        p.email,
        p.phone,
        p.cpf,
        p.gender
      FROM queue_entries qe
      INNER JOIN patients p ON qe.patient_id = p.id
      WHERE qe.status = ?
    `;
    const params = ['waiting'];

    if (priority === 'true' || priority === 'false') {
      sql += ' AND qe.is_priority = ?';
      params.push(priority === 'true');
    }

    sql += ' ORDER BY qe.is_priority DESC, qe.created_at ASC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar fila:', err);
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT NOVO: Atender paciente na fila
//ta funcionando suave
app.post('/queue/:id/attend', async (req, res) => {
  const { id } = req.params;
  try {
    const now = new Date();
    const [result] = await pool.query(
      'UPDATE queue_entries SET status = ?, served_at = ? WHERE id = ?',
      ['attended', now, id]
    );
    res.json({ message: 'Paciente atendido com sucesso' });
  } catch (err) {
    console.error('Erro ao atender paciente:', err);
    res.status(500).json({ error: err.message });
  }
});

//ENDPOINT: GET na anamnese do paciente atual
app.get('/queue/:id/anamnesis', async (req, res) => {
  const { id } = req.params;
  try {
    // Primeiro, vamos pegar o patient_id correto da fila
    const [queueEntry] = await pool.query(
      'SELECT patient_id FROM queue_entries WHERE id = ?',
      [id]
    );
    
    if (queueEntry.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado na fila' });
    }

    const patientId = queueEntry[0].patient_id;
    const [rows] = await pool.query('SELECT * FROM anamnese WHERE patient_id = ?', [patientId]);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar anamnese:', err);
    res.status(500).json({ error: err.message });
  }
});

//ENDPOINT: POST para criar anamnese
app.post('/queue/:id/anamnesis', async (req, res) => {
  const { id } = req.params;
  const {
    queixa_principal,
    historia_da_doenca_atual,
    historico_medico,
    medicacoes_em_uso,
    alergias,
    historico_familiar,
    habitos_de_vida,
    sintomas_rev_sistemas,
    outras_informacoes
  } = req.body;

  if (!queixa_principal) {
    return res.status(400).json({ message: 'Queixa principal é obrigatória.' });
  }

  try {
    // Primeiro, vamos pegar o patient_id correto da fila
    const [queueEntry] = await pool.query(
      'SELECT patient_id FROM queue_entries WHERE id = ?',
      [id]
    );
    
    if (queueEntry.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado na fila' });
    }

    const patientId = queueEntry[0].patient_id;

    const [resultado] = await pool.query(
      `INSERT INTO anamnese (
         patient_id,
         queixa_principal,
         historia_da_doenca_atual,
         historico_medico,
         medicacoes_em_uso,
         alergias,
         historico_familiar,
         habitos_de_vida,
         sintomas_rev_sistemas,
         outras_informacoes
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientId,
        queixa_principal,
        historia_da_doenca_atual || null,
        historico_medico || null,
        medicacoes_em_uso || null,
        alergias || null,
        historico_familiar || null,
        habitos_de_vida || null,
        sintomas_rev_sistemas || null,
        outras_informacoes || null
      ]
    );

    return res.status(201).json({ 
      message: 'Anamnese criada com sucesso.', 
      id: resultado.insertId 
    });
  } catch (erro) {
    console.error('Erro ao criar anamnese:', erro);
    return res.status(500).json({ message: 'Erro interno ao criar anamnese.' });
  }
});

//ENDPOINT: PUT para atualizar anamnese
app.put('/queue/:id/anamnesis', async (req, res) => {
  const { id } = req.params;
  const {
    queixa_principal,
    historia_da_doenca_atual,
    historico_medico,
    medicacoes_em_uso,
    alergias,
    historico_familiar,
    habitos_de_vida,
    sintomas_rev_sistemas,
    outras_informacoes
  } = req.body;

  if (!queixa_principal) {
    return res.status(400).json({ message: 'Queixa principal é obrigatória.' });
  }

  try {
    // Primeiro, vamos pegar o patient_id correto da fila
    const [queueEntry] = await pool.query(
      'SELECT patient_id FROM queue_entries WHERE id = ?',
      [id]
    );
    
    if (queueEntry.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado na fila' });
    }

    const patientId = queueEntry[0].patient_id;

    const [resultado] = await pool.query(
      `UPDATE anamnese SET
         queixa_principal = ?,
         historia_da_doenca_atual = ?,
         historico_medico = ?,
         medicacoes_em_uso = ?,
         alergias = ?,
         historico_familiar = ?,
         habitos_de_vida = ?,
         sintomas_rev_sistemas = ?,
         outras_informacoes = ?,
         updated_at = NOW()
       WHERE patient_id = ?`,
      [
        queixa_principal,
        historia_da_doenca_atual || null,
        historico_medico || null,
        medicacoes_em_uso || null,
        alergias || null,
        historico_familiar || null,
        habitos_de_vida || null,
        sintomas_rev_sistemas || null,
        outras_informacoes || null,
        patientId
      ]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ message: 'Anamnese não encontrada.' });
    }

    return res.json({ 
      message: 'Anamnese atualizada com sucesso.'
    });
  } catch (erro) {
    console.error('Erro ao atualizar anamnese:', erro);
    return res.status(500).json({ message: 'Erro interno ao atualizar anamnese.' });
  }
});

//ENDPOINT: GET na anamnese do paciente
app.get('/patients/:id/anamnesis', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM anamnese WHERE patient_id = ?', [id]);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar anamnese:', err);
    res.status(500).json({ error: err.message });
  }
});

//ENDPOINT: POST para criar anamnese
app.post('/patients/:id/anamnesis', async (req, res) => {
  const { id } = req.params;
  const {
    queixa_principal,
    historia_da_doenca_atual,
    historico_medico,
    medicacoes_em_uso,
    alergias,
    historico_familiar,
    habitos_de_vida,
    sintomas_rev_sistemas,
    outras_informacoes
  } = req.body;

  if (!queixa_principal) {
    return res.status(400).json({ message: 'Queixa principal é obrigatória.' });
  }

  try {
    const [resultado] = await pool.query(
      `INSERT INTO anamnese (
         patient_id,
         queixa_principal,
         historia_da_doenca_atual,
         historico_medico,
         medicacoes_em_uso,
         alergias,
         historico_familiar,
         habitos_de_vida,
         sintomas_rev_sistemas,
         outras_informacoes
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        queixa_principal,
        historia_da_doenca_atual || null,
        historico_medico || null,
        medicacoes_em_uso || null,
        alergias || null,
        historico_familiar || null,
        habitos_de_vida || null,
        sintomas_rev_sistemas || null,
        outras_informacoes || null
      ]
    );

    return res.status(201).json({ 
      message: 'Anamnese criada com sucesso.', 
      id: resultado.insertId 
    });
  } catch (erro) {
    console.error('Erro ao criar anamnese:', erro);
    return res.status(500).json({ message: 'Erro interno ao criar anamnese.' });
  }
});

//ENDPOINT: PUT para atualizar anamnese
app.put('/patients/:id/anamnesis/:anamneseId', async (req, res) => {
  const { id, anamneseId } = req.params;
  const {
    queixa_principal,
    historia_da_doenca_atual,
    historico_medico,
    medicacoes_em_uso,
    alergias,
    historico_familiar,
    habitos_de_vida,
    sintomas_rev_sistemas,
    outras_informacoes
  } = req.body;

  if (!queixa_principal) {
    return res.status(400).json({ message: 'Queixa principal é obrigatória.' });
  }

  try {
    const [resultado] = await pool.query(
      `UPDATE anamnese SET
         queixa_principal = ?,
         historia_da_doenca_atual = ?,
         historico_medico = ?,
         medicacoes_em_uso = ?,
         alergias = ?,
         historico_familiar = ?,
         habitos_de_vida = ?,
         sintomas_rev_sistemas = ?,
         outras_informacoes = ?,
         updated_at = NOW()
       WHERE id = ? AND patient_id = ?`,
      [
        queixa_principal,
        historia_da_doenca_atual || null,
        historico_medico || null,
        medicacoes_em_uso || null,
        alergias || null,
        historico_familiar || null,
        habitos_de_vida || null,
        sintomas_rev_sistemas || null,
        outras_informacoes || null,
        anamneseId,
        id
      ]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ message: 'Anamnese não encontrada.' });
    }

    return res.json({ 
      message: 'Anamnese atualizada com sucesso.'
    });
  } catch (erro) {
    console.error('Erro ao atualizar anamnese:', erro);
    return res.status(500).json({ message: 'Erro interno ao atualizar anamnese.' });
  }
});

// Inicialização do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server rodando na porta ${PORT}`));
