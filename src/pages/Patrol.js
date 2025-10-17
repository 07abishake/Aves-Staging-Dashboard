import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
  Circle,
} from "@react-google-maps/api";

// Google Maps configuration
const mapContainerStyle = {
  height: "500px",
  width: "100%",
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060,
};

// Your Google Maps API Key
const GOOGLE_MAPS_API_KEY = "AIzaSyB4as0aCWVUNjprJZ8yyOEOsj5xN2YlbpA";

// Marker icons configuration
const createCustomIcon = (color, maps) => {
  if (!maps) {
    console.warn('Google Maps not available yet');
    return undefined;
  }
  
  return {
    url: `data:image/svg+xml;base64,${btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <path fill="${color}" d="M16 0C10.477 0 6 4.477 6 10c0 10 10 22 10 22s10-12 10-22c0-5.523-4.477-10-10-10zm0 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
        <circle fill="#ffffff" cx="16" cy="10" r="3"/>
      </svg>
    `)}`,
    scaledSize: new maps.Size(32, 32),
    anchor: new maps.Point(16, 32),
  };
};

// Time options for dropdown
const timeOptions = [
  "12:00 AM", "12:30 AM", "1:00 AM", "1:30 AM", "2:00 AM", "2:30 AM", "3:00 AM", "3:30 AM",
  "4:00 AM", "4:30 AM", "5:00 AM", "5:30 AM", "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM",
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
  "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM",
];

// Enhanced AutocompleteInput Component
const AutocompleteInput = ({
  value,
  onChange,
  onSelect,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  onLocationSelect,
  placeholder = "Type to search...",
}) => {
  const [localSuggestions, setLocalSuggestions] = useState([]);

  const handleInputChange = async (inputValue) => {
    onChange(inputValue);
    
    if (inputValue.length > 2) {
      setShowSuggestions(true);
      setLocalSuggestions([]);
    } else {
      setLocalSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = async (suggestion) => {
    onSelect(suggestion);
    setShowSuggestions(false);
  };

  const displaySuggestions = localSuggestions.length > 0 ? localSuggestions : suggestions;

  return (
    <div className="position-relative">
      <input
        type="text"
        className="form-control"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
      />
      {showSuggestions && displaySuggestions.length > 0 && (
        <ul className="autocomplete-suggestions list-group position-absolute w-100 z-3">
          {displaySuggestions.map((suggestion, index) => (
            <li
              key={index}
              className="list-group-item list-group-item-action"
              onClick={() => handleSuggestionSelect(suggestion)}
              style={{ cursor: "pointer" }}
            >
              {suggestion.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Notification service function
const sendPushNotification = async ({ userId, title, body }) => {
  const token = localStorage.getItem("access_token");
  try {
    await axios.post(
      "https://codeaves.avessecurity.com/api/firebase/send-notification",
      {
        userIds: userId,
        title,
        body,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error) {
    console.error("Push notification error:", error);
  }
};

// Location Permission Component
const LocationPermission = ({ onAllow, onDeny }) => {
  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Location Access Required</h5>
          </div>
          <div className="modal-body">
            <p>This application needs access to your location to show your current position on the map and create patrol routes.</p>
            <p>Please click "Allow" to enable location services.</p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onDeny}
            >
              Deny
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onAllow}
            >
              Allow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Google Maps Component with Radius Visualization
const PatrolMap = ({ 
  checkpoints, 
  onMapClick, 
  currentCheckpoint, 
  waypointMode,
  onSelectCheckpoint,
  currentLocation,
  onLocationUpdate,
  searchLocation,
  onMapLoad,
  onDeleteCheckpoint,
  onDeleteWaypoint,
  onEditCheckpoint
}) => {
  const [map, setMap] = useState(null);
  const [maps, setMaps] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [mapType, setMapType] = useState('roadmap');
  const [showTraffic, setShowTraffic] = useState(false);
  const [showTransit, setShowTransit] = useState(false);
  const [trafficLayer, setTrafficLayer] = useState(null);
  const [transitLayer, setTransitLayer] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Map type configurations
  const mapTypes = [
    { id: 'roadmap', name: 'Road', value: 'roadmap', icon: '🛣️' },
    { id: 'satellite', name: 'Satellite', value: 'satellite', icon: '🛰️' },
    { id: 'terrain', name: 'Terrain', value: 'terrain', icon: '⛰️' },
    { id: 'hybrid', name: 'Hybrid', value: 'hybrid', icon: '🌍' },
  ];

  // Handle searched location
  useEffect(() => {
    if (searchLocation && map && maps) {
      const searchMarker = {
        id: 'searched-location',
        position: searchLocation,
        type: 'search',
        icon: createCustomIcon('#ff6b00', maps),
        data: { name: 'Searched Location' }
      };
      
      setMarkers(prev => [
        ...prev.filter(m => m.id !== 'searched-location'),
        searchMarker
      ]);
      
      map.panTo(searchLocation);
      map.setZoom(15);
    }
  }, [searchLocation, map, maps]);

  // Initialize markers from checkpoints
  useEffect(() => {
    if (!maps || !mapLoaded) return;

    const allMarkers = [];
    
    // Add checkpoints as red markers
    checkpoints.forEach((cp, index) => {
      allMarkers.push({
        id: `checkpoint-${index}`,
        position: { lat: cp.location.lat, lng: cp.location.lng },
        type: 'checkpoint',
        data: cp,
        index: index,
        icon: createCustomIcon('#dc3545', maps)
      });

      // Add waypoints as green markers
      cp.waypoints.forEach((wp, wpIndex) => {
        allMarkers.push({
          id: `waypoint-${index}-${wpIndex}`,
          position: { lat: wp.coordinates.lat, lng: wp.coordinates.lng },
          type: 'waypoint',
          data: wp,
          checkpointIndex: index,
          waypointIndex: wpIndex,
          icon: createCustomIcon('#28a745', maps)
        });
      });
    });

    // Add current location as blue marker
    if (currentLocation) {
      allMarkers.push({
        id: 'current-location',
        position: currentLocation,
        type: 'current',
        icon: createCustomIcon('#007bff', maps)
      });
    }

    setMarkers(allMarkers);
  }, [checkpoints, currentLocation, maps, mapLoaded]);

  const handleMapClick = (event) => {
    if (onMapClick && mapLoaded) {
      const latlng = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      onMapClick(latlng);
    }
  };

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
    
    if (marker.type === 'checkpoint' && onSelectCheckpoint) {
      onSelectCheckpoint(marker.index);
    }
  };

  const onLoadHandler = useCallback((mapInstance) => {
    setMap(mapInstance);
    if (window.google && window.google.maps) {
      setMaps(window.google.maps);
      setMapLoaded(true);
      setMapError(null);
      
      if (onMapLoad) {
        onMapLoad(true);
      }
    }
  }, [onMapLoad]);

  const onErrorHandler = useCallback((error) => {
    console.error('Google Maps failed to load:', error);
    setMapError('Failed to load Google Maps. Please check your API key and internet connection.');
    setMapLoaded(false);
    
    if (onMapLoad) {
      onMapLoad(false);
    }
  }, [onMapLoad]);

  const handleMapTypeChange = (newMapType) => {
    setMapType(newMapType);
    if (map) {
      map.setMapTypeId(newMapType);
    }
  };

  const toggleTraffic = () => {
    setShowTraffic(!showTraffic);
  };

  const toggleTransit = () => {
    setShowTransit(!showTransit);
  };

  const resetMapView = () => {
    if (map && currentLocation) {
      map.panTo(currentLocation);
      map.setZoom(15);
    } else if (map) {
      map.panTo(defaultCenter);
      map.setZoom(15);
    }
  };

  // Circle options for checkpoints and waypoints
  const getCircleOptions = (type, radius = 100) => {
    const baseOptions = {
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillOpacity: 0.2,
      clickable: false,
      draggable: false,
      editable: false,
      visible: true,
      radius: radius, // in meters
      zIndex: 1
    };

    if (type === 'checkpoint') {
      return {
        ...baseOptions,
        strokeColor: "#FF0000",
        fillColor: "#FF0000"
      };
    } else if (type === 'waypoint') {
      return {
        ...baseOptions,
        strokeColor: "#00FF00",
        fillColor: "#00FF00"
      };
    }
    
    return baseOptions;
  };

  const handleDeleteCheckpoint = (index) => {
    if (onDeleteCheckpoint) {
      onDeleteCheckpoint(index);
      setSelectedMarker(null);
    }
  };

  const handleDeleteWaypoint = (checkpointIndex, waypointIndex) => {
    if (onDeleteWaypoint) {
      onDeleteWaypoint(checkpointIndex, waypointIndex);
      setSelectedMarker(null);
    }
  };

  const handleEditCheckpoint = (index) => {
    if (onEditCheckpoint) {
      onEditCheckpoint(index);
      setSelectedMarker(null);
    }
  };

  return (
    <div className="map-container">
      {/* Map Loading and Error States */}
      {!mapLoaded && !mapError && (
        <div className="map-loading-overlay">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading map...</span>
          </div>
          <p>Loading map...</p>
        </div>
      )}

      {mapError && (
        <div className="map-error-overlay alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {mapError}
        </div>
      )}

      {/* Simple Always-Visible Map Controls */}
      <div className="simple-map-controls">
        <div className="controls-container">
          {/* Map Type Controls */}
          <div className="control-group">
            <span className="control-label">Map Type:</span>
            <div className="map-type-buttons">
              {mapTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`btn btn-sm ${mapType === type.value ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleMapTypeChange(type.value)}
                  title={type.name}
                  disabled={!mapLoaded}
                >
                  <span className="map-type-icon">{type.icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Layer Controls */}
          <div className="control-group">
            <span className="control-label">Layers:</span>
            <div className="layer-buttons">
              <button
                type="button"
                className={`btn btn-sm ${showTraffic ? 'btn-info' : 'btn-outline-info'}`}
                onClick={toggleTraffic}
                disabled={!mapLoaded}
                title="Traffic"
              >
                <i className="bi bi-car-front"></i>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${showTransit ? 'btn-info' : 'btn-outline-info'}`}
                onClick={toggleTransit}
                disabled={!mapLoaded}
                title="Transit"
              >
                <i className="bi bi-bus-front"></i>
              </button>
            </div>
          </div>

          {/* Action Controls */}
          <div className="control-group">
            <span className="control-label">Actions:</span>
            <div className="action-buttons">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={resetMapView}
                disabled={!mapLoaded}
                title="Reset View"
              >
                <i className="bi bi-geo-alt"></i>
              </button>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="control-group status-indicator">
            <small className="text-muted">
              <strong>{mapTypes.find(t => t.value === mapType)?.name}</strong>
              {showTraffic && " • Traffic"}
              {showTransit && " • Transit"}
            </small>
          </div>
        </div>
      </div>

      {/* Instructions Panel */}
      <div className="map-instructions-panel">
        <div className="instructions-content">
          <small className="text-muted">
            <strong>Instructions:</strong> Click on the map to add {waypointMode ? 'waypoints' : 'checkpoints'}
          </small>
          {waypointMode && currentCheckpoint !== null && (
            <div className="waypoint-mode-alert alert alert-warning alert-sm mt-1">
              <small>
                <i className="bi bi-info-circle"></i> Adding waypoints to checkpoint: {checkpoints[currentCheckpoint]?.name}
              </small>
            </div>
          )}
          {searchLocation && (
            <div className="search-mode-alert alert alert-info alert-sm mt-1">
              <small>
                <i className="bi bi-search"></i> Showing searched location
              </small>
            </div>
          )}
        </div>
      </div>

      <LoadScript 
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        onError={onErrorHandler}
        loadingElement={<div>Loading...</div>}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={currentLocation || defaultCenter}
          zoom={15}
          onClick={handleMapClick}
          onLoad={onLoadHandler}
          options={{
            streetViewControl: true,
            mapTypeControl: false,
            fullscreenControl: true,
            zoomControl: true,
            mapTypeId: mapType,
          }}
        >
          {/* Render circles for checkpoints */}
          {checkpoints.map((cp, index) => (
            <Circle
              key={`checkpoint-circle-${index}`}
              center={{ lat: cp.location.lat, lng: cp.location.lng }}
              options={getCircleOptions('checkpoint', cp.radius || 100)}
            />
          ))}

          {/* Render circles for waypoints */}
          {checkpoints.map((cp, cpIndex) =>
            cp.waypoints.map((wp, wpIndex) => (
              <Circle
                key={`waypoint-circle-${cpIndex}-${wpIndex}`}
                center={{ lat: wp.coordinates.lat, lng: wp.coordinates.lng }}
                options={getCircleOptions('waypoint', wp.radius || 50)}
              />
            ))
          )}

          {/* Render markers */}
          {mapLoaded && markers.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.position}
              icon={marker.icon}
              onClick={() => handleMarkerClick(marker)}
            />
          ))}

          {selectedMarker && (
            <InfoWindow
              position={selectedMarker.position}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div>
                <strong>
                  {selectedMarker.type === 'search' ? 'Searched Location' : 
                   selectedMarker.type === 'current' ? 'Your Location' : 
                   selectedMarker.data.name}
                </strong>
                <br />
                {selectedMarker.type === 'checkpoint' && (
                  <>
                    <div>Radius: {selectedMarker.data.radius || 100}m</div>
                    <div className="mt-2 d-flex flex-wrap gap-1">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          onSelectCheckpoint(selectedMarker.index);
                          setSelectedMarker(null);
                        }}
                      >
                        Add Waypoints
                      </button>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleEditCheckpoint(selectedMarker.index)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteCheckpoint(selectedMarker.index)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
                {selectedMarker.type === 'waypoint' && (
                  <>
                    <div>Radius: {selectedMarker.data.radius || 50}m</div>
                    <div className="mt-2">
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteWaypoint(selectedMarker.checkpointIndex, selectedMarker.waypointIndex)}
                      >
                        Delete Waypoint
                      </button>
                    </div>
                  </>
                )}
                <br />
                <small>
                  Lat: {selectedMarker.position.lat.toFixed(6)}, 
                  Lng: {selectedMarker.position.lng.toFixed(6)}
                </small>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>

      {/* Enhanced CSS */}
      <style>
        {`
          .map-container {
            position: relative;
            border: 1px solid #dee2e6;
            border-radius: 0.375rem;
            overflow: hidden;
            margin-bottom: 1rem;
            min-height: 500px;
          }

          .map-loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }

          .map-error-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            max-width: 90%;
          }

          .simple-map-controls {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            z-index: 1;
          }

          .controls-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border: 1px solid rgba(0,0,0,0.1);
            padding: 8px 12px;
            display: flex;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
            backdrop-filter: blur(5px);
          }

          .control-group {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .control-label {
            font-size: 0.8rem;
            font-weight: 600;
            color: #495057;
            white-space: nowrap;
          }

          .map-type-buttons {
            display: flex;
            gap: 4px;
          }

          .map-type-buttons .btn {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border-radius: 4px;
          }

          .map-type-icon {
            font-size: 1rem;
          }

          .layer-buttons,
          .action-buttons {
            display: flex;
            gap: 4px;
          }

          .layer-buttons .btn,
          .action-buttons .btn {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border-radius: 4px;
          }

          .status-indicator {
            margin-left: auto;
            background: rgba(0,0,0,0.05);
            padding: 4px 8px;
            border-radius: 4px;
          }

          .map-instructions-panel {
            position: absolute;
            bottom: 10px;
            left: 10px;
            right: 10px;
            z-index: 1;
          }

          .instructions-content {
            background: rgba(255, 255, 255, 0.95);
            padding: 8px 12px;
            border-radius: 6px;
            box-shadow: 0 1px 5px rgba(0,0,0,0.1);
            border: 1px solid rgba(0,0,0,0.1);
          }

          .waypoint-mode-alert,
          .search-mode-alert {
            padding: 4px 8px;
            margin-bottom: 0;
            font-size: 0.75rem;
          }

          .alert-sm {
            padding: 0.25rem 0.5rem;
          }

          @media (max-width: 768px) {
            .simple-map-controls {
              left: 5px;
              right: 5px;
            }

            .controls-container {
              gap: 10px;
              padding: 6px 8px;
            }

            .control-group {
              gap: 6px;
            }

            .control-label {
              font-size: 0.75rem;
            }

            .map-type-buttons .btn,
            .layer-buttons .btn,
            .action-buttons .btn {
              width: 32px;
              height: 32px;
            }

            .status-indicator {
              margin-left: 0;
              flex-basis: 100%;
              text-align: center;
              margin-top: 4px;
            }
          }

          @media (max-width: 576px) {
            .controls-container {
              flex-direction: column;
              align-items: flex-start;
              gap: 8px;
            }

            .control-group {
              width: 100%;
              justify-content: space-between;
            }

            .status-indicator {
              flex-basis: auto;
              margin-top: 0;
            }
          }
        `}
      </style>
    </div>
  );
};

// Point Name and Radius Popup Component
const PointPopup = ({ 
  show, 
  onClose, 
  onAdd, 
  pointName, 
  setPointName, 
  radius, 
  setRadius,
  isWaypoint,
  defaultRadius,
  isEdit = false,
  editData = null
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (pointName.trim()) {
      onAdd();
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {isEdit ? 'Edit' : 'Enter'} {isWaypoint ? "Waypoint" : "Checkpoint"} Details
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">
                  {isWaypoint ? "Waypoint" : "Checkpoint"} Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={pointName}
                  onChange={(e) => setPointName(e.target.value)}
                  placeholder={`Enter ${isWaypoint ? 'waypoint' : 'checkpoint'} name`}
                  autoFocus
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  Radius (meters) *
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value) || defaultRadius)}
                  min={isWaypoint ? 5 : 10}
                  max={isWaypoint ? 1000 : 5000}
                  step="1"
                  required
                />
                <div className="form-text">
                  {isWaypoint 
                    ? "Waypoint radius: 5-1000 meters (default: 50m)"
                    : "Checkpoint radius: 10-5000 meters (default: 100m)"
                  }
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!pointName.trim()}
              >
                {isEdit ? 'Update' : 'Add'} {isWaypoint ? 'Waypoint' : 'Checkpoint'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

function Patrol() {
  // State for patrol creation
  const [patrolName, setPatrolName] = useState("");
  const [locations, setLocations] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(null);
  const [waypointMode, setWaypointMode] = useState(false);
  const [showFormCanvas, setShowFormCanvas] = useState(false);
  const [showViewCanvas, setShowViewCanvas] = useState(false);
  const [selectedPatrol, setSelectedPatrol] = useState(null);
  const [patrols, setPatrols] = useState([]);
  const [assignedPatrols, setAssignedPatrols] = useState([]);
  const [activeCheckpoint, setActiveCheckpoint] = useState(null);
  
  // Location states
  const [selectedPrimary, setSelectedPrimary] = useState(null);
  const [selectedPrimarySub, setSelectedPrimarySub] = useState(null);
  const [selectedSecondary, setSelectedSecondary] = useState(null);
  const [selectedSecondarySub, setSelectedSecondarySub] = useState(null);
  const [selectedThird, setSelectedThird] = useState(null);
  const [selectedThirdSub, setSelectedThirdSub] = useState(null);

  // Location name states for display
  const [primaryName, setPrimaryName] = useState("");
  const [primarySubName, setPrimarySubName] = useState("");
  const [secondaryName, setSecondaryName] = useState("");
  const [secondarySubName, setSecondarySubName] = useState("");
  const [thirdName, setThirdName] = useState("");
  const [thirdSubName, setThirdSubName] = useState("");

  // Suggestions states
  const [locationSuggestions, setLocationSuggestions] = useState({
    primary: [],
    primarySub: [],
    secondary: [],
    secondarySub: [],
    third: [],
    thirdSub: [],
  });

  const [showLocationSuggestions, setShowLocationSuggestions] = useState({
    primary: false,
    primarySub: false,
    secondary: false,
    secondarySub: false,
    third: false,
    thirdSub: false,
  });

  // State for assignment
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedPatrolToAssign, setSelectedPatrolToAssign] = useState("");
  const [showAssignCanvas, setShowAssignCanvas] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // State for map points with radius
  const [showPointPopup, setShowPointPopup] = useState(false);
  const [newPointLatLng, setNewPointLatLng] = useState(null);
  const [newPointName, setNewPointName] = useState("");
  const [newPointRadius, setNewPointRadius] = useState(100);
  const [isWaypoint, setIsWaypoint] = useState(false);
  const [isEditingPoint, setIsEditingPoint] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // State for shifts
  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState("");
  const [shiftAssignedUsers, setShiftAssignedUsers] = useState([]);

  // Location permission and tracking states
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  // New states for map and search functionality
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    checkLocationPermission();
    fetchAllData();
  }, []);

  // Check if location permission is already granted
  const checkLocationPermission = () => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((result) => {
          if (result.state === 'granted') {
            setLocationPermissionGranted(true);
            getCurrentLocation();
          } else if (result.state === 'prompt') {
            setShowLocationPermission(true);
          } else {
            setShowLocationPermission(true);
          }
        })
        .catch(() => {
          setShowLocationPermission(true);
        });
    } else {
      setShowLocationPermission(true);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          setLocationPermissionGranted(true);
          setIsLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLoading(false);
          setShowLocationPermission(true);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout
          maximumAge: 60000
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleAllowLocation = () => {
    setShowLocationPermission(false);
    getCurrentLocation();
  };

  const handleDenyLocation = () => {
    setShowLocationPermission(false);
    alert("Location access is required for full functionality. You can enable it later in your browser settings.");
  };

  const handleLocationUpdate = (newLocation) => {
    setCurrentLocation(newLocation);
  };

  const handleLocationSelect = (location) => {
    setSearchedLocation(location);
  };

  const handleMapLoad = (loaded) => {
    setMapLoaded(loaded);
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchLocations(),
        fetchPatrols(),
        fetchShifts(),
        fetchAssignedPatrols(),
      ]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      const res = await axios.get(
        "https://codeaves.avessecurity.com/api/shift/get/ShiftName",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setShifts(res.data.Shifts || []);
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  };

  const fetchUsersForShift = async (actualShiftId) => {
    try {
      const res = await axios.get(
        `https://codeaves.avessecurity.com/api/shift/getUserPatrol/${actualShiftId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShiftAssignedUsers(res.data.users || []);
    } catch (error) {
      console.error("Error fetching shift users:", error);
      setShiftAssignedUsers([]);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await axios.get(
        "https://codeaves.avessecurity.com/api/Location/getLocations",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLocations(res.data.Location || []);
    } catch (err) {
      console.error("Error fetching locations:", err);
    }
  };

const fetchPatrols = async () => {
  try {
    const res = await axios.get(
      "https://codeaves.avessecurity.com/api/Patrol/getAllcreatedPatroll", // Note the extra 'l'
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.data && res.data.data && Array.isArray(res.data.data)) {
      setPatrols(res.data.data);
    } else {
      console.error("Unexpected patrols data structure:", res.data);
      setPatrols([]);
    }
  } catch (err) {
    console.error("Error fetching patrols:", err);
    setPatrols([]);
  }
};

const fetchAssignedPatrols = async () => {
  try {
    const res = await axios.get(
      "https://codeaves.avessecurity.com/api/Patrol/getAllPatrol", // This route exists
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.data && Array.isArray(res.data.assignedPatrols)) {
      setAssignedPatrols(res.data.assignedPatrols);
    } else {
      console.error("Unexpected assigned patrols data structure:", res.data);
      setAssignedPatrols([]);
    }
  } catch (err) {
    console.error("Error fetching assigned patrols:", err);
    setAssignedPatrols([]);
  }
};

  const handleMapClick = (latlng) => {
    setNewPointLatLng(latlng);
    const isWaypointClick = waypointMode && currentCheckpoint !== null;
    setIsWaypoint(isWaypointClick);
    
    // Set default radius based on point type
    setNewPointRadius(isWaypointClick ? 50 : 100);
    setNewPointName("");
    setIsEditingPoint(false);
    setEditingIndex(null);
    setShowPointPopup(true);
  };

  const handleAddPoint = () => {
    if (!newPointName || !newPointLatLng) return;

    if (isEditingPoint && editingIndex !== null) {
      // Edit existing checkpoint
      const updated = [...checkpoints];
      if (isWaypoint && currentCheckpoint !== null) {
        updated[currentCheckpoint].waypoints[editingIndex] = {
          ...updated[currentCheckpoint].waypoints[editingIndex],
          name: newPointName,
          radius: newPointRadius,
        };
      } else {
        updated[editingIndex] = {
          ...updated[editingIndex],
          name: newPointName,
          radius: newPointRadius,
        };
      }
      setCheckpoints(updated);
    } else {
      // Add new point
      if (isWaypoint && currentCheckpoint !== null) {
        const updated = [...checkpoints];
        updated[currentCheckpoint].waypoints.push({
          name: newPointName,
          coordinates: newPointLatLng,
          radius: newPointRadius,
          selfieRequired: false,
        });
        setCheckpoints(updated);
      } else {
        setCheckpoints((prev) => [
          ...prev,
          {
            name: newPointName,
            location: newPointLatLng,
            radius: newPointRadius,
            waypoints: [],
          },
        ]);
      }
    }

    setShowPointPopup(false);
    setNewPointName("");
    setNewPointLatLng(null);
    setNewPointRadius(100);
    setIsEditingPoint(false);
    setEditingIndex(null);
  };

  const handleSelectCheckpoint = (index) => {
    setCurrentCheckpoint(index);
    setWaypointMode(true);
  };

  const handleDeleteCheckpoint = (index) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this checkpoint?");
    if (!confirmDelete) return;

    const updated = checkpoints.filter((_, i) => i !== index);
    setCheckpoints(updated);
    
    if (currentCheckpoint === index) {
      setCurrentCheckpoint(null);
      setWaypointMode(false);
    } else if (currentCheckpoint > index) {
      setCurrentCheckpoint(currentCheckpoint - 1);
    }
  };

  const handleDeleteWaypoint = (checkpointIndex, waypointIndex) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this waypoint?");
    if (!confirmDelete) return;

    const updated = [...checkpoints];
    updated[checkpointIndex].waypoints = updated[checkpointIndex].waypoints.filter((_, i) => i !== waypointIndex);
    setCheckpoints(updated);
  };

  const handleEditCheckpoint = (index) => {
    const checkpoint = checkpoints[index];
    setNewPointName(checkpoint.name);
    setNewPointRadius(checkpoint.radius || 100);
    setNewPointLatLng(checkpoint.location);
    setIsWaypoint(false);
    setIsEditingPoint(true);
    setEditingIndex(index);
    setShowPointPopup(true);
  };

  const resetForm = () => {
    setPatrolName("");
    setCheckpoints([]);
    setCurrentCheckpoint(null);
    setWaypointMode(false);
    setSelectedPrimary(null);
    setPrimaryName("");
    setSelectedPrimarySub(null);
    setPrimarySubName("");
    setSelectedSecondary(null);
    setSecondaryName("");
    setSelectedSecondarySub(null);
    setSecondarySubName("");
    setSelectedThird(null);
    setThirdName("");
    setSelectedThirdSub(null);
    setThirdSubName("");
    setSearchedLocation(null);
  };

  const handleAssignPatrol = async () => {
    if (
      !selectedUser ||
      !startDate ||
      !endDate ||
      !startTime ||
      !endTime ||
      !selectedPatrolToAssign
    ) {
      alert("Please fill in all fields.");
      return;
    }

    if (
      hasOverlappingAssignments(
        selectedUser,
        startDate,
        endDate,
        startTime,
        endTime
      )
    ) {
      alert("Patrol assignment during the selected time period Not Available");
      return;
    }

    const data = {
      userId: selectedUser,
      startDate: startDate,
      endDate: endDate,
      patrollSetId: selectedPatrolToAssign,
      StartedAt: startTime,
      EndedAt: endTime,
    };

    setIsLoading(true);
    try {
      const response = await axios.post(
        "https://codeaves.avessecurity.com/api/Patrol/Assign",
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        try {
          const patrolName =
            patrols.find((p) => p._id === selectedPatrolToAssign)?.Name ||
            "a patrol";
          const user =
            shiftAssignedUsers.find((u) => u.userId === selectedUser)
              ?.userName || "User";

          await sendPushNotification({
            userId: selectedUser,
            title: "New Patrol Assignment",
            body: `${user}, you have been assigned to ${patrolName} from ${startTime} to ${endTime} between ${startDate} and ${endDate}`,
          });
        } catch (notificationError) {
          console.error("Notification failed to send:", notificationError);
        }

        alert("Patrol Assigned Successfully!");
        setShowAssignCanvas(false);
        await fetchAssignedPatrols();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to assign patrol.");
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredTimeOptions = (shiftStart, shiftEnd) => {
    if (!shiftStart || !shiftEnd) return timeOptions;

    const convertToMinutes = (timeStr) => {
      const [time, period] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);

      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      return hours * 60 + minutes;
    };

    const startMinutes = convertToMinutes(shiftStart);
    const endMinutes = convertToMinutes(shiftEnd);

    return timeOptions.filter((time) => {
      const timeMinutes = convertToMinutes(time);
      const isWithinShift =
        startMinutes <= endMinutes
          ? timeMinutes >= startMinutes && timeMinutes <= endMinutes
          : timeMinutes >= startMinutes || timeMinutes <= endMinutes;

      return isWithinShift;
    });
  };

  const hasOverlappingAssignments = (
    userId,
    newStartDate,
    newEndDate,
    newStartTime,
    newEndTime
  ) => {
    const timeToMinutes = (timeStr) => {
      const [time, period] = timeStr.split(" ");
      const [hours, minutes] = time.split(":").map(Number);
      let total = hours * 60 + minutes;
      if (period === "PM" && hours !== 12) total += 12 * 60;
      if (period === "AM" && hours === 12) total -= 12 * 60;
      return total;
    };

    if (newStartTime === newEndTime) {
      console.error("Start Time and End Time cannot be the same.");
      return true;
    }

    if (timeToMinutes(newStartTime) >= timeToMinutes(newEndTime)) {
      console.error("Start Time must be earlier than End Time.");
      return true;
    }

    const newStartMinutes = timeToMinutes(newStartTime);
    const newEndMinutes = timeToMinutes(newEndTime);
    const newStartDateObj = new Date(newStartDate);
    const newEndDateObj = new Date(newEndDate);

    return assignedPatrols.some((assignment) => {
      if (!assignment || !assignment.userId || !assignment.userId._id)
        return false;
      if (assignment.userId._id !== userId) return false;

      const assignmentStartDate = new Date(assignment.startDate);
      const assignmentEndDate = new Date(assignment.endDate);

      if (
        newStartDateObj > assignmentEndDate ||
        newEndDateObj < assignmentStartDate
      ) {
        return false;
      }

      const assignmentStartMinutes = timeToMinutes(assignment.StartedAt);
      const assignmentEndMinutes = timeToMinutes(assignment.EndedAt);

      return !(
        newEndMinutes <= assignmentStartMinutes ||
        newStartMinutes >= assignmentEndMinutes
      );
    });
  };

  const handleSubmit = async () => {
    if (!patrolName) {
      alert("Please enter a patrol name.");
      return;
    }

    if (checkpoints.length === 0) {
      alert("Please add at least one checkpoint.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        Name: patrolName.trim(),
        Location: selectedThirdSub || "Default Location",
        CheckPoints: checkpoints.map((cp) => ({
          Name: cp.name,
          Location: {
            lat: cp.location.lat,
            lng: cp.location.lng
          },
          radius: cp.radius || 100,
          Waypoints: cp.waypoints.map((wp) => ({
            Name: wp.name,
            Coordinates: {
              lat: wp.coordinates.lat,
              lng: wp.coordinates.lng
            },
            radius: wp.radius || 50,
            selfieRequired: wp.selfieRequired || false,
          })),
        })),
      };

      console.log('📤 Sending patrol data:', JSON.stringify(payload, null, 2));

      const response = await axios.post(
        "https://codeaves.avessecurity.com/api/Patrol/create",
        payload,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log('✅ Patrol creation response:', response.data);

      alert("Patrol created successfully!");
      setShowFormCanvas(false);
      resetForm();
      await fetchPatrols();
      
    } catch (err) {
      console.error("❌ Submit error:", err);
      console.error("Error details:", err.response?.data);
      alert("Error creating patrol: " + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePatrol = async (patrolId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this patrol?"
    );
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      await axios.delete(
        `https://codeaves.avessecurity.com/api/Patrol/deletePatrol/${patrolId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Patrol deleted successfully");
      await fetchPatrols();
    } catch (error) {
      console.error("Error deleting patrol:", error);
      alert("Error deleting patrol");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAssignpatrol = async (assignmentId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this patrol assignment?"
    );
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      await axios.delete(
        `https://codeaves.avessecurity.com/api/Patrol/deleteAssignPatrol/${assignmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Patrol assignment deleted successfully");
      await fetchAssignedPatrols();
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to delete patrol assignment.");
    } finally {
      setIsLoading(false);
    }
  };

  const openFormCanvas = () => {
    resetForm();
    setShowFormCanvas(true);
    setShowViewCanvas(false);
  };

  const openViewCanvas = (patrol) => {
    setSelectedPatrol(patrol);
    setShowViewCanvas(true);
    setShowFormCanvas(false);
  };

  const openAssignCanvas = (patrolId) => {
    setSelectedPatrolToAssign(patrolId);
    setSelectedShift("");
    setSelectedUser("");
    setShiftAssignedUsers([]);
    setShowAssignCanvas(true);
  };

  // Helper function to clear lower level selections
  const clearLowerLevels = (level) => {
    switch (level) {
      case 'primary':
        setSelectedPrimarySub(null);
        setPrimarySubName("");
        setSelectedSecondary(null);
        setSecondaryName("");
        setSelectedSecondarySub(null);
        setSecondarySubName("");
        setSelectedThird(null);
        setThirdName("");
        setSelectedThirdSub(null);
        setThirdSubName("");
        break;
      case 'primarySub':
        setSelectedSecondary(null);
        setSecondaryName("");
        setSelectedSecondarySub(null);
        setSecondarySubName("");
        setSelectedThird(null);
        setThirdName("");
        setSelectedThirdSub(null);
        setThirdSubName("");
        break;
      case 'secondary':
        setSelectedSecondarySub(null);
        setSecondarySubName("");
        setSelectedThird(null);
        setThirdName("");
        setSelectedThirdSub(null);
        setThirdSubName("");
        break;
      case 'secondarySub':
        setSelectedThird(null);
        setThirdName("");
        setSelectedThirdSub(null);
        setThirdSubName("");
        break;
      case 'third':
        setSelectedThirdSub(null);
        setThirdSubName("");
        break;
      default:
        break;
    }
  };

  const renderLocationForm = () => {
    const primaryLoc = locations.find((loc) => loc._id === selectedPrimary);
    const primarySubLoc = primaryLoc?.SubLocation?.find(
      (sub) => sub._id === selectedPrimarySub
    );
    const secondaryLoc = primarySubLoc?.SecondaryLocation?.find(
      (sec) => sec._id === selectedSecondary
    );
    const secondarySubLoc = secondaryLoc?.SecondarySubLocation?.find(
      (sub) => sub._id === selectedSecondarySub
    );
    const thirdLoc = secondarySubLoc?.ThirdLocation?.find(
      (third) => third._id === selectedThird
    );

    return (
      <>
        <div className="mb-3">
          <label className="form-label">Primary Location</label>
          <AutocompleteInput
            value={primaryName}
            onChange={(value) => {
              setPrimaryName(value);
              const filtered = locations.filter(
                (loc) =>
                  loc.PrimaryLocation &&
                  loc.PrimaryLocation.toLowerCase().includes(
                    value.toLowerCase()
                  )
              );
              setLocationSuggestions((prev) => ({
                ...prev,
                primary: filtered.map((loc) => ({
                  id: loc._id,
                  name: loc.PrimaryLocation,
                })),
              }));
              setShowLocationSuggestions((prev) => ({
                ...prev,
                primary: value.length > 0,
              }));
            }}
            onSelect={(selected) => {
              const primaryLoc = locations.find(
                (loc) => loc.PrimaryLocation === selected.name
              );
              setSelectedPrimary(primaryLoc._id);
              setPrimaryName(selected.name);
              clearLowerLevels('primary');
            }}
            suggestions={locationSuggestions.primary}
            showSuggestions={showLocationSuggestions.primary}
            setShowSuggestions={(show) =>
              setShowLocationSuggestions((prev) => ({ ...prev, primary: show }))
            }
            placeholder="Type primary location..."
          />
        </div>

        {selectedPrimary && primaryLoc?.SubLocation && (
          <div className="mb-3">
            <label className="form-label">Primary Sub Location</label>
            <AutocompleteInput
              value={primarySubName}
              onChange={(value) => {
                setPrimarySubName(value);
                const filtered = (primaryLoc.SubLocation || []).filter(
                  (sub) =>
                    sub.PrimarySubLocation &&
                    sub.PrimarySubLocation.toLowerCase().includes(
                      value.toLowerCase()
                    )
                );
                setLocationSuggestions((prev) => ({
                  ...prev,
                  primarySub: filtered.map((sub) => ({
                    id: sub._id,
                    name: sub.PrimarySubLocation,
                  })),
                }));
                setShowLocationSuggestions((prev) => ({
                  ...prev,
                  primarySub: value.length > 0,
                }));
              }}
              onSelect={(selected) => {
                setSelectedPrimarySub(selected.id);
                setPrimarySubName(selected.name);
                clearLowerLevels('primarySub');
              }}
              suggestions={locationSuggestions.primarySub}
              showSuggestions={showLocationSuggestions.primarySub}
              setShowSuggestions={(show) =>
                setShowLocationSuggestions((prev) => ({
                  ...prev,
                  primarySub: show,
                }))
              }
              placeholder="Type primary sub location..."
            />
          </div>
        )}

        {selectedPrimarySub && primarySubLoc?.SecondaryLocation && (
          <div className="mb-3">
            <label className="form-label">Secondary Location</label>
            <AutocompleteInput
              value={secondaryName}
              onChange={(value) => {
                setSecondaryName(value);
                const filtered = (primarySubLoc.SecondaryLocation || []).filter(
                  (sec) =>
                    sec.SecondaryLocation &&
                    sec.SecondaryLocation.toLowerCase().includes(
                      value.toLowerCase()
                    )
                );
                setLocationSuggestions((prev) => ({
                  ...prev,
                  secondary: filtered.map((sec) => ({
                    id: sec._id,
                    name: sec.SecondaryLocation,
                  })),
                }));
                setShowLocationSuggestions((prev) => ({
                  ...prev,
                  secondary: value.length > 0,
                }));
              }}
              onSelect={(selected) => {
                setSelectedSecondary(selected.id);
                setSecondaryName(selected.name);
                clearLowerLevels('secondary');
              }}
              suggestions={locationSuggestions.secondary}
              showSuggestions={showLocationSuggestions.secondary}
              setShowSuggestions={(show) =>
                setShowLocationSuggestions((prev) => ({
                  ...prev,
                  secondary: show,
                }))
              }
              placeholder="Type secondary location..."
            />
          </div>
        )}

        {selectedSecondary && secondaryLoc?.SecondarySubLocation && (
          <div className="mb-3">
            <label className="form-label">Secondary Sub Location</label>
            <AutocompleteInput
              value={secondarySubName}
              onChange={(value) => {
                setSecondarySubName(value);
                const filtered = (
                  secondaryLoc.SecondarySubLocation || []
                ).filter(
                  (sub) =>
                    sub.SecondarySubLocation &&
                    sub.SecondarySubLocation.toLowerCase().includes(
                      value.toLowerCase()
                    )
                );
                setLocationSuggestions((prev) => ({
                  ...prev,
                  secondarySub: filtered.map((sub) => ({
                    id: sub._id,
                    name: sub.SecondarySubLocation,
                  })),
                }));
                setShowLocationSuggestions((prev) => ({
                  ...prev,
                  secondarySub: value.length > 0,
                }));
              }}
              onSelect={(selected) => {
                setSelectedSecondarySub(selected.id);
                setSecondarySubName(selected.name);
                clearLowerLevels('secondarySub');
              }}
              suggestions={locationSuggestions.secondarySub}
              showSuggestions={showLocationSuggestions.secondarySub}
              setShowSuggestions={(show) =>
                setShowLocationSuggestions((prev) => ({
                  ...prev,
                  secondarySub: show,
                }))
              }
              placeholder="Type secondary sub location..."
            />
          </div>
        )}

        {selectedSecondarySub && secondarySubLoc?.ThirdLocation && (
          <div className="mb-3">
            <label className="form-label">Third Location</label>
            <AutocompleteInput
              value={thirdName}
              onChange={(value) => {
                setThirdName(value);
                const filtered = (secondarySubLoc.ThirdLocation || []).filter(
                  (third) =>
                    third.ThirdLocation &&
                    third.ThirdLocation.toLowerCase().includes(
                      value.toLowerCase()
                    )
                );
                setLocationSuggestions((prev) => ({
                  ...prev,
                  third: filtered.map((third) => ({
                    id: third._id,
                    name: third.ThirdLocation,
                  })),
                }));
                setShowLocationSuggestions((prev) => ({
                  ...prev,
                  third: value.length > 0,
                }));
              }}
              onSelect={(selected) => {
                setSelectedThird(selected.id);
                setThirdName(selected.name);
                clearLowerLevels('third');
              }}
              suggestions={locationSuggestions.third}
              showSuggestions={showLocationSuggestions.third}
              setShowSuggestions={(show) =>
                setShowLocationSuggestions((prev) => ({ ...prev, third: show }))
              }
              placeholder="Type third location..."
            />
          </div>
        )}

        {selectedThird && thirdLoc && (
          <div className="mb-3">
            <label className="form-label">Third Sub Location</label>
            <AutocompleteInput
              value={thirdSubName}
              onChange={(value) => {
                setThirdSubName(value);
                const filtered = (
                  thirdLoc.ThirdSubLocation ? [thirdLoc.ThirdSubLocation] : []
                ).filter(
                  (sub) =>
                    sub && sub.toLowerCase().includes(value.toLowerCase())
                );
                setLocationSuggestions((prev) => ({
                  ...prev,
                  thirdSub: filtered.map((sub) => ({
                    id: selectedThird,
                    name: sub,
                  })),
                }));
                setShowLocationSuggestions((prev) => ({
                  ...prev,
                  thirdSub: value.length > 0,
                }));
              }}
              onSelect={(selected) => {
                setSelectedThirdSub(selected.id);
                setThirdSubName(selected.name);
              }}
              suggestions={locationSuggestions.thirdSub}
              showSuggestions={showLocationSuggestions.thirdSub}
              setShowSuggestions={(show) =>
                setShowLocationSuggestions((prev) => ({
                  ...prev,
                  thirdSub: show,
                }))
              }
              placeholder="Type third sub location..."
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="container mt-4">
      {/* Location Permission Modal */}
      {showLocationPermission && (
        <LocationPermission 
          onAllow={handleAllowLocation}
          onDeny={handleDenyLocation}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div
          className="overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            className="spinner-border text-primary"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Patrols</h4>
        <div>
          {currentLocation && (
            <span className="badge bg-success me-3">
              <i className="bi bi-geo-alt-fill me-1"></i>
              Location Active
            </span>
          )}
          {mapLoaded && (
            <span className="badge bg-info me-3">
              <i className="bi bi-map me-1"></i>
              Map Ready
            </span>
          )}
          <button className="btn btn-primary" onClick={openFormCanvas}>
            Add Patrol
          </button>
        </div>
      </div>

      {/* Patrols Table */}
      <div className="table-responsive mb-5">
        <table className="table table-striped table-hover">
          <thead className="">
            <tr>
              <th>Patrol Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patrols.map((patrol) => (
              <tr key={patrol._id}>
                <td>{patrol.Name}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() => openViewCanvas(patrol)}
                  >
                    <i className="bi bi-eye"></i> View
                  </button>
                  <button
                    className="btn btn-sm btn-outline-info me-2"
                    onClick={() => openAssignCanvas(patrol._id)}
                  >
                    <i className="bi bi-person-plus"></i> Assign
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDeletePatrol(patrol._id)}
                  >
                    <i className="bi bi-trash"></i> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assigned Patrols Table */}
      <h4 className="mt-5">Assigned Patrols</h4>
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="">
            <tr>
              <th>User</th>
              <th>Patrol</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignedPatrols.map((assignment) => (
              <tr key={assignment._id}>
                <td>
                  {assignment?.userId
                    ? assignment?.userId.Name
                    : "Unknown User"}
                </td>
                <td>
                  {assignment?.PatrolSet
                    ? assignment?.PatrolSet.Name
                    : "Unknown Patrol"}
                </td>
                <td>
                  {new Date(assignment.startDate).toLocaleDateString("en-GB")}
                </td>
                <td>
                  {new Date(assignment.endDate).toLocaleDateString("en-GB")}
                </td>
                <td>{assignment.StartedAt}</td>
                <td>{assignment.EndedAt}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDeleteAssignpatrol(assignment._id)}
                  >
                    <i className="bi bi-trash"></i> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assign Patrol Off-Canvas */}
      <div
        className={`offcanvas offcanvas-end ${showAssignCanvas ? "show" : ""}`}
        style={{ visibility: showAssignCanvas ? "visible" : "hidden" }}
      >
        <div className="offcanvas-header bg-light">
          <h5 className="offcanvas-title">Assign Patrol</h5>
          <button
            className="btn-close"
            onClick={() => setShowAssignCanvas(false)}
          ></button>
        </div>
        <div className="offcanvas-body">
          <div className="mb-3">
            <label className="form-label">Select Shift</label>
            <select
              className="form-select"
              value={selectedShift}
              onChange={(e) => {
                setSelectedShift(e.target.value);
                fetchUsersForShift(e.target.value);
              }}
            >
              <option value="">-- Select Shift --</option>
              {shifts.map((shift) => (
                <option key={shift._id} value={shift._id}>
                  {shift.ShiftName} ({shift.ShiftStartTime} -{" "}
                  {shift.ShiftEndTime})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Select User</label>
            <select
              className="form-select"
              value={selectedUser}
              onChange={(e) => {
                const selectedUserId = e.target.value;
                setSelectedUser(selectedUserId);

                const selectedUserData = shiftAssignedUsers.find(
                  (u) => u.userId === selectedUserId
                );
                if (selectedUserData) {
                  setStartDate(
                    selectedUserData.dateRange.startDate.split("T")[0]
                  );
                  setEndDate(selectedUserData.dateRange.endDate.split("T")[0]);
                }
              }}
              disabled={!selectedShift}
            >
              <option value="">-- Select User --</option>
              {shiftAssignedUsers.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.userName} ({user.designation}) - {user.shiftName} (
                  {user.shiftTime.start} to {user.shiftTime.end})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Patrol</label>
            <input
              type="text"
              className="form-control"
              value={
                patrols.find((p) => p._id === selectedPatrolToAssign)?.Name ||
                ""
              }
              readOnly
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Start Time</label>
            <select
              className="form-select"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={!selectedUser}
            >
              <option value="">-- Select Start Time --</option>
              {selectedUser &&
              shiftAssignedUsers.find((u) => u.userId === selectedUser)
                ? getFilteredTimeOptions(
                    shiftAssignedUsers.find((u) => u.userId === selectedUser)
                      .shiftTime.start,
                    shiftAssignedUsers.find((u) => u.userId === selectedUser)
                      .shiftTime.end
                  ).map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))
                : timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">End Time</label>
            <select
              className="form-select"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={!selectedUser}
            >
              <option value="">-- Select End Time --</option>
              {selectedUser &&
              shiftAssignedUsers.find((u) => u.userId === selectedUser)
                ? getFilteredTimeOptions(
                    shiftAssignedUsers.find((u) => u.userId === selectedUser)
                      .shiftTime.start,
                    shiftAssignedUsers.find((u) => u.userId === selectedUser)
                      .shiftTime.end
                  ).map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))
                : timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
            </select>
          </div>

          <button
            className="btn btn-primary w-100"
            onClick={handleAssignPatrol}
            disabled={
              !selectedUser || !startDate || !endDate || !startTime || !endTime
            }
          >
            Assign Patrol
          </button>
        </div>
      </div>

      {/* Add Patrol Off-Canvas */}
      <div
        className={`offcanvas offcanvas-end ${showFormCanvas ? "show" : ""}`}
        style={{ visibility: showFormCanvas ? "visible" : "hidden", width: "90%", maxWidth: "800px" }}
      >
        <div className="offcanvas-header bg-light">
          <h5 className="offcanvas-title">
            <i className=" text-primary me-2"></i>
            Add New Patrol
          </h5>
          <button
            className="btn-close"
            onClick={() => setShowFormCanvas(false)}
          ></button>
        </div>
        <div className="offcanvas-body">
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-semibold">Patrol Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={patrolName}
                  onChange={(e) => setPatrolName(e.target.value)}
                  placeholder="Enter patrol name"
                />
              </div>

              {renderLocationForm()}
            </div>
            
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-semibold">Checkpoints & Waypoints</label>
                <div className="border rounded p-3 bg-light">
                  <small className="text-muted d-block mb-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Click on the map to add checkpoints. Select a checkpoint to add waypoints.
                  </small>
                  
                  {checkpoints.length > 0 && (
                    <div className="checkpoints-list mt-2">
                      <h6 className="fw-semibold">Added Checkpoints:</h6>
                      <div className="list-group list-group-flush">
                        {checkpoints.map((cp, index) => (
                          <div key={index} className="list-group-item d-flex justify-content-between align-items-center py-2 px-1">
                            <div>
                              <span className="badge bg-danger me-2">{index + 1}</span>
                              {cp.name}
                              <br />
                              <small className="text-muted">
                                Radius: {cp.radius || 100}m
                                {cp.waypoints.length > 0 && (
                                  <span className="ms-2">
                                    • {cp.waypoints.length} waypoint{cp.waypoints.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </small>
                            </div>
                            <div className="d-flex gap-1">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleSelectCheckpoint(index)}
                              >
                                <i className="bi bi-plus-circle"></i> Waypoints
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleEditCheckpoint(index)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteCheckpoint(index)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-12">
              <div className="map-section">
                <PatrolMap
                  checkpoints={checkpoints}
                  onMapClick={handleMapClick}
                  currentCheckpoint={currentCheckpoint}
                  waypointMode={waypointMode}
                  onSelectCheckpoint={handleSelectCheckpoint}
                  currentLocation={currentLocation}
                  onLocationUpdate={handleLocationUpdate}
                  searchLocation={searchedLocation}
                  onMapLoad={handleMapLoad}
                  onDeleteCheckpoint={handleDeleteCheckpoint}
                  onDeleteWaypoint={handleDeleteWaypoint}
                  onEditCheckpoint={handleEditCheckpoint}
                />
              </div>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center border-top pt-3">
                <div>
                  {checkpoints.length > 0 && (
                    <span className="text-muted">
                      <i className="bi bi-check-circle text-success me-1"></i>
                      {checkpoints.length} checkpoint{checkpoints.length !== 1 ? 's' : ''} added
                    </span>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setShowFormCanvas(false);
                      resetForm();
                    }}
                  >
                    <i className="bi bi-x-circle me-1"></i> Cancel
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSubmit}
                    disabled={!patrolName || checkpoints.length === 0}
                  >
                    <i className="bi bi-check-circle me-1"></i> Submit Patrol
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Point Name and Radius Popup */}
      <PointPopup
        show={showPointPopup}
        onClose={() => {
          setShowPointPopup(false);
          setIsEditingPoint(false);
          setEditingIndex(null);
        }}
        onAdd={handleAddPoint}
        pointName={newPointName}
        setPointName={setNewPointName}
        radius={newPointRadius}
        setRadius={setNewPointRadius}
        isWaypoint={isWaypoint}
        defaultRadius={isWaypoint ? 50 : 100}
        isEdit={isEditingPoint}
        editData={isEditingPoint && editingIndex !== null ? checkpoints[editingIndex] : null}
      />

      {/* View Patrol Off-Canvas */}
      <div className={`offcanvas offcanvas-end ${showViewCanvas ? 'show' : ''}`} 
           style={{ visibility: showViewCanvas ? 'visible' : 'hidden' }}>
          <div className="offcanvas-header bg-light">
              <h5 className="offcanvas-title">View Patrol</h5>
              <button className="btn-close" onClick={() => setShowViewCanvas(false)}></button>
          </div>
          <div className="offcanvas-body">
              {selectedPatrol && (
                  <>
                      <h6><strong>Patrol Name:</strong> {selectedPatrol.Name}</h6>

                      <h6 className="mt-4">Checkpoints</h6>
                      <ol className="ps-3">
                          {selectedPatrol.CheckPoints.map((checkpoint, idx) => (
                              <li key={idx} className="mb-3">
                                  <div className="accordion" id={`accordion-checkpoint-${idx}`}>
                                      <div className="accordion-item">
                                          <h2 className="accordion-header" id={`heading-checkpoint-${idx}`}>
                                              <button
                                                  className={`accordion-button ${activeCheckpoint === idx ? "" : "collapsed"}`}
                                                  type="button"
                                                  onClick={() =>
                                                      setActiveCheckpoint(activeCheckpoint === idx ? null : idx)
                                                  }
                                              >
                                                  {checkpoint.Name} (Radius: {checkpoint.radius || 100}m)
                                              </button>
                                          </h2>
                                          <div
                                              id={`collapse-checkpoint-${idx}`}
                                              className={`accordion-collapse collapse ${activeCheckpoint === idx ? "show" : ""}`}
                                              aria-labelledby={`heading-checkpoint-${idx}`}
                                          >
                                              <div className="accordion-body">
                                                  <p>
                                                      <strong>Location:</strong> 
                                                      {checkpoint.Location ? 
                                                          `Lat: ${checkpoint.Location.lat || checkpoint.Location.latitude}, 
                                                          Lng: ${checkpoint.Location.lng || checkpoint.Location.longitude}` : 
                                                          'Location not available'}
                                                  </p>

                                                  <h6 className="mt-3">Waypoints</h6>
                                                  {checkpoint.Waypoints && checkpoint.Waypoints.length > 0 ? (
                                                      <ul className="ps-3">
                                                          {checkpoint.Waypoints.map((waypoint, wayIdx) => (
                                                              <li key={wayIdx} className="mb-2">
                                                                  <p>
                                                                      <strong>{waypoint.Name}</strong> 
                                                                      (Radius: {waypoint.radius || 50}m)
                                                                  </p>
                                                                  <p>
                                                                      Coordinates: 
                                                                      {waypoint.Coordinates ? 
                                                                          `Lat: ${waypoint.Coordinates.lat || waypoint.Coordinates.latitude}, 
                                                                          Lng: ${waypoint.Coordinates.lng || waypoint.Coordinates.longitude}` : 
                                                                          'Coordinates not available'}
                                                                  </p>
                                                                  {waypoint.qrCode && (
                                                                      <img 
                                                                          src={waypoint.qrCode} 
                                                                          alt="QR Code" 
                                                                          style={{ width: '100px', height: '100px' }} 
                                                                      />
                                                                  )}
                                                              </li>
                                                          ))}
                                                      </ul>
                                                  ) : (
                                                      <p className="text-muted">No Waypoints</p>
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </li>
                          ))}
                      </ol>
                  </>
              )}
          </div>
      </div>

      {/* Add CSS */}
      <style>
        {`
          .autocomplete-suggestions {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 4px 4px;
            background-color: white;
            z-index: 1000;
          }

          .autocomplete-suggestions li {
            padding: 8px 12px;
            list-style: none;
          }

          .autocomplete-suggestions li:hover {
            background-color: #f8f9fa;
            cursor: pointer;
          }

          .table th {
            border-top: none;
          }

          .btn {
            border-radius: 0.375rem;
          }

          .form-control, .form-select {
            border-radius: 0.375rem;
          }
        `}
      </style>
    </div>
  );
}

export default Patrol;