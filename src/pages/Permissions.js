import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';

function Permissions() {
  const [showCreateCanvas, setShowCreateCanvas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [allRoles, setAllRoles] = useState([]);
  const [permissions, setPermissions] = useState(null);
  const [showViewCanvas, setShowViewCanvas] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [AssignedPages, setAssignedPages] = useState(null);
  const [rolefetchname, setRoleFetchName] = useState('');
  const [allPermissionsSelected, setAllPermissionsSelected] = useState(false);
  const [allPagesSelected, setAllPagesSelected] = useState(false);
  const [calendarPageAuth, setCalendarPageAuth] = useState(null);
  const [allCalendarSelected, setAllCalendarSelected] = useState(false);

  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = '/login';
  }

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`https://api.avessecurity.com/api/Roles/getRole`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAllRoles(response.data.Roles);
    } catch (error) {
      console.error('error in fetching roles', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (!selectedRoleId) return;
    const fetchPermissions = async () => {
      try {
        const response = await axios.get(
          `https://api.avessecurity.com/api/users/UserFullData/${selectedRoleId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setPermissions(response.data.role.permissions);
        setAssignedPages(response.data.role.AssignedPage);
        setRoleFetchName(response.data.role.name);
        setCalendarPageAuth(response.data.role.calendarPageAuth || {});
      } catch (error) {
        console.error('Error fetching role permissions', error);
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

  const handleCalendarPageChange = (pageKey) => {
    setCalendarPageAuth((prev) => ({
      ...prev,
      [pageKey]: !prev[pageKey],
    }));
  };

  const toggleAllCalendarPages = () => {
    if (!calendarPageAuth) return;
    const newState = !allCalendarSelected;
    const updated = {};

    for (const key in calendarPageAuth) {
      if (key !== '_id' && key !== '__v') {
        updated[key] = newState;
      }
    }

    setCalendarPageAuth(updated);
    setAllCalendarSelected(newState);
  };

  const handleAssignedPageChange = (page) => {
    setAssignedPages((prev) => ({
      ...prev,
      [page]: !prev[page],
    }));
  };

  const toggleAllPermissions = () => {
    if (!permissions) return;
    const updatedPermissions = {};
    const newState = !allPermissionsSelected;

    for (const category in permissions) {
      if (category !== '_id' && category !== '__v') {
        updatedPermissions[category] = {
          create: newState,
          update: newState,
          delete: newState,
          view: newState,
        };
      }
    }

    setPermissions(updatedPermissions);
    setAllPermissionsSelected(newState);
  };

  const toggleAllPages = () => {
    if (!AssignedPages) return;
    const updatedPages = {};
    const newState = !allPagesSelected;

    for (const page in AssignedPages) {
      if (page !== '_id' && page !== '__v') {
        updatedPages[page] = newState;
      }
    }

    setAssignedPages(updatedPages);
    setAllPagesSelected(newState);
  };

  const handleUpdatePermissions = async () => {
    if (!selectedRoleId) {
      alert('No role selected!');
      return;
    }

    const payload = {
      permissions,
      AssignedPage: AssignedPages,
      calendarPageAuth
    };

    try {
      await axios.put(
        `https://api.avessecurity.com/api/Roles/updateRole/${selectedRoleId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert('Permissions updated successfully!');
      setShowViewCanvas(false);
    } catch (error) {
      console.error('Error updating permissions', error);
      alert('Failed to update permissions.');
    }
  };

  const hanleSubmit = async (e) => {
    e.preventDefault();
    const payload = { name: roleName };
    try {
      await axios.post(`https://localhost:6378/api/Roles/createRole`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert('Role Created Successfully');
      setShowCreateCanvas(false);
      fetchRoles();
    } catch (error) {
      console.error('error creating in role', error);
    }
  };

  return (
    <>
      {loading ? (
        <div
          className="d-flex justify-content-center align-items-center flex-column"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1050,
          }}
        >
          <Spinner animation="border" role="status" variant="light" />
        </div>
      ) : (
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
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allRoles.length > 0 ? (
                          allRoles.map((role) => (
                            <tr key={role._id}>
                              <td>{role.name}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-primary me-2"
                                  onClick={() => handleSelectRole(role._id)}
                                >
                                  View/Edit
                                </button>
                                <button className="btn btn-sm btn-outline-danger">Delete</button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center">
                              No roles found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button className="btn btn-primary mt-3" onClick={() => setShowCreateCanvas(true)}>
                    Add New Role
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Create Role Offcanvas */}
          <div className={`p-4 offcanvas-custom ${showCreateCanvas ? 'show' : ''}`}>
            <div className="offcanvas-header mb-3">
              <h5 className="offcanvas-title">Create a new Role</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowCreateCanvas(false)}
                style={{ position: 'absolute', right: '30px' }}
              ></button>
            </div>
            <div className="offcanvas-body p-2">
              <form style={{ height: '500px' }} onSubmit={hanleSubmit}>
                <div className="d-flex mb-3 justify-content-between">
                  <label className="form-label me-2 mb-0 mt-1">Role Name :</label>
                  <input
                    className="form-control w-50"
                    onChange={(e) => setRoleName(e.target.value)}
                    required
                  />
                </div>
                <div className="text-end">
                  <button type="submit" className="btn btn-primary me-2" disabled={loading}>
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                  <button type="button" className="btn" onClick={() => setShowCreateCanvas(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* View/Edit Role Permissions */}
          <div className={`p-4 offcanvas-custom ${showViewCanvas ? 'show' : ''}`}>
            <div className="offcanvas-header mb-3">
              <h5 className="offcanvas-title">{rolefetchname} Permissions</h5>
              <button
                type="button"
                className="btn-close"
                style={{ position: 'absolute', right: '30px' }}
                onClick={() => setShowViewCanvas(false)}
              ></button>
            </div>
            <div className="offcanvas-body">
              <div className="d-flex justify-content-end mb-2">
                <button className="btn btn-sm btn-outline-secondary" onClick={toggleAllPermissions}>
                  {allPermissionsSelected ? 'Unselect All Permissions' : 'Select All Permissions'}
                </button>
              </div>
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
                  {permissions &&
                    Object.keys(permissions)
                      .filter((key) => key !== '_id' && key !== '__v')
                      .map((key) => (
                        <tr key={key}>
                          <td>{key}</td>
                          {['create', 'update', 'delete', 'view'].map((perm) => (
                            <td key={perm}>
                              <input
                                className="my-check"
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

              <div className="d-flex justify-content-end mb-2">
                <button className="btn btn-sm btn-outline-secondary" onClick={toggleAllPages}>
                  {allPagesSelected ? 'Unselect All Pages' : 'Select All Pages'}
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Assigned Pages</th>
                    <th>Access</th>
                  </tr>
                </thead>
                <tbody>
                  {AssignedPages &&
                    Object.keys(AssignedPages)
                      .filter((key) => key !== '_id' && key !== '__v')
                      .map((key) => (
                        <tr key={key}>
                          <td onClick={() => handleAssignedPageChange(key)} style={{ cursor: 'pointer' }}>
                            {key}
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              className="my-check"
                              checked={AssignedPages[key]}
                              onChange={() => handleAssignedPageChange(key)}
                            />
                            <label className="custom-check"></label>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>

              {/* Calendar Page Authorization Section */}
              <div className="d-flex justify-content-end mb-2">
                <button className="btn btn-sm btn-outline-secondary" onClick={toggleAllCalendarPages}>
                  {allCalendarSelected ? 'Unselect All Calendar Pages' : 'Select All Calendar Pages'}
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Calendar Pages</th>
                    <th>Access</th>
                  </tr>
                </thead>
                <tbody>
                  {calendarPageAuth &&
                    Object.keys(calendarPageAuth)
                      .filter((key) => key !== '_id' && key !== '__v')
                      .map((key) => (
                        <tr key={key}>
                          <td style={{ cursor: 'pointer' }} onClick={() => handleCalendarPageChange(key)}>
                            {key}
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              className="my-check"
                              checked={calendarPageAuth[key]}
                              onChange={() => handleCalendarPageChange(key)}
                            />
                            <label className="custom-check"></label>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>

              <div className="text-end">
                <button className="btn btn-primary me-2" onClick={handleUpdatePermissions}>
                  Save Changes
                </button>
                <button className="btn" onClick={() => setShowViewCanvas(false)}>
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Permissions;