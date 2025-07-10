import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { Modal, Button, Spinner } from "react-bootstrap";

function Reports() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem("access_token");
  if (!token) {
    // window.location.href = "/login";
  }

  useEffect(() => {
    axios.get(`https://api.avessecurity.com/api/collection/getModule`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(response => {
        if (Array.isArray(response.data.dropdown)) {
        const formattedModules = response.data.dropdown.map(item => ({
          value: item.value,
          label: item.label
        }));
        setModules(formattedModules);
        }
      })
      .catch(error => {
        console.error("Error fetching modules:", error);
      });
  }, [token]);

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
          name,
          location,
          status,
          department
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );

      setPreviewHtml(response.data);
      setShowPreview(true);
    } catch (error) {
      console.error("Error previewing report:", error);
      setError(error.response?.data?.message || "Failed to preview report");
    } finally {
      setLoading(false);
    }
  };

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
          name,
          location,
          status,
          department
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
              <input 
                type="text" 
                className="form-control" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Filter by name..."
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Location</label>
              <input 
                type="text" 
                className="form-control" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                placeholder="Filter by location..."
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Status</label>
              <select 
                className="form-select" 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Good">Good</option>
                <option value="Faulty">Faulty</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div className="col-md-12">
              <label className="form-label fw-bold">Department</label>
              <input 
                type="text" 
                className="form-control" 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)} 
                placeholder="Filter by department..."
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