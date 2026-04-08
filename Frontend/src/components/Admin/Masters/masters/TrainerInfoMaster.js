import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {  Typography,  IconButton,  TextField,  Table,  TableBody,  TableCell,  TableContainer,  TableHead,  TableRow,  Paper,  TablePagination,
  Dialog,InputLabel,FormControl , DialogTitle,  DialogContent,  DialogActions,  Button,  Snackbar,  Alert,  Select,  Chip,  MenuItem,  Slide,  Box,
} from '@mui/material';

import {  

  Tooltip,
  Card, CardContent, Stack, Divider,
} from '@mui/material';
import { exportData } from './exportUtils';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PlusCircleIcon, DownloadIcon, Trash2Icon ,Edit2 as EditIcon,} from 'lucide-react';

import { FiEye } from 'react-icons/fi';

import '../../../../css/Admincss/masters/TrainerTypeMaster.css';

function TrainerInfoMaster() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [trainerInfo, settrainerInfo] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
   const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: '', // Can be 'success', 'error', 'info', or 'warning'
      });
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openAddDialog, setOpenAddDialog] = useState(false); // Separate state for Add dialog
  const [openViewDialog, setOpenViewDialog] = useState(false); // Separate state for View dialog
  const [newTrainerInfo, setNewTrainerInfo] = useState('');
  const [successMessageOpen, setSuccessMessageOpen] = useState(false);  
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
      const [editTrainerDetails, setEditTrainerDetails] = useState({});
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false); // State for confirmation dialog
  const [trainerToDelete, setTrainerToDelete] = useState(null); // State to store the trainer info to delete
  const [successMessageContent, setSuccessMessageContent] = useState('');
  const navigate = useNavigate();
    const [empId, setEmpId] = useState('');  
    const [empName, setEmpName] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [trainerType, setTrainerType] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);



  const rolePermissions = JSON.parse(sessionStorage.getItem("rolePermissions")) || {};
  const mastersPermissions = rolePermissions["Masters"] || {};
  const Permissions = mastersPermissions["Trainer Info"] || {};
    const canEdit = Permissions["View/Create/Edit"] === 1;

// Open dialog for adding or editing
const handleAddUserRole = (role = null) => {
  let mode;

  if (role) {
    // Editing mode
    setIsEditMode(true);
    setEmpId(role.empId);
    setEmpName(role.empName);
    setSelectedRoles(role.assignedRoles || []);
    mode = "Edit Mode";  // ✅ Store mode immediately
  } else {
    // Adding new role (reset form)
    setIsEditMode(false);
    setEmpId("");
    setEmpName("");
    setSelectedRoles([]);
    mode = "Assign Mode"; // ✅ Store mode immediately
  }

  console.log("Dialog opened in:", mode); // ✅ Now logs correctly
  setOpenAddDialog(true);
};
const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
      if (!userDetails.emp_id || !userDetails.empname) {
        throw new Error("User is not logged in. Please log in to proceed.");
      }
  
  // Fetching trainer info from the API
  const fetchtrainerInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/training-master/TrainerInfoMaster/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}) // Empty body as no parameters are required
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Sample ALL Value List start", data);
  
      if (data && Array.isArray(data.trainers)) {
        console.log("Sample ALL Value List end", data);
        const structuredData = data.trainers.map((item, index) => ({
          trinfo_id:item.trinfo_id,
          emp_id: item.emp_id,
          SLNO: index + 1,
          full_name: item.full_name || 'N/A',
          mobile_number: item.mobile_number || 'N/A',
          email: item.email || 'N/A',
          trainer_type: item.trainer_type || 'N/A',
          vendor_code: item.vendor_code || 'N/A',
          company_name: item.company_name || 'N/A',
          location: item.location|| 'N/A',
          Location:item.location ||'N/A',
          specialization:item.specialization ||'N/A',
          user_name: item.user_name || 'Unknown',
          user_created_time: new Date(item.user_created_time).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }) || 'N/A',
        }));
  
        settrainerInfo(structuredData); // Assuming `settrainerInfo` updates the state or UI
      } else {
        console.error('Unexpected API response format:', data);
      }
    } catch (error) {
      console.error('Error fetching trainer info:', error);
    }
  };
  

  useEffect(() => {
    fetchtrainerInfo();  // Initially fetch data when component mounts
  }, []);



  const handleBackClick = () => {
    window.history.back(); // Goes back to the previous page
  };
  


  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
 


  const [employeeData, setEmployeeData] = React.useState([]); // Stores all employees from the API
const [selectedEmployee, setSelectedEmployee] = React.useState(null); // Stores the selected employee
const [empCode, setEmpCode] = React.useState(""); // Stores the typed Emp Code
const [mobileNumber, setMobileNumber] = React.useState(""); // Editable mobile number

const handleEmpCodeChange = (e) => {
  const typedCode = e.target.value;
  setEmpCode(typedCode);

  const employee = employeeData.find((emp) => emp.emp_id === typedCode);

  if (employee) {
    setSelectedEmployee(employee);
    setMobileNumber(employee.mobile_number || "");
  } else {
    setSelectedEmployee(null);
    setMobileNumber("");
  }
};


React.useEffect(() => {
  if (trainerType === "internal") {
    const fetchEmployeeData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/login/activeEmplList1`, {
          method: "POST", // Set the method to POST
          headers: {
            "Content-Type": "application/json", // Ensure JSON content type
          },
          body: JSON.stringify({
            // Add any required request body parameters here
          }),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        if (data.employees) {
          setEmployeeData(data.employees); // Update the state with employee data
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
      }
    };

    fetchEmployeeData();
  }
}, [trainerType]);

  const renderFields = () => {
    if (trainerType === "internal") {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Employee Code */}
          <TextField
            label="Emp Code"
            placeholder="Enter Employee Code"
            value={empCode}
            onChange={handleEmpCodeChange}
            required
            fullWidth
          />

          {/* Read-only Fields from selectedEmployee */}
          <TextField label="Trainer Name" value={selectedEmployee?.full_name || ""} InputProps={{ readOnly: true }} fullWidth />
          <TextField label="E-Mail ID" value={selectedEmployee?.email || ""} InputProps={{ readOnly: true }} fullWidth />
          <TextField label="Branch" value={selectedEmployee?.branch_name || ""} InputProps={{ readOnly: true }} fullWidth />

          {/* Editable mobile number */}
          <TextField label="Mobile No." value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} fullWidth />
          <FormControl fullWidth margin="normal" variant="outlined">
            <InputLabel>Specialization</InputLabel>
            <Select
              value={selectedSkills || ""} // Ensure a default value
              onChange={(e) => setSelectedSkills(e.target.value)} // Store the selected skill
              label="Specialization"
            >
              <MenuItem value="" disabled>Select Specialization</MenuItem>

              {/* Skills Options */}
              {["Professional Development", "Leadership", "Technical Training"].map((skill) => (
                <MenuItem key={skill} value={skill}>
                  {skill}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

        </Box>
      );
    } else if (trainerType === "external") {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Trainer Name" placeholder="Enter Trainer Name" required fullWidth onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
          <TextField label="Mobile No." placeholder="Enter Mobile No." required fullWidth onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })} />
          <TextField label="Vendor Code" placeholder="Enter Vendor Code" required fullWidth onChange={(e) => setFormData({ ...formData, vendor_code: e.target.value })} />
          <TextField label="E-Mail ID" placeholder="Enter Email Address" required fullWidth onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <TextField label="Company Name" placeholder="Enter Company Name" required fullWidth onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} />
          <TextField label="Location" placeholder="Enter Location" required fullWidth onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
          <FormControl fullWidth margin="normal" variant="outlined" padding="0px">
          <InputLabel>Specialization</InputLabel>
          <Select
            value={selectedSkills || ""} // Ensure a default value
            onChange={(e) => setSelectedSkills(e.target.value)} // Store the selected skill
            label="Specialization"
          >
            <MenuItem value="" disabled>Select Specialization</MenuItem>

            {/* Skills Options */}
            {["Professional Development", "Leadership", "Technical Training"].map((skill) => (
              <MenuItem key={skill} value={skill}>
                {skill}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        </Box>
      );
    }
    return null;
  };


  const [formData, setFormData] = useState({
    empCode:'',
    full_name: '',
    mobile_number: '',
    email: '',
    vendor_code: '',
    company_name: '',
    location: '',
    skills: '',
  });



  const handleSubmitTrainerInfo = async () => {
    try {
      const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
  
      if (!userDetails.emp_id || !userDetails.empname) {
        throw new Error("User is not logged in. Please log in to proceed.");
      }
  
      if (!trainerType) {
        throw new Error("Trainer Type is not selected.");
      }
  
      // Use selectedEmployee for internal trainers, formData for external trainers
      const trainerName = trainerType === "internal" ? selectedEmployee?.full_name || "" : formData.full_name;
      const trainerMobile = trainerType === "internal" ? selectedEmployee?.mobile_number || "" : formData.mobile_number;
      const trainerEmail = trainerType === "internal" ? selectedEmployee?.email || "" : formData.email;
      const trainerBranch = trainerType === "internal" ? selectedEmployee?.branch_name || "" : formData.branch;
  
      // Validation
      const requiredFields = [
        { label: "Trainer Name", value: trainerName },
        { label: "Mobile Number", value: trainerMobile },
        { label: "Email Address", value: trainerEmail },
      ];
  
      if (trainerType === "external") {
        requiredFields.push(
          { label: "Company Name", value: formData.company_name },
          { label: "Location", value: formData.location },
          { label: "Vendor Code", value: formData.vendor_code }
        );
      } else if (trainerType === "internal") {
        requiredFields.push(
          { label: "Employee Code", value: selectedEmployee?.emp_id || "" },
          { label: "Branch", value: trainerBranch }
        );
      }
  
      for (const field of requiredFields) {
        if (!field.value) {
          throw new Error(`${field.label} is required.`);
        }
      }
  
      // Construct API request
      const requestBody = {
        emp_id: trainerType === "internal" ? selectedEmployee?.emp_id || null : null,
        trainer_type: trainerType,
        trainerName,
        phoneNumber: trainerMobile,
        mailId: trainerEmail,
        companyName: trainerType === "external" ? formData.company_name : null,
        location: trainerType === "internal" ? trainerBranch : formData.location, // Unified field
        vendor_code: trainerType === "external" ? formData.vendor_code : null,
        specialization: selectedSkills,
        user_created_by: userDetails.emp_id,
        user_name: userDetails.empname,
      //  branch: trainerType === "internal" ? trainerBranch : null,
      };
  
      console.log("Submitting Data:", requestBody);
  
      const response = await fetch(`${API_BASE_URL}/training-master/TrainerInfoMaster/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
  
      if (response.ok) {
        console.log("Trainer info added successfully.");
        await fetchtrainerInfo();
        setOpenAddDialog(false);
  
        // Reset form
        setSelectedEmployee(null);
        setTrainerType("");
        setEmpCode("");
        setMobileNumber("");
        setSelectedSkills([]);
        setFormData({
          full_name: "",
          mobile_number: "",
          email: "",
          vendor_code: "",
          company_name: "",
          location: "",
          branch: "",
        });
        setSnackbar({ open: true, message: "Trainer added successfully!", severity: "success" });

      } else {
        throw new Error("Failed to add trainer info. Please try again.");
        
      }
    } catch (error) {
      console.error("Error adding trainer info:", error);
      setSnackbar({ open: true, message:error.message, severity: "error" });

    }
  };
  


  const handleDeleteClick = (trainer) => {
    setTrainerToDelete(trainer); // Store the trainer info to be deleted
    setOpenDeleteDialog(true); // Open the confirmation dialog
  };
 
// Function to handle the actual deletion
const handleDeleteTrainer = async (trainer) => {
  try {
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};

    if (!userDetails?.emp_id || !userDetails?.empname) {
      throw new Error("User is not logged in. Please log in to proceed.");
    }

    if (!trainer || !trainer.email) {
      throw new Error("Invalid trainer data. Please select a valid trainer.");
    }

    const payload = {
      user_created_by: userDetails.emp_id,
      user_name: userDetails.empname,
      trinfo_id: trainer.trinfo_id,
    };

    const response = await fetch(`${API_BASE_URL}/training-master/TrainerInfoMaster/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorMessage = await response.text();     
      setSnackbar({ open: true, message: errorMessage.message||"Failed to delete trainer. Please try again.", severity: "error" });

      return;
    }

    const result = await response.json();
    console.log('Trainer deleted successfully:', result);
    await fetchtrainerInfo(); // Refresh trainer info
    setSnackbar({ open: true, message: "Trainer deleted successfully!", severity: "success" });

    
  } catch (error) {
    console.error('Error deleting trainer:', error.message);  
    setSnackbar({ open: true, message: error.message, severity: "error" });

    setSnackbar({
      open: true,
      message: 'An error occurred while deleting the trainer.',
      severity: 'error',
    });
  }
};

const handleCancelDialog = () => {
  setOpenAddDialog(false); // Close the dialog
  setTrainerType(""); // Reset the trainer type
  setSelectedSkills([]); // Clear selected skills
  setNewTrainerInfo(""); // Reset new trainer info

  // Reset form data
  setFormData({
    empId: "",
    full_name: "",
    mobile_number: "",
    email: "",
    vendor_code: "",
    company_name: "",
    location: "",
    branch: "",
    skills: "",
    specialization: [], // Clear selected skills in formData if needed
  });

  // Reset employee-related states
  setEmpCode(""); // Clear Emp Code input
  setSelectedEmployee(null); // Reset selected employee
  setMobileNumber(""); // Clear mobile number
};

const handleCloseSnackbar = () => {
  setSnackbar({ ...snackbar, open: false });
};

const handleViewClick = (trainer) => {
  console.log("Selected Trainer Data handleViewClick:", trainer); // Debugging line

  setSelectedTrainer({
    ...trainer,
    specialization: Array.isArray(trainer.specialization) 
      ? trainer.specialization 
      : trainer.specialization 
        ? trainer.specialization.split(',').map(skill => skill.trim()) 
        : [], // Ensure it's always an array
  });

  setOpenViewDialog(true);
};

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
  };
// Function to handle the edit button click
     const handleEditClick = (trainer) => {
      console.log("Selected Trainer Data:", trainer); 
      console.log("Trainer Type:", trainer.trainer_type); 
    
      setSelectedTrainer({
        ...trainer,
        specialization: trainer.specialization 
          ? (Array.isArray(trainer.specialization) 
              ? trainer.specialization 
              : String(trainer.specialization).split(',').map(skill => skill.trim())
            )
          : [], // Ensuring it's always an array
      });
    
      if (trainer.trainer_type === 'internal') {
        console.log("Internal Trainer Selected");
        setEditTrainerDetails({
          trinfo_id:trainer.trinfo_id||'',
          emp_id:trainer.emp_id||'',
          trainer_type:trainer.trainer_type||'',
          full_name: trainer.full_name || '',
          mobile_number: trainer.mobile_number || '',
          email: trainer.email || '',
          location: trainer.location || '',
          specialization: trainer.specialization || [],
        });
      } else {
        console.log("External Trainer Selected");
        setEditTrainerDetails({
          trinfo_id:trainer.trinfo_id||'',
          trainer_type:trainer.trainer_type||'',
          full_name: trainer.full_name || '',
          mobile_number: trainer.mobile_number || '',
          email: trainer.email || '',
          vendor_code: trainer.vendor_code || '',
          company_name: trainer.company_name || '',
          location: trainer.location || '',
          specialization: trainer.specialization || [],
        });
      }    
      setOpenEditDialog(true);
    };
    
    
  // Function to handle changes in input fields
  const handleChange = (field, value) => {
    setEditTrainerDetails((prevDetails) => ({
      ...prevDetails,
      [field]: field === "specialization" ? [value] : value, // Store specialization as an array
    }));
  };
  
  console.log("Data to Submit:", editTrainerDetails); // Debugging Line

  // Function to submit the updated trainer details
  const handleSubmitEditTrainerInfo = async () => {
    try {
        const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
        if (!userDetails.emp_id || !userDetails.empname) {
            throw new Error("User is not logged in. Please log in to proceed.");
        }

        // Log the data being sent in the request body
        const requestBody = {
          trinfo_id:editTrainerDetails.trinfo_id,
          emp_id:editTrainerDetails.emp_id,
          trainer_type:editTrainerDetails.trainer_type,
          trainerName: editTrainerDetails.full_name, // Updated name
            phoneNumber: editTrainerDetails.mobile_number,
            //mailId: selectedTrainer.email, // Original email for reference
            mailId: editTrainerDetails.email, // Updated email
            vendor_code: editTrainerDetails.vendor_code || '',
            companyName: editTrainerDetails.company_name || '',
            location: editTrainerDetails.location,
            specialization: editTrainerDetails.specialization,
            user_created_by: userDetails.emp_id || '',
            user_name: userDetails.empname || '',
        };

        console.log("Request Body handleSubmitEditTrainerInfo:", JSON.stringify(requestBody, null, 2)); // Log the request body in a readable format

        const response = await fetch(`${API_BASE_URL}/training-master/TrainerInfoMaster/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Trainer details updated successfully:', result);
            await fetchtrainerInfo();
            setOpenEditDialog(false);
            setSuccessMessageContent('Trainer details updated successfully!');
            setSuccessMessageOpen(true);
        } else {
            console.error('Failed to update trainer details:', response.statusText);
            alert('Failed to update trainer details. Please try again.');
        }
    } catch (error) {
        console.error('Error updating trainer details:', error);
        alert('An error occurred while updating the trainer details. Please try again.');
    }
};

  const filteredtrainerInfo = trainerInfo.filter((trainer) => {
    const searchLower = searchText.toLowerCase();
    console.log("Trainer in Filter:", trainer); // Debugging Line
    return (
      trainer.SLNO.toString().includes(searchLower) ||
      trainer.full_name?.toLowerCase().includes(searchLower) ||
      trainer.email?.toLowerCase().includes(searchLower) ||  
      trainer.specialization?.toLowerCase().includes(searchLower) ||
      trainer.user_name?.toLowerCase().includes(searchLower) 
    );
  });
  console.log("Filtered Trainer Info:", filteredtrainerInfo);
  

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
                Trainer Info
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
                        Add Trainer Info
                      </Button>
                    )}
                  </Tooltip>
                
            </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" gap={2}>
            <Box display="flex" gap={2}>
              <Tooltip title="Export to Excel">
                <Button onClick={() => exportData(trainerInfo, 'Trainer_info_List', 'excel')}  sx={{ 
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
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <Table sx={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>           
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#e2e8f0' }}>
                    <TableCell sx={{ fontWeight: 'bold', padding: '4px',width: '80px', minWidth: 50, fontSize: '1.02rem' }}>SLNO</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', padding: '4px', minWidth: 50, fontSize: '1.02rem' }}>Trainer Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', padding: '4px',width: '300px', minWidth: 50, fontSize: '1.02rem' }}>E-Mail ID</TableCell>                 
                    <TableCell sx={{ fontWeight: 'bold', padding: '4px',width: '250px', minWidth: 50, fontSize: '1.02rem' }}>Specialization</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', padding: '4px',width: '100px', fontSize: '1.02rem' }}>Created By</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', padding: '4px', minWidth: 50, fontSize: '1.02rem' }}>Created On</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', padding: '4px', textAlign: 'center', minWidth: 80, fontSize: '1.02rem' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredtrainerInfo
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((trainer) => (
                      <TableRow key={trainer.emp_id} hover sx={{ '& td': { padding: '4px', fontSize: '1.00rem' } }}>
                        <TableCell>{trainer.SLNO}</TableCell>
                        <TableCell>{trainer.full_name}</TableCell>
                        <TableCell sx={{ padding: '4px', minWidth: 250, maxWidth: 300, wordBreak: 'break-word' }}>
                          {trainer.email}
                        </TableCell>
                        <TableCell sx={{ padding: '4px', minWidth: 100 }}>
                          <Tooltip 
                            title={trainer.specialization ? trainer.specialization : "No specialization"} 
                            arrow
                          >
                            <span>
                              {trainer.specialization ? trainer.specialization : "N/A"}
                            </span>
                          </Tooltip>
                        </TableCell>                    
                        <TableCell>{trainer.user_name}</TableCell>
                        <TableCell>{trainer.user_created_time}</TableCell>
                        <TableCell align="center">
                        <Tooltip title="View">
                          <IconButton onClick={() => handleViewClick(trainer)}>
                            <FiEye className="view-button" />
                          </IconButton>
                          </Tooltip>
                          {canEdit && (
                             <>
                             <Tooltip title="Edit">
                              <IconButton onClick={() => handleEditClick(trainer)}>
                                <EditIcon className="edit-button" />
                              </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                              <IconButton onClick={() => handleDeleteClick(trainer)}>
                                <Trash2Icon className="delete-button" />
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
            rowsPerPageOptions={[10, 25, 100]}
            component="div"
            count={filteredtrainerInfo.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>        
      </div>

      {/* adding new trainer info */}
<Dialog open={openAddDialog} onClose={handleCancelDialog} maxWidth="sm" fullWidth>
  <DialogTitle>Add Trainer Info</DialogTitle>

  <DialogContent dividers sx={{ maxHeight: '65vh', overflowY: 'auto', padding: '16px' }}>
    <FormControl fullWidth margin="normal" variant="outlined">
      <InputLabel id="trainer-type-label">Trainer Type</InputLabel>
      <Select
        labelId="trainer-type-label"
        value={trainerType}
        onChange={(e) => setTrainerType(e.target.value)}
        label="Trainer Type"
      >
        <MenuItem value="" disabled>Select Trainer Type</MenuItem>
        <MenuItem value="internal">Internal Trainer</MenuItem>
        <MenuItem value="external">External Trainer</MenuItem>
      </Select>
    </FormControl>

    {renderFields()}

     </DialogContent>

  <DialogActions sx={{ justifyContent: 'center', padding: '12px 24px' }}>
    <Button
      onClick={handleCancelDialog}
      color="secondary"
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

    <Button
      onClick={handleSubmitTrainerInfo}
      color="primary"
      sx={{
        backgroundColor: '#1A005D',
        color: 'white',
        '&:hover': { backgroundColor: '#3105a3' },
        borderRadius: 2,
        padding: '8px 16px',
        textTransform: 'none',
      }}
    >
      Save
    </Button>
  </DialogActions>
</Dialog>

      
      {/* edit Dialog */}
<Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
  <DialogContent dividers sx={{ maxHeight: '70vh', overflowY: 'auto', padding: '16px' }}>
    {Object.keys(editTrainerDetails).map((field) => {
      console.log("Rendering Field:", field);

      const readOnlyFields = ['trinfo_id', 'emp_id', 'trainer_type', 'full_name', 'location'];

      return field === "specialization" ? ( // Show dropdown for specialization
        <FormControl key={field} fullWidth margin="dense">
  <InputLabel>Specialization</InputLabel>
  <Select
    value={editTrainerDetails.specialization || ""} // Ensure it's properly set
    onChange={(e) => handleChange(field, e.target.value)} // Store selection as a string
    label="Specialization"
  >
    {/* Show the saved specialization first */}
    {editTrainerDetails.specialization && (
      <MenuItem key="saved" value={editTrainerDetails.specialization}>
        {editTrainerDetails.specialization}
      </MenuItem>
    )}

    {/* Show all other available specializations, excluding the already selected one */}
    {["Professional Development", "Leadership", "Technical Training"]
      .filter((option) => option !== editTrainerDetails.specialization) // Avoid duplicate
      .map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
  </Select>
</FormControl>


      ) : (
        <TextField
          key={field}
          autoFocus={field === 'full_name'}
          margin="dense"
          label={field.replace(/_/g, ' ').toUpperCase()}
          type="text"
          fullWidth
          variant="outlined"
          value={editTrainerDetails[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          disabled={readOnlyFields.includes(field)}
        />
      );
    })}
  </DialogContent>

  <DialogActions>
    <Button
      onClick={() => setOpenEditDialog(false)}
      sx={{
        backgroundColor: '#e0e0e0',
        color: '#424242',
        textTransform: 'none',
        fontWeight: 'bold',
        padding: '8px 16px',
        borderRadius: '8px',
        '&:hover': { backgroundColor: '#d6d6d6' },
      }}
    >
      Cancel
    </Button>
    <Button
      onClick={handleSubmitEditTrainerInfo}
      sx={{
        backgroundColor: '#1976d2',
        color: '#fff',
        textTransform: 'none',
        fontWeight: 'bold',
        padding: '8px 16px',
        borderRadius: '8px',
        '&:hover': { backgroundColor: '#1565c0' },
      }}
    >
      Update
    </Button>
  </DialogActions>
</Dialog>


<Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="sm" fullWidth>
  <DialogTitle sx={{ backgroundColor: "#1A005D", color: "white", textAlign: "center", fontWeight: "bold" }}>
    Trainer Details
  </DialogTitle>

  <DialogContent dividers sx={{ maxHeight: "70vh", overflowY: "auto", padding: "24px" }}>
    {selectedTrainer ? (
      <Card sx={{ padding: "16px", boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1A005D" }}>
              {selectedTrainer.full_name}
            </Typography>

            <Divider />

            <Stack direction="row" spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#333" }}>Trainer Type:</Typography>
              <Typography variant="subtitle1" sx={{ color: "#555" }}>{selectedTrainer.trainer_type}</Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#333" }}>Location:</Typography>
              <Typography variant="subtitle1" sx={{ color: "#555" }}>{selectedTrainer.location}</Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#333" }}>Contact:</Typography>
              <Typography variant="subtitle1" sx={{ color: "#555" }}>{selectedTrainer.mobile_number}</Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#333" }}>Email:</Typography>
              <Typography variant="subtitle1" sx={{ color: "#555" }}>{selectedTrainer.email}</Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#333" }}>Specialization:</Typography>
              <Typography variant="subtitle1" sx={{ color: "#555" }}>
                {Array.isArray(selectedTrainer.specialization) && selectedTrainer.specialization.length > 0
                  ? selectedTrainer.specialization.join(", ")
                  : "N/A"}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    ) : (
      <Typography textAlign="center" color="error">No trainer selected</Typography>
    )}
  </DialogContent>

  <DialogActions sx={{ justifyContent: "center", padding: "12px 24px" }}>
    <Button
      onClick={handleCloseViewDialog}
      sx={{
        backgroundColor: "orange",
        color: "black",
        '&:hover': { backgroundColor: "#FFBF00" },
        borderRadius: 2,
        padding: "8px 16px",
        textTransform: "none",
      }}
    >
      Close
    </Button>
  </DialogActions>
</Dialog>



     {/* Delete confirmation dialog*/} 
    <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', color: '#1976d2' }}>
        Confirm Deletion
      </DialogTitle>
      <DialogContent sx={{ width: '500px', height: '70px', padding: '8px' }}>
        <Typography variant="body1">
          Do you want to proceed with deleting the trainer information for "{trainerToDelete?.full_name}"?
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
            await handleDeleteTrainer(trainerToDelete); // Call the delete function
            setOpenDeleteDialog(false); // Close the dialog after deletion
          }}
          sx={{
            backgroundColor: '#d32f2f', // Red color for confirmation
            color: '#fff',
            textTransform: 'none',
            fontWeight: 'bold',
            padding: '8px 16px',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: '#b71c1c', // Darker red on hover
            },
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>;


      {/* Success Message Snackbar */}
      <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} // Ensure it closes properly
          TransitionComponent={(props) => <Slide {...props} direction="up" />}
          anchorOrigin={{ vertical: "center", horizontal: "center" }}
        >

          <Alert
           severity={snackbar.severity}
           sx={{
             backgroundColor:
               snackbar.severity === "success" ? "#4CAF50" : "#D32F2F",
             color: "#fff",
             padding: "14px 28px",
             fontWeight: "600",
             textAlign: "center",
             borderRadius: "12px",
             boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
             minWidth: "320px",
             fontFamily: "Roboto, sans-serif",
             letterSpacing: "0.5px",
           }}
         >
           {snackbar.message}
         </Alert>
       </Snackbar>

    </div>
  );
}
// If you're using default export
export default TrainerInfoMaster;
