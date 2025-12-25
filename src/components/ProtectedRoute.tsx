import { Navigate } from "react-router-dom";
import { useStation } from "../contexts/StationContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { isAuthenticated, userRole } = useStation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        if (userRole === "ADMIN") {
            return <Navigate to="/admin/stations" replace />;
        } else if (userRole === "RIDER") {
            return <Navigate to="/rider/dashboard" replace />;
        } else if (userRole === "CALLER") {
            return <Navigate to="/call-center" replace />;
        } else {
            return <Navigate to="/parcel-intake" replace />;
        }
    }

    return <>{children}</>;
};

