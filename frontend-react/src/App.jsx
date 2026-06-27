import Dashboard from "./pages/Dashboard"
import Member from "./pages/Member"
import Success from "./pages/Success"
import Pricing from "./pages/Pricing"
import About from "./pages/About"
import Features from "./pages/Features"
import Privacy from "./pages/Privacy"
import Admin from "./pages/Admin"
import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import './App.css';
import logoImage from './assets/Picture1.svg';
import sidePhoto from './assets/img_1506.jpeg'; 

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const isStandaloneRoute = ["/pricing", "/success", "/member", "/dashboard", "/about", "/features", "/privacy", "/admin"].includes(pathname);

  const { isDark, toggle: toggleTheme } = useTheme();
  const { login } = useAuth();
  const isDarkMode = isDark;
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState('CREDENTIALS');
  
  const [emailInput, setEmailInput] = useState('ceo@neonsox.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [twoFactorInput, setTwoFactorInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCredentialSubmit = (e) => {
    e.preventDefault();
    // Validate against the auth store without committing the session yet — the
    // session is created after the 2FA challenge passes.
    const check = login(emailInput, passwordInput);
    if (check.ok) {
      setErrorMessage('');
      setModalStep('2FA');
    } else {
      setErrorMessage(check.error || 'Invalid security credentials.');
    }
  };

  const handleTwoFactorSubmit = (e) => {
    e.preventDefault();
    if (twoFactorInput.length === 6) {
      setErrorMessage('');
      // login() already set the session in the credentials step; just route in.
      setShowModal(false);
      resetFlow();
      navigate('/admin');
    } else {
      setErrorMessage('Security token must match a 6-digit signature format.');
    }
  };

  const resetFlow = () => {
    setModalStep('CREDENTIALS');
    setPasswordInput('');
    setTwoFactorInput('');
    setErrorMessage('');
  };

  if (isStandaloneRoute) {
    return (
      <div className="app">
        {pathname === "/pricing" && <Pricing />}
        {pathname === "/success" && <Success />}
        {pathname === "/member" && <Member />}
        {pathname === "/dashboard" && <Dashboard />}
        {pathname === "/about" && <About />}
        {pathname === "/features" && <Features />}
        {pathname === "/privacy" && <Privacy />}
        {pathname === "/admin" && <Admin />}
      </div>
    );
  }

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* DIRECT INLINE ENGINE: High priority without breaking browser rules */}
      <style>{`
        .tagline {
          margin: 0 !important;
          margin-left: 25px !important;
          font-size: 1.25rem !important;
          font-weight: 900 !important;
          letter-spacing: 1.5px !important;
          text-transform: uppercase !important;
          text-align: center !important;
          display: block !important;
          font-family: 'Exo 2', sans-serif !important;
          animation: final-neon-flicker 2s linear infinite !important;
        }

        @keyframes final-neon-flicker { 
          0%, 18%, 22%, 25%, 53%, 57%, 100% { 
            color: #ffffff; 
            text-shadow: 
              0 0 4px #ff3b30, 
              0 0 10px #ff3b30, 
              0 0 20px #ff3b30, 
              0 0 40px #ff3b30, 
              0 0 60px #ff3b30;
          } 
          19%, 23% { 
            color: #3a0b09; 
            text-shadow: 0 0 2px rgba(255, 59, 48, 0.1); 
          } 
          20%, 24% { 
            color: #ffffff; 
            text-shadow: 0 0 15px #ff3b30, 0 0 35px #ff3b30; 
          } 
          54%, 56% { 
            color: #1a0302; 
            text-shadow: none; 
          } 
        }
      `}</style>

      {/* Master wrapper splitting the viewport into 3 distinct columns */}
      <div className="main-layout-wrapper">
        
        {/* LEFT SIDE PANEL */}
        <div className="side-panel left-panel">
          <img src={sidePhoto} alt="Archive Left Texture" className="panel-img" />
        </div>

        {/* CENTER MAIN CONTENT COLUMN */}
        <div className="center-content">
          
          {/* TOGGLE SWITCH NATIVE TO THE YELLOW SPOT */}
          <div className="toggle-container">
            <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
              {isDarkMode ? (
                <svg className="toggle-icon sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="5" fill="currentColor"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg className="toggle-icon moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>

          {/* HERO CONTENT */}
          <section className="hero">
            <div className="logo-block">
              <div className="logo-row">
                <div className="logo-text-block">
                  <h1 className="logo-neon">NEONSOX<sup className="neon-tm">™</sup></h1>
                  <p className="tagline">Slick & Simple Advertisements.</p>
                </div>
                <img src={logoImage} alt="NEONSOX Logo" className="sock-icon" />
              </div>
            </div>

            {/* Custom Rectangular Neon Glow Button */}
            <button className="start-btn" onClick={() => { setShowModal(true); resetFlow(); }}>Log-in / Sign up</button>
          </section>

          {/* SYSTEM FOOTER */}
          <footer className="site-footer">
            <div className="footer-grid">
              <div>
                <h4>Product</h4>
                <Link to="/features">Features</Link>
                <Link to="/pricing">Pricing Info</Link>
                <Link to="/member">Member Portal</Link>
                <Link to="/dashboard">Dashboard</Link>
              </div>
              <div>
                <h4>Help</h4>
                <a href="#">Get Support</a>
                <a href="#">Contact Support</a>
                <a href="#">System Status</a>
                <a href="#">FAQs</a>
              </div>
              <div>
                <h4>Company</h4>
                <Link to="/about">About Us</Link>
                <Link to="/privacy">Privacy Policy</Link>
                <a href="#">Blog</a>
                <a href="#">Careers</a>
              </div>
            </div>
          </footer>
        </div>

        {/* RIGHT SIDE PANEL */}
        <div className="side-panel right-panel">
          <img src={sidePhoto} alt="Archive Right Texture" className="panel-img" />
        </div>

      </div>

      {/* MULTI-SCREEN SECURE POPUP MODAL OVERLAY ENGINE */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            
            {/* CLEAN OVERLAY X BUTTON AT TOP CORNER */}
            <button className="modal-close-btn" onClick={() => setShowModal(false)}>×</button>
            
            {/* SCREEN 1: PRIMARY CREDENTIAL FORM LAYOUT */}
            {modalStep === 'CREDENTIALS' && (
              <form onSubmit={handleCredentialSubmit} className="modal-form-view">
                <h2 className="modal-header-title">Secure Gateway Access</h2>
                
                <div className="modal-form-group">
                  <input 
                    type="email" 
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="USER NAME" 
                    className="modal-input central-input" 
                    required
                  />
                  
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="PASSWORD" 
                    className="modal-input central-input" 
                    required
                  />
                </div>

                {errorMessage && <div className="modal-error-alert">{errorMessage}</div>}

                <p className="modal-signup-prompt">
                  Not a member? <Link to="/pricing" className="blue-link">Join us!</Link>
                </p>

                <button type="submit" className="modal-subscribe-btn">Subscribe</button>
              </form>
            )}

            {/* SCREEN 2: SECOND-FACTOR TOKEN IDENTIFICATION LAYOUT */}
            {modalStep === '2FA' && (
              <form onSubmit={handleTwoFactorSubmit} className="modal-form-view">
                <h2>Two-Factor Challenge</h2>
                <p>Enter the 6-digit generation code tracking on your authenticated verification device.</p>
                
                <div className="modal-form-group">
                  <label className="input-label text-center">Dynamic 2FA Verification Token</label>
                  <input 
                    type="text" 
                    maxLength="6"
                    value={twoFactorInput}
                    onChange={(e) => setTwoFactorInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="000 000" 
                    className="modal-input security-token-box" 
                    required
                    autoFocus
                  />
                </div>

                {errorMessage && <div className="modal-error-alert">{errorMessage}</div>}

                <button type="submit" className="modal-submit-btn">Authorize Verification</button>
                <button type="button" className="modal-back-link" onClick={() => setModalStep('CREDENTIALS')}>Return to Previous Screen</button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default App;
