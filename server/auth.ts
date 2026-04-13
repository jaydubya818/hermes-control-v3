import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const HERMES_PATH = process.env.HERMES_PATH || path.join(process.env.HOME || '~', '.hermes');
const ADMIN_FILE = path.join(HERMES_PATH, '.control-v3-admin.json');
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

interface AdminFile {
  username: string;
  passwordHash: string;
  secret: string;
  createdAt: string;
}

interface TokenPayload {
  username: string;
  iat?: number;
  exp?: number;
}

function adminExists(): boolean { return fs.existsSync(ADMIN_FILE); }

function getAdmin(): AdminFile | null {
  if (!adminExists()) return null;
  try { return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf-8')); }
  catch { return null; }
}

export async function setupAdmin(username: string, password: string): Promise<string> {
  if (adminExists()) throw new Error('Admin already configured');
  const passwordHash = await bcrypt.hash(password, 12);
  const secret = crypto.randomBytes(32).toString('hex');
  const admin: AdminFile = { username, passwordHash, secret, createdAt: new Date().toISOString() };
  try {
    fs.mkdirSync(HERMES_PATH, { recursive: true });
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(admin, null, 2));
    fs.chmodSync(ADMIN_FILE, 0o600);
  } catch (error) { throw new Error(`Failed to save admin file: ${error}`); }
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
}

export async function login(username: string, password: string): Promise<{ token: string; csrf: string }> {
  if (!adminExists()) throw new Error('Admin not configured');
  const admin = getAdmin();
  if (!admin || admin.username !== username) throw new Error('Invalid credentials');
  const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordMatch) throw new Error('Invalid credentials');
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
  const csrf = generateCsrf(token, admin.secret);
  return { token, csrf };
}

export function verifyToken(token: string): TokenPayload | null {
  try { return jwt.verify(token, JWT_SECRET) as TokenPayload; }
  catch { return null; }
}

export function generateCsrf(token: string, secret: string): string {
  return crypto.createHash('sha256').update(token + secret + JWT_SECRET).digest('hex').slice(0, 32);
}

export function validateCsrf(token: string, csrfHeader: string): boolean {
  const admin = getAdmin();
  if (!admin) return false;
  const expected = generateCsrf(token, admin.secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(csrfHeader), Buffer.from(expected));
  } catch { return false; }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) { res.status(401).json({ error: 'Invalid or expired token' }); return; }
  (req as any).user = decoded;
  (req as any).token = token;
  next();
}

export function requireCsrf(req: Request, res: Response, next: NextFunction): void {
  if (!['POST', 'PATCH', 'DELETE', 'PUT'].includes(req.method)) { next(); return; }
  const token = (req as any).token;
  const csrfHeader = req.headers['x-csrf-token'] as string;
  if (!csrfHeader || !token) { res.status(403).json({ error: 'Missing CSRF token' }); return; }
  try {
    if (!validateCsrf(token, csrfHeader)) { res.status(403).json({ error: 'Invalid CSRF token' }); return; }
  } catch { res.status(403).json({ error: 'CSRF validation failed' }); return; }
  next();
}
