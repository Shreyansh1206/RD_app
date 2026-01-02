import { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/homePage.css'; 

const Home = () => {
  // Stats State
  const [stats, setStats] = useState({
    schools: 0,
    uniforms: '0',
    active: true
  });

  // Fetch Live Stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schoolRes, uniformRes] = await Promise.all([
          axios.get('/api/schools'),
          axios.get('/api/uniforms')
        ]);

        const schoolCount = schoolRes.data.length || 0;
        const uniformRaw = uniformRes.data.length || 0;
        
        // Truncation Logic
        let displayUniforms = 0;
        if (uniformRaw > 1000) displayUniforms = Math.floor(uniformRaw / 100) * 100;
        else if (uniformRaw > 0) displayUniforms = Math.floor(uniformRaw / 10) * 10;
        
        setStats({
          schools: schoolCount,
          uniforms: uniformRaw > 0 ? `${displayUniforms}+` : '0',
          active: true
        });
      } catch (err) {
        console.warn("Could not fetch stats", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="home-container">
        
        <div className="home-content-wrapper">
            {/* Branding Section */}
            <h1 className="home-title">RASTOGI DRESSES</h1>
            <p className="home-tagline">Where Quality is our Priority</p>
            
            <div className="home-divider"></div>

            {/* Business Description */}
            <p className="home-description">
                We are dedicated to providing high-quality, durable, and comfortable uniforms for educational institutions. 
                With years of expertise, we streamline the uniform procurement process, ensuring timely delivery 
                and exceptional service for schools and parents alike.
            </p>

            {/* Live Stats Row */}
            <div className="home-stats-row">
                <div className="stat-card">
                    <span className="stat-value">{stats.schools}</span>
                    <span className="stat-label">Partner Schools</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{stats.uniforms}</span>
                    <span className="stat-label">Uniform Variants</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">Active</span>
                    <span className="stat-label">System Status</span>
                </div>
            </div>

            {/* Instruction Text - Highlighted with Icon */}
            <div className="home-instruction">
                <span className="instruction-icon"></span>
                To begin managing orders or catalogs, please select a school from the sidebar menu.
            </div>
        </div>

        <footer className="home-footer">
            &copy; {new Date().getFullYear()} Rastogi Dresses. All rights reserved.
        </footer>

    </div>
  );
};

export default Home;