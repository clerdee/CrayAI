import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FeatureCard from '../components/FeatureCard';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen font-sans selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden bg-[#F8FAFC]">
      <Navbar />

      {/* ==================================================================================
          GLOBAL BACKGROUND (Fills the voids)
      ================================================================================== */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          {/* Tech Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#0F172A 1px, transparent 1px), linear-gradient(90deg, #0F172A 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          
          {/* Ambient Orbs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-teal-400/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-blue-400/5 rounded-full blur-[120px]"></div>
      </div>

      {/* ==================================================================================
          SECTION 1: HERO (Compact & Punchy)
      ================================================================================== */}
      <header className="relative z-10 pt-32 pb-20 px-6 text-center">
        <div className="max-w-5xl mx-auto">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md border border-teal-200/50 rounded-full px-4 py-1.5 shadow-sm mb-8 animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-800 text-xs font-bold tracking-wide uppercase">AI-Powered Aquaculture</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
                The Future of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">Crayfish Research.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                Automate species identification and health monitoring. 
                Get accurate, actionable data for your hatchery without the manual legwork.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                    onClick={() => navigate('/login')}
                    className="bg-slate-900 text-white px-10 py-4 rounded-full text-base font-bold shadow-xl shadow-slate-900/20 hover:bg-emerald-600 hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-1 min-w-[180px] flex items-center justify-center gap-2"
                >
                    Start Scanning
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
            </div>
        </div>
      </header>

      {/* ==================================================================================
          THE UNIFIED CONTENT BLOCK
          (This contains Features + Workflow in one solid block to remove empty space)
      ================================================================================== */}
      <div className="relative z-10 px-4 md:px-6 pb-24">
          <div className="max-w-7xl mx-auto bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              
              {/* --- PART A: FEATURES GRID --- */}
              <div className="p-8 md:p-16 border-b border-slate-100">
                  <div className="text-center mb-12">
                      <h3 className="text-2xl font-bold text-slate-900">Everything you need to analyze your catch</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-slate-50 p-8 rounded-3xl hover:bg-teal-50/50 transition-colors duration-300 group">
                          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">🦞</div>
                          <h4 className="font-bold text-slate-900 text-xl mb-2">Species Detection</h4>
                          <p className="text-slate-500 text-sm leading-relaxed">Identify Cherax species instantly with our computer vision engine.</p>
                      </div>
                      
                      <div className="bg-slate-50 p-8 rounded-3xl hover:bg-teal-50/50 transition-colors duration-300 group">
                          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">❤️</div>
                          <h4 className="font-bold text-slate-900 text-xl mb-2">Health Monitoring</h4>
                          <p className="text-slate-500 text-sm leading-relaxed">Detect early signs of shell disease and stress markers.</p>
                      </div>

                      <div className="bg-slate-50 p-8 rounded-3xl hover:bg-teal-50/50 transition-colors duration-300 group">
                          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">📊</div>
                          <h4 className="font-bold text-slate-900 text-xl mb-2">Growth Analytics</h4>
                          <p className="text-slate-500 text-sm leading-relaxed">Visualize size trends and population data over time.</p>
                      </div>
                  </div>
              </div>

              {/* --- PART B: WORKFLOW (Darker Contrast) --- */}
              <div className="bg-slate-900 p-8 md:p-16 text-center relative overflow-hidden">
                  
                  {/* Background Accents */}
                  <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(#2DD4BF_1px,transparent_1px)] [background-size:20px_20px]"></div>
                  <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-500/20 rounded-full blur-[80px]"></div>

                  <div className="relative z-10">
                      <span className="text-teal-400 font-bold tracking-widest uppercase text-xs mb-4 block">How it Works</span>
                      <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-16">From Pond to Data in 3 Steps</h2>

                      {/* Steps Line */}
                      <div className="grid md:grid-cols-3 gap-12 relative">
                          {/* Dotted Line */}
                          <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-slate-700 -z-10"></div>

                          {/* Step 1 */}
                          <div className="flex flex-col items-center">
                              <div className="w-16 h-16 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center text-2xl mb-6 shadow-lg shadow-teal-900/20">📸</div>
                              <h4 className="text-white font-bold text-lg mb-2">1. Snap</h4>
                              <p className="text-slate-400 text-sm max-w-[200px]">Capture images offline or online using the mobile app.</p>
                          </div>

                          {/* Step 2 */}
                          <div className="flex flex-col items-center">
                              <div className="w-16 h-16 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center text-2xl mb-6 shadow-lg shadow-teal-900/20">🧠</div>
                              <h4 className="text-white font-bold text-lg mb-2">2. Analyze</h4>
                              <p className="text-slate-400 text-sm max-w-[200px]">AI processes morphology and health indicators instantly.</p>
                          </div>

                          {/* Step 3 */}
                          <div className="flex flex-col items-center">
                              <div className="w-16 h-16 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center text-2xl mb-6 shadow-lg shadow-teal-900/20">🚀</div>
                              <h4 className="text-white font-bold text-lg mb-2">3. Export</h4>
                              <p className="text-slate-400 text-sm max-w-[200px]">Download aggregated reports for your research papers.</p>
                          </div>
                      </div>

                      {/* CTA */}
                      <div className="mt-16 pt-12 border-t border-slate-800">
                          <button onClick={() => navigate('/register')} className="bg-teal-500 text-white px-10 py-4 rounded-full font-bold hover:bg-teal-400 transition shadow-lg shadow-teal-500/20 transform hover:scale-105">
                              Create Free Account
                          </button>
                          <p className="text-slate-500 text-xs mt-4">Join 500+ researchers today.</p>
                      </div>
                  </div>
              </div>

          </div>
      </div>

      {/* ==================================================================================
          SECTION 4: FOOTER
      ================================================================================== */}
      <footer className="bg-white border-t border-slate-200 py-10 relative z-10">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                  <span className="text-xl">🦐</span>
                  <span className="font-bold text-slate-900">CrayAI</span>
              </div>
              <p>© 2026 CrayAI Research.</p>
              <div className="flex gap-6 mt-4 md:mt-0 font-medium">
                  <span>Made with ❤️ in Manila</span>
              </div>
          </div>
      </footer>

    </div>
  );
};

export default LandingPage;