import { useState, useEffect, useCallback } from 'react';
import { Profile } from '../../shared/types';
import { useToast } from './useToast';

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { success: showSuccess, error: showError } = useToast();

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electron.profiles.listProfiles();
      console.log('listProfiles result:', result);
      if (result.success) {
        setProfiles(result.data as unknown as Profile[]);
      } else {
        setError(result.error.message);
        showError(`Failed to load profiles: ${result.error.message}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showError(`Failed to load profiles: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const createProfile = useCallback(async (profile: Profile) => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electron.profiles.saveProfile(profile as any);
      if (result.success) {
        await fetchProfiles();
        showSuccess('Profile created successfully');
        return true;
      } else {
        setError(result.error.message);
        showError(`Failed to create profile: ${result.error.message}`);
        return false;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showError(`Failed to create profile: ${msg}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchProfiles, showSuccess, showError]);

  const updateProfile = useCallback(async (profile: Profile) => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electron.profiles.saveProfile(profile as any);
      if (result.success) {
        await fetchProfiles();
        showSuccess('Profile updated successfully');
        return true;
      } else {
        setError(result.error.message);
        showError(`Failed to update profile: ${result.error.message}`);
        return false;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showError(`Failed to update profile: ${msg}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchProfiles, showSuccess, showError]);

  const deleteProfile = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electron.profiles.deleteProfile(id);
      if (result.success) {
        await fetchProfiles();
        showSuccess('Profile deleted successfully');
        return true;
      } else {
        setError(result.error.message);
        showError(`Failed to delete profile: ${result.error.message}`);
        return false;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showError(`Failed to delete profile: ${msg}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchProfiles, showSuccess, showError]);

  const duplicateProfile = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electron.profiles.duplicateProfile(id);
      if (result.success) {
        await fetchProfiles();
        showSuccess('Profile duplicated successfully');
        return result.data as unknown as Profile;
      } else {
        setError(result.error.message);
        showError(`Failed to duplicate profile: ${result.error.message}`);
        return null;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showError(`Failed to duplicate profile: ${msg}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchProfiles, showSuccess, showError]);

  return {
    profiles,
    loading,
    error,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    duplicateProfile,
  };
}
