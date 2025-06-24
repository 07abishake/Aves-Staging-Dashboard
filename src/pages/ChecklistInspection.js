import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Offcanvas } from 'bootstrap';

export function ChecklistInspection() {
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({
    ChecklistId: '',
    InspectionDate: '',
    InspectionStatus: 'Passed',
    InspectionNotes: '',
    AttachmentUpload: ''
  });
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [formCanvas, setFormCanvas] = useState(null);
  const [viewCanvas, setViewCanvas] = useState(null);

  useEffect(() => {
    fetchRecords();
    setFormCanvas(new Offcanvas(document.getElementById('checklistFormCanvas')));
    setViewCanvas(new Offcanvas(document.getElementById('checklistViewCanvas')));
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await axios.get('/api/checklist-inspections');
      setRecords(res.data);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      ChecklistId: '',
      InspectionDate: '',
      InspectionStatus: 'Passed',
      InspectionNotes: '',
      AttachmentUpload: ''
    });
    setIsEdit(false);
    setEditId(null);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'AttachmentUpload' && files.length > 0) {
      setFormData(prev => ({ ...prev, [name]: files[0].name }));
      // Actual file upload logic should be implemented separately
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreate = () => {
    resetForm();
    formCanvas.show();
  };

  const handleEdit = (record) => {
    setFormData({
      ChecklistId: record.ChecklistId || '',
      InspectionDate: record.InspectionDate?.substring(0, 10) || '',
      InspectionStatus: record.InspectionStatus || 'Passed',
      InspectionNotes: record.InspectionNotes || '',
      AttachmentUpload: record.AttachmentUpload || ''
    });
    setIsEdit(true);
    setEditId(record._id);
    formCanvas.show();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await axios.put(`/api/checklist-inspections/${editId}`, formData);
      } else {
        await axios.post('/api/checklist-inspections', formData);
      }
      fetchRecords();
      formCanvas.hide();
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleView = (record) => {
    setViewData(record);
    viewCanvas.show();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await axios.delete(`/api/checklist-inspections/${id}`);
        fetchRecords();
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between mb-3">
        <h2>Checklist & Inspection</h2>
        <button className="btn btn-primary" onClick={handleCreate}>Add Entry</button>
      </div>

      <table className="table table-hover">
        <thead>
          <tr>
            <th>Checklist ID</th>
            <th>Inspection Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map(r => (
            <tr key={r._id}>
              <td>{r.ChecklistId}</td>
              <td>{new Date(r.InspectionDate).toLocaleDateString()}</td>
              <td>{r.InspectionStatus}</td>
              <td>
                <div className="btn-group">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => handleView(r)}>View</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => handleEdit(r)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r._id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Form Offcanvas */}
      <div className="offcanvas offcanvas-end" tabIndex="-1" id="checklistFormCanvas">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">{isEdit ? 'Edit Entry' : 'Add New Entry'}</h5>
          <button type="button" className="btn-close" onClick={() => formCanvas.hide()}></button>
        </div>
        <div className="offcanvas-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Checklist ID</label>
              <input type="text" className="form-control" name="ChecklistId" value={formData.ChecklistId} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Inspection Date</label>
              <input type="date" className="form-control" name="InspectionDate" value={formData.InspectionDate} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Inspection Status</label>
              <select className="form-select" name="InspectionStatus" value={formData.InspectionStatus} onChange={handleChange}>
                <option>Passed</option>
                <option>Failed</option>
                <option>Needs Attention</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Inspection Notes</label>
              <textarea className="form-control" name="InspectionNotes" value={formData.InspectionNotes} onChange={handleChange}></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label">Attachment Upload</label>
              <input type="file" className="form-control" name="AttachmentUpload" onChange={handleChange} />
            </div>
            <div className="d-flex justify-content-end">
              <button type="button" className="btn btn-outline-secondary me-2" onClick={() => formCanvas.hide()}>Cancel</button>
              <button type="submit" className="btn btn-primary">{isEdit ? 'Update' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>

      {/* View Offcanvas */}
      <div className="offcanvas offcanvas-end" tabIndex="-1" id="checklistViewCanvas">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Inspection Details</h5>
          <button type="button" className="btn-close" onClick={() => viewCanvas.hide()}></button>
        </div>
        <div className="offcanvas-body">
          {viewData && (
            <>
              <div className="mb-3"><strong>Checklist ID:</strong> {viewData.ChecklistId}</div>
              <div className="mb-3"><strong>Inspection Date:</strong> {new Date(viewData.InspectionDate).toLocaleDateString()}</div>
              <div className="mb-3"><strong>Status:</strong> {viewData.InspectionStatus}</div>
              <div className="mb-3"><strong>Notes:</strong> {viewData.InspectionNotes || 'None'}</div>
              <div className="mb-3"><strong>Attachment:</strong> {viewData.AttachmentUpload || 'No file uploaded'}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
