import { useCallback } from 'react';
import type { Profile } from '../../shared/types';
import {
  createProfileExportPayload,
  parseImportedProfileText,
  sanitizeProfileFilename,
  type ImportableProfileData,
} from '../domain/profile-transfer';
import { useToast } from './useToast';

interface UseProfileTransferOptions {
  onImportProfile?: (profile: ImportableProfileData) => Promise<boolean>;
}

export const useProfileTransfer = ({ onImportProfile }: UseProfileTransferOptions) => {
  const { success: showSuccess, error: showError } = useToast();

  const importProfileFromFile = useCallback(
    async (file: File): Promise<boolean> => {
      if (!file.name.toLowerCase().endsWith('.json')) {
        showError('Invalid file type. Please select a JSON file.');
        return false;
      }

      try {
        const text = await file.text();
        const parsed = parseImportedProfileText(text);

        if (!parsed.success) {
          showError(parsed.message);
          return false;
        }

        if (!onImportProfile) {
          showError('Import is not available in this context.');
          return false;
        }

        const importSucceeded = await onImportProfile(parsed.data);

        if (importSucceeded) {
          showSuccess(`Profile "${parsed.data.name}" imported successfully`);
          return true;
        }

        showError('Failed to import profile. Please try again.');
        return false;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to read file';
        showError(message);
        return false;
      }
    },
    [onImportProfile, showError, showSuccess]
  );

  const exportProfileToFile = useCallback(
    (profile: Profile) => {
      const payload = createProfileExportPayload(profile);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `${sanitizeProfileFilename(profile.name)}-omo-profile.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess(`Profile "${profile.name}" exported successfully`);
    },
    [showSuccess]
  );

  return {
    importProfileFromFile,
    exportProfileToFile,
  };
};

export default useProfileTransfer;
