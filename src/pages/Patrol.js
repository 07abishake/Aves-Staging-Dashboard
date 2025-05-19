import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import debounce from "lodash.debounce";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';

function Patrol() {
    const [patrolName, setPatrolName] = useState('');
    const [locations, setLocations] = useState([]);
    const [selectedPrimary, setSelectedPrimary] = useState('');
    const [selectedSecondary, setSelectedSecondary] = useState('');
    const [selectedThird, setSelectedThird] = useState('');
    const [checkpoints, setCheckpoints] = useState([]);
    const [currentCheckpoint, setCurrentCheckpoint] = useState(null);
    const [showFormCanvas, setShowFormCanvas] = useState(false);
    const [showViewCanvas, setShowViewCanvas] = useState(false);
    const [selectedPatrol, setSelectedPatrol] = useState(null);
    const [patrols, setPatrols] = useState([]);
     const [assignedPatrols, setAssignedPatrols] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedPatrolToAssign, setSelectedPatrolToAssign] = useState('');
    const [showAssignCanvas, setShowAssignCanvas] = useState(false);
    const [waypointMode, setWaypointMode] = useState(false);

    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = "/login";
    }

    useEffect(() => {
        fetchLocations();
        fetchPatrols();
    }, []);

    const fetchLocations = () => {
        axios.get('https://api.avessecurity.com/api/Location/getLocations', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(res => setLocations(res.data.Location))
        .catch(err => console.error('Error fetching locations:', err));
    };

   const fetchPatrols = () => {
    axios.get('https://api.avessecurity.com/api/Patrol/getAllcreatedPatroll', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    .then(res => {
        // Check if response has data property and it's an array
        if (res.data && res.data.data && Array.isArray(res.data.data)) {
            setPatrols(res.data.data);
        } else {
            console.error('Unexpected patrols data structure:', res.data);
            setPatrols([]);
        }
    })
    .catch(err => {
        console.error('Error fetching patrols:', err);
        setPatrols([]);
    });
};

    const openFormCanvas = () => {
        setPatrolName('');
        setSelectedPrimary('');
        setSelectedSecondary('');
        setSelectedThird('');
        setCheckpoints([]);
        setShowFormCanvas(true);
        setShowViewCanvas(false);
    };

    const openViewCanvas = (patrol) => {
        setSelectedPatrol(patrol);
        setShowViewCanvas(true);
        setShowFormCanvas(false);
    };

    const handleDeletePatrol = async (patrolId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this patrol?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`https://api.avessecurity.com/api/Patrol/deletePatrol/${patrolId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            alert("Patrol deleted successfully");
            setPatrols(patrols.filter(patrol => patrol._id !== patrolId));
        } catch (error) {
            console.error("Error deleting patrol:", error);
            alert("Error deleting patrol");
        }
    };

    const handleMapClick = (latlng) => {
        if (waypointMode && currentCheckpoint !== null) {
            const name = prompt('Enter Waypoint Name:');
            if (name) {
                const newWaypoints = [...checkpoints];
                newWaypoints[currentCheckpoint].waypoints.push({
                    name,
                    coordinates: latlng,
                    selfieRequired: false,
                });
                setCheckpoints(newWaypoints);
            }
        } else {
            const name = prompt('Enter Checkpoint Name:');
            if (name) {
                setCheckpoints(prev => [...prev, {
                    name,
                    location: latlng,
                    waypoints: [],
                }]);
            }
        }
    };

    const LocationMarker = () => {
        useMapEvents({
            click(e) {
                handleMapClick(e.latlng);
            }
        });
        return null;
    };

    const handleSelectCheckpoint = (index) => {
        setCurrentCheckpoint(index);
        setWaypointMode(true);
    };

    const handleSubmit = () => {
        const payload = {
            Name: patrolName,
            Location: selectedThird,
            CheckPoints: checkpoints.map(cp => ({
                Name: cp.name,
                Location: cp.location,
                Waypoints: cp.waypoints.map(wp => ({
                    Name: wp.name,
                    Coordinates: wp.coordinates,
                    selfieRequired: wp.selfieRequired
                }))
            }))
        };

        axios.post('https://api.avessecurity.com/api/Patrol/create', payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(() => {
            alert('Patrol created successfully!');
            setShowFormCanvas(false);
            fetchPatrols();
        })
        .catch(err => console.error('Submit error:', err));
    };

    const getSelectedPrimary = () => locations.find(loc => loc._id === selectedPrimary);
    const getSelectedSecondary = () =>
        getSelectedPrimary()?.SecondaryLocation.find(sec => sec._id === selectedSecondary);
    const thirdLocations = getSelectedSecondary()?.ThirdLocation || [];

     const fetchUsers = debounce(async (query) => {
             if (!query) return;
             try {
                 const response = await axios.get(`https://api.avessecurity.com/api/Designation/getDropdown/${query}`,{
                     headers:{
                         Authorization: `Bearer ${token}`,
                     }
                 });
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

    const fetchAssignedPatrols = () => {
        axios.get('http://api.avessecurity.com:6378/api/Patrol/getAllPatrol', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(res => {
            if (res.data && Array.isArray(res.data)) {
                setAssignedPatrols(res.data);
            } else {
                console.error('Unexpected assigned patrols data structure:', res.data);
                setAssignedPatrols([]);
            }
        })
        .catch(err => {
            console.error('Error fetching assigned patrols:', err);
            setAssignedPatrols([]);
        });
    };

    const openAssignCanvas = (patrolId) => {
        setSelectedPatrolToAssign(patrolId);
        setShowAssignCanvas(true);
    };

    const handleAssignPatrol = () => {
        const payload = {
            userId: selectedUser,
            patrollSetId: selectedPatrolToAssign,
            Date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
            StartedAt: "10.00pm", // Default value, you can make this configurable
            EndedAt: "12.20pm"    // Default value, you can make this configurable
        };

        axios.post('https://api.avessecurity.com/api/Patrol/Assign', payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(() => {
            alert('Patrol assigned successfully!');
            setShowAssignCanvas(false);
            fetchAssignedPatrols();
        })
        .catch(err => {
            console.error('Error assigning patrol:', err);
            alert('Error assigning patrol');
        });
    };

    // ... (keep all your existing functions like openFormCanvas, handleDeletePatrol, etc.)

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Patrols</h4>
                <button className="btn btn-primary" onClick={openFormCanvas}>Add Patrol</button>
            </div>

            {/* Patrols Table */}
            <table className="table table-bordered mb-5">
                <thead>
                    <tr>
                        <th>Patrol Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {patrols.map(patrol => (
                        <tr key={patrol._id}>
                            <td>{patrol.Name}</td>
                            <td>
                                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openViewCanvas(patrol)}>
                                    <i className="bi bi-eye"></i>
                                </button>
                                <button className="btn btn-sm btn-outline-info me-2" onClick={() => openAssignCanvas(patrol._id)}>
                                    <i className="bi bi-person-plus"></i> Assign
                                </button>
                                <button className="btn btn-sm btn-outline-warning me-2">
                                    <i className="bi bi-pencil-square"></i>
                                </button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeletePatrol(patrol._id)}>
                                    <i className="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Assigned Patrols Table */}
            <h4 className="mt-5">Assigned Patrols</h4>
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Patrol</th>
                        <th>Date</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                    </tr>
                </thead>
                <tbody>
                    {assignedPatrols.map(assignment => {
                        const user = users.find(u => u._id === assignment.userId);
                        const patrol = patrols.find(p => p._id === assignment.patrollSetId);
                        return (
                            <tr key={assignment._id}>
                                <td>{user ? user.name : 'Unknown User'}</td>
                                <td>{patrol ? patrol.Name : 'Unknown Patrol'}</td>
                                <td>{assignment.Date}</td>
                                <td>{assignment.StartedAt}</td>
                                <td>{assignment.EndedAt}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Assign Patrol Off-Canvas */}
            <div className={`offcanvas offcanvas-end ${showAssignCanvas ? 'show' : ''}`} style={{ visibility: showAssignCanvas ? 'visible' : 'hidden' }}>
                <div className="offcanvas-header">
                    <h5>Assign Patrol</h5>
                    <button className="btn-close" onClick={() => setShowAssignCanvas(false)}></button>
                </div>
                <div className="offcanvas-body">
                    <div className="mb-3">
                        <label className="form-label">Select User</label>
                        <select 
                            className="form-select" 
                            value={selectedUser} 
                            onChange={e => setSelectedUser(e.target.value)}
                        >
                            <option value="">-- Select User --</option>
                            {users.map(user => (
                                <option key={user._id} value={user._id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Patrol</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            value={patrols.find(p => p._id === selectedPatrolToAssign)?.Name || ''} 
                            readOnly 
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Date</label>
                        <input 
                            type="date" 
                            className="form-control" 
                            value={new Date().toISOString().split('T')[0]} 
                            readOnly 
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Start Time</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            value="10.00pm" 
                            onChange={e => {/* You can make this editable if needed */}}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">End Time</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            value="12.20pm" 
                            onChange={e => {/* You can make this editable if needed */}}
                        />
                    </div>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleAssignPatrol}
                        disabled={!selectedUser}
                    >
                        Assign Patrol
                    </button>
                </div>
            </div>


            {/* Add Patrol Off-Canvas */}
            <div className={`offcanvas offcanvas-end ${showFormCanvas ? 'show' : ''}`} style={{ visibility: showFormCanvas ? 'visible' : 'hidden' }}>
                <div className="offcanvas-header">
                    <h5>Add Patrol</h5>
                    <button className="btn-close" onClick={() => setShowFormCanvas(false)}></button>
                </div>
                <div className="offcanvas-body">
                    <div className="mb-3">
                        <label className="form-label">Patrol Name</label>
                        <input type="text" className="form-control" value={patrolName} onChange={e => setPatrolName(e.target.value)} />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Primary Location</label>
                        <select className="form-select" value={selectedPrimary} onChange={e => {
                            setSelectedPrimary(e.target.value);
                            setSelectedSecondary('');
                            setSelectedThird('');
                        }}>
                            <option value="">-- Select Primary --</option>
                            {locations.map(loc => (
                                <option key={loc._id} value={loc._id}>{loc.PrimaryLocation}</option>
                            ))}
                        </select>
                    </div>

                    {selectedPrimary && (
                        <div className="mb-3">
                            <label className="form-label">Secondary Location</label>
                            <select className="form-select" value={selectedSecondary} onChange={e => {
                                setSelectedSecondary(e.target.value);
                                setSelectedThird('');
                            }}>
                                <option value="">-- Select Secondary --</option>
                                {getSelectedPrimary()?.SecondaryLocation.map(sec => (
                                    <option key={sec._id} value={sec._id}>{sec.SecondaryLocation} - {sec.SubLocation}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {selectedSecondary && (
                        <div className="mb-3">
                            <label className="form-label">Third Location</label>
                            <select className="form-select" value={selectedThird} onChange={e => setSelectedThird(e.target.value)}>
                                <option value="">-- Select Third --</option>
                                {thirdLocations.map(third => (
                                    <option key={third._id} value={third._id}>{third.ThirdLocation} - {third.SubLocation}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="mb-3">
                        <label className="form-label">Checkpoints</label>
                        <MapContainer center={[1.3521, 103.8198]} zoom={13} style={{ height: '400px' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <LocationMarker />
                            {checkpoints.map((cp, index) => (
                                <Marker key={index} position={[cp.location.lat, cp.location.lng]}>
                                    <Popup>
                                        <strong>{cp.name}</strong><br />
                                        <button className="btn btn-sm btn-primary mt-1" onClick={() => handleSelectCheckpoint(index)}>
                                            Add Waypoints
                                        </button>
                                    </Popup>
                                </Marker>
                            ))}
                            {checkpoints.flatMap(cp => cp.waypoints).map((wp, idx) => (
                                <Marker key={`wp-${idx}`} position={[wp.coordinates.lat, wp.coordinates.lng]}>
                                    <Popup>{wp.name}</Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>

                    <div className="d-flex justify-content-between">
                        <button className="btn btn-primary" onClick={handleSubmit}>Submit Patrol</button>
                        <button type="button" className="btn btn-outline-secondary" onClick={() => setShowFormCanvas(false)}>Cancel</button>
                    </div>
                </div>
            </div>

            {/* View Patrol Off-Canvas */}
            <div className={`offcanvas offcanvas-end ${showViewCanvas ? 'show' : ''}`} style={{ visibility: showViewCanvas ? 'visible' : 'hidden' }}>
                <div className="offcanvas-header">
                    <h5>View Patrol</h5>
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
                                                        className="accordion-button collapsed"
                                                        type="button"
                                                        data-bs-toggle="collapse"
                                                        data-bs-target={`#collapse-checkpoint-${idx}`}
                                                        aria-expanded="false"
                                                        aria-controls={`collapse-checkpoint-${idx}`}
                                                    >
                                                        {checkpoint.Name}
                                                    </button>
                                                </h2>
                                                <div
                                                    id={`collapse-checkpoint-${idx}`}
                                                    className="accordion-collapse collapse"
                                                    aria-labelledby={`heading-checkpoint-${idx}`}
                                                    data-bs-parent={`#accordion-checkpoint-${idx}`}
                                                >
                                                    <div className="accordion-body">
                                                        <p><strong>Location:</strong> Lat: {checkpoint.Location.latitude}, Lng: {checkpoint.Location.longitude}</p>
                                                        
                                                        <h6 className="mt-3">Waypoints</h6>
                                                        {checkpoint.Waypoints && checkpoint.Waypoints.length > 0 ? (
                                                            <ul className="ps-3">
                                                                {checkpoint.Waypoints.map((waypoint, wayIdx) => (
                                                                    <li key={wayIdx} className="mb-2">
                                                                        <p><strong>{waypoint.Name}</strong></p>
                                                                        <p>Coordinates: Lat: {waypoint.Coordinates.latitude}, Lng: {waypoint.Coordinates.longitude}</p>
                                                                        <p>Selfie Required: {waypoint.selfieRequired ? 'Yes' : 'No'}</p>
                                                                        {waypoint.qrCode && (
                                                                            <img src={waypoint.qrCode} alt="QR Code" style={{ width: '100px', height: '100px' }} />
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
        </div>
    );
}

export default Patrol;