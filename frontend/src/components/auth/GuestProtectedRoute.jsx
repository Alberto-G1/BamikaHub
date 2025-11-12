import React from 'react';
import { Navigate } from 'react-router-dom';
import { useGuestAuth } from '../../context/GuestAuthContext.jsx';

const GuestProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useGuestAuth();

    if (!isAuthenticated) {
        return <Navigate to="/guest/magic-link" replace />;
    }

    return children;
};

export default GuestProtectedRoute;
