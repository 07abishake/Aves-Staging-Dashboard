import React from 'react';

function ResourceManagement() {
  return (
    <div>
      <h2 className="mb-4">Resource Management</h2>

      <div className="row">
        <div className="col-md-12 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Internal Applications</h5>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>App Name</th>
                      <th>Integration Type</th>
                      <th>Status</th>
                      <th>Users</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>CRM System</td>
                      <td>OAuth 2.0</td>
                      <td><span className="badge bg-success">Active</span></td>
                      <td>45</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2">Configure</button>
                        <button className="btn btn-sm btn-outline-danger">Disable</button>
                      </td>
                    </tr>
                    <tr>
                      <td>HR Portal</td>
                      <td>API Key</td>
                      <td><span className="badge bg-success">Active</span></td>
                      <td>32</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2">Configure</button>
                        <button className="btn btn-sm btn-outline-danger">Disable</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Virtual Rooms</h5>
              <ul className="list-group">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Marketing Team Room
                  <span className="badge bg-primary rounded-pill">8 users</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Development Team Room
                  <span className="badge bg-primary rounded-pill">12 users</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Sales Team Room
                  <span className="badge bg-primary rounded-pill">6 users</span>
                </li>
              </ul>
              <button className="btn btn-primary mt-3">Create New Room</button>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Device Management</h5>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Device Name</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>MacBook Pro</td>
                      <td>macOS</td>
                      <td><span className="badge bg-success">Compliant</span></td>
                    </tr>
                    <tr>
                      <td>iPhone 13</td>
                      <td>iOS</td>
                      <td><span className="badge bg-warning">Pending</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResourceManagement;