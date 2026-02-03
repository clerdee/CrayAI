import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    // Added backdrop-blur and a subtle border for that "premium" SaaS feel
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* --- LEFT: LOGO (Flex-1 ensures it pushes against the center) --- */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-3xl">🦐</span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CrayAI</h1>
        </div>

        {/* --- CENTER: LINKS (Flex-none ensures it sits perfectly in the middle) --- */}
        <div className="hidden md:flex gap-10 text-sm font-semibold text-slate-500">
          {/* <a href="#features" className="hover:text-teal-600 transition duration-300">Solutions</a>
          <a href="#research" className="hover:text-teal-600 transition duration-300">For Researchers</a>
          <a href="#about" className="hover:text-teal-600 transition duration-300">About Us</a> */}
        </div>

        {/* --- RIGHT: BUTTONS (Flex-1 + Justify-End pushes these to the edge) --- */}
        <div className="flex items-center justify-end gap-6 flex-1">
          <Link 
            to="/login" 
            className="text-slate-900 font-semibold hover:text-teal-600 text-sm transition"
          >
            Login
          </Link>
          <Link 
            to="/register" 
            className="bg-teal-50 text-teal-700 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-teal-100 hover:shadow-sm transition duration-300"
          >
            Let's Connect
          </Link>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;