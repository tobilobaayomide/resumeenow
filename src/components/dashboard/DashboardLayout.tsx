import React from 'react';
import Sidebar from './Sidebar';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex font-sans">
    <Sidebar />
    <div className="flex-1 flex flex-col min-h-screen">
      {children}
    </div>
  </div>
);

export default DashboardLayout;