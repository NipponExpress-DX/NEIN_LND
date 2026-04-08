import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Typography,
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
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  Slide,
  Snackbar,
  Alert,
  Box,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import { exportData } from './exportUtils';
import * as XLSX from 'xlsx';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Autocomplete from '@mui/material/Autocomplete';

import { PlusCircleIcon, DownloadIcon, FileTextIcon, Trash2Icon, Edit2 as EditIcon } from 'lucide-react';
export const exportData1 = (data, fileName, fileType) => {
  // Transform the data to exclude rmt_id and format function_list
  const transformedData = data.map((role, index) => ({
    'SL No.': index + 1,
    'Role': role.role,
    'Function List': Object.entries(role.function_list)
      .map(([menu, funcs]) => (
        `${menu}: ` +
        Object.entries(funcs)
          .map(([func, activities]) => (
            `${func} (` +
            Object.entries(activities)
              .filter(([activity, value]) => value === 1)
              .map(([activity]) => activity)
              .join(', ') +
            ')'
          ))
          .join(', ')
      ))
      .join('\n'),
    'Created By': role.createdBy,
    'Created On': role.createdOn ? new Date(role.createdOn).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }) : 'N/A',
  }));

  // Create worksheet and workbook
  const worksheet = XLSX.utils.json_to_sheet(transformedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Roles');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};




function RoleManagement() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [roles, setRoles] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [roleList, setRoleList] = useState([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedFunctions, setSelectedFunctions] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const rolePermissions = JSON.parse(sessionStorage.getItem("rolePermissions")) || {};
  const mastersPermissions = rolePermissions["Masters"] || {};
  const Permissions = mastersPermissions["Role Mgmt"] || {};
  const canEdit = Permissions["View/Create/Edit"] === 1;
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [filteredRoles, setFilteredRoles] = useState([]);


  const [openFunctionListDialog, setOpenFunctionListDialog] = useState(false);
const [selectedRoleDetails, setSelectedRoleDetails] = useState(null);
const handleRoleClick = (role) => {
  setSelectedRoleDetails(role);
  setOpenFunctionListDialog(true);
};


  const [branches, setBranches] = useState([]);
const [departments, setDepartments] = useState([]);

const formatFunctionListForTooltip = (functionList) => {
  if (!functionList || typeof functionList !== 'object') return "No permissions assigned";

  return Object.entries(functionList).map(([menu, funcs]) => {
    const menuContent = Object.entries(funcs).map(([func, activities]) => {
      const activityContent = Object.entries(activities).map(([activity, value]) => {
        if (activity === 'Branch List') {
          const branchNames = Array.isArray(value) 
            ? value.map(id => {
                const branch = branches.find(b => b.branch_id === id);
                return branch ? branch.branch_name : id;
              }).filter(name => name).join(', ')
            : '';
          return branchNames ? `Branch List: ${branchNames}` : '';
        } else if (activity === 'Department List') {
          const deptNames = Array.isArray(value) 
            ? value.map(id => {
                const dept = departments.find(d => d.department_id === id);
                return dept ? dept.department_name : id;
              }).filter(name => name).join(', ')
            : '';
          return deptNames ? `Department List: ${deptNames}` : '';
        } else {
          return value === 1 ? activity : '';
        }
      }).filter(item => item !== '').join('\n');

      return `${func}\n${activityContent}`;
    }).join('\n\n');

    return `${menu}\n${menuContent}`;
  }).join('\n\n');
};
const fetchBranches = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/training-master/branchmaster/list`);
    // Ensure the response contains the `topics` array, otherwise default to an empty array
    setBranches(response.data?.topics || []);
  } catch (error) {
    console.error("Error fetching branches:", error);
    setBranches([]); // Default to an empty array if the API call fails
  }
};

const fetchDepartments = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/training-master/department/list`);
    // Ensure the response contains the `topics` array, otherwise default to an empty array
    setDepartments(response.data?.topics || []);
  } catch (error) {
    console.error("Error fetching departments:", error);
    setDepartments([]); // Default to an empty array if the API call fails
  }
};
// Update useEffect to include these fetches
useEffect(() => {
  fetchRoles();
  fetchFunctions();
  fetchRolesList();
  fetchBranches();
  fetchDepartments();
}, []);

useEffect(() => {
  const filtered = roles.filter(role => 
    role.role.toLowerCase().includes(searchText.toLowerCase()) ||
    (role.createdBy && role.createdBy.toLowerCase().includes(searchText.toLowerCase())) ||
    (role.createdOn && role.createdOn.toString().toLowerCase().includes(searchText.toLowerCase()))
  );
  setFilteredRoles(filtered);
  setPage(0); // Reset to first page when searching
}, [roles, searchText]);



const formattedFunctions = Object.entries(selectedFunctions).reduce((acc, [menu, functions]) => {
  acc[menu] = Object.entries(functions).reduce((menuAcc, [funcName, activities]) => {
    menuAcc[funcName] = Object.entries(activities).reduce((funcAcc, [activity, value]) => {
      if (activity === 'Branch List' || activity === 'Department List') {
        funcAcc[activity] = value.map(item => item.branch_id || item.department_id);
      } else {
        funcAcc[activity] = value ? 1 : 0;
      }
      return funcAcc;
    }, {});
    return menuAcc;
  }, {});
  return acc;
}, {});




  // For error notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: '',
  });
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // New states for success notifications
  const [successMessageOpen, setSuccessMessageOpen] = useState(false);
  const [successMessageContent, setSuccessMessageContent] = useState("");

  // New states for deletion confirmation dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  useEffect(() => {
    fetchRoles();
    fetchFunctions();
    fetchRolesList();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/roleRoutes/roleMaster/ListRoleManagement`);
      console.log("Raw API response:", response.data); // Add this line
      
      const rolesWithParsedFunctions = response.data.map(role => {
        console.log("Original function_list:", role.function_list); // Add this line
        
        try {
          const functionList = typeof role.function_list === 'string' 
            ? JSON.parse(role.function_list) 
            : role.function_list;
          
          console.log("Parsed function_list:", functionList); // Add this line
          
          return {
            ...role,
            function_list: functionList
          };
        } catch (error) {
          console.error("Error parsing function_list:", error);
          return {
            ...role,
            function_list: {}
          };
        }
      });
      
      setRoles(rolesWithParsedFunctions);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };
  const getBranchNames = (branchIds) => {
    return branchIds
      .map(id => branches.find(branch => branch.branch_id === id))  // Added closing )
      .filter(branch => branch)
      .map(branch => branch.branch_name);
  };
  
  const getDepartmentNames = (departmentIds) => {
    return departmentIds
      .map(id => departments.find(dept => dept.department_id === id))  // Added closing )
      .filter(dept => dept)
      .map(dept => dept.department_name);
  };

  const fetchRolesList = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/roleRoutes/roleMaster/Rolelist`);
      const rolesData = response.data.results || response.data;
      setRoleList(rolesData);
    } catch (error) {
      console.error("Error fetching roles list:", error);
    }
  };

  const fetchFunctions = async () => {
    try {
      const url = `${API_BASE_URL}/roleRoutes/roleMaster/FunctionsList`;
      console.log("Calling API:", url);
      
      const response = await axios.post(url);
      console.log("Full response:", response.data);
      
      setFunctions(response.data.topics);
      console.log("Functions list data : 11", response.data.topics);
    } catch (error) {
      console.error("Error fetching functions:", error.response?.data || error.message || error);
    }
  };
  
 

  // Reset form state for add/update dialog
  const resetForm = () => {
    setSelectedRole(null);
    setSelectedFunctions({});
    setIsEditMode(false);
  };

  // Opens dialog in add or edit mode
  const handleAddRole = (role = null) => {
    if (role) {
      // Create a deep copy of the function_list
      const functionListCopy = JSON.parse(JSON.stringify(role.function_list));
      
      // Process the function list to handle branch and department selections
      Object.entries(functionListCopy).forEach(([menu, funcs]) => {
        Object.entries(funcs).forEach(([funcName, activities]) => {
          Object.entries(activities).forEach(([activity, value]) => {
            if (activity === 'Branch List') {
              // Check if all branches are selected
              const currentBranchIds = branches.map(b => b.branch_id);
              const isAllBranches = Array.isArray(value) && 
                value.length === currentBranchIds.length && 
                value.every(id => currentBranchIds.includes(id));
              
              functionListCopy[menu][funcName][activity] = isAllBranches
                ? [{ branch_id: "all", branch_name: "PAN INDIA" }]
                : branches.filter(b => Array.isArray(value) ? value.includes(b.branch_id) : []);
  
            } else if (activity === 'Department List') {
              // Check if all departments are selected
              const currentDeptIds = departments.map(d => d.department_id);
              const isAllDepartments = Array.isArray(value) && 
                value.length === currentDeptIds.length && 
                value.every(id => currentDeptIds.includes(id));
              
              functionListCopy[menu][funcName][activity] = isAllDepartments
                ? [{ department_id: "all", department_name: "All Departments" }]
                : departments.filter(d => Array.isArray(value) ? value.includes(d.department_id) : []);
            }
          });
        });
      });
  
      setSelectedRole(role);
      setIsEditMode(true);
      setSelectedFunctions(functionListCopy);
    } else {
      // Initialize for add mode
      setSelectedRole({ role: '' });
      setSelectedFunctions({});
      setIsEditMode(false);
    }
    setOpenAddDialog(true);
  };

  // Handle individual activity checkbox change
  const handleFunctionChange = (menu, func, activity) => (event) => {
    setSelectedFunctions((prev) => ({
      ...prev,
      [menu]: {
        ...prev[menu],
        [func]: {
          ...prev[menu]?.[func],
          [activity]: event.target.checked ? 1 : 0,
        },
      },
    }));
  };

  // Toggle all checkboxes in a menu group
  const handleSelectAllMenu = (menu, menuFunctions) => {
    const newSelectedFunctions = { ...selectedFunctions };
    const isCurrentlySelected = menuFunctions.every(func =>
      func.activities_list.split(',').every(activity =>
        newSelectedFunctions[menu]?.[func.function_name]?.[activity.trim()]
      )
    );

    menuFunctions.forEach(func => {
      if (!newSelectedFunctions[menu]) newSelectedFunctions[menu] = {};
      if (!newSelectedFunctions[menu][func.function_name]) newSelectedFunctions[menu][func.function_name] = {};

      func.activities_list.split(',').forEach(activity => {
        newSelectedFunctions[menu][func.function_name][activity.trim()] = !isCurrentlySelected;
      });
    });

    setSelectedFunctions(newSelectedFunctions);
  };

  // Toggle all checkboxes for a specific function
  // Modified handleSelectAllFunction
const handleSelectAllFunction = (menu, functionName, checkboxActivities) => {
  const newSelectedFunctions = { ...selectedFunctions };
  const isCurrentlySelected = checkboxActivities.every(activity =>
    newSelectedFunctions[menu]?.[functionName]?.[activity]
  );

  checkboxActivities.forEach(activity => {
    if (!newSelectedFunctions[menu]) newSelectedFunctions[menu] = {};
    if (!newSelectedFunctions[menu][functionName]) newSelectedFunctions[menu][functionName] = {};
    newSelectedFunctions[menu][functionName][activity] = !isCurrentlySelected;
  });

  setSelectedFunctions(newSelectedFunctions);
};

  // Submit role add or update
  const handleSubmitRole = async () => {
    // Validate if a role is selected
    if (!selectedRole?.role) {
      setSnackbar({
        open: true,
        message: "Please select a role!",
        severity: 'error',
      });
      return;
    }
  
    // Retrieve user details from session storage
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
    if (!userDetails.emp_id || !userDetails.empname) {
      console.error("User is not logged in. Please log in to proceed.");
      setSnackbar({
        open: true,
        message: "User is not logged in. Please log in to proceed.",
        severity: 'error',
      });
      return;
    }
  
    // Transform selectedFunctions into the required structure
    const formattedFunctions = Object.entries(selectedFunctions).reduce((acc, [menu, functions]) => {
      acc[menu] = Object.entries(functions).reduce((menuAcc, [funcName, activities]) => {
        menuAcc[funcName] = Object.entries(activities).reduce((funcAcc, [activity, value]) => {
          if (activity === 'Branch List' || activity === 'Department List') {
            if (Array.isArray(value) && value.length > 0) {
              if (value.some(item => item.branch_id === "all" || item.department_id === "all")) {
                funcAcc[activity] = activity === 'Branch List'
                  ? branches.map(branch => branch.branch_id)
                  : departments.map(dept => dept.department_id);
              } else {
                funcAcc[activity] = value.map(item => item.branch_id || item.department_id);
              }
            } else {
              funcAcc[activity] = [];
            }
          } else {
            funcAcc[activity] = value ? 1 : 0;
          }
          return funcAcc;
        }, {});
        return menuAcc;
      }, {});
      return acc;
    }, {});
  
    const payload = {
      role: selectedRole.role,
      function_list: formattedFunctions,
      createdBy: userDetails.emp_id,
    };
  
    const url = isEditMode
      ? `${API_BASE_URL}/roleRoutes/roleMaster/UpdateRoleManagement`
      : `${API_BASE_URL}/roleRoutes/roleMaster/addRoleManagement`;
  
    try {
      const response = await axios.post(url, payload);
      
      if (response.data) {
        // Audit log for successful operation
        if (userDetails?.emp_id) {
          try {
            await axios.post(`${API_BASE_URL}/login/logAudit`, {
              action: isEditMode ? 'ROLE_UPDATED-Role Management' : 'ROLE_CREATED - Role Management',
              empId: userDetails.emp_id,
              details: `${isEditMode ? 'Updated' : 'Created'} role: ${selectedRole.role}`
            });
          } catch (auditError) {
            console.warn("Audit log failed (non-critical)", auditError);
          }
        }
  
        setSuccessMessageContent(isEditMode ? "Role updated successfully!" : "Role added successfully!");
        setSuccessMessageOpen(true);
        fetchRoles();
        setOpenAddDialog(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error submitting role:", error.response?.data || error.message);
      
      // Audit log for failed operation
      if (userDetails?.emp_id) {
        try {
          await axios.post(`${API_BASE_URL}/login/logAudit`, {
            action: isEditMode ? 'ROLE_UPDATE_FAILED' : 'ROLE_CREATE_FAILED',
            empId: userDetails.emp_id,
            details: `Failed to ${isEditMode ? 'update' : 'create'} role: ${selectedRole.role}`,
            error: error.response?.data?.message || error.message
          });
        } catch (auditError) {
          console.warn("Audit log failed (non-critical)", auditError);
        }
      }
  
      setSnackbar({
        open: true,
        message: "Error submitting role. Please try again later.",
        severity: 'error',
      });
    }
  };

  // Delete role (called after confirmation)
  const handleDeleteRole = async (role) => {
    if (!role) return;
    
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails") || "{}");
    if (!userDetails.emp_id || !userDetails.empname) {
      console.error("User is not logged in. Please log in to proceed.");
      setSnackbar({
        open: true,
        message: "User is not logged in. Please log in to proceed.",
        severity: 'error',
      });
      return;
    }
  
    try {
      // Audit log for delete attempt
      if (userDetails?.emp_id) {
        try {
          await axios.post(`${API_BASE_URL}/login/logAudit`, {
            action: 'ROLE_DELETE_ATTEMPT -Role Management',
            empId: userDetails.emp_id,
            details: `Attempting to delete role: ${role.role}`
          });
        } catch (auditError) {
          console.warn("Audit log failed (non-critical)", auditError);
        }
      }
  
      const response = await axios.post(`${API_BASE_URL}/roleRoutes/roleMaster/DeleteRoleManagement`, {
        role: role.role,
        createdBy: userDetails.emp_id,
      });
  
      if (response.data) {
        // Audit log for successful deletion
        if (userDetails?.emp_id) {
          try {
            await axios.post(`${API_BASE_URL}/login/logAudit`, {
              action: 'ROLE_DELETED - Role Management ',
              empId: userDetails.emp_id,
              details: `Deleted role: ${role.role}`
            });
          } catch (auditError) {
            console.warn("Audit log failed (non-critical)", auditError);
          }
        }
  
        setSuccessMessageContent("Role deleted successfully!");
        setSuccessMessageOpen(true);
        fetchRoles();
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      
      // Audit log for failed deletion
      if (userDetails?.emp_id) {
        try {
          await axios.post(`${API_BASE_URL}/login/logAudit`, {
            action: 'ROLE_DELETE_FAILED',
            empId: userDetails.emp_id,
            details: `Failed to delete role: ${role.role}`,
            error: error.response?.data?.message || error.message
          });
        } catch (auditError) {
          console.warn("Audit log failed (non-critical)", auditError);
        }
      }
  
      setSnackbar({
        open: true,
        message: "Error deleting role. Please try again later.",
        severity: 'error',
      });
    }
  };

  // Opens delete confirmation dialog
  const confirmDeleteRole = (role) => {
    setRoleToDelete(role);
    setOpenDeleteDialog(true);
  };

  const handleBackClick = () => {
    navigate('/admindashboard/setup');
  };


  

  return (
    <div className="admin-dashboard-content">
      <div className="main-content">
        <Box sx={{ p: 0, backgroundColor: 'white', minHeight: '100vh' }}>
          {/* Header */}
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
              Role Management
            </Typography>

            <Tooltip title="Add Role">
            {canEdit && (
              <Button
                startIcon={<PlusCircleIcon />}
                onClick={() => handleAddRole(null)}
                sx={{
                  color: "#1A005D",
                  backgroundColor: "#8EC400",
                  textTransform: "none",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  '&:hover': { backgroundColor: "#1A005D", color: "#8EC400" },
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                }}
              >
                Add Role
              </Button>
               )}
            </Tooltip>
          </Box>

          {/* Toolbar */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" gap={2}>
              <Tooltip title="Export to Excel">
                <Button onClick={() => exportData(roles, 'Roles_List', 'excel')} sx={{
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

            <TextField
              variant="outlined"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="small"
              sx={{ width: '30%' }}
            />
          </Box>

          {/* Roles Table */}
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Table sx={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#e2e8f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', padding: '4px', width: '100px', fontSize: '1.02rem' }}>SL No.</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', padding: '4px', minWidth: 100, fontSize: '1.02rem' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', padding: '4px', minWidth: 100, fontSize: '1.02rem' }}>Created By</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', padding: '4px', minWidth: 100, fontSize: '1.02rem' }}>Created On</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', padding: '4px', textAlign: 'center', minWidth: 80, fontSize: '1.02rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRoles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((role, index) => (
                  <TableRow key={role.rmt_id} hover sx={{ '& td': { padding: '4px', fontSize: '1.00rem' } }}>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell sx={{ padding: '2px', fontSize: '1.03rem' }}>
  <Tooltip 
    title={
      <div style={{ whiteSpace: 'pre-line' }}>
        {formatFunctionListForTooltip(role.function_list)}
      </div>
    }
    placement="right"
    arrow
  >
    <span 
      style={{ 
        cursor: 'pointer', 
        textDecoration: 'underline dotted', 
        color: '#1976d2' 
      }}
      onClick={() => handleRoleClick(role)}
    >
      {role.role}
    </span>
  </Tooltip>
</TableCell>
                    <TableCell>{role.createdBy}</TableCell>
                    <TableCell>
                      {role.createdOn ? new Date(role.createdOn).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      }) : 'N/A'}
                    </TableCell>
                    <TableCell align="center">
                    {canEdit && (
                      <>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleAddRole(role)} sx={{ color: '#3b82f6', marginRight: '5px' }}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => confirmDeleteRole(role)} sx={{ color: '#ef4444' }}>
                          <Trash2Icon />
                        </IconButton>
                      </Tooltip>
                      </>
                       )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredRoles.length} // Update to filteredRoles.length
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(+e.target.value);
            setPage(0);
          }}
        />


          {/* Add / Edit Dialog */}
          <Dialog 
            open={openAddDialog} 
            onClose={() => { resetForm(); setOpenAddDialog(false); }} 
            maxWidth="md" 
            fullWidth
          >
            <DialogTitle sx={{ fontWeight: "bold", padding: 2 }}>
              {isEditMode ? "Edit Role" : "Add Role"}
            </DialogTitle>
            <DialogContent>
  <Box display="flex" flexDirection="column" gap={2} mb={2} padding="5px">
    <FormControl fullWidth>
      <InputLabel id="role-select-label">Select Role</InputLabel>
      <Select
        labelId="role-select-label"
        id="role-select"
        value={selectedRole?.role || ''}
        label="Select Role"
        onChange={(e) => setSelectedRole({ role: e.target.value })}
      >
        {roleList.map((role) => (
          <MenuItem key={role.role_id} value={role.roleName}>
            {role.roleName}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Box>
  <Box display="flex" flexDirection="column" gap={1}>
  {Object.entries(
  functions.reduce((acc, func) => {
    if (!acc[func.menu_list]) acc[func.menu_list] = [];
    acc[func.menu_list].push(func);
    return acc;
  }, {})
).map(([menu, menuFunctions]) => {
  // Determine if menu has any checkbox activities
  const menuHasCheckboxActivities = menuFunctions.some(func => {
    const activities = func.activities_list.split(',').map(a => a.trim());
    return activities.some(a => a !== 'Branch List' && a !== 'Department List');
  });

  return (
    <Paper key={menu} elevation={1} sx={{ p: 1, border: '1px solid #ddd', borderRadius: 1.5 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ backgroundColor: '#f0f4ff', p: 1, borderRadius: '3px' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1A005D' }}>
          {menu}
        </Typography>
        {/* Only show menu-level Select All if there are checkbox activities */}
        {menuHasCheckboxActivities && (
          <FormControlLabel
            control={
              <Checkbox
                checked={menuFunctions.every(func => {
                  const activities = func.activities_list.split(',').map(a => a.trim());
                  const checkboxActivities = activities.filter(a => a !== 'Branch List' && a !== 'Department List');
                  if (checkboxActivities.length === 0) return true;
                  return checkboxActivities.every(activity => 
                    selectedFunctions[menu]?.[func.function_name]?.[activity]
                  );
                })}
                onChange={() => handleSelectAllMenu(menu, menuFunctions)}
                sx={{ '&.Mui-checked': { color: '#1A005D' } }}
              />
            }
            label="Select All"
          />
        )}
      </Box>
      {menuFunctions.map((func) => {
        const activities = func.activities_list.split(',').map(activity => activity.trim());
        const checkboxActivities = activities.filter(a => a !== 'Branch List' && a !== 'Department List');
        const hasCheckboxActivities = checkboxActivities.length > 0;

        return (
          <Box key={func.rfm_id} sx={{ ml: 1.5, mb: 1, p: 1, borderLeft: '2px solid #1A005D', backgroundColor: '#f8f9fa', borderRadius: 1.5 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" sx={{ fontWeight: '600', color: '#2d3748' }}>
                {func.function_name}
              </Typography>
              {/* Only show function-level Select All if there are checkbox activities */}
              {hasCheckboxActivities && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={checkboxActivities.every(activity =>
                        selectedFunctions[menu]?.[func.function_name]?.[activity]
                      )}
                      onChange={() => handleSelectAllFunction(menu, func.function_name, checkboxActivities)}
                      sx={{ '&.Mui-checked': { color: '#1A005D' } }}
                    />
                  }
                  label="Select All"
                />
              )}
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1.5}>
              {activities.map((activity) => {
                if (activity === 'Branch List') {
                  return (
                    <Autocomplete
                      multiple
                      key={activity}
                      options={[
                        { branch_id: "all", branch_name: "PAN INDIA" }, // Add PAN INDIA option
                        ...branches.filter(branch => branch.branch_id !== "all"), // Exclude "all" from the list
                      ]}
                      value={selectedFunctions[menu]?.[func.function_name]?.[activity] || []}
                      onChange={(event, newValue) => {
                        if (newValue.some(branch => branch.branch_id === "all")) {
                          // If "PAN INDIA" is selected, select all branches
                          setSelectedFunctions(prev => ({
                            ...prev,
                            [menu]: {
                              ...prev[menu],
                              [func.function_name]: {
                                ...prev[menu]?.[func.function_name],
                                [activity]: [{ branch_id: "all", branch_name: "PAN INDIA" }],
                              },
                            },
                          }));
                        } else {
                          // Otherwise, use the selected branches
                          setSelectedFunctions(prev => ({
                            ...prev,
                            [menu]: {
                              ...prev[menu],
                              [func.function_name]: {
                                ...prev[menu]?.[func.function_name],
                                [activity]: newValue,
                              },
                            },
                          }));
                        }
                      }}
                      getOptionLabel={(option) => option.branch_name || ""} // Handle undefined options
                      renderOption={(props, option, { selected }) => (
                        <li {...props}>
                          <Checkbox checked={selected} />
                          {option.branch_name}
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Branch"
                          variant="outlined"
                          size="small"
                          fullWidth
                        />
                      )}
                      sx={{ width: '100%', mt: 1 }}
                    />
                  );
                } else if (activity === 'Department List') {
                  return (
                    <Autocomplete
                      multiple
                      key={activity}
                      options={[
                        { department_id: "all", department_name: "All Departments" }, // Add All Departments option
                        ...departments.filter(dept => dept.department_id !== "all"), // Exclude "all" from the list
                      ]}
                      value={selectedFunctions[menu]?.[func.function_name]?.[activity] || []}
                      onChange={(event, newValue) => {
                        if (newValue.some(dept => dept.department_id === "all")) {
                          // If "All Departments" is selected, select all departments
                          setSelectedFunctions(prev => ({
                            ...prev,
                            [menu]: {
                              ...prev[menu],
                              [func.function_name]: {
                                ...prev[menu]?.[func.function_name],
                                [activity]: [{ department_id: "all", department_name: "All Departments" }],
                              },
                            },
                          }));
                        } else {
                          // Otherwise, use the selected departments
                          setSelectedFunctions(prev => ({
                            ...prev,
                            [menu]: {
                              ...prev[menu],
                              [func.function_name]: {
                                ...prev[menu]?.[func.function_name],
                                [activity]: newValue,
                              },
                            },
                          }));
                        }
                      }}
                      getOptionLabel={(option) => option.department_name || ""} // Handle undefined options
                      renderOption={(props, option, { selected }) => (
                        <li {...props}>
                          <Checkbox checked={selected} />
                          {option.department_name}
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Department"
                          variant="outlined"
                          size="small"
                          fullWidth
                        />
                      )}
                      sx={{ width: '100%', mt: 1 }}
                    />
                  );
                } else {
                  return (
                    <Box key={activity} display="flex" alignItems="center" sx={{ minWidth: 110, padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '14px', backgroundColor: 'white' }}>
                      <Checkbox
                        checked={Boolean(selectedFunctions[menu]?.[func.function_name]?.[activity])}
                        onChange={handleFunctionChange(menu, func.function_name, activity)}
                        color="primary"
                        sx={{ padding: '2px', '&.Mui-checked': { color: '#1A005D' } }}
                      />
                      <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: '500', color: '#4a5568' }}>
                        {activity}
                      </Typography>
                    </Box>
                  );
                }
              })}
            </Box>
          </Box>
        );
      })}
    </Paper>
  );
})}
  </Box>
</DialogContent>
            <DialogActions sx={{ justifyContent: 'center', padding: '12px 24px' }}>
              <Button
                onClick={handleSubmitRole}
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
                onClick={() => { resetForm(); setOpenAddDialog(false); }}
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
          <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
              <Typography variant="body1">
                Are you sure you want to delete the role "{roleToDelete?.role}"?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setOpenDeleteDialog(false)}
                sx={{
                  backgroundColor: 'orange',
                  color: 'black',
                  fontSize: '0.8rem',
                  padding: '6px 12px',
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': { backgroundColor: '#FFBF00' },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await handleDeleteRole(roleToDelete);
                  setOpenDeleteDialog(false);
                }}
                sx={{
                  backgroundColor: '#D32F2F',
                  color: 'white',
                  fontSize: '0.8rem',
                  padding: '6px 12px',
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': { backgroundColor: '#B71C1C' },
                }}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
          {/* Function List Dialog */}
          <Dialog 
  open={openFunctionListDialog} 
  onClose={() => setOpenFunctionListDialog(false)} 
  maxWidth="md" 
  fullWidth
>
  <DialogTitle sx={{ fontWeight: "bold", padding: 2 }}>
    Role Details: {selectedRoleDetails?.role}
  </DialogTitle>
  <DialogContent>
    <Box sx={{ p: 2 }}>
      {selectedRoleDetails && (
        <>
          {/* <Typography variant="subtitle1" sx={{ mb: 2 }}>
            <strong>Raw function_list:</strong> {JSON.stringify(selectedRoleDetails.function_list)}
          </Typography> */}
          
          {typeof selectedRoleDetails.function_list === 'object' && 
           selectedRoleDetails.function_list !== null ? (
            Object.entries(selectedRoleDetails.function_list).map(([menu, funcs]) => (
              <Box key={menu} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1A005D', mb: 1 }}>
                  {menu}
                </Typography>
                
                {typeof funcs === 'object' && funcs !== null && (
                  Object.entries(funcs).map(([func, activities]) => (
                    <Box key={func} sx={{ ml: 2, mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: '600', color: '#2d3748' }}>
                        {func}
                      </Typography>
                      
                      {typeof activities === 'object' && activities !== null && (
                        <Box sx={{ ml: 2 }}>
                          {Object.entries(activities).map(([activity, value]) => {
                            if (activity === 'Branch List') {
                              const branchNames = Array.isArray(value) 
                                ? value.map(id => {
                                    const branch = branches.find(b => b.branch_id === id);
                                    return branch ? branch.branch_name : id;
                                  }).filter(name => name)
                                : [];
                              return (
                                <Typography key={activity} variant="body2" sx={{ color: '#4a5568' }}>
                                  <strong>Branch List:</strong> {branchNames.join(', ') || 'None'}
                                </Typography>
                              );
                            } else if (activity === 'Department List') {
                              const deptNames = Array.isArray(value) 
                                ? value.map(id => {
                                    const dept = departments.find(d => d.department_id === id);
                                    return dept ? dept.department_name : id;
                                  }).filter(name => name)
                                : [];
                              return (
                                <Typography key={activity} variant="body2" sx={{ color: '#4a5568' }}>
                                  <strong>Department List:</strong> {deptNames.join(', ') || 'None'}
                                </Typography>
                              );
                            } else if (value === 1) {
                              return (
                                <Typography key={activity} variant="body2" sx={{ color: '#4a5568' }}>
                                  {activity}
                                </Typography>
                              );
                            }
                            return null;
                          })}
                        </Box>
                      )}
                    </Box>
                  ))
                )}
              </Box>
            ))
          ) : (
            <Typography color="error">
              function_list is not a valid object: {typeof selectedRoleDetails.function_list}
            </Typography>
          )}
        </>
      )}
    </Box>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenFunctionListDialog(false)}>
      Close
    </Button>
  </DialogActions>
</Dialog>
          {/* Error Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            TransitionComponent={(props) => <Slide {...props} direction="up" />}
            anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
            style={{ marginTop: '40px' }}
          >
            <Alert
              severity={snackbar.severity}
              style={{
                background: 'linear-gradient(45deg, #007F00, #00A000)',
                color: '#fff',
                padding: '14px 28px',
                fontWeight: '600',
                textAlign: 'center',
                borderRadius: '12px',
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.3)',
                minWidth: '300px',
                fontFamily: 'Roboto, sans-serif',
                letterSpacing: '0.5px',
                animation: 'fadeIn 0.5s ease-in-out',
              }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>

          {/* Success Snackbar */}
          <Snackbar
            open={successMessageOpen}
            autoHideDuration={3000}
            onClose={() => setSuccessMessageOpen(false)}
            message={successMessageContent}
          />
        </Box>
      </div>
    </div>
  );
}

export default RoleManagement;
