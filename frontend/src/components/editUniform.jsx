import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import './styles/editUniform.css';

const EditUniform = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get uniform ID from URL

  // --- Form State ---
  const [schoolName, setSchoolName] = useState('');
  const [season, setSeason] = useState('Summer');
  const [category, setCategory] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  
  // Image States
  const [imageFile, setImageFile] = useState(null); // New file to upload
  const [currentImageUrl, setCurrentImageUrl] = useState(''); // Existing URL from DB

  // Dynamic States
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [pricing, setPricing] = useState([{ size: '', price: '' }]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // --- 1. Fetch Existing Data ---
  useEffect(() => {
    const fetchUniformData = async () => {
      try {
        const res = await axios.get(`/api/uniforms/${id}`);
        const data = res.data;

        // Populate Form
        setSchoolName(data.schoolId.name || ''); 
        setSeason(data.season);
        setCategory(data.category);
        setExtraInfo(data.extraInfo || '');
        setTags(data.tags || []);
        setPricing(data.pricing || [{ size: '', price: '' }]);
        setCurrentImageUrl(data.imageUrl || data.image || ''); 

        setLoading(false);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Failed to load uniform details.");
        setLoading(false);
      }
    };

    fetchUniformData();
  }, [id]);

  // --- Handlers: Tags ---
  const handleAddTag = (e) => {
    e.preventDefault();
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // --- Handlers: Pricing ---
  const handlePriceChange = (index, field, value) => {
    const newPricing = [...pricing];
    newPricing[index][field] = value;
    setPricing(newPricing);
  };

  const addPriceRow = () => {
    setPricing([...pricing, { size: '', price: '' }]);
  };

  const removePriceRow = (index) => {
    if (pricing.length > 1) {
      setPricing(pricing.filter((_, i) => i !== index));
    }
  };

  // --- Handlers: File ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setCurrentImageUrl(URL.createObjectURL(file)); // Create local preview
    }
  };

  // --- Submit (PATCH Request) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setValidationErrors({});

    const formData = new FormData();
    formData.append('schoolName', schoolName);
    formData.append('season', season);
    formData.append('category', category);
    formData.append('extraInfo', extraInfo);
    
    // Convert complex structures to JSON strings
    formData.append('tags', JSON.stringify(tags));
    formData.append('pricing', JSON.stringify(pricing));

    // Only append image if a NEW one is selected
    if (imageFile) {
      formData.append('image', imageFile); // Must match backend middleware name
    }

    try {
      // UPDATED: Using axios.patch instead of axios.put
      await axios.patch(`/api/uniforms/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Uniform Updated Successfully!');
      navigate(-1); // Go back to the previous page

    } catch (err) {
      console.error('Update Error:', err);
      const data = err.response?.data;

      if (data?.errors) {
        const fieldErrors = {};
        data.errors.forEach(errItem => {
          const key = errItem.path.split('.')[0].replace(/\[.*\]/, '');
          fieldErrors[key] = errItem.msg;
        });
        setValidationErrors(fieldErrors);
        setError('Please correct the highlighted errors.');
      } else if (data?.message) {
        setError(data.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="edit-uniform-container"><p>Loading uniform details...</p></div>;

  return (
    <div className="edit-uniform-container">
      <div className="edit-uniform-card">
        <h2 className="form-title">Edit Uniform</h2>
        
        {error && <div className="error-banner">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          
          {/* Row 1 */}
          <div className="form-row">
            <div className="form-group half-width">
              <label className="form-label">School Name <span className="req">*</span></label>
              <input 
                type="text" 
                className={`form-input ${validationErrors.schoolName ? 'input-error' : ''}`}
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. DPS Vasant Kunj"
              />
              {validationErrors.schoolName && <span className="field-error">{validationErrors.schoolName}</span>}
            </div>

            <div className="form-group half-width">
              <label className="form-label">Season <span className="req">*</span></label>
              <select 
                className="form-input"
                value={season} 
                onChange={(e) => setSeason(e.target.value)}
              >
                <option value="Summer">Summer</option>
                <option value="Winter">Winter</option>
                <option value="All">All Seasons</option>
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="form-row">
            <div className="form-group half-width">
              <label className="form-label">Category <span className="req">*</span></label>
              <input 
                type="text" 
                className={`form-input ${validationErrors.category ? 'input-error' : ''}`}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              {validationErrors.category && <span className="field-error">{validationErrors.category}</span>}
            </div>

            <div className="form-group half-width">
              <label className="form-label">Extra Info</label>
              <input 
                type="text" 
                className="form-input"
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="form-group">
            <label className="form-label">Pricing & Sizes <span className="req">*</span></label>
            {validationErrors.pricing && <div className="field-error block-error">{validationErrors.pricing}</div>}
            
            <div className="pricing-table">
              {pricing.map((row, index) => (
                <div key={index} className="pricing-row">
                  <input 
                    type="text" 
                    placeholder="Size"
                    value={row.size}
                    onChange={(e) => handlePriceChange(index, 'size', e.target.value)}
                    className="form-input small-input"
                  />
                  <input 
                    type="number" 
                    placeholder="Price"
                    value={row.price}
                    onChange={(e) => handlePriceChange(index, 'price', e.target.value)}
                    className="form-input small-input"
                  />
                  {pricing.length > 1 && (
                    <button type="button" onClick={() => removePriceRow(index)} className="remove-btn">×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addPriceRow} className="add-row-btn">+ Add Size</button>
            </div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Tags</label>
            <div className="tags-input-container">
              <input 
                type="text" 
                className="form-input tag-input"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag(e)}
                placeholder="Type tag & press Enter"
              />
              <button type="button" onClick={handleAddTag} className="add-tag-btn">Add</button>
            </div>
            
            <div className="tags-list">
              {tags.map((tag, idx) => (
                <span key={idx} className="tag-chip">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="tag-close">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Image Upload with Preview */}
          <div className="form-group">
            <label className="form-label">Uniform Image</label>
            
            {currentImageUrl && (
              <div className="image-preview-box">
                <img src={currentImageUrl} alt="Preview" className="preview-img" />
                <p className="preview-label">
                  {imageFile ? "New Image Selected" : "Current Image"}
                </p>
              </div>
            )}

            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="form-input file-input"
            />
          </div>

          <button type="submit" disabled={submitting} className="submit-btn full-width">
            {submitting ? 'Updating...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditUniform;