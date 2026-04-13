import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();
const HERMES_PATH = process.env.HERMES_PATH || path.join(process.env.HOME || '~', '.hermes');
const ALLOWED_ROOTS = (process.env.ALLOWED_FILE_ROOTS || `${HERMES_PATH},~/projects`).split(',').map(p =>
  p.startsWith('~') ? path.join(process.env.HOME || '~', p.slice(2)) : p
);

function validatePath(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  return ALLOWED_ROOTS.some(root => resolved.startsWith(path.resolve(root)));
}

router.get('/tree', (req: Request, res: Response) => {
  try {
    const dirPath = req.query.path as string || HERMES_PATH;
    if (!validatePath(dirPath)) { res.status(403).json({ error: 'Access denied' }); return; }
    if (!fs.existsSync(dirPath)) { res.status(404).json({ error: 'Path not found' }); return; }

    const tree: Array<any> = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    entries.forEach(entry => {
      const fullPath = path.join(dirPath, entry.name);
      const stat = fs.statSync(fullPath);
      const item: any = { name: entry.name, type: entry.isDirectory() ? 'dir' : 'file', path: fullPath, size: stat.size, modified: stat.mtime.toISOString() };
      tree.push(item);
      if (entry.isDirectory() && tree.length < 50) {
        try {
          item.children = fs.readdirSync(fullPath, { withFileTypes: true }).slice(0, 20).map(child => {
            const childPath = path.join(fullPath, child.name);
            const childStat = fs.statSync(childPath);
            return { name: child.name, type: child.isDirectory() ? 'dir' : 'file', path: childPath, size: childStat.size, modified: childStat.mtime.toISOString() };
          });
        } catch { }
      }
    });
    res.json(tree);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.get('/read', (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath || !validatePath(filePath)) { res.status(403).json({ error: 'Access denied' }); return; }
    if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'File not found' }); return; }
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) { res.status(400).json({ error: 'Path is a directory' }); return; }
    if (stat.size > 150 * 1024) { res.status(413).json({ error: 'File too large' }); return; }
    res.json({ content: fs.readFileSync(filePath, 'utf-8') });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.post('/write', (req: Request, res: Response) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath || !validatePath(filePath)) { res.status(403).json({ error: 'Access denied' }); return; }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.delete('/delete', (req: Request, res: Response) => {
  try {
    const { path: filePath } = req.body;
    if (!filePath || !validatePath(filePath)) { res.status(403).json({ error: 'Access denied' }); return; }
    if (ALLOWED_ROOTS.some(root => path.resolve(root) === path.resolve(filePath))) { res.status(400).json({ error: 'Cannot delete root directory' }); return; }
    if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'File not found' }); return; }
    const stat = fs.statSync(filePath);
    stat.isDirectory() ? fs.rmSync(filePath, { recursive: true }) : fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

export default router;
