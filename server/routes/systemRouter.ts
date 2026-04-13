import { Router, Request, Response } from 'express';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { requireAuth, setupAdmin, login, generateCsrf } from '../auth.js';
import * as hermes from '../hermes.js';

const router = Router();
const HERMES_PATH = process.env.HERMES_PATH || path.join(process.env.HOME || '~', '.hermes');
const ADMIN_FILE = path.join(HERMES_PATH, '.control-v3-admin.json');

router.get('/health', (req: Request, res: Response) => {
  res.json({ ok: true, uptime: process.uptime(), ts: Date.now() });
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const gatewayPid = await hermes.getGatewayPid();
    res.json({
      cpu: { cores: cpus.length, model: cpus[0]?.model || 'unknown' },
      memory: { total: totalMemory, used: usedMemory, free: freeMemory, percentUsed: (usedMemory / totalMemory) * 100 },
      platform: os.platform(),
      nodeVersion: process.version,
      gateway: { running: gatewayPid !== null, pid: gatewayPid }
    });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.post('/auth/setup', async (req: Request, res: Response) => {
  try {
    if (fs.existsSync(ADMIN_FILE)) { res.status(400).json({ error: 'Admin already configured' }); return; }
    const { username, password } = req.body;
    if (!username || !password) { res.status(400).json({ error: 'Username and password required' }); return; }
    const token = await setupAdmin(username, password);
    const admin = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf-8'));
    const csrf = generateCsrf(token, admin.secret);
    res.json({ token, csrf, message: 'Admin user created' });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) { res.status(400).json({ error: 'Username and password required' }); return; }
    const result = await login(username, password);
    res.json(result);
  } catch (error) { res.status(401).json({ error: (error as Error).message }); }
});

router.post('/auth/logout', (req: Request, res: Response) => {
  res.json({ success: true });
});

router.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const token = (req as any).token;
    const admin = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf-8'));
    const csrf = generateCsrf(token, admin.secret);
    res.json({ username: user.username, csrf });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.get('/auth/status', (req: Request, res: Response) => {
  res.json({ needsSetup: !fs.existsSync(ADMIN_FILE) });
});

export default router;
