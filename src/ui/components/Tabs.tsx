// src/ui/components/Tabs.tsx
import React, { useState } from 'react';

interface TabProps {
  label: string;
  children: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <div>{children}</div>;
};

interface TabsProps {
  children: React.ReactElement<TabProps>[];
}

export const Tabs: React.FC<TabsProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <div className="tab-list">
        {children.map((child, index) => (
          <button
            key={index}
            className={index === activeTab ? 'active' : ''}
            onClick={() => setActiveTab(index)}
          >
            {child.props.label}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {children[activeTab]}
      </div>
    </div>
  );
};