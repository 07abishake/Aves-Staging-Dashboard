import React, { useEffect, useState } from 'react';
import Select from "react-select";
import moment from "moment-timezone";
import axios from 'axios';
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import debounce from "lodash.debounce";
import { Spinner } from 'react-bootstrap';

function UserManagement() {
  // MAIN STATE
  const [allUsers, setAllUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateCanvas, setShowCreateCanvas] = useState(false);
  const [showEditCanvas, setShowEditCanvas] = useState(false);
  const [showViewCanvas, setShowViewCanvas] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSpecUser, setSelectedSpecUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // DATA
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  // Form data
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [workNumber, setWorkNumber] = useState("");
  const [selectedTimezone, setSelectedTimezone] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [NRIC, setNRIC] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [location, setLocation] = useState("");
  const [extension, setExtension] = useState("");
  const [selectedReportUsers, setSelectedReportUsers] = useState(null);

  const timezones = moment.tz.names().map((tz) => ({
    value: tz,
    label: `${tz} (GMT${moment.tz(tz).format("Z")})`,
  }));

  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.href = "/login";
  }

  // Populate edit form with user data
  const populateEditForm = (user) => {
    setFirstName(user.FirstName || '');
    setLastName(user.LastName || '');
    setUserName(user.username || '');
    setSelectedGender(user.Gender || '');
    setSelectedDepartment(user.Department?._id || '');
    setSelectedDesignation(user.Designation?._id || '');
    setEmployeeId(user.EmployeeID || '');
    setEmail(user.EmailId || '');

    // Handle phone numbers
    const workPhoneStr = user.WorkPhone ? user.WorkPhone.toString().replace('+', '') : '';
    setWorkNumber(workPhoneStr);

    const personalPhoneStr = user.PersonalMobile ? user.PersonalMobile.toString().replace('+', '') : '';
    setPhoneNumber(personalPhoneStr);

    setExtension(user.Extension || '');
    setSelectedTimezone(timezones.find(tz => tz.value === user.TimeZone) || null);
    setSelectedRole(user.role?._id || '');
    setNRIC(user.NRICNumber || '');
    setLocation(user.Location || '');
    
    // Set reporting user
    if (user.ReportingTo) {
      const reportingUser = {
        value: user.ReportingTo._id,
        label: user.ReportingTo.username
      };
      setSelectedReportUsers(reportingUser);
    } else {
      setSelectedReportUsers(null);
    }
    
    setPassword('');
    setConfirmPassword('');
    setSelectedUserForEdit(user);
  };

  // Fetch all users
  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://api.avessecurity.com/api/users/get-AllUserData`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setAllUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Fetch designations
  const fetchDesignations = async () => {
    try {
      const response = await axios.get(
        "https://api.avessecurity.com/api/Designation/getDataDesignation",
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data && response.data.Designation) {
        setDesignations(response.data.Designation);
      }
    } catch (error) {
      console.error("Error fetching designations:", error);
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const response = await axios.get(
        "https://api.avessecurity.com/api/Roles/getRole",
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data && response.data.Roles) {
        setRoles(response.data.Roles);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  // Fetch users for reporting dropdown
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

  // Initialize data
  useEffect(() => {
    fetchAllUsers();
    fetchDepartments();
    fetchDesignations();
    fetchRoles();
  }, []);

  // Handle search input for reporting users
  useEffect(() => {
    fetchUsers(inputValue);
  }, [inputValue]);

  // Handle create user form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const payload = {
      FirstName: firstName,
      LastName: lastName,
      username: userName,
      Gender: selectedGender,
      Department: selectedDepartment || null,
      Designation: selectedDesignation || null,
      EmployeeID: employeeId,
      EmailId: email,
      WorkPhone: workNumber ? `+${workNumber}` : null,
      PersonalMobile: phoneNumber ? `+${phoneNumber}` : null,
      Extension: extension,
      TimeZone: selectedTimezone?.value || null,
      role: selectedRole,
      NRICNumber: NRIC,
      Location: location,
      ReportingTo: selectedReportUsers?.value || null,
      password: password,
      Repassword: confirmPassword
    };

    try {
      setLoading(true);
      const response = await axios.post(
        "https://api.avessecurity.com/api/users/register", 
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      alert(response.data.message);
      setShowCreateCanvas(false);
      fetchAllUsers(); // Refresh the user list
      resetForm();
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Handle update user form submission
  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    
    if (!selectedUserForEdit) return;

    // Only validate passwords if they're being changed
    if (password && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const payload = {
      FirstName: firstName,
      LastName: lastName,
      username: userName,
      Gender: selectedGender,
      Department: selectedDepartment || null,
      Designation: selectedDesignation || null,
      EmployeeID: employeeId,
      EmailId: email,
      WorkPhone: workNumber ? `+${workNumber}` : null,
      PersonalMobile: phoneNumber ? `+${phoneNumber}` : null,
      Extension: extension,
      TimeZone: selectedTimezone?.value || null,
      role: selectedRole,
      NRICNumber: NRIC,
      Location: location,
      ReportingTo: selectedReportUsers?.value || null,
    };

    // Only include password fields if they're filled
    if (password) {
      payload.password = password;
      payload.Repassword = confirmPassword;
    }

    try {
      setLoading(true);
      const response = await axios.put(
        `https://api.avessecurity.com/api/users/update/${selectedUserForEdit._id}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      alert("User updated successfully");
      fetchAllUsers(); // Refresh the user list
      setShowEditCanvas(false);
      resetForm();
    } catch (error) {
      console.error("Error updating user", error);
      alert("Error updating user: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setUserName("");
    setSelectedGender("");
    setSelectedDepartment("");
    setSelectedDesignation("");
    setEmployeeId("");
    setEmail("");
    setWorkNumber("");
    setPhoneNumber("");
    setExtension("");
    setSelectedTimezone(null);
    setSelectedRole("");
    setNRIC("");
    setLocation("");
    setSelectedReportUsers(null);
    setPassword("");
    setConfirmPassword("");
  };

  // Handle checkbox selections
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(allUsers.map(user => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(
        `https://api.avessecurity.com/api/users/delete/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 200) {
        alert("User deleted successfully");
        setAllUsers(allUsers.filter(user => user._id !== userId));
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user");
    }
  };

  // Handle delete selected users
  const handleDeleteSelected = async () => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedUsers.length} selected users?`);
    if (!confirmDelete) return;

    try {
      setLoading(true);
      // This assumes your API can handle bulk deletion
      const deletePromises = selectedUsers.map(userId => 
        axios.delete(`https://api.avessecurity.com/api/users/delete/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );
      
      await Promise.all(deletePromises);
      alert("Selected users deleted successfully");
      fetchAllUsers(); // Refresh the list
      setSelectedUsers([]); // Clear selection
    } catch (error) {
      console.error("Error deleting users:", error);
      alert("Error deleting some users");
    } finally {
      setLoading(false);
    }
  };

  // Handle view user click
  const handleSpecificUserClick = (user) => {
    setShowViewCanvas(true);
    setSelectedSpecUser(user);
  };

  // Filter users based on search and status
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = search === '' || 
      user.username.toLowerCase().includes(search.toLowerCase()) || 
      user.EmailId.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Active' && user.isActive) || 
      (statusFilter === 'Inactive' && !user.isActive);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div>
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
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>User Management</h2>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex">
              <input
                type="text"
                className="form-control me-2"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select 
                className="form-select me-2" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Users</option>
                <option value="Active">Active Users</option>
                <option value="Inactive">Inactive Users</option>
              </select>
            </div>
            <button 
              className="btn btn-primary h-50" 
              onClick={() => setShowCreateCanvas(true)}
            >
              Add User
            </button>
          </div>

          {selectedUsers.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>{selectedUsers.length} selected</span>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteSelected}>
                Delete
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUsers([])}>
                Unselect All
              </button>
            </div>
          )}

          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>
                        <input 
                          type="checkbox" 
                          onChange={handleSelectAll} 
                          checked={selectedUsers.length === allUsers.length && allUsers.length > 0} 
                        />
                      </th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        <tr key={user._id}>
                          <td>
                            <input 
                              type="checkbox"        
                              checked={selectedUsers.includes(user._id)} 
                              onChange={() => handleSelectUser(user._id)}  
                            />
                          </td>
                          <td>{user.username}</td>
                          <td>{user.EmailId}</td>
                          <td>{user.Department?.name || "N/A"}</td>
                          <td>
                            <span className="badge bg-primary">
                              {user.Designation?.Name || "N/A"}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${user.isActive ? 'bg-success' : 'bg-secondary'}`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-sm btn-outline-primary me-2" 
                              onClick={() => handleSpecificUserClick(user)}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-primary me-2" 
                              onClick={() => {
                                populateEditForm(user);
                                setShowEditCanvas(true);
                              }}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger" 
                              onClick={() => handleDeleteUser(user._id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">No users found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Create User Canvas */}
          <div className={`p-4 offcanvas-custom ${showCreateCanvas ? "show" : ""}`}>
            <div className="offcanvas-header mb-3">
              <h5 className="offcanvas-title">Add User</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowCreateCanvas(false)} 
                style={{ position: "absolute", right: "30px" }}
              ></button>
            </div>
            <div className="offcanvas-body p-2">
              <form onSubmit={handleSubmit}>
                <div className='d-flex'>
                  <h6>Basic User Info</h6>
                  <hr className='line w-75'></hr>
                </div>
                <div className="mb-3 d-flex">
                  <input 
                    type="text" 
                    className="form-control me-2" 
                    placeholder="First Name" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)} 
                    required 
                  />
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Last Name" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="mb-3 d-flex">
                  <input 
                    type="email" 
                    className="form-control me-2" 
                    placeholder="Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="User Name" 
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="mb-3 d-flex">
                  <select 
                    className="form-select me-2" 
                    value={selectedGender} 
                    onChange={(e) => setSelectedGender(e.target.value)} 
                    required
                  >
                    <option value="">Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="others">Others</option>
                  </select>
                  <select
                    className="form-select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='d-flex'>
                  <h6>Contact</h6>
                  <hr className='line w-100'></hr>
                </div>
                <div className="mb-3">
                  <PhoneInput
                    value={workNumber}
                    onChange={(phone) => setWorkNumber(phone)}
                    inputStyle={{ width: "100%" }}
                    enableSearch
                    placeholder="Work Number"
                  />
                </div>
                <div className="mb-3 d-flex">
                  <input 
                    type="text" 
                    className="form-control me-2" 
                    placeholder="Extension" 
                    value={extension}
                    onChange={(e) => setExtension(e.target.value)} 
                  />
                  <PhoneInput
                    value={phoneNumber}
                    onChange={(phone) => setPhoneNumber(phone)}
                    inputStyle={{ width: "100%" }}
                    enableSearch
                    placeholder="Personal Number"
                    className='h-100'
                  />
                </div>
                <div className='d-flex'>
                  <h6>Additional Info</h6>
                  <hr className='line w-75'></hr>
                </div>
                <div className="d-flex mb-3">
                  <input 
                    type="text" 
                    className="form-control me-2" 
                    placeholder="Employee Id" 
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)} 
                  />
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="NRIC" 
                    value={NRIC}
                    onChange={(e) => setNRIC(e.target.value)} 
                    required 
                  />
                </div>

                <h6>Work</h6>
                <div className="mb-3 d-flex">
                  <select 
                    className="form-select me-3"
                    value={selectedDesignation}
                    onChange={(e) => setSelectedDesignation(e.target.value)}
                  >
                    <option value="">Select Designation</option>
                    {designations.map((designation) => (
                      <option key={designation._id} value={designation._id}>
                        {designation.Name}
                      </option>
                    ))}
                  </select>
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
                <div className='mb-3 d-flex geo-select'>
                  <Select
                    options={users}
                    value={selectedReportUsers}
                    onChange={setSelectedReportUsers}
                    onInputChange={(value) => {
                      setInputValue(value);
                      setMenuOpen(!!value);
                    }}
                    placeholder="Reporting to..."
                    isSearchable
                    menuIsOpen={menuOpen}
                    className="w-100 dept-user-select me-2"
                    noOptionsMessage={() => "No matching users"}
                  />
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Location" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)} 
                  />
                </div>
                <h6>Geo Location</h6>
                <div className="mb-3 d-flex">
                  <Select
                    options={timezones}
                    value={selectedTimezone}
                    onChange={setSelectedTimezone}
                    placeholder="Select a timezone"
                    isSearchable
                    className='w-100'
                  />
                </div>

                <h6>Password</h6>
                <div className="mb-3 d-flex">
                  <input 
                    type="password" 
                    className="form-control me-2" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="Confirm Password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-primary">Register</button>
                <button 
                  type="button" 
                  className="btn ms-2" 
                  onClick={() => {
                    setShowCreateCanvas(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>

          {/* Edit User Canvas */}
          <div className={`p-4 offcanvas-custom ${showEditCanvas ? "show" : ""}`}>
            <div className="offcanvas-header mb-3">
              <h5 className="offcanvas-title">Edit User</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowEditCanvas(false)} 
                style={{ position: "absolute", right: "30px" }}
              ></button>
            </div>
            <div className="offcanvas-body p-2">
              {selectedUserForEdit && (
                <form onSubmit={handleSubmitUpdate}>
                  <div className='d-flex'>
                    <h6>Basic User Info</h6>
                    <hr className='line w-75'></hr>
                  </div>
                  <div className="mb-3 d-flex">
                    <input 
                      type="text" 
                      className="form-control me-2" 
                      placeholder="First Name" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)} 
                      required 
                    />
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Last Name" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="mb-3 d-flex">
                    <input 
                      type="email" 
                      className="form-control me-2" 
                      placeholder="Email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                    />
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="User Name" 
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="mb-3 d-flex">
                    <select 
                      className="form-select me-2" 
                      value={selectedGender} 
                      onChange={(e) => setSelectedGender(e.target.value)} 
                      required
                    >
                      <option value="">Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="others">Others</option>
                    </select>
                    <select
                      className="form-select"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      required
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role._id} value={role._id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='d-flex'>
                    <h6>Contact</h6>
                    <hr className='line w-100'></hr>
                  </div>
                  <div className="mb-3">
                    <PhoneInput
                      value={workNumber}
                      onChange={(phone) => setWorkNumber(phone)}
                      inputStyle={{ width: "100%" }}
                      enableSearch
                      placeholder="Work Number"
                    />
                  </div>
                  <div className="mb-3 d-flex">
                    <input 
                      type="text" 
                      className="form-control me-2" 
                      placeholder="Extension" 
                      value={extension}
                      onChange={(e) => setExtension(e.target.value)} 
                    />
                    <PhoneInput
                      value={phoneNumber}
                      onChange={(phone) => setPhoneNumber(phone)}
                      inputStyle={{ width: "100%" }}
                      enableSearch
                      placeholder="Personal Number"
                      className='h-100'
                    />
                  </div>
                  <div className='d-flex'>
                    <h6>Additional Info</h6>
                    <hr className='line w-75'></hr>
                  </div>
                  <div className="d-flex mb-3">
                    <input 
                      type="text" 
                      className="form-control me-2" 
                      placeholder="Employee Id" 
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)} 
                    />
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="NRIC" 
                      value={NRIC}
                      onChange={(e) => setNRIC(e.target.value)} 
                      required 
                    />
                  </div>

                  <h6>Work</h6>
                  <div className="mb-3 d-flex">
                    <select 
                      className="form-select me-3"
                      value={selectedDesignation}
                      onChange={(e) => setSelectedDesignation(e.target.value)}
                    >
                      <option value="">Select Designation</option>
                      {designations.map((designation) => (
                        <option key={designation._id} value={designation._id}>
                          {designation.Name}
                        </option>
                      ))}
                    </select>
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
                  <div className='mb-3 d-flex geo-select'>
                    <Select
                      options={users}
                      value={selectedReportUsers}
                      onChange={setSelectedReportUsers}
                      onInputChange={(value) => {
                        setInputValue(value);
                        setMenuOpen(!!value);
                      }}
                      placeholder="Reporting to..."
                      isSearchable
                      menuIsOpen={menuOpen}
                      className="w-100 dept-user-select me-2"
                      noOptionsMessage={() => "No matching users"}
                    />
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Location" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)} 
                    />
                  </div>
                  <h6>Geo Location</h6>
                  <div className="mb-3 d-flex">
                    <Select
                      options={timezones}
                      value={selectedTimezone}
                      onChange={setSelectedTimezone}
                      placeholder="Select a timezone"
                      isSearchable
                      className='w-100'
                    />
                  </div>

                  <h6>Change Password (Optional)</h6>
                  <div className="mb-3 d-flex">
                    <input 
                      type="password" 
                      className="form-control me-2" 
                      placeholder="New Password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)} 
                    />
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="Confirm New Password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">Update</button>
                  <button 
                    type="button" 
                    className="btn ms-2" 
                    onClick={() => {
                      setShowEditCanvas(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* View User Canvas */}
          <div className={`p-4 offcanvas-custom ${showViewCanvas ? "show" : ""}`}>
            <div className="offcanvas-header mb-3">
              <h5 className="offcanvas-title">User Details</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowViewCanvas(false)}
                style={{ position: "absolute", right: "30px" }}
              >
              </button>
            </div>

            <div className="offcanvas-body p-2">
              {selectedSpecUser && (
                <>
                  <div className='d-flex mb-2'>
                    <h6>Basic User Info</h6>
                    <hr className='line w-75' />
                  </div>
                  <div className="mb-1 d-flex">
                    <p className='me-1 mb-1'>
                      <strong>Name:</strong> {selectedSpecUser.FirstName} {selectedSpecUser.LastName}
                    </p>
                  </div>
                  <div className="mb-3 d-flex">
                    <p className='me-2'>
                      <strong>Username:</strong> {selectedSpecUser.username}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedSpecUser.EmailId}
                    </p>
                  </div>

                  <div className='d-flex'>
                    <h6>Contact</h6>
                    <hr className='line w-100' />
                  </div>
                  <div className="mb-3">
                    <p><strong>Work Number:</strong> {selectedSpecUser.WorkPhone || "N/A"}</p>
                    <p><strong>Personal Number:</strong> {selectedSpecUser.PersonalMobile || "N/A"}</p>
                    <p><strong>Extension:</strong> {selectedSpecUser.Extension || "N/A"}</p>
                  </div>

                  <div className='d-flex'>
                    <h6>Additional Info</h6>
                    <hr className='line w-75' />
                  </div>
                  <div className="mb-3">
                    <p><strong>Employee ID:</strong> {selectedSpecUser.EmployeeID || "N/A"}</p>
                    <p><strong>NRIC:</strong> {selectedSpecUser.NRICNumber || "N/A"}</p>
                    <p><strong>Gender:</strong> {selectedSpecUser.Gender || "N/A"}</p>
                  </div>

                  <h6>Work</h6>
                  <div className="mb-3">
                    <p><strong>Designation:</strong> {selectedSpecUser.Designation?.Name || "N/A"}</p>
                    <p><strong>Department:</strong> {selectedSpecUser.Department?.name || "N/A"}</p>
                    <p><strong>Role:</strong> {selectedSpecUser.role?.name || "N/A"}</p>
                    <p><strong>Reporting To:</strong> {selectedSpecUser.ReportingTo?.username || "N/A"}</p>
                    <p><strong>Location:</strong> {selectedSpecUser.Location || "N/A"}</p>
                  </div>

                  <h6>Geo Location</h6>
                  <div className="mb-3">
                    <p><strong>Timezone:</strong> {selectedSpecUser.TimeZone || "N/A"}</p>
                  </div>

                  <div className="mb-3">
                    <p>
                      <strong>Status:</strong> 
                      <span className={`badge ${selectedSpecUser.isActive ? 'bg-success' : 'bg-secondary'} ms-2`}>
                        {selectedSpecUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowViewCanvas(false)}
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default UserManagement;
