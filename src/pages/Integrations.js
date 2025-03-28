import React from 'react';

function Integrations() {
  return (
    <div>
      <h2 className="mb-4">Integrations & Automations</h2>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Active Integrations</h5>
              <div className="table-responsive">
                
                <table className="table">
                  <thead>
                    <tr>
                      <th>Integration</th>
                      <th>Status</th>
                      <th>Last Sync</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Microsoft_Office_logo_%282019%E2%80%93present%29.svg/200px-Microsoft_Office_logo_%282019%E2%80%93present%29.svg.png" 
                             alt="Office 365" 
                             style={{width: '20px', marginRight: '10px'}} />
                        Office 365
                      </td>
                      <td><span className="badge bg-success">Connected</span></td>
                      <td>5 mins ago</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2">Configure</button>
                        <button className="btn btn-sm btn-outline-danger">Disconnect</button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <img src="https://www.zoho.com/branding/images/zoho-logo.png" 
                             alt="Zoho" 
                             style={{width: '20px', marginRight: '10px'}} />
                        Zoho People
                      </td>
                      <td><span className="badge bg-success">Connected</span></td>
                      <td>1 hour ago</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2">Configure</button>
                        <button className="btn btn-sm btn-outline-danger">Disconnect</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-body">
              <h5 className="card-title">Available Integrations</h5>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <img src="https://www.gstatic.com/images/branding/product/2x/google_cloud_64dp.png" 
                           alt="Google Workspace"
                           style={{width: '40px', marginBottom: '10px'}} />
                      <h6>Google Workspace</h6>
                      <button className="btn btn-sm btn-primary">Connect</button>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <img src="https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg" 
                           alt="Slack"
                           style={{width: '40px', marginBottom: '10px'}} />
                      <h6>Slack</h6>
                      <button className="btn btn-sm btn-primary">Connect</button>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <img src="https://cdn.worldvectorlogo.com/logos/jira-1.svg" 
                           alt="Jira"
                           style={{width: '40px', marginBottom: '10px'}} />
                      <h6>Jira</h6>
                      <button className="btn btn-sm btn-primary">Connect</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Integration Settings</h5>
              <form>
                <div className="mb-3">
                  <label className="form-label">Auto-Sync Interval</label>
                  <select className="form-select">
                    <option value="5">Every 5 minutes</option>
                    <option value="15">Every 15 minutes</option>
                    <option value="30">Every 30 minutes</option>
                    <option value="60">Every hour</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Error Notifications</label>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" defaultChecked />
                    <label className="form-check-label">Email on sync failure</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" defaultChecked />
                    <label className="form-check-label">Dashboard alerts</label>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Save Settings</button>
              </form>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-body">
              <h5 className="card-title">Sync Status</h5>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Office 365</span>
                  <span className="text-success">100%</span>
                </div>
                <div className="progress">
                  <div className="progress-bar" role="progressbar" style={{width: '100%'}}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Zoho People</span>
                  <span className="text-success">100%</span>
                </div>
                <div className="progress">
                  <div className="progress-bar" role="progressbar" style={{width: '100%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Integrations;