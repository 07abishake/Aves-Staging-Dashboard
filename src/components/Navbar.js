import React from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Navbar, Nav, Container, Dropdown, Badge } from 'react-bootstrap';
import { PersonCircle, Gear, BoxArrowRight, BellFill, EnvelopeFill } from 'react-bootstrap-icons';

function AppNavbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      localStorage.removeItem('access_token');
      navigate('/');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const userId = decoded.userId;

      const response = await fetch('https://api.avessecurity.com/api/log-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem('access_token');
        navigate('/');
      } else {
        alert(data.message || 'Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('access_token');
      navigate('/');
    }
  };

  let username = 'User';
  const token = localStorage.getItem('access_token');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      username = decoded.name || 'User';
    } catch (error) {
      console.error('Invalid token:', error);
    }
  }

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm mb-4" sticky="top">
      <Container fluid>
        <Navbar.Brand href="#" className="fw-bold text-primary">
   
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="navbar-nav" />
        
        <Navbar.Collapse id="navbar-nav" className="justify-content-end">
          <Nav className="align-items-center">
            {/* Notification Dropdown */}
            {/* <Dropdown as={Nav.Item} className="mx-2">
              <Dropdown.Toggle as={Nav.Link} className="position-relative">
                <BellFill size={20} />
                <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle">
                  3
                </Badge>
              </Dropdown.Toggle>
              <Dropdown.Menu align="end" className="mt-2 border-0 shadow-sm">
                <Dropdown.Header>Notifications</Dropdown.Header>
                <Dropdown.Item className="d-flex align-items-center">
                  <div className="me-3">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-circle d-inline-block">
                      <EnvelopeFill className="text-primary" />
                    </div>
                  </div>
                  <div>
                    <div className="fw-bold">New message</div>
                    <small className="text-muted">5 minutes ago</small>
                  </div>
                </Dropdown.Item>
                <Dropdown.Item className="d-flex align-items-center">
                  <div className="me-3">
                    <div className="bg-success bg-opacity-10 p-2 rounded-circle d-inline-block">
                      <BellFill className="text-success" />
                    </div>
                  </div>
                  <div>
                    <div className="fw-bold">System update</div>
                    <small className="text-muted">2 hours ago</small>
                  </div>
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item className="text-center text-primary">
                  View all notifications
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown> */}

            {/* User Dropdown */}
            <Dropdown as={Nav.Item} className="ms-2">
              <Dropdown.Toggle as={Nav.Link} className="d-flex align-items-center">
                <div className="me-2 d-flex align-items-center">
                  <PersonCircle size={24} className="text-primary" />
                </div>
                <div className="d-none d-lg-block">
                  <div className="fw-semibold">{username}</div>
                  <small className="text-muted">Admin</small>
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu align="end" className="mt-2 border-0 shadow-sm">
                <Dropdown.Header>User Settings</Dropdown.Header>
                <Dropdown.Item className="d-flex align-items-center">
                  <PersonCircle className="me-2 text-muted" />
                  Profile
                </Dropdown.Item>
                <Dropdown.Item className="d-flex align-items-center">
                  <Gear className="me-2 text-muted" />
                  Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item 
                  onClick={handleLogout}
                  className="d-flex align-items-center text-danger"
                >
                  <BoxArrowRight className="me-2" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;