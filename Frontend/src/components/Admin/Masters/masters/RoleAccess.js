import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Typography,
  CircularProgress ,
  IconButton,
  TextField,
  Table,
  TableBody,
  TablePagination,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  List,
  ListItem,
  ListItemText,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  Slide,
  Snackbar,
  Alert,
  Box,
  Switch ,
} from '@mui/material';
import { exportData } from './exportUtils';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DoubleArrowIcon from '@mui/icons-material/DoubleArrow'; // Replaces ChevronDoubleRight
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'; // Replaces ChevronDoubleLeft
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PlusCircleIcon, DownloadIcon, FileTextIcon,Trash2Icon ,Edit2 as EditIcon,} from 'lucide-react';


function RoleAccess() {

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [userRoles, setUserRoles] = useState([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [searchAvailable, setSearchAvailable] = useState('');
  const [searchSelected, setSearchSelected] = useState('');
  const [empId, setEmpId] = useState('');  
  const [empName, setEmpName] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [successMessageContent, setSuccessMessageContent] = useState('');
    const [successMessageOpen, setSuccessMessageOpen] = useState(false);
    //const [selectedRole, setSelectedRole] = useState(null); // Track selected role for editing
    const [employees, setEmployees] = useState([]); // Store all employees
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
      open: false,
      message: '',
      severity: '', // Can be 'success', 'error', 'info', or 'warning'
    });
    
  const [newRole, setNewRole] = useState({
    empId: '',
    empAssignedRole: '',
    createdBy: '',
  });

  const rolePermissions = JSON.parse(sessionStorage.getItem("rolePermissions")) || {};
  const mastersPermissions = rolePermissions["Masters"] || {};
  const Permissions = mastersPermissions["Users"] || {};
    const canEdit = Permissions["View/Create/Edit"] === 1;

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
const [roleToDelete, setRoleToDelete] = useState(null);


  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/roleRoutes/roleMaster/activeListUserRole`, {
          method: "POST", // Change to POST method
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}), 
        });
  
        if (!response.ok) {
          throw new Error("Failed to fetch roles");
        }
  
        const data = await response.json();
        // Process user roles to show "Multiple Roles" properly
    
        const processedRoles = data.result.map(user => ({
          ...user,
          empAssignedRole: user.empAssignedRole || "", // Ensure this field exists
          empAssignedRoleNames: user.empAssignedRoleNames 
            ? (user.empAssignedRoleNames.includes(',') ? "Multiple Roles" : user.empAssignedRoleNames)
            : "No Role Assigned",
          roleTooltip: user.empAssignedRoleNames || "No Role Assigned"
        }));  
    
        console.log("Processed User Roles fetchRoles:", processedRoles);
    
        setUserRoles(processedRoles);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };
  
    fetchRoles();
  }, []);

  const fetchUserAssignedRoles = async (empId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/roleRoutes/roleMaster/activeListUserRoleToEMPOnly`,
        { empId }
      );
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        // Extract role names from the response and split them
        const roleNames = response.data.data[0].empAssignedRoleNames;
        return roleNames ? roleNames.split(',') : [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching user roles:", error);
      return [];
    }
  };
  
  // Fetch roles when the add dialog opens
  useEffect(() => {
    if (openAddDialog) {
      fetchRoles();
    }
  }, [openAddDialog]);

  // Fetch employee list when dialog opens
  useEffect(() => {
    if (openAddDialog) {
      fetchEmployeeList();
    }
  }, [openAddDialog]);
 


  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredRoles = userRoles.filter((userRole) => {
    const searchLower = searchText.toLowerCase();
    return (
      userRole.empId.toString().includes(searchLower) ||
      userRole.empName?.toLowerCase().includes(searchLower) ||
      userRole.empAssignedRoleNames?.toLowerCase().includes(searchLower) ||
      userRole.createdByName?.toLowerCase().includes(searchLower)
    );
  });

  // Function to fetch all employees (runs once when dialog opens)
  const fetchEmployeeList = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/login/activeEmplList`);
      if (response.data && response.data.employees) {
        setEmployees(response.data.employees);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching employee list:", error);
      setEmployees([]);
    }
    setLoading(false);
  };

  // Handle Employee ID Change and find corresponding employee name
  const handleEmpIdChange = (e) => {
    const id = e.target.value;
    setEmpId(id);

    // Find employee name based on ID
    const employee = employees.find((emp) => emp.emp_id === id);
    setEmpName(employee ? employee.full_name : "");
  };


   // Fetch available roles from the API
   const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/roleRoutes/roleMaster/Rolelist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
  
      if (!response.ok) throw new Error(`Error: ${response.status}`);
  
      const result = await response.json();
      if (result && result.results) {
        return result.results.map(role => ({
          role_id: role.role_id,
          roleName: role.roleName.trim() // Ensure consistent trimming
        }));
      }
      throw new Error('Unexpected API response structure');
    } catch (error) {
      console.error('Error fetching roles:', error.message);
      return [];
    }
  };

   // Move role to selected
   const moveToSelected = (role) => {
    setAvailableRoles(availableRoles.filter((r) => r.role_id !== role.role_id));
    setSelectedRoles([...selectedRoles, role]);
  };

  // Move role back to available
  const moveToAvailable = (role) => {
    setSelectedRoles(selectedRoles.filter((r) => r.role_id !== role.role_id));
    setAvailableRoles([...availableRoles, role]);
  };

  // Move all roles from available -> selected
  const moveAllToSelected = () => {
    setSelectedRoles([...selectedRoles, ...availableRoles]);
    setAvailableRoles([]);
  };

  // Move all roles from selected -> available
  const moveAllToAvailable = () => {
    setAvailableRoles([...availableRoles, ...selectedRoles]);
    setSelectedRoles([]);
  };
  
  const fetchUserRoles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/roleRoutes/roleMaster/activeListUserRole`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log("Fetched User Roles:", result);
  
      if (!result.data || !Array.isArray(result.data)) {
        console.error("Invalid API Response: expected an array in result.data");
        return;
      }
  
    
      const processedRoles = result.data.map(user => ({
        ...user,
        empAssignedRoleNames: user.empAssignedRoleNames
          ? (user.empAssignedRoleNames.includes(',') ? "Multiple Roles" : user.empAssignedRoleNames)
          : "No Role Assigned",
        roleTooltip: user.empAssignedRoleNames || "No Role Assigned"
      }));
  
      console.log("Processed User Roles:", processedRoles);
  
      setUserRoles(processedRoles);
    } catch (error) {
      console.error('Error fetching user roles:', error);
    }
  };
  
  useEffect(() => {
    fetchUserRoles();
  }, []);
  
  

  // Handle role assignment submission

  const handleSubmitUserRole = async (event) => {
    event.preventDefault();
  
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
    if (!userDetails.emp_id || !userDetails.empname) {
      throw new Error("User is not logged in. Please log in to proceed.");
    }
  
    if (!empId || selectedRoles.length === 0) {
      setSnackbar({
        open: true,
        message: "Please enter Employee ID and select at least one role.",
        severity: "error",
      });
      return;
    }
  
    const assignedRoleIds = selectedRoles.map((role) => role.role_id).join(",");
    const apiUrl = isEditMode
      ? `${API_BASE_URL}/roleRoutes/roleMaster/updateUserRole`
      : `${API_BASE_URL}/roleRoutes/roleMaster/addUserRole`;
    const actionType = isEditMode ? "ROLE_UPDATE_ATTEMPT" : "ROLE_ASSIGN_ATTEMPT";
  
    try {
      // Audit log for attempt
      try {
        await axios.post(`${API_BASE_URL}/login/logAudit`, {
          action: actionType,
          empId: userDetails.emp_id,
          details: `${isEditMode ? "Updating" : "Assigning"} role(s) for empId: ${empId}, roles: ${assignedRoleIds}`,
        });
      } catch (auditError) {
        console.warn("Audit log failed (non-critical)", auditError);
      }
  
      const payload = {
        empId,
        empAssignedRole: assignedRoleIds,
        createdBy: userDetails.emp_id,
      };
  
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to ${isEditMode ? "update" : "add"} role. Status: ${response.status}`);
      }
  
      const data = await response.json();
  
      // Audit log for success
      try {
        await axios.post(`${API_BASE_URL}/login/logAudit`, {
          action: isEditMode ? "ROLE_UPDATED - User Access" : "ROLE_ASSIGNED - User Access",
          empId: userDetails.emp_id,
          details: `${isEditMode ? "Updated" : "Assigned"} role(s) for empId: ${empId}, roles: ${assignedRoleIds}`,
        });
      } catch (auditError) {
        console.warn("Audit log failed (non-critical)", auditError);
      }
  
      // Update userRoles state
      setUserRoles((prevRoles) => {
        if (isEditMode) {
          return prevRoles.map((role) =>
            role.empId === empId
              ? {
                  ...role,
                  empAssignedRoleNames:
                    selectedRoles.length > 1 ? "Multiple Roles" : selectedRoles[0]?.roleName || "No Role Assigned",
                  roleTooltip: selectedRoles.map((role) => role.roleName).join(", "),
                }
              : role
          );
        } else {
          return [
            ...prevRoles,
            {
              empId,
              empName,
              empAssignedRoleNames:
                selectedRoles.length > 1 ? "Multiple Roles" : selectedRoles[0]?.roleName || "No Role Assigned",
              roleTooltip: selectedRoles.map((role) => role.roleName).join(", "),
              createdBy: userDetails.emp_id,
              createdByName: userDetails.empname,
            },
          ];
        }
      });
  
      await fetchUserRoles();
  
      setOpenAddDialog(false);
      setSnackbar({
        open: true,
        message: `User Role ${isEditMode ? "Updated" : "Added"} Successfully!`,
        severity: "success",
      });
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "adding"} role:`, error);
  
      // Audit log for failure
      try {
        await axios.post(`${API_BASE_URL}/login/logAudit`, {
          action: isEditMode ? "ROLE_UPDATE_FAILED" : "ROLE_ASSIGN_FAILED",
          empId: userDetails.emp_id,
          details: `Failed to ${isEditMode ? "update" : "assign"} role(s) for empId: ${empId}, roles: ${assignedRoleIds}`,
          error: error.message,
        });
      } catch (auditError) {
        console.warn("Audit log failed (non-critical)", auditError);
      }
  
      setSnackbar({
        open: true,
        message: `Error ${isEditMode ? "updating" : "adding"} role. Please try again later.`,
        severity: "error",
      });
    }
  };

  // Handle deleting a role
  const handleDeleteRole = async (empId) => {
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
    if (!userDetails.emp_id || !userDetails.empname) {
      throw new Error("User is not logged in. Please log in to proceed.");
    }
  
    try {
      // Audit log for delete attempt
      try {
        await axios.post(`${API_BASE_URL}/login/logAudit`, {
          action: "ROLE_DELETE_ATTEMPT",
          empId: userDetails.emp_id,
          details: `Attempting to delete role for empId: ${empId}`,
        });
      } catch (auditError) {
        console.warn("Audit log failed (non-critical)", auditError);
      }
  
      const response = await fetch(`${API_BASE_URL}/roleRoutes/roleMaster/deletUsereRole`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empId,
          createdBy: userDetails.emp_id,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to delete role. Status: ${response.status}`);
      }
  
      // Audit log for successful deletion
      try {
        await axios.post(`${API_BASE_URL}/login/logAudit`, {
          action: "ROLE_DELETED",
          empId: userDetails.emp_id,
          details: `Deleted role for empId: ${empId}`,
        });
      } catch (auditError) {
        console.warn("Audit log failed (non-critical)", auditError);
      }
  
      // Update local state
      setUserRoles((prevRoles) => prevRoles.filter((role) => role.empId !== empId));
      fetchUserRoles();
  
      // Show success snackbar
      setSnackbar({
        open: true,
        message: "Role deleted successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting role:", error);
  
      // Audit log for failed deletion
      try {
        await axios.post(`${API_BASE_URL}/login/logAudit`, {
          action: "ROLE_DELETE_FAILED",
          empId: userDetails.emp_id,
          details: `Failed to delete role for empId: ${empId}`,
          error: error.message,
        });
      } catch (auditError) {
        console.warn("Audit log failed (non-critical)", auditError);
      }
  
      // Show error snackbar
      setSnackbar({
        open: true,
        message: "Error deleting role. Please try again later.",
        severity: "error",
      });
    }
  };
  // Original delete function - rename to handleConfirmDelete
const handleConfirmDelete = async () => {
  if (!roleToDelete) return;

  const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
  if (!userDetails.emp_id || !userDetails.empname) {
    throw new Error("User is not logged in. Please log in to proceed.");
  }

  try {
    // Audit log for delete attempt
    try {
      await axios.post(`${API_BASE_URL}/login/logAudit`, {
        action: "ROLE_DELETE_ATTEMPT  - User Access",
        empId: userDetails.emp_id,
        details: `Attempting to delete role for empId: ${roleToDelete}`,
      });
    } catch (auditError) {
      console.warn("Audit log failed (non-critical)", auditError);
    }

    const response = await fetch(`${API_BASE_URL}/roleRoutes/roleMaster/deletUsereRole`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        empId: roleToDelete,
        createdBy: userDetails.emp_id,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete role. Status: ${response.status}`);
    }

    // Audit log for successful deletion
    try {
      await axios.post(`${API_BASE_URL}/login/logAudit`, {
        action: "ROLE_DELETED  - User Access",
        empId: userDetails.emp_id,
        details: `Deleted role for empId: ${roleToDelete}`,
      });
    } catch (auditError) {
      console.warn("Audit log failed (non-critical)", auditError);
    }

    // Update local state
    setUserRoles((prevRoles) => prevRoles.filter((role) => role.empId !== roleToDelete));
    fetchUserRoles();

    // Show success snackbar
    setSnackbar({
      open: true,
      message: "Role deleted successfully!",
      severity: "success",
    });
  } catch (error) {
    console.error("Error deleting role:", error);

    // Audit log for failed deletion
    try {
      await axios.post(`${API_BASE_URL}/login/logAudit`, {
        action: "ROLE_DELETE_FAILED",
        empId: userDetails.emp_id,
        details: `Failed to delete role for empId: ${roleToDelete}`,
        error: error.message,
      });
    } catch (auditError) {
      console.warn("Audit log failed (non-critical)", auditError);
    }

    // Show error snackbar
    setSnackbar({
      open: true,
      message: "Error deleting role. Please try again later.",
      severity: "error",
    });
  } finally {
    setDeleteConfirmOpen(false);
    setRoleToDelete(null);
  }
};

// New function to open confirmation dialog
const handleDeleteClick = (empId) => {
  setRoleToDelete(empId);
  setDeleteConfirmOpen(true);
};

   // **Handle Toggle Active**
   const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
    if (!userDetails.emp_id || !userDetails.empname) {
      throw new Error("User is not logged in. Please log in to proceed.");
    }

   const handleToggleActive = async (role, updatedStatus) => {
    console.log("Checked:", updatedStatus); // Debug the value
    console.log("Role Before Update:", role);
    
    try {
      const response = await fetch(`${API_BASE_URL}/roleRoutes/roleMaster/activeStatusUserRole`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          createdBy: userDetails.emp_id|| "",
          empId: role.empId || "",
          activeStatus: updatedStatus,
        }),
      });
  
      if (response.ok) {
        console.log("Role status updated to:", updatedStatus);
        fetchUserRoles(); 
      } else {
        console.error("Failed to update role status");
      }
    } catch (error) {
      console.error("Error during toggle:", error);
    }
  };
  
  
  
  // Handle Input Change

  const handleCloseSnackbar = () => {
    setSuccessMessageOpen(false);
  };
  
  

  const handleBackClick = () => {
    navigate('/admindashboard/setup');
  };

  const handleAddUserRole = async (role = null) => {
    try {
      setLoading(true);
      setOpenAddDialog(false); // Close dialog temporarily while loading
      
      // Fetch fresh roles data first
      const allRoles = await fetchRoles();
      
      if (role) {
        setIsEditMode(true);
        setEmpId(role.empId);
        setEmpName(role.empName);
  
        // Fetch user's assigned role names
        const assignedRoleNames = await fetchUserAssignedRoles(role.empId);
        
        // Match role names with available roles
        const selected = allRoles.filter(r => 
          assignedRoleNames.includes(r.roleName.trim())
        );
        
        const available = allRoles.filter(r => 
          !assignedRoleNames.includes(r.roleName.trim())
        );
  
        setSelectedRoles(selected);
        setAvailableRoles(available);
      } else {
        setIsEditMode(false);
        setEmpId("");
        setEmpName("");
        setSelectedRoles([]);
        setAvailableRoles(allRoles);
      }
    } catch (error) {
      console.error("Error setting up edit mode:", error);
      setSnackbar({
        open: true,
        message: 'Failed to load role data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setOpenAddDialog(true); // Reopen dialog with loaded data
    }
  };
  

  


  return (
    <div className="admin-dashboard-content">
      <div className="main-content">
       <Box sx={{ p: 0, backgroundColor: 'white', minHeight: '100vh' }}>
        <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center" 
              mb={3} 
              sx={{
                backgroundColor: "#1A005D",
                padding: "12px 24px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
              }}
            >
              <IconButton 
                color="#1A005D" 
                className="back-button" 
                onClick={handleBackClick}
                sx={{
                  backgroundColor: "white",
                  '&:hover': { backgroundColor: "#cbd5e1" },
                  borderRadius: "8px",
                  padding: "6px"
                }}
              >
                <ArrowBackIcon />
              </IconButton>

              <Typography 
                variant="h5" 
                fontWeight="bold" 
                color="white"
                sx={{ fontSize: "20px", letterSpacing: "0.5px" }}
              >
                User Role
              </Typography>

              <Tooltip title="Add Role">
              {canEdit && (
                <Button
                  startIcon={<PlusCircleIcon />}
                  onClick={() => handleAddUserRole(null)} 
                  sx={{
                    color: "#1A005D",
                          backgroundColor: "#8EC400",
                          textTransform: "none",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          '&:hover': { backgroundColor: "#1A005D",color: "#8EC400" },
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  Assign  Role 
                </Button>
                )}
              </Tooltip>
            </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" gap={2}>
            <Box display="flex" gap={2}>
              <Tooltip title="Export to Excel">
                <Button onClick={() => exportData(userRoles, 'User_Roles_List', 'excel')}  sx={{ 
                    color: '#fff', 
                    backgroundColor: '#0ea5e9', 
                    borderRadius: '50%', 
                    minWidth: 40, 
                    height: 40, 
                    '&:hover': { backgroundColor: '#0284c7' }, 
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' 
                  }}>
                  <DownloadIcon />
                </Button>
              </Tooltip>
            </Box>

            </Box>
            <TextField
              variant="outlined"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="small"
              sx={{ width: '30%' }}
            />
          </Box>

          {/* Table to Display User Roles */}
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Table sx={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}> 
              <TableHead>
                <TableRow sx={{ backgroundColor: '#e2e8f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', padding: '4px',width: '100px' , fontSize: '1.02rem' }}>SL No.</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', padding: '4px', minWidth: 100, fontSize: '1.02rem'  }}>Emp-Id</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', padding: '4px', minWidth: 150 , fontSize: '1.02rem' }}>Emp-Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', padding: '4px', minWidth: 100, fontSize: '1.02rem'  }}>Emp-Role</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', padding: '4px', minWidth: 100, fontSize: '1.02rem'  }}>Created By</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', padding: '4px', minWidth: 100, fontSize: '1.02rem'  }}>Created On</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', padding: '4px', textAlign: 'center', minWidth: 80, fontSize: '1.02rem'  }}>Actions</TableCell>
                  
                </TableRow>
              </TableHead>
              <TableBody>
              {filteredRoles
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((role, index) => (
                <TableRow key={role.ra_id} hover sx={{ '& td': { padding: '4px', fontSize: '1.00rem' } }}>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell> {/* Correct index */}
                  <TableCell>{role.empId}</TableCell>
                  <TableCell>{role.empName}</TableCell>
                  <TableCell>
                    <Tooltip title={role.roleTooltip || role.empAssignedRoleNames} arrow>
                      <span>{role.empAssignedRoleNames}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{role.createdByName}</TableCell>
                  <TableCell>
                      {new Date(role.createdOn).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                    })
                    }
                    </TableCell>
                      <TableCell align="center">
                      {canEdit && (
                        <>
                         {/* Edit Icon */}
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleAddUserRole(role)} sx={{ color: '#3b82f6', marginRight: '5px' }}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                        <IconButton onClick={() => handleDeleteClick(role.empId)} sx={{ color: '#ef4444' }}>
                          <Trash2Icon />
                        </IconButton>
                      </Tooltip>
                         {/* Toggle Active Switch */}
                         <Tooltip title={role.activeStatus === 1 ? "Deactivate" : "Activate"}>
                         <Switch
                              checked={role.activeStatus === 0} // Ensure this is accurate
                              onChange={() => handleToggleActive(role, role.activeStatus === 1 ? 0 : 1)}
                              color={role.activeStatus === 0 ? "success" : "error"} // Adjusted logic: Green for "0", Red for "1"
                            />
                      </Tooltip>
                      </>
                      )}

                      </TableCell>
                    </TableRow>
                  ))               
                }
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredRoles.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
          />


          {/* Add Role Dialog */}
          
          <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: "bold", padding: 2 }}>
              {isEditMode ? "Edit Assigned Role" : "Assign User Role"}
            </DialogTitle>


      <DialogContent>
        {loading ? ( // Show loader while fetching data
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress />
          </Box>
        ) : (
          <Box display="flex" gap={2} mb={2} padding={"5px"}>
            {/* Employee ID Field */}
            <TextField
              label="Employee ID *"
              variant="outlined"
              fullWidth
              value={empId}
              onChange={handleEmpIdChange}
              InputProps={{
                style: { height: "45px", padding: "0 14px" },
              }}
              InputLabelProps={{
                sx: {
                  color: "#1A005D",
                  "&.Mui-focused": { color: "#8EC400" },
                  lineHeight: "32px",
                },
              }}
              sx={{ borderRadius: "10px" }}
            />

            {/* Employee Name  */}
            <TextField
              label="Employee Name"
              variant="outlined"
              fullWidth
              value={empName}
              InputProps={{
                readOnly: true,
                style: { height: "45px", padding: "0 14px" },
              }}
              InputLabelProps={{
                shrink: true, 
                sx: {
                  color: "#1A005D",
                  "&.Mui-focused": { color: "#8EC400" },
                  lineHeight: "32px",
                },
              }}
              sx={{ borderRadius: "10px" }}
            />
          </Box>
        )}


                      <Box display="flex" justifyContent="space-between"
                      >
                        {/* Available Roles Section */}
                        <Box sx={{
                              border: '1px solid #ddd', 
                              borderRadius: 2, 
                              padding: 2, 
                            }} flex={1} mr={2}>
                          <Typography sx={{ fontWeight: 'bold' }}variant="subtitle1" gutterBottom>
                            Available Roles
                          </Typography>
                          <TextField
                            label="Search Role"
                            variant="outlined"
                            fullWidth
                            size="small"
                            value={searchAvailable}
                            InputProps={{
                              style: {
                                height: "45px", // Sets the height of the input field
                                padding: "0 14px", // Ensures the padding doesn't overlap with the label
                              },
                            }}
                            InputLabelProps={{                              
                              sx: {
                                color: "#1A005D",
                                "&.Mui-focused": { color: "#8EC400" },
                                lineHeight: "32px",
                              },
                            }}
                            sx={{ borderRadius: "10px" }}
                            onChange={(e) => setSearchAvailable(e.target.value)}
                          />
                          <List
                            sx={{
                              maxHeight: 250,
                              overflow: 'auto',
                              border: '1px solid #ddd',
                              borderRadius: 1,
                              mt: 1,
                            }}
                          >
                            {availableRoles
                              .filter((role) => role.roleName.toLowerCase().includes(searchAvailable.toLowerCase()))
                              .map((role) => (
                                <ListItem key={role.role_id} button onClick={() => moveToSelected(role)}>
                                  <ListItemText primary={role.roleName} />
                                </ListItem>
                              ))}
                          </List>
                        </Box>

                        {/* Move Buttons */}
                        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" mx={2}>
                          <IconButton onClick={moveAllToSelected}>
                            <DoubleArrowIcon sx={{ color: 'blue' }} />
                          </IconButton>
                          <IconButton onClick={() => availableRoles.length && moveToSelected(availableRoles[0])}>
                            <ChevronRightIcon sx={{ color: 'blue' }} />
                          </IconButton>
                          <IconButton onClick={() => selectedRoles.length && moveToAvailable(selectedRoles[0])}>
                            <ChevronLeftIcon sx={{ color: 'red' }} />
                          </IconButton>
                          <IconButton onClick={moveAllToAvailable}>
                            <KeyboardDoubleArrowLeftIcon sx={{ color: 'red' }} />
                          </IconButton>
                        </Box>

                        {/* Selected Roles Section */}
                        <Box sx={{
                              border: '1px solid #ddd', // Add border
                              borderRadius: 2, // Optional: Add rounded corners
                              padding: 2, // Optional: Add padding inside the box
                            }} flex={1} ml={2}>
                          <Typography sx={{ fontWeight: 'bold' }}variant="subtitle1" gutterBottom>
                            Selected Roles
                          </Typography>
                          <TextField
                            label="Search Role"
                            variant="outlined"
                            fullWidth
                            size="small"
                            value={searchSelected}
                            InputProps={{
                              style: {
                                height: "45px", // Sets the height of the input field
                                padding: "0 14px", // Ensures the padding doesn't overlap with the label
                              },
                            }}
                            InputLabelProps={{                             
                              sx: {
                                color: "#1A005D",
                                "&.Mui-focused": { color: "#8EC400" },
                                lineHeight: "32px",
                              },
                            }}
                            sx={{ borderRadius: "10px" }}
                            onChange={(e) => setSearchSelected(e.target.value)}
                          />
                          <List
                            sx={{
                              maxHeight: 250,
                              overflow: 'auto',
                              border: '1px solid #ddd',
                              borderRadius: 1,
                              mt: 1,
                            }}
                          >
                            {selectedRoles
                              .filter((role) => role.roleName.toLowerCase().includes(searchSelected.toLowerCase()))
                              .map((role) => (
                                <ListItem key={role.role_id} button onClick={() => moveToAvailable(role)}>
                                  <ListItemText primary={role.roleName} />
                                </ListItem>
                              ))}
                          </List>
                        </Box>
                      </Box>
                    </DialogContent>

                  <DialogActions sx={{ justifyContent: 'center', padding: '12px 24px' }}>
                    <Button
                      onClick={handleSubmitUserRole}
                      sx={{
                        backgroundColor: '#1A005D',
                        color: 'white',
                        '&:hover': { backgroundColor: '#3105a3' },
                        borderRadius: 2,
                        padding: '8px 16px',
                        textTransform: 'none',
                      }}
                    >
                       {isEditMode ? "Update" : "Assign"}
                       </Button>
                    <Button
                      onClick={() => setOpenAddDialog(false)}
                      sx={{
                        backgroundColor: 'orange',
                        color: 'black',
                        '&:hover': { backgroundColor: '#FFBF00' },
                        borderRadius: 2,
                        padding: '8px 16px',
                        textTransform: 'none',
                      }}
                    >
                      Cancel
                    </Button>
                  </DialogActions>
                </Dialog>
                {/* Delete Confirmation Dialog */}
<Dialog
  open={deleteConfirmOpen}
  onClose={() => setDeleteConfirmOpen(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle sx={{ fontWeight: "bold", width: '300px', }}>Confirm Delete</DialogTitle>
  <DialogContent>
    <Typography>Are you sure you want to delete this role assignment?</Typography>
  </DialogContent>
  <DialogActions sx={{ justifyContent: 'center', padding: '12px 12px' }}>
    <Button
      onClick={() => setDeleteConfirmOpen(false)}
      sx={{
        backgroundColor: '#f0f0f0',
        color: 'black',
        '&:hover': { backgroundColor: '#d0d0d0' },
        borderRadius: 2,
        padding: '8px 8px',
        textTransform: 'none',
        marginRight: 2
      }}
    >
      Cancel
    </Button>
    <Button
      onClick={handleConfirmDelete}
      sx={{
        backgroundColor: '#ef4444',
        color: 'white',
        '&:hover': { backgroundColor: '#dc2626' },
        borderRadius: 2,
        padding: '8px 16px',
        textTransform: 'none',
        
      }}
    >
      Delete
    </Button>
  </DialogActions>
</Dialog>


                  <Snackbar
                        open={successMessageOpen}
                        autoHideDuration={6000}
                        onClose={handleCloseSnackbar}
                        TransitionComponent={(props) => <Slide {...props} direction="up" />}
                        anchorOrigin={{
                          vertical: 'center', // Fix: Use 'center' instead of 'middle'
                          horizontal: 'center', // Fix: Use 'center' instead of 'middle'
                        }}
                        style={{
                          marginTop: '40px',
                        }}
                      >

                 <Alert
                             severity="success"
                             style={{
                              background: 'linear-gradient(45deg, #007F00, #00A000)', // Darker green for contrast
                              color: '#fff', // White text for better visibility
                              padding: '14px 28px',
                              fontWeight: '600',
                              textAlign: 'center',
                              borderRadius: '12px',
                              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.3)', // Slightly stronger shadow
                              minWidth: '300px',
                              fontFamily: 'Roboto, sans-serif',
                              letterSpacing: '0.5px',
                              animation: 'fadeIn 0.5s ease-in-out',
                            }}
                            
                           >{successMessageContent}</Alert>
                </Snackbar>
        </Box>
      </div>
    </div>
  );
}

export default RoleAccess;
