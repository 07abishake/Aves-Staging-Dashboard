import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Offcanvas } from 'bootstrap';

export function LocationInfo() {
  const [locations, setLocations] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [formData, setFormData] = useState({
    SelectedLocation: '',
    StorageArea: '',
  });
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [formCanvas, setFormCanvas] = useState(null);
  const [viewCanvas, setViewCanvas] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchLocations();
    fetchLocationOptions();
    setFormCanvas(new Offcanvas(document.getElementById('locationFormCanvas')));
    setViewCanvas(new Offcanvas(document.getElementById('locationViewCanvas')));
  }, []);

  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = locationOptions.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
      setShowDropdown(true);
    } else {
      setFilteredOptions([]);
      setShowDropdown(false);
    }
  }, [searchTerm, locationOptions]);

  const token = localStorage.getItem("access_token");
    if (!token) {
        // window.location.href = "/login";
    }


  const fetchLocations = async () => {
    try {
      const res = await axios.get('https://api.avessecurity.com/api/inventory/Locaton-Info', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      const data = res.data;

      // Ensure we always get an array
      if (Array.isArray(data)) {
        setLocations(data);
      } else if (Array.isArray(data.locations)) {
        setLocations(data.locations);
      } else {
        console.error('Unexpected response structure:', data);
        setLocations([]);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    }
  };

  const fetchLocationOptions = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('https://api.avessecurity.com/api/Location/getLocations', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const options = [];

      if (res.data?.Location && Array.isArray(res.data.Location)) {
        res.data.Location.forEach(location => {
          const primary = `${location.PrimaryLocation} > ${location.SubLocation}`;
          options.push(primary);

          location.SecondaryLocation?.forEach(secondary => {
            const secondaryPath = `${primary} > ${secondary.SecondaryLocation} > ${secondary.SubLocation}`;
            options.push(secondaryPath);

            secondary.ThirdLocation?.forEach(third => {
              const thirdPath = `${secondaryPath} > ${third.ThirdLocation} > ${third.SubLocation}`;
              options.push(thirdPath);
            });
          });
        });
      }

      setLocationOptions(options);
    } catch (error) {
      console.error('Error fetching location options:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      SelectedLocation: '',
      StorageArea: '',
    });
    setSearchTerm('');
    setIsEdit(false);
    setEditId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value === '') {
      setFormData(prev => ({ ...prev, SelectedLocation: '' }));
    }
  };

  const selectLocation = (location) => {
    setFormData(prev => ({ ...prev, SelectedLocation: location }));
    setSearchTerm(location);
    setShowDropdown(false);
  };

  const handleCreate = () => {
    resetForm();
    formCanvas?.show();
  };

  const handleEdit = (location) => {
    setFormData({
      SelectedLocation: location.SelectedLocation || '',
      StorageArea: location.StorageArea || '',
    });
    setSearchTerm(location.SelectedLocation || '');
    setIsEdit(true);
    setEditId(location._id);
    formCanvas?.show();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.SelectedLocation) {
      alert('Please select a location');
      return;
    }

    try {
      if (isEdit) {
        await axios.put(`https://api.avessecurity.com/api/inventory/Locaton-Info/update/${editId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        await axios.post('https://api.avessecurity.com/api/inventory/Locaton-Info/create', formData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      fetchLocations();
      formCanvas?.hide();
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleView = (location) => {
    setViewData(location);
    viewCanvas?.show();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await axios.delete(`https://api.avessecurity.com/api/inventory/Locaton-Info/delete/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchLocations();
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between mb-3">
        <h2>Location Info</h2>
        <button className="btn btn-primary" onClick={handleCreate}>Add Location</button>
      </div>

      <table className="table table-hover">
        <thead>
          <tr>
            <th>Location/Site</th>
            <th>Storage Area / Locker</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(locations) && locations.map(loc => (
            <tr key={loc._id}>
              <td>{loc.SelectedLocation}</td>
              <td>{loc.StorageArea}</td>
              <td>
                <div className="btn-group">
                  <button className="btn btn-sm btn-primary me-3" onClick={() => handleView(loc)}><i className="bi bi-eye"></i></button>
                  <button className="btn btn-sm btn-secondary me-3" onClick={() => handleEdit(loc)}><i className="bi bi-pencil-square"></i></button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(loc._id)}><i className="bi bi-trash"></i></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Form Offcanvas */}
      <div className="offcanvas offcanvas-end" tabIndex="-1" id="locationFormCanvas">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">{isEdit ? 'Edit Location' : 'Add Location'}</h5>
          <button type="button" className="btn-close" onClick={() => formCanvas?.hide()}></button>
        </div>
        <div className="offcanvas-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Search Location</label>
              <div className="dropdown">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type to search locations..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setShowDropdown(true)}
                />
                {showDropdown && filteredOptions.length > 0 && (
                  <ul className="dropdown-menu show w-100" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {filteredOptions.map((option, index) => (
                      <li key={index}>
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => selectLocation(option)}
                        >
                          {option}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <input
                type="hidden"
                name="SelectedLocation"
                value={formData.SelectedLocation}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Storage Area / Locker</label>
              <input
                type="text"
                className="form-control"
                name="StorageArea"
                value={formData.StorageArea}
                onChange={handleChange}
                required
              />
            </div>

            <div className="d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary me-2"
                onClick={() => formCanvas?.hide()}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {isEdit ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* View Offcanvas */}
      <div className="offcanvas offcanvas-end" tabIndex="-1" id="locationViewCanvas">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Location Details</h5>
          <button type="button" className="btn-close" onClick={() => viewCanvas?.hide()}></button>
        </div>
        <div className="offcanvas-body">
          {viewData && (
            <>
              <p><strong>Location Path:</strong> {viewData.SelectedLocation}</p>
              <p><strong>Storage Area / Locker:</strong> {viewData.StorageArea}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
