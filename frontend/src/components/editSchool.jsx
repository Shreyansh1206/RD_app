import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import './styles/editSchool.css';

const EditSchool = () => {
  const navigate = useNavigate();
  const { schoolId } = useParams();
  
  // State for text fields
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  // State for the file (initialized as null)
  const [bannerImage, setBannerImage] = useState(null);
  const [currentBanner, setCurrentBanner] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch school data on mount
  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const res = await axios.get(`/api/schools/${schoolId}`);
        const school = res.data;
        setName(school.name);
        setLocation(school.location);
        setCurrentBanner(school.bannerImage);
      } catch (err) {
        console.error("Error fetching school:", err);
        setError("Failed to load school details.");
      } finally {
        setInitialLoading(false);
      }
    };

    if (schoolId) {
      fetchSchool();
    }
  }, [schoolId]);

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

      // 2. Send PATCH request
      const res = await axios.patch(`/api/schools/${schoolId}`, formData);
      
      console.log("School Updated:", res.data);
      alert('School Updated Successfully!');
      navigate('/school'); // Navigate back to list or dashboard

    } catch (err) {
      console.error("Update Error:", err);
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

  if (initialLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="edit-school-container">
      <div className="edit-school-card">
        <h2 className="form-title">Edit School</h2>
        
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
            {currentBanner && !bannerImage && (
              <div className="current-banner-preview">
                <p>Current Banner:</p>
                <img src={currentBanner} alt="Current Banner" style={{maxWidth: '100%', maxHeight: '150px', objectFit: 'cover'}} />
              </div>
            )}
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="form-input"
            />
          </div>

          <div className="button-group">
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Updating...' : 'Update School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSchool;
