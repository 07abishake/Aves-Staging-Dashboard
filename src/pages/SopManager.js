import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://api.avessecurity.com/api/Sop';

const SopManager = () => {
  const [sops, setSops] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    FileName: '',
    userId: '',
    DepartMent: '',
  });
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
    } else {
      fetchSops();
      fetchDropdowns();
    }
  }, []);

  const fetchSops = async () => {
    try {
      const res = await axios.get(`${API_BASE}/getAll`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.Sop) {
        setSops(res.data.Sop);
      }
    } catch (err) {
      console.error('Error fetching SOPs:', err);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [userRes, deptRes] = await Promise.all([
        axios.get(`https://api.avessecurity.com/api/Department/getDropdown`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`https://api.avessecurity.com/api/Department/getDataDepartment`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setUsers(userRes.data.user || []);
      setDepartments(deptRes.data.Department || []);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('FileName', formData.FileName);
      data.append('userId', formData.userId);
      data.append('DepartMent', formData.DepartMent);
      if (file) data.append('UploadFile', file);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editingId) {
        await axios.put(`${API_BASE}/update/${editingId}`, data, config);
      } else {
        await axios.post(`${API_BASE}/create`, data, config);
      }

      await fetchSops();
      setFormData({ FileName: '', userId: '', DepartMent: '' });
      setFile(null);
      setEditingId(null);
      document.getElementById('closeCanvasBtn')?.click();
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  };

  const handleEdit = (sop) => {
    setFormData({
      FileName: sop.FileName || '',
      userId: sop.userId?._id || sop.userId || '',
      DepartMent: sop.DepartMent?._id || sop.DepartMent || '',
    });
    setEditingId(sop._id);
    document.querySelector('[data-bs-target="#sopCanvas"]')?.click();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this SOP?')) {
      try {
        await axios.delete(`${API_BASE}/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchSops();
      } catch (err) {
        console.error('Error deleting SOP:', err);
      }
    }
  };

  const getUserName = (user) =>
    typeof user === 'object' ? user?.username : users.find((u) => u._id === user)?.username || 'N/A';

  const getDepartmentName = (dept) =>
    typeof dept === 'object' ? dept?.name : departments.find((d) => d._id === dept)?.name || 'N/A';

  return (
  <div className="container py-5">
    <div className="d-flex justify-content-between align-items-center mb-4">
      <h2 className="fw-bold">SOP Manager</h2>
      <button
        className="btn btn-outline-primary"
        data-bs-toggle="offcanvas"
        data-bs-target="#sopCanvas"
      >
        <i className="bi bi-plus-circle me-2"></i> Add SOP
      </button>
    </div>

    <div className="table-responsive">
      <table className="table table-striped table-bordered align-middle text-center">
        <thead className="">
          <tr>
            <th>User</th>
            <th>Department</th>
            <th>File Name</th>
            <th>File</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sops.map((sop) => (
            <tr key={sop._id}>
              <td>{getUserName(sop.userId)}</td>
              <td>{getDepartmentName(sop.DepartMent)}</td>
              <td>{sop.FileName}</td>
              <td>
                {sop.UploadFile?.[0] && (
                  <a
                    href={`https://api.avessecurity.com/${sop.UploadFile[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-info"
                  >
                    <i className="bi bi-eye me-1"></i> View
                  </a>
                )}
              </td>
              <td>
                <button
                  className="btn btn-sm btn-outline-warning me-2"
                  onClick={() => handleEdit(sop)}
                >
                  <i className="bi bi-pencil-square"></i>
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(sop._id)}
                >
                  <i className="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Offcanvas Form */}
    <div className="offcanvas offcanvas-end" tabIndex="-1" id="sopCanvas">
      <div className="offcanvas-header border-bottom">
        <h5 className="mb-0 fw-semibold">{editingId ? 'Edit SOP' : 'Add SOP'}</h5>
        <button
          type="button"
          id="closeCanvasBtn"
          className="btn-close"
          data-bs-dismiss="offcanvas"
        ></button>
      </div>
      <div className="offcanvas-body">
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="mb-3">
            <label className="form-label fw-semibold">User</label>
            <select
              className="form-select"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              required
            >
              <option value="">Select User</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Department</label>
            <select
              className="form-select"
              name="DepartMent"
              value={formData.DepartMent}
              onChange={handleChange}
              required
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">File Name</label>
            <input
              type="text"
              className="form-control"
              name="FileName"
              value={formData.FileName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Upload File</label>
            <input
              type="file"
              className="form-control"
              onChange={handleFileChange}
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            {editingId ? 'Update SOP' : 'Create SOP'}
          </button>
        </form>
      </div>
    </div>
  </div>
  );
};

export default SopManager;
