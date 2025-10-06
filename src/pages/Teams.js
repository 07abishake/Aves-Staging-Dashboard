import React, { useEffect, useState, useCallback } from 'react';
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
    const [searchUser, setSearchUser] = useState("");
    const [teams, setTeams] = useState([]);
    const [showEditCanvas, setShowEditCanvas] = useState(false);
    const [editTeamName, setEditTeamName] = useState("");
    const [editTeamId, setEditTeamId] = useState(null);
    const [addUsers, setAddUsers] = useState([]);
    const [showUserList, setShowUserList] = useState(false);
    
    // NEW: State for main search
    const [searchQuery, setSearchQuery] = useState("");

    const token = localStorage.getItem("access_token");
    
    // Memoize fetch functions with useCallback to prevent unnecessary recreations
    const fetchLeads = useCallback(async () => {
        try {
            const response = await axios.get("https://codeaves.avessecurity.com/api/Department/getDropdown", {
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
    }, [token]);

    const fetchTeam = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`https://codeaves.avessecurity.com/api/firebase/getAllTeamName/Dashbard`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            setTeams(response.data.FireBaseTeam);
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchLeads();
        fetchTeam();
    }, [fetchLeads, fetchTeam]);

    const handleDesignationClick = (designation) => {
        setSelectedDesignation(designation);
        setShowViewCanvas(true);
    };

    const handleCheckboxChange = (userId) => {
        setSelectedUsers(prevSelected =>
            prevSelected.includes(userId) 
                ? prevSelected.filter(id => id !== userId) 
                : [...prevSelected, userId]
        );
    };

    // Fetch users with debounce - FIXED: use useCallback to prevent recreation
    const fetchUsers = useCallback(debounce(async (query) => {
        if (!query) {
            setUsers([]);
            return;
        }
        try {
            const response = await axios.get(`https://codeaves.avessecurity.com/api/Designation/getDropdown/${query}`, {
                headers: {
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
    }, 500), [token]);

    useEffect(() => {
        fetchUsers(inputValue);
    }, [inputValue, fetchUsers]);

    // NEW: Filter teams based on search query
    const filteredTeams = teams.filter(team =>
        team.TeamName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle form submission for creating a team
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
            await axios.post("https://codeaves.avessecurity.com/api/firebase/create-team", payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }   
            });
            setShowCreateCanvas(false);
            setTeamName("");
            
            // Refresh the team list after successful creation
            fetchTeam();
            alert("Team created successfully!");
        } catch (error) {
            console.error("Error creating team:", error);
            alert("Failed to create team");
        } finally {
            setLoading(false);
        }
    };

    const handleAddUsers = async () => {
        try {
            await Promise.all(
                selectedUsers.map(userId =>
                    axios.post(
                        "https://codeaves.avessecurity.com/api/firebase/AddUser-toTeam",
                        {
                            _id: selectedDesignation?._id,
                            userId,
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            }
                        }
                    )
                )
            );
            
            // Refresh both users and teams after adding users
            fetchLeads();
            fetchTeam();
            
            // Update the selected designation with new users
            const updatedTeamResponse = await axios.get(
                `https://codeaves.avessecurity.com/api/firebase/getTeamNew/${selectedDesignation._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setSelectedDesignation(updatedTeamResponse.data);
            setSelectedUsers([]);
            alert("Users added successfully!");
        } catch (error) {
            console.error("Error adding users:", error);
            alert("Failed to add users.");
        }
    };

    const filteredUsers = addUsers.filter(user =>
        !selectedDesignation?.users?.some(teamMember => teamMember._id === user._id)
    );

    const openEditCanvas = (team) => {
        setEditTeamName(team.TeamName);
        setEditTeamId(team._id);
        setShowEditCanvas(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        if (!editTeamName) {
            alert("Please enter a team name");
            return;
        }

        setLoading(true);
        try {
            await axios.put(
                `https://codeaves.avessecurity.com/api/firebase/update/${editTeamId}`, 
                { TeamName: editTeamName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Refresh the team list after successful update
            fetchTeam();
            setShowEditCanvas(false);
            setEditTeamName("");
            setEditTeamId(null);
            alert("Team updated successfully");
        } catch (error) {
            console.error("Error updating team:", error);
            alert("Failed to update team");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTeams = async (teamId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this team?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`https://codeaves.avessecurity.com/api/firebase/delete/${teamId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            
            // Refresh the team list after successful deletion
            fetchTeam();
            alert("Team deleted successfully");
        } catch (error) {
            console.error("Error deleting team", error);
            alert("Error deleting team");
        }
    };

    return (
        <>
            {loading && (
                <div 
                    className="d-flex justify-content-center align-items-center flex-column" 
                    style={{ 
                        position: "fixed", 
                        top: 0, 
                        left: 0, 
                        width: "100%", 
                        height: "100vh", 
                        backgroundColor: "rgba(0,0,0,0.5)", 
                        zIndex: 1050 
                    }}
                >
                    <Spinner animation="border" role="status" variant="light" />
                </div>
            )}
            
            <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex">
                        <input
                            type="text"
                            className="form-control me-2"
                            placeholder="Search..."
                            value={searchQuery} // NEW: Connected to state
                            onChange={(e) => setSearchQuery(e.target.value)} // NEW: Update search query
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
                                            {filteredTeams.length > 0 ? ( // CHANGED: Use filteredTeams instead of teams
                                                filteredTeams.map((team) => (
                                                    <tr key={team._id} style={{ cursor: "pointer" }}>
                                                        <td>{team.TeamName}</td>
                                                        <td>
                                                            <button 
                                                                className="btn btn-sm btn-outline-primary me-2" 
                                                                onClick={() => handleDesignationClick(team)}
                                                            >
                                                                <i className="bi bi-eye"></i>
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-outline-primary me-2" 
                                                                onClick={() => openEditCanvas(team)}
                                                            >
                                                                <i className="bi bi-pencil-square"></i>
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-outline-danger" 
                                                                onClick={() => handleDeleteTeams(team._id)}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="2" className="text-center">
                                                        {searchQuery ? "No teams match your search" : "No Teams found"}
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
                
                {/* View Canvas */}
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
                            onClick={() => { 
                                setShowViewCanvas(false); 
                                setShowUserList(false); 
                                setSelectedUsers([]);
                                setSearchUser(""); // NEW: Reset user search when closing
                            }}
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
                    ) : null}
                </div>

                {/* Rest of your code remains the same */}
                {/* Create Canvas */}
                <div className={`p-4 offcanvas-custom ${showCreateCanvas ? 'show' : ""}`}>
                    <div className="offcanvas-header mb-3">
                        <h5 className="offcanvas-title">Create a new Team</h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={() => setShowCreateCanvas(false)} 
                            style={{ position: "absolute", right: "30px" }}
                        ></button>
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
                                <button 
                                    type="button" 
                                    className="btn" 
                                    onClick={() => setShowCreateCanvas(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Edit Canvas */}
                <div className={`p-4 offcanvas-custom ${showEditCanvas ? "show" : ""}`}>
                    <div className="offcanvas-header mb-3">
                        <h5 className="offcanvas-title">Edit Team</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowEditCanvas(false)}
                            style={{ position: "absolute", right: "30px" }}
                        ></button>
                    </div>

                    <div className="offcanvas-body p-2">
                        <form onSubmit={handleEditSubmit}>
                            <div className="mb-3">
                                <label htmlFor="editTeamName" className="form-label">Team Name</label>
                                <input
                                    type="text"
                                    id="editTeamName"
                                    className="form-control"
                                    value={editTeamName}
                                    onChange={(e) => setEditTeamName(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Teams;