import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Spinner, Badge } from 'react-bootstrap';

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

  // Format labels with proper spacing and special cases
  const formatLabel = (key) => {
    // Special cases
    const specialCases = {
      'CCTV': 'CCTV',
      'OshaMinutes': 'OSHA Minutes',
      'EmtelephoneChecklist': 'Em Telephone Checklist',
      'EelectrmagnaticDoor': 'Electromagnetic Door',
      'FineRecipt': 'Fine Receipt',
      'RecivingSuplier': 'Receiving Supplier',
      'SustainAbility': 'Sustainability',
      'SecuritydefectReport': 'Security Defect Report',
      'Panicbutton': 'Panic Button',
      'Securitypass': 'Security Pass',
      'Intercomtele': 'Intercom Telephone'
    };

    if (specialCases[key]) return specialCases[key];

    // Regular formatting
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/Checklist/g, ' Checklist')
      .replace(/Form/g, ' Form')
      .replace(/Report/g, ' Report')
      .trim();
  };

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
      await axios.post(`https://api.avessecurity.com/api/Roles/createRole`, payload, {
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
        <div className="container-fluid py-4">
          <h2 className="mb-4">Permissions & Security</h2>

          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="card-title mb-0">Role Management</h5>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowCreateCanvas(true)}
                    >
                      <i className="bi bi-plus-lg me-2"></i>Add New Role
                    </button>
                  </div>
                  
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Role</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allRoles.length > 0 ? (
                          allRoles.map((role) => (
                            <tr key={role._id}>
                              <td>
                                <span className="fw-semibold">{role.name}</span>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-primary me-2"
                                  onClick={() => handleSelectRole(role._id)}
                                >
                                  <i className="bi bi-eye me-1"></i>View/Edit
                                </button>
                                <button className="btn btn-sm btn-outline-danger">
                                  <i className="bi bi-trash me-1"></i>Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center py-4">
                              <div className="text-muted">No roles found</div>
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
                <div className="mb-3">
                  <label className="form-label">Role Name</label>
                  <input
                    className="form-control"
                    onChange={(e) => setRoleName(e.target.value)}
                    required
                    placeholder="Enter role name"
                  />
                </div>
                <div className="text-end mt-4">
                  <button type="button" className="btn btn-outline-secondary me-2" onClick={() => setShowCreateCanvas(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        <span className="ms-2">Creating...</span>
                      </>
                    ) : 'Create Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* View/Edit Role Permissions */}
          <div className={`p-4 offcanvas-custom ${showViewCanvas ? 'show' : ''}`}>
            <div className="offcanvas-header mb-3">
              <h5 className="offcanvas-title">
                <Badge bg="primary" className="me-2">{rolefetchname}</Badge> Permissions
              </h5>
              <button
                type="button"
                className="btn-close"
                style={{ position: 'absolute', right: '30px' }}
                onClick={() => setShowViewCanvas(false)}
              ></button>
            </div>
            <div className="offcanvas-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="mb-0">Module Permissions</h6>
                <button 
                  className="btn btn-sm btn-outline-primary" 
                  onClick={toggleAllPermissions}
                >
                  {allPermissionsSelected ? 'Unselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="table-responsive mb-5">
                <table className="table  table-hover">
                  <thead className="">
                    <tr>
                      <th style={{ width: '50%' }}>Module</th>
                      <th className="text-center">Create</th>
                      <th className="text-center">Update</th>
                      <th className="text-center">Delete</th>
                      <th className="text-center">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions &&
                      Object.keys(permissions)
                        .filter((key) => key !== '_id' && key !== '__v')
                        .map((key) => (
                          <tr key={key}>
                            <td>
                              <span className="fw-semibold">{formatLabel(key)}</span>
                            </td>
                            {['create', 'update', 'delete', 'view'].map((perm) => (
                              <td key={perm} className="text-center">
                                <div className="form-check d-inline-block">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={permissions[key][perm]}
                                    onChange={() => handlePermissionChange(key, perm)}
                                    style={{ transform: 'scale(1.2)' }}
                                  />
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="mb-0">Page Access</h6>
                <button 
                  className="btn btn-sm btn-outline-primary" 
                  onClick={toggleAllPages}
                >
                  {allPagesSelected ? 'Unselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="table-responsive mb-5">
                <table className="table  table-hover">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '80%' }}>Page</th>
                      <th className="text-center">Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AssignedPages &&
                      Object.keys(AssignedPages)
                        .filter((key) => key !== '_id' && key !== '__v')
                        .map((key) => (
                          <tr key={key}>
                            <td onClick={() => handleAssignedPageChange(key)} style={{ cursor: 'pointer' }}>
                              {formatLabel(key)}
                            </td>
                            <td className="text-center">
                              <div className="form-check form-switch d-inline-block">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  role="switch"
                                  checked={AssignedPages[key]}
                                  onChange={() => handleAssignedPageChange(key)}
                                  style={{ transform: 'scale(1.5)' }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="mb-0">Calendar Page Access</h6>
                <button 
                  className="btn btn-sm btn-outline-primary" 
                  onClick={toggleAllCalendarPages}
                >
                  {allCalendarSelected ? 'Unselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="table-responsive">
                <table className="table  table-hover">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '80%' }}>Action Page</th>
                      <th className="text-center">Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calendarPageAuth &&
                      Object.keys(calendarPageAuth)
                        .filter((key) => key !== '_id' && key !== '__v')
                        .map((key) => (
                          <tr key={key}>
                            <td style={{ cursor: 'pointer' }} onClick={() => handleCalendarPageChange(key)}>
                              {formatLabel(key.replace('CalendarByUser', '').replace('CalendarByAdmin', ''))}
                              <Badge bg={key.includes('ByUser') ? 'info' : 'warning'} className="ms-2">
                                {key.includes('ByUser') ? 'User' : 'Admin'}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <div className="form-check form-switch d-inline-block">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  role="switch"
                                  checked={calendarPageAuth[key]}
                                  onChange={() => handleCalendarPageChange(key)}
                                  style={{ transform: 'scale(1.5)' }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-end mt-4 border-top pt-3">
                <button 
                  className="btn btn-outline-secondary me-3" 
                  onClick={() => setShowViewCanvas(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleUpdatePermissions}
                >
                  <i className="bi bi-save me-2"></i>Save Changes
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