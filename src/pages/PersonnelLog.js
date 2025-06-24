import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Offcanvas } from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Select from 'react-select';
import debounce from 'lodash/debounce';

export function PersonnelLog() {
  // State for form data
  const [formData, setFormData] = useState({
    IssuedBy: { value: 'current-user', label: 'Current User' },
    ReceivedBy: null,
    ApprovedBy: null,
    Checklist: null,
    CheckListCompletedBy: { value: 'current-user', label: 'Current User' },
    Remarks: ''
  });

  // Other state variables
  const [logs, setLogs] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewLog, setViewLog] = useState(null);
  const [formCanvas, setFormCanvas] = useState(null);
  const [viewCanvas, setViewCanvas] = useState(null);
  const [userOptions, setUserOptions] = useState([]);
  const [checklistOptions, setChecklistOptions] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingChecklists, setIsLoadingChecklists] = useState(false);

  // Debounced user search function
  const fetchUsers = debounce(async (query) => {
    if (!query) {
      setUserOptions([]);
      return;
    }
    
    setIsLoadingUsers(true);
    try {
      const response = await axios.get(
        `https://api.avessecurity.com/api/Designation/getDropdown/${query}`
      );
      
      if (response.data?.Report) {
        setUserOptions(response.data.Report.map(user => ({
          value: user._id,
          label: user.username
        })));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, 500);

  // Fetch checklists function
  const fetchChecklists = debounce(async (query) => {
    if (!query) {
      setChecklistOptions([]);
      return;
    }
    
    setIsLoadingChecklists(true);
    try {
      const response = await axios.get(
        `https://api.avessecurity.com/api/collection/getModule/${query}`
      );
      
      if (response.data) {
        setChecklistOptions(response.data.map(item => ({
          value: item._id,
          label: item.name
        })));
      }
    } catch (error) {
      console.error("Error fetching checklists:", error);
    } finally {
      setIsLoadingChecklists(false);
    }
  }, 500);

  useEffect(() => {
    fetchLogs();
    // Initialize offcanvas instances
    setFormCanvas(new Offcanvas(document.getElementById('logFormCanvas')));
    setViewCanvas(new Offcanvas(document.getElementById('logViewCanvas')));
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/personnel-logs');
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, selectedOption) => {
    setFormData(prev => ({ ...prev, [name]: selectedOption }));
  };

  const resetForm = () => {
    setFormData({
      IssuedBy: { value: 'current-user', label: 'Current User' },
      ReceivedBy: null,
      ApprovedBy: null,
      Checklist: null,
      CheckListCompletedBy: { value: 'current-user', label: 'Current User' },
      Remarks: ''
    });
    setIsEdit(false);
    setEditId(null);
  };

  const handleCreate = () => {
    resetForm();
    formCanvas.show();
  };

  const handleEdit = (log) => {
    setFormData({
      IssuedBy: log.IssuedBy ? { value: log.IssuedBy._id, label: log.IssuedBy.username } : { value: 'current-user', label: 'Current User' },
      ReceivedBy: log.ReceivedBy ? { value: log.ReceivedBy._id, label: log.ReceivedBy.username } : null,
      ApprovedBy: log.ApprovedBy ? { value: log.ApprovedBy._id, label: log.ApprovedBy.username } : null,
      Checklist: log.Checklist ? { value: log.Checklist._id, label: log.Checklist.name } : null,
      CheckListCompletedBy: log.CheckListCompletedBy ? { value: log.CheckListCompletedBy._id, label: log.CheckListCompletedBy.username } : { value: 'current-user', label: 'Current User' },
      Remarks: log.Remarks
    });
    setIsEdit(true);
    setEditId(log._id);
    formCanvas.show();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        IssuedBy: formData.IssuedBy.value,
        ReceivedBy: formData.ReceivedBy?.value || null,
        ApprovedBy: formData.ApprovedBy?.value || null,
        Checklist: formData.Checklist?.value || null,
        CheckListCompletedBy: formData.CheckListCompletedBy.value,
        Remarks: formData.Remarks
      };

      if (isEdit) {
        await axios.put(`/api/personnel-logs/${editId}`, payload);
      } else {
        await axios.post('/api/personnel-logs', payload);
      }
      fetchLogs();
      resetForm();
      formCanvas.hide();
    } catch (error) {
      console.error('Error submitting log:', error);
    }
  };

  const handleView = (log) => {
    setViewLog(log);
    viewCanvas.show();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this log entry?')) {
      try {
        await axios.delete(`/api/personnel-logs/${id}`);
        fetchLogs();
      } catch (error) {
        console.error('Error deleting log:', error);
      }
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Personnel Log</h2>
        <button className="btn btn-primary" onClick={handleCreate}>
          Add Log Entry
        </button>
      </div>

      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th>Issued By</th>
            <th>Received By</th>
            <th>Approved By</th>
            <th>Checklist</th>
            <th>Checklist Completed By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log._id}>
              <td>{log.IssuedBy?.username || 'Current User'}</td>
              <td>{log.ReceivedBy?.username || 'N/A'}</td>
              <td>{log.ApprovedBy?.username || 'N/A'}</td>
              <td>{log.Checklist?.name || 'N/A'}</td>
              <td>{log.CheckListCompletedBy?.username || 'Current User'}</td>
              <td>
                <div className="btn-group">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => handleView(log)}>
                    View
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => handleEdit(log)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(log._id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Form Offcanvas */}
      <div className="offcanvas offcanvas-end" tabIndex="-1" id="logFormCanvas">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">{isEdit ? 'Edit Log Entry' : 'Add New Log Entry'}</h5>
          <button type="button" className="btn-close" onClick={() => formCanvas.hide()}></button>
        </div>
        <div className="offcanvas-body">
          <form onSubmit={handleSubmit}>
            {/* Issued By Field */}
            <div className="mb-3">
              <label className="form-label">Issued By</label>
              <Select
                className="basic-single"
                classNamePrefix="select"
                name="IssuedBy"
                value={formData.IssuedBy}
                onChange={(selectedOption) => handleSelectChange('IssuedBy', selectedOption)}
                options={[
                  { value: 'current-user', label: 'Current User' },
                  ...userOptions
                ]}
                isSearchable
                placeholder="Select issuer..."
              />
            </div>

            {/* Received By Field */}
            <div className="mb-3">
              <label className="form-label">Received By</label>
              <Select
                className="basic-single"
                classNamePrefix="select"
                name="ReceivedBy"
                value={formData.ReceivedBy}
                onChange={(selectedOption) => handleSelectChange('ReceivedBy', selectedOption)}
                options={userOptions}
                onInputChange={fetchUsers}
                isLoading={isLoadingUsers}
                isSearchable
                placeholder="Search and select recipient..."
                required
              />
            </div>

            {/* Approved By Field (Optional) */}
            <div className="mb-3">
              <label className="form-label">Approved By (Optional)</label>
              <Select
                className="basic-single"
                classNamePrefix="select"
                name="ApprovedBy"
                value={formData.ApprovedBy}
                onChange={(selectedOption) => handleSelectChange('ApprovedBy', selectedOption)}
                options={userOptions}
                onInputChange={fetchUsers}
                isLoading={isLoadingUsers}
                isSearchable
                placeholder="Search and select approver..."
              />
            </div>

            {/* Checklist Field */}
            <div className="mb-3">
              <label className="form-label">Checklist</label>
              <Select
                className="basic-single"
                classNamePrefix="select"
                name="Checklist"
                value={formData.Checklist}
                onChange={(selectedOption) => handleSelectChange('Checklist', selectedOption)}
                options={checklistOptions}
                onInputChange={fetchChecklists}
                isLoading={isLoadingChecklists}
                isSearchable
                placeholder="Search and select checklist..."
              />
            </div>

            {/* Checklist Completed By Field */}
            <div className="mb-3">
              <label className="form-label">Checklist Completed By</label>
              <Select
                className="basic-single"
                classNamePrefix="select"
                name="CheckListCompletedBy"
                value={formData.CheckListCompletedBy}
                onChange={(selectedOption) => handleSelectChange('CheckListCompletedBy', selectedOption)}
                options={[
                  { value: 'current-user', label: 'Current User' },
                  ...userOptions
                ]}
                isSearchable
                placeholder="Select who completed the checklist..."
              />
            </div>

            {/* Remarks Field */}
            <div className="mb-3">
              <label className="form-label">Remarks / Notes</label>
              <textarea
                className="form-control"
                name="Remarks"
                value={formData.Remarks}
                onChange={handleChange}
                rows="4"
                placeholder="Enter any remarks or follow-up comments..."
              ></textarea>
            </div>

            <div className="d-flex justify-content-end mt-4">
              <button type="button" className="btn btn-outline-secondary me-2" onClick={() => formCanvas.hide()}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {isEdit ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* View Offcanvas */}
      <div className="offcanvas offcanvas-end" tabIndex="-1" id="logViewCanvas">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Log Entry Details</h5>
          <button type="button" className="btn-close" onClick={() => viewCanvas.hide()}></button>
        </div>
        <div className="offcanvas-body">
          {viewLog && (
            <div>
              <div className="mb-3">
                <h6>Issued By</h6>
                <p>{viewLog.IssuedBy?.username || 'Current User'}</p>
              </div>

              <div className="mb-3">
                <h6>Received By</h6>
                <p>{viewLog.ReceivedBy?.username || 'N/A'}</p>
              </div>

              <div className="mb-3">
                <h6>Approved By</h6>
                <p>{viewLog.ApprovedBy?.username || 'Not approved'}</p>
              </div>

              <div className="mb-3">
                <h6>Checklist</h6>
                <p>{viewLog.Checklist?.name || 'N/A'}</p>
              </div>

              <div className="mb-3">
                <h6>Checklist Completed By</h6>
                <p>{viewLog.CheckListCompletedBy?.username || 'Current User'}</p>
              </div>

              <div className="mb-3">
                <h6>Remarks</h6>
                <p>{viewLog.Remarks || 'No remarks'}</p>
              </div>

              <div className="mb-3">
                <h6>Created At</h6>
                <p>{new Date(viewLog.createdAt).toLocaleString()}</p>
              </div>

              <div className="mb-3">
                <h6>Last Updated</h6>
                <p>{new Date(viewLog.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}