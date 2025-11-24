import React from 'react';
import { Navigate } from 'react-router-dom';

const SuperAdminRoute = ({ children }) => {
    const userRole = localStorage.getItem('role');
    
    if (userRole !== 'Super Admin') {
        return <Navigate to="/dashboard" replace />;
    }
    
    return children;
};

export default SuperAdminRoute;