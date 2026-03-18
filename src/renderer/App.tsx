import { useState, useEffect, useCallback } from 'react';
import { ProfileList } from './components/ProfileList';
import { AgentEditor } from './components/AgentEditor';
import { CategoryEditor } from './components/CategoryEditor';
import { ApplyModal } from './components/ApplyModal';
import { ThemeToggle } from './components/ThemeToggle';
import { SetupWizard } from './components/SetupWizard';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useProfiles } from './hooks/useProfiles';
import { useToast } from './hooks/useToast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Profile, OMOAgentConfig, OMOCategoryConfig, createDefaultOMOConfig } from '../shared/types';
import { CategoryName } from '../shared/constants';
import { validateProfileSafe } from '../shared/schemas';
import { Save, AlertCircle, ArrowLeft } from 'lucide-react';

function AppContent() {
  const {
    profiles,
    loading,
    error,
    createProfile,
    updateProfile,
    deleteProfile,
    duplicateProfile,
  } = useProfiles();

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [localProfile, setLocalProfile] = useState<Profile | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [profileToApply, setProfileToApply] = useState<Profile | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [isCheckingFirstLaunch, setIsCheckingFirstLaunch] = useState(true);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [hasInitializedProfileSelection, setHasInitializedProfileSelection] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        const [configResult, modelsResult] = await Promise.all([
          window.electron.config.configExists(),
          window.electron.models.listModels()
        ]);
        
        if (configResult.success && !configResult.data && profiles.length === 0) {
          setShowWizard(true);
        }

        if (modelsResult.success) {
          setAvailableModels(modelsResult.data);
        }
      } catch (err) {
        console.error('Failed to initialize app:', err);
      } finally {
        setIsCheckingFirstLaunch(false);
      }
    };

    if (!loading) {
      initApp();
    }
  }, [loading, profiles.length]);

  useEffect(() => {
    if (selectedProfileId) {
      const profile = profiles.find(p => p.id === selectedProfileId);
      if (profile) {
        setLocalProfile(JSON.parse(JSON.stringify(profile)));
        setIsDirty(false);
        setSaveError(null);
      } else {
        setLocalProfile(null);
      }
    } else {
      setLocalProfile(null);
    }
  }, [selectedProfileId, profiles]);

  useEffect(() => {
    if (loading || hasInitializedProfileSelection) {
      return;
    }

    let cancelled = false;

    const initializeProfileSelection = async () => {
      if (profiles.length === 0) {
        if (!cancelled) {
          setActiveProfileId(null);
          setSelectedProfileId(null);
          setHasInitializedProfileSelection(true);
        }
        return;
      }

      let resolvedActiveProfileId: string | null = null;

      try {
        const activeResult = await window.electron.profiles.getActiveProfileId();
        if (
          activeResult.success &&
          activeResult.data &&
          profiles.some((profile) => profile.id === activeResult.data)
        ) {
          resolvedActiveProfileId = activeResult.data;
        }
      } catch (err) {
        console.error('Failed to restore active profile:', err);
      }

      if (cancelled) {
        return;
      }

      const defaultProfileId = profiles[0].id;
      const initialProfileId = resolvedActiveProfileId ?? defaultProfileId;

      setActiveProfileId(initialProfileId);
      setSelectedProfileId(initialProfileId);
      setHasInitializedProfileSelection(true);
    };

    initializeProfileSelection();

    return () => {
      cancelled = true;
    };
  }, [loading, profiles, hasInitializedProfileSelection]);

  useEffect(() => {
    if (!activeProfileId) {
      return;
    }

    const activeStillExists = profiles.some((profile) => profile.id === activeProfileId);
    if (!activeStillExists) {
      setActiveProfileId(profiles.length > 0 ? profiles[0].id : null);
    }
  }, [profiles, activeProfileId]);

  const handleAgentChange = useCallback((agentName: string, config: OMOAgentConfig) => {
    setLocalProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        config: {
          ...prev.config,
          agents: {
            ...prev.config.agents,
            [agentName]: config
          }
        }
      };
    });
    setIsDirty(true);
  }, []);

  const handleCategoryChange = useCallback((category: CategoryName, field: keyof OMOCategoryConfig, value: any) => {
    setLocalProfile(prev => {
      if (!prev) return prev;
      const currentCategoryConfig = prev.config.categories[category] || { model: '', variant: 'medium' };
      return {
        ...prev,
        config: {
          ...prev.config,
          categories: {
            ...prev.config.categories,
            [category]: {
              ...currentCategoryConfig,
              [field]: value
            }
          }
        }
      };
    });
    setIsDirty(true);
  }, []);

  const { success: showSuccess, error: showError } = useToast();

  const handleSave = async () => {
    if (!localProfile) return;
    
    const validation = validateProfileSafe(localProfile);
    if (!validation.success) {
      const errorMsg = `Validation failed: ${validation.error.issues.map((e: any) => e.message).join(', ')}`;
      setSaveError(errorMsg);
      showError(errorMsg);
      return;
    }

    const success = await updateProfile(localProfile);
    if (success) {
      setIsDirty(false);
      setSaveError(null);
    } else {
      setSaveError('Failed to save profile');
    }
  };

  const handleCreateProfile = async () => {
    const newProfile: Profile = {
      id: Date.now().toString(),
      name: 'New Profile',
      description: 'A new configuration profile',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      config: createDefaultOMOConfig()
    };
    const success = await createProfile(newProfile);
    if (success) {
      setSelectedProfileId(newProfile.id);
    }
  };

  const handleImportProfile = async (profileData: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProfile: Profile = {
      ...profileData,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const success = await createProfile(newProfile);
    if (success) {
      setSelectedProfileId(newProfile.id);
      showSuccess('Profile imported successfully');
    }
    return success;
  };

  const handleApplyProfile = async () => {
    if (!profileToApply) return;
    
    try {
      const result = await window.electron.config.writeConfig(profileToApply.config);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      
      const activeResult = await window.electron.profiles.setActiveProfileId(profileToApply.id);
      if (activeResult && !activeResult.success) {
        throw new Error(activeResult.error.message);
      }
       
      setActiveProfileId(profileToApply.id);
      setSelectedProfileId(profileToApply.id);
      showSuccess('Profile applied successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showError(`Failed to apply profile: ${msg}`);
      throw err;
    }
  };

  const handleWizardComplete = async (profile: Profile | null) => {
    if (profile) {
      const success = await createProfile(profile);
      if (success) {
        setSelectedProfileId(profile.id);
        setProfileToApply(profile);
      }
    }
    setShowWizard(false);
  };

  useKeyboardShortcuts({
    profiles,
    selectedProfileId,
    localProfile,
    isDirty,
    onSelectProfile: setSelectedProfileId,
    onCreateProfile: handleCreateProfile,
    onSaveProfile: handleSave,
    setProfileToApply,
  });

  if (isCheckingFirstLaunch) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      {showWizard && <SetupWizard onComplete={handleWizardComplete} />}
      <div className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 bg-slate-50 dark:bg-slate-900 transition-colors duration-200 ${selectedProfileId ? 'hidden md:block' : 'block'}`}>
        <ProfileList
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          activeProfileId={activeProfileId}
          onSelectProfile={setSelectedProfileId}
          onCreateProfile={handleCreateProfile}
          onDuplicateProfile={duplicateProfile}
          onDeleteProfile={deleteProfile}
          onApplyProfile={(id) => {
            const profile = profiles.find(p => p.id === id);
            if (profile) setProfileToApply(profile);
          }}
          onImportProfile={handleImportProfile}
        />
      </div>

      <div className={`flex-1 flex-col overflow-hidden relative bg-white dark:bg-slate-950 transition-colors duration-200 ${selectedProfileId ? 'flex' : 'hidden md:flex'}`}>
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 flex items-center justify-center z-50 transition-colors duration-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-b border-red-200 dark:border-red-800/30 flex items-center gap-2 transition-colors duration-200">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {localProfile ? (
          <>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-950 transition-colors duration-200">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedProfileId(null)}
                  className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md transition-colors flex-shrink-0"
                  title="Back to profiles"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                  <input
                  type="text"
                  data-testid="profile-name-input"
                  value={localProfile.name}
                  onChange={(e) => {
                    setLocalProfile({ ...localProfile, name: e.target.value });
                    setIsDirty(true);
                  }}
                  className="text-2xl sm:text-3xl font-bold bg-transparent border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:outline-none px-1 py-0.5 rounded-t text-slate-900 dark:text-white transition-colors duration-200 w-full"
                />
                <input
                  type="text"
                  data-testid="profile-description-input"
                  value={localProfile.description || ''}
                  onChange={(e) => {
                    setLocalProfile({ ...localProfile, description: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="Profile description..."
                  className="block text-slate-500 dark:text-slate-400 text-sm bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:outline-none px-1 py-0.5 rounded-t w-full mt-1 transition-colors duration-200"
                />
              </div>
            </div>
              <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                <ThemeToggle />
                {saveError && (
                  <span className="text-red-600 dark:text-red-400 text-sm max-w-xs truncate" title={saveError}>{saveError}</span>
                )}
                <button
                  type="button"
                  data-testid="save-profile-btn"
                  onClick={handleSave}
                  disabled={!isDirty || loading}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm ${
                    isDirty 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-16 space-y-8">
              <AgentEditor 
                agents={localProfile.config.agents || {}} 
                onChange={handleAgentChange}
                availableModels={availableModels}
              />
              <CategoryEditor 
                categories={localProfile.config.categories || {}} 
                onChange={handleCategoryChange}
                availableModels={availableModels}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 transition-colors duration-200">
            <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <AlertCircle size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-lg font-medium">Select a profile to edit</p>
            <p className="text-sm mt-2">Or create a new one from the sidebar</p>
          </div>
        )}
      </div>

      {profileToApply && (
        <ApplyModal
          profile={profileToApply}
          isOpen={!!profileToApply}
          onClose={() => setProfileToApply(null)}
          onConfirm={handleApplyProfile}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AppContent />
          <ToastContainer />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
