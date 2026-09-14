import { Navigate } from "react-router-dom";
import { useAuth } from "../pages/context/AuthContext";

export default function ProtectedRoute({role, children}) {
  const {user, loading} = useAuth();
  if (loading) return <div className="center-screen">Validando sesión...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    const target = {admin:"/admin/dashboard", student:"/student/dashboard", tutor:"/tutor/dashboard"}[user.role];
    return <Navigate to={target || "/login"} replace />;
  }
  return children;
}
