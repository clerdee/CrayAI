import React, { useState } from 'react';
import { Menu, HelpCircle, AlertCircle, X, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = ({ user, toggleMobileMenu }) => {
  const [showHelpModal, setShowHelpModal] = useState(false);

  const faqs = [
    { q: 'How do I start scanning?', a: 'Navigate to the Dashboard and click "New Scan", or use the Camera tab.' },
    { q: 'Where are my results?', a: 'Your recent scans are saved automatically in the History section.' },
    { q: 'How do I post?', a: 'Go to the Community page and click "New Post" to share your findings.' }
  ];

  return (
    <>
      <header className="bg-[#3D5A80] border-b-[3px] border-[#98C1D9] z-30 shadow-sm flex-shrink-0 w-full">
        <div className="flex justify-between items-center px-4 md:px-8 h-20">
          
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger - Only shows on mobile devices */}
            <button 
              onClick={toggleMobileMenu}
              className="md:hidden p-2 bg-[#293241] text-[#E0FBFC] rounded-lg hover:bg-[#293241]/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[#98C1D9]/50"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-black text-white hidden sm:block tracking-wide">
              CRAYFISH <span className="text-[#98C1D9]">AI</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <button 
              onClick={() => setShowHelpModal(true)}
              className="p-2.5 text-[#E0FBFC] bg-[#293241]/40 hover:bg-[#293241] rounded-full transition-colors shadow-sm"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            <Link 
              to="/profile"
              className="flex items-center gap-2 p-1.5 pr-4 bg-[#293241] rounded-full border border-[#98C1D9]/30 hover:border-[#98C1D9] transition-all focus:outline-none shadow-sm"
            >
              <div className="w-9 h-9 rounded-full bg-[#E0FBFC] overflow-hidden">
                {user?.profilePic ? (
                  <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-full h-full p-2 text-[#3D5A80]" />
                )}
              </div>
              <span className="text-sm font-bold text-white hidden md:block max-w-[120px] truncate">
                {user?.firstName || 'Profile'}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* --- HELP / FAQ MODAL --- */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#293241]/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-[#293241]">Help & FAQs</h2>
                <button onClick={() => setShowHelpModal(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="flex gap-4 items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${idx % 2 === 0 ? 'bg-[#3D5A80] text-white' : 'bg-[#E76F51] text-white'}`}>
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#3D5A80] mb-1.5">{faq.q}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="w-full mt-8 py-3.5 bg-[#3D5A80] hover:bg-[#293241] text-white font-bold rounded-2xl transition-colors tracking-wide"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;