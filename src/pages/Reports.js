import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { Modal, Button, Spinner } from "react-bootstrap";
import debounce from "lodash/debounce";
import { jwtDecode } from "jwt-decode";

function Reports() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [endDate, setEndDate] = useState('');
  const [username, setUsername] = useState(null);
  const [userId, setUserId] = useState(null);  
  const [LocationId, setLocationId] = useState(null);
  const [Status, setStatus] = useState(null);
  const [Department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Dropdown options state
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Good', label: 'Good' },
    { value: 'Faulty', label: 'Faulty' },
    { value: 'Pending', label: 'Pending' }
  ];

  const token = localStorage.getItem("access_token");
  
  useEffect(() => {
    // Decode token to get company domain
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        // Set company name from domain in token
        if (decodedToken.domain) {
          setCompanyName(decodedToken.domain);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        setCompanyName('Security System');
      }
    } else {
      // window.location.href = "/login";
    }
    
    // Fetch initial data
    fetchModules();
    fetchDepartments();
    fetchLocations();
    fetchAllUsers();
  }, [token]);

  const fetchModules = async () => {
    try {
      const response = await axios.get(`https://api.avessecurity.com/api/collection/getModule`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (Array.isArray(response.data.dropdown)) {
        const formattedModules = response.data.dropdown.map(item => ({
          value: item.value,
          label: item.label
        }));
        setModules(formattedModules);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        'https://api.avessecurity.com/api/Department/getAll',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

     const departmentOptions = [];
      response.data.forEach(parent => {
        departmentOptions.push({ 
          value: parent.name,
          label: parent.name,
          id: parent._id
        });

        if (parent.children && parent.children.length > 0) {
          parent.children.forEach(child => {
            departmentOptions.push({
              value: child.name,
              label: child.name,
              id: child._id
            });
          });
        }
      });

      setDepartments(departmentOptions);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await axios.get(
        'https://api.avessecurity.com/api/Location/getLocations',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data && response.data.Location) {
        const locationOptions = [];
        
        // Process each location in the response
        response.data.Location.forEach(location => {
          if (!location.PrimaryLocation) return;
          
          // Add primary location
          locationOptions.push({
            value: location._id,
            label: location.PrimaryLocation
          });

          // Process sublocations
          if (location.SubLocation && location.SubLocation.length > 0) {
            location.SubLocation.forEach(subLoc => {
              // State level (PrimarySubLocation)
              const state = subLoc.PrimarySubLocation;
              if (state) {
                locationOptions.push({
                  value: `${location._id}-${subLoc._id}`,
                  label: `${location.PrimaryLocation}, ${state}`
                });
              }

              // Process cities (SecondaryLocation)
              if (subLoc.SecondaryLocation && subLoc.SecondaryLocation.length > 0) {
                subLoc.SecondaryLocation.forEach(city => {
                  const cityName = city.SecondaryLocation;
                  if (cityName) {
                    locationOptions.push({
                      value: `${location._id}-${subLoc._id}-${city._id}`,
                      label: `${location.PrimaryLocation}, ${state}, ${cityName}`
                    });
                  }

                  // Process areas (SecondarySubLocation)
                  if (city.SecondarySubLocation && city.SecondarySubLocation.length > 0) {
                    city.SecondarySubLocation.forEach(area => {
                      const areaName = area.SecondarySubLocation;
                      if (areaName) {
                        locationOptions.push({
                          value: `${location._id}-${subLoc._id}-${city._id}-${area._id}`,
                          label: `${location.PrimaryLocation}, ${state}, ${cityName}, ${areaName}`
                        });
                      }

                      // Process buildings (ThirdLocation)
                      if (area.ThirdLocation && area.ThirdLocation.length > 0) {
                        area.ThirdLocation.forEach(building => {
                          const buildingName = building.ThirdLocation;
                          if (buildingName) {
                            locationOptions.push({
                              value: `${location._id}-${subLoc._id}-${city._id}-${area._id}-${building._id}`,
                              label: `${location.PrimaryLocation}, ${state}, ${cityName}, ${areaName}, ${buildingName}`
                            });
                          }

                          // Process floors (ThirdSubLocation)
                          const floorName = building.ThirdSubLocation;
                          if (floorName) {
                            locationOptions.push({
                              value: `${location._id}-${subLoc._id}-${city._id}-${area._id}-${building._id}-floor`,
                              label: `${location.PrimaryLocation}, ${state}, ${cityName}, ${areaName}, ${buildingName}, ${floorName}`
                            });
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
        
        setLocations(locationOptions);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchLocationSuggestions = debounce(async (query) => {
    if (!query) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }
    
    try {
      const response = await axios.get(
        'https://api.avessecurity.com/api/Location/getLocations',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data && response.data.Location) {
        const suggestions = new Set();
        
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

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(
        "https://api.avessecurity.com/api/Designation/getDropdown",
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data && response.data.Report) {
        const userOptions = response.data.Report.map(user => ({
          value: user._id,
          label: user.username
        }));
        setUsers(userOptions);
      }
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  };

  const fetchUsers = debounce(async (query) => {
    if (!query) return;
    try {
      const response = await axios.get(
        `https://api.avessecurity.com/api/Designation/getDropdown/${query}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data && response.data.Report) {
        const userOptions = response.data.Report.map((user) => ({
          value: user.username,
          label: user.username,
        }));
        setUsers(userOptions);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, 500);

  const validateDates = () => {
    if (!startDate || !endDate) {
      setError("Both start and end dates are required");
      return false;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError("End date cannot be before start date");
      return false;
    }
    setError('');
    return true;
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompanyLogo(file);
      
      // Create a preview URL for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

 const handlePreview = async () => {         
    if (!validateDates()) return;
    if (!selectedModule) {
      setError("Please select a module");
      return;
    }

    setLoading(true);
    setError('');

    // Format dates for backend - DON'T convert to ISO string and split
    // Just use the original date strings as they're already in YYYY-MM-DD format
    const formattedStartDate = startDate;
    const formattedEndDate = endDate;

    // Create FormData to handle file upload for preview
    const formData = new FormData();
    formData.append('startDate', formattedStartDate);
    formData.append('endDate', formattedEndDate);
    formData.append('username', username?.value || '');
    formData.append('userId', userId?.value || '');
    formData.append('LocationId', LocationId?.value || '');
    formData.append('Status', Status?.value || '');
    formData.append('Department', Department?.value || '');
    formData.append('companyName', companyName);
    formData.append('Location', LocationId?.label || '');
    
    if (companyLogo) {
      formData.append('companyLogo', companyLogo);
    }

    try {
      const response = await axios.post(
        `https://api.avessecurity.com/api/ReportGenrate/data/${selectedModule.value}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          }
        }
      );

      console.log('Reponse and Preview Data',response.data)
      setPreviewHtml(response.data);
      setReportData(response.data);
      setShowPreview(true);
    } catch (error) {
      console.error("Error previewing report:", error);
      setError(error.response?.data?.message || "Failed to preview report");
    } finally {
      setLoading(false);
    }
  };
  const handleGeneratePdf = async () => {
    if (!validateDates()) return;
    if (!selectedModule) {
      setError("Please select a module");
      return;
    }

    setLoading(true);
    setError('');

    // Create FormData to handle file upload
    const formData = new FormData();
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    formData.append('username', username?.value || '');
    formData.append('LocationId', LocationId?.value || '');
    formData.append('Status', Status?.value || '');
    formData.append('Department', Department?.value || '');
    formData.append('companyName', companyName);
    
    if (companyLogo) {
      formData.append('companyLogo', companyLogo);
    }

    try {
      const response = await axios.post(
        `https://api.avessecurity.com/api/ReportGenrate/Pdf/${selectedModule.value}`,
        formData,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          }
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${selectedModule.label}_Report_${new Date().toISOString().slice(0,10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError(error.response?.data?.message || "Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle location input change
  const handleLocationInputChange = (inputValue, { action }) => {
    if (action === "input-change") {
      setLocationInput(inputValue);
      fetchLocationSuggestions(inputValue);
    }
  };

  // Function to handle location selection from suggestions
  const handleLocationSelect = (selectedOption) => {
    setLocationId(selectedOption);
    setShowLocationSuggestions(false);
  };

  // Function to handle row click and show detailed view
  const handleRowClick = (record) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  // Function to render images in the detail view
  const renderImages = (images) => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return <div>No Images Available</div>;
    }

    return images.map((src, index) => {
      // Remove any leading "uploads/" from src to avoid duplication
      const cleanSrc = src.replace(/^uploads\//, '');
      const imgSrc = src.startsWith('http') ? src : `https://api.avessecurity.com/uploads/${cleanSrc}`;
      
      return (
        <div key={index} className="mb-2 me-2 d-inline-block">
          <img 
            src={imgSrc} 
            alt={`Evidence ${index + 1}`} 
            style={{ 
              maxWidth: '200px', 
              maxHeight: '150px', 
              border: '1px solid #ddd',
              borderRadius: '4px'
            }} 
            className="img-thumbnail"
          />
        </div>
      );
    });
  };

  // Function to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return !isNaN(d) ? d.toLocaleDateString() : 'N/A';
  };

  // Function to format time
  const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return !isNaN(d) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
  };

  return (
    <div className="container-fluid py-4">
      {loading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          zIndex: 1050 
        }}>
          <div className="text-center bg-white p-4 rounded shadow">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 mb-0">Processing report...</p>
          </div>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">
            <i className="bi bi-file-earmark-bar-graph me-2"></i>
            Report Generator
          </h5>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger mb-4">
              {error}
            </div>
          )}

          <div className="row g-3">
            {/* Company Name from Token */}
            <div className="col-md-6">
              <label className="form-label fw-bold">Company Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={companyName} 
                readOnly
                disabled
              />
              <small className="text-muted">Company name is the WaterMark of pdf</small>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Company Logo</label>
              <input 
                type="file" 
                className="form-control" 
                accept="image/*" 
                onChange={handleLogoChange}
              />
              {logoPreview && (
                <div className="mt-2">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    style={{ maxWidth: '100px', maxHeight: '100px' }} 
                    className="img-thumbnail"
                  />
                </div>
              )}
            </div>
            
            <div className="col-md-12">
              <label className="form-label fw-bold">Module</label>
              <Select
                options={modules}
                value={selectedModule}
                onChange={setSelectedModule}
                placeholder="Select report module..."
                isSearchable
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Start Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                max={endDate || undefined}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">End Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Checked By</label>
              <Select
                options={users}
                value={username}
                onChange={setUsername}
                onInputChange={(inputValue) => {
                  setUserInput(inputValue);
                  fetchUsers(inputValue);
                }}
                placeholder="Search user..."
                isClearable
                isSearchable
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Location</label>
              <Select
                options={locations}
                value={LocationId}
                onChange={handleLocationSelect}
                onInputChange={handleLocationInputChange}
                placeholder="Search location..."
                isClearable
                isSearchable
              />
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <div className="mt-1 p-2 border rounded bg-white" style={{ position: 'absolute', zIndex: 10, width: '100%' }}>
                  {locationSuggestions.map((suggestion, index) => (
                    <div 
                      key={index} 
                      className="p-1 cursor-pointer hover-bg-light"
                      onClick={() => handleLocationSelect({ value: suggestion, label: suggestion })}
                      style={{ cursor: 'pointer' }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Status</label>
              <Select
                options={statusOptions}
                value={Status}
                onChange={setStatus}
                placeholder="Select status..."
                isClearable
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-bold">Department</label>
              <Select
                options={departments}
                value={Department}
                onChange={setDepartment}
                placeholder="Select department..."
                isClearable
                isSearchable
              />
            </div>

            <div className="col-md-12 mt-4 d-flex justify-content-end gap-2">
              <button 
                type="button" 
                className="btn btn-primary px-4" 
                onClick={handlePreview}
                disabled={!selectedModule || loading}
              >
                <i className="bi bi-eye me-1"></i> Preview Report
              </button>
              <button 
                type="button" 
                className="btn btn-success px-4" 
                onClick={handleGeneratePdf}
                disabled={!selectedModule || loading}
              >
                <i className="bi bi-file-earmark-pdf me-1"></i> Generate PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="xl" centered scrollable>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <i className="bi bi-file-earmark-text me-2"></i>
            {selectedModule?.label} Report Preview
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            <i className="bi bi-x-circle me-1"></i> Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Detail View Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <i className="bi bi-info-circle me-2"></i>
            Report Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {selectedRecord ? (
            <div className="container-fluid">
              <div className="row mb-3">
                <div className="col-md-6">
                  <h6 className="text-muted">Location</h6>
                  <p>{selectedRecord.Location || 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <h6 className="text-muted">Status</h6>
                  <p>
                    <span className={`badge ${
                      selectedRecord.Status === 'Good' ? 'bg-success' : 
                      selectedRecord.Status === 'Faulty' ? 'bg-danger' : 'bg-secondary'
                    }`}>
                      {selectedRecord.Status || 'N/A'}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <h6 className="text-muted">Reported By</h6>
                  <p>{selectedRecord.ReportedBy || 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <h6 className="text-muted">Reported Date & Time</h6>
                  <p>{formatDate(selectedRecord.ReportedDate)} {selectedRecord.ReportedTime || ''}</p>
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <h6 className="text-muted">Reported To</h6>
                  <p>{selectedRecord.ReportedTo || 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <h6 className="text-muted">Action Reason</h6>
                  <p>{selectedRecord.ActionReason || 'N/A'}</p>
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-12">
                  <h6 className="text-muted">Fault Images</h6>
                  <div className="d-flex flex-wrap">
                    {renderImages(selectedRecord.FaultImage)}
                  </div>
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <h6 className="text-muted">Action By</h6>
                  <p>{selectedRecord.ActionBy || 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <h6 className="text-muted">Action Date & Time</h6>
                  <p>{formatDate(selectedRecord.ActionDate)} {selectedRecord.ActionTime || ''}</p>
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-12">
                  <h6 className="text-muted">Acknowledged Images</h6>
                  <div className="d-flex flex-wrap">
                    {renderImages(selectedRecord.AcknowledgedImage)}
                  </div>
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <h6 className="text-muted">Reviewed By</h6>
                  <p>{selectedRecord.ReviewedBy || 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <h6 className="text-muted">Reviewed Date & Time</h6>
                  <p>{formatDate(selectedRecord.ReviewedDate)} {selectedRecord.ReviewedTime || ''}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p>No record selected</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            <i className="bi bi-x-circle me-1"></i> Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Reports;