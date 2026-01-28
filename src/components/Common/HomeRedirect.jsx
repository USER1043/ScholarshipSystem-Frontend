import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ROLES } from '../../utils/roleHelper';

const HomeRedirect = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    switch (user.role) {
        case ROLES.STUDENT:
            return <Navigate to="/student/status" replace />;
        case ROLES.VERIFIER:
            return <Navigate to="/verifier/dashboard" replace />;
        case ROLES.ADMIN:
            return <Navigate to="/admin/dashboard" replace />;
        default:
            return <Navigate to="/login" replace />;
    }
};

export default HomeRedirect;
