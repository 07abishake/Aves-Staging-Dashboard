import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function LocationManager() {
    const [locations, setLocations] = useState([]);
    const [showFormCanvas, setShowFormCanvas] = useState(false);
    const [showViewCanvas, setShowViewCanvas] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);

    // Form state
    const [primaryLocation, setPrimaryLocation] = useState('');
    const [primarySubLocation, setPrimarySubLocation] = useState('');
    const [secondaryLocations, setSecondaryLocations] = useState([
        { SecondaryLocation: '', SubLocation: '', ThirdLocation: [{ ThirdLocation: '', SubLocation: '' }] }
    ]);

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const token = localStorage.getItem('access_token');

            const { data } = await axios.get('http://api.avessecurity.com:6378/api/Location/getLocations', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setLocations(data.Location);
        } catch (err) {
            console.error(err);
        }
    };

    const openFormCanvas = () => {
        setPrimaryLocation('');
        setPrimarySubLocation('');
        setSecondaryLocations([{ SecondaryLocation: '', SubLocation: '', ThirdLocation: [{ ThirdLocation: '', SubLocation: '' }] }]);
        setShowFormCanvas(true);
    };

    const handleDeleteUser = async (userId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this user?");
        if (!confirmDelete) return; // If user clicks 'Cancel', just exit

        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.delete(`http://api.avessecurity.com:6378/api/Location/deleteLocation/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            if (response.status === 200) {
                alert("User deleted successfully");
                setLocations(locations.filter(user => user._id !== userId));
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Error deleting user");
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            PrimaryLocation: primaryLocation,
            SubLocation: primarySubLocation,
            SecondaryLocation: secondaryLocations,
        };

        try {
            const token = localStorage.getItem('access_token');
            await axios.post('http://api.avessecurity.com:6378/api/Location/createLocation', payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });
            alert('Location saved successfully');
            setShowFormCanvas(false);
            fetchLocations();
        } catch (err) {
            console.error(err);
            alert('Error saving location');
        }
    };

    const handleSecondaryChange = (index, field, value) => {
        const updated = [...secondaryLocations];
        updated[index][field] = value;
        setSecondaryLocations(updated);
    };

    const handleThirdChange = (secondaryIndex, thirdIndex, field, value) => {
        const updated = [...secondaryLocations];
        updated[secondaryIndex].ThirdLocation[thirdIndex][field] = value;
        setSecondaryLocations(updated);
    };

    const addSecondary = () => {
        setSecondaryLocations([
            ...secondaryLocations,
            { SecondaryLocation: '', SubLocation: '', ThirdLocation: [{ ThirdLocation: '', SubLocation: '' }] }
        ]);
    };

    const addThird = (index) => {
        const updated = [...secondaryLocations];
        updated[index].ThirdLocation.push({ ThirdLocation: '', SubLocation: '' });
        setSecondaryLocations(updated);
    };

    const removeSecondary = (index) => {
        const updated = [...secondaryLocations];
        updated.splice(index, 1);
        setSecondaryLocations(updated);
    };

    const removeThird = (secondaryIndex, thirdIndex) => {
        const updated = [...secondaryLocations];
        updated[secondaryIndex].ThirdLocation.splice(thirdIndex, 1);
        setSecondaryLocations(updated);
    };

    const openViewCanvas = (location) => {
        setSelectedLocation(location);
        setShowViewCanvas(true);
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Locations</h4>
                <button className="btn btn-primary" onClick={openFormCanvas}>Add Location</button>
            </div>

            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>Primary Location</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {locations.map(loc => (
                        <tr key={loc._id}>
                            <td>{loc.PrimaryLocation}</td>
                            <td>
                                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openViewCanvas(loc)}><i class="bi bi-eye"></i></button>
                                <button className="btn btn-sm btn-outline-warning me-2"><i class="bi bi-pencil-square"></i></button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteUser(loc._id)}><i class="bi bi-trash"></i></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Add Location Off-Canvas */}
            <div className={`offcanvas offcanvas-end ${showFormCanvas ? 'show' : ''}`} style={{ visibility: showFormCanvas ? 'visible' : 'hidden' }}>
                <div className="offcanvas-header">
                    <h5>Add Location</h5>
                    <button className="btn-close" onClick={() => setShowFormCanvas(false)}></button>
                </div>
                <div className="offcanvas-body">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label>Primary Location</label>
                            <input className="form-control" value={primaryLocation} onChange={(e) => setPrimaryLocation(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label>Primary SubLocation</label>
                            <input className="form-control" value={primarySubLocation} onChange={(e) => setPrimarySubLocation(e.target.value)} />
                        </div>

                        {secondaryLocations.map((sec, secIndex) => (
                            <div key={secIndex} className="border p-3 mb-3 rounded position-relative">
                                {secondaryLocations.length > 1 && (
                                    <button type="button" className="btn-close position-absolute top-0 end-0" onClick={() => removeSecondary(secIndex)} />
                                )}
                                <input
                                    className="form-control mb-2"
                                    placeholder="Secondary Location"
                                    value={sec.SecondaryLocation}
                                    onChange={(e) => handleSecondaryChange(secIndex, 'SecondaryLocation', e.target.value)}
                                />
                                <input
                                    className="form-control mb-3"
                                    placeholder="SubLocation"
                                    value={sec.SubLocation}
                                    onChange={(e) => handleSecondaryChange(secIndex, 'SubLocation', e.target.value)}
                                />

                                {sec.ThirdLocation.map((third, thirdIndex) => (
                                    <div key={thirdIndex} className="border p-2 mb-2 rounded position-relative ms-3">
                                        {sec.ThirdLocation.length > 1 && (
                                            <button type="button" className="btn-close position-absolute top-0 end-0" onClick={() => removeThird(secIndex, thirdIndex)} />
                                        )}
                                        <input
                                            className="form-control mb-2"
                                            placeholder="Third Location"
                                            value={third.ThirdLocation}
                                            onChange={(e) => handleThirdChange(secIndex, thirdIndex, 'ThirdLocation', e.target.value)}
                                        />
                                        <input
                                            className="form-control"
                                            placeholder="SubLocation"
                                            value={third.SubLocation}
                                            onChange={(e) => handleThirdChange(secIndex, thirdIndex, 'SubLocation', e.target.value)}
                                        />
                                    </div>
                                ))}
                                <button type="button" className="btn btn-sm btn-secondary ms-2" onClick={() => addThird(secIndex)}>Add Third Location</button>
                            </div>
                        ))}

                        <button type="button" className="btn btn-secondary mb-3" onClick={addSecondary}>Add Secondary Location</button>
                        <div>
                            <button type="submit" className="btn btn-primary me-2">Submit</button>
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowFormCanvas(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* View Location Off-Canvas */}
            <div className={`offcanvas offcanvas-end ${showViewCanvas ? 'show' : ''}`} style={{ visibility: showViewCanvas ? 'visible' : 'hidden' }}>
                <div className="offcanvas-header">
                    <h5>View Location</h5>
                    <button className="btn-close" onClick={() => setShowViewCanvas(false)}></button>
                </div>
                <div className="offcanvas-body">
                    {selectedLocation && (
                        <>
                            <h6><strong>Primary Location:</strong> {selectedLocation.PrimaryLocation}</h6>
                            <p><strong>SubLocation:</strong> {selectedLocation.SubLocation}</p>

                            <h6 className="mt-4">Secondary Locations</h6>
                            <ol className="ps-3">
                                {selectedLocation.SecondaryLocation.map((sec, idx) => (
                                    <li key={idx} className="mb-3">
                                        <div className="accordion" id={`accordion-secondary-${idx}`}>
                                            <div className="accordion-item">
                                                <h2 className="accordion-header" id={`heading-secondary-${idx}`}>
                                                    <button
                                                        className="accordion-button collapsed"
                                                        type="button"
                                                        data-bs-toggle="collapse"
                                                        data-bs-target={`#collapse-secondary-${idx}`}
                                                        aria-expanded="false"
                                                        aria-controls={`collapse-secondary-${idx}`}
                                                    >
                                                        {sec.SecondaryLocation}
                                                    </button>
                                                </h2>
                                                <div
                                                    id={`collapse-secondary-${idx}`}
                                                    className="accordion-collapse collapse"
                                                    aria-labelledby={`heading-secondary-${idx}`}
                                                    data-bs-parent={`#accordion-secondary-${idx}`}
                                                >
                                                    <div className="accordion-body">
                                                        <p><strong>Secondary Location:</strong> {sec.SecondaryLocation}</p>
                                                        <p><strong>Sub Secondary Location:</strong> {sec.SubLocation}</p>

                                                        <h6 className="mt-3">Third Locations</h6>
                                                        {sec.ThirdLocation.length > 0 ? (
                                                            <ol className="ps-3">
                                                                {sec.ThirdLocation.map((third, thirdIdx) => (
                                                                    <li key={thirdIdx} className="mb-2">
                                                                        <div className="accordion" id={`accordion-third-${idx}-${thirdIdx}`}>
                                                                            <div className="accordion-item">
                                                                                <h2 className="accordion-header" id={`heading-third-${idx}-${thirdIdx}`}>
                                                                                    <button
                                                                                        className="accordion-button collapsed"
                                                                                        type="button"
                                                                                        data-bs-toggle="collapse"
                                                                                        data-bs-target={`#collapse-third-${idx}-${thirdIdx}`}
                                                                                        aria-expanded="false"
                                                                                        aria-controls={`collapse-third-${idx}-${thirdIdx}`}
                                                                                    >
                                                                                        {third.ThirdLocation}
                                                                                    </button>
                                                                                </h2>
                                                                                <div
                                                                                    id={`collapse-third-${idx}-${thirdIdx}`}
                                                                                    className="accordion-collapse collapse"
                                                                                    aria-labelledby={`heading-third-${idx}-${thirdIdx}`}
                                                                                    data-bs-parent={`#accordion-third-${idx}-${thirdIdx}`}
                                                                                >
                                                                                    <div className="accordion-body">
                                                                                        <p><strong>Third Location:</strong> {third.ThirdLocation}</p>
                                                                                        <p><strong>Sub Third Location:</strong> {third.SubLocation}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ol>
                                                        ) : (
                                                            <p className="text-muted">No Third Locations</p>
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

export default LocationManager;
