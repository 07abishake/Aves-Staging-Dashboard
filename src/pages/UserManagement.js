import React, { useEffect, useState } from 'react';
import Select from "react-select";
import moment from "moment-timezone";
import axios from 'axios';
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import debounce from "lodash.debounce";
import { Spinner } from 'react-bootstrap';
function UserManagement() {
  //MAIN STATE
  const [allUsers, setAllUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateCanvas, setShowCreateCanvas] = useState(false);
  const [showViewCanvas, setShowViewCanvas] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSpecUser, setSelectedSpecUser] = useState(null);
  const [loading, setLoading] = useState(false);
  // DATA
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);


  //Form data
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState("")
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [workNumber, setWorkNumber] = useState("");
  const [selectedTimezone, setSelectedTimezone] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [NRIC, setNRIC] = useState("");
  const [employeeId, setEmployeeId] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [Location, setLocation] = useState("")
  const [extension, setExtension] = useState("")
  const [selectedReportUsers, setSelectedReportUsers] = useState([]);
  const timezones = moment.tz.names().map((tz) => ({
    value: tz,
    label: `${tz} (GMT${moment.tz(tz).format("Z")})`,
  }));


  const handleSubmit = async (e) => {
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    e.preventDefault();
    const payload = {
      FirstName: firstName,
      LastName: lastName,
      username: userName,
      Gender: selectedGender,
      Department: selectedDepartment ? selectedDepartment : null,
      Designation: selectedDesignation ? selectedDesignation : null,
      EmployeeID: employeeId,
      EmailId: email,
      WorkPhone: `+${workNumber}`,
      PersonalMobile: `+${phoneNumber}`,
      Extension: extension,
      TimeZone: selectedTimezone ? selectedTimezone.value : null,
      role: selectedRole,
      NRICNumber: NRIC,
      SeatingLocation: Location,
      Location: Location,
      ReportingTo: selectedReportUsers ? selectedReportUsers?.value : null,
      password: password,
      Repassword: confirmPassword
    }
    try {
      setLoading(true)
      const response = await axios.post("http://api.avessecurity.com/api/users/register", payload);

      alert(response.data.message);
      setShowCreateCanvas(false);


    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("500 " + (error.response?.data?.message));
    } finally {
      setLoading(false)
    }

  }
  console.log("timezone ", selectedTimezone)
  const fetchAllUsers = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`http://api.avessecurity.com:6378/api/users/get-AllUserData`);
      setAllUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);

    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchAllUsers();
  }, []);
  const handleSpecificUserClick = (user) => {
    setShowViewCanvas(true);
    setSelectedSpecUser(user)
  }
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
  const fetchDesignations = async () => {
    try {

      const response = await axios.get("http://api.avessecurity.com:6378/api/Designation/getDataDesignation");
      if (response.data && response.data.Designation) {
        setDesignations(response.data.Designation);
      }
    } catch (error) {
      console.error("Error fetching designations:", error);
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get("http://api.avessecurity.com/api/Roles/getRole");
        if (response.data && response.data.Roles) {
          setRoles(response.data.Roles);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    fetchRoles();
  }, []);
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
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(allUsers.map(user => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id) => {
    setUsers(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };

  const handleDeleteSelected = () => {
    alert(`Deleting ${selectedUsers.length} selected users`);
  };

  // const filteredUsers = allUsers.filter(user => {
  //   const searchValue = search.toLowerCase();
  //   if (statusFilter !== 'All' && user.status !== statusFilter) return false;
  //   return user.name.toLowerCase().includes(searchValue) || user.email.toLowerCase().includes(searchValue) || user.department.toLowerCase().includes(searchValue) || user.role.toLowerCase().includes(searchValue);
  // });
  console.log("selectedUsers", selectedSpecUser);
  return (
    <>{loading ?
      <div className="d-flex justify-content-center align-items-center flex-column" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
        <Spinner animation="border" role="status" variant="light">
        </Spinner>

      </div> :

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
            <select className="form-select me-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Users</option>
              <option value="Active">Active Users</option>
              <option value="Inactive">Inactive Users</option>
            </select>
          </div>
          <button className="btn btn-primary h-50" onClick={() => setShowCreateCanvas(true)}>
            Add User
          </button>
        </div>

        {
          selectedUsers.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>{selectedUsers.length} selected</span>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteSelected}>Delete</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUsers([])}>Unselect All</button>
            </div>
          )
        }

        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th><input type="checkbox" onChange={handleSelectAll} checked={selectedUsers.length === users.length} /></th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Designation</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.length > 0 && allUsers.map(user => (
                    <tr key={user._id} onClick={() => handleSpecificUserClick(user)}>
                      <td><input type="checkbox" checked={selectedUsers.includes(user._id)} onChange={() => handleSelectUser(user._id)} /></td>
                      <td>{user.username}</td>
                      <td>{user.EmailId}</td>
                      <td>{user.Department?.name}</td>
                      <td>
                        <span className="badge bg-primary">{`${user.Designation ? user.Designation.Name : "N/A"}`}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>


        <div className={`p-4 offcanvas-custom ${showCreateCanvas ? "show" : ""}`}>
          <div className="offcanvas-header mb-3">
            <h5 className="offcanvas-title">Add User</h5>
            <button type="button" className="btn-close" onClick={() => setShowCreateCanvas(false)} style={{ position: "absolute", right: "30px" }}></button>
          </div>
          <div className="offcanvas-body p-2">
            <form onSubmit={(e) => handleSubmit(e)}>
              <div className='d-flex'>
                <h6>Basic User Info</h6>
                <hr className='line w-75'></hr>
              </div>
              <div className="mb-3 d-flex">
                <input type="text" className="form-control me-2" placeholder="First Name" onChange={(e) => setFirstName(e.target.value)} required />
                <input type="text" className="form-control" placeholder="Last Name" onChange={(e) => setLastName(e.target.value)} required />
              </div>
              <div className="mb-3 d-flex">
                <input type="email" className="form-control me-2" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
                <input type="text" className="form-control" placeholder="User Name" onChange={(e) => setUserName(e.target.value)} required />
              </div>
              <div className="mb-3 d-flex">
                <select className="form-select  me-2" value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)} required>
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="others"> Others</option>
                </select>
                <select
                  className="form-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
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
                  // country={"us"} // Default country (you can change it)
                  value={workNumber}
                  onChange={(phone) => setWorkNumber(phone)}
                  inputStyle={{ width: "100%" }}
                  enableSearch
                  placeholder="Work Number"
                />
              </div>
              <div className="mb-3 d-flex">
                <input type="text" className="form-control me-2" placeholder="Extension" onChange={(e) => setExtension(e.target.value)} />

                <PhoneInput
                  // country={"us"} // Default country (you can change it)
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
                <input type="text" className="form-control me-2" placeholder="Employee Id" onChange={(e) => setEmployeeId(e.target.value)} />
                <input type="text" className="form-control" placeholder="NRIC" onChange={(e) => setNRIC(e.target.value)} required />
              </div>

              <div className="mb-3 d-flex">

              </div>

              <div className="mb-3">


              </div>
              <h6>Work</h6>
              <div className="mb-3 d-flex">
                <select className="form-select me-3"
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
                  // isMulti
                  isSearchable
                  menuIsOpen={menuOpen}
                  className="w-100 dept-user-select me-2"
                  noOptionsMessage={() => "No matching users"}
                />
                <input type="text" className="form-control" placeholder="Location" onChange={(e) => setLocation(e.target.value)} />
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
                <input type="password" className="form-control me-2" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
                <input type="password" className="form-control" placeholder="Confirm Password" onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary">Register</button>
              <button type="button" className="btn ms-2" onClick={() => setShowCreateCanvas(false)}>Cancel</button>
            </form>
          </div>
        </div>
        <div className={`p-4 offcanvas-custom ${showViewCanvas ? "show" : ""}`}>
          <div className="offcanvas-header mb-3">
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowViewCanvas(false)}
              style={{ position: "absolute", right: "30px" }}>
            </button>
          </div>

          <div className="offcanvas-body p-2">
            <div className='d-flex mb-2'>
              <h6>Basic User Info</h6>
              <hr className='line w-75' />
            </div>
            <div className="mb-1 d-flex">
              <p className='me-1 mb-1'>Name: {selectedSpecUser?.FirstName} {selectedSpecUser?.LastName}</p>
            </div>
            <div className="mb-3 d-flex">
              <p className='me-2'>Username: {selectedSpecUser?.username}</p>
            </div>

            <div className='d-flex'>
              <h6>Contact</h6>
              <hr className='line w-100' />
            </div>
            <div className="mb-3">
              <p>Work Number: {selectedSpecUser?.WorkPhone}</p>
              <p>Personal Number: {selectedSpecUser?.PersonalMobile}</p>
            </div>

            <div className='d-flex'>
              <h6>Additional Info</h6>
              <hr className='line w-75' />
            </div>
            <div className="mb-3">
              <p>Employee ID: {selectedSpecUser?.EmployeeID}</p>
              <p>NRIC: {selectedSpecUser?.NRICNumber}</p>
            </div>

            <h6>Work</h6>
            <div className="mb-3">
              <p>Designation: {selectedSpecUser?.Designation?.Name ?? "N/A"}</p>

              <p>Department: {departments.find(d => d.value === selectedSpecUser?.department)?.label || "N/A"}</p>
              <p>Reporting To: {users.find(user => user.value === selectedSpecUser?.reportTo)?.label || "N/A"}</p>
              <p>Location: {selectedSpecUser?.Location || "N/A"}</p>
            </div>

            <h6>Geo Location</h6>
            <div className="mb-3">
              <p>Timezone: {selectedSpecUser?.TimeZone || "N/A"}</p>
            </div>

            <button type="button" className="btn ms-2" onClick={() => setShowViewCanvas(false)}>Close</button>
          </div>
        </div>

      </div >
    }

    </>

  );
}

export default UserManagement;