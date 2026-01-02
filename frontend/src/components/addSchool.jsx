import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/alertContext';
import './styles/addSchool.css';

const AddSchool = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  
  // State for text fields
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name.trim()) {
        setError("School Name is required.");
        setLoading(false);
        return;
    }

    try {
      const schoolData = {
        name: name,
        location: location
      };

      const res = await axios.post('/api/schools', schoolData);
      
      console.log("School Created:", res.data);
      await showAlert('School Created Successfully!', 'Success');
      navigate(-1); 

    } catch (err) {
      console.error("Creation Error:", err);
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.errors) setError(data.errors[0].msg);
        else if (data.message) setError(data.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="as-page-wrapper">
      <div className="as-header">
        <h1>Create New School</h1>
        <div className="as-actions">
            <button className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
            <button className="btn-save" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating...' : 'Save School'}
            </button>
        </div>
      </div>

      {error && <div className="as-error-banner">⚠️ {error}</div>}

      <div className="as-grid-layout">
        <div className="as-card">
            <h3>School Details</h3>
            
            <div className="as-form-group">
                <label>School Name <span className="req">*</span></label>
                <input 
                    type="text" 
                    className="as-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. St. Xavier's High School"
                />
            </div>

            <div className="as-form-group">
                <label>Location</label>
                <input 
                    type="text" 
                    className="as-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. New Delhi"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default AddSchool;