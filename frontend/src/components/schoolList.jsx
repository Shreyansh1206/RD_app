import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAlert } from '../context/alertContext';
import './styles/schoolList.css';

const SchoolList = () => {
  const [schools, setSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { showAlert, showConfirm } = useAlert();
  const navigate = useNavigate();

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

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    
    const isConfirmed = await showConfirm(
      "Do you really want to delete this school? This process cannot be undone.",
      "Are you sure?"
    );

    if (!isConfirmed) return;

    try {
      await axios.delete(`/api/schools/${id}`);
      setSchools((prev) => prev.filter((school) => school._id !== id));
      showAlert("School deleted successfully.", "Success");
    } catch (err) {
      showAlert("Failed to delete school. Please try again.", "Error");
      console.error(err);
    }
  };

  const handleEditSelect = (e, id) => {
    e.stopPropagation();
    navigate(`/school/${id}/edit`);
  };

  const handleCardClick = (id) => {
    navigate(`/school/${id}`);
  };

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="sl-loading">Loading Schools...</div>;

  return (
    <div className="sl-page-wrapper">
      <div className="sl-header">
        <div className="header-titles">
            <h1>Registered Schools</h1>
            <p className="subtitle">Manage all client schools and their details.</p>
        </div>
        
        <div className="sl-header-actions">
            <input 
              type="text" 
              placeholder="Search schools..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sl-search-input"
            />
            <Link to="/school/new-school" className="btn-add-school">
                + Add School
            </Link>
        </div>
      </div>

      {error && <div className="sl-error-banner">⚠️ {error}</div>}

      <div className="sl-content-area">
        {filteredSchools.length > 0 ? (
          <div className="sl-grid">
            {filteredSchools.map((school) => (
              <div 
                key={school._id} 
                className="sl-card" 
                onClick={() => handleCardClick(school._id)}
              >
                {/* Card Content */}
                <div className="sl-card-body">
                  <div className="sl-monogram-wrapper">
                    {school.bannerImage ? (
                      <img 
                        src={school.bannerImage} 
                        alt={school.name} 
                        className="sl-monogram-img"
                      />
                    ) : (
                      <div className="sl-monogram-placeholder">
                        {school.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  <div className="sl-school-info">
                    <h3 className="sl-school-name">{school.name}</h3>
                    <p className="sl-school-location">📍 {school.location}</p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="sl-card-actions">
                  <button 
                    className="btn-action edit" 
                    onClick={(e) => handleEditSelect(e, school._id)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-action delete" 
                    onClick={(e) => handleDelete(e, school._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-row">
             <p>{searchTerm ? 'No schools found matching your search.' : 'No schools registered yet.'}</p>
             {!searchTerm && <Link to="/school/new-school" className="link-create">Add your first school</Link>}
          </div>
        )}
      </div>


    </div>
  );
};

export default SchoolList;