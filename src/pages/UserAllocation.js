import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Container, Row, Col, Card, Table, Button, Form, Modal, 
    Alert, Spinner, Badge, ProgressBar, Dropdown, InputGroup, 
    ListGroup, Tabs, Tab, Toast, ToastContainer
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const UserAllocation = () => {
    const [allocationData, setAllocationData] = useState(null);
    const [childOrgs, setChildOrgs] = useState([]);
    const [availableOrgs, setAvailableOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Prorated states
    const [proratedData, setProratedData] = useState(null);
    const [billingPreview, setBillingPreview] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [proratedLoading, setProratedLoading] = useState(false);
    const [planRestrictions, setPlanRestrictions] = useState(null);
    
    // Modal states
    const [showAllocateModal, setShowAllocateModal] = useState(false);
    const [showReduceModal, setShowReduceModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showBillingModal, setShowBillingModal] = useState(false);
    const [showPlanDetailsModal, setShowPlanDetailsModal] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(null);
    
    // Form states
    const [allocateForm, setAllocateForm] = useState({ childOrgId: '', usersToAllocate: '' });
    const [reduceForm, setReduceForm] = useState({ usersToReduce: '' });
    const [upgradeForm, setUpgradeForm] = useState({ newUserCount: '' });
    const [paymentForm, setPaymentForm] = useState({ 
        paymentMethod: 'cashfree',
        paymentUrl: '',
        orderId: '',
        amount: 0
    });

    // Success toast state
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [paymentSuccessData, setPaymentSuccessData] = useState(null);
    
    // Payment polling
    const [paymentPollingInterval, setPaymentPollingInterval] = useState(null);

    const token = localStorage.getItem('access_token');
    const OrganizationId = localStorage.getItem('OrganizationId');
    const navigate = useNavigate();
    
    // Base URL
    const BASE_URL = 'https://codeaves.avessecurity.com/api';

    // API configuration
    const apiConfig = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    // ✅ Fetch all data
    const fetchAllData = async () => {
        try {
            setLoading(true);
            
            // Fetch allocation data
            const allocationResponse = await axios.get(
                `${BASE_URL}/oraganisation/allocation-overview`,
                apiConfig
            );
            
            if (allocationResponse.data.success) {
                setAllocationData(allocationResponse.data.data);
                setChildOrgs(allocationResponse.data.data.children || []);
            }
            
            // Fetch available organizations
            const orgsResponse = await axios.get(
                `${BASE_URL}/oraganisation/hierarchy`,
                apiConfig
            );
            
            if (orgsResponse.data.success) {
                const allChildOrgs = flattenOrganizations([orgsResponse.data.data]);
                const childOrganizations = allChildOrgs.filter(org => 
                    org._id !== orgsResponse.data.data._id && org.hierarchyLevel > 0
                );
                setAvailableOrgs(childOrganizations);
            }
            
            // Fetch billing preview
            await fetchBillingPreview();
            
            // Fetch plan restrictions
            await fetchPlanRestrictions();
            
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load allocation data');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Fetch billing preview
    const fetchBillingPreview = async () => {
        try {
            const response = await axios.get(
                `${BASE_URL}/Prorated/billing-preview/${OrganizationId}`,
                apiConfig
            );
            
            if (response.data.success) {
                setBillingPreview(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching billing preview:', err);
        }
    };

    // ✅ Fetch plan restrictions
    const fetchPlanRestrictions = async () => {
        try {
            const response = await axios.get(
                `${BASE_URL}/Prorated/plan-restrictions/${OrganizationId}`,
                apiConfig
            );
            
            if (response.data.success) {
                setPlanRestrictions(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching plan restrictions:', err);
        }
    };

    // ✅ Flatten organizations
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

    // ✅ Check for payment success in URL
    const checkPaymentSuccessInURL = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment');
        const encodedData = urlParams.get('data');
        
        if (paymentStatus === 'success' && encodedData) {
            try {
                const decodedData = JSON.parse(atob(decodeURIComponent(encodedData)));
                setPaymentSuccessData(decodedData);
                setShowSuccessToast(true);
                
                // Clear URL parameters
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Refresh data
                setTimeout(() => {
                    fetchAllData();
                }, 1000);
                
                setSuccess(`Payment successful! Upgraded to ${decodedData.newUserCount} users.`);
                
            } catch (error) {
                console.error('Error parsing payment success data:', error);
            }
        }
    };

    // ✅ Start payment status polling
    const startPaymentPolling = (orderId) => {
        // Clear any existing interval
        if (paymentPollingInterval) {
            clearInterval(paymentPollingInterval);
        }
        
        const interval = setInterval(async () => {
            const status = await checkPaymentStatus(orderId);
            if (status === 'success' || status === 'failed') {
                clearInterval(interval);
                setPaymentPollingInterval(null);
                localStorage.removeItem('pendingPaymentOrderId');
            }
        }, 3000);
        
        setPaymentPollingInterval(interval);
        localStorage.setItem('pendingPaymentOrderId', orderId);
    };

    // ✅ Stop payment polling
    const stopPaymentPolling = () => {
        if (paymentPollingInterval) {
            clearInterval(paymentPollingInterval);
            setPaymentPollingInterval(null);
        }
        localStorage.removeItem('pendingPaymentOrderId');
    };

    useEffect(() => {
        fetchAllData();
        checkPaymentSuccessInURL();
        
        // Check for pending payments on load
        const pendingOrderId = localStorage.getItem('pendingPaymentOrderId');
        if (pendingOrderId) {
            startPaymentPolling(pendingOrderId);
        }
        
        // Cleanup on unmount
        return () => {
            stopPaymentPolling();
        };
    }, []);

    // ========== PRORATED FUNCTIONS ==========

    // ✅ Calculate prorated upgrade
    const calculateProratedUpgrade = async () => {
        if (!upgradeForm.newUserCount || upgradeForm.newUserCount <= (allocationData?.parent?.total_app_users_allocated || 7)) {
            setError('New user count must be greater than current allocation');
            return;
        }

        try {
            setProratedLoading(true);
            const response = await axios.post(
                `${BASE_URL}/Prorated/calculate/${OrganizationId}`,
                { newUserCount: parseInt(upgradeForm.newUserCount) },
                apiConfig
            );

            if (response.data.success) {
                setProratedData(response.data.data);
                setError('');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to calculate upgrade');
        } finally {
            setProratedLoading(false);
        }
    };

    // ✅ Initiate prorated payment
    const initiateProratedPayment = async () => {
        try {
            setProratedLoading(true);
            const currentUrl = window.location.href;
            const baseUrl = window.location.origin + window.location.pathname;
            
            const response = await axios.post(
                `${BASE_URL}/Prorated/initiate/${OrganizationId}`,
                { 
                    newUserCount: parseInt(upgradeForm.newUserCount),
                    redirectUrl: baseUrl
                },
                apiConfig
            );

            if (response.data.success) {
                if (response.data.data.paymentRequired) {
                    // Store order ID for polling
                    const orderId = response.data.data.orderId;
                    
                    // Show payment details
                    setPaymentForm({
                        ...paymentForm,
                        paymentUrl: response.data.data.paymentUrl,
                        orderId: orderId,
                        amount: response.data.data.amount
                    });
                    
                    // Start polling for payment status
                    startPaymentPolling(orderId);
                    
                    // Show payment modal
                    setShowPaymentModal(true);
                } else {
                    // No payment required - show success
                    setPaymentSuccessData({
                        newUserCount: upgradeForm.newUserCount,
                        previousUserCount: allocationData?.parent?.total_app_users_allocated || 7,
                        amount: 0,
                        currency: 'INR'
                    });
                    setShowSuccessToast(true);
                    setShowUpgradeModal(false);
                    fetchAllData();
                    
                    setSuccess(response.data.data.message || 'Upgrade applied successfully!');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initiate payment');
        } finally {
            setProratedLoading(false);
        }
    };

    // ✅ Check payment status
    const checkPaymentStatus = async (orderId) => {
        try {
            const response = await axios.get(
                `${BASE_URL}/Prorated/payment-status`,
                {
                    ...apiConfig,
                    params: { orderId }
                }
            );

            if (response.data.success) {
                const paymentData = response.data.data;
                setPaymentStatus(paymentData);
                
                if (paymentData.status === 'success') {
                    // Payment successful - show success toast
                    setPaymentSuccessData({
                        paymentId: paymentData.paymentId,
                        orderId: paymentData.orderId,
                        amount: paymentData.amount,
                        currency: paymentData.currency,
                        newUserCount: paymentData.metadata.newUserCount,
                        previousUserCount: paymentData.metadata.currentUserCount,
                        organizationId: paymentData.organization.id
                    });
                    
                    setShowSuccessToast(true);
                    setShowPaymentModal(false);
                    stopPaymentPolling();
                    
                    // Refresh data
                    fetchAllData();
                    
                    setSuccess('Payment successful! Your organization has been upgraded.');
                    return 'success';
                } else if (paymentData.status === 'failed') {
                    setError('Payment failed. Please try again.');
                    return 'failed';
                }
                
                return paymentData.status;
            }
        } catch (err) {
            console.error('Error checking payment status:', err);
            return 'error';
        }
    };

    // ✅ Open upgrade modal
    const openUpgradeModal = () => {
        const currentUsers = allocationData?.parent?.total_app_users_allocated || 7;
        setUpgradeForm({ newUserCount: currentUsers + 1 });
        setProratedData(null);
        setShowUpgradeModal(true);
    };

    // ========== EXISTING FUNCTIONS ==========

    // ✅ Handle allocate users
    const handleAllocateUsers = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                childOrgId: allocateForm.childOrgId,
                usersToAllocate: parseInt(allocateForm.usersToAllocate)
            };

            const response = await axios.post(
                `${BASE_URL}/oraganisation/allocate-users`,
                payload,
                apiConfig
            );

            if (response.data.success) {
                setSuccess(`Successfully allocated ${allocateForm.usersToAllocate} users`);
                setShowAllocateModal(false);
                setAllocateForm({ childOrgId: '', usersToAllocate: '' });
                fetchAllData();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to allocate users');
        }
    };

    // ✅ Handle reduce allocation
    const handleReduceAllocation = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                `${BASE_URL}/oraganisation/reduce-allocation`,
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
                fetchAllData();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reduce allocation');
        }
    };

    // ✅ Open reduce modal
    const openReduceModal = (org) => {
        setSelectedOrg(org);
        setReduceForm({ usersToReduce: '' });
        setShowReduceModal(true);
    };

    // ✅ Get usage badge color
    const getUsageStats = (percentage) => {
        if (percentage === 0) return { color: 'secondary', icon: '🔵', label: 'Not Used' };
        if (percentage < 30) return { color: 'success', icon: '🟢', label: 'Low Usage' };
        if (percentage < 70) return { color: 'warning', icon: '🟡', label: 'Medium Usage' };
        return { color: 'danger', icon: '🔴', label: 'High Usage' };
    };

    // ✅ Refresh data
    const handleRefresh = () => {
        setLoading(true);
        fetchAllData();
    };

    // ✅ Open plan details modal
    const openPlanDetailsModal = () => {
        setShowPlanDetailsModal(true);
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

    // Calculate current utilization
    const currentUsers = allocationData?.parent?.total_app_users_allocated || 7;
    const planLimit = allocationData?.parent?.plan_limit || 7;
    const utilizationPercentage = planLimit > 0 ? Math.round((currentUsers / planLimit) * 100) : 0;

    return (
        <Container fluid className="px-4 py-3">
            {/* Success Toast */}
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1060 }}>
                <Toast 
                    show={showSuccessToast} 
                    onClose={() => setShowSuccessToast(false)}
                    bg="success"
                    autohide
                    delay={10000}
                >
                    <Toast.Header className="bg-success text-white border-0">
                        <strong className="me-auto d-flex align-items-center">
                            <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                            <span className="fs-6">Payment Successful!</span>
                        </strong>
                        <button 
                            type="button" 
                            className="btn-close btn-close-white" 
                            onClick={() => setShowSuccessToast(false)}
                        ></button>
                    </Toast.Header>
                    <Toast.Body className="text-white bg-success">
                        {paymentSuccessData && (
                            <div>
                                <h5 className="mb-3">🎉 Organization Upgraded Successfully!</h5>
                                
                                <div className="bg-white bg-opacity-10 rounded p-3 mb-3">
                                    <div className="row g-2">
                                        <div className="col-6">
                                            <div className="text-center">
                                                <div className="text-warning fw-bold fs-4">{paymentSuccessData.previousUserCount}</div>
                                                <small className="opacity-75">Previous Users</small>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-center">
                                                <div className="text-success fw-bold fs-4">{paymentSuccessData.newUserCount}</div>
                                                <small className="opacity-75">New Users</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {paymentSuccessData.amount > 0 && (
                                    <div className="mb-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="opacity-75">Amount Paid:</span>
                                            <strong className="fs-5">₹{paymentSuccessData.amount.toFixed(2)} {paymentSuccessData.currency}</strong>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="bg-white bg-opacity-10 rounded p-2 mb-3">
                                    <h6 className="mb-2">Updated Fields:</h6>
                                    <div className="small">
                                        <div className="d-flex align-items-center mb-1">
                                            <i className="bi bi-check-lg text-success me-2"></i>
                                            <span><strong>plan_restrictions.max_total_app_users</strong>: {paymentSuccessData.newUserCount}</span>
                                        </div>
                                        <div className="d-flex align-items-center mb-1">
                                            <i className="bi bi-check-lg text-success me-2"></i>
                                            <span><strong>user_allocation.total_app_users_allocated</strong>: {paymentSuccessData.newUserCount}</span>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-check-lg text-success me-2"></i>
                                            <span><strong>Total_Users</strong>: {paymentSuccessData.newUserCount}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="d-grid gap-2">
                                    <Button 
                                        variant="outline-light" 
                                        size="sm"
                                        onClick={() => {
                                            setShowSuccessToast(false);
                                            fetchAllData();
                                        }}
                                        className="rounded-pill"
                                    >
                                        <i className="bi bi-arrow-clockwise me-1"></i>
                                        Refresh View
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Toast.Body>
                </Toast>
            </ToastContainer>

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
                            className="rounded-pill"
                        >
                            <i className="bi bi-arrow-clockwise me-2"></i>
                            Refresh
                        </Button>
                        <Button 
                            variant="outline-info" 
                            onClick={openPlanDetailsModal}
                            size="sm"
                            className="rounded-pill"
                        >
                            <i className="bi bi-card-checklist me-2"></i>
                            Plan Details
                        </Button>
                        <Button 
                            variant="outline-primary" 
                            onClick={() => setShowBillingModal(true)}
                            size="sm"
                            className="rounded-pill"
                        >
                            <i className="bi bi-receipt me-2"></i>
                            Billing
                        </Button>
                        <Button 
                            variant="success" 
                            onClick={openUpgradeModal}
                            className="shadow-sm rounded-pill"
                        >
                            <i className="bi bi-arrow-up-circle me-2"></i>
                            Add User
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={() => setShowAllocateModal(true)}
                            disabled={!allocationData?.parent?.available_for_self || availableOrgs.length === 0}
                            className="shadow-sm rounded-pill"
                        >
                            <i className="bi bi-person-plus me-2"></i>
                            Allocate Users
                        </Button>
                    </div>
                </Col>
            </Row>

            {/* Alerts */}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')} className="border-0 shadow-sm rounded-pill">
                    <div className="d-flex align-items-center">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        {error}
                    </div>
                </Alert>
            )}
            {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess('')} className="border-0 shadow-sm rounded-pill">
                    <div className="d-flex align-items-center">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        {success}
                    </div>
                </Alert>
            )}

            {/* Enhanced Summary Cards with Plan Info */}
            {allocationData?.parent && (
                <Row className="mb-4 g-3">
                    <Col xl={3} lg={6}>
                        <Card className="h-100 border-0 shadow-sm bg-gradient-primary text-white">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="card-title text-white-50 mb-2">Current Plan</h6>
                                        <h2 className="fw-bold mb-0">{currentUsers} Users</h2>
                                        <small>Limit: {planLimit} users</small>
                                        <div className="mt-2">
                                            <ProgressBar 
                                                now={utilizationPercentage} 
                                                variant={utilizationPercentage > 90 ? 'warning' : 'light'}
                                                className="mt-1"
                                            />
                                            <small>{utilizationPercentage}% utilized</small>
                                        </div>
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
                                        <small>Active users in hierarchy</small>
                                        {billingPreview?.scheduledChange && (
                                            <Badge bg="warning" className="mt-2">
                                                <i className="bi bi-clock me-1"></i>
                                                Change Pending
                                            </Badge>
                                        )}
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

            {/* Main Content Area with Tabs */}
            <Row className="g-4">
                <Col xs={12}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <Tabs defaultActiveKey="allocations" className="border-0">
                                <Tab eventKey="allocations" title={
                                    <div className="d-flex align-items-center">
                                        <i className="bi bi-diagram-3 me-2"></i>
                                        Child Organizations
                                        <Badge bg="light" text="dark" className="ms-2">
                                            {childOrgs.length}
                                        </Badge>
                                    </div>
                                }>
                                    <Card.Body className="p-3">
                                        {childOrgs.length === 0 ? (
                                            <div className="text-center py-5">
                                                <i className="bi bi-inbox display-1 text-muted opacity-50"></i>
                                                <h5 className="mt-3 text-muted">No Child Organizations</h5>
                                                <p className="text-muted mb-3">You haven't allocated any users to child organizations yet.</p>
                                                <Button 
                                                    variant="outline-primary" 
                                                    onClick={() => setShowAllocateModal(true)}
                                                    className="rounded-pill"
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
                                                                            className="rounded-pill px-3 me-2"
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
                                </Tab>
                                
                                <Tab eventKey="billing" title={
                                    <div className="d-flex align-items-center">
                                        <i className="bi bi-credit-card me-2"></i>
                                        Billing & Upgrades
                                    </div>
                                }>
                                    <Card.Body className="p-4">
                                        <Row>
                                            <Col lg={6}>
                                                <Card className="border-0 shadow-sm mb-4">
                                                    <Card.Header className="bg-white border-0">
                                                        <h5 className="mb-0">Current Billing</h5>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        {billingPreview?.current ? (
                                                            <div className="space-y-3">
                                                                <div className="d-flex justify-content-between align-items-center py-2">
                                                                    <span className="text-muted">Current Users:</span>
                                                                    <strong>{billingPreview.current.userCount}</strong>
                                                                </div>
                                                                <div className="d-flex justify-content-between align-items-center py-2">
                                                                    <span className="text-muted">Monthly Amount:</span>
                                                                    <strong>₹{billingPreview.current.monthlyAmount.toFixed(2)}</strong>
                                                                </div>
                                                                <div className="d-flex justify-content-between align-items-center py-2">
                                                                    <span className="text-muted">Per User Price:</span>
                                                                    <strong>₹{billingPreview.current.perUserPrice}</strong>
                                                                </div>
                                                                <div className="d-flex justify-content-between align-items-center py-2">
                                                                    <span className="text-muted">Currency:</span>
                                                                    <strong>{billingPreview.current.currency}</strong>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-muted">No billing information available</p>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            
                                            <Col lg={6}>
                                                <Card className="border-0 shadow-sm mb-4">
                                                    <Card.Header className="bg-white border-0">
                                                        <h5 className="mb-0">Quick Upgrade</h5>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        <Form onSubmit={(e) => {
                                                            e.preventDefault();
                                                            calculateProratedUpgrade();
                                                        }}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>New User Count</Form.Label>
                                                                <InputGroup>
                                                                    <Form.Control
                                                                        type="number"
                                                                        min={currentUsers + 1}
                                                                        max={currentUsers + 50}
                                                                        value={upgradeForm.newUserCount}
                                                                        onChange={(e) => setUpgradeForm({
                                                                            newUserCount: e.target.value
                                                                        })}
                                                                        placeholder="Enter new user count"
                                                                        className="rounded-start"
                                                                    />
                                                                    <Button 
                                                                        variant="primary"
                                                                        type="submit"
                                                                        disabled={!upgradeForm.newUserCount}
                                                                        className="rounded-end"
                                                                    >
                                                                        Calculate
                                                                    </Button>
                                                                </InputGroup>
                                                            </Form.Group>
                                                        </Form>
                                                        
                                                        {proratedLoading && (
                                                            <div className="text-center py-3">
                                                                <Spinner size="sm" animation="border" /> Calculating...
                                                            </div>
                                                        )}
                                                        
                                                        {proratedData && (
                                                            <div className="bg-light rounded p-3 mt-3">
                                                                <h6 className="mb-3">Upgrade Summary</h6>
                                                                <div className="space-y-2">
                                                                    <div className="d-flex justify-content-between">
                                                                        <small>Prorated Amount:</small>
                                                                        <strong>₹{proratedData.upgrade.proratedAmount.toFixed(2)}</strong>
                                                                    </div>
                                                                    <div className="d-flex justify-content-between">
                                                                        <small>Next Month:</small>
                                                                        <strong>₹{proratedData.nextCycle.monthlyAmount.toFixed(2)}</strong>
                                                                    </div>
                                                                    <hr className="my-2" />
                                                                    <div className="d-flex justify-content-between">
                                                                        <small>Total Today:</small>
                                                                        <strong className="text-success">
                                                                            ₹{proratedData.summary.immediatePayment.toFixed(2)}
                                                                        </strong>
                                                                    </div>
                                                                    <Button 
                                                                        variant="success" 
                                                                        className="w-100 mt-3 rounded-pill"
                                                                        onClick={initiateProratedPayment}
                                                                        disabled={proratedLoading}
                                                                    >
                                                                        {proratedLoading ? (
                                                                            <>
                                                                                <Spinner size="sm" animation="border" className="me-2" />
                                                                                Processing...
                                                                            </>
                                                                        ) : (
                                                                            'Proceed to Payment'
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Tab>
                            </Tabs>
                        </Card.Header>
                    </Card>
                </Col>
            </Row>

            {/* ========== MODALS ========== */}

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
                        <Button variant="light" onClick={() => setShowAllocateModal(false)} className="rounded-pill">
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            type="submit"
                            disabled={!allocateForm.childOrgId || !allocateForm.usersToAllocate || availableOrgs.length === 0}
                            className="px-4 rounded-pill"
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
                        <Button variant="light" onClick={() => setShowReduceModal(false)} className="rounded-pill">
                            Cancel
                        </Button>
                        <Button 
                            variant="warning" 
                            type="submit"
                            disabled={!reduceForm.usersToReduce}
                            className="px-4 rounded-pill"
                        >
                            <i className="bi bi-dash-circle me-2"></i>
                            Confirm Reduction
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Upgrade Plan Modal */}
            <Modal show={showUpgradeModal} onHide={() => setShowUpgradeModal(false)} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">
                        <i className="bi bi-arrow-up-circle text-success me-2"></i>
                        Upgrade Your Plan
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    <Tabs defaultActiveKey="calculate" className="mb-4">
                        <Tab eventKey="calculate" title="Calculate Upgrade">
                            <div className="p-3">
                                <Form onSubmit={(e) => {
                                    e.preventDefault();
                                    calculateProratedUpgrade();
                                }}>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-4">
                                                <Form.Label className="fw-semibold">Current Users</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={currentUsers}
                                                    readOnly
                                                    className="bg-light"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-4">
                                                <Form.Label className="fw-semibold">New User Count</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    min={currentUsers + 1}
                                                    max={currentUsers + 100}
                                                    value={upgradeForm.newUserCount}
                                                    onChange={(e) => setUpgradeForm({
                                                        newUserCount: e.target.value
                                                    })}
                                                    required
                                                    placeholder={`Minimum: ${currentUsers + 1}`}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    
                                    <div className="text-center">
                                        <Button 
                                            variant="primary" 
                                            type="submit"
                                            disabled={!upgradeForm.newUserCount}
                                            className="px-4 rounded-pill"
                                        >
                                            {proratedLoading ? (
                                                <>
                                                    <Spinner size="sm" animation="border" className="me-2" />
                                                    Calculating...
                                                </>
                                            ) : (
                                                'Calculate Added Cost'
                                            )}
                                        </Button>
                                    </div>
                                </Form>

                                {proratedData && (
                                    <div className="mt-4">
                                        <Card className="border-success">
                                            <Card.Header className="bg-success text-white">
                                                <h6 className="mb-0">Upgrade Summary</h6>
                                            </Card.Header>
                                            <Card.Body>
                                                <Row className="g-3">
                                                    <Col md={6}>
                                                        <div className="bg-light rounded p-3">
                                                            <small className="text-muted">Current Plan</small>
                                                            <h5 className="mb-0">{proratedData.current.userCount} Users</h5>
                                                            <div className="text-muted">
                                                                ₹{proratedData.current.monthlyAmount.toFixed(2)}/month
                                                            </div>
                                                        </div>
                                                    </Col>
                                                    <Col md={6}>
                                                        <div className="bg-light rounded p-3">
                                                            <small className="text-muted">New Plan</small>
                                                            <h5 className="mb-0">{proratedData.upgrade.userCount} Users</h5>
                                                            <div className="text-muted">
                                                                ₹{proratedData.nextCycle.monthlyAmount.toFixed(2)}/month
                                                            </div>
                                                        </div>
                                                    </Col>
                                                </Row>
                                                
                                                <div className="mt-4 p-3 bg-warning bg-opacity-10 rounded">
                                                    <h6 className="mb-3">Prorated Payment Details</h6>
                                                    <div className="space-y-2">
                                                        <div className="d-flex justify-content-between">
                                                            <span>Additional Users:</span>
                                                            <strong>{proratedData.upgrade.additionalUsers}</strong>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span>Days Remaining:</span>
                                                            <strong>{proratedData.upgrade.proratedDays} days</strong>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span>Prorated Amount:</span>
                                                            <strong className="text-success">
                                                                ₹{proratedData.upgrade.proratedAmount.toFixed(2)}
                                                            </strong>
                                                        </div>
                                                        <hr />
                                                        <div className="d-flex justify-content-between">
                                                            <span>Next Billing Cycle:</span>
                                                            <strong>₹{proratedData.nextCycle.monthlyAmount.toFixed(2)}/month</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <Button 
                                                    variant="success" 
                                                    className="w-100 mt-4 rounded-pill"
                                                    onClick={initiateProratedPayment}
                                                    disabled={proratedLoading}
                                                >
                                                    {proratedLoading ? (
                                                        <>
                                                            <Spinner size="sm" animation="border" className="me-2" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-credit-card me-2"></i>
                                                            Pay ₹{proratedData.upgrade.proratedAmount.toFixed(2)} & Upgrade
                                                        </>
                                                    )}
                                                </Button>
                                                
                                                <div className="text-center mt-3">
                                                    <small className="text-muted">
                                                        You'll pay ₹{proratedData.upgrade.proratedAmount.toFixed(2)} today for the remaining {proratedData.upgrade.proratedDays} days, 
                                                        then ₹{proratedData.nextCycle.monthlyAmount.toFixed(2)}/month starting next billing cycle.
                                                    </small>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        </Tab>
                        
                        <Tab eventKey="preview" title="Billing Preview">
                            <div className="p-3">
                                {billingPreview ? (
                                    <div className="space-y-3">
                                        <Card className="border-0 shadow-sm">
                                            <Card.Body>
                                                <h6 className="mb-3">Current Subscription</h6>
                                                <div className="space-y-2">
                                                    <div className="d-flex justify-content-between">
                                                        <span className="text-muted">Users:</span>
                                                        <strong>{billingPreview.current.userCount}</strong>
                                                    </div>
                                                    <div className="d-flex justify-content-between">
                                                        <span className="text-muted">Monthly Amount:</span>
                                                        <strong>₹{billingPreview.current.monthlyAmount.toFixed(2)}</strong>
                                                    </div>
                                                    <div className="d-flex justify-content-between">
                                                        <span className="text-muted">Currency:</span>
                                                        <strong>{billingPreview.current.currency}</strong>
                                                    </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                        
                                        {billingPreview.scheduledChange && (
                                            <Card className="border-warning">
                                                <Card.Header className="bg-warning text-white">
                                                    <h6 className="mb-0">Scheduled Change</h6>
                                                </Card.Header>
                                                <Card.Body>
                                                    <div className="space-y-2">
                                                        <div className="d-flex justify-content-between">
                                                            <span>From:</span>
                                                            <strong>{billingPreview.scheduledChange.from} users</strong>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span>To:</span>
                                                            <strong>{billingPreview.scheduledChange.to} users</strong>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span>Effective Date:</span>
                                                            <strong>
                                                                {new Date(billingPreview.scheduledChange.effectiveDate).toLocaleDateString()}
                                                            </strong>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span>Status:</span>
                                                            <Badge bg="warning" className="rounded-pill">
                                                                {billingPreview.scheduledChange.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted">No billing information available</p>
                                    </div>
                                )}
                            </div>
                        </Tab>
                    </Tabs>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="light" onClick={() => setShowUpgradeModal(false)} className="rounded-pill">
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Payment Modal */}
            <Modal show={showPaymentModal} onHide={() => {
                setShowPaymentModal(false);
                stopPaymentPolling();
            }} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">
                        <i className="bi bi-credit-card text-primary me-2"></i>
                        Complete Payment
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    <div className="text-center py-4">
                        <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3">
                            <i className="bi bi-credit-card-2-front text-primary fs-1"></i>
                        </div>
                        <h5 className="mb-3">Payment Required</h5>
                        <p className="text-muted mb-4">
                            Please complete the payment to upgrade your organization to {upgradeForm.newUserCount} users.
                        </p>
                        
                        <div className="bg-light rounded p-4 mb-4">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Amount:</span>
                                <strong className="fs-5">₹{paymentForm.amount}</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Order ID:</span>
                                <code className="bg-white p-1 rounded">{paymentForm.orderId}</code>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span className="text-muted">Payment Method:</span>
                                <Badge bg="primary" className="rounded-pill">{paymentForm.paymentMethod}</Badge>
                            </div>
                        </div>
                        
                        <div className="d-grid gap-2">
                            <Button 
                                variant="primary" 
                                size="lg"
                                onClick={() => {
                                    // Open payment page in new tab
                                    window.open(paymentForm.paymentUrl, '_blank');
                                    
                                    // Show waiting message
                                    setSuccess('Payment page opened. Please complete the payment in the new tab.');
                                }}
                                className="rounded-pill"
                            >
                                <i className="bi bi-arrow-up-right-square me-2"></i>
                                Pay Now on Cashfree
                            </Button>
                            
                            <Button 
                                variant="outline-secondary"
                                onClick={() => {
                                    navigator.clipboard.writeText(paymentForm.paymentUrl);
                                    setSuccess('Payment link copied to clipboard');
                                }}
                                className="rounded-pill"
                            >
                                <i className="bi bi-copy me-2"></i>
                                Copy Payment Link
                            </Button>
                        </div>
                        
                        <div className="mt-4">
                            <Alert variant="info" className="mb-0 rounded-pill">
                                <small>
                                    <i className="bi bi-info-circle me-1"></i>
                                    After completing payment, this page will automatically refresh and show a success message.
                                    Your organization will be immediately upgraded to {upgradeForm.newUserCount} users.
                                </small>
                            </Alert>
                        </div>
                        
                        {/* Payment Status Indicator */}
                        {paymentStatus && (
                            <div className="mt-4">
                                <div className="d-flex align-items-center justify-content-center">
                                    {paymentStatus.status === 'pending' && (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            <span>Payment processing...</span>
                                        </>
                                    )}
                                    {paymentStatus.status === 'success' && (
                                        <div className="text-success">
                                            <i className="bi bi-check-circle-fill me-2"></i>
                                            Payment completed successfully!
                                        </div>
                                    )}
                                    {paymentStatus.status === 'failed' && (
                                        <div className="text-danger">
                                            <i className="bi bi-x-circle-fill me-2"></i>
                                            Payment failed. Please try again.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="light" onClick={() => {
                        setShowPaymentModal(false);
                        stopPaymentPolling();
                    }} className="rounded-pill">
                        Close
                    </Button>
                    <Button 
                        variant="outline-primary" 
                        onClick={() => checkPaymentStatus(paymentForm.orderId)}
                        className="rounded-pill"
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Check Payment Status
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Billing Modal */}
            <Modal show={showBillingModal} onHide={() => setShowBillingModal(false)} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">
                        <i className="bi bi-receipt text-primary me-2"></i>
                        Billing & Subscription
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    {billingPreview ? (
                        <div className="space-y-4">
                            {/* Current Plan */}
                            <Card className="border-0 shadow-sm">
                                <Card.Body>
                                    <h6 className="mb-3">Current Plan</h6>
                                    <Row>
                                        <Col md={6}>
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="bg-primary bg-opacity-10 rounded p-2 me-3">
                                                    <i className="bi bi-person-badge text-primary"></i>
                                                </div>
                                                <div>
                                                    <h4 className="mb-0">{billingPreview.current.userCount} Users</h4>
                                                    <small className="text-muted">Active subscription</small>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="bg-success bg-opacity-10 rounded p-2 me-3">
                                                    <i className="bi bi-currency-rupee text-success"></i>
                                                </div>
                                                <div>
                                                    <h4 className="mb-0">₹{billingPreview.current.monthlyAmount.toFixed(2)}</h4>
                                                    <small className="text-muted">Monthly amount</small>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Usage Stats */}
                            <Card className="border-0 shadow-sm">
                                <Card.Body>
                                    <h6 className="mb-3">Usage Statistics</h6>
                                    <div className="space-y-2">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span>Plan Utilization:</span>
                                            <div className="d-flex align-items-center">
                                                <ProgressBar 
                                                    now={utilizationPercentage} 
                                                    style={{ width: '100px', height: '8px' }}
                                                    variant={utilizationPercentage > 90 ? 'warning' : 'success'}
                                                    className="me-2"
                                                />
                                                <strong>{utilizationPercentage}%</strong>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span>Current Users:</span>
                                            <strong>{currentUsers} / {planLimit}</strong>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Scheduled Changes */}
                            {billingPreview.scheduledChange && (
                                <Card className="border-warning">
                                    <Card.Header className="bg-warning text-white">
                                        <h6 className="mb-0">Pending Changes</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="space-y-2">
                                            <div className="d-flex justify-content-between">
                                                <span>Change Type:</span>
                                                <Badge bg="warning" className="rounded-pill">
                                                    {billingPreview.scheduledChange.from > billingPreview.scheduledChange.to ? 'Downgrade' : 'Upgrade'}
                                                </Badge>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span>From:</span>
                                                <strong>{billingPreview.scheduledChange.from} users</strong>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span>To:</span>
                                                <strong>{billingPreview.scheduledChange.to} users</strong>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span>Effective Date:</span>
                                                <strong>{new Date(billingPreview.scheduledChange.effectiveDate).toLocaleDateString()}</strong>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span>Status:</span>
                                                <Badge bg={billingPreview.scheduledChange.status === 'applied' ? 'success' : 'warning'} className="rounded-pill">
                                                    {billingPreview.scheduledChange.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Upgrade CTA */}
                            <div className="text-center mt-4">
                                <Button 
                                    variant="success" 
                                    size="lg"
                                    onClick={() => {
                                        setShowBillingModal(false);
                                        openUpgradeModal();
                                    }}
                                    className="px-5 rounded-pill"
                                >
                                    <i className="bi bi-arrow-up-circle me-2"></i>
                                    Upgrade Plan
                                </Button>
                                <p className="text-muted mt-2">
                                    Need more users? Upgrade your plan anytime with prorated billing.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3 text-muted">Loading billing information...</p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="light" onClick={() => setShowBillingModal(false)} className="rounded-pill">
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Plan Details Modal */}
            <Modal show={showPlanDetailsModal} onHide={() => setShowPlanDetailsModal(false)} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">
                        <i className="bi bi-card-checklist text-primary me-2"></i>
                        Plan Restrictions & Details
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    {planRestrictions ? (
                        <div className="space-y-4">
                            {/* Plan Restrictions */}
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-0">
                                    <h5 className="mb-0">
                                        <i className="bi bi-shield-check text-primary me-2"></i>
                                        Plan Restrictions
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <div className="bg-light rounded p-3">
                                                <div className="d-flex align-items-center mb-2">
                                                    <div className="bg-primary bg-opacity-10 rounded p-2 me-3">
                                                        <i className="bi bi-people text-primary"></i>
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-0">Max App Users</h6>
                                                        <strong className="fs-4">{planRestrictions.plan_restrictions.max_total_app_users || 7}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="bg-light rounded p-3">
                                                <div className="d-flex align-items-center mb-2">
                                                    <div className="bg-success bg-opacity-10 rounded p-2 me-3">
                                                        <i className="bi bi-diagram-3 text-success"></i>
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-0">Max Sub Organizations</h6>
                                                        <strong className="fs-4">{planRestrictions.plan_restrictions.max_total_sub_orgs || 2}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="bg-light rounded p-3">
                                                <div className="d-flex align-items-center mb-2">
                                                    <div className="bg-warning bg-opacity-10 rounded p-2 me-3">
                                                        <i className="bi bi-hdd text-warning"></i>
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-0">Storage Limit</h6>
                                                        <strong className="fs-4">{planRestrictions.plan_restrictions.storage_limit_gb || 20} GB</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="bg-light rounded p-3">
                                                <div className="d-flex align-items-center mb-2">
                                                    <div className="bg-info bg-opacity-10 rounded p-2 me-3">
                                                        <i className="bi bi-box-seam text-info"></i>
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-0">Max Products</h6>
                                                        <strong className="fs-4">{planRestrictions.plan_restrictions.max_total_products || 0}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                    
                                    <div className="mt-4">
                                        <h6 className="mb-3">Features</h6>
                                        <div className="row g-2">
                                            <div className="col-6">
                                                <div className="d-flex align-items-center">
                                                    <i className={`bi bi-${planRestrictions.plan_restrictions.user_allocation_enabled ? 'check' : 'x'}-circle-fill ${planRestrictions.plan_restrictions.user_allocation_enabled ? 'text-success' : 'text-danger'} me-2`}></i>
                                                    <span>User Allocation</span>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="d-flex align-items-center">
                                                    <i className={`bi bi-${planRestrictions.plan_restrictions.storage_allocation_enabled ? 'check' : 'x'}-circle-fill ${planRestrictions.plan_restrictions.storage_allocation_enabled ? 'text-success' : 'text-danger'} me-2`}></i>
                                                    <span>Storage Allocation</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* User Allocation Summary */}
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-0">
                                    <h5 className="mb-0">
                                        <i className="bi bi-person-lines-fill text-success me-2"></i>
                                        User Allocation Summary
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <div className="bg-success bg-opacity-10 rounded p-3">
                                                <h6 className="text-success mb-2">Total Allocated</h6>
                                                <div className="d-flex align-items-center">
                                                    <i className="bi bi-people-fill text-success fs-3 me-3"></i>
                                                    <div>
                                                        <h2 className="mb-0">{planRestrictions.user_allocation.total_app_users_allocated || 0}</h2>
                                                        <small className="text-muted">Users</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="bg-primary bg-opacity-10 rounded p-3">
                                                <h6 className="text-primary mb-2">Available for Self</h6>
                                                <div className="d-flex align-items-center">
                                                    <i className="bi bi-person-plus text-primary fs-3 me-3"></i>
                                                    <div>
                                                        <h2 className="mb-0">{planRestrictions.user_allocation.available_for_self || 0}</h2>
                                                        <small className="text-muted">Available</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Current Usage */}
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-0">
                                    <h5 className="mb-0">
                                        <i className="bi bi-speedometer2 text-warning me-2"></i>
                                        Current Usage
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="d-flex justify-content-between mb-1">
                                                <span>Total Users</span>
                                                <strong>{planRestrictions.Total_Users || 0}</strong>
                                            </div>
                                            <ProgressBar 
                                                now={(planRestrictions.Total_Users || 0) / (planRestrictions.plan_restrictions.max_total_app_users || 7) * 100} 
                                                variant="info"
                                                className="rounded-pill"
                                            />
                                        </div>
                                        
                                        <div className="row g-3">
                                            <Col md={4}>
                                                <div className="text-center p-2 border rounded">
                                                    <div className="text-primary fw-bold fs-5">{planRestrictions.userSeats.total || 0}</div>
                                                    <small className="text-muted">Total Seats</small>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="text-center p-2 border rounded">
                                                    <div className="text-success fw-bold fs-5">{planRestrictions.userSeats.active || 0}</div>
                                                    <small className="text-muted">Active</small>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="text-center p-2 border rounded">
                                                    <div className="text-info fw-bold fs-5">{planRestrictions.userSeats.available || 0}</div>
                                                    <small className="text-muted">Available</small>
                                                </div>
                                            </Col>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3 text-muted">Loading plan details...</p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="light" onClick={() => setShowPlanDetailsModal(false)} className="rounded-pill">
                        Close
                    </Button>
                    <Button variant="primary" onClick={openUpgradeModal} className="rounded-pill">
                        <i className="bi bi-arrow-up-circle me-2"></i>
                        Upgrade Plan
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default UserAllocation;