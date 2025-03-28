import React from 'react';

function Customization() {
  return (
    <div>
      <h2 className="mb-4">Customization</h2>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Theme Settings</h5>
              <form>
                <div className="mb-3">
                  <label className="form-label">Theme Mode</label>
                  <select className="form-select">
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Primary Color</label>
                  <input type="color" className="form-control form-control-color" value="#0d6efd" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Secondary Color</label>
                  <input type="color" className="form-control form-control-color" value="#6c757d" />
                </div>
                <button type="submit" className="btn btn-primary">Save Theme</button>
              </form>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-body">
              <h5 className="card-title">Branding</h5>
              <form>
                <div className="mb-3">
                  <label className="form-label">Logo</label>
                  <input type="file" className="form-control" accept="image/*" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Favicon</label>
                  <input type="file" className="form-control" accept="image/*" />
                </div>
                <button type="submit" className="btn btn-primary">Update Branding</button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Profile Fields</h5>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Field Name</th>
                      <th>Type</th>
                      <th>Required</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Job Title</td>
                      <td>Text</td>
                      <td>Yes</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2">Edit</button>
                        <button className="btn btn-sm btn-outline-danger">Delete</button>
                      </td>
                    </tr>
                    <tr>
                      <td>Department</td>
                      <td>Dropdown</td>
                      <td>Yes</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2">Edit</button>
                        <button className="btn btn-sm btn-outline-danger">Delete</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button className="btn btn-primary mt-3">Add New Field</button>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-body">
              <h5 className="card-title">Notification Settings</h5>
              <form>
                <div className="mb-3">
                  <label className="form-label">Email Notifications</label>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" defaultChecked />
                    <label className="form-check-label">New User Registration</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" defaultChecked />
                    <label className="form-check-label">System Updates</label>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Save Preferences</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Customization;