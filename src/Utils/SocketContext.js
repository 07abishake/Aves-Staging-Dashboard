import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping socket connection');
      return;
    }

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    console.log(`🔌 Connecting to Socket.io server: ${API_URL}`);

    const newSocket = io(API_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    newSocket.on('new_notification', (notification) => {
      console.log('📨 New notification received:', notification);
      
      // Add to notifications state
      setNotifications(prev => {
        // Avoid duplicates
        const exists = prev.find(n => n._id === notification._id);
        if (exists) return prev;
        return [notification, ...prev];
      });
      
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/logo.png',
            tag: notification._id
          });
        } catch (error) {
          console.error('Error showing browser notification:', error);
        }
      }
    });

    newSocket.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up socket connection');
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  const value = {
    socket,
    isConnected,
    connectionError,
    notifications,
    setNotifications
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};