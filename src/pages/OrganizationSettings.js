import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Nav,
  Spinner,
  Alert,
  Button,
  ListGroup,
  Table,
  Modal,
  Tooltip,
  OverlayTrigger,
  Tabs,
  Tab
} from 'react-bootstrap';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  ArrowRepeat,
  Download,
  Clock,
  CurrencyDollar,
  Person,
  ChevronRight,
  BoxArrowUpRight,
  InfoCircle,
  Shield,
Lightning,
  Star,
  Hdd,
  People,
  Building,
  Box,
  Home,
  ArrowRight,
  Award,
  Globe,
  Database,
  Cpu,
  Lock,
  Gem,
  Trophy,
  Check,
  X,
  EmojiSmile,
  StarFill,
  AwardFill,
  TrophyFill,
  GemFill,
  Bolt,
  LightningCharge
} from 'react-bootstrap-icons';

function OrganizationSettings() {
  const [organization, setOrganization] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [teams, setTeams] = useState(null);
  const [billingData, setBillingData] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState({
    org: true,
    users: false,
    teams: false,
    billing: false
  });
  
  // States for plans modal
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [allPlans, setAllPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [plansLoading, setPlansLoading] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [activePlanTab, setActivePlanTab] = useState('standard');
  const [expandedFeatures, setExpandedFeatures] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setError('No access token found.');
          return;
        }

        // Fetch organization data
        setLoading(prev => ({...prev, org: true}));
        const orgResponse = await axios.get('https://codeaves.avessecurity.com/api/oraganisation/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrganization(orgResponse.data);
        setLoading(prev => ({...prev, org: false}));

        // Fetch billing data when on billing tab
        if (activeTab === 'billing') {
          setLoading(prev => ({...prev, billing: true}));
          try {
            const billingResponse = await axios.get('https://codeaves.avessecurity.com/api/oraganisation/Profile', {
              headers: { Authorization: `Bearer ${token}` },
            });
            console.log('Billing Token',token)
            setBillingData(billingResponse.data);
          } catch (billingErr) {
            console.log('Could not fetch billing data:', billingErr.message);
          }
          setLoading(prev => ({...prev, billing: false}));
        }

        // Fetch user status if on members tab or overview
        if (activeTab === 'members' || activeTab === 'overview') {
          setLoading(prev => ({...prev, users: true}));
          const userResponse = await axios.get('https://codeaves.avessecurity.com/api/users/Status', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserStatus(userResponse.data);
          setLoading(prev => ({...prev, users: false}));
        }

        // Fetch teams if on overview tab
        if (activeTab === 'overview') {
          setLoading(prev => ({...prev, teams: true}));
          const teamsResponse = await axios.get('https://codeaves.avessecurity.com/api/firebase/getAllTeamName/Dashbard', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setTeams(teamsResponse.data);
          setLoading(prev => ({...prev, teams: false}));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data.');
        setLoading({org: false, users: false, teams: false, billing: false});
      }
    };

    fetchData();
  }, [activeTab]);

  // Fetch all plans when modal opens
  const fetchAllPlans = async () => {
    try {
      setPlansLoading(true);
      const token = localStorage.getItem("access_token");
      
      const response = await axios.get('https://codeaves.avessecurity.com/api/plans/getAll', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const { plans, userPlans } = response.data;
      setAllPlans(plans || []);
      
      // Set current plan
      if (userPlans && userPlans.length > 0) {
        setCurrentPlan(userPlans[0]);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setPlansLoading(false);
    }
  };

  const openPlansModal = async () => {
    await fetchAllPlans();
    setShowPlansModal(true);
  };

  const toggleFeatures = (planId) => {
    setExpandedFeatures(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }));
  };

  // Function to render feature icon
  const renderFeatureIcon = (feature, isPopular = false) => {
    const isEnabled = feature.f_value === "true";
    
    if (isEnabled) {
      return <CheckCircle className={isPopular ? "text-success" : "text-success"} size={16} />;
    } else {
      return <XCircle className={isPopular ? "text-danger" : "text-danger"} size={16} />;
    }
  };

  // Define plan order
  const planOrder = ['Free Trial', 'Basic Security', 'Growth Security', 'Advanced Plan'];
  
  // Sort plans
  const sortedPlans = [...allPlans].sort((a, b) => {
    const indexA = planOrder.findIndex(name => 
      a.plan_name.toLowerCase().includes(name.toLowerCase().replace(' plan', ''))
    );
    const indexB = planOrder.findIndex(name => 
      b.plan_name.toLowerCase().includes(name.toLowerCase().replace(' plan', ''))
    );
    
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.monthly_price - b.monthly_price;
  });

  // Filter plans
  const productPlans = sortedPlans.filter(p => 
    !p.plan_name.toLowerCase().includes('enterprise')
  );
  
  const servicePlans = sortedPlans.filter(p => 
    p.plan_name.toLowerCase().includes('enterprise')
  );

  // Get plan icon based on plan type - using available icons
  const getPlanIcon = (planType) => {
    switch (planType) {
      case 'free': return <Star className="text-warning" size={24} />;
      case 'basic': return <Shield className="text-primary" size={24} />;
      case 'growth': return <Trophy className="text-warning" size={24} />;
      case 'advanced': return <Lightning className="text-info" size={24} />;
      case 'enterprise': return <Building className="text-dark" size={24} />;
      default: return <Shield className="text-primary" size={24} />;
    }
  };

  // Get plan color based on plan type
  const getPlanColor = (planType, isPopular = false) => {
    if (isPopular) return 'success';
    
    switch (planType) {
      case 'free': return 'warning';
      case 'basic': return 'primary';
      case 'growth': return 'warning';
      case 'advanced': return 'info';
      case 'enterprise': return 'dark';
      default: return 'primary';
    }
  };

  // Enhance product plans with styling
  const enhancedProductPlans = productPlans.map((plan) => {
    const isPopular = plan.plan_name.toLowerCase().includes('growth');
    
    // Determine plan type for display
    let planType = "standard";
    if (plan.plan_name.toLowerCase().includes('free')) planType = "free";
    if (plan.plan_name.toLowerCase().includes('basic')) planType = "basic";
    if (plan.plan_name.toLowerCase().includes('growth')) planType = "growth";
    if (plan.plan_name.toLowerCase().includes('advanced')) planType = "advanced";
    if (plan.plan_name.toLowerCase().includes('enterprise')) planType = "enterprise";
    
    return {
      ...plan,
      isPopular,
      planType,
      displayPrice: isYearly ? plan.yearly_price : plan.monthly_price
    };
  });

  // Enhanced enterprise plans
  const enhancedEnterprisePlans = servicePlans.map(plan => ({
    ...plan,
    displayPrice: isYearly ? plan.yearly_price : plan.monthly_price
  }));

  // Handle plan selection - redirect to payment page
  const handlePlanSelection = (plan) => {
    const isCurrentPlan = currentPlan && currentPlan.plan_id === plan._id;
    
    if (isCurrentPlan) {
      alert(`You are already on the ${plan.plan_name} plan`);
      return;
    }

    // Build payment URL with all necessary parameters
    const paymentUrl = `http://localhost:9876/Payment/?planSlug=${plan.plan_slug}&billing=${isYearly ? 'yearly' : 'monthly'}&price=${plan.displayPrice}&planId=${plan._id}&isUpgrade=true`;
    
    // Close modal and redirect to payment page
    setShowPlansModal(false);
    window.location.href = paymentUrl;
  };

  // Format currency
  const formatCurrency = (amount) => {
    const safeAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(safeAmount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'success': { variant: 'success', text: 'Active' },
      'active': { variant: 'success', text: 'Active' },
      'pending': { variant: 'warning', text: 'Pending' },
      'failed': { variant: 'danger', text: 'Failed' },
      'cancelled': { variant: 'secondary', text: 'Cancelled' },
      'INITIALIZED': { variant: 'info', text: 'Initialized' }
    };
    
    const statusInfo = statusMap[status] || { variant: 'secondary', text: status };
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  if (error && !organization) {
    return (
      <Container className="mt-4">
        <Alert variant="danger" className="d-flex align-items-center">
          <span className="me-2">⚠️</span>
          {error}
        </Alert>
      </Container>
    );
  }

  if (loading.org && !organization) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p>Loading organization data...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="px-4 py-3">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="bg-black bg-gradient text-white p-4 rounded-3 shadow">
            <h1 className="display-6 fw-bold">Organization Settings</h1>
            <p className="mb-0 opacity-75">Manage your organization's details and subscription</p>
          </div>
        </Col>
      </Row>

      <Row>
        {/* Sidebar Navigation */}
        <Col md={3} className="mb-4">
          <Card className="shadow-sm">
            <Card.Body className="p-0">
              <Nav variant="pills" className="flex-column">
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'overview'} 
                    onClick={() => setActiveTab('overview')}
                    className="d-flex align-items-center py-3"
                  >
                    <span className="me-3">📊</span>
                    Overview
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'billing'} 
                    onClick={() => setActiveTab('billing')}
                    className="d-flex align-items-center py-3"
                  >
                    <span className="me-3">💳</span>
                    Billing
                    {billingData && (
                      <Badge bg="success" className="ms-auto">
                        Active
                      </Badge>
                    )}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'members'} 
                    onClick={() => setActiveTab('members')}
                    className="d-flex align-items-center py-3"
                  >
                    <span className="me-3">👥</span>
                    Members
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'settings'} 
                    onClick={() => setActiveTab('settings')}
                    className="d-flex align-items-center py-3"
                  >
                    <span className="me-3">⚙️</span>
                    Settings
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col md={9}>
          {activeTab === 'overview' && (
            <>
              {/* Organization Overview Card */}
              <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Organization Overview</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="align-items-center mb-4">
                    <Col md="auto">
                      <div 
                        className="rounded-circle bg-black d-flex align-items-center justify-content-center text-white fw-bold"
                        style={{ width: '80px', height: '80px', fontSize: '2rem' }}
                      >
                        {organization.domain.charAt(0).toUpperCase()}
                      </div>
                    </Col>
                    <Col>
                      <h4 className="mb-1">{organization.domain}</h4>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4} className="text-center mb-3">
                      <div className="border rounded p-3">
                        <h3 className="text-black">
                          {userStatus ? userStatus.totalUsers : 
                            (loading.users ? <Spinner animation="border" size="sm" /> : 'N/A')}
                        </h3>
                        <p className="mb-0 text-muted">Members</p>
                      </div>
                    </Col>
                    <Col md={4} className="text-center mb-3">
                      <div className="border rounded p-3">
                        <h3 className="text-black">
                          {teams ? teams.FireBaseTeam.length : 
                            (loading.teams ? <Spinner animation="border" size="sm" /> : 'N/A')}
                        </h3>
                        <p className="mb-0 text-muted">Teams</p>
                      </div>
                    </Col>
                    <Col md={4} className="text-center mb-3">
                      <div className="border rounded p-3">
                        <h3 className="text-black">
                          {userStatus ? userStatus.onlineUsersCount : 
                            (loading.users ? <Spinner animation="border" size="sm" /> : 'N/A')}
                        </h3>
                        <p className="mb-0 text-muted">Online Now</p>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Row>
                <Col md={6} className="mb-4">
                  <Card className="h-100 shadow-sm">
                    <Card.Header className="bg-light">
                      <h5 className="mb-0">Company Information</h5>
                    </Card.Header>
                    <Card.Body>
                      <ListGroup variant="flush">
                        <ListGroup.Item className="d-flex justify-content-between px-0">
                          <span className="text-muted">Company Name</span>
                          <span className="fw-bold">{organization.companyName}</span>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between px-0">
                          <span className="text-muted">Domain</span>
                          <span className="fw-bold">{organization.domain}</span>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between px-0">
                          <span className="text-muted">Owner</span>
                          <span className="fw-bold">{`${organization.name}@${organization.domain}`}</span>
                        </ListGroup.Item>
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6} className="mb-4">
                  <Card className="h-100 shadow-sm">
                    <Card.Header className="bg-light">
                      <h5 className="mb-0">Subscription Details</h5>
                    </Card.Header>
                    <Card.Body>
                      <ListGroup variant="flush">
                        <ListGroup.Item className="d-flex justify-content-between px-0">
                          <span className="text-muted">Current Plan</span>
                          <Badge bg="primary">{currentPlan?.plan_name || 'Basic'}</Badge>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between px-0">
                          <span className="text-muted">Status</span>
                          <Badge bg={organization.PaymentStatus === 'active' ? 'success' : 'warning'}>
                            {organization.PaymentStatus}
                          </Badge>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between px-0">
                          <span className="text-muted">Valid Until</span>
                          <span className="fw-bold">{new Date(organization.validUntil).toLocaleDateString()}</span>
                        </ListGroup.Item>
                      </ListGroup>
                      <div className="d-grid gap-2 mt-3">
                        <Button variant="primary" onClick={openPlansModal}>
                          <span className="me-2">🔄</span>
                          Change Plan
                        </Button>
                        <Button variant="outline-primary" onClick={() => setActiveTab('billing')}>
                          View Billing Details <ChevronRight />
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {activeTab === 'billing' && (
            <>
              {loading.billing ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" className="mb-3" />
                  <p>Loading billing information...</p>
                </div>
              ) : billingData ? (
                <>
                  {/* Current Plan Card */}
                  <Card className="mb-4 shadow-sm border-success">
                    <Card.Header className="bg-success bg-opacity-10 border-success d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="mb-0">
                          <CreditCard className="me-2" />
                          Current Subscription - All Data
                        </h5>
                      </div>
                      {getStatusBadge(billingData.data[0]?.status)}
                    </Card.Header>
                    <Card.Body>
                      <Row className="align-items-center">
                        <Col md={6}>
                          <div className="d-flex align-items-center mb-3">
                            <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                              <CurrencyDollar size={24} className="text-primary" />
                            </div>
                            <div>
                              <h3 className="mb-1">{billingData.data[0]?.planDetails?.planName || 'Subscription Plan'}</h3>
                              <p className="text-muted mb-0">
                                <Calendar className="me-1" />
                                Created: {billingData.data[0]?.createdAt ? formatDate(billingData.data[0].createdAt) : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="text-end">
                            <h1 className="text-success">₹{billingData.data[0]?.amount || 0}</h1>
                            <p className="text-muted">per {billingData.data[0]?.billingCycle || 'month'}</p>
                          </div>
                        </Col>
                      </Row>
                      
                      {/* Basic Information */}
                      <Row className="mt-4">
                        <Col md={6}>
                          <h6>User Information</h6>
                          <ListGroup className="mb-3">
                            <ListGroup.Item className="d-flex justify-content-between">
                              <span className="text-muted">Name:</span>
                              <span className="fw-bold">{billingData.data[0]?.name || 'N/A'}</span>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between">
                              <span className="text-muted">Email:</span>
                              <span className="fw-bold">{billingData.data[0]?.email || 'N/A'}</span>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between">
                              <span className="text-muted">Phone:</span>
                              <span className="fw-bold">{billingData.data[0]?.phone || 'N/A'}</span>
                            </ListGroup.Item>
                          </ListGroup>
                        </Col>
                        <Col md={6}>
                          <h6>Subscription Details</h6>
                          <ListGroup className="mb-3">
                            <ListGroup.Item className="d-flex justify-content-between">
                              <span className="text-muted">Billing Cycle:</span>
                              <Badge bg="info" className="text-capitalize">
                                {billingData.data[0]?.billingCycle || 'N/A'}
                              </Badge>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between">
                              <span className="text-muted">Payment Method:</span>
                              <Badge bg="secondary" className="text-capitalize">
                                {billingData.data[0]?.paymentMethod || 'N/A'}
                              </Badge>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between">
                              <span className="text-muted">Environment:</span>
                              <Badge bg={billingData.data[0]?.environment === 'sandbox' ? 'warning' : 'success'} className="text-capitalize">
                                {billingData.data[0]?.environment || 'N/A'}
                              </Badge>
                            </ListGroup.Item>
                          </ListGroup>
                        </Col>
                      </Row>

                      {/* Plan Restrictions - Users & Organizations */}
                      <Card className="mt-4">
                        <Card.Header className="bg-light">
                          <h6 className="mb-0">Plan Restrictions</h6>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <div className="border rounded p-3 text-center mb-3">
                                <People size={24} className="text-primary mb-2" />
                                <h4>{billingData.data[0]?.userId?.plan_restrictions?.max_total_app_users || 0}</h4>
                                <p className="text-muted mb-0">Maximum Users</p>
                                <small className="text-info">
                                  Currently using: {billingData.data[0]?.userDetails?.totalUsers || 0} user(s)
                                </small>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="border rounded p-3 text-center mb-3">
                                <Building size={24} className="text-primary mb-2" />
                                <h4>{billingData.data[0]?.userId?.plan_restrictions?.max_total_sub_orgs || 0}</h4>
                                <p className="text-muted mb-0">Maximum Organizations</p>
                                <small className="text-info">Sub-organizations limit</small>
                              </div>
                            </Col>
                          </Row>
                          
                          {/* Additional Restrictions */}
                          <Row className="mt-2">
                            <Col md={4}>
                              <div className="border rounded p-2 text-center">
                                <Hdd size={18} className="text-primary mb-1" />
                                <h6 className="mb-1">{billingData.data[0]?.userId?.plan_restrictions?.storage_limit_gb || 0} GB</h6>
                                <small className="text-muted">Storage Limit</small>
                              </div>
                            </Col>
                            <Col md={4}>
                              <div className="border rounded p-2 text-center">
                                <Box size={18} className="text-primary mb-1" />
                                <h6 className="mb-1">{billingData.data[0]?.userId?.plan_restrictions?.max_total_products || 0}</h6>
                                <small className="text-muted">Max Products</small>
                              </div>
                            </Col>
                            <Col md={4}>
                              <div className="border rounded p-2 text-center">
                                <div className="d-flex justify-content-center align-items-center">
                                  <div className="me-2">
                                    <Badge bg={billingData.data[0]?.userId?.plan_restrictions?.user_allocation_enabled ? 'success' : 'secondary'} className="p-1">
                                      {billingData.data[0]?.userId?.plan_restrictions?.user_allocation_enabled ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                  </div>
                                  <div>
                                    <small className="text-muted">User Allocation</small>
                                  </div>
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>

                      {/* Billing Information */}
                      <Row className="mt-4">
                        <Col md={6}>
                          <h6>Payment Information</h6>
                          <ListGroup className="mb-3">
                            <ListGroup.Item className="d-flex justify-content-between">
                              <span className="text-muted">Payment Date:</span>
                              <span className="fw-bold">{billingData.data[0]?.paymentDate ? formatDate(billingData.data[0].paymentDate) : 'N/A'}</span>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between">
                              <span className="text-muted">Currency:</span>
                              <Badge bg="success">{billingData.data[0]?.currency || 'INR'}</Badge>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between">
                              <span className="text-muted">Transaction ID:</span>
                              <code className="text-truncate" style={{ maxWidth: '200px' }}>
                                {billingData.data[0]?.transaction_id || 'N/A'}
                              </code>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between">
                              <span className="text-muted">Subscription ID:</span>
                              <code className="text-truncate" style={{ maxWidth: '200px' }}>
                                {billingData.data[0]?.subscriptionId || 'N/A'}
                              </code>
                            </ListGroup.Item>
                          </ListGroup>
                        </Col>
                        <Col md={6}>
                          <h6>User Details</h6>
                          <ListGroup className="mb-3">
                            <ListGroup.Item className="d-flex justify-content-between">
                              <span className="text-muted">Total Users:</span>
                              <span className="fw-bold">{billingData.data[0]?.userDetails?.totalUsers || 0}</span>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between">
                              <span className="text-muted">Per User Price:</span>
                              <span className="fw-bold">₹{billingData.data[0]?.userDetails?.perUserPrice || 0}</span>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between">
                              <span className="text-muted">Calculated Amount:</span>
                              <span className="fw-bold">₹{billingData.data[0]?.userDetails?.calculatedAmount || 0}</span>
                            </ListGroup.Item>
                          </ListGroup>
                        </Col>
                      </Row>

                      {/* Subscription Period */}
                      <Card className="mt-4">
                        <Card.Header className="bg-light">
                          <h6 className="mb-0">Subscription Period</h6>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <div className="text-center">
                                <h6>Current Period</h6>
                                <div className="border rounded p-3">
                                  <Calendar size={20} className="text-primary mb-2" />
                                  <p className="mb-1">
                                    <strong>Start:</strong> {billingData.data[0]?.userId?.subscription?.currentPeriodStart ? formatDate(billingData.data[0].userId.subscription.currentPeriodStart) : 'N/A'}
                                  </p>
                                  <p className="mb-0">
                                    <strong>End:</strong> {billingData.data[0]?.userId?.subscription?.currentPeriodEnd ? formatDate(billingData.data[0].userId.subscription.currentPeriodEnd) : 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="text-center">
                                <h6>Next Billing</h6>
                                <div className="border rounded p-3">
                                  <Calendar size={20} className="text-primary mb-2" />
                                  <p className="mb-1">
                                    <strong>Date:</strong> {billingData.data[0]?.userId?.billing?.nextBillingDate ? formatDate(billingData.data[0].userId.billing.nextBillingDate) : 'N/A'}
                                  </p>
                                  <p className="mb-0">
                                    <strong>Amount:</strong> ₹{billingData.data[0]?.userId?.billing?.nextBillingAmount || 0}
                                  </p>
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>

                      {/* Gateway Information */}
                      {billingData.data[0]?.gatewayMetadata && (
                        <Card className="mt-4">
                          <Card.Header className="bg-light">
                            <h6 className="mb-0">Gateway Information</h6>
                          </Card.Header>
                          <Card.Body>
                            <ListGroup variant="flush">
                              <ListGroup.Item className="d-flex justify-content-between">
                                <span className="text-muted">Gateway:</span>
                                <Badge bg="info" className="text-capitalize">
                                  {billingData.data[0]?.gateway || 'N/A'}
                                </Badge>
                              </ListGroup.Item>
                              <ListGroup.Item className="d-flex justify-content-between">
                                <span className="text-muted">CF Subscription ID:</span>
                                <code>{billingData.data[0]?.gatewayMetadata?.cf_subscription_id || 'N/A'}</code>
                              </ListGroup.Item>
                              <ListGroup.Item className="d-flex justify-content-between">
                                <span className="text-muted">Subscription Status:</span>
                                <Badge bg={
                                  billingData.data[0]?.gatewayMetadata?.subscription_status === 'INITIALIZED' ? 'info' : 
                                  billingData.data[0]?.gatewayMetadata?.subscription_status === 'ACTIVE' ? 'success' : 'warning'
                                }>
                                  {billingData.data[0]?.gatewayMetadata?.subscription_status || 'N/A'}
                                </Badge>
                              </ListGroup.Item>
                              <ListGroup.Item>
                                <div className="d-flex justify-content-between">
                                  <span className="text-muted">Payment Link:</span>
                                  <Button 
                                    variant="link" 
                                    size="sm" 
                                    onClick={() => window.open(billingData.data[0]?.gatewayMetadata?.auth_link, '_blank')}
                                  >
                                    View Link <BoxArrowUpRight size={12} />
                                  </Button>
                                </div>
                              </ListGroup.Item>
                            </ListGroup>
                          </Card.Body>
                        </Card>
                      )}
                    </Card.Body>
                    <Card.Footer className="bg-light">
                      <div className="d-flex justify-content-between">
                        <Button variant="outline-primary" size="sm">
                          <Download className="me-1" />
                          Download Invoice
                        </Button>
                        <div>
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>Refresh subscription status</Tooltip>}
                          >
                            <Button variant="outline-secondary" size="sm" className="me-2">
                              <ArrowRepeat />
                            </Button>
                          </OverlayTrigger>
                          {billingData.data[0]?.gatewayMetadata?.auth_link && (
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => window.open(billingData.data[0]?.gatewayMetadata?.auth_link, '_blank')}
                            >
                              Manage Subscription <BoxArrowUpRight className="ms-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card.Footer>
                  </Card>

                  {/* Change Plan Button */}
                  <Card className="mb-4 shadow-sm">
                    <Card.Body className="text-center">
                      <h5 className="mb-3">Looking for a different plan?</h5>
                      <p className="text-muted mb-4">Upgrade, downgrade, or switch plans anytime. Changes will be prorated.</p>
                      <Button 
                        variant="outline-primary" 
                        size="lg"
                        onClick={openPlansModal}
                        className="px-5"
                      >
                        <span className="me-2">📊</span>
                        View All Plans & Pricing
                      </Button>
                    </Card.Body>
                  </Card>

                  {/* Billing History */}
                  <Card className="shadow-sm">
                    <Card.Header className="bg-light">
                      <h5 className="mb-0">Billing History</h5>
                    </Card.Header>
                    <Card.Body>
                      <Table hover responsive>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Transaction ID</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billingData.data.map((payment, index) => (
                            <tr key={index}>
                              <td>{formatDate(payment.paymentDate)}</td>
                              <td>
                                <small>{payment.description}</small>
                              </td>
                              <td>
                                <Badge bg="success" className="fs-6">
                                  ₹{payment.amount}
                                </Badge>
                              </td>
                              <td>{getStatusBadge(payment.status)}</td>
                              <td>
                                <code className="text-truncate" style={{ maxWidth: '150px' }}>
                                  {payment.transaction_id}
                                </code>
                              </td>
                              <td>
                                <Button size="sm" variant="outline-secondary">
                                  <Download size={14} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </>
              ) : (
                <Card className="shadow-sm">
                  <Card.Header className="bg-light">
                    <h5 className="mb-0">Billing Information</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="text-center py-5">
                      <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                        <CreditCard size={48} className="text-muted" />
                      </div>
                      <h4>No Billing Information Found</h4>
                      <p className="text-muted">Subscribe to a plan to get started</p>
                      <Button variant="primary" onClick={openPlansModal}>
                        View Plans & Subscribe
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </>
          )}

          {activeTab === 'members' && (
            <Card className="shadow-sm">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Team Members</h5>
              </Card.Header>
              <Card.Body>
                {loading.users ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" className="mb-3" />
                    <p>Loading members...</p>
                  </div>
                ) : userStatus ? (
                  <>
                    <Row className="mb-4">
                      <Col md={6}>
                        <Card className="bg-success bg-opacity-10 border-success">
                          <Card.Body className="py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <span>Online Users</span>
                              <Badge bg="success" className="fs-6">{userStatus.onlineUsersCount}</Badge>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card className="bg-secondary bg-opacity-10 border-secondary">
                          <Card.Body className="py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <span>Offline Users</span>
                              <Badge bg="secondary" className="fs-6">{userStatus.offlineUsersCount}</Badge>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    <h6>Online Members</h6>
                    <Table striped bordered hover size="sm" className="mb-4">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userStatus.onlineUsers.map(user => (
                          <tr key={user._id}>
                            <td>{user.username}</td>
                            <td><Badge bg="success">Online</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    <h6>Offline Members</h6>
                    <Table striped bordered hover size="sm">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userStatus.offlineUsers.map(user => (
                          <tr key={user._id}>
                            <td>{user.username}</td>
                            <td><Badge bg="secondary">Offline</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </>
                ) : (
                  <div className="text-center py-5">
                    <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                      <span style={{ fontSize: '2.5rem' }}>👥</span>
                    </div>
                    <h4>Team Management</h4>
                    <p className="text-muted">Manage your team members here</p>
                    <Button variant="outline-primary">View All Members</Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {activeTab === 'settings' && (
            <Card className="shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Organization Settings</h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center py-5">
                  <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                    <span style={{ fontSize: '2.5rem' }}>⚙️</span>
                  </div>
                  <h4>Organization Settings</h4>
                  <p className="text-muted">Configure your organization settings here</p>
                  <Button variant="outline-primary">Edit Settings</Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Plans Modal */}
      <Modal 
        show={showPlansModal} 
        onHide={() => setShowPlansModal(false)} 
        size="xl"
        fullscreen="lg-down"
        centered
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">
            <span className="me-2">📊</span>
            Choose Your Plan
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {plansLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" size="lg" />
              <p className="mt-3">Loading plans...</p>
            </div>
          ) : (
            <div className="p-4">
              {/* Billing Toggle */}
              <div className="d-flex justify-content-center mb-4">
                <div className="bg-light p-2 rounded d-flex align-items-center">
                  <span className={`px-3 py-1 rounded ${!isYearly ? 'bg-white shadow-sm' : ''}`}>
                    Monthly
                  </span>
                  <div className="form-check form-switch mx-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="billingToggle"
                      checked={isYearly}
                      onChange={(e) => setIsYearly(e.target.checked)}
                    />
                  </div>
                  <span className={`px-3 py-1 rounded ${isYearly ? 'bg-white shadow-sm' : ''}`}>
                    Yearly <Badge bg="success" className="ms-1">Save 25%</Badge>
                  </span>
                </div>
              </div>

              {/* Plan Tabs */}
              <Tabs
                activeKey={activePlanTab}
                onSelect={(k) => setActivePlanTab(k)}
                className="mb-4 border-bottom"
              >
                <Tab eventKey="standard" title="Standard Plans">
                  <Row className="g-4 mt-3">
                    {enhancedProductPlans.map((plan) => {
                      const isCurrent = currentPlan && currentPlan.plan_id === plan._id;
                      const isFree = plan.monthly_price === 0;
                      const isExpanded = expandedFeatures[plan._id];
                      const visibleFeatures = isExpanded ? plan.features : (plan.features?.slice(0, 6) || []);

                      return (
                        <Col md={6} lg={3} key={plan._id}>
                          <Card 
                            className={`h-100 border-${plan.isPopular ? 'success border-2' : 'light'} shadow-sm ${plan.isPopular ? 'popular-plan' : ''}`}
                          >
                            {plan.isPopular && (
                              <div className="bg-success text-white text-center py-2">
                                <small className="fw-bold">MOST POPULAR</small>
                              </div>
                            )}
                            {isCurrent && (
                              <div className="position-absolute top-0 start-0 p-2">
                                <Badge bg="primary">CURRENT</Badge>
                              </div>
                            )}
                            <Card.Body className="d-flex flex-column">
                              {/* Plan Header */}
                              <div className="text-center mb-3">
                                <div className={`bg-${getPlanColor(plan.planType, plan.isPopular)} bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3`}>
                                  {getPlanIcon(plan.planType)}
                                </div>
                                <h4 className={`text-${getPlanColor(plan.planType, plan.isPopular)}`}>
                                  {plan.plan_name}
                                </h4>
                                <p className="text-muted small">{plan.plan_desc}</p>
                              </div>

                              {/* Price */}
                              <div className="text-center mb-4">
                                {isFree ? (
                                  <>
                                    <h2 className="fw-bold">Free</h2>
                                    <p className="text-muted small">for {plan.trial_period_days || 30} days</p>
                                  </>
                                ) : (
                                  <>
                                    <h2 className="fw-bold">
                                      ₹{plan.displayPrice}
                                      <span className="fs-6 text-muted">/{isYearly ? 'year' : 'month'}</span>
                                    </h2>
                                    <p className="text-muted small">
                                      Billed {isYearly ? 'yearly' : 'monthly'}
                                    </p>
                                  </>
                                )}
                              </div>

                              {/* Features */}
                              <div className="mb-4 flex-grow-1">
                                <h6 className="fw-bold mb-3">Key Features</h6>
                                <ListGroup variant="flush" className="small">
                                  {visibleFeatures.map((feature, idx) => (
                                    <ListGroup.Item key={idx} className="px-0 py-2">
                                      <div className="d-flex align-items-center">
                                        {renderFeatureIcon(feature, plan.isPopular)}
                                        <span className={`ms-2 ${feature.f_value === "false" ? 'text-muted' : ''}`}>
                                          {feature.f_desc || feature.f_name}
                                        </span>
                                      </div>
                                    </ListGroup.Item>
                                  ))}
                                </ListGroup>
                                {plan.features && plan.features.length > 6 && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 mt-2"
                                    onClick={() => toggleFeatures(plan._id)}
                                  >
                                    {isExpanded ? 'Show Less' : `+${plan.features.length - 6} More`}
                                  </Button>
                                )}
                              </div>

                              {/* Restrictions */}
                              {plan.restrictions && (
                                <div className="bg-light p-3 rounded mb-4">
                                  <h6 className="fw-bold mb-2">Plan Limits</h6>
                                  <div className="d-flex justify-content-between small">
                                    <span>Users:</span>
                                    <span className="fw-bold">{plan.restrictions.max_total_app_users}</span>
                                  </div>
                                  <div className="d-flex justify-content-between small">
                                    <span>Storage:</span>
                                    <span className="fw-bold">{plan.restrictions.storage_limit_gb} GB</span>
                                  </div>
                                  <div className="d-flex justify-content-between small">
                                    <span>Sub-Orgs:</span>
                                    <span className="fw-bold">{plan.restrictions.max_total_sub_orgs}</span>
                                  </div>
                                </div>
                              )}

                              {/* Action Button */}
                              <div className="mt-auto">
                                {isCurrent ? (
                                  <Button 
                                    variant="outline-secondary" 
                                    className="w-100"
                                    disabled
                                  >
                                    Current Plan
                                  </Button>
                                ) : isFree ? (
                                  <Button 
                                    variant="outline-warning" 
                                    className="w-100"
                                    onClick={() => handlePlanSelection(plan)}
                                  >
                                    Start Free Trial
                                  </Button>
                                ) : (
                                  <Button 
                                    variant={plan.isPopular ? "success" : `outline-${getPlanColor(plan.planType)}`}
                                    className="w-100"
                                    onClick={() => handlePlanSelection(plan)}
                                  >
                                    {currentPlan ? (plan.displayPrice > currentPlan.monthly_price ? 'Upgrade' : 'Downgrade') : 'Get Started'}
                                    <ArrowRight className="ms-2" size={16} />
                                  </Button>
                                )}
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </Tab>
                
                <Tab eventKey="enterprise" title="Enterprise">
                  <div className="mt-4">
                    <h4 className="text-center mb-4">Custom Enterprise Solutions</h4>
                    <Row className="g-4">
                      {enhancedEnterprisePlans.map((plan) => {
                        const isCurrent = currentPlan && currentPlan.plan_id === plan._id;
                        const isExpanded = expandedFeatures[plan._id];
                        const visibleFeatures = isExpanded ? plan.features : (plan.features?.slice(0, 8) || []);

                        return (
                          <Col md={12} lg={6} key={plan._id}>
                            <Card className="h-100 border-dark shadow">
                              <Card.Header className="bg-dark text-white">
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <h5 className="mb-0">
                                      <Building className="me-2" />
                                      {plan.plan_name}
                                    </h5>
                                  </div>
                                  {isCurrent && (
                                    <Badge bg="success">CURRENT</Badge>
                                  )}
                                </div>
                              </Card.Header>
                              <Card.Body className="d-flex flex-column">
                                {/* Plan Description */}
                                <div className="mb-4">
                                  <p className="text-muted">{plan.plan_desc}</p>
                                  <div className="text-center mb-4">
                                    <h2 className="fw-bold text-dark">
                                      ₹{plan.displayPrice}
                                      <span className="fs-6 text-muted">/{isYearly ? 'year' : 'month'}</span>
                                    </h2>
                                    <p className="text-muted small">Per user, billed {isYearly ? 'yearly' : 'monthly'}</p>
                                  </div>
                                </div>

                                {/* Features */}
                                <div className="mb-4 flex-grow-1">
                                  <h6 className="fw-bold mb-3">Included Features</h6>
                                  <Row>
                                    {visibleFeatures.slice(0, 8).map((feature, idx) => (
                                      <Col md={6} key={idx}>
                                        <div className="d-flex align-items-center mb-2 small">
                                          {renderFeatureIcon(feature, true)}
                                          <span className="ms-2">
                                            {feature.f_desc || feature.f_name}
                                          </span>
                                        </div>
                                      </Col>
                                    ))}
                                  </Row>
                                  {plan.features && plan.features.length > 8 && (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="p-0 mt-2"
                                      onClick={() => toggleFeatures(plan._id)}
                                    >
                                      {isExpanded ? 'Show Less' : `+${plan.features.length - 8} More`}
                                    </Button>
                                  )}
                                </div>

                                {/* Enterprise Features */}
                                <div className="bg-light p-3 rounded mb-4">
                                  <h6 className="fw-bold mb-2">Enterprise Features</h6>
                                  <div className="row g-2">
                                    <div className="col-6">
                                      <div className="d-flex align-items-center small">
                                        <People className="me-2 text-muted" size={14} />
                                        <span>Dedicated Support</span>
                                      </div>
                                    </div>
                                    <div className="col-6">
                                      <div className="d-flex align-items-center small">
                                        <Cpu className="me-2 text-muted" size={14} />
                                        <span>Custom Integration</span>
                                      </div>
                                    </div>
                                    <div className="col-6">
                                      <div className="d-flex align-items-center small">
                                        <Database className="me-2 text-muted" size={14} />
                                        <span>Unlimited Storage</span>
                                      </div>
                                    </div>
                                    <div className="col-6">
                                      <div className="d-flex align-items-center small">
                                        <Lock className="me-2 text-muted" size={14} />
                                        <span>Advanced Security</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Action Button */}
                                <div className="mt-auto">
                                  {isCurrent ? (
                                    <Button variant="outline-secondary" className="w-100" disabled>
                                      Current Plan
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="dark" 
                                      className="w-100"
                                      onClick={() => handlePlanSelection(plan)}
                                    >
                                      Choose Enterprise Plan
                                      <ArrowRight className="ms-2" size={16} />
                                    </Button>
                                  )}
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  </div>
                </Tab>
              </Tabs>

              {/* Current Plan Info */}
              {currentPlan && (
                <Card className="mt-4 border-primary">
                  <Card.Header className="bg-primary bg-opacity-10 border-primary">
                    <h6 className="mb-0">Your Current Plan: {currentPlan.plan_name}</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="mb-1">Plan will be upgraded/downgraded based on your selection.</p>
                        <small className="text-muted">Changes are prorated and take effect immediately.</small>
                      </div>
                      <Badge bg="primary">
                        {currentPlan.monthly_price === 0 ? 'Trial' : 'Active'}
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPlansModal(false)}>
            Close
          </Button>
          <Button variant="outline-primary" onClick={() => setActivePlanTab(activePlanTab === 'standard' ? 'enterprise' : 'standard')}>
            View {activePlanTab === 'standard' ? 'Enterprise' : 'Standard'} Plans
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default OrganizationSettings;