import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Tabs,
  Tab,
  Table,
  Badge,
  Modal,
  Spinner,
  Dropdown
} from 'react-bootstrap';
import { stockAPI, productAPI, organizationAPI } from '../service/api';

const StockManagement = () => {
  const [activeTab, setActiveTab] = useState('view');
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchLocations(),
        fetchOrganizations()
      ]);
    } catch (error) {
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({ limit: 1000 });
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await organizationAPI.getLocations();
      setLocations(response.data.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await organizationAPI.getChildOrgs();
      setOrganizations(response.data.data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const handleSuccess = (message) => {
    setSuccess(message);
    fetchProducts();
    setTimeout(() => setSuccess(''), 5000);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleUpdateProduct = async (updatedData) => {
    try {
      const response = await productAPI.update(selectedProduct._id, updatedData);
      if (response.data.success) {
        handleSuccess('Product updated successfully!');
        setShowEditModal(false);
        setSelectedProduct(null);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update product');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await productAPI.delete(selectedProduct._id);
      if (response.data.success) {
        handleSuccess('Product deleted successfully!');
        setShowDeleteModal(false);
        setSelectedProduct(null);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const getStockLevelVariant = (product) => {
    if (product.currentQuantity <= product.minimumStock) return 'danger';
    if (product.currentQuantity <= product.minimumStock * 2) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row>
        <Col>
          <Card className="shadow">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Stock Management</h4>
              <Button
                variant="primary"
                onClick={() => setActiveTab('add')}
              >
                + Add Stock
              </Button>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
              {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
              
              <Tabs
                activeKey={activeTab}
                onSelect={(tab) => setActiveTab(tab)}
                className="mb-3"
              >
                <Tab eventKey="view" title="📦 View Stock">
                  <StockView 
                    products={products}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                    getStockLevelVariant={getStockLevelVariant}
                  />
                </Tab>
                <Tab eventKey="add" title="➕ Add Stock">
                  <AddStock 
                    products={products}
                    locations={locations}
                    onSuccess={() => handleSuccess('Stock added successfully!')}
                    onError={setError}
                  />
                </Tab>
                <Tab eventKey="remove" title="➖ Remove Stock">
                  <RemoveStock 
                    products={products}
                    locations={locations}
                    onSuccess={() => handleSuccess('Stock removed successfully!')}
                    onError={setError}
                  />
                </Tab>
                <Tab eventKey="transfer" title="🔄 Transfer Stock">
                  <TransferStock 
                    products={products}
                    locations={locations}
                    organizations={organizations}
                    onSuccess={() => handleSuccess('Stock transfer initiated!')}
                    onError={setError}
                  />
                </Tab>
                <Tab eventKey="approvals" title="📋 Pending Approvals">
                  <ApprovalList 
                    onAction={() => {
                      fetchProducts();
                      handleSuccess('Action completed successfully!');
                    }}
                  />
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Edit Product Modal */}
      <EditProductModal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onUpdate={handleUpdateProduct}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onConfirm={handleConfirmDelete}
      />
    </Container>
  );
};

// Stock View Component with Actions
const StockView = ({ products, onEdit, onDelete, getStockLevelVariant }) => {
  const [filter, setFilter] = useState({
    category: '',
    assignmentType: '',
    lowStock: false
  });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product => {
    const matchesCategory = !filter.category || product.category === filter.category;
    const matchesAssignment = !filter.assignmentType || product.assignmentType === filter.assignmentType;
    const matchesLowStock = !filter.lowStock || product.currentQuantity <= product.minimumStock;
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesAssignment && matchesLowStock && matchesSearch;
  });

  const categories = [...new Set(products.map(p => p.category))];
  const assignmentTypes = [...new Set(products.map(p => p.assignmentType))];

  return (
    <div>
      {/* Filters */}
      <Card className="mb-3">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={filter.category}
                  onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Assignment Type</Form.Label>
                <Form.Select
                  value={filter.assignmentType}
                  onChange={(e) => setFilter({ ...filter, assignmentType: e.target.value })}
                >
                  <option value="">All Types</option>
                  {assignmentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Check
                  type="switch"
                  label="Low Stock Only"
                  checked={filter.lowStock}
                  onChange={(e) => setFilter({ ...filter, lowStock: e.target.checked })}
                />
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Badge bg="info" className="ms-auto">
                {filteredProducts.length} products
              </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Products Table */}
      <Table responsive striped>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Type</th>
            <th>Current Stock</th>
            <th>Min Stock</th>
            <th>Assignment</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map(product => (
            <tr key={product._id}>
              <td>
                <div>
                  <strong>{product.name}</strong>
                  <br />
                  <small className="text-muted">{product.brand}</small>
                </div>
              </td>
              <td>{product.category}</td>
              <td>{product.type}</td>
              <td>
                <Badge bg={getStockLevelVariant(product)}>
                  {product.currentQuantity}
                </Badge>
              </td>
              <td>{product.minimumStock}</td>
              <td>
                <Badge 
                  bg={
                    product.assignmentType === 'Authorized Inventory' ? 'warning' :
                    product.assignmentType === 'First Aid Kit' ? 'info' :
                    product.assignmentType === 'Regular' ? 'success' : 'secondary'
                  }
                >
                  {product.assignmentType}
                </Badge>
              </td>
              <td>
                <Badge bg={product.isActive ? 'success' : 'danger'}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td>
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary" size="sm" id="dropdown-basic">
                    Actions
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => onEdit(product)}>
                      ✏️ Edit
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => onDelete(product)}>
                      🗑️ Delete
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item>
                      📊 View Details
                    </Dropdown.Item>
                    <Dropdown.Item>
                      📋 Stock History
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {filteredProducts.length === 0 && (
        <div className="text-center py-5 text-muted">
          <h5>No products found</h5>
          <p>Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
};

// Edit Product Modal Component
const EditProductModal = ({ show, onHide, product, onUpdate }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        type: product.type || '',
        brand: product.brand || '',
        description: product.description || '',
        minimumStock: product.minimumStock || 0,
        price: product.price || { amount: 0, currency: 'USD' },
        hasExpiry: product.hasExpiry || false,
        expiryDate: product.expiryDate || '',
        assignmentType: product.assignmentType || 'Unassigned'
      });
    }
  }, [product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onUpdate(formData);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!product) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Product</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Product Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Category *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Type *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Brand *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Minimum Stock *</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={formData.minimumStock}
                  onChange={(e) => handleInputChange('minimumStock', parseInt(e.target.value) || 0)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Assignment Type</Form.Label>
                <Form.Select
                  value={formData.assignmentType}
                  onChange={(e) => handleInputChange('assignmentType', e.target.value)}
                >
                  <option value="Unassigned">Unassigned</option>
                  <option value="First Aid Kit">First Aid Kit</option>
                  <option value="Regular">Regular</option>
                  <option value="Authorized Inventory">Authorized Inventory</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  label="Has Expiry Date"
                  checked={formData.hasExpiry}
                  onChange={(e) => handleInputChange('hasExpiry', e.target.checked)}
                />
              </Form.Group>

              {formData.hasExpiry && (
                <Form.Group className="mb-3">
                  <Form.Label>Expiry Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  />
                </Form.Group>
              )}
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Update Product'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ show, onHide, product, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Delete</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to delete this product?</p>
        <Card>
          <Card.Body>
            <strong>Name:</strong> {product.name}<br/>
            <strong>Brand:</strong> {product.brand}<br/>
            <strong>Current Stock:</strong> {product.currentQuantity}<br/>
            <strong>Category:</strong> {product.assignmentType}
          </Card.Body>
        </Card>
        <Alert variant="warning" className="mt-3">
          <strong>Warning:</strong> This action cannot be undone. All stock records for this product will be removed.
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Delete Product'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const AddStock = ({ products, locations, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    destinationLocation: '',
    price: '',
    batchNumber: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    onError('');

    try {
      const response = await stockAPI.add(formData);
      
      if (response.data.success) {
        onSuccess();
        // Reset form
        setFormData({
          productId: '',
          quantity: 1,
          destinationLocation: '',
          price: '',
          batchNumber: '',
          reason: ''
        });
      }
    } catch (error) {
      onError(error.response?.data?.message || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p._id === formData.productId);

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Product *</Form.Label>
            <Form.Select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              required
            >
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>
                  {product.name} - {product.brand} (Stock: {product.currentQuantity})
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Quantity *</Form.Label>
            <Form.Control
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Destination Location *</Form.Label>
            <Form.Select
              value={formData.destinationLocation}
              onChange={(e) => setFormData({ ...formData, destinationLocation: e.target.value })}
              required
            >
              <option value="">Select Location</option>
              {locations.map(location => (
                <option key={location._id} value={location._id}>
                  {location.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Price (Optional)</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || '' })}
              placeholder="Enter price per unit"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Batch Number (Optional)</Form.Label>
            <Form.Control
              type="text"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              placeholder="Enter batch number"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Reason (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., New shipment, Restock, etc."
            />
          </Form.Group>
        </Col>
      </Row>

      {selectedProduct && (
        <Alert variant="info" className="mb-3">
          <strong>Current Stock:</strong> {selectedProduct.currentQuantity} | 
          <strong> Minimum Stock:</strong> {selectedProduct.minimumStock} |
          <strong> After Addition:</strong> {selectedProduct.currentQuantity + formData.quantity}
        </Alert>
      )}

      <Button variant="success" type="submit" disabled={loading} size="lg">
        {loading ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Adding Stock...
          </>
        ) : (
          '➕ Add Stock'
        )}
      </Button>
    </Form>
  );
};

const RemoveStock = ({ products, locations, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    sourceLocation: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    onError('');

    try {
      const response = await stockAPI.remove(formData);
      
      if (response.data.success) {
        onSuccess();
        setFormData({
          productId: '',
          quantity: 1,
          sourceLocation: '',
          reason: ''
        });
      }
    } catch (error) {
      onError(error.response?.data?.message || 'Failed to remove stock');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p._id === formData.productId);
  const insufficientStock = selectedProduct && selectedProduct.currentQuantity < formData.quantity;

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Product *</Form.Label>
            <Form.Select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              required
            >
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>
                  {product.name} - {product.brand} (Stock: {product.currentQuantity})
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Quantity *</Form.Label>
            <Form.Control
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              required
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Source Location *</Form.Label>
            <Form.Select
              value={formData.sourceLocation}
              onChange={(e) => setFormData({ ...formData, sourceLocation: e.target.value })}
              required
            >
              <option value="">Select Location</option>
              {locations.map(location => (
                <option key={location._id} value={location._id}>
                  {location.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Reason *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              placeholder="e.g., Damaged, Used in Event, Expired, Sold, etc."
            />
          </Form.Group>
        </Col>
      </Row>

      {selectedProduct && (
        <Alert variant={insufficientStock ? 'danger' : 'info'} className="mb-3">
          <strong>Current Stock:</strong> {selectedProduct.currentQuantity} | 
          <strong> Remove Quantity:</strong> {formData.quantity} |
          <strong> After Removal:</strong> {selectedProduct.currentQuantity - formData.quantity}
          {insufficientStock && (
            <div className="mt-1">
              <strong className="text-danger">❌ Insufficient stock available!</strong>
            </div>
          )}
        </Alert>
      )}

      <Button 
        variant="warning" 
        type="submit" 
        disabled={loading || insufficientStock}
        size="lg"
      >
        {loading ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Removing Stock...
          </>
        ) : (
          '➖ Remove Stock'
        )}
      </Button>
    </Form>
  );
};

const TransferStock = ({ products, locations, organizations, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    sourceLocation: '',
    destinationLocation: '',
    destinationOrganization: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    onError('');

    try {
      const response = await stockAPI.transfer(formData);
      
      if (response.data.success) {
        onSuccess();
        setFormData({
          productId: '',
          quantity: 1,
          sourceLocation: '',
          destinationLocation: '',
          destinationOrganization: '',
          reason: ''
        });
      }
    } catch (error) {
      onError(error.response?.data?.message || 'Failed to transfer stock');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p._id === formData.productId);
  const insufficientStock = selectedProduct && selectedProduct.currentQuantity < formData.quantity;
  const isCrossOrgTransfer = !!formData.destinationOrganization;

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Product *</Form.Label>
            <Form.Select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              required
            >
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>
                  {product.name} - {product.brand} (Stock: {product.currentQuantity})
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Quantity *</Form.Label>
            <Form.Control
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Source Location *</Form.Label>
            <Form.Select
              value={formData.sourceLocation}
              onChange={(e) => setFormData({ ...formData, sourceLocation: e.target.value })}
              required
            >
              <option value="">Select Location</option>
              {locations.map(location => (
                <option key={location._id} value={location._id}>
                  {location.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Destination Organization</Form.Label>
            <Form.Select
              value={formData.destinationOrganization}
              onChange={(e) => setFormData({ ...formData, destinationOrganization: e.target.value })}
            >
              <option value="">Same Organization</option>
              {organizations.map(org => (
                <option key={org._id} value={org._id}>
                  {org.name} ({org.domain})
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              {isCrossOrgTransfer ? 
                "🔄 Cross-organization transfer requires approval" : 
                "🏠 Same organization transfer is immediate"
              }
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Destination Location *</Form.Label>
            <Form.Select
              value={formData.destinationLocation}
              onChange={(e) => setFormData({ ...formData, destinationLocation: e.target.value })}
              required
            >
              <option value="">Select Location</option>
              {locations.map(location => (
                <option key={location._id} value={location._id}>
                  {location.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Reason (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Inventory redistribution, Branch supply, etc."
            />
          </Form.Group>
        </Col>
      </Row>

      {selectedProduct && (
        <Alert variant={insufficientStock ? 'danger' : 'info'} className="mb-3">
          <strong>Current Stock:</strong> {selectedProduct.currentQuantity} | 
          <strong> Transfer Quantity:</strong> {formData.quantity} |
          <strong> After Transfer:</strong> {selectedProduct.currentQuantity - formData.quantity}
          {isCrossOrgTransfer && (
            <div className="mt-1">
              <Badge bg="warning" text="dark">⚠️ Requires Approval</Badge>
            </div>
          )}
          {insufficientStock && (
            <div className="mt-1">
              <strong className="text-danger">❌ Insufficient stock available!</strong>
            </div>
          )}
        </Alert>
      )}

      <Button 
        variant="info" 
        type="submit" 
        disabled={loading || insufficientStock}
        size="lg"
      >
        {loading ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Processing Transfer...
          </>
        ) : (
          '🔄 Transfer Stock'
        )}
      </Button>
    </Form>
  );
};

const ApprovalList = ({ onAction }) => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const response = await stockAPI.getApprovals();
      setApprovals(response.data.data);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (transactionId, action) => {
    setActionLoading(transactionId);
    
    try {
      let notes = '';
      if (action === 'REJECT') {
        notes = prompt('Please enter rejection reason:');
        if (!notes) {
          setActionLoading(null);
          return;
        }
      }

      await stockAPI.handleApproval(transactionId, {
        action,
        ...(action === 'REJECT' && { rejectionReason: notes }),
        ...(action === 'APPROVE' && { notes: 'Approved by admin' })
      });
      
      await fetchApprovals();
      onAction();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to process approval');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading approvals...</p>
      </div>
    );
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      case 'COMPLETED': return 'info';
      default: return 'secondary';
    }
  };

  const getTypeVariant = (type) => {
    switch (type) {
      case 'ADD': return 'success';
      case 'REMOVE': return 'warning';
      case 'TRANSFER': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Pending Approvals</h5>
        <Badge bg="primary">{approvals.length} requests</Badge>
      </div>

      {approvals.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <h6>No pending approvals</h6>
          <p>All stock requests have been processed.</p>
        </div>
      ) : (
        <Table responsive striped>
          <thead>
            <tr>
              <th>Product</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>From</th>
              <th>To</th>
              <th>Requested By</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map(transaction => (
              <tr key={transaction._id}>
                <td>
                  <strong>{transaction.product?.name}</strong>
                  <br />
                  <small className="text-muted">{transaction.product?.brand}</small>
                </td>
                <td>
                  <Badge bg={getTypeVariant(transaction.transactionType)}>
                    {transaction.transactionType}
                  </Badge>
                </td>
                <td>
                  <strong>{transaction.quantity}</strong>
                </td>
                <td>
                  {transaction.sourceLocation?.name || 'N/A'}
                  {transaction.sourceOrganization && 
                    <div>
                      <small className="text-muted">
                        {transaction.sourceOrganization.name}
                      </small>
                    </div>
                  }
                </td>
                <td>
                  {transaction.destinationLocation?.name || 'N/A'}
                  {transaction.destinationOrganization && 
                    <div>
                      <small className="text-muted">
                        {transaction.destinationOrganization.name}
                      </small>
                    </div>
                  }
                </td>
                <td>
                  {transaction.requestedBy?.name}
                  <br />
                  <small className="text-muted">
                    {transaction.requestedBy?.email}
                  </small>
                </td>
                <td>
                  {new Date(transaction.createdAt).toLocaleDateString()}
                  <br />
                  <small className="text-muted">
                    {new Date(transaction.createdAt).toLocaleTimeString()}
                  </small>
                </td>
                <td>
                  <div className="d-flex gap-1">
                    <Button
                      variant="success"
                      size="sm"
                      disabled={actionLoading === transaction._id}
                      onClick={() => handleApproval(transaction._id, 'APPROVE')}
                    >
                      {actionLoading === transaction._id ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        '✓ Approve'
                      )}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={actionLoading === transaction._id}
                      onClick={() => handleApproval(transaction._id, 'REJECT')}
                    >
                      {actionLoading === transaction._id ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        '✗ Reject'
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default StockManagement;