import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Clock, Camera, Users, LogOut, X, User, MessageSquare, Bell } from 'lucide-react';

const Sidebar = ({ user, isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Community', path: '/community', icon: Users },
    { name: 'Scan', path: '/scan', icon: Camera },
    { name: 'History', path: '/history', icon: Clock },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  return (
    <>
      {/* Mobile Dark Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-[#293241]/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container: Adds group/sidebar to control hover states inside */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-[#293241] shadow-2xl transition-all duration-300 ease-in-out flex flex-col group/sidebar
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'} 
          md:translate-x-0 md:w-20 md:hover:w-64
        `}
      >
        
        {/* LOGO AREA */}
        <div className="flex items-center h-20 flex-shrink-0 border-b border-[#3D5A80] px-4 justify-between md:justify-center group-hover/sidebar:md:justify-start transition-all duration-300 relative">
          
          <Link to="/dashboard" className="flex items-center whitespace-nowrap">
            {/* The 'C' Icon: Shows ONLY on desktop when collapsed */}
            <span className="text-3xl font-black text-[#98C1D9] hidden md:block group-hover/sidebar:md:hidden absolute left-1/2 -translate-x-1/2">
              C
            </span>
            
            {/* The Full Logo: Shows on Mobile, or on Desktop Hover */}
            <span className="text-2xl font-black text-white flex items-center md:opacity-0 md:scale-90 group-hover/sidebar:md:opacity-100 group-hover/sidebar:md:scale-100 transition-all duration-300 origin-left">
              CRAY<span className="text-[#98C1D9]">AI</span>
            </span>
          </Link>

          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-2 text-[#98C1D9] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* USER PROFILE SUMMARY */}
        <div className="p-4 border-b border-[#3D5A80] flex flex-shrink-0 transition-all duration-300 items-center md:justify-center group-hover/sidebar:md:justify-start group-hover/sidebar:md:px-6 relative">
          <div className="w-12 h-12 rounded-full bg-[#E0FBFC] overflow-hidden flex-shrink-0 border-2 border-[#3D5A80]">
            {user?.profilePic ? (
              <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-full h-full p-2 text-[#3D5A80]" />
            )}
          </div>
          
          {/* Text transitions using max-width trick */}
          <div className="flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300 ml-4 md:ml-0 md:max-w-0 md:opacity-0 group-hover/sidebar:md:max-w-[200px] group-hover/sidebar:md:opacity-100 group-hover/sidebar:md:ml-4">
            <p className="text-sm font-bold text-white truncate">{user?.firstName || 'Researcher'}</p>
            <p className="text-xs font-medium text-[#98C1D9] truncate">User Account</p>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-3 py-6 space-y-3 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => { if (window.innerWidth < 768) setIsMobileOpen(false); }}
                className={`flex items-center px-4 md:px-0 group-hover/sidebar:md:px-4 md:justify-center group-hover/sidebar:md:justify-start py-3.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#3D5A80] text-white shadow-md shadow-[#3D5A80]/20' 
                    : 'text-[#98C1D9] hover:bg-[#3D5A80]/40 hover:text-white'
                }`}
              >
                <link.icon className={`w-6 h-6 flex-shrink-0 ${isActive ? 'text-[#E0FBFC]' : ''}`} />
                
                {/* Link text animates smoothly */}
                <span className="whitespace-nowrap overflow-hidden transition-all duration-300 ml-4 md:ml-0 md:max-w-0 md:opacity-0 group-hover/sidebar:md:max-w-[200px] group-hover/sidebar:md:opacity-100 group-hover/sidebar:md:ml-4">
                  {link.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT BUTTON */}
        <div className="p-3 border-t border-[#3D5A80] flex-shrink-0">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center px-4 md:px-0 group-hover/sidebar:md:px-4 md:justify-center group-hover/sidebar:md:justify-start py-3.5 rounded-xl text-sm font-bold text-[#E76F51] hover:bg-[#E76F51]/10 transition-colors"
          >
            <LogOut className="w-6 h-6 flex-shrink-0" />
            <span className="whitespace-nowrap overflow-hidden transition-all duration-300 ml-4 md:ml-0 md:max-w-0 md:opacity-0 group-hover/sidebar:md:max-w-[200px] group-hover/sidebar:md:opacity-100 group-hover/sidebar:md:ml-4">
              Log Out
            </span>
          </button>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;