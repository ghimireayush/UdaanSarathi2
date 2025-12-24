import React from 'react';
import { FileText, Building2, ScrollText, Users, Tags, DollarSign, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage.js';

const SectionNavigation = ({ activeSection, onSectionClick }) => {
  const { tPageSync } = useLanguage({ pageName: 'job-management', autoLoad: true });
  
  const tPage = (key, params = {}) => {
    return tPageSync(key, params);
  };

  const sections = [
    { key: 'image', label: tPage('sections.jobImage'), icon: ImageIcon },
    { key: 'basic', label: tPage('sections.basicInfo'), icon: FileText },
    { key: 'employer', label: tPage('sections.employer'), icon: Building2 },
    { key: 'contract', label: tPage('sections.contract'), icon: ScrollText },
    { key: 'positions', label: tPage('sections.positions'), icon: Users },
    { key: 'tags', label: tPage('sections.tags'), icon: Tags },
    { key: 'expenses', label: tPage('sections.expenses'), icon: DollarSign }
  ];
  return (
    <nav className="sticky top-6 sm:top-8">
      <ul className="space-y-0.5 sm:space-y-1">
        {sections.map(({ key, label, icon: Icon }) => (
          <li key={key}>
            <button
              onClick={() => onSectionClick(key)}
              className={`w-full flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors gap-2 ${
                activeSection === key
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SectionNavigation;
