import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { Spinner } from "react-bootstrap";

// Custom Leaflet Marker Icon
const customIcon = new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const AddLocation = () => {
    const [locations, setLocations] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [showCreateCanvas, setShowCreateCanvas] = useState(false);
    const [showViewCanvas, setShowViewCanvas] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newLocationTitle, setNewLocationTitle] = useState("");
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const [newLocation, setNewLocation] = useState({
        Locationtitle: "",
        Locationname: "",
        latitude: null,
        longitude: null,
        radius: 100,
        boundaries: [],
    });

    const token = localStorage.getItem("access_token");
    if (!token) {
        // window.location.href = "/login";
    }

    // Get User's Current Location
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ latitude, longitude });
                setNewLocation((prev) => ({ ...prev, latitude, longitude }));
                setLoading(false);
            },
            (error) => {
                console.error("Error getting location:", error);
                setLoading(false);
            }
        );
    }, []);

    // Fetch Saved Locations from API
    const fetchLocations = () => {
        setLoading(true);
        axios
            .get("https://api.avessecurity.com/api/geoLocation/getGeoLocation", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then((response) => {
                setLocations(response.data.Location);
            })
            .catch((error) => {
                console.error("Error fetching locations:", error);
                setLocations([]);
            }).finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    // Handle Polygon Draw
    const handlePolygonDraw = (e) => {
        const layer = e.layer;
        if (layer instanceof L.Polygon) {
            const latlngs = layer.getLatLngs();
            if (latlngs.length > 0 && Array.isArray(latlngs[0])) {
                const formattedLatLngs = latlngs[0].map((point) => ({
                    latitude: point.lat,
                    longitude: point.lng,
                }));
                setNewLocation((prev) => ({ ...prev, boundaries: formattedLatLngs }));
            }
        }
    };

    // Handle Location Search & Suggestions
    const handleLocationSearch = async (query) => {
        setNewLocation({ ...newLocation, Locationtitle: query });

        if (query.length > 2) {
            try {
                const response = await axios.get(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
                );

                if (response.data.length > 0) {
                    setSuggestions(response.data);
                } else {
                    setSuggestions([]);
                }
            } catch (error) {
                console.error("Error fetching suggestions:", error);
            }
        } else {
            setSuggestions([]);
        }
    };

    // Select a Location from Suggestions
    const selectLocation = (location) => {
        setNewLocation({
            ...newLocation,
            Locationtitle: location.display_name,
            latitude: parseFloat(location.lat),
            longitude: parseFloat(location.lon),
        });

        setUserLocation({ latitude: parseFloat(location.lat), longitude: parseFloat(location.lon) });
        setSuggestions([]);
    };

    // Handle Radius Change
    const handleRadiusChange = (e) => {
        setNewLocation({ ...newLocation, radius: Number(e.target.value) });
    };

    // Handle Input Change
    const handleInputChange = (e) => {
        setNewLocation({ ...newLocation, [e.target.name]: e.target.value });
    };

    // Add New Location to Database
    const addLocation = () => {
        if (!newLocation.Locationname || !newLocation.latitude || !newLocation.longitude) {
            alert("Please enter a valid Location Title and select a valid location.");
            return;
        }

        setLoading(true);
        axios
            .post("https://api.avessecurity.com/api/geoLocation/createGeoLocation", newLocation, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((response) => {
                if (response.data) {
                    fetchLocations();
                }
                setShowCreateCanvas(false);
                resetForm();
                alert("Location added successfully!");
            })
            .catch((error) => {
                console.error("Error adding location:", error);
                alert("Error adding location. Please try again.");
            })
            .finally(() => setLoading(false));
    };

    // Update Location in Database
    const updateLocation = () => {
        if (!selectedLocation?._id || !newLocation.Locationname || !newLocation.latitude || !newLocation.longitude) {
            alert("Please enter valid location details.");
            return;
        }

        setLoading(true);
        axios
            .put(`https://api.avessecurity.com/api/geoLocation/update/${selectedLocation._id}`, newLocation, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((response) => {
                if (response.data) {
                    fetchLocations();
                    setShowViewCanvas(false);
                    resetForm();
                    alert("Location updated successfully!");
                }
            })
            .catch((error) => {
                console.error("Error updating location:", error);
                alert("Error updating location. Please try again.");
            })
            .finally(() => setLoading(false));
    };

    // Delete Location from Database
    const deleteLocation = (id) => {
        if (!window.confirm("Are you sure you want to delete this location?")) {
            return;
        }

        setLoading(true);
        axios
            .delete(`https://api.avessecurity.com/api/geoLocation/delete/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((response) => {
                if (response.data) {
                    fetchLocations();
                    alert("Location deleted successfully!");
                }
            })
            .catch((error) => {
                console.error("Error deleting location:", error);
                alert("Error deleting location. Please try again.");
            })
            .finally(() => setLoading(false));
    };

    // Reset form to initial state
    const resetForm = () => {
        setNewLocation({
            Locationtitle: "",
            Locationname: "",
            latitude: userLocation?.latitude || null,
            longitude: userLocation?.longitude || null,
            radius: 100,
            boundaries: [],
        });
        setIsEditing(false);
    };

    // Fill form with current location
    const fillWithCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    try {
                        const response = await axios.get(
                            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                        );

                        const locationName = response.data.display_name || "Current Location";

                        setNewLocation((prev) => ({
                            ...prev,
                            latitude,
                            longitude,
                            Locationtitle: locationName,
                        }));

                        setUserLocation({ latitude, longitude });
                    } catch (error) {
                        console.error("Error getting location name:", error);
                        alert("Could not fetch location name.");
                    }
                },
                (error) => {
                    console.error("Error getting current location:", error);
                    alert("Unable to fetch your current location.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    // Handle click on location to view/edit
    const handleClickLocation = (location) => {
        setSelectedLocation(location);
        setNewLocation({
            Locationtitle: location.Locationtitle,
            Locationname: location.Locationname,
            latitude: location.latitude,
            longitude: location.longitude,
            radius: location.radius,
            boundaries: location.boundaries || [],
        });
        setShowViewCanvas(true);
        setIsEditing(true);
    };

    return (
        <>
            {loading && (
                <div className="d-flex justify-content-center align-items-center flex-column" 
                    style={{ 
                        position: "fixed", 
                        top: 0, 
                        left: 0, 
                        width: "100%", 
                        height: "100vh", 
                        backgroundColor: "rgba(0,0,0,0.5)", 
                        zIndex: 1050 
                    }}>
                    <Spinner animation="border" role="status" variant="light" />
                </div>
            )}

            <div className="container d-flex flex-column justify-content-center mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3 w-100">
                    <div className="d-flex">
                        <input
                            type="text"
                            className="form-control me-2"
                            placeholder="Search..."
                        />
                    </div>

                    <button className="btn btn-primary" onClick={() => {
                        setShowCreateCanvas(true);
                        setIsEditing(false);
                        resetForm();
                    }}>
                        Add Location
                    </button>
                </div>
                <div className="row">
                    <div className="">
                        <div className="card">
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Locations</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {locations.length > 0 ? (
                                                locations.map((location) => (
                                                    <tr key={location._id} style={{ cursor: "pointer" }}>
                                                        <td style={{ width: "70%" }}>
                                                            <p className="m-0">{location.Locationname || "N/A"}</p>
                                                            <p className="m-0 text-secondary" style={{ fontSize: "12px" }}>
                                                                {location.Locationtitle}
                                                            </p>
                                                        </td>
                                                        <td>
                                                            <button 
                                                                className="btn btn-sm btn-outline-primary me-2" 
                                                                onClick={() => handleClickLocation(location)}
                                                            >
                                                                View/Edit
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => deleteLocation(location._id)}
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="2" className="text-center">
                                                        No Location found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Create Location Canvas */}
                <div className={`p-4 offcanvas-custom ${showCreateCanvas ? 'show' : ""}`}>
                    <div className="offcanvas-header mb-3">
                        <h5 className="offcanvas-title">Add new location</h5>
                        <button 
                            className="btn border border-1 mt-2" 
                            style={{ position: "absolute", right: "60px", fontSize: "13px" }} 
                            onClick={fillWithCurrentLocation}
                        >
                            Use Current Location
                        </button>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={() => {
                                setShowCreateCanvas(false);
                                resetForm();
                            }} 
                            style={{ position: "absolute", right: "30px" }}
                        ></button>
                    </div>
                    <div className="offcanvas-body p-2">
                        <div>
                            {/* Location Name Input */}
                            <input
                                type="text"
                                className="form-control mb-2"
                                placeholder="Enter Location Name"
                                name="Locationname"
                                value={newLocation.Locationname}
                                onChange={(e) =>
                                    setNewLocation((prev) => ({ ...prev, Locationname: e.target.value }))
                                }
                                required
                            />

                            {/* Location Search Input */}
                            <input
                                type="text"
                                className="form-control mb-2"
                                placeholder="Search Location (e.g. Chennai)"
                                value={newLocation.Locationtitle}
                                onChange={(e) => handleLocationSearch(e.target.value)}
                                required
                            />

                            {/* Show Suggestions */}
                            {suggestions.length > 0 && (
                                <ul className="list-group">
                                    {suggestions.map((suggestion, index) => (
                                        <li
                                            key={index}
                                            className="list-group-item"
                                            onClick={() => selectLocation(suggestion)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            {suggestion.display_name}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <input
                                type="number"
                                className="form-control mb-2"
                                placeholder="Latitude"
                                name="latitude"
                                value={newLocation.latitude || ""}
                                onChange={(e) => {
                                    const lat = e.target.value ? parseFloat(e.target.value) : null;
                                    setNewLocation((prev) => ({ ...prev, latitude: lat }));
                                }}
                            />
                            <input
                                type="number"
                                className="form-control mb-2"
                                placeholder="Longitude"
                                name="longitude"
                                value={newLocation.longitude || ""}
                                onChange={(e) => {
                                    const lng = e.target.value ? parseFloat(e.target.value) : null;
                                    setNewLocation((prev) => ({ ...prev, longitude: lng }));
                                }}
                            />

                            {/* Radius Selection */}
                            <label>Radius: {newLocation.radius} meters</label>
                            <input
                                type="range"
                                className="form-range"
                                min="10"
                                max="100"
                                step="1"
                                value={newLocation.radius}
                                onChange={handleRadiusChange}
                            />

                            {/* Map Container */}
                            {userLocation && (
                                <MapContainer
                                    center={[userLocation.latitude, userLocation.longitude]}
                                    zoom={12}
                                    style={{ width: "100%", height: "400px" }}
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                                    {/* Polygon Draw Feature */}
                                    <FeatureGroup>
                                        <EditControl
                                            position="topright"
                                            draw={{ rectangle: false, circle: false, marker: false, polyline: false, polygon: true }}
                                            onCreated={handlePolygonDraw}
                                        />
                                    </FeatureGroup>

                                    {newLocation.latitude && newLocation.longitude && !isNaN(newLocation.latitude) && !isNaN(newLocation.longitude) && (
                                        <>
                                            <Marker position={[newLocation.latitude, newLocation.longitude]} icon={customIcon}>
                                                <Popup>{newLocation.Locationtitle}</Popup>
                                            </Marker>
                                            <Circle
                                                center={[newLocation.latitude, newLocation.longitude]}
                                                radius={newLocation.radius}
                                                color="blue"
                                            />
                                        </>
                                    )}
                                </MapContainer>
                            )}

                            {/* Add Location Button */}
                            <button className="btn btn-primary mt-3" onClick={addLocation}>
                                Add Location
                            </button>
                        </div>
                    </div>
                </div>

                {/* View/Edit Location Canvas */}
                <div className={`p-4 offcanvas-custom ${showViewCanvas ? 'show' : ""}`}>
                    <div className="offcanvas-header mb-3">
                        <h5 className="offcanvas-title">{isEditing ? "Edit Location" : "View Location"}</h5>
                        <button 
                            className="btn border border-1 mt-2" 
                            style={{ position: "absolute", right: "60px", fontSize: "13px" }} 
                            onClick={fillWithCurrentLocation}
                        >
                            Use Current Location
                        </button>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={() => {
                                setShowViewCanvas(false);
                                resetForm();
                            }} 
                            style={{ position: "absolute", right: "30px" }}
                        ></button>
                    </div>
                    <div className="offcanvas-body p-2">
                        <div>
                            {/* Location Name Input */}
                            <input
                                type="text"
                                className="form-control mb-2"
                                placeholder="Enter Location Name"
                                name="Locationname"
                                value={newLocation.Locationname}
                                onChange={(e) =>
                                    setNewLocation((prev) => ({ ...prev, Locationname: e.target.value }))
                                }
                                required
                                disabled={!isEditing}
                            />

                            {/* Location Search Input */}
                            <input
                                type="text"
                                className="form-control mb-2"
                                placeholder="Search Location (e.g. Chennai)"
                                value={newLocation.Locationtitle}
                                onChange={(e) => handleLocationSearch(e.target.value)}
                                required
                                disabled={!isEditing}
                            />

                            {/* Show Suggestions */}
                            {suggestions.length > 0 && isEditing && (
                                <ul className="list-group">
                                    {suggestions.map((suggestion, index) => (
                                        <li
                                            key={index}
                                            className="list-group-item"
                                            onClick={() => selectLocation(suggestion)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            {suggestion.display_name}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <input
                                type="number"
                                className="form-control mb-2"
                                placeholder="Latitude"
                                name="latitude"
                                value={newLocation.latitude || ""}
                                onChange={(e) => {
                                    const lat = e.target.value ? parseFloat(e.target.value) : null;
                                    setNewLocation((prev) => ({ ...prev, latitude: lat }));
                                }}
                                disabled={!isEditing}
                            />
                            <input
                                type="number"
                                className="form-control mb-2"
                                placeholder="Longitude"
                                name="longitude"
                                value={newLocation.longitude || ""}
                                onChange={(e) => {
                                    const lng = e.target.value ? parseFloat(e.target.value) : null;
                                    setNewLocation((prev) => ({ ...prev, longitude: lng }));
                                }}
                                disabled={!isEditing}
                            />

                            {/* Radius Selection */}
                            <label>Radius: {newLocation.radius} meters</label>
                            <input
                                type="range"
                                className="form-range"
                                min="10"
                                max="100"
                                step="1"
                                value={newLocation.radius}
                                onChange={handleRadiusChange}
                                disabled={!isEditing}
                            />

                            {/* Map Container */}
                            {newLocation.latitude && newLocation.longitude && (
                                <MapContainer
                                    center={[newLocation.latitude, newLocation.longitude]}
                                    zoom={12}
                                    style={{ width: "100%", height: "400px" }}
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                                    {/* Polygon Draw Feature - Only show when editing */}
                                    {isEditing && (
                                        <FeatureGroup>
                                            <EditControl
                                                position="topright"
                                                draw={{ rectangle: false, circle: false, marker: false, polyline: false, polygon: true }}
                                                onCreated={handlePolygonDraw}
                                            />
                                        </FeatureGroup>
                                    )}

                                    <Marker position={[newLocation.latitude, newLocation.longitude]} icon={customIcon}>
                                        <Popup>{newLocation.Locationtitle}</Popup>
                                    </Marker>
                                    <Circle
                                        center={[newLocation.latitude, newLocation.longitude]}
                                        radius={newLocation.radius}
                                        color="blue"
                                    />
                                </MapContainer>
                            )}

                            {/* Action Buttons */}
                            <div className="d-flex justify-content-between mt-3">
                                {isEditing ? (
                                    <>
                                        <button className="btn btn-primary me-2" onClick={updateLocation}>
                                            Update Location
                                        </button>
                                        <button 
                                            className="btn btn-outline-secondary" 
                                            onClick={() => setIsEditing(false)}
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            className="btn btn-primary me-2" 
                                            onClick={() => setIsEditing(true)}
                                        >
                                            Edit Location
                                        </button>
                                        <button 
                                            className="btn btn-outline-secondary" 
                                            onClick={() => {
                                                setShowViewCanvas(false);
                                                resetForm();
                                            }}
                                        >
                                            Back
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddLocation;