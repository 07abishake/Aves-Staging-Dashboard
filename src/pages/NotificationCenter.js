import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  ListGroup,
  Badge,
  Button,
  Spinner,
  Alert,
  Nav,
  Form
} from 'react-bootstrap';
import { notificationAPI } from '../service/api';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [filter, page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications({ 
        limit: 20, 
        page,
        filter: filter === 'all' ? undefined : filter
      });
      
      if (response.data.success) {
        if (page === 1) {
          setNotifications(response.data.data);
        } else {
          setNotifications(prev => [...prev, ...response.data.data]);
        }
        
        setHasMore(response.data.data.length === 20);
      }
    } catch (error) {
      setError('Failed to load notifications');
      console.error('Error fetching notifications:', error);
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
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'STOCK_APPROVAL_REQUEST': return '📋';
      case 'STOCK_APPROVAL_RESPONSE': return '✅';
      case 'STOCK_TRANSACTION_COMPLETED': return '📦';
      case 'AUTHORIZATION_REQUEST': return '📨';
      case 'AUTHORIZATION_RESPONSE': return '🔐';
      default: return '🔔';
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h2">Notification Center</h1>
            <Button variant="outline-primary" onClick={markAllAsRead}>
              Mark All as Read
            </Button>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={3} className="mb-4">
          <Card>
            <Card.Header>
              <h6 className="mb-0">Filters</h6>
            </Card.Header>
            <Card.Body>
              <Nav variant="pills" className="flex-column">
                <Nav.Item>
                  <Nav.Link 
                    active={filter === 'all'}
                    onClick={() => {
                      setFilter('all');
                      setPage(1);
                    }}
                  >
                    All Notifications
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={filter === 'unread'}
                    onClick={() => {
                      setFilter('unread');
                      setPage(1);
                    }}
                  >
                    Unread Only
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={filter === 'stock'}
                    onClick={() => {
                      setFilter('stock');
                      setPage(1);
                    }}
                  >
                    Stock Related
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={9}>
          <Card>
            <Card.Body className="p-0">
              {loading && page === 1 ? (
                <div className="text-center p-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Loading notifications...</p>
                </div>
              ) : error ? (
                <Alert variant="warning" className="m-3">
                  {error}
                </Alert>
              ) : notifications.length === 0 ? (
                <div className="text-center p-4 text-muted">
                  <i className="bi bi-bell-slash" style={{ fontSize: '3rem' }}></i>
                  <h5 className="mt-3">No notifications found</h5>
                  <p>You're all caught up with your notifications!</p>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {notifications.map(notification => (
                    <ListGroup.Item 
                      key={notification._id}
                      className={`border-0 ${!notification.read ? 'bg-light' : ''}`}
                    >
                      <div className="d-flex align-items-start">
                        <div className="me-3">
                          <span style={{ fontSize: '1.5rem' }}>
                            {getNotificationIcon(notification.type)}
                          </span>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start">
                            <h6 className={`mb-1 ${!notification.read ? 'fw-bold' : ''}`}>
                              {notification.title}
                            </h6>
                            <div className="d-flex align-items-center gap-2">
                              <small className="text-muted">
                                {formatTime(notification.createdAt)}
                              </small>
                              {!notification.read && (
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => markAsRead(notification._id)}
                                >
                                  Mark Read
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="mb-1 text-muted">
                            {notification.message}
                          </p>
                          {notification.data && (
                            <div className="mt-2">
                              {notification.data.productName && (
                                <Badge bg="secondary" className="me-1">
                                  Product: {notification.data.productName}
                                </Badge>
                              )}
                              {notification.data.quantity && (
                                <Badge bg="info" className="me-1">
                                  Qty: {notification.data.quantity}
                                </Badge>
                              )}
                              {notification.data.approvalLevel && (
                                <Badge bg="warning" className="me-1">
                                  Level: {notification.data.approvalLevel}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}

              {hasMore && (
                <div className="text-center p-3">
                  <Button
                    variant="outline-primary"
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : 'Load More'}
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default NotificationCenter;