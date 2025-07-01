import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Badge, Offcanvas, 
  Form, Row, Col, Spinner, Alert,
  Card, ListGroup, Container, 
  InputGroup, Modal
} from 'react-bootstrap';
import axios from 'axios';
import { format } from 'date-fns';

const API_BASE_URL = 'http://api.avessecurity.com:6378/api/event';

const token = localStorage.getItem("access_token");
if (!token) {
  window.location.href = "/login";
}

// Department Dropdown Component
const DepartmentDropdown = ({ value, onChange }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('https://api.avessecurity.com/api/Department/getAll', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDepartments(response.data);
      } catch (err) {
        setError(err.message || 'Failed to load departments');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  if (loading) {
    return (
      <Form.Group controlId="Department">
        <Form.Label>Department</Form.Label>
        <div className="d-flex align-items-center">
          <Spinner animation="border" size="sm" className="me-2" />
          <span>Loading departments...</span>
        </div>
      </Form.Group>
    );
  }

  if (error) {
    return (
      <Form.Group controlId="Department">
        <Form.Label>Department</Form.Label>
        <Alert variant="danger" className="py-1">
          {error}
        </Alert>
      </Form.Group>
    );
  }

  return (
    <Form.Group controlId="Department">
      <Form.Label>Department</Form.Label>
      <Form.Select
        name="Department"
        value={value}
        onChange={onChange}
      >
        <option value="">Select Department</option>
        {departments.map((dept) => (
          <option key={dept._id} value={dept._id}>
            {dept.name}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

// Location Dropdown Component
const LocationDropdown = ({ value, onChange }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrimary, setSelectedPrimary] = useState('');
  const [selectedSecondary, setSelectedSecondary] = useState('');
  const [selectedTertiary, setSelectedTertiary] = useState('');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const { data } = await axios.get('https://api.avessecurity.com/api/Location/getLocations', {
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

  const handlePrimaryChange = (e) => {
    const primaryId = e.target.value;
    setSelectedPrimary(primaryId);
    setSelectedSecondary('');
    setSelectedTertiary('');
    onChange({ target: { name: 'Location', value: primaryId } });
  };

  const handleSecondaryChange = (e) => {
    const secondaryId = e.target.value;
    setSelectedSecondary(secondaryId);
    setSelectedTertiary('');
    onChange({ target: { name: 'Location', value: secondaryId } });
  };

  const handleTertiaryChange = (e) => {
    const tertiaryId = e.target.value;
    setSelectedTertiary(tertiaryId);
    onChange({ target: { name: 'Location', value: tertiaryId } });
  };

  const getSelectedPrimary = () => {
    return locations.find(loc => loc._id === selectedPrimary);
  };

  const getSelectedSecondary = () => {
    const primary = getSelectedPrimary();
    if (!primary) return null;
    return primary.SecondaryLocation.find(sec => sec._id === selectedSecondary);
  };

  if (loading) {
    return (
      <Form.Group controlId="Location">
        <Form.Label>Location</Form.Label>
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
        <Form.Label>Location</Form.Label>
        <Alert variant="danger" className="py-1">
          {error}
        </Alert>
      </Form.Group>
    );
  }

  return (
    <Form.Group controlId="Location">
      <Form.Label>Location</Form.Label>
      
      {/* Primary Location Dropdown */}
      <Form.Select 
        className="mb-2"
        value={selectedPrimary}
        onChange={handlePrimaryChange}
      >
        <option value="">Select Primary Location</option>
        {locations.map(loc => (
          <option key={loc._id} value={loc._id}>
            {loc.PrimaryLocation} - {loc.SubLocation}
          </option>
        ))}
      </Form.Select>

      {/* Secondary Location Dropdown */}
      {selectedPrimary && (
        <Form.Select
          className="mb-2"
          value={selectedSecondary}
          onChange={handleSecondaryChange}
        >
          <option value="">Select Secondary Location</option>
          {getSelectedPrimary()?.SecondaryLocation?.map(sec => (
            <option key={sec._id} value={sec._id}>
              {sec.SecondaryLocation} - {sec.SubLocation}
            </option>
          ))}
        </Form.Select>
      )}

      {/* Tertiary Location Dropdown */}
      {selectedSecondary && (
        <Form.Select
          value={selectedTertiary}
          onChange={handleTertiaryChange}
        >
          <option value="">Select Tertiary Location</option>
          {getSelectedSecondary()?.ThirdLocation?.map(ter => (
            <option key={ter._id} value={ter._id}>
              {ter.ThirdLocation} - {ter.SubLocation}
            </option>
          ))}
        </Form.Select>
      )}
    </Form.Group>
  );
};

// Event Service Functions
const fetchEvents = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/get`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.data || !response.data.events) return [];
    return Array.isArray(response.data.events) ? response.data.events : [response.data.events];
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

const createEvent = async (eventData) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const now = new Date();
    
    const dataToSend = {
      ...eventData,
      SubmittedBy: user?.name || 'Unknown',
      SubmittedByDate: now.toISOString().split('T')[0],
      SubmittedByTime: now.toTimeString().split(' ')[0],
    };

    const response = await axios.post(`${API_BASE_URL}/create`, dataToSend, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.data || !response.data.events) return [];
    return Array.isArray(response.data.events) ? response.data.events : [response.data.events];
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

const updateEvent = async (id, eventData) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const now = new Date();
    
    const dataToSend = {
      ...eventData,
      UpdatedBy: user?.name || 'Unknown',
      UpdatedDate: now.toISOString().split('T')[0],
      UpdatedTime: now.toTimeString().split(' ')[0],
    };

    const response = await axios.put(`${API_BASE_URL}/update/${id}`, dataToSend, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data || {};
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

const deleteEvent = async (id) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const now = new Date();
    
    const dataToSend = {
      DeletedBy: user?.name || 'Unknown',
      DeletedDate: now.toISOString().split('T')[0],
      DeletedTime: now.toTimeString().split(' ')[0],
    };

    await axios.put(`${API_BASE_URL}/update/${id}`, dataToSend, {  
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const response = await axios.delete(`${API_BASE_URL}/delete/${id}`, {  
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data || {};
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

// Event Form Component
const EventForm = ({ event, onSuccess, action, onHide }) => {
  const [formData, setFormData] = useState({
    EventName: '',
    Date: '',
    Time: '',
    Client: '',
    Location: '',
    EventOrganizer: '',
    EventIncharge: '',
    Vip: '',
    ParkingLotRequest: '',
    Nopax: '',
    SafteyBriefing: '',
    SpecialRequest: '',
    Type: '',
    Department: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (event && action === 'edit') {
      setFormData({
        EventName: event.EventName || '',
        Date: event.Date ? new Date(event.Date).toISOString().split('T')[0] : '',
        Time: event.Time || '',
        Client: event.Client || '',
        Location: event.Location || '',
        EventOrganizer: event.EventOrganizer || '',
        EventIncharge: event.EventIncharge || '',
        Vip: event.Vip || '',
        ParkingLotRequest: event.ParkingLotRequest || '',
        Nopax: event.Nopax || '',
        SafteyBriefing: event.SafteyBriefing || '',
        SpecialRequest: event.SpecialRequest || '',
        Type: event.Type || '',
        Department: event.Department || '',
      });
    }
  }, [event, action]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (action === 'create') {
        await createEvent(formData);
      } else {
        await updateEvent(event._id, formData);
      }
      onSuccess();
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-3">
        <Form.Group as={Col} controlId="EventName">
          <Form.Label>Event Name <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            name="EventName"
            value={formData.EventName}
            onChange={handleChange}
            required
            placeholder="Enter event name"
          />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} controlId="Date">
          <Form.Label>Date <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="date"
            name="Date"
            value={formData.Date}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group as={Col} controlId="Time">
          <Form.Label>Time <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="time"
            name="Time"
            value={formData.Time}
            onChange={handleChange}
            required
          />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} controlId="Client">
          <Form.Label>Client</Form.Label>
          <Form.Control
            type="text"
            name="Client"
            value={formData.Client}
            onChange={handleChange}
            placeholder="Enter client name"
          />
        </Form.Group>

        <Form.Group as={Col} controlId="Location">
          <LocationDropdown 
            value={formData.Location}
            onChange={handleChange}
          />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} controlId="EventOrganizer">
          <Form.Label>Event Organizer</Form.Label>
          <Form.Control
            type="text"
            name="EventOrganizer"
            value={formData.EventOrganizer}
            onChange={handleChange}
            placeholder="Enter organizer name"
          />
        </Form.Group>

        <Form.Group as={Col} controlId="EventIncharge">
          <Form.Label>Event Incharge</Form.Label>
          <Form.Control
            type="text"
            name="EventIncharge"
            value={formData.EventIncharge}
            onChange={handleChange}
            placeholder="Enter incharge name"
          />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} controlId="Vip">
          <Form.Label>VIP</Form.Label>
          <Form.Control
            type="text"
            name="Vip"
            value={formData.Vip}
            onChange={handleChange}
            placeholder="Enter VIP details"
          />
        </Form.Group>

        <Form.Group as={Col} controlId="ParkingLotRequest">
          <Form.Label>Parking Lot Request</Form.Label>
          <Form.Control
            type="text"
            name="ParkingLotRequest"
            value={formData.ParkingLotRequest}
            onChange={handleChange}
            placeholder="Enter parking request"
          />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} controlId="Nopax">
          <Form.Label>No. of Pax</Form.Label>
          <Form.Control
            type="number"
            name="Nopax"
            value={formData.Nopax}
            onChange={handleChange}
            placeholder="Enter number of attendees"
          />
        </Form.Group>

        <Form.Group as={Col} controlId="SafteyBriefing">
          <Form.Label>Safety Briefing</Form.Label>
          <Form.Control
            type="text"
            name="SafteyBriefing"
            value={formData.SafteyBriefing}
            onChange={handleChange}
            placeholder="Enter safety briefing details"
          />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} controlId="SpecialRequest">
          <Form.Label>Special Request</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="SpecialRequest"
            value={formData.SpecialRequest}
            onChange={handleChange}
            placeholder="Enter any special requests"
          />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} controlId="Type">
          <Form.Label>Type <span className="text-danger">*</span></Form.Label>
          <Form.Select
            name="Type"
            value={formData.Type}
            onChange={handleChange}
            required
          >
            <option value="">Select Type</option>
            <option value="Regular">Regular</option>
            <option value="VIP">VIP</option>
            <option value="Corporate">Corporate</option>
            <option value="Private">Private</option>
          </Form.Select>
        </Form.Group>

        <Form.Group as={Col} controlId="Department">
          <DepartmentDropdown 
            value={formData.Department}
            onChange={handleChange}
          />
        </Form.Group>
      </Row>

      <div className="d-grid gap-2 mt-4">
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              <span className="ms-2">Saving...</span>
            </>
          ) : action === 'create' ? (
            'Create Event'
          ) : (
            'Update Event'
          )}
        </Button>
      </div>
    </Form>
  );
};

// Event Details Component
const EventDetails = ({ event, onHide }) => {
  if (!event) return <div>No event data available</div>;

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center bg-light">
          <h4 className="mb-0">{event.EventName}</h4>
          <Badge bg={event.Type === 'VIP' ? 'danger' : 'primary'} pill>
            {event.Type || 'Regular'}
          </Badge>
        </Card.Header>
        <Card.Body>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <div className="d-flex justify-content-between">
                <strong>Date:</strong> 
                <span>{event.Date ? format(new Date(event.Date), 'PP') : 'N/A'}</span>
              </div>
            </ListGroup.Item>
            <ListGroup.Item>
              <div className="d-flex justify-content-between">
                <strong>Time:</strong> 
                <span>{event.Time || 'N/A'}</span>
              </div>
            </ListGroup.Item>
            <ListGroup.Item>
              <div className="d-flex justify-content-between">
                <strong>Client:</strong> 
                <span>{event.Client || 'N/A'}</span>
              </div>
            </ListGroup.Item>
            <ListGroup.Item>
              <div className="d-flex justify-content-between">
                <strong>Location:</strong> 
                <span>{event.Location || 'N/A'}</span>
              </div>
            </ListGroup.Item>
            <ListGroup.Item>
              <div className="d-flex justify-content-between">
                <strong>Event Organizer:</strong> 
                <span>{event.EventOrganizer || 'N/A'}</span>
              </div>
            </ListGroup.Item>
            <ListGroup.Item>
              <div className="d-flex justify-content-between">
                <strong>Event Incharge:</strong> 
                <span>{event.EventIncharge || 'N/A'}</span>
              </div>
            </ListGroup.Item>
            <ListGroup.Item>
              <div className="d-flex justify-content-between">
                <strong>VIP:</strong> 
                <span>{event.Vip || 'N/A'}</span>
              </div>
            </ListGroup.Item>
            <ListGroup.Item>
              <div className="d-flex justify-content-between">
                <strong>Parking Lot Request:</strong> 
                <span>{event.ParkingLotRequest || 'N/A'}</span>
              </div>
            </ListGroup.Item>
            <ListGroup.Item>
              <div className="d-flex justify-content-between">
                <strong>No. of Pax:</strong> 
                <span>{event.Nopax || 'N/A'}</span>
              </div>
            </ListGroup.Item>
            <ListGroup.Item>
              <div className="d-flex justify-content-between">
                <strong>Safety Briefing:</strong> 
                <span>{event.SafteyBriefing || 'N/A'}</span>
              </div>
            </ListGroup.Item>
            <ListGroup.Item>
              <div className="d-flex flex-column">
                <strong>Special Request:</strong> 
                <span className="mt-1">{event.SpecialRequest || 'N/A'}</span>
              </div>
            </ListGroup.Item>
            <ListGroup.Item>
              <div className="d-flex justify-content-between">
                <strong>Department:</strong> 
                <span>{event.Department || 'N/A'}</span>
              </div>
            </ListGroup.Item>
            <ListGroup.Item>
              <div className="d-flex flex-column">
                <strong>Submitted By:</strong> 
                <span className="mt-1">{event.SubmittedBy || 'N/A'}</span>
                <small className="text-muted">
                  {event.SubmittedByDate} at {event.SubmittedByTime}
                </small>
              </div>
            </ListGroup.Item>
            {event.UpdatedBy && (
              <ListGroup.Item>
                <div className="d-flex flex-column">
                  <strong>Last Updated By:</strong> 
                  <span className="mt-1">{event.UpdatedBy}</span>
                  <small className="text-muted">
                    {event.UpdatedDate} at {event.UpdatedTime}
                  </small>
                </div>
              </ListGroup.Item>
            )}
          </ListGroup>
        </Card.Body>
      </Card>
      <div className="mt-3 d-flex justify-content-end">
        <Button variant="outline-secondary" onClick={onHide}>
          Close
        </Button>
      </div>
    </>
  );
};

// Main Event Management Component
const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [action, setAction] = useState('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading events:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setAction('create');
    setSelectedEvent(null);
    setShowForm(true);
  };

  const handleEdit = (event) => {
    setAction('edit');
    setSelectedEvent(event);
    setShowForm(true);
  };

  const handleView = (event) => {
    setSelectedEvent(event);
    setShowDetails(true);
  };

  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (eventToDelete) {
      try {
        await deleteEvent(eventToDelete._id);
        loadEvents();
      } catch (err) {
        console.error('Failed to delete event:', err);
        setError(err.response?.data?.message || err.message || 'Failed to delete event');
      } finally {
        setShowDeleteModal(false);
      }
    }
  };

  const handleSuccess = () => {
    loadEvents();
  };

 const filteredEvents = events.filter(event => {
  if (!event) return false;
  const matchesSearch = (
    event.EventName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    event.Client?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const matchesType = filterType === 'All' || event.Type === filterType;
  return matchesSearch && matchesType;
});

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading events...</span>
        </Spinner>
        <p className="mt-2">Loading events...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error loading events</Alert.Heading>
          <p>{error}</p>
          <Button variant="primary" onClick={loadEvents}>Retry</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Event Management</h2>
        <Button variant="primary" onClick={handleCreate} className="d-flex align-items-center">
          <i className="me-2"></i> Create New Event
        </Button>
      </div>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by event name or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Regular">Regular</option>
                <option value="VIP">VIP</option>
                <option value="Corporate">Corporate</option>
                <option value="Private">Private</option>
              </Form.Select>
            </Col>
            <Col md={3} className="d-flex justify-content-end">
              {/* <Button variant="outline-secondary" onClick={loadEvents}>
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </Button> */}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table  className="mb-0">
              <thead className="">
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Submitted By</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <tr key={event._id}>
                      <td>
                        <div className="fw-semibold">{event.EventName}</div>
                        <small className="text-muted">{event.Location || 'N/A'}</small>
                      </td>
                      <td>
                        {event.Date ? format(new Date(event.Date), 'PP') : 'N/A'}
                        <div className="text-muted">{event.Time || ''}</div>
                      </td>
                      <td>{event.Client || 'N/A'}</td>
                      <td>
                        <Badge bg={event.Type === 'VIP' ? 'danger' : 'primary'} pill>
                          {event.Type || 'Regular'}
                        </Badge>
                      </td>
                      <td>
                        <div>{event.SubmittedBy}</div>
                        <small className="text-muted">
                          {event.SubmittedByDate} at {event.SubmittedByTime}
                        </small>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-2"
                          onClick={() => handleView(event)}
                          title="View"
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(event)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(event)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      {events.length === 0 ? 'No events available.' : 'No events match your search criteria.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Event Form Offcanvas */}
      <Offcanvas show={showForm} onHide={() => setShowForm(false)} placement="end" className="w-50">
        <Offcanvas.Header closeButton className="bg-light">
          <Offcanvas.Title>
            {action === 'create' ? 'Create New Event' : 'Edit Event'}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <EventForm
            event={selectedEvent}
            onSuccess={handleSuccess}
            action={action}
            onHide={() => setShowForm(false)}
          />
        </Offcanvas.Body>
      </Offcanvas>

      {/* Event Details Offcanvas */}
      <Offcanvas show={showDetails} onHide={() => setShowDetails(false)} placement="end" className="w-50">
        <Offcanvas.Header closeButton className="bg-light">
          <Offcanvas.Title>Event Details</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <EventDetails 
            event={selectedEvent} 
            onHide={() => setShowDetails(false)} 
          />
        </Offcanvas.Body>
      </Offcanvas>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the event "{eventToDelete?.EventName}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            <i className="bi bi-trash me-1"></i> Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EventManagement;