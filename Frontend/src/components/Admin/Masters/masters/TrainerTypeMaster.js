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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { FiEye } from 'react-icons/fi';
import { FaRegEdit } from 'react-icons/fa';
import { MdDeleteForever } from 'react-icons/md';
import '../../../../css/Admincss/masters/TrainerTypeMaster.css';

function TrainerTypeMaster() {
  const [trainerTypes, setTrainerTypes] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openAddDialog, setOpenAddDialog] = useState(false); // Separate state for Add dialog
  const [openViewDialog, setOpenViewDialog] = useState(false); // Separate state for View dialog
  const [newTrainingType, setNewTrainingType] = useState('');
  const [successMessageOpen, setSuccessMessageOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false); // State for confirmation dialog
  const [trainerToDelete, setTrainerToDelete] = useState(null); // State to store the trainer type to delete
  const [successMessageContent, setSuccessMessageContent] = useState('');
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


  // Fetching trainer types from the API
  const fetchTrainerTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/training-master/type/list`);
      const data = await response.json();
      if (data && Array.isArray(data.topics)) {
        const structuredData = data.topics.map((item, index) => ({
          id: item.id,
          SLNO: index + 1,
          training_type: item.training_type || 'N/A',
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
        setTrainerTypes(structuredData);
      } else {
        console.error('Unexpected API response format:', data);
      }
    } catch (error) {
      console.error('Error fetching trainer types:', error);
    }
  };

  useEffect(() => {
    fetchTrainerTypes();  // Initially fetch data when component mounts
  }, []);

  const handleAddTrainerType = () => {
    setOpenAddDialog(true);  // Open Add dialog
  };

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

  const handleSubmitTrainingType = async () => {
    try {
      const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
      if (!userDetails.emp_id || !userDetails.empname) {
        throw new Error("User is not logged in. Please log in to proceed.");
      }
  
      const response = await fetch(`${API_BASE_URL}/training-master/type/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: newTrainingType,
          userid: userDetails.emp_id,
          userName: userDetails.empname,
        }),
      });
  
      if (response.ok) {
        const result = await response.json();
        console.log('Training type added successfully:', result);
        await fetchTrainerTypes();
        setOpenAddDialog(false);
        setNewTrainingType('');
        setSuccessMessageContent('Trainer Type added successfully!');
        setSuccessMessageOpen(true);
      } else {
        console.error('Failed to add trainer type topic:', response.statusText);
        alert('Failed to add trainer type topic. Please try again.');
      }
    } catch (error) {
      console.error('Error adding trainer type:', error);
      alert('An error occurred while adding the trainer type. Please try again.');
    }
  };
  

  const handleDeleteClick = (trainer) => {
    setTrainerToDelete(trainer); // Store the trainer type to be deleted
    setOpenDeleteDialog(true); // Open the confirmation dialog
  };
  // Function to handle the actual deletion
  const handleDeleteTrainer = async (trainer) => {
    try {
      const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
      if (!userDetails.emp_id || !userDetails.empname) {
        throw new Error("User is not logged in. Please log in to proceed.");
      }
  
      const response = await fetch(`${API_BASE_URL}/training-master/type/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: trainer.training_type,  // Send the topic (trainer type) to be deleted
          userid: userDetails.emp_id,    // Send the user ID who is performing the action
        }),
      });
  
      if (response.ok) {
        const result = await response.json();
        console.log('Trainer type deleted successfully:', result);
        await fetchTrainerTypes();
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
  

   

  const handleCancelDialog = () => {
    setOpenAddDialog(false);
    setNewTrainingType('');
  };

  const handleCloseSnackbar = () => {
    setSuccessMessageOpen(false);
  };

  const handleViewClick = (trainer) => {
    setSelectedTrainer(trainer);
    setOpenViewDialog(true); // Open View dialog with selected trainer's details
  };
  // Add a new state for edit dialog and selected trainer for editing
      const [openEditDialog, setOpenEditDialog] = useState(false);
      const [editTrainingType, setEditTrainingType] = useState('');

      // Function to handle the edit button click
      const handleEditClick = (trainer) => {
        setSelectedTrainer(trainer);
        setEditTrainingType(trainer.training_type);
        setOpenEditDialog(true); // Open edit dialog
      };
      // Function to submit the updated trainer type
      const handleSubmitEditTrainingType = async () => {
        try {
          const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
          if (!userDetails.emp_id || !userDetails.empname) {
            throw new Error("User is not logged in. Please log in to proceed.");
          }
      
          const response = await fetch(`${API_BASE_URL}/training-master/type/update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              topic: selectedTrainer.training_type, // Original topic
              updatedTopic: editTrainingType, // Updated topic
              userid: userDetails.emp_id,
              userName: userDetails.empname,
            }),
          });
      
          if (response.ok) {
            const result = await response.json();
            console.log('Training type updated successfully:', result);
            await fetchTrainerTypes();
            setOpenEditDialog(false);
            setSuccessMessageContent('Trainer Type updated successfully!');
            setSuccessMessageOpen(true);
          } else {
            console.error('Failed to update trainer type:', response.statusText);
            alert('Failed to update trainer type. Please try again.');
          }
        } catch (error) {
          console.error('Error updating trainer type:', error);
          alert('An error occurred while updating the trainer type. Please try again.');
        }
      };
      

  const filteredTrainerTypes = trainerTypes.filter((trainer) => {
    const searchLower = searchText.toLowerCase();
    return (
      trainer.SLNO.toString().includes(searchLower) ||
      trainer.training_type?.toLowerCase().includes(searchLower) ||
      trainer.user_name?.toLowerCase().includes(searchLower) 
      
    );
  });

  return (
    <div className="admin-dashboard-content">
      <div className="main-content">
        <div className="master-header">
          <IconButton color="primary" onClick={handleBackClick} className="back-button">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" className="header-title">
            Trainer Type Master
          </Typography>
          <div className="search-container">
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search"
              value={searchText}
              onChange={handleSearchChange}
              className="search-input"
            />
            <IconButton color="primary" onClick={handleAddTrainerType} className="Adding-button">
              <AddIcon />
            </IconButton>
          </div>
        </div>

        <div className="trainer-type">
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow className="table-header-row">
                  <TableCell className="table-header-cell">SLNO</TableCell>
                  <TableCell className="table-header-cell">Trainer Type</TableCell>
                  <TableCell className="table-header-cell">Created By</TableCell>
                  <TableCell className="table-header-cell">Created Time</TableCell>
                  <TableCell className="table-header-cell">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTrainerTypes
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((trainer) => (
                    <TableRow key={trainer.id}>
                      <TableCell>{trainer.SLNO}</TableCell>
                      <TableCell>{trainer.training_type}</TableCell>
                      <TableCell>{trainer.user_name}</TableCell>
                      <TableCell>{trainer.user_created_time}</TableCell>
                      <TableCell>
                        <IconButton   onClick={() => handleViewClick(trainer)}>
                          <FiEye className="view-button" />
                        </IconButton>
                        <IconButton onClick={() => handleEditClick(trainer)}>
                          <FaRegEdit className="edit-button" />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteClick(trainer)}>
                          <MdDeleteForever className="delete-button" />
                        </IconButton>


                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 100]}
            component="div"
            count={filteredTrainerTypes.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </div>
      </div>

      {/* Add New Trainer Type Dialog */}
      <Dialog open={openAddDialog} onClose={handleCancelDialog}>
      <DialogTitle>Add New Trainer Type</DialogTitle>
      <DialogContent sx={{ width: '500px', height: '100px', padding: '8px' }}>
        <TextField
          autoFocus
          margin="dense"
          label="Trainer Type"
          type="text"
          fullWidth
          variant="outlined"
          value={newTrainingType}
          onChange={(e) => setNewTrainingType(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleCancelDialog}
          color="secondary"
          sx={{
            backgroundColor: '#f50057', // Customize background color for Cancel button
            color: 'white', // Text color
            '&:hover': {
              backgroundColor: '#d4004b', // Hover background color
            },
            padding: '8px 16px', // Custom padding
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmitTrainingType}
          color="primary"
          sx={{
            backgroundColor: '#1976d2', // Customize background color for Add button
            color: 'white', // Text color
            '&:hover': {
              backgroundColor: '#1565c0', // Hover background color
            },
            padding: '8px 16px', // Custom padding
          }}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>


      {/* View Trainer Details Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', color: '#1976d2' }}>
          Trainer Type Details
        </DialogTitle>
        <DialogContent sx={{ width: '600px', padding: '1px 12px' }}>
          {selectedTrainer && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#f5f5f5',
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              {/* Trainer Type */}
              <Box display="flex" alignItems="center" mb={1.5}>
                <Typography
                  variant="body1"
                  sx={{
                    flex: '0 0 200px',
                    textAlign: 'right',
                    paddingRight: '8px',
                    fontWeight: 'bold',
                    color: '#424242',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  Trainer Type  :
                </Typography>
                <Typography variant="body1" sx={{ color: '#616161' }}>
                  {selectedTrainer.training_type}
                </Typography>
              </Box>

              {/* Created By */}
              <Box display="flex" alignItems="center" mb={1.5}>
                <Typography
                  variant="body1"
                  sx={{
                    flex: '0 0 200px',
                    textAlign: 'right',
                    paddingRight: '8px',
                    fontWeight: 'bold',
                    color: '#424242',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  Created By   :
                </Typography>
                <Typography variant="body1" sx={{ color: '#616161' }}>
                  {selectedTrainer.user_name}
                </Typography>
              </Box>

              {/* Created Time */}
              <Box display="flex" alignItems="center" mb={1.5}>
                <Typography
                  variant="body1"
                  sx={{
                    flex: '0 0 200px',
                    textAlign: 'right',
                    paddingRight: '8px',
                    fontWeight: 'bold',
                    color: '#424242',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  Created Time:
                </Typography>
                <Typography variant="body1" sx={{ color: '#616161' }}>
                  {selectedTrainer.user_created_time}
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
              padding: '6px 12px',
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



   {/* // Edit confirmation dialog */}
   <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', color: '#1976d2' }}>
        Edit Trainer Type
      </DialogTitle>
      <DialogContent sx={{ width: '500px', height: '80px', padding: '8px' }}>
        <TextField
          autoFocus
          margin="dense"
          label="Trainer Type"
          type="text"
          fullWidth
          variant="outlined"
          value={editTrainingType}
          onChange={(e) => setEditTrainingType(e.target.value)}
        />
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
            '&:hover': {
              backgroundColor: '#d6d6d6',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmitEditTrainingType}
          sx={{
            backgroundColor: '#1976d2',
            color: '#fff',
            textTransform: 'none',
            fontWeight: 'bold',
            padding: '8px 16px',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: '#1565c0',
            },
          }}
        >
          Update
        </Button>
      </DialogActions>
    </Dialog>



      {/* // Delete confirmation dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', color: '#1976d2' }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent sx={{ width: '500px', height: '70px', padding: '8px' }}>
          <Typography variant="body1">
            Do you want to proceed with deleting the trainer type "{trainerToDelete?.training_type}"?
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
              backgroundColor: '#d32f2f',  // Red color for confirmation
              color: '#fff',
              textTransform: 'none',
              fontWeight: 'bold',
              padding: '8px 16px',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#b71c1c',  // Darker red on hover
              },
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
export default TrainerTypeMaster;