import React from 'react';

interface ProfileManagerTemplateProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  sidebarVisibleOnMobile: boolean;
  wizard?: React.ReactNode;
  modal?: React.ReactNode;
}

export const ProfileManagerTemplate: React.FC<ProfileManagerTemplateProps> = ({
  sidebar,
  content,
  sidebarVisibleOnMobile,
  wizard,
  modal,
}) => {
  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      {wizard}

      <aside
        className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 bg-slate-50 dark:bg-slate-900 transition-colors duration-200 ${
          sidebarVisibleOnMobile ? 'hidden md:block' : 'block'
        }`}
      >
        {sidebar}
      </aside>

      {content}
      {modal}
    </div>
  );
};

export default ProfileManagerTemplate;
