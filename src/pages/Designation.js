
import React, { useEffect, useState } from 'react';
import Select from "react-select";
import axios from "axios";
import debounce from "lodash.debounce";
import { Spinner } from 'react-bootstrap';

function Designation() {
    const [showOffCanvas, setShowOffCanvas] = useState(false);
    const [showCreateCanvas, setShowCreateCanvas] = useState(false);
    const [showViewCanvas, setShowViewCanvas] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [designationName, setDesignationName] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedDesignation, setSelectedDesignation] = useState(null);
    const [searchUser, setSearchUser] = useState(""); // For filtering users
    const [isCreating, setIsCreating] = useState(false);

    const [designations, setDesignations] = useState([]); // Store fetched designations
    const handleDesignationClick = (designation) => {
        setSelectedDesignation(designation);
        setShowViewCanvas(true);
    };

    // Fetch users with debounce
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

    useEffect(() => {
        fetchUsers(inputValue);
    }, [inputValue]);
    // console.log("showVewi ", showViewCanvas)
    const fetchDesignations = async () => {
        try {
            setLoading(true);
            const response = await axios.get("http://api.avessecurity.com:6378/api/Designation/getDataDesignation");
            if (response.data && response.data.Designation) {
                setDesignations(response.data.Designation);
            }
        } catch (error) {
            console.error("Error fetching designations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {

        fetchDesignations();
    }, []);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!designationName || selectedUsers.length === 0) {
            alert("Please fill in all fields");
            return;
        }

        setLoading(true);
        const payload = {
            Name: designationName,
            AssignUsersID: selectedUsers.map(user => user.value), // Extracting user IDs
        };

        try {
            const response = await axios.post("http://api.avessecurity.com:6378/api/Designation/create", payload);
            setShowCreateCanvas(false);
            setDesignationName("");
            // alert("Designation created successfully!");
            setSelectedUsers([]);
            fetchDesignations()
        } catch (error) {
            console.error("Error creating designation:", error);
            alert("Failed to create designation");
        } finally {
            setLoading(false);
        }
    };
    const handleDeleteDesignation = async (userId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this user?");
        if (!confirmDelete) return; // If user clicks 'Cancel', just exit

        try {
            const response = await axios.delete(`http://api.avessecurity.com:6378/api/Designation/delete/${userId}`);
            if (response.status === 200) {
                alert("Desgnation deleted successfully");

            }
        } catch (error) {
            console.error("Error deleting designation:", error);
            alert("Error deleting designation");
        }
    };
    return (
        <>{loading ?
            <div className="d-flex justify-content-center align-items-center flex-column" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                <Spinner animation="border" role="status" variant="light">
                </Spinner>
            </div>
            :
            <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex">
                        <input
                            type="text"
                            className="form-control me-2"
                            placeholder="Search..."
                        />
                    </div>
                    <button className="btn btn-primary h-50" onClick={() => setShowCreateCanvas(true)}>
                        Create Designation
                    </button>
                </div>

                <div className="row">
                    <div className="">
                        <div className="card">
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Designation Name</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {designations.length > 0 ? (
                                                designations.map((designation) => (
                                                    <tr key={designation._id} style={{ cursor: "pointer" }}>
                                                        <td>{designation.Name}</td>
                                                        <td>
                                                            {/* <button className="btn btn-sm btn-outline-success me-2" >View</button> */}
                                                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleDesignationClick(designation)}><i class="bi bi-eye"></i></button>
                                                            <button className="btn btn-sm btn-outline-primary me-2" ><i class="bi bi-pencil-square"></i></button>
                                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteDesignation(designation._id)}><i class="bi bi-trash"></i></button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="2" className="text-center">
                                                        No designations found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>

                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={`p-4 offcanvas-custom ${showViewCanvas ? "show" : ""}`}>
                    <div className="offcanvas-header mb-3">
                        <h5 className="offcanvas-title">
                            {selectedDesignation ? selectedDesignation.Name : "Create a new Designation"}
                        </h5>
                        <button type="button" className="btn-close" onClick={() => setShowViewCanvas(false)} style={{ position: "absolute", right: "30px" }}></button>
                    </div>

                    {selectedDesignation ? (
                        <div className="offcanvas-body p-2">
                            <input
                                type="text"
                                className="form-control mb-3"
                                placeholder="Search user..."
                                value={searchUser}
                                onChange={(e) => setSearchUser(e.target.value)}
                            />

                            <ul className="list-group">
                                {selectedDesignation.AssignUsers &&
                                    selectedDesignation.AssignUsers
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
                        </div>
                    ) : (
                        <div className="offcanvas-body p-2">
                            {/* Existing form to create new designation */}
                            <form onSubmit={handleSubmit} style={{ height: "500px" }}>
                                {/* Form Inputs */}
                            </form>
                        </div>
                    )}
                </div>

                {/* Offcanvas Form */}
                {

                    <div className={`p-4 offcanvas-custom ${showCreateCanvas ? 'show' : ""}`}>
                        <div className="offcanvas-header mb-3">
                            <h5 className="offcanvas-title">Create a new Designation</h5>
                            <button type="button" className="btn-close" onClick={() => setShowCreateCanvas(false)} style={{ position: "absolute", right: "30px" }}></button>
                        </div>
                        <div className="offcanvas-body p-2">
                            <form onSubmit={handleSubmit} style={{ height: "500px" }}>
                                <div className='d-flex mb-3 justify-content-between'>
                                    <label className="form-label me-2 mb-0 mt-1 ">Name</label>
                                    <input
                                        type="text"
                                        className="form-control "
                                        placeholder="Enter designation name"
                                        value={designationName}
                                        onChange={(e) => setDesignationName(e.target.value)}
                                        style={{ width: "66%" }}
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

                                <div className='text-end'>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? "Creating..." : "Create"}
                                    </button>
                                    <button type="button" className="btn" onClick={() => setShowCreateCanvas(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>

                }

            </div>
        }
        </>

    );
}

export default Designation;
