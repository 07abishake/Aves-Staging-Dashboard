import React, { useEffect, useState } from 'react';
import debounce from "lodash.debounce";
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  ListGroup,
  Offcanvas,
  Badge,
  Alert,
  Modal,
  Spinner,
  InputGroup
} from 'react-bootstrap';
import { Plus, Trash, Pencil, Eye, X, Check } from 'react-bootstrap-icons';

function PassSetup() {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [color, setColor] = useState('#ff0000');
  const [passes, setPasses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showCanvas, setShowCanvas] = useState(false);
  const [editPass, setEditPass] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLocation, setEditLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passToDelete, setPassToDelete] = useState(null);
  
const [searchTerm, setSearchTerm] = useState("");
const [filteredLocations, setFilteredLocations] = useState([]);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchLocations();
    fetchPasses();
  }, []);

  useEffect(() => {
  setFilteredLocations(locations);
}, [locations]);

const handleSearch = debounce((value) => {
  if (!value) {
    setFilteredLocations(locations);
  } else {
    const filtered = locations.filter((loc) =>
      loc.label.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredLocations(filtered);
  }
}, 300)

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://api.avessecurity.com/api/Location/getLocations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nested = res.data?.Location || [];
      const flattened = flattenLocations(nested);
      setLocations(flattened);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      setError('Failed to load locations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

const flattenLocations = (data) => {
  const result = [];

  data.forEach((primary) => {
    // Primary
    result.push({
      label: primary.PrimaryLocation,
      id: primary._id,
    });

    primary.SubLocation?.forEach((primarySub) => {
      // Primary Sub
      result.push({
        label: `${primary.PrimaryLocation},${primarySub.PrimarySubLocation}`,
        id: primarySub._id,
      });

      primarySub.SecondaryLocation?.forEach((secondary) => {
        // Secondary
        result.push({
          label: `${primary.PrimaryLocation},${primarySub.PrimarySubLocation},${secondary.SecondaryLocation}`,
          id: secondary._id,
        });

        secondary.SecondarySubLocation?.forEach((secondarySub) => {
          // Secondary Sub
          result.push({
            label: `${primary.PrimaryLocation},${primarySub.PrimarySubLocation},${secondary.SecondaryLocation},${secondarySub.SecondarySubLocation}`,
            id: secondarySub._id,
          });

          secondarySub.ThirdLocation?.forEach((third) => {
            // Third
            result.push({
              label: `${primary.PrimaryLocation},${primarySub.PrimarySubLocation},${secondary.SecondaryLocation},${secondarySub.SecondarySubLocation},${third.ThirdLocation} (${third.ThirdSubLocation})`,
              id: third._id,
            });
          });
        });
      });
    });
  });

  return result;
};



  const fetchPasses = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://api.avessecurity.com/api/Color/get', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPasses(res.data.CustomColorSet || []);
    } catch (error) {
      console.error('Failed to fetch color passes:', error);
      setError('Failed to load passes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedLocation) {
      setError('Please select a location');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const selectedLabel = locations.find(loc => loc.id === selectedLocation)?.label || 'Untitled';
      
      await axios.post(
        'https://api.avessecurity.com/api/Color/create',
        {
          title: selectedLabel,
          CustomColor: color,
          Hexa: color.replace('#', ''),
          LocationId: selectedLocation,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setSuccess('Pass created successfully!');
      setSelectedLocation('');
      setColor('#ff0000');
      fetchPasses();
    } catch (error) {
    console.error('Failed to create color pass:', error);
    
    // ✅ Catch and show specific backend message
    if (error.response?.status === 400 && error.response.data?.message) {
      setError(error.response.data.message);
    } else {
      setError('Failed to create pass. Please try again.');
    }
  } finally {
    setLoading(false);
  }
  };

  const confirmDelete = (pass) => {
    setPassToDelete(pass);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!passToDelete) return;
    
    setLoading(true);
    try {
      await axios.delete(
        `https://api.avessecurity.com/api/Color/delete/${passToDelete._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Pass deleted successfully!');
      fetchPasses();
    } catch (error) {
      console.error('Failed to delete pass:', error);
      setError('Failed to delete pass. Please try again.');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setPassToDelete(null);
    }
  };

  const handleEdit = (pass) => {
    setEditPass(pass);
    setColor(`#${pass.Hexa}`);
    const matchedLocation = locations.find(loc => loc.label === pass.title);
    setEditLocation(matchedLocation ? matchedLocation.id : '');
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editPass) return;
    
    setLoading(true);
    setError(null);
    try {
      const selectedLabel = locations.find(loc => loc.id === editLocation)?.label || editPass.title;
      
      await axios.put(
        `https://api.avessecurity.com/api/Color/update/${editPass._id}`,
        {
          title: selectedLabel,
          CustomColor: color,
          Hexa: color.replace('#', ''),
          LocationId: selectedLocation,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setSuccess('Pass updated successfully!');
      setEditPass(null);
      setColor('#ff0000');
      setEditLocation('');
      setShowEditModal(false);
      fetchPasses();
    } catch (error) {
      console.error('Failed to update pass:', error);
      setError('Failed to update pass. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCanvas = () => setShowCanvas(!showCanvas);

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8} xl={6}>
          <Card className="shadow-sm border-primary">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">
                <Badge bg="light" className="me-2 text-primary">1</Badge>
                Pass Setup
              </h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
              {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

              <Form.Group className="mb-3">
               <Form.Group className="mb-3 position-relative">
  <Form.Label className="fw-bold">
    <Badge bg="light" className="me-2 text-primary"></Badge>
    Location
  </Form.Label>

  {/* Search input */}
  <Form.Control
    type="text"
    placeholder="Type location..."
    value={searchTerm}
    onChange={(e) => {
      setSearchTerm(e.target.value);
      handleSearch(e.target.value);
    }}
    className="border-primary"
  />

  {/* Suggestions */}
  {searchTerm && filteredLocations.length > 0 && (
    <ListGroup
      style={{
        position: "absolute",
        zIndex: 1000,
        width: "100%",
        maxHeight: "200px",
        overflowY: "auto",
      }}
    >
      {filteredLocations.map((loc) => (
        <ListGroup.Item
          key={loc.id}
          action
          onClick={() => {
            setSelectedLocation(loc.id);
            setSearchTerm(loc.label);
            setFilteredLocations([]);
          }}
        >
          {loc.label}
        </ListGroup.Item>
      ))}
    </ListGroup>
  )}
</Form.Group>

              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">
                  <Badge bg="light" className="me-2 text-primary">3</Badge>
                  Choose Color
                </Form.Label>
                <div className="d-flex align-items-center gap-3">
                  <Form.Control
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="form-control-color p-1 border border-primary rounded"
                    title="Choose your color"
                  />
                  <div>
                    <Badge bg="light" className="text-dark fs-6">
                      HEX: <strong>{color}</strong>
                    </Badge>
                    <div 
                      className="mt-1 rounded border border-primary" 
                      style={{
                        width: '100px',
                        height: '30px',
                        backgroundColor: color
                      }}
                    />
                  </div>
                </div>
              </Form.Group>

              <div className="d-flex gap-2 mt-4">
                <Button 
                  variant="primary" 
                  onClick={handleCreate}
                  disabled={loading || !selectedLocation}
                >
                  {loading ? (
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  ) : (
                    <>
                     Create Pass
                    </>
                  )}
                </Button>
                <Button variant="outline-secondary" onClick={toggleCanvas}>
                  <Eye className="me-1" /> View Passes
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Offcanvas for viewing passes */}
      <Offcanvas show={showCanvas} onHide={toggleCanvas} placement="end" className="w-50">
        <Offcanvas.Header closeButton className="bg-light">
          <Offcanvas.Title>
            <h4 className="mb-0">
              <Badge bg="primary" className="me-2">P</Badge>
              Created Passes
            </h4>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading passes...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : Array.isArray(passes) && passes.length > 0 ? (
            <ListGroup variant="flush">
              {passes.map((pass) => (
                <ListGroup.Item key={pass._id} className="py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1">{pass.title}</h5>
                      <Badge 
                        pill 
                        style={{ 
                          backgroundColor: `#${pass.Hexa}`,
                          color: getContrastColor(pass.Hexa)
                        }}
                      >
                        #{pass.Hexa}
                      </Badge>
                    </div>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => handleEdit(pass)}
                        aria-label="Edit pass"
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={() => confirmDelete(pass)}
                        aria-label="Delete pass"
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <Alert variant="info">
              No passes created yet. Create your first one above.
            </Alert>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Edit Pass</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Location</Form.Label>
            <Form.Select
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              className="border-primary"
            >
              <option value="">Select a location</option>
              {locations.map((loc, index) => (
                <option key={index} value={loc.id}>{loc.label}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label className="fw-bold">Color</Form.Label>
            <div className="d-flex align-items-center gap-3">
              <Form.Control
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="form-control-color p-1 border border-primary rounded"
                title="Choose your color"
              />
              <div>
                <Badge bg="light" className="text-dark fs-6">
                  HEX: <strong>{color}</strong>
                </Badge>
                <div 
                  className="mt-1 rounded border border-primary" 
                  style={{
                    width: '100px',
                    height: '30px',
                    backgroundColor: color
                  }}
                />
              </div>
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleUpdate} disabled={loading}>
            {loading ? (
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
            ) : (
              <>
                <Check className="me-1" /> Save Changes
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the pass: <strong>{passToDelete?.title}</strong>?
          <br />
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? (
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
            ) : (
              'Delete'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

// Helper function to determine text color based on background
function getContrastColor(hexColor) {
  // Convert hex to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return dark or light color based on luminance
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export default PassSetup;