import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/alertContext';
import './styles/addBasePricing.css';

const CATEGORIES = ['Shirt', 'Pant', 'Half Pant', 'Skirt', 'Frock', 'Jacket', 'Kurta', 'Salwar', 'Dupatta', 'Lower', 'Blazer', 'Tie', 'Cap', 'Sweater', 'Socks', 'Tracksuit', 'T-Shirt', 'Belt', 'Tunic', 'Monogram', 'Miscellaneous'];

const AddBasePricing = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // --- FORM STATE ---
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [categorySearch, setCategorySearch] = useState(CATEGORIES[0]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const [priceData, setPriceData] = useState([{ size: '', price: '' }]);

  // --- UI STATE ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const categoryWrapperRef = useRef(null);

  // --- CLICK OUTSIDE HANDLER ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryWrapperRef.current && !categoryWrapperRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [categoryWrapperRef]);

  // --- HANDLERS ---
  const filteredCategories = CATEGORIES.filter(c => 
    c.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleCategorySelect = (selectedCat) => {
    setCategory(selectedCat);
    setCategorySearch(selectedCat);
    setShowCategoryDropdown(false);
  };

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    setCategorySearch(val);
    setCategory(val);
    setShowCategoryDropdown(true);
  };

  const handleAddTag = (e) => {
    e.preventDefault(); 
    const val = tagInput.trim();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') handleAddTag(e);
  };

  const handlePriceChange = (index, field, value) => {
    const newPricing = [...priceData];
    newPricing[index][field] = value;
    setPriceData(newPricing);
  };

  const addPriceRow = () => {
    setPriceData([...priceData, { size: '', price: '' }]);
  };

  const removePriceRow = (index) => {
    if (priceData.length > 1) {
      setPriceData(priceData.filter((_, i) => i !== index));
    }
  };

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. FILTER: Only keep rows where both fields are filled
    // Using string conversion to ensure 0 is treated as a valid number
    const validRows = priceData.filter(row => 
        String(row.size).trim() !== '' && String(row.price).trim() !== ''
    );

    if (validRows.length === 0) {
        setError("Please add at least one valid size and price.");
        setLoading(false);
        return;
    }

    if (!category.trim()) {
        setError("Category is required.");
        setLoading(false);
        return;
    }

    try {
      // 2. FORMAT: Convert price to Number explicitly for backend validation
      const formattedPriceData = validRows.map(row => ({
          size: row.size,
          price: Number(row.price)
      }));

      const payload = {
        category,
        tags,
        basePriceData: formattedPriceData
      };

      await axios.post('/api/basePricing', payload);
      
      await showAlert('Base Pricing Template Created!', 'Success');
      navigate('/basePricing'); 

    } catch (err) {
      console.error('Submission Error:', err);
      const resData = err.response?.data;
      
      // 3. ROBUST ERROR HANDLING
      if (resData?.errors && Array.isArray(resData.errors) && resData.errors.length > 0) {
          // Case 1: Validation Error (400) -> { errors: [{ msg: "..." }] }
          setError(resData.errors[0].msg);
      } else if (resData?.error) {
          // Case 2: Server Error (500) -> { error: "..." } (Matches your backend catch block)
          setError(resData.error);
      } else {
          // Case 3: Fallback
          setError(resData?.message || 'Failed to create pricing template.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="abp-page-wrapper">
      <div className="abp-header">
        <h1>Create Base Pricing Template</h1>
        <div className="abp-actions">
            <button className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
            <button className="btn-save" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Save Template'}
            </button>
        </div>
      </div>

      {error && <div className="abp-error-banner"> {error}</div>}

      <div className="abp-grid-layout">
        
        {/* --- LEFT COLUMN --- */}
        <div className="abp-card details-card">
            <h3>Template Details</h3>
            
            <div className="abp-form-group" ref={categoryWrapperRef}>
                <label>Category <span className="req">*</span></label>
                <div className="searchable-dropdown-wrapper">
                    <input 
                        type="text" 
                        className="abp-input" 
                        value={categorySearch} 
                        onChange={handleCategoryChange}
                        onFocus={() => setShowCategoryDropdown(true)}
                        placeholder="Search or type category..."
                    />
                    {showCategoryDropdown && filteredCategories.length > 0 && (
                        <div className="abp-dropdown-list">
                            {filteredCategories.map(c => (
                                <div 
                                    key={c} 
                                    className="abp-dropdown-item" 
                                    onClick={() => handleCategorySelect(c)}
                                >
                                    {c}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="abp-form-group">
                <label>Tags</label>
                <div className="tag-input-row">
                    <input 
                        type="text" 
                        className="abp-input" 
                        placeholder="e.g. Cotton"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                    />
                    <button type="button" onClick={handleAddTag} className="btn-add-tag">Add</button>
                </div>
                <div className="active-tags-list">
                    {tags.map(t => (
                        <span key={t} className="active-tag-pill">
                            {t} <span className="x-btn" onClick={() => removeTag(t)}>×</span>
                        </span>
                    ))}
                </div>
            </div>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="abp-card pricing-card">
            <h3>Base Price Structure</h3>
            <div className="pricing-table-wrapper">
                <div className="pt-header">
                    <span>Size</span>
                    <span>Price (₹)</span>
                    <span></span>
                </div>
                {priceData.map((row, i) => (
                    <div key={i} className="pt-row">
                        <input 
                            type="text" 
                            className="abp-input compact" 
                            placeholder="Size"
                            value={row.size}
                            onChange={e => handlePriceChange(i, 'size', e.target.value)}
                        />
                        <input 
                            type="number" 
                            className="abp-input compact" 
                            placeholder="Price"
                            value={row.price}
                            onChange={e => handlePriceChange(i, 'price', e.target.value)}
                        />
                        <button 
                            type="button" 
                            className="btn-icon-del" 
                            onClick={() => removePriceRow(i)}
                        >×</button>
                    </div>
                ))}
                <button type="button" className="btn-add-row" onClick={addPriceRow}>+ Add Size Row</button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AddBasePricing;