import React, { useState, useEffect } from 'react';
import AppRoutes from './components/AppRoutes/AppRoutes';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { UserProvider } from '../src/Context/UserContext';

import { useNavigate } from 'react-router-dom';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const checkTokenAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      console.log("token===>", token);

      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          const empid = decodedToken.empid;
          console.log("empid===>", empid);


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
              expiresAt: Date.now() + (60 * 60 * 1000)
            };

            sessionStorage.setItem("userDetails", JSON.stringify(userDetails));
            
            try {
              await axios.post(`${API_BASE_URL}/login/logAudit`, {
                action: 'LOGIN',
                empId: userDetails.emp_id
              });
            } catch (auditError) {
              console.warn("Audit log failed (non-critical)", auditError);
            }
            
            await fetchRolePermissions(data.userRole || "");
            
            // Remove token from URL
            //window.history.replaceState({}, document.title, window.location.pathname);

            // window.location.href = "/NEIN-LND/admindashboard/dashboard";


            navigate("/admindashboard/dashboard");
          }
        } catch (error) {
          console.error("Token authentication failed:", error);
          sessionStorage.removeItem("userDetails");
          sessionStorage.removeItem("rolePermissions");
        }
      }
      setIsLoading(false);
    };

    checkTokenAuth();
  }, [API_BASE_URL, navigate]);

  const fetchRolePermissions = async (userRole) => {
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
      } else {
        sessionStorage.setItem("rolePermissions", JSON.stringify({}));
      }
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      sessionStorage.setItem("rolePermissions", JSON.stringify({}));
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  );
}

export default App;