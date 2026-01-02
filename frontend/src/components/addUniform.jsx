import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import imageCompression from 'browser-image-compression'; // 1. Import Library
import { useAlert } from '../context/alertContext';
import './styles/addUniform.css';

// --- CONSTANTS ---
const CATEGORIES = ['Shirt', 'Pant', 'Half Pant', 'Skirt', 'Frock', 'Jacket', 'Kurta', 'Salwar', 'Dupatta', 'Lower', 'Blazer', 'Tie', 'Cap', 'Sweater', 'Socks', 'Tracksuit', 'T-Shirt', 'Belt', 'Tunic', 'Miscellaneous'];
const CLASS_OPTIONS = [
  { label: 'Pre-Nursery', value: -3 },
  { label: 'Nursery', value: -2 },
  { label: 'LKG', value: -1 },
  { label: 'UKG', value: 0 },
  ...Array.from({ length: 12 }, (_, i) => ({ label: `Class ${i + 1}`, value: i + 1 }))
];
const TYPES = ['Normal Dress', 'Sport Wear', 'House Dress', 'Winter Wear', 'Accessory'];

// --- SUB-COMPONENT: PRICING EDITOR ---
const PricingEditor = ({ initialData, onSave, onCancel, templates, category, isNew }) => {
    const [mode, setMode] = useState(initialData ? 'custom' : 'template'); 
    const { showAlert } = useAlert(); 
    
    // State
    const [tags, setTags] = useState(initialData?.tags || []);
    const [priceData, setPriceData] = useState(initialData?.priceData || [{ size: '', price: '' }]);
    // Track the template ID. If null, it's considered custom or modified.
    const [basePricingId, setBasePricingId] = useState(initialData?.basePricingId || null);
    
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (isNew && !initialData) {
            setTags([]);
            setPriceData([{ size: '', price: '' }]);
            setBasePricingId(null);
            setMode('template');
        }
    }, [initialData, isNew]);

    // --- Template Selection ---
    const selectTemplate = (tpl) => {
        setTags(tpl.tags || []);
        if (tpl.basePriceData?.length) {
            setPriceData(tpl.basePriceData.map(p => ({ size: p.size, price: p.price })));
        }
        // Link to the template
        setBasePricingId(tpl._id);
        setMode('custom');
    };

    // --- Edit Handlers (Detach on Change) ---
    const addTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim() && !tags.includes(tagInput.trim())) {
            e.preventDefault();
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
            setBasePricingId(null); // Detach
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
        setBasePricingId(null); // Detach
    };

    const updateRow = (idx, field, val) => {
        const newData = [...priceData];
        newData[idx][field] = val;
        setPriceData(newData);
        setBasePricingId(null); // Detach
    };

    const addPriceRow = () => {
        setPriceData([...priceData, { size: '', price: '' }]);
        setBasePricingId(null); // Detach
    };

    const removePriceRow = (i) => {
        if (priceData.length > 1) {
            setPriceData(priceData.filter((_, idx) => idx !== i));
            setBasePricingId(null); // Detach
        }
    };

    const handleSave = () => {
        if (!priceData.some(r => r.size && r.price)) return showAlert("Add at least one price row.");
        
        onSave({ 
            tags, 
            priceData,
            basePricingId // Pass this up to parent
        });

        if(isNew) {
            setTags([]);
            setPriceData([{ size: '', price: '' }]);
            setBasePricingId(null);
            setMode('template');
        }
    };

    return (
        <div className={`pricing-block add-form-block ${!isNew ? 'editing-mode' : ''}`}>
            <div className="pb-header">
                <span className="pb-title">
                    {isNew ? 'Add New Structure' : 'Editing Variant'}
                    {/* Visual Indicator */}
                    {basePricingId && <span className="linked-badge-small">Linked</span>}
                </span>
                <div className="mode-switch">
                    {!isNew && <button className="mode-btn cancel-x" onClick={onCancel}>Cancel</button>}
                    <button className={`mode-btn ${mode === 'template' ? 'active' : ''}`} onClick={() => setMode('template')}>Templates</button>
                    <button className={`mode-btn ${mode === 'custom' ? 'active' : ''}`} onClick={() => setMode('custom')}>Custom</button>
                </div>
            </div>
            <div className="pb-body">
                {mode === 'template' ? (
                    <div className="template-list-scroller">
                        {templates.length > 0 ? templates.map(tpl => (
                            <button key={tpl._id} className="tpl-chip-block" type="button" onClick={() => selectTemplate(tpl)}>
                                <strong>{tpl.tags.join(', ')}</strong>
                                <small>Base: ₹{tpl.basePriceData?.[0]?.price}</small>
                            </button>
                        )) : <div className="no-data-text">No templates for {category}</div>}
                        <button className="tpl-chip-block custom-link" type="button" onClick={() => setMode('custom')}>+ Start Empty</button>
                    </div>
                ) : (
                    <div className="custom-editor">
                        <div className="mini-form-group">
                            <input type="text" className="au-input mini" placeholder="Tag + Enter..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} />
                            <div className="mini-tags-list">
                                {tags.map(t => (<span key={t} className="tiny-tag" onClick={() => removeTag(t)}>{t} ×</span>))}
                            </div>
                        </div>
                        <div className="mini-price-table">
                            <div className="mpt-head"><span>Size</span><span>Price</span></div>
                            <div className="mpt-body">
                                {priceData.map((row, i) => (
                                    <div key={i} className="mpt-row">
                                        <input type="text" placeholder="Sz" value={row.size} onChange={e => updateRow(i, 'size', e.target.value)} />
                                        <input type="number" placeholder="₹" value={row.price} onChange={e => updateRow(i, 'price', e.target.value)} />
                                        <span className="del-x" onClick={() => removePriceRow(i)}>×</span>
                                    </div>
                                ))}
                            </div>
                            <button className="btn-mini-add" type="button" onClick={addPriceRow}>+ Row</button>
                        </div>
                        <button className="btn-commit-add" type="button" onClick={handleSave}>{isNew ? 'Add Structure' : 'Update Structure'}</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const AddUniform = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATES ---
  const [schools, setSchools] = useState([]);
  const [basePricingTemplates, setBasePricingTemplates] = useState([]);
  
  // Initialize from navigation state if available
  const [schoolSearch, setSchoolSearch] = useState(location.state?.schoolName || ''); 
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false); // NEW STATE

  const [season, setSeason] = useState('All');
  const [type, setType] = useState('Normal Dress');
  const [classMin, setClassMin] = useState(-3); 
  const [classMax, setClassMax] = useState(12); 
  const [extraInfo, setExtraInfo] = useState('');
  
  // Image States
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false); // 2. Loading State

  const [addedPricingStructures, setAddedPricingStructures] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const schoolWrapperRef = useRef(null);
  const categoryWrapperRef = useRef(null);
  const { showAlert } = useAlert();



  // --- EFFECTS ---
  useEffect(() => {
    const fetchSchools = async () => { try { const res = await axios.get('/api/schools'); setSchools(res.data); } catch (err) { console.error(err); } };
    fetchSchools();
  }, []);

  useEffect(() => {
    const fetchBasePricing = async () => { try { const res = await axios.get(`/api/basePricing/category/${category}`); setBasePricingTemplates(res.data); } catch (err) { setBasePricingTemplates([]); } };
    fetchBasePricing();
  }, [category]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (schoolWrapperRef.current && !schoolWrapperRef.current.contains(event.target)) setShowSchoolDropdown(false);
      // NEW: Handle Category Outside Click
      if (categoryWrapperRef.current && !categoryWrapperRef.current.contains(event.target)) setShowCategoryDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [schoolWrapperRef, categoryWrapperRef]);

  // --- HANDLERS ---
  const selectSchool = (s) => { 
      setSchoolSearch(s.name); 
      setShowSchoolDropdown(false); 
  };

  const handleSchoolChange = (e) => {
      setSchoolSearch(e.target.value);
      setShowSchoolDropdown(true);
  };

  // 3. Updated File Handler with Compression Logic (0.5MB Limit)
  const handleFileChange = async (e) => { 
      const file = e.target.files[0]; 
      
      if (file) {
        // Safety check for massive files
        if (file.size > 20 * 1024 * 1024) {
            showAlert("File is too large! Please upload an image under 20MB.");
            return;
        }

        setIsCompressing(true);

        const options = {
            maxSizeMB: 0.5,          // 4. Set Constraint: 0.5 MB
            maxWidthOrHeight: 1200,  // Good quality for web catalog
            useWebWorker: true,
        };

        try {
            const compressedFile = await imageCompression(file, options);
            setImageFile(compressedFile); 
            setImagePreview(URL.createObjectURL(compressedFile)); 
        } catch (error) {
            console.error("Compression failed:", error);
            // Fallback to original
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        } finally {
            setIsCompressing(false);
        }
      } 
  };

  const handleCreateStructure = (data) => { setAddedPricingStructures([...addedPricingStructures, { ...data, id: Date.now() }]); };
  const handleUpdateStructure = (data) => { setAddedPricingStructures(prev => prev.map(item => item.id === editingId ? { ...item, ...data } : item)); setEditingId(null); };
  const handleDeleteStructure = (id, e) => { e.stopPropagation(); setAddedPricingStructures(prev => prev.filter(p => p.id !== id)); if (editingId === id) setEditingId(null); };

  // --- SUBMIT LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); 
    setError('');

    if(!schoolSearch.trim()) { setError("Please enter or select a School Name."); setLoading(false); return; }
    if(addedPricingStructures.length === 0) { setError("Please add at least one pricing structure."); setLoading(false); return; }
    // 5. Block submit if compressing
    if(isCompressing) { setError("Please wait for image compression to complete."); setLoading(false); return; }

    try {
      // 1. Create the Uniform first
      const formData = new FormData();
      formData.append('schoolName', schoolSearch);
      formData.append('category', category);
      formData.append('season', season);
      formData.append('type', type);
      formData.append('classMin', classMin);
      formData.append('classMax', classMax);
      formData.append('extraInfo', extraInfo);
      if (imageFile) formData.append('uniformImage', imageFile);

      const uniformRes = await axios.post('/api/uniforms', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newUniformId = uniformRes.data.uniform._id; 

      // 2. Create Pricing Structures
      const pricingRequests = addedPricingStructures.map(struct => {
          return axios.post('/api/pricing', {
              uniform: newUniformId, 
              tags: struct.tags,
              priceData: struct.priceData,
              // Send the base ID (if linked) or null (if custom/edited)
              basePricingId: struct.basePricingId 
          });
      });

      await Promise.all(pricingRequests);

      await showAlert('Uniform and Pricing Created Successfully!', 'Success');
      navigate(-1); 

    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Something went wrong during creation.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = schools.filter(s => s.name.toLowerCase().includes(schoolSearch.toLowerCase()));

  return (
    <div className="au-page-wrapper">
      <div className="au-header">
        <h1>Add New Uniform</h1>
        <div className="au-actions">
            <button className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
            <button className="btn-save" onClick={handleSubmit} disabled={loading || isCompressing}>
                {loading ? 'Saving...' : 'Save Uniform'}
            </button>
        </div>
      </div>

      {error && <div className="au-error-banner">{error}</div>}

      <div className="au-layout-container">
        <div className="au-top-row">
            <div className="au-card core-details-card">
                <h3>Core Details</h3>
                
                <div className="au-form-group" ref={schoolWrapperRef}>
                    <label>School Name <span className="req">*</span></label>
                    <input 
                        type="text" 
                        className="au-input" 
                        placeholder="Search or enter new school name..." 
                        value={schoolSearch}
                        onChange={handleSchoolChange}
                        onFocus={() => setShowSchoolDropdown(true)}
                    />
                    {showSchoolDropdown && filteredSchools.length > 0 && (
                        <div className="au-dropdown-list">
                            {filteredSchools.map(s => (
                                <div key={s._id} className="au-dropdown-item" onClick={() => selectSchool(s)}>
                                    {s.name} <span className="loc-hint">({s.location})</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="au-row three-col">
                    <div className="au-form-group" ref={categoryWrapperRef}>
                        <label>Category <span className="req">*</span></label>
                        <input 
                            type="text" 
                            className="au-input" 
                            placeholder="Select or Type..." 
                            value={category} 
                            onChange={e => setCategory(e.target.value)}
                            onFocus={() => setShowCategoryDropdown(true)}
                        />
                        {showCategoryDropdown && (
                             <div className="au-dropdown-list">
                                 {CATEGORIES.filter(c => c.toLowerCase().includes(category.toLowerCase())).map(c => (
                                     <div key={c} className="au-dropdown-item" onClick={() => { setCategory(c); setShowCategoryDropdown(false); }}>
                                         {c}
                                     </div>
                                 ))}
                                 {CATEGORIES.filter(c => c.toLowerCase().includes(category.toLowerCase())).length === 0 && (
                                     <div className="au-dropdown-item" style={{color: '#999', cursor: 'default'}}>
                                         No matches. Press Enter to use "{category}"
                                     </div>
                                 )}
                             </div>
                        )}
                    </div>
                    <div className="au-form-group"><label>Type</label><select className="au-select" value={type} onChange={e => setType(e.target.value)}>{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div className="au-form-group"><label>Season</label><select className="au-select" value={season} onChange={e => setSeason(e.target.value)}><option value="All">All Seasons</option><option value="Summer">Summer</option><option value="Winter">Winter</option></select></div>
                </div>
                <div className="au-row two-col">
                    <div className="au-form-group"><label>Class Range</label><div className="au-range-wrapper">
                        <select className="au-select" value={classMin} onChange={e => setClassMin(e.target.value)}>{CLASS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                        <span className="range-sep">to</span>
                        <select className="au-select" value={classMax} onChange={e => setClassMax(e.target.value)}>{CLASS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                    </div></div>
                    <div className="au-form-group"><label>Extra Info</label><input type="text" className="au-input" placeholder="Details..." value={extraInfo} onChange={e => setExtraInfo(e.target.value)} /></div>
                </div>
            </div>
            <div className="au-card image-card">
                <h3>Visuals</h3>
                <div className="image-upload-area">
                    {/* 6. UI Update for Compression Status */}
                    {isCompressing ? (
                        <div className="preview-container">
                            <div className="upload-icon">⏳</div>
                            <span>Compressing (0.5MB)...</span>
                        </div>
                    ) : imagePreview ? (
                        <div className="preview-container">
                            <img src={imagePreview} alt="Preview" />
                            <button type="button" className="btn-remove-img" onClick={() => { setImageFile(null); setImagePreview(null); }}>Remove</button>
                        </div>
                    ) : (
                        <label className="upload-placeholder">
                            <span className="upload-icon">📷</span>
                            <span>Upload Image</span>
                            <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                        </label>
                    )}
                </div>
            </div>
        </div>

        <div className="au-card pricing-workflow-card">
            <h3>Pricing Structures</h3>
            <p className="sub-label">Click a card to edit it, or use the "Add New" block to create more.</p>
            <div className="pricing-grid">
                {addedPricingStructures.map((struct, idx) => (
                    editingId === struct.id ? (
                        <PricingEditor key={struct.id} initialData={struct} category={category} templates={basePricingTemplates} onSave={handleUpdateStructure} onCancel={() => setEditingId(null)} isNew={false} />
                    ) : (
                        <div key={struct.id} className="pricing-block committed" onClick={() => setEditingId(struct.id)}>
                            <div className="pb-header">
                                <span className="pb-title">Variant {idx + 1}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {struct.basePricingId && <span className="linked-badge-small">Linked</span>}
                                    <button className="btn-icon-del" onClick={(e) => handleDeleteStructure(struct.id, e)}>×</button>
                                </div>
                            </div>
                            <div className="pb-tags">{struct.tags.length > 0 ? struct.tags.map(t => (<span key={t} className="tiny-tag">{t}</span>)) : <span className="tiny-tag none">No Tags</span>}</div>
                            <div className="pb-summary">{struct.priceData.length} size rows defined.</div>
                            <div className="pb-preview-list">{struct.priceData.slice(0, 3).map((r, i) => (<div key={i} className="pb-row-preview"><span>{r.size}</span><span>₹{r.price}</span></div>))}{struct.priceData.length > 3 && <div className="more-dots">...</div>}</div>
                            <div className="edit-hint-overlay">Click to Edit</div>
                        </div>
                    )
                ))}
                <PricingEditor isNew={true} category={category} templates={basePricingTemplates} onSave={handleCreateStructure} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default AddUniform;