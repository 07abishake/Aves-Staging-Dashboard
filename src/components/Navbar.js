import React from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { PersonCircle, BoxArrowRight } from 'react-bootstrap-icons';
import NotificationBell from '../pages/NotificationBell';

function AppNavbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('organizationId');
      navigate('/');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const userId = decoded.userId;

      const response = await fetch('https://codeaves.avessecurity.com/api/auth/log-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('organizationId');
        navigate('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('organizationId');
      navigate('/');
    }
  };

  let username = 'User';
  let userRole = 'User';
  const token = localStorage.getItem('access_token');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      username = decoded.name || 'User';
      userRole = decoded.role || 'User';
      
      localStorage.setItem('user', JSON.stringify({
        name: username,
        role: userRole,
        email: decoded.email,
        userId: decoded.userId
      }));
      
      if (decoded.OrganizationId) {
        localStorage.setItem('organizationId', decoded.OrganizationId);
      }
    } catch (error) {
      console.error('Invalid token:', error);
    }
  }

  return (
    <Navbar bg="white" expand="lg" className="border-bottom shadow-sm">
      <Container fluid>
        {/* Brand */}
        <Navbar.Brand 
          className="fw-bold text-primary cursor-pointer"
          onClick={() => navigate('/dashboard')}
          style={{ cursor: 'pointer' }}
        >
        </Navbar.Brand>

        {/* Navigation Items */}
        <Nav className="ms-auto d-flex align-items-center gap-3">
          {/* Notification Bell */}
          <NotificationBell />

          {/* User Dropdown */}
          <Dropdown align="end">
            <Dropdown.Toggle 
              variant="outline-light" 
              className="border-0 bg-transparent text-dark d-flex align-items-center"
            >
              <div className="d-flex align-items-center">
                <div 
                  className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2"
                  style={{ width: '32px', height: '32px' }}
                >
                  <span className="text-white fw-bold small">
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="d-none d-md-block text-start">
                  <div className="fw-semibold small">{username}</div>
                  <div className="text-muted x-small">{userRole}</div>
                </div>
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu className="shadow border-0">
                {/* <div className="fw-bold">{username}</div>
                <small className="text-muted">{userRole}</small> */}
              <Dropdown.Divider />
              {/* <Dropdown.Item onClick={() => navigate('/profile')}>
                <PersonCircle className="me-2" />
                My Profile
              </Dropdown.Item> */}
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout} className="text-danger">
                <BoxArrowRight className="me-2" />
                Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;