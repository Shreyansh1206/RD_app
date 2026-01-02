import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAlert } from '../context/alertContext';
import './styles/editBasePricing.css';

// Reusing the same categories
const CATEGORIES = ['Shirt', 'Pant', 'Half Pant', 'Skirt', 'Frock', 'Jacket', 'Kurta', 'Salwar', 'Dupatta', 'Lower', 'Blazer', 'Tie', 'Cap', 'Sweater', 'Socks', 'Tracksuit', 'T-Shirt', 'Belt', 'Tunic', 'Miscellaneous'];

const EditBasePricing = () => {
  const navigate = useNavigate();
  const { basePricingId } = useParams(); // Ensure your Route uses :id
  const { showAlert } = useAlert();

  // --- FORM STATE ---
  const [category, setCategory] = useState(CATEGORIES[0]);
  
  // Searchable Dropdown State
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [priceData, setPriceData] = useState([{ size: '', price: '' }]);

  // --- UI STATE ---
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const categoryWrapperRef = useRef(null);

  // --- 1. FETCH EXISTING DATA ---
  useEffect(() => {
    if (!basePricingId) {
        setError("Invalid URL: No template ID provided.");
        setInitialLoading(false);
        return;
    }

    const fetchTemplate = async () => {
      try {
        const res = await axios.get(`/api/basePricing/${basePricingId}`);
        // Handle nested data structure if necessary
        const data = res.data.data || res.data; 
        
        // Populate State
        if (data.category) {
            setCategory(data.category);
            setCategorySearch(data.category); // Sync visual input
        }
        if (data.tags) setTags(data.tags);
        if (data.basePriceData && data.basePriceData.length > 0) {
            setPriceData(data.basePriceData);
        } else {
            setPriceData([{ size: '', price: '' }]);
        }

      } catch (err) {
        console.error("Failed to fetch template", err);
        setError("Could not load pricing template.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchTemplate();
  }, [basePricingId]);

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

  // --- CATEGORY HANDLERS ---
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

  // --- HANDLERS: TAGS ---
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

  // --- HANDLERS: PRICING ROWS ---
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
    setSaving(true);
    setError('');

    if (!priceData.some(row => row.size && row.price)) {
        setError("Please ensure at least one price row is valid.");
        setSaving(false);
        return;
    }
    
    if (!category.trim()) {
        setError("Category is required.");
        setSaving(false);
        return;
    }

    try {
      const payload = {
        category,
        tags,
        basePriceData: priceData
      };

      await axios.patch(`/api/basePricing/${basePricingId}`, payload);
      await showAlert('Template Updated Successfully!', 'Success');
      navigate('/basePricing'); 

    } catch (err) {
      console.error('Update Error:', err);
      setError(err.response?.data?.message || 'Failed to update template.');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) return <div className="ebp-loading">Loading Template Details...</div>;

  return (
    <div className="ebp-page-wrapper">
      <div className="ebp-header">
        <h1>Edit Pricing Template</h1>
        <div className="ebp-actions">
            <button className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
            <button className="btn-save" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Updating...' : 'Update Template'}
            </button>
        </div>
      </div>

      {error && <div className="ebp-error-banner"> {error}</div>}

      <div className="ebp-grid-layout">
        
        {/* --- LEFT COLUMN: DETAILS --- */}
        <div className="ebp-card details-card">
            <h3>Template Details</h3>
            
            {/* SEARCHABLE CATEGORY INPUT */}
            <div className="ebp-form-group" ref={categoryWrapperRef}>
                <label>Category <span className="req">*</span></label>
                <div className="searchable-dropdown-wrapper">
                    <input 
                        type="text" 
                        className="ebp-input" 
                        value={categorySearch} 
                        onChange={handleCategoryChange}
                        onFocus={() => setShowCategoryDropdown(true)}
                        placeholder="Search or type category..."
                    />
                    {/* Dropdown List */}
                    {showCategoryDropdown && filteredCategories.length > 0 && (
                        <div className="ebp-dropdown-list">
                            {filteredCategories.map(c => (
                                <div 
                                    key={c} 
                                    className="ebp-dropdown-item" 
                                    onClick={() => handleCategorySelect(c)}
                                >
                                    {c}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <small className="hint-text">Category associated with this pricing structure.</small>
            </div>

            <div className="ebp-form-group">
                <label>Tags</label>
                <div className="tag-input-row">
                    <input 
                        type="text" 
                        className="ebp-input" 
                        placeholder="e.g. Cotton, Premium..."
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                    />
                    <button type="button" onClick={handleAddTag} className="btn-add-tag">Add</button>
                </div>
                
                <div className="active-tags-list">
                    {tags.length > 0 ? tags.map(t => (
                        <span key={t} className="active-tag-pill">
                            {t} <span className="x-btn" onClick={() => removeTag(t)}>×</span>
                        </span>
                    )) : <span className="placeholder-text">No tags added.</span>}
                </div>
            </div>
        </div>

        {/* --- RIGHT COLUMN: PRICING DATA --- */}
        <div className="ebp-card pricing-card">
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
                            className="ebp-input compact" 
                            placeholder="Size"
                            value={row.size}
                            onChange={e => handlePriceChange(i, 'size', e.target.value)}
                        />
                        <input 
                            type="number" 
                            className="ebp-input compact" 
                            placeholder="Price"
                            value={row.price}
                            onChange={e => handlePriceChange(i, 'price', e.target.value)}
                        />
                        <button 
                            type="button" 
                            className="btn-icon-del" 
                            onClick={() => removePriceRow(i)}
                            title="Remove Row"
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

export default EditBasePricing;