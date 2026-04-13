import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import yaml from 'js-yaml';

const execAsync = promisify(exec);
const HERMES_PATH = process.env.HERMES_PATH || path.join(process.env.HOME || '~', '.hermes');

interface CommandResult { stdout: string; stderr: string; exitCode: number; }
interface Profile { name: string; isDefault: boolean; configPath: string; model?: string; }

export async function runHermes(args: string[], profile?: string): Promise<CommandResult> {
  let command = 'hermes';
  if (profile) command += ` --profile=${profile}`;
  command += ' ' + args.join(' ');
  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    return { stdout: error.stdout || '', stderr: error.stderr || error.message || '', exitCode: error.code || 1 };
  }
}

export async function readProfileConfig(profile: string): Promise<Record<string, any> | null> {
  const configPath = profile === 'default'
    ? path.join(HERMES_PATH, 'config.yaml')
    : path.join(HERMES_PATH, 'profiles', profile, 'config.yaml');
  try { return yaml.load(fs.readFileSync(configPath, 'utf-8')) as Record<string, any>; }
  catch { return null; }
}

export async function writeProfileConfig(profile: string, config: Record<string, any>): Promise<void> {
  const configPath = profile === 'default'
    ? path.join(HERMES_PATH, 'config.yaml')
    : path.join(HERMES_PATH, 'profiles', profile, 'config.yaml');
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, yaml.dump(config));
}

export async function listProfiles(): Promise<Profile[]> {
  const profiles: Profile[] = [];
  const profilesDir = path.join(HERMES_PATH, 'profiles');
  const defaultConfigPath = path.join(HERMES_PATH, 'config.yaml');

  if (fs.existsSync(defaultConfigPath)) {
    try {
      const config = await readProfileConfig('default');
      profiles.push({ name: 'default', isDefault: true, configPath: defaultConfigPath, model: config?.model as string | undefined });
    } catch { }
  }

  if (fs.existsSync(profilesDir)) {
    try {
      const dirs = fs.readdirSync(profilesDir);
      for (const dir of dirs) {
        const profilePath = path.join(profilesDir, dir);
        if (fs.statSync(profilePath).isDirectory()) {
          const configPath = path.join(profilePath, 'config.yaml');
          if (fs.existsSync(configPath)) {
            try {
              const config = await readProfileConfig(dir);
              profiles.push({ name: dir, isDefault: false, configPath, model: config?.model as string | undefined });
            } catch { }
          }
        }
      }
    } catch { }
  }
  return profiles;
}

export async function getGatewayPid(): Promise<number | null> {
  try {
    const { stdout } = await execAsync('pgrep -f "hermes.*gateway"');
    const pid = parseInt(stdout.trim().split('\n')[0]);
    return isNaN(pid) ? null : pid;
  } catch { return null; }
}

export async function startGateway(profile?: string): Promise<number | null> {
  const args = ['gateway', 'run'];
  if (profile) args.unshift(`--profile=${profile}`);
  try {
    const child = exec(args.join(' '));
    child.unref?.();
    await new Promise(resolve => setTimeout(resolve, 500));
    return getGatewayPid();
  } catch { return null; }
}

export async function stopGateway(): Promise<boolean> {
  try {
    const pid = await getGatewayPid();
    if (!pid) return false;
    exec(`kill ${pid}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  } catch { return false; }
}

export function getSessionsDb(profile?: string): string | null {
  try {
    const dir = (profile === 'default' || !profile) ? HERMES_PATH : path.join(HERMES_PATH, 'profiles', profile);
    const stateDb = path.join(dir, 'state.db');
    return fs.existsSync(stateDb) ? stateDb : null;
  } catch { return null; }
}
