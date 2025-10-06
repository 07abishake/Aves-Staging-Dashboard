import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Nav,
  Spinner,
  Alert,
  Button,
  ListGroup,
  ProgressBar,
  Table
} from 'react-bootstrap';

function OrganizationSettings() {
  const [organization, setOrganization] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [teams, setTeams] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState({
    org: true,
    users: false,
    teams: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('No access token found.');
          return;
        }

        // Fetch organization data
        setLoading(prev => ({...prev, org: true}));
        const orgResponse = await axios.get('https://codeaves.avessecurity.com/api/oraganisation/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrganization(orgResponse.data);
        setLoading(prev => ({...prev, org: false}));

        // Fetch user status if on members tab or overview
        if (activeTab === 'members' || activeTab === 'overview') {
          setLoading(prev => ({...prev, users: true}));
          const userResponse = await axios.get('https://codeaves.avessecurity.com/api/users/Status', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserStatus(userResponse.data);
          setLoading(prev => ({...prev, users: false}));
        }

        // Fetch teams if on overview tab
        if (activeTab === 'overview') {
          setLoading(prev => ({...prev, teams: true}));
          const teamsResponse = await axios.get('https://codeaves.avessecurity.com/api/firebase/getAllTeamName/Dashbard', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setTeams(teamsResponse.data);
          setLoading(prev => ({...prev, teams: false}));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data.');
        setLoading({org: false, users: false, teams: false});
      }
    };

    fetchData();
  }, [activeTab]); // Refetch when tab changes

  if (error && !organization) {
    return (
      <Container className="mt-4">
        <Alert variant="danger" className="d-flex align-items-center">
          <span className="me-2">⚠️</span>
          {error}
        </Alert>
      </Container>
    );
  }

  if (loading.org && !organization) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p>Loading organization data...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="px-4 py-3">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="bg-black bg-gradient text-white p-4 rounded-3 shadow">
            <h1 className="display-6 fw-bold">Organization Settings</h1>
            <p className="mb-0 opacity-75">Manage your organization's details and subscription</p>
          </div>
        </Col>
      </Row>

      <Row>
        {/* Sidebar Navigation */}
        <Col md={3} className="mb-4">
          <Card className="shadow-sm">
            <Card.Body className="p-0">
              <Nav variant="pills" className="flex-column">
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'overview'} 
                    onClick={() => setActiveTab('overview')}
                    className="d-flex align-items-center py-3"
                  >
                    <span className="me-3"></span>
                    Overview
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'billing'} 
                    onClick={() => setActiveTab('billing')}
                    className="d-flex align-items-center py-3"
                  >
                    <span className="me-3"></span>
                    Billing
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'members'} 
                    onClick={() => setActiveTab('members')}
                    className="d-flex align-items-center py-3"
                  >
                    <span className="me-3"></span>
                    Members
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'settings'} 
                    onClick={() => setActiveTab('settings')}
                    className="d-flex align-items-center py-3"
                  >
                    <span className="me-3"></span>
                    Settings
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col md={9}>
          {activeTab === 'overview' && (
            <>
              {/* Organization Overview Card */}
              <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Organization Overview</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="align-items-center mb-4">
                    <Col md="auto">
                      <div 
                        className="rounded-circle bg-black d-flex align-items-center justify-content-center text-white fw-bold"
                        style={{ width: '80px', height: '80px', fontSize: '2rem' }}
                      >
                        {organization.domain.charAt(0).toUpperCase()}
                      </div>
                    </Col>
                    <Col>
                      <h4 className="mb-1">{organization.domain}</h4>
                      <Badge bg={organization.status ? 'success' : 'danger'}>
                        {organization.status ? 'Active' : 'Inactive'}
                      </Badge>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4} className="text-center mb-3">
                      <div className="border rounded p-3">
                        <h3 className="text-black">
                          {userStatus ? userStatus.totalUsers : 
                            (loading.users ? <Spinner animation="border" size="sm" /> : 'N/A')}
                        </h3>
                        <p className="mb-0 text-muted">Members</p>
                      </div>
                    </Col>
                    <Col md={4} className="text-center mb-3">
                      <div className="border rounded p-3">
                        <h3 className="text-black">
                          {teams ? teams.FireBaseTeam.length : 
                            (loading.teams ? <Spinner animation="border" size="sm" /> : 'N/A')}
                        </h3>
                        <p className="mb-0 text-muted">Teams</p>
                      </div>
                    </Col>
                    <Col md={4} className="text-center mb-3">
                      <div className="border rounded p-3">
                        <h3 className="text-black">
                          {userStatus ? userStatus.onlineUsersCount : 
                            (loading.users ? <Spinner animation="border" size="sm" /> : 'N/A')}
                        </h3>
                        <p className="mb-0 text-muted">Online Now</p>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Row>
                <Col md={6} className="mb-4">
                  <Card className="h-100 shadow-sm">
                    <Card.Header className="bg-light">
                      <h5 className="mb-0">Company Information</h5>
                    </Card.Header>
                    <Card.Body>
                      <ListGroup variant="flush">
                        <ListGroup.Item className="d-flex justify-content-between px-0">
                          <span className="text-muted">Company Name</span>
                          <span className="fw-bold">{organization.domain}</span>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between px-0">
                          <span className="text-muted">Domain</span>
                          <span className="fw-bold">{organization.domain}</span>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between px-0">
                          <span className="text-muted">Owner</span>
                          <span className="fw-bold">{`${organization.name}@${organization.domain}`}</span>
                        </ListGroup.Item>
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6} className="mb-4">
                  <Card className="h-100 shadow-sm">
                    <Card.Header className="bg-light">
                      <h5 className="mb-0">Subscription Details</h5>
                    </Card.Header>
                    <Card.Body>
                      <ListGroup variant="flush">
                        <ListGroup.Item className="d-flex justify-content-between px-0">
                          <span className="text-muted">Plan</span>
                          <Badge bg="primary"></Badge>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between px-0">
                          <span className="text-muted">Valid Until</span>
                          <span className="fw-bold">{new Date(organization.validUntil).toLocaleDateString()}</span>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between px-0">
                          <span className="text-muted">Status</span>
                          <Badge bg={organization.status ? 'success' : 'danger'}>
                            {organization.status ? 'Active' : 'Inactive'}
                          </Badge>
                        </ListGroup.Item>
                      </ListGroup>
                      <div className="d-grid gap-2 mt-3">
                        {/* <Button variant="outline-primary">Upgrade Plan</Button>
                        <Button variant="outline-secondary">Payment History</Button> */}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Teams Section */}
              {/* <Row>
                <Col md={6} className="mb-4">
                  <Card className="h-100 shadow-sm">
                    <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Teams</h5>
                      {loading.teams && <Spinner animation="border" size="sm" />}
                    </Card.Header>
                    <Card.Body>
                      {teams && teams.FireBaseTeam.length > 0 ? (
                        <ListGroup variant="flush">
                          {teams.FireBaseTeam.map(team => (
                            <ListGroup.Item key={team._id} className="px-0">
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold">{team.TeamName}</span>
                                <Badge bg="secondary">{team.users.length} members</Badge>
                              </div>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      ) : (
                        <p className="text-muted text-center">No teams found</p>
                      )}
                      <div className="d-grid gap-2 mt-3">
                        <Button variant="outline-primary">Manage Teams</Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row> */}
            </>
          )}

          {activeTab === 'billing' && (
            <Card className="shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Billing Information</h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center py-5">
                  <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                    <span style={{ fontSize: '2.5rem' }}>💳</span>
                  </div>
                  <h4>Billing Details</h4>
                  <p className="text-muted">Your billing information will be displayed here</p>
                  <Button variant="primary">Manage Billing</Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {activeTab === 'members' && (
            <Card className="shadow-sm">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Team Members</h5>
                {/* <Button variant="primary" size="sm">Invite Member</Button> */}
              </Card.Header>
              <Card.Body>
                {loading.users ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" className="mb-3" />
                    <p>Loading members...</p>
                  </div>
                ) : userStatus ? (
                  <>
                    <Row className="mb-4">
                      <Col md={6}>
                        <Card className="bg-success bg-opacity-10 border-success">
                          <Card.Body className="py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <span>Online Users</span>
                              <Badge bg="success" className="fs-6">{userStatus.onlineUsersCount}</Badge>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card className="bg-secondary bg-opacity-10 border-secondary">
                          <Card.Body className="py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <span>Offline Users</span>
                              <Badge bg="secondary" className="fs-6">{userStatus.offlineUsersCount}</Badge>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    <h6>Online Members</h6>
                    <Table striped bordered hover size="sm" className="mb-4">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userStatus.onlineUsers.map(user => (
                          <tr key={user._id}>
                            <td>{user.username}</td>
                            <td><Badge bg="success">Online</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    <h6>Offline Members</h6>
                    <Table striped bordered hover size="sm">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userStatus.offlineUsers.map(user => (
                          <tr key={user._id}>
                            <td>{user.username}</td>
                            <td><Badge bg="secondary">Offline</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </>
                ) : (
                  <div className="text-center py-5">
                    <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                      <span style={{ fontSize: '2.5rem' }}>👥</span>
                    </div>
                    <h4>Team Management</h4>
                    <p className="text-muted">Manage your team members here</p>
                    <Button variant="outline-primary">View All Members</Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {activeTab === 'settings' && (
            <Card className="shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Organization Settings</h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center py-5">
                  <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                    <span style={{ fontSize: '2.5rem' }}>⚙️</span>
                  </div>
                  <h4>Organization Settings</h4>
                  <p className="text-muted">Configure your organization settings here</p>
                  <Button variant="outline-primary">Edit Settings</Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default OrganizationSettings;