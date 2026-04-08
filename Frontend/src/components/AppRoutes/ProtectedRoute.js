import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Session validation function
  const isSessionValid = () => {
    try {
      const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
      return userDetails && userDetails.expiresAt && Date.now() < userDetails.expiresAt;
    } catch (error) {
      return false;
    }
  };

  // Redirect function
  const redirectToLogin = () => {
    // Clear session data
    sessionStorage.removeItem("userDetails");
    sessionStorage.removeItem("rolePermissions");

    // Determine redirect URL based on environment
    const isDevelopment = process.env.NODE_ENV === 'development';
    const loginUrl = isDevelopment 
      ? 'http://localhost:3000/NEIN-LND/login' 
      : 'https://neinsoft1.nittsu.co.in:8185';

    // Perform redirect
    window.location.href = loginUrl;
  };

  // Check authentication status on component mount
  useEffect(() => {
    if (!isSessionValid()) {
      redirectToLogin();
    }
  }, []);

  // Render children only if session is valid
  return isSessionValid() ? <Outlet /> : null;
};

export default ProtectedRoute;