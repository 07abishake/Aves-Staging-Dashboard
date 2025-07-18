import React, { useState, useEffect } from 'react';
import { 
  Container, Accordion, Form, Button, Alert, Badge, 
  Offcanvas, Stack, Card, Row, Col, ListGroup, Modal
} from 'react-bootstrap';
import axios from 'axios';
import { Pencil, Trash, Eye, Plus, ChevronDown, ChevronUp, Pen } from 'react-bootstrap-icons';

const SustainabilityBuilder = () => {
  // State for form inputs
  const [formData, setFormData] = useState({
    countryName: '',
    hotelName: '',
    moduleName: '',
    subModuleName: '',
    className: '',
    inputName: ''
  });

  // State for IDs
  const [ids, setIds] = useState({
    countryId: '',
    hotelId: '',
    moduleId: '',
    subModuleId: '',
    classId: ''
  });

  // State for messages and errors
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // State for data
  const [sustainabilityData, setSustainabilityData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentLevel, setCurrentLevel] = useState('');

  const token = localStorage.getItem("access_token");
  const BASE_API = "http://api.avessecurity.com:6378/api/sustainabiity";

  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset messages
  const resetMessages = () => {
    setMessage('');
    setError('');
  };

  // Fetch all sustainability data
  const fetchSustainabilityData = async () => {
    try {
      const res = await axios.get(`${BASE_API}/get`, config);
      setSustainabilityData(res.data.SustainAbility);
    } catch (err) {
      setError('Error fetching data');
    }
  };

  // Count items for statistics
  // const countItems = (data, ...properties) => {
  //   return data?.reduce((acc, item) => {
  //     let current = item;
  //     for (const prop of properties) {
  //       current = current?.[prop];
  //       if (!current) break;
  //     }
  //     return acc + (Array.isArray(current) ? current.length : 0);
  //   }, 0) || 0;
  // };

  // Statistics
  // const stats = {
  //   countries: sustainabilityData.length,
  //   hotels: countItems(sustainabilityData, 'Hotel'),
  //   modules: countItems(sustainabilityData, 'Hotel', 'Module'),
  //   subModules: countItems(sustainabilityData, 'Hotel', 'Module', 'SubModule'),
  //   classes: countItems(sustainabilityData, 'Hotel', 'Module', 'SubModule', 'Class'),
  //   inputs: countItems(sustainabilityData, 'Hotel', 'Module', 'SubModule', 'Class', 'Input')
  // };

  // Create operations
  const createItem = async (level) => {
    resetMessages();
    try {
      let url = BASE_API;
      let data = {};
      let idPath = '';

      switch(level) {
        case 'country':
          url += '/create';
          data = { Country: formData.countryName };
          break;
        case 'hotel':
          url += `/create/${ids.countryId}/Hotel`;
          data = { HotelName: formData.hotelName };
          idPath = 'Hotel';
          break;
        case 'module':
          url += `/create/${ids.countryId}/Hotel/${ids.hotelId}/Module`;
          data = { AddModule: formData.moduleName };
          idPath = 'Hotel.Module';
          break;
        case 'subModule':
          url += `/create/${ids.countryId}/Hotel/${ids.hotelId}/Module/${ids.moduleId}/SubModule`;
          data = { AddSubModule: formData.subModuleName };
          idPath = 'Hotel.Module.SubModule';
          break;
        case 'class':
          url += `/create/${ids.countryId}/Hotel/${ids.hotelId}/Module/${ids.moduleId}/SubModule/${ids.subModuleId}/Class`;
          data = { Addclass: formData.className };
          idPath = 'Hotel.Module.SubModule.Class';
          break;
        case 'input':
          url += `/create/${ids.countryId}/Hotel/${ids.hotelId}/Module/${ids.moduleId}/SubModule/${ids.subModuleId}/Class/${ids.classId}/Input`;
          data = { AddInput: formData.inputName };
          break;
        default:
          break;
      }

      const res = await axios.post(url, data, config);
      
      if (idPath) {
        const path = idPath.split('.');
        let item = res.data.SustainAbility;
        path.forEach(p => {
          item = item[p];
          if (Array.isArray(item)) item = item[item.length - 1];
        });
        setIds(prev => ({ ...prev, [`${level}Id`]: item._id }));
      }

      setMessage(`${level.charAt(0).toUpperCase() + level.slice(1)} created successfully!`);
      fetchSustainabilityData();
    } catch (err) {
      setError(`Error creating ${level}`);
    }
  };

  // Open modal for actions
  const openModal = (action, level, item = null, parentIds = {}) => {
    setCurrentAction(action);
    setCurrentLevel(level);
    setCurrentItem(item);
    
    // Set form fields if editing
    if (action === 'edit' && item) {
      const fieldName = 
        level === 'country' ? 'countryName' :
        level === 'hotel' ? 'hotelName' :
        level === 'module' ? 'moduleName' :
        level === 'subModule' ? 'subModuleName' :
        level === 'class' ? 'className' : 'inputName';
      
      setFormData(prev => ({
        ...prev,
        [fieldName]: item[`Add${level.charAt(0).toUpperCase() + level.slice(1)}`] || 
                     item[`${level.charAt(0).toUpperCase() + level.slice(1)}Name`] || 
                     item.Country || ''
      }));
      
      setIds(prev => ({ ...prev, ...parentIds }));
    }

    // Set modal content based on action
    switch(action) {
      case 'edit':
        setModalTitle(`Edit ${level}`);
        setModalContent(renderEditForm(level));
        break;
      case 'view':
        setModalTitle(`View ${level}`);
        setModalContent(renderViewContent(level, item));
        break;
      case 'delete':
        setModalTitle(`Delete ${level}`);
        setModalContent(renderDeleteConfirmation(level, item));
        setIds(prev => ({ ...prev, ...parentIds }));
        break;
      default:
        break;
    }

    setShowModal(true);
  };

  // Handle update
  const handleUpdate = async () => {
    resetMessages();
    try {
      let url = BASE_API;
      let data = {};

      switch(currentLevel) {
        case 'country':
          url += `/update/${currentItem._id}`;
          data = { Country: formData.countryName };
          break;
        case 'hotel':
          url += `/update/${ids.countryId}/Hotel/${currentItem._id}`;
          data = { HotelName: formData.hotelName };
          break;
        case 'module':
          url += `/update/${ids.countryId}/Hotel/${ids.hotelId}/Module/${currentItem._id}`;
          data = { AddModule: formData.moduleName };
          break;
        case 'subModule':
          url += `/update/${ids.countryId}/Hotel/${ids.hotelId}/Module/${ids.moduleId}/SubModule/${currentItem._id}`;
          data = { AddSubModule: formData.subModuleName };
          break;
        case 'class':
          url += `/update/${ids.countryId}/Hotel/${ids.hotelId}/Module/${ids.moduleId}/SubModule/${ids.subModuleId}/Class/${currentItem._id}`;
          data = { Addclass: formData.className };
          break;
        case 'input':
          url += `/update/${ids.countryId}/Hotel/${ids.hotelId}/Module/${ids.moduleId}/SubModule/${ids.subModuleId}/Class/${ids.classId}/Input/${currentItem._id}`;
          data = { AddInput: formData.inputName };
          break;
        default:
          break;
      }

      await axios.put(url, data, config);
      setMessage(`${currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)} updated successfully!`);
      setShowModal(false);
      fetchSustainabilityData();
    } catch (err) {
      setError(`Error updating ${currentLevel}`);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    resetMessages();
    try {
      let url = BASE_API;

      switch(currentLevel) {
        case 'country':
          url += `/delete/${currentItem._id}`;
          break;
        case 'hotel':
          url += `/delete/${ids.countryId}/Hotel/${currentItem._id}`;
          break;
        case 'module':
          url += `/delete/${ids.countryId}/Hotel/${ids.hotelId}/Module/${currentItem._id}`;
          break;
        case 'subModule':
          url += `/delete/${ids.countryId}/Hotel/${ids.hotelId}/Module/${ids.moduleId}/SubModule/${currentItem._id}`;
          break;
        case 'class':
          url += `/delete/${ids.countryId}/Hotel/${ids.hotelId}/Module/${ids.moduleId}/SubModule/${ids.subModuleId}/Class/${currentItem._id}`;
          break;
        case 'input':
          url += `/delete/${ids.countryId}/Hotel/${ids.hotelId}/Module/${ids.moduleId}/SubModule/${ids.subModuleId}/Class/${ids.classId}/Input/${currentItem._id}`;
          break;
        default:
          break;
      }

      await axios.delete(url, config);
      setMessage(`${currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)} deleted successfully!`);
      setShowModal(false);
      fetchSustainabilityData();
    } catch (err) {
      setError(`Error deleting ${currentLevel}`);
    }
  };

  // Render edit form
  const renderEditForm = (level) => {
    const fieldName = 
      level === 'country' ? 'countryName' :
      level === 'hotel' ? 'hotelName' :
      level === 'module' ? 'moduleName' :
      level === 'subModule' ? 'subModuleName' :
      level === 'class' ? 'className' : 'inputName';

    return (
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>{level.charAt(0).toUpperCase() + level.slice(1)} Name</Form.Label>
          <Form.Control
            type="text"
            name={fieldName}
            value={formData[fieldName]}
            onChange={handleInputChange}
          />
        </Form.Group>
        
        <Stack direction="horizontal" gap={2} className="mt-4">
          <Button variant="primary" onClick={handleUpdate}>
            Save Changes
          </Button>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
        </Stack>
      </Form>
    );
  };

  // Render view content
  const renderViewContent = (level, item) => {
    return (
      <div>
        <Card className="mb-3">
          <Card.Body>
            <Card.Title>{level.charAt(0).toUpperCase() + level.slice(1)} Details</Card.Title>
            <Card.Text>
              <strong>Name:</strong> {item[`Add${level.charAt(0).toUpperCase() + level.slice(1)}`] || 
                                    item[`${level.charAt(0).toUpperCase() + level.slice(1)}Name`] || 
                                    item.Country}
            </Card.Text>
            <Card.Text>
              <strong>ID:</strong> {item._id}
            </Card.Text>
            {item.createdAt && (
              <Card.Text>
                <strong>Created:</strong> {new Date(item.createdAt).toLocaleString()}
              </Card.Text>
            )}
          </Card.Body>
        </Card>
        
        <Button 
          variant="outline-primary" 
          onClick={() => {
            setShowModal(false);
            setTimeout(() => openModal('edit', level, item), 300);
          }}
        >
          <Pencil className="me-1" /> Edit
        </Button>
      </div>
    );
  };

  // Render delete confirmation
  const renderDeleteConfirmation = (level, item) => {
    return (
      <div>
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Confirm Deletion</Alert.Heading>
          <p>
            Are you sure you want to delete this {level}? This action cannot be undone.
          </p>
          <hr />
          <p className="mb-0">
            <strong>Item to delete:</strong> {item[`Add${level.charAt(0).toUpperCase() + level.slice(1)}`] || 
                                            item[`${level.charAt(0).toUpperCase() + level.slice(1)}Name`] || 
                                            item.Country}
          </p>
        </Alert>
        
        <Stack direction="horizontal" gap={2} className="mt-4">
          <Button variant="danger" onClick={handleDelete}>
            <Trash className="me-1" /> Delete
          </Button>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
        </Stack>
      </div>
    );
  };

  // Render create form for a level
  const renderCreateForm = (level, disabled) => {
    const fieldName = 
      level === 'country' ? 'countryName' :
      level === 'hotel' ? 'hotelName' :
      level === 'module' ? 'moduleName' :
      level === 'subModule' ? 'subModuleName' :
      level === 'class' ? 'className' : 'inputName';

    const buttonText = 
      level === 'country' ? 'Create Country' :
      level === 'hotel' ? 'Add Hotel' :
      level === 'module' ? 'Add Module' :
      level === 'subModule' ? 'Add SubModule' :
      level === 'class' ? 'Add Class' : 'Add Input';

    return (
      <Form.Group className="mb-3">
        <Form.Label>{level.charAt(0).toUpperCase() + level.slice(1)} Name</Form.Label>
        <Form.Control
          type="text"
          name={fieldName}
          value={formData[fieldName]}
          onChange={handleInputChange}
          placeholder={`Enter ${level} name`}
          disabled={disabled}
        />
        <Button 
          variant="primary" 
          className="mt-2" 
          onClick={() => createItem(level)} 
          disabled={!formData[fieldName] || disabled}
        >
          <Pencil className="me-1" /> {buttonText}
        </Button>
      </Form.Group>
    );
  };

  // Render item with actions
  const renderItem = (level, item, parentIds = {}) => {
    const name = item[`Add${level.charAt(0).toUpperCase() + level.slice(1)}`] || 
                 item[`${level.charAt(0).toUpperCase() + level.slice(1)}Name`] || 
                 item.Country;
    
    const count = item[level === 'country' ? 'Hotel' : 
                      level === 'hotel' ? 'Module' : 
                      level === 'module' ? 'SubModule' : 
                      level === 'subModule' ? 'Class' : 
                      level === 'class' ? 'Input' : '']?.length || 0;

    const badgeVariant = 
      level === 'country' ? 'primary' : 
      level === 'hotel' ? 'info' : 
      level === 'module' ? 'warning' : 
      level === 'subModule' ? 'success' : 
      level === 'class' ? 'danger' : 'secondary';

    return (
      <div className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
        <div className="d-flex align-items-center">
          <span className="fw-bold me-2">{name}</span>
          {count > 0 && <Badge bg={badgeVariant}>{count}</Badge>}
        </div>
        <Stack direction="horizontal" gap={1}>
          <Button 
            variant="outline-info" 
            size="sm" 
            onClick={() => openModal('view', level, item)}
            title="View"
          >
            <Eye />
          </Button>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={() => openModal('edit', level, item, parentIds)}
            title="Edit"
          >
            <Pencil />
          </Button>
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={() => openModal('delete', level, item, parentIds)}
            title="Delete"
          >
            <Trash />
          </Button>
        </Stack>
      </div>
    );
  };

  // Render nested items
  const renderNestedItems = (items, level, parentIds = {}) => {
    if (!items || items.length === 0) return null;

    return items.map(item => {
      const newParentIds = { ...parentIds };
      if (level === 'hotel') newParentIds.countryId = parentIds.countryId;
      if (level === 'module') {
        newParentIds.countryId = parentIds.countryId;
        newParentIds.hotelId = item._id;
      }
      if (level === 'subModule') {
        newParentIds.countryId = parentIds.countryId;
        newParentIds.hotelId = parentIds.hotelId;
        newParentIds.moduleId = item._id;
      }
      if (level === 'class') {
        newParentIds.countryId = parentIds.countryId;
        newParentIds.hotelId = parentIds.hotelId;
        newParentIds.moduleId = parentIds.moduleId;
        newParentIds.subModuleId = item._id;
      }
      if (level === 'input') {
        newParentIds.countryId = parentIds.countryId;
        newParentIds.hotelId = parentIds.hotelId;
        newParentIds.moduleId = parentIds.moduleId;
        newParentIds.subModuleId = parentIds.subModuleId;
        newParentIds.classId = item._id;
      }

      return (
        <Accordion.Item key={item._id} eventKey={item._id}>
          <Accordion.Header>
            {renderItem(level, item, parentIds)}
          </Accordion.Header>
          <Accordion.Body>
            {level === 'country' && renderNestedItems(item.Hotel, 'hotel', { countryId: item._id })}
            {level === 'hotel' && renderNestedItems(item.Module, 'module', { ...parentIds, hotelId: item._id })}
            {level === 'module' && renderNestedItems(item.SubModule, 'subModule', { ...parentIds, moduleId: item._id })}
            {level === 'subModule' && renderNestedItems(item.Class, 'class', { ...parentIds, subModuleId: item._id })}
            {level === 'class' && renderNestedItems(item.Input, 'input', { ...parentIds, classId: item._id })}
          </Accordion.Body>
        </Accordion.Item>
      );
    });
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchSustainabilityData();
  }, []);

  return (
    <Container className="my-4">
      <h2 className="mb-4 text-primary">
        <span className=" me-2"></span>
        Sustainability Management
      </h2>
      
      {/* Stats Cards
      <Row className="g-4 mb-4">
        {Object.entries(stats).map(([key, value]) => (
          <Col key={key} md={4} lg={2}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="text-center">
                <Card.Title className="text-capitalize">{key}</Card.Title>
                <Badge 
                  bg={
                    key === 'countries' ? 'primary' : 
                    key === 'hotels' ? 'info' : 
                    key === 'modules' ? 'warning' : 
                    key === 'subModules' ? 'success' : 
                    key === 'classes' ? 'danger' : 'secondary'
                  } 
                  pill 
                  className="fs-5 px-3 py-2"
                >
                  {value}
                </Badge>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row> */}

      {/* Messages */}
      {message && (
        <Alert variant="success" onClose={() => setMessage('')} dismissible className="mb-4">
          {message}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible className="mb-4">
          {error}
        </Alert>
      )}

      {/* Create Forms */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-light">
          <h5 className="mb-0">Create New Items</h5>
        </Card.Header>
        <Card.Body>
          <Accordion defaultActiveKey="0">
            <Accordion.Item eventKey="0">
              <Accordion.Header>Create Country</Accordion.Header>
              <Accordion.Body>
                {renderCreateForm('country', false)}
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="1" disabled={!ids.countryId}>
              <Accordion.Header>Add Hotel</Accordion.Header>
              <Accordion.Body>
                {renderCreateForm('hotel', !ids.countryId)}
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="2" disabled={!ids.hotelId}>
              <Accordion.Header>Add Module</Accordion.Header>
              <Accordion.Body>
                {renderCreateForm('module', !ids.hotelId)}
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="3" disabled={!ids.moduleId}>
              <Accordion.Header>Add SubModule</Accordion.Header>
              <Accordion.Body>
                {renderCreateForm('subModule', !ids.moduleId)}
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="4" disabled={!ids.subModuleId}>
              <Accordion.Header>Add Class</Accordion.Header>
              <Accordion.Body>
                {renderCreateForm('class', !ids.subModuleId)}
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="5" disabled={!ids.classId}>
              <Accordion.Header>Add Input</Accordion.Header>
              <Accordion.Body>
                {renderCreateForm('input', !ids.classId)}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Card.Body>
      </Card>

      {/* Data Display */}
      {sustainabilityData.length > 0 && (
        <Card className="shadow-sm">
          <Card.Header className="bg-light">
            <h5 className="mb-0">Vew Sustainability</h5>
          </Card.Header>
          <Card.Body>
            <Accordion>
              {renderNestedItems(sustainabilityData, 'country')}
            </Accordion>
          </Card.Body>
        </Card>
      )}

      {/* Modal for Edit/View/Delete */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalContent}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default SustainabilityBuilder;