import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function LocationManager() {
    const [locations, setLocations] = useState([]);
    const [showFormCanvas, setShowFormCanvas] = useState(false);
    const [showViewCanvas, setShowViewCanvas] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    
    // Form state
    const [primaryLocation, setPrimaryLocation] = useState('');
    const [primarySubLocation, setPrimarySubLocation] = useState('');
    const [secondaryLocations, setSecondaryLocations] = useState([
        { SecondaryLocation: '', SecondarySubLocation: '', ThirdLocations: [{ ThirdLocation: '', ThirdSubLocation: '' }] }
    ]);
    

    // Suggestions state
    const [suggestions, setSuggestions] = useState({
        primary: [],
        secondary: {},
        third: {}
    });
    const [showSuggestions, setShowSuggestions] = useState({
        primary: false,
        secondary: {},
        third: {}
    });

    const [sublocationSuggestions, setSublocationSuggestions] = useState({
        primary: [],
        secondary: {},
        third: {}
    });
    const [showSublocationSuggestions, setShowSublocationSuggestions] = useState({
        primary: false,
        secondary: {},
        third: {}
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('access_token');
            const { data } = await axios.get('https://codeaves.avessecurity.com/api/Location/getLocations', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setLocations(Array.isArray(data?.Location) ? data.Location : []);
        } catch (err) {
            console.error('Error fetching locations:', err);
            alert('Failed to load locations');
            setLocations([]);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setPrimaryLocation('');
        setPrimarySubLocation('');
        setSecondaryLocations([{ SecondaryLocation: '', SecondarySubLocation: '', ThirdLocations: [{ ThirdLocation: '', ThirdSubLocation: '' }] }]);
        setEditId(null);
        setIsEditing(false);
    };
const openFormCanvas = (location = null) => {
  if (location) {
    setPrimaryLocation(location.PrimaryLocation || '');
    
    // Handle PrimarySubLocation - take the first one if exists
    const firstSubLoc = Array.isArray(location.SubLocation) && location.SubLocation.length > 0 
      ? location.SubLocation[0] 
      : {};
    setPrimarySubLocation(firstSubLoc.PrimarySubLocation || '');
    
    // Transform data for editing (nested structure to flat structure)
    const transformedSecondary = [];
    
    // Process each SubLocation
    if (Array.isArray(location.SubLocation)) {
      location.SubLocation.forEach(subLoc => {
        // Process each SecondaryLocation within SubLocation
        if (Array.isArray(subLoc.SecondaryLocation)) {
          subLoc.SecondaryLocation.forEach(sec => {
            // Process each SecondarySubLocation within SecondaryLocation
            if (Array.isArray(sec.SecondarySubLocation)) {
              sec.SecondarySubLocation.forEach(subSec => {
                // Create a form entry for each SecondarySubLocation
                const entry = {
                  SecondaryLocation: sec.SecondaryLocation || '',
                  SecondarySubLocation: subSec.SecondarySubLocation || '',
                  ThirdLocations: []
                };
                
                // Add ThirdLocations if they exist
                if (Array.isArray(subSec.ThirdLocation)) {
                  entry.ThirdLocations = subSec.ThirdLocation.map(third => ({
                    ThirdLocation: third.ThirdLocation || '',
                    ThirdSubLocation: third.ThirdSubLocation || ''
                  }));
                } else {
                  entry.ThirdLocations = [{ ThirdLocation: '', ThirdSubLocation: '' }];
                }
                
                transformedSecondary.push(entry);
              });
            } else {
              // If no SecondarySubLocation, create an empty entry
              transformedSecondary.push({
                SecondaryLocation: sec.SecondaryLocation || '',
                SecondarySubLocation: '',
                ThirdLocations: [{ ThirdLocation: '', ThirdSubLocation: '' }]
              });
            }
          });
        }
      });
    }
    
    // Set the transformed secondary locations
    setSecondaryLocations(transformedSecondary.length > 0 
      ? transformedSecondary 
      : [{ SecondaryLocation: '', SecondarySubLocation: '', ThirdLocations: [{ ThirdLocation: '', ThirdSubLocation: '' }] }]
    );
    
    setEditId(location._id);
    setIsEditing(true);
  } else {
    resetForm();
  }
  setShowFormCanvas(true);
};

    const openViewCanvas = (location) => {
        setSelectedLocation(location);
        setShowViewCanvas(true);
    };

    const closeViewCanvas = () => {
        setShowViewCanvas(false);
        setSelectedLocation(null);
    };

    const handleDelete = async (locationId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this location?");
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`https://codeaves.avessecurity.com/api/Location/deleteLocation/${locationId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Location deleted successfully");
            fetchLocations();
        } catch (error) {
            console.error("Error deleting location:", error);
            alert("Error deleting location");
        }
    };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!primaryLocation) {
    alert('Primary Location is required');
    return;
  }

  try {
    setIsLoading(true);
    const token = localStorage.getItem('access_token');
    
    // Prepare payload based on whether we're creating or editing
    let payload;
    let url;
    
    if (isEditing) {
      // Payload for editing (nested structure)
      payload = {
        PrimaryLocation: primaryLocation.trim(),
        SubLocation: [{
          PrimarySubLocation: primarySubLocation.trim(),
          SecondaryLocation: secondaryLocations.map(sec => ({
            SecondaryLocation: sec.SecondaryLocation.trim(),
            SecondarySubLocation: [{
              SecondarySubLocation: sec.SecondarySubLocation.trim(),
              ThirdLocation: sec.ThirdLocations.map(third => ({
                ThirdLocation: third.ThirdLocation.trim(),
                ThirdSubLocation: third.ThirdSubLocation.trim()
              }))
            }]
          }))
        }]
      };
      
      url = `https://codeaves.avessecurity.com/api/Location/updateLocation/${editId}`;
    } else {
      // Payload for creating (flat structure)
      payload = {
        PrimaryLocation: primaryLocation.trim(),
        PrimarySubLocation: primarySubLocation.trim(),
        SecondaryLocations: secondaryLocations.map(sec => ({
          SecondaryLocation: sec.SecondaryLocation.trim(),
          SecondarySubLocation: sec.SecondarySubLocation.trim(),
          ThirdLocations: sec.ThirdLocations.filter(third => 
            third.ThirdLocation.trim() || third.ThirdSubLocation.trim()
          ).map(third => ({
            ThirdLocation: third.ThirdLocation.trim(),
            ThirdSubLocation: third.ThirdSubLocation.trim()
          }))
        })).filter(sec => 
          sec.SecondaryLocation || 
          sec.SecondarySubLocation ||
          (sec.ThirdLocations && sec.ThirdLocations.length > 0)
        )
      };
      
      // Remove empty SecondaryLocations array if no valid entries
      if (payload.SecondaryLocations.length === 0) {
        delete payload.SecondaryLocations;
      }
      
      url = 'https://codeaves.avessecurity.com/api/Location/createLocation';
    }
    
    console.log('Sending payload:', JSON.stringify(payload, null, 2)); // For debugging
    
    const method = isEditing ? 'put' : 'post';
    const response = await axios[method](url, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    alert(`Location ${isEditing ? 'updated' : 'created'} successfully`);
    setShowFormCanvas(false);
    fetchLocations();
    resetForm();
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
    alert(`Error ${isEditing ? 'updating' : 'creating'} location: ${err.response?.data?.message || err.message}`);
  } finally {
    setIsLoading(false);
  }
};
    const handlePrimaryLocationChange = (value) => {
        setPrimaryLocation(value);
        const newSuggestions = generateSuggestions('primary', value);
        setSuggestions(prev => ({ ...prev, primary: newSuggestions }));
        setShowSuggestions(prev => ({ ...prev, primary: value.length > 0 }));
    };

    const handlePrimaryLocationSelect = (selectedPrimaryLoc) => {
        setPrimaryLocation(selectedPrimaryLoc);
        setShowSuggestions(prev => ({ ...prev, primary: false }));
    };

    const handlePrimarySublocationChange = (value) => {
        setPrimarySubLocation(value);
        const newSuggestions = generateSublocationSuggestions('primary', value, { 
            primary: primaryLocation 
        });
        setSublocationSuggestions(prev => ({ ...prev, primary: newSuggestions }));
        setShowSublocationSuggestions(prev => ({ ...prev, primary: value.length > 0 }));
    };

    const handlePrimarySublocationSelect = (selectedSubloc) => {
        setPrimarySubLocation(selectedSubloc);
        setShowSublocationSuggestions(prev => ({ ...prev, primary: false }));
    };

    const handleSecondaryLocationChange = (secIndex, value) => {
        const updated = [...secondaryLocations];
        updated[secIndex].SecondaryLocation = value;
        setSecondaryLocations(updated);
        
        const newSuggestions = generateSuggestions('secondary', value, { 
            primary: primaryLocation,
            primarySub: primarySubLocation
        });
        
        setSuggestions(prev => ({
            ...prev,
            secondary: {
                ...prev.secondary,
                [secIndex]: newSuggestions
            }
        }));
        
        setShowSuggestions(prev => ({
            ...prev,
            secondary: {
                ...prev.secondary,
                [secIndex]: value.length > 0
            }
        }));
    };

    const handleSecondaryLocationSelect = (selectedSecondaryLoc, secIndex) => {
        const updated = [...secondaryLocations];
        updated[secIndex].SecondaryLocation = selectedSecondaryLoc;
        setSecondaryLocations(updated);
        setShowSuggestions(prev => ({
            ...prev,
            secondary: { ...prev.secondary, [secIndex]: false }
        }));
    };

    const handleSecondarySublocationChange = (secIndex, value) => {
        const updated = [...secondaryLocations];
        updated[secIndex].SecondarySubLocation = value;
        setSecondaryLocations(updated);
        
        const newSuggestions = generateSublocationSuggestions('secondary', value, { 
            primary: primaryLocation,
            primarySub: primarySubLocation,
            secondary: updated[secIndex].SecondaryLocation
        });
        
        setSublocationSuggestions(prev => ({
            ...prev,
            secondary: {
                ...prev.secondary,
                [secIndex]: newSuggestions
            }
        }));
        
        setShowSublocationSuggestions(prev => ({
            ...prev,
            secondary: {
                ...prev.secondary,
                [secIndex]: value.length > 0
            }
        }));
    };

    const handleSecondarySublocationSelect = (selectedSubloc, secIndex) => {
        const updated = [...secondaryLocations];
        updated[secIndex].SecondarySubLocation = selectedSubloc;
        setSecondaryLocations(updated);
        setShowSublocationSuggestions(prev => ({
            ...prev,
            secondary: { ...prev.secondary, [secIndex]: false }
        }));
    };

    const handleThirdLocationChange = (secIndex, thirdIndex, value) => {
        const updated = [...secondaryLocations];
        updated[secIndex].ThirdLocations[thirdIndex].ThirdLocation = value;
        setSecondaryLocations(updated);
        
        const newSuggestions = generateSuggestions('third', value, { 
            primary: primaryLocation,
            primarySub: primarySubLocation,
            secondary: updated[secIndex].SecondaryLocation
        });
        
        setSuggestions(prev => ({
            ...prev,
            third: {
                ...prev.third,
                [secIndex]: {
                    ...(prev.third[secIndex] || {}),
                    [thirdIndex]: newSuggestions
                }
            }
        }));
        
        setShowSuggestions(prev => ({
            ...prev,
            third: {
                ...prev.third,
                [secIndex]: {
                    ...(prev.third[secIndex] || {}),
                    [thirdIndex]: value.length > 0
                }
            }
        }));
    };

    const handleThirdLocationSelect = (selectedThirdLoc, secIndex, thirdIndex) => {
        const updated = [...secondaryLocations];
        updated[secIndex].ThirdLocations[thirdIndex].ThirdLocation = selectedThirdLoc;
        setSecondaryLocations(updated);
        setShowSuggestions(prev => ({
            ...prev,
            third: {
                ...prev.third,
                [secIndex]: { ...(prev.third[secIndex] || {}), [thirdIndex]: false }
            }
        }));
    };

    const handleThirdSublocationChange = (secIndex, thirdIndex, value) => {
        const updated = [...secondaryLocations];
        updated[secIndex].ThirdLocations[thirdIndex].ThirdSubLocation = value;
        setSecondaryLocations(updated);
        
        const newSuggestions = generateSublocationSuggestions('third', value, { 
            primary: primaryLocation,
            primarySub: primarySubLocation,
            secondary: updated[secIndex].SecondaryLocation,
            third: updated[secIndex].ThirdLocations[thirdIndex].ThirdLocation
        });
        
        setSublocationSuggestions(prev => ({
            ...prev,
            third: {
                ...prev.third,
                [secIndex]: {
                    ...(prev.third[secIndex] || {}),
                    [thirdIndex]: newSuggestions
                }
            }
        }));
        
        setShowSublocationSuggestions(prev => ({
            ...prev,
            third: {
                ...prev.third,
                [secIndex]: {
                    ...(prev.third[secIndex] || {}),
                    [thirdIndex]: value.length > 0
                }
            }
        }));
    };

    const handleThirdSublocationSelect = (selectedSubloc, secIndex, thirdIndex) => {
        const updated = [...secondaryLocations];
        updated[secIndex].ThirdLocations[thirdIndex].ThirdSubLocation = selectedSubloc;
        setSecondaryLocations(updated);
        setShowSublocationSuggestions(prev => ({
            ...prev,
            third: {
                ...prev.third,
                [secIndex]: { ...(prev.third[secIndex] || {}), [thirdIndex]: false }
            }
        }));
    };

    // Add/remove location handlers
    const addSecondary = () => {
        setSecondaryLocations([
            ...secondaryLocations,
            { SecondaryLocation: '', SecondarySubLocation: '', ThirdLocations: [{ ThirdLocation: '', ThirdSubLocation: '' }] }
        ]);
    };

    const addThird = (secondaryIndex) => {
        const updated = [...secondaryLocations];
        updated[secondaryIndex].ThirdLocations.push({ 
            ThirdLocation: '', 
            ThirdSubLocation: '' 
        });
        setSecondaryLocations(updated);
    };

    const removeSecondary = (index) => {
        const updated = [...secondaryLocations];
        updated.splice(index, 1);
        setSecondaryLocations(updated.length === 0 
            ? [{ SecondaryLocation: '', SecondarySubLocation: '', ThirdLocations: [{ ThirdLocation: '', ThirdSubLocation: '' }] }] 
            : updated
        );
    };

    const removeThird = (secondaryIndex, thirdIndex) => {
        const updated = [...secondaryLocations];
        updated[secondaryIndex].ThirdLocations.splice(thirdIndex, 1);
        setSecondaryLocations(updated);
    };

    // Suggestion generation functions
    const generateSuggestions = (type, value, parentLocations = {}) => {
        if (!value || !Array.isArray(locations)) return [];
        
        const allSuggestions = new Set();
        
        locations.forEach(location => {
            // Primary suggestions
            if (type === 'primary') {
                if (location.PrimaryLocation?.toLowerCase().includes(value.toLowerCase())) {
                    allSuggestions.add(location.PrimaryLocation);
                }
                return;
            }
            
            // Only proceed if Primary matches
            if (location.PrimaryLocation?.toLowerCase() !== parentLocations.primary?.toLowerCase()) {
                return;
            }
            
            // Secondary suggestions
            if (type === 'secondary') {
                if (Array.isArray(location.SubLocation)) {
                    location.SubLocation.forEach(subLoc => {
                        if (subLoc.PrimarySubLocation?.toLowerCase() === parentLocations.primarySub?.toLowerCase()) {
                            if (Array.isArray(subLoc.SecondaryLocation)) {
                                subLoc.SecondaryLocation.forEach(sec => {
                                    if (sec.SecondaryLocation?.toLowerCase().includes(value.toLowerCase())) {
                                        allSuggestions.add(sec.SecondaryLocation);
                                    }
                                });
                            }
                        }
                    });
                }
                return;
            }
            
            // Third suggestions
            if (type === 'third') {
                if (Array.isArray(location.SubLocation)) {
                    location.SubLocation.forEach(subLoc => {
                        if (subLoc.PrimarySubLocation?.toLowerCase() === parentLocations.primarySub?.toLowerCase()) {
                            if (Array.isArray(subLoc.SecondaryLocation)) {
                                subLoc.SecondaryLocation.forEach(sec => {
                                    if (sec.SecondaryLocation?.toLowerCase() === parentLocations.secondary?.toLowerCase()) {
                                        if (Array.isArray(sec.ThirdLocation)) {
                                            sec.ThirdLocation.forEach(third => {
                                                if (third.ThirdLocation?.toLowerCase().includes(value.toLowerCase())) {
                                                    allSuggestions.add(third.ThirdLocation);
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
        
        return Array.from(allSuggestions);
    };

    const generateSublocationSuggestions = (type, value, parentLocations = {}) => {
        if (!value || !Array.isArray(locations)) return [];
        
        const allSuggestions = new Set();
        
        locations.forEach(location => {
            // Primary sublocation suggestions
            if (type === 'primary') {
                if (location.PrimaryLocation?.toLowerCase() === parentLocations.primary?.toLowerCase()) {
                    if (Array.isArray(location.SubLocation)) {
                        location.SubLocation.forEach(subLoc => {
                            if (subLoc.PrimarySubLocation?.toLowerCase().includes(value.toLowerCase())) {
                                allSuggestions.add(subLoc.PrimarySubLocation);
                            }
                        });
                    }
                }
                return;
            }
            
            // Secondary sublocation suggestions
            if (type === 'secondary') {
                if (Array.isArray(location.SubLocation)) {
                    location.SubLocation.forEach(subLoc => {
                        if (subLoc.PrimarySubLocation?.toLowerCase() === parentLocations.primarySub?.toLowerCase()) {
                            if (Array.isArray(subLoc.SecondaryLocation)) {
                                subLoc.SecondaryLocation.forEach(sec => {
                                    if (sec.SecondaryLocation?.toLowerCase() === parentLocations.secondary?.toLowerCase()) {
                                        if (Array.isArray(sec.SecondarySubLocation)) {
                                            sec.SecondarySubLocation.forEach(sub => {
                                                if (sub.SecondarySubLocation?.toLowerCase().includes(value.toLowerCase())) {
                                                    allSuggestions.add(sub.SecondarySubLocation);
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
                return;
            }
            
            // Third sublocation suggestions
            if (type === 'third') {
                if (Array.isArray(location.SubLocation)) {
                    location.SubLocation.forEach(subLoc => {
                        if (subLoc.PrimarySubLocation?.toLowerCase() === parentLocations.primarySub?.toLowerCase()) {
                            if (Array.isArray(subLoc.SecondaryLocation)) {
                                subLoc.SecondaryLocation.forEach(sec => {
                                    if (sec.SecondaryLocation?.toLowerCase() === parentLocations.secondary?.toLowerCase()) {
                                        if (Array.isArray(sec.ThirdLocation)) {
                                            sec.ThirdLocation.forEach(third => {
                                                if (third.ThirdLocation?.toLowerCase() === parentLocations.third?.toLowerCase()) {
                                                    if (third.ThirdSubLocation?.toLowerCase().includes(value.toLowerCase())) {
                                                        allSuggestions.add(third.ThirdSubLocation);
                                                    }
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
        
        return Array.from(allSuggestions);
    };



    // ... (keep all the suggestion generation and handling functions the same)

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Locations</h4>
                <button className="btn btn-primary" onClick={() => openFormCanvas()}>
                    Add Location
                </button>
            </div>

            {isLoading ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <div className="table-responsive" style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'
                }}>
                    <table className="table custom-table mb-0">
                        <thead>
                            <tr>
                                <th>Primary Location</th>
                                <th>Sub Location</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(locations) && locations.map(loc => (
                                <tr key={loc._id}>
                                    <td>{loc.PrimaryLocation}</td>
                                    <td>
                                        {Array.isArray(loc.SubLocation) && loc.SubLocation.map((subLoc, i) => (
                                            <div key={i}>{subLoc.PrimarySubLocation}</div>
                                        ))}
                                    </td>
                                    <td>
                                        <div className="d-flex">
                                            <button
                                                className="btn btn-sm btn-outline-primary me-2"
                                                onClick={() => openViewCanvas(loc)}
                                            >
                                                <i className="bi bi-eye"></i> View
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-warning me-2"
                                                onClick={() => openFormCanvas(loc)}
                                            >
                                                <i className="bi bi-pencil"></i> Edit
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDelete(loc._id)}
                                            >
                                                <i className="bi bi-trash"></i> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Location Off-Canvas */}
            <div className={`offcanvas offcanvas-end ${showFormCanvas ? 'show' : ''}`} 
                 style={{ visibility: showFormCanvas ? 'visible' : 'hidden', width: '600px' }}>
                <div className="offcanvas-header text-black">
                    <h5 className="offcanvas-title">{isEditing ? 'Edit Location' : 'Add New Location'}</h5>
                    <button type="button" className="btn-close" 
                            onClick={() => {
                                setShowFormCanvas(false);
                                resetForm();
                            }}></button>
                </div>
                <div className="offcanvas-body">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Primary Location*</label>
                            <div className="position-relative">
                                <input 
                                    className="form-control" 
                                    value={primaryLocation} 
                                    onChange={(e) => handlePrimaryLocationChange(e.target.value)} 
                                    required 
                                />
                                {showSuggestions.primary && Array.isArray(suggestions.primary) && suggestions.primary.length > 0 && (
                                    <div className="list-group position-absolute w-100 z-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {suggestions.primary.map((suggestion, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                className="list-group-item list-group-item-action"
                                                onClick={() => handlePrimaryLocationSelect(suggestion)}
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Primary SubLocation</label>
                            <div className="position-relative">
                                <input 
                                    className="form-control" 
                                    value={primarySubLocation} 
                                    onChange={(e) => handlePrimarySublocationChange(e.target.value)} 
                                />
                                {showSublocationSuggestions.primary && Array.isArray(sublocationSuggestions.primary) && sublocationSuggestions.primary.length > 0 && (
                                    <div className="list-group position-absolute w-100 z-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {sublocationSuggestions.primary.map((suggestion, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                className="list-group-item list-group-item-action"
                                                onClick={() => handlePrimarySublocationSelect(suggestion)}
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-4">
                            <h6>Secondary Locations</h6>
                            {Array.isArray(secondaryLocations) && secondaryLocations.map((sec, secIndex) => (
                                <div key={secIndex} className="border p-3 mb-3 rounded position-relative bg-light">
                                    {secondaryLocations.length > 1 && (
                                        <button type="button" 
                                                className="btn-close position-absolute top-0 end-0 m-2" 
                                                onClick={() => removeSecondary(secIndex)} />
                                    )}
                                    <div className="mb-3">
                                        <label className="form-label">Secondary Location</label>
                                        <div className="position-relative">
                                            <input
                                                className="form-control"
                                                value={sec.SecondaryLocation}
                                                onChange={(e) => handleSecondaryLocationChange(secIndex, e.target.value)}
                                            />
                                            {showSuggestions.secondary[secIndex] && Array.isArray(suggestions.secondary[secIndex]) && suggestions.secondary[secIndex].length > 0 && (
                                                <div className="list-group position-absolute w-100 z-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    {suggestions.secondary[secIndex].map((suggestion, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            className="list-group-item list-group-item-action"
                                                            onClick={() => handleSecondaryLocationSelect(suggestion, secIndex)}
                                                        >
                                                            {suggestion}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Secondary SubLocation</label>
                                        <div className="position-relative">
                                            <input
                                                className="form-control"
                                                value={sec.SecondarySubLocation}
                                                onChange={(e) => handleSecondarySublocationChange(secIndex, e.target.value)}
                                            />
                                            {showSublocationSuggestions.secondary[secIndex] && 
                                             Array.isArray(sublocationSuggestions.secondary[secIndex]) && 
                                             sublocationSuggestions.secondary[secIndex].length > 0 && (
                                                <div className="list-group position-absolute w-100 z-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    {sublocationSuggestions.secondary[secIndex].map((suggestion, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            className="list-group-item list-group-item-action"
                                                            onClick={() => handleSecondarySublocationSelect(suggestion, secIndex)}
                                                        >
                                                            {suggestion}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <h6>Third Locations</h6>
                                        {Array.isArray(sec.ThirdLocations) && sec.ThirdLocations.map((third, thirdIndex) => (
                                            <div key={thirdIndex} className="border p-2 mb-2 rounded position-relative ms-3 bg-white">
                                                {sec.ThirdLocations.length > 1 && (
                                                    <button type="button" 
                                                            className="btn-close position-absolute top-0 end-0 m-1" 
                                                            onClick={() => removeThird(secIndex, thirdIndex)} />
                                                )}
                                                <div className="mb-2">
                                                    <label className="form-label">Third Location</label>
                                                    <div className="position-relative">
                                                        <input
                                                            className="form-control"
                                                            value={third.ThirdLocation}
                                                            onChange={(e) => handleThirdLocationChange(secIndex, thirdIndex, e.target.value)}
                                                        />
                                                        {showSuggestions.third[secIndex]?.[thirdIndex] && 
                                                         Array.isArray(suggestions.third[secIndex]?.[thirdIndex]) && 
                                                         suggestions.third[secIndex][thirdIndex].length > 0 && (
                                                            <div className="list-group position-absolute w-100 z-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                                {suggestions.third[secIndex][thirdIndex].map((suggestion, idx) => (
                                                                    <button
                                                                        key={idx}
                                                                        type="button"
                                                                        className="list-group-item list-group-item-action"
                                                                        onClick={() => handleThirdLocationSelect(suggestion, secIndex, thirdIndex)}
                                                                    >
                                                                        {suggestion}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mb-2">
                                                    <label className="form-label">Third SubLocation</label>
                                                    <div className="position-relative">
                                                        <input
                                                            className="form-control"
                                                            value={third.ThirdSubLocation}
                                                            onChange={(e) => handleThirdSublocationChange(secIndex, thirdIndex, e.target.value)}
                                                        />
                                                        {showSublocationSuggestions.third[secIndex]?.[thirdIndex] && 
                                                         Array.isArray(sublocationSuggestions.third[secIndex]?.[thirdIndex]) && 
                                                         sublocationSuggestions.third[secIndex][thirdIndex].length > 0 && (
                                                            <div className="list-group position-absolute w-100 z-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                                {sublocationSuggestions.third[secIndex][thirdIndex].map((suggestion, idx) => (
                                                                    <button
                                                                        key={idx}
                                                                        type="button"
                                                                        className="list-group-item list-group-item-action"
                                                                        onClick={() => handleThirdSublocationSelect(suggestion, secIndex, thirdIndex)}
                                                                    >
                                                                        {suggestion}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" 
                                                className="btn btn-sm btn-outline-secondary mt-2 ms-3" 
                                                onClick={() => addThird(secIndex)}>
                                            <i className="bi bi-plus"></i> Add Third Location
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" 
                                    className="btn btn-outline-secondary" 
                                    onClick={addSecondary}>
                                <i className="bi bi-plus"></i> Add Secondary Location
                            </button>
                        </div>

                        <div className="d-flex justify-content-end mt-4">
                            <button type="button" 
                                    className="btn btn-outline-secondary me-2" 
                                    onClick={() => {
                                        setShowFormCanvas(false);
                                        resetForm();
                                    }}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? (
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                ) : isEditing ? (
                                    <>
                                        <i className="bi bi-check-circle me-2"></i>Update Location
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-plus-circle me-2"></i>Create Location
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* View Location Off-Canvas */}
<div className={`offcanvas offcanvas-end ${showViewCanvas ? 'show' : ''}`} 
     style={{ visibility: showViewCanvas ? 'visible' : 'hidden', width: '500px' }}>
    <div className="offcanvas-header bg-light">
        <h5 className="offcanvas-title text-primary">
            <i className="bi bi-geo-alt-fill me-2"></i>
            Location Details
        </h5>
        <button type="button" 
                className="btn-close" 
                onClick={closeViewCanvas} 
                aria-label="Close"></button>
    </div>
    <div className="offcanvas-body p-0">
        {selectedLocation && (
            <div className="location-details">
                {/* Primary Location Card */}
                <div className="card border-0 rounded-0 bg-dark text-white">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                                <h6 className="card-subtitle mb-1 opacity-75">Primary Location</h6>
                                <h4 className="card-title mb-0">
                                    <i className="bi bi-geo me-2"></i>
                                    {selectedLocation.PrimaryLocation || "Not specified"}
                                </h4>
                            </div>
                            <div className="flex-shrink-0">
                                <i className="bi bi-buildings-fill display-6 opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub Locations */}
                {Array.isArray(selectedLocation.SubLocation) && selectedLocation.SubLocation.map((subLoc, subIdx) => (
                    <div key={subIdx} className="p-4 border-bottom">
                        {/* Primary Sub Location */}
                        {subLoc.PrimarySubLocation && (
                            <div className="mb-4">
                                <h6 className="text-muted text-uppercase small fw-bold mb-2">
                                    <i className="bi bi-geo-alt me-1"></i>
                                    Primary Sub Location
                                </h6>
                                <div className="d-flex align-items-center bg-light p-3 rounded">
                                    <i className="bi bi-signpost-fill text-primary me-2"></i>
                                    <span className="fw-medium">{subLoc.PrimarySubLocation}</span>
                                </div>
                            </div>
                        )}

                        {/* Secondary Locations */}
                        {Array.isArray(subLoc.SecondaryLocation) && subLoc.SecondaryLocation.length > 0 && (
                            <div className="mt-4">
                                <h6 className="text-muted text-uppercase small fw-bold mb-3">
                                    <i className="bi bi-diagram-2 me-1"></i>
                                    Secondary Locations
                                </h6>
                                
                                {subLoc.SecondaryLocation.map((sec, secIdx) => (
                                    <div key={secIdx} className="card mb-3 shadow-sm">
                                        <div className="card-header bg-white py-3">
                                            <h6 className="mb-0 d-flex align-items-center">
                                                <i className="bi bi-pin-map-fill text-warning me-2"></i>
                                                {sec.SecondaryLocation || 'Unnamed Secondary Location'}
                                            </h6>
                                        </div>
                                        
                                        <div className="card-body">
                                            {/* Secondary Sub Locations */}
                                            {Array.isArray(sec.SecondarySubLocation) && sec.SecondarySubLocation.length > 0 && (
                                                <div className="mb-3">
                                                    <h6 className="text-muted small fw-bold mb-2">
                                                        <i className="bi bi-signpost me-1"></i>
                                                        Secondary Sub Locations
                                                    </h6>
                                                    <ul className="list-group list-group-flush">
                                                        {sec.SecondarySubLocation.map((subSec, subSecIdx) => (
                                                            <li key={subSecIdx} className="list-group-item px-0 py-2">
                                                                <div className="d-flex align-items-center">
                                                                    <i className="bi bi-dot text-secondary me-2"></i>
                                                                    <span>{subSec.SecondarySubLocation || "No sublocation specified"}</span>
                                                                </div>
                                                                
                                                                {/* Third Locations */}
                                                                {Array.isArray(subSec.ThirdLocation) && subSec.ThirdLocation.length > 0 && (
                                                                    <div className="mt-2 ms-3">
                                                                        <h6 className="text-muted small fw-bold mb-2">
                                                                            <i className="bi bi-pin me-1"></i>
                                                                            Third Locations
                                                                        </h6>
                                                                        <ul className="list-group list-group-flush">
                                                                            {subSec.ThirdLocation.map((third, thirdIdx) => (
                                                                                <li key={thirdIdx} className="list-group-item px-0 py-2 bg-light rounded mb-1">
                                                                                    <div className="d-flex justify-content-between align-items-start">
                                                                                        <div>
                                                                                            <div className="fw-medium">
                                                                                                <i className="bi bi-geo me-1 text-info"></i>
                                                                                                {third.ThirdLocation || "No location specified"}
                                                                                            </div>
                                                                                            {third.ThirdSubLocation && (
                                                                                                <div className="text-muted small ms-3">
                                                                                                    <i className="bi bi-arrow-return-right me-1"></i>
                                                                                                    {third.ThirdSubLocation}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            
                                            {/* Direct Third Locations (if any) */}
                                            {Array.isArray(sec.ThirdLocation) && sec.ThirdLocation.length > 0 && (
                                                <div className="mt-3">
                                                    <h6 className="text-muted small fw-bold mb-2">
                                                        <i className="bi bi-pin me-1"></i>
                                                        Third Locations
                                                    </h6>
                                                    <ul className="list-group list-group-flush">
                                                        {sec.ThirdLocation.map((third, thirdIdx) => (
                                                            <li key={thirdIdx} className="list-group-item px-0 py-2 bg-light rounded mb-1">
                                                                <div className="d-flex justify-content-between align-items-start">
                                                                    <div>
                                                                        <div className="fw-medium">
                                                                            <i className="bi bi-geo me-1 text-info"></i>
                                                                            {third.ThirdLocation || "No location specified"}
                                                                        </div>
                                                                        {third.ThirdSubLocation && (
                                                                            <div className="text-muted small ms-3">
                                                                                <i className="bi bi-arrow-return-right me-1"></i>
                                                                                {third.ThirdSubLocation}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                
                {/* Empty State */}
                {(!selectedLocation.SubLocation || selectedLocation.SubLocation.length === 0) && (
                    <div className="text-center py-5">
                        <i className="bi bi-inbox display-4 text-muted"></i>
                        <p className="text-muted mt-3">No sub-locations defined for this location</p>
                    </div>
                )}
            </div>
        )}
    </div>
</div>
</div>
    );
}

export default LocationManager;