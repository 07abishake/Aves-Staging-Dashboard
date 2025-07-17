import React, { useState, useEffect } from 'react';
import { Button, Table, Form, Modal, Offcanvas, Badge, Spinner } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import axios from 'axios';

const PropertyPolices = () => {
  const [policies, setPolicies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Selected policy state
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    Title: '',
    OnwardsDate: new Date(),
    OnwardsTime: '12:00',
    Department: '',
    Policy: '',
    NotifyTeam: '',
    Accept: false
  });

  const token = localStorage.getItem('access_token');

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPolicies(),
        fetchTeams(),
        fetchDepartments()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch policies
  const fetchPolicies = async () => {
    try {
      const response = await axios.get('https://api.avessecurity.com/api/hotelPolicy/get', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Handle different possible response formats
      let policiesData = [];
      if (Array.isArray(response.data)) {
        policiesData = response.data;
      } else if (response.data && Array.isArray(response.data.policies)) {
        policiesData = response.data.policies;
      } else if (response.data && Array.isArray(response.data.data)) {
        policiesData = response.data.data;
      }
      
      setPolicies(policiesData);
      console.log('Fetched policies:', policiesData);
    } catch (error) {
      console.error('Error fetching policies:', error);
    }
  };

  // Fetch teams
  const fetchTeams = async () => {
    try {
      const response = await axios.get('https://api.avessecurity.com/api/firebase/get/TeamNamedropdown', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTeams(response.data.teams || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await axios.get("https://api.avessecurity.com/api/Department/getAll", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle department change
  const handleDepartmentChange = (e) => {
    setFormData(prev => ({ ...prev, Department: e.target.value }));
  };

  // Handle date change
  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, OnwardsDate: date }));
  };

  // Handle time change
  const handleTimeChange = (time) => {
    setFormData(prev => ({ ...prev, OnwardsTime: time }));
  };

  // Create new policy
  const handleCreate = async () => {
    try {
      setIsSubmitting(true);
      
      // Prepare payload with proper date format
      const payload = {
        ...formData,
        OnwardsDate: formData.OnwardsDate.toISOString()
      };

      const response = await axios.post(
        'https://api.avessecurity.com/api/hotelPolicy/create', 
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Create response:', response.data);

      // Send notification if team is selected
      if (formData.NotifyTeam) {
        const notificationData = {
          _id: formData.NotifyTeam,
          title: "New Property Policy Created",
          body: `A new policy "${formData.Title}" has been created`,
          message: formData.Policy
        };
        await axios.post(
          'https://api.avessecurity.com/api/firebase/Send-Notification-toTeam', 
          notificationData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      
      setShowCreateModal(false);
      await fetchPolicies();
      resetForm();
    } catch (error) {
      console.error('Error creating policy:', error.response?.data || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // View policy details
  const handleView = (policy) => {
    setSelectedPolicy(policy);
    setShowViewModal(true);
  };

  // Edit policy - populate form
  const handleEdit = (policy) => {
    setSelectedPolicy(policy);
    setFormData({
      Title: policy.Title,
      OnwardsDate: new Date(policy.OnwardsDate),
      OnwardsTime: policy.OnwardsTime,
      Department: policy.Department,
      Policy: policy.Policy,
      NotifyTeam: policy.NotifyTeam,
      Accept: policy.Accept
    });
    setShowEditModal(true);
  };

  // Update policy
  const handleUpdate = async () => {
    try {
      setIsSubmitting(true);
      
      const payload = {
        ...formData,
        OnwardsDate: formData.OnwardsDate.toISOString()
      };

      await axios.put(
        `https://api.avessecurity.com/api/hotelPolicy/update/${selectedPolicy._id}`, 
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setShowEditModal(false);
      await fetchPolicies();
      resetForm();
    } catch (error) {
      console.error('Error updating policy:', error.response?.data || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete policy
  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await axios.delete(
        `https://api.avessecurity.com/api/hotelPolicy/delete/${selectedPolicy._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setShowDeleteModal(false);
      await fetchPolicies();
    } catch (error) {
      console.error('Error deleting policy:', error.response?.data || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      Title: '',
      OnwardsDate: new Date(),
      OnwardsTime: '12:00',
      Department: '',
      Policy: '',
      NotifyTeam: '',
      Accept: false
    });
  };

  // Get department name by ID
  const getDepartmentName = (departmentId) => {
    const department = departments.find(d => d._id === departmentId);
    return department ? department.name : departmentId;
  };

  // Get team name by ID
  const getTeamName = (teamId) => {
    const team = teams.find(t => t._id === teamId);
    return team ? team.TeamName : teamId;
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between mb-4">
        <h2>Hotel Policies</h2>
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Create New Policy'}
        </Button>
      </div>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading policies...</p>
        </div>
      ) : (
        <>
          {policies.length === 0 ? (
            <div className="alert alert-info">
              No policies found. Create your first policy.
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy, index) => (
                  <tr key={policy._id}>
                    <td>{index + 1}</td>
                    <td>{policy.Title}</td>
                    <td>{new Date(policy.OnwardsDate).toLocaleDateString()}</td>
                    <td>{policy.OnwardsTime}</td>
                    <td>{getDepartmentName(policy.Department)}</td>
                    <td>
                      {policy.Accept ? (
                        <Badge bg="success">Approved</Badge>
                      ) : (
                        <Badge bg="warning">Pending</Badge>
                      )}
                    </td>
                    <td>
                      <Button 
                        variant="info" 
                        size="sm" 
                        onClick={() => handleView(policy)} 
                        className="me-2"
                      >
                        View
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => handleEdit(policy)} 
                        className="me-2"
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => {
                          setSelectedPolicy(policy);
                          setShowDeleteModal(true);
                        }}
                        disabled={isSubmitting}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}

      {/* Create Policy Modal */}
      <Offcanvas show={showCreateModal} onHide={() => setShowCreateModal(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Create New Policy</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                name="Title"
                value={formData.Title}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date *</Form.Label>
              <DatePicker
                selected={formData.OnwardsDate}
                onChange={handleDateChange}
                className="form-control"
                dateFormat="yyyy-MM-dd"
                minDate={new Date()}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Time *</Form.Label>
              <TimePicker
                onChange={handleTimeChange}
                value={formData.OnwardsTime}
                disableClock={true}
                format="HH:mm"
                className="form-control"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Department *</Form.Label>
              <Form.Select 
                name="Department"
                value={formData.Department}
                onChange={handleDepartmentChange}
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Policy Content *</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="Policy"
                value={formData.Policy}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notify Team</Form.Label>
              <Form.Select
                name="NotifyTeam"
                value={formData.NotifyTeam}
                onChange={handleInputChange}
              >
                <option value="">Select a team (optional)</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>
                    {team.TeamName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                onClick={handleCreate}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Submitting...</span>
                  </>
                ) : 'Submit'}
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>

      {/* View Policy Offcanvas */}
      <Offcanvas show={showViewModal} onHide={() => setShowViewModal(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Policy Details</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {selectedPolicy && (
            <div>
              <h4>{selectedPolicy.Title}</h4>
              <hr />
              <p><strong>Date:</strong> {new Date(selectedPolicy.OnwardsDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {selectedPolicy.OnwardsTime}</p>
              <p><strong>Department:</strong> {getDepartmentName(selectedPolicy.Department)}</p>
              <p><strong>Status:</strong> 
                {selectedPolicy.Accept ? (
                  <Badge bg="success" className="ms-2">Approved</Badge>
                ) : (
                  <Badge bg="warning" className="ms-2">Pending</Badge>
                )}
              </p>
              {selectedPolicy.NotifyTeam && (
                <p><strong>Notified Team:</strong> {getTeamName(selectedPolicy.NotifyTeam)}</p>
              )}
              <p><strong>Policy Content:</strong></p>
              <div className="border p-3 bg-light">
                {selectedPolicy.Policy}
              </div>
              <p className="text-muted mt-3">
                <small>Created: {new Date(selectedPolicy.createdAt).toLocaleString()}</small>
              </p>
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      {/* Edit Policy Offcanvas */}
      <Offcanvas show={showEditModal} onHide={() => setShowEditModal(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Edit Policy</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                name="Title"
                value={formData.Title}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date *</Form.Label>
              <DatePicker
                selected={formData.OnwardsDate}
                onChange={handleDateChange}
                className="form-control"
                dateFormat="yyyy-MM-dd"
                minDate={new Date()}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Time *</Form.Label>
              <TimePicker
                onChange={handleTimeChange}
                value={formData.OnwardsTime}
                disableClock={true}
                format="HH:mm"
                className="form-control"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Department *</Form.Label>
              <Form.Select 
                name="Department"
                value={formData.Department}
                onChange={handleDepartmentChange}
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Policy Content *</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="Policy"
                value={formData.Policy}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notify Team</Form.Label>
              <Form.Select
                name="NotifyTeam"
                value={formData.NotifyTeam}
                onChange={handleInputChange}
              >
                <option value="">Select a team (optional)</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>
                    {team.TeamName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Approved"
                name="Accept"
                checked={formData.Accept}
                onChange={(e) => setFormData(prev => ({ ...prev, Accept: e.target.checked }))}
              />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                onClick={handleUpdate}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Updating...</span>
                  </>
                ) : 'Update Policy'}
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the policy "{selectedPolicy?.Title}"?
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Deleting...</span>
              </>
            ) : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PropertyPolices;