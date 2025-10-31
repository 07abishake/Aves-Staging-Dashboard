// src/components/ProductManagement.js
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
  Tabs,
  Tab,
  Table,
  Badge,
  ButtonGroup,
  Dropdown
} from 'react-bootstrap';
import { productAPI, productSharingAPI, moduleAPI, notificationAPI } from '../service/api';

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState('myProducts');
  const [hierarchyData, setHierarchyData] = useState({
    ownProducts: [],
    fromParents: [],
    fromChildren: [],
    fromSubChildren: [],
    summary: { grandTotal: 0 }
  });
  const [authorizationRequests, setAuthorizationRequests] = useState([]);
  const [parentProductRequests, setParentProductRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAuthorizationModal, setShowAuthorizationModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [createdProduct, setCreatedProduct] = useState(null);
  const [requestData, setRequestData] = useState({
    quantity: 1,
    reason: ''
  });
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    type: '',
    brand: '',
    description: '',
    currentQuantity: 0,
    minimumStock: 0,
    price: { amount: 0, currency: 'USD' },
    hasExpiry: false,
    expiryDate: '',
    images: []
  });
  
  const [suggestions, setSuggestions] = useState({
    category: [],
    type: [],
    brand: []
  });
  const [fieldValues, setFieldValues] = useState({
    category: [],
    type: [],
    brand: []
  });
  const [imagePreview, setImagePreview] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [existingModules, setExistingModules] = useState([]);
  const [showDropdown, setShowDropdown] = useState({
    category: false,
    type: false,
    brand: false
  });
  const [realTimeUpdates, setRealTimeUpdates] = useState(false);

  useEffect(() => {
    fetchHierarchyProducts();
    fetchAuthorizationRequests();
    fetchParentProductRequests();
    fetchFieldValues();
    fetchExistingModules();
    setupRealTimeListeners();
  }, []);

  // Real-time updates setup
  const setupRealTimeListeners = () => {
    // Listen for real-time product updates
    if (window.socket) {
      window.socket.on('product_updated', (data) => {
        console.log('🔄 Real-time product update:', data);
        setRealTimeUpdates(prev => !prev);
        fetchHierarchyProducts();
      });

      window.socket.on('product_request_created', (data) => {
        console.log('🔄 Real-time product request created:', data);
        fetchParentProductRequests();
        fetchAuthorizationRequests();
      });

      window.socket.on('product_request_updated', (data) => {
        console.log('🔄 Real-time product request updated:', data);
        fetchParentProductRequests();
        fetchAuthorizationRequests();
      });

      window.socket.on('new_notification', (notification) => {
        console.log('📨 New real-time notification:', notification);
        // Refresh requests if it's a product request notification
        if (notification.type === 'PRODUCT_REQUEST' || notification.type === 'PRODUCT_REQUEST_RESPONSE') {
          fetchParentProductRequests();
          fetchAuthorizationRequests();
        }
      });
    }
  };

  const fetchHierarchyProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAllHierarchyProducts();
      if (response.data.success) {
        setHierarchyData(response.data.data);
      }
    } catch (error) {
      setError('Failed to fetch products: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthorizationRequests = async () => {
    try {
      const response = await productAPI.getAuthorizationRequests();
      setAuthorizationRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching authorization requests:', error);
    }
  };

  // Fetch parent product requests - UPDATED
  const fetchParentProductRequests = async () => {
    try {
      const response = await productAPI.getProductRequests({
        status: 'pending',
        limit: 100
      });
      if (response.data.success) {
        setParentProductRequests(response.data.data || []);
        console.log('📋 Parent product requests:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching parent product requests:', error);
    }
  };

  const fetchFieldValues = async () => {
    try {
      const fields = ['category', 'type', 'brand'];
      const values = {};
      
      for (const field of fields) {
        const response = await productAPI.getFieldValues(field);
        values[field] = response.data.data || [];
      }
      
      setFieldValues(values);
    } catch (error) {
      console.error('Error fetching field values:', error);
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

  const fetchSuggestions = async (field, query) => {
    if (!query || query.length < 1) {
      setSuggestions(prev => ({ ...prev, [field]: [] }));
      setShowDropdown(prev => ({ ...prev, [field]: false }));
      return;
    }

    try {
      const response = await productAPI.getSuggestions(field, query);
      const newSuggestions = response.data.data || [];
      setSuggestions(prev => ({ ...prev, [field]: newSuggestions }));
      setShowDropdown(prev => ({ ...prev, [field]: newSuggestions.length > 0 }));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions(prev => ({ ...prev, [field]: [] }));
      setShowDropdown(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleInputChange = async (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));

      if (['category', 'type', 'brand'].includes(field)) {
        if (!value || value.length < 1) {
          setSuggestions(prev => ({ ...prev, [field]: [] }));
          setShowDropdown(prev => ({ ...prev, [field]: false }));
          return;
        }
        
        setTimeout(() => {
          fetchSuggestions(field, value);
        }, 300);
      }
    }
  };

  const handleSuggestionSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSuggestions(prev => ({ ...prev, [field]: [] }));
    setShowDropdown(prev => ({ ...prev, [field]: false }));
  };

  const handleFieldBlur = (field) => {
    setTimeout(() => {
      setShowDropdown(prev => ({ ...prev, [field]: false }));
    }, 200);
  };

  const handleFieldFocus = (field, value) => {
    if (value && value.length > 0) {
      fetchSuggestions(field, value);
    }
  };

  const handleImageUpload = async (files) => {
    setUploadingImages(true);
    const newImages = [...formData.images];
    const newPreviews = [...imagePreview];

    try {
      for (let file of files) {
        const previewUrl = URL.createObjectURL(file);
        newPreviews.push(previewUrl);
        newImages.push({
          file: file,
          name: file.name,
          preview: previewUrl,
          url: previewUrl
        });
      }

      setFormData(prev => ({ ...prev, images: newImages }));
      setImagePreview(newPreviews);
    } catch (error) {
      setError('Failed to upload images: ' + error.message);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    
    setFormData(prev => ({ ...prev, images: newImages }));
    setImagePreview(newPreviews);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!formData.name?.trim() || !formData.category?.trim() || 
        !formData.type?.trim() || !formData.brand?.trim()) {
      setError('Please fill in all required fields: Name, Category, Type, and Brand');
      setLoading(false);
      return;
    }

    if (formData.currentQuantity < 0 || formData.minimumStock < 0) {
      setError('Quantity values cannot be negative');
      setLoading(false);
      return;
    }
    
    try {
      const submitData = {
        ...formData,
        images: formData.images.map(img => img.url || img.preview || img)
      };

      console.log('Submitting product data:', submitData);

      const response = await productAPI.create(submitData);
      if (response.data.success) {
        setCreatedProduct(response.data.data);
        setSuccess('Product created successfully!');
        setShowCreateModal(false);
        setShowAssignmentModal(true);
        fetchHierarchyProducts();
        fetchFieldValues();
        
        // Emit real-time update
        if (window.socket) {
          window.socket.emit('product_created', response.data.data);
        }
      }
    } catch (error) {
      setError('Failed to create product: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignment = async (assignmentType, moduleData = null, existingModuleId = null) => {
    if (!createdProduct) return;

    try {
      const response = await productAPI.assign(createdProduct._id, {
        assignmentType,
        moduleData,
        existingModuleId
      });
      
      if (response.data.success) {
        setSuccess(`Product assigned to ${assignmentType} successfully!`);
        setShowAssignmentModal(false);
        resetForm();
        fetchHierarchyProducts();
        fetchAuthorizationRequests();
      }
    } catch (error) {
      setError('Failed to assign product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!formData.name?.trim() || !formData.category?.trim() || 
        !formData.type?.trim() || !formData.brand?.trim()) {
      setError('Please fill in all required fields: Name, Category, Type, and Brand');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        images: formData.images.map(img => img.url || img.preview || img)
      };

      const response = await productAPI.update(selectedProduct._id, submitData);
      if (response.data.success) {
        setSuccess('Product updated successfully!');
        setShowEditModal(false);
        resetForm();
        fetchHierarchyProducts();
        
        // Emit real-time update
        if (window.socket) {
          window.socket.emit('product_updated', response.data.data);
        }
      }
    } catch (error) {
      setError('Failed to update product: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        const response = await productAPI.delete(productId);
        if (response.data.success) {
          setSuccess('Product deleted successfully!');
          fetchHierarchyProducts();
          
          // Emit real-time update
          if (window.socket) {
            window.socket.emit('product_deleted', { productId });
          }
        }
      } catch (error) {
        setError('Failed to delete product: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category || '',
      type: product.type || '',
      brand: product.brand || '',
      description: product.description || '',
      currentQuantity: product.currentQuantity || 0,
      minimumStock: product.minimumStock || 0,
      price: product.price || { amount: 0, currency: 'USD' },
      hasExpiry: product.hasExpiry || false,
      expiryDate: product.expiryDate || '',
      images: product.images || []
    });
    
    if (product.images && product.images.length > 0) {
      setImagePreview(product.images.map(img => typeof img === 'string' ? img : img.url || img.preview));
    } else {
      setImagePreview([]);
    }
    
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      type: '',
      brand: '',
      description: '',
      currentQuantity: 0,
      minimumStock: 0,
      price: { amount: 0, currency: 'USD' },
      hasExpiry: false,
      expiryDate: '',
      images: []
    });
    setImagePreview([]);
    setSelectedProduct(null);
    setCreatedProduct(null);
    setSuggestions({
      category: [],
      type: [],
      brand: []
    });
    setShowDropdown({
      category: false,
      type: false,
      brand: false
    });
  };

  // UPDATED: Handle product request
  const handleRequestProduct = async () => {
    if (!selectedProduct) return;

    try {
      const requestPayload = {
        productId: selectedProduct.productId || selectedProduct._id,
        sourceOrganization: selectedProduct.sourceOrganization || selectedProduct.sourceOrg || selectedProduct.organizationId,
        quantity: parseInt(requestData.quantity) || 1,
        reason: requestData.reason || 'No reason provided'
      };

      console.log('🔄 Sending product request with payload:', requestPayload);

      const response = await productAPI.requestProduct(requestPayload);
      
      if (response.data.success) {
        setSuccess('Product request submitted successfully!');
        setShowRequestModal(false);
        setSelectedProduct(null);
        setRequestData({ quantity: 1, reason: '' });
        
        // Refresh both types of requests
        fetchAuthorizationRequests();
        fetchParentProductRequests();
        
        // Emit real-time update
        if (window.socket) {
          window.socket.emit('product_request_created', response.data.data);
        }
      }
    } catch (error) {
      console.error('❌ Request product error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setError(`Failed to request product: ${errorMessage}`);
    }
  };

  // UPDATED: Handle product request actions (Approve/Reject)
  const handleProductRequestAction = async (requestId, action, notes = '', approvedQuantity = null) => {
    try {
      // Find the product ID from the request
      const request = parentProductRequests.find(req => req._id === requestId);
      if (!request) {
        setError('Request not found');
        return;
      }

      const productId = request.productId;
      
      if (!productId) {
        setError('Product ID not found for this request');
        return;
      }

      const requestData = {
        action: action,
        notes: notes
      };

      // Add approved quantity if provided and action is APPROVE
      if (action === 'APPROVE' && approvedQuantity) {
        requestData.approvedQuantity = approvedQuantity;
      }

      console.log(`🔄 Processing product request: ${requestId}, Action: ${action}`, requestData);

      const response = await productAPI.approveProductRequest(productId, requestId, requestData);
      
      if (response.data.success) {
        setSuccess(`Product request ${action.toLowerCase()}d successfully!`);
        fetchParentProductRequests();
        fetchAuthorizationRequests();
        fetchHierarchyProducts();
        
        // Emit real-time update
        if (window.socket) {
          window.socket.emit('product_request_updated', {
            requestId,
            action,
            ...response.data.data
          });
        }
      }
    } catch (error) {
      console.error('❌ Product request action error:', error);
      setError('Failed to process product request: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAuthorization = async (requestId, action, notes = '') => {
    try {
      const response = await productAPI.handleAuthorization(requestId, {
        action,
        notes
      });
      
      if (response.data.success) {
        setSuccess(`Request ${action.toLowerCase()}d successfully!`);
        setShowAuthorizationModal(false);
        fetchAuthorizationRequests();
        fetchHierarchyProducts();
      }
    } catch (error) {
      setError('Failed to process authorization: ' + (error.response?.data?.message || error.message));
    }
  };

  const openRequestModal = (product) => {
    setSelectedProduct(product);
    setRequestData({
      quantity: 1,
      reason: ''
    });
    setShowRequestModal(true);
  };

  const openAuthorizationModal = () => {
    setShowAuthorizationModal(true);
  };

  const getProductBadgeVariant = (sourceType) => {
    switch (sourceType) {
      case 'OWN': return 'success';
      case 'PARENT': return 'primary';
      case 'CHILD': return 'warning';
      case 'SUBCHILD': return 'info';
      default: return 'secondary';
    }
  };

  const getProductSourceText = (sourceType) => {
    switch (sourceType) {
      case 'OWN': return 'My Organization';
      case 'PARENT': return 'From Parent';
      case 'CHILD': return 'From Child';
      case 'SUBCHILD': return 'From Sub-Child';
      default: return sourceType;
    }
  };

  // Refresh data manually
  const refreshData = () => {
    fetchHierarchyProducts();
    fetchAuthorizationRequests();
    fetchParentProductRequests();
    setSuccess('Data refreshed successfully!');
  };

  return (
    <Container fluid>
      <Row className="justify-content-center">
        <Col lg={12}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-0">Product Management System</h4>
                <small>Manage products across your organization hierarchy</small>
              </div>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-light" 
                  onClick={refreshData}
                  className="d-flex align-items-center"
                  title="Refresh Data"
                >
                 Refresh
                </Button>
                <Button 
                  variant="light" 
                  onClick={openCreateModal}
                  className="d-flex align-items-center"
                >
                  Create Product
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
              {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
              
              {/* Real-time Status Indicator */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted">
                  {realTimeUpdates ? '🟢 Real-time updates active' : '⚪ Connecting...'}
                </small>
                <Badge bg="info">
                  Last updated: {new Date().toLocaleTimeString()}
                </Badge>
              </div>
              
              <Tabs
                activeKey={activeTab}
                onSelect={(tab) => setActiveTab(tab)}
                className="mb-3"
              >
                <Tab eventKey="myProducts" title={
                  <span>
                    My Products 
                    {hierarchyData.ownProducts?.length > 0 && (
                      <Badge bg="primary" className="ms-2">
                        {hierarchyData.ownProducts.length}
                      </Badge>
                    )}
                  </span>
                }>
                  <MyProducts 
                    products={hierarchyData.ownProducts}
                    onEdit={openEditModal}
                    onDelete={handleDeleteProduct}
                    onView={handleViewProduct}
                    loading={loading}
                  />
                </Tab>
                
                <Tab eventKey="allProducts" title={
                  <span>
                    All Products 
                    <Badge bg="info" className="ms-2">
                      {hierarchyData.summary?.grandTotal || 0}
                    </Badge>
                  </span>
                }>
                  <AllOrganizationProducts 
                    hierarchyData={hierarchyData}
                    onRequest={openRequestModal}
                    getProductBadgeVariant={getProductBadgeVariant}
                    getProductSourceText={getProductSourceText}
                  />
                </Tab>
                
                <Tab eventKey="requests" title={
                  <span>
                    Requests 
                    {(authorizationRequests.filter(r => r.status === 'pending').length + 
                      parentProductRequests.filter(r => r.status === 'PENDING').length) > 0 && (
                      <Badge bg="danger" className="ms-2">
                        {authorizationRequests.filter(r => r.status === 'pending').length + 
                         parentProductRequests.filter(r => r.status === 'PENDING').length}
                      </Badge>
                    )}
                  </span>
                }>
                  <RequestsTab
                    authorizationRequests={authorizationRequests}
                    parentProductRequests={parentProductRequests}
                    onAuthorization={handleAuthorization}
                    onProductRequestAction={handleProductRequestAction}
                    loading={loading}
                  />
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Product Modal */}
      <ProductCreateModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSubmit={handleCreateProduct}
        formData={formData}
        loading={loading}
        suggestions={suggestions}
        fieldValues={fieldValues}
        onInputChange={handleInputChange}
        onSuggestionSelect={handleSuggestionSelect}
        onImageUpload={handleImageUpload}
        onRemoveImage={removeImage}
        imagePreview={imagePreview}
        uploadingImages={uploadingImages}
        showDropdown={showDropdown}
        onFieldFocus={handleFieldFocus}
        onFieldBlur={handleFieldBlur}
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

      {/* Edit Product Modal */}
      <ProductEditModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSubmit={handleEditProduct}
        formData={formData}
        product={selectedProduct}
        loading={loading}
        suggestions={suggestions}
        fieldValues={fieldValues}
        onInputChange={handleInputChange}
        onSuggestionSelect={handleSuggestionSelect}
        onImageUpload={handleImageUpload}
        onRemoveImage={removeImage}
        imagePreview={imagePreview}
        uploadingImages={uploadingImages}
        showDropdown={showDropdown}
        onFieldFocus={handleFieldFocus}
        onFieldBlur={handleFieldBlur}
      />

      {/* View Product Modal */}
      <ProductViewModal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        product={selectedProduct}
        onEdit={() => {
          setShowViewModal(false);
          openEditModal(selectedProduct);
        }}
      />

      {/* Product Request Modal */}
      <ProductRequestModal
        show={showRequestModal}
        onHide={() => {
          setShowRequestModal(false);
          setSelectedProduct(null);
        }}
        onRequest={handleRequestProduct}
        product={selectedProduct}
        requestData={requestData}
        setRequestData={setRequestData}
      />

      {/* Authorization Modal */}
      <AuthorizationModal
        show={showAuthorizationModal}
        onHide={() => setShowAuthorizationModal(false)}
        requests={authorizationRequests}
        onAuthorization={handleAuthorization}
      />
    </Container>
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
    if (!moduleData.name || moduleData.fields.length === 0) {
      alert('Please fill all module fields');
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
                    <Col md={5}>
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
                    <Col md={4}>
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
                    <Col md={2}>
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
                    <Col md={1}>
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
                disabled={creatingModule || !moduleData.name || moduleData.fields.length === 0}
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

// Suggestion Dropdown Component
const SuggestionDropdown = ({ field, suggestions, onSelect, show, onMouseDown }) => {
  if (!show || !suggestions.length) return null;

  return (
    <div 
      className="position-absolute w-100 bg-white border rounded shadow-sm mt-1 z-3"
      style={{ maxHeight: '200px', overflowY: 'auto' }}
    >
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className="suggestion-item p-2 border-bottom"
          onClick={() => onSelect(field, suggestion)}
          onMouseDown={onMouseDown}
          style={{ 
            cursor: 'pointer',
            backgroundColor: '#fff'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
        >
          {suggestion}
        </div>
      ))}
    </div>
  );
};

// Create Product Modal Component
const ProductCreateModal = ({ 
  show, 
  onHide, 
  onSubmit, 
  formData, 
  loading,
  suggestions,
  fieldValues,
  onInputChange,
  onSuggestionSelect,
  onImageUpload,
  onRemoveImage,
  imagePreview,
  uploadingImages,
  showDropdown,
  onFieldFocus,
  onFieldBlur
}) => {

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onImageUpload(files);
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Create New Product</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Product Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) => onInputChange('name', e.target.value)}
                  required
                  placeholder="Enter product name"
                />
              </Form.Group>

              <Form.Group className="mb-3 position-relative">
                <Form.Label>Category *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.category}
                  onChange={(e) => onInputChange('category', e.target.value)}
                  onFocus={() => onFieldFocus('category', formData.category)}
                  onBlur={() => onFieldBlur('category')}
                  required
                  placeholder="Enter category"
                />
                <SuggestionDropdown
                  field="category"
                  suggestions={suggestions.category}
                  onSelect={onSuggestionSelect}
                  show={showDropdown.category}
                  onMouseDown={handleMouseDown}
                />
              </Form.Group>

              <Form.Group className="mb-3 position-relative">
                <Form.Label>Type *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.type}
                  onChange={(e) => onInputChange('type', e.target.value)}
                  onFocus={() => onFieldFocus('type', formData.type)}
                  onBlur={() => onFieldBlur('type')}
                  required
                  placeholder="Enter type"
                />
                <SuggestionDropdown
                  field="type"
                  suggestions={suggestions.type}
                  onSelect={onSuggestionSelect}
                  show={showDropdown.type}
                  onMouseDown={handleMouseDown}
                />
              </Form.Group>

              <Form.Group className="mb-3 position-relative">
                <Form.Label>Brand *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.brand}
                  onChange={(e) => onInputChange('brand', e.target.value)}
                  onFocus={() => onFieldFocus('brand', formData.brand)}
                  onBlur={() => onFieldBlur('brand')}
                  required
                  placeholder="Enter brand name"
                />
                <SuggestionDropdown
                  field="brand"
                  suggestions={suggestions.brand}
                  onSelect={onSuggestionSelect}
                  show={showDropdown.brand}
                  onMouseDown={handleMouseDown}
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
                  onChange={(e) => onInputChange('description', e.target.value)}
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
                      value={formData.currentQuantity}
                      onChange={(e) => onInputChange('currentQuantity', parseInt(e.target.value) || 0)}
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
                <Form.Label>Price</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price.amount}
                    onChange={(e) => onInputChange('price.amount', parseFloat(e.target.value) || 0)}
                  />
                  <Form.Select
                    value={formData.price.currency}
                    onChange={(e) => onInputChange('price.currency', e.target.value)}
                  >
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </Form.Select>
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  label="Has Expiry Date"
                  checked={formData.hasExpiry}
                  onChange={(e) => onInputChange('hasExpiry', e.target.checked)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              {formData.hasExpiry && (
                <Form.Group className="mb-3">
                  <Form.Label>Expiry Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => onInputChange('expiryDate', e.target.value)}
                  />
                </Form.Group>
              )}
            </Col>
          </Row>

          {/* Image Upload Section */}
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Product Images</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploadingImages}
                />
                <Form.Text className="text-muted">
                  Upload product images (multiple images supported)
                </Form.Text>
              </Form.Group>

              {imagePreview.length > 0 && (
                <div className="mb-3">
                  <h6>Image Previews:</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {imagePreview.map((preview, index) => (
                      <div key={index} className="position-relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{ 
                            width: '100px', 
                            height: '100px', 
                            objectFit: 'cover',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          className="position-absolute top-0 end-0"
                          style={{ transform: 'translate(50%, -50%)' }}
                          onClick={() => onRemoveImage(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadingImages && (
                <div className="text-center">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Uploading images...
                </div>
              )}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={loading}
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
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// Edit Product Modal Component
const ProductEditModal = ({ 
  show, 
  onHide, 
  onSubmit, 
  formData, 
  product, 
  loading,
  suggestions,
  fieldValues,
  onInputChange,
  onSuggestionSelect,
  onImageUpload,
  onRemoveImage,
  imagePreview,
  uploadingImages,
  showDropdown,
  onFieldFocus,
  onFieldBlur
}) => {

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onImageUpload(files);
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
  };

  if (!product) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Product</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <Alert variant="info" className="mb-3">
            Editing: <strong>{product.name}</strong> (ID: {product._id})
          </Alert>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Product Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) => onInputChange('name', e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3 position-relative">
                <Form.Label>Category *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.category}
                  onChange={(e) => onInputChange('category', e.target.value)}
                  onFocus={() => onFieldFocus('category', formData.category)}
                  onBlur={() => onFieldBlur('category')}
                  required
                />
                <SuggestionDropdown
                  field="category"
                  suggestions={suggestions.category}
                  onSelect={onSuggestionSelect}
                  show={showDropdown.category}
                  onMouseDown={handleMouseDown}
                />
              </Form.Group>

              <Form.Group className="mb-3 position-relative">
                <Form.Label>Type *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.type}
                  onChange={(e) => onInputChange('type', e.target.value)}
                  onFocus={() => onFieldFocus('type', formData.type)}
                  onBlur={() => onFieldBlur('type')}
                  required
                />
                <SuggestionDropdown
                  field="type"
                  suggestions={suggestions.type}
                  onSelect={onSuggestionSelect}
                  show={showDropdown.type}
                  onMouseDown={handleMouseDown}
                />
              </Form.Group>

              <Form.Group className="mb-3 position-relative">
                <Form.Label>Brand *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.brand}
                  onChange={(e) => onInputChange('brand', e.target.value)}
                  onFocus={() => onFieldFocus('brand', formData.brand)}
                  onBlur={() => onFieldBlur('brand')}
                  required
                />
                <SuggestionDropdown
                  field="brand"
                  suggestions={suggestions.brand}
                  onSelect={onSuggestionSelect}
                  show={showDropdown.brand}
                  onMouseDown={handleMouseDown}
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
                  onChange={(e) => onInputChange('description', e.target.value)}
                />
              </Form.Group>

              <Row>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>Current Quantity *</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={formData.currentQuantity}
                      onChange={(e) => onInputChange('currentQuantity', parseInt(e.target.value) || 0)}
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
                <Form.Label>Price</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price.amount}
                    onChange={(e) => onInputChange('price.amount', parseFloat(e.target.value) || 0)}
                  />
                  <Form.Select
                    value={formData.price.currency}
                    onChange={(e) => onInputChange('price.currency', e.target.value)}
                  >
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </Form.Select>
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  label="Has Expiry Date"
                  checked={formData.hasExpiry}
                  onChange={(e) => onInputChange('hasExpiry', e.target.checked)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              {formData.hasExpiry && (
                <Form.Group className="mb-3">
                  <Form.Label>Expiry Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => onInputChange('expiryDate', e.target.value)}
                  />
                </Form.Group>
              )}
            </Col>
          </Row>

          {/* Image Upload Section */}
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Product Images</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploadingImages}
                />
                <Form.Text className="text-muted">
                  Add more product images (multiple images supported)
                </Form.Text>
              </Form.Group>

              {imagePreview.length > 0 && (
                <div className="mb-3">
                  <h6>Image Previews:</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {imagePreview.map((preview, index) => (
                      <div key={index} className="position-relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{ 
                            width: '100px', 
                            height: '100px', 
                            objectFit: 'cover',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          className="position-absolute top-0 end-0"
                          style={{ transform: 'translate(50%, -50%)' }}
                          onClick={() => onRemoveImage(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadingImages && (
                <div className="text-center">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Uploading images...
                </div>
              )}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button 
            variant="warning" 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              'Update Product'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// View Product Modal Component
const ProductViewModal = ({ show, onHide, product, onEdit }) => {
  if (!product) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Product Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={6}>
            <Card className="mb-3">
              <Card.Header className="bg-primary text-white">
                <h6 className="mb-0">Basic Information</h6>
              </Card.Header>
              <Card.Body>
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <td><strong>Name:</strong></td>
                      <td>{product.name}</td>
                    </tr>
                    <tr>
                      <td><strong>Category:</strong></td>
                      <td>{product.category}</td>
                    </tr>
                    <tr>
                      <td><strong>Type:</strong></td>
                      <td>{product.type || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td><strong>Brand:</strong></td>
                      <td>{product.brand}</td>
                    </tr>
                    <tr>
                      <td><strong>Product ID:</strong></td>
                      <td><code>{product._id}</code></td>
                    </tr>
                    {product.description && (
                      <tr>
                        <td><strong>Description:</strong></td>
                        <td>{product.description}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="mb-3">
              <Card.Header className="bg-success text-white">
                <h6 className="mb-0">Stock Information</h6>
              </Card.Header>
              <Card.Body>
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <td><strong>Initial Quantity:</strong></td>
                      <td>
                        <Badge bg="info">
                          {product.initialQuantity || 0}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Current Quantity:</strong></td>
                      <td>
                        <Badge bg={product.currentQuantity > 0 ? 'success' : 'danger'}>
                          {product.currentQuantity}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Minimum Stock:</strong></td>
                      <td>
                        <Badge bg="warning">
                          {product.minimumStock || 0}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Status:</strong></td>
                      <td>
                        <Badge bg={product.isActive !== false ? 'success' : 'danger'}>
                          {product.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {product.images && product.images.length > 0 && (
          <Row>
            <Col>
              <Card>
                <Card.Header className="bg-secondary text-white">
                  <h6 className="mb-0">Product Images</h6>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex flex-wrap gap-2">
                    {product.images.map((image, index) => (
                      <img
                        key={index}
                        src={typeof image === 'string' ? image : image.url || image.preview}
                        alt={`${product.name} ${index + 1}`}
                        style={{ 
                          width: '100px', 
                          height: '100px', 
                          objectFit: 'cover',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        className="border rounded"
                      />
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="warning" onClick={onEdit}>
          Edit Product
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// My Products Component
const MyProducts = ({ products, onEdit, onDelete, onView, loading }) => {
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

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading products...</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Alert variant="info" className="text-center">
        <h5>No products found</h5>
        <p>You haven't created any products yet. Click "Create Product" to get started.</p>
      </Alert>
    );
  }

  return (
    <div>
      {/* Filters */}
      <Card className="mb-3">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Filter by Category</Form.Label>
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
            <Col md={4}>
              <Form.Group>
                <Form.Label>Filter by Assignment Type</Form.Label>
                <Form.Select
                  value={filter.assignmentType}
                  onChange={(e) => setFilter({ ...filter, assignmentType: e.target.value })}
                >
                  <option value="">All Assignment Types</option>
                  {assignmentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Badge bg="primary" className="fs-6">
                Showing: {filteredProducts.length} of {products.length} products
              </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Products Table */}
      <div className="table-responsive">
        <Table >
          <thead className="">
            <tr>
              <th>Product Details</th>
              <th>Category</th>
              <th>Type</th>
              <th>Brand</th>
              <th>Stock Info</th>
              <th>Assignment Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product._id}>
                <td>
                  <div>
                    <strong 
                      className="text-primary "
                      onClick={() => onView(product)}
                      style={{ cursor: 'pointer' }}
                    >
                      {product.name}
                    </strong>
                    <br />
                    <small className="text-muted">
                      {product.images && product.images.length > 0 && (
                        <Badge bg="info" className="ms-2">📷 {product.images.length}</Badge>
                      )}
                    </small>
                  </div>
                </td>
                <td>{product.category}</td>
                <td>{product.type || 'N/A'}</td>
                <td>{product.brand}</td>
                <td>
                  <div>
                    <Badge 
                      bg={product.currentQuantity > 0 ? 'success' : 'danger'}
                    >
                      Stock: {product.currentQuantity}
                    </Badge>
                    <br />
                    <small className="text-muted">
                      Min: {product.minimumStock || 0}
                    </small>
                  </div>
                </td>
                <td>
                  <Badge 
                    bg={
                      product.assignmentType === 'Regular' ? 'success' :
                      product.assignmentType === 'Pending Authorization' ? 'warning' :
                      'secondary'
                    }
                  >
                    {product.assignmentType}
                  </Badge>
                </td>
                <td>
                  <Badge bg={product.isActive !== false ? 'success' : 'danger'}>
                    {product.isActive !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td>
  <ButtonGroup size="sm" className="gap-2">
    <Button
      variant="outline-primary"
      onClick={() => onView(product)}
      title="View Details"
    >
      View
    </Button>
    <Button
      variant="outline-warning"
      onClick={() => onEdit(product)}
      title="Edit Product"
    >
      Edit
    </Button>
    <Button
      variant="outline-danger"
      onClick={() => onDelete(product._id)}
      title="Delete Product"
    >
      Delete
    </Button>
  </ButtonGroup>
</td>

              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

// All Organization Products Component
const AllOrganizationProducts = ({ 
  hierarchyData, 
  onRequest, 
  getProductBadgeVariant, 
  getProductSourceText 
}) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const allProducts = [
    ...(hierarchyData.ownProducts || []).map(p => ({ ...p, sourceType: 'OWN' })),
    ...(hierarchyData.fromParents || []).map(p => ({ ...p, sourceType: 'PARENT' })),
    ...(hierarchyData.fromChildren || []).map(p => ({ ...p, sourceType: 'CHILD' })),
    ...(hierarchyData.fromSubChildren || []).map(p => ({ ...p, sourceType: 'SUBCHILD' }))
  ];

  const filteredProducts = allProducts.filter(product => {
    const matchesFilter = filter === 'all' || product.sourceType === filter;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.type && product.type.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getRequestButtonVariant = (product) => {
    if (product.sourceType === 'OWN') return 'outline-secondary';
    if (!product.canRequest) return 'outline-danger';
    return 'primary';
  };

  const getRequestButtonText = (product) => {
    if (product.sourceType === 'OWN') return 'Own Product';
    if (!product.canRequest) return 'Cannot Request';
    return 'Request Product';
  };

  return (
    <div>
      {/* Filters and Search */}
      <Card className="mb-3">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Filter by Source</Form.Label>
                <Form.Select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Sources ({allProducts.length})</option>
                  <option value="OWN">My Products ({hierarchyData.ownProducts?.length || 0})</option>
                  <option value="PARENT">From Parent ({hierarchyData.fromParents?.length || 0})</option>
                  <option value="CHILD">From Children ({hierarchyData.fromChildren?.length || 0})</option>
                  <option value="SUBCHILD">From Sub-Children ({hierarchyData.fromSubChildren?.length || 0})</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Search Products</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name, category, type, or brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Badge bg="primary" className="fs-6">
                Showing: {filteredProducts.length} products
              </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <Alert variant="info" className="text-center">
          <h5>No products found</h5>
          <p>Try adjusting your filters or search terms.</p>
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table>
            <thead className="">
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Type</th>
                <th>Brand</th>
                <th>Source</th>
                <th>Organization</th>
                <th>Available Stock</th>
                <th>Assignment Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr key={product._id || product.productId || index}>
                  <td>
                    <div>
                      <strong>{product.name}</strong>
                      {product.images && product.images.length > 0 && (
                        <Badge bg="info" className="ms-2">📷 {product.images.length}</Badge>
                      )}
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>{product.type || 'N/A'}</td>
                  <td>{product.brand}</td>
                  <td>
                    <Badge bg={getProductBadgeVariant(product.sourceType)}>
                      {getProductSourceText(product.sourceType)}
                    </Badge>
                  </td>
                  <td>
                    <small>
                      {product.sourceOrgName || 'Unknown'}
                      <br />
                      <code className="text-muted">{product.sourceOrg}</code>
                    </small>
                  </td>
                  <td>
                    <Badge 
                      bg={product.availableStock > 0 ? 'success' : 'danger'}
                    >
                      {product.availableStock}
                    </Badge>
                  </td>
                  <td>
                    <Badge 
                      bg={
                        product.assignmentType === 'Regular' ? 'success' :
                        product.assignmentType === 'Pending Authorization' ? 'warning' :
                        'secondary'
                      }
                    >
                      {product.assignmentType || 'Unassigned'}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant={getRequestButtonVariant(product)}
                      size="sm"
                      disabled={product.sourceType === 'OWN' || !product.canRequest}
                      onClick={() => onRequest(product)}
                    >
                      {getRequestButtonText(product)}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

// Parent Product Requests Component
const ParentProductRequests = ({ 
  requests, 
  onApprove, 
  onReject,
  loading 
}) => {
  const [actionModal, setActionModal] = useState({
    show: false,
    request: null,
    action: '',
    notes: '',
    approvedQuantity: 0
  });

  const handleActionClick = (request, action) => {
    setActionModal({
      show: true,
      request,
      action,
      notes: '',
      approvedQuantity: action === 'APPROVE' ? request.quantity : 0
    });
  };

  const handleActionSubmit = () => {
    const { request, action, notes, approvedQuantity } = actionModal;
    
    if (action === 'APPROVE') {
      onApprove(request._id, action, notes, approvedQuantity);
    } else {
      onReject(request._id, action, notes);
    }
    
    setActionModal({ show: false, request: null, action: '', notes: '', approvedQuantity: 0 });
  };

  const handleCloseModal = () => {
    setActionModal({ show: false, request: null, action: '', notes: '', approvedQuantity: 0 });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <Badge bg="warning">Pending</Badge>;
      case 'APPROVED': return <Badge bg="success">Approved</Badge>;
      case 'REJECTED': return <Badge bg="danger">Rejected</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading requests...</p>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Alert variant="info" className="text-center">
        <h5>No pending requests</h5>
        <p>There are no product requests waiting for your approval.</p>
      </Alert>
    );
  }

  return (
    <div>
      {/* Action Confirmation Modal */}
      <Modal show={actionModal.show} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {actionModal.action === 'APPROVE' ? 'Approve' : 'Reject'} Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {actionModal.request && (
            <div className="mb-3">
              <h6>Request Details:</h6>
              <Card className="bg-light">
                <Card.Body className="py-2">
                  <strong>{actionModal.request.productName}</strong>
                  <br />
                  <small>
                    Requested by: {actionModal.request.requestingOrganizationName}
                    <br />
                    Quantity: {actionModal.request.quantity}
                    <br />
                    Reason: {actionModal.request.reason}
                  </small>
                </Card.Body>
              </Card>
            </div>
          )}

          {actionModal.action === 'APPROVE' && (
            <Form.Group className="mb-3">
              <Form.Label>Approved Quantity *</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max={actionModal.request?.quantity || 1}
                value={actionModal.approvedQuantity}
                onChange={(e) => setActionModal(prev => ({
                  ...prev,
                  approvedQuantity: parseInt(e.target.value) || 0
                }))}
                required
              />
              <Form.Text className="text-muted">
                Maximum requested: {actionModal.request?.quantity}
              </Form.Text>
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>
              {actionModal.action === 'APPROVE' ? 'Approval Notes' : 'Rejection Reason'}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={actionModal.notes}
              onChange={(e) => setActionModal(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={
                actionModal.action === 'APPROVE' 
                  ? 'Add any notes about this approval...' 
                  : 'Please provide reason for rejection...'
              }
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button 
            variant={actionModal.action === 'APPROVE' ? 'success' : 'danger'}
            onClick={handleActionSubmit}
            disabled={actionModal.action === 'APPROVE' && actionModal.approvedQuantity <= 0}
          >
            Confirm {actionModal.action === 'APPROVE' ? 'Approve' : 'Reject'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Requests Table */}
      <div className="table-responsive">
        <Table striped hover>
          <thead className="table-dark">
            <tr>
              <th>Product Details</th>
              <th>Requesting Organization</th>
              <th>Quantity</th>
              <th>Reason</th>
              <th>Requested At</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request._id}>
                <td>
                  <div>
                    <strong className="text-primary">{request.productName}</strong>
                    <br />
                    <small className="text-muted">
                      Brand: {request.productBrand} | Category: {request.productCategory}
                      <br />
                      Current Stock: {request.currentStock}
                    </small>
                  </div>
                </td>
                <td>
                  <div>
                    <strong>{request.requestingOrganizationName}</strong>
                    <br />
                    <small className="text-muted">
                      {request.requestingOrganization}
                    </small>
                  </div>
                </td>
                <td>
                  <Badge bg="info" className="fs-6">
                    {request.quantity}
                  </Badge>
                </td>
                <td>
                  <div style={{ maxWidth: '200px' }}>
                    {request.reason}
                  </div>
                </td>
                <td>
                  <small>
                    {new Date(request.requestedAt).toLocaleDateString()}
                    <br />
                    {new Date(request.requestedAt).toLocaleTimeString()}
                  </small>
                </td>
                <td>
                  {getStatusBadge(request.status)}
                </td>
                <td>
                  {request.status === 'PENDING' && (
                    <ButtonGroup size="sm">
                      <Button
                        variant="outline-success"
                        onClick={() => handleActionClick(request, 'APPROVE')}
                        title="Approve Request"
                      >
                        ✓ Approve
                      </Button>
                      <Button
                        variant="outline-danger"
                        onClick={() => handleActionClick(request, 'REJECT')}
                        title="Reject Request"
                      >
                        ✗ Reject
                      </Button>
                    </ButtonGroup>
                  )}
                  {request.status !== 'PENDING' && (
                    <small className="text-muted">
                      Processed
                    </small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

// Combined Requests Tab Component
const RequestsTab = ({ 
  authorizationRequests, 
  parentProductRequests, 
  onAuthorization, 
  onProductRequestAction,
  loading 
}) => {
  const [activeRequestTab, setActiveRequestTab] = useState('parentRequests');

  const pendingAuthorizationCount = authorizationRequests.filter(r => r.status === 'pending').length;
  const pendingParentRequestsCount = parentProductRequests.filter(r => r.status === 'PENDING').length;

  return (
    <div>
      <Tabs
        activeKey={activeRequestTab}
        onSelect={(tab) => setActiveRequestTab(tab)}
        className="mb-3"
      >
        <Tab 
          eventKey="parentRequests" 
          title={
            <span>
              Product Requests 
              {pendingParentRequestsCount > 0 && (
                <Badge bg="danger" className="ms-2">
                  {pendingParentRequestsCount}
                </Badge>
              )}
            </span>
          }
        >
          <ParentProductRequests
            requests={parentProductRequests}
            onApprove={(requestId, action, notes, approvedQuantity) => 
              onProductRequestAction(requestId, action, notes, approvedQuantity)
            }
            onReject={(requestId, action, notes) => 
              onProductRequestAction(requestId, action, notes)
            }
            loading={loading}
          />
        </Tab>
        
        <Tab 
          eventKey="authorizationRequests" 
          title={
            <span>
              Authorization Requests 
              {pendingAuthorizationCount > 0 && (
                <Badge bg="warning" className="ms-2">
                  {pendingAuthorizationCount}
                </Badge>
              )}
            </span>
          }
        >
          <Alert variant="info">
            <h6>Authorization Requests</h6>
            <p>This section handles product authorization requests from your organization hierarchy.</p>
            <p>Use the table below to manage these requests.</p>
          </Alert>
          
          {/* You can add your authorization requests table here */}
          {authorizationRequests.length === 0 ? (
            <Alert variant="success" className="text-center">
              No pending authorization requests
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead className="table-dark">
                  <tr>
                    <th>Product</th>
                    <th>Requested By</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {authorizationRequests.map((request) => (
                    <tr key={request._id}>
                      <td>{request.productName}</td>
                      <td>{request.requestedBy}</td>
                      <td>
                        <Badge bg={
                          request.status === 'pending' ? 'warning' :
                          request.status === 'approved' ? 'success' : 'danger'
                        }>
                          {request.status}
                        </Badge>
                      </td>
                      <td>
                        {request.status === 'pending' && (
                          <ButtonGroup size="sm">
                            <Button
                              variant="outline-success"
                              onClick={() => onAuthorization(request._id, 'approve', '')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline-danger"
                              onClick={() => onAuthorization(request._id, 'reject', '')}
                            >
                              Reject
                            </Button>
                          </ButtonGroup>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Tab>
      </Tabs>
    </div>
  );
};

// Product Request Modal Component
const ProductRequestModal = ({ show, onHide, onRequest, product, requestData, setRequestData }) => {
  if (!product) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onRequest();
  };

  const isOwnProduct = product.sourceType === 'OWN';
  const canRequest = product.canRequest !== false;

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Request Product</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isOwnProduct ? (
          <Alert variant="info" className="text-center">
            <h5>This is your own product</h5>
            <p>You cannot request products from your own organization.</p>
          </Alert>
        ) : !canRequest ? (
          <Alert variant="warning" className="text-center">
            <h5>Request Not Available</h5>
            <p>This product cannot be requested at the moment.</p>
          </Alert>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Product Details</Form.Label>
              <Card>
                <Card.Body>
                  <strong>{product.name}</strong>
                  <br />
                  <small className="text-muted">
                    Brand: {product.brand} | Category: {product.category} | Type: {product.type || 'N/A'}
                    <br />
                    From: {product.sourceOrgName}
                    <br />
                    Available Stock: {product.availableStock}
                  </small>
                </Card.Body>
              </Card>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Quantity *</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max={product.availableStock}
                value={requestData.quantity}
                onChange={(e) => setRequestData(prev => ({ 
                  ...prev, 
                  quantity: parseInt(e.target.value) || 1 
                }))}
                required
              />
              <Form.Text className="text-muted">
                Maximum available: {product.availableStock}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Reason for Request *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={requestData.reason}
                onChange={(e) => setRequestData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Please explain why you need this product..."
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
                disabled={requestData.quantity > product.availableStock || !requestData.reason}
              >
                Submit Request
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
};

// Authorization Modal Component
const AuthorizationModal = ({ show, onHide, requests, onAuthorization }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Authorization Requests</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Use the "Authorization Requests" tab to manage all pending requests.</p>
        <p>You can quickly approve or reject requests directly from the table, or click the eye icon to view detailed information.</p>
        
        <div className="text-center">
          <Button variant="primary" onClick={onHide}>
            Open Authorization Tab
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ProductManagement;