import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Offcanvas, Form, Row, Col, Card, Badge, Modal } from 'react-bootstrap';
import axios from 'axios';

const ShiftAssignmentManager = () => {
  const [departments, setDepartments] = useState([]);
  const [shiftNames, setShiftNames] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [createdShiftId, setCreatedShiftId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedShiftName, setSelectedShiftName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCanvas, setShowCanvas] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [assignedShifts, setAssignedShifts] = useState([]);
  const [showEditCanvas, setShowEditCanvas] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState(null);
  
  const token = localStorage.getItem("access_token");
  if (!token) window.location.href = "/login";

  useEffect(() => {
    fetchDepartments();
    fetchShiftNames();
    fetchAssignedShifts();
  }, []);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("https://api.avessecurity.com/api/Department/getAll", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(res.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShiftNames = async () => {
    try {
      const res = await axios.get("https://api.avessecurity.com/api/shift/get/ShiftName", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShiftNames(res.data.Shifts || []);
    } catch (error) {
      console.error("Error fetching shift names:", error);
    }
  };

  const fetchAssignedShifts = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("https://api.avessecurity.com/api/shift/getAll", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data && res.data.message === "Shift found" && Array.isArray(res.data.Shift)) {
        setAssignedShifts(res.data.Shift);
      } else {
        setAssignedShifts([]);
        console.warn("Unexpected response structure:", res.data);
      }
    } catch (error) {
      console.error("Error fetching assigned shifts:", error);
      setAssignedShifts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeptSelect = async (deptName) => {
    try {
      setIsLoading(true);
      setSelectedDept(deptName);
      const res = await axios.post(
        `https://api.avessecurity.com/api/shift/create/${deptName}`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(res.data.Users || []);
      setCreatedShiftId(res.data.Shift._id);
    } catch (error) {
      console.error("Error handling department selection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowCanvas(true);
  };

  const handleAssign = async () => {
    if (!selectedDept || !createdShiftId || !selectedUser || !startDate || !endDate || !selectedShiftName) {
      alert("Please fill all fields");
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        DepartmentUser: [
          {
            userId: selectedUser._id,
            Name: selectedUser.Name,
            Department: selectedUser.Department.name,
            Designation: selectedUser.Designation?.Name || '',
            StartDate: startDate,
            EndDate: endDate,
            ActualShift: selectedShiftName
          }
        ]
      };

      await axios.post(
        `https://api.avessecurity.com/api/shift/get/${selectedDept}/${createdShiftId}/shift`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Shift assigned successfully!");
      setShowCanvas(false);
      setSelectedShiftName('');
      setStartDate('');
      setEndDate('');
      fetchAssignedShifts();
    } catch (error) {
      console.error("Error assigning shift:", error);
      alert("Failed to assign shift");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditShift = (shift) => {
    const userShift = shift.DepartmentUser.find(u => u.ActualShift) || shift.DepartmentUser[0];
    setCurrentShift(shift);
    setSelectedShiftName(userShift?.ActualShift || '');
    setStartDate(userShift?.StartDate?.split('T')[0] || '');
    setEndDate(userShift?.EndDate?.split('T')[0] || '');
    setShowEditCanvas(true);
  };

  const handleUpdateShift = async () => {
    if (!currentShift || !selectedShiftName || !startDate || !endDate) {
      alert("Please fill all fields");
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        DepartmentUser: currentShift.DepartmentUser.map(user => {
          if (user.userId === currentShift.DepartmentUser[0].userId) {
            return {
              ...user,
              ActualShift: selectedShiftName,
              StartDate: startDate,
              EndDate: endDate
            };
          }
          return user;
        })
      };

      await axios.put(
        `https://api.avessecurity.com/api/shift/update/${currentShift._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Shift updated successfully!");
      setShowEditCanvas(false);
      setSelectedShiftName('');
      setStartDate('');
      setEndDate('');
      fetchAssignedShifts();
    } catch (error) {
      console.error("Error updating shift:", error);
      alert("Failed to update shift");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (shift) => {
    setShiftToDelete(shift);
    setShowDeleteModal(true);
  };

  const handleDeleteShift = async () => {
    if (!shiftToDelete) return;

    try {
      setIsLoading(true);
      await axios.delete(
        `https://api.avessecurity.com/api/shift/delete/${shiftToDelete._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Shift deleted successfully!");
      setShowDeleteModal(false);
      fetchAssignedShifts();
    } catch (error) {
      console.error("Error deleting shift:", error);
      alert("Failed to delete shift");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <Container className="py-4">
      <Card className="shadow-sm border-0">
        <Card.Body className="p-4">
          <Row className="mb-4 align-items-center">
            <Col>
              <h4 className="mb-0 text-dark">Shift Assignment Manager</h4>
              <p className="text-muted mb-0">Assign and manage shifts to department users</p>
            </Col>
          </Row>

          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Form.Group>
                <Form.Label className="fw-medium">Select Department</Form.Label>
                <Form.Select 
                  onChange={(e) => handleDeptSelect(e.target.value)} 
                  value={selectedDept}
                  disabled={isLoading}
                  className="py-2"
                >
                  <option value="">Select Department</option>
                  {departments.map((dep) => (
                    <option key={dep._id} value={dep.name}>{dep.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>

          {isLoading && (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {users.length > 0 && (
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Users in {selectedDept}</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4">Name</th>
                      <th>Designation</th>
                      <th>Department</th>
                      <th className="text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="ps-4 fw-medium">{user.Name}</td>
                        <td>
                          <Badge bg="info" className="text-dark">
                            {user.Designation?.Name || 'N/A'}
                          </Badge>
                        </td>
                        <td>{user.Department?.name || 'N/A'}</td>
                        <td className="text-end pe-4">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => handleUserClick(user)}
                            disabled={isLoading}
                            className="me-2"
                          >
                            <i className="bi bi-calendar-plus me-1"></i> Assign
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {selectedDept && users.length === 0 && !isLoading && (
            <Card className="text-center py-4 shadow-sm mb-4">
              <Card.Body>
                <i className="bi bi-people text-muted" style={{ fontSize: '2rem' }}></i>
                <h5 className="mt-3">No Users Found</h5>
                <p className="text-muted">There are no users in the selected department</p>
              </Card.Body>
            </Card>
          )}

          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Assigned Shifts</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4">User</th>
                    <th>Shift</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedShifts
                    .filter(shift => shift.DepartmentUser && shift.DepartmentUser.length > 0)
                    .flatMap(shift => 
                      shift.DepartmentUser
                        .filter(userShift => userShift.ActualShift)
                        .map((userShift, index) => (
                          <tr key={`${shift._id}-${index}`}>
                            <td className="ps-4 fw-medium">{userShift.Name}</td>
                            <td>
                              <Badge bg="success">
                                {userShift.ActualShift || 'N/A'}
                              </Badge>
                            </td>
                            <td>{formatDate(userShift.StartDate)}</td>
                            <td>{formatDate(userShift.EndDate)}</td>
                            <td className="text-end pe-4">
                              <Button 
                                variant="outline-info" 
                                size="sm" 
                                onClick={() => handleEditShift(shift)}
                                disabled={isLoading}
                                className="me-2"
                              >
                                <i className="bi bi-pencil me-1"></i> Edit
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                onClick={() => handleDeleteClick(shift)}
                                disabled={isLoading}
                              >
                                <i className="bi bi-trash me-1"></i> Delete
                              </Button>
                            </td>
                          </tr>
                        ))
                    )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {assignedShifts.length === 0 && !isLoading && (
            <Card className="text-center py-4 shadow-sm mt-4">
              <Card.Body>
                <i className="bi bi-calendar text-muted" style={{ fontSize: '2rem' }}></i>
                <h5 className="mt-3">No Shifts Assigned</h5>
                <p className="text-muted">Assign shifts to users to see them listed here</p>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>

      <Offcanvas show={showCanvas} onHide={() => setShowCanvas(false)} placement="end">
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title>
            <i className="bi bi-calendar-plus me-2"></i>
            Assign Shift to {selectedUser?.Name}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Shift Name</Form.Label>
              <Form.Select 
                value={selectedShiftName} 
                onChange={(e) => setSelectedShiftName(e.target.value)}
                className="py-2"
              >
                <option value="">Select Shift</option>
                {shiftNames.map((name, idx) => (
                  <option key={idx} value={name}>{name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Start Date</Form.Label>
              <Form.Control 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="py-2"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-medium">End Date</Form.Label>
              <Form.Control 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="py-2"
              />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button 
                onClick={handleAssign} 
                variant="primary" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Assigning...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Assign Shift
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>

      <Offcanvas show={showEditCanvas} onHide={() => setShowEditCanvas(false)} placement="end">
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title>
            <i className="bi bi-pencil me-2"></i>
            Edit Shift for {currentShift?.DepartmentUser[0]?.Name}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Shift Name</Form.Label>
              <Form.Select 
                value={selectedShiftName} 
                onChange={(e) => setSelectedShiftName(e.target.value)}
                className="py-2"
              >
                <option value="">Select Shift</option>
                {shiftNames.map((name, idx) => (
                  <option key={idx} value={name}>{name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Start Date</Form.Label>
              <Form.Control 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="py-2"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-medium">End Date</Form.Label>
              <Form.Control 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="py-2"
              />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button 
                onClick={handleUpdateShift} 
                variant="primary" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Update Shift
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the shift for {shiftToDelete?.DepartmentUser[0]?.Name}?
          <br />
          <strong>Shift:</strong> {shiftToDelete?.DepartmentUser.find(u => u.ActualShift)?.ActualShift || 'N/A'}
          <br />
          <strong>Dates:</strong> {formatDate(shiftToDelete?.DepartmentUser[0]?.StartDate)} to {formatDate(shiftToDelete?.DepartmentUser[0]?.EndDate)}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteShift} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Deleting...
              </>
            ) : (
              'Delete Shift'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ShiftAssignmentManager;