import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Spinner } from 'react-bootstrap';

const ProtectedRoute = ({ children, requiredPermission }) => {
    const { user, loading, hasPermission } = useAuth(); // <-- GET LOADING STATE

    if (loading) {
        // Show a loading spinner while we check for a user session
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        return <Navigate to="/dashboard" />;
    }

    return children;
};

export default ProtectedRoute;