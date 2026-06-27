import Dashboard from "./pages/Dashboard"
import Member from "./pages/Member"
import Success from "./pages/Success"
import Pricing from "./pages/Pricing"
import About from "./pages/About"
import Features from "./pages/Features"
import Privacy from "./pages/Privacy"
import Admin from "./pages/Admin"
import Login from "./components/Login"
import Signup from "./components/Signup"
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTheme } from './context/ThemeContext';
import './App.css';
import logoImage from './assets/Picture1.svg';
import sidePhoto from './assets/img_1506.jpeg'; 

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const isStandaloneRoute = ["/pricing", "/success", "/member", "/dashboard", "/about", "/features", "/privacy", "/admin", "/login", "/signup"].includes(pathname);

  const { isDark, toggle: toggleTheme } = useTheme();
  const isDarkMode = isDark;

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
        {pathname === "/login" && <Login />}
        {pathname === "/signup" && <Signup />}
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
            <button className="start-btn" onClick={() => navigate('/login')}>Log-in / Sign up</button>
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

    </div>
  );
}

export default App;
