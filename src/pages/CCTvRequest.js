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
  Accordion,
  Nav
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
  InfoCircle,
  Search,
  Filter,
  SortDown,
  Download,
  Upload,
  ThreeDotsVertical
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
  const [showViewCanvas, setShowViewCanvas] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [requestToUpdate, setRequestToUpdate] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({
    Remarks: '',
    Status: 'Pending'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'ascending' });

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

  // Handle update form input changes
  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData({
      ...updateFormData,
      [name]: value
    });
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle sort requests
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
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

  // Set update form values when selecting a request to update
  useEffect(() => {
    if (requestToUpdate) {
      setUpdateFormData({
        Remarks: requestToUpdate.Remarks || '',
        Status: requestToUpdate.Status || 'Pending'
      });
    }
  }, [requestToUpdate]);

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
      const { data } = await axios.get('https://codeaves.avessecurity.com/api/CCTV/getAll', {
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
      const { data } = await axios.get('https://codeaves.avessecurity.com/api/Location/getLocations', {
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
      const { data } = await axios.get('https://codeaves.avessecurity.com/api/users/User-List', {
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
          `https://codeaves.avessecurity.com/api/CCTV/update/${editData._id}`,
          formData,
          config
        );
        setSuccess('Request updated successfully!');
      } else {
        await axios.post(
          'https://codeaves.avessecurity.com/api/CCTV/create',
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

  // Handle update form submission
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      // Only update Remarks and Status
      const updateData = {
        Remarks: updateFormData.Remarks,
        Status: updateFormData.Status
      };

      await axios.put(
        `https://codeaves.avessecurity.com/api/CCTV/update/${requestToUpdate._id}`,
        updateData,
        config
      );
      
      setSuccess('Request updated successfully!');
      fetchRequests();
      setShowUpdateModal(false);
      setRequestToUpdate(null);
    } catch (err) {
      console.error('Error updating CCTV request:', err);
      setError(err.response?.data?.message || 'Failed to update request');
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
        `https://codeaves.avessecurity.com/api/CCTV/delete/${requestToDelete._id}`,
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
    setShowViewCanvas(true);
  };

  const handleCloseViewCanvas = () => {
    setShowViewCanvas(false);
    setViewData(null);
  };

  const handleDeleteClick = (request) => {
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  // Handle calendar event selection
  const handleCalendarSelect = (event) => {
    const selected = requests.find(r => r._id === event.id);
    if (selected) {
      setRequestToUpdate(selected);
      setShowUpdateModal(true);
    }
  };

  const renderStatusBadge = (status) => {
    let variant = 'secondary';
    if (status === 'Approved') variant = 'success';
    if (status === 'Rejected') variant = 'danger';
    if (status === 'Pending') variant = 'warning';
    
    return <Badge bg={variant} className="px-2 py-1">{status}</Badge>;
  };

  const renderLocationSelector = (name, value, label) => {
    return (
      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold">
          <GeoAlt className="me-2 text-primary" />
          {label}
        </Form.Label>
        <Form.Select 
          name={name}
          value={value || ''}
          onChange={handleInputChange}
          isInvalid={!!formErrors.locationError}
          required
          className="border-primary"
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
      <Card className="mb-3 border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <Card.Title className="mb-0 text-primary">
              {request.Title}
            </Card.Title>
            {renderStatusBadge(request.Status)}
          </div>
          
          <div className="mb-3">
            <h6 className="text-muted d-flex align-items-center">
              <CardChecklist className="me-2" />
              Request Type
            </h6>
            <p className="ms-3">
              {request.ForMySelf ? 'For Myself' : ''}
              {request.ForMySelf && request.ForOthers ? ' & ' : ''}
              {request.ForOthers ? 'For Others' : ''}
            </p>
          </div>

          {request.ForMySelf && (
            <Accordion defaultActiveKey="0" className="mb-3">
              <Accordion.Item eventKey="0" className="border-0 shadow-sm">
                <Accordion.Header className="bg-light">
                  <Person className="me-2 text-primary" />
                  My Request Details
                </Accordion.Header>
                <Accordion.Body>
                  <Row>
                    <Col md={6}>
                      <p><strong><CalendarIcon className="me-2 text-primary" />Date:</strong> {request.MySelfDate}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong><Clock className="me-2 text-primary" />Time:</strong> {request.MySelfTime}</p>
                    </Col>
                  </Row>
                  <p><strong><GeoAlt className="me-2 text-primary" />Location:</strong> {request.MySelfLocationOFIncident}</p>
                  <p><strong><InfoCircle className="me-2 text-primary" />Reason:</strong> {request.MyselfReasonofviewing}</p>
                  <p><strong>Immediate Hold:</strong> {request.MySelfImmidiateHoldForView ? 'Yes' : 'No'}</p>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          )}

          {request.ForOthers && (
            <Accordion defaultActiveKey="1" className="mb-3">
              <Accordion.Item eventKey="1" className="border-0 shadow-sm">
                <Accordion.Header className="bg-light">
                  <Person className="me-2 text-primary" />
                  Others Request Details
                </Accordion.Header>
                <Accordion.Body>
                  <p><strong>Name:</strong> {request.ForOthersName}</p>
                  <Row>
                    <Col md={6}>
                      <p><strong><CalendarIcon className="me-2 text-primary" />Date:</strong> {request.ForOthersDate}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong><Clock className="me-2 text-primary" />Time:</strong> {request.ForOthersTime}</p>
                    </Col>
                  </Row>
                  <p><strong><GeoAlt className="me-2 text-primary" />Location:</strong> {request.ForOthersLocationOFIncident}</p>
                  <p><strong><InfoCircle className="me-2 text-primary" />Reason:</strong> {request.ForOthersReasonofviewing}</p>
                  <p><strong>Immediate Hold:</strong> {request.ForOthersImmidiateHoldForView ? 'Yes' : 'No'}</p>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          )}

          {request.Remarks && (
            <div className="mb-3">
              <h6 className="text-muted d-flex align-items-center">
                <InfoCircle className="me-2 text-primary" />
                Remarks
              </h6>
              <p className="ms-3">{request.Remarks}</p>
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={() => handleEdit(request)}
              className="d-flex align-items-center"
            >
              <Pencil size={14} className="me-1" />
              Edit
            </Button>
            <Button 
              variant="outline-danger" 
              size="sm" 
              onClick={() => handleDeleteClick(request)}
              className="d-flex align-items-center"
            >
              <Trash size={14} className="me-1" />
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
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading requests...</p>
        </div>
      );
    }

    if (error) {
      return <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>;
    }

    // Filter and sort requests
    let filteredRequests = requests.filter(request => {
      if (activeTab === 'all') return true;
      return request.Status === activeTab;
    });

    // Apply search filter
    if (searchTerm) {
      filteredRequests = filteredRequests.filter(request => 
        request.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.ForMySelf && request.MySelfLocationOFIncident?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (request.ForOthers && request.ForOthersLocationOFIncident?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filteredRequests.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    if (filteredRequests.length === 0) {
      return (
        <div className="text-center py-5">
          <Eye size={48} className="text-muted mb-3" />
          <h5 className="text-muted">No CCTV requests found</h5>
          <p className="text-muted">Try adjusting your search or create a new request</p>
        </div>
      );
    }

    return (
      <>
        <div className="mb-4 p-3 bg-white rounded shadow-sm border-0">
          <h5 className="mb-3 text-primary d-flex align-items-center">
            <CalendarIcon className="me-2" />
            Request Calendar
          </h5>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 400 }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleCalendarSelect}
          />
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="text-primary mb-0">Request List</h5>
          <span className="text-muted">{filteredRequests.length} requests found</span>
        </div>

        <div className="table-responsive">
          <Table hover className="align-middle">
            <thead className="bg-light">
              <tr>
                <th>
                  <div 
                    className="d-flex align-items-center cursor-pointer" 
                    onClick={() => handleSort('Title')}
                  >
                    Title
                    <SortDown className="ms-1" />
                  </div>
                </th>
                <th>Request Type</th>
                <th>Location</th>
                <th>
                  <div 
                    className="d-flex align-items-center cursor-pointer" 
                    onClick={() => handleSort(requests[0].ForMySelf ? 'MySelfDate' : 'ForOthersDate')}
                  >
                    Date
                    <SortDown className="ms-1" />
                  </div>
                </th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(request => (
                <tr key={request._id} className="border-bottom">
                  <td className="fw-semibold">{request.Title}</td>
                  <td>
                    {request.ForMySelf && <Badge bg="info" className="me-1">Myself</Badge>}
                    {request.ForOthers && <Badge bg="secondary">Others</Badge>}
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
                    <div className="d-flex justify-content-center gap-2">
                      <Button 
                        variant="outline-info" 
                        size="sm" 
                        onClick={() => handleView(request)}
                        className="d-flex align-items-center"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => handleEdit(request)}
                        className="d-flex align-items-center"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={() => handleDeleteClick(request)}
                        className="d-flex align-items-center"
                        title="Delete"
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
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
        <Offcanvas.Header closeButton className="bg-light border-bottom">
          <Offcanvas.Title>
            <h4 className="mb-0 text-primary">
              {editData ? (
                <>
                  <Pencil className="me-2" />
                  Edit CCTV Request
                </>
              ) : (
                <>
                  
                  Create New CCTV Request
                </>
              )}
            </h4>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-4">
          <Form onSubmit={handleFormSubmit}>
            {formErrors.generalError && (
              <Alert variant="danger" className="mb-3" onClose={() => setFormErrors({...formErrors, generalError: ''})} dismissible>
                {formErrors.generalError}
              </Alert>
            )}
            
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">
                <InfoCircle className="me-2 text-primary" />
                Title
              </Form.Label>
              <Form.Control
                type="text"
                name="Title"
                value={formData.Title}
                onChange={handleInputChange}
                placeholder="Enter request title"
                required
                className="border-primary"
              />
            </Form.Group>

            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-light">
                <h6 className="mb-0 text-primary">Request Type</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col>
                    <Form.Check
                      type="switch"
                      id="forMyself"
                      label={
                        <span className="fw-semibold">
                          <Person className="me-2 text-primary" />
                          For Myself
                        </span>
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
                        <span className="fw-semibold">
                          <Person className="me-2 text-primary" />
                          For Others
                        </span>
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
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h6 className="mb-0 text-primary">
                    <Person className="me-2" />
                    My Request Details
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          <CalendarIcon className="me-2 text-primary" />
                          Date
                        </Form.Label>
                        <Form.Control
                          type="date"
                          name="MySelfDate"
                          value={formData.MySelfDate}
                          onChange={handleInputChange}
                          required
                          className="border-primary"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          <Clock className="me-2 text-primary" />
                          Time
                        </Form.Label>
                        <Form.Control
                          type="time"
                          name="MySelfTime"
                          value={formData.MySelfTime}
                          onChange={handleInputChange}
                          required
                          className="border-primary"
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
                    <Form.Label className="fw-semibold">
                      <InfoCircle className="me-2 text-primary" />
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
                      className="border-primary"
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
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h6 className="mb-0 text-primary">
                    <Person className="me-2" />
                    Others Request Details
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      <Person className="me-2 text-primary" />
                      Name
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="ForOthersName"
                      value={formData.ForOthersName}
                      onChange={handleInputChange}
                      placeholder="Enter person's name"
                      required
                      className="border-primary"
                    />
                  </Form.Group>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          <CalendarIcon className="me-2 text-primary" />
                          Date
                        </Form.Label>
                        <Form.Control
                          type="date"
                          name="ForOthersDate"
                          value={formData.ForOthersDate}
                          onChange={handleInputChange}
                          required
                          className="border-primary"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          <Clock className="me-2 text-primary" />
                          Time
                        </Form.Label>
                        <Form.Control
                          type="time"
                          name="ForOthersTime"
                          value={formData.ForOthersTime}
                          onChange={handleInputChange}
                          required
                          className="border-primary"
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
                    <Form.Label className="fw-semibold">
                      <InfoCircle className="me-2 text-primary" />
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
                      className="border-primary"
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

            {/* <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">
                <InfoCircle className="me-2 text-primary" />
                Remarks
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="Remarks"
                value={formData.Remarks}
                onChange={handleInputChange}
                placeholder="Any additional remarks"
                className="border-primary"
              />
            </Form.Group> */}

            {/* <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">
                <InfoCircle className="me-2 text-primary" />
                Status
              </Form.Label>
              <Form.Select
                name="Status"
                value={formData.Status}
                onChange={handleInputChange}
                className="border-primary"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </Form.Select>
            </Form.Group> */}

            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" disabled={loading} size="lg" className="py-2">
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

  const renderUpdateModal = () => {
    if (!requestToUpdate) return null;
    
    return (
      <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light border-0">
          <Modal.Title className="text-primary">

            Update Request: {requestToUpdate.Title}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateSubmit}>
          <Modal.Body>
            {/* Display all request details in read-only mode */}
            <Card className="mb-3 border-0 shadow-sm">
              <Card.Header className="bg-light">
                <h6 className="mb-0 text-primary">Request Details</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <p><strong>Title:</strong> {requestToUpdate.Title}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Request Type:</strong> 
                      {requestToUpdate.ForMySelf ? ' For Myself' : ''}
                      {requestToUpdate.ForMySelf && requestToUpdate.ForOthers ? ' & ' : ''}
                      {requestToUpdate.ForOthers ? ' For Others' : ''}
                    </p>
                  </Col>
                </Row>
                
                {requestToUpdate.ForMySelf && (
                  <>
                    <hr />
                    <h6 className="text-primary">My Request Details</h6>
                    <Row>
                      <Col md={6}>
                        <p><strong>Date:</strong> {requestToUpdate.MySelfDate}</p>
                      </Col>
                      <Col md={6}>
                        <p><strong>Time:</strong> {requestToUpdate.MySelfTime}</p>
                      </Col>
                    </Row>
                    <p><strong>Location:</strong> {requestToUpdate.MySelfLocationOFIncident}</p>
                    <p><strong>Reason:</strong> {requestToUpdate.MyselfReasonofviewing}</p>
                    <p><strong>Immediate Hold:</strong> {requestToUpdate.MySelfImmidiateHoldForView ? 'Yes' : 'No'}</p>
                  </>
                )}
                
                {requestToUpdate.ForOthers && (
                  <>
                    <hr />
                    <h6 className="text-primary">Others Request Details</h6>
                    <p><strong>Name:</strong> {requestToUpdate.ForOthersName}</p>
                    <Row>
                      <Col md={6}>
                        <p><strong>Date:</strong> {requestToUpdate.ForOthersDate}</p>
                      </Col>
                      <Col md={6}>
                        <p><strong>Time:</strong> {requestToUpdate.ForOthersTime}</p>
                      </Col>
                    </Row>
                    <p><strong>Location:</strong> {requestToUpdate.ForOthersLocationOFIncident}</p>
                    <p><strong>Reason:</strong> {requestToUpdate.ForOthersReasonofviewing}</p>
                    <p><strong>Immediate Hold:</strong> {requestToUpdate.ForOthersImmidiateHoldForView ? 'Yes' : 'No'}</p>
                  </>
                )}
              </Card.Body>
            </Card>

            {/* Editable fields for Remarks and Status only */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                <InfoCircle className="me-2 text-primary" />
                Remarks
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="Remarks"
                value={updateFormData.Remarks}
                onChange={handleUpdateInputChange}
                placeholder="Update remarks"
                className="border-primary"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                <InfoCircle className="me-2 text-primary" />
                Status
              </Form.Label>
              <Form.Select
                name="Status"
                value={updateFormData.Status}
                onChange={handleUpdateInputChange}
                className="border-primary"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="outline-secondary" onClick={() => setShowUpdateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Updating...</span>
                </>
              ) : (
                <>
                  <Check className="me-2" />
                  Update
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    );
  };

  const renderDeleteModal = () => {
    return (
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-light border-0">
          <Modal.Title className="text-danger">
            <Trash className="me-2" />
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the CCTV request for <strong className="text-primary">{requestToDelete?.Title}</strong>?</p>
          <p className="text-muted">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>
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

  const renderViewCanvas = () => {
    if (!viewData) return null;
    
    return (
      <Offcanvas 
        show={showViewCanvas} 
        onHide={handleCloseViewCanvas} 
        placement="end" 
        className="w-50"
      >
        <Offcanvas.Header closeButton className="bg-light border-bottom">
          <Offcanvas.Title>
            <h4 className="mb-0 text-primary">
              <Eye className="me-2" />
              CCTV Request Details
            </h4>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-4">
          {renderRequestDetails(viewData)}
        </Offcanvas.Body>
      </Offcanvas>
    );
  };

  return (
    <Container fluid className="py-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary mb-1">
            CCTV Requests Management
          </h2>
          <p className="text-muted">Manage and monitor all CCTV viewing requests</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)} className="d-flex align-items-center">
          <PlusCircle className="me-2" />
          New Request
        </Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible className="border-0 shadow-sm">{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="border-0 shadow-sm">{success}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="text-primary mb-0">Requests Overview</h5>
            <div className="d-flex gap-2">
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="ps-5 border-primary"
                />
                <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              </div>
              <Button variant="outline-primary" className="d-flex align-items-center">
                <Filter className="me-2" />
                Filter
              </Button>
            </div>
          </div>

          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4 border-0"
          >
            <Tab eventKey="all" title="All Requests" className="border-0" />
            <Tab eventKey="Pending" title="Pending" className="border-0" />
            <Tab eventKey="Approved" title="Approved" className="border-0" />
            <Tab eventKey="Rejected" title="Rejected" className="border-0" />
          </Tabs>

          {renderTable()}
        </Card.Body>
      </Card>

      {renderForm()}
      {renderUpdateModal()}
      {renderDeleteModal()}
      {renderViewCanvas()}
    </Container>
  );
};

export default CCTvRequest;