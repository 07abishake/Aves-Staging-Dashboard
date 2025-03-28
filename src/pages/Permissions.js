import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';

function Permissions() {
  const [showCreateCanvas, setShowCreateCanvas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleName, setRoleName] = useState('')
  const [allRoles, setAllRoles] = useState([])
  const [permissions, setPermissions] = useState(null);
  const [showViewCanvas, setShowViewCanvas] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [AssignedPages, setAssignedPages] = useState(null)
  const [rolefetchname, setRoleFetchName] = useState("")
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://api.avessecurity.com/api/Roles/getRole`)
      setAllRoles(response.data.Roles)
    } catch (error) {
      console.error("error in fetching roles", error)
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchRoles()
  }, [])
  useEffect(() => {
    if (!selectedRoleId) return;
    const fetchPermissions = async () => {
      try {

        const response = await axios.get(`http://api.avessecurity.com:6378/api/users/UserFullData/${selectedRoleId}`);
        setPermissions(response.data.role.permissions);
        setAssignedPages(response.data.role.AssignedPage)
        setRoleFetchName(response.data.role.name)
      } catch (error) {
        console.error("Error fetching role permissions", error);
      }
    };

    fetchPermissions();
  }, [selectedRoleId]);
  const handleSelectRole = (roleId) => {
    setSelectedRoleId(roleId);
    setShowViewCanvas(true);
  };

  const handlePermissionChange = (category, permissionType) => {
    setPermissions((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [permissionType]: !prev[category][permissionType],
      },
    }));
  };
  const handleAssignedPageChange = (page) => {
    setAssignedPages((prev) => ({
      ...prev,
      [page]: !prev[page], // Toggle true/false
    }));
  };
  const handleUpdatePermissions = async () => {
    if (!selectedRoleId) {
      alert("No role selected!");
      return;
    }

    const payload = {
      permissions,
      AssignedPage: AssignedPages,
    };

    try {
      const response = await axios.put(
        `http://api.avessecurity.com/api/Roles/updateRole/${selectedRoleId}`,
        payload
      );

      alert("Permissions updated successfully!");
      setShowViewCanvas(false); // Close the modal after saving
    } catch (error) {
      console.error("Error updating permissions", error);
      alert("Failed to update permissions.");
    }
  };

  const hanleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      name: roleName
    }
    try {
      const response = await axios.post(`http://api.avessecurity.com/api/Roles/createRole`, payload)

      alert("Role Created Successfully")
      setShowCreateCanvas(false)
      fetchRoles()

    } catch (error) {
      console.error("error creating in role", error)
    }
  }
  return (
    <>{
      loading ? <div className="d-flex justify-content-center align-items-center flex-column" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
        <Spinner animation="border" role="status" variant="light">
        </Spinner>

      </div> :
        <div>
          <h2 className="mb-4">Permissions & Security</h2>

          <div className="row">
            <div className="">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Role Management</h5>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Role</th>
                          {/* <th>Users</th> */}
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allRoles.length > 0 ? (
                          allRoles.map((role) => (
                            <tr key={role._id}>
                              <td>{role.name}</td>
                              {/* <td>0</td> Replace with actual user count if available */}
                              <td>
                                {/* <button className="btn btn-sm btn-outline-success me-2" >View</button> */}
                                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleSelectRole(role._id)}>View/Edit</button>
                                <button className="btn btn-sm btn-outline-danger">Delete</button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center">No roles found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button className="btn btn-primary mt-3" onClick={() => setShowCreateCanvas(true)}>Add New Role</button>
                </div>
              </div>
            </div>
          </div>
          {

            <div className={`p-4 offcanvas-custom ${showCreateCanvas ? 'show' : ""}`}>
              <div className="offcanvas-header mb-3">
                <h5 className="offcanvas-title">Create a new Role</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateCanvas(false)} style={{ position: "absolute", right: "30px" }}></button>
              </div>
              <div className="offcanvas-body p-2">
                <form style={{ height: "500px" }} onSubmit={hanleSubmit}>
                  <div className='d-flex mb-3 justify-content-between'>
                    <label className="form-label me-2 mb-0 mt-1 ">Role Name : </label>
                    <input className='form-control w-50' onChange={(e) => setRoleName(e.target.value)} required></input>
                  </div>



                  <div className='text-end'>
                    <button type="submit" className="btn btn-primary me-2" disabled={loading}>
                      {loading ? "Creating..." : "Create"}
                    </button>
                    <button type="button" className="btn" onClick={() => setShowCreateCanvas(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>

          }

          <div className={`p-4 offcanvas-custom ${showViewCanvas ? 'show' : ""}`}>
            <div className="offcanvas-header mb-3">
              <h5 className="offcanvas-title">{rolefetchname} Permissions</h5>
              <button type="button" className="btn-close" style={{ position: "absolute", right: "30px" }} onClick={() => setShowViewCanvas(false)}></button>
            </div>
            <div className="offcanvas-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Permission</th>
                    <th>Create</th>
                    <th>Update</th>
                    <th>Delete</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions && Object.keys(permissions).filter((key) => key !== "_id" && key !== "__v").map((key) => (
                    <tr key={key}>
                      <td>{key}</td>
                      {["create", "update", "delete", "view"].map((perm) => (
                        <td key={perm}>
                          <input
                            className='my-check'
                            type="checkbox"
                            checked={permissions[key][perm]}
                            onChange={() => handlePermissionChange(key, perm)}
                          />
                          <label className="custom-check"></label>
                        </td>
                      ))}

                    </tr>
                  ))}
                </tbody>
              </table>
              <table className="table">
                <thead>
                  <tr>
                    <th>AssignedPages</th>
                    <th>Access</th>

                  </tr>
                </thead>
                <tbody>
                  {AssignedPages &&
                    Object.keys(AssignedPages).filter((key) => key !== "_id" && key !== "__v").map((key) => (
                      <tr key={key}>
                        <td onClick={() => handleAssignedPageChange(key)} style={{ cursor: "pointer" }}>{key}</td>
                        <td>
                          <input
                            type="checkbox"
                            className='my-check'
                            checked={AssignedPages[key]}
                            onChange={() => handleAssignedPageChange(key)}
                          />
                          <label className="custom-check"></label>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className='text-end'>
                <button className="btn btn-primary" onClick={handleUpdatePermissions}>
                  {"Save Changes"}
                </button>
                <button className='btn me-3' onClick={() => setShowViewCanvas(false)}>
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
    }

    </>

  );
}

export default Permissions;