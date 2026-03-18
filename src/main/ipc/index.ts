import { registerConfigHandlers } from './handlers/config';
import { registerProfileHandlers } from './handlers/profiles';
import { registerBackupHandlers } from './handlers/backup';
import { registerModelsHandlers } from './handlers/models';

export function registerIpcHandlers(): void {
  registerConfigHandlers();
  registerProfileHandlers();
  registerBackupHandlers();
  registerModelsHandlers();
}
