import { useEffect, useCallback } from 'react';
import { Profile } from '../../shared/types';
import { ShortcutAction } from '../../shared/ipc';

interface UseKeyboardShortcutsProps {
  profiles: Profile[];
  selectedProfileId: string | null;
  localProfile: Profile | null;
  isDirty: boolean;
  onSelectProfile: (id: string) => void;
  onCreateProfile: () => void;
  onSaveProfile: () => void;
  setProfileToApply: (profile: Profile | null) => void;
}

export function useKeyboardShortcuts({
  profiles,
  selectedProfileId,
  localProfile,
  isDirty,
  onSelectProfile,
  onCreateProfile,
  onSaveProfile,
  setProfileToApply,
}: UseKeyboardShortcutsProps) {
  const handleShortcut = useCallback((actionData: ShortcutAction) => {
    switch (actionData.action) {
      case 'switch-profile': {
        const index = actionData.index;
        if (index !== undefined && index >= 0 && index < profiles.length) {
          onSelectProfile(profiles[index].id);
        }
        break;
      }
      case 'create-profile':
        onCreateProfile();
        break;
      case 'save-profile':
        if (isDirty && localProfile) {
          onSaveProfile();
        }
        break;
      case 'apply-profile': {
        const profileId = selectedProfileId || (profiles.length > 0 ? profiles[0].id : null);
        if (profileId) {
          const profile = profiles.find(p => p.id === profileId);
          if (profile) {
            setProfileToApply(profile);
          }
        }
        break;
      }
    }
  }, [profiles, selectedProfileId, localProfile, isDirty, onSelectProfile, onCreateProfile, onSaveProfile, setProfileToApply]);

  useEffect(() => {
    const unsubscribe = window.electron.shortcuts.onShortcut(handleShortcut);
    return () => {
      unsubscribe();
    };
  }, [handleShortcut]);
}
