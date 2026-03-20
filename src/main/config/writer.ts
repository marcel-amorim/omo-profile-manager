import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { format } from 'date-fns';
import type { OMOConfig, BackupInfo } from '../../shared/types';
import { validateOMOConfig } from '../../shared/schemas';
import { DEFAULT_SISYPHUS_AGENT_SETTINGS, OMO_SCHEMA_URL } from '../../shared/constants';
import { OMO_CONFIG_PATH, BACKUP_DIR } from './paths';

export async function writeOMOConfig(config: OMOConfig): Promise<void> {
  const {
    agents,
    categories,
    $schema: _schema,
    sisyphus_agent,
    new_task_system_enabled,
    default_run_agent,
    disabled_mcps,
    disabled_agents,
    disabled_skills,
    disabled_hooks,
    disabled_commands,
    disabled_tools,
    hashline_edit,
    model_fallback,
    ...rest
  } = config as OMOConfig & Record<string, unknown>;

  const configToWrite = {
    ...(rest as Record<string, unknown>),
    $schema: OMO_SCHEMA_URL,
    sisyphus_agent: {
      default_builder_enabled:
        sisyphus_agent?.default_builder_enabled ??
        DEFAULT_SISYPHUS_AGENT_SETTINGS.default_builder_enabled,
      replace_plan:
        sisyphus_agent?.replace_plan ?? DEFAULT_SISYPHUS_AGENT_SETTINGS.replace_plan,
    },
    ...(new_task_system_enabled !== undefined && {
      new_task_system_enabled,
    }),
    ...(default_run_agent !== undefined && {
      default_run_agent,
    }),
    ...(disabled_mcps !== undefined && {
      disabled_mcps,
    }),
    ...(disabled_agents !== undefined && {
      disabled_agents,
    }),
    ...(disabled_skills !== undefined && {
      disabled_skills,
    }),
    ...(disabled_hooks !== undefined && {
      disabled_hooks,
    }),
    ...(disabled_commands !== undefined && {
      disabled_commands,
    }),
    ...(disabled_tools !== undefined && {
      disabled_tools,
    }),
    ...(hashline_edit !== undefined && {
      hashline_edit,
    }),
    ...(model_fallback !== undefined && {
      model_fallback,
    }),
    agents,
    categories,
  } as OMOConfig;

  validateOMOConfig(configToWrite);

  const opencodeDir = dirname(OMO_CONFIG_PATH);
  const opencodeDirExists = await fileExists(opencodeDir);
  if (!opencodeDirExists) {
    throw new Error(`Oh My OpenCode is not installed or config directory is missing.\nPlease check the installation guide:\nhttps://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/guide/installation.md`);
  }

  const configExists = await fileExists(OMO_CONFIG_PATH);
  
  if (configExists) {
    await createBackup();
  }

  const jsonContent = JSON.stringify(configToWrite, null, 2);
  
  await fs.writeFile(OMO_CONFIG_PATH, jsonContent, 'utf-8');
}

export async function createBackup(): Promise<string> {
  await ensureDirectory(BACKUP_DIR);

  const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
  const backupFilename = `${timestamp}-oh-my-opencode.json`;
  const backupPath = join(BACKUP_DIR, backupFilename);

  await fs.copyFile(OMO_CONFIG_PATH, backupPath);

  return backupPath;
}

export async function listBackups(): Promise<BackupInfo[]> {
  const backupsExist = await fileExists(BACKUP_DIR);
  
  if (!backupsExist) {
    return [];
  }

  const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true });
  
  const backupFiles = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('-oh-my-opencode.json'))
    .map(entry => {
      const backupPath = join(BACKUP_DIR, entry.name);
      const timestampStr = entry.name.replace('-oh-my-opencode.json', '');
      const timestamp = parseTimestamp(timestampStr);
      
      return {
        timestamp,
        originalPath: OMO_CONFIG_PATH,
        backupPath,
      };
    })
    .filter((backup): backup is BackupInfo => backup.timestamp !== null)
    .sort((a, b) => b.timestamp - a.timestamp);

  return backupFiles;
}

export async function restoreBackup(timestamp: string): Promise<void> {
  const backupFilename = `${timestamp}-oh-my-opencode.json`;
  const backupPath = join(BACKUP_DIR, backupFilename);

  const backupExists = await fileExists(backupPath);
  
  if (!backupExists) {
    throw new Error(`Backup not found: ${backupFilename}`);
  }

  const currentExists = await fileExists(OMO_CONFIG_PATH);
  
  if (currentExists) {
    const tempBackupTimestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    const tempBackupFilename = `${tempBackupTimestamp}-pre-restore-oh-my-opencode.json`;
    const tempBackupPath = join(BACKUP_DIR, tempBackupFilename);
    
    await fs.copyFile(OMO_CONFIG_PATH, tempBackupPath);
  }

  await ensureDirectory(dirname(OMO_CONFIG_PATH));
  
  await fs.copyFile(backupPath, OMO_CONFIG_PATH);
}

async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseTimestamp(timestampStr: string): number | null {
  const match = timestampStr.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/);
  
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;
  
  const date = new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(minute, 10),
    parseInt(second, 10)
  );

  if (isNaN(date.getTime())) {
    return null;
  }

  return date.getTime();
}
