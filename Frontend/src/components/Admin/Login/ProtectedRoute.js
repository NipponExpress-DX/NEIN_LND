// ProtectedRoute.js
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = () => {
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
    return userDetails && new Date().getTime() < userDetails.expiresAt;
  };

  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;