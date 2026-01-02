import { Link, useNavigate } from 'react-router-dom';
import './styles/navbar.css';
import { useAuth } from '../context/authContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); 
  };

  return (
    <nav className="navbar">
      {/* Left Side: Logo / Brand */}
      <div className="navbar-brand">
        <Link to="/">Rastogi Dresses</Link>
      </div>

      {/* Right Side: Navigation Links */}
      <div className="navbar-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/uniform/new-uniform" className="nav-link">Add Uniform</Link>
        <Link to="/school/new-school" className="nav-link">Add School</Link>
        <Link to="/basePricing/new-basePricing" className="nav-link">Add Base-Pricing</Link>
        <Link to="/basePricing" className="nav-link">Base-Pricing List</Link>
        <Link to="/school/" className="nav-link">School List</Link>
        
        <button onClick={handleLogout} className="nav-link logout-btn">
          <span>Logout</span>
          <svg 
            className="logout-icon"
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;