import React from 'react';
import { Search, Bell, Calendar } from 'lucide-react';

const Header = ({ title }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <header className="flex justify-between items-center bg-white px-8 py-5 border-b border-slate-100 sticky top-0 z-10">
      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>

      <div className="flex items-center gap-6">
        {/* Search */}
        {/* <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer transition">
            <Search className="w-5 h-5" />
        </div> */}

        {/* Notification */}
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer transition relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
            <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-800">{user.firstName || 'Admin'} {user.lastName}</p>
                <p className="text-xs text-slate-500">Super Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-teal-100 border-2 border-white shadow-sm overflow-hidden">
                <img 
                    src={user.profilePic || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0D9488&color=fff`} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                />
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;