import React, { useEffect, useState } from 'react';
import Select from "react-select";
import moment from "moment-timezone";
import axios from 'axios';
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import debounce from "lodash.debounce";
import { Spinner } from 'react-bootstrap';
import { jwtDecode } from 'jwt-decode';

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
  const [userImage, setUserImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [locations,setLocations] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    // window.location.href = "/login";
  }
  console.log('Token Get',token)
  const [data, setData] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    if (savedToken) {
      const decodedToken = jwtDecode(savedToken);
      setData(decodedToken);
    }
  }, []);

  const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;


  const isValidPassword = (password) => {
  return passwordRegex.test(password);
};


  // Handle image preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUserImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Populate edit form with user data
  const populateEditForm = (user) => {
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

    // Set image preview if exists
    if (user.UserImage) {
      setPreviewImage(`https://codeaves.avessecurity.com/${user.UserImage}`);
    } else {
      setPreviewImage(null);
    }

    setPassword('');
    setConfirmPassword('');
    setUserImage(null);
    setSelectedUserForEdit(user);
  };

const getLocationOptions = () => {
  if (!locations || locations.length === 0) return [];

  const options = [];

  locations.forEach(location => {
    if (!location.PrimaryLocation) return;

    // Add primary location
    options.push({
      value: location.PrimaryLocation,
      label: location.PrimaryLocation,
      level: 0
    });

    // Process SubLocations
    if (location.SubLocation?.length > 0) {
      location.SubLocation.forEach(subLoc => {
        if (!subLoc.PrimarySubLocation) return;

        // Add SubLocation (level 1)
        const subLocPath = `${location.PrimaryLocation},${subLoc.PrimarySubLocation}`;
        options.push({
          value: subLocPath,
          label: subLocPath,
          level: 1
        });

        // Process Secondary Locations
        if (subLoc.SecondaryLocation?.length > 0) {
          subLoc.SecondaryLocation.forEach(secondary => {
            if (!secondary.SecondaryLocation) return;

            // Add Secondary Location (level 2)
            const secondaryPath = `${location.PrimaryLocation},${subLoc.PrimarySubLocation},${secondary.SecondaryLocation}`;
            options.push({
              value: secondaryPath,
              label: secondaryPath,
              level: 2
            });

            // Process Secondary SubLocations
            if (secondary.SecondarySubLocation?.length > 0) {
              secondary.SecondarySubLocation.forEach(secondarySub => {
                if (!secondarySub.SecondarySubLocation) return;
                
                // Add Secondary SubLocation (level 3)
                const secondarySubPath = `${location.PrimaryLocation},${subLoc.PrimarySubLocation},${secondary.SecondaryLocation},${secondarySub.SecondarySubLocation}`;
                options.push({
                  value: secondarySubPath,
                  label: secondarySubPath,
                  level: 3
                });

                // Process Third Locations
                if (secondarySub.ThirdLocation?.length > 0) {
                  secondarySub.ThirdLocation.forEach(third => {
                    if (!third.ThirdLocation) return;

                    // Add Third Location (level 4)
                    const thirdPath = `${location.PrimaryLocation},${subLoc.PrimarySubLocation},${secondary.SecondaryLocation},${secondarySub.SecondarySubLocation},${third.ThirdLocation}`;
                    options.push({
                      value: thirdPath,
                      label: thirdPath,
                      level: 4
                    });

                    // Add Third SubLocation if exists (level 5)
                    if (third.ThirdSubLocation) {
                      const thirdSubPath = `${location.PrimaryLocation},${subLoc.PrimarySubLocation},${secondary.SecondaryLocation},${secondarySub.SecondarySubLocation},${third.ThirdLocation},${third.ThirdSubLocation}`;
                      options.push({
                        value: thirdSubPath,
                        label: thirdSubPath,
                        level: 5
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });

  return options;
}
  // Fetch all users
  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://codeaves.avessecurity.com/api/users/get-AllUserData`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setAllUsers(response.data.data);
      console.log(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments
  // const fetchDepartments = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await axios.get(
  //       'https://codeaves.avessecurity.com/api/Department/getAll',
  //       {
  //         headers: {
  //           'Authorization': `Bearer ${token}`
  //         }
  //       }
  //     );

  //     const departmentOptions = [];
  //     response.data.forEach(parent => {
  //       departmentOptions.push({ value: parent._id, label: parent.name });

  //       if (parent.children && parent.children.length > 0) {
  //         parent.children.forEach(child => {
  //           departmentOptions.push({
  //             value: child._id,
  //             label: child.name
  //           });
  //         });
  //       }
  //     });

  //     setDepartments(departmentOptions);
  //   } catch (error) {
  //     console.error('Error fetching departments:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchDepartments = async () => {
  try {
    const response = await axios.get(
      'https://codeaves.avessecurity.com/api/Department/getAll',
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    console.log("Raw departments response:", response.data); // Debug log

    const departmentOptions = response.data.map(dept => ({
      value: dept._id,
      label: dept.name
    }));

    setDepartments(departmentOptions);
  } catch (error) {
    console.error('Error fetching departments:', error);
  }
};

  // Fetch designations
  const fetchDesignations = async () => {
    try {
      const response = await axios.get(
        "https://codeaves.avessecurity.com/api/Designation/getDataDesignation",
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


const fetchLocations = async () => {
  try {
    const response = await axios.get(
      "https://codeaves.avessecurity.com/api/Location/getLocations",
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    console.log("Locations API Response:", response.data); // Debug log
    if (response.data && response.data.Location) {
      setLocations(response.data.Location);
      console.log("Locations set:", response.data.Location); // Debug log
    }
  } catch (error) {
    console.error("Error fetching locations:", error);
  }
};

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const response = await axios.get(
        "https://codeaves.avessecurity.com/api/Roles/getRole",
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
        `https://codeaves.avessecurity.com/api/Designation/getDropdown/${query}`,
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
    fetchLocations();
  }, []);

  // Handle search input for reporting users
  useEffect(() => {
    fetchUsers(inputValue);
  }, [inputValue]);

  // Handle create user form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
      if (!isValidPassword(password)) {
    alert(
      "Password must contain:\n• Minimum 8 characters\n• 1 uppercase\n• 1 lowercase\n• 1 number\n• 1 special character"
    );
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }


    // if (password !== confirmPassword) {
    //   alert("Passwords do not match!");
    //   return;
    // }

    const formData = new FormData();
    
    // Append all the existing fields to formData
    formData.append('LastName', lastName);
    formData.append('username', userName);
    formData.append('Gender', selectedGender);
    if (selectedDepartment) formData.append('Department', selectedDepartment);
    if (selectedDesignation) formData.append('Designation', selectedDesignation);
    formData.append('EmployeeID', employeeId);
    formData.append('EmailId', `${email}@${data?.domain}`);
    if (workNumber) formData.append('WorkPhone', `+${workNumber}`);
    if (phoneNumber) formData.append('PersonalMobile', `+${phoneNumber}`);
    formData.append('Extension', extension);
    if (selectedTimezone) formData.append('TimeZone', selectedTimezone.value);
    if (selectedRole) formData.append('role', selectedRole);
    formData.append('NRICNumber', NRIC);
    formData.append('Location', location);
    if (selectedReportUsers) formData.append('ReportingTo', selectedReportUsers.value);
    formData.append('password', password);
    formData.append('Repassword', confirmPassword);
    
    // Append the image file if it exists
    if (userImage) {
      formData.append('UserImage', userImage);
    }
  if (selectedDepartment) {
    formData.append('department', selectedDepartment); // Try lowercase if not working
    // Or if API needs object:
    // formData.append('department', JSON.stringify({ _id: selectedDepartment }));
  }

    if (selectedDesignation) formData.append('Designation', selectedDesignation);

    try {
      setLoading(true);
      const response = await axios.post(
        "https://codeaves.avessecurity.com/api/users/register",
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      alert(response.data.message);
      setShowCreateCanvas(false);
      fetchAllUsers();
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
    if (password) {
  if (!isValidPassword(password)) {
    alert(
      "New password must contain:\n• Minimum 8 characters\n• 1 uppercase\n• 1 lowercase\n• 1 number\n• 1 special character"
    );
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }
}
    // if (password && password !== confirmPassword) {
    //   alert("Passwords do not match!");
    //   return;
    // }

    const formData = new FormData();
    
    formData.append('LastName', lastName);
    formData.append('username', userName);
    formData.append('Gender', selectedGender);
    if (selectedDepartment) formData.append('Department', selectedDepartment);
    if (selectedDesignation) formData.append('Designation', selectedDesignation);
    formData.append('EmployeeID', employeeId);
    formData.append('EmailId', email);
    if (workNumber) formData.append('WorkPhone', `+${workNumber}`);
    if (phoneNumber) formData.append('PersonalMobile', `+${phoneNumber}`);
    formData.append('Extension', extension);
    if (selectedTimezone) formData.append('TimeZone', selectedTimezone.value);
    if (selectedRole) formData.append('role', selectedRole);
    formData.append('NRICNumber', NRIC);
    formData.append('Location', location);
    if (selectedReportUsers) formData.append('ReportingTo', selectedReportUsers.value);
    
    if (password) {
      formData.append('password', password);
      formData.append('Repassword', confirmPassword);
    }
    
    if (userImage) {
      formData.append('UserImage', userImage);
    }

    try {
      setLoading(true);
      console.log(selectedUserForEdit._id)
      const response = await axios.post(
        `https://codeaves.avessecurity.com/api/users/update/${selectedUserForEdit._id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      alert("User updated successfully");
      fetchAllUsers();
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
    setUserImage(null);
    setPreviewImage(null);
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
        `https://codeaves.avessecurity.com/api/users/delete/${userId}`,
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
      const deletePromises = selectedUsers.map(userId =>
        axios.delete(`https://codeaves.avessecurity.com/api/users/delete/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );

      await Promise.all(deletePromises);
      alert("Selected users deleted successfully");
      fetchAllUsers();
      setSelectedUsers([]);
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
      (statusFilter === 'Active' && user.isOnline) ||
      (statusFilter === 'Inactive' && !user.isOnline);

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
                          <td>
                            <div className="d-flex align-items-center">
                              {user.UserImage && (
                                <img 
                                  src={`https://codeaves.avessecurity.com/${user.UserImage}`} 
                                  alt="User" 
                                  style={{ 
                                    width: '30px', 
                                    height: '30px', 
                                    borderRadius: '50%',
                                    marginRight: '10px'
                                  }}
                                />
                              )}
                              {user.username}
                            </div>
                          </td>
                          <td>{user.EmailId}</td>
                          <td>{user.Department?.name || "N/A"}</td>
                        <td>
  <span className="badge bg-primary">
    {user.Designation?.[0]?.Name || "N/A"}
  </span>
</td>
                          <td>
                            <span className={`badge ${user.isOnline ? 'bg-success' : 'bg-secondary'}`}>
                              {user.isOnline ? 'Active' : 'Inactive'}
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
                
                {/* Image Upload */}
                <div className="mb-3">
                  <label htmlFor="userImage" className="form-label">User Image</label>
                  <input
                    type="file"
                    className="form-control"
                    id="userImage"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {previewImage && (
                    <div className="mt-2">
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        style={{ 
                          width: '100px', 
                          height: '100px', 
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="mb-3 d-flex">
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="First Name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
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
             
                <div className="d-flex mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim().split('@')[0])}
                    required
            autoComplete="new-email"
            name="new-email"
                  />
                  <span className="input-group-text">@{data?.domain}</span>
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
                  {/* <select
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
                  </select> */}
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
                 
  <label className="form-label"></label>
<Select
  options={getLocationOptions()}
  value={getLocationOptions().find(opt => opt.value === location)}
  onChange={(selected) => setLocation(selected?.value || '')}
  placeholder="Select location"
  isClearable
  className="w-100"
  formatOptionLabel={(option) => (
    <div style={{ paddingLeft: `${option.level * 10}px` }}>
      {option.label}
    </div>
  )}
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
{/* Password Section */}
<h6>Password</h6>
<div className="mb-3">
  <div className="position-relative mb-3">
    <input
      type={showPassword ? "text" : "password"}
      className="form-control pe-5"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
autoComplete="new-password"
  name="new-password"
    />
    <button
      type="button"
      className="btn btn-outline-secondary position-absolute end-0 top-0 h-100"
      style={{ border: "none", background: "transparent" }}
      onClick={() => setShowPassword(!showPassword)}
    >
      <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
    </button>
  </div>
  <div className="position-relative">
    <input
      type={showConfirmPassword ? "text" : "password"}
      className="form-control pe-5"
      placeholder="Confirm Password"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      required
      autoComplete="new-password"
  name="new-password"
    />
    <button
      type="button"
      className="btn btn-outline-secondary position-absolute end-0 top-0 h-100"
      style={{ border: "none", background: "transparent" }}
      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
    >
      <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
    </button>
  </div>
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
            onClick={() => {
                      setShowEditCanvas(false);
                      resetForm();
                    }}
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
                  
                  {/* Image Upload */}
                  <div className="mb-3">
                    <label htmlFor="editUserImage" className="form-label">User Image</label>
                    <input
                      type="file"
                      className="form-control"
                      id="editUserImage"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {(previewImage || selectedUserForEdit.UserImage) && (
                      <div className="mt-2">
                        <img 
                          src={previewImage || `https://codeaves.avessecurity.com/${selectedUserForEdit.UserImage}`} 
                          alt="User" 
                          style={{ 
                            width: '100px', 
                            height: '100px', 
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3 d-flex">
                    <input
                      type="text"
                      className="form-control me-2"
                      placeholder="First Name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
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
                      onChange={(e) => setEmail(e.target.value.trim().split('@')[0])}
                      required
                      autoComplete='edit-email'
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
                               
  <label className="form-label"></label>

<Select
  options={getLocationOptions()}
  value={getLocationOptions().find(opt => opt.value === location)}
  onChange={(selected) => setLocation(selected?.value || '')}
  placeholder="Select location"
  isClearable
  className="w-100"
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
{/* Change Password Section */}
<h6>Change Password (Optional)</h6>
<div className="mb-3">
  <div className="position-relative mb-3">
    <input
      type={showPassword ? "text" : "password"}
      className="form-control pe-5"
      placeholder="New Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      autoComplete='new-password'
    />
    <button
      type="button"
      className="btn btn-outline-secondary position-absolute end-0 top-0 h-100"
      style={{ border: "none", background: "transparent" }}
      onClick={() => setShowPassword(!showPassword)}
    >
      <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
    </button>
  </div>
  <div className="position-relative">
    <input
      type={showConfirmPassword ? "text" : "password"}
      className="form-control pe-5"
      placeholder="Confirm New Password"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      autoComplete='new-password'
    />
    <button
      type="button"
      className="btn btn-outline-secondary position-absolute end-0 top-0 h-100"
      style={{ border: "none", background: "transparent" }}
      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
    >
      <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
    </button>
  </div>
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
        {/* View User Canvas - Modern Design */}
<div className={`p-4 offcanvas-custom ${showViewCanvas ? "show" : ""}`} style={{ 
  background: '#FFFFFF'
}}>
  <div className="offcanvas-header mb-3 position-relative">
    <button
      type="button"
      className="btn-close position-absolute"
      onClick={() => setShowViewCanvas(false)}
      style={{ right: "20px", top: "20px" }}
    />
    <div className="w-100 text-center">
      <h5 className="offcanvas-title text-primary fw-bold">USER PROFILE</h5>
    </div>
  </div>

  <div className="offcanvas-body p-3">
    {selectedSpecUser && (
      <div className="user-profile-view">
        {/* Profile Header with Image */}
        <div className="text-center mb-4">
          <div className="position-relative d-inline-block">
            {selectedSpecUser.UserImage ? (
              <img 
                src={`https://codeaves.avessecurity.com/${selectedSpecUser.UserImage}`} 
                alt="User" 
                className="img-thumbnail rounded-circle border-primary"
                style={{ 
                  width: '120px', 
                  height: '120px', 
                  objectFit: 'cover',
                  borderWidth: '3px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
              />
            ) : (
              <div className="img-thumbnail rounded-circle border-primary d-flex align-items-center justify-content-center"
                style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderWidth: '3px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  fontSize: '2.5rem'
                }}
              >
                {selectedSpecUser.FirstName?.charAt(0)}{selectedSpecUser.LastName?.charAt(0)}
              </div>
            )}
            <span className={`position-absolute bottom-0 end-0 badge rounded-pill ${selectedSpecUser.isOnline ? 'bg-success' : 'bg-secondary'}`}
              style={{
                width: '20px',
                height: '20px',
                border: '2px solid white'
              }}
            ></span>
          </div>
          
          <h3 className="mt-3 mb-0 fw-bold text-dark">
            {selectedSpecUser.FirstName} {selectedSpecUser.LastName}
          </h3>
          <p className="text-muted mb-2">@{selectedSpecUser.username}</p>
          
          <div className="d-flex justify-content-center gap-2 mb-3">
            <span className="badge bg-primary rounded-pill">
           {selectedSpecUser.role?.name || "N/A"}
            </span>
            <span className="badge bg-info text-dark rounded-pill">
              {selectedSpecUser.Department?.name || "No Department"}
            </span>
          </div>
        </div>

        {/* User Details in Tabs */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <ul className="nav nav-tabs nav-fill" id="userDetailsTab" role="tablist">
              <li className="nav-item" role="presentation">
                <button className="nav-link active" id="basic-tab" data-bs-toggle="tab" data-bs-target="#basic" type="button" role="tab">
                  <i className="bi bi-person me-2"></i>Basic
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button className="nav-link" id="contact-tab" data-bs-toggle="tab" data-bs-target="#contact" type="button" role="tab">
                  <i className="bi bi-telephone me-2"></i>Contact
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button className="nav-link" id="work-tab" data-bs-toggle="tab" data-bs-target="#work" type="button" role="tab">
                  <i className="bi bi-briefcase me-2"></i>Work
                </button>
              </li>
            </ul>
            
            <div className="tab-content p-3" id="userDetailsTabContent">
              {/* Basic Info Tab */}
              <div className="tab-pane fade show active" id="basic" role="tabpanel">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="text-muted small mb-1">Email</label>
                      <p className="fw-semibold">
                        {selectedSpecUser.EmailId || <span className="text-muted">Not provided</span>}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small mb-1">Employee ID</label>
                      <p className="fw-semibold">
                        {selectedSpecUser.EmployeeID || <span className="text-muted">Not provided</span>}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="text-muted small mb-1">Gender</label>
                      <p className="fw-semibold">
                        {selectedSpecUser.Gender ? (
                          <span className="text-capitalize">{selectedSpecUser.Gender}</span>
                        ) : (
                          <span className="text-muted">Not specified</span>
                        )}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small mb-1">NRIC</label>
                      <p className="fw-semibold">
                        {selectedSpecUser.NRICNumber || <span className="text-muted">Not provided</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Contact Tab */}
              <div className="tab-pane fade" id="contact" role="tabpanel">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="text-muted small mb-1">Work Number</label>
                      <p className="fw-semibold">
                        {selectedSpecUser.WorkPhone ? (
                          <a href={`tel:${selectedSpecUser.WorkPhone}`} className="text-decoration-none">
                            {selectedSpecUser.WorkPhone}
                          </a>
                        ) : (
                          <span className="text-muted">Not provided</span>
                        )}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small mb-1">Extension</label>
                      <p className="fw-semibold">
                        {selectedSpecUser.Extension || <span className="text-muted">Not provided</span>}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="text-muted small mb-1">Personal Number</label>
                      <p className="fw-semibold">
                        {selectedSpecUser.PersonalMobile ? (
                          <a href={`tel:${selectedSpecUser.PersonalMobile}`} className="text-decoration-none">
                            {selectedSpecUser.PersonalMobile}
                          </a>
                        ) : (
                          <span className="text-muted">Not provided</span>
                        )}
                      </p>
                    </div>
     <div className="mb-3">
  <label className="text-muted small mb-1">Location</label>
  <p className="fw-semibold">
    {selectedSpecUser.Location || <span className="text-muted">Not specified</span>}
  </p>
</div>
                  </div>
                </div>
              </div>
              
              {/* Work Tab */}
              <div className="tab-pane fade" id="work" role="tabpanel">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="text-muted small mb-1">Department</label>
                      <p className="fw-semibold">
                        {selectedSpecUser.Department?.name || <span className="text-muted">Not assigned</span>}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small mb-1">Designation</label>
                      <p className="fw-semibold">
                        {selectedSpecUser.Designation?.Name || <span className="text-muted">Not assigned</span>}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="text-muted small mb-1">Reporting To</label>
                      <p className="fw-semibold">
                        {selectedSpecUser.ReportingTo?.username ? (
                          <span className="d-flex align-items-center">
                            <i className="bi bi-person-fill me-2"></i>
                            {selectedSpecUser.ReportingTo.username}
                          </span>
                        ) : (
                          <span className="text-muted">Not assigned</span>
                        )}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small mb-1">Timezone</label>
                      <p className="fw-semibold">
                        {selectedSpecUser.TimeZone || <span className="text-muted">Not set</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status and Actions */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div>
            <span className={`badge ${selectedSpecUser.isOnline ? 'bg-success' : 'bg-secondary'} rounded-pill px-3 py-2`}>
              <i className={`bi ${selectedSpecUser.isOnline ? 'bi-check-circle' : 'bi-slash-circle'} me-2`}></i>
              {selectedSpecUser.isOnline ? 'Active Account' : 'Inactive Account'}
            </span>
          </div>
          <div>
            <button 
              className="btn btn-outline-primary me-2"
              onClick={() => {
                populateEditForm(selectedSpecUser);
                setShowViewCanvas(false);
                setShowEditCanvas(true);
              }}
            >
              <i className="bi bi-pencil-square me-2"></i>Edit Profile
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowViewCanvas(false)}
            >
              <i className="bi bi-x-lg me-2"></i>Close
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
        </div >
      </div >
    </>
  );
}

export default UserManagement;
