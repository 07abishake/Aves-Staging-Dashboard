import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Table, Card, Badge, Spinner, Alert, Image, Row, Col } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const ProductManager = () => {
  // State declarations
  const [products, setProducts] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [imagePreview, setImagePreview] = useState([]);
  const [duplicateProducts, setDuplicateProducts] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);
  const [hasExpiry, setHasExpiry] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    ItemName: '',
    Category: '',
    Type: '',
    BrandModel: '',
    Description: '',
    AddQuntity: 0,
    MinimumStockLevel: 0,
    ProductImage: [],
    ExpiryDate: null
  });

  // Get token from localStorage
  const token = localStorage.getItem("access_token");

  // Fetch products function
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('https://api.avessecurity.com/api/AddProducts/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const productsData = response.data?.Products || [];
      
      // Ensure ProductImage is an array and construct full URLs
      const processedProducts = productsData.map(product => ({
        ...product,
        ProductImage: Array.isArray(product.ProductImage) 
          ? product.ProductImage.map(img => 
              img.startsWith('http') ? img : `https://api.avessecurity.com/${img}`)
          : []
      }));
      
      setProducts(processedProducts);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect for initial data loading
  useEffect(() => {
    if (!token) {
      // window.location.href = "/login";
      return;
    }
    fetchProducts();
  }, [token]);

  // Check for duplicates
  const checkForDuplicates = async (itemName) => {
    try {
      const response = await axios.get(
        `http://localhost:6378/api/AddProducts/products/check-duplicate?itemName=${encodeURIComponent(itemName)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.duplicates && response.data.duplicates.length > 0) {
        setDuplicateProducts(response.data.duplicates);
        setShowDuplicateModal(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Duplicate check error:', err);
      return false;
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Check for duplicates when ItemName changes
    if (name === 'ItemName' && value.trim() !== '') {
      checkForDuplicates(value);
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
    setFormData(prev => ({ ...prev, ProductImage: files }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      ItemName: '',
      Category: '',
      Type: '',
      BrandModel: '',
      Description: '',
      AddQuntity: 0,
      MinimumStockLevel: 0,
      ProductImage: [],
      ExpiryDate: null
    });
    setImagePreview([]);
    setCurrentProduct(null);
    setUpdateExisting(false);
    setHasExpiry(false);
    setExpiryDate(null);
    setIsDuplicate(false);
    setDuplicateProducts([]);
  };

  // Open form for editing
  const openEditForm = (product) => {
    setCurrentProduct(product);
    setFormData({
      ItemName: product.ItemName || '',
      Category: product.Category || '',
      Type: product.Type || '',
      BrandModel: product.BrandModel || '',
      Description: product.Description || '',
      AddQuntity: product.AddQuntity || 0,
      MinimumStockLevel: product.MinimumStockLevel || 0,
      ProductImage: [],
      ExpiryDate: product.ExpiryDate || null
    });
    
    // Set expiry state
    setHasExpiry(!!product.ExpiryDate);
    setExpiryDate(product.ExpiryDate ? new Date(product.ExpiryDate) : null);
    
    // Set image previews from existing product images
    setImagePreview(
      product.ProductImage?.map(img => 
        img.startsWith('http') ? img : `https://api.avessecurity.com/${img}`) || []
    );
    setShowFormModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // If updating an existing product with duplicate handling
      if (updateExisting && duplicateProducts.length > 0) {
        // Update the first duplicate (you might want to let the user choose which one)
        const productToUpdate = duplicateProducts[0];
        const updatedQuantity = parseInt(productToUpdate.AddQuntity || 0) + parseInt(formData.AddQuntity || 0);
        
        const updateData = {
          ...formData,
          AddQuntity: updatedQuantity,
          ExpiryDate: hasExpiry ? expiryDate : null
        };
        
        const formDataToSend = new FormData();
        Object.entries(updateData).forEach(([key, value]) => {
          if (key !== 'ProductImage' && value !== null) {
            formDataToSend.append(key, value);
          }
        });
        
        // Append each image file
        if (formData.ProductImage && formData.ProductImage.length > 0) {
          formData.ProductImage.forEach(file => {
            formDataToSend.append('ProductImage', file);
          });
        }
        
        const response = await axios.put(
          `https://api.avessecurity.com/api/AddProducts/products/update/${productToUpdate._id}`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        
        setSuccess('Product quantity updated successfully');
        setShowFormModal(false);
        setShowDuplicateModal(false);
        resetForm();
        fetchProducts();
        return;
      }
      
      // Regular create/update flow
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'ProductImage' && value !== null) {
          formDataToSend.append(key, value);
        }
      });
      
      // Add expiry date if applicable
      if (hasExpiry && expiryDate) {
        formDataToSend.append('ExpiryDate', expiryDate.toISOString());
      }
      
      // Append each image file
      if (formData.ProductImage && formData.ProductImage.length > 0) {
        formData.ProductImage.forEach(file => {
          formDataToSend.append('ProductImage', file);
        });
      }

      let response;
      if (currentProduct) {
        // Update existing product
        response = await axios.put(
          `https://api.avessecurity.com/api/AddProducts/products/update/${currentProduct._id}`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setSuccess('Product updated successfully');
      } else {
        // Create new product
        response = await axios.post(
          'http://localhost:6378/AddProducts/products/create',
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setSuccess('Product created successfully');
      }
      
      console.log('API Response:', response.data);
      fetchProducts();
      setShowFormModal(false);
      resetForm();
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    setIsLoading(true);
    try {
      await axios.delete(
        `https://api.avessecurity.com/api/AddProducts/products/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess('Product deleted successfully');
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Delete failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Product Management</h2>
        <Button variant="primary" onClick={() => { setShowFormModal(true); resetForm(); }}>
          Add Product
        </Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      <Card className="shadow-sm">
        <Card.Body>
          {isLoading && !products.length ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length > 0 ? (
                    products.map(product => (
                      <tr key={product._id}>
                        <td>
                          <Badge bg="secondary">{product.ItemCode || 'N/A'}</Badge>
                        </td>
                        <td>{product.ItemName || 'N/A'}</td>
                        <td>{product.Category || 'N/A'}</td>
                        <td>{product.Type || 'N/A'}</td>
                        <td>{product.AddQuntity || 0}</td>
                        <td>{product.ExpiryDate ? new Date(product.ExpiryDate).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <Badge bg={product.isActive ? 'success' : 'secondary'}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button variant="outline-primary" size="sm" onClick={() => {
                              setCurrentProduct(product);
                              setShowViewModal(true);
                            }}>
                              View
                            </Button>
                            <Button variant="outline-warning" size="sm" onClick={() => openEditForm(product)}>
                              Edit
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(product._id)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center">No products found</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Product Form Modal */}
      <Modal show={showFormModal} onHide={() => setShowFormModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{currentProduct ? 'Edit Product' : 'Add New Product'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group controlId="itemName">
                  <Form.Label>Item Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="ItemName"
                    value={formData.ItemName}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
              
              <div className="col-md-6">
                <Form.Group controlId="category">
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    type="text"
                    name="Category"
                    value={formData.Category}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>
              
              <div className="col-md-6">
                <Form.Group controlId="type">
                  <Form.Label>Type</Form.Label>
                  <Form.Control
                    type="text"
                    name="Type"
                    value={formData.Type}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>
              
              <div className="col-md-6">
                <Form.Group controlId="brandModel">
                  <Form.Label>Brand/Model</Form.Label>
                  <Form.Control
                    type="text"
                    name="BrandModel"
                    value={formData.BrandModel}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>
              
              <div className="col-12">
                <Form.Group controlId="description">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="Description"
                    value={formData.Description}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>
              
              <div className="col-md-4">
                <Form.Group controlId="quantity">
                  <Form.Label>Initial Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="AddQuntity"
                    value={formData.AddQuntity}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>
              
              <div className="col-md-4">
                <Form.Group controlId="minStock">
                  <Form.Label>Minimum Stock Level</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="MinimumStockLevel"
                    value={formData.MinimumStockLevel}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>
              
              <div className="col-md-4">
                <Form.Group controlId="images">
                  <Form.Label>Product Images</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    onChange={handleImageUpload}
                    accept="image/*"
                  />
                </Form.Group>
              </div>
              
              <div className="col-md-6">
                <Form.Group controlId="hasExpiry">
                  <Form.Check
                    type="checkbox"
                    label="Product has expiry date"
                    checked={hasExpiry}
                    onChange={(e) => setHasExpiry(e.target.checked)}
                  />
                </Form.Group>
              </div>
              
              {hasExpiry && (
                <div className="col-md-6">
                  <Form.Group controlId="expiryDate">
                    <Form.Label>Expiry Date</Form.Label>
                    <DatePicker
                      selected={expiryDate}
                      onChange={date => setExpiryDate(date)}
                      dateFormat="MMMM d, yyyy"
                      className="form-control"
                      minDate={new Date()}
                    />
                  </Form.Group>
                </div>
              )}
              
              {(imagePreview.length > 0 || (currentProduct?.ProductImage?.length > 0)) && (
                <div className="col-12">
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {imagePreview.length > 0 ? (
                      imagePreview.map((img, index) => (
                        <Image
                          key={index}
                          src={typeof img === 'string' ? img : URL.createObjectURL(img)}
                          alt="Preview"
                          thumbnail
                          style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                        />
                      ))
                    ) : (
                      currentProduct?.ProductImage?.map((img, index) => (
                        <Image
                          key={index}
                          src={img}
                          alt="Current"
                          thumbnail
                          style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowFormModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Saving...</span>
                </>
              ) : (
                'Save Product'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Duplicate Products Modal */}
      <Modal show={showDuplicateModal} onHide={() => setShowDuplicateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Duplicate Products Found</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Products with the same name already exist. Would you like to update an existing product instead?</p>
          
          <Form.Check
            type="checkbox"
            label="Yes, update existing product quantity"
            checked={updateExisting}
            onChange={(e) => setUpdateExisting(e.target.checked)}
            className="mb-3"
          />
          
          {updateExisting && (
            <div>
              <p>Select product to Map:</p>
              <Form.Select 
                onChange={(e) => {
                  const selectedProduct = duplicateProducts.find(p => p._id === e.target.value);
                  if (selectedProduct) {
                    setFormData(prev => ({
                      ...prev,
                      Category: selectedProduct.Category || '',
                      Type: selectedProduct.Type || '',
                      BrandModel: selectedProduct.BrandModel || '',
                      Description: selectedProduct.Description || '',
                      MinimumStockLevel: selectedProduct.MinimumStockLevel || 0
                    }));
                  }
                }}
              >
                <option value="">Select a product</option>
                {duplicateProducts.map(product => (
                  <option key={product._id} value={product._id}>
                    {product.ItemName} (Qty: {product.AddQuntity || 0})
                  </option>
                ))}
              </Form.Select>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDuplicateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => {
            setShowDuplicateModal(false);
            if (updateExisting) {
              // We'll handle the update in the submit function
              setShowFormModal(true);
            } else {
              // Continue with creating a new product
              setShowFormModal(true);
            }
          }}>
            Continue
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Product View Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Product Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentProduct && (
            <div className="row">
              <div className="col-md-5">
                {currentProduct.ProductImage?.length > 0 ? (
                  <div>
                    {/* Main Image */}
                    <Image
                      src={currentProduct.ProductImage[0]}
                      alt={currentProduct.ItemName}
                      fluid
                      className="rounded mb-2"
                    />

                    {/* Thumbnails if more than 1 image */}
                    {currentProduct.ProductImage.length > 1 && (
                      <div className="d-flex gap-2 flex-wrap">
                        {currentProduct.ProductImage.map((img, index) => (
                          <Image
                            key={index}
                            src={img.startsWith('http') ? img : `https://api.avessecurity.com/${img}`}
                            alt={`${currentProduct.ItemName}-${index}`}
                            thumbnail
                            style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-light d-flex align-items-center justify-content-center rounded" style={{ height: '200px' }}>
                    <span className="text-muted">No Image Available</span>
                  </div>
                )}
              </div>
              <div className="col-md-7">
                <h4>{currentProduct.ItemName || 'N/A'}</h4>
                <p className="text-muted">{currentProduct.ItemCode || 'N/A'}</p>
                
                <div className="mb-3">
                  <h6>Details</h6>
                  <div className="row">
                    <div className="col-6">
                      <p className="mb-1"><strong>Category:</strong> {currentProduct.Category || '-'}</p>
                      <p className="mb-1"><strong>Type:</strong> {currentProduct.Type || '-'}</p>
                    </div>
                    <div className="col-6">
                      <p className="mb-1"><strong>Brand/Model:</strong> {currentProduct.BrandModel || '-'}</p>
                      <p className="mb-1"><strong>Quantity:</strong> {currentProduct.AddQuntity || 0}</p>
                    </div>
                  </div>
                  {currentProduct.ExpiryDate && (
                    <p className="mb-1">
                      <strong>Expiry Date:</strong> {new Date(currentProduct.ExpiryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                <div className="mb-3">
                  <h6>Description</h6>
                  <p>{currentProduct.Description || 'No description available'}</p>
                </div>
                
                <div className="d-flex gap-2">
                  <Badge bg="info">Min Stock: {currentProduct.MinimumStockLevel || 0}</Badge>
                  <Badge bg={currentProduct.isActive ? 'success' : 'secondary'}>
                    {currentProduct.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProductManager;