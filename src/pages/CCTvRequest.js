import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Offcanvas, 
  Button, 
  Form, 
  Row, 
  Col, 
  Table, 
  Container, 
  Spinner,
  Modal,
  Alert
} from 'react-bootstrap';

const CCTvRequest = () => {
  // Main state
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [formErrors, setFormErrors] = useState({
    locationError: '',
    generalError: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    Title: '',
    ForMySelf: false,
    ForOthers: false,
    MySelfDate: '',
    MySelfTime: '',
    MySelfLocationOFIncident: '',
    MyselfReasonofviewing: '',
    MySelfImmidiateHoldForView: '',
    ForOthersName: '',
    ForOthersDate: '',
    ForOthersTime: '',
    ForOthersLocationOFIncident: '',
    ForOthersReasonofviewing: '',
    ForOthersImmidiateHoldForView: '',
    Remarks: '',
    Status: 'Pending'
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear location error when a location is selected
    if (name === 'MySelfLocationOFIncident' || name === 'ForOthersLocationOFIncident') {
      setFormErrors({
        ...formErrors,
        locationError: ''
      });
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchRequests();
    fetchLocations();
    fetchUsers();
  }, []);

  // Set form values when editing
  useEffect(() => {
    if (editData) {
      setFormData(editData);
    } else {
      resetForm();
    }
  }, [editData]);

  const resetForm = () => {
    setFormData({
      Title: '',
      ForMySelf: false,
      ForOthers: false,
      MySelfDate: '',
      MySelfTime: '',
      MySelfLocationOFIncident: '',
      MyselfReasonofviewing: '',
      MySelfImmidiateHoldForView: '',
      ForOthersName: '',
      ForOthersDate: '',
      ForOthersTime: '',
      ForOthersLocationOFIncident: '',
      ForOthersReasonofviewing: '',
      ForOthersImmidiateHoldForView: '',
      Remarks: '',
      Status: 'Pending'
    });
    setFormErrors({
      locationError: '',
      generalError: ''
    });
  };

  // Process nested location data to create a flat list of all possible locations
  const processLocations = (locations) => {
    const allLocations = [];
    
    locations.forEach(location => {
      // Add primary location option
      allLocations.push({
        id: location._id,
        value: `${location.PrimaryLocation} > ${location.SubLocation}`,
        label: `${location.PrimaryLocation} - ${location.SubLocation}`
      });

      // Add secondary locations if they exist
      if (location.SecondaryLocation && location.SecondaryLocation.length > 0) {
        location.SecondaryLocation.forEach(secondary => {
          // Add secondary location option
          allLocations.push({
            id: secondary._id,
            value: `${location.PrimaryLocation} > ${location.SubLocation} > ${secondary.SecondaryLocation} > ${secondary.SubLocation}`,
            label: `${secondary.SecondaryLocation} - ${secondary.SubLocation} (${location.PrimaryLocation})`
          });

          // Add tertiary locations if they exist
          if (secondary.ThirdLocation && secondary.ThirdLocation.length > 0) {
            secondary.ThirdLocation.forEach(tertiary => {
              allLocations.push({
                id: tertiary._id,
                value: `${location.PrimaryLocation} > ${location.SubLocation} > ${secondary.SecondaryLocation} > ${secondary.SubLocation} > ${tertiary.ThirdLocation} > ${tertiary.SubLocation}`,
                label: `${tertiary.ThirdLocation} - ${tertiary.SubLocation} (${secondary.SecondaryLocation})`
              });
            });
          }
        });
      }
    });
    
    return allLocations;
  };

  // API functions
  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const { data } = await axios.get('https://api.avessecurity.com/api/CCTV/getAll', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(data.cctv || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load CCTV requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const { data } = await axios.get('https://api.avessecurity.com/api/Location/getLocations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const processedLocations = processLocations(data.Location || []);
      setLocations(processedLocations);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load locations');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const { data } = await axios.get('https://api.avessecurity.com/api/users/User-List', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(data.User || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    let hasError = false;
    const newErrors = { ...formErrors };
    
    if (formData.ForMySelf && !formData.MySelfLocationOFIncident) {
      newErrors.locationError = 'Please select a location for yourself';
      hasError = true;
    }
    
    if (formData.ForOthers && !formData.ForOthersLocationOFIncident) {
      newErrors.locationError = 'Please select a location for others';
      hasError = true;
    }
    
    if (!formData.ForMySelf && !formData.ForOthers) {
      newErrors.generalError = 'Please select either "For Myself" or "For Others"';
      hasError = true;
    }
    
    setFormErrors(newErrors);
    if (hasError) return;

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      if (editData) {
        await axios.put(
          `https://api.avessecurity.com/api/CCTV/update/${editData._id}`,
          formData,
          config
        );
      } else {
        await axios.post(
          'https://api.avessecurity.com/api/CCTV/create',
          formData,
          config
        );
      }

      fetchRequests();
      handleCloseForm();
    } catch (err) {
      console.error('Error saving CCTV request:', err);
      setError(err.response?.data?.message || 'Failed to save request');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(
        `https://api.avessecurity.com/api/CCTV/delete/${requestToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchRequests();
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting request:', err);
      setError('Failed to delete request');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditData(null);
    resetForm();
  };

  const handleEdit = (request) => {
    setEditData(request);
    setShowForm(true);
  };

  const handleDeleteClick = (request) => {
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  const renderLocationSelector = (name, value, label) => {
    return (
      <Form.Group className="mb-3">
        <Form.Label>{label}</Form.Label>
        <Form.Select 
          name={name}
          value={value || ''}
          onChange={handleInputChange}
          isInvalid={!!formErrors.locationError}
          required
        >
          <option value="">Select location</option>
          {locations.map(location => (
            <option key={location.id} value={location.value}>
              {location.label}
            </option>
          ))}
        </Form.Select>
        {formErrors.locationError && (
          <Form.Control.Feedback type="invalid">
            {formErrors.locationError}
          </Form.Control.Feedback>
        )}
      </Form.Group>
    );
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="text-center">
          <Spinner animation="border" />
          <p>Loading requests...</p>
        </div>
      );
    }

    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }

    if (requests.length === 0) {
      return <Alert variant="info">No CCTV requests found</Alert>;
    }

    return (
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Title</th>
            <th>Request Type</th>
            <th>Location</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(request => (
            <tr key={request._id}>
              <td>{request.Title}</td>
              <td>
                {request.ForMySelf ? 'For Myself' : ''}
                {request.ForMySelf && request.ForOthers ? ' & ' : ''}
                {request.ForOthers ? 'For Others' : ''}
              </td>
              <td>
                {request.ForMySelf && request.MySelfLocationOFIncident}
                {request.ForOthers && request.ForOthersLocationOFIncident}
              </td>
              <td>
                {request.ForMySelf && request.MySelfDate}
                {request.ForOthers && request.ForOthersDate}
              </td>
              <td>{request.Status}</td>
              <td>
                <Button 
                  variant="info" 
                  size="sm" 
                  onClick={() => handleEdit(request)}
                  className="me-2"
                >
                  Edit
                </Button>
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={() => handleDeleteClick(request)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  const renderForm = () => {
    return (
      <Offcanvas show={showForm} onHide={handleCloseForm} placement="end" backdrop="static">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>{editData ? 'Edit' : 'Create'} CCTV Request</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form onSubmit={handleFormSubmit}>
            {formErrors.generalError && (
              <Alert variant="danger" className="mb-3">
                {formErrors.generalError}
              </Alert>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="Title"
                value={formData.Title}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Row className="mb-3">
              <Col>
                <Form.Check
                  type="checkbox"
                  label="For Myself"
                  name="ForMySelf"
                  checked={formData.ForMySelf}
                  onChange={handleInputChange}
                />
              </Col>
              <Col>
                <Form.Check
                  type="checkbox"
                  label="For Others"
                  name="ForOthers"
                  checked={formData.ForOthers}
                  onChange={handleInputChange}
                />
              </Col>
            </Row>

            {formData.ForMySelf && (
              <>
                <Row className="mb-3">
                  <Col>
                    <Form.Group>
                      <Form.Label>Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="MySelfDate"
                        value={formData.MySelfDate}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group>
                      <Form.Label>Time</Form.Label>
                      <Form.Control
                        type="time"
                        name="MySelfTime"
                        value={formData.MySelfTime}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {renderLocationSelector(
                  'MySelfLocationOFIncident',
                  formData.MySelfLocationOFIncident,
                  'Location of Incident'
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Reason for Viewing</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="MyselfReasonofviewing"
                    value={formData.MyselfReasonofviewing}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Immediate Hold for View"
                    name="MySelfImmidiateHoldForView"
                    checked={formData.MySelfImmidiateHoldForView}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </>
            )}

            {formData.ForOthers && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="ForOthersName"
                    value={formData.ForOthersName}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Row className="mb-3">
                  <Col>
                    <Form.Group>
                      <Form.Label>Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="ForOthersDate"
                        value={formData.ForOthersDate}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group>
                      <Form.Label>Time</Form.Label>
                      <Form.Control
                        type="time"
                        name="ForOthersTime"
                        value={formData.ForOthersTime}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {renderLocationSelector(
                  'ForOthersLocationOFIncident',
                  formData.ForOthersLocationOFIncident,
                  'Location of Incident'
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Reason for Viewing</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="ForOthersReasonofviewing"
                    value={formData.ForOthersReasonofviewing}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Immediate Hold for View"
                    name="ForOthersImmidiateHoldForView"
                    checked={formData.ForOthersImmidiateHoldForView}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="Remarks"
                value={formData.Remarks}
                onChange={handleInputChange}
              />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Saving...</span>
                  </>
                ) : (
                  'Save Request'
                )}
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>
    );
  };

  const renderDeleteModal = () => {
    return (
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this CCTV request?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteRequest} disabled={loading}>
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Deleting...</span>
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>CCTV Requests</h2>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          Create New Request
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {renderTable()}
      {renderForm()}
      {renderDeleteModal()}
    </Container>
  );
};

export default CCTvRequest;