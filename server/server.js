import bcrypt from 'bcryptjs';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';

// Importações necessárias para servir o frontend
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURAÇÃO INICIAL ---
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

// --- MIDDLEWARES ---
app.use(cors()); // Configuração de CORS simples, pois o app é servido do mesmo domínio.
app.use(express.json());


// --- CÓDIGO PARA SERVIR O FRONTEND ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// O Express vai servir os arquivos estáticos da pasta 'build' do React
app.use(express.static(path.join(__dirname, '../build')));


// --- ROTAS DA API (ORGANIZADAS COM PREFIXO /api) ---
const apiRouter = express.Router(); // Criamos um roteador dedicado para a API

// Health-check
apiRouter.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// MUDANÇA: Todas as rotas agora usam 'apiRouter' em vez de 'app'
apiRouter.post('/users', async (req, res) => {
  const { login, senha, role } = req.body;
  if (!login || !senha || !role) return res.status(400).json({ error: 'Dados incompletos' });
  try {
    const hash = await bcrypt.hash(senha, 10);
    const [result] = await pool.query('INSERT INTO usuarios (login, senha, role) VALUES (?, ?, ?)', [login, hash, role]);
    res.status(201).json({ id: result.insertId, login, role }); 
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Login já existe' });
    res.status(500).json({ error: 'Erro interno' });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  const { login, senha } = req.body;
  if (!login || !senha) return res.status(400).json({ error: 'Dados incompletos' });
  try {
    const [rows] = await pool.query('SELECT id, senha, role FROM usuarios WHERE login = ?', [login]);
    if (rows.length === 0) return res.status(401).json({ error: 'Credenciais inválidas' });
      const user = rows[0];
      const match = await bcrypt.compare(senha, user.senha);
    if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });
    res.json({ user_id: user.id, role: user.role });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Todas as outras rotas seguem o mesmo padrão, usando 'apiRouter'
apiRouter.post('/patients', async (req, res) => {
  const { name, email, phone, birth_date, insurance_provider, insurance_number, cpf, user_id } = req.body;
  if (!cpf) return res.status(400).json({ error: 'CPF obrigatório' });
  try {
    const [result] = await pool.query(`INSERT INTO patients (name, email, phone, birth_date, insurance_provider, insurance_number, cpf, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [name, email, phone, birth_date, insurance_provider, insurance_number, cpf, user_id || null]);
    const [rows] = await pool.query('SELECT * FROM patients WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar paciente:', err);
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/patients/byuser', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id não fornecido' });
  try {
    const [rows] = await pool.query('SELECT * FROM patients WHERE user_id = ?', [user_id]);
    if (rows.length === 0) return res.json({ exists: false });
    res.json({ exists: true, patient: rows[0] });
  } catch (err) {
    console.error('Erro ao buscar paciente por usuário:', err);
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/queue', async (req, res) => {
  const { cpf, is_priority = false } = req.body;
  if (!cpf) return res.status(400).json({ error: 'CPF não fornecido' });
  try {
    const [pRows] = await pool.query('SELECT id FROM patients WHERE cpf = ?', [cpf]);
    if (pRows.length === 0) return res.status(404).json({ error: 'Paciente não cadastrado' });
    const patient_id = pRows[0].id;
    const [result] = await pool.query('INSERT INTO queue_entries (patient_id, is_priority) VALUES (?, ?)', [patient_id, is_priority]);
    const [rows] = await pool.query('SELECT * FROM queue_entries WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao entrar na fila:', err);
    res.status(500).json({ error: err.message });
  }
});

//... cole o resto das suas rotas aqui, trocando 'app.' por 'apiRouter.' ...

// LINHA MÁGICA: Diz ao Express para usar nosso roteador para qualquer caminho que comece com /api
app.use('/api', apiRouter);

// --- ROTA "CATCH-ALL" (DEVE SER A ÚLTIMA ROTA DE TODAS) ---
// Qualquer requisição que não seja para a API (não começa com /api) será tratada pelo React.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server rodando na porta ${PORT}`));