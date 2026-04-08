import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../css/Admincss/Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const EXTERNAL_LOGOUT_URL = "https://neinsoft.nittsu.co.in:8185/NEIN/";


  useEffect(() => {
    if (isSessionValid()) {
      navigate("/admindashboard/dashboardcontent");
    }
    
    return () => {
      const intervalId = sessionStorage.getItem("sessionCheckInterval");
      if (intervalId) {
        clearInterval(parseInt(intervalId));
      }
    };
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!username.trim() || !password.trim()) {
        throw new Error("Username and password are required");
      }
      console.log(`${API_BASE_URL}/login/getAllData`);

      const response = await axios.post(`${API_BASE_URL}/login/getAllData`, {
        
        userid: username.trim(),
        password: password.trim(),
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      console.log("API Response login:", response.data);
      const data = response.data;

      if (response.status === 200 && data.userDetails) {
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
          expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour expiration
        };

        sessionStorage.setItem("userDetails", JSON.stringify(userDetails));
        console.log("Stored UserDetails:", sessionStorage.getItem("userDetails"));

        try {
          await axios.post(`${API_BASE_URL}/login/logAudit`, {
            action: 'LOGIN',
            empId: userDetails.emp_id
          });
        } catch (auditError) {
          console.warn("Audit log failed (non-critical)", auditError);
        }

        await fetchRolePermissions(data.userRole || "");
        setupSessionTimeout(60 * 60 * 1000); // 1 hour
        setupSessionCheckInterval();

        navigate("/admindashboard/dashboard", { state: { username } });
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError(error.response?.data?.message || "Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRolePermissions = async (userRole) => {
    console.log("fetchRolePermissions", userRole);
    try {
      const roleResponse = await axios.post(
        `${API_BASE_URL}/roleRoutes/roleMaster/FunctionalityListforRoleManagement`,
        { userRole }
      );

      console.log("Role Permissions Response:", roleResponse.data);

      if (roleResponse.data && Object.keys(roleResponse.data).length > 0) {
        sessionStorage.setItem("rolePermissions", JSON.stringify(roleResponse.data));
      } else {
        console.log("Received empty role permissions. Storing default empty object.");
        sessionStorage.setItem("rolePermissions", JSON.stringify({}));
      }

      console.log("Stored Role Permissions:", sessionStorage.getItem("rolePermissions"));
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      sessionStorage.setItem("rolePermissions", JSON.stringify({}));
    }
  };

  const isSessionValid = () => {
    try {
      const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
      return userDetails && new Date().getTime() < userDetails.expiresAt;
    } catch {
      return false;
    }
  };

  const clearSession = () => {
    sessionStorage.removeItem("userDetails");
    sessionStorage.removeItem("rolePermissions");
    const intervalId = sessionStorage.getItem("sessionCheckInterval");
    if (intervalId) clearInterval(parseInt(intervalId));
    sessionStorage.removeItem("sessionCheckInterval");
  };

  const setupSessionTimeout = (duration) => {
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
    
    setTimeout(async () => {
      if (userDetails?.emp_id) {
        try {
          await axios.post(`${API_BASE_URL}/login/logAudit`, {
            action: 'SESSION_EXPIRED',
            empId: userDetails.emp_id
          });
        } catch (auditError) {
          console.warn("Audit log failed (non-critical)", auditError);
        }
      }
      clearSession();
window.location.href = `${EXTERNAL_LOGOUT_URL}?sessionExpired=true`;
    }, duration);
  };
  
  const setupSessionCheckInterval = () => {
    let checkCount = 0;
    const maxChecks = 6; // 5 minutes × 6 = 30 minutes
    const checkInterval = 5 * 60 * 1000; // 5 minutes in milliseconds

    const intervalId = setInterval(async () => {
      checkCount++;
      
      if (!isSessionValid() || checkCount >= maxChecks) {
        clearInterval(intervalId);
        sessionStorage.removeItem("sessionCheckInterval");
        
        if (!isSessionValid()) {
          const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
          if (userDetails?.emp_id) {
            try {
              await axios.post(`${API_BASE_URL}/login/logAudit`, {
                action: 'SESSION_EXPIRED',
                empId: userDetails.emp_id
              });
            } catch (auditError) {
              console.warn("Audit log failed (non-critical)", auditError);
            }
          }
          clearSession();
window.location.href = `${EXTERNAL_LOGOUT_URL}?sessionExpired=true`;
        }
      }
    }, checkInterval);

    sessionStorage.setItem("sessionCheckInterval", intervalId.toString());
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="username">UserId:</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your UserId"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? (
              <svg className="spinner" viewBox="0 0 50 50">
                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
              </svg>
            ) : (
              "Login"
            )}
          </button>

        </form>
      </div>
    </div>
  );
};

export default Login;