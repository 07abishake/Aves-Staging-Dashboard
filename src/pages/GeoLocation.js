import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import debounce from "lodash.debounce";
import { 
  MapContainer,
  TileLayer,
  FeatureGroup,
  LayersControl,
  Circle,
  Polygon,
  Polyline,
  useMap
} from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Location Permission Popup Component
function LocationPermissionPopup({ onAllow, onDeny }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 10000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '400px'
      }}>
        <h5>Know your location</h5>
        <p className="mb-3">Allow while visiting the site?</p>
        <div className="d-flex flex-column gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => onAllow('allow')}
          >
            Allow while visiting the site
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => onAllow('once')}
          >
            Allow this time
          </button>
          <button 
            className="btn btn-outline-danger"
            onClick={onDeny}
          >
            Never allow
          </button>
        </div>
      </div>
    </div>
  );
}

// SetViewToCurrentLocation Component
function SetViewToCurrentLocation({ onPositionUpdate }) {
  const [showPermissionPopup, setShowPermissionPopup] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const map = useMap();

  const getCurrentLocation = (persistent = false) => {
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: persistent ? Infinity : 0
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 15);
        if (onPositionUpdate) {
          onPositionUpdate([latitude, longitude]);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Could not get your location. Please ensure location services are enabled.");
      },
      options
    );
  };

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(permissionStatus => {
          if (permissionStatus.state === 'granted') {
            setPermissionGranted(true);
            getCurrentLocation(true);
          } else if (permissionStatus.state === 'prompt') {
            setShowPermissionPopup(true);
          }
        })
        .catch(() => {
          setShowPermissionPopup(true);
        });
    } else {
      setShowPermissionPopup(true);
    }
  }, [map]);

  const handleAllow = (type) => {
    setShowPermissionPopup(false);
    setPermissionGranted(true);
    getCurrentLocation(type === 'allow');
  };

  const handleDeny = () => {
    setShowPermissionPopup(false);
    alert('Location access is required to create accurate geofences.');
  };

  return (
    <>
      {showPermissionPopup && (
        <LocationPermissionPopup 
          onAllow={handleAllow} 
          onDeny={handleDeny} 
        />
      )}
    </>
  );
}

// Component to reset map view when geo-fence changes
function ResetMapView({ geoFence }) {
  const map = useMap();
  
  useEffect(() => {
    if (geoFence) {
      // Set appropriate zoom level and center based on geo-fence type
      let center, zoom;
      
      if (geoFence.center) {
        center = geoFence.center;
        zoom = 15;
      } else if (geoFence.coordinates && geoFence.coordinates.length > 0) {
        // Calculate center for polygons/polylines
        const latlngs = geoFence.coordinates;
        const latSum = latlngs.reduce((sum, point) => sum + point[0], 0);
        const lngSum = latlngs.reduce((sum, point) => sum + point[1], 0);
        center = [latSum / latlngs.length, lngSum / latlngs.length];
        zoom = 13;
      } else {
        // Default fallback
        center = [0, 0];
        zoom = 2;
      }
      
      map.setView(center, zoom);
    }
  }, [geoFence, map]);
  
  return null;
}

function GeoFenceManagement() {
  // GeoFence Creation State
  const [geoFenceName, setGeoFenceName] = useState('');
  const [drawnLayer, setDrawnLayer] = useState(null);
  const [allGeoFences, setAllGeoFences] = useState([]);
  const [showFormCanvas, setShowFormCanvas] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#3388ff');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGeoFence, setSelectedGeoFence] = useState(null);
  const [showViewCanvas, setShowViewCanvas] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');

  // Location DropDown
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  
  // User Assignment State
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedGeoFences, setSelectedGeoFences] = useState([]);
  const [userAssignments, setUserAssignments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAssignmentCanvas, setShowAssignmentCanvas] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [assignmentError, setAssignmentError] = useState('');
  
  const featureGroupRef = useRef(null);
  const mapRef = useRef(null);
  const viewMapRef = useRef(null);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchGeoFences();
    fetchUserAssignments();
  }, []);

  const fetchGeoFences = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('https://codeaves.avessecurity.com/api/GeoFence/get-All', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAllGeoFences(res.data.geoFence || []);
    } catch (error) {
      console.error('Failed to fetch GeoFences:', error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = debounce(async (query) => {
    if (!query) {
      setUsers([]);
      return;
    }
    try {
      const response = await axios.get(
        `https://codeaves.avessecurity.com/api/Designation/getDropdown/${query}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data && response.data.Report) {
        const userOptions = response.data.Report.map((user) => ({
          value: user._id,
          label: user.username,
        }));
        setUsers(userOptions);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, 500);

  const fetchUserAssignments = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `https://codeaves.avessecurity.com/api/GeoFence/user-assignments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      setUserAssignments(response.data || []);
    } catch (error) {
      console.error('Error fetching user assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check for duplicate assignments
  const checkDuplicateAssignments = (userId, geoFenceIds) => {
    const existingAssignmentsForUser = userAssignments.filter(
      assignment => assignment.userId === userId
    );

    const duplicateGeoFences = geoFenceIds.filter(geoFenceId => 
      existingAssignmentsForUser.some(assignment => 
        assignment.GeoFenceDetails?._id === geoFenceId
      )
    );

    return duplicateGeoFences;
  };

  const onCreated = (e) => {
    setDrawnLayer(e.layer);
  };

  const extractGeoFenceData = (layer) => {
    const geojson = layer.toGeoJSON();
    const shapeType = geojson.geometry.type;

    let payload = {
      GeoFencename: geoFenceName,
      type: shapeType,
      color: selectedColor,
    };

    if (layer instanceof L.Circle) {
      const center = [layer.getLatLng().lat, layer.getLatLng().lng];
      payload.center = center;
      payload.radius = layer.getRadius();
    } else if (layer instanceof L.Marker) {
      const point = geojson.geometry.coordinates;
      payload.center = [point[1], point[0]];
      payload.type = 'point'; // Force type to be 'point' for markers
    } else if (
      layer instanceof L.Polygon ||
      layer instanceof L.Polyline ||
      layer instanceof L.Rectangle
    ) {
      const coords = geojson.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
      payload.coordinates = coords;
    }

    return payload;
  };

  const handleSubmit = async () => {
    if (!drawnLayer || !geoFenceName) {
      alert("Please draw a shape and enter a GeoFence name.");
      return;
    }

    setIsLoading(true);
    const geoFenceData = extractGeoFenceData(drawnLayer);

    try {
      await axios.post(
        "https://codeaves.avessecurity.com/api/GeoFence/create",
        geoFenceData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("GeoFence created successfully!");
      await fetchGeoFences();
      setGeoFenceName('');
      setDrawnLayer(null);
      setManualLatitude('');
      setManualLongitude('');
      setShowFormCanvas(false);
      if (featureGroupRef.current) {
        featureGroupRef.current.clearLayers();
      }
    } catch (error) {
      console.error("Error submitting GeoFence:", error.response?.data || error.message);
      alert("Failed to create GeoFence");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this GeoFence?");
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      await axios.delete(`https://codeaves.avessecurity.com/api/GeoFence/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("GeoFence deleted successfully!");
      await fetchGeoFences();
      await fetchUserAssignments();
    } catch (error) {
      console.error("Error deleting GeoFence:", error.response?.data || error.message);
      alert("Failed to delete GeoFence");
    } finally {
      setIsLoading(false);
    }
  };

  const assignGeoFences = async () => {
    if (!selectedUserId || selectedGeoFences.length === 0) {
      alert('Please select a user and at least one GeoFence');
      return;
    }

    // Check for duplicate assignments
    const duplicateGeoFences = checkDuplicateAssignments(selectedUserId, selectedGeoFences);
    
    if (duplicateGeoFences.length > 0) {
      const duplicateNames = duplicateGeoFences.map(geoFenceId => {
        const geoFence = allGeoFences.find(gf => gf._id === geoFenceId);
        return geoFence ? geoFence.GeoFencename : 'Unknown';
      });
      
      setAssignmentError(
        `User is already assigned to the following GeoFences: ${duplicateNames.join(', ')}. Please remove duplicates and try again.`
      );
      return;
    }

    setIsLoading(true);
    setAssignmentError('');
    
    try {
      await axios.post(
        'https://codeaves.avessecurity.com/api/GeoFence/Assign-User',
        { userId: selectedUserId, GeoFenceId: selectedGeoFences },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("GeoFences assigned successfully!");
      await fetchUserAssignments();
      setSelectedGeoFences([]);
      setSelectedUserId('');
      setSelectedUserName('');
      setSearchQuery('');
      setShowAssignmentCanvas(false);
    } catch (error) {
      console.error("Error assigning GeoFences:", error.response?.data || error.message);
      alert("Failed to assign GeoFences");
    } finally {
      setIsLoading(false);
    }
  };

  const removeAssignment = async (assignmentId) => {
    const confirmRemove = window.confirm("Are you sure you want to remove this assignment?");
    if (!confirmRemove) return;

    const assignment = userAssignments.find(a => a._id === assignmentId);
    if (!assignment) {
      alert("Assignment not found");
      return;
    }

    const userId = assignment.userId;
    const geoFenceId = assignment.GeoFenceDetails?._id;

    if (!userId || !geoFenceId) {
      alert("Invalid assignment data");
      return;
    }

    setIsLoading(true);
    try {
      await axios.put(
        `https://codeaves.avessecurity.com/api/GeoFence/UnAssign-User/${userId}`,
        { GeoFenceId: geoFenceId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Assignment removed successfully!");
      await fetchUserAssignments();
    } catch (error) {
      console.error("Error removing assignment:", error.response?.data || error.message);
      alert("Failed to remove assignment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUserId(user.value);
    setSelectedUserName(user.label);
    setSearchQuery(user.label);
    setShowUserDropdown(false);
    setAssignmentError('');
    // Clear selected geo-fences when user changes to prevent cross-user assignment issues
    setSelectedGeoFences([]);
  };

  const handleGeoFenceSelect = (geoFenceId) => {
    setSelectedGeoFences(prev => {
      if (prev.includes(geoFenceId)) {
        return prev.filter(id => id !== geoFenceId);
      } else {
        // Check if this geo-fence is already assigned to the selected user
        if (selectedUserId) {
          const isAlreadyAssigned = userAssignments.some(
            assignment => 
              assignment.userId === selectedUserId && 
              assignment.GeoFenceDetails?._id === geoFenceId
          );
          
          if (isAlreadyAssigned) {
            setAssignmentError(
              `This user is already assigned to the selected GeoFence. Please choose a different GeoFence.`
            );
            return prev;
          }
        }
        
        setAssignmentError('');
        return [...prev, geoFenceId];
      }
    });
  };

  // Filter available geo-fences to exclude those already assigned to the selected user
  const getAvailableGeoFences = () => {
    if (!selectedUserId) {
      return allGeoFences;
    }

    const assignedGeoFenceIds = userAssignments
      .filter(assignment => assignment.userId === selectedUserId)
      .map(assignment => assignment.GeoFenceDetails?._id)
      .filter(id => id); // Remove undefined/null values

    return allGeoFences.filter(geoFence => !assignedGeoFenceIds.includes(geoFence._id));
  };

  const renderGeoFenceDetails = (geoFence) => {
    if (!geoFence) return null;
    
    switch (geoFence.type.toLowerCase()) {
      case 'point':
        return (
          <div>
            <p><strong>Type:</strong> Point (shown as circle with {geoFence.radius || 100}m radius)</p>
            <p><strong>Coordinates:</strong> Lat: {geoFence.center[0]}, Lng: {geoFence.center[1]}</p>
          </div>
        );
      case 'circle':
        return (
          <div>
            <p><strong>Type:</strong> Circle</p>
            <p><strong>Center:</strong> Lat: {geoFence.center[0]}, Lng: {geoFence.center[1]}</p>
            <p><strong>Radius:</strong> {geoFence.radius} meters</p>
          </div>
        );
      case 'polygon':
      case 'polyline':
        return (
          <div>
            <p><strong>Type:</strong> {geoFence.type}</p>
            <p><strong>Coordinates:</strong></p>
            <ul>
              {geoFence.coordinates?.map((coord, idx) => (
                <li key={idx}>Lat: {coord[0]}, Lng: {coord[1]}</li>
              ))}
            </ul>
          </div>
        );
      default:
        return <p>Unknown GeoFence type</p>;
    }
  };

  const zoomToManualLocation = () => {
    if (manualLatitude && manualLongitude) {
      const lat = parseFloat(manualLatitude);
      const lng = parseFloat(manualLongitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const map = mapRef.current;
        if (map) {
          map.setView([lat, lng], 15);
          
          // Add a marker at this location
          if (featureGroupRef.current) {
            featureGroupRef.current.clearLayers();
            const marker = L.marker([lat, lng]).addTo(featureGroupRef.current);
            setDrawnLayer(marker);
          }
        }
      } else {
        alert("Please enter valid latitude and longitude values");
      }
    } else {
      alert("Please enter both latitude and longitude");
    }
  };

  // Suggestion DropDown For Location
  const fetchLocationSuggestions = debounce(async (query) => {
    if (!query) {
      setLocationSuggestions([]);
      return;
    }
    
    try {
      const response = await axios.get(
        'https://codeaves.avessecurity.com/api/Location/getLocations',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data && response.data.Location) {
        const suggestions = new Set(); // Using Set to avoid duplicates
        
        // Process each location in the response
        response.data.Location.forEach(location => {
          if (!location.PrimaryLocation) return;
          
          // Add primary location if it matches
          if (location.PrimaryLocation.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(location.PrimaryLocation);
          }

          // Process sublocations
          if (location.SubLocation && location.SubLocation.length > 0) {
            location.SubLocation.forEach(subLoc => {
              // State level (PrimarySubLocation)
              const state = subLoc.PrimarySubLocation;
              if (state && state.toLowerCase().includes(query.toLowerCase())) {
                suggestions.add(`${location.PrimaryLocation}, ${state}`);
              }

              // Process cities (SecondaryLocation)
              if (subLoc.SecondaryLocation && subLoc.SecondaryLocation.length > 0) {
                subLoc.SecondaryLocation.forEach(city => {
                  const cityName = city.SecondaryLocation;
                  if (cityName && cityName.toLowerCase().includes(query.toLowerCase())) {
                    suggestions.add(`${location.PrimaryLocation}, ${state}, ${cityName}`);
                  }

                  // Process areas (SecondarySubLocation)
                  if (city.SecondarySubLocation && city.SecondarySubLocation.length > 0) {
                    city.SecondarySubLocation.forEach(area => {
                      const areaName = area.SecondarySubLocation;
                      if (areaName && areaName.toLowerCase().includes(query.toLowerCase())) {
                        suggestions.add(`${location.PrimaryLocation}, ${state}, ${cityName}, ${areaName}`);
                      }

                      // Process buildings (ThirdLocation)
                      if (area.ThirdLocation && area.ThirdLocation.length > 0) {
                        area.ThirdLocation.forEach(building => {
                          const buildingName = building.ThirdLocation;
                          if (buildingName && buildingName.toLowerCase().includes(query.toLowerCase())) {
                            suggestions.add(`${location.PrimaryLocation}, ${state}, ${cityName}, ${areaName}, ${buildingName}`);
                          }

                          // Process floors (ThirdSubLocation)
                          const floorName = building.ThirdSubLocation;
                          if (floorName && floorName.toLowerCase().includes(query.toLowerCase())) {
                            suggestions.add(`${location.PrimaryLocation}, ${state}, ${cityName}, ${areaName}, ${buildingName}, ${floorName}`);
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
        
        // Convert Set to array and sort
        const sortedSuggestions = Array.from(suggestions).sort();
        setLocationSuggestions(sortedSuggestions);
        setShowLocationSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
    }
  }, 300);

  return (
    <div className="container mt-4">
      {isLoading && (
        <div className="overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>GeoFence Management</h4>
        <div>
          <button className="btn btn-outline-primary me-2" onClick={() => setShowFormCanvas(true)}>
            Add GeoFence
          </button>
          <button className="btn btn-outline-primary" onClick={() => setShowAssignmentCanvas(true)}>
            Assign Users
          </button>
        </div>
      </div>

      <div className="table-responsive mb-5">
        <table className="table custom-table">
          <thead>
            <tr>
              <th>GeoFence Name</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allGeoFences.map(geoFence => (
              <tr key={geoFence._id}>
                <td>{geoFence.GeoFencename}</td>
                <td>{geoFence.type}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-outline-primary me-2" 
                    onClick={() => {
                      setSelectedGeoFence(geoFence);
                      setShowViewCanvas(true);
                    }}
                  >
                    View
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-danger" 
                    onClick={() => handleDelete(geoFence._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-responsive mb-5">
        <h5>Assigned GeoFence</h5>
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>GeoFence Name</th>
              <th>Type</th>
              <th>User Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {userAssignments.map(assignment => (
              <tr key={assignment._id}>
                <td>{assignment.GeoFenceDetails?.GeoFencename}</td>
                <td>{assignment.GeoFenceDetails?.type}</td>
                <td>{assignment.userName}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() => {
                      setSelectedGeoFence(assignment.GeoFenceDetails);
                      setShowViewCanvas(true);
                    }}
                  >
                    <i className='bi bi-eye-fill'></i>
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeAssignment(assignment._id)}
                  >
                    <i className='bi bi-trash-fill'></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add GeoFence Form */}
      <div className={`offcanvas offcanvas-end ${showFormCanvas ? 'show' : ''}`} style={{ visibility: showFormCanvas ? 'visible' : 'hidden' }}>
        <div className="offcanvas-header">
          <h5>Add GeoFence</h5>
          <button className="btn-close" onClick={() => setShowFormCanvas(false)}></button>
        </div>
        <div className="offcanvas-body">
          <div className="mb-3 position-relative">
            <label className="form-label">GeoFence Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={geoFenceName} 
              onChange={e => {
                setGeoFenceName(e.target.value);
                fetchLocationSuggestions(e.target.value);
              }}
              onFocus={() => {
                if (geoFenceName && locationSuggestions.length > 0) {
                  setShowLocationSuggestions(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowLocationSuggestions(false), 200);
              }}
              placeholder="Start typing to see location suggestions"
            />
            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <div 
                className="list-group position-absolute w-100" 
                style={{ 
                  zIndex: 1000, 
                  maxHeight: '300px', 
                  overflowY: 'auto',
                  border: '1px solid #ddd',
                  borderRadius: '0 0 4px 4px'
                }}
              >
                {locationSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="list-group-item list-group-item-action text-start"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur before click
                      setGeoFenceName(suggestion);
                      setShowLocationSuggestions(false);
                    }}
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Color</label>
            <input
              type="color"
              className="form-control form-control-color"
              value={selectedColor}
              onChange={e => setSelectedColor(e.target.value)}
              style={{ width: "100%", height: "40px" }}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Latitude</label>
            <input
              type="number"
              className="form-control"
              value={manualLatitude}
              onChange={(e) => setManualLatitude(e.target.value)}
              placeholder="Enter latitude"
              step="any"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Longitude</label>
            <input
              type="number"
              className="form-control"
              value={manualLongitude}
              onChange={(e) => setManualLongitude(e.target.value)}
              placeholder="Enter longitude"
              step="any"
            />
          </div>
          <button 
            className="btn btn-outline-primary mb-3 w-100" 
            onClick={zoomToManualLocation}
          >
            Get The Location
          </button>

          <div className="mb-3">
            <label className="form-label">Draw GeoFence</label>
            <MapContainer 
              ref={mapRef}
              zoom={13} 
              style={{ height: '400px' }}
            >
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="OpenStreetMap">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Google Satellite">
                  <TileLayer
                    url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                    attribution='&copy; Google'
                  />
                </LayersControl.BaseLayer>
                <SetViewToCurrentLocation onPositionUpdate={setCurrentPosition} />
                <FeatureGroup ref={featureGroupRef}>
                  <EditControl
                    position="topright"
                    onCreated={onCreated}
                    draw={{
                      rectangle: true,
                      polygon: true,
                      circle: true,
                      polyline: true,
                      marker: true,
                      circlemarker: false
                    }}
                  />
                </FeatureGroup>
              </LayersControl>
            </MapContainer>
          </div>

          <div className="d-flex justify-content-between">
            <button className="btn btn-primary" onClick={handleSubmit}>Submit GeoFence</button>
            <button 
              type="button" 
              className="btn btn-outline-secondary" 
              onClick={() => setShowFormCanvas(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* View GeoFence Canvas */}
      <div className={`offcanvas offcanvas-end ${showViewCanvas ? 'show' : ''}`} style={{ visibility: showViewCanvas ? 'visible' : 'hidden' }}>
        <div className="offcanvas-header">
          <h5>View GeoFence</h5>
          <button className="btn-close" onClick={() => setShowViewCanvas(false)}></button>
        </div>
        <div className="offcanvas-body">
          {selectedGeoFence && (
            <>
              <h6><strong>GeoFence Name:</strong> {selectedGeoFence.GeoFencename}</h6>
              <div className="mt-4">
                {renderGeoFenceDetails(selectedGeoFence)}
              </div>
              
              <div className="mt-4" style={{ height: '400px' }}>
                <MapContainer 
                  center={selectedGeoFence.center || (selectedGeoFence.coordinates && selectedGeoFence.coordinates[0]) || [0, 0]} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%' }}
                  ref={viewMapRef}
                >
                  <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="OpenStreetMap">
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Google Satellite">
                      <TileLayer
                        url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                        attribution='&copy; Google'
                      />
                    </LayersControl.BaseLayer>
                  </LayersControl>
                  
                  {/* Add ResetMapView component to reset the view when geo-fence changes */}
                  <ResetMapView geoFence={selectedGeoFence} />
                  
                  {selectedGeoFence.type.toLowerCase() === 'point' && (
                    <Circle 
                      center={selectedGeoFence.center} 
                      radius={selectedGeoFence.radius || 100} 
                      color={selectedGeoFence.color}
                      fillColor={selectedGeoFence.color}
                      fillOpacity={0.2}
                    />
                  )}
                  
                  {selectedGeoFence.type.toLowerCase() === 'circle' && (
                    <Circle 
                      center={selectedGeoFence.center} 
                      radius={selectedGeoFence.radius} 
                      color={selectedGeoFence.color}
                      fillColor={selectedGeoFence.color}
                      fillOpacity={0.2}
                    />
                  )}
                  
                  {(selectedGeoFence.type.toLowerCase() === 'polygon' || 
                    selectedGeoFence.type.toLowerCase() === 'rectangle') && (
                    <Polygon 
                      positions={selectedGeoFence.coordinates} 
                      color={selectedGeoFence.color}
                      fillColor={selectedGeoFence.color}
                      fillOpacity={0.2}
                    />
                  )}
                  
                  {selectedGeoFence.type.toLowerCase() === 'polyline' && (
                    <Polyline 
                      positions={selectedGeoFence.coordinates} 
                      color={selectedGeoFence.color}
                    />
                  )}
                </MapContainer>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Assign Users Canvas */}
      <div className={`offcanvas offcanvas-end ${showAssignmentCanvas ? 'show' : ''}`} style={{ visibility: showAssignmentCanvas ? 'visible' : 'hidden' }}>
        <div className="offcanvas-header">
          <h5>Assign GeoFences to Users</h5>
          <button className="btn-close" onClick={() => setShowAssignmentCanvas(false)}></button>
        </div>
        <div className="offcanvas-body">
          <div className="mb-3">
            <label className="form-label">Search User</label>
            <div className="position-relative">
              <input
                type="text"
                className="form-control"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                  setShowUserDropdown(true);
                }}
                placeholder="Type to search users..."
              />
              {showUserDropdown && users.length > 0 && (
                <div className="dropdown-menu show w-100" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {users.map((user) => (
                    <button
                      key={user.value}
                      className="dropdown-item"
                      type="button"
                      onClick={() => handleUserSelect(user)}
                    >
                      {user.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedUserId && (
            <>
              <div className="mb-3">
                <p><strong>Selected User:</strong> {selectedUserName}</p>
              </div>

              {assignmentError && (
                <div className="alert alert-warning" role="alert">
                  {assignmentError}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Select GeoFences to Assign</label>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
                  {getAvailableGeoFences().length > 0 ? (
                    getAvailableGeoFences().map(geoFence => (
                      <div key={geoFence._id} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`geoFence-${geoFence._id}`}
                          checked={selectedGeoFences.includes(geoFence._id)}
                          onChange={() => handleGeoFenceSelect(geoFence._id)}
                          disabled={userAssignments.some(
                            assignment => 
                              assignment.userId === selectedUserId && 
                              assignment.GeoFenceDetails?._id === geoFence._id
                          )}
                        />
                        <label className="form-check-label" htmlFor={`geoFence-${geoFence._id}`}>
                          {geoFence.GeoFencename} ({geoFence.type})
                          {userAssignments.some(
                            assignment => 
                              assignment.userId === selectedUserId && 
                              assignment.GeoFenceDetails?._id === geoFence._id
                          ) && (
                            <span className="badge bg-warning ms-2">Already Assigned</span>
                          )}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No available GeoFences to assign. This user may already be assigned to all GeoFences.</p>
                  )}
                </div>
              </div>

              <button 
                className="btn btn-primary mb-4" 
                onClick={assignGeoFences}
                disabled={selectedGeoFences.length === 0 || assignmentError}
              >
                Assign Selected GeoFences
              </button> 
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GeoFenceManagement;