import React, { useEffect, useState } from 'react';
import { 
  Container, Button, Offcanvas, Form, 
  Row, Col, Badge, Spinner, Alert, Image, 
  ListGroup, Modal, Table
} from 'react-bootstrap';
import axios from 'axios';
import moment from 'moment';

const DepartmentDropdown = ({ value, onChange }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('access_token');
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
      <Form.Group className="mb-3">
        <Form.Label className="fw-medium">Department*</Form.Label>
        <div className="d-flex align-items-center">
          <Spinner animation="border" size="sm" className="me-2" />
          <span>Loading departments...</span>
        </div>
      </Form.Group>
    );
  }

  if (error) {
    return (
      <Form.Group className="mb-3">
        <Form.Label className="fw-medium">Department*</Form.Label>
        <Alert variant="danger" className="py-1">
          {error}
        </Alert>
      </Form.Group>
    );
  }

  return (
    <Form.Group className="mb-3">
      <Form.Label className="fw-medium">Department*</Form.Label>
      <Form.Select
        name="Department"
        value={value}
        onChange={onChange}
        required
        className="py-2"
      >
        <option value="">Select Department</option>
        {departments.map((dept) => (
          <option key={dept._id} value={dept.name}>
            {dept.name}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

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
      setError(error.response?.data?.message || 'Failed to fetch upgrades');
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
      setNewProductImages(upgrade.PictureOfTheNewproduct ? upgrade.PictureOfTheNewproduct.map(img => `https://api.avessecurity.com/${img}`) : []);
      setExistingProductImages(upgrade.PictureOfTheExistingProduct ? upgrade.PictureOfTheExistingProduct.map(img => `https://api.avessecurity.com/${img}`) : []);
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
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('images', file);

        const res = await axios.post('https://api.avessecurity.com/api/upload', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        return res.data.urls[0]; // Assuming the API returns an array of URLs
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      if (type === 'new') {
        setNewProductImages(prev => [...prev, ...uploadedUrls]);
      } else {
        setExistingProductImages(prev => [...prev, ...uploadedUrls]);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to upload images');
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
        PictureOfTheNewproduct: newProductImages.map(img => img.replace('https://api.avessecurity.com/', '')),
        PictureOfTheExistingProduct: existingProductImages.map(img => img.replace('https://api.avessecurity.com/', '')),
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
      setError(error.response?.data?.message || 'Failed to delete upgrade');
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Upgrade Manager</h4>
        <Button 
          variant="primary" 
          onClick={() => handleOpenForm()}
          className="shadow-sm"
        >
          <i className="bi bi-plus me-2"></i>Add Upgrade
        </Button>
      </div>

      {error && <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>{error}</Alert>}

      {loading && upgrades.length === 0 ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading upgrades...</p>
        </div>
      ) : upgrades.length === 0 ? (
        <div className="text-center py-5 border rounded">
          <i className="bi bi-box-seam text-muted" style={{ fontSize: '3rem' }}></i>
          <h5 className="mt-3">No Upgrades Found</h5>
          <p className="text-muted">Create your first upgrade request</p>
        </div>
      ) : (
        <div className="bg-white rounded shadow-sm p-3">
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>S.No</th>
                <th>OE Items</th>
                <th>Department</th>
                <th>Qty Required</th>
                <th>Total Price</th>
                <th>Submitted On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {upgrades.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td>{item.OEItems || 'N/A'}</td>
                  <td>{item.Department || 'N/A'}</td>
                  <td>{item.Quantityrequired || 'N/A'}</td>
                  <td>${item.TotalPrice || '0.00'}</td>
                  <td>
                    {moment(item.SubmittedDate).format('MMM D, YYYY')}
                    <div className="text-muted small">{item.SubmittedTime}</div>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-info" 
                        size="sm" 
                        onClick={() => handleViewUpgrade(item)}
                        title="View"
                      >
                        <i className="bi bi-eye"></i>
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => handleOpenForm(item)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={() => confirmDelete(item._id)}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* View Offcanvas */}
      <Offcanvas show={showViewCanvas} onHide={handleCloseAll} placement="end" style={{ width: '600px' }}>
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title>
            <i className="bi bi-eye me-2"></i>
            Upgrade Details
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {currentUpgrade && (
            <>
              <div className="mb-4">
                <h5>{currentUpgrade.OEItems || 'N/A'}</h5>
                <p className="text-muted">Submitted by: {currentUpgrade.SubmittedBy || 'N/A'}</p>
              </div>

              <Table borderless className="mb-4">
                <tbody>
                  <tr>
                    <td className="fw-bold" style={{ width: '40%' }}>Original Product:</td>
                    <td>{currentUpgrade.OriginalProduct || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Quantity On Hand:</td>
                    <td>{currentUpgrade.QuantityOnhand || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Quantity Required:</td>
                    <td>{currentUpgrade.Quantityrequired || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Quantity In Stock:</td>
                    <td>{currentUpgrade.QuantityInStock || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Price Per Item:</td>
                    <td>${currentUpgrade.PricePerItem || '0.00'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Total Price:</td>
                    <td>${currentUpgrade.TotalPrice || '0.00'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Department:</td>
                    <td>{currentUpgrade.Department || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Submitted On:</td>
                    <td>
                      {moment(currentUpgrade.SubmittedDate).format('MMM D, YYYY')} at {currentUpgrade.SubmittedTime || 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </Table>

              <div className="mb-4">
                <h6>Description</h6>
                <div className="border p-3 rounded bg-light">
                  {currentUpgrade.Description || 'No description provided'}
                </div>
              </div>

              {currentUpgrade.PictureOfTheNewproduct?.length > 0 && (
                <div className="mb-4">
                  <h6>New Product Images</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {currentUpgrade.PictureOfTheNewproduct.map((img, index) => (
                      <a key={index} href={`https://api.avessecurity.com/${img}`} target="_blank" rel="noopener noreferrer">
                        <Image src={`https://api.avessecurity.com/${img}`} thumbnail style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {currentUpgrade.PictureOfTheExistingProduct?.length > 0 && (
                <div className="mb-4">
                  <h6>Existing Product Images</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {currentUpgrade.PictureOfTheExistingProduct.map((img, index) => (
                      <a key={index} href={`https://api.avessecurity.com/${img}`} target="_blank" rel="noopener noreferrer">
                        <Image src={`https://api.avessecurity.com/${img}`} thumbnail style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-end gap-2 mt-4">
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
                  <i className="bi bi-pencil me-2"></i>Edit
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
            <i className={editMode ? 'bi bi-pencil me-2' : 'bi bi-plus me-2'}></i>
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

            <DepartmentDropdown 
              value={formData.Department} 
              onChange={handleChange} 
            />

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
                variant={editMode ? 'primary' : 'success'} 
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
                    <i className={editMode ? 'bi bi-save me-2' : 'bi bi-plus-circle me-2'}></i>
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