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
        { SecondaryLocation: '', SecondarySubLocation: '', ThirdLocations: [] }
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
    const [formProgress, setFormProgress] = useState({
        primary: false,
        primarySub: false,
        secondary: false,
        third: false
    });

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('access_token');
            const { data } = await axios.get('https://api.avessecurity.com/api/Location/getLocations', {
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
        setSecondaryLocations([{ SecondaryLocation: '', SecondarySubLocation: '', ThirdLocations: [] }]);
        setEditId(null);
        setIsEditing(false);
        setFormProgress({
            primary: false,
            primarySub: false,
            secondary: false,
            third: false
        });
    };

    const openFormCanvas = (location = null) => {
        if (location) {
            setPrimaryLocation(location.PrimaryLocation || '');
            
            const firstSubLoc = Array.isArray(location.SubLocation) && location.SubLocation.length > 0 
                ? location.SubLocation[0] 
                : {};
            setPrimarySubLocation(firstSubLoc.PrimarySubLocation || '');
            
            const transformedSecondary = Array.isArray(firstSubLoc.SecondaryLocation) && firstSubLoc.SecondaryLocation.length > 0 
                ? firstSubLoc.SecondaryLocation.map(sec => ({
                    SecondaryLocation: sec.SecondaryLocation || '',
                    SecondarySubLocation: Array.isArray(sec.SecondarySubLocation) && sec.SecondarySubLocation.length > 0 
                        ? sec.SecondarySubLocation[0] 
                        : '',
                    ThirdLocations: Array.isArray(sec.ThirdLocation) && sec.ThirdLocation.length > 0
                        ? sec.ThirdLocation.map(third => ({
                            ThirdLocation: third.ThirdLocation || '',
                            ThirdSubLocation: third.ThirdSubLocation || ''
                        }))
                        : []
                }))
                : [{ SecondaryLocation: '', SecondarySubLocation: '', ThirdLocations: [] }];
            
            setSecondaryLocations(transformedSecondary);
            setEditId(location._id);
            setIsEditing(true);
            setFormProgress({
                primary: true,
                primarySub: true,
                secondary: true,
                third: true
            });
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
            await axios.delete(`https://api.avessecurity.com/api/Location/deleteLocation/${locationId}`, {
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

        // Prepare the payload in the correct format
        const payload = {
            PrimaryLocation: primaryLocation.trim(),
            PrimarySubLocation: primarySubLocation.trim(),
            SecondaryLocation: secondaryLocations.length > 0 && secondaryLocations[0].SecondaryLocation 
                ? secondaryLocations[0].SecondaryLocation.trim() 
                : undefined,
            SecondarySubLocation: secondaryLocations.length > 0 && secondaryLocations[0].SecondarySubLocation 
                ? secondaryLocations[0].SecondarySubLocation.trim() 
                : undefined,
            ThirdLocation: secondaryLocations.length > 0 && 
                         secondaryLocations[0].ThirdLocations.length > 0 && 
                         secondaryLocations[0].ThirdLocations[0].ThirdLocation
                ? secondaryLocations[0].ThirdLocations[0].ThirdLocation.trim()
                : undefined,
            ThirdSubLocation: secondaryLocations.length > 0 && 
                             secondaryLocations[0].ThirdLocations.length > 0 && 
                             secondaryLocations[0].ThirdLocations[0].ThirdSubLocation
                ? secondaryLocations[0].ThirdLocations[0].ThirdSubLocation.trim()
                : undefined
        };

        // Remove undefined fields
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

        try {
            setIsLoading(true);
            const token = localStorage.getItem('access_token');
            const url = isEditing 
                ? `https://api.avessecurity.com/api/Location/updateLocation/${editId}`
                : 'http://localhost:6378/api/Location/createLocation';
            
            await axios[isEditing ? 'put' : 'post'](url, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            alert(`Location ${isEditing ? 'updated' : 'created'} successfully`);
            setShowFormCanvas(false);
            fetchLocations();
            resetForm();
        } catch (err) {
            console.error(err);
            alert(`Error ${isEditing ? 'updating' : 'creating'} location: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

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
            // Primary sublocation suggestions (not used in this case)
            if (type === 'primary') {
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

    // Input change handlers
    const handlePrimaryLocationChange = (value) => {
        setPrimaryLocation(value);
        const newSuggestions = generateSuggestions('primary', value);
        setSuggestions(prev => ({ ...prev, primary: newSuggestions }));
        setShowSuggestions(prev => ({ ...prev, primary: value.length > 0 }));
        
        if (value && newSuggestions.includes(value)) {
            setFormProgress(prev => ({ ...prev, primary: true }));
        } else {
            setFormProgress(prev => ({ ...prev, primary: false, primarySub: false, secondary: false, third: false }));
        }
    };

    const handleSecondaryLocationChange = (secIndex, value) => {
        const updated = [...secondaryLocations];
        updated[secIndex].SecondaryLocation = value;
        setSecondaryLocations(updated);
        
        const newSuggestions = generateSuggestions('secondary', value, { 
            primary: primaryLocation 
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
        
        if (value && newSuggestions.includes(value)) {
            setFormProgress(prev => ({ ...prev, secondary: true }));
        } else {
            setFormProgress(prev => ({ ...prev, secondary: false, third: false }));
        }
    };

    const handleThirdLocationChange = (secIndex, thirdIndex, value) => {
        const updated = [...secondaryLocations];
        updated[secIndex].ThirdLocations[thirdIndex].ThirdLocation = value;
        setSecondaryLocations(updated);
        
        const parentSecondary = secondaryLocations[secIndex].SecondaryLocation;
        const newSuggestions = generateSuggestions('third', value, { 
            primary: primaryLocation, 
            secondary: parentSecondary 
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
        
        if (value && newSuggestions.includes(value)) {
            setFormProgress(prev => ({ ...prev, third: true }));
        }
    };

    // Sublocation change handlers
    const handlePrimarySublocationChange = (value) => {
        setPrimarySubLocation(value);
        const newSuggestions = generateSublocationSuggestions('primary', value, { 
            primary: primaryLocation 
        });
        setSublocationSuggestions(prev => ({ ...prev, primary: newSuggestions }));
        setShowSublocationSuggestions(prev => ({ ...prev, primary: value.length > 0 }));
        
        if (value && newSuggestions.includes(value)) {
            setFormProgress(prev => ({ ...prev, primarySub: true }));
        } else {
            setFormProgress(prev => ({ ...prev, primarySub: false, secondary: false, third: false }));
        }
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

    const handleThirdSublocationChange = (secIndex, thirdIndex, value) => {
        const updated = [...secondaryLocations];
        updated[secIndex].ThirdLocations[thirdIndex].ThirdSubLocation = value;
        setSecondaryLocations(updated);
        
        const newSuggestions = generateSublocationSuggestions('third', value, { 
            primary: primaryLocation,
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

    // Location selection handlers
    const handlePrimaryLocationSelect = (selectedPrimaryLoc) => {
        setPrimaryLocation(selectedPrimaryLoc);
        setShowSuggestions(prev => ({ ...prev, primary: false }));
        setSecondaryLocations([{ SecondaryLocation: '', SecondarySubLocation: '', ThirdLocations: [] }]);
        setFormProgress(prev => ({ ...prev, primary: true, primarySub: false, secondary: false, third: false }));
    };

    const handleSecondaryLocationSelect = (selectedSecondaryLoc, secIndex) => {
        const updated = [...secondaryLocations];
        updated[secIndex].SecondaryLocation = selectedSecondaryLoc;
        setSecondaryLocations(updated);
        setShowSuggestions(prev => ({
            ...prev,
            secondary: { ...prev.secondary, [secIndex]: false }
        }));
        setFormProgress(prev => ({ ...prev, secondary: true, third: false }));
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
        setFormProgress(prev => ({ ...prev, third: true }));
    };

    // Sublocation selection handlers
    const handlePrimarySublocationSelect = (selectedSubloc) => {
        setPrimarySubLocation(selectedSubloc);
        setShowSublocationSuggestions(prev => ({ ...prev, primary: false }));
        setFormProgress(prev => ({ ...prev, primarySub: true, secondary: false, third: false }));
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
            { SecondaryLocation: '', SecondarySubLocation: '', ThirdLocations: [] }
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
            ? [{ SecondaryLocation: '', SecondarySubLocation: '', ThirdLocations: [] }] 
            : updated
        );
    };

    const removeThird = (secondaryIndex, thirdIndex) => {
        const updated = [...secondaryLocations];
        updated[secondaryIndex].ThirdLocations.splice(thirdIndex, 1);
        setSecondaryLocations(updated);
    };

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

                        {formProgress.primary && (
                            <div className="mb-3">
                                <label className="form-label">Primary SubLocation*</label>
                                <div className="position-relative">
                                    <input 
                                        className="form-control" 
                                        value={primarySubLocation} 
                                        onChange={(e) => handlePrimarySublocationChange(e.target.value)} 
                                        required
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
                        )}

                        {formProgress.primarySub && (
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
                                        {formProgress.secondary && (
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
                                        )}

                                    {formProgress.secondary && (
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
                            {/* Always show Third SubLocation field when Third Location is shown */}
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
            )}
                                    </div>
                                ))}
                                <button type="button" 
                                        className="btn btn-outline-secondary" 
                                        onClick={addSecondary}>
                                    <i className="bi bi-plus"></i> Add Secondary Location
                                </button>
                            </div>
                        )}

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
                <div className="offcanvas-header text-black">
                    <h5 className="offcanvas-title">Location Details</h5>
                    <button type="button" 
                            className="btn-close" 
                            onClick={closeViewCanvas} 
                            aria-label="Close"></button>
                </div>
                <div className="offcanvas-body">
                    {selectedLocation && (
                        <>
                            <div className="mb-4">
                                <h6 className="text-muted">Primary Location</h6>
                                <h4>{selectedLocation.PrimaryLocation}</h4>
                            </div>

                            {Array.isArray(selectedLocation.SubLocation) && selectedLocation.SubLocation.map((subLoc, subIdx) => (
                                <div key={subIdx} className="mb-4">
                                    <h6 className="text-muted">Primary Sub Location</h6>
                                    <p>{subLoc.PrimarySubLocation}</p>

                                    {Array.isArray(subLoc.SecondaryLocation) && subLoc.SecondaryLocation.length > 0 && (
                                        <div className="mt-3">
                                            <h6 className="text-muted mb-3">Secondary Locations</h6>
                                            <div className="accordion" id={`secondaryAccordion-${subIdx}`}>
                                                {subLoc.SecondaryLocation.map((sec, secIdx) => (
                                                    <div key={secIdx} className="accordion-item mb-2">
                                                        <h2 className="accordion-header">
                                                            <button className="accordion-button collapsed" 
                                                                    type="button" 
                                                                    data-bs-toggle="collapse" 
                                                                    data-bs-target={`#collapseSec-${subIdx}-${secIdx}`}>
                                                                {sec.SecondaryLocation || 'Unnamed Secondary Location'}
                                                            </button>
                                                        </h2>
                                                        <div id={`collapseSec-${subIdx}-${secIdx}`} 
                                                             className="accordion-collapse collapse" 
                                                             data-bs-parent={`#secondaryAccordion-${subIdx}`}>
                                                            <div className="accordion-body">
                                                                {Array.isArray(sec.SecondarySubLocation) && sec.SecondarySubLocation.length > 0 && (
                                                                    <p><strong>Secondary SubLocation:</strong> {sec.SecondarySubLocation.join(', ')}</p>
                                                                )}
                                                                
                                                                {Array.isArray(sec.ThirdLocation) && sec.ThirdLocation.length > 0 && (
                                                                    <>
                                                                        <h6 className="mt-3">Third Locations</h6>
                                                                        <ul className="list-group list-group-flush">
                                                                            {sec.ThirdLocation.map((third, thirdIdx) => (
                                                                                <li key={thirdIdx} className="list-group-item">
                                                                                    {third.ThirdLocation && (
                                                                                        <p><strong>Location:</strong> {third.ThirdLocation}</p>
                                                                                    )}
                                                                                    {third.ThirdSubLocation && (
                                                                                        <p><strong>SubLocation:</strong> {third.ThirdSubLocation}</p>
                                                                                    )}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LocationManager;