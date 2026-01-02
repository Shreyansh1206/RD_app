import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAlert } from '../context/alertContext';
import './styles/schoolDashboard.css';

const SchoolDashboard = () => {
  const { schoolId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert();
  
  // --- Data State ---
  const [school, setSchool] = useState(null);
  const [uniforms, setUniforms] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Modal Specific State ---
  const [pricingVariants, setPricingVariants] = useState([]); 
  const [pricingLoading, setPricingLoading] = useState(false); // NEW STATE
  const [selectedTags, setSelectedTags] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- 1. URL READERS ---
  const activeSeason = searchParams.get('season');
  const activeClassStr = searchParams.get('class'); 
  const activeType = searchParams.get('type');
  const activeCategory = searchParams.get('category');
  const activeUniformId = searchParams.get('uniform');
  const showCollage = searchParams.get('collage');

  // --- 2. INITIAL DATA FETCH ---
  useEffect(() => {
    if (!schoolId) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const [schoolRes, uniformsRes] = await Promise.all([
          axios.get(`/api/schools/${schoolId}`),
          axios.get(`/api/uniforms/school/${schoolId}`)
        ]);
        setSchool(schoolRes.data);
        setUniforms(uniformsRes.data);
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [schoolId]);

  // --- 3. FETCH PRICING FOR MODAL ---
  useEffect(() => {
    if (!activeUniformId) {
      setPricingVariants([]);
      setSelectedTags([]);
      return;
    }

    const fetchPricing = async () => {
      try {
        setPricingLoading(true); // START LOADING
        const res = await axios.get(`/api/pricing/uniform/${activeUniformId}`);
        setPricingVariants(res.data);
      } catch (err) {
        console.error("Pricing Fetch Error:", err);
        setPricingVariants([]); 
      } finally {
        setPricingLoading(false); // END LOADING
      }
    };
    fetchPricing();
  }, [activeUniformId]);

  // --- 4. DERIVED FILTERS ---
  // --- 4. DERIVED FILTERS ---
  const getClassString = (u) => `${u.class.start}-${u.class.end}`;

  const formatClassLabel = (val) => {
    if (val === -3) return 'Pre-Nursery';
    if (val === -2) return 'Nursery';
    if (val === -1) return 'LKG';
    if (val === 0) return 'UKG';
    return val;
  };

  const formatClassRange = (start, end) => {
     if (start === end) {
         return start <= 0 ? formatClassLabel(start) : `Class ${start}`;
     }
     
     // Both Negative/Zero (Special Names)
     if (end <= 0) {
         return `${formatClassLabel(start)} - ${formatClassLabel(end)}`;
     }

     // Both Positive (Standard Classes)
     if (start > 0) {
         return `Class ${start}-${end}`;
     }

     // Mixed (e.g. UKG - Class 2)
     return `${formatClassLabel(start)} - Class ${end}`;
  };

  const getDisplayClass = (u) => formatClassRange(u.class.start, u.class.end);

  const formatRangeFromKey = (key) => {
     const [s, e] = key.split('-').map(Number);
     return formatClassRange(s, e);
  };

  const uniqueOptions = useMemo(() => {
    const seasons = new Set();
    const classes = new Set();
    const types = new Set();
    const categories = new Set(); 

    uniforms.forEach(u => {
      if (u.season) seasons.add(u.season);
      if (u.class) classes.add(getClassString(u));
      if (u.type) types.add(u.type);
      if (u.category) categories.add(u.category); 
    });

    return {
      seasons: Array.from(seasons).filter(s => s !== 'All').sort(),
      classes: Array.from(classes).sort((a,b) => parseInt(a) - parseInt(b)), 
      types: Array.from(types).sort(),
      categories: Array.from(categories).sort() 
    };
  }, [uniforms]);

  const displayedItems = useMemo(() => {
    return uniforms.filter(item => {
      // Inclusive filtering for Seasons
      if (activeSeason) {
          if (activeSeason === 'Summer') {
              if (item.season !== 'Summer' && item.season !== 'All') return false;
          } else if (activeSeason === 'Winter') {
              if (item.season !== 'Winter' && item.season !== 'All') return false;
          } else {
              // Exact match for 'All' or others
              if (item.season !== activeSeason) return false;
          }
      }
      
      if (activeClassStr && getClassString(item) !== activeClassStr) return false;
      if (activeType && item.type !== activeType) return false;
      if (activeCategory && item.category !== activeCategory) return false;
      return true;
    });
  }, [uniforms, activeSeason, activeClassStr, activeType, activeCategory]);

  // --- 5. DERIVED MODAL STATE ---
  const selectedUniform = uniforms.find(u => u._id === activeUniformId);

  const allAvailableTags = useMemo(() => {
    const tags = new Set();
    pricingVariants.forEach(v => {
      if (v.tags && Array.isArray(v.tags)) {
        v.tags.forEach(t => tags.add(t));
      }
    });
    return Array.from(tags);
  }, [pricingVariants]);

  const matchingPricing = useMemo(() => {
    if (pricingVariants.length === 0) return null;
    const matches = pricingVariants.filter(variant => {
        const variantTags = variant.tags || [];
        if (selectedTags.length === 0) return true; 
        return selectedTags.every(tag => variantTags.includes(tag));
    });
    if (matches.length === 0) return "none"; 
    matches.sort((a, b) => (a.tags || []).length - (b.tags || []).length);
    return matches[0]; 
  }, [pricingVariants, selectedTags]);

  // --- SYNC PRICING ID TO URL ---
  useEffect(() => {
    if (activeUniformId && matchingPricing && matchingPricing !== "none") {
      const currentPricingId = searchParams.get('pricing');
      if (currentPricingId !== matchingPricing._id) {
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.set('pricing', matchingPricing._id);
          return newParams;
        }, { replace: true });
      }
    } else if (activeUniformId && matchingPricing === "none") {
       setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('pricing');
        return newParams;
      }, { replace: true });
    }
  }, [matchingPricing, activeUniformId, setSearchParams, searchParams]);

  // --- HANDLERS ---
  const updateFilters = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const openUniformModal = (id) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('uniform', id);
    setSearchParams(newParams);
  };

  const closeModal = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('uniform');
    newParams.delete('pricing');
    setSearchParams(newParams);
  };

  const toggleCollage = (show) => {
    const newParams = new URLSearchParams(searchParams);
    if (show) newParams.set('collage', 'true');
    else newParams.delete('collage');
    setSearchParams(newParams);
  }

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // --- DELETE HANDLER (NEW) ---
  const handleDeleteUniform = async (id) => {
    const isConfirmed = await showConfirm("Are you sure you want to delete this uniform? This action cannot be undone.");
    if (!isConfirmed) return;
    
    setIsDeleting(true); // START LOADING

    try {
      await axios.delete(`/api/uniforms/${id}`);
      // Remove from local state
      setUniforms(prev => prev.filter(u => u._id !== id));
      // Close modal
      closeModal();
      showAlert("Uniform deleted successfully.", "Success");
    } catch (err) {
      console.error("Delete failed", err);
      showAlert("Failed to delete uniform. Please try again.", "Error");
    } finally {
      setIsDeleting(false); // END LOADING
    }
  };
  
  if (loading) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '80vh', 
      fontSize: '1.5rem', 
      color: '#666',
      fontWeight: '600'
    }}>
      Loading School Details...
    </div>
  );

  return (
    <div className="container">
      <div className="dashboard-header">
        <div className="header-content">
            {school && (
            <div className="school-identity">
                <h1>{school.name}</h1>
                {school.location && <p>📍 {school.location}</p>}
            </div>
            )}
            
            <div className="action-toolbar">
                <button className="btn-secondary" onClick={() => toggleCollage(true)}>
                    Collage View
                </button>
                <Link 
                  to="/uniform/new-uniform" 
                  className="btn-primary"
                  state={{ schoolName: school?.name }}
                >
                    + Add Uniform
                </Link>
            </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
            <label>Season</label>
            <select value={activeSeason || ''} onChange={(e) => updateFilters('season', e.target.value)}>
            <option value="">All Seasons</option>
            {uniqueOptions.seasons.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
        <div className="filter-group">
            <label>Class Group</label>
            <select value={activeClassStr || ''} onChange={(e) => updateFilters('class', e.target.value)}>
            <option value="">All Classes</option>
            {uniqueOptions.classes.map(c => <option key={c} value={c}>{formatRangeFromKey(c)}</option>)}
            </select>
        </div>
        <div className="filter-group">
            <label>Type</label>
            <select value={activeType || ''} onChange={(e) => updateFilters('type', e.target.value)}>
            <option value="">All Types</option>
            {uniqueOptions.types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
        
        {(activeSeason || activeClassStr || activeType || activeCategory) && (
            <button className="clear-filters-btn" onClick={() => setSearchParams({})}>
              Clear Filters
            </button>
        )}
      </div>

      {uniqueOptions.categories.length > 0 && (
          <div className="category-filter-row">
              <button 
                  className={`category-pill ${!activeCategory ? 'active' : ''}`}
                  onClick={() => updateFilters('category', '')}
              >
                  All Items
              </button>
              {uniqueOptions.categories.map(cat => (
                  <button 
                      key={cat}
                      className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                      onClick={() => updateFilters('category', cat)}
                  >
                      {cat}
                  </button>
              ))}
          </div>
      )}

      {/* ITEMS GRID */}
      <div className="shop-view">
         <div className="item-grid">
            {displayedItems.length > 0 ? (
              displayedItems.map(item => (
                <div key={item._id} className="card hover-effect" onClick={() => openUniformModal(item._id)}>
                  <img src={item.imageUrl || "https://placehold.co/150x150?text=No+Image"} alt={item.category} />
                  <div className="card-info">
                    <h3>{item.category}</h3>
                    <div className="card-badges">
                        <span className="badge-season">{item.season}</span>
                        <span className="badge-class">{getDisplayClass(item)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
                <div className="empty-state">No uniforms match your selection.</div>
            )}
         </div>
      </div>

      {/* --- DETAILS MODAL --- */}
      {selectedUniform && !showCollage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>×</button>
            <div className="modal-body">
              <div className="modal-image">
                <img src={selectedUniform.imageUrl || "https://placehold.co/300x300"} alt={selectedUniform.category} />
              </div>
              <div className="modal-info">
                <div className="modal-header-row">
                    <span className="school-badge">{school?.name}</span>
                    <div className="modal-actions">
                        <button 
                            className="edit-modal-btn" 
                            onClick={() => navigate(`/uniform/${selectedUniform._id}/edit`)}
                        >
                            Edit
                        </button>
                        {/* ADDED: Delete Button */}
                        <button 
                            className="delete-modal-btn"
                            onClick={() => handleDeleteUniform(selectedUniform._id)}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
                <h2>{selectedUniform.category}</h2>
                <p className="subtitle">{selectedUniform.type} • {getDisplayClass(selectedUniform)}</p>
                <p className="modal-desc">{selectedUniform.extraInfo}</p>
                <div className="pricing-selector-section">
                    <h4>Select Options</h4>
                    {allAvailableTags.length > 0 ? (
                        <div className="tags-container">
                            {allAvailableTags.map(tag => (
                                <button 
                                    key={tag} 
                                    className={`tag-chip ${selectedTags.includes(tag) ? 'selected' : ''}`}
                                    onClick={() => toggleTag(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted">No specific options available.</p>
                    )}
                    
                    <div className="pricing-display-area">
                        {pricingLoading ? (
                             <div className="loading-text">Loading pricing...</div>
                        ) : matchingPricing === "none" || !matchingPricing ? (
                             <div className="error-box">⚠️ No pricing structure found.</div>
                        ) : (
                            <div className="pricing-table">
                                {/* ACTIVE TAGS DISPLAY */}
                                {matchingPricing.tags && matchingPricing.tags.length > 0 && (
                                    <div className="active-variant-tags">
                                        {matchingPricing.tags.map(tag => (
                                            <span key={tag} className="variant-tag-display">{tag}</span>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="pricing-header">
                                    <span>Size</span>
                                    <span>Price</span>
                                </div>
                                {matchingPricing.priceData.map((p, idx) => (
                                    <div key={idx} className="price-row-large">
                                        <span>{p.size}</span>
                                        <span className="price-bold">₹{p.price}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- COLLAGE MODAL --- */}
      {showCollage && (
        <div className="modal-overlay" onClick={() => toggleCollage(false)}>
           <div className="modal-content collage-content" onClick={e => e.stopPropagation()}>
               <div className="collage-header">
                   <h2>Collection View ({displayedItems.length} Items)</h2>
                   <button className="close-btn-simple" onClick={() => toggleCollage(false)}>×</button>
               </div>
               <div className="collage-body">
                   {displayedItems.length > 0 ? (
                       <div className="collage-grid">
                           {displayedItems.map(item => (
                               <div key={item._id} className="collage-item">
                                   <img src={item.imageUrl || "https://placehold.co/150x150?text=No+Image"} alt={item.category} />
                                   <p>{item.category} ({getDisplayClass(item)})</p>
                               </div>
                           ))}
                       </div>
                   ) : (
                       <p className="empty-state">No items to display.</p>
                   )}
               </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default SchoolDashboard;