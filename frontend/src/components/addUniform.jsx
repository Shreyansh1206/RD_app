import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles/addUniform.css';

const AddUniform = () => {
  const navigate = useNavigate();

  // --- Form State ---
  const [schoolName, setSchoolName] = useState('');
  const [season, setSeason] = useState('Summer');
  const [category, setCategory] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [imageFile, setImageFile] = useState(null);

  // Dynamic States
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [pricing, setPricing] = useState([{ size: '', price: '' }]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // --- Handlers: Tags ---
  const handleAddTag = (e) => {
    e.preventDefault(); // Prevent form submission
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
    setImageFile(e.target.files[0]);
  };

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationErrors({});

    const formData = new FormData();
    formData.append('schoolName', schoolName);
    formData.append('season', season);
    formData.append('category', category);
    formData.append('extraInfo', extraInfo);
    
    // IMPORTANT: Backend expects JSON strings for complex arrays
    formData.append('tags', JSON.stringify(tags));
    formData.append('pricing', JSON.stringify(pricing));

    if (imageFile) {
      formData.append('uniformImage', imageFile);
    }

    try {
      const res = await axios.post('/api/uniforms', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('Success:', res.data);
      alert(res.data.schoolCreated 
        ? `Uniform created & New School "${schoolName}" auto-generated!` 
        : 'Uniform Created Successfully!');
      
      navigate('/'); // Or redirect to the school page

    } catch (err) {
      console.error('Error:', err);
      const data = err.response?.data;

      if (data?.errors) {
        // Transform array of errors into an object for easier display
        const fieldErrors = {};
        data.errors.forEach(errItem => {
          // If error is for "pricing[0].size", just map it to "pricing"
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
      setLoading(false);
    }
  };

  return (
    <div className="add-uniform-container">
      <div className="add-uniform-card">
        <h2 className="form-title">Add New Uniform</h2>
        
        {error && <div className="error-banner">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          
          {/* Row 1: School Name & Season */}
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

          {/* Row 2: Category & Extra Info */}
          <div className="form-row">
            <div className="form-group half-width">
              <label className="form-label">Category <span className="req">*</span></label>
              <input 
                type="text" 
                className={`form-input ${validationErrors.category ? 'input-error' : ''}`}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Shirt, Skirt, Blazer"
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
                placeholder="e.g. Cotton blend, Unisex"
              />
            </div>
          </div>

          {/* Pricing Section (Dynamic Table) */}
          <div className="form-group">
            <label className="form-label">Pricing & Sizes <span className="req">*</span></label>
            {validationErrors.pricing && <div className="field-error block-error">{validationErrors.pricing}</div>}
            
            <div className="pricing-table">
              {pricing.map((row, index) => (
                <div key={index} className="pricing-row">
                  <input 
                    type="text" 
                    placeholder="Size (e.g. 32, M)"
                    value={row.size}
                    onChange={(e) => handlePriceChange(index, 'size', e.target.value)}
                    className="form-input small-input"
                  />
                  <input 
                    type="number" 
                    placeholder="Price (₹)"
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

          {/* Tags Section */}
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

          {/* Image Upload */}
          <div className="form-group">
            <label className="form-label">Uniform Image</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="form-input file-input"
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn full-width">
            {loading ? 'Creating Uniform...' : 'Create Uniform'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUniform;