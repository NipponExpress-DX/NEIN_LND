import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
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
  FormControl,
  InputLabel,
  MenuItem,
  Select,


} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { FiEye } from 'react-icons/fi';
import { FaRegEdit } from 'react-icons/fa';
import { MdDeleteForever } from 'react-icons/md';
import '../../../../css/Admincss/masters/TrainerTypeMaster.css';
import Autocomplete from '@mui/material/Autocomplete';
import { Trash2Icon, EditIcon,FileTextIcon, PlusCircleIcon,DownloadIcon } from 'lucide-react';
import { Tooltip } from '@mui/material';



function TrainerTopicMaster() {
  const [TrainingTopics, setTrainingTopics] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openAddDialog, setOpenAddDialog] = useState(false); // Separate state for Add dialog
  const [openViewDialog, setOpenViewDialog] = useState(false); // Separate state for View dialog
  const [newTrainingTopics, setNewTrainingTopics] = useState('');
  const [successMessageOpen, setSuccessMessageOpen] = useState(false);
  const [selectedTrainingTopics, setSelectedTrainingTopics] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false); // State for confirmation dialog
  const [TrainingTopicsToDelete, setTrainingTopicsToDelete] = useState(null); // State to store the trainer type to delete
  const [successMessageContent, setSuccessMessageContent] = useState('');
  const navigate = useNavigate();
  const [selectedDept, setSelectedDept] = useState('');
  const [departmentList, setDepartmentList] = useState([]);
  const [topicToDelete, setTopicToDelete] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    // Add a new state for edit dialog and selected trainer for editing
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editTrainingTopics, setEditTrainingTopics] = useState('');
    const [editTrainingDept, setEditTrainingDept] = useState("");
    const [errors, setErrors] = useState({ department: false, topic: false });
    const [filterDept, setFilterDept] = useState('');
    const uniqueDepts = [...new Set(TrainingTopics.map(topic => topic.department_name).filter(Boolean))].sort();
    const rolePermissions = JSON.parse(sessionStorage.getItem("rolePermissions")) || {};
    const mastersPermissions = rolePermissions["Masters"] || {};
    const Permissions = mastersPermissions["Training Topic"] || {};
    
    const canEdit = Permissions["View/Create/Edit"] === 1;
   

    const exportData = (data, fileName, fileType) => {
      // Define the columns and data for the Excel file
      const formattedData = data.map(item => ({
        SLNO: item.SLNO,
        Department: item.department_name,
        'Training Topic': item.training_topic,
        'Created By': item.user_name,
        'Created Time': item.user_created_time
      }));
    
      // Create a new worksheet from the formatted data
      const ws = XLSX.utils.json_to_sheet(formattedData);
    
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Training Topics');
    
      // Generate the Excel file and trigger the download
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    };
    
  // Fetching Training Topics from the API
  const fetchTrainingTopics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/training-master/topic/list`);
      const data = await response.json();
      console.log("topic list",response.data);
      
         if (data && Array.isArray(data.topics)) {
        const structuredData = data.topics.map((item, index) => ({
          id: item.id,
          SLNO: index + 1,
          department_name: item.department_name ,
          training_topic: item.training_topic || 'N/A',
          user_name: item.user_name || 'Unknown',
          user_created_time: new Date(item.user_created_time).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) || 'N/A',
        }));
        setTrainingTopics(structuredData);
      } else {
        console.error('Unexpected API response format:', data);
      }
    } catch (error) {
      console.error('Error fetching Training Topics:', error);
    }
  }; 


  useEffect(() => {
    fetchTrainingTopics();  // Initially fetch data when component mounts
  }, []);
  useEffect(() => {
    fetchDepartments();  // Fetch department list when component mounts
  }, []);

  // Fetch department list when component mounts
  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/training-master/department/list`);
      const data = await response.json();
      console.log('Fetched data:', data); // Log the entire response to see the structure
  
      // Ensure that 'Training Topics' is an array and contains the department objects
      if (data && Array.isArray(data.topics)) {
        const withAll = [
        { department_name: 'All Departments' },
        ...data.topics
      ];
      setDepartmentList(withAll);
        console.log('Department List:', data.topics); // Log the full department list
      } else {
        console.error('Unexpected response format:', data);
      }
    } catch (error) {
      console.error('Error fetching department list:', error);
    }
  };
  

  const handleAddTrainingTopics = () => {
    setOpenAddDialog(true);  // Open Add dialog
  };
// admindashboard/setup Master page go back
  const handleBackClick = () => {
    navigate('/admindashboard/setup');
  }
  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  // Adding Training topic 
  const handleSubmitTrainingTopics = async () => {
    console.log("Adding started");
  
    try {
      const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
  
      // Ensure user is logged in
      if (!userDetails.emp_id || !userDetails.empname) {
        throw new Error("User is not logged in. Please log in to proceed.");
      }
  
      console.log("User ID:", userDetails.emp_id);
      console.log("User Name:", userDetails.empname);
  
      // Check if a department is selected and training topic is provided
      if (!selectedDept || !newTrainingTopics.trim()) {
        setErrors({
          department: !selectedDept,
          topic: !newTrainingTopics.trim(),
        });
        return;
      }
  
      console.log("Selected Department:", selectedDept);
      console.log("New Training Topic:", newTrainingTopics);
  
      // API request to add training topic
      const response = await fetch(`${API_BASE_URL}/training-master/topic/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          department_name: selectedDept,
          topic: newTrainingTopics,
          userid: userDetails.emp_id,
          userName: userDetails.empname,
        }),
      });
  
      if (response.ok) {
        const result = await response.json();
        console.log('Training topic added successfully:', result);
  
        await fetchTrainingTopics(); // Fetch updated list
        setOpenAddDialog(false);
        setNewTrainingTopics('');
        setErrors({ department: false, topic: false });
  
        setSuccessMessageContent('Training Topic added successfully!');
        setSuccessMessageOpen(true);
      } else {
        console.error('Failed to add Training Topic:', response.statusText);
        alert('Failed to add training topic. Please try again.');
      }
    } catch (error) {
      console.error('Error adding Training Topic:', error);
      alert('An error occurred while adding the Training Topic. Please try again.');
    }
  };
  

  const handleDeleteClick = (trainer) => {
    setTrainingTopicsToDelete(trainer); // Store the trainer type to be deleted
    setOpenDeleteDialog(true); // Open the confirmation dialog
  };
  // Function to handle the actual deletion
  const handleDeleteTrainer = async (trainer) => {
    try {
      const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
      if (!userDetails.emp_id || !userDetails.empname) {
        throw new Error("User is not logged in. Please log in to proceed.");
      }
  
      const response = await fetch(`${API_BASE_URL}/training-master/topic/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: trainer.training_topic,  // Send the topic (trainer type) to be deleted
          userid: userDetails.emp_id,    // Send the user ID who is performing the action
        }),
      });
  
      if (response.ok) {
        const result = await response.json();
        console.log('Trainer type deleted successfully:', result);
        await fetchTrainingTopics();
        setSuccessMessageContent('Trainer Type deleted successfully!');
        setSuccessMessageOpen(true);
      } else {
        console.error('Failed to delete trainer type:', response.statusText);
        alert('Failed to delete trainer type. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting trainer type:', error);
      alert('An error occurred while deleting the trainer type. Please try again.');
    }
  };
  
   // Function to handle the dialog cancel button click
   const handleCancelEditDialog = () => {
    // Reset values and close dialog
    setEditTrainingDept('');
    setEditTrainingTopics('');
    setErrors({ department: false, topic: false });
    setOpenEditDialog(false);
  };

  const handleCancelDialog = () => {
    // Reset all values and errors on cancel
    setSelectedDept('');
    setNewTrainingTopics('');
    setErrors({ department: false, topic: false });
    setOpenAddDialog(false);
  };

  const handleCloseSnackbar = () => {
    setSuccessMessageOpen(false);
  };

  const handleViewClick = (trainer) => {
    setSelectedTrainingTopics(trainer);
    setOpenViewDialog(true); // Open View dialog with selected trainer's details
  };


      // Function to handle the edit button click
      const handleEditClick = (trainer) => {
        setSelectedTrainingTopics(trainer);
        setEditTrainingDept(trainer.department_name);
        setEditTrainingTopics(trainer.training_topic);
        setOpenEditDialog(true); // Open edit dialog
      };
      // Function to submit the updated trainer type
      const handleSubmitEditTrainingTopic = async () => {
        console.log("Editing started");
      
        try {
          const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
      
          // Ensure user is logged in
          if (!userDetails.emp_id || !userDetails.empname) {
            throw new Error("User is not logged in. Please log in to proceed.");
          }
      
          console.log("User ID:", userDetails.emp_id);
          console.log("User Name:", userDetails.empname);
      
          // Validate fields
          if (!editTrainingDept || !editTrainingTopics.trim()) {
            setErrors({
              department: !editTrainingDept,
              topic: !editTrainingTopics.trim(),
            });
            return;
          }
      
          console.log("Edited Department:", editTrainingDept);
          console.log("Edited Training Topic:", editTrainingTopics);
      
          // API request to update training topic
          const response = await fetch(`${API_BASE_URL}/training-master/topic/update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            // In the handleSubmitEditTrainingTopic function's fetch body:
              body: JSON.stringify({
                department_name: selectedTrainingTopics.department_name, // Original department
                updatedDepartment_name: editTrainingDept, // New department
                topic: selectedTrainingTopics.training_topic, // Original topic
                updatedTopic: editTrainingTopics, // New topic
                userid: userDetails.emp_id,
                userName: userDetails.empname,
              }),
          });
      
          if (response.ok) {
            const result = await response.json();
            console.log('Training topic updated successfully:', result);
      
            await fetchTrainingTopics(); // Refresh list
            setOpenEditDialog(false);
            setEditTrainingDept('');
            setEditTrainingTopics('');
            setErrors({ department: false, topic: false });
      
            setSuccessMessageContent('Training Topic updated successfully!');
            setSuccessMessageOpen(true);
          } else {
            console.error('Failed to update Training Topic:', response.statusText);
            alert('Failed to update training topic. Please try again.');
          }
        } catch (error) {
          console.error('Error updating Training Topic:', error);
          alert('An error occurred while updating the Training Topic. Please try again.');
        }
      };
      

      const filteredTrainingTopics = TrainingTopics.filter((topic) => {
        const searchLower = searchText.toLowerCase();
        const matchesSearch = (
          topic.SLNO.toString().includes(searchLower) ||
          topic.department_name?.toLowerCase().includes(searchLower) ||
          topic.training_topic?.toLowerCase().includes(searchLower) ||
          topic.user_name?.toLowerCase().includes(searchLower)
        );
        
        const matchesDept = filterDept ? topic.department_name === filterDept : true;
      
        return matchesSearch && matchesDept;
      });



 

  return (
    <div className="admin-dashboard-content">
      <div className="main-content">        
        <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center" 
                mb={3} 
                sx={{
                  backgroundColor: "#1A005D",
                  padding: "5px 10px",
                  borderRadius: "12px",
                  marginBottom: "9px",  
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                }}
              >

              <IconButton 
                onClick={() => navigate('/admindashboard/setup')}
                sx={{
                  backgroundColor: "white",
                  color: 'black ', // Merged the color property here
                  '&:hover': { backgroundColor: "#cbd5e1" },
                  borderRadius: "8px",
                  padding: "6px"
                }}
              >
                <ArrowBackIcon />
              </IconButton>

              <Typography 
            variant="h5" 
            sx={{ 
              color: 'white', 
              fontWeight: 'bold', 
              textAlign: 'center'  
            }}
          >
            Training Topic Master
          </Typography>
          <Tooltip title="Add topic">
              {console.log('canEdit:', canEdit) || canEdit && (
                <Button
                  variant="contained"
                  startIcon={<PlusCircleIcon />}
                  onClick={() => {
                    console.log('Add topic clicked');
                    handleAddTrainingTopics(true);
                  }}
                  sx={{
                    backgroundColor: "#8EC400",
                    '&:hover': { backgroundColor: "#7EB300" },
                    borderRadius: '8px'
                  }}
                >
                  Add topic
                </Button>
              )}
            </Tooltip>  
        </Box>
        {/* Search Bar */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
  {/* Export Buttons */}
  <Box sx={{ display: 'flex', gap: 1 }}>
    <Tooltip title="Export to Excel">
      <Button
        onClick={() => exportData(filteredTrainingTopics, 'Training_Topics_List', 'excel')}
        sx={{
          color: '#fff',
          backgroundColor: '#0ea5e9',
          borderRadius: '50%',
          minWidth: 40,
          height: 40,
          '&:hover': { backgroundColor: '#0284c7' },
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <DownloadIcon />
      </Button>
    </Tooltip>
  </Box>

  {/* Filter and Search Grouped */}
  <Box sx={{ display: 'flex', gap: 2 }}>
    <FormControl sx={{ width: '200px' }} size="small">
      <InputLabel>Filter by Dept</InputLabel>
      <Select
        value={filterDept}
        onChange={(e) => setFilterDept(e.target.value)}
        label="Filter by Dept"
        sx={{
          backgroundColor: 'white',
          borderRadius: 1,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1A005D' }
        }}
      >
        <MenuItem value="">
          All
        </MenuItem>
        {uniqueDepts.map((dept) => (
          <MenuItem key={dept} value={dept}>
            {dept}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    <TextField
      label="Search Topics"
      variant="outlined"
      size="small"
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      sx={{ width: '300px' }}
    />
  </Box>
</Box>

       <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#1A005D' }}>
              <TableRow>
                {['SL No.', 'Department', 'Trainer Topic', 'Created By', 'Created Time', 'Actions'].map((header) => (
                  <TableCell key={header} sx={{ 
                    fontWeight: 'bold', 
                    color: 'white', 
                    textAlign: header === 'Actions' ? 'center' : 'left',
                    padding: '2px',
                    fontSize: '1.03rem'
                  }}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>

              {filteredTrainingTopics.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((topic, index) => (
                          <TableRow 
                            key={topic.id} 
                            hover 
                            sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f8fafc' }, '&:nth-of-type(even)': { backgroundColor: '#e2e8f0' } }}
                          >
                            <TableCell sx={{ padding: '2px', fontSize: '1.03rem' }}>{index + 1}</TableCell>
                            <TableCell sx={{ padding: '2px', fontSize: '1.03rem' }}>{topic.department_name}</TableCell>
                            <TableCell sx={{ padding: '2px', fontSize: '1.03rem' }}>{topic.training_topic}</TableCell>
                            <TableCell sx={{ padding: '2px', fontSize: '1.03rem' }}>{topic.user_name}</TableCell>
                            <TableCell sx={{ padding: '2px', fontSize: '1.03rem' }}>{topic.user_created_time}</TableCell>
                           
                            <TableCell sx={{ textAlign: 'center', padding: '2px' }}>
                            {canEdit && (
                              <> <Tooltip title="Edit">
                                  <IconButton onClick={() => handleEditClick(topic)} sx={{ color: '#1976d2' }}>
                                    <EditIcon size={20} />
                                  </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                  <IconButton 
                                    onClick={() => handleDeleteClick(topic)} // Use the proper handler
                                    sx={{ color: '#d32f2f' }}
                                  >
                                    <Trash2Icon size={20} />
                                  </IconButton>
                                  </Tooltip>
                                  </>
                              )}
                            </TableCell>
                            
                          </TableRow>
                        ))}
            </TableBody>
            {/* Add this after the TableBody in your JSX */}
        
            
        
          </Table>
        </TableContainer>
        <TablePagination
                  rowsPerPageOptions={[10, 25, 100]}
                  component="div"
                  count={filteredTrainingTopics.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(+e.target.value);
                    setPage(0);
                  }}
                />

        
      </div>


          {/* Add New Training Topic Dialog */}
          <Dialog 
          open={openAddDialog} 
          onClose={handleCancelDialog} 
          fullWidth 
          maxWidth="sm"
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 3,
              width: '600px !important',
              height: '250px !important',
              padding: '1px',
              maxHeight: '80vh',
              overflow: 'visible'
            }
          }}
        >
          <DialogTitle 
            sx={{ 
              fontWeight: 'bold', 
              color: '#1A005D', 
              textAlign: 'center', 
              paddingBottom: '8px'
            }}
          >
            Add Training Topic
          </DialogTitle>

          <DialogContent sx={{ padding: 3, overflow: 'visible', width: '600px', height: '130px' }}>
            {/* Department Dropdown */}
            <Autocomplete
              options={departmentList}
              getOptionLabel={(option) => option.department_name}
              value={selectedDept ? { department_name: selectedDept } : null}
              onChange={(event, newValue) => {
                setSelectedDept(newValue ? newValue.department_name : '');
                setErrors((prev) => ({ ...prev, department: false }));
              }}
              sx={{ marginBottom: '16px' }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Department"
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  error={errors.department}
                  
                  sx={{
                    backgroundColor: 'white',
                    borderRadius: 1,
                    fontSize: '0.85rem',
                    '& .MuiOutlinedInput-root': { height: '45px' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: errors.department ? 'red' : '#1A005D' },
                    '& .MuiInputBase-input': { padding: '8px 10px !important' }
                  }}
                />
              )}
            />

            {/* Training Topic Input */}
            <TextField
              autoFocus
              margin="dense"
              label="Training Topic"
              type="text"
              fullWidth
              variant="outlined"
              value={newTrainingTopics}
              onChange={(e) => {
                setNewTrainingTopics(e.target.value);
                setErrors((prev) => ({ ...prev, topic: false }));
              }}
              error={errors.topic}
              
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 1, height: '42px' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: errors.topic ? 'red' : '#1A005D' },
                '& .MuiInputBase-input': { padding: '10px', fontSize: '0.85rem' },
              }}
            />
          </DialogContent>

          <DialogActions sx={{ justifyContent: 'center', padding: '12px' }}>
            <Button
              onClick={handleCancelDialog}
              sx={{
                backgroundColor: 'orange',
                color: 'black',
                fontSize: '0.8rem',
                padding: '8px 14px',
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { backgroundColor: '#FFBF00' },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitTrainingTopics}
              variant="contained"
              sx={{
                backgroundColor: '#1A005D',
                color: 'white',
                fontSize: '0.8rem',
                padding: '8px 14px',
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { backgroundColor: '#1A005F' },
              }}
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>


      {/* View Training Topic Details Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', color: '#1976d2' }}>
          Training Topic Details
        </DialogTitle>
        <DialogContent>
          {selectedTrainingTopics && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                padding: '16px 24px',
                borderRadius: '8px',
                backgroundColor: '#f5f5f5',
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              {/* Department Name */}
              <Box display="flex" alignItems="center">
                <Typography
                  variant="body1"
                  sx={{
                    flex: '0 0 200px',
                    textAlign: 'right',
                    paddingRight: '10px',
                    fontWeight: 'bold',
                    color: '#424242',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  Department Name : 
                </Typography>
                <Typography variant="body1" sx={{ color: '#616161' }}>
                  {selectedTrainingTopics.department_name}
                </Typography>
              </Box>

              {/* Training Topic */}
              <Box display="flex" alignItems="center">
                <Typography
                  variant="body1"
                  sx={{
                    flex: '0 0 200px',
                    textAlign: 'right',
                    paddingRight: '10px',
                    fontWeight: 'bold',
                    color: '#424242',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  Training Topic        : 
                </Typography>
                <Typography variant="body1" sx={{ color: '#616161' }}>
                  {selectedTrainingTopics.training_topic}
                </Typography>
              </Box>

              {/* Created By */}
              <Box display="flex" alignItems="center">
                <Typography
                  variant="body1"
                  sx={{
                    flex: '0 0 200px',
                    textAlign: 'right',
                    paddingRight: '10px',
                    fontWeight: 'bold',
                    color: '#424242',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  Created By             : 
                </Typography>
                <Typography variant="body1" sx={{ color: '#616161' }}>
                  {selectedTrainingTopics.user_name}
                </Typography>
              </Box>

              {/* Created Time */}
              <Box display="flex" alignItems="center">
                <Typography
                  variant="body1"
                  sx={{
                    flex: '0 0 200px',
                    textAlign: 'right',
                    paddingRight: '10px',
                    fontWeight: 'bold',
                    color: '#424242',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  Created Time         : 
                </Typography>
                <Typography variant="body1" sx={{ color: '#616161' }}>
                  {selectedTrainingTopics.user_created_time}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenViewDialog(false)}
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
            Close
          </Button>
        </DialogActions>
      </Dialog>


            

      {/* Edit Trainer Topic Details Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={handleCancelEditDialog} 
        fullWidth 
        maxWidth="sm"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            width: '600px !important',
            height: '250px !important',
            padding: '1px',
            maxHeight: '80vh',
            overflow: 'visible'
          }
        }}
      >
        {/* Title */}
        <DialogTitle 
          sx={{ 
            fontWeight: 'bold', 
            color: '#1A005D', 
            textAlign: 'center', 
            paddingBottom: '8px'
          }}
        >
          Edit Training Topic
        </DialogTitle>

        <DialogContent sx={{ padding: 3, overflow: 'visible', width: '600px', height: '130px' }}>
          {/* Department Dropdown */}
          <Autocomplete
            options={departmentList}
            getOptionLabel={(option) => option.department_name}
            value={departmentList.find((dept) => dept.department_name === editTrainingDept) || null}
            onChange={(event, newValue) => {
              setEditTrainingDept(newValue ? newValue.department_name : '');
              setErrors((prev) => ({ ...prev, department: false }));
            }}
            sx={{ marginBottom: '16px' }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Department"
                variant="outlined"
                margin="dense"
                fullWidth
                error={errors.department}
               
                sx={{
                  backgroundColor: 'white',
                  borderRadius: 1,
                  fontSize: '0.85rem',
                  '& .MuiOutlinedInput-root': { height: '45px' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: errors.department ? 'red' : '#1A005D' },
                  '& .MuiInputBase-input': { padding: '8px 10px !important' }
                }}
              />
            )}
          />

          {/* Training Topic Input */}
          <TextField
            autoFocus
            margin="dense"
            label="Training Topic"
            type="text"
            fullWidth
            variant="outlined"
            value={editTrainingTopics}
            onChange={(e) => {
              setEditTrainingTopics(e.target.value);
              setErrors((prev) => ({ ...prev, topic: false }));
            }}
            error={errors.topic}
            
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: 1, height: '42px' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: errors.topic ? 'red' : '#1A005D' },
              '& .MuiInputBase-input': { padding: '10px', fontSize: '0.85rem' },
            }}
          />
        </DialogContent>

        {/* Bottom Buttons */}
        <DialogActions sx={{ justifyContent: 'center', padding: '12px' }}>
          {/* Cancel Button */}
          <Button
            onClick={handleCancelEditDialog}
            sx={{
              backgroundColor: 'orange',
              color: 'black',
              fontSize: '0.8rem',
              padding: '8px 14px',
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { backgroundColor: '#FFBF00' },
            }}
          >
            Cancel
          </Button>

          {/* Update Button */}
          <Button
            onClick={handleSubmitEditTrainingTopic}
            variant="contained"
            // disabled={!editTrainingDept || !editTrainingTopics.trim()}  // 🔹 Disabled if empty
            sx={{
              backgroundColor: '#1A005D',
              color: 'white',
              fontSize: '0.8rem',
              padding: '8px 14px',
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { backgroundColor: '#1A005F' },
                  }}
                >
            Update
          </Button>
        </DialogActions>

        {/* Success Message Snackbar */}
        <Snackbar
          open={successMessageOpen}
          autoHideDuration={3000}
          onClose={() => setSuccessMessageOpen(false)}
          message={successMessageContent}
        />
      </Dialog>



       {/* Delete Confirmation Dialog */}
    <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
      <DialogTitle>Confirm Deletion</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Are you sure you want to delete the trainer type "{TrainingTopicsToDelete?.training_topic}"?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => setOpenDeleteDialog(false)}
          sx={{
            backgroundColor: 'orange', // Same as previous cancel button
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
            await handleDeleteTrainer(TrainingTopicsToDelete); // Call the delete function
            setOpenDeleteDialog(false); // Close the dialog after deletion
          }}
          sx={{
            backgroundColor: '#D32F2F', // Same red color for delete
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



      {/* Success Message Snackbar */}
          <Snackbar
        open={successMessageOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          TransitionComponent={(props) => <Slide {...props} direction="up" />}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          style={{
            marginTop: '40px',
          }}
        >
          <Alert
            severity="success"
            style={{
              background: 'linear-gradient(45deg,rgb(0, 185, 0),rgb(0, 192, 10))',
              color: 'white',
              padding: '14px 28px',
              fontWeight: '600',
              textAlign: 'center',
              borderRadius: '12px',
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
              minWidth: '300px',
              fontFamily: 'Roboto, sans-serif',
              letterSpacing: '0.5px',
              animation: 'fadeIn 0.5s ease-in-out',
            }}
          >
            {successMessageContent}
          </Alert>
        </Snackbar>

    </div>
  );
}
// If you're using default export
export default TrainerTopicMaster;