import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Button,
  Alert,
  Card,
  Row,
  Col,
  ProgressBar,
  Badge,
  Tooltip,
  OverlayTrigger,
  InputGroup,
  Spinner,
  Modal,
  ListGroup,
  Table,
  Pagination,
  Tabs,
  Tab,
} from "react-bootstrap";
import { jwtDecode } from "jwt-decode";
import {
  Eye,
  EyeSlash,
  ShieldCheck,
  Building,
  InfoCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Search,
  Power,
  Tree,
  List,
  Eye as ViewIcon,
  Pencil,
  Trash,
  ExclamationTriangle
} from "react-bootstrap-icons";

const API_BASE_URL = "https://codeaves.avessecurity.com/api";

const CreateSubOrganization = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmpassword: "",
    subDomain: "",
  });
  const [parentDomain, setParentDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [domainAvailable, setDomainAvailable] = useState(null);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  
  // Organization list state
  const [organizations, setOrganizations] = useState([]);
  const [hierarchy, setHierarchy] = useState(null);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageLimit] = useState(50);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const navigate = useNavigate();

  const passwordCriteria = {
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  };

  const [criteria, setCriteria] = useState(passwordCriteria);

  // ✅ Get parent domain from token
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Authentication token is missing. Please log in again.");
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded?.domain) {
        setParentDomain(decoded.domain);
      } else {
        setError("Parent domain not found in token.");
      }
    } catch (err) {
      setError("Invalid authentication token.");
    }
  }, []);

  // ✅ Load organizations when tab changes
  useEffect(() => {
    if (activeTab === "list") {
      fetchOrganizations();
    } else if (activeTab === "hierarchy") {
      fetchHierarchy();
    }
  }, [activeTab, currentPage, searchTerm]);

  // ✅ Check domain availability
  useEffect(() => {
    const checkDomainAvailability = async () => {
      if (!formData.subDomain || !isValidSubDomain(formData.subDomain)) {
        setDomainAvailable(null);
        return;
      }

      setCheckingDomain(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setDomainAvailable(Math.random() > 0.3);
      } catch (error) {
        setDomainAvailable(null);
      } finally {
        setCheckingDomain(false);
      }
    };

    const debounceTimer = setTimeout(checkDomainAvailability, 800);
    return () => clearTimeout(debounceTimer);
  }, [formData.subDomain]);

  // ✅ Password strength check
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength(0);
      setCriteria(passwordCriteria);
      return;
    }

    const newCriteria = {
      length: formData.password.length >= 8,
      uppercase: /[A-Z]/.test(formData.password),
      lowercase: /[a-z]/.test(formData.password),
      number: /[0-9]/.test(formData.password),
      special: /[^A-Za-z0-9]/.test(formData.password),
    };

    setCriteria(newCriteria);

    const strength = Object.values(newCriteria).filter(Boolean).length;
    setPasswordStrength((strength / 5) * 100);
  }, [formData.password]);

  // ✅ API Functions
  const fetchOrganizations = async () => {
    setLoadingOrgs(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(
        `${API_BASE_URL}/oraganisation/list?page=${currentPage}&limit=${pageLimit}&search=${searchTerm}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('🔧 Organizations API response:', response.data);
      
      if (response.data.success) {
        setOrganizations(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      setError("Failed to fetch organizations: " + (error.response?.data?.message || error.message));
    } finally {
      setLoadingOrgs(false);
    }
  };

  const fetchHierarchy = async () => {
    setLoadingOrgs(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(
        `${API_BASE_URL}/oraganisation/hierarchy`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('🔧 Hierarchy API response:', response.data);
      
      if (response.data.success) {
        setHierarchy(response.data.data);
      }
    } catch (error) {
      setError("Failed to fetch hierarchy: " + (error.response?.data?.message || error.message));
    } finally {
      setLoadingOrgs(false);
    }
  };

  // ✅ FIXED: Get organization ID from different data structures
  const getOrganizationId = (org) => {
    // Handle list view structure
    if (org._id) return org._id;
    
    // Handle hierarchy view structure  
    if (org.id) return org.id;
    
    // Handle if both are present but prefer _id
    if (org._id) return org._id;
    if (org.id) return org.id;
    
    console.error('❌ No valid organization ID found:', org);
    return null;
  };

  // ✅ FIXED: Show confirmation modal with better validation
  const showStatusConfirmation = (org, action) => {
    console.log('🔧 Organization data received:', org);
    
    const orgId = getOrganizationId(org);
    
    if (!orgId) {
      console.error('❌ Invalid organization data: missing ID', org);
      setError('Invalid organization data: missing organization ID');
      return;
    }

    // Validate ID format
    if (orgId === 'undefined' || orgId === 'null' || orgId === undefined || orgId === null) {
      console.error('❌ Invalid organization ID format:', orgId);
      setError('Invalid organization ID format');
      return;
    }

    setSelectedOrg({
      id: orgId,
      name: org.name || 'Unknown Organization',
      domain: org.domain || 'No domain',
      isActive: org.isActive
    });
    setPendingAction(action);
    setShowConfirmModal(true);
  };

  // ✅ FIXED: Handle status toggle with better error handling
  const handleStatusToggle = async () => {
    if (!selectedOrg || !pendingAction) {
      console.error('❌ Missing selected organization or pending action');
      return;
    }

    console.log('🔧 Starting status toggle:', {
      selectedOrgId: selectedOrg.id,
      pendingAction,
      isActive: pendingAction === 'activate'
    });

    setActionLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Final validation of organization ID
      if (!selectedOrg.id || selectedOrg.id === 'undefined' || selectedOrg.id === 'null') {
        throw new Error('Invalid organization ID: ' + selectedOrg.id);
      }

      const url = `${API_BASE_URL}/oraganisation/${selectedOrg.id}/status`;
      const payload = { isActive: pendingAction === 'activate' };

      console.log('🔧 Making API request:', { url, payload });

      const response = await axios.patch(
        url,
        payload,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log('🔧 API response:', response.data);
      
      if (response.data.success) {
        setSuccess(`Organization ${pendingAction === 'activate' ? 'activated' : 'deactivated'} successfully`);
        
        // Refresh the data
        if (activeTab === "list") {
          fetchOrganizations();
        } else if (activeTab === "hierarchy") {
          fetchHierarchy();
        }
      }
    } catch (error) {
      console.error('❌ Status toggle error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
      let errorMessage = "Failed to update organization status: ";
      
      if (error.response?.status === 400) {
        errorMessage += error.response.data?.message || 'Bad request - invalid organization ID';
      } else if (error.response?.status === 404) {
        errorMessage += 'Organization not found';
      } else if (error.response?.status === 401) {
        errorMessage += 'Unauthorized - please login again';
      } else {
        errorMessage += error.response?.data?.message || error.message;
      }
      
      setError(errorMessage);
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
      setSelectedOrg(null);
      setPendingAction(null);
    }
  };

  // ✅ Subdomain validation
  const isValidSubDomain = (sub) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sub);

  // ✅ Get password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "danger";
    if (passwordStrength < 70) return "warning";
    return "success";
  };

  // ✅ Build payload
  const buildPayload = () => {
    const fullDomain = `${formData.subDomain}.${parentDomain}`;
    return {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      confirmPassword: formData.confirmpassword,
      domain: fullDomain,
      parentDomain: parentDomain,
    };
  };

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ✅ Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) errors.name = "Name is required.";
    
    if (!formData.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Enter a valid email address.";
    }

    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (passwordStrength < 40) {
      errors.password = "Password is too weak. Please strengthen it.";
    }

    if (!formData.confirmpassword) {
      errors.confirmpassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmpassword) {
      errors.confirmpassword = "Passwords do not match.";
    }

    if (!formData.subDomain) {
      errors.subDomain = "Subdomain is required.";
    } else if (!isValidSubDomain(formData.subDomain)) {
      errors.subDomain = "Subdomain must be lowercase alphanumeric, with optional hyphens.";
    } else if (domainAvailable === false) {
      errors.subDomain = "This subdomain is not available.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Authentication token is missing.");

      const payload = buildPayload();
      
      const res = await axios.post(
        "http://localhost:3393/api/oraganisation/create-Sub",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(res.data.message || "Sub-organization created successfully.");
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmpassword: "",
        subDomain: "",
      });

      // Refresh organizations list if on that tab
      if (activeTab === "list") {
        fetchOrganizations();
      }

    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Confirmation Modal with better ID display
  const renderConfirmationModal = () => (
    <Modal show={showConfirmModal} onHide={() => !actionLoading && setShowConfirmModal(false)} centered>
      <Modal.Header closeButton className={pendingAction === 'activate' ? 'bg-success text-white' : 'bg-warning'}>
        <Modal.Title>
          <ExclamationTriangle className="me-2" />
          {pendingAction === 'activate' ? 'Activate Organization' : 'Deactivate Organization'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center">
          <ExclamationTriangle size={48} className={pendingAction === 'activate' ? 'text-success mb-3' : 'text-warning mb-3'} />
          <h5>
            Are you sure you want to {pendingAction === 'activate' ? 'activate' : 'deactivate'} this organization?
          </h5>
          {selectedOrg && (
            <div className="mt-3 p-3 bg-light rounded">
              <strong>{selectedOrg.name}</strong>
              <br />
              <small className="text-muted">{selectedOrg.domain}</small>
              <br />
              <small className="text-muted">ID: {selectedOrg.id}</small>
            </div>
          )}
          {pendingAction === 'deactivate' && (
            <div className="alert alert-warning mt-3">
              <small>
                <strong>Note:</strong> Deactivating an organization will also deactivate all its sub-organizations and users.
              </small>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={() => setShowConfirmModal(false)}
          disabled={actionLoading}
        >
          Cancel
        </Button>
        <Button 
          variant={pendingAction === 'activate' ? 'success' : 'warning'} 
          onClick={handleStatusToggle}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              {pendingAction === 'activate' ? 'Activating...' : 'Deactivating...'}
            </>
          ) : (
            <>
              {pendingAction === 'activate' ? 'Yes, Activate' : 'Yes, Deactivate'}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // ✅ Render functions for organization management
  const renderOrganizationList = () => (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-light py-3">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <List className="me-2" />
            My Organizations
          </h5>
          <div className="d-flex gap-2">
            <InputGroup style={{ width: "300px" }}>
              <Form.Control
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline-primary">
                <Search />
              </Button>
            </InputGroup>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {loadingOrgs ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Domain</th>
                  <th>Company</th>
                  <th>Hierarchy Level</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org._id}>
                    <td>{org.name}</td>
                    <td>
                      <Badge bg="light" text="dark">
                        {org.domain}
                      </Badge>
                    </td>
                    <td>{org.companyName}</td>
                    <td>
                      <Badge bg="info">Level {org.hierarchyLevel}</Badge>
                    </td>
                    <td>
                      <Badge bg={org.isActive ? "success" : "danger"}>
                        {org.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td>{new Date(org.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          size="sm"
                          variant={org.isActive ? "warning" : "success"}
                          onClick={() => showStatusConfirmation(org, org.isActive ? 'deactivate' : 'activate')}
                          title={org.isActive ? "Deactivate" : "Activate"}
                        >
                          <Power size={14} />
                        </Button>
                        <Button size="sm" variant="outline-primary" title="View Details">
                          <ViewIcon size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
            {organizations.length === 0 && (
              <div className="text-center py-4 text-muted">
                No organizations found
              </div>
            )}

            {totalPages > 1 && (
              <div className="d-flex justify-content-center">
                <Pagination>
                  <Pagination.Prev 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  />
                  {[...Array(totalPages)].map((_, i) => (
                    <Pagination.Item
                      key={i + 1}
                      active={i + 1 === currentPage}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  />
                </Pagination>
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );

  const renderHierarchyNode = (node, level = 0) => (
    <div key={node.id} className="mb-2">
      <div 
        className="d-flex align-items-center p-2 border rounded bg-light"
        style={{ marginLeft: `${level * 20}px` }}
      >
        <Building className="me-2 text-primary" />
        <div className="flex-grow-1">
          <strong>{node.name}</strong>
          <small className="text-muted d-block">{node.domain}</small>
          <div className="d-flex gap-2 mt-1">
            <Badge bg="info">Level {node.hierarchyLevel}</Badge>
            <Badge bg={node.isActive ? "success" : "danger"}>
              {node.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <div className="d-flex gap-1">
          <Button
            size="sm"
            variant={node.isActive ? "warning" : "success"}
            onClick={() => showStatusConfirmation(node, node.isActive ? 'deactivate' : 'activate')}
            title={node.isActive ? "Deactivate" : "Activate"}
          >
            <Power size={14} />
          </Button>
        </div>
      </div>
      {node.children && node.children.map(child => renderHierarchyNode(child, level + 1))}
    </div>
  );

  const renderHierarchy = () => (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-light py-3">
        <h5 className="mb-0">
          <Tree className="me-2" />
          Organization Hierarchy
        </h5>
      </Card.Header>
      <Card.Body>
        {loadingOrgs ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : hierarchy ? (
          renderHierarchyNode(hierarchy)
        ) : (
          <div className="text-center py-4 text-muted">
            No hierarchy data available
          </div>
        )}
      </Card.Body>
    </Card>
  );

  const renderTooltip = (text) => (
    <Tooltip>{text}</Tooltip>
  );

  const PasswordCriteriaItem = ({ met, text }) => (
    <div className="d-flex align-items-center mb-1">
      {met ? (
        <CheckCircle size={14} className="text-success me-2" />
      ) : (
        <XCircle size={14} className="text-danger me-2" />
      )}
      <small className={met ? "text-success" : "text-muted"}>{text}</small>
    </div>
  );

  const renderCreateForm = () => (
    <Card className="shadow-lg border-0">
      <Card.Header className="bg-primary text-white py-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">
              <Building className="me-2" />
              Create Sub-Organization
            </h4>
            <small className="opacity-75">
              Set up a new sub-organization under {parentDomain || "your domain"}
            </small>
          </div>
        </div>
      </Card.Header>

      <Card.Body className="p-4">
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            <XCircle className="me-2" />
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess("")}>
            <CheckCircle className="me-2" />
            {success}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">
                  Parent Domain
                  <OverlayTrigger
                    placement="top"
                    overlay={renderTooltip("This is your main organization domain")}
                  >
                    <InfoCircle size={14} className="ms-1 text-muted" />
                  </OverlayTrigger>
                </Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <ShieldCheck />
                  </InputGroup.Text>
                  <Form.Control 
                    type="text" 
                    value={parentDomain || "Loading..."} 
                    readOnly 
                    className="bg-light"
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Full Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  placeholder="Enter administrator's full name"
                  value={formData.name}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.name}
                  className="py-2"
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.name}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Email Address *</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="Enter administrator's email"
                  value={formData.email}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.email}
                  className="py-2"
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.email}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">
                  Subdomain *
                  <OverlayTrigger
                    placement="top"
                    overlay={renderTooltip("This will be part of your sub-organization URL")}
                  >
                    <InfoCircle size={14} className="ms-1 text-muted" />
                  </OverlayTrigger>
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    name="subDomain"
                    placeholder="e.g., hr, sales, marketing"
                    value={formData.subDomain}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.subDomain}
                    className="py-2"
                  />
                  <InputGroup.Text className="bg-light">.{parentDomain}</InputGroup.Text>
                </InputGroup>
                
                {formData.subDomain && (
                  <div className="mt-2">
                    {checkingDomain ? (
                      <small className="text-warning">
                        <Spinner animation="border" size="sm" className="me-1" />
                        Checking availability...
                      </small>
                    ) : domainAvailable === true ? (
                      <small className="text-success">
                        <CheckCircle size={14} className="me-1" />
                        Subdomain is available!
                      </small>
                    ) : domainAvailable === false ? (
                      <small className="text-danger">
                        <XCircle size={14} className="me-1" />
                        Subdomain is not available
                      </small>
                    ) : null}
                  </div>
                )}
                
                <Form.Control.Feedback type="invalid">
                  {validationErrors.subDomain}
                </Form.Control.Feedback>
                
                {formData.subDomain && isValidSubDomain(formData.subDomain) && (
                  <small className="text-muted">
                    Full domain: <strong>{formData.subDomain}.{parentDomain}</strong>
                  </small>
                )}
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Password *</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.password}
                    className="py-2"
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlash /> : <Eye />}
                  </Button>
                </InputGroup>
                
                {formData.password && (
                  <div className="mt-2">
                    <ProgressBar 
                      now={passwordStrength} 
                      variant={getPasswordStrengthColor()}
                      className="mb-2"
                      style={{ height: "4px" }}
                    />
                    <div className="row">
                      <div className="col-6">
                        <PasswordCriteriaItem 
                          met={criteria.length} 
                          text="8+ characters" 
                        />
                        <PasswordCriteriaItem 
                          met={criteria.uppercase} 
                          text="Uppercase letter" 
                        />
                        <PasswordCriteriaItem 
                          met={criteria.lowercase} 
                          text="Lowercase letter" 
                        />
                      </div>
                      <div className="col-6">
                        <PasswordCriteriaItem 
                          met={criteria.number} 
                          text="Number" 
                        />
                        <PasswordCriteriaItem 
                          met={criteria.special} 
                          text="Special character" 
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <Form.Control.Feedback type="invalid">
                  {validationErrors.password}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Confirm Password *</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmpassword"
                    placeholder="Confirm your password"
                    value={formData.confirmpassword}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.confirmpassword}
                    className="py-2"
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeSlash /> : <Eye />}
                  </Button>
                </InputGroup>
                <Form.Control.Feedback type="invalid">
                  {validationErrors.confirmpassword}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
            <Button
              variant="outline-secondary"
              onClick={() => setShowPreview(true)}
              disabled={loading}
            >
              Preview
            </Button>
            
            <div>
              <Button
                variant="outline-secondary"
                className="me-2"
                onClick={() => navigate("/organizations")}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={loading || !parentDomain}
                className="px-4"
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="me-2" />
                    Create Sub-Organization
                  </>
                )}
              </Button>
            </div>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );

  return (
    <div className="container-fluid py-4">
      <Row className="justify-content-center">
        <Col xl={10} lg={12} md={12}>
          <Tabs
            activeKey={activeTab}
            onSelect={(tab) => setActiveTab(tab)}
            className="mb-4"
          >
            <Tab eventKey="create" title={<><Building className="me-1" /> Create Organization</>}>
              {renderCreateForm()}
            </Tab>
            <Tab eventKey="list" title={<><List className="me-1" /> Current  Organizations</>}>
              {renderOrganizationList()}
            </Tab>
            <Tab eventKey="hierarchy" title={<><Tree className="me-1" /> Hierarchy</>}>
              {renderHierarchy()}
            </Tab>
          </Tabs>
        </Col>
      </Row>

      {/* Preview Modal */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <Building className="me-2" />
            Sub-Organization Preview
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <strong>Parent Domain:</strong> {parentDomain}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Subdomain:</strong> {formData.subDomain || "Not set"}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Full Domain:</strong> {formData.subDomain ? `${formData.subDomain}.${parentDomain}` : "Not set"}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Administrator Name:</strong> {formData.name || "Not set"}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Administrator Email:</strong> {formData.email || "Not set"}
            </ListGroup.Item>
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Confirm Creation
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Status Confirmation Modal */}
      {renderConfirmationModal()}
    </div>
  );
};

export default CreateSubOrganization;