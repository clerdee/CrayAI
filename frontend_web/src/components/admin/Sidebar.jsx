import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BrainCircuit, // For AI
  MessageSquareWarning, // For Moderation
  Database, // For Dataset
  Settings, 
  LogOut,
  Activity // For System Health
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/admin/dashboard' },
    { icon: BrainCircuit, label: 'AI Scan Logs', path: '/admin/scans' }, 
    { icon: Database, label: 'Training Data', path: '/admin/dataset' }, 
    { icon: MessageSquareWarning, label: 'Moderation', path: '/admin/moderation' },
    { icon: Users, label: 'User Management', path: '/admin/users' },
    { icon: Activity, label: 'System Health', path: '/admin/health' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-8 flex items-center gap-3">
        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white text-lg">🦞</div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">CrayAI</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-teal-50 text-teal-700 font-bold shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 mb-4">
        <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;