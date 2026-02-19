import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Clock, Camera, Users, LogOut, X, User, Menu } from 'lucide-react';

const Sidebar = ({ user, isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'History', path: '/history', icon: Clock },
    { name: 'Scan', path: '/scan', icon: Camera },
    { name: 'Community', path: '/community', icon: Users },
  ];

  return (
    <>
      {/* Mobile Dark Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#293241]/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container: Fixed on mobile, Relative on desktop to push content cleanly */}
      <aside 
        className={`fixed md:relative inset-y-0 left-0 z-50 bg-[#293241] shadow-2xl transition-all duration-300 ease-in-out flex flex-col flex-shrink-0 h-screen
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20 w-64'}
        `}
      >
        
        {/* LOGO AREA WITH INTEGRATED HAMBURGER MENU */}
        <div className={`flex items-center h-20 flex-shrink-0 border-b border-[#3D5A80] ${isOpen ? 'px-4 justify-between md:justify-start' : 'justify-center'}`}>
          
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="hidden md:flex p-2 text-[#E0FBFC] rounded-lg hover:bg-[#3D5A80]/50 transition-colors flex-shrink-0"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link to="/dashboard" className={`text-white font-black tracking-widest flex items-center overflow-hidden whitespace-nowrap ${isOpen ? 'md:ml-3' : ''}`}>
            <span className={`text-2xl transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden md:block'}`}>
              CRAY<span className="text-[#98C1D9]">AI</span>
            </span>
          </Link>

          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-[#98C1D9] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Profile Summary */}
        <div className={`p-4 border-b border-[#3D5A80] flex flex-shrink-0 transition-all duration-300 ${isOpen ? 'items-center gap-4 px-6' : 'justify-center px-2'}`}>
          <div className="w-12 h-12 rounded-full bg-[#E0FBFC] overflow-hidden flex-shrink-0 border-2 border-[#3D5A80]">
            {user?.profilePic ? (
              <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-full h-full p-2 text-[#3D5A80]" />
            )}
          </div>
          
          <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden md:block'}`}>
            <p className="text-sm font-bold text-white truncate">{user?.firstName || 'Researcher'}</p>
            <p className="text-xs font-medium text-[#98C1D9] truncate">User Account</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-3 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <div key={link.name} className="relative group">
                <Link
                  to={link.path}
                  onClick={() => { if (window.innerWidth < 768) setIsOpen(false); }}
                  className={`flex items-center ${isOpen ? 'justify-start px-4' : 'justify-center px-0'} py-3.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#3D5A80] text-white shadow-md shadow-[#3D5A80]/20' 
                      : 'text-[#98C1D9] hover:bg-[#3D5A80]/40 hover:text-white'
                  }`}
                >
                  <link.icon className={`w-6 h-6 flex-shrink-0 ${isActive ? 'text-[#E0FBFC]' : ''}`} />
                  
                  <span className={`whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 ml-4 w-auto' : 'opacity-0 w-0 hidden md:block'}`}>
                    {link.name}
                  </span>
                </Link>

                {!isOpen && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-white text-[#293241] text-xs font-bold rounded-lg shadow-lg opacity-0 md:group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-slate-100 hidden md:block">
                    {link.name}
                    <div className="absolute top-1/2 -left-1 w-2 h-2 bg-white rotate-45 -translate-y-1/2 border-b border-l border-slate-100"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-[#3D5A80] flex-shrink-0">
          <div className="relative group">
            <button 
              onClick={handleLogout} 
              className={`w-full flex items-center ${isOpen ? 'justify-start px-4' : 'justify-center px-0'} py-3.5 rounded-xl text-sm font-bold text-[#E76F51] hover:bg-[#E76F51]/10 transition-colors`}
            >
              <LogOut className="w-6 h-6 flex-shrink-0" />
              <span className={`whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 ml-4 w-auto' : 'opacity-0 w-0 hidden md:block'}`}>
                Log Out
              </span>
            </button>
            
            {!isOpen && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-[#E76F51] text-white text-xs font-bold rounded-lg shadow-lg opacity-0 md:group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 hidden md:block">
                Log Out
                <div className="absolute top-1/2 -left-1 w-2 h-2 bg-[#E76F51] rotate-45 -translate-y-1/2"></div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;