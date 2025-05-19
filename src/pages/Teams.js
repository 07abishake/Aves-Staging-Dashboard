import React, { useEffect, useState } from 'react';
import axios from "axios";
import debounce from "lodash.debounce";
import { Spinner } from 'react-bootstrap';

function Teams() {

    const [showCreateCanvas, setShowCreateCanvas] = useState(false);
    const [showViewCanvas, setShowViewCanvas] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [teamName, setTeamName] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedDesignation, setSelectedDesignation] = useState(null);
    const [searchUser, setSearchUser] = useState(""); // For filtering users
    const [teams, setTeams] = useState([]);

    const [addUsers, setAddUsers] = useState([]);
    const [showUserList, setShowUserList] = useState(false);
    const handleDesignationClick = (designation) => {
        setSelectedDesignation(designation);
        setShowViewCanvas(true);
    };

     const token = localStorage.getItem("access_token");
  if(!token){
    window.location.href = "/login";
  }
    const fetchLeads = async () => {
        try {
            const response = await axios.get("https://api.avessecurity.com/api/Department/getDropdown",{
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            if (response.data && response.data.user) {
                setAddUsers(response.data.user);
            }
        } catch (error) {
            console.error("Error fetching leads:", error);
        }
    };

    useEffect(() => {

        fetchLeads();
    }, []);

    const handleCheckboxChange = (userId) => {
        setSelectedUsers((prevSelected) =>
            prevSelected.includes(userId) ? prevSelected.filter(id => id !== userId) : [...prevSelected, userId]
        );
    };
    // Fetch users with debounce
    const fetchUsers = debounce(async (query) => {
        if (!query) return;
        try {
            const response = await axios.get(`https://api.avessecurity.com/api/Designation/getDropdown/${query}`,{
                headers:{
                    Authorization: `Bearer ${token}`,
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

    const fetchTeam = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`https://api.avessecurity.com/api/firebase/getAllTeamName/Dashbard`,{
                headers:{
                    Authorization: `Bearer ${token}`,
                }
            });
            setTeams(response.data.FireBaseTeam)
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTeam()
    }, [])
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!teamName) {
            alert("Please fill in all fields");
            return;
        }

        setLoading(true);
        const payload = {
            TeamName: teamName,

        };

        try {
            const response = await axios.post("https://api.avessecurity.com/api/firebase/create-team", payload,{
                headers:{
                    Authorization: `Bearer ${token}`,
                }   
            });
            setShowCreateCanvas(false);
            setTeamName("");
            alert("Team created successfully!");
            fetchTeam()
            // fetchDesignations()
        } catch (error) {
            console.error("Error creating designation:", error);
            alert("Failed to create designation");
        } finally {
            setLoading(false);
        }
    };
    const handleAddUsers = async () => {
        try {
        await Promise.all(
    selectedUsers.map(userId =>
        axios.post(
            "https://api.avessecurity.com/api/firebase/AddUser-toTeam",
            {
                _id: selectedDesignation?._id, // Team ID
                userId, // User ID
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            }
        )
    )
);

            alert("Users added successfully!");
            fetchLeads()
            // setShowUserList(false);
            // setSelectedUsers([]); // Clear selection
        } catch (error) {
            console.error("Error adding users:", error);
            alert("Failed to add users.");
        }
    };
    const filteredUsers = addUsers.filter(user =>
        !selectedDesignation?.users.some(teamMember => teamMember._id === user._id)
    );
    const handleDeleteDesignation = async (userId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this user?");
        if (!confirmDelete) return; // If user clicks 'Cancel', just exit

        try {
            const response = await axios.delete(`https://api.avessecurity.com/api/Designation/delete/${userId}`,{
                headers:{
                    Authorization: `Bearer ${token}`,
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
        <>{loading ? <div className="d-flex justify-content-center align-items-center flex-column" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <Spinner animation="border" role="status" variant="light">
            </Spinner>

        </div> :
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
                        Create Team
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
                                                <th>Team Name</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {teams.length > 0 ? (
                                                teams.map((team) => (
                                                    <tr key={team._id} style={{ cursor: "pointer" }}>
                                                        <td>{team.TeamName}</td>
                                                        <td>
                                                            {/* <button className="btn btn-sm btn-outline-success me-2" >View</button> */}
                                                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleDesignationClick(team)} ><i class="bi bi-eye"></i></button>
                                                            <button className="btn btn-sm btn-outline-primary me-2" ><i class="bi bi-pencil-square"></i></button>
                                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteDesignation(team._id)}><i class="bi bi-trash"></i></button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="2" className="text-center">
                                                        No Teams found
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
                {/* <div className={`p-4 offcanvas-custom ${showViewCanvas ? "show" : ""}`}>
                <div className="offcanvas-header mb-3">
                    <h5 className="offcanvas-title">
                        {selectedDesignation ? selectedDesignation.TeamName : "Create a new Designation"}
                    </h5>
                    <a className=' ' style={{ position: "absolute", right: "65px", cursor: "pointer" }}>Add User</a>
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
                            {selectedDesignation.users &&
                                selectedDesignation.users
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
           
                        <form onSubmit={handleSubmit} style={{ height: "500px" }}>
                         
                        </form>
                    </div>
                )}
            </div> */}
                <div className={`p-4 offcanvas-custom ${showViewCanvas ? "show" : ""}`}>
                    <div className="offcanvas-header mb-3">
                        <h5 className="offcanvas-title">
                            {selectedDesignation ? selectedDesignation.TeamName : "Create a new Designation"}
                        </h5>
                        <a
                            className=""

                            style={{ position: "absolute", right: "65px", cursor: "pointer" }}
                            onClick={() => setShowUserList(true)}
                        >
                            Add User
                        </a>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => { setShowViewCanvas(false); setShowUserList(false); }}
                            // onClick={() => {
                            //     setShowViewCanvas(false);
                            //     setShowUserList(false); // Reset user list view on close
                            // }}
                            style={{ position: "absolute", right: "30px" }}
                        ></button>
                    </div>

                    {showUserList ? (
                        <div className="offcanvas-body p-2">
                            <input
                                type="text"
                                className="form-control mb-3"
                                placeholder="Search user..."
                                value={searchUser}
                                onChange={(e) => setSearchUser(e.target.value)}
                            />
                            <ul className="list-group">
                                {filteredUsers.length === 0 ? (
                                    <li className="list-group-item text-center text-muted">
                                        No users available
                                    </li>
                                ) : (
                                    filteredUsers
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
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user._id)}
                                                    onChange={() => handleCheckboxChange(user._id)}
                                                />
                                            </li>
                                        ))
                                )}
                            </ul>

                            {selectedUsers.length > 0 && (
                                <button className="btn btn-primary mt-3" onClick={handleAddUsers}>
                                    Add to Team
                                </button>
                            )}
                        </div>
                    ) : selectedDesignation ? (
                        <div className="offcanvas-body p-2">
                            <input
                                type="text"
                                className="form-control mb-3"
                                placeholder="Search user..."
                                value={searchUser}
                                onChange={(e) => setSearchUser(e.target.value)}
                            />

                            <ul className="list-group">
                                {selectedDesignation.users && selectedDesignation.users.length > 0 ? (
                                    selectedDesignation.users
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
                                        ))
                                ) : (
                                    <li className="list-group-item text-center text-muted">
                                        No users available
                                    </li>
                                )}
                            </ul>

                        </div>
                    ) : (
                        <div className="offcanvas-body p-2">
                            {/* Form for creating a new designation */}
                            <form onSubmit={handleSubmit} style={{ height: "500px" }}>
                                {/* Form Inputs */}
                            </form>
                        </div>
                    )}
                </div>

                {

                    <div className={`p-4 offcanvas-custom ${showCreateCanvas ? 'show' : ""}`}>
                        <div className="offcanvas-header mb-3">
                            <h5 className="offcanvas-title">Create a new Team</h5>
                            <button type="button" className="btn-close" onClick={() => setShowCreateCanvas(false)} style={{ position: "absolute", right: "30px" }}></button>
                        </div>
                        <div className="offcanvas-body p-2">
                            <form onSubmit={handleSubmit} style={{ height: "500px" }}>
                                <div className='d-flex mb-3 justify-content-between'>
                                    <label className="form-label me-2 mb-0 mt-1 ">Team Name</label>
                                    <input
                                        type="text"
                                        className="form-control "
                                        placeholder="Enter Team name"
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        style={{ width: "66%" }}
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

            </div >
        }
        </>

    );
}

export default Teams;
