import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAlert } from '../context/alertContext';
import './styles/basePricingList.css';

const BasePricingList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { showAlert, showConfirm } = useAlert();
  
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Delete Dropdown State
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteMenuRef = useRef(null);

  // --- 1. FETCH TEMPLATES ---
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get('/api/basePricing'); 
        setTemplates(res.data);
      } catch (err) {
        console.error("Failed to load templates", err);
        setError("Failed to load pricing templates.");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // --- 2. DERIVED STATE ---
  const activeTemplateId = searchParams.get('basePricingId');
  
  const selectedTemplate = useMemo(() => 
    templates.find(t => t._id === activeTemplateId), 
  [templates, activeTemplateId]);

  // Grouping & Filtering Logic
  const groupedTemplates = useMemo(() => {
    const groups = {};
    const filteredTemplates = templates.filter(t => 
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredTemplates.forEach(tpl => {
      const cat = tpl.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(tpl);
    });

    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {});
  }, [templates, searchTerm]);

  // --- 3. CLICK OUTSIDE TO CLOSE MENU ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (deleteMenuRef.current && !deleteMenuRef.current.contains(event.target)) {
        setShowDeleteMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 4. HANDLERS ---
  const openDetails = (id) => {
    setSearchParams({ basePricingId: id });
    setShowDeleteMenu(false);
  };

  const closeDetails = () => {
    setSearchParams({});
    setShowDeleteMenu(false); 
  };

  const handleEdit = (id) => {
    navigate(`/basePricing/${id}/edit`);
  };

  const performDelete = async (type) => {
    if (!selectedTemplate) return;
    
    const message = type === 'detach' 
        ? "Confirm: Delete template only?" 
        : "WARNING: This will delete the template AND all linked pricing structures. Confirm?";
        
    const isConfirmed = await showConfirm(message, "Confirm Delete");
    if (!isConfirmed) return;

    setDeleting(true);
    const endpointSuffix = type === 'detach' ? 'detached' : 'cascade';

    try {
      await axios.delete(`/api/basePricing/${selectedTemplate._id}/${endpointSuffix}`);
      
      setTemplates(prev => prev.filter(t => t._id !== selectedTemplate._id));
      closeDetails(); 
      showAlert("Template deleted successfully.", "Success");
    } catch (err) {
      console.error(err);
      showAlert("Failed to delete template. Please try again.", "Error");
    } finally {
      setDeleting(false);
      setShowDeleteMenu(false);
    }
  };

  if (loading) return <div className="bpl-loading">Loading Templates...</div>;

  return (
    <div className="bpl-page-wrapper">
      <div className="bpl-header">
        <div className="header-titles">
            <h1>Base Pricing Templates</h1>
            <p className="subtitle">Manage your reusable pricing structures.</p>
        </div>
        
        <div className="bpl-header-actions">
            <input 
                type="text" 
                className="bpl-search-input"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Link to="/basePricing/new-basePricing" className="btn-add-template">
                + New Template
            </Link>
        </div>
      </div>

      {error && <div className="bpl-error-banner">⚠️ {error}</div>}

      {/* --- LIST AREA --- */}
      <div className="bpl-content-area">
        {Object.keys(groupedTemplates).length > 0 ? (
          Object.entries(groupedTemplates).map(([category, items]) => (
            <div key={category} className="bpl-category-section">
              <h2 className="bpl-category-title">{category}</h2>
              <div className="bpl-category-grid">
                {items.map((tpl) => (
                  <div key={tpl._id} className="bpl-card">
                    <div className="bpl-card-top">
                        <div className="bpl-tags-list">
                            {tpl.tags && tpl.tags.length > 0 ? (
                                tpl.tags.map((tag, idx) => (
                                    <span key={idx} className="bpl-tag">{tag}</span>
                                ))
                            ) : (
                                <span className="no-tags">No tags</span>
                            )}
                        </div>
                        <div className="bpl-price-summary">
                            Starts at ₹{tpl.basePriceData?.[0]?.price || 0}
                        </div>
                    </div>
                    <button 
                        className="btn-view-details" 
                        onClick={() => openDetails(tpl._id)}
                    >
                        View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state-row">
             <p>{searchTerm ? 'No categories found matching your search.' : 'No pricing templates found.'}</p>
             {!searchTerm && <Link to="/basePricing/new-basePricing" className="link-create">Create your first template</Link>}
          </div>
        )}
      </div>

      {/* --- DETAILS MODAL POPUP --- */}
      {selectedTemplate && (
        <div className="bpl-modal-overlay" onClick={closeDetails}>
            <div className="bpl-modal-content" onClick={e => e.stopPropagation()}>
                <button className="bpl-close-btn" onClick={closeDetails}>×</button>
                
                <div className="bpl-modal-header">
                    <div className="bpl-modal-title-row">
                        <span className="category-badge-large">{selectedTemplate.category}</span>
                        <div className="bpl-modal-actions">
                            <button className="modal-action-btn edit" onClick={() => handleEdit(selectedTemplate._id)}>
                                ✎ Edit
                            </button>
                            
                            {/* --- DELETE DROPDOWN WRAPPER --- */}
                            <div className="delete-dropdown-wrapper" ref={deleteMenuRef}>
                                <button 
                                    className={`modal-action-btn delete ${showDeleteMenu ? 'active' : ''}`} 
                                    onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                                    disabled={deleting}
                                >
                                    🗑 Delete {showDeleteMenu ? '▴' : '▾'}
                                </button>

                                {showDeleteMenu && (
                                    <div className="delete-popup-menu">
                                        
                                        {/* Option 1: Detached Delete */}
                                        <div className="delete-menu-item" onClick={() => performDelete('detach')}>
                                            <span className="menu-label">Detached Delete</span>
                                            {/* Tooltip on Hover */}
                                            <div className="delete-info-tooltip">
                                                <strong>Safe Delete:</strong> Removes this template only. Linked uniforms are kept as "Custom" (detached).
                                            </div>
                                        </div>

                                        {/* Option 2: Cascade Delete */}
                                        <div className="delete-menu-item danger" onClick={() => performDelete('cascade')}>
                                            <span className="menu-label">Cascade Delete</span>
                                            {/* Tooltip on Hover */}
                                            <div className="delete-info-tooltip">
                                                <strong>Full Wipe:</strong> Removes this template AND deletes every single uniform pricing structure linked to it.
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>
                            {/* --- END DELETE WRAPPER --- */}

                        </div>
                    </div>
                    
                    <div className="bpl-modal-tags">
                        {selectedTemplate.tags.map(t => <span key={t} className="bpl-tag large">{t}</span>)}
                    </div>
                </div>

                <div className="bpl-modal-body">
                    <h4>Pricing Structure</h4>
                    <div className="bpl-pricing-table">
                        <div className="bpl-pt-head">
                            <span>Size</span>
                            <span>Price</span>
                        </div>
                        <div className="bpl-pt-body">
                            {selectedTemplate.basePriceData.map((row, idx) => (
                                <div key={idx} className="bpl-pt-row">
                                    <span className="pt-size">{row.size}</span>
                                    <span className="pt-price">₹{row.price}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default BasePricingList;