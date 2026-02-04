import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { PH_CITIES } from '../../data/cities'; 
import { CLOUDINARY_CONFIG } from '../../config/cloudinary'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'; 

// --- REGEX PATTERNS ---
const MOBILE_REGEX = /^9\d{9}$/; 
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[a-zA-Z\s]+$/; 

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isRegister, setIsRegister] = useState(location.pathname === '/register');
  const [loading, setLoading] = useState(false);
  
  // --- CUSTOM NOTIFICATION STATE ---
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); 

  // --- PASSWORD VISIBILITY STATE ---
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // --- FORM STATES ---
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); 

  useEffect(() => {
    setIsRegister(location.pathname === '/register');
  }, [location.pathname]);

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setPreviewImage(URL.createObjectURL(file));
        setSelectedFile(file);
    }
  };

  const toggleMode = () => {
    if (isRegister) navigate('/login');
    else navigate('/register');
  };

  // ============================================================
  // 1. HANDLE LOGIN
  // ============================================================
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginIdentifier.includes('@')) {
        showToast("Please include an '@' in the email address.", "error");
        return; 
    }
    
    setLoading(true);

    try {
      const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: loginIdentifier,
        password: loginPassword
      });

      if (loginRes.data.success) {
        const token = loginRes.data.token;
        localStorage.setItem('token', token);

        try {
            const profileRes = await axios.get(`${API_BASE_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const fullUserData = profileRes.data.user;
            localStorage.setItem('user', JSON.stringify(fullUserData));

            showToast('Login Successful! Redirecting...', 'success');

            setTimeout(() => {
                if (fullUserData.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/dashboard');
                }
            }, 1000);

        } catch (profileError) {
            console.error("Profile fetch failed", profileError);
            showToast("Login success, but failed to load profile.", 'error');
        }
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // 2. HANDLE REGISTER
  // ============================================================
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
        showToast("Profile picture is required.", "error");
        return;
    }
    if (!NAME_REGEX.test(firstName) || !NAME_REGEX.test(lastName)) {
        showToast("Names must only contain letters.", "error");
        return;
    }
    if (!EMAIL_REGEX.test(email)) {
        showToast("Please enter a valid email address.", "error");
        return;
    }
    if (!MOBILE_REGEX.test(mobileNumber)) {
        showToast("Mobile Number must be 10 digits and start with 9.", "error");
        return;
    }
    if (streetAddress.trim().length <= 5) {
        showToast("Street Address must be more than 5 characters.", "error");
        return;
    }
    if (!city) {
        showToast("Please select a City from the list.", "error");
        return;
    }
    if (regPassword !== confirmPassword) {
      showToast("Passwords do not match!", "error");
      return;
    }
    if (regPassword.length < 6) {
        showToast("Password must be at least 6 characters long.", "error");
        return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/auth/signup`, {
        email,
        password: regPassword
      });
      
      showToast("Account created! Check email for OTP.", "success");
      setShowOtpModal(true);

    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // 3. HANDLE OTP VERIFICATION
  // ============================================================
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
        showToast("Please enter the 6-digit code.", "error");
        return;
    }

    setLoading(true);
    let imageUrl = ''; 

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset); 

        try {
           const uploadRes = await axios.post(CLOUDINARY_CONFIG.apiUrl, formData);
           imageUrl = uploadRes.data.secure_url; 
        } catch (uploadError) {
           console.error("Image upload failed:", uploadError);
           showToast("Failed to upload profile picture. Try again.", "error");
           setLoading(false);
           return;
        }
      }

      const profileData = {
        firstName, 
        lastName, 
        phone: `+63${mobileNumber}`,
        street: streetAddress, 
        city, 
        country: 'Philippines',
        profilePic: imageUrl 
      };

      const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        email, otp: otpCode, profileData 
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user)); 
        
        showToast("Verification Successful!", "success");
        setShowOtpModal(false);
        
        setTimeout(() => navigate('/dashboard'), 1000);
      }

    } catch (error) {
      showToast(error.response?.data?.message || 'Invalid OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* TOAST NOTIFICATION */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-3 rounded-xl shadow-2xl border ${
            toast.type === 'success' ? 'bg-white border-teal-100 text-teal-800' : 'bg-white border-red-100 text-red-800'
        }`}>
            {toast.type === 'success' ? (
                <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">✓</div>
            ) : (
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">!</div>
            )}
            <span className="font-bold text-sm">{toast.message}</span>
        </div>
      </div>

      {/* CLOSE BUTTON */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 right-6 p-3 rounded-full bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all z-50 shadow-sm border border-slate-100 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-300">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* OTP MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl scale-100">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Check your Email</h3>
            <p className="text-slate-500 text-sm mb-6">Enter the code sent to <b>{email}</b></p>
            <input type="text" maxLength="6" className="w-full text-center text-3xl font-bold border-b-2 py-2 mb-6 outline-none focus:border-teal-500 bg-transparent" placeholder="000000" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
            <button onClick={handleVerifyOtp} disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-teal-600 transition disabled:opacity-50">{loading ? 'Verifying...' : 'Verify'}</button>
            <button onClick={() => setShowOtpModal(false)} className="mt-4 text-slate-400 text-sm hover:text-slate-600">Cancel</button>
          </div>
        </div>
      )}

      {/* =========================================================================
          1. SLIDING VISUAL PANEL (FIXED SIZE HERE)
      ========================================================================== */}
      <div 
        className={`hidden lg:flex w-1/2 h-full bg-[#0F172A] absolute top-0 z-20 items-center justify-center overflow-hidden transition-all duration-700 ease-in-out shadow-2xl`}
        style={{ transform: isRegister ? 'translateX(100%)' : 'translateX(0%)', left: 0 }}
      >
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#2DD4BF 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="relative z-10 flex flex-col items-center">
           <div className="relative w-[260px] h-[540px] bg-slate-950 rounded-[2.5rem] border-[6px] border-slate-900 shadow-2xl overflow-hidden ring-1 ring-white/10">
              <div className="w-full h-full bg-black relative">
                 <img src="https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=600&auto=format&fit=crop" alt="Scan" className="w-full h-full object-cover opacity-60" />
                 <div className="absolute inset-0 flex flex-col justify-end p-5">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl mb-4 shadow-lg">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-xl">🦞</div>
                           <div><p className="text-white text-sm font-bold">Cherax Quadricarinatus</p><div className="flex gap-2 mt-0.5"><span className="bg-emerald-500/40 px-1.5 py-0.5 rounded text-[9px] text-emerald-100">98% Match</span></div></div>
                        </div>
                    </div>
                 </div>
              </div>
           </div>
           <div className="mt-8 text-center px-8 transition-opacity duration-500">
              <h2 className="text-2xl font-bold text-white mb-2">{isRegister ? "Join the Community" : "Synchronized Field Data"}</h2>
              <p className="text-slate-400 text-xs tracking-wide uppercase opacity-70">{isRegister ? "Start your research journey today." : "Seamless Mobile to Web Integration"}</p>
           </div>
        </div>
      </div>

      {/* =========================================================================
          2. REGISTER FORM
      ========================================================================== */}
      <div className={`absolute top-0 left-0 h-full w-full lg:w-1/2 flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${isRegister ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
        <div className="w-full h-full px-8 flex flex-col items-center justify-center overflow-y-auto">
            <div className="w-full max-w-xl flex flex-col gap-5 py-8">
            
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create Account</h1>
                <p className="text-slate-500 text-sm mt-1">Fill in your details to get started.</p>
            </div>

            <div className="flex justify-center my-1">
                <label className="relative cursor-pointer group">
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    <div className={`w-24 h-24 rounded-full border-4 ${previewImage ? 'border-teal-500' : 'border-slate-100'} shadow-md flex items-center justify-center bg-slate-50 overflow-hidden hover:bg-slate-100 transition-all`}>
                        {previewImage ? <img src={previewImage} className="w-full h-full object-cover" /> : <span className="text-2xl block opacity-50">📷</span>}
                    </div>
                    <div className="absolute bottom-1 right-1 bg-teal-600 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white shadow-md">+</div>
                </label>
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-3" noValidate>
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" required className="input-field pl-4" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    <input type="text" required className="input-field pl-4" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <input type="email" required className="input-field pl-4" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
                
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 font-bold text-sm border-r border-slate-300 pr-2 pointer-events-none">+63</span>
                    <input 
                        type="tel" 
                        required 
                        maxLength="10" 
                        className="input-field !pl-16" 
                        placeholder="9XX XXX XXXX" 
                        value={mobileNumber} 
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))} 
                    />
                </div>

                <input type="text" required className="input-field pl-4" placeholder="Street Address" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                    <select required className="input-field pl-4 bg-transparent cursor-pointer" value={city} onChange={(e) => setCity(e.target.value)}><option value="" disabled>Select City</option>{PH_CITIES.map((c) => (<option key={c} value={c}>{c}</option>))}</select>
                    <input type="text" className="input-field pl-4 bg-slate-50 text-slate-500 cursor-not-allowed" value="Philippines" readOnly />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} required className="input-field pl-4 pr-10" placeholder="Password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                            {showPassword ? "🙈" : "👁️"}
                        </button>
                    </div>
                    <div className="relative">
                        <input type={showConfirmPassword ? "text" : "password"} required className="input-field pl-4 pr-10" placeholder="Confirm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                            {showConfirmPassword ? "🙈" : "👁️"}
                        </button>
                    </div>
                </div>
                
                <button type="submit" disabled={loading} className="primary-btn mt-2 shadow-xl shadow-teal-500/20 disabled:opacity-70">{loading ? 'Processing...' : 'Register Account'}</button>
            </form>
            <div className="text-center"><p className="text-slate-500 text-sm">Already have an account? <span onClick={toggleMode} className="text-teal-600 font-bold hover:underline cursor-pointer">Log In</span></p></div>
            </div>
        </div>
      </div>

      {/* =========================================================================
          3. LOGIN FORM
      ========================================================================== */}
      <div className={`absolute top-0 right-0 h-full w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white transition-opacity duration-500 ${!isRegister ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
        <div className="w-full max-w-lg flex flex-col gap-8">
          <div className="text-center">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 text-4xl mb-5 shadow-sm">🦞</div>
             <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Welcome back</h1>
             <p className="text-slate-500 text-base mt-2">Please enter your details to access the portal.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5" noValidate>
            <div className="space-y-4">
              <div className="relative">
                <input 
                    type="email" 
                    required 
                    className="input-field pl-4 py-3.5" 
                    placeholder="Email / Username" 
                    value={loginIdentifier} 
                    onChange={(e) => setLoginIdentifier(e.target.value)} 
                />
              </div>
              
              <div className="relative">
                 <input type={showPassword ? "text" : "password"} required className="input-field pl-4 pr-10 py-3.5" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                    {showPassword ? "🙈" : "👁️"}
                 </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="primary-btn py-3.5 text-base disabled:opacity-70">{loading ? 'Signing In...' : 'Sign In to Dashboard'}</button>
          </form>

          <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-slate-100"></div><span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or continue with</span><div className="flex-grow border-t border-slate-100"></div></div>
          <div className="grid grid-cols-2 gap-4"><button className="social-btn py-3"><span className="font-bold text-lg text-blue-500">G</span> Google</button><button className="social-btn py-3">GitHub</button></div>
          <div className="text-center"><p className="text-slate-500 text-sm">Don't have an account? <span onClick={toggleMode} className="text-teal-600 font-bold hover:text-teal-700 hover:underline cursor-pointer">Sign up</span></p></div>
        </div>
      </div>

      <style>{`
        .input-field { width: 100%; background-color: white; border: 1px solid #E2E8F0; border-radius: 0.75rem; padding-top: 0.75rem; padding-bottom: 0.75rem; font-size: 0.875rem; color: #0F172A; transition: all 0.2s; font-weight: 500; }
        .input-field:focus { outline: none; border-color: #14B8A6; box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.1); }
        .primary-btn { width: 100%; background-color: #0F172A; color: white; font-weight: 700; font-size: 0.875rem; border-radius: 0.75rem; padding: 1rem; transition: all 0.2s; }
        .primary-btn:hover { background-color: #0D9488; box-shadow: 0 10px 15px -3px rgba(13, 148, 136, 0.3); transform: translateY(-1px); }
        .social-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; border: 1px solid #E2E8F0; background-color: white; color: #334155; font-weight: 700; font-size: 0.875rem; border-radius: 0.75rem; transition: all 0.2s; }
        .social-btn:hover { background-color: #F8FAFC; border-color: #CBD5E1; }
      `}</style>
    </div>
  );
};

export default AuthPage;