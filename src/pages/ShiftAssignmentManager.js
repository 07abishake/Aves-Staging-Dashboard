import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Offcanvas, Form, Row, Col, Card, Badge, Modal } from 'react-bootstrap';
import axios from 'axios';

const ShiftAssignmentManager = () => {
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [createdShiftId, setCreatedShiftId] = useState('');
  const [selectedDeptId, setSelectedDeptUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCanvas, setShowCanvas] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [assignedShifts, setAssignedShifts] = useState([]);
  const [showEditCanvas, setShowEditCanvas] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [currentDepartmentUserId, setCurrentDepartmentUserId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState(null);
  const [weekOffDays, setWeekOffDays] = useState({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false
  });

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchDepartments();
    fetchShifts();
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

  const fetchShifts = async () => {
    try {
      const res = await axios.get("https://api.avessecurity.com/api/shift/get/ShiftName", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShifts(res.data.Shifts || []);
    } catch (error) {
      console.error("Error fetching shifts:", error);
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

  const handleAssign = async (user) => {
    setSelectedUser(user);
    setShowCanvas(true);

    try {
      setIsLoading(true);
      const res = await axios.post(
        `https://api.avessecurity.com/api/shift/get/${selectedDept}/${createdShiftId}/shift`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const departmentUsers = res.data.Shift?.DepartmentUser || [];
      const matchedUser = departmentUsers.find(
        (u) => u.userId === user._id || u.userId?._id === user._id
      );

      if (matchedUser) {
        setSelectedDeptUserId(matchedUser._id);
      } else {
        console.warn('User not found in DepartmentUser list');
      }

      fetchAssignedShifts();
    } catch (error) {
      console.error("Error assigning shift:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeekOffDayChange = (day) => {
    setWeekOffDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const calculateTotalWorkingHours = (shift, userShift) => {
    if (!shift || !userShift || !userShift.StartDate || !userShift.EndDate) {
      return 'N/A';
    }

    try {
      // Parse working hours from shift
      const workingHoursMatch = shift.TotalShiftWorkingHours?.match(/(\d+) hours (\d+) minutes/);
      const hours = workingHoursMatch ? parseInt(workingHoursMatch[1]) : 0;
      const minutes = workingHoursMatch ? parseInt(workingHoursMatch[2]) : 0;
      const dailyHours = hours + (minutes / 60);

      // Parse dates
      const startDate = new Date(userShift.StartDate);
      const endDate = new Date(userShift.EndDate);
      const weekOffDays = userShift.SelectWeekOffdays || [];

      // Calculate working days
      let workingDays = 0;
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        if (!weekOffDays.includes(dayName)) {
          workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Calculate total hours
      const totalHours = dailyHours * workingDays;
      const totalHoursInt = Math.floor(totalHours);
      const totalMinutes = Math.round((totalHours - totalHoursInt) * 60);

      return `${totalHoursInt} hours ${totalMinutes} minutes`;
    } catch (error) {
      console.error("Error calculating working hours:", error);
      return 'N/A';
    }
  };

  //check if shift already assign 

  const checkExistingShiftAssignment = async (userId, shiftId, startDate, endDate) => {
  try {
    const res = await axios.get("https://api.avessecurity.com/api/shift/getAll", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.data && res.data.message === "Shift found" && Array.isArray(res.data.Shift)) {
      const existingAssignment = res.data.Shift.find(shift => {
        return shift.DepartmentUser.some(userShift => {
          // Check if same user and same shift
          const isSameUser = userShift.userId === userId || userShift.userId?._id === userId;
          const isSameShift = userShift.ActualShift?._id === shiftId;
          
          // Parse dates for comparison
          const existingStart = new Date(userShift.StartDate);
          const existingEnd = new Date(userShift.EndDate);
          const newStart = new Date(startDate);
          const newEnd = new Date(endDate);
          
          // Check for date overlap
          const dateOverlap = (
            (newStart >= existingStart && newStart <= existingEnd) ||
            (newEnd >= existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd)
          );

          return isSameUser && isSameShift && dateOverlap;
        });
      });

      return !!existingAssignment;
    }
    return false;
  } catch (error) {
    console.error("Error checking existing shifts:", error);
    return false;
  }
};

  const handleUpdateShift = async () => {
   if (!selectedShift) {
    alert("Please select shift first");
    return;
  }

  try {
    setIsLoading(true);
    const weekOffDaysList = Object.entries(weekOffDays)
      .filter(([_, isOff]) => isOff)
      .map(([day]) => day);

    // Check for existing assignment
    const hasExistingAssignment = await checkExistingShiftAssignment(
      selectedUser._id,
      selectedShift._id,
      startDate,
      endDate
    );

    if (hasExistingAssignment) {
      alert("This user already has the same shift assigned for the selected dates");
      return;
    }

    // Rest of your existing code...
    const start = new Date(startDate);
    const end = new Date(endDate);
    let totalDays = 0;
    let current = new Date(start);
    
    while (current <= end) {
      const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
      if (!weekOffDaysList.includes(dayName)) {
        totalDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    const payload = {
      ActualShift: selectedShift._id,
      StartDate: startDate,
      EndDate: endDate,
      SelectWeekOffdays: weekOffDaysList,
      TotalShiftDays: totalDays
    };

    await axios.put(
      `https://api.avessecurity.com/api/shift/update/${createdShiftId}/DepartmentUser/${selectedDeptId}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Shift Assigned successfully!");
    setShowCanvas(false);
    setShowEditCanvas(false);
    setSelectedShift(null);
    setStartDate('');
    setEndDate('');
    setWeekOffDays({
      Monday: false,
      Tuesday: false,
      Wednesday: false,
      Thursday: false,
      Friday: false,
      Saturday: false,
      Sunday: false
    });
    fetchAssignedShifts();
  } catch (error) {
    console.error("Error updating shift:", error);
    alert(error.response?.data?.message || "Failed to update shift");
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
      return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const [time, period] = timeString.split(' ');
      const [hours, minutes] = time.split(':');
      return `${hours}:${minutes || '00'} ${period || ''}`.trim();
    } catch {
      return timeString;
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
                            onClick={() => handleAssign(user)}
                            disabled={isLoading}
                            className="me-2"
                          >
                            <i className="bi bi-calendar-plus me-1"></i> Select User
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
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4">User</th>
                      <th>DepartMent</th>
                      <th>Shift Details</th>
                      <th>Assignment Period</th>
                      <th>Week Off Days</th>
                      <th>Total Working Hours</th>
                      <th>Total Shift Days</th>
                      <th className="text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedShifts
                      .filter(shift => shift.DepartmentUser && shift.DepartmentUser.length > 0)
                      .flatMap(shift => 
                        shift.DepartmentUser
                          .filter(userShift => userShift.ActualShift)
                          .map((userShift, index) => {
                            return (
                              <tr key={`${shift._id}-${index}`}>
                                <td className="ps-4">
                                  <div className="d-flex align-items-center">
                                    <div className="">
                                      <i className=" text-primary"></i>
                                    </div>
                                    <div>
                                      <div className="fw-medium">{userShift.Name}</div>
                                      <small className="text-muted">{userShift.Designation|| 'N/A'}</small>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <Badge bg="light" className="text-dark">
                                    {userShift.Department || 'N/A'}
                                  </Badge>
                                </td>
                                <td>
                                  <div className="fw-medium">{userShift.ActualShift?.ShiftName || 'N/A'}</div>
                                  <small className="text-muted">
                                    {formatTime(userShift.ActualShift?.ShiftStartTime)} - {formatTime(userShift.ActualShift?.ShiftEndTime)}
                                  </small>
                                </td>
                                <td>
                                  {formatDate(userShift.StartDate)} to {formatDate(userShift.EndDate)}
                                </td>
                                <td>
                                  {userShift.SelectWeekOffdays && userShift.SelectWeekOffdays.length > 0 ? (
                                    <div className="d-flex flex-wrap gap-1">
                                      {userShift.SelectWeekOffdays.map(day => (
                                        <Badge key={day} bg="warning" className="text-dark">
                                          {day.substring(0, 3)}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <Badge bg="secondary">None</Badge>
                                  )}
                                </td>
                                <td className="fw-medium">
                                  {calculateTotalWorkingHours(userShift.ActualShift, userShift)}
                                </td>
                                <td className='fw-medium'>
                                  {userShift.TotalShiftDays}
                                </td>
                                <td className="text-end pe-4">
                                  {/* <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                   // onClick={() => (shift)}
                                    disabled={isLoading}
                                    className=" "
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </Button> */}
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm" 
                                    onClick={() => handleDeleteClick(shift)}
                                    disabled={isLoading}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                      )}
                  </tbody>
                </Table>
              </div>
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

      {/* Assign Shift Offcanvas */}
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
                value={selectedShift?._id || ''}
                onChange={(e) => {
                  const shiftId = e.target.value;
                  const shift = shifts.find(s => s._id === shiftId);
                  setSelectedShift(shift);
                }}
                className="py-2"
              >
                <option value="">Select Shift</option>
                {shifts.map((shift) => (
                  <option key={shift._id} value={shift._id}>
                    {shift.ShiftName} 
                  </option>
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

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">End Date</Form.Label>
              <Form.Control 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="py-2"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-medium">Select Week Off Days</Form.Label>
              <div className="d-flex flex-wrap gap-3">
                {Object.entries(weekOffDays).map(([day, isSelected]) => (
                  <Form.Check 
                    key={day}
                    type="checkbox"
                    id={`weekOff-${day}`}
                    label={day}
                    checked={isSelected}
                    onChange={() => handleWeekOffDayChange(day)}
                    inline
                    className="me-2"
                  />
                ))}
              </div>
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

      {/* Edit Shift Offcanvas */}
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
                value={selectedShift?._id || ''}
                onChange={(e) => {
                  const shiftId = e.target.value;
                  const shift = shifts.find(s => s._id === shiftId);
                  setSelectedShift(shift);
                }}
                className="py-2"
              >
                <option value="">Select Shift</option>
                {shifts.map((shift) => (
                  <option key={shift._id} value={shift._id}>
                    {shift.ShiftName} ({shift.ShiftStartTime} - {shift.ShiftEndTime})
                  </option>
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

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">End Date</Form.Label>
              <Form.Control 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="py-2"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-medium">Select Week Off Days</Form.Label>
              <div className="d-flex flex-wrap gap-3">
                {Object.entries(weekOffDays).map(([day, isSelected]) => (
                  <Form.Check 
                    key={day}
                    type="checkbox"
                    id={`weekOff-${day}`}
                    label={day}
                    checked={isSelected}
                    onChange={() => handleWeekOffDayChange(day)}
                    inline
                    className="me-2"
                  />
                ))}
              </div>
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

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the shift for {shiftToDelete?.DepartmentUser[0]?.Name}?
          <br />
          <strong>Shift:</strong> {shiftToDelete?.DepartmentUser[0]?.ActualShift?.ShiftName || 'N/A'}
          <br />
          <strong>Dates:</strong> {formatDate(shiftToDelete?.DepartmentUser[0]?.StartDate)} to {formatDate(shiftToDelete?.DepartmentUser[0]?.EndDate)}
          <br />
          <strong>Week Off Days:</strong> {shiftToDelete?.DepartmentUser[0]?.SelectWeekOffdays?.join(', ') || 'None'}
          <br />
          <strong>Total Working Hours:</strong> {calculateTotalWorkingHours(
            shiftToDelete?.DepartmentUser[0]?.ActualShift,
            shiftToDelete?.DepartmentUser[0]
          )}
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