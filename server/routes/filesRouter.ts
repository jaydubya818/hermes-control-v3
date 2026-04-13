import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();
const HOME = process.env.HOME || '/tmp';
const HERMES_PATH = process.env.HERMES_PATH
  ? expandTilde(process.env.HERMES_PATH)
  : path.join(HOME, '.hermes');

const ALLOWED_ROOTS = (process.env.ALLOWED_FILE_ROOTS || `${HERMES_PATH},~/projects`)
  .split(',')
  .map(p => expandTilde(p.trim()));

function expandTilde(p: string): string {
  if (p.startsWith('~/')) return path.join(HOME, p.slice(2));
  if (p === '~') return HOME;
  return p;
}

function resolvePath(p: string): string {
  return path.resolve(expandTilde(p));
}

function validatePath(filePath: string): boolean {
  const resolved = resolvePath(filePath);
  return ALLOWED_ROOTS.some(root => resolved.startsWith(path.resolve(root)));
}

router.get('/tree', (req: Request, res: Response) => {
  try {
    const rawPath = req.query.path as string || `${HERMES_PATH}`;
    const dirPath = resolvePath(rawPath);

    if (!validatePath(rawPath)) { res.status(403).json({ error: 'Access denied' }); return; }
    if (!fs.existsSync(dirPath)) { res.status(404).json({ error: 'Path not found' }); return; }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const tree = entries.map(entry => {
      const fullPath = path.join(dirPath, entry.name);
      try {
        const stat = fs.statSync(fullPath);
        return {
          name: entry.name,
          type: entry.isDirectory() ? 'dir' : 'file',
          path: fullPath,
          size: stat.size,
          modified: stat.mtime.toISOString()
        };
      } catch { return null; }
    }).filter(Boolean);

    res.json(tree);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.get('/read', (req: Request, res: Response) => {
  try {
    const rawPath = req.query.path as string;
    if (!rawPath || !validatePath(rawPath)) { res.status(403).json({ error: 'Access denied' }); return; }
    const filePath = resolvePath(rawPath);
    if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'File not found' }); return; }
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) { res.status(400).json({ error: 'Path is a directory' }); return; }
    if (stat.size > 150 * 1024) { res.status(413).json({ error: 'File too large (max 150KB)' }); return; }
    res.json({ content: fs.readFileSync(filePath, 'utf-8') });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.post('/write', (req: Request, res: Response) => {
  try {
    const { path: rawPath, content } = req.body;
    if (!rawPath || !validatePath(rawPath)) { res.status(403).json({ error: 'Access denied' }); return; }
    const filePath = resolvePath(rawPath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.delete('/delete', (req: Request, res: Response) => {
  try {
    const { path: rawPath } = req.body;
    if (!rawPath || !validatePath(rawPath)) { res.status(403).json({ error: 'Access denied' }); return; }
    const filePath = resolvePath(rawPath);
    if (ALLOWED_ROOTS.some(root => path.resolve(root) === filePath)) {
      res.status(400).json({ error: 'Cannot delete a root directory' }); return;
    }
    if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'File not found' }); return; }
    const stat = fs.statSync(filePath);
    stat.isDirectory() ? fs.rmSync(filePath, { recursive: true }) : fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

export default router;
