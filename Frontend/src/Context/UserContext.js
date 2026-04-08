import React, { createContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userDetails, setUserDetails] = useState({
    isAuthenticated: false,
    emp_id: '',
    empname: '',
    user_email: '',
    user_branch: '',
    user_reporting_br: '',
    department_code: '',
    branch_type_code: '',
    branch_id: '',
    userRole: '',
    department_id: '',
    menus: [],
    GA: false,
    BH: false
  });

  // Initialize from sessionStorage on load
  useEffect(() => {
    const initializeAuth = () => {
      const storedUserDetails = sessionStorage.getItem('userDetails');
      const storedRolePermissions = sessionStorage.getItem('rolePermissions');
      
      if (storedUserDetails) {
        try {
          const parsedDetails = JSON.parse(storedUserDetails);
          const currentTime = Date.now();

          if (parsedDetails.expiresAt && currentTime > parsedDetails.expiresAt) {
            // Session expired
            sessionStorage.removeItem('userDetails');
            sessionStorage.removeItem('rolePermissions');
            return;
          }

          // Merge with role permissions if available
          const userData = {
            ...parsedDetails,
            isAuthenticated: true,
            rolePermissions: storedRolePermissions ? JSON.parse(storedRolePermissions) : {}
          };

          setUserDetails(userData);
        } catch (error) {
          console.error("Error parsing stored user details:", error);
          clearSession();
        }
      }
    };

    initializeAuth();
  }, []);

  // Session timeout handler
  useEffect(() => {
    if (userDetails.isAuthenticated && userDetails.expiresAt) {
      const timeRemaining = userDetails.expiresAt - Date.now();
      
      if (timeRemaining > 0) {
        const timer = setTimeout(() => {
          handleSessionExpiration();
        }, timeRemaining);

        return () => clearTimeout(timer);
      } else {
        handleSessionExpiration();
      }
    }
  }, [userDetails]);

  const handleSessionExpiration = () => {
    if (userDetails.emp_id) {
      // You might want to make an API call to log the session expiration
      console.log('Session expired for user:', userDetails.emp_id);
    }
    clearSession();
    window.location.href = '/login?sessionExpired=true';
  };

  const clearSession = () => {
    sessionStorage.removeItem('userDetails');
    sessionStorage.removeItem('rolePermissions');
    setUserDetails({
      isAuthenticated: false,
      emp_id: '',
      empname: '',
      user_email: '',
      user_branch: '',
      user_reporting_br: '',
      department_code: '',
      branch_type_code: '',
      branch_id: '',
      userRole: '',
      department_id: '',
      menus: [],
      GA: false,
      BH: false
    });
  };

  const login = (details) => {
    const sessionDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    const expiresAt = Date.now() + sessionDuration;
    
    const newDetails = {
      isAuthenticated: true,
      emp_id: details.emp_id || details.empid || '',
      empname: details.empname || details.full_name || '',
      user_email: details.user_email || details.email || '',
      user_branch: details.user_branch || details.branch_code || '',
      user_reporting_br: details.user_reporting_br || details.reporting_branch_lta || '',
      department_code: details.department_code || '',
      branch_type_code: details.branch_type_code || details.branchid || '',
      branch_id: details.branch_id || '',
      userRole: details.userRole || '',
      department_id: details.department_id || '',      
      expiresAt: details.expiresAt || expiresAt
    };

    setUserDetails(newDetails);
    sessionStorage.setItem('userDetails', JSON.stringify(newDetails));
  };

  const logout = () => {
    // You might want to make an API call to log the logout action
    clearSession();
    window.location.href = '/login';
  };
  
  const updateRolePermissions = (permissions) => {
    sessionStorage.setItem('rolePermissions', JSON.stringify(permissions));
    setUserDetails(prev => ({
      ...prev,
      rolePermissions: permissions
    }));
  };

  return (
    <UserContext.Provider value={{ 
      userDetails, 
      login, 
      logout,
      updateRolePermissions
    }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;