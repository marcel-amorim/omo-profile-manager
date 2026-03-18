import { globalShortcut, BrowserWindow } from 'electron';
import { IpcChannels } from '../shared/ipc';

interface ShortcutAction {
  action: string;
  index?: number;
}

const SHORTCUTS: Record<string, ShortcutAction> = {
  'CmdOrCtrl+1': { action: 'switch-profile', index: 0 },
  'CmdOrCtrl+2': { action: 'switch-profile', index: 1 },
  'CmdOrCtrl+3': { action: 'switch-profile', index: 2 },
  'CmdOrCtrl+4': { action: 'switch-profile', index: 3 },
  'CmdOrCtrl+N': { action: 'create-profile' },
  'CmdOrCtrl+S': { action: 'save-profile' },
  'CmdOrCtrl+Shift+A': { action: 'apply-profile' },
};

export function registerShortcuts(mainWindow: BrowserWindow): void {
  Object.entries(SHORTCUTS).forEach(([accelerator, actionData]) => {
    const registered = globalShortcut.register(accelerator, () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IpcChannels.SHORTCUT_TRIGGERED, actionData);
      }
    });

    if (!registered) {
      console.warn(`Failed to register shortcut: ${accelerator}`);
    }
  });
}

export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll();
}
