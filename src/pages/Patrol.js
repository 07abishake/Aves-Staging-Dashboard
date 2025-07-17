import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import debounce from "lodash.debounce";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Marker icons
const blueIcon = new L.Icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const redIcon = new L.Icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const greenIcon = new L.Icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Time options for dropdown
const timeOptions = [
  "12:00 AM", "12:30 AM", "1:00 AM", "1:30 AM", "2:00 AM", "2:30 AM", "3:00 AM", "3:30 AM",
  "4:00 AM", "4:30 AM", "5:00 AM", "5:30 AM", "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM",
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
  "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
];

function SetViewToCurrentLocation() {
  const [position, setPosition] = useState(null);
  const map = useMap();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        map.setView([latitude, longitude], 15);
      },
      (error) => {
        console.error("Geolocation error:", error);
      }
    );
  }, [map]);

  return position ? (
    <Marker position={position} icon={blueIcon}>
      <Popup>You are here</Popup>
    </Marker>
  ) : null;
}

function LocationMarker({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

function Patrol() {
    // State for patrol creation
    const [patrolName, setPatrolName] = useState('');
    const [locations, setLocations] = useState([]);
    const [selectedPrimary, setSelectedPrimary] = useState('');
    const [selectedSecondary, setSelectedSecondary] = useState('');
    const [selectedThird, setSelectedThird] = useState('');
    const [checkpoints, setCheckpoints] = useState([]);
    const [currentCheckpoint, setCurrentCheckpoint] = useState(null);
    const [waypointMode, setWaypointMode] = useState(false);
    const [showFormCanvas, setShowFormCanvas] = useState(false);
    const [showViewCanvas, setShowViewCanvas] = useState(false);
    const [selectedPatrol, setSelectedPatrol] = useState(null);
    const [patrols, setPatrols] = useState([]);
    const [assignedPatrols, setAssignedPatrols] = useState([]);
    
    // State for assignment
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedPatrolToAssign, setSelectedPatrolToAssign] = useState('');
    const [showAssignCanvas, setShowAssignCanvas] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    
    // State for map points
    const [showNamePopup, setShowNamePopup] = useState(false);
    const [newPointLatLng, setNewPointLatLng] = useState(null);
    const [newPointName, setNewPointName] = useState('');
    const [isWaypoint, setIsWaypoint] = useState(false);
    
    // State for shifts
    const [shifts, setShifts] = useState([]);
    const [selectedShift, setSelectedShift] = useState('');
    const [shiftAssignedUsers, setShiftAssignedUsers] = useState([]);
    
    const token = localStorage.getItem("access_token");

    useEffect(() => {
        fetchLocations();
        fetchPatrols();
        fetchShifts();
        fetchAssignedPatrols();
    }, []);

    // Fetch all available shifts
    const fetchShifts = async () => {
        try {
            const res = await axios.get("https://api.avessecurity.com/api/shift/get/ShiftName", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShifts(res.data.Shifts || []);
        } catch (error) {
            console.error("Error fetching shifts:", error);
        }
    };

    // Fetch users assigned to a specific shift
    const fetchUsersForShift = async (actualShiftId) => {
        try {
            const res = await axios.get(
                `https://api.avessecurity.com/api/shift/getUserPatrol/${actualShiftId}`, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShiftAssignedUsers(res.data.users || []);
        } catch (error) {
            console.error("Error fetching shift users:", error);
            setShiftAssignedUsers([]);
        }
    };

    const fetchLocations = () => {
        axios.get('https://api.avessecurity.com/api/Location/getLocations', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setLocations(res.data.Location || []))
        .catch(err => console.error('Error fetching locations:', err));
    };

    const fetchPatrols = () => {
        axios.get('https://api.avessecurity.com/api/Patrol/getAllcreatedPatroll', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
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

    const fetchAssignedPatrols = () => {
        axios.get('https://api.avessecurity.com/api/Patrol/getAllPatrol', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            if (res.data && Array.isArray(res.data.assignedPatrols)) {
                setAssignedPatrols(res.data.assignedPatrols);
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

    const handleMapClick = (latlng) => {
        setNewPointLatLng(latlng);
        setIsWaypoint(waypointMode && currentCheckpoint !== null);
        setNewPointName('');
        setShowNamePopup(true);
    };

    const handleAddPoint = () => {
        if (!newPointName || !newPointLatLng) return;

        if (isWaypoint && currentCheckpoint !== null) {
            const updated = [...checkpoints];
            updated[currentCheckpoint].waypoints.push({
                name: newPointName,
                coordinates: newPointLatLng,
                selfieRequired: false,
            });
            setCheckpoints(updated);
        } else {
            setCheckpoints(prev => [
                ...prev,
                {
                    name: newPointName,
                    location: newPointLatLng,
                    waypoints: [],
                }
            ]);
        }

        setShowNamePopup(false);
        setNewPointName('');
        setNewPointLatLng(null);
    };

    const handleSelectCheckpoint = (index) => {
        setCurrentCheckpoint(index);
        setWaypointMode(true);
    };

    const handleAssignPatrol = async () => {
        if (!selectedUser || !startDate || !endDate || !startTime || !endTime || !selectedPatrolToAssign) {
            alert("Please fill in all fields.");
            return;
        }

        if (hasOverlappingAssignments(selectedUser, startDate, endDate, startTime, endTime)) {
            alert("This user already has a patrol assignment during the selected time period.");
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

        try {
            const response = await axios.post(
                "https://api.avessecurity.com/api/Patrol/Assign", 
                data, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.status === 200) {
                alert("Patrol Assigned Successfully!");
                setShowAssignCanvas(false);
                fetchAssignedPatrols();
            }
        } catch (err) {
            console.error(err);
            alert("Failed to assign patrol.");
        }
    };
    
    const getFilteredTimeOptions = (shiftStart, shiftEnd) => {
        if (!shiftStart || !shiftEnd) return timeOptions;
        
        // Get current time
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTotalMinutes = currentHours * 60 + currentMinutes;
        
        // Convert shift times to 24-hour format for easier comparison
        const convertToMinutes = (timeStr) => {
            const [time, period] = timeStr.split(' ');
            const [hours, minutes] = time.split(':').map(Number);
            let total = hours * 60 + minutes;
            if (period === 'PM' && hours !== 12) total += 12 * 60;
            if (period === 'AM' && hours === 12) total -= 12 * 60;
            return total;
        };

        const startMinutes = convertToMinutes(shiftStart);
        const endMinutes = convertToMinutes(shiftEnd);
        
        return timeOptions.filter(time => {
            const [timeStr, period] = time.split(' ');
            const [hours, minutes] = timeStr.split(':').map(Number);
            let total = hours * 60 + minutes;
            if (period === 'PM' && hours !== 12) total += 12 * 60;
            if (period === 'AM' && hours === 12) total -= 12 * 60;
            
            // Check if time is within shift hours AND not in the past
            return total >= startMinutes && 
                   total <= endMinutes && 
                   total >= currentTotalMinutes;
        });
    };

    const hasOverlappingAssignments = (userId, newStartDate, newEndDate, newStartTime, newEndTime) => {
        // Convert time strings to minutes for easier comparison
        const timeToMinutes = (timeStr) => {
            const [time, period] = timeStr.split(' ');
            const [hours, minutes] = time.split(':').map(Number);
            let total = hours * 60 + minutes;
            if (period === 'PM' && hours !== 12) total += 12 * 60;
            if (period === 'AM' && hours === 12) total -= 12 * 60;
            return total;
        };

        const newStartMinutes = timeToMinutes(newStartTime);
        const newEndMinutes = timeToMinutes(newEndTime);
        const newStartDateObj = new Date(newStartDate);
        const newEndDateObj = new Date(newEndDate);

        return assignedPatrols.some(assignment => {
            // Skip if assignment or userId is null
            if (!assignment || !assignment.userId || !assignment.userId._id) return false;
            
            // Skip if not the same user
            if (assignment.userId._id !== userId) return false;

            const assignmentStartDate = new Date(assignment.startDate);
            const assignmentEndDate = new Date(assignment.endDate);
            
            // Check if date ranges overlap
            if (newStartDateObj > assignmentEndDate || newEndDateObj < assignmentStartDate) {
                return false;
            }

            // If dates overlap, check time ranges
            const assignmentStartMinutes = timeToMinutes(assignment.StartedAt);
            const assignmentEndMinutes = timeToMinutes(assignment.EndedAt);

            return !(newEndMinutes <= assignmentStartMinutes || newStartMinutes >= assignmentEndMinutes);
        });
    };

    const handleSubmit = () => {
        const payload = {
            Name: patrolName,
            Location: selectedThird,
            CheckPoints: checkpoints.map(cp => ({
                Name: cp.name,
                Location: { 
                    lat: cp.location.lat,
                    lng: cp.location.lng,
                    latitude: cp.location.lat,
                    longitude: cp.location.lng
                },
                Waypoints: cp.waypoints.map(wp => ({
                    Name: wp.name,
                    Coordinates: { 
                        lat: wp.coordinates.lat,
                        lng: wp.coordinates.lng,
                        latitude: wp.coordinates.lat,
                        longitude: wp.coordinates.lng
                    },
                    selfieRequired: wp.selfieRequired
                }))
            }))
        };

        axios.post('https://api.avessecurity.com/api/Patrol/create', payload, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(() => {
            alert('Patrol created successfully!');
            setShowFormCanvas(false);
            fetchPatrols();
        })
        .catch(err => console.error('Submit error:', err));
    };

    const handleDeletePatrol = async (patrolId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this patrol?");
        if (!confirmDelete) return;

        try {
            await axios.delete(
                `https://api.avessecurity.com/api/Patrol/deletePatrol/${patrolId}`, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Patrol deleted successfully");
            setPatrols(patrols.filter(patrol => patrol._id !== patrolId));
        } catch (error) {
            console.error("Error deleting patrol:", error);
            alert("Error deleting patrol");
        }
    };

    const handleDeleteAssignpatrol = async (assignmentId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this patrol?");
        if (!confirmDelete) return;
        try {
            await axios.delete(
                `https://api.avessecurity.com/api/Patrol/deleteAssignPatrol/${assignmentId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Patrol assignment deleted successfully");
            fetchAssignedPatrols();
        } catch(err) {
            console.error('Submit error:', err);
            alert("Failed to delete patrol assignment.");
        }
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

    const openAssignCanvas = (patrolId) => {
        setSelectedPatrolToAssign(patrolId);
        setSelectedShift('');
        setSelectedUser('');
        setShiftAssignedUsers([]);
        setShowAssignCanvas(true);
    };

    const getSelectedPrimary = () => locations.find(loc => loc._id === selectedPrimary);
    const getSelectedSecondary = () => getSelectedPrimary()?.SecondaryLocation.find(sec => sec._id === selectedSecondary);
    const thirdLocations = getSelectedSecondary()?.ThirdLocation || [];

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Patrols</h4>
                <button className="btn btn-primary" onClick={openFormCanvas}>Add Patrol</button>
            </div>

            {/* Patrols Table */}
            <div className="table-responsive mb-5">
                <table className="table custom-table">
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
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeletePatrol(patrol._id)}>
                                        <i className="bi bi-trash"></i>
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
                <table className="table custom-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Patrol</th>
                            <th>StartDate</th>
                            <th>EndDate</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignedPatrols.map(assignment => (
                            <tr key={assignment._id}>
                                <td>{assignment?.userId ? assignment?.userId.Name : 'Unknown User'}</td>
                                <td>{assignment?.PatrolSet ? assignment?.PatrolSet.Name : 'Unknown Patrol'}</td>
                                <td>{new Date(assignment.startDate).toLocaleDateString('en-GB')}</td>
                                <td>{new Date(assignment.endDate).toLocaleDateString('en-GB')}</td>
                                <td>{assignment.StartedAt}</td>
                                <td>{assignment.EndedAt}</td>
                                <td>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteAssignpatrol(assignment._id)}>
                                        <i className="bi bi-trash"></i> Delete
                                    </button>
                                    </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Assign Patrol Off-Canvas */}
            <div className={`offcanvas offcanvas-end ${showAssignCanvas ? 'show' : ''}`} style={{ visibility: showAssignCanvas ? 'visible' : 'hidden' }}>
    <div className="offcanvas-header">
        <h5>Assign Patrol</h5>
        <button className="btn-close" onClick={() => setShowAssignCanvas(false)}></button>
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
                {shifts.map(shift => (
                    <option key={shift._id} value={shift._id}>
                        {shift.ShiftName} ({shift.ShiftStartTime} - {shift.ShiftEndTime})
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
                    
                    // Auto-fill dates when user is selected
                    const selectedUserData = shiftAssignedUsers.find(u => u.userId === selectedUserId);
                    if (selectedUserData) {
                        setStartDate(selectedUserData.dateRange.startDate.split('T')[0]);
                        setEndDate(selectedUserData.dateRange.endDate.split('T')[0]);
                    }
                }}
                disabled={!selectedShift}
            >
                <option value="">-- Select User --</option>
                {shiftAssignedUsers.map((user) => (
                    <option key={user.userId} value={user.userId}>
                        {user.userName} ({user.designation}) - {user.shiftName} ({user.shiftTime.start} to {user.shiftTime.end})
                    </option>
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
        onChange={e => setStartTime(e.target.value)}
        disabled={!selectedUser}
    >
        <option value="">-- Select Start Time --</option>
        {selectedUser && shiftAssignedUsers.find(u => u.userId === selectedUser) ? (
            getFilteredTimeOptions(
                shiftAssignedUsers.find(u => u.userId === selectedUser).shiftTime.start,
                shiftAssignedUsers.find(u => u.userId === selectedUser).shiftTime.end
            ).map(time => (
                <option key={time} value={time}>{time}</option>
            ))
        ) : (
            timeOptions.map(time => (
                <option key={time} value={time}>{time}</option>
            ))
        )}
    </select>
</div>

<div className="mb-3">
    <label className="form-label">End Time</label>
    <select 
        className="form-select" 
        value={endTime} 
        onChange={e => setEndTime(e.target.value)}
        disabled={!selectedUser}
    >
        <option value="">-- Select End Time --</option>
        {selectedUser && shiftAssignedUsers.find(u => u.userId === selectedUser) ? (
            getFilteredTimeOptions(
                shiftAssignedUsers.find(u => u.userId === selectedUser).shiftTime.start,
                shiftAssignedUsers.find(u => u.userId === selectedUser).shiftTime.end
            ).map(time => (
                <option key={time} value={time}>{time}</option>
            ))
        ) : (
            timeOptions.map(time => (
                <option key={time} value={time}>{time}</option>
            ))
        )}
    </select>
</div>

        <button
            className="btn btn-primary"
            onClick={handleAssignPatrol}
            disabled={!selectedUser || !startDate || !endDate || !startTime || !endTime}
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
                        <input 
                            type="text" 
                            className="form-control" 
                            value={patrolName} 
                            onChange={e => setPatrolName(e.target.value)} 
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Primary Location</label>
                        <select 
                            className="form-select" 
                            value={selectedPrimary} 
                            onChange={e => {
                                setSelectedPrimary(e.target.value);
                                setSelectedSecondary('');
                                setSelectedThird('');
                            }}
                        >
                            <option value="">-- Select Primary --</option>
                            {locations.map(loc => (
                                <option key={loc._id} value={loc._id}>{loc.PrimaryLocation}</option>
                            ))}
                        </select>
                    </div>

                    {selectedPrimary && (
                        <div className="mb-3">
                            <label className="form-label">Secondary Location</label>
                            <select 
                                className="form-select" 
                                value={selectedSecondary} 
                                onChange={e => {
                                    setSelectedSecondary(e.target.value);
                                    setSelectedThird('');
                                }}
                            >
                                <option value="">-- Select Secondary --</option>
                                {getSelectedPrimary()?.SecondaryLocation.map(sec => (
                                    <option key={sec._id} value={sec._id}>
                                        {sec.SecondaryLocation} - {sec.SubLocation}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {selectedSecondary && (
                        <div className="mb-3">
                            <label className="form-label">Third Location</label>
                            <select 
                                className="form-select" 
                                value={selectedThird} 
                                onChange={e => setSelectedThird(e.target.value)}
                            >
                                <option value="">-- Select Third --</option>
                                {thirdLocations.map(third => (
                                    <option key={third._id} value={third._id}>
                                        {third.ThirdLocation} - {third.SubLocation}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="mb-3">
                        <label className="form-label">Checkpoints</label>
                        <MapContainer zoom={13} style={{ height: '400px' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <SetViewToCurrentLocation />
                            <LocationMarker onMapClick={handleMapClick} />
                            
                            {checkpoints.map((cp, index) => (
                                <Marker 
                                    key={index} 
                                    position={[cp.location.lat, cp.location.lng]} 
                                    icon={redIcon}
                                >
                                    <Popup>
                                        <strong>{cp.name}</strong><br />
                                        <button 
                                            className="btn btn-sm btn-primary mt-1" 
                                            onClick={() => handleSelectCheckpoint(index)}
                                        >
                                            Add Waypoints
                                        </button>
                                    </Popup>
                                </Marker>
                            ))}

                            {checkpoints.flatMap(cp => cp.waypoints).map((wp, idx) => (
                                <Marker 
                                    key={`wp-${idx}`} 
                                    position={[wp.coordinates.lat, wp.coordinates.lng]} 
                                    icon={greenIcon}
                                >
                                    <Popup>{wp.name}</Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>

                    <div className="d-flex justify-content-between">
                        <button className="btn btn-primary" onClick={handleSubmit}>Submit Patrol</button>
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

            {/* Point Name Popup Modal */}
            {showNamePopup && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Enter {isWaypoint ? 'Waypoint' : 'Checkpoint'} Name</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowNamePopup(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newPointName}
                                    onChange={(e) => setNewPointName(e.target.value)}
                                    placeholder="Enter name"
                                />
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowNamePopup(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary" 
                                    onClick={handleAddPoint}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                                                        <p><strong>{waypoint.Name}</strong></p>
                                                                        <p>
                                                                            Coordinates: 
                                                                            {waypoint.Coordinates ? 
                                                                                `Lat: ${waypoint.Coordinates.lat || waypoint.Coordinates.latitude}, 
                                                                                Lng: ${waypoint.Coordinates.lng || waypoint.Coordinates.longitude}` : 
                                                                                'Coordinates not available'}
                                                                        </p>
                                                                        <p>Selfie Required: {waypoint.selfieRequired ? 'Yes' : 'No'}</p>
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
        </div>
    );
}

export default Patrol;