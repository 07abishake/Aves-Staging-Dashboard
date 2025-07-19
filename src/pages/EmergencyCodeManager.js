import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  ListGroup,
  Offcanvas,
  Badge,
  Alert,
  InputGroup,
  Spinner,
  Modal
} from 'react-bootstrap';
import { Plus, Trash, Eye, X, Check } from 'react-bootstrap-icons';

function EmergencyCodeManager() {
  const [codeName, setCodeName] = useState('');
  const [summaryInput, setSummaryInput] = useState('');
  const [summaries, setSummaries] = useState([]);
  const [codes, setCodes] = useState([]);
  const [showCanvas, setShowCanvas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState(null);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchCodes();
  }, []);

 const fetchCodes = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await axios.get('https://api.avessecurity.com/api/DrillCode/get', {
      headers: { Authorization: `Bearer ${token}` },
    });

    // FIX: use 'Drilling' instead of 'DrillCode'
    const list = Array.isArray(res.data?.Drilling) ? res.data.Drilling : [];
    setCodes(list);

  } catch (error) {
    console.error('Failed to fetch codes:', error);
    setError('Failed to fetch emergency codes. Please try again.');
  } finally {
    setLoading(false);
  }
};


  const handleAddSummary = () => {
    if (summaryInput.trim()) {
      setSummaries([...summaries, summaryInput]);
      setSummaryInput('');
    }
  };

  const handleRemoveSummary = (index) => {
    const newSummaries = [...summaries];
    newSummaries.splice(index, 1);
    setSummaries(newSummaries);
  };

  const handleCreateCode = async () => {
    if (!codeName.trim()) {
      setError('Please enter a code name');
      return;
    }
    if (summaries.length === 0) {
      setError('Please add at least one summary');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        CodeName: codeName,
        CodeSummary: summaries.map(summary => ({ AddSummary: summary }))
      };

      const codeRes = await axios.post(
        "https://api.avessecurity.com/api/DrillCode/create",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!codeRes.data?.Drilling?._id) throw new Error("Code ID not returned from API");

      setSuccess('Emergency code created successfully!');
      setCodeName('');
      setSummaries([]);
      fetchCodes();
    } catch (error) {
      console.error("Failed to create code", error);
      setError("Failed to create emergency code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (code) => {
    setCodeToDelete(code);
    setShowDeleteModal(true);
  };

  const handleDeleteCode = async () => {
    if (!codeToDelete) return;
    
    setLoading(true);
    try {
      await axios.delete(
        `https://api.avessecurity.com/api/DrillCode/delete/${codeToDelete._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Emergency code deleted successfully!');
      fetchCodes();
    } catch (error) {
      console.error("Failed to delete code:", error);
      setError("Failed to delete emergency code. Please try again.");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setCodeToDelete(null);
    }
  };

  const toggleCanvas = () => setShowCanvas(!showCanvas);

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8} xl={6}>
          <Card className="shadow-sm border-primary">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">
                <Badge bg="light" className="me-2 text-primary">1</Badge>
                Emergency Code Setup
              </h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
              {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <Badge bg="light" className="me-2 text-primary">2</Badge>
                  Code Name
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter code name (e.g., Code Red, Code Blue)"
                  value={codeName}
                  onChange={(e) => setCodeName(e.target.value)}
                  className="border-primary"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <Badge bg="light" className="me-2 text-primary">3</Badge>
                  Code Summary
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Enter summary point"
                    value={summaryInput}
                    onChange={(e) => setSummaryInput(e.target.value)}
                    className="border-primary"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSummary()}
                  />
                  <Button variant="outline-primary" onClick={handleAddSummary}>
                    <Plus />
                  </Button>
                </InputGroup>
                
                {summaries.length > 0 && (
                  <ListGroup className="mt-3">
                    {summaries.map((summary, index) => (
                      <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                        {summary}
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => handleRemoveSummary(index)}
                          aria-label="Remove summary"
                        >
                          <X size={16} />
                        </Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Form.Group>

              <div className="d-flex gap-2 mt-4">
                <Button 
                  variant="primary" 
                  onClick={handleCreateCode}
                  disabled={loading || !codeName.trim() || summaries.length === 0}
                >
                  {loading ? (
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  ) : (
                    <>
                      <Plus className="me-1" /> Create Code
                    </>
                  )}
                </Button>
                <Button variant="outline-secondary" onClick={toggleCanvas}>
                  <Eye className="me-1" /> View All Codes
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Offcanvas for viewing codes */}
      <Offcanvas show={showCanvas} onHide={toggleCanvas} placement="end" className="w-50">
        <Offcanvas.Header closeButton className="bg-light">
          <Offcanvas.Title>
            <h4 className="mb-0">
              <Badge bg="primary" className="me-2">!</Badge>
              Emergency Codes
            </h4>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading emergency codes...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : Array.isArray(codes) && codes.length > 0 ? (
            <ListGroup variant="flush">
              {codes.map((code) => (
                <ListGroup.Item key={code._id || code.CodeName} className="py-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="mb-1 text-primary">
                        {code.CodeName || 'Unnamed Code'}
                      </h5>
                      {Array.isArray(code.CodeSummary) && code.CodeSummary.length > 0 ? (
                        <ul className="mt-2 mb-0 ps-3">
                          {code.CodeSummary.map((summary, idx) => (
                            <li key={summary._id || idx}>{summary.AddSummary}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted mb-0">No summaries available</p>
                      )}
                    </div>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={() => confirmDelete(code)}
                      aria-label="Delete code"
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <Alert variant="info">
              No emergency codes found. Create your first one above.
            </Alert>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the code: <strong>{codeToDelete?.CodeName}</strong>?
          <br />
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteCode} disabled={loading}>
            {loading ? (
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
            ) : (
              'Delete'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default EmergencyCodeManager;