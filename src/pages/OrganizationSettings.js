import React, { useEffect, useState } from 'react';
import axios from 'axios';

function OrganizationSettings() {
  const [organization, setOrganization] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('No access token found.');
          return;
        }

        const response = await axios.get('https://api.avessecurity.com/api/oraganisation/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setOrganization(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch organization data.');
      }
    };

    fetchOrganization();
  }, []);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!organization) {
    return <div>Loading organization data...</div>;
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Organization Settings</h2>

      <div className="row">
        {/* Left column: Company Info */}
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Company Information</h5>
              <form>
                <div className="mb-3">
                  <label className="form-label">Company Name</label>
                 <input
  type="text"
  className="form-control"
  value={organization.domain}
  readOnly
/>
                </div>
                <div className="mb-3">
                  <label className="form-label">Domain</label>
                  <input type="text" className="form-control" value={organization.domain} readOnly />
                </div>
                <div className="mb-3">
                  <label className="form-label">Owner</label>
                  <input type="text" className="form-control" value={`${organization.name}@${organization.domain}`}/>
                </div>
                <div className="mb-3">
                  <label className="form-label">Valid Until</label>
                  <input
                    type="text"
                    className="form-control"
                    value={new Date(organization.validUntil).toLocaleDateString()}
                    readOnly
                  />
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right column: Subscription & Members */}
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Subscription Details</h5>
              <p><strong>Valid Until:</strong> {new Date(organization.validUntil).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span className={`badge ${organization.status ? 'bg-success' : 'bg-danger'}`}>
                {organization.status ? 'Active' : 'Inactive'}
              </span></p>
            </div>
          </div>

          {/* <div className="card">
            <div className="card-body">
              <h5 className="card-title">Members</h5>
              {organization.members && organization.members.length > 0 ? (
                <ul className="list-group">
                  {organization.members.map((member, idx) => (
                    <li key={idx} className="list-group-item">{member}</li>
                  ))}
                </ul>
              ) : (
                <p>No members listed.</p>
              )}
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default OrganizationSettings;
