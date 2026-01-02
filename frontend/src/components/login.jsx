import { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './styles/login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ schools: 0, uniforms: 0 });
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to the page they tried to visit or default to /home
  const from = location.state?.from?.pathname || "/home";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [schoolsRes, uniformsRes] = await Promise.all([
          axios.get('/api/unprotected/schoolCount'),
          axios.get('/api/unprotected/uniformCount')
        ]);

        const uniformRaw = uniformsRes.data.count || 0;
        
        // Truncation Logic (Same as HomePage)
        let displayUniforms = 0;
        if (uniformRaw > 1000) displayUniforms = Math.floor(uniformRaw / 100) * 100;
        else if (uniformRaw > 0) displayUniforms = Math.floor(uniformRaw / 10) * 10;

        setStats({
          schools: schoolsRes.data.count || 0,
          uniforms: uniformRaw > 0 ? `${displayUniforms}+` : '0'
        });
      } catch (err) {
        console.error("Failed to fetch login stats:", err);
      }
    };
    fetchStats();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Login updates the Context 'user' state.
    // App.jsx's RootRoute watches this state and handles the redirect.
    const success = await login(username, password);
    if (!success) {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="login-wrapper">
      
      {/* LEFT SIDE: Hero Content (Identical to School Selector) */}
      <div className="hero-pane">
        <div className="hero-text-content">
            <h1 className="hero-title">RASTOGI DRESSES</h1>
            <p className="hero-tagline">Where Quality is our Priority</p>
            <p className="hero-description">
                Streamlined uniform management for schools and parents. 
                Secure administrator access to manage catalogs, pricing, and orders.
            </p>
        </div>

        <div className="stats-grid">
            <div className="stat-box">
                <span className="stat-val">{stats.schools}</span>
                <span className="stat-key">Partnered Schools</span>
            </div>
            <div className="stat-box">
                <span className="stat-val">{stats.uniforms}</span>
                <span className="stat-key">Uniform Variants</span>
            </div>
            <div className="stat-box">
                <span className="stat-val">24/7</span>
                <span className="stat-key">System Support</span>
            </div>
        </div>
        
        <footer className="hero-footer">
            &copy; {new Date().getFullYear()} Rastogi Dresses. All rights reserved.
        </footer>
      </div>

      {/* RIGHT SIDE: Login Interaction */}
      <div className="interaction-pane">
        
        {/* Subtle Background Glow */}
        <div className="deco-circle"></div>

        <div className="login-content">
          <div className="accent-line"></div>
          <h2 className="card-heading">Admin Login</h2>
          <p className="card-subtext">Please enter your credentials to access the dashboard.</p>
          
          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="login-form-group">
                {/* Username Field */}
                <div className="input-wrapper">
                    <span className="input-icon"></span>
                    <input 
                        type="text" 
                        className="grand-input"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                {/* Password Field */}
                <div className="input-wrapper">
                    <span className="input-icon"></span>
                    <input 
                        type="password" 
                        className="grand-input"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
            </div>

            <button type="submit" className="grand-btn">
                Secure Login &rarr;
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default Login;