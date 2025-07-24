import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { Modal, Button, Spinner } from "react-bootstrap";
import debounce from "lodash/debounce";

function Reports() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userId, setuserId] = useState(null);
  const [LocationId, setLocationId] = useState(null);
  const [Status, setStatus] = useState(null);
  const [DepartmentId, setDepartmentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
    const [reportData, setReportData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [error, setError] = useState('');

  // Dropdown options state
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [userInput, setUserInput] = useState('');
  
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Good', label: 'Good' },
    { value: 'Faulty', label: 'Faulty' },
    { value: 'Pending', label: 'Pending' }
  ];

  const token = localStorage.getItem("access_token");
  if (!token) {
    // window.location.href = "/login";
  }

  useEffect(() => {
    // Fetch initial data
    fetchModules();
    fetchDepartments();
    fetchLocations();
    fetchAllUsers();
  }, [token]);

  const fetchModules = async () => {
    try {
      const response = await axios.get(`https://api.avessecurity.com/api/collection/getModule`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (Array.isArray(response.data.dropdown)) {
        const formattedModules = response.data.dropdown.map(item => ({
          value: item.value,
          label: item.label
        }));
            setUsers(formattedModules);
        setModules(formattedModules);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        'https://api.avessecurity.com/api/Department/getAll',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const departmentOptions = [];
      response.data.forEach(parent => {
        departmentOptions.push({ value: parent._id, label: parent.name });

        if (parent.children && parent.children.length > 0) {
          parent.children.forEach(child => {
            departmentOptions.push({
              value: child._id,
              label: child.name
            });
          });
        }
      });

      setDepartments(departmentOptions);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get(
        "https://api.avessecurity.com/api/Location/getLocations",
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data && response.data.Location) {
        const locationOptions = response.data.Location.map(loc => ({
          value: loc._id,
          label: loc.name
        }));
        setLocations(locationOptions);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(
        "https://api.avessecurity.com/api/Designation/getDropdown",
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data && response.data.Report) {
        const userOptions = response.data.Report.map(user => ({
          value: user._id,
          label: user.username
        }));
        setUsers(userOptions);
      }
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  };

  const fetchUsers = debounce(async (query) => {
    if (!query) return;
    try {
      const response = await axios.get(
        `https://api.avessecurity.com/api/Designation/getDropdown/${query}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data && response.data.Report) {
        const userOptions = response.data.Report.map((user) => ({
          value: user._id,
          label: user.username,
        }));
        setUsers(userOptions);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, 500);

  const validateDates = () => {
    if (!startDate || !endDate) {
      setError("Both start and end dates are required");
      return false;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError("End date cannot be before start date");
      return false;
    }
    setError('');
    return true;
  };

  const handlePreview = async () => {
    if (!validateDates()) return;
    if (!selectedModule) {
      setError("Please select a module");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `https://api.avessecurity.com/api/ReportGenrate/data/${selectedModule.value}`,
        {
          startDate,
          endDate,
          userId: userId?.value || '',
          LocationId: LocationId?.value || '',
          Status: Status?.value || '',
          DepartmentId: DepartmentId?.value || ''
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );

      setPreviewHtml(response.data);
        setReportData(response.data);
      setShowPreview(true);
    } catch (error) {
      console.error("Error previewing report:", error);
      setError(error.response?.data?.message || "Failed to preview report");
    } finally {
      setLoading(false);
    }
  };
    const filteredReports = selectedUser
  ? reportData.filter(report =>
      report.userId === selectedUser.value ||
      report.SubmittedUserId === selectedUser.value ||
      report.CreatedBy === selectedUser.value ||
      report.StaffId === selectedUser.value ||
      report.UserId === selectedUser.value ||
      report.LocationId === selectedUser.value ||
      report.DepartmentId === selectedUser.value
    )
  : reportData;

  const handleGeneratePdf = async () => {
    if (!validateDates()) return;
    if (!selectedModule) {
      setError("Please select a module");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `https://api.avessecurity.com/api/ReportGenrate/Pdf/${selectedModule.value}`,
        {
          startDate,
          endDate,
          userId: userId?.value || '',
          LocationId: LocationId?.value || '',
          Status: Status?.value || '',
          DepartmentId: DepartmentId?.value || ''
        },
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${selectedModule.label}_Report_${new Date().toISOString().slice(0,10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError(error.response?.data?.message || "Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      {loading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          zIndex: 1050 
        }}>
          <div className="text-center bg-white p-4 rounded shadow">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 mb-0">Processing report...</p>
          </div>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">
            <i className="bi bi-file-earmark-bar-graph me-2"></i>
            Report Generator
          </h5>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger mb-4">
              {error}
            </div>
          )}

          <div className="row g-3">
            <div className="col-md-12">
              <label className="form-label fw-bold">Module</label>
              <Select
                options={modules}
                value={selectedModule}
                onChange={setSelectedModule}
                placeholder="Select report module..."
                isSearchable
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Start Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                max={endDate || undefined}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">End Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Checked By</label>
              <Select
                options={users}
                value={userId}
                onChange={setuserId}
                onInputChange={(inputValue) => {
                  setUserInput(inputValue);
                  fetchUsers(inputValue);
                }}
                placeholder="Search user..."
                isClearable
                isSearchable
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Location</label>
              <Select
                options={locations}
                value={LocationId}
                onChange={setLocationId}
                placeholder="Select location..."
                isClearable
                isSearchable
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Status</label>
              <Select
                options={statusOptions}
                value={Status}
                onChange={setStatus}
                placeholder="Select status..."
                isClearable
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-bold">Department</label>
              <Select
                options={departments}
                value={DepartmentId}
                onChange={setDepartmentId}
                placeholder="Select department..."
                isClearable
                isSearchable
              />
            </div>

            <div className="col-md-12 mt-4 d-flex justify-content-end gap-2">
              <button 
                type="button" 
                className="btn btn-primary px-4" 
                onClick={handlePreview}
                disabled={!selectedModule || loading}
              >
                <i className="bi bi-eye me-1"></i> Preview Report
              </button>
              <button 
                type="button" 
                className="btn btn-success px-4" 
                onClick={handleGeneratePdf}
                disabled={!selectedModule || loading}
              >
                <i className="bi bi-file-earmark-pdf me-1"></i> Generate PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="xl" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <i className="bi bi-file-earmark-text me-2"></i>
            {selectedModule?.label} Report Preview
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            <i className="bi bi-x-circle me-1"></i> Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Reports;