import React, { useState, useEffect } from 'react';
import { 
  Badge, 
  Dropdown, 
  ListGroup, 
  Modal, 
  Button, 
  Spinner,
  Alert,
  Card,
  Nav
} from 'react-bootstrap';
import { notificationAPI } from '../service/api';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    setupSocketListeners();
  }, []);

  const setupSocketListeners = () => {
    // Listen for real-time notifications
    if (window.socket) {
      window.socket.on('new_notification', (notification) => {
        console.log('📨 New real-time notification received:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico'
          });
        }
      });

      window.socket.on('notification_count_update', (data) => {
        console.log('🔔 Notification count update:', data);
        setUnreadCount(data.unreadCount);
      });
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications({ limit: 10, page: 1 });
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.unreadCount);
        console.log('📋 Notifications loaded:', response.data.data.length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    setSelectedNotification(notification);
    setShowModal(true);
    setShowDropdown(false);
  };

  const handleQuickAction = (notification) => {
    markAsRead(notification._id);
    
    switch (notification.type) {
      case 'PRODUCT_REQUEST':
        navigate('/products/requests');
        break;
      case 'AUTHORIZATION_REQUEST':
        navigate('/authorization-requests');
        break;
      default:
        setSelectedNotification(notification);
        setShowModal(true);
    }
    setShowDropdown(false);
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'PRODUCT_REQUEST': return '📦';
      case 'PRODUCT_REQUEST_RESPONSE': return '✅';
      case 'AUTHORIZATION_REQUEST': return '🔐';
      case 'AUTHORIZATION_RESPONSE': return '📨';
      case 'STOCK_APPROVAL_REQUEST': return '📋';
      case 'STOCK_APPROVAL_RESPONSE': return '⚡';
      default: return '🔔';
    }
  };

  const getNotificationVariant = (type) => {
    switch (type) {
      case 'PRODUCT_REQUEST': return 'warning';
      case 'PRODUCT_REQUEST_RESPONSE': return 'success';
      case 'AUTHORIZATION_REQUEST': return 'primary';
      case 'AUTHORIZATION_RESPONSE': return 'info';
      default: return 'secondary';
    }
  };

  const NotificationItem = ({ notification }) => (
    <ListGroup.Item 
      action
      className={`border-0 border-bottom rounded-0 ${
        !notification.read ? 'bg-light border-start border-primary border-3' : ''
      }`}
      style={{ 
        padding: '12px 16px',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      onClick={() => handleQuickAction(notification)}
    >
      <div className="d-flex align-items-start w-100">
        <div className={`bg-${getNotificationVariant(notification.type)} rounded p-2 me-3`}>
          <span style={{ fontSize: '1.2rem' }}>
            {getNotificationIcon(notification.type)}
          </span>
        </div>
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-start mb-1">
            <strong className={`${!notification.read ? 'fw-bold' : ''}`}>
              {notification.title}
            </strong>
            <div className="d-flex align-items-center gap-1">
              <Badge 
                bg={notification.priority === 'high' ? 'danger' : 'secondary'} 
                style={{ fontSize: '0.6rem' }}
              >
                {notification.priority}
              </Badge>
              {!notification.read && (
                <Badge bg="primary" pill style={{ fontSize: '0.6rem' }}>New</Badge>
              )}
            </div>
          </div>
          <p className="mb-1 text-secondary" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
            {notification.message}
          </p>
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              {formatTime(notification.createdAt)}
            </small>
            {notification.data?.quantity && (
              <Badge bg="outline-secondary" text="dark">
                Qty: {notification.data.quantity}
              </Badge>
            )}
          </div>
          
          {/* Quick Actions for Product Requests */}
          {notification.type === 'PRODUCT_REQUEST' && (
            <div className="mt-2 d-flex gap-1">
              <Button 
                size="sm" 
                variant="outline-success"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle quick approve
                  console.log('Quick approve product request:', notification._id);
                }}
              >
                Approve
              </Button>
              <Button 
                size="sm" 
                variant="outline-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle quick reject
                  console.log('Quick reject product request:', notification._id);
                }}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    </ListGroup.Item>
  );

  return (
    <>
      <Dropdown 
        show={showDropdown} 
        onToggle={setShowDropdown}
        align="end"
      >
        <Dropdown.Toggle 
          variant="outline-light" 
          className="position-relative border-0 bg-transparent p-2 rounded-circle"
          style={{ 
            boxShadow: 'none !important',
            transition: 'all 0.3s ease'
          }}
          id="notification-dropdown"
        >
          <i className="bi bi-bell-fill" style={{ fontSize: '1.2rem' }}></i>
          {unreadCount > 0 && (
            <Badge 
              bg="danger" 
              pill 
              className="position-absolute top-0 start-100 translate-middle"
              style={{ fontSize: '0.7rem' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu 
          className="w-100" 
          style={{ 
            maxWidth: '450px', 
            maxHeight: '600px',
            overflow: 'hidden'
          }}
        >
          <Dropdown.Header className="d-flex justify-content-between align-items-center bg-light">
            <span className="fw-bold">Notifications</span>
            <div className="d-flex align-items-center gap-2">
              {unreadCount > 0 && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 text-primary text-decoration-none"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </Button>
              )}
              <Badge bg="secondary" className="ms-2">
                {unreadCount} unread
              </Badge>
            </div>
          </Dropdown.Header>
          
          <Dropdown.Divider />

          {loading ? (
            <div className="text-center p-4">
              <Spinner animation="border" size="sm" variant="primary" />
              <span className="ms-2 text-muted">Loading notifications...</span>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-2 mb-0">
              <small>{error}</small>
            </Alert>
          ) : notifications.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <i className="bi bi-bell-slash" style={{ fontSize: '2rem' }}></i>
              <p className="mt-2 mb-0">No notifications</p>
              <small>Notifications will appear here</small>
            </div>
          ) : (
            <>
              <Nav variant="pills" className="px-3 pt-2" defaultActiveKey="all">
                <Nav.Item>
                  <Nav.Link eventKey="all" className="py-1 px-2">All</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="unread" className="py-1 px-2">
                    Unread <Badge bg="primary" className="ms-1">{unreadCount}</Badge>
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <ListGroup 
                variant="flush" 
                className="overflow-auto"
                style={{ maxHeight: '400px' }}
              >
                {notifications.slice(0, 8).map(notification => (
                  <NotificationItem 
                    key={notification._id} 
                    notification={notification} 
                  />
                ))}
              </ListGroup>
            </>
          )}
          
          <Dropdown.Divider />
          <Dropdown.Item 
            className="text-center text-primary fw-bold"
            onClick={() => {
              navigate('/notifications');
              setShowDropdown(false);
            }}
          >
            <i className="bi bi-list-ul me-2"></i>
            View All Notifications
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {/* Notification Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="d-flex align-items-center">
            <div className={`bg-${getNotificationVariant(selectedNotification?.type)} rounded p-2 me-3`}>
              <span style={{ fontSize: '1.5rem' }}>
                {selectedNotification && getNotificationIcon(selectedNotification.type)}
              </span>
            </div>
            <div>
              <div>{selectedNotification?.title}</div>
              <small className="text-muted">
                {selectedNotification && formatTime(selectedNotification.createdAt)}
              </small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedNotification && (
            <div>
              <Card className="border-0">
                <Card.Body>
                  <p className="mb-3 fs-6">{selectedNotification.body || selectedNotification.message}</p>
                  
                  {/* Notification Details */}
                  {selectedNotification.data && (
                    <div className="row">
                      {selectedNotification.data.productName && (
                        <div className="col-md-6 mb-2">
                          <strong>Product:</strong>
                          <p className="text-muted mb-0 mt-1">{selectedNotification.data.productName}</p>
                        </div>
                      )}
                      {selectedNotification.data.quantity && (
                        <div className="col-md-6 mb-2">
                          <strong>Quantity:</strong>
                          <p className="text-muted mb-0 mt-1">{selectedNotification.data.quantity} units</p>
                        </div>
                      )}
                      {selectedNotification.data.requestingOrganizationName && (
                        <div className="col-12 mb-2">
                          <strong>Requested By:</strong>
                          <p className="text-muted mb-0 mt-1">{selectedNotification.data.requestingOrganizationName}</p>
                        </div>
                      )}
                      {selectedNotification.data.reason && (
                        <div className="col-12 mb-2">
                          <strong>Reason:</strong>
                          <p className="text-muted mb-0 mt-1">{selectedNotification.data.reason}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-4 pt-3 border-top">
                    <small className="text-muted">
                      <i className="bi bi-clock me-1"></i>
                      Received: {selectedNotification && new Date(selectedNotification.createdAt).toLocaleString()}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          {selectedNotification?.type === 'PRODUCT_REQUEST' && (
            <div className="d-flex gap-2">
              <Button 
                variant="success"
                onClick={() => {
                  navigate('/products/requests');
                  setShowModal(false);
                }}
              >
                View Request
              </Button>
            </div>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default NotificationBell;