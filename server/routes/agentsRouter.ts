import { Router, Request, Response } from 'express';
import * as hermes from '../hermes.js';

const router = Router();

router.get('/profiles', async (req: Request, res: Response) => {
  try {
    const profiles = await hermes.listProfiles();
    res.json(profiles.map(p => ({ ...p, isActive: false })));
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.post('/profiles/switch', async (req: Request, res: Response) => {
  try {
    const { profile } = req.body;
    if (!profile) { res.status(400).json({ error: 'Profile name required' }); return; }
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.post('/profiles/create', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) { res.status(400).json({ error: 'Profile name required' }); return; }
    res.json({ success: true, profile: name });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.delete('/profiles/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    if (name === 'default') { res.status(400).json({ error: 'Cannot delete default profile' }); return; }
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.get('/profiles/:name/config', async (req: Request, res: Response) => {
  try {
    const config = await hermes.readProfileConfig(req.params.name);
    res.json(config || {});
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.patch('/profiles/:name/config', async (req: Request, res: Response) => {
  try {
    await hermes.writeProfileConfig(req.params.name, req.body);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.get('/gateway/status', async (req: Request, res: Response) => {
  try {
    const pid = await hermes.getGatewayPid();
    res.json({ running: pid !== null, pid });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.post('/gateway/start', async (req: Request, res: Response) => {
  try {
    const pid = await hermes.startGateway(req.body.profile);
    res.json({ success: true, pid });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.post('/gateway/stop', async (req: Request, res: Response) => {
  try {
    await hermes.stopGateway();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.post('/gateway/restart', async (req: Request, res: Response) => {
  try {
    await hermes.stopGateway();
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pid = await hermes.startGateway(req.body.profile);
    res.json({ success: true, pid });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.get('/gateway/logs', async (req: Request, res: Response) => {
  res.json({ logs: '' });
});

export default router;
