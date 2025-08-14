import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Badge, Offcanvas, 
  Form, Row, Col, Spinner, Alert,
  Card, ListGroup, Container, 
  InputGroup, Modal, Tabs, Tab
} from 'react-bootstrap';
import axios from 'axios';
import { format } from 'date-fns';
import debounce from "lodash.debounce";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const API_BASE_URL = 'https://api.avessecurity.com/api/event';
const token = localStorage.getItem("access_token");

// Department Dropdown Component
const DepartmentDropdown = ({ value, onChange }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('https://api.avessecurity.com/api/Department/getAll', {
          headers: { Authorization: `Bearer ${token}` }
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
        <Alert variant="danger" className="py-1">{error}</Alert>
      </Form.Group>
    );
  }

  return (
    <Form.Group controlId="Department">
      <Form.Label>Department</Form.Label>
      <Form.Select name="Department" value={value} onChange={onChange}>
        <option value="">Select Department</option>
        {departments.map((dept) => (
          <option key={dept._id} value={dept._id}>{dept.name}</option>
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data } = await axios.get('https://api.avessecurity.com/api/Location/getLocations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const nested = data?.Location || [];
        const flattened = flattenLocations(nested);
        setLocations(flattened);
        setFilteredLocations(flattened);
      } catch (err) {
        setError(err.message || 'Failed to load locations');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const flattenLocations = (data) => {
    const result = [];

    data.forEach((primary) => {
      result.push({ label: primary.PrimaryLocation, id: primary._id });

      primary.SubLocation?.forEach((primarySub) => {
        result.push({
          label: `${primary.PrimaryLocation}, ${primarySub.PrimarySubLocation}`,
          id: primarySub._id,
        });

        primarySub.SecondaryLocation?.forEach((secondary) => {
          result.push({
            label: `${primary.PrimaryLocation}, ${primarySub.PrimarySubLocation}, ${secondary.SecondaryLocation}`,
            id: secondary._id,
          });

          secondary.SecondarySubLocation?.forEach((secondarySub) => {
            result.push({
              label: `${primary.PrimaryLocation}, ${primarySub.PrimarySubLocation}, ${secondary.SecondaryLocation}, ${secondarySub.SecondarySubLocation}`,
              id: secondarySub._id,
            });

            secondarySub.ThirdLocation?.forEach((third) => {
              result.push({
                label: `${primary.PrimaryLocation}, ${primarySub.PrimarySubLocation}, ${secondary.SecondaryLocation}, ${secondarySub.SecondarySubLocation}, ${third.ThirdLocation} (${third.ThirdSubLocation})`,
                id: third._id,
              });
            });
          });
        });
      });
    });

    return result;
  };

  const handleSearch = debounce((value) => {
    if (!value) {
      setFilteredLocations(locations);
    } else {
      const filtered = locations.filter((loc) =>
        loc.label.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLocations(filtered);
    }
  }, 300);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    handleSearch(newValue);
    if (!newValue) onChange({ target: { name: 'Location', value: '' } });
  };

  const handleSelectLocation = (location) => {
    setSearchTerm(location.label);
    onChange({ target: { name: 'Location', value: location.id } });
    setShowSuggestions(false);
  };

  const handleFocus = () => {
    if (searchTerm && filteredLocations.length > 0) setShowSuggestions(true);
  };

  const handleBlur = () => setTimeout(() => setShowSuggestions(false), 200);

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
        <Alert variant="danger" className="py-1">{error}</Alert>
      </Form.Group>
    );
  }

  return (
    <Form.Group controlId="Location" className="position-relative">
      <Form.Label>Location</Form.Label>
      <Form.Control
        type="text"
        placeholder="Type location..."
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoComplete="off"
      />
      
      {showSuggestions && filteredLocations.length > 0 && (
        <ListGroup className="position-absolute w-100 mt-1 border shadow" 
          style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
          {filteredLocations.map((loc) => (
            <ListGroup.Item key={loc.id} action onClick={() => handleSelectLocation(loc)} className="py-2">
              {loc.label}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </Form.Group>
  );
};

// Event Incharge Dropdown Component with Search
const EventInchargeDropdown = ({ value, onChange }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState(value || '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchUsers = debounce(async (query) => {
    if (!query || query.length < 2) {
      setUsers([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `https://api.avessecurity.com/api/Designation/getDropdown/${encodeURIComponent(query)}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data?.Report) {
        setUsers(response.data.Report);
        setShowSuggestions(true);
      } else {
        setUsers([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to fetch users');
      setUsers([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    fetchUsers(inputValue);
    return () => fetchUsers.cancel();
  }, [inputValue]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (!newValue) onChange({ target: { name: 'EventIncharge', value: '' } });
  };

  const handleSelectUser = (user) => {
    setInputValue(user.username);
    onChange({ target: { name: 'EventIncharge', value: user.username } });
    setShowSuggestions(false);
  };

  const handleFocus = () => {
    if (inputValue && users.length > 0) setShowSuggestions(true);
  };

  const handleBlur = () => setTimeout(() => setShowSuggestions(false), 200);

  return (
    <Form.Group controlId="EventIncharge" className="mb-3">
      <Form.Label>Event Incharge</Form.Label>
      <div className="position-relative">
        <Form.Control
          type="text"
          name="EventIncharge"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Start typing to search..."
          autoComplete="off"
          disabled={loading}
        />
        
        {loading && (
          <div className="position-absolute end-0 top-0 mt-2 me-2">
            <Spinner animation="border" size="sm" />
          </div>
        )}
        
        {error && <Alert variant="danger" className="mt-2 py-1">{error}</Alert>}
        
        {showSuggestions && users.length > 0 && (
          <ListGroup className="position-absolute w-100 mt-1 border shadow" 
            style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
            {users.map((user) => (
              <ListGroup.Item key={user._id} action onClick={() => handleSelectUser(user)} className="py-2">
                {user.username}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </div>
    </Form.Group>
  );
};

// Event Service Functions
const fetchEvents = async () => {
  try {
    const response = await axios.get('https://api.avessecurity.com/api/event', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.data) throw new Error('Invalid response structure from server');
    
    const eventsData = response.data.events || response.data.event || response.data;
    return Array.isArray(eventsData) ? eventsData : [eventsData];
  } catch (error) {
    const enhancedError = new Error(error.message || 'Failed to fetch events');
    enhancedError.status = error.response?.status;
    throw enhancedError;
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
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(response.data.events) ? response.data.events : [response.data.events];
  } catch (error) {
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
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data || {};
  } catch (error) {
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
      headers: { Authorization: `Bearer ${token}` }
    });
    const response = await axios.delete(`${API_BASE_URL}/delete/${id}`, {  
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data || {};
  } catch (error) {
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
    setFormData(prev => ({ ...prev, [name]: value }));
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
          <EventInchargeDropdown
            value={formData.EventIncharge}
            onChange={handleChange}
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
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-2">Saving...</span>
            </>
          ) : action === 'create' ? 'Create Event' : 'Update Event'}
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
        <Button variant="outline-secondary" onClick={onHide}>Close</Button>
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
  const [activeTab, setActiveTab] = useState('table');
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      let errorMessage = err.message || 'Failed to load events';
      if (err.status === 404) errorMessage = 'Events endpoint not found. Please contact support.';
      else if (err.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        window.location.href = "/login";
      } else if (err.status >= 500) errorMessage = 'Server error. Please try again later.';
      setError(errorMessage);
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
        setError(err.response?.data?.message || err.message || 'Failed to delete event');
      } finally {
        setShowDeleteModal(false);
      }
    }
  };

  const handleSuccess = () => loadEvents();

  const filteredEvents = events.filter(event => {
    if (!event) return false;
    const matchesSearch = (
      event.EventName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      event.Client?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesType = filterType === 'All' || event.Type === filterType;
    return matchesSearch && matchesType;
  });

  const calendarEvents = filteredEvents.map(event => ({
    id: event._id,
    title: event.EventName,
    start: event.Date ? new Date(event.Date) : new Date(),
    end: event.Date ? new Date(event.Date) : new Date(),
    allDay: true,
    type: event.Type || 'Regular',
    client: event.Client,
    location: event.Location
  }));

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3174ad';
    if (event.type === 'VIP') backgroundColor = '#dc3545';
    if (event.type === 'Corporate') backgroundColor = '#6f42c1';
    if (event.type === 'Private') backgroundColor = '#20c997';

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

  const handleNavigate = (newDate) => setCalendarDate(newDate);

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
                <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
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
              <Button variant="outline-secondary" onClick={loadEvents}>
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      <Card className="shadow-sm mb-4">
        <Card.Body className="p-0">
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3 px-3">
            <Tab eventKey="table" title="Table View" />
            <Tab eventKey="calendar" title="Calendar View" />
          </Tabs>

          {activeTab === 'table' ? (
            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead className="table-light">
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
                          <Button variant="outline-info" size="sm" className="me-2"
                            onClick={() => handleView(event)} title="View">
                            <i className="bi bi-eye"></i>
                          </Button>
                          <Button variant="outline-warning" size="sm" className="me-2"
                            onClick={() => handleEdit(event)} title="Edit">
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button variant="outline-danger" size="sm"
                            onClick={() => handleDeleteClick(event)} title="Delete">
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
          ) : (
            <div className="p-3" style={{ height: '700px' }}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                defaultView="month"
                views={['month', 'week', 'day', 'agenda']}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(event) => {
                  const selected = events.find(e => e._id === event.id);
                  if (selected) handleView(selected);
                }}
                onNavigate={handleNavigate}
                date={calendarDate}
                components={{
                  event: ({ event }) => (
                    <div className="rbc-event-content">
                      <strong>{event.title}</strong>
                      {event.client && <div className="small">{event.client}</div>}
                      {event.location && <div className="small">{event.location}</div>}
                    </div>
                  ),
                }}
              />
            </div>
          )}
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
          <EventDetails event={selectedEvent} onHide={() => setShowDetails(false)} />
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
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            <i className="bi bi-trash me-1"></i> Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EventManagement;