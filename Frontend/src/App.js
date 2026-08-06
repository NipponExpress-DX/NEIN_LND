 import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppRoutes from './components/AppRoutes/AppRoutes';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { UserProvider } from '../src/Context/UserContext';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const checkTokenAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);

        // Pinned kiosk-device shortcut lands here via ?mode=kiosk (IIS can't
        // serve a deep /kiosk/start path directly with no rewrite rules
        // available, so we route to it client-side instead once the app
        // has actually loaded via the always-servable root URL).
        if (urlParams.get('mode') === 'kiosk') {
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate("/kiosk/start", { replace: true });
          setIsLoading(false);
          return;
        }

        // Check for token in URL parameters
        const token = urlParams.get('token');
        console.log("Token found in URL:", !!token);

        if (token) {
            // Decode token to get employee ID
            const decodedToken = jwtDecode(token);
            const empid = decodedToken.empid;
            console.log("Employee ID from token:", empid);

            // Fetch user details from backend
            const response = await axios.post(
              `${API_BASE_URL}/login/getAllData01`,
              { userid: empid },
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
              }
            );

            const data = response.data;

            if (response.status === 200 && data.userDetails) {
              // Create user session with corporate login type
              const userDetails = {
                emp_id: data.userDetails.emp_id,
                empname: data.userDetails.full_name,
                user_email: data.userDetails.email,
                user_branch: data.userDetails.branch_code,
                user_reporting_br: data.userDetails.reporting_branch_lta,
                department_code: data.userDetails.department_code,
                branch_type_code: data.userDetails.branch_type_code,
                branch_id: data.userDetails.branch_id,
                userRole: data.userRole,
                department_id: data.userDetails.department_id,
                loginType: "corporate", // NEW: Mark as corporate login for kiosk flow
                expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour expiration
              };

              // Save user details to session
              sessionStorage.setItem("userDetails", JSON.stringify(userDetails));
              console.log("User session created:", userDetails.empname);

              // Log authentication action
              try {
                await axios.post(`${API_BASE_URL}/login/logAudit`, {
                  action: 'LOGIN',
                  empId: userDetails.emp_id
                });
              } catch (auditError) {
                console.warn("Audit log failed (non-critical)", auditError);
              }

              // Fetch role permissions
              await fetchRolePermissions(data.userRole || "");

              // Remove token from URL for security
              window.history.replaceState({}, document.title, window.location.pathname);

              console.log("Redirecting to path selection...");
              // Navigate to path selection instead of dashboard directly
              // User will choose between LND and Kiosk
              navigate("/pathselection");
            }
          }
        } catch (error) {
          console.error("Token authentication failed:", error);
          // Clear session on error
          sessionStorage.removeItem("userDetails");
          sessionStorage.removeItem("rolePermissions");
          // User will see login page
        } finally {
          setIsLoading(false);
        }
      };

      checkTokenAuth();
    }, [API_BASE_URL, navigate]);

    /**
     * Fetch user role permissions from backend
     * Determines what features/pages user can access
     */
    const fetchRolePermissions = async (userRole) => {
      console.log("Fetching permissions for role:", userRole);
      try {
        const roleResponse = await axios.post(
          `${API_BASE_URL}/roleRoutes/roleMaster/FunctionalityListforRoleManagement`,
          { userRole },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          }
        );

        if (roleResponse.data && Object.keys(roleResponse.data).length > 0) {
          sessionStorage.setItem("rolePermissions", JSON.stringify(roleResponse.data));
          console.log("Role permissions loaded successfully");
        } else {
          console.log("No permissions found, setting empty object");
          sessionStorage.setItem("rolePermissions", JSON.stringify({}));
        }
      } catch (error) {
        console.error("Error fetching role permissions:", error);
        // Set empty permissions on error - user can still proceed
        sessionStorage.setItem("rolePermissions", JSON.stringify({}));
      }
    };

    // Show loading screen while authenticating
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Authenticating...</p>
        </div>
      );
    }

  return (
    <UserProvider>
      <KioskAwareWrapper>
        <AppRoutes />
      </KioskAwareWrapper>
    </UserProvider>
  );
}

// Add this small component at the bottom of App.js, outside the App function:
function KioskAwareWrapper({ children }) {
  const location     = useLocation();
  const isKioskRoute = location.pathname.startsWith("/kiosk") || location.pathname.startsWith("/ehs");

  return (
    <div className={isKioskRoute ? "kiosk-mode" : "portal-mode"}>
      {children}
    </div>
  );
}

  export default App;
