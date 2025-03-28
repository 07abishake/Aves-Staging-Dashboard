import React from 'react';

function DataAdministration() {
  return (
    <div>
      <h2 className="mb-4">Data Administration</h2>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Data Export</h5>
              <form>
                <div className="mb-3">
                  <label className="form-label">Select Data Type</label>
                  <select className="form-select">
                    <option value="users">Users</option>
                    <option value="messages">Messages</option>
                    <option value="files">Files</option>
                    <option value="activities">Activities</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Date Range</label>
                  <div className="row">
                    <div className="col">
                      <input type="date" className="form-control" />
                    </div>
                    <div className="col">
                      <input type="date" className="form-control" />
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Format</label>
                  <select className="form-select">
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">Export Data</button>
              </form>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-body">
              <h5 className="card-title">Recent Exports</h5>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Size</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>2023-11-20</td>
                      <td>Users</td>
                      <td>2.3 MB</td>
                      <td><span className="badge bg-success">Completed</span></td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary">Download</button>
                      </td>
                    </tr>
                    <tr>
                      <td>2023-11-19</td>
                      <td>Messages</td>
                      <td>5.1 MB</td>
                      <td><span className="badge bg-success">Completed</span></td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary">Download</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Storage Usage</h5>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Total Storage</span>
                  <span>75%</span>
                </div>
                <div className="progress">
                  <div className="progress-bar" role="progressbar" style={{width: '75%'}}></div>
                </div>
                <small className="text-muted">750 GB of 1 TB used</small>
              </div>
              <div className="mb-4">
                <h6>Storage by Type</h6>
                <div className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span>Documents</span>
                    <span>300 GB</span>
                  </div>
                  <div className="progress" style={{height: '5px'}}>
                    <div className="progress-bar bg-primary" style={{width: '40%'}}></div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span>Media</span>
                    <span>250 GB</span>
                  </div>
                  <div className="progress" style={{height: '5px'}}>
                    <div className="progress-bar bg-success" style={{width: '33%'}}></div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span>Other</span>
                    <span>200 GB</span>
                  </div>
                  <div className="progress" style={{height: '5px'}}>
                    <div className="progress-bar bg-warning" style={{width: '27%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-body">
              <h5 className="card-title">Data Retention</h5>
              <form>
                <div className="mb-3">
                  <label className="form-label">Retention Period</label>
                  <select className="form-select">
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                    <option value="90">90 Days</option>
                    <option value="180">180 Days</option>
                    <option value="365">1 Year</option>
                  </select>
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="archiveData" />
                    <label className="form-check-label" htmlFor="archiveData">
                      Archive before deletion
                    </label>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Update Policy</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataAdministration;