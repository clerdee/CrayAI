import React, { useState, useEffect } from 'react';
import { MessageSquareText } from 'lucide-react';
import Header from '../components/user/Header';
import Sidebar from '../components/user/Sidebar';
import client from '../api/client';

const UserLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  
  // Now ONLY used for mobile screens!
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await client.get('/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) setUser(res.data.user);
      } catch (error) {
        console.error("Failed to fetch user context for layout", error);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#F4F7F9] overflow-hidden">
      
      {/* Sidebar Component */}
      <Sidebar user={user} isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />

      {/* Main Content Area (Permanently leaves 80px space on desktop for the collapsed icons) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen relative transition-all duration-300 md:pl-20 pl-0">
        
        <Header user={user} toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
          {children}
        </main>

      </div>

      {/* Floating Chatbot */}
      <button 
        onClick={() => alert("Chatbot Triggered!")}
        className="fixed bottom-6 right-6 z-40 bg-[#E76F51] text-white p-4 rounded-full shadow-lg shadow-[#E76F51]/30 hover:bg-[#D65A3E] hover:scale-110 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
      >
        <MessageSquareText className="w-7 h-7" />
        <div className="absolute right-full mr-4 bg-white text-[#293241] text-xs font-bold px-3 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-100">
          Ask CrayBot!
          <div className="absolute top-1/2 -right-1 w-2 h-2 bg-white rotate-45 -translate-y-1/2 border-t border-r border-slate-100"></div>
        </div>
      </button>
    </div>
  );
};

export default UserLayout;