import { Link } from 'react-router-dom';
import './styles/navbar.css';

const Navbar = () => {
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
        <Link to="/school/" className="nav-link">School List</Link>
        {/* You can add more links here later, like "Login" */}
      </div>
    </nav>
  );
};

export default Navbar;