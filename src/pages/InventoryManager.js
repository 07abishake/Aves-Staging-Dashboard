import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Modal, 
  Button, 
  Form, 
  Table, 
  Card, 
  Badge, 
  Spinner, 
  Alert, 
  Offcanvas, 
  InputGroup, 
  FormControl 
} from 'react-bootstrap';

const InventoryManager = () => {
  // State declarations
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showRemoveStock, setShowRemoveStock] = useState(false);
  const [showTransferStock, setShowTransferStock] = useState(false);
  const [showInventoryView, setShowInventoryView] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationStock, setLocationStock] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Refresh triggers
  const [refreshProducts, setRefreshProducts] = useState(false);
  const [refreshInventory, setRefreshInventory] = useState(false);
  const [refreshLocationStock, setRefreshLocationStock] = useState(false);

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

  // Get token
  const token = localStorage.getItem("access_token");
  
  // Helper function to generate unique keys
  const generateUniqueKey = (baseId, suffix = '') => {
    return `${baseId}-${suffix}-${Math.random().toString(36).substr(2, 5)}`;
  };

  // Fetch initial data
  useEffect(() => {
    if (!token) {
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
        setAllLocations(locationsRes.data?.Location || []);
        setError(null);
      } catch (err) {
        setError('Failed to load initial data: ' + (err.response?.data?.message || err.message));
      } finally {
        setIsLoading(false);
        setRefreshProducts(false);
      }
    };
    
    fetchData();
  }, [token, refreshProducts]);

  // Auto-refresh for inventory view
  useEffect(() => {
    if (currentItem && refreshInventory) {
      fetchInventoryByProduct(currentItem._id);
    }
  }, [refreshInventory]);

  // Auto-refresh for location stock view
  useEffect(() => {
    if (selectedLocation && refreshLocationStock) {
      fetchLocationStock(selectedLocation.id);
    }
  }, [refreshLocationStock]);

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

  // Fetch inventory by product
  const fetchInventoryByProduct = async (productId) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(
        `https://api.avessecurity.com/api/inventory/product/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Handle both array and object responses
      if (Array.isArray(data?.data)) {
        setInventory(data.data);
      } else if (data?.data) {
        setInventory([data.data]);
      } else {
        setInventory([]);
      }

      setCurrentItem(products.find(p => p._id === productId));
      setShowInventoryView(true);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch inventory');
      setInventory([]);
    } finally {
      setIsLoading(false);
      setRefreshInventory(false);
    }
  };

  // Fetch stock for a specific location
  const fetchLocationStock = async (locationId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `https://api.avessecurity.com/api/inventory/location/${locationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Handle both array and object responses
      let stockData = [];
      if (Array.isArray(response.data?.data)) {
        stockData = response.data.data;
      } else if (response.data?.data) {
        stockData = [response.data.data];
      }
      
      setLocationStock(stockData);
      const locationDetails = findLocationDetails(locationId);
      setSelectedLocation(locationDetails);
      setShowInventoryView(true);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch location stock');
      setLocationStock([]);
    } finally {
      setIsLoading(false);
      setRefreshLocationStock(false);
    }
  };

  // Find location details by ID
  const findLocationDetails = (locationId) => {
    for (const primary of allLocations) {
      if (primary._id === locationId) {
        return {
          id: primary._id,
          name: primary.PrimaryLocation,
          type: 'PrimaryLocation',
          path: primary.PrimaryLocation
        };
      }

      for (const sub of primary.SubLocation || []) {
        if (sub._id === locationId) {
          return {
            id: sub._id,
            name: sub.PrimarySubLocation,
            type: 'PrimarySubLocation',
            path: `${primary.PrimaryLocation},${sub.PrimarySubLocation}`
          };
        }

        for (const secondary of sub.SecondaryLocation || []) {
          if (secondary._id === locationId) {
            return {
              id: secondary._id,
              name: secondary.SecondaryLocation,
              type: 'SecondaryLocation',
              path: `${primary.PrimaryLocation},${sub.PrimarySubLocation},${secondary.SecondaryLocation}`
            };
          }

          for (const subSecondary of secondary.SecondarySubLocation || []) {
            if (subSecondary._id === locationId) {
              return {
                id: subSecondary._id,
                name: subSecondary.SecondarySubLocation,
                type: 'SecondarySubLocation',
                path: `${primary.PrimaryLocation},${sub.PrimarySubLocation},${secondary.SecondaryLocation},${subSecondary.SecondarySubLocation}`
              };
            }

            for (const third of subSecondary.ThirdLocation || []) {
              if (third._id === locationId) {
                return {
                  id: third._id,
                  name: third.ThirdLocation,
                  type: 'ThirdLocation',
                  path: `${primary.PrimaryLocation},${sub.PrimarySubLocation},${secondary.SecondaryLocation},${subSecondary.SecondarySubLocation},${third.ThirdLocation}`
                };
              }

              if (third.ThirdSubLocation && third._id === locationId) {
                return {
                  id: third._id,
                  name: third.ThirdSubLocation,
                  type: 'ThirdSubLocation',
                  path: `${primary.PrimaryLocation},${sub.PrimarySubLocation},${secondary.SecondaryLocation},${subSecondary.SecondarySubLocation},${third.ThirdLocation},${third.ThirdSubLocation}`
                };
              }
            }
          }
        }
      }
    }
    return null;
  };

  // Handle add stock
  const handleAddStock = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(
        'https://api.avessecurity.com/api/inventory/add-stock',
        addStockForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Stock added successfully');
      setShowAddStock(false);
      setAddStockForm({ productId: '', locationId: '', quantity: 0 });
      
      setRefreshProducts(true);
      setRefreshInventory(true);
      setRefreshLocationStock(true);
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
        'https://api.avessecurity.com/api/inventory/remove-stock',
        removeStockForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Stock removed successfully');
      setShowRemoveStock(false);
      setRemoveStockForm({ productId: '', locationId: '', quantity: 0 });
      
      setRefreshProducts(true);
      setRefreshInventory(true);
      setRefreshLocationStock(true);
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
        'https://api.avessecurity.com/api/inventory/transfer-stock',
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
      
      setRefreshProducts(true);
      setRefreshInventory(true);
      setRefreshLocationStock(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to transfer stock');
    } finally {
      setIsLoading(false);
    }
  };

  // Flatten the location hierarchy for display and search
  const getFlattenedLocations = () => {
    const flattened = [];
    
    allLocations.forEach(primary => {
      flattened.push({
        id: primary._id,
        name: primary.PrimaryLocation,
        type: 'PrimaryLocation',
        path: primary.PrimaryLocation
      });

      primary.SubLocation?.forEach(sub => {
        flattened.push({
          id: sub._id,
          name: sub.PrimarySubLocation,
          type: 'PrimarySubLocation',
          path: `${primary.PrimaryLocation},${sub.PrimarySubLocation}`
        });

        sub.SecondaryLocation?.forEach(secondary => {
          flattened.push({
            id: secondary._id,
            name: secondary.SecondaryLocation,
            type: 'SecondaryLocation',
            path: `${primary.PrimaryLocation},${sub.PrimarySubLocation},${secondary.SecondaryLocation}`
          });

          secondary.SecondarySubLocation?.forEach(subSecondary => {
            flattened.push({
              id: subSecondary._id,
              name: subSecondary.SecondarySubLocation,
              type: 'SecondarySubLocation',
              path: `${primary.PrimaryLocation},${sub.PrimarySubLocation},${secondary.SecondaryLocation},${subSecondary.SecondarySubLocation}`
            });

            subSecondary.ThirdLocation?.forEach(third => {
              flattened.push({
                id: third._id,
                name: third.ThirdLocation || third.ThirdSubLocation,
                type: 'ThirdLocation',
                path: `${primary.PrimaryLocation},${sub.PrimarySubLocation},${secondary.SecondaryLocation},${subSecondary.SecondarySubLocation},${third.ThirdLocation || ''}${third.ThirdSubLocation ? ',' + third.ThirdSubLocation : ''}`
              });
            });
          });
        });
      });
    });

    return flattened.filter(loc => 
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.path.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Render the location hierarchy table
  const renderLocationTable = () => {
    const filteredLocations = getFlattenedLocations();

    if (filteredLocations.length === 0) {
      return <Alert variant="info">No locations found matching your search</Alert>;
    }

    return (
      <Table striped hover className="mb-0">
        <thead>
          <tr>
            <th>Type</th>
            <th>Location Name</th>
            <th>Full Path</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredLocations.map((location, index) => (
            <tr key={generateUniqueKey(location.id, `loc-${index}`)}>
              <td>
                <Badge bg={
                  location.type === 'PrimaryLocation' ? 'primary' : 
                  location.type === 'PrimarySubLocation' ? 'secondary' : 
                  location.type === 'SecondaryLocation' ? 'danger' : 
                  location.type === 'SecondarySubLocation' ? 'warning' :
                  location.type === 'ThirdLocation' ? 'dark' : 'light'
                }>
                  {location.type}
                </Badge>
              </td>
              <td>{location.name}</td>
              <td>{location.path}</td>
              <td>
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={() => fetchLocationStock(location.id)}
                >
                  View Stock
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  // Render the stock view for a selected location
  const renderLocationStock = () => {
    if (isLoading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      );
    }

    if (!Array.isArray(locationStock) || locationStock.length === 0) {
      return <Alert variant="info">No stock found in this location</Alert>;
    }

    return (
      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Type</th>
            <th>Item Code</th>
            <th>Total Stock</th>
            <th>In Use</th>
            <th>Reserved</th>
            <th>Available</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {locationStock.map((item, index) => (
            <tr key={generateUniqueKey(item._id, `stock-${index}`)}>
              <td>
                <strong>{item.product?.ItemName || 'Unknown'}</strong>
                <div className="text-muted small">{item.product?.Description || ''}</div>
              </td>
              <td>{item.product?.Category || 'N/A'}</td>
              <td>{item.product?.Type || 'N/A'}</td>
              <td>{item.product?.ItemCode || 'N/A'}</td>
              <td>{item.status?.[0]?.totalStock || 0}</td>
              <td>{item.status?.[0]?.inUse || 0}</td>
              <td>{item.status?.[0]?.reserved || 0}</td>
              <td>{item.status?.[0]?.available || 0}</td>
              <td>
                {item.status?.[0]?.lastUpdated ? 
                  new Date(item.status[0].lastUpdated).toLocaleString() : 
                  'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  // Render product table
  const renderProductTable = () => {
    if (isLoading && products.length === 0) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      );
    }

    if (products.length === 0) {
      return <Alert variant="info">No products found</Alert>;
    }

    return (
      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Item Code</th>
            <th>Item Name</th>
            <th>Category</th>
            <th>Type</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={generateUniqueKey(product._id, 'product')}>
              <td>{product.ItemCode}</td>
              <td>
                <strong>{product.ItemName}</strong>
              </td>
              <td>{product.Category}</td>
              <td>{product.Type}</td>
              <td className="text-muted small">{product.Description}</td>
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
    );
  };

  // Render product inventory view
  const renderProductInventory = () => {
    if (isLoading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      );
    }

    if (!Array.isArray(inventory) || inventory.length === 0) {
      return <Alert variant="info">No inventory records found for this product</Alert>;
    }

    return (
      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Location</th>
            <th>Total Stock</th>
            <th>In Use</th>
            <th>Reserved</th>
            <th>Available</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {inventory.flatMap((item) => {
            // Handle both array and object status
            const statuses = Array.isArray(item.status) ? item.status : [item.status || {}];
            return statuses.map((status, sIdx) => (
              <tr key={generateUniqueKey(item._id, `status-${sIdx}`)}>
                <td>{findLocationDetails(status?.locationId)?.path || 'Unknown Location'}</td>
                <td>{status?.totalStock || 0}</td>
                <td>{status?.inUse || 0}</td>
                <td>{status?.reserved || 0}</td>
                <td>{status?.available || 0}</td>
                <td>
                  {status?.lastUpdated ? 
                    new Date(status.lastUpdated).toLocaleString() : 
                    'N/A'}
                </td>
              </tr>
            ));
          })}
        </tbody>
      </Table>
    );
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Inventory Management</h2>
        <div className="d-flex gap-2">
          <Button variant="success" onClick={() => setShowAddStock(true)}>
            Add Stock
          </Button>
          <Button variant="secondary" onClick={() => setShowRemoveStock(true)}>
            Remove Stock
          </Button>
          <Button variant="primary" onClick={() => setShowTransferStock(true)}>
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
            renderProductTable()
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">All Locations</h5>
          <InputGroup style={{ width: '300px' }}>
            <FormControl
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
              Clear
            </Button>
          </InputGroup>
        </Card.Header>
        <Card.Body>
          {renderLocationTable()}
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
                  <option key={generateUniqueKey(product._id, 'add-prod')} value={product._id}>
                    {product.ItemName} ({product.ItemCode})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Select
                value={addStockForm.locationId}
                onChange={(e) => setAddStockForm({...addStockForm, locationId: e.target.value})}
                required
              >
                <option value="">Select Location</option>
                {getFlattenedLocations().map(location => (
                  <option key={generateUniqueKey(location.id, 'add-loc')} value={location.id}>
                    {location.path}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
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
                  <option key={generateUniqueKey(product._id, 'rem-prod')} value={product._id}>
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
                {getFlattenedLocations().map(location => (
                  <option key={generateUniqueKey(location.id, 'rem-loc')} value={location.id}>
                    {location.path}
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
                  <option key={generateUniqueKey(product._id, 'trans-prod')} value={product._id}>
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
                {getFlattenedLocations().map(location => (
                  <option key={generateUniqueKey(location.id, 'from-loc')} value={location.id}>
                    {location.path}
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
                {getFlattenedLocations().map(location => (
                  <option key={generateUniqueKey(location.id, 'to-loc')} value={location.id}>
                    {location.path}
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
      <Offcanvas 
        show={showInventoryView} 
        onHide={() => setShowInventoryView(false)} 
        placement="end" 
        style={{ width: '800px' }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            {currentItem ? 'Product Inventory' : 'Location Stock'}
            {currentItem && (
              <span className="ms-2">
                <Badge bg="secondary">{currentItem.ItemCode}</Badge>
              </span>
            )}
            {selectedLocation && (
              <Badge bg="info" className="ms-2">
                {selectedLocation.path}
              </Badge>
            )}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {currentItem ? renderProductInventory() : renderLocationStock()}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default InventoryManager;