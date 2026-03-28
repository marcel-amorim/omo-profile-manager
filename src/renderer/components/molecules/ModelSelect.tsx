import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Sparkles, Clock } from 'lucide-react';

interface ModelSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  availableModels: string[];
  recommendedModels?: string[];
  hasError?: boolean;
}

export const ModelSelect: React.FC<ModelSelectProps> = ({
  id,
  value,
  onChange,
  availableModels,
  recommendedModels = [],
  hasError = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [recentModels, setRecentModels] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadRecentModels = () => {
      try {
        const stored = localStorage.getItem('omo-recent-models');
        if (stored) {
          setRecentModels(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to parse recent models', e);
      }
    };

    loadRecentModels();
    window.addEventListener('omo-recent-models-updated', loadRecentModels);

    return () => {
      window.removeEventListener('omo-recent-models-updated', loadRecentModels);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { availableRecommended, availableOther, availableRecent } = useMemo(() => {
    const searchLower = search.toLowerCase();
    
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const searchNormalized = normalize(search);
    
    const isMatch = (model: string) => {
      if (!search) return true;
      return model.toLowerCase().includes(searchLower) || normalize(model).includes(searchNormalized);
    };
    
    const installedRecommended = recommendedModels.filter(m => 
      availableModels.includes(m) || 
      availableModels.some(am => am.includes(m) || m.includes(am))
    );

    const filteredAvailable = availableModels.filter(m => isMatch(m));
    
    const recList = installedRecommended.filter(m => isMatch(m));
    const recentList = recentModels.filter(m => 
      availableModels.includes(m) && 
      !recList.includes(m) && 
      isMatch(m)
    );
    
    const otherList = filteredAvailable.filter(m => 
      !installedRecommended.includes(m) && 
      !recentList.includes(m)
    );

    return { availableRecommended: recList, availableOther: otherList, availableRecent: recentList };
  }, [search, availableModels, recommendedModels, recentModels]);

  const handleSelect = (model: string) => {
    onChange(model);
    setIsOpen(false);
    setSearch('');
    
    setRecentModels(prev => {
      const newRecent = [model, ...prev.filter(m => m !== model)].slice(0, 5);
      localStorage.setItem('omo-recent-models', JSON.stringify(newRecent));
      window.dispatchEvent(new Event('omo-recent-models-updated'));
      return newRecent;
    });
  };

  const handleOpen = () => {
    setIsOpen(true);
    setSearch('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  return (
    <div className={`relative w-full ${isOpen ? 'z-[100]' : ''}`} ref={wrapperRef}>
      <button
        type="button"
        id={id}
        onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 border rounded-lg shadow-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-shadow text-left ${
          hasError 
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        }`}
      >
        <span className="block truncate">
          {value || 'Select a model...'}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute z-[110] w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <input
              ref={inputRef}
              type="text"
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="overflow-y-auto flex-1 p-1">
            {availableRecommended.length > 0 && (
              <div className="mb-2">
                <div className="px-3 pt-2 pb-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Recommended
                </div>
                {availableRecommended.map(model => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => handleSelect(model)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between ${
                      value === model 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{model}</span>
                    {value === model && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}

            {availableRecent.length > 0 && (
              <div className="mb-2">
                <div className="px-3 pt-2 pb-1 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  Recent
                </div>
                {availableRecent.map(model => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => handleSelect(model)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between ${
                      value === model 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{model}</span>
                    {value === model && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}

            {availableOther.length > 0 && (
              <div>
                <div className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  All Models
                </div>
                {availableOther.map(model => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => handleSelect(model)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between ${
                      value === model 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{model}</span>
                    {value === model && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}
            
            {availableRecommended.length === 0 && availableRecent.length === 0 && availableOther.length === 0 && (
              <div className="px-3 py-4 text-sm text-slate-500 text-center">
                No models found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
