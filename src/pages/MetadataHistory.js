import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Offcanvas } from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

 function MetadataHistory() {
  const [metaList, setMetaList] = useState([]);
  const [formData, setFormData] = useState({
    LastUpdatedOn: '',
    UpdatedBy: '',
    StatusLog: '',
  });
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [formCanvas, setFormCanvas] = useState(null);
  const [viewCanvas, setViewCanvas] = useState(null);

  useEffect(() => {
    fetchData();
    setFormCanvas(new Offcanvas(document.getElementById('metaFormCanvas')));
    setViewCanvas(new Offcanvas(document.getElementById('metaViewCanvas')));
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/meta-history');
      setMetaList(res.data);
    } catch (err) {
      console.error('Error fetching metadata history:', err);
    }
  };

  const resetForm = () => {
    setFormData({ LastUpdatedOn: '', UpdatedBy: '', StatusLog: '' });
    setIsEdit(false);
    setEditId(null);
  };

  const handleCreate = () => {
    resetForm();
    formCanvas.show();
  };

  const handleEdit = (entry) => {
    setFormData({
      LastUpdatedOn: entry.LastUpdatedOn,
      UpdatedBy: entry.UpdatedBy,
      StatusLog: entry.StatusLog,
    });
    setIsEdit(true);
    setEditId(entry._id);
    formCanvas.show();
  };

  const handleView = (entry) => {
    setViewData(entry);
    viewCanvas.show();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await axios.delete(`/api/meta-history/${id}`);
        fetchData();
      } catch (err) {
        console.error('Error deleting entry:', err);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await axios.put(`/api/meta-history/${editId}`, formData);
      } else {
        await axios.post('/api/meta-history', formData);
      }
      fetchData();
      resetForm();
      formCanvas.hide();
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Metadata & History</h2>
        <button className="btn btn-primary" onClick={handleCreate}>
          Add Metadata Entry
        </button>
      </div>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Last Updated On</th>
            <th>Updated By</th>
            <th>Status Log</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {metaList.map((entry) => (
            <tr key={entry._id}>
              <td>{entry.LastUpdatedOn}</td>
              <td>{entry.UpdatedBy}</td>
              <td>{entry.StatusLog}</td>
              <td>
                <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleView(entry)}>
                  View
                </button>
                <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => handleEdit(entry)}>
                  Edit
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(entry._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Form Canvas */}
      <div className="offcanvas offcanvas-end" tabIndex="-1" id="metaFormCanvas">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">{isEdit ? 'Edit Entry' : 'Add New Entry'}</h5>
          <button type="button" className="btn-close" onClick={() => formCanvas.hide()}></button>
        </div>
        <div className="offcanvas-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Last Updated On</label>
              <input
                type="text"
                className="form-control"
                name="LastUpdatedOn"
                value={formData.LastUpdatedOn}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Updated By</label>
              <input
                type="text"
                className="form-control"
                name="UpdatedBy"
                value={formData.UpdatedBy}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Status Log</label>
              <textarea
                className="form-control"
                name="StatusLog"
                value={formData.StatusLog}
                onChange={handleChange}
                rows="4"
              ></textarea>
            </div>
            <div className="d-flex justify-content-end">
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

      {/* View Canvas */}
      <div className="offcanvas offcanvas-end" tabIndex="-1" id="metaViewCanvas">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Metadata Details</h5>
          <button type="button" className="btn-close" onClick={() => viewCanvas.hide()}></button>
        </div>
        <div className="offcanvas-body">
          {viewData && (
            <>
              <div className="mb-3">
                <h6>Last Updated On</h6>
                <p>{viewData.LastUpdatedOn}</p>
              </div>
              <div className="mb-3">
                <h6>Updated By</h6>
                <p>{viewData.UpdatedBy}</p>
              </div>
              <div className="mb-3">
                <h6>Status Log</h6>
                <p>{viewData.StatusLog}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export default MetadataHistory;
