import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Button, Form, Table, Offcanvas, Modal, Alert, Spinner } from 'react-bootstrap';
import Select from 'react-select';

// Debounce function implementation
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Enhanced Location Dropdown Component
const LocationDropdown = ({ value, onChange, showLabel = true }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Selected location IDs at each level
  const [selectedPrimary, setSelectedPrimary] = useState('');
  const [selectedSubPrimary, setSelectedSubPrimary] = useState('');
  const [selectedSecondary, setSelectedSecondary] = useState('');
  const [selectedSubSecondary, setSelectedSubSecondary] = useState('');
  const [selectedTertiary, setSelectedTertiary] = useState('');
  const [selectedSubTertiary, setSelectedSubTertiary] = useState('');

  // Fetch locations on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const { data } = await axios.get('https://codeaves.avessecurity.com/api/Location/getLocations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLocations(data.Location || []);
      } catch (err) {
        setError(err.message || 'Failed to load locations');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // When the external value changes (like in edit mode), parse it to set the selected values
  useEffect(() => {
    if (value && locations.length > 0) {
      // Try to find the location in the hierarchy
      const findLocationInHierarchy = (locations, targetValue) => {
        for (const primary of locations) {
          if (primary.PrimaryLocation === targetValue) {
            setSelectedPrimary(primary._id);
            return;
          }
          
          if (primary.SubLocation) {
            for (const subPrimary of primary.SubLocation) {
              const subPrimaryPath = `${primary.PrimaryLocation} > ${subPrimary.PrimarySubLocation}`;
              if (subPrimaryPath === targetValue) {
                setSelectedPrimary(primary._id);
                setSelectedSubPrimary(subPrimary._id);
                return;
              }
              
              if (subPrimary.SecondaryLocation) {
                for (const secondary of subPrimary.SecondaryLocation) {
                  const secondaryPath = `${primary.PrimaryLocation} > ${subPrimary.PrimarySubLocation} > ${secondary.SecondaryLocation}`;
                  if (secondaryPath === targetValue) {
                    setSelectedPrimary(primary._id);
                    setSelectedSubPrimary(subPrimary._id);
                    setSelectedSecondary(secondary._id);
                    return;
                  }
                  
                  if (secondary.SecondarySubLocation) {
                    for (const subSecondary of secondary.SecondarySubLocation) {
                      const subSecondaryPath = `${primary.PrimaryLocation} > ${subPrimary.PrimarySubLocation} > ${secondary.SecondaryLocation} > ${subSecondary.SecondarySubLocation}`;
                      if (subSecondaryPath === targetValue) {
                        setSelectedPrimary(primary._id);
                        setSelectedSubPrimary(subPrimary._id);
                        setSelectedSecondary(secondary._id);
                        setSelectedSubSecondary(subSecondary._id);
                        return;
                      }
                      
                      if (subSecondary.ThirdLocation) {
                        for (const tertiary of subSecondary.ThirdLocation) {
                          const tertiaryPath = `${primary.PrimaryLocation} > ${subPrimary.PrimarySubLocation} > ${secondary.SecondaryLocation} > ${subSecondary.SecondarySubLocation} > ${tertiary.ThirdLocation}`;
                          if (tertiaryPath === targetValue) {
                            setSelectedPrimary(primary._id);
                            setSelectedSubPrimary(subPrimary._id);
                            setSelectedSecondary(secondary._id);
                            setSelectedSubSecondary(subSecondary._id);
                            setSelectedTertiary(tertiary._id);
                            return;
                          }
                          
                          if (tertiary.ThirdSubLocation) {
                            const subTertiaryPath = `${primary.PrimaryLocation} > ${subPrimary.PrimarySubLocation} > ${secondary.SecondaryLocation} > ${subSecondary.SecondarySubLocation} > ${tertiary.ThirdLocation} > ${tertiary.ThirdSubLocation.ThirdSubLocation}`;
                            if (subTertiaryPath === targetValue) {
                              setSelectedPrimary(primary._id);
                              setSelectedSubPrimary(subPrimary._id);
                              setSelectedSecondary(secondary._id);
                              setSelectedSubSecondary(subSecondary._id);
                              setSelectedTertiary(tertiary._id);
                              setSelectedSubTertiary(tertiary.ThirdSubLocation._id);
                              return;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      
      findLocationInHierarchy(locations, value);
    }
  }, [value, locations]);

  // Helper functions to get selected location objects
  const getSelectedPrimary = () => locations.find(loc => loc._id === selectedPrimary);
  const getSelectedSubPrimary = () => {
    const primary = getSelectedPrimary();
    return primary?.SubLocation?.find(sub => sub._id === selectedSubPrimary);
  };
  const getSelectedSecondary = () => {
    const subPrimary = getSelectedSubPrimary();
    return subPrimary?.SecondaryLocation?.find(sec => sec._id === selectedSecondary);
  };
  const getSelectedSubSecondary = () => {
    const secondary = getSelectedSecondary();
    return secondary?.SecondarySubLocation?.find(subSec => subSec._id === selectedSubSecondary);
  };
  const getSelectedTertiary = () => {
    const subSecondary = getSelectedSubSecondary();
    return subSecondary?.ThirdLocation?.find(ter => ter._id === selectedTertiary);
  };
  const getSelectedSubTertiary = () => {
    const tertiary = getSelectedTertiary();
    return tertiary?.ThirdSubLocation;
  };

  // Handler functions for each dropdown level
  const handlePrimaryChange = (e) => {
    const primaryId = e.target.value;
    setSelectedPrimary(primaryId);
    setSelectedSubPrimary('');
    setSelectedSecondary('');
    setSelectedSubSecondary('');
    setSelectedTertiary('');
    setSelectedSubTertiary('');
    
    const primary = locations.find(loc => loc._id === primaryId);
    if (primary) {
      onChange({ target: { name: 'Location', value: primary.PrimaryLocation } });
    }
  };

  const handleSubPrimaryChange = (e) => {
    const subPrimaryId = e.target.value;
    setSelectedSubPrimary(subPrimaryId);
    setSelectedSecondary('');
    setSelectedSubSecondary('');
    setSelectedTertiary('');
    setSelectedSubTertiary('');
    
    const primary = getSelectedPrimary();
    const subPrimary = primary?.SubLocation?.find(sub => sub._id === subPrimaryId);
    if (primary && subPrimary) {
      onChange({ target: { name: 'Location', value: `${primary.PrimaryLocation} > ${subPrimary.PrimarySubLocation}` } });
    }
  };

  const handleSecondaryChange = (e) => {
    const secondaryId = e.target.value;
    setSelectedSecondary(secondaryId);
    setSelectedSubSecondary('');
    setSelectedTertiary('');
    setSelectedSubTertiary('');
    
    const primary = getSelectedPrimary();
    const subPrimary = getSelectedSubPrimary();
    const secondary = subPrimary?.SecondaryLocation?.find(sec => sec._id === secondaryId);
    if (primary && subPrimary && secondary) {
      onChange({ target: { name: 'Location', value: `${primary.PrimaryLocation} > ${subPrimary.PrimarySubLocation} > ${secondary.SecondaryLocation}` } });
    }
  };

  const handleSubSecondaryChange = (e) => {
    const subSecondaryId = e.target.value;
    setSelectedSubSecondary(subSecondaryId);
    setSelectedTertiary('');
    setSelectedSubTertiary('');
    
    const primary = getSelectedPrimary();
    const subPrimary = getSelectedSubPrimary();
    const secondary = getSelectedSecondary();
    const subSecondary = secondary?.SecondarySubLocation?.find(subSec => subSec._id === subSecondaryId);
    if (primary && subPrimary && secondary && subSecondary) {
      onChange({ target: { name: 'Location', value: `${primary.PrimaryLocation} > ${subPrimary.PrimarySubLocation} > ${secondary.SecondaryLocation} > ${subSecondary.SecondarySubLocation}` } });
    }
  };

  const handleTertiaryChange = (e) => {
    const tertiaryId = e.target.value;
    setSelectedTertiary(tertiaryId);
    setSelectedSubTertiary('');
    
    const primary = getSelectedPrimary();
    const subPrimary = getSelectedSubPrimary();
    const secondary = getSelectedSecondary();
    const subSecondary = getSelectedSubSecondary();
    const tertiary = subSecondary?.ThirdLocation?.find(ter => ter._id === tertiaryId);
    if (primary && subPrimary && secondary && subSecondary && tertiary) {
      onChange({ target: { name: 'Location', value: `${primary.PrimaryLocation} > ${subPrimary.PrimarySubLocation} > ${secondary.SecondaryLocation} > ${subSecondary.SecondarySubLocation} > ${tertiary.ThirdLocation}` } });
    }
  };

  const handleSubTertiaryChange = (e) => {
    const subTertiaryId = e.target.value;
    setSelectedSubTertiary(subTertiaryId);
    
    const primary = getSelectedPrimary();
    const subPrimary = getSelectedSubPrimary();
    const secondary = getSelectedSecondary();
    const subSecondary = getSelectedSubSecondary();
    const tertiary = getSelectedTertiary();
    if (primary && subPrimary && secondary && subSecondary && tertiary && tertiary.ThirdSubLocation) {
      onChange({ target: { name: 'Location', value: `${primary.PrimaryLocation} > ${subPrimary.PrimarySubLocation} > ${secondary.SecondaryLocation} > ${subSecondary.SecondarySubLocation} > ${tertiary.ThirdLocation} > ${tertiary.ThirdSubLocation.ThirdSubLocation}` } });
    }
  };

  // Function to get the full location path as a string
  const getLocationPath = () => {
    let path = [];
    
    const primary = getSelectedPrimary();
    if (primary) path.push(primary.PrimaryLocation);
    
    const subPrimary = getSelectedSubPrimary();
    if (subPrimary) path.push(subPrimary.PrimarySubLocation);
    
    const secondary = getSelectedSecondary();
    if (secondary) path.push(secondary.SecondaryLocation);
    
    const subSecondary = getSelectedSubSecondary();
    if (subSecondary) path.push(subSecondary.SecondarySubLocation);
    
    const tertiary = getSelectedTertiary();
    if (tertiary) path.push(tertiary.ThirdLocation);
    
    const subTertiary = getSelectedSubTertiary();
    if (subTertiary) path.push(subTertiary.ThirdSubLocation);
    
    return path.join(' → ');
  };

  if (loading) {
    return (
      <Form.Group controlId="Location">
        {showLabel && <Form.Label>Location</Form.Label>}
        <div className="d-flex align-items-center">
          <Spinner animation="border" size="sm" className="me-2" />
          <span>Loading locations...</span>
        </div>
      </Form.Group>
    );
  }

  if (error) {
    return (
      <Form.Group controlId="Location">
        {showLabel && <Form.Label>Location</Form.Label>}
        <Alert variant="danger" className="py-1">
          {error}
        </Alert>
      </Form.Group>
    );
  }

  return (
    <Form.Group controlId="Location">
      {showLabel && <Form.Label>Location</Form.Label>}
      
      {/* Display the selected location path */}
      {(selectedPrimary || selectedSubPrimary || selectedSecondary || 
        selectedSubSecondary || selectedTertiary || selectedSubTertiary) && (
        <div className="mb-2 p-2 bg-light rounded">
          <small className="text-muted">Selected: </small>
          <span>{getLocationPath()}</span>
        </div>
      )}
      
      {/* Primary Location Dropdown */}
      <Form.Select 
        className="mb-2"
        value={selectedPrimary}
        onChange={handlePrimaryChange}
      >
        <option value="">Select Primary Location</option>
        {locations.map(loc => (
          <option key={loc._id} value={loc._id}>
            {loc.PrimaryLocation}
          </option>
        ))}
      </Form.Select>

      {/* Sub-Primary Location Dropdown */}
      {selectedPrimary && (
        <Form.Select
          className="mb-2"
          value={selectedSubPrimary}
          onChange={handleSubPrimaryChange}
        >
          <option value="">Select Sub-Primary Location</option>
          {getSelectedPrimary()?.SubLocation?.map(sub => (
            <option key={sub._id} value={sub._id}>
              {sub.PrimarySubLocation}
            </option>
          ))}
        </Form.Select>
      )}

      {/* Secondary Location Dropdown */}
      {selectedSubPrimary && (
        <Form.Select
          className="mb-2"
          value={selectedSecondary}
          onChange={handleSecondaryChange}
        >
          <option value="">Select Secondary Location</option>
          {getSelectedSubPrimary()?.SecondaryLocation?.map(sec => (
            <option key={sec._id} value={sec._id}>
              {sec.SecondaryLocation}
            </option>
          ))}
        </Form.Select>
      )}

      {/* Sub-Secondary Location Dropdown */}
      {selectedSecondary && (
        <Form.Select
          className="mb-2"
          value={selectedSubSecondary}
          onChange={handleSubSecondaryChange}
        >
          <option value="">Select Sub-Secondary Location</option>
          {getSelectedSecondary()?.SecondarySubLocation?.map(subSec => (
            <option key={subSec._id} value={subSec._id}>
              {subSec.SecondarySubLocation}
            </option>
          ))}
        </Form.Select>
      )}

      {/* Tertiary Location Dropdown */}
      {selectedSubSecondary && (
        <Form.Select
          className="mb-2"
          value={selectedTertiary}
          onChange={handleTertiaryChange}
        >
          <option value="">Select Tertiary Location</option>
          {getSelectedSubSecondary()?.ThirdLocation?.map(ter => (
            <option key={ter._id} value={ter._id}>
              {ter.ThirdLocation}
            </option>
          ))}
        </Form.Select>
      )}

      {/* Sub-Tertiary Location Dropdown */}
      {selectedTertiary && getSelectedTertiary()?.ThirdSubLocation && (
        <Form.Select
          value={selectedSubTertiary}
          onChange={handleSubTertiaryChange}
        >
          <option value="">Select Sub-Tertiary Location</option>
          <option value={getSelectedTertiary().ThirdSubLocation._id}>
            {getSelectedTertiary().ThirdSubLocation.ThirdSubLocation}
          </option>
        </Form.Select>
      )}
    </Form.Group>
  );
};

// User Dropdown Component
const UserDropdown = ({ value, onChange, showLabel = true }) => {
  const [users, setUsers] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Debounced fetch function
  const fetchUsers = useCallback(
    debounce(async (query) => {
      if (!query) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
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
            value: user.username,
            label: user.username,
          }));
          setUsers(userOptions);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  // Handle input change
  useEffect(() => {
    if (inputValue) {
      fetchUsers(inputValue);
    }
  }, [inputValue, fetchUsers]);

  // Parse initial value if editing
  useEffect(() => {
    if (value) {
      // If value is a string of comma-separated usernames
      const initialUsers = value.split(',').map(username => ({
        value: username.trim(),
        label: username.trim()
      }));
      setUsers(prev => [...prev, ...initialUsers.filter(user => 
        !prev.some(existing => existing.value === user.value)
      )]);
    }
  }, [value]);

  const handleInputChange = (newValue) => {
    setInputValue(newValue);
  };

  const handleChange = (selectedOptions) => {
    // Convert selected options to comma-separated string
    const valueString = selectedOptions ? selectedOptions.map(option => option.value).join(', ') : '';
    onChange({
      target: {
        name: 'ReportedBy',
        value: valueString
      }
    });
  };

  // Parse current value for the select component
  const getSelectedValues = () => {
    if (!value) return [];
    return value.split(',').map(username => ({
      value: username.trim(),
      label: username.trim()
    }));
  };

  return (
    <Form.Group controlId="ReportedBy">
      {showLabel && <Form.Label>Reported By</Form.Label>}
      <Select
        isMulti
        options={users}
        value={getSelectedValues()}
        onInputChange={handleInputChange}
        onChange={handleChange}
        isLoading={loading}
        placeholder="Type to search users..."
        className="mb-2"
      />
    </Form.Group>
  );
};

// Main OccurrenceManager Component
const OccurrenceManager = () => {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState(null);
  const printRef = useRef();

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('https://codeaves.avessecurity.com/api/DailyOccurance/get', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data?.DailyOccurance || []);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      // Don't send RecordingDate, RecordingTime, and OccurringTime as they're auto-generated
      const { RecordingDate, RecordingTime, OccurringTime, ...formData } = form;
      
      await axios.post('https://codeaves.avessecurity.com/api/DailyOccurance/create', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowCreate(false);
      setForm({});
      fetchData();
    } catch (error) {
      console.error("Error creating occurrence", error);
    }
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditId(item._id);
    setShowEdit(true);
  };

  const handleView = (item) => {
    setViewData(item);
    setShowView(true);
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      // Don't send RecordingDate, RecordingTime, and OccurringTime as they're auto-generated
      const { RecordingDate, RecordingTime, OccurringTime, ...formData } = form;
      
      await axios.put(`https://codeaves.avessecurity.com/api/DailyOccurance/update/${editId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowEdit(false);
      setForm({});
      fetchData();
    } catch (error) {
      console.error("Error updating occurrence", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const token = localStorage.getItem('access_token');
        await axios.delete(`https://codeaves.avessecurity.com/api/DailyOccurance/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchData();
      } catch (error) {
        console.error("Error deleting occurrence", error);
      }
    }
  };

  const handlePrint = (item) => {
    setPrintData(item);
    setShowPrintModal(true);
  };

  const executePrint = () => {
    setShowPrintModal(false);
    setTimeout(() => {
      const printContent = printRef.current;
      const printWindow = window.open('', '_blank');
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Occurrence Report</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .print-footer { text-align: center; margin-top: 30px; border-top: 1px solid #333; padding-top: 10px; font-size: 12px; }
              .detail-row { margin-bottom: 10px; }
              .detail-label { font-weight: bold; }
              @media print {
                body { padding: 0; margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body onload="window.print(); window.onafterprint = function() { window.close(); }">
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      
      printWindow.document.close();
    }, 100);
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold">Daily Occurrence Log</h4>
        <Button variant="primary" onClick={() => setShowCreate(true)}>Add Occurrence</Button>
      </div>

      <div className="p-3 bg-white rounded shadow-sm" style={{ boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)' }}>
        <Table hover responsive className="mb-0">
          <thead className="table-light">
            <tr>
              <th>S.No</th>
              <th>Recording Date & Time</th>
              <th>Occurring Time</th>
              <th>Title</th>
              <th>Followup Required</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={item._id}>
                <td>{i + 1}</td>
                <td>{new Date(item?.RecordingDate).toLocaleDateString()} - {item?.RecordingTime}</td>
                <td>{item?.OccurringTime}</td>
                <td>{item?.NatureOfIncident}</td>
                <td>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontWeight: '500',
                    color: '#000',
                    backgroundColor: item.FollowupRequired === 'Yes' ? '#fff3cd' : '#d4edda',
                    border: item.FollowupRequired === 'Yes' ? '1px solid #ffeeba' : '1px solid #c3e6cb'
                  }}>
                    {item.FollowupRequired === 'Yes' ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>
                  <Button size="sm" variant="outline-secondary" onClick={() => handleView(item)} className="me-1">
                    <i className="bi bi-eye"></i>
                  </Button>
                  <Button size="sm" variant="outline-primary" onClick={() => handleEdit(item)} className="me-1">
                    <i className="bi bi-pencil-square"></i>
                  </Button>
                  <Button size="sm" variant="outline-info" onClick={() => handlePrint(item)} className="me-1">
                    <i className="bi bi-printer"></i>
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => handleDelete(item._id)}>
                    <i className="bi bi-trash"></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* View Offcanvas */}
      <Offcanvas show={showView} onHide={() => setShowView(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Occurrence Details</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {viewData && (
            <>
              <p><strong>Recording Date:</strong> {new Date(viewData?.RecordingDate).toLocaleDateString()}</p>
              <p><strong>Recording Time:</strong> {viewData?.RecordingTime}</p>
              <p><strong>Occurring Time:</strong> {viewData?.OccurringTime}</p>
              <p><strong>Location:</strong> {viewData?.Location}</p>
              <p><strong>Reported By:</strong> {viewData?.ReportedBy}</p>
              <p><strong>Supervisor Name:</strong> {viewData?.SupervisorName || 'N/A'}</p>
              <p><strong>Nature of Incident:</strong> {viewData?.NatureOfIncident}</p>
              <p><strong>Description:</strong> {viewData?.Description}</p>
              <p><strong>Action Taken:</strong> {viewData?.ActionTaken}</p>
              <p><strong>Follow-up Required:</strong> {viewData?.FollowupRequired}</p>
              <p><strong>Supervisor Remarks:</strong> {viewData?.SupervisorNameRemark}</p>
              <Button variant="outline-info" onClick={() => handlePrint(viewData)} className="mt-3">
                <i className="bi bi-printer me-2"></i>Print
              </Button>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      {/* Print Modal */}
      <Modal show={showPrintModal} onHide={() => setShowPrintModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Print Occurrence Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Click the print button below to generate a printable report of this occurrence.</p>
          <div ref={printRef} className="d-none">
            <div className="print-header">
              <h4>Occurrence Report</h4>
              <p>Generated on: {new Date().toLocaleDateString()}</p>
            </div>
            
            {printData && (
              <div className="print-content">
                <div className="row detail-row">
                  <div className="col-4 detail-label">Recording Date:</div>
                  <div className="col-8">{new Date(printData?.RecordingDate).toLocaleDateString()}</div>
                </div>
                <div className="row detail-row">
                  <div className="col-4 detail-label">Recording Time:</div>
                  <div className="col-8">{printData?.RecordingTime}</div>
                </div>
                <div className="row detail-row">
                  <div className="col-4 detail-label">Occurring Time:</div>
                  <div className="col-8">{printData?.OccurringTime}</div>
                </div>
                <div className="row detail-row">
                  <div className="col-4 detail-label">Location:</div>
                  <div className="col-8">{printData?.Location}</div>
                </div>
                <div className="row detail-row">
                  <div className="col-4 detail-label">Reported By:</div>
                  <div className="col-8">{printData?.ReportedBy}</div>
                </div>
                <div className="row detail-row">
                  <div className="col-4 detail-label">Supervisor Name:</div>
                  <div className="col-8">{printData?.SupervisorName || 'N/A'}</div>
                </div>
                <div className="row detail-row">
                  <div className="col-4 detail-label">Nature of Incident:</div>
                  <div className="col-8">{printData?.NatureOfIncident}</div>
                </div>
                <div className="row detail-row">
                  <div className="col-4 detail-label">Description:</div>
                  <div className="col-8">{printData?.Description}</div>
                </div>
                <div className="row detail-row">
                  <div className="col-4 detail-label">Action Taken:</div>
                  <div className="col-8">{printData?.ActionTaken}</div>
                </div>
                <div className="row detail-row">
                  <div className="col-4 detail-label">Follow-up Required:</div>
                  <div className="col-8">{printData?.FollowupRequired}</div>
                </div>
                <div className="row detail-row">
                  <div className="col-4 detail-label">Supervisor Remarks:</div>
                  <div className="col-8">{printData?.SupervisorNameRemark}</div>
                </div>
              </div>
            )}
            
            <div className="print-footer">
              <p>AVES Security - Confidential Document</p>
              <p>Page 1 of 1</p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPrintModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={executePrint}>
            Print
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create and Edit Offcanvas */}
      {[showCreate, showEdit].map((show, idx) => (
        <Offcanvas
          key={idx}
          show={show}
          onHide={() => (idx === 0 ? setShowCreate(false) : setShowEdit(false))}
          placement="end"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>{idx === 0 ? 'Create Occurrence' : 'Edit Occurrence'}</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Form>
              {/* Don't show RecordingDate, RecordingTime, and OccurringTime in the form as they're auto-generated */}
              {["NatureOfIncident", "Description", "ActionTaken"].map((field) => (
                <Form.Group key={field} className="mb-3">
                  <Form.Label>{field.replace(/([A-Z])/g, ' $1')}</Form.Label>
                  <Form.Control
                    as={field === "Description" ? "textarea" : "input"}
                    rows={field === "Description" ? 3 : undefined}
                    type="text"
                    name={field}
                    value={form[field] || ''}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              ))}

                  {/* <Form.Group className="mb-3">
                <Form.Label>Supervisor Name Remark</Form.Label>
                <UserDropdown 
                  value={form.SupervisorNameRemark || ''}
                  onChange={(e) => setForm({ ...form, SupervisorNameRemark: e.target.value })}
                  showLabel={false}
                />
              </Form.Group>
               */}
              {/* Location Dropdown */}
              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <LocationDropdown 
                  value={form.Location || ''}
                  onChange={handleInputChange}
                  showLabel={false}
                />
              </Form.Group>
              
              {/* Reported By User Dropdown */}
              <Form.Group className="mb-3">
                <Form.Label>Reported By</Form.Label>
                <UserDropdown 
                  value={form.ReportedBy || ''}
                  onChange={handleInputChange}
                  showLabel={false}
                />
              </Form.Group>
              
              {/* Supervisor Name User Dropdown */}
              <Form.Group className="mb-3">
                <Form.Label>Supervisor Name</Form.Label>
                <UserDropdown 
                  value={form.SupervisorName || ''}
                  onChange={(e) => setForm({ ...form, SupervisorName: e.target.value })}
                  showLabel={false}
                />
              </Form.Group>
              
              {/* Followup Required Dropdown */}
              <Form.Group className="mb-3">
                <Form.Label>Followup Required</Form.Label>
                <Form.Select
                  name="FollowupRequired"
                  value={form["FollowupRequired"] || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </Form.Select>
              </Form.Group>
              
              <Button variant="primary" onClick={idx === 0 ? handleCreate : handleUpdate}>
                {idx === 0 ? 'Submit' : 'Update'}
              </Button>
            </Form>
          </Offcanvas.Body>
        </Offcanvas>
      ))}
    </div>
  );
};

export default OccurrenceManager;