// src/ui/components/Tabs.tsx
import React, { useState } from 'react';

interface TabProps {
  label: string;
  children: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>;
};

interface TabsProps {
  children: React.ReactElement<TabProps>[];
}

export const Tabs: React.FC<TabsProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <div className="tab-list" role="tablist" aria-label="Configuration tabs">
        {children.map((child, index) => (
          <button
            key={index}
            role="tab"
            id={`tab-${index}`}
            aria-selected={index === activeTab}
            aria-controls={`tabpanel-${index}`}
            className={index === activeTab ? 'active' : ''}
            onClick={() => setActiveTab(index)}
          >
            {child.props.label}
          </button>
        ))}
      </div>
      <div 
        id={`tabpanel-${activeTab}`}
        role="tabpanel" 
        aria-labelledby={`tab-${activeTab}`}
        className="tab-content"
      >
        {children[activeTab]}
      </div>
    </div>
  );
};
