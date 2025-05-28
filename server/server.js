// server/server.js
// Backend Express + MySQL (mysql2) com CORS, autenticação, vinculação user-patient
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

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
app.get('/queue', async (req, res) => {
  try {
    const { priority } = req.query;
    let sql = 'SELECT * FROM queue_entries WHERE status = ?';
    const params = ['waiting'];

    if (priority === 'true' || priority === 'false') {
      sql += ' AND is_priority = ?';
      params.push(priority === 'true');
    }

    sql += ' ORDER BY is_priority DESC, created_at ASC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar fila:', err);
    res.status(500).json({ error: err.message });
  }
});

// Inicialização do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server rodando na porta ${PORT}`));
