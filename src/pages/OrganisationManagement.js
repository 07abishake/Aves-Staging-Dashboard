// components/OrganizationDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const OrganizationDashboard = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('hierarchy'); // 'hierarchy' or 'list'

  const BASE_URL = 'https://codeaves.avessecurity.com/api';
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserInfo(decoded);
        fetchOrganizations();
      } catch (error) {
        console.error('Token decode error:', error);
        handleLogout();
      }
    } else {
      window.location.href = '/login';
    }
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/organizations/list`, getAuthHeaders());
      
      if (response.data.success) {
        setOrganizations(response.data.data);
      } else {
        showAlert('Failed to load organizations', 'danger');
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      showAlert('Failed to load organizations', 'danger');
      
      // If token is invalid, redirect to login
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleOrganizationStatus = async (orgId, currentStatus, orgName) => {
    if (!window.confirm(
      `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} "${orgName}"?`
    )) {
      return;
    }

    try {
      setActionLoading(orgId);
      const response = await axios.patch(
        `${BASE_URL}/organizations/${orgId}/status`,
        { isActive: !currentStatus },
        getAuthHeaders()
      );
      
      if (response.data.success) {
        // Update the organization status in local state
        setOrganizations(prevOrgs => 
          prevOrgs.map(org => 
            org._id === orgId 
              ? { ...org, isActive: !currentStatus }
              : org
          )
        );
        
        showAlert(
          `Organization "${orgName}" ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
          'success'
        );
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update organization status';
      showAlert(errorMessage, 'danger');
    } finally {
      setActionLoading(null);
    }
  };

  const showAlert = (message, type) => {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => alert.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert alert alert-${type} alert-dismissible fade show`;
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      min-width: 300px;
    `;
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleCreateOrganization = () => {
    navigate('/create-sub-organization');
  };

  const buildHierarchy = (orgs) => {
    const orgMap = {};
    const rootOrgs = [];

    // Create a map of all organizations
    orgs.forEach(org => {
      orgMap[org._id] = { ...org, children: [] };
    });

    // Build hierarchy
    orgs.forEach(org => {
      if (org.parent && orgMap[org.parent]) {
        orgMap[org.parent].children.push(orgMap[org._id]);
      } else {
        rootOrgs.push(orgMap[org._id]);
      }
    });

    return rootOrgs;
  };

  const renderHierarchy = (orgs, level = 0) => {
    return orgs.map(org => (
      <div key={org._id} className="organization-node">
        <div 
          className={`card mb-2 ${org.isActive ? 'border-success' : 'border-danger'}`}
          style={{ marginLeft: `${level * 30}px` }}
        >
          <div className="card-body py-3">
            <div className="row align-items-center">
              <div className="col-md-4">
                <div className="d-flex align-items-center">
                  <i className={`fas fa-building me-3 ${org.isActive ? 'text-success' : 'text-danger'}`}></i>
                  <div>
                    <h6 className="mb-1">{org.name}</h6>
                    <p className="mb-1 text-muted small">
                      <strong>Domain:</strong> {org.domain}
                    </p>
                    <p className="mb-0 text-muted small">
                      <strong>Full Path:</strong> {org.fullDomainPath}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-2">
                <span className="badge bg-secondary">Level {org.hierarchyLevel}</span>
              </div>
              
              <div className="col-md-2">
                <span className={`badge ${org.isActive ? 'bg-success' : 'bg-danger'}`}>
                  <i className={`fas ${org.isActive ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                  {org.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="col-md-4 text-end">
                {/* Show control buttons only for organizations that current user can control */}
                {(userInfo?.role === 'Super Admin' || org.parent === userInfo?.OrganizationId) && (
                  <button
                    onClick={() => toggleOrganizationStatus(org._id, org.isActive, org.name)}
                    disabled={actionLoading === org._id}
                    className={`btn btn-sm ${org.isActive ? 'btn-warning' : 'btn-success'} me-2`}
                  >
                    {actionLoading === org._id ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : org.isActive ? (
                      <><i className="fas fa-pause me-1"></i> Deactivate</>
                    ) : (
                      <><i className="fas fa-play me-1"></i> Activate</>
                    )}
                  </button>
                )}
                
                <button className="btn btn-outline-info btn-sm">
                  <i className="fas fa-info-circle me-1"></i>
                  Details
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Render children recursively */}
        {org.children && org.children.length > 0 && renderHierarchy(org.children, level + 1)}
      </div>
    ));
  };

  const renderListView = (orgs) => {
    const filteredOrgs = orgs.filter(org =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Organization Name</th>
              <th>Domain</th>
              <th>Full Domain Path</th>
              <th>Level</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrgs.map(org => (
              <tr key={org._id}>
                <td>
                  <div>
                    <strong>{org.name}</strong>
                    <br />
                    <small className="text-muted">{org.companyName}</small>
                  </div>
                </td>
                <td>
                  <code>{org.domain}</code>
                </td>
                <td>
                  <small>{org.fullDomainPath}</small>
                </td>
                <td>
                  <span className="badge bg-secondary">Level {org.hierarchyLevel}</span>
                </td>
                <td>
                  <span className={`badge ${org.isActive ? 'bg-success' : 'bg-danger'}`}>
                    {org.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {(userInfo?.role === 'Super Admin' || org.parent === userInfo?.OrganizationId) && (
                    <button
                      onClick={() => toggleOrganizationStatus(org._id, org.isActive, org.name)}
                      disabled={actionLoading === org._id}
                      className={`btn btn-sm ${org.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                    >
                      {actionLoading === org._id ? (
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      ) : org.isActive ? (
                        <><i className="fas fa-pause me-1"></i> Deactivate</>
                      ) : (
                        <><i className="fas fa-play me-1"></i> Activate</>
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredOrgs.length === 0 && (
          <div className="text-center py-5">
            <i className="fas fa-building fa-3x text-muted mb-3"></i>
            <p className="text-muted">No organizations found</p>
          </div>
        )}
      </div>
    );
  };

  // Filter organizations based on user's access
  const accessibleOrganizations = organizations.filter(org => 
    userInfo?.accessibleOrgIds?.includes(org._id) || org._id === userInfo?.OrganizationId
  );

  const hierarchy = buildHierarchy(accessibleOrganizations);

  if (loading && organizations.length === 0) {
    return (
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-12">
            <div className="card shadow">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading organizations...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <h2 className="mb-1">
                    <i className="fas fa-sitemap me-2 text-primary"></i>
                    Organization Dashboard
                  </h2>
                  {userInfo && (
                    <p className="text-muted mb-0">
                      Logged in as <strong>{userInfo.name}@{userInfo.domain}</strong> 
                      <span className="badge bg-primary ms-2">{userInfo.role}</span>
                    </p>
                  )}
                </div>
                <div className="col-md-6 text-end">
                  <div className="d-flex justify-content-end align-items-center gap-2">
                    <button 
                      className="btn btn-success"
                      onClick={handleCreateOrganization}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Create Sub-Organization
                    </button>
                    <button 
                      className="btn btn-outline-danger"
                      onClick={handleLogout}
                    >
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-4">
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className={`btn ${viewMode === 'hierarchy' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setViewMode('hierarchy')}
                    >
                      <i className="fas fa-sitemap me-2"></i>
                      Hierarchy View
                    </button>
                    <button
                      type="button"
                      className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setViewMode('list')}
                    >
                      <i className="fas fa-list me-2"></i>
                      List View
                    </button>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search organizations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4 text-end">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={fetchOrganizations}
                  >
                    <i className="fas fa-redo me-2"></i>
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Organizations Content */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                <i className="fas fa-building me-2"></i>
                {viewMode === 'hierarchy' ? 'Organization Hierarchy' : 'All Organizations'}
                <span className="badge bg-primary ms-2">{accessibleOrganizations.length}</span>
              </h5>
            </div>
            <div className="card-body">
              {viewMode === 'hierarchy' ? (
                <div className="hierarchy-container">
                  {hierarchy.length > 0 ? (
                    renderHierarchy(hierarchy)
                  ) : (
                    <div className="text-center py-5">
                      <i className="fas fa-building fa-3x text-muted mb-3"></i>
                      <p className="text-muted">No organizations found in your hierarchy</p>
                      <button 
                        className="btn btn-primary"
                        onClick={handleCreateOrganization}
                      >
                        <i className="fas fa-plus me-2"></i>
                        Create Your First Sub-Organization
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                renderListView(accessibleOrganizations)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDashboard;