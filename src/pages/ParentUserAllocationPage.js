// ParentUserAllocationPage.js
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Form, 
  Modal,
  Alert,
  Badge,
  ProgressBar,
  Spinner,
  InputGroup
} from 'react-bootstrap';
import axios from 'axios';

const ParentUserAllocationPage = () => {
  const [parentOrg, setParentOrg] = useState(null);
  const [childOrganizations, setChildOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showReallocateModal, setShowReallocateModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [formData, setFormData] = useState({
    targetOrgId: '',
    usersToAllocate: 1,
    fromOrgId: '',
    toOrgId: '',
    usersToMove: 1
  });

  // Fetch parent organization and children
  useEffect(() => {
    fetchParentAllocationData();
  }, []);

  const fetchParentAllocationData = async () => {
    try {
      setLoading(true);
    const token = localStorage.getItem("access_token");

      // Get organization hierarchy
      const hierarchyResponse = await axios.get('https://codeaves.avessecurity.com/api/oraganisation/hierarchy', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const hierarchy = hierarchyResponse.data.data;
      
      // Set parent organization (root)
      setParentOrg({
        ...hierarchy,
        isRoot: true
      });

      // Extract all child organizations (flatten the hierarchy)
      const children = flattenChildren(hierarchy.children || []);
      setChildOrganizations(children);

      setError('');
    } catch (err) {
      setError('Failed to fetch allocation data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Flatten all child organizations
  const flattenChildren = (children, level = 1) => {
    let allChildren = [];
    
    children.forEach(child => {
      allChildren.push({
        ...child,
        level,
        isDirectChild: level === 1
      });
      
      if (child.children && child.children.length > 0) {
        allChildren = [...allChildren, ...flattenChildren(child.children, level + 1)];
      }
    });
    
    return allChildren;
  };

  // Handle allocation to child organization
  const handleAllocateToChild = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const parentOrgId = parentOrg._id;

      await axios.post(`https://codeaves.avessecurity.com/api/oraganisation/${parentOrgId}/allocate-users`, {
        targetOrgId: formData.targetOrgId,
        usersToAllocate: formData.usersToAllocate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`Successfully allocated ${formData.usersToAllocate} users to ${selectedChild?.name}`);
      setShowAllocateModal(false);
      setFormData({ ...formData, targetOrgId: '', usersToAllocate: 1 });
      setSelectedChild(null);
      fetchParentAllocationData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to allocate users');
    }
  };

  // Handle reallocation between children
  const handleReallocateBetweenChildren = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const parentOrgId = parentOrg._id;

      await axios.post(`https://codeaves.avessecurity.com/api/oraganisation/${parentOrgId}/reallocate-users`, {
        fromOrgId: formData.fromOrgId,
        toOrgId: formData.toOrgId,
        usersToMove: formData.usersToMove
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const fromOrg = childOrganizations.find(org => org._id === formData.fromOrgId);
      const toOrg = childOrganizations.find(org => org._id === formData.toOrgId);

      setSuccess(`Successfully moved ${formData.usersToMove} users from ${fromOrg?.name} to ${toOrg?.name}`);
      setShowReallocateModal(false);
      setFormData({ ...formData, fromOrgId: '', toOrgId: '', usersToMove: 1 });
      fetchParentAllocationData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reallocate users');
    }
  };

  // Open allocate modal for a specific child
  const openAllocateModal = (childOrg) => {
    setSelectedChild(childOrg);
    setFormData({
      ...formData,
      targetOrgId: childOrg._id,
      usersToAllocate: 1
    });
    setShowAllocateModal(true);
  };

  // Open reallocate modal
  const openReallocateModal = () => {
    setShowReallocateModal(true);
  };

  // Calculate total allocation statistics
  const getAllocationStats = () => {
    if (!parentOrg) return null;

    const totalAllocatedToChildren = childOrganizations.reduce(
      (sum, org) => sum + (org.user_allocation?.total_app_users_allocated || 0), 0
    );

    const totalUsedByChildren = childOrganizations.reduce(
      (sum, org) => sum + (org.usage_tracking?.app_users_used_self || 0), 0
    );

    return {
      totalAllocatedToChildren,
      totalUsedByChildren,
      availableForParent: parentOrg.user_allocation?.available_for_self || 0,
      parentLimit: parentOrg.plan_restrictions?.max_total_app_users || 0
    };
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  const allocationStats = getAllocationStats();

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary">
            <i className="fas fa-users me-2"></i>
            Parent User Allocation Management
          </h2>
          <p className="text-muted">
            Manage user allocations for your organization hierarchy
          </p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="outline-primary" 
            onClick={fetchParentAllocationData}
          >
            <i className="fas fa-sync-alt me-2"></i>
            Refresh
          </Button>
        </Col>
      </Row>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Parent Organization Card */}
      {parentOrg && (
        <Card className="mb-4 border-primary">
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="fas fa-crown me-2"></i>
              Parent Organization - {parentOrg.name}
            </h5>
            <Badge bg="light" text="dark">
              <i className="fas fa-level-up-alt me-1"></i>
              Root Level
            </Badge>
          </Card.Header>
          <Card.Body>
            <Row className="mb-3">
              <Col md={4}>
                <strong>Domain:</strong> <code>{parentOrg.domain}</code>
              </Col>
              <Col md={4}>
                <strong>Organization ID:</strong> <code>{parentOrg.OrganizationId}</code>
              </Col>
              <Col md={4}>
                <strong>Status:</strong> 
                <Badge bg={parentOrg.isActive ? 'success' : 'danger'} className="ms-2">
                  {parentOrg.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </Col>
            </Row>

            {/* Allocation Summary */}
            <Row className="text-center">
              <Col md={3}>
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h3 className="text-primary">{parentOrg.user_allocation?.total_app_users_allocated || 0}</h3>
                    <small className="text-muted">Total Users Allocated</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h3 className="text-success">{allocationStats?.availableForParent || 0}</h3>
                    <small className="text-muted">Available for Parent</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h3 className="text-warning">{allocationStats?.totalAllocatedToChildren || 0}</h3>
                    <small className="text-muted">Allocated to Children</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h3 className="text-info">{parentOrg.plan_restrictions?.max_total_app_users || 0}</h3>
                    <small className="text-muted">Plan Limit</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="d-flex justify-content-between mb-1">
                <small>Overall Usage</small>
                <small>
                  {parentOrg.usage_tracking?.total_app_users_used || 0} / {parentOrg.plan_restrictions?.max_total_app_users || 0}
                </small>
              </div>
              <ProgressBar 
                now={(parentOrg.usage_tracking?.total_app_users_used / parentOrg.plan_restrictions?.max_total_app_users) * 100}
                variant={
                  (parentOrg.usage_tracking?.total_app_users_used / parentOrg.plan_restrictions?.max_total_app_users) > 0.8 
                    ? 'danger' 
                    : (parentOrg.usage_tracking?.total_app_users_used / parentOrg.plan_restrictions?.max_total_app_users) > 0.6 
                    ? 'warning' 
                    : 'success'
                }
                style={{ height: '10px' }}
              />
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Action Buttons - Only for Parent */}
      <Row className="mb-4">
        <Col>
          <Button 
            variant="primary" 
            className="me-2"
            onClick={openReallocateModal}
            disabled={childOrganizations.length < 2}
          >
            <i className="fas fa-exchange-alt me-2"></i>
            Reallocate Between Children
          </Button>
          <Button 
            variant="outline-primary"
            onClick={() => {
              // Show allocation recommendations
              alert('Feature coming soon: Allocation recommendations');
            }}
          >
            <i className="fas fa-lightbulb me-2"></i>
            Get Allocation Suggestions
          </Button>
        </Col>
      </Row>

      {/* Child Organizations Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-sitemap me-2"></i>
            Child Organizations ({childOrganizations.length})
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          {childOrganizations.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fas fa-folder-open fa-3x mb-3"></i>
              <p>No child organizations found</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Organization Name</th>
                  <th>Domain Path</th>
                  <th>Level</th>
                  <th>Allocated Users</th>
                  <th>Available</th>
                  <th>Used</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {childOrganizations.map((child) => (
                  <tr key={child._id}>
                    <td>
                      <div style={{ paddingLeft: `${(child.level - 1) * 20}px` }}>
                        {child.level > 1 && <i className="fas fa-level-down-alt text-muted me-2"></i>}
                        <strong>{child.name}</strong>
                        {child.isDirectChild && (
                          <Badge bg="info" className="ms-2">Direct</Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      <code className="small">{child.fullDomainPath}</code>
                    </td>
                    <td>
                      <Badge bg="secondary">Level {child.hierarchyLevel}</Badge>
                    </td>
                    <td>
                      <strong className="text-primary">{child.user_allocation?.total_app_users_allocated || 0}</strong>
                    </td>
                    <td>
                      <span className={
                        child.user_allocation?.available_for_self > 0 
                          ? 'text-success' 
                          : 'text-danger'
                      }>
                        <strong>{child.user_allocation?.available_for_self || 0}</strong>
                      </span>
                    </td>
                    <td>
                      <span className="text-warning">
                        <strong>{child.usage_tracking?.app_users_used_self || 0}</strong>
                      </span>
                    </td>
                    <td>
                      <Badge bg={child.isActive ? 'success' : 'danger'}>
                        {child.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => openAllocateModal(child)}
                        disabled={!parentOrg?.user_allocation?.available_for_self}
                        title={
                          !parentOrg?.user_allocation?.available_for_self 
                            ? 'No users available for allocation' 
                            : `Allocate users to ${child.name}`
                        }
                      >
                        <i className="fas fa-user-plus me-1"></i>
                        Allocate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Allocate to Child Modal */}
      <Modal show={showAllocateModal} onHide={() => setShowAllocateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-user-plus me-2"></i>
            Allocate Users to Child Organization
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAllocateToChild}>
          <Modal.Body>
            {selectedChild && (
              <>
                <Alert variant="info">
                  <strong>Target Organization:</strong> {selectedChild.name}<br/>
                  <strong>Domain:</strong> {selectedChild.fullDomainPath}<br/>
                  <strong>Current Allocation:</strong> {selectedChild.user_allocation?.total_app_users_allocated || 0} users
                </Alert>
                
                <Form.Group className="mb-3">
                  <Form.Label>
                    <strong>Number of Users to Allocate</strong>
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      min="1"
                      max={parentOrg?.user_allocation?.available_for_self}
                      value={formData.usersToAllocate}
                      onChange={(e) => setFormData({
                        ...formData,
                        usersToAllocate: parseInt(e.target.value) || 1
                      })}
                      required
                    />
                    <InputGroup.Text>users</InputGroup.Text>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Available from parent: <strong>{parentOrg?.user_allocation?.available_for_self || 0}</strong> users
                  </Form.Text>
                </Form.Group>

                <div className="bg-light p-3 rounded">
                  <small>
                    <strong>After allocation:</strong><br/>
                    • Parent will have: {parentOrg.user_allocation.available_for_self - formData.usersToAllocate} users available<br/>
                    • {selectedChild.name} will have: {(selectedChild.user_allocation?.total_app_users_allocated || 0) + formData.usersToAllocate} total users
                  </small>
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAllocateModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={formData.usersToAllocate > parentOrg?.user_allocation?.available_for_self}
            >
              <i className="fas fa-check me-2"></i>
              Confirm Allocation
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Reallocate Between Children Modal */}
      <Modal show={showReallocateModal} onHide={() => setShowReallocateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-exchange-alt me-2"></i>
            Reallocate Users Between Child Organizations
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleReallocateBetweenChildren}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>From Organization (Source)</Form.Label>
                  <Form.Select
                    value={formData.fromOrgId}
                    onChange={(e) => setFormData({
                      ...formData,
                      fromOrgId: e.target.value
                    })}
                    required
                  >
                    <option value="">Select source organization</option>
                    {childOrganizations
                      .filter(child => child.user_allocation?.available_for_self > 0)
                      .map(child => (
                        <option key={child._id} value={child._id}>
                          {child.name} (Available: {child.user_allocation.available_for_self})
                        </option>
                      ))
                    }
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>To Organization (Destination)</Form.Label>
                  <Form.Select
                    value={formData.toOrgId}
                    onChange={(e) => setFormData({
                      ...formData,
                      toOrgId: e.target.value
                    })}
                    required
                  >
                    <option value="">Select target organization</option>
                    {childOrganizations
                      .filter(child => child._id !== formData.fromOrgId)
                      .map(child => (
                        <option key={child._id} value={child._id}>
                          {child.name}
                        </option>
                      ))
                    }
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>
                <strong>Number of Users to Move</strong>
              </Form.Label>
              <InputGroup>
                <Form.Control
                  type="number"
                  min="1"
                  value={formData.usersToMove}
                  onChange={(e) => setFormData({
                    ...formData,
                    usersToMove: parseInt(e.target.value) || 1
                  })}
                  required
                />
                <InputGroup.Text>users</InputGroup.Text>
              </InputGroup>
              {formData.fromOrgId && (
                <Form.Text className="text-muted">
                  Maximum available from source: {
                    childOrganizations.find(child => child._id === formData.fromOrgId)
                      ?.user_allocation?.available_for_self || 0
                  } users
                </Form.Text>
              )}
            </Form.Group>

            {formData.fromOrgId && formData.toOrgId && (
              <Alert variant="info">
                <strong>Transfer Summary:</strong><br/>
                Moving <strong>{formData.usersToMove}</strong> users from {
                  childOrganizations.find(child => child._id === formData.fromOrgId)?.name
                } to {
                  childOrganizations.find(child => child._id === formData.toOrgId)?.name
                }
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReallocateModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="warning" 
              type="submit"
              disabled={
                !formData.fromOrgId || 
                !formData.toOrgId || 
                formData.fromOrgId === formData.toOrgId ||
                formData.usersToMove > (
                  childOrganizations.find(child => child._id === formData.fromOrgId)
                    ?.user_allocation?.available_for_self || 0
                )
              }
            >
              <i className="fas fa-exchange-alt me-2"></i>
              Confirm Reallocation
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ParentUserAllocationPage;