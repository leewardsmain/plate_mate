import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

export default function ProtectedRoute() {
    const { isAuthenticated } = useAppStore();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
