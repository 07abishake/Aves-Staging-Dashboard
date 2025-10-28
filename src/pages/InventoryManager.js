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
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await organizationAPI.getLocations();
      const flattenedLocations = flattenLocations(response.data.Location || []);
      setLocations(flattenedLocations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await organizationAPI.getChildOrgs();
      setOrganizations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    }
  };

  const flattenLocations = (locationData) => {
    const flattened = [];
    
    if (!Array.isArray(locationData)) return flattened;

    locationData.forEach(location => {
      if (location.PrimaryLocation) {
        flattened.push({
          _id: location._id,
          name: location.PrimaryLocation,
          level: 'primary',
          parentId: null
        });
      }

      if (Array.isArray(location.SubLocation)) {
        location.SubLocation.forEach(subLoc => {
          if (subLoc.PrimarySubLocation) {
            flattened.push({
              _id: subLoc._id,
              name: subLoc.PrimarySubLocation,
              level: 'primary_sub',
              parentId: location._id
            });
          }

          if (Array.isArray(subLoc.SecondaryLocation)) {
            subLoc.SecondaryLocation.forEach(secLoc => {
              if (secLoc.SecondaryLocation) {
                flattened.push({
                  _id: secLoc._id,
                  name: secLoc.SecondaryLocation,
                  level: 'secondary',
                  parentId: subLoc._id
                });
              }
            });
          }
        });
      }
    });

    return flattened;
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
                Add Stock to Location
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
                <Tab eventKey="view" title="📊 View Stock">
                  <StockView 
                    products={products}
                    locations={locations}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                    getStockLevelVariant={getStockLevelVariant}
                  />
                </Tab>
                <Tab eventKey="add" title="➕ Add to Location">
                  <AddStock 
                    products={products || []}
                    locations={locations}
                    onSuccess={() => handleSuccess('Stock added to location successfully!')}
                    onError={setError}
                  />
                </Tab>
                <Tab eventKey="remove" title="➖ Remove from Location">
                  <RemoveStock 
                    products={products || []}
                    locations={locations}
                    onSuccess={() => handleSuccess('Stock removed from location successfully!')}
                    onError={setError}
                  />
                </Tab>
                <Tab eventKey="transfer" title="🔄 Transfer Stock">
                  <TransferStock 
                    products={products || []}
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

      <EditProductModal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onUpdate={handleUpdateProduct}
      />

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

// Enhanced Stock View Component with Location Stock
const StockView = ({ products = [], locations = [], onEdit, onDelete, getStockLevelVariant }) => {
  const [filter, setFilter] = useState({
    category: '',
    assignmentType: '',
    lowStock: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locationStock, setLocationStock] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLocationStock = async (locationId) => {
    try {
      setLoading(true);
      const response = await stockAPI.getStockByLocation(locationId);
      setLocationStock(response.data.data?.stock || []);
    } catch (error) {
      console.error('Error fetching location stock:', error);
      setLocationStock([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLocation) {
      fetchLocationStock(selectedLocation);
    } else {
      setLocationStock([]);
    }
  }, [selectedLocation]);

  const filteredProducts = products.filter(product => {
    const matchesCategory = !filter.category || product.category === filter.category;
    const matchesAssignment = !filter.assignmentType || product.assignmentType === filter.assignmentType;
    const matchesLowStock = !filter.lowStock || product.currentQuantity <= product.minimumStock;
    const matchesSearch = !searchTerm || 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesAssignment && matchesLowStock && matchesSearch;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const assignmentTypes = [...new Set(products.map(p => p.assignmentType).filter(Boolean))];

  return (
    <div>
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
            <Col md={3}>
              <Form.Group>
                <Form.Label>View Location Stock</Form.Label>
                <Form.Select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <option value="">All Locations (Main Stock)</option>
                  {locations.map(location => (
                    <option key={location._id} value={location._id}>
                      {location.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Form.Group>
                <Form.Check
                  type="switch"
                  label="Low Stock Only"
                  checked={filter.lowStock}
                  onChange={(e) => setFilter({ ...filter, lowStock: e.target.checked })}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading && selectedLocation ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading location stock...</p>
        </div>
      ) : !selectedLocation ? (
        <MainStockView 
          products={filteredProducts} 
          getStockLevelVariant={getStockLevelVariant}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        <LocationStockView 
          locationStock={locationStock}
          getStockLevelVariant={getStockLevelVariant}
        />
      )}
    </div>
  );
};

const MainStockView = ({ products, getStockLevelVariant, onEdit, onDelete }) => (
  <div className="table-responsive">
    <Table striped hover>
      <thead className="table-dark">
        <tr>
          <th>Product</th>
          <th>Category</th>
          <th>Type</th>
          <th>Current Stock</th>
          <th>Min Stock</th>
          <th>Total Location Stock</th>
          <th>Total System</th>
          <th>Assignment</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {products.map(product => {
          const totalLocationStock = product.locationStock?.reduce((sum, stock) => sum + (stock.quantity || 0), 0) || 0;
          const totalSystemStock = product.currentQuantity + totalLocationStock;
          
          return (
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
                <Badge bg="secondary">{totalLocationStock}</Badge>
              </td>
              <td>
                <strong>{totalSystemStock}</strong>
              </td>
              <td>
                <Badge 
                  bg={
                    product.assignmentType === 'Authorized Inventory' ? 'warning' :
                    product.assignmentType === 'First Aid Kit' ? 'info' :
                    product.assignmentType === 'Regular' ? 'success' : 'secondary'
                  }
                >
                  {product.assignmentType || 'Unassigned'}
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
          );
        })}
        {products.length === 0 && (
          <tr>
            <td colSpan="10" className="text-center text-muted py-4">
              No products found
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  </div>
);

const LocationStockView = ({ locationStock, getStockLevelVariant }) => (
  <div className="table-responsive">
    <Table striped hover>
      <thead className="table-dark">
        <tr>
          <th>Product</th>
          <th>Location Stock</th>
          <th>Min Location Stock</th>
          <th>Main Stock</th>
          <th>Total System</th>
          <th>Status</th>
          <th>Last Updated</th>
        </tr>
      </thead>
      <tbody>
        {locationStock.map((item, index) => (
          <tr key={index}>
            <td>
              <div>
                <strong>{item.product?.name}</strong>
                <br />
                <small className="text-muted">{item.product?.brand}</small>
              </div>
            </td>
            <td>
              <Badge bg={getStockLevelVariant({ currentQuantity: item.locationStock, minimumStock: item.minimumStock })}>
                {item.locationStock}
              </Badge>
            </td>
            <td>{item.minimumStock || 0}</td>
            <td>
              <Badge bg="outline-primary">{item.mainStock}</Badge>
            </td>
            <td>
              <strong>{item.locationStock + item.mainStock}</strong>
            </td>
            <td>
              <Badge bg={item.isLowStock ? 'warning' : 'success'}>
                {item.isLowStock ? 'Low Stock' : 'Adequate'}
              </Badge>
            </td>
            <td>
              {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'N/A'}
            </td>
          </tr>
        ))}
        {locationStock.length === 0 && (
          <tr>
            <td colSpan="7" className="text-center text-muted py-4">
              No stock found at this location
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  </div>
);

// Enhanced AddStock Component with Stock Conservation Logic
const AddStock = ({ products = [], locations = [], onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    destinationLocation: '',
    price: '',
    batchNumber: '',
    reason: 'Stock addition to location'
  });
  const [loading, setLoading] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    onError('');

    try {
      const response = await stockAPI.add(formData);
      
      if (response.data.success) {
        const message = response.data.data.requiresApproval 
          ? 'Stock add request submitted for approval' 
          : 'Stock added to location successfully';
        
        onSuccess(message);
        setFormData({
          productId: '',
          quantity: 1,
          destinationLocation: '',
          price: '',
          batchNumber: '',
          reason: 'Stock addition to location'
        });
        setRequiresApproval(response.data.data.requiresApproval);
      }
    } catch (error) {
      onError(error.response?.data?.message || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p._id === formData.productId);
  const currentLocationStock = selectedProduct ? 
    (selectedProduct.locationStock?.find(stock => stock.location === formData.destinationLocation)?.quantity || 0) : 0;

  const insufficientStock = selectedProduct && selectedProduct.currentQuantity < formData.quantity;

  return (
    <div>
      {requiresApproval && (
        <Alert variant="warning" className="mb-3">
          <strong>⚠️ Approval Required:</strong> Your stock request has been sent for approval. You will be notified when it's processed.
        </Alert>
      )}
      
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
                    {product.name} - {product.brand} (Main Stock: {product.currentQuantity})
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
              <Form.Label>Reason *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Reason for adding stock to location"
                required
              />
            </Form.Group>
          </Col>
        </Row>

        {selectedProduct && (
          <Alert variant="info" className="mb-3">
            <h6>Stock Movement Preview</h6>
            <Row>
              <Col md={4}>
                <strong>Main Stock:</strong><br />
                {selectedProduct.currentQuantity} → <span className={insufficientStock ? 'text-danger' : ''}>
                  {selectedProduct.currentQuantity - formData.quantity}
                </span>
              </Col>
              <Col md={4}>
                <strong>Location Stock:</strong><br />
                {currentLocationStock} → {currentLocationStock + formData.quantity}
              </Col>
              <Col md={4}>
                <strong>Total System:</strong><br />
                {selectedProduct.currentQuantity + currentLocationStock} →{' '}
                {(selectedProduct.currentQuantity - formData.quantity) + (currentLocationStock + formData.quantity)}
                <br />
                <Badge bg="success" className="mt-1">No Change</Badge>
              </Col>
            </Row>
            {insufficientStock && (
              <Alert variant="danger" className="mt-2">
                ❌ Insufficient main stock! Available: {selectedProduct.currentQuantity}
              </Alert>
            )}
          </Alert>
        )}

        <div className="d-grid">
          <Button 
            variant="success" 
            type="submit" 
            disabled={loading || insufficientStock}
            size="lg"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {requiresApproval ? 'Submitting for Approval...' : 'Adding Stock to Location...'}
              </>
            ) : (
              'Add Stock to Location'
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

// Enhanced RemoveStock Component with Stock Conservation Logic
const RemoveStock = ({ products = [], locations = [], onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    sourceLocation: '',
    reason: 'Stock removal from location'
  });
  const [loading, setLoading] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    onError('');

    try {
      const response = await stockAPI.remove(formData);
      
      if (response.data.success) {
        const message = response.data.data.requiresApproval 
          ? 'Stock removal request submitted for approval' 
          : 'Stock removed from location successfully';
        
        onSuccess(message);
        setFormData({
          productId: '',
          quantity: 1,
          sourceLocation: '',
          reason: 'Stock removal from location'
        });
        setRequiresApproval(response.data.data.requiresApproval);
      }
    } catch (error) {
      onError(error.response?.data?.message || 'Failed to remove stock');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p._id === formData.productId);
  const currentLocationStock = selectedProduct ? 
    (selectedProduct.locationStock?.find(stock => stock.location === formData.sourceLocation)?.quantity || 0) : 0;

  const insufficientStock = selectedProduct && currentLocationStock < formData.quantity;

  return (
    <div>
      {requiresApproval && (
        <Alert variant="warning" className="mb-3">
          <strong>⚠️ Approval Required:</strong> Your stock removal request has been sent for approval. You will be notified when it's processed.
        </Alert>
      )}

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
                    {product.name} - {product.brand}
                  </option>
                ))}
              </Form.Select>
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
              <Form.Label>Reason *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
                placeholder="Reason for removing stock from location (e.g., Damaged, Used, Expired, etc.)"
              />
            </Form.Group>

            {selectedProduct && formData.sourceLocation && (
              <Alert variant="info">
                <strong>Current Location Stock:</strong> {currentLocationStock}
                <br />
                <strong>Main Stock:</strong> {selectedProduct.currentQuantity}
              </Alert>
            )}
          </Col>
        </Row>

        {selectedProduct && formData.sourceLocation && (
          <Alert variant="info" className="mb-3">
            <h6>Stock Movement Preview</h6>
            <Row>
              <Col md={4}>
                <strong>Location Stock:</strong><br />
                {currentLocationStock} → <span className={insufficientStock ? 'text-danger' : ''}>
                  {currentLocationStock - formData.quantity}
                </span>
              </Col>
              <Col md={4}>
                <strong>Main Stock:</strong><br />
                {selectedProduct.currentQuantity} → {selectedProduct.currentQuantity + formData.quantity}
              </Col>
              <Col md={4}>
                <strong>Total System:</strong><br />
                {selectedProduct.currentQuantity + currentLocationStock} →{' '}
                {(selectedProduct.currentQuantity + formData.quantity) + (currentLocationStock - formData.quantity)}
                <br />
                <Badge bg="success" className="mt-1">No Change</Badge>
              </Col>
            </Row>
            {insufficientStock && (
              <Alert variant="danger" className="mt-2">
                ❌ Insufficient location stock! Available: {currentLocationStock}
              </Alert>
            )}
          </Alert>
        )}

        <div className="d-grid">
          <Button 
            variant="warning" 
            type="submit" 
            disabled={loading || insufficientStock}
            size="lg"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {requiresApproval ? 'Submitting for Approval...' : 'Removing Stock from Location...'}
              </>
            ) : (
              'Remove Stock from Location'
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

// Enhanced TransferStock Component with Stock Conservation Logic
const TransferStock = ({ products = [], locations = [], organizations = [], onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    sourceLocation: '',
    destinationLocation: '',
    destinationOrganization: '',
    reason: 'Stock transfer between locations'
  });
  const [loading, setLoading] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    onError('');

    try {
      const response = await stockAPI.transfer(formData);
      
      if (response.data.success) {
        const message = response.data.data.requiresApproval 
          ? 'Stock transfer request submitted for approval' 
          : 'Stock transferred successfully';
        
        onSuccess(message);
        setFormData({
          productId: '',
          quantity: 1,
          sourceLocation: '',
          destinationLocation: '',
          destinationOrganization: '',
          reason: 'Stock transfer between locations'
        });
        setRequiresApproval(response.data.data.requiresApproval);
      }
    } catch (error) {
      onError(error.response?.data?.message || 'Failed to transfer stock');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p._id === formData.productId);
  const sourceLocationStock = selectedProduct ? 
    (selectedProduct.locationStock?.find(stock => stock.location === formData.sourceLocation)?.quantity || 0) : 0;
  const destLocationStock = selectedProduct ? 
    (selectedProduct.locationStock?.find(stock => stock.location === formData.destinationLocation)?.quantity || 0) : 0;

  const insufficientStock = selectedProduct && sourceLocationStock < formData.quantity;
  const isCrossOrgTransfer = !!formData.destinationOrganization;
  const isSameLocation = formData.sourceLocation && formData.destinationLocation && 
    formData.sourceLocation === formData.destinationLocation;

  return (
    <div>
      {requiresApproval && (
        <Alert variant="warning" className="mb-3">
          <strong>⚠️ Approval Required:</strong> Your stock transfer request has been sent for approval. You will be notified when it's processed.
        </Alert>
      )}

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
                    {product.name} - {product.brand}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Source Location *</Form.Label>
              <Form.Select
                value={formData.sourceLocation}
                onChange={(e) => setFormData({ ...formData, sourceLocation: e.target.value })}
                required
              >
                <option value="">Select Source Location</option>
                {locations.map(location => (
                  <option key={location._id} value={location._id}>
                    {location.name}
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
                <option value="">Select Destination Location</option>
                {locations.map(location => (
                  <option key={location._id} value={location._id}>
                    {location.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Reason for transferring stock between locations"
              />
            </Form.Group>
          </Col>
        </Row>

        {selectedProduct && formData.sourceLocation && formData.destinationLocation && (
          <Alert variant="info" className="mb-3">
            <h6>Stock Transfer Preview</h6>
            {isSameLocation ? (
              <Alert variant="warning">
                ⚠️ Source and destination locations are the same!
              </Alert>
            ) : (
              <Row>
                <Col md={4}>
                  <strong>Source Location:</strong><br />
                  {sourceLocationStock} → <span className={insufficientStock ? 'text-danger' : ''}>
                    {sourceLocationStock - formData.quantity}
                  </span>
                </Col>
                <Col md={4}>
                  <strong>Destination Location:</strong><br />
                  {destLocationStock} → {destLocationStock + formData.quantity}
                </Col>
                <Col md={4}>
                  <strong>Total System:</strong><br />
                  {selectedProduct.currentQuantity + sourceLocationStock + destLocationStock} →{' '}
                  {selectedProduct.currentQuantity + (sourceLocationStock - formData.quantity) + (destLocationStock + formData.quantity)}
                  <br />
                  <Badge bg="success" className="mt-1">No Change</Badge>
                </Col>
              </Row>
            )}
            {insufficientStock && (
              <Alert variant="danger" className="mt-2">
                ❌ Insufficient source location stock! Available: {sourceLocationStock}
              </Alert>
            )}
            {isCrossOrgTransfer && (
              <Alert variant="warning" className="mt-2">
                ⚠️ This cross-organization transfer will require approval
              </Alert>
            )}
          </Alert>
        )}

        <div className="d-grid">
          <Button 
            variant="info" 
            type="submit" 
            disabled={loading || isSameLocation || insufficientStock}
            size="lg"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {requiresApproval ? 'Submitting for Approval...' : 'Processing Transfer...'}
              </>
            ) : (
              'Transfer Stock Between Locations'
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

// Enhanced ApprovalList Component with Modal
const ApprovalList = ({ onAction }) => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [actionData, setActionData] = useState({ action: '', notes: '' });

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await stockAPI.getApprovals();
      setApprovals(response.data.data || []);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedTransaction || !actionData.action) return;

    setActionLoading(selectedTransaction._id);
    try {
      const payload = {
        action: actionData.action,
        notes: actionData.notes
      };

      if (actionData.action === 'REJECT') {
        payload.rejectionReason = actionData.notes;
      }

      await stockAPI.handleApproval(selectedTransaction._id, payload);
      
      await fetchApprovals();
      setShowActionModal(false);
      setSelectedTransaction(null);
      setActionData({ action: '', notes: '' });
      onAction();
      
      alert(`Transaction ${actionData.action.toLowerCase()}d successfully!`);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to process approval');
    } finally {
      setActionLoading(null);
    }
  };

  const openActionModal = (transaction, action) => {
    setSelectedTransaction(transaction);
    setActionData({ action, notes: '' });
    setShowActionModal(true);
  };

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
      case 'ADD_TO_LOCATION': return 'success';
      case 'REMOVE_FROM_LOCATION': return 'warning';
      case 'TRANSFER': return 'info';
      default: return 'secondary';
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

  return (
    <div>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Pending Stock Approvals</h4>
          <Badge bg="primary">{approvals.length} requests</Badge>
        </Card.Header>
        <Card.Body>
          {approvals.length === 0 ? (
            <Alert variant="info" className="text-center">
              <h5>No pending approvals</h5>
              <p>All stock requests have been processed.</p>
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead className="table-dark">
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Source</th>
                    <th>Destination</th>
                    <th>Requested By</th>
                    <th>Approval Level</th>
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
                          {transaction.transactionType?.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td>
                        <strong>{transaction.quantity}</strong>
                      </td>
                      <td>
                        {transaction.sourceLocation?.PrimaryLocation || 'Main Stock'}
                      </td>
                      <td>
                        {transaction.destinationLocation?.PrimaryLocation || 'Main Stock'}
                      </td>
                      <td>
                        {transaction.requestedBy?.name}
                        <br />
                        <small className="text-muted">
                          {transaction.requestedBy?.email}
                        </small>
                      </td>
                      <td>
                        <Badge bg="info">
                          Level {transaction.currentApprovalLevel} of {transaction.totalApprovalLevels}
                        </Badge>
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
                            onClick={() => openActionModal(transaction, 'APPROVE')}
                          >
                            ✓ Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => openActionModal(transaction, 'REJECT')}
                          >
                            ✗ Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Action Modal */}
      <Modal show={showActionModal} onHide={() => setShowActionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {actionData.action === 'APPROVE' ? 'Approve' : 'Reject'} Transaction
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTransaction && (
            <div className="mb-3">
              <p><strong>Product:</strong> {selectedTransaction.product?.name}</p>
              <p><strong>Type:</strong> {selectedTransaction.transactionType?.replace(/_/g, ' ')}</p>
              <p><strong>Quantity:</strong> {selectedTransaction.quantity}</p>
              <p><strong>Requested By:</strong> {selectedTransaction.requestedBy?.name}</p>
              <p><strong>Approval Level:</strong> Level {selectedTransaction.currentApprovalLevel} of {selectedTransaction.totalApprovalLevels}</p>
            </div>
          )}
          
          <Form.Group className="mb-3">
            <Form.Label>
              {actionData.action === 'APPROVE' ? 'Approval Notes' : 'Rejection Reason'} *
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={actionData.notes}
              onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
              placeholder={actionData.action === 'APPROVE' 
                ? 'Add any notes for this approval...' 
                : 'Explain why this request is being rejected...'
              }
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActionModal(false)}>
            Cancel
          </Button>
          <Button 
            variant={actionData.action === 'APPROVE' ? 'success' : 'danger'}
            onClick={handleAction}
            disabled={!actionData.notes || actionLoading}
          >
            {actionLoading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              `${actionData.action === 'APPROVE' ? 'Approve' : 'Reject'} Transaction`
            )}
          </Button>
        </Modal.Footer>
      </Modal>
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

export default StockManagement;