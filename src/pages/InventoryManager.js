import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Table, Card, Badge, Spinner, Alert, Offcanvas } from 'react-bootstrap';

const InventoryManager = () => {
  // State declarations
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showRemoveStock, setShowRemoveStock] = useState(false);
  const [showTransferStock, setShowTransferStock] = useState(false);
  const [showInventoryView, setShowInventoryView] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Location hierarchy state
  const [selectedPrimary, setSelectedPrimary] = useState('');
  const [selectedSecondary, setSelectedSecondary] = useState('');
  const [selectedTertiary, setSelectedTertiary] = useState('');

  // Form states
  const [addStockForm, setAddStockForm] = useState({
    productId: '',
    locationId: '',
    quantity: 0
  });
  
  const [removeStockForm, setRemoveStockForm] = useState({
    productId: '',
    locationId: '',
    quantity: 0
  });
  
  const [transferForm, setTransferForm] = useState({
    productId: '',
    fromLocationId: '',
    toLocationId: '',
    quantity: 0
  });

  const [locationForm, setLocationForm] = useState({
    PrimaryLocation: '',
    SubLocation: '',
    SecondaryLocation: '',
    TertiaryLocation: ''
  });

  // Get token and redirect if not authenticated
  const token = localStorage.getItem("access_token");
  
  // Fetch initial data
  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, locationsRes] = await Promise.all([
          axios.get('http://api.avessecurity.com:6378/api/AddProducts/products', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://api.avessecurity.com:6378/api/Location/getLocations', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        // Handle products response
        const productsData = productsRes.data?.Products || [];
        setProducts(Array.isArray(productsData) ? productsData : []);
        
        // Handle locations response
        const locationsData = locationsRes.data?.Location || [];
        setLocations(Array.isArray(locationsData) ? locationsData : []);
        
        setError(null);
      } catch (err) {
        setError('Failed to load initial data: ' + (err.response?.data?.message || err.message));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [token]);

  // Reset alerts after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Location hierarchy handlers
  const handlePrimaryChange = (e) => {
    const primaryId = e.target.value;
    setSelectedPrimary(primaryId);
    setSelectedSecondary('');
    setSelectedTertiary('');
  };

  const handleSecondaryChange = (e) => {
    const secondaryId = e.target.value;
    setSelectedSecondary(secondaryId);
    setSelectedTertiary('');
  };

  const handleTertiaryChange = (e) => {
    const tertiaryId = e.target.value;
    setSelectedTertiary(tertiaryId);
  };

  const getPrimaryLocations = () => {
    return [...new Set(locations.map(loc => loc.PrimaryLocation))];
  };

  const getSecondaryLocations = (primary) => {
    if (!primary) return [];
    const loc = locations.find(l => l.PrimaryLocation === primary);
    return loc?.SecondaryLocation || [];
  };

  const getTertiaryLocations = (primary, secondary) => {
    if (!primary || !secondary) return [];
    const loc = locations.find(l => l.PrimaryLocation === primary);
    if (!loc) return [];
    const secLoc = loc.SecondaryLocation.find(s => s._id === secondary);
    return secLoc?.TertiaryLocation || [];
  };

  // Add new location
  const handleAddLocation = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(
        'http://api.avessecurity.com:6378/api/Location/create',
        locationForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSuccess('Location added successfully');
      setShowLocationModal(false);
      setLocationForm({
        PrimaryLocation: '',
        SubLocation: '',
        SecondaryLocation: '',
        TertiaryLocation: ''
      });
      // Refresh locations
      const { data } = await axios.get('http://api.avessecurity.com:6378/api/Location/getLocations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocations(data.Location || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add location');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch inventory by location
  const fetchInventoryByLocation = async (locationId) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(
        `http://localhost:6378/api/inventory/GetInventoryLocation/${locationId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setInventory(Array.isArray(data) ? data : []);
      setSelectedLocation(locations.find(loc => loc._id === locationId));
      setShowInventoryView(true);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch inventory');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch inventory by product
  const fetchInventoryByProduct = async (productId) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(
        `http://localhost:6378/api/inventory/GetInventoryByProduct/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setInventory(Array.isArray(data) ? data : []);
      setCurrentItem(products.find(p => p._id === productId));
      setShowInventoryView(true);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch inventory');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submissions
  const handleAddStock = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(
        'http://localhost:6378/api/inventory/AddStock',
        addStockForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSuccess('Stock added successfully');
      setShowAddStock(false);
      setAddStockForm({ productId: '', locationId: '', quantity: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add stock');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStock = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(
        'http://api.avessecurity.com:6378/api/inventory/RemoveStock',
        removeStockForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSuccess('Stock removed successfully');
      setShowRemoveStock(false);
      setRemoveStockForm({ productId: '', locationId: '', quantity: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove stock');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferStock = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(
        'http://api.avessecurity.com:6378/api/inventory/Transfer',
        transferForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSuccess('Stock transferred successfully');
      setShowTransferStock(false);
      setTransferForm({
        productId: '',
        fromLocationId: '',
        toLocationId: '',
        quantity: 0
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to transfer stock');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset alerts after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Inventory Management</h2>
        <div className="d-flex gap-2">
          <Button variant="success" onClick={() => setShowAddStock(true)}>
            Add Stock
          </Button>
          <Button variant="warning" onClick={() => setShowRemoveStock(true)}>
            Remove Stock
          </Button>
          <Button variant="info" onClick={() => setShowTransferStock(true)}>
            Transfer Stock
          </Button>
          <Button variant="primary" onClick={() => setShowLocationModal(true)}>
            Add Location
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-light">
          <h5 className="mb-0">Products Overview</h5>
        </Card.Header>
        <Card.Body>
          {isLoading && products.length === 0 ? (
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
                    <th>Total Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product._id}>
                      <td>
                        <Badge bg="secondary">{product.ItemCode}</Badge>
                      </td>
                      <td>{product.ItemName}</td>
                      <td>{product.Category}</td>
                      <td>{product.AddQuntity || 0}</td>
                      <td>
                        <Badge bg={product.isActive ? 'success' : 'secondary'}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => fetchInventoryByProduct(product._id)}
                        >
                          View Inventory
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header className="bg-light">
          <h5 className="mb-0">Locations Overview</h5>
        </Card.Header>
        <Card.Body>
          {isLoading && locations.length === 0 ? (
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
                    <th>Primary Location</th>
                    <th>Sub Location</th>
                    <th>Secondary Locations</th>
                    <th>Tertiary Locations</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map(location => (
                    <tr key={location._id}>
                      <td>{location.PrimaryLocation}</td>
                      <td>{location.SubLocation}</td>
                      <td>
                        {location.SecondaryLocation?.length || 0}
                      </td>
                      <td>
                        {location.SecondaryLocation?.reduce((acc, sec) => 
                          acc + (sec.TertiaryLocation?.length || 0), 0)}
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => fetchInventoryByLocation(location._id)}
                        >
                          View Inventory
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Stock Modal */}
      <Modal show={showAddStock} onHide={() => setShowAddStock(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Stock</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddStock}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Product</Form.Label>
              <Form.Select
                value={addStockForm.productId}
                onChange={(e) => setAddStockForm({...addStockForm, productId: e.target.value})}
             
              >
                <option value="">Select Product</option>
                {products.map(product => (
                  <option key={product._id} value={product._id}>
                    {product.ItemName} ({product.ItemCode})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Primary Location</Form.Label>
              <Form.Select
                value={selectedPrimary}
                onChange={handlePrimaryChange}
             
              >
                <option value="">Select Primary Location</option>
                {getPrimaryLocations().map((primary, index) => (
                  <option key={index} value={primary}>
                    {primary}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            {selectedPrimary && (
              <Form.Group className="mb-3">
                <Form.Label>Secondary Location</Form.Label>
                <Form.Select
                  value={selectedSecondary}
                  onChange={handleSecondaryChange}
              
                >
                  <option value="">Select Secondary Location</option>
                  {getSecondaryLocations(selectedPrimary).map((secondary, index) => (
                    <option key={secondary._id} value={secondary._id}>
                      {secondary.SecondaryLocationName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
            
            {selectedSecondary && (
              <Form.Group className="mb-3">
                <Form.Label>Tertiary Location</Form.Label>
                <Form.Select
                  value={selectedTertiary}
                  onChange={handleTertiaryChange}
             
                >
                  <option value="">Select Tertiary Location</option>
                  {getTertiaryLocations(selectedPrimary, selectedSecondary).map((tertiary, index) => (
                    <option key={tertiary._id} value={tertiary._id}>
                      {tertiary.TertiaryLocationName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                min="1"
                value={addStockForm.quantity}
                onChange={(e) => setAddStockForm({...addStockForm, quantity: parseInt(e.target.value)})}
                             />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddStock(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Stock'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Add Location Modal */}
      <Modal show={showLocationModal} onHide={() => setShowLocationModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Location</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddLocation}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Primary Location</Form.Label>
              <Form.Control
                type="text"
                value={locationForm.PrimaryLocation}
                onChange={(e) => setLocationForm({...locationForm, PrimaryLocation: e.target.value})}
              
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Sub Location</Form.Label>
              <Form.Control
                type="text"
                value={locationForm.SubLocation}
                onChange={(e) => setLocationForm({...locationForm, SubLocation: e.target.value})}
             
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Secondary Location Name</Form.Label>
              <Form.Control
                type="text"
                value={locationForm.SecondaryLocation}
                onChange={(e) => setLocationForm({...locationForm, SecondaryLocation: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Tertiary Location Name</Form.Label>
              <Form.Control
                type="text"
                value={locationForm.TertiaryLocation}
                onChange={(e) => setLocationForm({...locationForm, TertiaryLocation: e.target.value})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowLocationModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Location'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Inventory View Offcanvas */}
      <Offcanvas show={showInventoryView} onHide={() => setShowInventoryView(false)} placement="end" style={{ width: '600px' }}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            Inventory Details
            {currentItem && (
              <span className="ms-2">
                <Badge bg="secondary">{currentItem.ItemCode}</Badge>
              </span>
            )}
            {selectedLocation && (
              <span className="ms-2">
                <Badge bg="info">{selectedLocation.PrimaryLocation}</Badge>
              </span>
            )}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : (
            <>
              {currentItem && (
                <div className="mb-4">
                  <h5>{currentItem.ItemName}</h5>
                  <p className="text-muted">{currentItem.Description || 'No description available'}</p>
                  <div className="d-flex gap-2 mb-3">
                    <Badge bg="info">Category: {currentItem.Category}</Badge>
                    <Badge bg="info">Type: {currentItem.Type}</Badge>
                    <Badge bg={currentItem.isActive ? 'success' : 'secondary'}>
                      {currentItem.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              )}
              
              {selectedLocation && (
                <div className="mb-4">
                  <h5>Location: {selectedLocation.PrimaryLocation}</h5>
                  <p className="text-muted">Sub Location: {selectedLocation.SubLocation}</p>
                </div>
              )}
              
              <h5 className="mb-3">Stock Details</h5>
              {inventory.length > 0 ? (
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        {currentItem && <th>Location</th>}
                        {selectedLocation && <th>Product</th>}
                        <th>Total Stock</th>
                        <th>In Use</th>
                        <th>Reserved</th>
                        <th>Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item, index) => (
                        <tr key={index}>
                          {currentItem && (
                            <td>
                              {locations.find(loc => loc._id === item.location)?.PrimaryLocation || 'Unknown'}
                            </td>
                          )}
                          {selectedLocation && (
                            <td>
                              {products.find(p => p._id === item.product)?.ItemName || 'Unknown'}
                              <br />
                              <small className="text-muted">
                                {products.find(p => p._id === item.product)?.ItemCode || ''}
                              </small>
                            </td>
                          )}
                          <td>{item.totalStock}</td>
                          <td>{item.inUse}</td>
                          <td>{item.reserved}</td>
                          <td>
                            <Badge bg={item.available > 0 ? 'success' : 'danger'}>
                              {item.available}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="alert alert-info">No inventory records found</div>
              )}
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default InventoryManager;