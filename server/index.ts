import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import * as pty from 'node-pty';
import rateLimit from 'express-rate-limit';

import { requireAuth, requireCsrf } from './auth.js';
import agentsRouter from './routes/agentsRouter.js';
import sessionsRouter from './routes/sessionsRouter.js';
import filesRouter from './routes/filesRouter.js';
import cronRouter from './routes/cronRouter.js';
import analyticsRouter from './routes/analyticsRouter.js';
import systemRouter from './routes/systemRouter.js';

const PORT = process.env.PORT || 10272;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "ws://localhost:*", "wss://localhost:*"]
    }
  }
}));

app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:10272', 'http://127.0.0.1:5174', 'http://127.0.0.1:10272'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, skipSuccessfulRequests: true, message: 'Too many login attempts' });

app.use('/api/system', systemRouter);
app.use('/api/auth/login', authLimiter);
app.use('/api/agents', requireAuth, requireCsrf, agentsRouter);
app.use('/api/sessions', requireAuth, requireCsrf, sessionsRouter);
app.use('/api/files', requireAuth, requireCsrf, filesRouter);
app.use('/api/cron', requireAuth, requireCsrf, cronRouter);
app.use('/api/analytics', requireAuth, analyticsRouter);

const distPath = path.resolve(import.meta.url, '../../dist');
app.use(express.static(distPath, { index: false }));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

const terminals = new Map<string, pty.IPty>();

wss.on('connection', (ws) => {
  const wsId = Math.random().toString(36).slice(2);
  let isAuthenticated = false;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      const { type, payload } = message;

      if (type === 'auth') {
        isAuthenticated = true;
        ws.send(JSON.stringify({ type: 'auth-ok' }));
        return;
      }

      if (!isAuthenticated) {
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Not authenticated' } }));
        return;
      }

      if (type === 'terminal-create') {
        const { cols = 80, rows = 24 } = payload;
        const term = pty.spawn('bash', [], { name: 'xterm-color', cols, rows, cwd: process.env.HOME, env: process.env as any });
        terminals.set(wsId, term);
        term.onData((data) => ws.send(JSON.stringify({ type: 'terminal-output', payload: { data } })));
        term.onExit(() => terminals.delete(wsId));
        ws.send(JSON.stringify({ type: 'terminal-create-ok' }));
      } else if (type === 'terminal-input') {
        terminals.get(wsId)?.write(payload.data);
      } else if (type === 'terminal-resize') {
        terminals.get(wsId)?.resize(payload.cols, payload.rows);
      } else if (type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', payload: { message: (error as Error).message } }));
    }
  });

  ws.on('close', () => {
    const term = terminals.get(wsId);
    if (term) { term.kill(); terminals.delete(wsId); }
  });
});

server.listen(PORT, () => {
  console.log(`Hermes Control v3 listening on http://localhost:${PORT}`);
});
