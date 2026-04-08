import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Slide,
  Box,
  Grid,
} from '@mui/material';
import * as XLSX from 'xlsx';
import { exportData } from './exportUtils';

import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { MdDeleteForever } from 'react-icons/md';
import { Input } from '@mui/base/Input';
import { Menu } from '@headlessui/react';
import Tooltip from '@mui/material/Tooltip';
import {
  DownloadIcon,
  FileTextIcon,
  Trash2Icon,
  PlusCircleIcon,
  UserIcon,
  BellIcon,
} from 'lucide-react';

function RoleMaster() {
  const [roles, setRoles] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [successMessageOpen, setSuccessMessageOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [successMessageContent, setSuccessMessageContent] = useState('');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDescription, setEditRoleDescription] = useState('');
  const navigate = useNavigate();
  const rolePermissions = JSON.parse(sessionStorage.getItem("rolePermissions")) || {};
  const mastersPermissions = rolePermissions["Masters"] || {};
  const Permissions = mastersPermissions["Roles creation"] || {};
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const canEdit = Permissions["View/Create/Edit"] === 1;


  // Fetching roles from the API
  const fetchRoles = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/roleRoutes/roleMaster/Rolelist`, {
            method: 'POST',  // Change GET to POST
            headers: {
                'Content-Type': 'application/json',  // Set content type
            },
            body: JSON.stringify({}) // Empty body (since no parameters are needed)
        });

        const data = await response.json();
        console.log("Role list:", data);

        if (data && Array.isArray(data.results)) {
            const structuredData = data.results.map((item, index) => ({
                id: item.role_id,
                SLNO: index + 1,
                roleName: item.roleName || 'N/A',
                roleDescription: item.roleDescription || 'N/A',
                roleCreatedBy: item.roleCreatedBy || 'Unknown',
                roleCreatedOn: item.roleCreatedOn 
                    ? new Date(item.roleCreatedOn).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                    })
                    : 'N/A',
            }));

            // Ensure setRoles is defined before calling it
            if (typeof setRoles === 'function') {
                setRoles(structuredData);
            } else {
                console.error('setRoles is not defined');
            }
        } else {
            console.error('Unexpected API response format:', data);
        }
    } catch (error) {
        console.error('Error fetching roles:', error);
    }
};

  
  useEffect(() => {
    fetchRoles();  // Initially fetch data when component mounts
  }, []);

  const handleAddRole = () => {
    setOpenAddDialog(true);
  };

  const handleBackClick = () => {
    navigate('/admindashboard/setup');
  };



  const handleSubmitRole = async (event) => {
    event.preventDefault();
  
    try {
      const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
      if (!userDetails.emp_id || !userDetails.empname) {
        throw new Error("User is not logged in. Please log in to proceed.");
      }
  
      // Add role
      const response = await fetch(`${API_BASE_URL}/roleRoutes/roleMaster/Roleadd`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleName: newRoleName,
          roleDescription: newRoleDescription,
          roleCreatedBy: userDetails.emp_id,
          roleCreatedOn: new Date().toISOString(),
        }),
      });
  
      if (response.ok) {
        const result = await response.json();
        
        // Audit log for role creation
        const auditResponse = await fetch(`${API_BASE_URL}/login/logAudit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'ROLE_CREATED',
            empId: userDetails.emp_id,
            details: `Created new role: ${newRoleName}`,
            // IP will be captured by your backend middleware automatically
          }),
        });
  
        if (!auditResponse.ok) {
          console.warn('Role created but audit log failed');
        }
  
        await fetchRoles();
        setOpenAddDialog(false);
        setNewRoleName('');
        setNewRoleDescription('');
        setSuccessMessageContent('Role added successfully!');
        setSuccessMessageOpen(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add role');
      }
    } catch (error) {
      console.error('Error:', error);
      
      
  
     
    }
  };

  const handleDeleteClick = (role) => {
    setRoleToDelete(role);
    setOpenDeleteDialog(true);
  };

  const handleDeleteRole = async (role) => {
    try {
      const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
      if (!userDetails.emp_id || !userDetails.empname) {
        throw new Error("User is not logged in. Please log in to proceed.");
      }
  
      // Attempt audit log
      await fetch(`${API_BASE_URL}/login/logAudit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'ROLE_DELETE_ATTEMPT',
          empId: userDetails.emp_id,
          details: `Attempting to delete role: ${role.roleName}`,
        }),
      });
  
      // Delete role
      const response = await fetch(`${API_BASE_URL}/roleRoutes/roleMaster/Roledelete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleName: role.roleName,
          roleCreatedBy: userDetails.empname,
          deletedBy: userDetails.emp_id,
          deletionTime: new Date().toISOString()
        }),
      });
  
      if (response.ok) {
        const result = await response.json();
        
        // Success audit log
        await fetch(`${API_BASE_URL}/login/logAudit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'ROLE_DELETED',
            empId: userDetails.emp_id,
            details: `Deleted role: ${role.roleName}`,
          }),
        });
  
        await fetchRoles();
        setSuccessMessageContent('Role deleted successfully!');
        setSuccessMessageOpen(true);
        setOpenDeleteDialog(false);
      } else {
        const errorData = await response.json();
        
        // Failure audit log
        await fetch(`${API_BASE_URL}/login/logAudit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'ROLE_DELETE_FAILED',
            empId: userDetails.emp_id,
            details: `Failed to delete role: ${role.roleName} | ${errorData.message || 'Unknown error'}`,
          }),
        });
  
        throw new Error(errorData.message || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Error:', error);
      
     
  
      
    }
  };
  
  const handleCancelDialog = () => {
    setOpenAddDialog(false);
    setNewRoleName('');
    setNewRoleDescription('');
  };

  const handleCloseSnackbar = () => {
    setSuccessMessageOpen(false);
  };


  const filteredRoles = roles.filter((role) => {
    const searchLower = searchText.toLowerCase();
    return (
      role.SLNO.toString().includes(searchLower) ||
      role.roleName?.toLowerCase().includes(searchLower) ||
      role.roleDescription?.toLowerCase().includes(searchLower) ||
      role.roleCreatedBy?.toLowerCase().includes(searchLower)
    );
  });

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
          backgroundColor: "#1A005D ",
          padding: "12px 24px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
        }}
      >
              <IconButton  color="#1A005D" 
                className="back-button" 
                onClick={handleBackClick}
                sx={{
                  backgroundColor: "white",
                  '&:hover': { backgroundColor: "#cbd5e1" },
                  borderRadius: "8px",
                  padding: "6px"
                }}
              >
            <ArrowBackIcon onClick={handleBackClick} />
          </IconButton>

              <Typography 
                  variant="h5" 
                  fontWeight="bold" 
                  color="white"
                  sx={{ fontSize: "20px", letterSpacing: "0.5px" }}
                >
                  Roles
              </Typography>
          <Tooltip title="Add topic">
          {canEdit && (
              <Button
                  startIcon={<PlusCircleIcon />}
                  onClick={handleAddRole} 
                  sx={{
                    color: "#1A005D",
                    backgroundColor: "#8EC400",
                    textTransform: "none",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    '&:hover': { backgroundColor: "#1A005D",color: "#8EC400" },
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                  }}
                > Add Role
            </Button>
            )}
          </Tooltip>        
       
      </Box>

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

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
  <Table sx={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}> 
    <TableHead>
      <TableRow sx={{ backgroundColor: '#e2e8f0' }}>
        <TableCell sx={{ fontWeight: 'bold', padding: '4px',width: '100px', fontSize: '1.02rem' }}>SL No.</TableCell>
        <TableCell sx={{ fontWeight: 'bold', padding: '4px', minWidth: 100, fontSize: '1.02rem' }}>Role</TableCell>
        <TableCell sx={{ fontWeight: 'bold', padding: '4px', minWidth: 150, fontSize: '1.02rem' }}>Description</TableCell>
        <TableCell sx={{ fontWeight: 'bold', padding: '4px', minWidth: 100 , fontSize: '1.02rem'}}>Created By</TableCell>
        <TableCell sx={{ fontWeight: 'bold', padding: '4px', minWidth: 100 , fontSize: '1.02rem'}}>Created On</TableCell>
        <TableCell sx={{ fontWeight: 'bold', padding: '4px', textAlign: 'center', minWidth: 80, fontSize: '1.02rem' }}>Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {filteredRoles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((role) => (
        <TableRow key={role.id} hover sx={{ '& td': { padding: '4px', fontSize: '1.00rem' } }}>
          <TableCell>{role.SLNO}</TableCell>
          <TableCell>{role.roleName}</TableCell>
          <TableCell>{role.roleDescription}</TableCell>
          <TableCell>{role.roleCreatedBy}</TableCell>
          <TableCell>{role.roleCreatedOn}</TableCell>
          <TableCell align="center">
            <Tooltip title="Delete">
            {canEdit && (
              <IconButton onClick={() => handleDeleteClick(role)} sx={{ color: '#ef4444' }}>
                <Trash2Icon />
              </IconButton>
              )}
            </Tooltip>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>


      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={filteredRoles.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => setRowsPerPage(+e.target.value)}
        sx={{ mt: 2 }}
      />
  {/* adding Confirmation Dialog */}
<Dialog 
  open={openAddDialog} 
  onClose={() => setOpenAddDialog(false)} 
  sx={{ 
    '& .MuiDialog-paper': { 
      borderRadius: 3, 
      padding: 1, 
      width: '700px', 
      height:'300px'
    } 
  }}
>
  <DialogTitle 
    sx={{ 
      fontWeight: 'bold', 
      color: '#1A005D', 
      textAlign: 'center', 
      padding: '12px 12px' 
    }}
  >
    Role Master
  </DialogTitle>

  <DialogContent sx={{ padding: '16px 16px' }}>
    <TextField
      label="Role Name"
      fullWidth
      value={newRoleName}
      onChange={(e) => setNewRoleName(e.target.value)}
      sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
    />
    <TextField
      label="Role Description"
      fullWidth     
      value={newRoleDescription}
      onChange={(e) => setNewRoleDescription(e.target.value)}
      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
    />
  </DialogContent>

  <DialogActions sx={{ justifyContent: 'center', padding: '12px 24px' }}>
    <Button
      onClick={handleCancelDialog}
      sx={{
        backgroundColor: 'orange',
        color: 'black',
        '&:hover': { backgroundColor: '#FFBF00' },
        borderRadius: 2,
        padding: '8px 16px',
        textTransform: 'none', 
      }}
    >
      Close
    </Button>
    <Button
      type="submit"
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
      Add Role
    </Button>
  </DialogActions>
</Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', color: '#1976d2' }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent sx={{ width: '500px', height: '70px', padding: '8px' }}>
          <Typography variant="body1">
            Do you want to proceed with deleting the role "{roleToDelete?.roleName}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            sx={{
              backgroundColor: '#e0e0e0',
              color: '#424242',
              textTransform: 'none',
              fontWeight: 'bold',
              padding: '8px 16px',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#d6d6d6',
              },
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
              backgroundColor: '#d32f2f',
              color: '#fff',
              textTransform: 'none',
              fontWeight: 'bold',
              padding: '8px 16px',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#b71c1c',
              },
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>



      <Snackbar
            open={successMessageOpen}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            TransitionComponent={(props) => <Slide {...props} direction="up" />}
            anchorOrigin={{
              vertical: 'center', 
              horizontal: 'center', 
            }}
            style={{
              marginTop: '40px',
            }}
          >

        <Alert severity="success"
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

export default RoleMaster;



