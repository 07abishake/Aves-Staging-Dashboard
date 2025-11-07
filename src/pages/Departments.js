import React, { useEffect, useState } from "react";
import Select from "react-select";
import axios from "axios";
import debounce from "lodash.debounce";
import { Spinner } from "react-bootstrap";

function Departments() {
  const [showOffCanvas, setShowOffCanvas] = useState(false);
  const [showCreateCanvas, setShowCreateCanvas] = useState(false);
  const [showViewCanvas, setShowViewCanvas] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [allDepts, setAllDepts] = useState([]);
  const [selectedDepartmentData, setSelectedDepartmentData] = useState(null);
  const [showEditCanvas, setShowEditCanvas] = useState(false);
  const [editDepartmentData, setEditDepartmentData] = useState({
    id: "",
    name: "",
    parentId: "",
    leadId: "",
    assignUsers: [],
  });
  const [searchUser, setSearchUser] = useState("");
  const [reloadTrigger, setReloadTrigger] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("access_token");
  if (!token) {
    // window.location.href = "/login";
  }

  const filteredDepts = allDepts.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.leadName && dept.leadName.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (dept.parentDepartment && dept.parentDepartment.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDesignationClick = (department) => {
    setSelectedDepartmentData(department);
    setShowViewCanvas(true);
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "https://codeaves.avessecurity.com/api/Department/getDataDepartment",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data && response.data.Department) {
          setAllDepts(response.data.Department);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, [reloadTrigger, token]);

  // Fetch leads for Lead Name dropdown
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await axios.get(
          "https://codeaves.avessecurity.com/api/Department/getDropdown",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data && response.data.user) {
          const leadOptions = response.data.user.map((lead) => ({
            value: lead._id,
            label: (
              <div>
                <strong>{lead.username}</strong>
                <br />
                <small>{lead.EmailId}</small>
              </div>
            ),
          }));
          setLeads(leadOptions);
        }
      } catch (error) {
        console.error("Error fetching leads:", error);
      }
    };

    fetchLeads();
  }, [token]);

  // Debounced function to fetch users
  const fetchUsers = debounce(async (query) => {
    if (!query) return;
    try {
      const response = await axios.get(
        `https://codeaves.avessecurity.com/api/Designation/getDropdown/${query}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  useEffect(() => {
    fetchUsers(inputValue);
  }, [inputValue, fetchUsers]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://codeaves.avessecurity.com/api/Department/getAll",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch departments");
      }
      const data = await response.json();

      // Flatten the department hierarchy
      const departmentOptions = [];
      data.forEach((parent) => {
        departmentOptions.push({ value: parent._id, label: parent.name });

        if (parent.children && parent.children.length > 0) {
          parent.children.forEach((child) => {
            departmentOptions.push({
              value: child._id,
              label: child.name,
            });
          });
        }
      });

      setDepartments(departmentOptions);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const requestBody = {
      name,
      leadId: selectedLead ? selectedLead.value : null,
      parentId: selectedDepartment || null,
      assignUsers: selectedUsers.map((user) => user.value),
    };

    try {
      const response = await fetch(
        "https://codeaves.avessecurity.com/api/Department/Create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        alert("Department created successfully!");
        setShowCreateCanvas(false);
        setName("");
        setSelectedLead(null);
        setSelectedDepartment("");
        setSelectedUsers([]);
        // Only trigger state update, remove window.location.reload()
        setReloadTrigger((prev) => !prev);
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to create department");
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDesignation = async (userId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this department?"
    );
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(
        `https://codeaves.avessecurity.com/api/Department/delete/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        alert("Department deleted successfully");
        // Only trigger state update, remove window.location.reload()
        setReloadTrigger((prev) => !prev);
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      alert("Error deleting department");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const requestBody = {
      name: editDepartmentData.name,
      leadId: editDepartmentData.leadId || null,
      parentId: editDepartmentData.parentId || null,
      assignUsers: editDepartmentData.assignUsers.map((user) => user.value),
    };

    try {
      const response = await fetch(
        `https://codeaves.avessecurity.com/api/Department/update/${editDepartmentData.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        alert("Department updated successfully!");
        setShowEditCanvas(false);
        // Only trigger state update, remove window.location.reload()
        setReloadTrigger((prev) => !prev);
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to update department");
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (department) => {
    setEditDepartmentData({
      id: department._id,
      name: department.name || "",
      parentId: department.parentDepartment
        ? department.parentDepartment._id
        : "",
      leadId: department.leadName ? department.leadName._id : "",
      assignUsers: department.assignUsers
        ? department.assignUsers.map((user) => ({
            value: user._id,
            label: user.username,
          }))
        : [],
    });
    setShowEditCanvas(true);
  };

  return (
    <>
      {loading ? (
        <div
          className="d-flex justify-content-center align-items-center flex-column"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1050,
          }}
        >
          <Spinner animation="border" role="status" variant="light"></Spinner>
        </div>
      ) : (
        <div>
          <div className="d-flex justify-content-between align-items-center mt-3 mb-3">
            <div className="d-flex">
              <input
                type="text"
                className="form-control me-2"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary h-50"
              onClick={() => setShowCreateCanvas(true)}
            >
              Create Department
            </button>
          </div>
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Department Name</th>
                          <th>Lead Name</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDepts.map((dept) => (
                          <tr key={dept._id}>
                            <td>
                              <strong>{dept.name}</strong>
                              {dept.parentDepartment && (
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "14px",
                                    color: "#666",
                                  }}
                                >
                                  Parent: {dept.parentDepartment.name}
                                </p>
                              )}
                            </td>
                            <td>
                              {dept.leadName ? dept.leadName.username : "-"}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => handleDesignationClick(dept)}
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => handleEditClick(dept)}
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  handleDeleteDesignation(dept._id)
                                }
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Create Department Canvas */}
          <div
            className={`p-4 offcanvas-custom ${showCreateCanvas ? "show" : ""}`}
          >
            <div className="offcanvas-header mb-3">
              <h5 className="offcanvas-title">Create a new Department</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowCreateCanvas(false)}
                style={{ position: "absolute", right: "30px" }}
              ></button>
            </div>
            <div className="offcanvas-body p-2 overflow-hidden">
              <form onSubmit={handleSubmit} style={{ height: "500px" }}>
                <div className="d-flex mb-3 justify-content-between">
                  <label className="form-label me-2 mb-0 mt-1">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: "67%" }}
                    required
                  />
                </div>
                <div className="mb-3 d-flex justify-content-around">
                  <label className="form-label me-2 mb-0 mt-1 w-50">
                    Parent Department
                  </label>
                  <select
                    className="form-select"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3 d-flex justify-content-around">
                  <label className="form-label me-2 mb-0 mt-1 w-50">
                    Lead Name
                  </label>
                  <Select
                    options={leads}
                    value={selectedLead}
                    onChange={setSelectedLead}
                    placeholder="Select Lead"
                    className="w-100"
                  />
                </div>
                <div className="mb-3 d-flex justify-content-around">
                  <label className="form-label me-2 mb-0 mt-1 w-50">
                    Assign Users
                  </label>
                  <Select
                    options={users}
                    value={selectedUsers}
                    onChange={setSelectedUsers}
                    onInputChange={(value) => {
                      setInputValue(value);
                      setMenuOpen(!!value);
                    }}
                    placeholder="Search users..."
                    isMulti
                    isSearchable
                    menuIsOpen={menuOpen}
                    className="w-100 dept-user-select"
                    noOptionsMessage={() => "No matching users"}
                  />
                </div>
                <div className="text-end">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowCreateCanvas(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* View Department Canvas */}
          <div className={`p-4 offcanvas-custom ${showViewCanvas ? "show" : ""}`}>
            <div className="offcanvas-header mb-3">
              <h5 className="offcanvas-title">
                {selectedDepartmentData ? selectedDepartmentData.name : ""}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowViewCanvas(false)}
                style={{ position: "absolute", right: "30px" }}
              ></button>
            </div>
            <div className="offcanvas-body p-2 overflow-hidden">
              {/* Department Details Section */}
              <div className="mb-4">
                <h6 className="border-bottom pb-2">Department Details</h6>
                <div className="row mb-2">
                  <div className="col-4 fw-bold">Name:</div>
                  <div className="col-8">{selectedDepartmentData?.name || "-"}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 fw-bold">Parent Department:</div>
                  <div className="col-8">
                    {selectedDepartmentData?.parentDepartment?.name || "None"}
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 fw-bold">Lead Name:</div>
                  <div className="col-8">
                    {selectedDepartmentData?.leadName ? (
                      <div>
                        <div>{selectedDepartmentData.leadName.username}</div>
                        <small className="text-muted">
                          {selectedDepartmentData.leadName.EmailId}
                        </small>
                      </div>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
              </div>

              {/* Assigned Users Section */}
              <div>
                <h6 className="border-bottom pb-2">Assigned Users</h6>

                {selectedDepartmentData && selectedDepartmentData.assignUsers ? (
                  <ul className="list-group">
                    {selectedDepartmentData.assignUsers
                      .filter(user =>
                        user.username.toLowerCase().includes(searchUser.toLowerCase()) ||
                        user.EmailId.toLowerCase().includes(searchUser.toLowerCase())
                      )
                      .map((user) => (
                        <li key={user._id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>{user.username}</strong>
                              <br />
                              <small className="text-muted">{user.EmailId}</small>
                            </div>
                            <span className="badge bg-primary rounded-pill">
                              {user.designation?.[0]?.Name  || "No designation"}
                            </span>
                          </div>
                        </li>
                      ))}
                    {selectedDepartmentData.assignUsers.filter(user =>
                      user.username.toLowerCase().includes(searchUser.toLowerCase()) ||
                      user.EmailId.toLowerCase().includes(searchUser.toLowerCase())
                    ).length === 0 && (
                      <li className="list-group-item text-center text-muted">
                        No users found
                      </li>
                    )}
                  </ul>
                ) : (
                  <div className="alert alert-info">
                    No users assigned to this department
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit Department Canvas */}
          <div
            className={`p-4 offcanvas-custom ${showEditCanvas ? "show" : ""}`}
          >
            <div className="offcanvas-header mb-3">
              <h5 className="offcanvas-title">Edit Department</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowEditCanvas(false)}
                style={{ position: "absolute", right: "30px" }}
              ></button>
            </div>
            <div className="offcanvas-body p-2 overflow-hidden">
              <form onSubmit={handleEditSubmit} style={{ height: "500px" }}>
                <div className="d-flex mb-3 justify-content-between">
                  <label className="form-label me-2 mb-0 mt-1">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Name"
                    value={editDepartmentData.name}
                    onChange={(e) =>
                      setEditDepartmentData({
                        ...editDepartmentData,
                        name: e.target.value,
                      })
                    }
                    style={{ width: "67%" }}
                    required
                  />
                </div>
                <div className="mb-3 d-flex justify-content-around">
                  <label className="form-label me-2 mb-0 mt-1 w-50">
                    Parent Department
                  </label>
                  <select
                    className="form-select"
                    value={editDepartmentData.parentId}
                    onChange={(e) =>
                      setEditDepartmentData({
                        ...editDepartmentData,
                        parentId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Department</option>
                    {departments
                      .filter((dept) => dept.value !== editDepartmentData.id) // Exclude current department from parent options
                      .map((dept) => (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mb-3 d-flex justify-content-around">
                  <label className="form-label me-2 mb-0 mt-1 w-50">
                    Lead Name
                  </label>
                  <Select
                    options={leads}
                    value={
                      leads.find(
                        (lead) => lead.value === editDepartmentData.leadId
                      ) || null
                    }
                    onChange={(selected) =>
                      setEditDepartmentData({
                        ...editDepartmentData,
                        leadId: selected ? selected.value : null,
                      })
                    }
                    placeholder="Select Lead"
                    className="w-100"
                  />
                </div>
                <div className="mb-3 d-flex justify-content-around">
                  <label className="form-label me-2 mb-0 mt-1 w-50">
                    Assign Users
                  </label>
                  <Select
                    options={users}
                    value={editDepartmentData.assignUsers}
                    onChange={(selected) =>
                      setEditDepartmentData({
                        ...editDepartmentData,
                        assignUsers: selected || [],
                      })
                    }
                    onInputChange={(value) => {
                      setInputValue(value);
                      setMenuOpen(!!value);
                    }}
                    placeholder="Search users..."
                    isMulti
                    isSearchable
                    menuIsOpen={menuOpen}
                    className="w-100 dept-user-select"
                    noOptionsMessage={() => "No matching users"}
                  />
                </div>
                <div className="text-end">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowEditCanvas(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Departments;