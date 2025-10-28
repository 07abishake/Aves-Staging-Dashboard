import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Modal,
  InputGroup,
  Spinner,
  ListGroup,
  Tabs,
  Tab,
  Table,
  Badge,
  Dropdown
} from 'react-bootstrap';
import { productAPI, moduleAPI, productSharingAPI,organizationAPI } from '../service/api';

const ProductCreation = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [products, setProducts] = useState([]);
  const [accessibleProducts, setAccessibleProducts] = useState({
    fromDirectParent: [],
    fromAncestors: [],
    ownProducts: []
  });
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    type: '',
    brand: '',
    description: '',
    initialQuantity: 0,
    minimumStock: 0,
    price: { amount: 0, currency: 'USD' },
    hasExpiry: false,
    expiryDate: '',
    images: []
  });
  
  const [suggestions, setSuggestions] = useState({
    category: [],
    type: [],
    brand: [],
    names: []
  });
  
  const [dropdownSuggestions, setDropdownSuggestions] = useState({
    categories: [],
    types: []
  });
  
  const [showNewCategoryConfirm, setShowNewCategoryConfirm] = useState(false);
  const [showNewTypeConfirm, setShowNewTypeConfirm] = useState(false);
  const [pendingCategory, setPendingCategory] = useState('');
  const [pendingType, setPendingType] = useState('');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [createdProduct, setCreatedProduct] = useState(null);
  const [selectedProductForSharing, setSelectedProductForSharing] = useState(null);
  const [selectedProductForRequest, setSelectedProductForRequest] = useState(null);
  const [existingModules, setExistingModules] = useState([]);
  const [childOrganizations, setChildOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchAccessibleProducts();
    fetchExistingModules();
    fetchDropdownSuggestions();
    fetchChildOrganizations();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({ limit: 1000 });
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchAccessibleProducts = async () => {
    try {
      const response = await productSharingAPI.getAccessibleProducts();
      setAccessibleProducts(response.data.data || {
        fromDirectParent: [],
        fromAncestors: [],
        ownProducts: []
      });
    } catch (error) {
      console.error('Error fetching accessible products:', error);
    }
  };

  const fetchExistingModules = async () => {
    try {
      const response = await moduleAPI.getAll({ limit: 50 });
      setExistingModules(response.data.data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchChildOrganizations = async () => {
    try {
      const response = await organizationAPI.getChildOrgs();
      setChildOrganizations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching child organizations:', error);
    }
  };

  const fetchDropdownSuggestions = async () => {
    try {
      const response = await productAPI.getAll({ limit: 1000 });
      const allProducts = response.data.data || [];
      
      const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
      const uniqueTypes = [...new Set(allProducts.map(p => p.type).filter(Boolean))];
      
      setDropdownSuggestions({
        categories: uniqueCategories,
        types: uniqueTypes
      });
    } catch (error) {
      console.error('Error fetching dropdown suggestions:', error);
    }
  };

  const fetchSuggestions = async (field, value) => {
    if (value.length > 1) {
      try {
        const response = await productAPI.getSuggestions(field, value);
        setSuggestions(prev => ({
          ...prev,
          [field]: response.data.data || []
        }));
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    } else {
      setSuggestions(prev => ({
        ...prev,
        [field]: []
      }));
    }
  };

  useEffect(() => {
    if (formData.category.length > 1) {
      fetchSuggestions('category', formData.category);
    }
    if (formData.type.length > 1) {
      fetchSuggestions('type', formData.type);
    }
    if (formData.brand.length > 1) {
      fetchSuggestions('brand', formData.brand);
    }
    if (formData.name.length > 1) {
      fetchSuggestions('names', formData.name);
    }
  }, [formData.category, formData.type, formData.brand, formData.name]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSuggestionSelect = (suggestion, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: suggestion
    }));
    
    setSuggestions(prev => ({
      ...prev,
      [field]: []
    }));
  };

  const handleDropdownSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryBlur = () => {
    if (formData.category && 
        !dropdownSuggestions.categories.includes(formData.category) && 
        dropdownSuggestions.categories.length > 0) {
      setPendingCategory(formData.category);
      setShowNewCategoryConfirm(true);
    }
  };

  const handleTypeBlur = () => {
    if (formData.type && 
        !dropdownSuggestions.types.includes(formData.type) && 
        dropdownSuggestions.types.length > 0) {
      setPendingType(formData.type);
      setShowNewTypeConfirm(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await productAPI.create(formData);
      
      if (response.data.success) {
        setCreatedProduct(response.data.data);
        setSuccess('Product created successfully!');
        setShowAssignmentModal(true);
        fetchProducts();
        fetchDropdownSuggestions();
        fetchAccessibleProducts();
      }
    } catch (error) {
      if (error.response?.status === 409) {
        setError('Product already exists: ' + error.response.data.existingProduct.name);
      } else {
        setError(error.response?.data?.message || 'Failed to create product');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssignment = async (assignmentType, moduleData = null, existingModuleId = null) => {
    try {
      if (!createdProduct) return;

      const response = await productAPI.assign(createdProduct._id, {
        assignmentType,
        moduleData,
        existingModuleId
      });
      
      if (response.data.success) {
        setSuccess(`Product assigned to ${assignmentType} successfully!`);
        setShowAssignmentModal(false);
        resetForm();
        fetchProducts();
        fetchExistingModules();
        fetchAccessibleProducts();
      }
    } catch (error) {
      setError('Failed to assign product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleShareProduct = async (productId, shareData) => {
    try {
      const response = await productSharingAPI.shareProduct(productId, shareData);
      
      if (response.data.success) {
        setSuccess(`Product shared with ${response.data.data.totalShared} organizations successfully!`);
        setShowSharingModal(false);
        setSelectedProductForSharing(null);
        fetchAccessibleProducts();
      }
    } catch (error) {
      setError('Failed to share product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRequestProduct = async (requestData) => {
    try {
      const response = await productSharingAPI.requestProduct(requestData);
      
      if (response.data.success) {
        setSuccess('Product request submitted successfully!');
        setShowRequestModal(false);
        setSelectedProductForRequest(null);
        fetchAccessibleProducts();
      }
    } catch (error) {
      setError('Failed to request product: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      type: '',
      brand: '',
      description: '',
      initialQuantity: 0,
      minimumStock: 0,
      price: { amount: 0, currency: 'USD' },
      hasExpiry: false,
      expiryDate: '',
      images: []
    });
    setCreatedProduct(null);
  };

  const handleProductDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.delete(productId);
        setSuccess('Product deleted successfully!');
        fetchProducts();
        fetchDropdownSuggestions();
        fetchAccessibleProducts();
      } catch (error) {
        setError('Failed to delete product: ' + error.response?.data?.message);
      }
    }
  };

  const openSharingModal = (product) => {
    setSelectedProductForSharing(product);
    setShowSharingModal(true);
  };

  const openRequestModal = (product, targetOrg) => {
    setSelectedProductForRequest({ product, targetOrg });
    setShowRequestModal(true);
  };

  return (
    <Container fluid>
      <Row className="justify-content-center">
        <Col lg={12}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Product Management</h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
              {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
              
              <Tabs
                activeKey={activeTab}
                onSelect={(tab) => setActiveTab(tab)}
                className="mb-3"
              >
                <Tab eventKey="create" title="➕ Create Product">
                  <ProductCreationForm
                    formData={formData}
                    suggestions={suggestions}
                    dropdownSuggestions={dropdownSuggestions}
                    loading={loading}
                    onInputChange={handleInputChange}
                    onSuggestionSelect={handleSuggestionSelect}
                    onDropdownSelect={handleDropdownSelect}
                    onCategoryBlur={handleCategoryBlur}
                    onTypeBlur={handleTypeBlur}
                    onSubmit={handleSubmit}
                  />
                </Tab>
                <Tab eventKey="shared" title="🔄 Accessible Products">
                  <AccessibleProducts 
                    accessibleProducts={accessibleProducts}
                    onRequest={openRequestModal}
                  />
                </Tab>
                <Tab eventKey="list" title="📦 My Products">
                  <ProductList 
                    products={products}
                    onDelete={handleProductDelete}
                    onShare={openSharingModal}
                  />
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Confirmation Modals */}
      <NewCategoryModal
        show={showNewCategoryConfirm}
        onHide={() => setShowNewCategoryConfirm(false)}
        category={pendingCategory}
        onConfirm={() => setShowNewCategoryConfirm(false)}
        onCancel={() => {
          setFormData(prev => ({ ...prev, category: '' }));
          setShowNewCategoryConfirm(false);
        }}
      />

      <NewTypeModal
        show={showNewTypeConfirm}
        onHide={() => setShowNewTypeConfirm(false)}
        type={pendingType}
        onConfirm={() => setShowNewTypeConfirm(false)}
        onCancel={() => {
          setFormData(prev => ({ ...prev, type: '' }));
          setShowNewTypeConfirm(false);
        }}
      />

      {/* Assignment Modal */}
      {createdProduct && (
        <EnhancedAssignmentModal
          show={showAssignmentModal}
          onHide={() => setShowAssignmentModal(false)}
          onAssign={handleAssignment}
          product={createdProduct}
          existingModules={existingModules}
        />
      )}

      {/* Product Sharing Modal */}
      {selectedProductForSharing && (
        <ProductSharingModal
          show={showSharingModal}
          onHide={() => {
            setShowSharingModal(false);
            setSelectedProductForSharing(null);
          }}
          onShare={handleShareProduct}
          product={selectedProductForSharing}
          childOrganizations={childOrganizations}
        />
      )}

      {/* Product Request Modal */}
      {selectedProductForRequest && (
        <ProductRequestModal
          show={showRequestModal}
          onHide={() => {
            setShowRequestModal(false);
            setSelectedProductForRequest(null);
          }}
          onRequest={handleRequestProduct}
          productData={selectedProductForRequest}
        />
      )}
    </Container>
  );
};

// Product Creation Form Component
const ProductCreationForm = ({
  formData,
  suggestions,
  dropdownSuggestions,
  loading,
  onInputChange,
  onSuggestionSelect,
  onDropdownSelect,
  onCategoryBlur,
  onTypeBlur,
  onSubmit
}) => (
  <Form onSubmit={onSubmit}>
    <Row>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Item Name *</Form.Label>
          <Form.Control
            type="text"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            required
            placeholder="Enter product name"
          />
          {suggestions.names.length > 0 && (
            <ListGroup className="mt-2">
              {suggestions.names.slice(0, 5).map((item, index) => (
                <ListGroup.Item 
                  key={index}
                  action
                  onClick={() => onSuggestionSelect(item.name, 'name')}
                  className="py-2"
                >
                  <strong>{item.name}</strong> - {item.brand} ({item.type})
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Category *</Form.Label>
          <Dropdown>
            <Dropdown.Toggle 
              variant="outline-secondary" 
              id="category-dropdown"
              className="w-100 text-start"
              style={{ 
                borderColor: '#ced4da',
                backgroundColor: formData.category ? '#fff' : '#f8f9fa'
              }}
            >
              {formData.category || "Select or enter category"}
            </Dropdown.Toggle>
            <Dropdown.Menu className="w-100">
              <div className="px-2 pb-2">
                <Form.Control
                  type="text"
                  placeholder="Search or enter new category..."
                  value={formData.category}
                  onChange={(e) => onInputChange('category', e.target.value)}
                  onBlur={onCategoryBlur}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <Dropdown.Divider />
              {dropdownSuggestions.categories.map((category, index) => (
                <Dropdown.Item 
                  key={index}
                  onClick={() => onDropdownSelect('category', category)}
                  active={formData.category === category}
                >
                  {category}
                </Dropdown.Item>
              ))}
              {dropdownSuggestions.categories.length === 0 && (
                <Dropdown.Item disabled>
                  No categories found. Start typing to create new ones.
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
          {suggestions.category.length > 0 && (
            <ListGroup className="mt-2">
              {suggestions.category.map((item, index) => (
                <ListGroup.Item 
                  key={index}
                  action
                  onClick={() => onSuggestionSelect(item, 'category')}
                  className="py-2"
                >
                  {item}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Type *</Form.Label>
          <Dropdown>
            <Dropdown.Toggle 
              variant="outline-secondary" 
              id="type-dropdown"
              className="w-100 text-start"
              style={{ 
                borderColor: '#ced4da',
                backgroundColor: formData.type ? '#fff' : '#f8f9fa'
              }}
            >
              {formData.type || "Select or enter type"}
            </Dropdown.Toggle>
            <Dropdown.Menu className="w-100">
              <div className="px-2 pb-2">
                <Form.Control
                  type="text"
                  placeholder="Search or enter new type..."
                  value={formData.type}
                  onChange={(e) => onInputChange('type', e.target.value)}
                  onBlur={onTypeBlur}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <Dropdown.Divider />
              {dropdownSuggestions.types.map((type, index) => (
                <Dropdown.Item 
                  key={index}
                  onClick={() => onDropdownSelect('type', type)}
                  active={formData.type === type}
                >
                  {type}
                </Dropdown.Item>
              ))}
              {dropdownSuggestions.types.length === 0 && (
                <Dropdown.Item disabled>
                  No types found. Start typing to create new ones.
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
          {suggestions.type.length > 0 && (
            <ListGroup className="mt-2">
              {suggestions.type.map((item, index) => (
                <ListGroup.Item 
                  key={index}
                  action
                  onClick={() => onSuggestionSelect(item, 'type')}
                  className="py-2"
                >
                  {item}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Brand *</Form.Label>
          <Form.Control
            type="text"
            value={formData.brand}
            onChange={(e) => onInputChange('brand', e.target.value)}
            required
            placeholder="Enter brand name"
          />
          {suggestions.brand.length > 0 && (
            <ListGroup className="mt-2">
              {suggestions.brand.map((item, index) => (
                <ListGroup.Item 
                  key={index}
                  action
                  onClick={() => onSuggestionSelect(item, 'brand')}
                  className="py-2"
                >
                  {item}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Form.Group>
      </Col>

      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Description *</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            required
            placeholder="Enter product description"
          />
        </Form.Group>

        <Row>
          <Col>
            <Form.Group className="mb-3">
              <Form.Label>Initial Quantity *</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={formData.initialQuantity}
                onChange={(e) => onInputChange('initialQuantity', parseInt(e.target.value) || 0)}
                required
              />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group className="mb-3">
              <Form.Label>Minimum Stock *</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={formData.minimumStock}
                onChange={(e) => onInputChange('minimumStock', parseInt(e.target.value) || 0)}
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Price *</Form.Label>
          <InputGroup>
            <Form.Control
              type="number"
              min="0"
              step="0.01"
              value={formData.price.amount}
              onChange={(e) => onInputChange('price', {
                ...formData.price,
                amount: parseFloat(e.target.value) || 0
              })}
              required
            />
            <Form.Select
              value={formData.price.currency}
              onChange={(e) => onInputChange('price', {
                ...formData.price,
                currency: e.target.value
              })}
            >
              <option value="USD">USD</option>
              <option value="INR">INR</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </Form.Select>
          </InputGroup>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            label="Has Expiry Date"
            checked={formData.hasExpiry}
            onChange={(e) => onInputChange('hasExpiry', e.target.checked)}
          />
        </Form.Group>

        {formData.hasExpiry && (
          <Form.Group className="mb-3">
            <Form.Label>Expiry Date *</Form.Label>
            <Form.Control
              type="date"
              value={formData.expiryDate}
              onChange={(e) => onInputChange('expiryDate', e.target.value)}
              required
            />
          </Form.Group>
        )}
      </Col>
    </Row>

    <div className="text-center mt-4">
      <Button
        variant="primary"
        type="submit"
        disabled={loading}
        size="lg"
      >
        {loading ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Creating...
          </>
        ) : (
          'Create Product'
        )}
      </Button>
    </div>
  </Form>
);

// Accessible Products Component
const AccessibleProducts = ({ accessibleProducts, onRequest }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const allProducts = [
    ...accessibleProducts.fromDirectParent,
    ...accessibleProducts.fromAncestors
  ];

  const filteredProducts = selectedCategory === 'all' 
    ? allProducts 
    : allProducts.filter(product => product.relationship === selectedCategory);

  const categories = [
    { value: 'all', label: 'All Products', count: allProducts.length },
    { value: 'DIRECT_PARENT', label: 'From Direct Parent', count: accessibleProducts.fromDirectParent.length },
    { value: 'ANCESTOR', label: 'From Ancestors', count: accessibleProducts.fromAncestors.length }
  ];

  return (
    <div>
      <Card className="mb-3">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Filter by Source</Form.Label>
                <Form.Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label} ({cat.count})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-end">
              <Badge bg="primary" className="fs-6">
                Total Accessible: {allProducts.length} products
              </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {filteredProducts.length === 0 ? (
        <Alert variant="info" className="text-center">
          <h5>No accessible products found</h5>
          <p>Products shared by parent organizations will appear here.</p>
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table striped hover>
            <thead className="table-dark">
              <tr>
                <th>Product</th>
                <th>Source Organization</th>
                <th>Relationship</th>
                <th>Available Stock</th>
                <th>Access Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr key={index}>
                  <td>
                    <div>
                      <strong>{product.name}</strong>
                      <br />
                      <small className="text-muted">
                        {product.brand} • {product.category}
                      </small>
                    </div>
                  </td>
                  <td>
                    {product.sourceOrgName}
                    <br />
                    <small className="text-muted">{product.sourceOrg}</small>
                  </td>
                  <td>
                    <Badge 
                      bg={
                        product.relationship === 'DIRECT_PARENT' ? 'info' :
                        product.relationship === 'ANCESTOR' ? 'warning' : 'secondary'
                      }
                    >
                      {product.relationship}
                    </Badge>
                  </td>
                  <td>
                    <Badge 
                      bg={product.availableStock > 0 ? 'success' : 'danger'}
                    >
                      {product.availableStock}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg="outline-primary">
                      {product.accessLevel}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!product.canRequest || product.availableStock === 0}
                      onClick={() => onRequest(product, product.sourceOrg)}
                    >
                      📥 Request
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Own Products Section */}
      {accessibleProducts.ownProducts.length > 0 && (
        <Card className="mt-4">
          <Card.Header>
            <h5 className="mb-0">My Products ({accessibleProducts.ownProducts.length})</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {accessibleProducts.ownProducts.slice(0, 6).map((product, index) => (
                <Col md={4} key={product._id} className="mb-3">
                  <Card>
                    <Card.Body>
                      <h6>{product.name}</h6>
                      <p className="text-muted mb-1">{product.brand}</p>
                      <Badge bg="success">{product.currentQuantity} in stock</Badge>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

// Product List Component
const ProductList = ({ products, onDelete, onShare }) => {
  const [filter, setFilter] = useState({
    category: '',
    assignmentType: ''
  });

  const filteredProducts = products.filter(product => {
    const matchesCategory = !filter.category || product.category === filter.category;
    const matchesAssignment = !filter.assignmentType || product.assignmentType === filter.assignmentType;
    return matchesCategory && matchesAssignment;
  });

  const categories = [...new Set(products.map(p => p.category))];
  const assignmentTypes = [...new Set(products.map(p => p.assignmentType))];

  return (
    <div>
      {/* Filters */}
      <Row className="mb-3">
        <Col md={4}>
          <Form.Select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Select
            value={filter.assignmentType}
            onChange={(e) => setFilter({ ...filter, assignmentType: e.target.value })}
          >
            <option value="">All Assignment Types</option>
            {assignmentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Badge bg="primary" className="fs-6">
            Total: {filteredProducts.length} products
          </Badge>
        </Col>
      </Row>

      {/* Products Table */}
      <Table responsive striped>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Brand</th>
            <th>Category</th>
            <th>Stock</th>
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
                <strong>{product.name}</strong>
                <br />
                <small className="text-muted">{product.type}</small>
              </td>
              <td>{product.brand}</td>
              <td>{product.category}</td>
              <td>
                <Badge 
                  bg={
                    product.currentQuantity <= product.minimumStock ? 'danger' :
                    product.currentQuantity <= product.minimumStock * 2 ? 'warning' : 'success'
                  }
                >
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
                <div className="d-flex gap-1">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => onShare(product)}
                  >
                    Share
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onDelete(product._id)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {filteredProducts.length === 0 && (
        <div className="text-center py-5 text-muted">
          <h5>No products found</h5>
          <p>Create your first product or adjust your filters.</p>
        </div>
      )}
    </div>
  );
};

// Enhanced Assignment Modal Component
const EnhancedAssignmentModal = ({ show, onHide, onAssign, product, existingModules }) => {
  const [assignmentType, setAssignmentType] = useState('');
  const [showModuleOptions, setShowModuleOptions] = useState(false);
  const [showModuleCreation, setShowModuleCreation] = useState(false);
  const [showExistingModules, setShowExistingModules] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [moduleData, setModuleData] = useState({
    name: '',
    logo: null,
    fields: []
  });
  const [creatingModule, setCreatingModule] = useState(false);

  const handleAssignment = (type) => {
    if (type === 'Regular') {
      setAssignmentType('Regular');
      setShowModuleOptions(true);
    } else {
      onAssign(type);
    }
  };

  const handleModuleCreationChoice = (createNew) => {
    setShowModuleOptions(false);
    if (createNew) {
      setShowModuleCreation(true);
    } else {
      setShowExistingModules(true);
    }
  };

  const handleModuleCreate = async () => {
    if (!moduleData.name || !moduleData.logo || moduleData.fields.length === 0) {
      alert('Please fill all module fields');
      return;
    }

    const invalidFields = moduleData.fields.filter(field => !field.fieldName.trim());
    if (invalidFields.length > 0) {
      alert('Please provide names for all fields');
      return;
    }

    setCreatingModule(true);
    try {
      await onAssign('Regular', moduleData);
      setShowModuleCreation(false);
      resetModuleData();
    } catch (error) {
      console.error('Module creation error:', error);
    } finally {
      setCreatingModule(false);
    }
  };

  const handleExistingModuleAssignment = () => {
    if (selectedModuleId) {
      onAssign('Regular', null, selectedModuleId);
    } else {
      alert('Please select a module');
    }
  };

  const resetModuleData = () => {
    setModuleData({
      name: '',
      logo: null,
      fields: []
    });
    setSelectedModuleId('');
  };

  const addField = () => {
    setModuleData(prev => ({
      ...prev,
      fields: [...prev.fields, {
        fieldName: '',
        fieldType: 'Text',
        isMandatory: false
      }]
    }));
  };

  const updateField = (index, field) => {
    const newFields = [...moduleData.fields];
    newFields[index] = field;
    setModuleData(prev => ({ ...prev, fields: newFields }));
  };

  const removeField = (index) => {
    const newFields = moduleData.fields.filter((_, i) => i !== index);
    setModuleData(prev => ({ ...prev, fields: newFields }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setModuleData(prev => ({
          ...prev,
          logo: {
            file: file,
            preview: e.target.result
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    resetModuleData();
    setShowModuleOptions(false);
    setShowModuleCreation(false);
    setShowExistingModules(false);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size={showModuleCreation ? 'lg' : 'md'}>
      <Modal.Header closeButton>
        <Modal.Title>
          {showModuleOptions ? 'Module Creation Choice' : 
           showModuleCreation ? 'Create New Module' :
           showExistingModules ? 'Select Existing Module' : 'Product Assignment'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Initial Assignment Options */}
        {!showModuleOptions && !showModuleCreation && !showExistingModules && (
          <div className="text-center">
            <h5>Assign Product to Category</h5>
            {product && (
              <p className="text-muted">
                <strong>{product.name}</strong> - {product.brand}
              </p>
            )}
            <div className="d-grid gap-2">
              <Button 
                variant="outline-primary" 
                onClick={() => handleAssignment('First Aid Kit')}
                size="lg"
              >
                🏥 First Aid Kit
              </Button>
              <Button 
                variant="outline-success" 
                onClick={() => handleAssignment('Regular')}
                size="lg"
              >
                📋 Regular (Checklist Type)
              </Button>
              <Button 
                variant="outline-warning" 
                onClick={() => handleAssignment('Authorized Inventory')}
                size="lg"
              >
                🛡️ Authorized Inventory
              </Button>
            </div>
          </div>
        )}

        {/* Module Creation Choice */}
        {showModuleOptions && (
          <div className="text-center">
            <h5>Create New Module or Use Existing?</h5>
            <p className="text-muted mb-4">
              Do you want to create a new module or use an existing one?
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <Button 
                variant="primary" 
                onClick={() => handleModuleCreationChoice(true)}
                size="lg"
              >
                ✅ Yes, Create New
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={() => handleModuleCreationChoice(false)}
                size="lg"
              >
                📁 No, Use Existing
              </Button>
            </div>
          </div>
        )}

        {/* New Module Creation Form */}
        {showModuleCreation && (
          <div>
            <h6>Create New Module for {product?.name}</h6>
            <Form.Group className="mb-3">
              <Form.Label>Module Name *</Form.Label>
              <Form.Control
                type="text"
                value={moduleData.name}
                onChange={(e) => setModuleData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter module name"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Module Logo *</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                required
              />
              {moduleData.logo?.preview && (
                <div className="mt-2">
                  <img 
                    src={moduleData.logo.preview} 
                    alt="Logo preview" 
                    style={{ maxWidth: '100px', maxHeight: '100px' }}
                    className="img-thumbnail"
                  />
                </div>
              )}
            </Form.Group>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6>Checklist Fields *</h6>
                <Button variant="outline-primary" size="sm" onClick={addField}>
                  + Add Field
                </Button>
              </div>
              
              {moduleData.fields.map((field, index) => (
                <div key={index} className="border p-3 mb-2 rounded">
                  <Row className="align-items-center">
                    <Col md={4}>
                      <Form.Control
                        placeholder="Field Name (e.g., Torch, Bandage)"
                        value={field.fieldName}
                        onChange={(e) => updateField(index, {
                          ...field,
                          fieldName: e.target.value
                        })}
                        required
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Select
                        value={field.fieldType}
                        onChange={(e) => updateField(index, {
                          ...field,
                          fieldType: e.target.value
                        })}
                      >
                        <option value="Text">Text</option>
                        <option value="Number">Number</option>
                        <option value="Checkbox">Checkbox</option>
                        <option value="Image">Image</option>
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Check
                        type="switch"
                        label="Mandatory"
                        checked={field.isMandatory}
                        onChange={(e) => updateField(index, {
                          ...field,
                          isMandatory: e.target.checked
                        })}
                      />
                    </Col>
                    <Col md={2}>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeField(index)}
                      >
                        Remove
                      </Button>
                    </Col>
                  </Row>
                </div>
              ))}

              {moduleData.fields.length === 0 && (
                <div className="text-center text-muted py-3 border rounded">
                  <p>No fields added yet.</p>
                  <p>Click "Add Field" to create checklist items for this module.</p>
                </div>
              )}
            </div>

            <div className="d-flex gap-2">
              <Button 
                variant="primary" 
                onClick={handleModuleCreate}
                disabled={creatingModule || !moduleData.name || !moduleData.logo || moduleData.fields.length === 0}
              >
                {creatingModule ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating...
                  </>
                ) : (
                  'Create Module & Assign'
                )}
              </Button>
              <Button variant="secondary" onClick={() => {
                setShowModuleCreation(false);
                setShowModuleOptions(true);
                resetModuleData();
              }}>
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Existing Modules Selection */}
        {showExistingModules && (
          <div>
            <h6>Select Existing Module</h6>
            <p className="text-muted mb-3">Choose from previously created modules:</p>
            
            <Form.Group className="mb-3">
              <Form.Label>Select Module *</Form.Label>
              <Form.Select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                required
              >
                <option value="">Choose a module...</option>
                {existingModules.map(module => (
                  <option key={module._id} value={module._id}>
                    {module.name} ({module.fields?.length || 0} fields)
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {selectedModuleId && (
              <div className="border p-3 rounded mb-3">
                <h6>Module Preview:</h6>
                {(() => {
                  const selectedModule = existingModules.find(m => m._id === selectedModuleId);
                  return selectedModule ? (
                    <div>
                      <p><strong>Name:</strong> {selectedModule.name}</p>
                      <p><strong>Fields:</strong> {selectedModule.fields?.length || 0}</p>
                      {selectedModule.fields && selectedModule.fields.length > 0 && (
                        <div>
                          <strong>Field List:</strong>
                          <ul className="mt-2">
                            {selectedModule.fields.slice(0, 5).map((field, idx) => (
                              <li key={idx}>
                                {field.fieldName} ({field.fieldType}) {field.isMandatory && ' *'}
                              </li>
                            ))}
                            {selectedModule.fields.length > 5 && (
                              <li>... and {selectedModule.fields.length - 5} more fields</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            <div className="d-flex gap-2">
              <Button 
                variant="primary" 
                onClick={handleExistingModuleAssignment}
                disabled={!selectedModuleId}
              >
                Assign to Selected Module
              </Button>
              <Button variant="secondary" onClick={() => {
                setShowExistingModules(false);
                setShowModuleOptions(true);
                setSelectedModuleId('');
              }}>
                Back
              </Button>
            </div>

            {existingModules.length === 0 && (
              <div className="text-center text-muted py-4 border rounded">
                <p>No existing modules found.</p>
                <p>Please create a new module instead.</p>
                <Button 
                  variant="outline-primary" 
                  onClick={() => {
                    setShowExistingModules(false);
                    setShowModuleCreation(true);
                  }}
                >
                  Create New Module
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

// Product Sharing Modal Component
const ProductSharingModal = ({ show, onHide, onShare, product, childOrganizations }) => {
  const [shareData, setShareData] = useState({
    childOrganizations: [],
    accessLevel: 'REQUEST_ACCESS',
    shareWithAllChildren: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onShare(product._id, shareData);
  };

  const toggleOrganization = (orgId) => {
    setShareData(prev => {
      const isSelected = prev.childOrganizations.includes(orgId);
      return {
        ...prev,
        childOrganizations: isSelected
          ? prev.childOrganizations.filter(id => id !== orgId)
          : [...prev.childOrganizations, orgId]
      };
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Share Product with Child Organizations</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Product to Share</Form.Label>
            <Card>
              <Card.Body>
                <strong>{product.name}</strong> - {product.brand}
                <br />
                <small className="text-muted">Category: {product.category}</small>
              </Card.Body>
            </Card>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="switch"
              label="Share with all child organizations"
              checked={shareData.shareWithAllChildren}
              onChange={(e) => setShareData(prev => ({
                ...prev,
                shareWithAllChildren: e.target.checked,
                childOrganizations: e.target.checked ? childOrganizations.map(org => org.OrganizationId) : []
              }))}
            />
          </Form.Group>

          {!shareData.shareWithAllChildren && (
            <Form.Group className="mb-3">
              <Form.Label>Select Child Organizations</Form.Label>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {childOrganizations.map(org => (
                  <Form.Check
                    key={org.OrganizationId}
                    type="checkbox"
                    label={`${org.companyName || org.name} (${org.domain})`}
                    checked={shareData.childOrganizations.includes(org.OrganizationId)}
                    onChange={() => toggleOrganization(org.OrganizationId)}
                    className="mb-2"
                  />
                ))}
              </div>
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Access Level</Form.Label>
            <Form.Select
              value={shareData.accessLevel}
              onChange={(e) => setShareData(prev => ({ ...prev, accessLevel: e.target.value }))}
            >
              <option value="VIEW_ONLY">View Only</option>
              <option value="REQUEST_ACCESS">Request Access</option>
              <option value="DIRECT_ACCESS">Direct Access</option>
            </Form.Select>
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={!shareData.shareWithAllChildren && shareData.childOrganizations.length === 0}
            >
              Share Product
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// Product Request Modal Component
const ProductRequestModal = ({ show, onHide, onRequest, productData }) => {
  const [requestData, setRequestData] = useState({
    quantity: 1,
    reason: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onRequest({
      productId: productData.product.productId,
      targetOrganizationId: productData.targetOrg,
      quantity: requestData.quantity,
      reason: requestData.reason
    });
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Request Product</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Product</Form.Label>
            <Card>
              <Card.Body>
                <strong>{productData.product.name}</strong>
                <br />
                <small className="text-muted">
                  From: {productData.product.sourceOrgName}
                  <br />
                  Available: {productData.product.availableStock}
                </small>
              </Card.Body>
            </Card>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Quantity *</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max={productData.product.availableStock}
              value={requestData.quantity}
              onChange={(e) => setRequestData(prev => ({ 
                ...prev, 
                quantity: parseInt(e.target.value) || 1 
              }))}
              required
            />
            <Form.Text className="text-muted">
              Maximum available: {productData.product.availableStock}
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Reason for Request *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={requestData.reason}
              onChange={(e) => setRequestData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Explain why you need this product..."
              required
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={requestData.quantity > productData.product.availableStock || !requestData.reason}
            >
              Submit Request
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// Confirmation Modals
const NewCategoryModal = ({ show, onHide, category, onConfirm, onCancel }) => (
  <Modal show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>New Category</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>"{category}" doesn't exist in our database.</p>
      <p>Do you want to create this as a new category?</p>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onCancel}>
        No, Choose Different
      </Button>
      <Button variant="primary" onClick={onConfirm}>
        Yes, Create New
      </Button>
    </Modal.Footer>
  </Modal>
);

const NewTypeModal = ({ show, onHide, type, onConfirm, onCancel }) => (
  <Modal show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>New Type</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>"{type}" doesn't exist in our database.</p>
      <p>Do you want to create this as a new type?</p>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onCancel}>
        No, Choose Different
      </Button>
      <Button variant="primary" onClick={onConfirm}>
        Yes, Create New
      </Button>
    </Modal.Footer>
  </Modal>
);

export default ProductCreation;