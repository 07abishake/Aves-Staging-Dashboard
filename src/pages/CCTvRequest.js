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
  Alert,
  Badge,
  Card,
  Tab,
  Tabs,
  Accordion
} from 'react-bootstrap';
import { 
  PlusCircle, 
  Trash, 
  Pencil, 
  Eye, 
  X, 
  Check,
  Clock,
  Calendar as CalendarIcon,
  Person,
  GeoAlt,
  CardChecklist,
  InfoCircle
} from 'react-bootstrap-icons';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const CCTvRequest = () => {
  // Main state
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
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
  const [activeTab, setActiveTab] = useState('all');
  const [viewData, setViewData] = useState(null);

  // Calendar events
  const calendarEvents = requests.map(request => {
    const requestDate = request.ForMySelf ? request.MySelfDate : request.ForOthersDate;
    return {
      id: request._id,
      title: request.Title,
      start: new Date(requestDate),
      end: new Date(requestDate),
      allDay: true,
      status: request.Status
    };
  });

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3174ad'; // default blue
    if (event.status === 'Approved') backgroundColor = '#28a745'; // green
    if (event.status === 'Rejected') backgroundColor = '#dc3545'; // red
    if (event.status === 'Pending') backgroundColor = '#ffc107'; // yellow

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

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

  // Process nested location data
const processLocations = (locations) => {
  if (!locations || locations.length === 0) return [];

  const options = [];

  locations.forEach(location => {
    if (!location.PrimaryLocation) return;

    // Add primary location
    options.push({
      id: location._id,
      value: location.PrimaryLocation,
      label: location.PrimaryLocation,
      level: 0
    });

    // Process SubLocations
    if (location.SubLocation?.length > 0) {
      location.SubLocation.forEach(subLoc => {
        if (!subLoc.PrimarySubLocation) return;

        // Add SubLocation (level 1)
        const subLocValue = `${location.PrimaryLocation} > ${subLoc.PrimarySubLocation}`;
        options.push({
          id: subLoc._id,
          value: subLocValue,
          label: `${subLoc.PrimarySubLocation} (${location.PrimaryLocation})`,
          level: 1
        });

        // Process Secondary Locations
        if (subLoc.SecondaryLocation?.length > 0) {
          subLoc.SecondaryLocation.forEach(secondary => {
            if (!secondary.SecondaryLocation) return;

            // Add Secondary Location (level 2)
            const secondaryValue = `${subLocValue} > ${secondary.SecondaryLocation}`;
            options.push({
              id: secondary._id,
              value: secondaryValue,
              label: `${secondary.SecondaryLocation} (${subLoc.PrimarySubLocation})`,
              level: 2
            });

            // Process Secondary SubLocations
            if (secondary.SecondarySubLocation?.length > 0) {
              secondary.SecondarySubLocation.forEach(secondarySub => {
                if (!secondarySub.SecondarySubLocation) return;
                
                // Add Secondary SubLocation (level 3)
                const secondarySubValue = `${secondaryValue} > ${secondarySub.SecondarySubLocation}`;
                options.push({
                  id: secondarySub._id,
                  value: secondarySubValue,
                  label: `${secondarySub.SecondarySubLocation} (${secondary.SecondaryLocation})`,
                  level: 3
                });

                // Process Third Locations
                if (secondarySub.ThirdLocation?.length > 0) {
                  secondarySub.ThirdLocation.forEach(third => {
                    if (!third.ThirdLocation) return;

                    // Add Third Location (level 4)
                    const thirdValue = `${secondarySubValue} > ${third.ThirdLocation}`;
                    options.push({
                      id: third._id,
                      value: thirdValue,
                      label: `${third.ThirdLocation} (${secondarySub.SecondarySubLocation})`,
                      level: 4
                    });

                    // Add Third SubLocation if exists (level 5)
                    if (third.ThirdSubLocation) {
                      const thirdSubValue = `${thirdValue} > ${third.ThirdSubLocation}`;
                      options.push({
                        id: third._id, // Might need a different ID if available
                        value: thirdSubValue,
                        label: `${third.ThirdSubLocation} (${third.ThirdLocation})`,
                        level: 5
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

  return options;
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
        setSuccess('Request updated successfully!');
      } else {
        await axios.post(
          'https://api.avessecurity.com/api/CCTV/create',
          formData,
          config
        );
        setSuccess('Request created successfully!');
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
      setSuccess('Request deleted successfully!');
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

  const handleView = (request) => {
    setViewData(request);
  };

  const handleDeleteClick = (request) => {
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  const renderStatusBadge = (status) => {
    let variant = 'secondary';
    if (status === 'Approved') variant = 'success';
    if (status === 'Rejected') variant = 'danger';
    if (status === 'Pending') variant = 'warning';
    
    return <Badge bg={variant}>{status}</Badge>;
  };

  const renderLocationSelector = (name, value, label) => {
    return (
      <Form.Group className="mb-3">
        <Form.Label>
          <GeoAlt className="me-2" />
          {label}
        </Form.Label>
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

  const renderRequestDetails = (request) => {
    return (
      <Card className="mb-3 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <Card.Title className="mb-0">
              {request.Title}
            </Card.Title>
            {renderStatusBadge(request.Status)}
          </div>
          
          <div className="mb-3">
            <h6 className="text-muted">
              <CardChecklist className="me-2" />
              Request Type
            </h6>
            <p>
              {request.ForMySelf ? 'For Myself' : ''}
              {request.ForMySelf && request.ForOthers ? ' & ' : ''}
              {request.ForOthers ? 'For Others' : ''}
            </p>
          </div>

          {request.ForMySelf && (
            <Accordion defaultActiveKey="0" className="mb-3">
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <Person className="me-2" />
                  My Request Details
                </Accordion.Header>
                <Accordion.Body>
                  <Row>
                    <Col md={6}>
                      <p><strong><CalendarIcon className="me-2" />Date:</strong> {request.MySelfDate}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong><Clock className="me-2" />Time:</strong> {request.MySelfTime}</p>
                    </Col>
                  </Row>
                  <p><strong><GeoAlt className="me-2" />Location:</strong> {request.MySelfLocationOFIncident}</p>
                  <p><strong><InfoCircle className="me-2" />Reason:</strong> {request.MyselfReasonofviewing}</p>
                  <p><strong>Immediate Hold:</strong> {request.MySelfImmidiateHoldForView ? 'Yes' : 'No'}</p>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          )}

          {request.ForOthers && (
            <Accordion defaultActiveKey="1" className="mb-3">
              <Accordion.Item eventKey="1">
                <Accordion.Header>
                  <Person className="me-2" />
                  Others Request Details
                </Accordion.Header>
                <Accordion.Body>
                  <p><strong>Name:</strong> {request.ForOthersName}</p>
                  <Row>
                    <Col md={6}>
                      <p><strong><CalendarIcon className="me-2" />Date:</strong> {request.ForOthersDate}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong><Clock className="me-2" />Time:</strong> {request.ForOthersTime}</p>
                    </Col>
                  </Row>
                  <p><strong><GeoAlt className="me-2" />Location:</strong> {request.ForOthersLocationOFIncident}</p>
                  <p><strong><InfoCircle className="me-2" />Reason:</strong> {request.ForOthersReasonofviewing}</p>
                  <p><strong>Immediate Hold:</strong> {request.ForOthersImmidiateHoldForView ? 'Yes' : 'No'}</p>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          )}

          {request.Remarks && (
            <div className="mb-3">
              <h6 className="text-muted">
                <InfoCircle className="me-2" />
                Remarks
              </h6>
              <p>{request.Remarks}</p>
            </div>
          )}

          <div className="d-flex justify-content-end gap-2">
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={() => handleEdit(request)}
            >
              <Pencil size={16} className="me-1" />
              Edit
            </Button>
            <Button 
              variant="outline-danger" 
              size="sm" 
              onClick={() => handleDeleteClick(request)}
            >
              <Trash size={16} className="me-1" />
              Delete
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading requests...</p>
        </div>
      );
    }

    if (error) {
      return <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>;
    }

    const filteredRequests = requests.filter(request => {
      if (activeTab === 'all') return true;
      return request.Status === activeTab;
    });

    if (filteredRequests.length === 0) {
      return <Alert variant="info">No CCTV requests found</Alert>;
    }

    return (
      <>
        <div className="mb-4 p-3 bg-white rounded shadow-sm">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={(event) => {
              const selected = requests.find(r => r._id === event.id);
              if (selected) handleView(selected);
            }}
          />
        </div>

        <Table striped hover responsive className="mt-3">
          <thead className="bg-light">
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
            {filteredRequests.map(request => (
              <tr key={request._id}>
                <td>{request.Title}</td>
                <td>
                  {request.ForMySelf ? <Badge bg="info" className="me-1">Myself</Badge> : null}
                  {request.ForOthers ? <Badge bg="secondary">Others</Badge> : null}
                </td>
                <td>
                  {request.ForMySelf && request.MySelfLocationOFIncident}
                  {request.ForOthers && request.ForOthersLocationOFIncident}
                </td>
                <td>
                  {request.ForMySelf && request.MySelfDate}
                  {request.ForOthers && request.ForOthersDate}
                </td>
                <td>{renderStatusBadge(request.Status)}</td>
                <td>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={() => handleEdit(request)}
                    className="me-2"
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => handleDeleteClick(request)}
                  >
                    <Trash size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </>
    );
  };

  const renderForm = () => {
    return (
      <Offcanvas 
        show={showForm} 
        onHide={handleCloseForm} 
        placement="end" 
        backdrop="static"
        className="w-50"
      >
        <Offcanvas.Header closeButton className="bg-light">
          <Offcanvas.Title>
            <h4 className="mb-0">
              {editData ? (
                <>
                  <Pencil className="me-2" />
                  Edit CCTV Request
                </>
              ) : (
                <>
                  <PlusCircle className="me-2" />
                  Create New CCTV Request
                </>
              )}
            </h4>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form onSubmit={handleFormSubmit}>
            {formErrors.generalError && (
              <Alert variant="danger" className="mb-3" onClose={() => setFormErrors({...formErrors, generalError: ''})} dismissible>
                {formErrors.generalError}
              </Alert>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>
                <InfoCircle className="me-2" />
                Title
              </Form.Label>
              <Form.Control
                type="text"
                name="Title"
                value={formData.Title}
                onChange={handleInputChange}
                placeholder="Enter request title"
                required
              />
            </Form.Group>

            <Card className="mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">Request Type</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col>
                    <Form.Check
                      type="switch"
                      id="forMyself"
                      label={
                        <>
                          <Person className="me-2" />
                          For Myself
                        </>
                      }
                      name="ForMySelf"
                      checked={formData.ForMySelf}
                      onChange={handleInputChange}
                    />
                  </Col>
                  <Col>
                    <Form.Check
                      type="switch"
                      id="forOthers"
                      label={
                        <>
                          <Person className="me-2" />
                          For Others
                        </>
                      }
                      name="ForOthers"
                      checked={formData.ForOthers}
                      onChange={handleInputChange}
                    />
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {formData.ForMySelf && (
              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <Person className="me-2" />
                    My Request Details
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <CalendarIcon className="me-2" />
                          Date
                        </Form.Label>
                        <Form.Control
                          type="date"
                          name="MySelfDate"
                          value={formData.MySelfDate}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <Clock className="me-2" />
                          Time
                        </Form.Label>
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
                    <Form.Label>
                      <InfoCircle className="me-2" />
                      Reason for Viewing
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="MyselfReasonofviewing"
                      value={formData.MyselfReasonofviewing}
                      onChange={handleInputChange}
                      placeholder="Describe the reason for viewing CCTV footage"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      id="myselfImmediateHold"
                      label="Immediate Hold for View"
                      name="MySelfImmidiateHoldForView"
                      checked={formData.MySelfImmidiateHoldForView}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Card.Body>
              </Card>
            )}

            {formData.ForOthers && (
              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <Person className="me-2" />
                    Others Request Details
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <Person className="me-2" />
                      Name
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="ForOthersName"
                      value={formData.ForOthersName}
                      onChange={handleInputChange}
                      placeholder="Enter person's name"
                      required
                    />
                  </Form.Group>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <CalendarIcon className="me-2" />
                          Date
                        </Form.Label>
                        <Form.Control
                          type="date"
                          name="ForOthersDate"
                          value={formData.ForOthersDate}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <Clock className="me-2" />
                          Time
                        </Form.Label>
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
                    <Form.Label>
                      <InfoCircle className="me-2" />
                      Reason for Viewing
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="ForOthersReasonofviewing"
                      value={formData.ForOthersReasonofviewing}
                      onChange={handleInputChange}
                      placeholder="Describe the reason for viewing CCTV footage"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      id="othersImmediateHold"
                      label="Immediate Hold for View"
                      name="ForOthersImmidiateHoldForView"
                      checked={formData.ForOthersImmidiateHoldForView}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Card.Body>
              </Card>
            )}

            <Form.Group className="mb-4">
              <Form.Label>
                <InfoCircle className="me-2" />
                Remarks
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="Remarks"
                value={formData.Remarks}
                onChange={handleInputChange}
                placeholder="Any additional remarks"
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
                  <>
                    <Check className="me-2" />
                    {editData ? 'Update Request' : 'Create Request'}
                  </>
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
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <Trash className="me-2" />
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the CCTV request for <strong>{requestToDelete?.Title}</strong>?
          <br />
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            <X className="me-2" />
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteRequest} disabled={loading}>
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Deleting...</span>
              </>
            ) : (
              <>
                <Trash className="me-2" />
                Delete
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <Eye className="me-2" />
          CCTV Requests Management
        </h2>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <PlusCircle className="me-2" />
          New Request
        </Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="all" title="All Requests" />
            <Tab eventKey="Pending" title="Pending" />
            <Tab eventKey="Approved" title="Approved" />
            <Tab eventKey="Rejected" title="Rejected" />
          </Tabs>

          {renderTable()}
        </Card.Body>
      </Card>

      {renderForm()}
      {renderDeleteModal()}

      {/* View Offcanvas */}
      <Offcanvas show={!!viewData} onHide={() => setViewData(null)} placement="end" className="w-50">
        {viewData && (
          <>
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>CCTV Request Details</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              {renderRequestDetails(viewData)}
            </Offcanvas.Body>
          </>
        )}
      </Offcanvas>
    </Container>
  );
};

export default CCTvRequest;