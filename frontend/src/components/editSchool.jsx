import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAlert } from '../context/alertContext';
import './styles/editSchool.css';

const EditSchool = () => {
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const { showAlert } = useAlert();
  
  // State for text fields
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const res = await axios.get(`/api/schools/${schoolId}`);
        const school = res.data;
        setName(school.name);
        setLocation(school.location);
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

  // --- SUBMIT HANDLER ---
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

      // PATCH Request to update
      const res = await axios.patch(`/api/schools/${schoolId}`, schoolData);
      
      console.log("School Updated:", res.data);
      await showAlert('School Updated Successfully!', 'Success');
      navigate(-1); 

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

  if (initialLoading) return <div className="es-loading">Loading School Details...</div>;

  return (
    <div className="es-page-wrapper">
      <div className="es-header">
        <h1>Edit School</h1>
        <div className="es-actions">
            <button className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
            <button className="btn-save" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Updating...' : 'Update School'}
            </button>
        </div>
      </div>

      {error && <div className="es-error-banner"> {error}</div>}

      <div className="es-grid-layout">
        <div className="es-card">
            <h3>School Details</h3>
            
            <div className="es-form-group">
                <label>School Name <span className="req">*</span></label>
                <input 
                    type="text" 
                    className="es-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. St. Xavier's High School"
                />
            </div>

            <div className="es-form-group">
                <label>Location</label>
                <input 
                    type="text" 
                    className="es-input"
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

export default EditSchool;