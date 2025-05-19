// import React from 'react';
// import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// const userActivityData = [
//   { name: 'Mon', active: 120, new: 20 },
//   { name: 'Tue', active: 150, new: 15 },
//   { name: 'Wed', active: 180, new: 25 },
//   { name: 'Thu', active: 170, new: 18 },
//   { name: 'Fri', active: 160, new: 22 },
// ];

// const storageData = [
//   { name: 'Documents', usage: 300 },
//   { name: 'Images', usage: 200 },
//   { name: 'Videos', usage: 150 },
//   { name: 'Others', usage: 100 },
// ];

// function Reports() {
//   return (
//     <div>
//       <h2 className="mb-4">Reports & Analytics</h2>

//       <div className="row">
//         <div className="col-md-3">
//           <div className="card">
//             <div className="card-body">
//               <h6 className="card-title">Total Users</h6>
//               <h2>1,234</h2>
//               <p className="text-success mb-0">
//                 <i className="bi bi-arrow-up"></i> 12% increase
//               </p>
//             </div>
//           </div>
//         </div>
//         <div className="col-md-3">
//           <div className="card">
//             <div className="card-body">
//               <h6 className="card-title">Active Sessions</h6>
//               <h2>856</h2>
//               <p className="text-success mb-0">
//                 <i className="bi bi-arrow-up"></i> 8% increase
//               </p>
//             </div>
//           </div>
//         </div>
//         <div className="col-md-3">
//           <div className="card">
//             <div className="card-body">
//               <h6 className="card-title">Storage Used</h6>
//               <h2>750 GB</h2>
//               <p className="text-warning mb-0">
//                 75% of total
//               </p>
//             </div>
//           </div>
//         </div>
//         <div className="col-md-3">
//           <div className="card">
//             <div className="card-body">
//               <h6 className="card-title">System Uptime</h6>
//               <h2>99.9%</h2>
//               <p className="text-success mb-0">
//                 Last 30 days
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="row mt-4">
//         <div className="col-md-8">
//           <div className="card">
//             <div className="card-body">
//               <h5 className="card-title">User Activity</h5>
//               <ResponsiveContainer width="100%" height={300}>
//                 <LineChart data={userActivityData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="name" />
//                   <YAxis />
//                   <Tooltip />
//                   <Legend />
//                   <Line type="monotone" dataKey="active" stroke="#8884d8" name="Active Users" />
//                   <Line type="monotone" dataKey="new" stroke="#82ca9d" name="New Users" />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </div>

//           <div className="card mt-4">
//             <div className="card-body">
//               <h5 className="card-title">Storage Distribution</h5>
//               <ResponsiveContainer width="100%" height={300}>
//                 <BarChart data={storageData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="name" />
//                   <YAxis />
//                   <Tooltip />
//                   <Legend />
//                   <Bar dataKey="usage" fill="#8884d8" name="Storage (GB)" />
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         </div>

//         <div className="col-md-4">
//           <div className="card">
//             <div className="card-body">
//               <h5 className="card-title">Recent Activities</h5>
//               <ul className="list-group list-group-flush">
//                 <li className="list-group-item">
//                   <div className="d-flex w-100 justify-content-between">
//                     <h6 className="mb-1">New user registered</h6>
//                     <small>3 mins ago</small>
//                   </div>
//                   <p className="mb-1">John Doe joined the platform</p>
//                 </li>
//                 <li className="list-group-item">
//                   <div className="d-flex w-100 justify-content-between">
//                     <h6 className="mb-1">System update</h6>
//                     <small>1 hour ago</small>
//                   </div>
//                   <p className="mb-1">Version 2.1.0 deployed</p>
//                 </li>
//                 <li className="list-group-item">
//                   <div className="d-flex w-100 justify-content-between">
//                     <h6 className="mb-1">Storage alert</h6>
//                     <small>2 hours ago</small>
//                   </div>
//                   <p className="mb-1">75% storage capacity reached</p>
//                 </li>
//               </ul>
//             </div>
//           </div>

//           <div className="card mt-4">
//             <div className="card-body">
//               <h5 className="card-title">System Health</h5>
//               <div className="mb-3">
//                 <label className="form-label">CPU Usage</label>
//                 <div className="progress">
//                   <div className="progress-bar" role="progressbar" style={{width: '65%'}}>65%</div>
//                 </div>
//               </div>
//               <div className="mb-3">
//                 <label className="form-label">Memory Usage</label>
//                 <div className="progress">
//                   <div className="progress-bar" role="progressbar" style={{width: '80%'}}>80%</div>
//                 </div>
//               </div>
//               <div className="mb-3">
//                 <label className="form-label">Network Load</label>
//                 <div className="progress">
//                   <div className="progress-bar" role="progressbar" style={{width: '45%'}}>45%</div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Reports;
import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { Table } from "react-bootstrap";
// import { FaFileAlt } from "react-icons/fa";
import { Spinner } from "react-bootstrap"
function Reports() {
  const [datastaffall, setDatastaffall] = useState([
    { id: 1, name: "aves", staff_id: "12345", department: "dev", destignation: "dev", role: "dev" },
    { id: 2, name: "aves", staff_id: "12345", department: "dev", destignation: "dev", role: "dev" },
    { id: 3, name: "aves", staff_id: "12345", department: "dev", destignation: "dev", role: "dev" },
    { id: 4, name: "aves", staff_id: "12345", department: "dev", destignation: "dev", role: "dev" },
  ]);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = "/login";
    }

  // Fetch modules from API
  useEffect(() => {
    axios.get(`https://api.avessecurity.com/api/collection/getModule`,{
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(response => {
        if (Array.isArray(response.data)) {
          const formattedModules = response.data.map(module => ({
            value: module,
            label: module.replace(/([a-z])([A-Z])/g, '$1 $2') // Format name
          }));
          setModules(formattedModules);
          // console.log("formated module : ", formattedModules)
        }
      })
      .catch(error => {
        console.error("Error fetching modules:", error);
      });
  }, []);

  const validateDates = () => {
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      alert("End date cannot be before start date.");
      setEndDate(''); // Clear the end date value
      return false;
    }
    return true;
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    validateDates();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateDates()) {
      return;
    }

    // Check if the selected module is "emdoorchecklistsnews"
    if (!selectedModule) {
      alert("Please select any module to generate the report.");
      return;
    }

    const requestData = {
      startDate,
      endDate,
      name,
      location,
      status,
    };
    console.log("requst data : ", requestData)
    setLoading(true);
    console.log("selected modeile", selectedModule)
    try {
      const response = await axios.post(
        `https://api.avessecurity.com/api/ReportGenrate/Pdf/${selectedModule?.value}`,
        requestData,
        {
          responseType: "blob", // Important for handling file downloads
        }
      );

      // Create a blob URL for downloading
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const fileName = `${selectedModule.label}_Report.pdf`;
      link.setAttribute("download", fileName); // Change filename if needed
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again.");
    }
    finally {
      setLoading(false); // Stop loading spinner
    }
  };

  return (

    <div className="m-0 p-0">
      {loading && (
        <div className="d-flex justify-content-center align-items-center flex-column" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <Spinner animation="border" role="status" variant="light">
          </Spinner>
          <span className="text-white">Generating Report...</span>
        </div>
      )}
      <div className="container-fluid">
        <section className="section mt-4">
          <div className="card p-4">
            <form onSubmit={handleSubmit} className="row">
              <div className="col-12 mb-3 report">
                <label className="form-label fw-bold">MODULE</label>
                <Select
                  options={modules}
                  value={selectedModule}
                  onChange={setSelectedModule}
                  placeholder="Search & select module"
                  isSearchable
                />
              </div>
              <div className="col-6">
                <label className="form-label fw-bold">SELECT START DATE</label>
                <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label fw-bold">SELECT END DATE</label>
                <input type="date" className="form-control" value={endDate} onChange={handleEndDateChange} />
              </div>
              <div className="col-6">
                <label className="form-label fw-bold">NAME</label>
                <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label fw-bold">LOCATION</label>
                <input type="text" className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label fw-bold">STATUS</label>
                <input type="text" className="form-control" value={status} onChange={(e) => setStatus(e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label fw-bold">DEPARTMENT</label>
                <input type="text" className="form-control" value={department} onChange={(e) => setDepartment(e.target.value)} />
              </div>

              <div className="col-md-12 text-center mt-4">
                <button type="submit" className="btn btn-dark" style={{ borderRadius: "25px" }}>

                  Generate Report
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Reports;