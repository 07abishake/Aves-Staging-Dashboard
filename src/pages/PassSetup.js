import React, { useEffect, useState } from 'react';
import axios from 'axios';
 
function PassSetup() {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [color, setColor] = useState('#ff0000');
  const [passes, setPasses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showCanvas, setShowCanvas] = useState(false);
  const [editPass, setEditPass] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLocation, setEditLocation] = useState('');
 
  const token = localStorage.getItem('access_token');
 
  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchLocations();
    fetchPasses();
  }, []);
 
  const fetchLocations = async () => {
    try {
      const res = await axios.get('https://api.avessecurity.com/api/Location/getLocations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nested = res.data?.Location || [];
      const flattened = flattenLocations(nested);
      setLocations(flattened);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };
 
  const flattenLocations = (data) => {
    const result = [];
    data.forEach((primary) => {
      result.push({ label: primary.PrimaryLocation, id: primary._id });
      primary.SecondaryLocation?.forEach((secondary) => {
        result.push({
          label: `${primary.PrimaryLocation} > ${secondary.SubLocation}`,
          id: secondary._id,
        });
        secondary.ThirdLocation?.forEach((third) => {
          result.push({
            label: `${primary.PrimaryLocation} > ${secondary.SubLocation} > ${third.ThirdLocation}`,
            id: third._id,
          });
        });
      });
    });
    return result;
  };
 
  const fetchPasses = async () => {
    try {
      const res = await axios.get('https://api.avessecurity.com/api/Color/get', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPasses(res.data.CustomColorSet || []);
    } catch (error) {
      console.error('Failed to fetch color passes:', error);
    }
  };
 
  const handleCreate = async () => {
    if (!selectedLocation) {
      alert('Please select a location');
      return;
    }
    const selectedLabel = locations.find(loc => loc.id === selectedLocation)?.label || 'Untitled';
 
    try {
      await axios.post(
        'https://api.avessecurity.com/api/Color/create',
        {
          title: selectedLabel,
          CustomColor: color,
          Hexa: color.replace('#', ''),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert('Pass created');
      setSelectedLocation('');
      setColor('#ff0000');
      fetchPasses();
    } catch (error) {
      console.error('Failed to create color pass:', error);
      alert('Failed to create pass');
    }
  };
 
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure to delete this pass?')) return;
    try {
      await axios.delete(`https://api.avessecurity.com/api/Color/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPasses();
    } catch (error) {
      console.error('Failed to delete pass:', error);
    }
  };
 
  const handleEdit = (pass) => {
    setEditPass(pass);
    setColor(`#${pass.Hexa}`);
    const matchedLocation = locations.find(loc => loc.label === pass.title);
    setEditLocation(matchedLocation ? matchedLocation.id : '');
    setShowEditModal(true);
  };
 
  const handleUpdate = async () => {
    if (!editPass) return;
    const selectedLabel = locations.find(loc => loc.id === editLocation)?.label || editPass.title;
    try {
      await axios.put(
        `https://api.avessecurity.com/api/Color/update/${editPass._id}`,
        {
          title: selectedLabel,
          CustomColor: color,
          Hexa: color.replace('#', ''),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert('Pass updated');
      setEditPass(null);
      setColor('#ff0000');
      setEditLocation('');
      setShowEditModal(false);
      fetchPasses();
    } catch (error) {
      console.error('Failed to update pass:', error);
      alert('Failed to update pass');
    }
  };
 
  const toggleCanvas = () => setShowCanvas(!showCanvas);
 
  return (
    <div className="container mt-5 text-black">
      <div className="row">
        <div className="col-lg-6 col-md-8">
          <div className="card border border-dark shadow p-4 rounded-4">
            <h4 className="mb-4 fw-bold">Pass Setup</h4>
 
            <div className="mb-3">
              <label className="form-label fw-bold">Location</label>
              <select
                className="form-select border border-dark"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="">Select Location</option>
                {locations.map((loc, index) => (
                  <option key={index} value={loc.id}>{loc.label}</option>
                ))}
              </select>
            </div>
 
            <div className="mb-3">
              <label className="form-label fw-bold">Choose Color</label><br />
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="color-picker"
              />
              <div className="mt-2">Selected HEX Code: <strong>{color}</strong></div>
            </div>
 
            <div className="d-flex gap-2">
              <button className="btn btn-primary fw-bold" onClick={handleCreate}>+ Create</button>
              <button className="btn btn-outline-danger fw-bold" onClick={toggleCanvas}>View Created Passes</button>
            </div>
          </div>
        </div>
      </div>
 
      {/* Offcanvas */}
      <div
        className={`offcanvas offcanvas-end ${showCanvas ? 'show' : ''}`}
        tabIndex="-1"
        style={{ visibility: showCanvas ? 'visible' : 'hidden', backgroundColor: 'white' }}
      >
        <div className="offcanvas-header border-bottom border-dark">
          <h5 className="offcanvas-title">Created Passes</h5>
          <button type="button" className="btn-close" onClick={toggleCanvas}></button>
        </div>
        <div className="offcanvas-body">
          {Array.isArray(passes) && passes.length > 0 ? (
            <ul className="list-group">
              {passes.map((pass) => (
                <li key={pass._id} className="list-group-item shadow-sm rounded-3 mb-2 border border-dark text-black">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{pass.title}</strong><br />
                      <span className="badge rounded-pill" style={{ backgroundColor: `#${pass.Hexa}` }}>#{pass.Hexa}</span>
                    </div>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(pass)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(pass._id)}>Delete</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No passes created.</p>
          )}
        </div>
      </div>
 
      {/* Edit Modal */}
      {showEditModal && editPass && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Pass</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label fw-bold">Select Location</label>
                <select
                  className="form-select border border-dark mb-3"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                >
                  <option value="">Select Location</option>
                  {locations.map((loc, index) => (
                    <option key={index} value={loc.id}>{loc.label}</option>
                  ))}
                </select>
 
                <label className="form-label fw-bold">Choose New Color</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="form-control form-control-color"
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button className="btn btn-success" onClick={handleUpdate}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 
export default PassSetup;
 
 
 

 