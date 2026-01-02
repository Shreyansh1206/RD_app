import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import './styles/sidebar.css';

const Sidebar = () => {
  const [schools, setSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true); // Added loading state
  const location = useLocation();

  // Fetch list of schools once on mount
  useEffect(() => {
    axios.get('/api/schools')
      .then(res => {
        setSchools(res.data);
        setLoading(false); // Stop loading on success
      })
      .catch(err => {
        console.error("Sidebar fetch error:", err);
        setLoading(false); // Stop loading on error
      });
  }, []);

  // Filter schools based on search
  const filteredSchools = schools.filter(school => 
    school.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="sidebar-container">
      <div className="sidebar-header">
        <h3>Schools</h3>
      </div>
      
      <div className="sidebar-search">
        <input 
          type="text" 
          placeholder="Search schools..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="sidebar-list">
        {loading ? (
             <div className="no-results">Loading schools...</div>
        ) : filteredSchools.length > 0 ? (
          filteredSchools.map(school => (
            <Link 
              to={`/school/${school._id}`} 
              key={school._id}
              className={`sidebar-item ${location.pathname.includes(school._id) ? 'active' : ''}`}
            >
              {school.name}
            </Link>
          ))
        ) : (
          <div className="no-results">No schools found</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;