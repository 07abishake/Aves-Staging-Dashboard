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
    const [showEditCanvas, setShowEditCanvas] = useState(false);
   const [editDesignationId, setEditDesignationId] = useState(null);
   const [editDesignationName, setEditDesignationName] = useState("");
   const [editSelectedUsers, setEditSelectedUsers] = useState([]);
    const [editInputValue, setEditInputValue] = useState("");
    const [editMenuOpen, setEditMenuOpen] = useState(false);

    const [designations, setDesignations] = useState([]); // Store fetched designations
    const handleDesignationClick = (designation) => {
        setSelectedDesignation(designation);
        setShowViewCanvas(true);
    };
     const token = localStorage.getItem("access_token");
  if(!token){
    // window.location.href = "/login";
  }

    // Fetch users with debounce
    const fetchUsers = debounce(async (query) => {
        if (!query) return;
        try {
            const response = await axios.get(`https://api.avessecurity.com/api/Designation/getDropdown/${query}`,{
                headers:{
                    Authorization: `Bearer ${token}`
                }
            });
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
            const response = await axios.get("https://api.avessecurity.com/api/Designation/getDataDesignation",{
                headers:{
                    Authorization: `Bearer ${token}`
                }
            });
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

    {/*open Edit canvas function*/}

    const handleEditClick = (designation) => {
    setEditDesignationId(designation._id);
    setEditDesignationName(designation.Name);
    if (designation.AssignUsers) {
        const formattedUsers = designation.AssignUsers.map(user => ({
            value: user._id,
            label: user.username
        }));
        setEditSelectedUsers(formattedUsers);
    }
    setShowEditCanvas(true);
};


    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!designationName ) {
            alert("Please fill in Designation fields");
            return;
        }

        setLoading(true);
        const payload = {
            Name: designationName,
            AssignUsersID: selectedUsers.map(user => user.value), // Extracting user IDs
        };

        try {
            const response = await axios.post("https://api.avessecurity.com/api/Designation/create", payload,{
                headers:{
                    Authorization: `Bearer ${token}`
                }
            });
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


    {/*Handle function to edit */}
const handleEditSubmit = async (e) => {
    e.preventDefault();

    // if (!editDesignationName || editSelectedUsers.length === 0) {
    //     alert("Please fill in all fields");
    //     return;
    // }

    const payload = {
        Name: editDesignationName,
        AssignUsersID: editSelectedUsers.map(user => user.value)
    };

    try {
        setLoading(true);
        const response = await axios.put(
            `https://api.avessecurity.com/api/Designation/update/${editDesignationId}`,
            payload,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (response.status === 200) {
            alert("Designation updated successfully");
            setShowEditCanvas(false);
            fetchDesignations();
        }
    } catch (error) {
        console.error("Error updating designation:", error);
        alert("Failed to update designation");
    } finally {
        setLoading(false);
    }
};


    const handleDeleteDesignation = async (userId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this user?");
        if (!confirmDelete) return; // If user clicks 'Cancel', just exit

        try {
            const response = await axios.delete(`https://api.avessecurity.com/api/Designation/delete/${userId}`,{
                headers:{
                    Authorization: `Bearer ${token}`
                }
            });
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
                                                         <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEditClick(designation)}>
                                                          <i className="bi bi-pencil-square"></i>
                                                           </button>
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
<div className={`p-4 offcanvas-custom ${showEditCanvas ? 'show' : ""}`}>
    <div className="offcanvas-header mb-3">
        <h5 className="offcanvas-title">Edit Designation</h5>
        <button type="button" className="btn-close" onClick={() => setShowEditCanvas(false)} style={{ position: "absolute", right: "30px" }}></button>
    </div>
    <div className="offcanvas-body p-2">
        <form onSubmit={handleEditSubmit} style={{ height: "500px" }}>
            <div className='d-flex mb-3 justify-content-between'>
                <label className="form-label me-2 mb-0 mt-1">Name</label>
                <input
                    type="text"
                    className="form-control"
                    value={editDesignationName}
                    onChange={(e) => setEditDesignationName(e.target.value)}
                    placeholder="Enter designation name"
                    style={{ width: "66%" }}
                />
            </div>

            <div className="mb-3 d-flex justify-content-around">
                <label className="form-label me-2 mb-0 mt-1 w-50">Assign Users</label>
                <Select
                    options={users}
                    value={editSelectedUsers}
                    onChange={setEditSelectedUsers}
                    onInputChange={(value) => {
                        setEditInputValue(value);
                        setEditMenuOpen(!!value);
                    }}
                    placeholder="Search users..."
                    isMulti
                    isSearchable
                    menuIsOpen={editMenuOpen}
                    className="w-100 dept-user-select"
                    noOptionsMessage={() => "No matching users"}
                />
            </div>

            <div className='text-end'>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Updating..." : "Update"}
                </button>
                <button type="button" className="btn" onClick={() => setShowEditCanvas(false)}>Cancel</button>
            </div>
        </form>
    </div>
</div>

            </div>
        }
        </>

    );
}

export default Designation;
