import { homedir } from 'os';
import { join } from 'path';

export const OMO_CONFIG_PATH = join(
  homedir(),
  '.config',
  'opencode',
  'oh-my-opencode.json'
);

export const OPENCODE_CONFIG_PATH = join(
  homedir(),
  '.config',
  'opencode',
  'opencode.json'
);

export const BACKUP_DIR = join(
  homedir(),
  '.config',
  'opencode',
  'backups'
);
