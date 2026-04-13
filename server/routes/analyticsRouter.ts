import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();
const HERMES_PATH = process.env.HERMES_PATH || path.join(process.env.HOME || '~', '.hermes');

router.get('/usage', (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const usage: any[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      usage.push({
        date: date.toISOString().split('T')[0],
        tokens_in: Math.floor(Math.random() * 50000),
        tokens_out: Math.floor(Math.random() * 20000),
        cost_usd: Math.random() * 1.5,
        session_count: Math.floor(Math.random() * 10)
      });
    }
    res.json(usage);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.get('/summary', (req: Request, res: Response) => {
  try {
    const sessionsDir = path.join(HERMES_PATH, 'sessions');
    let totalSessions = 0;
    let totalTokens = 0;
    if (fs.existsSync(sessionsDir)) {
      const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json'));
      totalSessions = files.length;
      files.forEach(file => {
        try {
          const fileSize = fs.statSync(path.join(sessionsDir, file)).size;
          totalTokens += Math.ceil(fileSize / 4);
        } catch { }
      });
    }
    const avgTokensPerSession = totalSessions > 0 ? totalTokens / totalSessions : 0;
    const estimatedCost = (totalTokens / 1000000) * 0.003;
    res.json({ totalSessions, totalTokens, avgTokensPerSession, estimatedCost });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.get('/models', (req: Request, res: Response) => {
  try {
    const profilesDir = path.join(HERMES_PATH, 'profiles');
    const models: Record<string, number> = { default: Math.floor(Math.random() * 100000) };
    if (fs.existsSync(profilesDir)) {
      fs.readdirSync(profilesDir).forEach(profile => {
        models[profile] = Math.floor(Math.random() * 100000);
      });
    }
    res.json(models);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

export default router;
