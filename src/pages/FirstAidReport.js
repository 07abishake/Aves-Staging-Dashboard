import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Button,
  Table,
  Offcanvas,
  Form,
  Modal,
  Alert,
  Spinner,
  Row,
  Col,
  Badge,
  ListGroup
} from 'react-bootstrap';

const FirstAidReport = () => {
  // Main state
  const [reports, setReports] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState({
    reports: false,
    departments: false,
    form: false,
    delete: false
  });
  const [error, setError] = useState(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({
    AddDepartments: '',
    items: [{
      Additems: '',
    }],
    ReportNo: ''
  });

  // View state
  const [showViewCanvas, setShowViewCanvas] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  const token = localStorage.getItem("access_token");
  if (!token) {
    // window.location.href = "/login";
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchReports();
    fetchDepartments();
  }, []);

  // Set form values when editing
  useEffect(() => {
    if (editData) {
      setFormData({
        AddDepartments: editData.AddDepartments || '',
        items: editData.items?.length ? [...editData.items] : [{
          Additems: '',
        }],
        ReportNo: editData.ReportNo || ''
      });
    } else {
      resetForm();
    }
  }, [editData]);

  const resetForm = () => {
    setFormData({
      AddDepartments: '',
      items: [{
        Additems: '',
      }],
      ReportNo: ''
    });
  };

  // API functions
  const fetchReports = async () => {
    setLoading(prev => ({ ...prev, reports: true }));
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('https://api.avessecurity.com/api/firstaidreport/FirstAid/get', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const reportsData = response.data?.Firstaid || [];
      setReports(reportsData);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.message || 'Failed to load first aid reports');
    } finally {
      setLoading(prev => ({ ...prev, reports: false }));
    }
  };

  const fetchDepartments = async () => {
    setLoading(prev => ({ ...prev, departments: true }));
    try {
      const { data } = await axios.get('https://api.avessecurity.com/api/Department/getAll', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments');
    } finally {
      setLoading(prev => ({ ...prev, departments: false }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, form: true }));
    setError(null);

    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      if (editData) {
        await axios.put(
          `https://api.avessecurity.com/api/firstaidreport/FirstAid/update/${editData._id}`,
          formData,
          config
        );
      } else {
        await axios.post(
          'https://api.avessecurity.com/api/firstaidreport/FirstAid/create',
          formData,
          config
        );
      }

      await fetchReports();
      handleCloseForm();
    } catch (err) {
      console.error('Error saving report:', err);
      setError(err.response?.data?.message || 'Failed to save report');
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;
    
    setLoading(prev => ({ ...prev, delete: true }));
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(
        `https://api.avessecurity.com/api/firstaidreport/FirstAid/delete/${reportToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchReports();
      setShowDeleteModal(false);
      setReportToDelete(null);
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report');
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [name]: value
    };
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  const addItemField = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { Additems: '' }]
    });
  };

  const removeItemField = (index) => {
    if (formData.items.length <= 1) return;
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditData(null);
    resetForm();
  };

  const handleView = (report) => {
    setCurrentReport(report);
    setShowViewCanvas(true);
  };

  const handleEdit = (report) => {
    setEditData(report);
    setShowForm(true);
  };

  const handleDeleteClick = (report) => {
    setReportToDelete(report);
    setShowDeleteModal(true);
  };

  const renderTable = () => {
    if (loading.reports) {
      return (
        <div className="text-center">
          <Spinner animation="border" />
          <p>Loading reports...</p>
        </div>
      );
    }

    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }

    if (!Array.isArray(reports) || reports.length === 0) {
      return <Alert variant="info">No first aid reports found</Alert>;
    }

    return (
      <Table striped  hover responsive>
        <thead>
          <tr>
            <th>Report No</th>
            <th>Department</th>
            <th>Items Count</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(report => (
            <tr key={report._id || Math.random()}>
              <td>{report.ReportNo || 'N/A'}</td>
              <td>{report.AddDepartments || 'N/A'}</td>
              <td>{Array.isArray(report.items) ? report.items.length : 0}</td>
              <td>
                <Button 
                  variant="outline-info" 
                  size="sm" 
                  onClick={() => handleView(report)}
                  className="me-2"
                >
                <i className="bi bi-eye"></i>
                </Button>
                <Button 
                  variant="outline-warning" 
                  size="sm" 
                  onClick={() => handleEdit(report)}
                  className="me-2"
                  disabled={loading.form}
                >
                 <i className="bi bi-pencil-square"></i>
                </Button>
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  onClick={() => handleDeleteClick(report)}
                  disabled={loading.delete}
                >
                     <i className="bi bi-trash"></i>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  const renderForm = () => {
    return (
      <Offcanvas show={showForm} onHide={handleCloseForm} placement="end" backdrop="static">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>{editData ? 'Edit' : 'Create'} First Aid Report</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form onSubmit={handleFormSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Department *</Form.Label>
              <Form.Select
                name="AddDepartments"
                value={formData.AddDepartments}
                onChange={handleInputChange}
                required
                disabled={loading.departments || loading.form}
              >
                <option value="">Select Department</option>
                {Array.isArray(departments) && departments.map(dept => (
                  <option key={dept._id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <h5>Items</h5>
            {formData.items.map((item, index) => (
              <div key={index} className="mb-3 p-3 border rounded">
                <Row>
                  <Col md={11}>
                    <Form.Group>
                      <Form.Label>Item Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="Additems"
                        value={item.Additems}
                        onChange={(e) => handleItemChange(index, e)}
                        required
                        disabled={loading.form}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={1} className="d-flex align-items-end">
                    {formData.items.length > 1 && (
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => removeItemField(index)}
                        disabled={loading.form}
                      >
                        ×
                      </Button>
                    )}
                  </Col>
                </Row>
              </div>
            ))}

            <Button 
              variant="secondary" 
              onClick={addItemField}
              className="mb-3"
              disabled={loading.form}
            >
              Add Item
            </Button>

            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" disabled={loading.form}>
                {loading.form ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Saving...</span>
                  </>
                ) : (
                  editData ? 'Update Report' : 'Create Report'
                )}
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>
    );
  };

  const renderViewCanvas = () => {
    if (!currentReport) return null;

    return (
      <Offcanvas show={showViewCanvas} onHide={() => setShowViewCanvas(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>First Aid Report Details</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <strong>Report Number:</strong> {currentReport.ReportNo || 'N/A'}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Department:</strong> {currentReport.AddDepartments || 'N/A'}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Items:</strong>
              <ListGroup as="ol" numbered className="mt-2">
                {Array.isArray(currentReport.items) && currentReport.items.length > 0 ? (
                  currentReport.items.map((item, index) => (
                    <ListGroup.Item as="li" key={index}>
                      {item.Additems || 'N/A'}
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item>No items found</ListGroup.Item>
                )}
              </ListGroup>
            </ListGroup.Item>
          </ListGroup>

          <div className="mt-3 d-flex justify-content-end">
            {/* <Button 
              variant="warning" 
              onClick={() => {
                setShowViewCanvas(false);
                handleEdit(currentReport);
              }}
              className="me-2"
            >
              Edit Report
            </Button> */}
            {/* <Button 
              variant="danger" 
              onClick={() => {
                setShowViewCanvas(false);
                handleDeleteClick(currentReport);
              }}
            >
              Delete Report
            </Button> */}
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    );
  };

  const renderDeleteModal = () => {
    return (
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <strong>Warning!</strong> This action cannot be undone.
          </Alert>
          <p>Are you sure you want to delete this first aid report?</p>
          {reportToDelete && (
            <div className="p-3 bg-light rounded">
              <p><strong>Report No:</strong> {reportToDelete.ReportNo || 'N/A'}</p>
              <p><strong>Department:</strong> {reportToDelete.AddDepartments || 'N/A'}</p>
              <p>
                <strong>Items:</strong> {Array.isArray(reportToDelete.items) ? reportToDelete.items.length : 0}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowDeleteModal(false);
              setReportToDelete(null);
            }}
            disabled={loading.delete}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteReport} 
            disabled={loading.delete}
          >
            {loading.delete ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Deleting...</span>
              </>
            ) : (
              'Confirm Delete'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>First Aid Reports</h2>
        <Button 
          variant="primary" 
          onClick={() => setShowForm(true)}
          disabled={loading.reports}
        >
          Create New Report
        </Button>
      </div>

      {renderTable()}
      {renderForm()}
      {renderViewCanvas()}
      {renderDeleteModal()}
    </Container>
  );
};

export default FirstAidReport;