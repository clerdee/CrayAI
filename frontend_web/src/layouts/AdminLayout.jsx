import React from 'react';
import Sidebar from '../components/admin/Sidebar';
import Header from '../components/admin/Header';

const AdminLayout = ({ children, title = "Dashboard" }) => {
  return (
    <div className="flex h-screen bg-[#F4F7FE] font-sans">
      <Sidebar />
      
      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Header title={title} />
        
        <main className="flex-1 overflow-y-auto p-8">
            {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;