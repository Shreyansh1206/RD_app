import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import './styles/schoolList.css';

const SchoolList = () => {
  const [schools, setSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get the ID from URL query params (e.g. ?delete=64a7f...)
  const schoolId = searchParams.get('delete');

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const res = await axios.get('/api/schools');
      setSchools(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching schools:", err);
      setError("Failed to load schools.");
      setLoading(false);
    }
  };

  const initiateDelete = (schoolId) => {
    setSearchParams({ delete: schoolId });
  };

  const cancelDelete = () => {
    setSearchParams({});
  };

  const confirmDelete = async () => {
    if (!schoolId) return;

    try {
      await axios.delete(`/api/schools/${schoolId}`);
      setSchools((prev) => prev.filter((school) => school._id !== schoolId));
      cancelDelete();
    } catch (err) {
      alert("Failed to delete school. Please try again.");
      console.error(err);
    }
  };

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditSelect = (schoolId) => {
    if (schoolId) {
      navigate(`/school/${schoolId}/edit`);
    }
  };

  // New handler to navigate to school details
  const handleCardClick = (id) => {
    navigate(`/school/${id}`);
  };

  return (
    <div className="school-list-container">
      <div className="list-header">
        <h2 className="page-title">Registered Schools</h2>
        <Link to="/school/new-school" className="add-school-btn">+ Add School</Link>
      </div>

      <div className="search-bar-wrapper">
        <input 
          type="text" 
          placeholder="Search for a school..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading && <p className="loading-text">Loading schools...</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="school-grid">
        {filteredSchools.length > 0 ? (
          filteredSchools.map((school) => (
            <div 
              key={school._id} 
              className="school-item" 
              // 1. Make the whole card clickable
              onClick={() => handleCardClick(school._id)}
              style={{ cursor: 'pointer' }} 
            >
              
              <div className="school-info">
                <div className="monogram-wrapper">
                  {school.bannerImage ? (
                    <img 
                      src={school.bannerImage} 
                      alt={school.name} 
                      className="school-monogram"
                    />
                  ) : (
                    <div className="monogram-placeholder">
                      {school.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="school-details">
                  <h3 className="school-name">{school.name}</h3>
                  <p className="school-location">{school.location}</p>
                </div>
              </div>

              <div className="school-actions">
                <button 
                  className="action-btn edit-btn" 
                  // 2. Stop propagation to prevent triggering the card click
                  onClick={(e) => {
                    e.stopPropagation(); 
                    handleEditSelect(school._id);
                  }}
                >
                  Edit School
                </button>
                
                <button 
                  className="action-btn delete-btn" 
                  // 2. Stop propagation here as well
                  onClick={(e) => {
                    e.stopPropagation();
                    initiateDelete(school._id);
                  }}
                >
                  Delete School
                </button>
              </div>
            </div>
          ))
        ) : (
          !loading && <p className="empty-state">No schools found.</p>
        )}
      </div>

      {schoolId && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Are you sure?</h3>
            <p>Do you really want to delete this school? This process cannot be undone.</p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={cancelDelete}>Cancel</button>
              <button className="modal-btn confirm" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolList;