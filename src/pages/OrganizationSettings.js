import React from 'react';

function OrganizationSettings() {
  return (
    <div>
      <h2 className="mb-4">Organization Settings</h2>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Company Information</h5>
              <form>
                <div className="mb-3">
                  <label className="form-label">Company Name</label>
                  <input type="text" className="form-control" defaultValue="Acme Corporation" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Domain</label>
                  <input type="text" className="form-control" defaultValue="acme.com" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contact Email</label>
                  <input type="email" className="form-control" defaultValue="contact@acme.com" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input type="tel" className="form-control" defaultValue="+1 (555) 123-4567" />
                </div>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Subscription Details</h5>
              <div className="mb-4">
                <p className="mb-1"><strong>Current Plan:</strong> Enterprise</p>
                <p className="mb-1"><strong>Expiry Date:</strong> December 31, 2024</p>
                <p className="mb-1"><strong>Status:</strong> <span className="badge bg-success">Active</span></p>
              </div>
              <button className="btn btn-outline-primary">Upgrade Plan</button>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-body">
              <h5 className="card-title">Network Configuration</h5>
              <form>
                <div className="mb-3">
                  <label className="form-label">Allowed IP Ranges</label>
                  <textarea className="form-control" rows="3" defaultValue="192.168.1.0/24&#10;10.0.0.0/8"></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">VPN Access</label>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" defaultChecked />
                    <label className="form-check-label">Enable VPN Access</label>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Update Configuration</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrganizationSettings;