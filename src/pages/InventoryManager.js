// import React, { useState, useEffect } from 'react';
// import {
//   Container,
//   Row,
//   Col,
//   Card,
//   Form,
//   Button,
//   Alert,
//   Tabs,
//   Tab,
//   Table,
//   Badge,
//   Modal,
//   Spinner
// } from 'react-bootstrap';
// import { stockAPI, productAPI, organizationAPI } from '../service/api';

// const StockManagement = () => {
//   const [activeTab, setActiveTab] = useState('view');
//   const [products, setProducts] = useState([]);
//   const [locations, setLocations] = useState([]);
//   const [organizations, setOrganizations] = useState([]);
//   const [authorizationRequests, setAuthorizationRequests] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');

//   // NEW: State for detailed views
//   const [locationWiseData, setLocationWiseData] = useState([]);
//   const [organizationWiseData, setOrganizationWiseData] = useState({});
//   const [dashboardData, setDashboardData] = useState(null);
//   const [locationWiseLoading, setLocationWiseLoading] = useState(false);
//   const [orgWiseLoading, setOrgWiseLoading] = useState(false);
//   const [dashboardLoading, setDashboardLoading] = useState(false);

//   useEffect(() => {
//     fetchInitialData();
//   }, []);

//   const fetchInitialData = async () => {
//     try {
//       setLoading(true);
//       await Promise.all([
//         fetchProducts(),
//         fetchLocations(),
//         fetchOrganizations(),
//         fetchAuthorizationRequests()
//       ]);
//     } catch (error) {
//       setError('Failed to load initial data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // NEW: Fetch detailed data when switching to detailed tabs
//   useEffect(() => {
//     if (activeTab === 'location-wise') {
//       fetchLocationWiseData();
//     }
//   }, [activeTab]);

//   const fetchProducts = async () => {
//     try {
//       const response = await productAPI.getAll({ limit: 1000 });
//       setProducts(response.data.data || []);
//     } catch (error) {
//       console.error('Error fetching products:', error);
//       setProducts([]);
//     }
//   };

//   const fetchLocations = async () => {
//     try {
//       const response = await organizationAPI.getLocations();
//       const flattenedLocations = flattenLocations(response.data.Location || []);
//       setLocations(flattenedLocations);
//     } catch (error) {
//       console.error('Error fetching locations:', error);
//       setLocations([]);
//     }
//   };

//   const fetchOrganizations = async () => {
//     try {
//       const response = await organizationAPI.getChildOrgs();
//       setOrganizations(response.data.data || []);
//     } catch (error) {
//       console.error('Error fetching organizations:', error);
//       setOrganizations([]);
//     }
//   };

//   const fetchAuthorizationRequests = async () => {
//     try {
//       const response = await stockAPI.getApprovals();
//       setAuthorizationRequests(response.data.data || []);
//     } catch (error) {
//       console.error('Error fetching authorization requests:', error);
//       setAuthorizationRequests([]);
//     }
//   };

//   // NEW: Fetch location-wise stock data
//   const fetchLocationWiseData = async () => {
//     try {
//       setLocationWiseLoading(true);
//       const response = await productAPI.getLocationWiseStock();
//       setLocationWiseData(response.data.data || []);
//     } catch (error) {
//       console.error('Error fetching location-wise data:', error);
//       setLocationWiseData([]);
//       setError('Failed to load location-wise data');
//     } finally {
//       setLocationWiseLoading(false);
//     }
//   };

//   // NEW: Fetch dashboard data
//   // const fetchDashboardData = async () => {
//   //   try {
//   //     setDashboardLoading(true);
//   //     const response = await productAPI.getStockDashboard();
//   //     setDashboardData(response.data || {});
//   //   } catch (error) {
//   //     console.error('Error fetching dashboard data:', error);
//   //     setDashboardData(null);
//   //     setError('Failed to load dashboard data');
//   //   } finally {
//   //     setDashboardLoading(false);
//   //   }
//   // };

//   const flattenLocations = (locationData) => {
//     const flattened = [];
    
//     if (!Array.isArray(locationData)) return flattened;

//     const processLocation = (location, parentPath = '') => {
//       if (location.PrimaryLocation) {
//         const currentPath = location.PrimaryLocation;
//         flattened.push({
//           _id: location._id,
//           name: location.PrimaryLocation,
//           level: 'primary',
//           parentId: null,
//           fullPath: currentPath
//         });

//         if (Array.isArray(location.SubLocation)) {
//           location.SubLocation.forEach(subLoc => {
//             processSubLocation(subLoc, currentPath, location._id);
//           });
//         }
//       }
//     };

//     const processSubLocation = (subLoc, parentPath, parentId) => {
//       if (subLoc.PrimarySubLocation) {
//         const currentPath = `${parentPath},${subLoc.PrimarySubLocation}`;
//         flattened.push({
//           _id: subLoc._id,
//           name: subLoc.PrimarySubLocation,
//           level: 'primary_sub',
//           parentId: parentId,
//           fullPath: currentPath
//         });

//         if (Array.isArray(subLoc.SecondaryLocation)) {
//           subLoc.SecondaryLocation.forEach(secLoc => {
//             processSecondaryLocation(secLoc, currentPath, subLoc._id);
//           });
//         }
//       }
//     };

//     const processSecondaryLocation = (secLoc, parentPath, parentId) => {
//       if (secLoc.SecondaryLocation) {
//         const currentPath = `${parentPath},${secLoc.SecondaryLocation}`;
//         flattened.push({
//           _id: secLoc._id,
//           name: secLoc.SecondaryLocation,
//           level: 'secondary',
//           parentId: parentId,
//           fullPath: currentPath
//         });

//         if (Array.isArray(secLoc.SecondarySubLocation)) {
//           secLoc.SecondarySubLocation.forEach(secSubLoc => {
//             processSecondarySubLocation(secSubLoc, currentPath, secLoc._id);
//           });
//         }
//       }
//     };

//     const processSecondarySubLocation = (secSubLoc, parentPath, parentId) => {
//       if (secSubLoc.SecondarySubLocation) {
//         const currentPath = `${parentPath},${secSubLoc.SecondarySubLocation}`;
//         flattened.push({
//           _id: secSubLoc._id,
//           name: secSubLoc.SecondarySubLocation,
//           level: 'secondary_sub',
//           parentId: parentId,
//           fullPath: currentPath
//         });

//         if (Array.isArray(secSubLoc.ThirdLocation)) {
//           secSubLoc.ThirdLocation.forEach(thirdLoc => {
//             processThirdLocation(thirdLoc, currentPath, secSubLoc._id);
//           });
//         }
//       }
//     };

//     const processThirdLocation = (thirdLoc, parentPath, parentId) => {
//       if (thirdLoc.ThirdLocation) {
//         const currentPath = `${parentPath},${thirdLoc.ThirdLocation}`;
//         flattened.push({
//           _id: thirdLoc._id,
//           name: thirdLoc.ThirdLocation,
//           level: 'third',
//           parentId: parentId,
//           fullPath: currentPath
//         });

//         if (thirdLoc.ThirdSubLocation) {
//           const finalPath = `${currentPath},${thirdLoc.ThirdSubLocation}`;
//           flattened.push({
//             _id: thirdLoc._id,
//             name: thirdLoc.ThirdSubLocation,
//             level: 'third_sub',
//             parentId: parentId,
//             fullPath: finalPath,
//             isSubLocation: true
//           });
//         }
//       }
//     };

//     locationData.forEach(location => processLocation(location));
//     return flattened;
//   };

//   const handleSuccess = (message) => {
//     setSuccess(message);
//     fetchProducts();
//     fetchAuthorizationRequests();
//     setTimeout(() => setSuccess(''), 5000);
//   };

//   const handleAuthorization = async (requestId, action, notes = '') => {
//     try {
//       const response = await stockAPI.handleApproval(requestId, {
//         action,
//         notes
//       });
      
//       if (response.data.success) {
//         handleSuccess(`Authorization request ${action.toLowerCase()}d successfully!`);
//         fetchAuthorizationRequests();
//       }
//     } catch (error) {
//       setError('Failed to process authorization: ' + (error.response?.data?.message || error.message));
//     }
//   };

//   if (loading) {
//     return (
//       <Container fluid>
//         <div className="text-center py-5">
//           <Spinner animation="border" variant="primary" />
//           <p className="mt-2">Loading...</p>
//         </div>
//       </Container>
//     );
//   }

//   return (
//     <Container fluid>
//       <Row>
//         <Col>
//           <Card className="shadow">
//             <Card.Header className="d-flex justify-content-between align-items-center">
//               <h4 className="mb-0">Stock Management</h4>
//               <Button
//                 variant="primary"
//                 onClick={() => setActiveTab('add')}
//               >
//                 Add Stock
//               </Button>
//             </Card.Header>
//             <Card.Body>
//               {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
//               {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
              
//               <Tabs
//                 activeKey={activeTab}
//                 onSelect={(tab) => setActiveTab(tab)}
//                 className="mb-3"
//               >
//                 <Tab eventKey="view" title="View Stock">
//                   <StockView 
//                     products={products}
//                     locations={locations}
//                     getStockLevelVariant={getStockLevelVariant}
//                   />
//                 </Tab>
//                 <Tab eventKey="location-wise" title="Location Wise">
//                   <LocationWiseView 
//                     data={locationWiseData}
//                     locations={locations}
//                     loading={locationWiseLoading}
//                   />
//                 </Tab>
//                 {/* <Tab eventKey="dashboard" title="📈 Dashboard">
//                   <StockDashboard 
//                     data={dashboardData}
//                     loading={dashboardLoading}
//                   />
//                 </Tab> */}
//                 <Tab eventKey="add" title="Add Stock">
//                   <AddStock 
//                     products={products || []}
//                     locations={locations}
//                     onSuccess={() => handleSuccess('Stock added successfully!')}
//                     onError={setError}
//                   />
//                 </Tab>
//                 <Tab eventKey="remove" title="Remove Stock">
//                   <RemoveStock 
//                     products={products || []}
//                     locations={locations}
//                     onSuccess={() => handleSuccess('Stock removed successfully!')}
//                     onError={setError}
//                   />
//                 </Tab>
//                 <Tab eventKey="transfer" title="Transfer Stock">
//                   <TransferStock 
//                     products={products || []}
//                     locations={locations}
//                     organizations={organizations}
//                     onSuccess={() => handleSuccess('Stock transfer initiated!')}
//                     onError={setError}
//                   />
//                 </Tab>
//                 <Tab eventKey="approvals" title="Pending Approvals">
//                   <ApprovalList 
//                     requests={authorizationRequests}
//                     onAuthorization={handleAuthorization}
//                   />
//                 </Tab>
//               </Tabs>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>
//     </Container>
//   );
// };

// // Helper function for stock level variants
// const getStockLevelVariant = (product) => {
//   if (product.currentQuantity <= product.minimumStock) return 'danger';
//   if (product.currentQuantity <= product.minimumStock * 2) return 'warning';
//   return 'success';
// };

// // NEW: Location Wise View Component
// const LocationWiseView = ({ data = [], locations = [], loading = false }) => {
//   const [selectedLocation, setSelectedLocation] = useState('');
//   const [expandedProducts, setExpandedProducts] = useState(new Set());

//   const toggleProductExpansion = (productId) => {
//     const newExpanded = new Set(expandedProducts);
//     if (newExpanded.has(productId)) {
//       newExpanded.delete(productId);
//     } else {
//       newExpanded.add(productId);
//     }
//     setExpandedProducts(newExpanded);
//   };

//   const filteredData = selectedLocation 
//     ? data.filter(product => 
//         product.locationStock.some(stock => stock.locationId === selectedLocation)
//       )
//     : data;

//   if (loading) {
//     return (
//       <div className="text-center py-5">
//         <Spinner animation="border" variant="primary" />
//         <p className="mt-2">Loading location-wise data...</p>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <Card className="mb-3">
//         <Card.Body>
//           <Row>
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>Filter by Location</Form.Label>
//                 <Form.Select
//                   value={selectedLocation}
//                   onChange={(e) => setSelectedLocation(e.target.value)}
//                 >
//                   <option value="">All Locations</option>
//                   {locations.map(location => (
//                     <option key={location._id} value={location._id}>
//                       {location.fullPath}
//                     </option>
//                   ))}
//                 </Form.Select>
//               </Form.Group>
//             </Col>
//             <Col md={6} className="d-flex align-items-end">
//               <Badge bg="primary" className="fs-6 me-2">
//                 Products: {filteredData.length}
//               </Badge>
//               <Badge bg="success" className="fs-6">
//                 Total Stock: {filteredData.reduce((sum, p) => sum + p.totalStock, 0)}
//               </Badge>
//             </Col>
//           </Row>
//         </Card.Body>
//       </Card>

//       {filteredData.map(product => (
//         <Card key={product.id} className="mb-3">
//           <Card.Header 
//             className="d-flex justify-content-between align-items-center cursor-pointer"
//             onClick={() => toggleProductExpansion(product.id)}
//             style={{ cursor: 'pointer' }}
//           >
//             <div>
//               <h5 className="mb-0">{product.name} - {product.brand}</h5>
//               <small className="text-muted">{product.category} • {product.assignmentType}</small>
//             </div>
//             <div className="d-flex align-items-center gap-3">
//               <Badge bg={product.needsRestock ? 'danger' : 'success'}>
//                 Main Stock: {product.mainStock}
//               </Badge>
//               <Badge bg="info">
//                 Location Stock: {product.totalLocationStock}
//               </Badge>
//               <Badge bg="primary">
//                 Total: {product.totalStock}
//               </Badge>
//               <Button variant="outline-primary" size="sm">
//                 {expandedProducts.has(product.id) ? '▲' : '▼'}
//               </Button>
//             </div>
//           </Card.Header>
          
//           {expandedProducts.has(product.id) && (
//             <Card.Body>
//               <h6>Location-wise Stock Details:</h6>
//               <div className="table-responsive">
//                 <Table striped bordered size="sm">
//                   <thead>
//                     <tr>
//                       <th>Location</th>
//                       <th>Level</th>
//                       <th>Quantity</th>
//                       {/* <th>Status</th> */}
//                       <th>Stock Updated</th>
//                       <th>Reason</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {product.locationStock.map((stock, index) => (
//                       <tr key={index}>
//                         <td>
//                           <strong>{stock.locationName}</strong>
//                           <br />
//                           <small className="text-muted">{stock.locationFullPath}</small>
//                         </td>
//                         <td>
//                           <Badge bg={
//                             stock.locationLevel === 'primary' ? 'primary' :
//                             stock.locationLevel === 'primary_sub' ? 'success' :
//                             stock.locationLevel === 'secondary' ? 'info' :
//                             stock.locationLevel === 'secondary_sub' ? 'warning' :
//                             stock.locationLevel === 'third' ? 'secondary' : 'dark'
//                           }>
//                             {stock.locationLevel}
//                           </Badge>
//                         </td>
//                         <td>
//                           <Badge bg={stock.needsRestock ? 'danger' : 'success'}>
//                             {stock.quantity}
//                           </Badge>
//                         </td>
//                         {/* <td>
//                           <Badge bg={stock.status === 'COMPLETED' ? 'success' : 'warning'}>
//                             {stock.status}
//                           </Badge>
//                         </td> */}
//                         <td>
//                           {new Date(stock.lastUpdated).toLocaleDateString()}
//                           <br />
//                           <small className="text-muted">
//                             {new Date(stock.lastUpdated).toLocaleTimeString()}
//                           </small>
//                         </td>
//                         <td>{stock.reason}</td>
//                       </tr>
//                     ))}
//                     {product.locationStock.length === 0 && (
//                       <tr>
//                         <td colSpan="6" className="text-center text-muted py-3">
//                           No stock allocated to locations
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </Table>
//               </div>
              
//               {/* Summary */}
//               <div className="d-flex gap-2 mt-3">
//                 <Badge bg="light" text="dark">
//                   Locations: {product.locationSummary?.totalLocations || 0}
//                 </Badge>
//                 <Badge bg="light" text="dark">
//                   With Stock: {product.locationSummary?.locationsWithStock || 0}
//                 </Badge>
//                 <Badge bg="light" text="dark">
//                   Need Restock: {product.locationSummary?.locationsNeedingRestock || 0}
//                 </Badge>
//               </div>
//             </Card.Body>
//           )}
//         </Card>
//       ))}

//       {filteredData.length === 0 && !loading && (
//         <Alert variant="info" className="text-center">
//           <h5>No products found</h5>
//           <p>No products match the current filter criteria.</p>
//         </Alert>
//       )}
//     </div>
//   );
// };

// // NEW: Organization Wise View Component
// const OrganizationWiseView = ({ data = {}, products = [], organizations = [], loading = false, onProductChange }) => {
//   const [selectedProduct, setSelectedProduct] = useState('');

//   const handleProductChange = async (productId) => {
//     setSelectedProduct(productId);
//     // You can implement fetching data for the selected product here
//   };

//   if (loading) {
//     return (
//       <div className="text-center py-5">
//         <Spinner animation="border" variant="primary" />
//         <p className="mt-2">Loading organization-wise data...</p>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <Card className="mb-3">
//         <Card.Body>
//           <Row>
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>Select Product</Form.Label>
//                 <Form.Select
//                   value={selectedProduct}
//                   onChange={(e) => handleProductChange(e.target.value)}
//                 >
//                   <option value="">Select a Product</option>
//                   {products.map(product => (
//                     <option key={product._id} value={product._id}>
//                       {product.name} - {product.brand}
//                     </option>
//                   ))}
//                 </Form.Select>
//               </Form.Group>
//             </Col>
//             <Col md={6} className="d-flex align-items-end">
//               <Badge bg="info" className="fs-6">
//                 Organizations: {data.organizationStock?.length || 0}
//               </Badge>
//             </Col>
//           </Row>
//         </Card.Body>
//       </Card>

//       {data.organizationStock && data.organizationStock.length > 0 ? (
//         <Card>
//           <Card.Header>
//             <h5 className="mb-0">Organization-wise Stock Distribution</h5>
//           </Card.Header>
//           <Card.Body>
//             <div className="table-responsive">
//               <Table striped hover>
//                 <thead>
//                   <tr>
//                     <th>Organization</th>
//                     <th>Stock Quantity</th>
//                     <th>Access Level</th>
//                     <th>Relationship</th>
//                     <th>Shared Date</th>
//                     <th>Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {data.organizationStock.map((orgStock, index) => (
//                     <tr key={index}>
//                       <td>
//                         <strong>{orgStock.organizationName}</strong>
//                         <br />
//                         <small className="text-muted">{orgStock.organizationId}</small>
//                       </td>
//                       <td>
//                         <Badge bg="primary">{orgStock.quantity || 'N/A'}</Badge>
//                       </td>
//                       <td>
//                         <Badge bg={
//                           orgStock.accessLevel === 'FULL_ACCESS' ? 'success' :
//                           orgStock.accessLevel === 'READ_ONLY' ? 'info' :
//                           orgStock.accessLevel === 'REQUEST_ACCESS' ? 'warning' : 'secondary'
//                         }>
//                           {orgStock.accessLevel || 'N/A'}
//                         </Badge>
//                       </td>
//                       <td>{orgStock.relationship || 'N/A'}</td>
//                       <td>
//                         {orgStock.sharedAt ? new Date(orgStock.sharedAt).toLocaleDateString() : 'N/A'}
//                       </td>
//                       <td>
//                         <Badge bg={orgStock.isActive ? 'success' : 'secondary'}>
//                           {orgStock.isActive ? 'Active' : 'Inactive'}
//                         </Badge>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </Table>
//             </div>
//           </Card.Body>
//         </Card>
//       ) : (
//         <Alert variant="info" className="text-center">
//           <h5>No organization-wise data available</h5>
//           <p>Select a product to view organization-wise stock distribution.</p>
//         </Alert>
//       )}

//       {data.sharingSettings && (
//         <Card className="mt-3">
//           <Card.Header>
//             <h6 className="mb-0">Sharing Settings</h6>
//           </Card.Header>
//           <Card.Body>
//             <Row>
//               <Col md={6}>
//                 <p><strong>Allow Requests:</strong> {data.sharingSettings.allowRequests ? 'Yes' : 'No'}</p>
//                 <p><strong>Share with All Children:</strong> {data.sharingSettings.shareWithAllChildren ? 'Yes' : 'No'}</p>
//               </Col>
//               <Col md={6}>
//                 <p><strong>Total Shared:</strong> {data.sharingSettings.sharedWith?.length || 0} organizations</p>
//                 <p><strong>Is Shared:</strong> {data.sharingSettings.isShared ? 'Yes' : 'No'}</p>
//               </Col>
//             </Row>
//           </Card.Body>
//         </Card>
//       )}
//     </div>
//   );
// };

// // NEW: Stock Dashboard Component
// const StockDashboard = ({ data = {}, loading = false }) => {
//   if (loading) {
//     return (
//       <div className="text-center py-5">
//         <Spinner animation="border" variant="primary" />
//         <p className="mt-2">Loading dashboard data...</p>
//       </div>
//     );
//   }

//   if (!data) {
//     return (
//       <Alert variant="info" className="text-center">
//         <h5>No Dashboard Data</h5>
//         <p>Dashboard data is not available at the moment.</p>
//       </Alert>
//     );
//   }

//   const summary = data.summary || {};
//   const topProducts = data.topProducts || [];

//   return (
//     <div>
//       <Row className="mb-4">
//         <Col md={3}>
//           <Card className="text-center border-primary">
//             <Card.Body>
//               <Card.Title className="text-primary">Total Products</Card.Title>
//               <h2 className="text-primary">{summary.totalProducts || 0}</h2>
//               <small className="text-muted">Active products in system</small>
//             </Card.Body>
//           </Card>
//         </Col>
//         <Col md={3}>
//           <Card className="text-center border-success">
//             <Card.Body>
//               <Card.Title className="text-success">Total Main Stock</Card.Title>
//               <h2 className="text-success">{summary.totalMainStock || 0}</h2>
//               <small className="text-muted">Units in main inventory</small>
//             </Card.Body>
//           </Card>
//         </Col>
//         <Col md={3}>
//           <Card className="text-center border-info">
//             <Card.Body>
//               <Card.Title className="text-info">Total Location Stock</Card.Title>
//               <h2 className="text-info">{summary.totalLocationStock || 0}</h2>
//               <small className="text-muted">Units across all locations</small>
//             </Card.Body>
//           </Card>
//         </Col>
//         <Col md={3}>
//           <Card className="text-center border-warning">
//             <Card.Body>
//               <Card.Title className="text-warning">Low Stock Products</Card.Title>
//               <h2 className="text-warning">{summary.lowStockProducts || 0}</h2>
//               <small className="text-muted">Need restocking</small>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       <Row className="mb-4">
//         <Col md={4}>
//           <Card className="text-center">
//             <Card.Body>
//               <Card.Title>Total Overall Stock</Card.Title>
//               <h3 className="text-primary">{summary.totalOverallStock || 0}</h3>
//               <small className="text-muted">Main + Location Stock</small>
//             </Card.Body>
//           </Card>
//         </Col>
//         <Col md={4}>
//           <Card className="text-center">
//             <Card.Body>
//               <Card.Title>Products with Location Stock</Card.Title>
//               <h3 className="text-success">{summary.productsWithLocationStock || 0}</h3>
//               <small className="text-muted">Distributed products</small>
//             </Card.Body>
//           </Card>
//         </Col>
//         <Col md={4}>
//           <Card className="text-center">
//             <Card.Body>
//               <Card.Title>Stock Health</Card.Title>
//               <h3 className={
//                 summary.lowStockProducts > 0 ? 'text-danger' : 'text-success'
//               }>
//                 {summary.lowStockProducts > 0 ? 'Needs Attention' : 'Healthy'}
//               </h3>
//               <small className="text-muted">Inventory status</small>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       {topProducts.length > 0 && (
//         <Card>
//           <Card.Header>
//             <h5 className="mb-0">📦 Top Products by Stock</h5>
//           </Card.Header>
//           <Card.Body>
//             <div className="table-responsive">
//               <Table striped hover>
//                 <thead className="">
//                   <tr>
//                     <th>#</th>
//                     <th>Product</th>
//                     <th>Brand</th>
//                     <th>Main Stock</th>
//                     <th>Location Stock</th>
//                     <th>Total Stock</th>
//                     <th>Min Stock</th>
//                     <th>Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {topProducts.map((product, index) => (
//                     <tr key={index}>
//                       <td>{index + 1}</td>
//                       <td>
//                         <strong>{product.name}</strong>
//                         <br />
//                         <small className="text-muted">{product.category}</small>
//                       </td>
//                       <td>{product.brand}</td>
//                       <td>
//                         <Badge bg="outline-primary">{product.mainStock}</Badge>
//                       </td>
//                       <td>
//                         <Badge bg="outline-info">{product.totalLocationStock}</Badge>
//                       </td>
//                       <td>
//                         <Badge bg="primary">{product.totalStock}</Badge>
//                       </td>
//                       <td>{product.minimumStock}</td>
//                       <td>
//                         <Badge bg={product.needsRestock ? 'danger' : 'success'}>
//                           {product.needsRestock ? 'Low Stock' : 'Good'}
//                         </Badge>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </Table>
//             </div>
//           </Card.Body>
//         </Card>
//       )}

//       {data.recentActivity && data.recentActivity.length > 0 && (
//         <Card className="mt-4">
//           <Card.Header>
//             <h5 className="mb-0">🕒 Recent Stock Activity</h5>
//           </Card.Header>
//           <Card.Body>
//             <div className="table-responsive">
//               <Table striped hover size="sm">
//                 <thead>
//                   <tr>
//                     <th>Date</th>
//                     <th>Product</th>
//                     <th>Activity</th>
//                     <th>Location</th>
//                     <th>Quantity</th>
//                     <th>User</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {data.recentActivity.slice(0, 10).map((activity, index) => (
//                     <tr key={index}>
//                       <td>{new Date(activity.date).toLocaleDateString()}</td>
//                       <td>{activity.productName}</td>
//                       <td>
//                         <Badge bg={
//                           activity.type === 'ADD' ? 'success' :
//                           activity.type === 'REMOVE' ? 'danger' :
//                           activity.type === 'TRANSFER' ? 'info' : 'secondary'
//                         }>
//                           {activity.type}
//                         </Badge>
//                       </td>
//                       <td>{activity.location || 'Main Stock'}</td>
//                       <td>{activity.quantity}</td>
//                       <td>{activity.user || 'System'}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </Table>
//             </div>
//           </Card.Body>
//         </Card>
//       )}
//     </div>
//   );
// };

// // Stock View Component
// const StockView = ({ products = [], locations = [], getStockLevelVariant }) => {
//   const [filter, setFilter] = useState({
//     category: '',
//     assignmentType: ''
//   });

//   const filteredProducts = products.filter(product => {
//     const matchesCategory = !filter.category || product.category === filter.category;
//     const matchesAssignment = !filter.assignmentType || product.assignmentType === filter.assignmentType;
//     return matchesCategory && matchesAssignment;
//   });

//   const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
//   const assignmentTypes = [...new Set(products.map(p => p.assignmentType).filter(Boolean))];

//   return (
//     <div>
//       <Card className="mb-3">
//         <Card.Body>
//           <Row>
//             <Col md={4}>
//               <Form.Group>
//                 <Form.Label>Category</Form.Label>
//                 <Form.Select
//                   value={filter.category}
//                   onChange={(e) => setFilter({ ...filter, category: e.target.value })}
//                 >
//                   <option value="">All Categories</option>
//                   {categories.map(cat => (
//                     <option key={cat} value={cat}>{cat}</option>
//                   ))}
//                 </Form.Select>
//               </Form.Group>
//             </Col>
//             <Col md={4}>
//               <Form.Group>
//                 <Form.Label>Assignment Type</Form.Label>
//                 <Form.Select
//                   value={filter.assignmentType}
//                   onChange={(e) => setFilter({ ...filter, assignmentType: e.target.value })}
//                 >
//                   <option value="">All Types</option>
//                   {assignmentTypes.map(type => (
//                     <option key={type} value={type}>{type}</option>
//                   ))}
//                 </Form.Select>
//               </Form.Group>
//             </Col>
//             <Col md={4} className="d-flex align-items-end">
//               <Badge bg="primary" className="fs-6">
//                 Total: {filteredProducts.length} products
//               </Badge>
//             </Col>
//           </Row>
//         </Card.Body>
//       </Card>

//       <div className="table-responsive">
//         <Table striped >
//           <thead className="">
//             <tr>
//               <th>Product</th>
//               <th>Category</th>
//               <th>Current Stock</th>
//               <th>Min Stock</th>
//               <th>Assignment</th>
//               <th>Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredProducts.map(product => (
//               <tr key={product._id}>
//                 <td>
//                   <div>
//                     <strong>{product.name}</strong>
//                     <br />
//                     <small className="text-muted">{product.brand}</small>
//                   </div>
//                 </td>
//                 <td>{product.category}</td>
//                 <td>
//                   <Badge bg={getStockLevelVariant(product)}>
//                     {product.currentQuantity}
//                   </Badge>
//                 </td>
//                 <td>{product.minimumStock}</td>
//                 <td>
//                   <Badge 
//                     bg={
//                       product.assignmentType === 'Authorized Inventory' ? 'warning' :
//                       product.assignmentType === 'First Aid Kit' ? 'info' :
//                       product.assignmentType === 'Regular' ? 'success' : 'secondary'
//                     }
//                   >
//                     {product.assignmentType || 'Unassigned'}
//                   </Badge>
//                 </td>
//                 <td>
//                   <Badge bg={product.isActive ? 'success' : 'danger'}>
//                     {product.isActive ? 'Active' : 'Inactive'}
//                   </Badge>
//                 </td>
//               </tr>
//             ))}
//             {filteredProducts.length === 0 && (
//               <tr>
//                 <td colSpan="6" className="text-center text-muted py-4">
//                   No products found
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </Table>
//       </div>
//     </div>
//   );
// };

// // Add Stock Component
// const AddStock = ({ products = [], locations = [], onSuccess, onError }) => {
//   const [formData, setFormData] = useState({
//     productId: '',
//     quantity: 1,
//     destinationLocation: '',
//     reason: 'Stock addition'
//   });
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     onError('');

//     try {
//       const response = await stockAPI.add(formData);
      
//       if (response.data.success) {
//         onSuccess();
//         setFormData({
//           productId: '',
//           quantity: 1,
//           destinationLocation: '',
//           reason: 'Stock addition'
//         });
//       }
//     } catch (error) {
//       onError(error.response?.data?.message || 'Failed to add stock');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Form onSubmit={handleSubmit}>
//       <Row>
//         <Col md={6}>
//           <Form.Group className="mb-3">
//             <Form.Label>Product *</Form.Label>
//             <Form.Select
//               value={formData.productId}
//               onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
//               required
//             >
//               <option value="">Select Product</option>
//               {products.map(product => (
//                 <option key={product._id} value={product._id}>
//                   {product.name} - {product.brand} (Stock: {product.currentQuantity})
//                 </option>
//               ))}
//             </Form.Select>
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Quantity *</Form.Label>
//             <Form.Control
//               type="number"
//               min="1"
//               value={formData.quantity}
//               onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
//               required
//             />
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Destination Location *</Form.Label>
//             <Form.Select
//               value={formData.destinationLocation}
//               onChange={(e) => setFormData({ ...formData, destinationLocation: e.target.value })}
//               required
//             >
//               <option value="">Select Destination</option>
//               {locations.map(location => (
//                 <option key={location._id} value={location._id}>
//                   {location.fullPath || location.name}
//                 </option>
//               ))}
//             </Form.Select>
//             <Form.Text className="text-muted">
//               Select the destination location from the dropdown
//             </Form.Text>
//           </Form.Group>
//         </Col>

//         <Col md={6}>
//           <Form.Group className="mb-3">
//             <Form.Label>Reason *</Form.Label>
//             <Form.Control
//               as="textarea"
//               rows={4}
//               value={formData.reason}
//               onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
//               placeholder="Reason for adding stock"
//               required
//             />
//           </Form.Group>
//         </Col>
//       </Row>

//       <div className="d-grid">
//         <Button 
//           variant="success" 
//           type="submit" 
//           disabled={loading}
//           size="lg"
//         >
//           {loading ? (
//             <>
//               <Spinner animation="border" size="sm" className="me-2" />
//               Adding Stock...
//             </>
//           ) : (
//             'Add Stock'
//           )}
//         </Button>
//       </div>
//     </Form>
//   );
// };

// // Remove Stock Component
// const RemoveStock = ({ products = [], locations = [], onSuccess, onError }) => {
//   const [formData, setFormData] = useState({
//     productId: '',
//     quantity: 1,
//     sourceLocation: '',
//     reason: 'Stock removal'
//   });
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     onError('');

//     try {
//       const response = await stockAPI.remove(formData);
      
//       if (response.data.success) {
//         onSuccess();
//         setFormData({
//           productId: '',
//           quantity: 1,
//           sourceLocation: '',
//           reason: 'Stock removal'
//         });
//       }
//     } catch (error) {
//       onError(error.response?.data?.message || 'Failed to remove stock');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Form onSubmit={handleSubmit}>
//       <Row>
//         <Col md={6}>
//           <Form.Group className="mb-3">
//             <Form.Label>Product *</Form.Label>
//             <Form.Select
//               value={formData.productId}
//               onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
//               required
//             >
//               <option value="">Select Product</option>
//               {products.map(product => (
//                 <option key={product._id} value={product._id}>
//                   {product.name} - {product.brand}
//                 </option>
//               ))}
//             </Form.Select>
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Source Location *</Form.Label>
//             <Form.Select
//               value={formData.sourceLocation}
//               onChange={(e) => setFormData({ ...formData, sourceLocation: e.target.value })}
//               required
//             >
//               <option value="">Select Source Location</option>
//               {locations.map(location => (
//                 <option key={location._id} value={location._id}>
//                   {location.fullPath || location.name}
//                 </option>
//               ))}
//             </Form.Select>
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Quantity *</Form.Label>
//             <Form.Control
//               type="number"
//               min="1"
//               value={formData.quantity}
//               onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
//               required
//             />
//           </Form.Group>
//         </Col>

//         <Col md={6}>
//           <Form.Group className="mb-3">
//             <Form.Label>Reason *</Form.Label>
//             <Form.Control
//               as="textarea"
//               rows={4}
//               value={formData.reason}
//               onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
//               required
//               placeholder="Reason for removing stock (e.g., Damaged, Used, Expired, etc.)"
//             />
//           </Form.Group>
//         </Col>
//       </Row>

//       <div className="d-grid">
//         <Button 
//           variant="warning" 
//           type="submit" 
//           disabled={loading}
//           size="lg"
//         >
//           {loading ? (
//             <>
//               <Spinner animation="border" size="sm" className="me-2" />
//               Removing Stock...
//             </>
//           ) : (
//             'Remove Stock'
//           )}
//         </Button>
//       </div>
//     </Form>
//   );
// };

// // Transfer Stock Component
// const TransferStock = ({ products = [], locations = [], organizations = [], onSuccess, onError }) => {
//   const [formData, setFormData] = useState({
//     productId: '',
//     quantity: 1,
//     sourceLocation: '',
//     destinationLocation: '',
//     destinationOrganization: '',
//     reason: 'Stock transfer'
//   });
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     onError('');

//     try {
//       let response;
//       if (formData.destinationOrganization) {
//         // Cross-organization transfer
//         response = await stockAPI.transferToOtherOrganization(formData);
//       } else {
//         // Same organization transfer
//         response = await stockAPI.transfer(formData);
//       }
      
//       if (response.data.success) {
//         onSuccess();
//         setFormData({
//           productId: '',
//           quantity: 1,
//           sourceLocation: '',
//           destinationLocation: '',
//           destinationOrganization: '',
//           reason: 'Stock transfer'
//         });
//       }
//     } catch (error) {
//       onError(error.response?.data?.message || 'Failed to transfer stock');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const isCrossOrgTransfer = !!formData.destinationOrganization;

//   return (
//     <Form onSubmit={handleSubmit}>
//       <Row>
//         <Col md={6}>
//           <Form.Group className="mb-3">
//             <Form.Label>Product *</Form.Label>
//             <Form.Select
//               value={formData.productId}
//               onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
//               required
//             >
//               <option value="">Select Product</option>
//               {products.map(product => (
//                 <option key={product._id} value={product._id}>
//                   {product.name} - {product.brand}
//                 </option>
//               ))}
//             </Form.Select>
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Source Location *</Form.Label>
//             <Form.Select
//               value={formData.sourceLocation}
//               onChange={(e) => setFormData({ ...formData, sourceLocation: e.target.value })}
//               required
//             >
//               <option value="">Select Source Location</option>
//               {locations.map(location => (
//                 <option key={location._id} value={location._id}>
//                   {location.fullPath || location.name}
//                 </option>
//               ))}
//             </Form.Select>
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Quantity *</Form.Label>
//             <Form.Control
//               type="number"
//               min="1"
//               value={formData.quantity}
//               onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
//               required
//             />
//           </Form.Group>
//         </Col>

//         <Col md={6}>
//           <Form.Group className="mb-3">
//             <Form.Label>Destination Organization</Form.Label>
//             <Form.Select
//               value={formData.destinationOrganization}
//               onChange={(e) => setFormData({ ...formData, destinationOrganization: e.target.value })}
//             >
//               <option value="">Select Organization</option>
//               {organizations.map(org => (
//                 <option key={org._id} value={org._id}>
//                   {org.name} ({org.domain})
//                 </option>
//               ))}
//             </Form.Select>
//             <Form.Text className="text-muted">
//               {isCrossOrgTransfer ? 
//                 "🔄 Cross-organization transfer requires approval" : 
//                 "organization transfer is immediate"
//               }
//             </Form.Text>
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Destination Location *</Form.Label>
//             <Form.Select
//               value={formData.destinationLocation}
//               onChange={(e) => setFormData({ ...formData, destinationLocation: e.target.value })}
//               required
//             >
//               <option value="">Select Destination Location</option>
//               {locations.map(location => (
//                 <option key={location._id} value={location._id}>
//                   {location.fullPath || location.name}
//                 </option>
//               ))}
//             </Form.Select>
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Reason</Form.Label>
//             <Form.Control
//               as="textarea"
//               rows={3}
//               value={formData.reason}
//               onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
//               placeholder="Reason for transferring stock"
//             />
//           </Form.Group>
//         </Col>
//       </Row>

//       {isCrossOrgTransfer && (
//         <Alert variant="warning" className="mb-3">
//           ⚠️ This cross-organization transfer will require approval from the parent organization.
//         </Alert>
//       )}

//       <div className="d-grid">
//         <Button 
//           variant="info" 
//           type="submit" 
//           disabled={loading}
//           size="lg"
//         >
//           {loading ? (
//             <>
//               <Spinner animation="border" size="sm" className="me-2" />
//               Processing Transfer...
//             </>
//           ) : (
//             'Transfer Stock'
//           )}
//         </Button>
//       </div>
//     </Form>
//   );
// };

// // Approval List Component
// const ApprovalList = ({ requests, onAuthorization }) => {
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [actionData, setActionData] = useState({ action: '', notes: '' });

//   const pendingRequests = requests.filter(req => req.status === 'pending');

//   const handleAction = async () => {
//     if (!selectedRequest || !actionData.action) return;

//     await onAuthorization(selectedRequest._id, actionData.action, actionData.notes);
//     setSelectedRequest(null);
//     setActionData({ action: '', notes: '' });
//   };

//   const getTypeVariant = (type) => {
//     switch (type) {
//       case 'product_assignment': return 'info';
//       case 'stock_transfer': return 'warning';
//       case 'product_request': return 'primary';
//       default: return 'secondary';
//     }
//   };

//   return (
//     <div>
//       <Card>
//         <Card.Header className="d-flex justify-content-between align-items-center">
//           <h4 className="mb-0">Pending Stock Approvals</h4>
//           <Badge bg="primary">{pendingRequests.length} requests</Badge>
//         </Card.Header>
//         <Card.Body>
//           {pendingRequests.length === 0 ? (
//             <Alert variant="info" className="text-center">
//               <h5>No pending approvals</h5>
//               <p>All stock requests have been processed.</p>
//             </Alert>
//           ) : (
//             <div className="table-responsive">
//               <Table striped hover>
//                 <thead className="table-dark">
//                   <tr>
//                     <th>Type</th>
//                     <th>Product</th>
//                     <th>Quantity</th>
//                     <th>Source</th>
//                     <th>Destination</th>
//                     <th>Requested By</th>
//                     <th>Date</th>
//                     <th>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {pendingRequests.map(request => (
//                     <tr key={request._id}>
//                       <td>
//                         <Badge bg={getTypeVariant(request.type)}>
//                           {request.type?.replace(/_/g, ' ')}
//                         </Badge>
//                       </td>
//                       <td>
//                         <strong>{request.product?.name}</strong>
//                         <br />
//                         <small className="text-muted">{request.product?.brand}</small>
//                       </td>
//                       <td>
//                         <strong>{request.quantity}</strong>
//                       </td>
//                       <td>
//                         {request.sourceLocation?.PrimaryLocation || 'Main Stock'}
//                       </td>
//                       <td>
//                         {request.destinationLocation?.PrimaryLocation || 'Main Stock'}
//                         {request.targetOrganization && (
//                           <div>
//                             <small className="text-muted">
//                               Org: {request.targetOrganization.companyName}
//                             </small>
//                           </div>
//                         )}
//                       </td>
//                       <td>
//                         {request.requestedBy?.name}
//                         <br />
//                         <small className="text-muted">
//                           {request.requestedBy?.email}
//                         </small>
//                       </td>
//                       <td>
//                         {new Date(request.createdAt).toLocaleDateString()}
//                         <br />
//                         <small className="text-muted">
//                           {new Date(request.createdAt).toLocaleTimeString()}
//                         </small>
//                       </td>
//                       <td>
//                         <div className="d-flex gap-1">
//                           <Button
//                             variant="outline-primary"
//                             size="sm"
//                             onClick={() => setSelectedRequest(request)}
//                           >
//                             Review
//                           </Button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </Table>
//             </div>
//           )}
//         </Card.Body>
//       </Card>

//       {/* Action Modal */}
//       <Modal show={!!selectedRequest} onHide={() => setSelectedRequest(null)}>
//         <Modal.Header closeButton>
//           <Modal.Title>
//             Review Authorization Request
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {selectedRequest && (
//             <div className="mb-3">
//               <p><strong>Product:</strong> {selectedRequest.product?.name}</p>
//               <p><strong>Type:</strong> {selectedRequest.type}</p>
//               <p><strong>Quantity:</strong> {selectedRequest.quantity}</p>
//               <p><strong>Requested By:</strong> {selectedRequest.requestedBy?.name}</p>
//               <p><strong>Date:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</p>
//             </div>
//           )}
          
//           <Form.Group className="mb-3">
//             <Form.Label>Action *</Form.Label>
//             <Form.Select
//               value={actionData.action}
//               onChange={(e) => setActionData({ ...actionData, action: e.target.value })}
//               required
//             >
//               <option value="">Select Action</option>
//               <option value="APPROVE">Approve</option>
//               <option value="REJECT">Reject</option>
//             </Form.Select>
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>
//               {actionData.action === 'APPROVE' ? 'Approval Notes' : 'Rejection Reason'} *
//             </Form.Label>
//             <Form.Control
//               as="textarea"
//               rows={3}
//               value={actionData.notes}
//               onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
//               placeholder={
//                 actionData.action === 'APPROVE' 
//                   ? 'Add any notes for this approval...' 
//                   : 'Explain why this request is being rejected...'
//               }
//               required
//             />
//           </Form.Group>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setSelectedRequest(null)}>
//             Cancel
//           </Button>
//           <Button 
//             variant={actionData.action === 'APPROVE' ? 'success' : 'danger'}
//             onClick={handleAction}
//             disabled={!actionData.action || !actionData.notes}
//           >
//             {actionData.action === 'APPROVE' ? 'Approve' : 'Reject'} Request
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </div>
//   );
// };

// export default StockManagement;
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
  Spinner
} from 'react-bootstrap';
import { stockAPI, productAPI, organizationAPI } from '../service/api';

const StockManagement = () => {
  const [activeTab, setActiveTab] = useState('view');
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State for detailed views
  const [locationWiseData, setLocationWiseData] = useState([]);
  const [locationWiseLoading, setLocationWiseLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchLocations(),
        fetchOrganizations(),
        fetchPendingApprovals()
      ]);
    } catch (error) {
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed data when switching to detailed tabs
  useEffect(() => {
    if (activeTab === 'location-wise') {
      fetchLocationWiseData();
    }
    if (activeTab === 'approvals') {
      fetchPendingApprovals();
    }
  }, [activeTab]);

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
      const response = await organizationAPI.getOrg();
      const orgData = response.data.data || response.data || [];
      setOrganizations(Array.isArray(orgData) ? orgData : []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    }
  };

  // CORRECTED: Using the right endpoint for pending approvals
  const fetchPendingApprovals = async () => {
    try {
      console.log('🔄 Fetching pending approvals from stock/pending-approvals endpoint');
      const response = await stockAPI.getPendingApprovals();
      console.log('✅ Pending approvals response:', response.data);
      setPendingApprovals(response.data.data || []);
    } catch (error) {
      console.error('❌ Error fetching pending approvals:', error);
      setPendingApprovals([]);
      // Don't set error here to avoid showing error when no approvals exist
    }
  };

  // Fetch location-wise stock data
  const fetchLocationWiseData = async () => {
    try {
      setLocationWiseLoading(true);
      const response = await productAPI.getLocationWiseStock();
      setLocationWiseData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching location-wise data:', error);
      setLocationWiseData([]);
      setError('Failed to load location-wise data');
    } finally {
      setLocationWiseLoading(false);
    }
  };

  const flattenLocations = (locationData) => {
    const flattened = [];
    
    if (!Array.isArray(locationData)) return flattened;

    const processLocation = (location, parentPath = '') => {
      if (location.PrimaryLocation) {
        const currentPath = location.PrimaryLocation;
        flattened.push({
          _id: location._id,
          name: location.PrimaryLocation,
          level: 'primary',
          parentId: null,
          fullPath: currentPath
        });

        if (Array.isArray(location.SubLocation)) {
          location.SubLocation.forEach(subLoc => {
            processSubLocation(subLoc, currentPath, location._id);
          });
        }
      }
    };

    const processSubLocation = (subLoc, parentPath, parentId) => {
      if (subLoc.PrimarySubLocation) {
        const currentPath = `${parentPath} > ${subLoc.PrimarySubLocation}`;
        flattened.push({
          _id: subLoc._id,
          name: subLoc.PrimarySubLocation,
          level: 'primary_sub',
          parentId: parentId,
          fullPath: currentPath
        });

        if (Array.isArray(subLoc.SecondaryLocation)) {
          subLoc.SecondaryLocation.forEach(secLoc => {
            processSecondaryLocation(secLoc, currentPath, subLoc._id);
          });
        }
      }
    };

    const processSecondaryLocation = (secLoc, parentPath, parentId) => {
      if (secLoc.SecondaryLocation) {
        const currentPath = `${parentPath} > ${secLoc.SecondaryLocation}`;
        flattened.push({
          _id: secLoc._id,
          name: secLoc.SecondaryLocation,
          level: 'secondary',
          parentId: parentId,
          fullPath: currentPath
        });

        if (Array.isArray(secLoc.SecondarySubLocation)) {
          secLoc.SecondarySubLocation.forEach(secSubLoc => {
            processSecondarySubLocation(secSubLoc, currentPath, secLoc._id);
          });
        }
      }
    };

    const processSecondarySubLocation = (secSubLoc, parentPath, parentId) => {
      if (secSubLoc.SecondarySubLocation) {
        const currentPath = `${parentPath} > ${secSubLoc.SecondarySubLocation}`;
        flattened.push({
          _id: secSubLoc._id,
          name: secSubLoc.SecondarySubLocation,
          level: 'secondary_sub',
          parentId: parentId,
          fullPath: currentPath
        });

        if (Array.isArray(secSubLoc.ThirdLocation)) {
          secSubLoc.ThirdLocation.forEach(thirdLoc => {
            processThirdLocation(thirdLoc, currentPath, secSubLoc._id);
          });
        }
      }
    };

    const processThirdLocation = (thirdLoc, parentPath, parentId) => {
      if (thirdLoc.ThirdLocation) {
        const currentPath = `${parentPath} > ${thirdLoc.ThirdLocation}`;
        flattened.push({
          _id: thirdLoc._id,
          name: thirdLoc.ThirdLocation,
          level: 'third',
          parentId: parentId,
          fullPath: currentPath
        });

        if (thirdLoc.ThirdSubLocation) {
          const finalPath = `${currentPath} > ${thirdLoc.ThirdSubLocation}`;
          flattened.push({
            _id: thirdLoc._id,
            name: thirdLoc.ThirdSubLocation,
            level: 'third_sub',
            parentId: parentId,
            fullPath: finalPath,
            isSubLocation: true
          });
        }
      }
    };

    locationData.forEach(location => processLocation(location));
    return flattened;
  };

  const handleSuccess = (message) => {
    setSuccess(message);
    fetchProducts();
    fetchPendingApprovals();
    setTimeout(() => setSuccess(''), 5000);
  };

  // CORRECTED: Using the right endpoint for approval handling
  const handleApproval = async (transactionId, approve, notes = '') => {
    try {
      console.log('🔄 Handling approval for transaction:', transactionId, 'approve:', approve);
      const response = await stockAPI.handleApproval({
        transactionId: transactionId,
        approve: approve,
        notes: notes
      });
      
      if (response.data.success) {
        handleSuccess(`Transfer request ${approve ? 'approved' : 'rejected'} successfully!`);
        fetchPendingApprovals();
      }
    } catch (error) {
      console.error('❌ Approval error:', error);
      setError('Failed to process approval: ' + (error.response?.data?.message || error.message));
    }
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
                Add Stock
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
                <Tab eventKey="view" title="View Stock">
                  <StockView 
                    products={products}
                    locations={locations}
                    getStockLevelVariant={getStockLevelVariant}
                  />
                </Tab>
                <Tab eventKey="location-wise" title="Location Wise">
                  <LocationWiseView 
                    data={locationWiseData}
                    locations={locations}
                    loading={locationWiseLoading}
                  />
                </Tab>
                <Tab eventKey="add" title="Add Stock">
                  <AddStock 
                    products={products || []}
                    locations={locations}
                    onSuccess={() => handleSuccess('Stock added successfully!')}
                    onError={setError}
                  />
                </Tab>
                <Tab eventKey="remove" title="Remove Stock">
                  <RemoveStock 
                    products={products || []}
                    locations={locations}
                    onSuccess={() => handleSuccess('Stock removed successfully!')}
                    onError={setError}
                  />
                </Tab>
                <Tab eventKey="transfer" title="Transfer Stock">
                  <TransferStock 
                    products={products || []}
                    locations={locations}
                    organizations={organizations}
                    onSuccess={(message) => handleSuccess(message)}
                    onError={setError}
                  />
                </Tab>
                <Tab eventKey="approvals" title="Pending Approvals">
                  <ApprovalList 
                    requests={pendingApprovals}
                    onApproval={handleApproval}
                  />
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

// Helper function for stock level variants
const getStockLevelVariant = (product) => {
  if (product.currentQuantity <= product.minimumStock) return 'danger';
  if (product.currentQuantity <= product.minimumStock * 2) return 'warning';
  return 'success';
};

// Location Wise View Component
const LocationWiseView = ({ data = [], locations = [], loading = false }) => {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [expandedProducts, setExpandedProducts] = useState(new Set());

  const toggleProductExpansion = (productId) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const filteredData = selectedLocation 
    ? data.filter(product => 
        product.locationStock && product.locationStock.some(stock => stock.locationId === selectedLocation)
      )
    : data;

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading location-wise data...</p>
      </div>
    );
  }

  return (
    <div>
      <Card className="mb-3">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Filter by Location</Form.Label>
                <Form.Select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <option value="">All Locations</option>
                  {locations.map(location => (
                    <option key={location._id} value={location._id}>
                      {location.fullPath}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-end">
              <Badge bg="primary" className="fs-6 me-2">
                Products: {filteredData.length}
              </Badge>
              <Badge bg="success" className="fs-6">
                Total Stock: {filteredData.reduce((sum, p) => sum + (p.totalStock || 0), 0)}
              </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {filteredData.map(product => (
        <Card key={product.id || product._id} className="mb-3">
          <Card.Header 
            className="d-flex justify-content-between align-items-center cursor-pointer"
            onClick={() => toggleProductExpansion(product.id || product._id)}
            style={{ cursor: 'pointer' }}
          >
            <div>
              <h5 className="mb-0">{product.name} - {product.brand}</h5>
              <small className="text-muted">{product.category} • {product.assignmentType}</small>
            </div>
            <div className="d-flex align-items-center gap-3">
              <Badge bg={product.needsRestock ? 'danger' : 'success'}>
                Main Stock: {product.mainStock}
              </Badge>
              <Badge bg="info">
                Location Stock: {product.totalLocationStock}
              </Badge>
              <Badge bg="primary">
                Total: {product.totalStock}
              </Badge>
              <Button variant="outline-primary" size="sm">
                {expandedProducts.has(product.id || product._id) ? '▲' : '▼'}
              </Button>
            </div>
          </Card.Header>
          
          {expandedProducts.has(product.id || product._id) && (
            <Card.Body>
              <h6>Location-wise Stock Details:</h6>
              <div className="table-responsive">
                <Table striped bordered size="sm">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Level</th>
                      <th>Quantity</th>
                      <th>Stock Updated</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.locationStock && product.locationStock.map((stock, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{stock.locationName}</strong>
                          <br />
                          <small className="text-muted">{stock.locationFullPath}</small>
                        </td>
                        <td>
                          <Badge bg={
                            stock.locationLevel === 'primary' ? 'primary' :
                            stock.locationLevel === 'primary_sub' ? 'success' :
                            stock.locationLevel === 'secondary' ? 'info' :
                            stock.locationLevel === 'secondary_sub' ? 'warning' :
                            stock.locationLevel === 'third' ? 'secondary' : 'dark'
                          }>
                            {stock.locationLevel}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={stock.needsRestock ? 'danger' : 'success'}>
                            {stock.quantity}
                          </Badge>
                        </td>
                        <td>
                          {stock.lastUpdated ? new Date(stock.lastUpdated).toLocaleDateString() : 'N/A'}
                          <br />
                          <small className="text-muted">
                            {stock.lastUpdated ? new Date(stock.lastUpdated).toLocaleTimeString() : ''}
                          </small>
                        </td>
                        <td>{stock.reason || 'N/A'}</td>
                      </tr>
                    ))}
                    {(!product.locationStock || product.locationStock.length === 0) && (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-3">
                          No stock allocated to locations
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          )}
        </Card>
      ))}

      {filteredData.length === 0 && !loading && (
        <Alert variant="info" className="text-center">
          <h5>No products found</h5>
          <p>No products match the current filter criteria.</p>
        </Alert>
      )}
    </div>
  );
};

// Stock View Component
const StockView = ({ products = [], locations = [], getStockLevelVariant }) => {
  const [filter, setFilter] = useState({
    category: '',
    assignmentType: ''
  });

  const filteredProducts = products.filter(product => {
    const matchesCategory = !filter.category || product.category === filter.category;
    const matchesAssignment = !filter.assignmentType || product.assignmentType === filter.assignmentType;
    return matchesCategory && matchesAssignment;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const assignmentTypes = [...new Set(products.map(p => p.assignmentType).filter(Boolean))];

  return (
    <div>
      <Card className="mb-3">
        <Card.Body>
          <Row>
            <Col md={4}>
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
            <Col md={4}>
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
            <Col md={4} className="d-flex align-items-end">
              <Badge bg="primary" className="fs-6">
                Total: {filteredProducts.length} products
              </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="table-responsive">
        <Table striped>
          <thead className="table-dark">
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Min Stock</th>
              <th>Assignment</th>
              <th>Status</th>
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
                    {product.assignmentType || 'Unassigned'}
                  </Badge>
                </td>
                <td>
                  <Badge bg={product.isActive ? 'success' : 'danger'}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

// Add Stock Component
const AddStock = ({ products = [], locations = [], onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    destinationLocation: '',
    reason: 'Stock addition'
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
        setFormData({
          productId: '',
          quantity: 1,
          destinationLocation: '',
          reason: 'Stock addition'
        });
      }
    } catch (error) {
      onError(error.response?.data?.message || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

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
              <option value="">Select Destination</option>
              {locations.map(location => (
                <option key={location._id} value={location._id}>
                  {location.fullPath || location.name}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Select the destination location from the dropdown
            </Form.Text>
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
              placeholder="Reason for adding stock"
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <div className="d-grid">
        <Button 
          variant="success" 
          type="submit" 
          disabled={loading}
          size="lg"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Adding Stock...
            </>
          ) : (
            'Add Stock'
          )}
        </Button>
      </div>
    </Form>
  );
};

// Remove Stock Component
const RemoveStock = ({ products = [], locations = [], onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    sourceLocation: '',
    reason: 'Stock removal'
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
          reason: 'Stock removal'
        });
      }
    } catch (error) {
      onError(error.response?.data?.message || 'Failed to remove stock');
    } finally {
      setLoading(false);
    }
  };

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
                  {location.fullPath || location.name}
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
              placeholder="Reason for removing stock (e.g., Damaged, Used, Expired, etc.)"
            />
          </Form.Group>
        </Col>
      </Row>

      <div className="d-grid">
        <Button 
          variant="warning" 
          type="submit" 
          disabled={loading}
          size="lg"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Removing Stock...
            </>
          ) : (
            'Remove Stock'
          )}
        </Button>
      </div>
    </Form>
  );
};

// Transfer Stock Component
const TransferStock = ({ products = [], locations = [], organizations = [], onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    sourceLocation: '',
    destinationLocation: '',
    destinationOrganization: '',
    reason: 'Stock transfer'
  });
  const [loading, setLoading] = useState(false);
  const [transferType, setTransferType] = useState('same-org'); // 'same-org' or 'cross-org'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    onError('');

    try {
      let response;
      
      if (transferType === 'cross-org') {
        // Cross-organization transfer
        if (!formData.destinationOrganization) {
          throw new Error('Please select a destination organization');
        }
        
        response = await stockAPI.transferToOtherOrganization({
          productId: formData.productId,
          quantity: formData.quantity,
          destinationOrganization: formData.destinationOrganization,
          reason: formData.reason
        });
      } else {
        // Same organization transfer between locations
        if (!formData.sourceLocation || !formData.destinationLocation) {
          throw new Error('Please select both source and destination locations');
        }
        
        response = await stockAPI.transfer({
          productId: formData.productId,
          quantity: formData.quantity,
          sourceLocation: formData.sourceLocation,
          destinationLocation: formData.destinationLocation,
          reason: formData.reason
        });
      }
      
      if (response.data.success) {
        const message = transferType === 'cross-org' 
          ? 'Cross-organization transfer request submitted for approval!' 
          : 'Stock transferred successfully!';
        
        onSuccess(message);
        setFormData({
          productId: '',
          quantity: 1,
          sourceLocation: '',
          destinationLocation: '',
          destinationOrganization: '',
          reason: 'Stock transfer'
        });
      }
    } catch (error) {
      onError(error.response?.data?.message || 'Failed to transfer stock');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferTypeChange = (type) => {
    setTransferType(type);
    // Reset form data when switching types
    setFormData({
      ...formData,
      destinationOrganization: '',
      destinationLocation: '',
      sourceLocation: ''
    });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Transfer Type</Form.Label>
            <div>
              <Form.Check
                type="radio"
                label="Same Organization (Between Locations)"
                name="transferType"
                checked={transferType === 'same-org'}
                onChange={() => handleTransferTypeChange('same-org')}
                className="mb-2"
              />
              <Form.Check
                type="radio"
                label="Cross Organization"
                name="transferType"
                checked={transferType === 'cross-org'}
                onChange={() => handleTransferTypeChange('cross-org')}
              />
            </div>
          </Form.Group>

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
          {transferType === 'cross-org' ? (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Destination Organization *</Form.Label>
                <Form.Select
                  value={formData.destinationOrganization}
                  onChange={(e) => setFormData({ ...formData, destinationOrganization: e.target.value })}
                  required
                >
                  <option value="">Select Destination Organization</option>
                  {organizations.map(org => (
                    <option key={org._id} value={org.OrganizationId || org._id}>
                      {org.domain} {org.companyName ? `- ${org.companyName}` : ''}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Select the organization domain to transfer stock to
                </Form.Text>
              </Form.Group>
            </>
          ) : (
            <>
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
                      {location.fullPath || location.name}
                    </option>
                  ))}
                </Form.Select>
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
                      {location.fullPath || location.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Reason *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Reason for transferring stock"
              required
            />
          </Form.Group>
        </Col>
      </Row>

      {transferType === 'cross-org' && (
        <Alert variant="warning" className="mb-3">
          ⚠️ <strong>Cross-Organization Transfer</strong><br />
          • This transfer requires approval from parent organization<br />
          • Stock will be deducted from your organization once approved<br />
          • Product will be added to the destination organization<br />
          • You cannot transfer to your own organization
        </Alert>
      )}

      {transferType === 'same-org' && (
        <Alert variant="info" className="mb-3">
          ℹ️ <strong>Same Organization Transfer</strong><br />
          • Transfer between locations within your organization<br />
          • No approval required<br />
          • Immediate processing
        </Alert>
      )}

      <div className="d-grid">
        <Button 
          variant={transferType === 'cross-org' ? "warning" : "primary"}
          type="submit" 
          disabled={loading}
          size="lg"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              {transferType === 'cross-org' ? 'Requesting Transfer...' : 'Transferring Stock...'}
            </>
          ) : (
            transferType === 'cross-org' ? 'Request Cross-Organization Transfer' : 'Transfer Stock'
          )}
        </Button>
      </div>
    </Form>
  );
};

// Approval List Component
const ApprovalList = ({ requests, onApproval }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionData, setActionData] = useState({ approve: true, notes: '' });
  const [loading, setLoading] = useState(false);

  // Filter for cross-organization transfer approvals
  const crossOrgRequests = requests.filter(req => 
    req.status === 'PENDING_APPROVAL' || req.canApprove
  );

  const handleAction = async () => {
    if (!selectedRequest) return;

    setLoading(true);
    try {
      await onApproval(selectedRequest.transactionId, actionData.approve, actionData.notes);
      setSelectedRequest(null);
      setActionData({ approve: true, notes: '' });
    } catch (error) {
      console.error('Error handling approval:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'PENDING_APPROVAL': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Pending Cross-Organization Transfers</h4>
          <Badge bg="primary">{crossOrgRequests.length} requests</Badge>
        </Card.Header>
        <Card.Body>
          {crossOrgRequests.length === 0 ? (
            <Alert variant="info" className="text-center">
              <h5>No pending cross-organization transfers</h5>
              <p>All transfer requests have been processed.</p>
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead className="table-dark">
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Source Organization</th>
                    <th>Destination Organization</th>
                    <th>Reason</th>
                    <th>Requested At</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {crossOrgRequests.map(request => (
                    <tr key={request.transactionId}>
                      <td>
                        <strong>{request.productName}</strong>
                        <br />
                        <small className="text-muted">ID: {request.productId}</small>
                      </td>
                      <td>
                        <strong>{request.quantity}</strong>
                      </td>
                      <td>
                        {request.sourceOrganizationName}
                        <br />
                        <small className="text-muted">{request.sourceOrganization}</small>
                      </td>
                      <td>
                        {request.destinationOrganizationName}
                        <br />
                        <small className="text-muted">{request.destinationOrganization}</small>
                      </td>
                      <td>{request.reason}</td>
                      <td>
                        {new Date(request.requestedAt).toLocaleDateString()}
                        <br />
                        <small className="text-muted">
                          {new Date(request.requestedAt).toLocaleTimeString()}
                        </small>
                      </td>
                      <td>
                        <Badge bg={getStatusVariant(request.status)}>
                          {request.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionData({ approve: true, notes: '' });
                            }}
                            disabled={!request.canApprove}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionData({ approve: false, notes: '' });
                            }}
                            disabled={!request.canApprove}
                          >
                            Reject
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
      <Modal show={!!selectedRequest} onHide={() => setSelectedRequest(null)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {actionData.approve ? 'Approve' : 'Reject'} Transfer Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div className="mb-3">
              <p><strong>Product:</strong> {selectedRequest.productName}</p>
              <p><strong>Quantity:</strong> {selectedRequest.quantity}</p>
              <p><strong>From:</strong> {selectedRequest.sourceOrganizationName}</p>
              <p><strong>To:</strong> {selectedRequest.destinationOrganizationName}</p>
              <p><strong>Reason:</strong> {selectedRequest.reason}</p>
              <p><strong>Requested:</strong> {new Date(selectedRequest.requestedAt).toLocaleString()}</p>
            </div>
          )}
          
          <Form.Group className="mb-3">
            <Form.Label>
              {actionData.approve ? 'Approval Notes' : 'Rejection Reason'} *
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={actionData.notes}
              onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
              placeholder={
                actionData.approve 
                  ? 'Add any notes for this approval...' 
                  : 'Explain why this transfer is being rejected...'
              }
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedRequest(null)}>
            Cancel
          </Button>
          <Button 
            variant={actionData.approve ? 'success' : 'danger'}
            onClick={handleAction}
            disabled={!actionData.notes || loading}
          >
            {loading ? (
              <Spinner animation="border" size="sm" className="me-2" />
            ) : null}
            {actionData.approve ? 'Approve' : 'Reject'} Transfer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StockManagement;