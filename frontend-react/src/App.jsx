import './App.css';
import logoImage from './assets/Picture1.svg';

function App() {
  return (
    <div>
      <section className="hero">
        <div className="logo-block">
          <div className="logo-row">
            
            {/* The tagline is now inside this block, directly under the H1 */}
            <div className="logo-text-block">
              <h1 className="logo-neon">NEONSOX</h1>
              <p className="tagline"> Slick & Simple Advertisements. </p>
            </div>
            
            <img src={logoImage} alt="NEONSOX Logo" className="sock-icon" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;

