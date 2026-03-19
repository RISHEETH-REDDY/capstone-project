import React from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';

const RequireAuth = () => {
    const location = useLocation();
    const token = localStorage.getItem('token'); // Simple token check

    return (
        token
            ? <Outlet />
            : <Navigate to="/login" state={{ from: location }} replace />
    );
}

export default RequireAuth;
