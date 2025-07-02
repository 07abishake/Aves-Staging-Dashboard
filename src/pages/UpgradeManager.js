import React, { useEffect, useState } from 'react';
import { 
  Container, Card, Button, Offcanvas, Form, 
  Row, Col, Badge, Spinner, Alert, Image, 
  ListGroup, Modal 
} from 'react-bootstrap';
import axios from 'axios';
import moment from 'moment';

const UpgradeManager = () => {
  const [upgrades, setUpgrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showViewCanvas, setShowViewCanvas] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [currentUpgrade, setCurrentUpgrade] = useState(null);
  const [formData, setFormData] = useState({
    OEItems: '',
    QuantityOnhand: '',
    Quantityrequired: '',
    PricePerItem: '',
    TotalPrice: '',
    Description: '',
    Department: '',
    OriginalProduct: '',
    QuantityInStock: '',
    PictureOfTheNewproduct: [],
    PictureOfTheExistingProduct: []
  });
  const [newProductImages, setNewProductImages] = useState([]);
  const [existingProductImages, setExistingProductImages] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const token = localStorage.getItem('access_token');
  const user = JSON.parse(localStorage.getItem('user'));
  if (!token) window.location.href = '/login';

  useEffect(() => {
    fetchUpgrades();
  }, []);

  const fetchUpgrades = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('https://api.avessecurity.com/api/upgrade/get', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data && Array.isArray(res.data.Upgrade)) {
        setUpgrades(res.data.Upgrade);
      } else {
        setUpgrades([]);
        setError('No upgrades found');
      }
    } catch (error) {
      setError('Failed to fetch upgrades');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUpgrade = (upgrade) => {
    setCurrentUpgrade(upgrade);
    setShowViewCanvas(true);
  };

  const handleOpenForm = (upgrade = null) => {
    if (upgrade) {
      setEditMode(true);
      setCurrentId(upgrade._id);
      setFormData({ 
        ...upgrade,
        SubmittedDate: upgrade.SubmittedDate ? moment(upgrade.SubmittedDate).format('YYYY-MM-DD') : '',
        SubmittedTime: upgrade.SubmittedTime || ''
      });
      setNewProductImages(upgrade.PictureOfTheNewproduct || []);
      setExistingProductImages(upgrade.PictureOfTheExistingProduct || []);
    } else {
      setEditMode(false);
      setCurrentId(null);
      setFormData({
        OEItems: '',
        QuantityOnhand: '',
        Quantityrequired: '',
        PricePerItem: '',
        TotalPrice: '',
        Description: '',
        Department: '',
        OriginalProduct: '',
        QuantityInStock: '',
        PictureOfTheNewproduct: [],
        PictureOfTheExistingProduct: [],
        SubmittedBy: user?.username || '',
        SubmittedDate: moment().format('YYYY-MM-DD'),
        SubmittedTime: moment().format('HH:mm')
      });
      setNewProductImages([]);
      setExistingProductImages([]);
    }
    setShowForm(true);
  };

  const handleCloseAll = () => {
    setShowForm(false);
    setShowViewCanvas(false);
    setEditMode(false);
    setCurrentId(null);
    setCurrentUpgrade(null);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleImageUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setLoading(true);
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));

      const res = await axios.post('https://api.avessecurity.com/api/upload', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (type === 'new') {
        setNewProductImages(prev => [...prev, ...res.data.urls]);
      } else {
        setExistingProductImages(prev => [...prev, ...res.data.urls]);
      }
    } catch (error) {
      setError('Failed to upload images');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index, type) => {
    if (type === 'new') {
      setNewProductImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setExistingProductImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        PictureOfTheNewproduct: newProductImages,
        PictureOfTheExistingProduct: existingProductImages,
        SubmittedBy: user?.username || '',
        SubmittedDate: moment().toDate(),
        SubmittedTime: moment().format('HH:mm'),
        OrganizationId: user?.organizationId
      };

      if (editMode) {
        await axios.put(`https://api.avessecurity.com/api/upgrade/update/${currentId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('https://api.avessecurity.com/api/upgrade/create', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      fetchUpgrades();
      handleCloseAll();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save upgrade');
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`https://api.avessecurity.com/api/upgrade/delete/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUpgrades();
      setShowDeleteModal(false);
    } catch (error) {
      setError('Failed to delete upgrade');
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Card className="shadow-sm border-0">
        <Card.Body className="p-4">
          <Row className="mb-4 align-items-center">
            <Col>
              <h4 className="mb-0 text-primary">Upgrade Manager</h4>
              <p className="text-muted mb-0">Manage equipment upgrades and requests</p>
            </Col>
            <Col className="text-end">
              <Button 
                variant="primary" 
                onClick={() => handleOpenForm()}
                className="shadow-sm"
              >
                <i className=" me-2"></i>Add Upgrade
              </Button>
            </Col>
          </Row>

          {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

          {loading && upgrades.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading upgrades...</p>
            </div>
          ) : upgrades.length === 0 ? (
            <Card className="text-center py-5 shadow-sm">
              <Card.Body>
                <i className="bi bi-box-seam text-muted" style={{ fontSize: '3rem' }}></i>
                <h5 className="mt-3">No Upgrades Found</h5>
                <p className="text-muted">Create your first upgrade request</p>
              </Card.Body>
            </Card>
          ) : (
            <Row xs={1} md={2} lg={3} className="g-4">
              {upgrades.map((item) => (
                <Col key={item._id}>
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <Card.Title className="mb-0">
                          {item.OEItems || 'No Item Name'}
                          {item.ReportNo && (
                            <small className="d-block text-muted">Report #: {item.ReportNo}</small>
                          )}
                        </Card.Title>
                        <Badge bg="info" className="text-dark">
                          {item.Department || 'No Department'}
                        </Badge>
                      </div>
                      
                      <div className="mb-3">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Qty Required:</span>
                          <strong>{item.Quantityrequired || 'N/A'}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Total Price:</span>
                          <strong>${item.TotalPrice || '0.00'}</strong>
                        </div>
                      </div>

                      {item.Description && (
                        <Card.Text className="text-muted small mb-3">
                          {item.Description.length > 100 
                            ? `${item.Description.substring(0, 100)}...` 
                            : item.Description}
                        </Card.Text>
                      )}

                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          Submitted by {item.SubmittedBy || 'Unknown'} on {moment(item.SubmittedDate).format('MMM D, YYYY')}
                        </small>
                        <div>
                          <Button 
                            variant="outline-info" 
                            size="sm" 
                            onClick={() => handleViewUpgrade(item)}
                            className="me-2"
                          >
                            <i className="bi bi-eye "></i>
                          </Button>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => handleOpenForm(item)}
                            className="me-2"
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => confirmDelete(item._id)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* View Offcanvas */}
      <Offcanvas show={showViewCanvas} onHide={handleCloseAll} placement="end" style={{ width: '600px' }}>
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title>
            <i className="bi bi-eye p-3"></i>
            Upgrade Details
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {currentUpgrade && (
            <>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between">
                  <span className="fw-bold">Report #:</span>
                  <span>{currentUpgrade.ReportNo || 'N/A'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span className="fw-bold">OE Items:</span>
                  <span>{currentUpgrade.OEItems || 'N/A'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span className="fw-bold">Original Product:</span>
                  <span>{currentUpgrade.OriginalProduct || 'N/A'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span className="fw-bold">Quantity On Hand:</span>
                  <span>{currentUpgrade.QuantityOnhand || 'N/A'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span className="fw-bold">Quantity Required:</span>
                  <span>{currentUpgrade.Quantityrequired || 'N/A'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span className="fw-bold">Quantity In Stock:</span>
                  <span>{currentUpgrade.QuantityInStock || 'N/A'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span className="fw-bold">Price Per Item:</span>
                  <span>${currentUpgrade.PricePerItem || '0.00'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span className="fw-bold">Total Price:</span>
                  <span>${currentUpgrade.TotalPrice || '0.00'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span className="fw-bold">Department:</span>
                  <span>{currentUpgrade.Department || 'N/A'}</span>
                </ListGroup.Item>
                <ListGroup.Item>
                  <span className="fw-bold">Description:</span>
                  <p>{currentUpgrade.Description || 'No description provided'}</p>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span className="fw-bold">Submitted By:</span>
                  <span>{currentUpgrade.SubmittedBy || 'N/A'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span className="fw-bold">Submitted On:</span>
                  <span>
                    {moment(currentUpgrade.SubmittedDate).format('MMM D, YYYY')} at {currentUpgrade.SubmittedTime || 'N/A'}
                  </span>
                </ListGroup.Item>
              </ListGroup>

              {currentUpgrade.PictureOfTheNewproduct?.length > 0 && (
                <div className="mt-4">
                  <h6>New Product Images</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {currentUpgrade.PictureOfTheNewproduct.map((img, index) => (
                      <Image key={index} src={img} thumbnail style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                    ))}
                  </div>
                </div>
              )}

              {currentUpgrade.PictureOfTheExistingProduct?.length > 0 && (
                <div className="mt-3">
                  <h6>Existing Product Images</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {currentUpgrade.PictureOfTheExistingProduct.map((img, index) => (
                      <Image key={index} src={img} thumbnail style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 d-flex justify-content-end gap-2">
                <Button 
                  variant="secondary" 
                  onClick={handleCloseAll}
                >
                  Close
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    handleCloseAll();
                    handleOpenForm(currentUpgrade);
                  }}
                >
                  <i className="bi bi-pencil me-2"></i>Edit Upgrade
                </Button>
              </div>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      {/* Edit/Create Offcanvas */}
      <Offcanvas show={showForm} onHide={handleCloseAll} placement="end" style={{ width: '600px' }}>
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title>
            <i className={editMode ? 'bi bi-pencil me-2' : ' me-2'}></i>
            {editMode ? 'Edit' : 'Create'} Upgrade
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">OE Items*</Form.Label>
                  <Form.Control
                    type="text"
                    name="OEItems"
                    value={formData.OEItems}
                    onChange={handleChange}
                    required
                    className="py-2"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Original Product</Form.Label>
                  <Form.Control
                    type="text"
                    name="OriginalProduct"
                    value={formData.OriginalProduct}
                    onChange={handleChange}
                    className="py-2"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Qty On Hand</Form.Label>
                  <Form.Control
                    type="number"
                    name="QuantityOnhand"
                    value={formData.QuantityOnhand}
                    onChange={handleChange}
                    className="py-2"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Qty Required*</Form.Label>
                  <Form.Control
                    type="number"
                    name="Quantityrequired"
                    value={formData.Quantityrequired}
                    onChange={handleChange}
                    required
                    className="py-2"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Qty In Stock</Form.Label>
                  <Form.Control
                    type="number"
                    name="QuantityInStock"
                    value={formData.QuantityInStock}
                    onChange={handleChange}
                    className="py-2"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Price Per Item</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="PricePerItem"
                    value={formData.PricePerItem}
                    onChange={handleChange}
                    className="py-2"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Total Price</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="TotalPrice"
                    value={formData.TotalPrice}
                    onChange={handleChange}
                    className="py-2"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Department*</Form.Label>
              <Form.Control
                type="text"
                name="Department"
                value={formData.Department}
                onChange={handleChange}
                required
                className="py-2"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="Description"
                value={formData.Description}
                onChange={handleChange}
                className="py-2"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">New Product Images</Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'new')}
                className="py-2"
                disabled={loading}
              />
              <div className="d-flex flex-wrap mt-2">
                {newProductImages.map((img, index) => (
                  <div key={index} className="position-relative me-2 mb-2" style={{ width: '100px' }}>
                    <Image src={img} thumbnail style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                    <Button
                      variant="danger"
                      size="sm"
                      className="position-absolute top-0 end-0 p-0"
                      style={{ width: '24px', height: '24px' }}
                      onClick={() => removeImage(index, 'new')}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-medium">Existing Product Images</Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'existing')}
                className="py-2"
                disabled={loading}
              />
              <div className="d-flex flex-wrap mt-2">
                {existingProductImages.map((img, index) => (
                  <div key={index} className="position-relative me-2 mb-2" style={{ width: '100px' }}>
                    <Image src={img} thumbnail style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                    <Button
                      variant="danger"
                      size="sm"
                      className="position-absolute top-0 end-0 p-0"
                      style={{ width: '24px', height: '24px' }}
                      onClick={() => removeImage(index, 'existing')}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </Form.Group>

            <div className="d-grid gap-2">
              <Button 
                type="submit" 
                variant={editMode ? 'primary' : 'primary'} 
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2"/>
                    {editMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <i className={editMode ? ' me-2' : ' me-'}></i>
                    {editMode ? 'Update Upgrade' : 'Create Upgrade'}
                  </>
                )}
              </Button>
              <Button variant="outline-secondary" onClick={handleCloseAll}>
                Cancel
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this upgrade? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? (
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
            ) : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UpgradeManager;