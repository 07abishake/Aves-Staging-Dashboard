import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Container, Row, Col, Card, Table, Button, Form, Modal, 
    Alert, Spinner, Badge, ProgressBar, Dropdown 
} from 'react-bootstrap';

const UserAllocation = () => {
    const [allocationData, setAllocationData] = useState(null);
    const [childOrgs, setChildOrgs] = useState([]);
    const [availableOrgs, setAvailableOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Modal states
    const [showAllocateModal, setShowAllocateModal] = useState(false);
    const [showReduceModal, setShowReduceModal] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(null);
    
    // Form states
    const [allocateForm, setAllocateForm] = useState({ childOrgId: '', usersToAllocate: '' });
    const [reduceForm, setReduceForm] = useState({ usersToReduce: '' });

    const token = localStorage.getItem('access_token');
    const OrganizationId = localStorage.getItem('OrganizationId');

    // API configuration
    const apiConfig = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    // Function to flatten organization hierarchy for dropdown
    const flattenOrganizations = (orgs) => {
        let flattened = [];
        
        const flatten = (organization) => {
            if (organization && organization._id) {
                flattened.push({
                    _id: organization._id,
                    org_id: organization.OrganizationId,
                    name: organization.name,
                    domain: organization.domain,
                    fullDomainPath: organization.fullDomainPath,
                    isActive: organization.isActive,
                    hierarchyLevel: organization.hierarchyLevel
                });
            }
            
            if (organization.children && organization.children.length > 0) {
                organization.children.forEach(child => flatten(child));
            }
        };

        orgs.forEach(org => flatten(org));
        return flattened;
    };

    // Fetch allocation data
    const fetchAllocationData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `https://codeaves.avessecurity.com/api/oraganisation/allocation-overview`,
                apiConfig
            );
            
            if (response.data.success) {
                setAllocationData(response.data.data);
                setChildOrgs(response.data.data.children || []);
            }
        } catch (err) {
            console.error('Error fetching allocation data:', err);
            setError('Failed to load allocation data');
        } finally {
            setLoading(false);
        }
    };

    // Fetch available child organizations for allocation dropdown
    const fetchAvailableOrgs = async () => {
        try {
            const response = await axios.get(
                `https://codeaves.avessecurity.com/api/oraganisation/hierarchy`,
                apiConfig
            );
            
            if (response.data.success) {
                const allChildOrgs = flattenOrganizations([response.data.data]);
                const childOrganizations = allChildOrgs.filter(org => 
                    org._id !== response.data.data._id && org.hierarchyLevel > 0
                );
                setAvailableOrgs(childOrganizations);
            }
        } catch (err) {
            console.error('Error fetching organizations:', err);
            setError('Failed to load organization list');
        }
    };

    useEffect(() => {
        fetchAllocationData();
        fetchAvailableOrgs();
    }, []);

    // Handle allocate users
    const handleAllocateUsers = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                childOrgId: allocateForm.childOrgId,
                usersToAllocate: parseInt(allocateForm.usersToAllocate)
            };

            const response = await axios.post(
                `https://codeaves.avessecurity.com/api/oraganisation/allocate-users`,
                payload,
                apiConfig
            );

            if (response.data.success) {
                setSuccess(`Successfully allocated ${allocateForm.usersToAllocate} users`);
                setShowAllocateModal(false);
                setAllocateForm({ childOrgId: '', usersToAllocate: '' });
                fetchAllocationData();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to allocate users');
        }
    };

    // Handle reduce allocation
    const handleReduceAllocation = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                `https://codeaves.avessecurity.com/api/oraganisation/reduce-allocation`,
                {
                    childOrgId: selectedOrg.org_id,
                    usersToReduce: parseInt(reduceForm.usersToReduce)
                },
                apiConfig
            );

            if (response.data.success) {
                setSuccess(`Successfully reduced ${reduceForm.usersToReduce} users from ${selectedOrg.domain}`);
                setShowReduceModal(false);
                setReduceForm({ usersToReduce: '' });
                setSelectedOrg(null);
                fetchAllocationData();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reduce allocation');
        }
    };

    // Open reduce modal
    const openReduceModal = (org) => {
        setSelectedOrg(org);
        setReduceForm({ usersToReduce: '' });
        setShowReduceModal(true);
    };

    // Get usage badge color and icon
    const getUsageStats = (percentage) => {
        if (percentage === 0) return { color: 'secondary', icon: '🔵', label: 'Not Used' };
        if (percentage < 30) return { color: 'success', icon: '🟢', label: 'Low Usage' };
        if (percentage < 70) return { color: 'warning', icon: '🟡', label: 'Medium Usage' };
        return { color: 'danger', icon: '🔴', label: 'High Usage' };
    };

    // Refresh data
    const handleRefresh = () => {
        setLoading(true);
        fetchAllocationData();
        fetchAvailableOrgs();
    };

    if (loading) {
        return (
            <Container className="mt-4">
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                    <h5 className="mt-3 text-muted">Loading Allocation Dashboard...</h5>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="px-4 py-3">
            {/* Header Section */}
            <Row className="mb-4 align-items-center">
                <Col>
                    <div className="d-flex align-items-center">
                        <div className="bg-primary rounded p-2 me-3">
                            <i className="bi bi-people-fill text-white fs-4"></i>
                        </div>
                        <div>
                            <h2 className="mb-1 fw-bold text-dark">User Allocation Management</h2>
                            <p className="text-muted mb-0">
                                Manage and monitor user allocations across your organization hierarchy
                            </p>
                        </div>
                    </div>
                </Col>
                <Col xs="auto">
                    <div className="d-flex gap-2">
                        <Button 
                            variant="outline-secondary" 
                            onClick={handleRefresh}
                            size="sm"
                        >
                            <i className="bi bi-arrow-clockwise me-2"></i>
                            Refresh
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={() => setShowAllocateModal(true)}
                            disabled={!allocationData?.parent?.available_for_self || availableOrgs.length === 0}
                            className="shadow-sm"
                        >
                            <i className="bi bi-person-plus me-2"></i>
                            Allocate Users
                        </Button>
                    </div>
                </Col>
            </Row>

            {/* Alerts */}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')} className="border-0 shadow-sm">
                    <div className="d-flex align-items-center">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        {error}
                    </div>
                </Alert>
            )}
            {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess('')} className="border-0 shadow-sm">
                    <div className="d-flex align-items-center">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        {success}
                    </div>
                </Alert>
            )}

            {/* Enhanced Summary Cards */}
            {allocationData?.parent && (
                <Row className="mb-4 g-3">
                    <Col xl={3} lg={6}>
                        <Card className="h-100 border-0 shadow-sm bg-gradient-primary text-white">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="card-title text-white-50 mb-2">Total Users</h6>
                                        <h2 className="fw-bold mb-0">{allocationData.parent.total_app_users_allocated}</h2>
                                        <small>Overall capacity</small>
                                    </div>
                                    <div className="bg-white-20 rounded-circle p-3">
                                        <i className="bi bi-people-fill fs-3"></i>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xl={3} lg={6}>
                        <Card className="h-100 border-0 shadow-sm bg-gradient-success text-white">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="card-title text-white-50 mb-2">Available for Allocation</h6>
                                        <h2 className="fw-bold mb-0">{allocationData.parent.available_for_self}</h2>
                                        <small>Ready to distribute</small>
                                    </div>
                                    <div className="bg-white-20 rounded-circle p-3">
                                        <i className="bi bi-person-check fs-3"></i>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xl={3} lg={6}>
                        <Card className="h-100 border-0 shadow-sm bg-gradient-warning text-dark">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="card-title text-dark-50 mb-2">Allocated to Children</h6>
                                        <h2 className="fw-bold mb-0">{allocationData.parent.allocated_to_children}</h2>
                                        <small>Distributed to sub-orgs</small>
                                    </div>
                                    <div className="bg-dark-10 rounded-circle p-3">
                                        <i className="bi bi-diagram-3 fs-3"></i>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xl={3} lg={6}>
                        <Card className="h-100 border-0 shadow-sm bg-gradient-info text-white">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="card-title text-white-50 mb-2">Total Used</h6>
                                        <h2 className="fw-bold mb-0">{allocationData.parent.total_used_in_hierarchy}</h2>
                                        <small>Active users</small>
                                    </div>
                                    <div className="bg-white-20 rounded-circle p-3">
                                        <i className="bi bi-person-gear fs-3"></i>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Main Content Area */}
            <Row className="g-4">
                {/* Child Organizations Table */}
                <Col xl={8}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white border-0 py-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-semibold">
                                    <i className="bi bi-building me-2 text-primary"></i>
                                    Child Organizations Allocation
                                </h5>
                                <Badge bg="light" text="dark" className="fs-6">
                                    {childOrgs.length} Organizations
                                </Badge>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {childOrgs.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="bi bi-inbox display-1 text-muted opacity-50"></i>
                                    <h5 className="mt-3 text-muted">No Child Organizations</h5>
                                    <p className="text-muted mb-3">You haven't allocated any users to child organizations yet.</p>
                                    <Button 
                                        variant="outline-primary" 
                                        onClick={() => setShowAllocateModal(true)}
                                    >
                                        <i className="bi bi-plus-circle me-2"></i>
                                        Allocate Users
                                    </Button>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover className="mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="ps-4 py-3 fw-semibold text-muted border-0">Organization</th>
                                                <th className="py-3 fw-semibold text-muted border-0">Allocated</th>
                                                <th className="py-3 fw-semibold text-muted border-0">Used</th>
                                                <th className="py-3 fw-semibold text-muted border-0">Available</th>
                                                <th className="py-3 fw-semibold text-muted border-0">Usage</th>
                                                <th className="py-3 fw-semibold text-muted border-0">Status</th>
                                                <th className="pe-4 py-3 fw-semibold text-muted border-0 text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {childOrgs.map((org, index) => {
                                                const usageStats = getUsageStats(org.allocation.usage_percentage);
                                                return (
                                                    <tr key={org.org_id} className={index % 2 === 0 ? 'bg-white' : 'bg-light'}>
                                                        <td className="ps-4 py-3 border-0">
                                                            <div className="d-flex align-items-center">
                                                                <div className="bg-primary bg-opacity-10 rounded p-2 me-3">
                                                                    <i className="bi bi-building text-primary"></i>
                                                                </div>
                                                                <div>
                                                                    <strong className="d-block">{org.domain}</strong>
                                                                    <small className="text-muted">{org.name}</small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 border-0">
                                                            <strong className="text-dark fs-6">{org.allocation.allocated}</strong>
                                                        </td>
                                                        <td className="py-3 border-0">
                                                            <span className="fw-semibold">{org.allocation.used}</span>
                                                        </td>
                                                        <td className="py-3 border-0">
                                                            <Badge 
                                                                bg={org.allocation.available > 0 ? 'success' : 'secondary'} 
                                                                className="fs-7 px-2 py-1"
                                                            >
                                                                {org.allocation.available}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-3 border-0">
                                                            <div className="d-flex align-items-center">
                                                                <div className="flex-grow-1 me-3">
                                                                    <ProgressBar 
                                                                        now={org.allocation.usage_percentage} 
                                                                        variant={usageStats.color}
                                                                        className="rounded-pill"
                                                                        style={{ height: '6px' }}
                                                                    />
                                                                </div>
                                                                <small className="fw-semibold text-nowrap">
                                                                    {org.allocation.usage_percentage}%
                                                                </small>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 border-0">
                                                            <Badge 
                                                                bg={org.isActive ? 'success' : 'danger'} 
                                                                className="fs-7 px-2 py-1"
                                                            >
                                                                <i className={`bi bi-${org.isActive ? 'check' : 'x'}-circle me-1`}></i>
                                                                {org.isActive ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </td>
                                                        <td className="pe-4 py-3 border-0 text-end">
                                                            <Button
                                                                variant="outline-warning"
                                                                size="sm"
                                                                onClick={() => openReduceModal(org)}
                                                                disabled={org.allocation.available === 0}
                                                                className="rounded-pill px-3"
                                                            >
                                                                <i className="bi bi-dash-circle me-1"></i>
                                                                Reduce
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Sidebar - Summary and Available Organizations */}
                <Col xl={4}>
                    <Row className="g-4">
                        {/* Allocation Summary */}
                        <Col xs={12}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Header className="bg-white border-0 py-3">
                                    <h6 className="mb-0 fw-semibold">
                                        <i className="bi bi-graph-up me-2 text-success"></i>
                                        Allocation Summary
                                    </h6>
                                </Card.Header>
                                <Card.Body>
                                    {allocationData?.summary && (
                                        <div className="space-y-3">
                                            {[
                                                { label: 'Total Child Organizations', value: allocationData.summary.total_children, icon: '🏢' },
                                                { label: 'Total Allocated to Children', value: allocationData.summary.total_allocated_to_children, icon: '📊' },
                                                { label: 'Total Used by Children', value: allocationData.summary.total_used_by_children, icon: '👥' },
                                                { label: 'Total Available in Children', value: allocationData.summary.total_available_in_children, icon: '✅' },
                                            ].map((item, index) => (
                                                <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                                    <div className="d-flex align-items-center">
                                                        <span className="me-2 fs-5">{item.icon}</span>
                                                        <small className="text-muted">{item.label}</small>
                                                    </div>
                                                    <strong className="text-dark">{item.value}</strong>
                                                </div>
                                            ))}
                                            <div className="d-flex justify-content-between align-items-center py-2">
                                                <div className="d-flex align-items-center">
                                                    <span className="me-2 fs-5">📈</span>
                                                    <small className="text-muted">Average Usage</small>
                                                </div>
                                                <Badge 
                                                    bg={getUsageStats(allocationData.summary.average_usage_percentage).color}
                                                    className="fs-7 px-2 py-1"
                                                >
                                                    {allocationData.summary.average_usage_percentage}%
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Available Organizations */}
                        <Col xs={12}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Header className="bg-white border-0 py-3">
                                    <h6 className="mb-0 fw-semibold">
                                        <i className="bi bi-list-ul me-2 text-info"></i>
                                        Available Organizations
                                    </h6>
                                </Card.Header>
                                <Card.Body>
                                    {availableOrgs.length === 0 ? (
                                        <div className="text-center py-3">
                                            <i className="bi bi-building-x display-6 text-muted opacity-50"></i>
                                            <p className="text-muted mt-2 mb-0">No organizations available</p>
                                        </div>
                                    ) : (
                                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {availableOrgs.map((org, index) => (
                                                <div 
                                                    key={org._id} 
                                                    className={`p-3 rounded mb-2 ${index % 2 === 0 ? 'bg-light' : 'bg-white'} border`}
                                                >
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div className="flex-grow-1">
                                                            <strong className="d-block text-dark">{org.domain}</strong>
                                                            <small className="text-muted d-block">{org.name}</small>
                                                            <Badge bg="outline-secondary" text="dark" className="fs-7 mt-1">
                                                                Level {org.hierarchyLevel}
                                                            </Badge>
                                                        </div>
                                                        <Badge 
                                                            bg={org.isActive ? 'success' : 'secondary'} 
                                                            className="fs-7"
                                                        >
                                                            {org.isActive ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>

            {/* Enhanced Modals */}
            {/* Allocate Users Modal */}
            <Modal show={showAllocateModal} onHide={() => setShowAllocateModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Allocate Users</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAllocateUsers}>
                    <Modal.Body className="pt-0">
                        <div className="bg-light rounded p-3 mb-3">
                            <div className="d-flex align-items-center">
                                <i className="bi bi-info-circle text-primary me-2"></i>
                                <small className="text-muted">
                                    Available for allocation: <strong>{allocationData?.parent?.available_for_self} users</strong>
                                </small>
                            </div>
                        </div>
                        
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">Select Organization</Form.Label>
                            {availableOrgs.length === 0 ? (
                                <div className="alert alert-warning mb-0">
                                    <small>No child organizations available for allocation.</small>
                                </div>
                            ) : (
                                <Form.Select
                                    value={allocateForm.childOrgId}
                                    onChange={(e) => setAllocateForm({
                                        ...allocateForm,
                                        childOrgId: e.target.value
                                    })}
                                    required
                                    className="border-2 py-2"
                                >
                                    <option value="">Choose organization...</option>
                                    {availableOrgs
                                        .filter(org => org.isActive)
                                        .map(org => (
                                            <option key={org._id} value={org.org_id}>
                                                {org.domain} - {org.name} (Level {org.hierarchyLevel})
                                            </option>
                                        ))
                                    }
                                </Form.Select>
                            )}
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Number of Users to Allocate</Form.Label>
                            <Form.Control
                                type="number"
                                min="1"
                                max={allocationData?.parent?.available_for_self}
                                value={allocateForm.usersToAllocate}
                                onChange={(e) => setAllocateForm({
                                    ...allocateForm,
                                    usersToAllocate: e.target.value
                                })}
                                required
                                disabled={availableOrgs.length === 0}
                                className="border-2 py-2"
                                placeholder="Enter number of users..."
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0">
                        <Button variant="light" onClick={() => setShowAllocateModal(false)}>
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            type="submit"
                            disabled={!allocateForm.childOrgId || !allocateForm.usersToAllocate || availableOrgs.length === 0}
                            className="px-4"
                        >
                            <i className="bi bi-check-circle me-2"></i>
                            Confirm Allocation
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Reduce Allocation Modal */}
            <Modal show={showReduceModal} onHide={() => setShowReduceModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold text-warning">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Reduce Allocation
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleReduceAllocation}>
                    <Modal.Body className="pt-0">
                        {selectedOrg && (
                            <>
                                <div className="bg-warning bg-opacity-10 rounded p-3 mb-3">
                                    <div className="d-flex align-items-center">
                                        <i className="bi bi-building text-warning me-2"></i>
                                        <strong>{selectedOrg.domain}</strong>
                                    </div>
                                </div>
                                
                                <Row className="g-2 mb-3">
                                    <Col sm={4}>
                                        <div className="text-center p-2 bg-light rounded">
                                            <div className="text-primary fw-bold fs-5">{selectedOrg.allocation.allocated}</div>
                                            <small className="text-muted">Current Allocation</small>
                                        </div>
                                    </Col>
                                    <Col sm={4}>
                                        <div className="text-center p-2 bg-light rounded">
                                            <div className="text-success fw-bold fs-5">{selectedOrg.allocation.used}</div>
                                            <small className="text-muted">Currently Used</small>
                                        </div>
                                    </Col>
                                    <Col sm={4}>
                                        <div className="text-center p-2 bg-light rounded">
                                            <div className="text-info fw-bold fs-5">{selectedOrg.allocation.available}</div>
                                            <small className="text-muted">Available</small>
                                        </div>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">Users to Reduce</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        max={selectedOrg.allocation.available}
                                        value={reduceForm.usersToReduce}
                                        onChange={(e) => setReduceForm({
                                            usersToReduce: e.target.value
                                        })}
                                        required
                                        className="border-2 py-2"
                                        placeholder="Enter number of users to reduce..."
                                    />
                                    <Form.Text className="text-muted">
                                        Maximum reduction possible: <strong>{selectedOrg.allocation.available} users</strong>
                                    </Form.Text>
                                </Form.Group>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="border-0">
                        <Button variant="light" onClick={() => setShowReduceModal(false)}>
                            Cancel
                        </Button>
                        <Button 
                            variant="warning" 
                            type="submit"
                            disabled={!reduceForm.usersToReduce}
                            className="px-4"
                        >
                            <i className="bi bi-dash-circle me-2"></i>
                            Confirm Reduction
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default UserAllocation;