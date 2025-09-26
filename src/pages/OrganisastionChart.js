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
  ArrowLeft
} from "react-bootstrap-icons";

const CreateSubOrganization = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmpassword: "",
    subDomain: "", // ✅ user only types "hr"
  });
  const [parentDomain, setParentDomain] = useState(""); // e.g., "kdr.in.org"
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
  const [step, setStep] = useState(1);

  const navigate = useNavigate();

  // Password strength criteria
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
      if (decoded?.userDomain) {
        setParentDomain(decoded.userDomain);
      } else {
        setError("Parent domain not found in token.");
      }
    } catch (err) {
      setError("Invalid authentication token.");
    }
  }, []);

  // ✅ Check domain availability
  useEffect(() => {
    const checkDomainAvailability = async () => {
      if (!formData.subDomain || !isValidSubDomain(formData.subDomain)) {
        setDomainAvailable(null);
        return;
      }

      setCheckingDomain(true);
      try {
        // Simulate API call to check domain availability
        await new Promise(resolve => setTimeout(resolve, 500));
        setDomainAvailable(Math.random() > 0.3); // Simulate availability
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
      domain: fullDomain, // ✅ hr.kdr.in.org
      parentDomain: parentDomain, // ✅ kdr.in.org
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
      console.log("Sending payload:", payload);
      
      const res = await axios.post(
        "http://localhost:3393/api/oraganisation/create-Sub",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(res.data.message || "Sub-organization created successfully.");
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmpassword: "",
        subDomain: "",
      });

      setTimeout(() => navigate("/organizations"), 2000);
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

  return (
    <div className="container-fluid py-4">
      <Row className="justify-content-center">
        <Col xl={8} lg={10} md={12}>
          <Card className="shadow-lg border-0">
            <Card.Header className="bg-primary text-white py-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Button 
                    variant="outline-light" 
                    size="sm" 
                    onClick={() => navigate("/organizations")}
                    className="me-3"
                  >
                    <ArrowLeft size={16} className="me-1" />
                    Back
                  </Button>
                  <h4 className="mb-0">
                    <Building className="me-2" />
                    Create Sub-Organization
                  </h4>
                  <small className="opacity-75">
                    Set up a new sub-organization under {parentDomain || "your domain"}
                  </small>
                </div>
                <Badge bg="light" text="dark" className="fs-6">
                  Step {step} of 3
                </Badge>
              </div>
            </Card.Header>

            <Card.Body className="p-4">
              {/* Progress Bar */}
              <ProgressBar 
                now={(step / 3) * 100} 
                className="mb-4" 
                style={{ height: "6px" }}
              />

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
                    {/* Parent Domain */}
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

                    {/* Name */}
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

                    {/* Email */}
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
                    {/* Subdomain */}
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

                    {/* Password */}
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

                    {/* Confirm Password */}
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
    </div>
  );
};

export default CreateSubOrganization;