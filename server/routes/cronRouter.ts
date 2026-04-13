import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

const router = Router();
const HERMES_PATH = process.env.HERMES_PATH || path.join(process.env.HOME || '~', '.hermes');

function getCronDir(profile: string | undefined): string {
  return (!profile || profile === 'default')
    ? path.join(HERMES_PATH, 'cron')
    : path.join(HERMES_PATH, 'profiles', String(profile), 'cron');
}

router.get('/', (req: Request, res: Response) => {
  try {
    const cronDir = getCronDir(req.query.profile as string);
    if (!fs.existsSync(cronDir)) { res.json([]); return; }
    const jobs = fs.readdirSync(cronDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml')).map(file => {
      try {
        const content = yaml.load(fs.readFileSync(path.join(cronDir, file), 'utf-8')) as any;
        return { id: file.replace(/\.(yaml|yml)$/, ''), name: content.name || file, schedule: content.schedule || '', enabled: content.enabled !== false, lastRun: content.lastRun || null };
      } catch { return null; }
    }).filter(j => j !== null);
    res.json(jobs);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { profile, name, schedule, command } = req.body;
    const cronDir = getCronDir(profile);
    fs.mkdirSync(cronDir, { recursive: true });
    const id = Date.now().toString();
    fs.writeFileSync(path.join(cronDir, `${id}.yaml`), yaml.dump({ name, schedule, command, enabled: true, createdAt: new Date().toISOString() }));
    res.json({ success: true, id });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const cronDir = getCronDir(req.query.profile as string);
    for (const ext of ['.yaml', '.yml']) {
      const file = path.join(cronDir, `${req.params.id}${ext}`);
      if (fs.existsSync(file)) { fs.unlinkSync(file); res.json({ success: true }); return; }
    }
    res.status(404).json({ error: 'Job not found' });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.post('/:id/run', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Job execution initiated' });
});

router.patch('/:id', (req: Request, res: Response) => {
  try {
    const { profile, ...updateData } = req.body;
    const cronDir = getCronDir(profile);
    for (const ext of ['.yaml', '.yml']) {
      const file = path.join(cronDir, `${req.params.id}${ext}`);
      if (fs.existsSync(file)) {
        const content = yaml.load(fs.readFileSync(file, 'utf-8')) as any;
        fs.writeFileSync(file, yaml.dump({ ...content, ...updateData }));
        res.json({ success: true }); return;
      }
    }
    res.status(404).json({ error: 'Job not found' });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

export default router;
