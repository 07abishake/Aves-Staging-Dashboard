import React, { useEffect, useState } from 'react';
import { Table, Button, Offcanvas, Form, Card, Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import moment from 'moment';

const ShiftManager = () => {
  const [shifts, setShifts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [formData, setFormData] = useState({
    ShiftName: '',
    ShiftStartTime: '',
    ShiftEndTime: '',
    BreakHours: '00:01' // Default to 1 minute
  });

  const token = localStorage.getItem('access_token');

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const res = await axios.get('https://codeaves.avessecurity.com/api/shifttime/getAll', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = Array.isArray(res.data.ShiftTiming) ? res.data.ShiftTiming : [];
      setShifts(data);
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  };

  const handleOpenForm = (shift = null) => {
    setIsEditMode(!!shift);
    setSelectedShift(shift);
    setFormData(
      shift
        ? {
            ShiftName: shift.ShiftName || '',
            ShiftStartTime: moment(shift.ShiftStartTime, ['hh:mm A', 'HH:mm']).format('HH:mm'),
            ShiftEndTime: moment(shift.ShiftEndTime, ['hh:mm A', 'HH:mm']).format('HH:mm'),
            BreakHours: shift.BreakHours.includes('.') 
              ? shift.BreakHours.replace('.', ':') 
              : shift.BreakHours
          }
        : {
            ShiftName: '',
            ShiftStartTime: '',
            ShiftEndTime: '',
            BreakHours: '00:01' // Default to 1 minute
          }
    );
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedShift(null);
    setFormData({
      ShiftName: '',
      ShiftStartTime: '',
      ShiftEndTime: '',
      BreakHours: '00:01'
    });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...formData,
        ShiftStartTime: moment(formData.ShiftStartTime, 'HH:mm').format('hh:mm A'),
        ShiftEndTime: moment(formData.ShiftEndTime, 'HH:mm').format('hh:mm A'),
        BreakHours: formData.BreakHours // Already in HH:mm format
      };

      if (isEditMode && selectedShift) {
        await axios.put(
          `https://codeaves.avessecurity.com/api/shifttime/update/${selectedShift._id}`,
          formattedData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Shift updated successfully!');
      } else {
        await axios.post(
          'https://codeaves.avessecurity.com/api/shifttime/create',
          formattedData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Shift created successfully!');
      }

      fetchShifts();
      handleCloseForm();
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving shift');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) return;
    try {
      await axios.delete(`https://codeaves.avessecurity.com/api/shifttime/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchShifts();
      alert('Shift deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting shift');
    }
  };

  // Generate options for BreakHours dropdown (00:01 to 24:00)
  const generateBreakHoursOptions = () => {
    const options = [];
    for (let hours = 0; hours <= 24; hours++) {
      const maxMinutes = hours === 24 ? 0 : 59;
      for (let minutes = hours === 0 ? 1 : 0; minutes <= maxMinutes; minutes++) {
        const value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        const display = `${String(hours).padStart(2, '0')}.${String(minutes).padStart(2, '0')}`;
        options.push(
          <option key={value} value={value}>
            {display}
          </option>
        );
      }
    }
    return options;
  };

  return (
    <Container className="py-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <h3 className="mb-0">Shift Timing Manager</h3>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => handleOpenForm()} className="shadow-sm">
            Create Shift
          </Button>
        </Col>
      </Row>

      <Card className="shadow-sm">
        <Card.Body className="p-0">
          <Table hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4">Shift Name</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Break Hours</th>
                <th>Working Hours</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift._id}>
                  <td className="ps-4 fw-medium">{shift.ShiftName}</td>
                  <td>{moment(shift.ShiftStartTime, ['HH:mm', 'hh:mm A']).format('hh:mm A')}</td>
                  <td>{moment(shift.ShiftEndTime, ['HH:mm', 'hh:mm A']).format('hh:mm A')}</td>
                  <td>
                    {shift.BreakHours.includes(':') 
                      ? shift.BreakHours.replace(':', '.') 
                      : shift.BreakHours.includes('.')
                      ? shift.BreakHours
                      : `${shift.BreakHours.substring(0, 2)}.${shift.BreakHours.substring(2)}`}
                  </td>
                  <td className="fw-medium">{shift.TotalShiftWorkingHours}</td>
                  <td className="text-end pe-4">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handleOpenForm(shift)}
                      className="me-2"
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(shift._id)}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {shifts.length === 0 && (
            <div className="text-center py-4 text-muted">
              No shifts found. Create your first shift.
            </div>
          )}
        </Card.Body>
      </Card>

      <Offcanvas show={showForm} onHide={handleCloseForm} placement="end">
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title>{isEditMode ? 'Edit Shift' : 'Create New Shift'}</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Shift Name</Form.Label>
              <Form.Control
                type="text"
                name="ShiftName"
                value={formData.ShiftName}
                onChange={handleChange}
                required
                className="py-2"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Start Time</Form.Label>
              {/* Custom styled time input for better touch experience */}
              <div className="position-relative">
                <Form.Control
                  type="time"
                  name="ShiftStartTime"
                  value={formData.ShiftStartTime}
                  onChange={handleChange}
                  required
                  className="py-2"
                  style={{
                    // Hide the default clock icon
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield'
                  }}
                />
                {/* Custom clock icon that triggers the time picker */}
                <div 
                  className="position-absolute"
                  style={{
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                  }}
                >
                  <i className="bi bi-clock text-muted"></i>
                </div>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>End Time</Form.Label>
              {/* Custom styled time input for better touch experience */}
              <div className="position-relative">
                <Form.Control
                  type="time"
                  name="ShiftEndTime"
                  value={formData.ShiftEndTime}
                  onChange={handleChange}
                  required
                  className="py-2"
                  style={{
                    // Hide the default clock icon
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield'
                  }}
                />
                {/* Custom clock icon that triggers the time picker */}
                <div 
                  className="position-absolute"
                  style={{
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                  }}
                >
                  <i className="bi bi-clock text-muted"></i>
                </div>
              </div>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Break Hours (HH.mm)</Form.Label>
              <Form.Select
                name="BreakHours"
                value={formData.BreakHours}
                onChange={handleChange}
                required
                className="py-2"
              >
                {generateBreakHoursOptions()}
              </Form.Select>
            </Form.Group>

            <div className="d-grid gap-2">
              <Button type="submit" variant="primary" size="lg" className="fw-medium">
                {isEditMode ? 'Update Shift' : 'Create Shift'}
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Add custom CSS to ensure the time input works properly on touch devices */}
      <style>
        {`
          /* Ensure the entire time input is clickable on touch devices */
          input[type="time"] {
            position: relative;
            z-index: 1;
          }
          
          /* Make sure the custom clock icon doesn't block clicks */
          .position-relative > .position-absolute {
            z-index: 0;
          }
          
          /* For WebKit browsers */
          input[type="time"]::-webkit-calendar-picker-indicator {
            position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                width: 100%;
                height: 100%;
                color: transparent;
                background: transparent;
                cursor: pointer;
                z-index: 2;
          }
        `}
      </style>
    </Container>
  );
};

export default ShiftManager;