import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Badge, Offcanvas, 
  Form, Row, Col, Spinner, Alert,
  Card, ListGroup, Container, 
  InputGroup, Modal
} from 'react-bootstrap';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:6378/api/termandcondition';

const token = localStorage.getItem("access_token");
if (!token) {
  // window.location.href = "/login";
}

// Term Service Functions
const fetchTerms = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/get`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.data || !response.data.Term) return [];
    return Array.isArray(response.data.Term) ? response.data.Term : [response.data.Term];
  } catch (error) {
    console.error('Error fetching terms:', error);
    throw error;
  }
};

const createTerm = async (termData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/create`, termData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.data || !response.data.Term) return [];
    return Array.isArray(response.data.Term) ? response.data.Term : [response.data.Term];
  } catch (error) {
    console.error('Error creating term:', error);
    throw error;
  }
};

const updateTerm = async (id, termData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/update/${id}`, termData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data || {};
  } catch (error) {
    console.error('Error updating term:', error);
    throw error;
  }
};

const deleteTerm = async (id) => {
  try {
    await axios.delete(`${API_BASE_URL}/delete/${id}`, {  
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting term:', error);
    throw error;
  }
};

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
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
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

// Term Form Component
const TermForm = ({ term, onSuccess, action, onHide }) => {
  const [formData, setFormData] = useState({
    Create: '',
    Location: '',
    Department: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (term && action === 'edit') {
      setFormData({
        Create: term.Create || '',
        Location: term.Location || '',
        Department: term.Department || ''
      });
    }
  }, [term, action]);

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
        await createTerm(formData);
      } else {
        await updateTerm(term._id, formData);
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
        <Form.Group as={Col} controlId="Create">
          <Form.Label>Term Content <span className="text-danger">*</span></Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            name="Create"
            value={formData.Create}
            onChange={handleChange}
            required
            placeholder="Enter term and condition content"
          />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} controlId="Location">
          <LocationDropdown 
            value={formData.Location}
            onChange={handleChange}
          />
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
            'Create Term'
          ) : (
            'Update Term'
          )}
        </Button>
      </div>
    </Form>
  );
};

// Term Details Component
const TermDetails = ({ term, onHide }) => {
  if (!term) return <div>No term data available</div>;

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center bg-light">
          <h4 className="mb-0">Term and Condition Details</h4>
        </Card.Header>
        <Card.Body>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <div className="d-flex flex-column">
                <strong>Content:</strong> 
                <span className="mt-2">{term.Create || 'N/A'}</span>
              </div>
            </ListGroup.Item>
            <ListGroup.Item>
              <div className="d-flex justify-content-between">
                <strong>Location :</strong> 
                <span>     {term.Location ? (
        <>
          {term.Location.PrimaryLocation} - {term.Location.SubLocation}
          {term.Location.SecondaryLocation?.[0] && (
            <> / {term.Location.SecondaryLocation[0].SecondaryLocation}</>
          )}
          {term.Location.SecondaryLocation?.[0]?.ThirdLocation?.[0] && (
            <> / {term.Location.SecondaryLocation[0].ThirdLocation[0].ThirdLocation}</>
          )}
        </>
      ) : 'N/A'}</span>
              </div>
            </ListGroup.Item>
            <ListGroup.Item>
              <div className="d-flex justify-content-between">
                <strong>Department ID:</strong> 
                <span>{term.Department?.name || 'N/A'}</span>
              </div>
            </ListGroup.Item>
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

// Main Term Management Component
const TermManagement = () => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [action, setAction] = useState('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [termToDelete, setTermToDelete] = useState(null);

  useEffect(() => {
    loadTerms();
  }, []);

  const loadTerms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTerms();
      setTerms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading terms:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load terms');
      setTerms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setAction('create');
    setSelectedTerm(null);
    setShowForm(true);
  };

  const handleEdit = (term) => {
    setAction('edit');
    setSelectedTerm(term);
    setShowForm(true);
  };

  const handleView = (term) => {
    setSelectedTerm(term);
    setShowDetails(true);
  };

  const handleDeleteClick = (term) => {
    setTermToDelete(term);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (termToDelete) {
      try {
        await deleteTerm(termToDelete._id);
        loadTerms();
      } catch (err) {
        console.error('Failed to delete term:', err);
        setError(err.response?.data?.message || err.message || 'Failed to delete term');
      } finally {
        setShowDeleteModal(false);
      }
    }
  };

  const handleSuccess = () => {
    loadTerms();
  };

  const filteredTerms = terms.filter(term => {
    if (!term) return false;
    return term.Create?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading terms...</span>
        </Spinner>
        <p className="mt-2">Loading terms and conditions...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error loading terms</Alert.Heading>
          <p>{error}</p>
          <Button variant="primary" onClick={loadTerms}>Retry</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Terms and Conditions</h2>
        <Button variant="primary" onClick={handleCreate} className="d-flex align-items-center">
          <i className=" me-2"></i> Create New Term
        </Button>
      </div>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="g-3">
            <Col md={9}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search terms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3} className="d-flex justify-content-end">
              {/* <Button variant="outline-secondary" onClick={loadTerms}>
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
                  <th>Content Preview</th>
                  <th>Department</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTerms.length > 0 ? (
                  filteredTerms.map((term) => (
                    <tr key={term._id}>
                      <td>
                        <div className="fw-semibold">
                          {term.Create?.length > 50 
                            ? `${term.Create.substring(0, 50)}...` 
                            : term.Create}
                        </div>
                      </td>
                      <td>{term.Department?.name || 'N/A'}</td>
                      <td className="text-center">
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-2"
                          onClick={() => handleView(term)}
                          title="View"
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(term)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(term)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-4">
                      {terms.length === 0 ? 'No terms available.' : 'No terms match your search criteria.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Term Form Offcanvas */}
      <Offcanvas show={showForm} onHide={() => setShowForm(false)} placement="end" className="w-50">
        <Offcanvas.Header closeButton className="bg-light">
          <Offcanvas.Title>
            {action === 'create' ? 'Create New Term' : 'Edit Term'}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <TermForm
            term={selectedTerm}
            onSuccess={handleSuccess}
            action={action}
            onHide={() => setShowForm(false)}
          />
        </Offcanvas.Body>
      </Offcanvas>

      {/* Term Details Offcanvas */}
      <Offcanvas show={showDetails} onHide={() => setShowDetails(false)} placement="end" className="w-50">
        <Offcanvas.Header closeButton className="bg-light">
          <Offcanvas.Title>Term Details</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <TermDetails 
            term={selectedTerm} 
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
          Are you sure you want to delete this term? This action cannot be undone.
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

export default TermManagement;