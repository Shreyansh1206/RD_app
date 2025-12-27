import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles/schoolSelector.css';

const SchoolSelector = () => {
  const [schools, setSchools] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/schools')
      .then(res => setSchools(res.data))
      .catch(err => console.error("Backend not connected yet"));
  }, []);

  const handleGo = () => {
    if (selectedId) {
      navigate(`school/${selectedId}`);
    }
  };

  return (
    <div className="landing-wrapper">
      {/* 1. Grand Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">RASTOGI DRESSES</h1>
          <p className="hero-tagline">Where Quality is our priority</p>
        </div>
      </div>

      {/* 2. Floating Interaction Card */}
      <div className="content-section">
        <div className="selector-card">
          <h2 className="card-heading">Select Your School</h2>
          <p className="card-subtext">Find your uniform by selecting your institution below</p>
          
          <div className="input-group">
            <select 
              className="grand-select"
              onChange={(e) => setSelectedId(e.target.value)} 
              value={selectedId}
            >
              <option value="">Choose a School...</option>
              {schools.map(school => (
                <option key={school._id} value={school._id}>
                  {school.name}
                </option>
              ))}
              {/* Test Fallback */}
              {schools.length === 0 && <option value="test">Demo School (Test)</option>}
            </select>
          </div>
          
          <button 
            className="grand-btn" 
            onClick={handleGo} 
            disabled={!selectedId}
          >
            Enter Store &rarr;
          </button>
        </div>
      </div>
      
      {/* Optional Footer Text */}
      <footer className="landing-footer">
        &copy; {new Date().getFullYear()} Rastogi Dresses. All rights reserved.
      </footer>
    </div>
  );
};

export default SchoolSelector;