import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles/addSchool.css';

const AddSchool = () => {
  const navigate = useNavigate();
  
  // State for text fields
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  // State for the file (initialized as null)
  const [bannerImage, setBannerImage] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle File Selection
  const handleFileChange = (e) => {
    // Save the file object itself, not a string
    setBannerImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create FormData object
      const formData = new FormData();
      formData.append('name', name);
      formData.append('location', location);
      
      // Only append if a file was actually selected
      if (bannerImage) {
        // 'bannerImage' is the key your backend middleware expects
        formData.append('bannerImage', bannerImage); 
      }

      // 2. Send POST request
      // Axios detects FormData and sets 'Content-Type': 'multipart/form-data' automatically
      const res = await axios.post('/api/schools', formData);
      
      console.log("School Created:", res.data);
      alert('School Created Successfully!');
      navigate('/'); 

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
    <div className="add-school-container">
      <div className="add-school-card">
        <h2 className="form-title">Create New School</h2>
        
        {error && <div className="error-banner">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div className="form-group">
            <label className="form-label">School Name <span className="required-star">*</span></label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. St. Xavier's High School"
              required 
              className="form-input"
            />
          </div>

          {/* Location Field */}
          <div className="form-group">
            <label className="form-label">Location</label>
            <input 
              type="text" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. New Delhi"
              className="form-input"
            />
          </div>

          {/* Banner Image Upload */}
          <div className="form-group">
            <label className="form-label">Banner Image</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Uploading & Creating...' : 'Create School'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddSchool;