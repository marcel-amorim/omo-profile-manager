import React from 'react';
import { Settings2 } from 'lucide-react';
import { OMOCategoryConfig } from '../../../shared/types';
import { CategoryName, DEFAULT_CATEGORIES } from '../../../shared/constants';
import { ModelSelect } from '../molecules/ModelSelect';
import { SectionHeader } from '../atoms/SectionHeader';
import { CATEGORY_MODEL_RECOMMENDATIONS } from '../../../shared/model-recommendations';

interface CategoryEditorProps {
  categories: Record<CategoryName, OMOCategoryConfig>;
  onChange: <K extends keyof OMOCategoryConfig>(
    category: CategoryName,
    field: K,
    value: OMOCategoryConfig[K]
  ) => void;
  className?: string;
  availableModels?: string[];
}

const CATEGORY_DESCRIPTIONS: Record<CategoryName, string> = {
  'visual-engineering': "Frontend, UI/UX, design, styling, animation",
  'ultrabrain': "Hard logic, architecture decisions, algorithms",
  'deep': "Autonomous research, complex problem-solving",
  'artistry': "Creative, unconventional approaches",
  'quick': "Trivial tasks, single-file changes",
  'unspecified-low': "Low effort miscellaneous tasks",
  'unspecified-high': "High effort miscellaneous tasks",
  'writing': "Documentation, prose, technical writing"
};

export const CategoryEditor: React.FC<CategoryEditorProps> = ({ 
  categories, 
  onChange, 
  className = '',
  availableModels = []
}) => {
  return (
    <div className={`flex flex-col h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 ${className}`}>
      <SectionHeader
        icon={<Settings2 className="w-6 h-6" />}
        title="Category Configuration"
        description="Set default models for different task categories"
        accent="purple"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {DEFAULT_CATEGORIES.map(category => {
          const config = categories[category] || { model: '', variant: 'medium' };
          
          return (
            <div 
              key={category} 
              className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-sm group"
            >
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 capitalize group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {category.replace('-', ' ')}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {CATEGORY_DESCRIPTIONS[category]}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor={`model-${category}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Model
                  </label>
                  <ModelSelect
                    id={`model-${category}`}
                    value={config.model || ''}
                    onChange={(value) => onChange(category, 'model', value)}
                    availableModels={availableModels}
                    recommendedModels={CATEGORY_MODEL_RECOMMENDATIONS[category as CategoryName]}
                    hasError={!config.model || config.model.trim() === ''}
                  />
                </div>
                
                <div>
                  <label htmlFor={`variant-${category}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Variant
                  </label>
                  <select
                    id={`variant-${category}`}
                    value={config.variant || 'medium'}
                    onChange={(e) => onChange(category, 'variant', e.target.value as OMOCategoryConfig['variant'])}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-slate-100 transition-shadow shadow-sm"
                  >
                    <option value="low">Low (Faster)</option>
                    <option value="medium">Medium (Balanced)</option>
                    <option value="high">High (Better Quality)</option>
                    <option value="xhigh">Extra High (Best Quality)</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryEditor;
