import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const JWT_SECRET = process.env.JWT_SECRET ?? 'ninna-dev-secret';

app.use(cors());
app.use(express.json());

const users = [
  {
    id: 'user-1',
    name: 'Pâmella Mourão',
    email: 'pammourao@gmail.com',
    password: bcrypt.hashSync('123456', 10),
    plan: 'premium',
  },
];

const babies = [
  { id: 'baby-1', userId: 'user-1', name: 'Miguel', birthDate: '2025-01-15' },
  { id: 'baby-2', userId: 'user-1', name: 'Lívia', birthDate: '2024-02-20' },
];

const records = [
  {
    id: 'record-1',
    babyId: 'baby-1',
    type: 'feeding',
    title: 'Mamadeira',
    createdAt: new Date().toISOString(),
    value: '180ml',
    notes: 'Mamou bem e dormiu logo em seguida.',
  },
  {
    id: 'record-2',
    babyId: 'baby-1',
    type: 'sleep',
    title: 'Sono',
    createdAt: new Date().toISOString(),
    value: '2h 20m',
    notes: 'Acordou feliz.',
  },
];

function generateToken(user: any) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'NINNA API', timestamp: new Date().toISOString() });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body ?? {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Dados obrigatórios ausentes' });
  }

  const exists = users.some((user) => user.email === email);
  if (exists) {
    return res.status(409).json({ message: 'Usuário já existe' });
  }

  const newUser = {
    id: `user-${Date.now()}`,
    name,
    email,
    password: await bcrypt.hash(password, 10),
    plan: 'free',
  };

  users.push(newUser);

  return res.status(201).json({
    user: { id: newUser.id, name: newUser.name, email: newUser.email, plan: newUser.plan },
    token: generateToken(newUser),
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  const user = users.find((item) => item.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const valid = await bcrypt.compare(password ?? '', user.password);
  if (!valid) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  return res.json({
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
    token: generateToken(user),
  });
});

app.get('/api/babies', (req, res) => {
  res.json({ babies });
});

app.post('/api/babies', (req, res) => {
  const { userId, name, birthDate } = req.body ?? {};

  if (!userId || !name || !birthDate) {
    return res.status(400).json({ message: 'Dados do bebê obrigatórios' });
  }

  const newBaby = {
    id: `baby-${Date.now()}`,
    userId,
    name,
    birthDate,
  };

  babies.push(newBaby);
  return res.status(201).json({ baby: newBaby });
});

app.get('/api/records', (req, res) => {
  const babyId = req.query.babyId as string | undefined;

  const filtered = babyId ? records.filter((item) => item.babyId === babyId) : records;
  return res.json({ records: filtered });
});

app.post('/api/records', (req, res) => {
  const { babyId, type, title, value, notes } = req.body ?? {};

  if (!babyId || !type || !title) {
    return res.status(400).json({ message: 'Registro incompleto' });
  }

  const newRecord = {
    id: `record-${Date.now()}`,
    babyId,
    type,
    title,
    value: value ?? '',
    notes: notes ?? '',
    createdAt: new Date().toISOString(),
  };

  records.push(newRecord);
  return res.status(201).json({ record: newRecord });
});

app.get('/api/reports/pediatric', (req, res) => {
  const summary = 'Foi registrado um padrão estável de sono e alimentação nos últimos 7 dias.';
  res.json({
    period: 'Últimos 7 dias',
    summary,
    data: {
      feeding: 'Regular',
      sleep: 'Consistente',
      diaper: 'Normal',
      temp: 'Sem alterações relevantes',
    },
  });
});

app.get('/api/premium/features', (_req, res) => {
  res.json({
    plan: 'premium',
    features: ['Cólica', 'Medicamentos', 'Vacinas', 'Consultas', 'Relatório para pediatra', 'NINNA Assistant'],
  });
});

app.listen(port, () => {
  console.log(`NINNA API running on http://localhost:${port}`);
});
