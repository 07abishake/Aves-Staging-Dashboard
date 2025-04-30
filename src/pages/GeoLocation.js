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

    const [newLocation, setNewLocation] = useState({
        Locationtitle: "",
        Locationname: newLocationTitle,
        latitude: null,
        longitude: null,
        radius: 0,
        boundaries: [],
    });
    const handleClickLocation = (location) => {
        setShowViewCanvas(true);
        setSelectedLocation(location);
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
    useEffect(() => {
        setLoading(true);
        axios
            .get("http://api.avessecurity.com:6378/api/geoLocation/getGeoLocation")
            .then((response) => {
                setLocations(response.data.Location);
            })
            .catch((error) => {
                console.error("Error fetching locations:", error);
                setLocations([]);
            }).finally(() => {
                setLoading(false);
            })
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
                    ``
                );

                if (response.data.results.length > 0) {
                    setSuggestions(response.data.results);
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
            Locationtitle: location.formatted,
            latitude: location.geometry.lat,
            longitude: location.geometry.lng,
        });

        setUserLocation({ latitude: location.geometry.lat, longitude: location.geometry.lng });
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
        if (!newLocation.Locationtitle || !newLocation.latitude || !newLocation.longitude) {
            alert("Please enter a valid Location Title and select a valid location.");
            return;
        }

        axios
            .post("http://api.avessecurity.com:6378/api/geoLocation/createGeoLocation", newLocation)
            .then((response) => {
                if (response.data) {
                    setLocations((prev) => [...prev, response.data]);
                }
                setShowCreateCanvas(false);
                setNewLocation({
                    Locationtitle: "",
                    Locationname: "",
                    latitude: userLocation?.latitude || null,
                    longitude: userLocation?.longitude || null,
                    radius: 100,
                    boundaries: [],
                });
                alert("Location added successfully!");

            })
            .catch((error) => console.error("Error adding location:", error));
    };
    const fillWithCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    try {
                        // Reverse Geocoding API (OpenStreetMap)
                        const response = await axios.get(
                            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                        );

                        const locationName = response.data.display_name || "Current Location";

                        setNewLocation((prev) => ({
                            ...prev,
                            latitude,
                            longitude,
                            Locationtitle: locationName, // Auto-fill the search input
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

    return (
        <>
            {loading ? <div className="d-flex justify-content-center align-items-center flex-column" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                <Spinner animation="border" role="status" variant="light">
                </Spinner>
            </div> :

                <div className="container d-flex flex-column justify-content-center mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3 w-100">
                        <div className="d-flex">
                            <input
                                type="text"
                                className="form-control me-2"
                                placeholder="Search..."
                            />
                        </div>

                        <button className="btn btn-primary" onClick={() => setShowCreateCanvas(true)}>
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
                                                    locations.map((team) => (
                                                        <tr key={team._id} style={{ cursor: "pointer" }}>
                                                            <td style={{ width: "70%" }}>
                                                                {/* {team.Locationname} */}
                                                                <p className="m-0">{team.Locationname ? team.Locationname : "N/A"}</p>
                                                                <p className="m-0 text-secondary " style={{ fontSize: "12px" }}>{team.Locationtitle}</p>
                                                            </td>
                                                            <td>
                                                                {/* <button className="btn btn-sm btn-outline-success me-2" >View</button> */}
                                                                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleClickLocation(team)}>View/Edit</button>
                                                                <button className="btn btn-sm btn-outline-danger">Delete</button>
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
                    <div className={`p-4 offcanvas-custom ${showCreateCanvas ? 'show' : ""}`}>
                        <div className="offcanvas-header mb-3">
                            <h5 className="offcanvas-title">Add new location</h5>
                            <button className="btn border border-1 mt-2" style={{ position: "absolute", right: "60px", fontSize: "13px" }} onClick={fillWithCurrentLocation}>
                                Use Current Location
                            </button>

                            <button type="button" className="btn-close" onClick={() => setShowCreateCanvas(false)} style={{ position: "absolute", right: "30px" }}></button>
                        </div>
                        <div className="offcanvas-body p-2">
                            <div >
                                <div className="d-flex justify-content-end mb-3">

                                    {/* <h2>Super Admin</h2> */}

                                </div>
                                {/* Location Title Input */}
                                <input
                                    type="text"
                                    className="form-control mb-2"
                                    placeholder="Enter Location Title"
                                    name="Locationtitle"
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
                                                {suggestion.formatted}
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

                                {/* Show loading if location is not available */}
                                {loading ? (
                                    <p>Loading map...</p>
                                ) : (
                                    userLocation && (
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
                                    )
                                )}

                                {/* Add Location Button */}
                                <button className="btn btn-primary mt-3" onClick={addLocation}>
                                    Add Location
                                </button>
                            </div>

                        </div>
                    </div>
                    <div className={`p-4 offcanvas-custom ${showViewCanvas ? 'show' : ""}`}>
                        <div className="offcanvas-header mb-3">
                            <h5 className="offcanvas-title">Edit new location</h5>
                            <button className="btn border border-1 mt-2" style={{ position: "absolute", right: "60px", fontSize: "13px" }} onClick={fillWithCurrentLocation}>
                                Use Current Location
                            </button>

                            <button type="button" className="btn-close" onClick={() => setShowViewCanvas(false)} style={{ position: "absolute", right: "30px" }}></button>
                        </div>
                        <div className="offcanvas-body p-2">
                            <div >
                                <div className="d-flex justify-content-end mb-3">

                                    {/* <h2>Super Admin</h2> */}

                                </div>
                                {/* Location Title Input */}
                                <input
                                    type="text"
                                    className="form-control mb-2"
                                    placeholder="Enter Location Title"
                                    name="Locationtitle"
                                    value={selectedLocation ? selectedLocation.Locationname : ""}
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
                                    value={selectedLocation ? selectedLocation.Locationtitle : ""}
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
                                                {suggestion.formatted}
                                            </li>
                                        ))}
                                    </ul>
                                )}


                                <input
                                    type="number"
                                    className="form-control mb-2"
                                    placeholder="Latitude"
                                    name="latitude"
                                    value={selectedLocation ? selectedLocation.latitude : ""}
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
                                    value={selectedLocation ? selectedLocation.longitude : ""}
                                    onChange={(e) => {
                                        const lng = e.target.value ? parseFloat(e.target.value) : null;
                                        setNewLocation((prev) => ({ ...prev, longitude: lng }));
                                    }}
                                />

                                {/* Radius Selection */}
                                <label>Radius: {selectedLocation ? selectedLocation.radius : ""} meters</label>
                                <input
                                    type="range"
                                    className="form-range"
                                    min="10"
                                    max="100"
                                    step="1"
                                    value={newLocation.radius}
                                    onChange={handleRadiusChange}
                                />

                                {/* Show loading if location is not available */}
                                {loading ? (
                                    <p>Loading map...</p>
                                ) : (
                                    selectedLocation && (
                                        <MapContainer
                                            center={[selectedLocation.latitude, selectedLocation.longitude]}
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

                                            {selectedLocation.latitude && selectedLocation.longitude && !isNaN(selectedLocation.latitude) && !isNaN(selectedLocation.longitude) && (
                                                <>
                                                    <Marker position={[selectedLocation.latitude, selectedLocation.longitude]} icon={customIcon}>
                                                        <Popup>{selectedLocation.Locationtitle}</Popup>
                                                    </Marker>
                                                    <Circle
                                                        center={[selectedLocation.latitude, selectedLocation.longitude]}
                                                        radius={selectedLocation.radius}
                                                        color="blue"
                                                    />
                                                </>
                                            )}

                                        </MapContainer>
                                    )
                                )}

                                {/* Add Location Button */}
                                <button className="btn btn-primary mt-3 me-2" onClick={addLocation}>
                                    Update Location
                                </button>
                                <button className="btn border border-1 mt-3" onClick={() => setShowViewCanvas(false)}>
                                    Back
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            }

        </>

    );
};

export default AddLocation;
