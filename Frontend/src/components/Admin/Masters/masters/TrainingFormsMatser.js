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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextareaAutosize,
  Tooltip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import * as XLSX from 'xlsx';
import { exportData } from './exportUtils';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Trash2Icon, EditIcon, FileTextIcon, PlusCircleIcon, DownloadIcon } from 'lucide-react';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { FormHelperText } from '@mui/material';
import FeedbackFormDialog from './FeedbackFormDialog'; // Import the FeedbackFormDialog component

function TrainingFormsMaster() {
  const [forms, setForms] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [successMessageOpen, setSuccessMessageOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [successMessageContent, setSuccessMessageContent] = useState('');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const navigate = useNavigate();
  const [questionInput, setQuestionInput] = useState('');
  const [questions, setQuestions] = useState([]);
  const [filterType, setFilterType] = useState('both');
  const [editQuestionIndex, setEditQuestionIndex] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState('');
  const rolePermissions = JSON.parse(sessionStorage.getItem('rolePermissions')) || {};
  const mastersPermissions = rolePermissions['Masters'] || {};
  const Permissions = mastersPermissions['Forms Info'] || {};
  const canEdit = Permissions['View/Create/Edit'] === 1;
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // Add near other state declarations
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);

  // Form State
  const [formType, setFormType] = useState('trainer');
  const [formName, setFormName] = useState('');

  const handleBackClick = () => {
    window.history.back(); // Goes back to the previous page
  };

  // Fetching forms from the API
  const fetchForms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/training-master/AllMasterFeedbackFormQuestions/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
  
      const data = await response.json();
  
      if (data && Array.isArray(data.topics)) {
        const structuredData = data.topics.map((item, index) => ({
          id: item.id,
          SLNO: index + 1,
          feedback_form_type: item.feedback_form_type || 'N/A',
          feedback_form_name: item.feedback_form_name || 'N/A',
          questions: item.questions || '{}', // Ensure it's a valid JSON string
          user_name: item.user_name || 'Unknown',
          user_created_time: item.user_created_time
            ? new Date(item.user_created_time).toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
            : 'N/A',
        }));
        setForms(structuredData);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    }
  };
  useEffect(() => {
    fetchForms();
  }, []);

  // Handle form name click to open the dialog
  const handleFormNameClick = (form) => {
    setSelectedForm(form);
    setDialogOpen(true);
  };

  const handleAddForm = async () => {
    try {
      const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
  
      // Convert the array of questions into the required JSON object format
      const questionsObj = questions.reduce((acc, question, index) => {
        acc[index + 1] = question.trim();
        return acc;
      }, {});
  
      // Validation for empty fields
      if (!formType || !formName || questions.length === 0) {
        setFormError({
          formType: !formType,
          formName: !formName,
          questions: questions.length === 0,
        });
        return;
      }
  
      // Prepare the data for the API call
      const payload = {
        feedback_form_type: formType,
        feedback_form_name: formName,
        questions: questionsObj,
        user_created_by: userDetails.emp_id,
        user_name: userDetails.empname
      };
      console.log(payload);
  
      const response = await fetch(`${API_BASE_URL}/training-master/AllMasterFeedbackFormQuestions/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  
      if (response.ok) {
        await fetchForms();
        setOpenAddDialog(false);
        setSuccessMessageContent('Form added successfully!');
        setSuccessMessageOpen(true);
        resetForm();
      }
    } catch (error) {
      console.error('Error adding form:', error);
    }
  };
  
  const [formError, setFormError] = useState({
    formType: false,
    formName: false,
    questions: false,
  });

  const handleCloseAddDialog = () => {
    setFormName('');
    setQuestionInput('');
    setQuestions([]);
    setFormError({ formType: false, formName: false, questions: false });
    setOpenAddDialog(false);
  };
  const handleAddQuestion = () => {
    if (!questionInput.trim()) return;
    setQuestions([...questions, questionInput.trim()]);
    setQuestionInput('');
    setFormError({ ...formError, questions: false });
  };
  

  const handleDeleteForm = async () => {
    try {
      const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
      const response = await fetch(`${API_BASE_URL}/training-master/AllMasterFeedbackFormQuestions/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_form_type: formToDelete.feedback_form_type,
          feedback_form_name: formToDelete.feedback_form_name,
          user_created_by: userDetails.emp_id,
          user_name: userDetails.empname
        })
      });

      if (response.ok) {
        await fetchForms();
        setOpenDeleteDialog(false);
        setSuccessMessageContent('Form deleted successfully!');
        setSuccessMessageOpen(true);
      }
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  };

  const handleUpdateForm = async () => {
    try {
      const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
  
      // Convert the array of questions into the required JSON object format.
      // This produces an object like: { "1": "Question 1", "2": "Question 2", ... }
      // Convert the array of questions into the required JSON object format
      const questionsObj = questions.reduce((acc, question, index) => {
        acc[index + 1] = question.trim();
        return acc;
      }, {});
  
      // Validation for empty fields
      if (!formType || !formName || questions.length === 0) {
        setFormError({
          formType: !formType,
          formName: !formName,
          questions: questions.length === 0,
        });
        return;
      }
  
      // Prepare the payload; note that we pass questionsObj directly rather than stringifying it.
      const payload = {
        feedback_form_type: formType,
        feedback_form_name: formName,
        questions: questionsObj, // Pass the object directly
        user_created_by: userDetails.emp_id,
        user_name: userDetails.empname
      };
  
      const response = await fetch(`${API_BASE_URL}/training-master/AllMasterFeedbackFormQuestions/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) // Outer payload is stringified
      });
  
      if (response.ok) {
        await fetchForms();
        setOpenEditDialog(false);
        setSuccessMessageContent('Form updated successfully!');
        setSuccessMessageOpen(true);
      }
    } catch (error) {
      console.error('Error updating form:', error);
    }
  };
  // Modify the structuredData mapping in fetchForms
// const structuredData = data.topics.map((item, index) => ({
//   id: item.id,
//   SLNO: index + 1,
//   feedback_form_type: item.feedback_form_type || 'N/A',
//   feedback_form_name: item.feedback_form_name || 'N/A',
//   questions: item.questions || '{}',
//   user_name: item.user_name || 'Unknown',
//   user_created_time: item.user_created_time
//     ? new Date(item.user_created_time).toLocaleString('en-GB', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric'
//       })
//     : 'N/A',
// }));
  

  const resetForm = () => {
    setFormType('trainer');
    setFormName('');
    setQuestions([]);
    setQuestionInput('');
  };

// Modify the handleEditClick function
const handleEditClick = (form) => {
  setFormType(form.feedback_form_type);
  setFormName(form.feedback_form_name);
  const parsedQuestions = JSON.parse(form.questions);
  setQuestions(Object.values(parsedQuestions));
  setQuestionInput("");
  setEditFormData(form);
  setOpenEditDialog(true);
};
  
  // Handler to remove a question
const handleDeleteQuestion = (index) => {
  const updatedQuestions = [...questions];
  updatedQuestions.splice(index, 1);
  setQuestions(updatedQuestions);
};

// Handler to edit a question (example: prompt for new text)
const handleEditQuestion = (index, newQuestionText) => {
  if (newQuestionText !== null && newQuestionText.trim() !== "") {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = newQuestionText.trim();
    setQuestions(updatedQuestions);
  }
};

// Add these helper functions in your component
const moveQuestion = (index, direction) => {
  const updatedQuestions = [...questions];
  if (direction === 'up') {
    [updatedQuestions[index - 1], updatedQuestions[index]] = [updatedQuestions[index], updatedQuestions[index - 1]];
  } else {
    [updatedQuestions[index], updatedQuestions[index + 1]] = [updatedQuestions[index + 1], updatedQuestions[index]];
  }
  setQuestions(updatedQuestions);
};


  
  

  const filteredForms = forms.filter(form => {
    const searchLower = searchText.toLowerCase();
    // Check if the form type matches the filter (or if "both" is selected, then allow all)
    const typeMatches = filterType === "both" || form.feedback_form_type === filterType;
    // Check if any field matches the search text
    const searchMatches = filterType === "both"
  ? [form.feedback_form_type, form.feedback_form_name].some(value =>
      String(value).toLowerCase().includes(searchLower)
    )
  : Object.values(form).some(value =>
      String(value).toLowerCase().includes(searchLower)
    );

    return typeMatches && searchMatches;
  });
  
  return (
    <div className="admin-dashboard-content">
      <div className="main-content">
      <Box sx={{ pt: 0, pr: 0, pb: 0, pl: 1, backgroundColor: 'white', "min-height": "70vh" }}>
              <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center" 
                mb={3} 
                sx={{
                  backgroundColor: "#1A005D",
                  padding: "5px 10px",
                  borderRadius: "12px",
                  marginBottom: "9px",  // Fixed camelCase issue
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                }}
              >

              <IconButton 
                onClick={handleBackClick}
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

          <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
            Feedback Form Master
          </Typography>
          <Tooltip title="Add topic">
          {canEdit && (
              <Button
                variant="contained"
                startIcon={<PlusCircleIcon />}
                onClick={() => setOpenAddDialog(true)}
                sx={{
                  backgroundColor: "#8EC400",
                  '&:hover': { backgroundColor: "#7EB300" },
                  borderRadius: '8px'
                }}
              >
                Add Form
              </Button>
            )}
          </Tooltip> 
        </Box>

        {/* Search and Export Section */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          {/* Export Buttons on the Left */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export to Excel">
              <Button
                onClick={() => exportData(filteredForms, 'Form_List', 'excel')}
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
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
    {/* Filter Type Dropdown */}
    <FormControl sx={{ width: '180px' }} size="small">
      <InputLabel>Filter by Type</InputLabel>
      <Select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        label="Filter by Type"
        sx={{
          backgroundColor: 'white',
          borderRadius: 1,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1A005D' }
        }}
      >
        <MenuItem value="both">Both Types</MenuItem>
        <MenuItem value="trainer">Trainer Forms</MenuItem>
        <MenuItem value="trainee">Trainee Forms</MenuItem>
      </Select>
    </FormControl>

    {/* Search Box */}
    <TextField
      variant="outlined"
      placeholder="Search..."
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      size="small"
      sx={{ width: '60%' }}
    />
  </Box>
        </Box>


 {/* Forms Table */}
 <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#1A005D' }}>
                <TableRow>
                  {['SL No.', 'Form Type', 'Form Name', 'Created By', 'Created On', 'Actions'].map((header) => (
                    <TableCell
                      key={header}
                      sx={{
                        fontWeight: 'bold',
                        color: 'white',
                        textAlign: header === 'Actions' ? 'center' : 'left',
                        padding: '2px',
                        fontSize: '1.04rem',
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredForms.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((form, index) => (
                  <TableRow
                    key={form.id}
                    hover
                    sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f8fafc' }, '&:nth-of-type(even)': { backgroundColor: '#e2e8f0' } }}
                  >
                    <TableCell sx={{ padding: '2px', fontSize: '1.03rem' }}>{index + 1}</TableCell>
                    <TableCell sx={{ padding: '2px', fontSize: '1.03rem' }}>{form.feedback_form_type}</TableCell>
                    <TableCell sx={{ padding: '2px', fontSize: '1.03rem' }}>
                      {/* Make the form name clickable */}
                      <span
                        style={{ cursor: 'pointer', textDecoration: 'underline dotted', color: '#1976d2' }}
                        onClick={() => handleFormNameClick(form)}
                      >
                        {form.feedback_form_name}
                      </span>
                    </TableCell>
                    <TableCell sx={{ padding: '2px', fontSize: '1.03rem' }}>{form.user_name}</TableCell>
                    <TableCell sx={{ padding: '2px', fontSize: '1.03rem' }}>{form.user_created_time}</TableCell>

                    <TableCell sx={{ textAlign: 'center', padding: '2px' }}>
                      {canEdit && (
                        <>
                          <IconButton onClick={() => handleEditClick(form)} sx={{ color: '#1976d2' }}>
                            <EditIcon size={20} />
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              setFormToDelete(form);
                              setOpenDeleteDialog(true);
                            }}
                            sx={{ color: '#d32f2f' }}
                          >
                            <Trash2Icon size={20} />
                          </IconButton>
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
            count={filteredForms.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
          />

          {/* Feedback Form Dialog */}
          <FeedbackFormDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            questions={selectedForm ? selectedForm.questions : ''}
            formName={selectedForm ? selectedForm.feedback_form_name : ''}
            formType={selectedForm ? selectedForm.feedback_form_type : 'trainee'}
          />


         {/* Add Form Dialog */}
         <Dialog
          Dialog
            open={openAddDialog}
            onClose={handleCloseAddDialog}
            fullWidth
            maxWidth="lg"
            sx={{
              '& .MuiDialog-paper': {
                borderRadius: 3,
                width: '1000px !important',
                padding: '12px',
                maxHeight: '90vh',
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
              New Feedback Form
            </DialogTitle>

            <DialogContent sx={{ padding: 0, overflow: 'visible' }}>
              {/* Form Type & Form Name */}
              <Box sx={{ display: 'flex', gap: 1, mb: 1, mt: 2 }}>
                <FormControl sx={{ width: '50%' }} size="small" variant="outlined" error={formError.formType}>
                  <InputLabel id="form-type-label" sx={{ fontSize: '0.85rem' }}>
                    Form Type
                  </InputLabel>
                  <Select
                    labelId="form-type-label"
                    id="form-type-select"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    label="Form Type"
                    displayEmpty
                    sx={{
                      backgroundColor: 'white',
                      borderRadius: 1,
                      fontSize: '0.85rem',
                      height: '40px',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1A005D' },
                      '& .MuiSelect-select': { padding: '8px' },
                    }}
                  >
                    
                    <MenuItem value="trainer">Trainer</MenuItem>
                    <MenuItem value="trainee">Trainee</MenuItem>
                  </Select>
                  {formError.formType }
                </FormControl>

                <TextField
                  label="Form Name"
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 1, height: '40px' },
                    '& .MuiInputBase-input': { padding: '8px', fontSize: '0.85rem' },
                  }}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  error={formError.formName}
                  required
                />
              </Box>

              {/* Add Question Input */}
              <TextField
                label="Add Question"
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  mb: 1,
                  '& .MuiOutlinedInput-root': { borderRadius: 1, height: '40px' },
                  '& .MuiInputBase-input': { padding: '6px', fontSize: '0.75rem' },
                }}
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                error={formError.questions}
                required
                
              />

              {/* List Questions & Add Button */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>List Questions</Typography>
                <Button
                  onClick={() => {
                    if (questionInput.trim() && editQuestionIndex === null) {
                      setQuestions([...questions, questionInput.trim()]);
                      setQuestionInput('');
                    }
                  }}
                  variant="outlined"
                  sx={{
                    backgroundColor: '#1A005D',
                    borderRadius: 2,
                    color: 'white',
                    textTransform: 'none',
                    height: '30px',
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    '&:hover': { backgroundColor: '#3105a3' }
                  }}
                >
                  Add Question
                </Button>
              </Box>

              {/* Scrollable List of Questions with Inline Editing and Icons */}
              <List
                sx={{
                  maxHeight: '250px',
                  minHeight: '250px',
                  overflowY: 'auto',
                  border: '1px solid #ccc',
                  borderRadius: 1,
                  padding: '4px'
                }}
              >
                {questions.map((question, index) => (
                  <ListItem
                    key={index}
                    divider
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    {editQuestionIndex === index ? (
                      // Edit Mode
                      <>
                        <TextField
                          value={editedQuestion}
                          onChange={(e) => setEditedQuestion(e.target.value)}
                          size="small"
                          sx={{ flexGrow: 1, mr: 1, fontSize: '0.75rem' }}
                        />
                        <Button
                          onClick={() => {
                            if (editedQuestion.trim()) {
                              const updatedQuestions = [...questions];
                              updatedQuestions[index] = editedQuestion.trim();
                              setQuestions(updatedQuestions);
                            }
                            setEditQuestionIndex(null);
                            setEditedQuestion('');
                          }}
                          sx={{ color: 'green', minWidth: 'auto', mr: 1 }}
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => {
                            setEditQuestionIndex(null);
                            setEditedQuestion('');
                          }}
                          sx={{ color: 'gray', minWidth: 'auto' }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      // Display Mode
                      <>
                        <ListItemText
                          primary={`${index + 1}: ${question}`}
                          sx={{ fontSize: '0.75rem', flexGrow: 1 }}
                        />

                        {/* Move Controls */}
                        {index > 0 && (
                          <Button
                            onClick={() => moveQuestion(index, 'up')}
                            sx={{ color: 'purple', minWidth: 'auto', mr: 1 }}
                          >
                            <ArrowUpwardIcon fontSize="small" />
                          </Button>
                        )}
                        {index < questions.length - 1 && (
                          <Button
                            onClick={() => moveQuestion(index, 'down')}
                            sx={{ color: 'purple', minWidth: 'auto', mr: 1 }}
                          >
                            <ArrowDownwardIcon fontSize="small" />
                          </Button>
                        )}

                        {/* Edit/Delete Controls */}
                        <IconButton
                          onClick={() => {
                            setEditQuestionIndex(index);
                            setEditedQuestion(question);
                          }}
                          sx={{ color: '#1976d2', mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteQuestion(index)}
                          sx={{ color: '#d32f2f' }}
                        >
                          <Trash2Icon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </ListItem>
                ))}
              </List>
            </DialogContent>

            {/* Bottom Buttons */}
            <DialogActions sx={{ justifyContent: 'center', padding: '8px' }}>
              <Button
                onClick={handleCloseAddDialog}
                sx={{
                  backgroundColor: 'orange',
                  color: 'black',
                  fontSize: '0.75rem',
                  padding: '6px 12px',
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': { backgroundColor: '#FFBF00' },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddForm}
                variant="contained"
                sx={{
                  backgroundColor: '#1A005D',
                  color: 'white',
                  fontSize: '0.75rem',
                  padding: '6px 12px',
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': { backgroundColor: '#3105a3' },
                }}
              >
                Save Form
              </Button>
            </DialogActions>
          </Dialog>

            
             {/* Update Form Dialog */}
            <Dialog
              open={openEditDialog}
              onClose={() => setOpenEditDialog(false)}
              fullWidth
              maxWidth="lg"
              sx={{
                '& .MuiDialog-paper': {
                  borderRadius: 3,
                  width: '1100px !important',
                  padding: '12px',
                  maxHeight: '90vh',
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
                Update Feedback Form
              </DialogTitle>

              <DialogContent sx={{ padding: 0, overflow: 'visible' }}>
                {/* Form Type & Form Name */}
                <Box sx={{ display: 'flex', gap: 1, mb: 1, mt: 2 }}>
                  <FormControl
                    sx={{ width: '50%' }}
                    size="small"
                    variant="outlined"
                    error={!!formError.formType}
                  >
                    <InputLabel id="form-type-label" sx={{ fontSize: '0.85rem' }}>
                      Form Type
                    </InputLabel>
                    <Select
                      labelId="form-type-label"
                      id="form-type-select"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      label="Form Type"
                      sx={{
                        backgroundColor: 'white',
                        borderRadius: 1,
                        fontSize: '0.85rem',
                        height: '40px', // Uniform height with TextField
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: !!formError.formType ? 'red' : '#1A005D'
                        },
                        '& .MuiSelect-select': { padding: '8px' }
                      }}
                    >
                      <MenuItem value="trainer">Trainer</MenuItem>
                      <MenuItem value="trainee">Trainee</MenuItem>
                    </Select>
                    {formError.formType && (
                      <Typography variant="caption" color="error">
                        {formError.formType}
                      </Typography>
                    )}
                  </FormControl>

                  <TextField
                    label="Form Name"
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        height: '40px'
                      },
                      '& .MuiInputBase-input': { padding: '8px', fontSize: '0.85rem' }
                    }}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    error={!!formError.formName}
                    helperText={formError.formName}
                    required
                  />
                </Box>

                {/* Add Question Input */}
                <TextField
                  label="Add Question"
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{
                    mb: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      height: '40px'
                    },
                    '& .MuiInputBase-input': { padding: '6px', fontSize: '0.75rem' }
                  }}
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  error={!!formError.questions}
                  helperText={formError.questions}
                  required
                />

                {/* The rest of your dialog content (List Questions, etc.) remains the same */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1
                  }}
                >
                  <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    List Questions
                  </Typography>
                  <Button
                    onClick={() => {
                      if (questionInput.trim() && editQuestionIndex === null) {
                        setQuestions([...questions, questionInput.trim()]);
                        setQuestionInput('');
                      }
                    }}
                    variant="outlined"
                    sx={{
                      backgroundColor: '#1A005D',
                      borderRadius: 2,
                      color: 'white',
                      textTransform: 'none',
                      height: '30px',
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      '&:hover': { backgroundColor: '#3105a3' }
                    }}
                  >
                    Add Question
                  </Button>
                </Box>

                {/* List of questions with inline editing and icons */}
                <List
                  sx={{
                    maxHeight: '300px',
                    minHeight: '300px',
                    overflowY: 'auto',
                    border: '1px solid #ccc',
                    borderRadius: 1,
                    padding: '4px'
                  }}
                >
                  {questions.map((question, index) => (
                    <ListItem
                      key={index}
                      divider
                      sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      {editQuestionIndex === index ? (
                        <>
                          <TextField
                            value={editedQuestion}
                            onChange={(e) => setEditedQuestion(e.target.value)}
                            size="small"
                            sx={{ flexGrow: 1, mr: 1, fontSize: '0.75rem' }}
                          />
                          <Button
                            onClick={() => {
                              if (editedQuestion.trim()) {
                                const updatedQuestions = [...questions];
                                updatedQuestions[index] = editedQuestion.trim();
                                setQuestions(updatedQuestions);
                              }
                              setEditQuestionIndex(null);
                              setEditedQuestion('');
                            }}
                            sx={{ color: 'green', minWidth: 'auto', mr: 1 }}
                          >
                            Save
                          </Button>
                          <Button
                            onClick={() => {
                              setEditQuestionIndex(null);
                              setEditedQuestion('');
                            }}
                            sx={{ color: 'gray', minWidth: 'auto' }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <ListItemText
                            primary={`${index + 1}: ${question}`}
                            sx={{ fontSize: '0.75rem', flexGrow: 1 }}
                          />

                          {/* Move Up/Down, Edit, and Delete controls */}
                          {index > 0 && (
                            <Button
                              onClick={() => {
                                const updatedQuestions = [...questions];
                                [updatedQuestions[index - 1], updatedQuestions[index]] = [
                                  updatedQuestions[index],
                                  updatedQuestions[index - 1]
                                ];
                                setQuestions(updatedQuestions);
                              }}
                              sx={{ color: 'purple', minWidth: 'auto', mr: 1 }}
                            >
                              <ArrowUpwardIcon fontSize="small" />
                            </Button>
                          )}
                          {index < questions.length - 1 && (
                            <Button
                              onClick={() => {
                                const updatedQuestions = [...questions];
                                [updatedQuestions[index], updatedQuestions[index + 1]] = [
                                  updatedQuestions[index + 1],
                                  updatedQuestions[index]
                                ];
                                setQuestions(updatedQuestions);
                              }}
                              sx={{ color: 'purple', minWidth: 'auto', mr: 1 }}
                            >
                              <ArrowDownwardIcon fontSize="small" />
                            </Button>
                          )}

                          <IconButton
                            onClick={() => {
                              setEditQuestionIndex(index);
                              setEditedQuestion(question);
                            }}
                            sx={{ color: '#1976d2', mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              const updatedQuestions = [...questions];
                              updatedQuestions.splice(index, 1);
                              setQuestions(updatedQuestions);
                              if (editQuestionIndex === index) {
                                setEditQuestionIndex(null);
                                setEditedQuestion('');
                              }
                            }}
                            sx={{ color: '#d32f2f' }}
                          >
                            <Trash2Icon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </ListItem>
                  ))}
                </List>
              </DialogContent>

              {/* Bottom Buttons */}
              <DialogActions sx={{ justifyContent: 'center', padding: '8px' }}>
                <Button
                  onClick={() => setOpenEditDialog(false)}
                  sx={{
                    backgroundColor: 'orange',
                    color: 'black',
                    fontSize: '0.75rem',
                    padding: '6px 12px',
                    textTransform: 'none',
                    borderRadius: 2,
                    '&:hover': { backgroundColor: '#FFBF00' }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateForm}
                  variant="contained"
                  sx={{
                    backgroundColor: '#1A005D',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '6px 12px',
                    textTransform: 'none',
                    borderRadius: 2,
                    '&:hover': { backgroundColor: '#3105a3' }
                  }}
                >
                  Update Form
                </Button>
              </DialogActions>
            </Dialog>





        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            Are you sure you want to delete the form "{formToDelete?.feedback_form_name}"?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)} sx={{
                backgroundColor: 'orange',
                color: 'black',
                fontSize: '0.8rem',
                padding: '6px 12px',
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { backgroundColor: '#FFBF00' },
              }}>Cancel</Button>
            <Button onClick={handleDeleteForm} sx={{
                backgroundColor:  '#D32F2F',
                color: 'white',
                fontSize: '0.8rem',
                padding: '6px 12px',
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { backgroundColor: '#B71C1C' },
              }}>Delete</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
  open={successMessageOpen}
  autoHideDuration={3000}
  onClose={() => setSuccessMessageOpen(false)}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  // Prevent the Snackbar container from blocking clicks
  sx={{ pointerEvents: 'none' }}
  TransitionComponent={(props) => <Slide {...props} direction="up" />}
>
  <Alert
    onClose={() => setSuccessMessageOpen(false)}
    severity="success"
    sx={{ width: '100%', pointerEvents: 'auto' }} // Allow interactions on the Alert if needed
  >
    {successMessageContent}
  </Alert>
</Snackbar>
    
      </Box>
      </div>
    </div>
  );
}

export default TrainingFormsMaster;



