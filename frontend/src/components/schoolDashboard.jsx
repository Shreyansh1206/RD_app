import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/schoolDashboard.css';

const SchoolDashboard = () => {
  const { schoolId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [school, setSchool] = useState(null);
  const [uniforms, setUniforms] = useState([]);
  const [filter, setFilter] = useState('All'); 

  // 1. READ URL PARAMS
  const activeSeason = searchParams.get('season');
  const activeItemId = searchParams.get('item');
  const showCollage = searchParams.get('collage'); 

  // 2. FETCH DATA
  useEffect(() => {
    if(schoolId === "test") return;
    axios.get(`/api/schools/${schoolId}`)
      .then(res => setSchool(res.data));
    axios.get(`/api/uniforms/school/${schoolId}`)
      .then(res => setUniforms(res.data));
  }, [schoolId]);

  // 3. DERIVED STATE
  const monogramItem = uniforms.find(u => 
    u.category.toLowerCase().includes('monogram') || 
    u.category.toLowerCase().includes('logo')
  );
  const logoUrl = monogramItem ? monogramItem.imageUrl : "https://placehold.co/150x150?text=Logo";

  const seasonItems = uniforms.filter(item => {
    if (!activeSeason) return true;
    if (activeSeason === 'All') return true;
    return item.season === activeSeason || item.season === 'All';
  });

  const categories = ['All', ...new Set(seasonItems.map(item => item.category))];
  
  const displayedItems = filter === 'All' 
    ? seasonItems 
    : seasonItems.filter(item => item.category === filter);

  const selectedItem = activeItemId ? uniforms.find(u => u._id === activeItemId) : null;

  // --- HANDLERS ---
  const handleSeasonSelect = (season) => {
    setSearchParams({ season });
    setFilter('All');
  };

  const openItemModal = (itemId) => {
    setSearchParams({ season: activeSeason, item: itemId });
  };

  const openCollage = () => {
    setSearchParams({ season: activeSeason, collage: 'true' });
  };

  const closeOverlay = () => {
    setSearchParams({ season: activeSeason });
  };

  // --- NEW: DELETE HANDLER ---
  const handleDeleteUniform = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this uniform?")) return;

    try {
      await axios.delete(`/api/uniforms/${id}`);
      // Remove from local state so UI updates immediately
      setUniforms(prev => prev.filter(u => u._id !== id));
      closeOverlay(); // Close the modal
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete uniform. Please try again.");
    }
  };

  return (
    <div className="container">
      <Link to="/" className="back-link">← Change School</Link>

      {/* VIEW 1: LANDING SCREEN */}
      {!activeSeason && school && (
        <div className="school-landing">
          <div className="logo-container">
            <img src={logoUrl} alt="School Logo" className="school-logo" />
          </div>
          <h1>{school.name}</h1>
          <p className="location-text">📍 {school.location}</p>

          <div className="season-selection">
            <button className="season-btn summer" onClick={() => handleSeasonSelect('Summer')}>☀️ SUMMER</button>
            <button className="season-btn winter" onClick={() => handleSeasonSelect('Winter')}>❄️ WINTER</button>
            <button className="season-btn all" onClick={() => handleSeasonSelect('All')}>🛍️ BROWSE ALL</button>
          </div>
        </div>
      )}

      {/* VIEW 2: SHOPPING GRID */}
      {activeSeason && (
        <div className="shop-view">
          <div className="shop-header">
            <h2>{activeSeason} Collection</h2>
            
            <div style={{display: 'flex', gap: '10px'}}>
              <button onClick={openCollage} className="action-btn">
                 View Collage
              </button>
              <button onClick={() => setSearchParams({})} className="back-btn">
                Back to Selection
              </button>
            </div>
          </div>

          <div className="category-tabs">
            {categories.map(cat => (
              <button 
                key={cat} 
                className={`tab ${filter === cat ? 'active' : ''}`}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="item-grid">
            {displayedItems.map(item => (
              <div key={item._id} className="card hover-effect" onClick={() => openItemModal(item._id)}>
                <img src={item.imageUrl || "https://placehold.co/150x150?text=No+Image"} alt={item.category} />
                <h3>{item.category}</h3>
                <p style={{color: '#666', fontSize: '0.9rem'}}>View Details</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------- */}
      {/* MODAL 1: SINGLE ITEM DETAILS                */}
      {/* ------------------------------------------- */}
      {selectedItem && (
        <div className="modal-overlay" onClick={closeOverlay}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            
            <button className="close-btn" onClick={closeOverlay}>×</button>
            
            <div className="modal-body">
              <div className="modal-image">
                <img src={selectedItem.imageUrl || "https://placehold.co/300x300"} alt={selectedItem.category} />
              </div>
              
              <div className="modal-info">
                {/* --- NEW: Header with Actions --- */}
                <div className="modal-header-row">
                    <span className="school-badge">{school?.name}</span>
                    <div className="modal-actions">
                        <button 
                            className="edit-modal-btn" 
                            onClick={() => navigate(`/uniform/${selectedItem._id}/edit`)}
                        >
                            Edit
                        </button>
                        <button 
                            className="delete-modal-btn" 
                            onClick={() => handleDeleteUniform(selectedItem._id)}
                        >
                            Delete
                        </button>
                    </div>
                </div>
                {/* -------------------------------- */}

                <h2>{selectedItem.category}</h2>
                
                <div className="tags">
                   <span className="tag-season">{selectedItem.season}</span>
                   {selectedItem.tags.map(t => <span key={t} className="tag-grey">{t}</span>)}
                </div>

                <p className="modal-desc">{selectedItem.extraInfo || "Standard school uniform quality."}</p>

                <div className="modal-pricing">
                  <h4>Pricing</h4>
                  {selectedItem.pricing.map((p, idx) => (
                    <div key={idx} className="price-row-large">
                      <span>Size {p.size}</span>
                      <span className="price-bold">₹{p.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------- */}
      {/* MODAL 2: COLLAGE VIEW                       */}
      {/* ------------------------------------------- */}
      {showCollage && (
        <div className="modal-overlay" onClick={closeOverlay}>
          <div className="modal-content collage-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={closeOverlay}>×</button>
            
            <h2 style={{textAlign: 'center', marginBottom: '20px'}}>
              {activeSeason} Collection Board
            </h2>

            <div className="collage-grid">
              {seasonItems.map(item => (
                <div key={item._id} className="collage-item">
                  <img src={item.imageUrl || "https://placehold.co/150x150"} alt={item.category} />
                  <span className="collage-label">{item.category}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SchoolDashboard;