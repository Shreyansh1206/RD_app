import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import imageCompression from 'browser-image-compression'; // 1. Import Library
import { useAlert } from '../context/alertContext';
import './styles/addUniform.css';

// --- CONSTANTS ---
const CATEGORIES = ['Shirt', 'Pant', 'Half Pant', 'Skirt', 'Frock', 'Jacket', 'Kurta', 'Salwar', 'Dupatta', 'Lower', 'Blazer', 'Tie', 'Cap', 'Sweater', 'Socks', 'Tracksuit', 'T-Shirt', 'Belt', 'Tunic', 'Monogram', 'Miscellaneous'];
const CLASS_OPTIONS = [
  { label: 'Pre-Nursery', value: -3 },
  { label: 'Nursery', value: -2 },
  { label: 'LKG', value: -1 },
  { label: 'UKG', value: 0 },
  ...Array.from({ length: 12 }, (_, i) => ({ label: `Class ${i + 1}`, value: i + 1 }))
];
const TYPES = ['Sport Wear', 'House Dress', 'Normal Dress', 'Miscellaneous'];

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
  
  const [category, setCategory] = useState(''); // CHANGED: Default empty
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false); // NEW STATE

  // Unified Dropdown State for others
  const [activeDropdown, setActiveDropdown] = useState(null); // 'type' | 'season' | 'classMin' | 'classMax'

  const [season, setSeason] = useState('All');
  const [type, setType] = useState('Normal Dress');
  const [classMin, setClassMin] = useState(-3); 
  const [classMax, setClassMax] = useState(12); 
  const [extraInfo, setExtraInfo] = useState('');
  
  // Image States
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false); 

  const [addedPricingStructures, setAddedPricingStructures] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Refs
  const schoolWrapperRef = useRef(null);
  const categoryWrapperRef = useRef(null);
  const typeWrapperRef = useRef(null);
  const seasonWrapperRef = useRef(null);
  const classMinWrapperRef = useRef(null);
  const classMaxWrapperRef = useRef(null);

  const { showAlert } = useAlert();

  // --- EFFECTS ---
  useEffect(() => {
    const fetchSchools = async () => { try { const res = await axios.get('/api/schools'); setSchools(res.data); } catch (err) { console.error(err); } };
    fetchSchools();
  }, []);

  useEffect(() => {
    // Only fetch if category is valid/selected
    if(category && CATEGORIES.includes(category)) {
        const fetchBasePricing = async () => { try { const res = await axios.get(`/api/basePricing/category/${category}`); setBasePricingTemplates(res.data); } catch (err) { setBasePricingTemplates([]); } };
        fetchBasePricing();
    } else {
        setBasePricingTemplates([]);
    }
  }, [category]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (schoolWrapperRef.current && !schoolWrapperRef.current.contains(event.target)) setShowSchoolDropdown(false);
      if (categoryWrapperRef.current && !categoryWrapperRef.current.contains(event.target)) setShowCategoryDropdown(false);
      
      // Close unified dropdowns
      if (activeDropdown === 'type' && typeWrapperRef.current && !typeWrapperRef.current.contains(event.target)) setActiveDropdown(null);
      if (activeDropdown === 'season' && seasonWrapperRef.current && !seasonWrapperRef.current.contains(event.target)) setActiveDropdown(null);
      if (activeDropdown === 'classMin' && classMinWrapperRef.current && !classMinWrapperRef.current.contains(event.target)) setActiveDropdown(null);
      if (activeDropdown === 'classMax' && classMaxWrapperRef.current && !classMaxWrapperRef.current.contains(event.target)) setActiveDropdown(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [schoolWrapperRef, categoryWrapperRef, typeWrapperRef, seasonWrapperRef, classMinWrapperRef, classMaxWrapperRef, activeDropdown]);

  // --- HANDLERS ---
  const selectSchool = (s) => { 
      setSchoolSearch(s.name); 
      setShowSchoolDropdown(false); 
  };

  const handleSchoolChange = (e) => {
      setSchoolSearch(e.target.value);
      setShowSchoolDropdown(true);
  };

  const toggleDropdown = (name) => {
      if (activeDropdown === name) setActiveDropdown(null);
      else setActiveDropdown(name);
  };

  // Helper to get Class Label
  const getClassLabel = (val) => CLASS_OPTIONS.find(o => o.value == val)?.label || val;

  // 3. Updated File Handler... (omitted logic unchanged)
  const handleFileChange = async (e) => { 
      const file = e.target.files[0]; 
      if (file) {
        if (file.size > 20 * 1024 * 1024) { showAlert("File is too large! Please upload an image under 20MB."); return; }
        setIsCompressing(true);
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true };
        try {
            const compressedFile = await imageCompression(file, options);
            setImageFile(compressedFile); setImagePreview(URL.createObjectURL(compressedFile)); 
        } catch (error) {
            console.error("Compression failed:", error); setImageFile(file); setImagePreview(URL.createObjectURL(file));
        } finally { setIsCompressing(false); }
      } 
  };

  const handleCreateStructure = (data) => { setAddedPricingStructures([...addedPricingStructures, { ...data, id: Date.now() }]); };
  const handleUpdateStructure = (data) => { setAddedPricingStructures(prev => prev.map(item => item.id === editingId ? { ...item, ...data } : item)); setEditingId(null); };
  const handleDeleteStructure = (id, e) => { e.stopPropagation(); setAddedPricingStructures(prev => prev.filter(p => p.id !== id)); if (editingId === id) setEditingId(null); };

  // --- SUBMIT LOGIC --- (unchanged)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    if(!schoolSearch.trim()) { setError("Please enter or select a School Name."); setLoading(false); return; }
    if(!category || !CATEGORIES.includes(category)) { setError("Please select a valid Category from the list."); setLoading(false); return; }
    if(isCompressing) { setError("Please wait for image compression to complete."); setLoading(false); return; }

    try {
      const formData = new FormData();
      formData.append('schoolName', schoolSearch);
      formData.append('category', category);
      formData.append('season', season);
      formData.append('type', type);
      formData.append('classMin', classMin);
      formData.append('classMax', classMax);
      formData.append('extraInfo', extraInfo);
      if (imageFile) formData.append('uniformImage', imageFile);

      const uniformRes = await axios.post('/api/uniforms', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const newUniformId = uniformRes.data.uniform._id; 

      const pricingRequests = addedPricingStructures.map(struct => {
          return axios.post('/api/pricing', {
              uniform: newUniformId, tags: struct.tags, priceData: struct.priceData, basePricingId: struct.basePricingId 
          });
      });
      await Promise.all(pricingRequests);
      await showAlert('Uniform and Pricing Created Successfully!', 'Success');
      navigate(-1); 
    } catch (err) {
      console.error('Error:', err); setError(err.response?.data?.message || 'Something went wrong during creation.');
    } finally { setLoading(false); }
  };

  const filteredSchools = schools.filter(s => s.name.toLowerCase().includes(schoolSearch.toLowerCase()));

  return (
    <div className="au-page-wrapper">
      <div className="au-header">
        <h1>Add New Uniform</h1>
        <div className="au-actions">
            <button className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
            <button className="btn-save" onClick={handleSubmit} disabled={loading || isCompressing}> {loading ? 'Saving...' : 'Save Uniform'} </button>
        </div>
      </div>

      {error && <div className="au-error-banner">{error}</div>}

      <div className="au-layout-container">
        <div className="au-top-row">
            <div className="au-card core-details-card">
                <h3>Core Details</h3>
                
                <div className="au-form-group" ref={schoolWrapperRef}>
                    <label>School Name <span className="req">*</span></label>
                    <input type="text" className="au-input" placeholder="Search or enter new school name..." value={schoolSearch} onChange={handleSchoolChange} onFocus={() => setShowSchoolDropdown(true)} />
                    {showSchoolDropdown && filteredSchools.length > 0 && (
                        <div className="au-dropdown-list">
                            {filteredSchools.map(s => ( <div key={s._id} className="au-dropdown-item" onClick={() => selectSchool(s)}> {s.name} <span className="loc-hint">({s.location})</span> </div> ))}
                        </div>
                    )}
                </div>

                <div className="au-row three-col">
                    <div className="au-form-group" ref={categoryWrapperRef}>
                        <label>Category <span className="req">*</span></label>
                        <input type="text" className="au-input" placeholder="Select a Category..." value={category} onChange={e => setCategory(e.target.value)} onFocus={() => setShowCategoryDropdown(true)} />
                        {showCategoryDropdown && (
                             <div className="au-dropdown-list">
                                 {CATEGORIES.filter(c => c.toLowerCase().includes(category.toLowerCase())).map(c => ( <div key={c} className="au-dropdown-item" onClick={() => { setCategory(c); setShowCategoryDropdown(false); }}> {c} </div> ))}
                                 {CATEGORIES.filter(c => c.toLowerCase().includes(category.toLowerCase())).length === 0 && ( <div className="au-dropdown-item" style={{color: '#999', cursor: 'default'}}> No category found </div> )}
                             </div>
                        )}
                    </div>
                    
                    {/* CUSTOM DROPDOWN: TYPE */}
                    <div className="au-form-group" ref={typeWrapperRef}>
                        <label>Type</label>
                        <input 
                            type="text" 
                            className="au-input" 
                            readOnly 
                            value={type} 
                            onClick={() => toggleDropdown('type')} 
                            style={{ cursor: 'pointer' }}
                        />
                        {activeDropdown === 'type' && (
                            <div className="au-dropdown-list">
                                {TYPES.map(t => (
                                    <div key={t} className="au-dropdown-item" onClick={() => { setType(t); setActiveDropdown(null); }}>
                                        {t}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* CUSTOM DROPDOWN: SEASON */}
                    <div className="au-form-group" ref={seasonWrapperRef}>
                        <label>Season</label>
                        <input 
                            type="text" 
                            className="au-input" 
                            readOnly 
                            value={season} 
                            onClick={() => toggleDropdown('season')} 
                            style={{ cursor: 'pointer' }}
                        />
                        {activeDropdown === 'season' && (
                            <div className="au-dropdown-list">
                                <div className="au-dropdown-item" onClick={() => { setSeason('All'); setActiveDropdown(null); }}>All Seasons</div>
                                <div className="au-dropdown-item" onClick={() => { setSeason('Summer'); setActiveDropdown(null); }}>Summer</div>
                                <div className="au-dropdown-item" onClick={() => { setSeason('Winter'); setActiveDropdown(null); }}>Winter</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="au-row two-col">
                    <div className="au-form-group">
                        <label>Class Range</label>
                        <div className="au-range-wrapper">
                            {/* CUSTOM DROPDOWN: CLASS MIN */}
                            <div style={{ position: 'relative', flex: 1 }} ref={classMinWrapperRef}>
                                <input 
                                    className="au-input" 
                                    readOnly 
                                    value={getClassLabel(classMin)} 
                                    onClick={() => toggleDropdown('classMin')}
                                    style={{ cursor: 'pointer' }}
                                />
                                {activeDropdown === 'classMin' && (
                                    <div className="au-dropdown-list">
                                        {CLASS_OPTIONS.map(o => (
                                            <div key={o.value} className="au-dropdown-item" onClick={() => { setClassMin(o.value); setActiveDropdown(null); }}>
                                                {o.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <span className="range-sep">to</span>
                            
                            {/* CUSTOM DROPDOWN: CLASS MAX */}
                            <div style={{ position: 'relative', flex: 1 }} ref={classMaxWrapperRef}>
                                <input 
                                    className="au-input" 
                                    readOnly 
                                    value={getClassLabel(classMax)} 
                                    onClick={() => toggleDropdown('classMax')}
                                    style={{ cursor: 'pointer' }}
                                />
                                {activeDropdown === 'classMax' && (
                                    <div className="au-dropdown-list">
                                        {CLASS_OPTIONS.map(o => (
                                            <div key={o.value} className="au-dropdown-item" onClick={() => { setClassMax(o.value); setActiveDropdown(null); }}>
                                                {o.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
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