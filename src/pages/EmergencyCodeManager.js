import React, { useEffect, useState } from 'react';
import axios from 'axios';
 
function EmergencyCodeManager() {
  const [codeName, setCodeName] = useState('');
  const [summaryInput, setSummaryInput] = useState('');
  const [summaries, setSummaries] = useState([]);
  const [codes, setCodes] = useState([]);
  const [showCanvas, setShowCanvas] = useState(false);
  const token = localStorage.getItem('access_token');
 
  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchCodes();
  }, []);
 
  const fetchCodes = async () => {
    try {
      const res = await axios.get('http://api.avessecurity.com:6378/api/DrillCode/get', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data?.DrillCode) ? res.data.DrillCode : [];
      console.log("Fetched codes:", list);
      setCodes(list);
    } catch (error) {
      console.error('Failed to fetch codes:', error);
    }
  };
 
  const handleAddSummary = () => {
    if (summaryInput.trim()) {
      setSummaries([...summaries, summaryInput]);
      setSummaryInput('');
    }
  };
 
  const handleCreateCode = async () => {
    if (!codeName.trim() || summaries.length === 0) {
      alert("Please enter a code name and at least one summary.");
      return;
    }
 
    try {
      const payload = {
        CodeName: codeName,
        CodeSummary: summaries.map(summary => ({ AddSummary: summary }))
      };
 
      const codeRes = await axios.post(
        "http://api.avessecurity.com:6378/api/DrillCode/create",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
 
      console.log("Create response:", codeRes.data);
 
      if (!codeRes.data?.Drilling?._id) throw new Error("Code ID not returned from API");
 
      alert("Code and summaries created successfully!");
      setCodeName('');
      setSummaries([]);
      fetchCodes();
 
    } catch (error) {
      console.error("Failed to create code", error);
      alert("Failed to create code");
    }
  };
 
  const handleDeleteCode = async (id) => {
    if (!window.confirm("Are you sure you want to delete this code?")) return;
    try {
      await axios.delete(`http://api.avessecurity.com:6378/api/DrillCode/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCodes();
    } catch (error) {
      console.error("Failed to delete code:", error);
    }
  };
 
  const toggleCanvas = () => setShowCanvas(!showCanvas);
 
  return (
    <div className="container mt-5 text-black">
      <div className="row">
        <div className="col-lg-6 col-md-8">
          <div className="card border border-dark shadow p-4 rounded-4">
            <h4 className="mb-4 fw-bold">Emergency Code Setup</h4>
 
            <div className="mb-3">
              <label className="form-label fw-bold">Code Name</label>
              <input
                type="text"
                className="form-control border border-dark"
                value={codeName}
                onChange={(e) => setCodeName(e.target.value)}
              />
            </div>
 
            <div className="mb-3">
              <label className="form-label fw-bold">Code Summary</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control border border-dark"
                  value={summaryInput}
                  onChange={(e) => setSummaryInput(e.target.value)}
                />
                <button className="btn btn-outline-secondary" onClick={handleAddSummary}>+</button>
              </div>
              <ul className="list-group mt-2">
                {summaries.map((summary, index) => (
                  <li key={index} className="list-group-item border border-dark">
                    {summary}
                  </li>
                ))}
              </ul>
            </div>
 
            <div className="d-flex gap-2">
              <button className="btn btn-primary fw-bold" onClick={handleCreateCode}>+ Create</button>
              <button className="btn btn-outline-danger fw-bold" onClick={toggleCanvas}>View Codes</button>
            </div>
          </div>
        </div>
      </div>
 
      {/* Offcanvas */}
      <div
        className={`offcanvas offcanvas-end ${showCanvas ? 'show' : ''}`}
        tabIndex="-1"
        style={{ visibility: showCanvas ? 'visible' : 'hidden', backgroundColor: 'white' }}
      >
        <div className="offcanvas-header border-bottom border-dark">
          <h5 className="offcanvas-title">Created Codes</h5>
          <button type="button" className="btn-close" onClick={toggleCanvas}></button>
        </div>
        <div className="offcanvas-body">
          {Array.isArray(codes) && codes.length > 0 ? (
            <ul className="list-group">
              {codes.map((code) => (
                <li
                  key={code._id || code.CodeName}
                  className="list-group-item shadow-sm rounded-3 mb-2 border border-dark text-black"
                >
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="fw-bold">{code.CodeName || 'Unnamed Code'}</div>
                      {Array.isArray(code.CodeSummary) && code.CodeSummary.length > 0 ? (
                        <ul className="mt-2 ps-3">
                          {code.CodeSummary.map((summary) => (
                            <li key={summary._id || summary.AddSummary}>{summary.AddSummary}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-muted">No summaries available</div>
                      )}
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteCode(code._id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No emergency codes found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
 
export default EmergencyCodeManager;