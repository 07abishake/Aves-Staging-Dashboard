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
          axios.get('https://api.avessecurity.com/api/AddProducts/products', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('https://api.avessecurity.com/api/Location/getLocations', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setProducts(productsRes.data?.Products || []);
        setLocations(locationsRes.data?.Location || []);
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

  // Fetch inventory by location
  const fetchInventoryByLocation = async (locationId) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(
        `https://api.avessecurity.com/api/inventory/GetInventoryLocation/${locationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Handle the response data
      const inventoryData = data?.data || [];
      
      // Find the location details from the locations state
      let locationDetails = null;
      
      // Check primary locations
      const primaryLoc = locations.find(loc => loc._id === locationId);
      if (primaryLoc) {
        locationDetails = {
          _id: primaryLoc._id,
          name: primaryLoc.PrimaryLocation,
          subLocation: primaryLoc.SubLocation,
          level: 'primary'
        };
      } else {
        // Check secondary locations
        for (const primary of locations) {
          const secondaryLoc = primary.SecondaryLocation?.find(sec => sec._id === locationId);
          if (secondaryLoc) {
            locationDetails = {
              _id: secondaryLoc._id,
              name: secondaryLoc.SecondaryLocation,
              subLocation: secondaryLoc.SubLocation,
              parentId: primary._id,
              parentName: primary.PrimaryLocation,
              level: 'secondary'
            };
            break;
          }
        }
        
        // Check tertiary locations if not found in secondary
        if (!locationDetails) {
          for (const primary of locations) {
            for (const secondary of primary.SecondaryLocation || []) {
              const tertiaryLoc = secondary.ThirdLocation?.find(ter => ter._id === locationId);
              if (tertiaryLoc) {
                locationDetails = {
                  _id: tertiaryLoc._id,
                  name: tertiaryLoc.ThirdLocation,
                  subLocation: tertiaryLoc.SubLocation,
                  parentId: secondary._id,
                  parentName: secondary.SecondaryLocation,
                  grandParentId: primary._id,
                  grandParentName: primary.PrimaryLocation,
                  level: 'tertiary'
                };
                break;
              }
            }
          }
        }
      }
      
      setInventory(inventoryData);
      setSelectedLocation(locationDetails);
      setShowInventoryView(true);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch inventory');
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch inventory by product
  const fetchInventoryByProduct = async (productId) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(
        `https://api.avessecurity.com/api/inventory/GetInventoryByProduct/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const inventoryData = Array.isArray(data) ? data : 
                         (Array.isArray(data?.data?.status) ? data.data.status : 
                         (Array.isArray(data?.status) ? data.status : []));
      
      setInventory(inventoryData);
      setCurrentItem(products.find(p => p._id === productId));
      setShowInventoryView(true);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch inventory');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle add stock
  const handleAddStock = async (e) => {
    e.preventDefault();
    
    let locationId = '';
    if (selectedTertiary) {
      locationId = selectedTertiary;
    } else if (selectedSecondary) {
      locationId = selectedSecondary;
    } else if (selectedPrimary) {
      const primaryLoc = locations.find(loc => loc.PrimaryLocation === selectedPrimary);
      locationId = primaryLoc?._id || '';
    }

    if (!addStockForm.productId || !locationId || addStockForm.quantity <= 0) {
      setError('Please fill all required fields with valid values');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        'https://api.avessecurity.com/api/inventory/AddStock',
        {
          productId: addStockForm.productId,
          locationId: locationId,
          quantity: addStockForm.quantity
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Stock added successfully');
      setShowAddStock(false);
      setAddStockForm({ productId: '', locationId: '', quantity: 0 });
      setSelectedPrimary('');
      setSelectedSecondary('');
      setSelectedTertiary('');
      
      if (currentItem) {
        await fetchInventoryByProduct(currentItem._id);
      } else if (selectedLocation) {
        // Determine the level based on the selected location
        let level = 'primary';
        if (selectedLocation.SecondaryLocationId) level = 'secondary';
        if (selectedLocation.ThirdLocation) level = 'tertiary';
        await fetchInventoryByLocation(selectedLocation._id, level);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add stock');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle remove stock
  const handleRemoveStock = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(
        'https://api.avessecurity.com/api/inventory/RemoveStock',
        removeStockForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Stock removed successfully');
      setShowRemoveStock(false);
      setRemoveStockForm({ productId: '', locationId: '', quantity: 0 });
      
      if (currentItem) {
        await fetchInventoryByProduct(currentItem._id);
      } else if (selectedLocation) {
        let level = 'primary';
        if (selectedLocation.SecondaryLocationId) level = 'secondary';
        if (selectedLocation.ThirdLocation) level = 'tertiary';
        await fetchInventoryByLocation(selectedLocation._id, level);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove stock');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle transfer stock
  const handleTransferStock = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(
        'https://api.avessecurity.com/api/inventory/Transfer',
        transferForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Stock transferred successfully');
      setShowTransferStock(false);
      setTransferForm({
        productId: '',
        fromLocationId: '',
        toLocationId: '',
        quantity: 0
      });
      
      if (currentItem) {
        await fetchInventoryByProduct(currentItem._id);
      } else if (selectedLocation) {
        let level = 'primary';
        if (selectedLocation.SecondaryLocationId) level = 'secondary';
        if (selectedLocation.ThirdLocation) level = 'tertiary';
        await fetchInventoryByLocation(selectedLocation._id, level);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to transfer stock');
    } finally {
      setIsLoading(false);
    }
  };

  // Flatten all locations for easier access
  const getAllLocations = () => {
    const allLocations = [];
    
    locations.forEach(primary => {
      // Add primary location
      allLocations.push({
        _id: primary._id,
        name: primary.PrimaryLocation,
        subLocation: primary.SubLocation,
        level: 'primary'
      });
      
      // Add secondary locations
      primary.SecondaryLocation?.forEach(secondary => {
        allLocations.push({
          _id: secondary._id,
          name: secondary.SecondaryLocation,
          subLocation: secondary.SubLocation,
          parentId: primary._id,
          parentName: primary.PrimaryLocation,
          level: 'secondary'
        });
        
        // Add tertiary locations
        secondary.ThirdLocation?.forEach(tertiary => {
          allLocations.push({
            _id: tertiary._id,
            name: tertiary.ThirdLocation,
            subLocation: tertiary.SubLocation,
            parentId: secondary._id,
            parentName: secondary.SecondaryLocation,
            grandParentId: primary._id,
            grandParentName: primary.PrimaryLocation,
            level: 'tertiary'
          });
        });
      });
    });
    
    return allLocations;
  };

  // Render location hierarchy in table
  const renderLocationRows = () => {
    const rows = [];
    
    locations.forEach(primary => {
      // Primary location row
      rows.push(
        <tr key={`primary-${primary._id}`}>
          <td>{primary.PrimaryLocation}</td>
          <td>{primary.SubLocation}</td>
          <td>{primary.SecondaryLocation?.length || 0}</td>
          <td>
            {primary.SecondaryLocation?.reduce((acc, sec) => 
              acc + (sec.ThirdLocation?.length || 0), 0)}
          </td>
          <td>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => fetchInventoryByLocation(primary._id, 'primary')}
            >
              View Inventory
            </Button>
          </td>
        </tr>
      );
      
      // Secondary locations
      primary.SecondaryLocation?.forEach(secondary => {
        rows.push(
          <tr key={`secondary-${secondary._id}`}>
            <td>{primary.PrimaryLocation}</td>
            <td>{secondary.SubLocation}</td>
            <td>{secondary.SecondaryLocation}</td>
            <td>{secondary.ThirdLocation?.length || 0}</td>
            <td>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => fetchInventoryByLocation(secondary._id, 'secondary')}
              >
                View Inventory
              </Button>
            </td>
          </tr>
        );
        
        // Tertiary locations
        secondary.ThirdLocation?.forEach(tertiary => {
          rows.push(
            <tr key={`tertiary-${tertiary._id}`}>
              <td>{primary.PrimaryLocation}</td>
              <td>{tertiary.SubLocation}</td>
              <td>{secondary.SecondaryLocation}</td>
              <td>{tertiary.ThirdLocation}</td>
              <td>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => fetchInventoryByLocation(tertiary._id, 'tertiary')}
                >
                  View Inventory
                </Button>
              </td>
            </tr>
          );
        });
      });
    });
    
    return rows;
  };

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
                    <th>Secondary Location</th>
                    <th>Tertiary Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {renderLocationRows()}
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
                required
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
                onChange={(e) => setSelectedPrimary(e.target.value)}
                required
              >
                <option value="">Select Primary Location</option>
                {locations.map(loc => (
                  <option key={loc._id} value={loc.PrimaryLocation}>
                    {loc.PrimaryLocation} - {loc.SubLocation}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            {selectedPrimary && (
              <Form.Group className="mb-3">
                <Form.Label>Secondary Location (Optional)</Form.Label>
                <Form.Select
                  value={selectedSecondary}
                  onChange={(e) => setSelectedSecondary(e.target.value)}
                >
                  <option value="">Select Secondary Location (Optional)</option>
                  {locations
                    .find(loc => loc.PrimaryLocation === selectedPrimary)
                    ?.SecondaryLocation?.map(sec => (
                      <option key={sec._id} value={sec._id}>
                        {sec.SecondaryLocation} - {sec.SubLocation}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
            )}
            
            {selectedSecondary && (
              <Form.Group className="mb-3">
                <Form.Label>Tertiary Location (Optional)</Form.Label>
                <Form.Select
                  value={selectedTertiary}
                  onChange={(e) => setSelectedTertiary(e.target.value)}
                >
                  <option value="">Select Tertiary Location (Optional)</option>
                  {locations
                    .find(loc => loc.PrimaryLocation === selectedPrimary)
                    ?.SecondaryLocation?.find(sec => sec._id === selectedSecondary)
                    ?.ThirdLocation?.map(ter => (
                      <option key={ter._id} value={ter._id}>
                        {ter.ThirdLocation} - {ter.SubLocation}
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
                onChange={(e) => setAddStockForm({...addStockForm, quantity: parseInt(e.target.value) || 0})}
                required
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

      {/* Remove Stock Modal */}
      <Modal show={showRemoveStock} onHide={() => setShowRemoveStock(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Remove Stock</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRemoveStock}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Product</Form.Label>
              <Form.Select
                value={removeStockForm.productId}
                onChange={(e) => setRemoveStockForm({...removeStockForm, productId: e.target.value})}
                required
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
              <Form.Label>Location</Form.Label>
              <Form.Select
                value={removeStockForm.locationId}
                onChange={(e) => setRemoveStockForm({...removeStockForm, locationId: e.target.value})}
                required
              >
                <option value="">Select Location</option>
                {getAllLocations().map(location => (
                  <option key={location._id} value={location._id}>
                    {location.level === 'primary' && location.name}
                    {location.level === 'secondary' && `${location.parentName} > ${location.name}`}
                    {location.level === 'tertiary' && `${location.grandParentName} > ${location.parentName} > ${location.name}`}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                min="1"
                value={removeStockForm.quantity}
                onChange={(e) => setRemoveStockForm({...removeStockForm, quantity: parseInt(e.target.value) || 0})}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRemoveStock(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" disabled={isLoading}>
              {isLoading ? 'Removing...' : 'Remove Stock'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Transfer Stock Modal */}
      <Modal show={showTransferStock} onHide={() => setShowTransferStock(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Transfer Stock</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleTransferStock}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Product</Form.Label>
              <Form.Select
                value={transferForm.productId}
                onChange={(e) => setTransferForm({...transferForm, productId: e.target.value})}
                required
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
              <Form.Label>From Location</Form.Label>
              <Form.Select
                value={transferForm.fromLocationId}
                onChange={(e) => setTransferForm({...transferForm, fromLocationId: e.target.value})}
                required
              >
                <option value="">Select Source Location</option>
                {getAllLocations().map(location => (
                  <option key={location._id} value={location._id}>
                    {location.level === 'primary' && location.name}
                    {location.level === 'secondary' && `${location.parentName} > ${location.name}`}
                    {location.level === 'tertiary' && `${location.grandParentName} > ${location.parentName} > ${location.name}`}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>To Location</Form.Label>
              <Form.Select
                value={transferForm.toLocationId}
                onChange={(e) => setTransferForm({...transferForm, toLocationId: e.target.value})}
                required
              >
                <option value="">Select Destination Location</option>
                {getAllLocations().map(location => (
                  <option key={location._id} value={location._id}>
                    {location.level === 'primary' && location.name}
                    {location.level === 'secondary' && `${location.parentName} > ${location.name}`}
                    {location.level === 'tertiary' && `${location.grandParentName} > ${location.parentName} > ${location.name}`}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                min="1"
                value={transferForm.quantity}
                onChange={(e) => setTransferForm({...transferForm, quantity: parseInt(e.target.value) || 0})}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTransferStock(false)}>
              Cancel
            </Button>
            <Button variant="info" type="submit" disabled={isLoading}>
              {isLoading ? 'Transferring...' : 'Transfer Stock'}
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
                <Badge bg="info">
                  {selectedLocation.grandParentName && `${selectedLocation.grandParentName} > `}
                  {selectedLocation.parentName && `${selectedLocation.parentName} > `}
                  {selectedLocation.name}
                </Badge>
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
                  <h5>Location Details</h5>
                  <p className="text-muted">
                    {selectedLocation.grandParentName && `${selectedLocation.grandParentName} > `}
                    {selectedLocation.parentName && `${selectedLocation.parentName} > `}
                    {selectedLocation.name}
                  </p>
                  <p className="text-muted">Sub Location: {selectedLocation.subLocation}</p>
                  <p className="text-muted">Level: {selectedLocation.level}</p>
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
                        <th>Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item, index) => (
                        <tr key={index}>
                          {currentItem && (
                            <td>
                              {item.status?.map((statusItem, statusIndex) => {
                                const loc = locations.find(l => l._id === statusItem.location) || 
                                          locations.flatMap(l => l.SecondaryLocation).find(s => s?._id === statusItem.location) ||
                                          locations.flatMap(l => l.SecondaryLocation?.flatMap(s => s.ThirdLocation)).find(t => t?._id === statusItem.location);
                                return (
                                  <div key={statusIndex}>
                                    {loc?.PrimaryLocation || loc?.SecondaryLocation || loc?.ThirdLocation || 'Unknown Location'}
                                  </div>
                                );
                              })}
                            </td>
                          )}
                          {selectedLocation && (
                            <td>
                              {item.product?.ItemName || 'Unknown Product'}
                            </td>
                          )}
                          <td>
                            {item.status?.reduce((sum, statusItem) => sum + statusItem.totalStock, 0)}
                          </td>
                          <td>
                            {item.status?.reduce((sum, statusItem) => sum + statusItem.inUse, 0)}
                          </td>
                          <td>
                            {item.status?.reduce((sum, statusItem) => sum + statusItem.reserved, 0)}
                          </td>
                          <td>
                            <Badge bg={
                              item.status?.reduce((sum, statusItem) => sum + statusItem.available, 0) > 0 ? 
                              'success' : 'danger'
                            }>
                              {item.status?.reduce((sum, statusItem) => sum + statusItem.available, 0)}
                            </Badge>
                          </td>
                          <td>
                            {item.status?.[0]?.lastUpdated ? 
                              new Date(item.status[0].lastUpdated).toLocaleString() : 
                              'N/A'}
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