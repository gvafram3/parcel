import { Navigate } from "react-router-dom";
import { useStation } from "../contexts/StationContext";
import { Loader } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { isAuthenticated, userRole, isLoading } = useStation();

    // Wait for auth check to complete before redirecting
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="w-8 h-8 text-[#ea690c] animate-spin" />
            </div>
        );
    }

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

