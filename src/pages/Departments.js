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
    const [leads, setLeads] = useState([]); // State for lead names
    const [selectedLead, setSelectedLead] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [allDepts, setAllDepts] = useState([]);
    const [selectedDepartmentData, setSelectedDepartmentData] = useState(null);
    const [searchUser, setSearchUser] = useState("");
    const handleDesignationClick = (department) => {
        setSelectedDepartmentData(department);
        setShowViewCanvas(true);
    };
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setLoading(true)
                const response = await axios.get("http://api.avessecurity.com:6378/api/Department/getDataDepartment");
                if (response.data && response.data.Department) {
                    setAllDepts(response.data.Department);
                }
            } catch (error) {
                console.error("Error fetching departments:", error);
            } finally {
                setLoading(false)
            }
        };

        fetchDepartments();
    }, []);
    console.log("department", departments)
    // Fetch leads for Lead Name dropdown
    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const response = await axios.get("http://api.avessecurity.com:6378/api/Department/getDropdown");
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
    }, []);

    // Debounced function to fetch users
    const fetchUsers = debounce(async (query) => {
        if (!query) return;
        try {
            const response = await axios.get(`http://api.avessecurity.com:6378/api/Designation/getDropdown/${query}`);
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

    // Call fetchUsers when inputValue changes
    useEffect(() => {
        fetchUsers(inputValue);
    }, [inputValue]);
    const fetchDepartments = async () => {
        try {
            setLoading(true)
            const response = await fetch('http://api.avessecurity.com:6378/api/Department/getAll');
            if (!response.ok) {
                throw new Error('Failed to fetch departments');
            }
            const data = await response.json();

            // Flatten the department hierarchy
            const departmentOptions = [];
            data.forEach(parent => {
                departmentOptions.push({ value: parent._id, label: parent.name });

                if (parent.children && parent.children.length > 0) {
                    parent.children.forEach(child => {
                        departmentOptions.push({
                            value: child._id,
                            label: child.name // Indentation for child departments
                        });
                    });
                }
            });

            setDepartments(departmentOptions);
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {

        fetchDepartments();
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const requestBody = {
            name,
            leadId: selectedLead ? selectedLead.value : null,
            parentId: selectedDepartment || null,
            assignUsers: selectedUsers.map(user => user.value),
        };

        try {
            const response = await fetch("http://api.avessecurity.com:6378/api/Department/Create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                alert("Department created successfully!");
                setShowCreateCanvas(false);
                fetchDepartments()
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
        const confirmDelete = window.confirm("Are you sure you want to delete this user?");
        if (!confirmDelete) return; // If user clicks 'Cancel', just exit

        try {
            const response = await axios.delete(`http://api.avessecurity.com:6378/api/Department/delete/${userId}`);
            if (response.status === 200) {
                alert("Desgnation deleted successfully");

            }
        } catch (error) {
            console.error("Error deleting designation:", error);
            alert("Error deleting designation");
        }
    };
    console.log("selected dept", selectedDepartmentData)
    return (
        <>{loading ? <div className="d-flex justify-content-center align-items-center flex-column" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <Spinner animation="border" role="status" variant="light">
            </Spinner>

        </div> :

            <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex">
                        <input type="text" className="form-control me-2" placeholder="Search..." />
                    </div>
                    <button className="btn btn-primary h-50" onClick={() => setShowCreateCanvas(true)}>
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
                                            {allDepts.map((dept) => (
                                                <tr key={dept._id}  >
                                                    {/* Department Name & Parent Department */}
                                                    <td>
                                                        <strong>{dept.name}</strong>
                                                        {dept.parentDepartment && (
                                                            <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                                                                Parent: {dept.parentDepartment.name}
                                                            </p>
                                                        )}
                                                    </td>

                                                    {/* Lead Name */}
                                                    <td>{dept.leadName ? dept.leadName.username : "-"}</td>
                                                    <td>
                                                        {/* <button className="btn btn-sm btn-outline-success me-2" >View</button> */}
                                                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleDesignationClick(dept)}><i class="bi bi-eye"></i></button>
                                                        <button className="btn btn-sm btn-outline-primary me-2" ><i class="bi bi-pencil-square"></i></button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteDesignation(dept._id)}><i class="bi bi-trash"></i></button>
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
                <div className={`p-4 offcanvas-custom ${showCreateCanvas ? "show" : ""}`}>
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
                                <label className="form-label me-2 mb-0 mt-1 w-50">Parent Department</label>
                                <select
                                    className="form-select"
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    required
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
                                <label className="form-label me-2 mb-0 mt-1 w-50">Lead Name</label>
                                <Select
                                    options={leads}
                                    value={selectedLead}
                                    onChange={setSelectedLead}
                                    placeholder="Select Lead"
                                    className="w-100"
                                />
                            </div>
                            <div className="mb-3 d-flex justify-content-around">
                                <label className="form-label me-2 mb-0 mt-1 w-50">Assign Users</label>
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
                                <button type="button" className="btn" onClick={() => setShowCreateCanvas(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                <div className={`p-4 offcanvas-custom ${showViewCanvas ? "show" : ""}`}>
                    <div className="offcanvas-header mb-3">
                        <h5 className="offcanvas-title">{selectedDepartmentData ? selectedDepartmentData?.name : ""}</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowViewCanvas(false)}
                            style={{ position: "absolute", right: "30px" }}
                        ></button>
                    </div>
                    <div className="offcanvas-body p-2 overflow-hidden">
                        <input
                            type="text"
                            className="form-control mb-3"
                            placeholder="Search user..."
                            value={searchUser}
                            onChange={(e) => setSearchUser(e.target.value)}
                        />

                        <ul className="list-group">
                            {selectedDepartmentData && selectedDepartmentData.assignUsers ? (
                                <ul className="list-group">
                                    {selectedDepartmentData.assignUsers
                                        .filter(user =>
                                            user.username.toLowerCase().includes(searchUser.toLowerCase()) ||
                                            user.EmailId.toLowerCase().includes(searchUser.toLowerCase())
                                        )
                                        .map((user) => (
                                            <li key={user._id} className="list-group-item d-flex justify-content-between">
                                                <div>
                                                    <strong>{user.username}</strong>
                                                    <br />
                                                    <small>{user.EmailId}</small>
                                                </div>
                                            </li>
                                        ))}
                                </ul>
                            ) : (
                                <p>No department selected</p>
                            )}

                        </ul>
                    </div>
                </div>
            </div>
        }
        </>
    );
}

export default Departments;
