import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Form, Table, Offcanvas } from 'react-bootstrap';
 
const OccurrenceManager = () => {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({});
  const [locations, setLocations] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewData, setViewData] = useState(null);
 
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('https://api.avessecurity.com/api/DailyOccurance/get', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data?.DailyOccurance || []);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };
 
  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get("https://api.avessecurity.com/api/Location/getLocations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocations(res.data?.Location || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };
 
  useEffect(() => {
    fetchData();
    fetchLocations();
  }, []);
 
  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
 
  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post('http://localhost:6378/api/DailyOccurance/create', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowCreate(false);
      setForm({});
      fetchData();
    } catch (error) {
      console.error("Error creating occurrence", error);
    }
  };
 
  const handleEdit = (item) => {
    setForm(item);
    setEditId(item._id);
    setShowEdit(true);
  };
 
  const handleView = (item) => {
    setViewData(item);
    setShowView(true);
  };
 
  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.put(`https://api.avessecurity.com/api/DailyOccurance/update/${editId}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowEdit(false);
      setForm({});
      fetchData();
    } catch (error) {
      console.error("Error updating occurrence", error);
    }
  };
 
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const token = localStorage.getItem('access_token');
        await axios.delete(`https://api.avessecurity.com/api/DailyOccurance/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchData();
      } catch (error) {
        console.error("Error deleting occurrence", error);
      }
    }
  };
 
  const getLocationOptions = () => {
    const options = [];
    locations.forEach(location => {
      if (!location.PrimaryLocation) return;
      options.push({ value: location._id, label: location.PrimaryLocation });
      location.SecondaryLocation?.forEach(secondary => {
        if (!secondary.SecondaryLocation) return;
        options.push({
          value: secondary._id,
          label: `${location.PrimaryLocation} > ${secondary.SecondaryLocation}`
        });
        secondary.ThirdLocation?.forEach(third => {
          if (!third.ThirdLocation) return;
          options.push({
            value: third._id,
            label: `${location.PrimaryLocation} > ${secondary.SecondaryLocation} > ${third.ThirdLocation}`
          });
        });
      });
    });
    return options;
  };
 
  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold">Daily Occurrence Log</h4>
        <Button variant="primary" onClick={() => setShowCreate(true)}>Add Occurrence</Button>
      </div>
 
      <div className="p-3 bg-white rounded shadow-sm" style={{ boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)' }}>
        <Table hover responsive className="mb-0">
          <thead className="table-light">
            <tr>
              <th>S.No</th>
              <th>Recording Date & Time</th>
              <th>Occurring Time</th>
              <th>Title</th>
              <th>Followup Required</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={item._id}>
                <td>{i + 1}</td>
                <td>{new Date(item?.RecordingDate).toLocaleDateString()} - {item?.RecordingTime}</td>
                <td>{item?.OccurringTime}</td>
                <td>{item?.NatureOfIncident}</td>
                <td>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontWeight: '500',
                    color: '#000',
                    backgroundColor: item.FollowupRequired === 'Yes' ? '#fff3cd' : '#d4edda',
                    border: item.FollowupRequired === 'Yes' ? '1px solid #ffeeba' : '1px solid #c3e6cb'
                  }}>
                    {item.FollowupRequired === 'Yes' ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>
                  <Button size="sm" variant="outline-secondary" onClick={() => handleView(item)} className="me-1">
                    <i className="bi bi-eye"></i>
                  </Button>
                  <Button size="sm" variant="outline-primary" onClick={() => handleEdit(item)} className="me-1">
                    <i className="bi bi-pencil-square"></i>
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => handleDelete(item._id)}>
                    <i className="bi bi-trash"></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
 
      {/* View Offcanvas */}
      <Offcanvas show={showView} onHide={() => setShowView(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Occurrence Details</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {viewData && (
            <>
              <p><strong>Recording Date:</strong> {new Date(viewData?.RecordingDate).toLocaleDateString()}</p>
              <p><strong>Recording Time:</strong> {viewData?.RecordingTime}</p>
              <p><strong>Occurring Time:</strong> {viewData?.OccurringTime}</p>
              <p><strong>Location:</strong> {viewData?.Location}</p>
              <p><strong>Reported By:</strong> {viewData?.ReportedBy}</p>
              <p><strong>Nature of Incident:</strong> {viewData?.NatureOfIncident}</p>
              <p><strong>Description:</strong> {viewData?.Description}</p>
              <p><strong>Action Taken:</strong> {viewData?.ActionTaken}</p>
              <p><strong>Follow-up Required:</strong> {viewData?.FollowupRequired}</p>
              <p><strong>Supervisor Remarks:</strong> {viewData?.SupervisorNameRemark}</p>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
 
      {[showCreate, showEdit].map((show, idx) => (
        <Offcanvas
          key={idx}
          show={show}
          onHide={() => (idx === 0 ? setShowCreate(false) : setShowEdit(false))}
          placement="end"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>{idx === 0 ? 'Create Occurrence' : 'Edit Occurrence'}</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Form>
              {["OccurringTime", "Location", "ReportedBy", "NatureOfIncident", "Description", "ActionTaken", "FollowupRequired", "SupervisorNameRemark"].map((field) => (
                <Form.Group key={field} className="mb-3">
                  <Form.Label>{field.replace(/([A-Z])/g, ' $1')}</Form.Label>
                  {field === "Location" ? (
                    <Form.Select
                      name="Location"
                      value={form["Location"] || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Location</option>
                      {getLocationOptions().map(opt => (
                        <option key={opt.value} value={opt.label}>
                          {opt.label}
                        </option>
                      ))}
                    </Form.Select>
                  ) : field === "FollowupRequired" ? (
                    <Form.Select
                      name="FollowupRequired"
                      value={form["FollowupRequired"] || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </Form.Select>
                  ) : (
                    <Form.Control
                      as={field === "Description" ? "textarea" : "input"}
                      rows={field === "Description" ? 3 : undefined}
                      name={field}
                      value={form[field] || ''}
                      onChange={handleInputChange}
                    />
                  )}
                </Form.Group>
              ))}
              <Button variant="primary" onClick={idx === 0 ? handleCreate : handleUpdate}>
                {idx === 0 ? 'Submit' : 'Update'}
              </Button>
            </Form>
          </Offcanvas.Body>
        </Offcanvas>
      ))}
    </div>
  );
};
 
export default OccurrenceManager;
 
 