require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'it@pelby.ru';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Sergo1289';

const requireAdmin = (req, res, next) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="admin"');
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  const base64 = auth.replace('Basic ', '');
  const decoded = Buffer.from(base64, 'base64').toString('utf8');
  const [email, password] = decoded.split(':');
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    res.set('WWW-Authenticate', 'Basic realm="admin"');
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  return next();
};

app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Push local snapshot to server
app.post('/sync/push', async (req, res) => {
  try {
    const { userId, data } = req.body || {};
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ ok: false, error: 'userId is required' });
    }
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ ok: false, error: 'data is required' });
    }

    const record = await prisma.userData.upsert({
      where: { userId },
      update: { data },
      create: { userId, data },
    });

    return res.json({ ok: true, updatedAt: record.updatedAt });
  } catch (error) {
    console.error('sync/push error', error);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// Pull latest snapshot by userId
app.get('/sync/pull/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const record = await prisma.userData.findUnique({ where: { userId } });
    if (!record) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }
    return res.json({ ok: true, data: record.data, updatedAt: record.updatedAt });
  } catch (error) {
    console.error('sync/pull error', error);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// Admin endpoints
app.get('/admin/users', requireAdmin, async (_req, res) => {
  try {
    const users = await prisma.userData.findMany({
      select: { userId: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json({ ok: true, users });
  } catch (error) {
    console.error('admin/users error', error);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

app.get('/admin/user/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const record = await prisma.userData.findUnique({ where: { userId } });
    if (!record) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }
    return res.json({ ok: true, userId: record.userId, data: record.data, updatedAt: record.updatedAt });
  } catch (error) {
    console.error('admin/user error', error);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
