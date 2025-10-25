import React, { useState, useEffect } from 'react';
import { 
  Badge, 
  Dropdown, 
  ListGroup, 
  Modal, 
  Button, 
  Spinner,
  Alert,
  Card
} from 'react-bootstrap';
import { useSocket } from '../Utils/SocketContext';
import { notificationAPI } from '../service/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const { socket, isConnected, notifications: realTimeNotifications } = useSocket();

  useEffect(() => {
    fetchNotifications();
    requestNotificationPermission();
  }, []);

  // Sync real-time notifications with local state
  useEffect(() => {
    if (realTimeNotifications && realTimeNotifications.length > 0) {
      setNotifications(prev => {
        const newNotifications = [...realTimeNotifications];
        const existingIds = new Set(prev.map(n => n._id));
        const uniqueNew = newNotifications.filter(n => !existingIds.has(n._id));
        return [...uniqueNew, ...prev];
      });
      setUnreadCount(prev => prev + realTimeNotifications.length);
    }
  }, [realTimeNotifications]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications({ limit: 10, page: 1 });
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      setError('Failed to load notifications');
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
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

  const handleModalAction = () => {
    if (selectedNotification?.data?.actionUrl) {
      window.location.href = selectedNotification.data.actionUrl;
    }
    setShowModal(false);
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'AUTHORIZATION_REQUEST': return '📨';
      case 'AUTHORIZATION_RESPONSE': return '✅';
      default: return '🔔';
    }
  };

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
          <i className="bi bi-bell-fill"></i>
          {unreadCount > 0 && (
            <Badge 
              bg="danger" 
              pill 
              className="position-absolute top-0 start-100 translate-middle"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {!isConnected && (
            <Badge 
              bg="warning" 
              pill 
              className="position-absolute top-100 start-100 translate-middle"
              title="Disconnected from server"
            >
              !
            </Badge>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu 
          className="w-100" 
          style={{ 
            maxWidth: '400px', 
            maxHeight: '500px',
            overflow: 'hidden'
          }}
        >
          <Dropdown.Header className="d-flex justify-content-between align-items-center">
            <span>Notifications</span>
            <div className="d-flex align-items-center">
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
            <div className="text-center p-3">
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
            <ListGroup 
              variant="flush" 
              className="overflow-auto"
              style={{ maxHeight: '350px' }}
            >
              {notifications.slice(0, 8).map(notification => (
                <ListGroup.Item 
                  key={notification._id}
                  action
                  className={`border-0 border-bottom rounded-0 ${
                    !notification.read ? 'bg-light border-start border-primary border-3' : ''
                  }`}
                  style={{ 
                    padding: '12px 16px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="d-flex align-items-start w-100">
                    <span className="me-2" style={{ fontSize: '1.2rem', marginTop: '2px' }}>
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <strong className={`${!notification.read ? 'fw-bold' : ''}`}>
                          {notification.title}
                        </strong>
                        <Badge 
                          bg={getPriorityColor(notification.priority)} 
                          className="ms-2"
                          style={{ fontSize: '0.6rem' }}
                        >
                          {notification.priority}
                        </Badge>
                      </div>
                      <p className="mb-1 text-secondary" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                        {notification.message}
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {formatTime(notification.createdAt)}
                        </small>
                        {!notification.read && (
                          <Badge bg="primary" pill size="sm">New</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
          
          <Dropdown.Divider />
          <Dropdown.Item 
            className="text-center text-primary"
            onClick={() => {
              window.location.href = '/notifications';
              setShowDropdown(false);
            }}
          >
            <i className="bi bi-list-ul me-1"></i>
            View All Notifications
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {/* Notification Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <span className="me-2">
              {selectedNotification && getNotificationIcon(selectedNotification.type)}
            </span>
            {selectedNotification?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedNotification && (
            <div>
              <Card className="border-0 bg-light">
                <Card.Body>
                  <p className="mb-3">{selectedNotification.message}</p>
                  
                  {selectedNotification.data?.reason && (
                    <div className="mb-3">
                      <strong>Reason:</strong>
                      <p className="text-muted mb-0 mt-1">{selectedNotification.data.reason}</p>
                    </div>
                  )}
                  
                  {selectedNotification.data?.productName && (
                    <div className="mb-3">
                      <strong>Product:</strong>
                      <p className="text-muted mb-0 mt-1">{selectedNotification.data.productName}</p>
                    </div>
                  )}
                  
                  {selectedNotification.data?.childOrganizationName && (
                    <div className="mb-3">
                      <strong>From:</strong>
                      <p className="text-muted mb-0 mt-1">{selectedNotification.data.childOrganizationName}</p>
                    </div>
                  )}
                  
                  {selectedNotification.data?.parentOrganizationName && (
                    <div className="mb-3">
                      <strong>By:</strong>
                      <p className="text-muted mb-0 mt-1">{selectedNotification.data.parentOrganizationName}</p>
                    </div>
                  )}
                  
                  <div className="mt-3 pt-3 border-top">
                    <small className="text-muted">
                      <i className="bi bi-clock me-1"></i>
                      Received: {new Date(selectedNotification.createdAt).toLocaleString()}
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
          {selectedNotification?.data?.actionUrl && (
            <Button variant="primary" onClick={handleModalAction}>
              <i className="bi bi-arrow-right me-1"></i>
              View Details
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default NotificationBell;