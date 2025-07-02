import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Button, Card, Offcanvas, 
  Form, ListGroup, Badge, Stack, Alert
} from 'react-bootstrap';
import axios from 'axios';

const SustainabilityManager = () => {
  const API_URL = 'http://api.avessecurity.com:6378/api/sustainabiity';
  
  // Data states
  const [sustainabilityData, setSustainabilityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection states
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedSubModule, setSelectedSubModule] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  // Offcanvas states
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [offcanvasTitle, setOffcanvasTitle] = useState('');
  const [offcanvasType, setOffcanvasType] = useState('');
  const [formData, setFormData] = useState({});
  const [action, setAction] = useState('create');

  // Get token from localStorage
  const getAuthHeader = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      window.location.href = "/login";
      return {};
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  // Fetch all sustainability data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/get`, getAuthHeader());
        setSustainabilityData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Open offcanvas for create/edit
  const openOffcanvas = (type, action, data = {}, parentIds = {}) => {
    setOffcanvasType(type);
    setAction(action);
    setFormData(data);
    
    // Set parent IDs for creation
    if (action === 'create') {
      setSelectedCountry(parentIds.countryId || null);
      setSelectedHotel(parentIds.hotelId || null);
      setSelectedModule(parentIds.moduleId || null);
      setSelectedSubModule(parentIds.subModuleId || null);
      setSelectedClass(parentIds.classId || null);
    }

    // Set title based on action and type
    setOffcanvasTitle(`${action === 'create' ? 'Add' : 'Edit'} ${type}`);
    setShowOffcanvas(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      const payload = { ...formData };
      const authHeader = getAuthHeader();

      switch (offcanvasType) {
        case 'Country':
          if (action === 'create') {
            response = await axios.post(`${API_URL}/create`, payload, authHeader);
          } else {
            response = await axios.put(`${API_URL}/update/${selectedCountry}`, payload, authHeader);
          }
          break;
        
        case 'Hotel':
          if (action === 'create') {
            response = await axios.post(`${API_URL}/create/${selectedCountry}/Hotel`, payload, authHeader);
          } else {
            response = await axios.put(`${API_URL}/update/${selectedCountry}/Hotel/${selectedHotel}`, payload, authHeader);
          }
          break;
        
        case 'Module':
          if (action === 'create') {
            response = await axios.post(`${API_URL}/create/${selectedCountry}/Hotel/${selectedHotel}/Module`, payload, authHeader);
          } else {
            response = await axios.put(`${API_URL}/update/${selectedCountry}/Hotel/${selectedHotel}/Module/${selectedModule}`, payload, authHeader);
          }
          break;
        
        case 'SubModule':
          if (action === 'create') {
            response = await axios.post(`${API_URL}/create/${selectedCountry}/Hotel/${selectedHotel}/Module/${selectedModule}/SubModule`, payload, authHeader);
          } else {
            response = await axios.put(`${API_URL}/update/${selectedCountry}/Hotel/${selectedHotel}/Module/${selectedModule}/SubModule/${selectedSubModule}`, payload, authHeader);
          }
          break;
        
        case 'Class':
          if (action === 'create') {
            response = await axios.post(`${API_URL}/create/${selectedCountry}/Hotel/${selectedHotel}/Module/${selectedModule}/SubModule/${selectedSubModule}/Class`, payload, authHeader);
          } else {
            response = await axios.put(`${API_URL}/update/${selectedCountry}/Hotel/${selectedHotel}/Module/${selectedModule}/SubModule/${selectedSubModule}/Class/${selectedClass}`, payload, authHeader);
          }
          break;
        
        case 'Input':
          if (action === 'create') {
            response = await axios.post(`${API_URL}/create/${selectedCountry}/Hotel/${selectedHotel}/Module/${selectedModule}/SubModule/${selectedSubModule}/Class/${selectedClass}/Input`, payload, authHeader);
          } else {
            response = await axios.put(`${API_URL}/update/${selectedCountry}/Hotel/${selectedHotel}/Module/${selectedModule}/SubModule/${selectedSubModule}/Class/${selectedClass}/Input/${formData._id}`, payload, authHeader);
          }
          break;
        
        default:
          break;
      }

      // Refresh data after successful operation
      const refreshResponse = await axios.get(`${API_URL}/get`, authHeader);
      setSustainabilityData(refreshResponse.data);
      setShowOffcanvas(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle delete operations
  const handleDelete = async (type, ids) => {
    try {
      let url = `${API_URL}/delete`;
      const authHeader = getAuthHeader();
      
      switch (type) {
        case 'Country':
          url += `/${ids.countryId}`;
          break;
        case 'Hotel':
          url += `/${ids.countryId}/Hotel/${ids.hotelId}`;
          break;
        case 'Module':
          url += `/${ids.countryId}/Hotel/${ids.hotelId}/Module/${ids.moduleId}`;
          break;
        case 'SubModule':
          url += `/${ids.countryId}/Hotel/${ids.hotelId}/Module/${ids.moduleId}/SubModule/${ids.subModuleId}`;
          break;
        case 'Class':
          url += `/${ids.countryId}/Hotel/${ids.hotelId}/Module/${ids.moduleId}/SubModule/${ids.subModuleId}/Class/${ids.classId}`;
          break;
        case 'Input':
          url += `/${ids.countryId}/Hotel/${ids.hotelId}/Module/${ids.moduleId}/SubModule/${ids.subModuleId}/Class/${ids.classId}/Input/${ids.inputId}`;
          break;
        default:
          break;
      }

      await axios.delete(url, authHeader);
      
      // Refresh data after successful deletion
      const response = await axios.get(`${API_URL}/get`, authHeader);
      setSustainabilityData(response.data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Render form fields based on type
  const renderFormFields = () => {
    switch (offcanvasType) {
      case 'Country':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Country Name</Form.Label>
            <Form.Control
              type="text"
              name="Country"
              value={formData.Country || ''}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
        );
      
      case 'Hotel':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Hotel Name</Form.Label>
            <Form.Control
              type="text"
              name="HotelName"
              value={formData.HotelName || ''}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
        );
      
      case 'Module':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Module Name</Form.Label>
            <Form.Control
              type="text"
              name="AddModule"
              value={formData.AddModule || ''}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
        );
      
      case 'SubModule':
        return (
          <Form.Group className="mb-3">
            <Form.Label>SubModule Name</Form.Label>
            <Form.Control
              type="text"
              name="AddSubModule"
              value={formData.AddSubModule || ''}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
        );
      
      case 'Class':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Class Name</Form.Label>
            <Form.Control
              type="text"
              name="Addclass"
              value={formData.Addclass || ''}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
        );
      
      case 'Input':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Input Value</Form.Label>
            <Form.Control
              type="text"
              name="AddInput"
              value={formData.AddInput || ''}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
        );
      
      default:
        return null;
    }
  };

  // Render nested items recursively
  const renderNestedItems = (items, type, parentIds) => {
    if (!items || items.length === 0) {
      return <Alert variant="info">No {type}s found</Alert>;
    }

    return items.map((item) => {
      const itemId = item._id;
      const itemName = item[`Add${type}`] || item[`${type}Name`] || `Unnamed ${type}`;
      const nextType = getNextType(type);
      const nextItems = item[nextType] || [];

      return (
        <Card key={itemId} className="mb-3">
          <Card.Header>
            <Stack direction="horizontal" gap={3}>
              <div className="me-auto">{itemName}</div>
              <div>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="me-2"
                  onClick={() => openOffcanvas(type, 'edit', item, parentIds)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDelete(type, { ...parentIds, [`${type.toLowerCase()}Id`]: itemId })}
                >
                  Delete
                </Button>
              </div>
            </Stack>
          </Card.Header>
          <Card.Body>
            {nextType && (
              <Button
                variant={getButtonVariant(nextType)}
                size="sm"
                className="mb-3"
                onClick={() => openOffcanvas(
                  nextType, 
                  'create', 
                  {}, 
                  { ...parentIds, [`${type.toLowerCase()}Id`]: itemId }
                )}
              >
                Add {nextType}
              </Button>
            )}
            
            {renderNestedItems(nextItems, nextType, { ...parentIds, [`${type.toLowerCase()}Id`]: itemId })}
          </Card.Body>
        </Card>
      );
    });
  };

  // Helper function to get next type in hierarchy
  const getNextType = (currentType) => {
    switch (currentType) {
      case 'Country': return 'Hotel';
      case 'Hotel': return 'Module';
      case 'Module': return 'SubModule';
      case 'SubModule': return 'Class';
      case 'Class': return 'Input';
      default: return null;
    }
  };

  // Helper function to get button variant based on type
  const getButtonVariant = (type) => {
    switch (type) {
      case 'Hotel': return 'success';
      case 'Module': return 'info';
      case 'SubModule': return 'warning';
      case 'Class': return 'primary';
      case 'Input': return 'secondary';
      default: return 'primary';
    }
  };

  if (loading) return <Container className="mt-4"><Alert variant="info">Loading...</Alert></Container>;
  if (error) return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <h2 className="mb-4">Sustainability Management</h2>
          
          <Button 
            variant="primary" 
            className="mb-3"
            onClick={() => openOffcanvas('Country', 'create')}
          >
            Add Country
          </Button>
          
          {renderNestedItems(sustainabilityData, 'Country', {})}
        </Col>
      </Row>

      {/* Offcanvas for all CRUD operations */}
      <Offcanvas show={showOffcanvas} onHide={() => setShowOffcanvas(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>{offcanvasTitle}</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form onSubmit={handleSubmit}>
            {renderFormFields()}
            <div className="d-flex justify-content-end mt-3">
              <Button variant="secondary" onClick={() => setShowOffcanvas(false)} className="me-2">
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {action === 'create' ? 'Create' : 'Update'}
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  );
};

export default SustainabilityManager;