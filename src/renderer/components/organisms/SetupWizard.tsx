import React, { useState, useRef } from 'react';
import { Profile, OMOConfig } from '../../../shared/types';
import { DEFAULT_SISYPHUS_AGENT_SETTINGS, OMO_SCHEMA_URL } from '../../../shared/constants';
import { Settings, Upload, FilePlus, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { createImportedProfile, parseImportedProfileText } from '../../domain/profile-transfer';

interface SetupWizardProps {
  onComplete: (profile: Profile | null) => void;
}

type SetupOption = 'default' | 'import' | 'scratch' | null;

const DEFAULT_CONFIG: OMOConfig = {
  $schema: OMO_SCHEMA_URL,
  sisyphus_agent: { ...DEFAULT_SISYPHUS_AGENT_SETTINGS },
  agents: {
    sisyphus: { model: 'anthropic/claude-opus-4-6', variant: 'high' },
    oracle: { model: 'openai/gpt-5.4', variant: 'high' },
    librarian: { model: 'google/gemini-3-flash', variant: 'medium' },
    explore: { model: 'github-copilot/grok-code-fast-1', variant: 'medium' },
    'multimodal-looker': { model: 'openai/gpt-5.4', variant: 'medium' },
    prometheus: { model: 'anthropic/claude-opus-4-6', variant: 'high' },
    metis: { model: 'anthropic/claude-opus-4-6', variant: 'medium' },
    momus: { model: 'openai/gpt-5.4', variant: 'xhigh' },
    atlas: { model: 'anthropic/claude-sonnet-4-6', variant: 'medium' },
    hephaestus: { model: 'openai/gpt-5.3-codex', variant: 'high' },
  },
  categories: {
    'visual-engineering': { model: 'google/gemini-3.1-pro', variant: 'high' },
    'ultrabrain': { model: 'openai/gpt-5.4', variant: 'high' },
    'deep': { model: 'openai/gpt-5.3-codex', variant: 'high' },
    'artistry': { model: 'google/gemini-3.1-pro', variant: 'medium' },
    'quick': { model: 'openai/gpt-5.4-mini', variant: 'low' },
    'unspecified-low': { model: 'anthropic/claude-sonnet-4-6', variant: 'low' },
    'unspecified-high': { model: 'anthropic/claude-opus-4-6', variant: 'high' },
    'writing': { model: 'google/gemini-3-flash', variant: 'medium' },
  }
};

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<SetupOption>(null);
  const [importedProfile, setImportedProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = parseImportedProfileText(content);

      if (!parsed.success) {
        setError(parsed.message);
        return;
      }

      setImportedProfile(
        createImportedProfile(parsed.data, {
          descriptionFallback: 'Imported from file',
          idFactory: () => Date.now().toString(),
        })
      );
      setSelectedOption('import');
      setError(null);
    } catch {
      setError('Failed to read file.');
    }
  };

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (!selectedOption) {
        setError('Please select an option to continue.');
        return;
      }
      setStep(2);
    }
  };

  const handleFinish = () => {
    let profileToCreate: Profile | null = null;

    if (selectedOption === 'default') {
      profileToCreate = {
        id: Date.now().toString(),
        name: 'Default Profile',
        description: 'Recommended OMO configuration',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        config: DEFAULT_CONFIG
      };
    } else if (selectedOption === 'scratch') {
      profileToCreate = null;
    } else if (selectedOption === 'import' && importedProfile) {
      profileToCreate = importedProfile;
    }

    onComplete(profileToCreate);
  };

  return (
    <div data-testid="setup-wizard" className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[600px]">
        <div className="p-6 border-b border-gray-700 bg-gray-800/80">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="text-blue-500" />
            OMO Profile Manager Setup
          </h2>
          <div className="flex items-center gap-2 mt-4">
            <div className={`h-2 flex-1 rounded-full ${step >= 0 ? 'bg-blue-500' : 'bg-gray-700'}`} />
            <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-gray-700'}`} />
            <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-gray-700'}`} />
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          {step === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <Settings size={48} className="text-blue-400" />
              </div>
              <h3 className="text-3xl font-bold text-white">Welcome to OMO Profile Manager</h3>
              <p className="text-gray-400 text-lg max-w-md">
                It looks like this is your first time running the application. Let's get you set up with a configuration profile.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-xl font-semibold text-white mb-6">Choose how you want to start:</h3>
              
              {error && (
                <div className="p-4 bg-red-900/50 text-red-200 rounded-lg border border-red-800 flex items-center gap-2">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid gap-4">
                <button
                  type="button"
                  onClick={() => { setSelectedOption('default'); setError(null); }}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    selectedOption === 'default' 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-gray-700 bg-gray-800 hover:border-gray-500 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${selectedOption === 'default' ? 'bg-blue-500' : 'bg-gray-700'}`}>
                      <Settings className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">Recommended Defaults</h4>
                      <p className="text-gray-400 mt-1">Start with the latest recommended models tailored to each agent's strengths (Claude 4.6, GPT-5.4, Gemini, etc.).</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { 
                    setSelectedOption('import'); 
                    setError(null);
                    if (!importedProfile) {
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    selectedOption === 'import' 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-gray-700 bg-gray-800 hover:border-gray-500 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${selectedOption === 'import' ? 'bg-blue-500' : 'bg-gray-700'}`}>
                      <Upload className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white">Import Profile</h4>
                      <p className="text-gray-400 mt-1">Load an existing profile from a JSON file.</p>
                      {importedProfile && (
                        <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                          <Check size={14} /> Loaded: {importedProfile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".json" 
                  className="hidden" 
                />

                <button
                  type="button"
                  onClick={() => { setSelectedOption('scratch'); setError(null); }}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    selectedOption === 'scratch' 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-gray-700 bg-gray-800 hover:border-gray-500 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${selectedOption === 'scratch' ? 'bg-blue-500' : 'bg-gray-700'}`}>
                      <FilePlus className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">Start from Scratch</h4>
                      <p className="text-gray-400 mt-1">Create an empty profile and configure everything yourself.</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <Check size={48} className="text-green-400" />
              </div>
              <h3 className="text-3xl font-bold text-white">Ready to Go!</h3>
              <p className="text-gray-400 text-lg max-w-md">
                Your profile is ready to be created. Click finish to apply these settings and start using OMO Profile Manager.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 bg-gray-800/80 flex justify-between items-center">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-6 py-2.5 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              data-testid="skip-wizard-btn"
              onClick={() => {
                setSelectedOption('default');
                setStep(2);
              }}
              className="px-6 py-2.5 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            >
              Skip
            </button>
          )}
          
          {step < 2 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-colors"
            >
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              data-testid="wizard-finish-btn"
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 transition-colors"
            >
              Finish <Check size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
