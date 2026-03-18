import React, { useState, useRef, useMemo } from 'react';
import { Search, Plus, Copy, Trash2, CheckCircle, Clock, Upload, Download, AlertCircle, X } from 'lucide-react';
import { Profile } from '../../shared/types';
import { validateProfileSafe } from '../../shared/schemas';

const isMac = navigator.platform.toLowerCase().includes('mac');
const modKey = isMac ? '⌘' : 'Ctrl';

interface ProfileListProps {
  profiles: Profile[];
  selectedProfileId: string | null;
  activeProfileId: string | null;
  onSelectProfile: (id: string) => void;
  onCreateProfile: () => void;
  onDuplicateProfile: (id: string) => void;
  onDeleteProfile: (id: string) => void;
  onApplyProfile: (id: string) => void;
  onImportProfile?: (profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  className?: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success';
}

export const ProfileList: React.FC<ProfileListProps> = ({ 
  profiles,
  selectedProfileId,
  activeProfileId,
  onSelectProfile,
  onCreateProfile,
  onDuplicateProfile,
  onDeleteProfile,
  onApplyProfile,
  onImportProfile,
  className = '' 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => 
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [profiles, searchQuery]);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sanitizeFilename = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  };

  const handleExportProfile = (profile: Profile) => {
    const exportData = {
      name: profile.name,
      description: profile.description,
      config: profile.config,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilename(profile.name)}-omo-profile.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const processImportedFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      showToast('Invalid file type. Please select a JSON file.', 'error');
      return;
    }

    try {
      const text = await file.text();
      let parsedData: unknown;

      try {
        parsedData = JSON.parse(text);
        if (parsedData && typeof parsedData === 'object') {
          if (!('id' in parsedData)) (parsedData as any).id = Date.now().toString();
          if (!('createdAt' in parsedData)) (parsedData as any).createdAt = Date.now();
          if (!('updatedAt' in parsedData)) (parsedData as any).updatedAt = Date.now();
        }
      } catch {
        showToast('Invalid JSON format. Please check your file.', 'error');
        return;
      }

      const result = validateProfileSafe(parsedData);

      if (!result.success) {
        const issues = (result.error as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues;
        const errorMessages = (issues || []).map(e => `${e.path.join('.')}: ${e.message}`).slice(0, 3);
        showToast(`Validation failed: ${errorMessages.join(', ')}`, 'error');
        return;
      }

      const validatedProfile = result.data;

      if (onImportProfile) {
        const success = await onImportProfile({
          name: validatedProfile.name,
          description: validatedProfile.description,
          config: validatedProfile.config,
        });

        if (success) {
          showToast(`Profile "${validatedProfile.name}" imported successfully`, 'success');
        } else {
          showToast('Failed to import profile. Please try again.', 'error');
        }
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to read file', 'error');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processImportedFile(file);
    event.target.value = '';
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(f => f.name.endsWith('.json'));

    if (!jsonFile) {
      showToast('Please drop a JSON file', 'error');
      return;
    }

    await processImportedFile(jsonFile);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectProfile(id);
    }
  };

  return (
    <div 
      className={`flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-500 border-dashed m-4 rounded-xl flex items-center justify-center z-50 pointer-events-none backdrop-blur-sm transition-all">
          <div className="text-center bg-white/90 dark:bg-slate-900/90 p-6 rounded-2xl shadow-xl">
            <Upload className="mx-auto mb-3 text-blue-600 dark:text-blue-400" size={48} />
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">Drop JSON file to import</p>
          </div>
        </div>
      )}

      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white dark:bg-slate-950/50">
        <h2 className="text-xl font-bold tracking-tight">Profiles</h2>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button 
            type="button"
            onClick={handleImportClick}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm font-medium"
          >
            <Upload size={16} />
            Import
          </button>
          <button
            type="button"
            data-testid="create-profile-btn"
            onClick={onCreateProfile}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm shadow-blue-500/20"
            title={`Create New Profile (${modKey}+N)`}
          >
            <Plus size={16} />
            New
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search profiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400 flex flex-col items-center">
            <Search size={32} className="mb-3 opacity-20" />
            <p>No profiles found matching "{searchQuery}"</p>
          </div>
        ) : (
          filteredProfiles.map((profile) => {
            const isActive = profile.id === activeProfileId;
            const isSelected = profile.id === selectedProfileId;

            return (
              <button
                key={profile.id}
                type="button"
                data-testid={`profile-item-${profile.name}`}
                onClick={() => onSelectProfile(profile.id)}
                onKeyDown={(e) => handleKeyDown(e, profile.id)}
                className={`
                  w-full text-left relative p-4 rounded-xl border transition-all cursor-pointer group
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap flex-1">
                    <h3 className={`font-semibold text-base truncate ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {profile.name}
                    </h3>
                    {isActive && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] uppercase tracking-wider rounded-full font-bold shrink-0">
                        <CheckCircle size={10} />
                        Active
                      </span>
                    )}
                  </div>
                  
                  <div className={`flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}`}>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleExportProfile(profile); }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Export Profile"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      type="button"
                      data-testid="apply-profile-btn"
                      onClick={(e) => { e.stopPropagation(); onApplyProfile(profile.id); }}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={isActive ? 'Reapply Profile' : 'Apply Profile'}
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button 
                      type="button"
                      data-testid="duplicate-profile-btn"
                      onClick={(e) => { e.stopPropagation(); onDuplicateProfile(profile.id); }}
                      className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Duplicate Profile"
                    >
                      <Copy size={16} />
                    </button>
                    <button 
                      type="button"
                      data-testid="delete-profile-btn"
                      onClick={(e) => { e.stopPropagation(); onDeleteProfile(profile.id); }}
                      disabled={isActive}
                      className={`p-1.5 rounded-md transition-colors ${
                        isActive 
                          ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' 
                          : 'text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                      title={isActive ? "Cannot delete active profile" : "Delete Profile"}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {profile.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                    {profile.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>Modified {formatDate(profile.updatedAt)}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="fixed bottom-4 right-4 space-y-2 z-50 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl pointer-events-auto min-w-[300px] max-w-[500px] transform transition-all ${
              toast.type === 'error' 
                ? 'bg-red-600 text-white' 
                : 'bg-emerald-600 text-white'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle size={20} />
            ) : (
              <CheckCircle size={20} />
            )}
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileList;
