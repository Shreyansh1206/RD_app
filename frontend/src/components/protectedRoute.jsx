import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const ProtectedRoute = () => {
    const { user } = useAuth();
    const location = useLocation();

    // If user exists, show the page (Outlet), otherwise redirect to Login
    // SAVE LOCATION: state={{ from: location }}
    return user ? <Outlet /> : <Navigate to="/" state={{ from: location }} replace />;
};

export default ProtectedRoute;