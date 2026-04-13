import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();
const HERMES_PATH = process.env.HERMES_PATH || path.join(process.env.HOME || '~', '.hermes');
const SESSIONS_DIR = path.join(HERMES_PATH, 'sessions');

router.get('/', (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) { res.json([]); return; }
    const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'));
    const sessions = files.slice(0, 100).map(file => {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, file), 'utf-8'));
        return {
          id: file.replace('.json', ''),
          timestamp: content.timestamp || new Date(fs.statSync(path.join(SESSIONS_DIR, file)).mtime).toISOString(),
          profile: content.profile || 'default',
          title: content.title || file.replace('.json', '')
        };
      } catch { return null; }
    }).filter(s => s !== null).sort((a, b) => new Date(b!.timestamp).getTime() - new Date(a!.timestamp).getTime());
    res.json(sessions);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.patch('/:id/rename', (req: Request, res: Response) => {
  try {
    const filePath = path.join(SESSIONS_DIR, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'Session not found' }); return; }
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    content.title = req.body.title;
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const filePath = path.join(SESSIONS_DIR, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'Session not found' }); return; }
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.get('/stats', (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) { res.json({ totalSessions: 0, totalMessages: 0 }); return; }
    const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'));
    let totalMessages = 0;
    files.forEach(file => {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, file), 'utf-8'));
        totalMessages += (content.messages?.length || 0);
      } catch { }
    });
    res.json({ totalSessions: files.length, totalMessages });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const filePath = path.join(SESSIONS_DIR, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'Session not found' }); return; }
    res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

export default router;
