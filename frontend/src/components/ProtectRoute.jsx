
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 80 }}>
        <p style={{ color: "#6B7280" }}>Loading...</p>
      </div>
    );
  }

  // If logged in → show the page, if not → send to /login
  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
