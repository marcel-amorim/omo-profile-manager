import { describe, it, expect } from 'vitest';
import { OMO_CONFIG_PATH, BACKUP_DIR } from '../main/config/paths';

describe('Paths', () => {
  it('should have valid config path', () => {
    expect(OMO_CONFIG_PATH).toContain('oh-my-opencode.json');
  });

  it('should have valid backup directory', () => {
    expect(BACKUP_DIR).toContain('backups');
  });
});
