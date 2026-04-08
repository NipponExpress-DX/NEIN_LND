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
  Divider,
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
  TextareaAutosize,
  Tooltip,
  List, 
  ListItem,
  ListItemText,
  Select,
  MenuItem,
  Checkbox,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
   FormLabel, RadioGroup, FormControlLabel, 
} from '@mui/material';
import * as XLSX from 'xlsx';
import { exportData } from './exportUtils';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Trash2Icon, EditIcon, PlusCircleIcon, DownloadIcon } from 'lucide-react';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Radio from '@mui/material/Radio';
import axios from 'axios';




function TrainingQuizMaster() {
  const [papers, setPapers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [successMessageOpen, setSuccessMessageOpen] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [successMessageContent, setSuccessMessageContent] = useState('');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editPaperData, setEditPaperData] = useState({});
  const navigate = useNavigate();
  const [questionInput, setQuestionInput] = useState(""); 
  const [questions, setQuestions] = useState([]);
  const [editQuestionIndex, setEditQuestionIndex] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState('');
  const [paperName, setPaperName] = useState('');
  const [formError, setFormError] = useState({
    paperName: false,
    questions: false,
  });

  const rolePermissions = JSON.parse(sessionStorage.getItem("rolePermissions")) || {};
  const mastersPermissions = rolePermissions["Masters"] || {};
  const Permissions = mastersPermissions["Quiz Info"] || {};
  const canEdit = Permissions["View/Create/Edit"] === 1;
  const [selectedQuestionType, setSelectedQuestionType] = useState('');
const [options, setOptions] = useState([]);
const [pairs, setPairs] = useState([]);
const [rankingItems, setRankingItems] = useState([]);
const [scaleValues, setScaleValues] = useState([]);
const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
const [isSingleCorrect, setIsSingleCorrect] = useState(true);
const [editedQuestionText, setEditedQuestionText] = useState('');
const [editedQuestionType, setEditedQuestionType] = useState('');
const [editedOptions, setEditedOptions] = useState([]);
const [isEditing, setIsEditing] = useState(false);
const [filteredPapers, setFilteredPapers] = useState([]);
const [answerInput, setAnswerInput] = useState('');
const [editedAnswerInput, setEditedAnswerInput] = useState('');
const [viewPaperData, setViewPaperData] = useState(null);
const [openViewDialog, setOpenViewDialog] = useState(false);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;






const prepareDataForExport = (papers) => {
  return papers.map((paper) => ({
    "SL No.": paper.SLNO,
    "Paper Name": paper.PaperName,
    "Created By": paper.UserCreatedBy,
    "Created Date": paper.UserCreatedDateTime,
    "Number of Questions": paper.questions.length,
  }));
};

const validateMCQ = () => {
  const errors = {};
  if (!questionInput.trim()) errors.questionInput = true;
  if (options.length < 2 || options.some(opt => !opt.OptionText.trim())) errors.options = true;
  if (!options.some(opt => opt.IsCorrect)) errors.correctOption = true;
  return errors;
};

const validateTrueFalse = () => {
  const errors = {};
  if (!questionInput.trim()) errors.questionInput = true;
  if (options.length !== 2 || options.some(opt => !opt.OptionText.trim())) errors.options = true;
  if (!options.some(opt => opt.IsCorrect)) errors.correctOption = true;
  return errors;
};

const handleAddQuestion = () => {
  // Validate question text
  if (!questionInput.trim()) {
    setFormError({ ...formError, questionInput: true });
    return;
  }

  // For MCQ questions, pre-populate 2 options if not already set
  if (selectedQuestionType === 'MCQ (Multiple Choice Question)' && options.length < 2) {
    setOptions([
      { OptionText: '', IsCorrect: false },
      { OptionText: '', IsCorrect: false },
    ]);
  }

  // For True/False questions, predefine the options
  if (selectedQuestionType === 'True/False' && options.length === 0) {
    setOptions([
      { OptionText: 'True', IsCorrect: true },
      { OptionText: 'False', IsCorrect: false },
    ]);
  }
  // Validate answer for Text questions
  if (
    selectedQuestionType === 'Text (Short Answer or Long Answer)' &&
    !answerInput.trim()
  ) {
    setFormError({ ...formError, answerInput: true });
    return;
  }

  // Validate options for MCQ and True/False
  if (
    selectedQuestionType === 'MCQ (Multiple Choice Question)' ||
    selectedQuestionType === 'True/False'
  ) {
    if (options.length < 2 || options.some(opt => !opt.OptionText.trim())) {
      setFormError({ ...formError, options: true });
      return;
    }
    if (!options.some(opt => opt.IsCorrect)) {
      setFormError({ ...formError, correctOption: true });
      return;
    }
  }

  // Construct the new question object
  const newQuestion = {
    QuestionText: questionInput,
    selectedQuestionType: selectedQuestionType,
    options: options,
    isSingleCorrect: isSingleCorrect,
    answer: selectedQuestionType === 'Text (Short Answer or Long Answer)' ? answerInput : null,
  };

  // Add the new question to the list
  setQuestions([...questions, newQuestion]);

  // Reset form fields
  setQuestionInput('');
  setOptions([]);
  setSelectedQuestionType('');
  setFormError({});
};


  function QuestionOptionsInput({ questionType, options, setOptions, pairs, setPairs, rankingItems, setRankingItems, scaleValues, setScaleValues }) {
    const [newOption, setNewOption] = useState({ text: '', isCorrect: false });
    const [newPair, setNewPair] = useState({ left: '', right: '' });
    const [newRankingItem, setNewRankingItem] = useState('');
    const [newScaleValue, setNewScaleValue] = useState('');
  
    switch (questionType) {
      case 'MCQ (Multiple Choice Question)':
      case 'True/False':
      case 'Fill in the Blanks':
      case 'Dropdown':
        return (
          <div>
            <Typography variant="subtitle2" gutterBottom>Options:</Typography>
            {options.map((option, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Checkbox
                  checked={option.IsCorrect}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index].IsCorrect = e.target.checked;
                    setOptions(newOptions);
                  }}
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={option.OptionText}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index].OptionText = e.target.value;
                    setOptions(newOptions);
                  }}
                />
                <IconButton onClick={() => setOptions(options.filter((_, i) => i !== index))}>
                  <Trash2Icon size={16} />
                </IconButton>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="New option text"
                value={newOption.text}
                onChange={(e) => setNewOption({ ...newOption, text: e.target.value })}
              />
              <Button
                variant="outlined"
                onClick={() => {
                  if (newOption.text.trim()) {
                    setOptions([...options, { OptionText: newOption.text, IsCorrect: newOption.isCorrect }]);
                    setNewOption({ text: '', isCorrect: false });
                  }
                }}
              >
                Add Option
              </Button>
            </div>
          </div>
        );
  
      case 'Matching':
        return (
          <div>
            <Typography variant="subtitle2" gutterBottom>Pairs:</Typography>
            {pairs.map((pair, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TextField
                  label="Left Item"
                  value={pair.LeftItem}
                  onChange={(e) => {
                    const newPairs = [...pairs];
                    newPairs[index].LeftItem = e.target.value;
                    setPairs(newPairs);
                  }}
                />
                <TextField
                  label="Right Item"
                  value={pair.RightItem}
                  onChange={(e) => {
                    const newPairs = [...pairs];
                    newPairs[index].RightItem = e.target.value;
                    setPairs(newPairs);
                  }}
                />
                <IconButton onClick={() => setPairs(pairs.filter((_, i) => i !== index))}>
                  <Trash2Icon size={16} />
                </IconButton>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <TextField
                label="Left Item"
                value={newPair.left}
                onChange={(e) => setNewPair({ ...newPair, left: e.target.value })}
              />
              <TextField
                label="Right Item"
                value={newPair.right}
                onChange={(e) => setNewPair({ ...newPair, right: e.target.value })}
              />
              <Button
                variant="outlined"
                onClick={() => {
                  if (newPair.left.trim() && newPair.right.trim()) {
                    setPairs([...pairs, { LeftItem: newPair.left, RightItem: newPair.right }]);
                    setNewPair({ left: '', right: '' });
                  }
                }}
              >
                Add Pair
              </Button>
            </div>
          </div>
        );
  
      case 'Ranking':
        return (
          <div>
            <Typography variant="subtitle2" gutterBottom>Items to Rank:</Typography>
            {rankingItems.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TextField
                  fullWidth
                  label={`Item ${index + 1}`}
                  value={item.ItemText}
                  onChange={(e) => {
                    const newItems = [...rankingItems];
                    newItems[index].ItemText = e.target.value;
                    setRankingItems(newItems);
                  }}
                />
                <IconButton onClick={() => setRankingItems(rankingItems.filter((_, i) => i !== index))}>
                  <Trash2Icon size={16} />
                </IconButton>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <TextField
                fullWidth
                label="New Item"
                value={newRankingItem}
                onChange={(e) => setNewRankingItem(e.target.value)}
              />
              <Button
                variant="outlined"
                onClick={() => {
                  if (newRankingItem.trim()) {
                    setRankingItems([...rankingItems, { ItemText: newRankingItem, RankPosition: rankingItems.length + 1 }]);
                    setNewRankingItem('');
                  }
                }}
              >
                Add Item
              </Button>
            </div>
          </div>
        );
  
      case 'Likert Scale':
        return (
          <div>
            <Typography variant="subtitle2" gutterBottom>Scale Values (comma separated):</Typography>
            <TextField
              fullWidth
              value={scaleValues.join(',')}
              onChange={(e) => setScaleValues(e.target.value.split(',').map(v => v.trim()))}
              placeholder="e.g., 1,2,3,4,5"
            />
          </div>
        );
  
      default:
        return null;
    }
  }

  const fetchPapers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/training-master/Quiz_QandA_controller/getQuestionPaperslist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
  
      const data = await response.json();
      console.log("Data from API:", data);
  
      if (data && Array.isArray(data.questionPapers)) {
        const structuredData = data.questionPapers.map((paper, index) => ({
          id: paper.PaperID,
          SLNO: index + 1,
          PaperName: paper.PaperName,
          UserCreatedBy: paper.UserCreatedBy,
          UserCreatedDateTime: new Date(paper.UserCreatedDateTime).toLocaleDateString(),
          questions: paper.Questions,
        }));
        setPapers(structuredData);
        setFilteredPapers(structuredData);
      } else {
        console.error("Invalid data format:", data);
      }
    } catch (error) {
      console.error('Error fetching papers:', error);
    }
  };
  
  useEffect(() => { fetchPapers(); }, []);
  

  useEffect(() => { fetchPapers(); }, []);



  
 // Save edited question changes
// Update the handleEditSave function to reset edit mode
const handleEditSave = (index) => {
  // Validate the question text
  if (!editedQuestionText.trim()) {
    setFormError({ ...formError, questionInput: "Question text is required" });
    return;
  }

  // Validate options for MCQ and True/False
  if (editedQuestionType === 'MCQ (Multiple Choice Question)' || editedQuestionType === 'True/False') {
    if (editedOptions.length < 2 || editedOptions.some(opt => !opt.OptionText.trim())) {
      setFormError({ ...formError, options: "All options must be filled" });
      return;
    }
    if (!editedOptions.some(opt => opt.IsCorrect)) {
      setFormError({ ...formError, correctOption: "At least one correct option is required" });
      return;
    }
  }

  // Validate answer for Text questions
  if (editedQuestionType === 'Text (Short Answer or Long Answer)' && !editedAnswerInput.trim()) {
    setFormError({ ...formError, answerInput: "Answer is required" });
    return;
  }

  // Update the question in the list
  const updatedQuestions = [...questions];
  updatedQuestions[index] = {
    ...updatedQuestions[index],
    QuestionText: editedQuestionText,
    selectedQuestionType: editedQuestionType,
    options: editedOptions,
    answer: editedQuestionType === 'Text (Short Answer or Long Answer)' 
      ? editedAnswerInput 
      : updatedQuestions[index].answer, // Preserve answer for other types
    isSingleCorrect: isSingleCorrect,
  };
  setQuestions(updatedQuestions);

  // Reset the edit state
  setEditQuestionIndex(null);
  setEditedQuestionText('');
  setEditedOptions([]);
  setEditedAnswerInput('');
  setFormError({});
  setIsEditing(false); // Reset isEditing state
};
// Update the resetForm function to reset edit mode
const resetForm = () => {
  setPaperName('');
  setQuestions([]);
  setQuestionInput('');
  setOptions([]); // Reset options
  setPairs([]);
  setRankingItems([]);
  setScaleValues([]);
  setEditQuestionIndex(null);
  setSelectedQuestionType('');
  setFormError({});
  setIsEditing(false); // Reset edit mode
};

const handleEditClick = (paper) => {
  console.log("Editing paper:", paper);
  setEditPaperData(paper);
  setPaperName(paper.PaperName);

  const mappedQuestions = paper.questions.map((q) => {
    const question = {
      QuestionText: q.QuestionText,
      selectedQuestionType: q.QuestionType === "Text" ? "Text (Short Answer or Long Answer)" : q.QuestionType,
      options: q.Options || [],
      answer: q.QuestionType === "Text" ? q.AnswerText : q.CorrectAnswer || "",
      isSingleCorrect: q.IsMultipleChoice === false,
    };
    console.log("Mapped question:", question);
    return question;
  });

  setQuestions(mappedQuestions);
  setOpenEditDialog(true);
};
// Add update paper handler
const handleUpdatePaper = async () => {
  try {
    if (!paperName.trim()) {
      setFormError({ ...formError, paperName: true });
      return;
    }

    // Get user details from session storage
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
    if (!userDetails.emp_id || !userDetails.empname) {
      throw new Error("User is not logged in. Please log in to proceed.");
    }

    // Structure data to match API requirements
    const requestBody = {
      PaperID: Number(editPaperData.id),
      UserCreatedBy: userDetails.emp_id, // Include emp_id from userDetails
      PaperName: paperName,
      Questions: questions.map((q) => {
        const questionObj = {
          QuestionText: q.QuestionText,
          QuestionType: q.selectedQuestionType === "Text (Short Answer or Long Answer)" ? "Text" : q.selectedQuestionType,
        };

        // Handle different question types
        if (q.selectedQuestionType === "Text (Short Answer or Long Answer)") {
          questionObj.AnswerText = q.answer; // Include AnswerText for Text questions
        } else {
          questionObj.Options = (q.options || []).map((opt) => ({
            OptionText: opt.OptionText,
            IsCorrect: opt.IsCorrect,
          }));
          questionObj.CorrectAnswer = q.options
            .filter((opt) => opt.IsCorrect)
            .map((opt) => opt.OptionText);
        }

        return questionObj;
      }),
    };

    // Log request body for debugging
    console.log("Sending update request:", JSON.stringify(requestBody, null, 2));

    const response = await axios.post(
      `${API_BASE_URL}/training-master/Quiz_QandA_controller/updateQuestionPaper`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.data?.message) {
      setSuccessMessageContent("Paper updated successfully!");
      setSuccessMessageOpen(true);
      setOpenEditDialog(false);
      fetchPapers();
      resetForm();
    }
  } catch (error) {
    console.error("Update error:", error);

    if (error.response?.status === 400) {
      const { error: errorMessage, duplicatePaperName } = error.response.data;
      if (errorMessage?.includes("PaperName already exists")) {
        setSuccessMessageContent(
          `Paper name '${duplicatePaperName}' already exists`
        );
      } else {
        setSuccessMessageContent(errorMessage);
      }
    } else {
      setSuccessMessageContent("Error updating paper");
    }

    setSuccessMessageOpen(true);
  }
};

  const handleDeleteQuestion = (index) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
  };

  const moveQuestion = (index, direction) => {
    const updatedQuestions = [...questions];
    if (direction === 'up') {
      [updatedQuestions[index - 1], updatedQuestions[index]] = [updatedQuestions[index], updatedQuestions[index - 1]];
    } else {
      [updatedQuestions[index], updatedQuestions[index + 1]] = [updatedQuestions[index + 1], updatedQuestions[index]];
    }
    setQuestions(updatedQuestions);
  };


  const handleConfirmDelete = async () => {
    try {
      // Get user details from session storage
      const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
      if (!userDetails.emp_id || !userDetails.empname) {
        throw new Error("User is not logged in. Please log in to proceed.");
      }
  
      // Prepare the request body
      const requestBody = {
        PaperID: paperToDelete.id, // ID of the paper to delete
        UserCreatedBy: userDetails.emp_id, // Include emp_id from userDetails
      };
  
      // Log request body for debugging
      console.log("Delete Request Body:", JSON.stringify(requestBody, null, 2));
  
      // Make the API call to delete the paper
      const response = await axios.post(
        `${API_BASE_URL}/training-master/Quiz_QandA_controller/deleteQuestionPaper`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
  
      // Handle the response
      if (response.data?.message) {
        setSuccessMessageContent("Paper deleted successfully!");
        setSuccessMessageOpen(true);
        setOpenDeleteDialog(false);
        fetchPapers(); // Refresh the list of papers
      }
    } catch (error) {
      console.error("Delete error:", error);
  
      // Handle specific error cases
      if (error.response?.status === 400) {
        const { error: errorMessage } = error.response.data;
        setSuccessMessageContent(errorMessage || "An error occurred while deleting the paper.");
      } else {
        setSuccessMessageContent("An error occurred while deleting the paper.");
      }
  
      setSuccessMessageOpen(true);
    }
  };

  const handleEditQuestion = (index) => {
    const q = questions[index];
    setEditQuestionIndex(index);
    setEditedQuestionText(q.QuestionText);
    setEditedQuestionType(q.selectedQuestionType);
    setEditedOptions(q.options || []);
    
    // Add this for Text answer handling
    if (q.selectedQuestionType === 'Text (Short Answer or Long Answer)') {
      setEditedAnswerInput(q.answer || '');
    }
    
    setIsSingleCorrect(q.isSingleCorrect || true);
    setIsEditing(true);
  };
  // Final "Save Paper" API
  // -------------------------
  const handleSavePaper = async () => {
    try {
      // Validate if the paper name is provided
      if (!paperName.trim()) {
        setFormError({ ...formError, paperName: true });
        return;
      }
  
      // Validate if at least one question is added
      if (questions.length === 0) {
        setSuccessMessageContent("Please add at least one question.");
        setSuccessMessageOpen(true);
        return;
      }
  
      // Get user details from session storage
      const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
      if (!userDetails.emp_id || !userDetails.empname) {
        throw new Error("User is not logged in. Please log in to proceed.");
      }
  
      // Construct the request body
      const requestBody = {
        PaperName: paperName,
        UserCreatedBy: userDetails.emp_id, // Include emp_id from userDetails
        Questions: questions.map((q) => {
          const questionObj = {
            QuestionText: q.QuestionText,
            QuestionType: q.selectedQuestionType === "Text (Short Answer or Long Answer)" ? "Text" : q.selectedQuestionType,
          };
  
          // Handle different question types
          if (q.selectedQuestionType === "Text (Short Answer or Long Answer)") {
            questionObj.AnswerText = q.answer; // Include AnswerText for Text questions
          } else {
            questionObj.Options = (q.options || []).map((opt) => ({
              OptionText: opt.OptionText,
              IsCorrect: opt.IsCorrect,
            }));
            questionObj.CorrectAnswer = q.options
              .filter((opt) => opt.IsCorrect)
              .map((opt) => opt.OptionText);
          }
  
          return questionObj;
        }),
      };
  
      // Log request body for debugging
      console.log("Request Body:", JSON.stringify(requestBody, null, 2));
  
      // API request to save the paper
      const response = await axios.post(
        `${API_BASE_URL}/training-master/Quiz_QandA_controller/addQuestionPaper`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
  
      console.log("API Response:", response.data);
  
      // Handle response
      if (response.data?.error) {
        if (response.data.error.includes("PaperName already exists")) {
          setSuccessMessageContent(
            `Please note, the paper name '${response.data.duplicatePaperName || paperName}' already exists.`
          );
        } else {
          setSuccessMessageContent(response.data.error);
        }
        setSuccessMessageOpen(true);
      } else if (response.data?.message) {
        setSuccessMessageContent("Paper saved successfully!");
        setSuccessMessageOpen(true);
        setOpenAddDialog(false);
        resetForm();
  
        // Refresh the list of papers
        fetchPapers(); // Call fetchPapers to refresh the list
      }
    } catch (error) {
      console.error("API Error:", error);
  
      if (error.response?.status === 400) {
        const { error: errorMessage, duplicatePaperName } = error.response.data;
        if (errorMessage.includes("PaperName already exists")) {
          setSuccessMessageContent(`Paper name '${duplicatePaperName}' already exists`);
        } else {
          setSuccessMessageContent(errorMessage);
        }
      } else {
        setSuccessMessageContent("An error occurred while saving the paper.");
      }
  
      setSuccessMessageOpen(true);
    }
  };


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
              marginBottom: "9px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
            }}
          >
            <IconButton 
              onClick={() => navigate('/admindashboard/setup')}
              sx={{
                backgroundColor: "white",
                color: 'black',
                '&:hover': { backgroundColor: "#cbd5e1" },
                borderRadius: "8px",
                padding: "6px"
              }}
            >
              <ArrowBackIcon />
            </IconButton>

            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
              Master Quiz Papers
            </Typography>
            <Tooltip title="Add Quiz Paper">
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
                  Add Quiz Paper
                </Button>
              
            )}
            </Tooltip>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Export to Excel">
                <Button
                  onClick={() => {
                    const dataForExport = prepareDataForExport(filteredPapers);
                    exportData(dataForExport, 'Quiz_Papers', 'excel');
                  }}
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
            <TextField
              variant="outlined"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="small"
              sx={{ width: '40%' }}
            />
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Table>
            <TableHead sx={{ backgroundColor: '#1A005D' }}>
          <TableRow>
            {['SL No.', 'Paper Name', 'Questions', 'Created By', 'Created Date', 'Actions'].map((header) => (
              <TableCell 
                key={header} 
                sx={{ 
                  fontWeight: 'bold', 
                  color: 'white', 
                  textAlign: header === 'Actions' ? 'center' : 'left',
                  padding: '2px',
                  fontSize: '1.04rem'
                }}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
  {filteredPapers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((paper, index) => (
    <TableRow 
      key={paper.id} 
      hover 
      sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f8fafc' }, '&:nth-of-type(even)': { backgroundColor: '#e2e8f0' } }}
      onClick={() => {
        setViewPaperData(paper); // Set the paper data to view
        setOpenViewDialog(true); // Open the View Paper dialog
      }}
      style={{ cursor: 'pointer' }} // Add pointer cursor to indicate clickable row
    >
      <TableCell sx={{ padding: '2px', fontSize: '1.03rem' }}>{index + 1}</TableCell>
      <TableCell sx={{ padding: '2px', fontSize: '1.03rem' }}>{paper.PaperName}</TableCell>
      <TableCell sx={{ padding: '2px', fontSize: '1.03rem' }}>
        <span style={{ textDecoration: 'underline dotted', color: '#1976d2' }}>
          View Questions ({paper.questions.length})
        </span>
      </TableCell>
      <TableCell sx={{ padding: '2px', fontSize: '1.03rem' }}>{paper.UserCreatedBy}</TableCell>
      <TableCell sx={{ padding: '2px', fontSize: '1.03rem' }}>{paper.UserCreatedDateTime}</TableCell>
      <TableCell sx={{ textAlign: 'center', padding: '2px' }}>
      {canEdit && (
                        <>
        <IconButton 
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click event from firing
            handleEditClick(paper);
          }} 
          sx={{ color: '#1976d2' }}
        >
          <EditIcon size={20} />
        </IconButton>
        <IconButton 
          onClick={(e) => { 
            e.stopPropagation(); // Prevent row click event from firing
            setPaperToDelete(paper); 
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
            count={filteredPapers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
          />

          {/* Add Paper Dialog */}
          <Dialog
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          fullWidth
          maxWidth="lg"
          sx={{
            marginTop: '40px', // Add top margin
            marginBottom: '0px', // Add bottom margin
            '& .MuiDialog-paper': {
              width: '100%', // Ensure the dialog takes the full width within the maxWidth constraint
              height: '80vh', // Standardize height (80% of the viewport height)
              maxHeight: '80vh', // Ensure it doesn't exceed 80vh
            },
          }}
        >
  <DialogTitle sx={{ fontWeight: 'bold', color: '#1A005D', textAlign: 'center', pb: 1 }}>
    New Quiz Form
  </DialogTitle>
  <DialogContent>
    {/* New Question Form */}
    <Grid container spacing={1}>
      {/* Paper Name Input */}
      <Grid item xs={6}>
        <TextField
          label="Paper Name"
          fullWidth
          size="small"
          value={paperName}
          onChange={(e) => setPaperName(e.target.value)}
          error={!!formError.paperName}
          helperText={formError.paperName ? "Paper name is required" : ""}
        />
      </Grid>

      {/* Question Type Dropdown */}
      <Grid item xs={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Question Type</InputLabel>
          <Select
            value={selectedQuestionType}
            onChange={(e) => {
              setSelectedQuestionType(e.target.value);
              // Set default options when selecting MCQ or True/False
              if (e.target.value === 'MCQ (Multiple Choice Question)') {
                setOptions([
                  { OptionText: '', IsCorrect: true }, // First option is correct by default
                  { OptionText: '', IsCorrect: false },
                ]);
              } else if (e.target.value === 'True/False') {
                setOptions([
                  { OptionText: 'True', IsCorrect: true },
                  { OptionText: 'False', IsCorrect: false },
                ]);
              } else {
                // For Text questions, clear options and set answer input if needed
                setOptions([]);
                setAnswerInput('');
              }
            }}
          >
            <MenuItem value="MCQ (Multiple Choice Question)">MCQ</MenuItem>
            <MenuItem value="Text (Short Answer or Long Answer)">Text</MenuItem>
            <MenuItem value="True/False">True/False</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* Question Text Input */}
      <Grid item xs={12}>
        <TextField
          label="Question Text"
          fullWidth
          multiline
          rows={2}
          value={questionInput}
          onChange={(e) => setQuestionInput(e.target.value)}
          error={!!formError.questionInput}
          helperText={formError.questionInput ? "Question text is required" : ""}
        />
      </Grid>

      {/* Conditional Answer Field for Text Questions */}
      {selectedQuestionType === 'Text (Short Answer or Long Answer)' && (
        <Grid item xs={12}>
          <TextField
            label="Answer"
            fullWidth
            multiline
            rows={1}
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            error={!!formError.answerInput}
            helperText={formError.answerInput ? "Answer is required" : ""}
          />
        </Grid>
      )}

      {/* MCQ Options Section */}
      {selectedQuestionType === 'MCQ (Multiple Choice Question)' && (
        <>
          {/* Options Count and Single/Multiple Correct Toggle */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={2}>
              <TextField
                label="Options"
                type="number"
                value={options.length}
                onChange={(e) => {
                  const newCount = Math.max(2, parseInt(e.target.value) || 2);
                  setOptions(
                    Array.from({ length: newCount }, (_, index) => ({
                      OptionText: options[index]?.OptionText || '',
                      IsCorrect: index === 0,
                    }))
                  );
                }}
                fullWidth
                size="small"
                inputProps={{ min: 2 }}
              />
            </Grid>
            <Grid item>
              <FormControl component="fieldset">
                <RadioGroup
                  row
                  value={isSingleCorrect ? 'single' : 'multiple'}
                  onChange={(e) => {
                    const isSingle = e.target.value === 'single';
                    setIsSingleCorrect(isSingle);
                    setOptions(
                      options.map((opt, index) => ({
                        ...opt,
                        IsCorrect: isSingle ? index === 0 : opt.IsCorrect,
                      }))
                    );
                  }}
                >
                  <FormControlLabel value="single" control={<Radio size="small" />} label="Single" />
                  <FormControlLabel value="multiple" control={<Radio size="small" />} label="Multiple" />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>

          {/* Options List for MCQ */}
          <Grid item xs={10}>
            {options.map((option, index) => (
              <Box key={index} display="flex" alignItems="center" gap={1} my={1}>
                {isSingleCorrect ? (
                  <Radio
                    checked={option.IsCorrect}
                    onChange={() =>
                      setOptions(
                        options.map((opt, i) => ({
                          ...opt,
                          IsCorrect: i === index,
                        }))
                      )
                    }
                    size="small"
                  />
                ) : (
                  <Checkbox
                    checked={option.IsCorrect}
                    onChange={() =>
                      setOptions(
                        options.map((opt, i) =>
                          i === index ? { ...opt, IsCorrect: !opt.IsCorrect } : opt
                        )
                      )
                    }
                    size="small"
                  />
                )}
                <TextField
                  label={`Option ${index + 1}`}
                  value={option.OptionText}
                  onChange={(e) =>
                    setOptions(
                      options.map((opt, i) =>
                        i === index ? { ...opt, OptionText: e.target.value } : opt
                      )
                    )
                  }
                  fullWidth
                  size="small"
                  error={!!formError.options && !option.OptionText.trim()}
                  helperText={
                    formError.options && !option.OptionText.trim()
                      ? "Option text is required"
                      : ""
                  }
                />
              </Box>
            ))}
          </Grid>
        </>
      )}

      {/* True/False Section */}
      {selectedQuestionType === 'True/False' && (
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Select the correct answer:
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              value={options.find(opt => opt.IsCorrect)?.OptionText || 'True'}
              onChange={(e) => {
                const newOptions = options.map(opt => ({
                  ...opt,
                  IsCorrect: opt.OptionText === e.target.value,
                }));
                setOptions(newOptions);
              }}
            >
              <FormControlLabel value="True" control={<Radio size="small" />} label="True" />
              <FormControlLabel value="False" control={<Radio size="small" />} label="False" />
            </RadioGroup>
          </FormControl>
        </Grid>
      )}
    </Grid>

    {/* Clear and Add Question Buttons */}
    <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
      <Button
        variant="outlined"
        onClick={() => {
          setQuestionInput('');
          setOptions([]);
          setSelectedQuestionType('');
          setAnswerInput('');
          setFormError({});
        }}
      >
        Clear
      </Button>
      <Button
        variant="contained"
        onClick={handleAddQuestion}
        sx={{ backgroundColor: '#1A005D', color: 'white' }}
        disabled={
          isEditing || // Disable if in edit mode
          !questionInput.trim() || // Disable if question text is empty
          (selectedQuestionType === 'Text (Short Answer or Long Answer)' && !answerInput.trim()) ||
          (selectedQuestionType === 'MCQ (Multiple Choice Question)' &&
            (options.length < 2 || options.some(opt => !opt.OptionText.trim()))) ||
          (selectedQuestionType === 'True/False' &&
            (options.length !== 2 || !options.some(opt => opt.IsCorrect)))
        }
      >
        Add Question
      </Button>
    </Box>

    {/* Added Questions List */}
    <Typography variant="h6" mt={3}>
      Added Questions ({questions.length})
    </Typography>
    {questions.length === 0 ? (
      <Typography variant="body2" color="text.secondary">
        No questions added yet.
      </Typography>
    ) : (
      <List>
        {questions.map((q, index) =>
          editQuestionIndex === index ? (
            // Edit Mode
            <ListItem key={index} divider>
              <Grid container spacing={1}>
                {/* Editable Question Text */}
                <Grid item xs={12}>
                  <TextField
                    label="Edit Question Text"
                    fullWidth
                    multiline
                    rows={2}
                    value={editedQuestionText}
                    onChange={(e) => setEditedQuestionText(e.target.value)}
                    error={!editedQuestionText.trim()}
                    helperText={!editedQuestionText.trim() ? "Question text is required" : ""}
                  />
                </Grid>

                {/* Display Question Type as Read-Only */}
                <Grid item xs={12}>
                  <TextField
                    label="Question Type"
                    fullWidth
                    value={editedQuestionType}
                    disabled
                  />
                </Grid>

                {/* Conditional Rendering for Text Questions */}
                {editedQuestionType === 'Text (Short Answer or Long Answer)' && (
                  <Grid item xs={12}>
                    <TextField
                      label="Answer"
                      fullWidth
                      multiline
                      rows={1}
                      value={editedAnswerInput}
                      onChange={(e) => setEditedAnswerInput(e.target.value)}
                      error={!!formError.answerInput}
                      helperText={formError.answerInput ? "Answer is required" : ""}
                    />
                  </Grid>
                )}

                {/* Conditional Rendering for MCQ Questions */}
                {editedQuestionType === 'MCQ (Multiple Choice Question)' && (
                  <Grid item xs={12}>
                    {editedOptions.map((option, idx) => (
                      <Box key={idx} display="flex" alignItems="center" gap={1} my={1}>
                        {isSingleCorrect ? (
                          <Radio
                            checked={option.IsCorrect}
                            onChange={() =>
                              setEditedOptions(
                                editedOptions.map((opt, i) => ({
                                  ...opt,
                                  IsCorrect: i === idx,
                                }))
                              )
                            }
                            size="small"
                          />
                        ) : (
                          <Checkbox
                            checked={option.IsCorrect}
                            onChange={() =>
                              setEditedOptions(
                                editedOptions.map((opt, i) =>
                                  i === idx ? { ...opt, IsCorrect: !opt.IsCorrect } : opt
                                )
                              )
                            }
                            size="small"
                          />
                        )}
                        <TextField
                          label={`Option ${idx + 1}`}
                          value={option.OptionText}
                          onChange={(e) =>
                            setEditedOptions(
                              editedOptions.map((opt, i) =>
                                i === idx ? { ...opt, OptionText: e.target.value } : opt
                              )
                            )
                          }
                          fullWidth
                          size="small"
                          error={!option.OptionText.trim()}
                          helperText={!option.OptionText.trim() ? "Option text is required" : ""}
                        />
                      </Box>
                    ))}
                  </Grid>
                )}

                {/* Conditional Rendering for True/False Questions */}
                {editedQuestionType === 'True/False' && (
                  <Grid item xs={12}>
                    <FormControl component="fieldset">
                      <RadioGroup
                        value={editedOptions.find(opt => opt.IsCorrect)?.OptionText || ''}
                        onChange={(e) => {
                          const newOptions = editedOptions.map(opt => ({
                            ...opt,
                            IsCorrect: opt.OptionText === e.target.value,
                          }));
                          setEditedOptions(newOptions);
                        }}
                      >
                        <FormControlLabel value="True" control={<Radio size="small" />} label="True" />
                        <FormControlLabel value="False" control={<Radio size="small" />} label="False" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                )}

                {/* Save and Cancel Buttons */}
                <Grid item xs={12} display="flex" justifyContent="flex-end" gap={1}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditQuestionIndex(null);
                      setEditedQuestionText('');
                      setEditedOptions([]);
                      setEditedAnswerInput('');
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handleEditSave(index)}
                    sx={{ backgroundColor: '#1A005D', color: 'white' }}
                    disabled={
                      !editedQuestionText.trim() ||
                      (editedQuestionType === 'Text (Short Answer or Long Answer)' && !editedAnswerInput.trim()) ||
                      (editedQuestionType === 'MCQ (Multiple Choice Question)' &&
                        (editedOptions.length < 2 || editedOptions.some(opt => !opt.OptionText.trim()))) ||
                      (editedQuestionType === 'True/False' &&
                        (editedOptions.length !== 2 || editedOptions.some(opt => !opt.OptionText.trim())))
                    }
                  >
                    Save
                  </Button>
                </Grid>
              </Grid>
            </ListItem>
          ) : (
            // View Mode
            <ListItem key={index} divider>
              <ListItemText
                primary={`${index + 1}: ${q.QuestionText}`}
                secondary={
                  q.selectedQuestionType === 'Text (Short Answer or Long Answer)' &&
                  `Answer: ${q.answer}`
                }
              />
              {index > 0 && (
                <Button
                  onClick={() => moveQuestion(index, 'up')}
                  sx={{ color: 'purple', minWidth: 'auto', mr: 1 }}
                  disabled={isEditing}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </Button>
              )}
              {index < questions.length - 1 && (
                <Button
                  onClick={() => moveQuestion(index, 'down')}
                  sx={{ color: 'purple', minWidth: 'auto', mr: 1 }}
                  disabled={isEditing}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </Button>
              )}
              <IconButton
                onClick={() => {
                  setEditQuestionIndex(index);
                  setEditedQuestionText(q.QuestionText);
                  setEditedQuestionType(q.selectedQuestionType);
                  setEditedOptions(q.options || []);
                  setEditedAnswerInput(q.answer || ''); // Set the answer for Text questions
                  setIsSingleCorrect(q.isSingleCorrect || true);
                  setIsEditing(true);
                }}
                sx={{ color: '#1976d2', mr: 1 }}
                disabled={isEditing}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={() => handleDeleteQuestion(index)}
                sx={{ color: '#d32f2f' }}
                disabled={isEditing}
              >
                <Trash2Icon fontSize="small" />
              </IconButton>
            </ListItem>
          )
        )}
      </List>
    )}
  </DialogContent>
  <DialogActions>
    <Button
      onClick={() => {
        setOpenAddDialog(false);
        resetForm();
      }}
    >
      Cancel
    </Button>
    <Button
      variant="contained"
      sx={{ backgroundColor: '#1A005D', color: 'white' }}
      onClick={handleSavePaper}
      disabled={!paperName.trim() || questions.length === 0}
    >
      Save Paper
    </Button>
  </DialogActions>
</Dialog>

          {/* Edit Paper Dialog */}
          <Dialog
            open={openEditDialog}
            onClose={() => {
              setOpenEditDialog(false);
              resetForm();
            }}
            fullWidth
            maxWidth="lg"
            sx={{
              marginTop: '40px', // Add top margin
              marginBottom: '0px', // Add bottom margin
              '& .MuiDialog-paper': {
                width: '100%', // Ensure the dialog takes the full width within the maxWidth constraint
                height: '80vh', // Standardize height (80% of the viewport height)
                maxHeight: '80vh', // Ensure it doesn't exceed 80vh
              },
            }}
          >
  <DialogTitle sx={{ fontWeight: 'bold', color: '#1A005D', textAlign: 'center', pb: 1 }}>
    Edit Quiz Form
  </DialogTitle>
  <DialogContent>
    <Grid container spacing={1}>
      {/* Paper Name Input */}
      <Grid item xs={6}>
        <TextField
          label="Paper Name"
          fullWidth
          size="small"
          value={paperName}
          onChange={(e) => setPaperName(e.target.value)}
          error={!!formError.paperName}
          helperText={formError.paperName ? "Paper name is required" : ""}
        />
      </Grid>

      {/* Question Type Dropdown */}
      <Grid item xs={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Question Type</InputLabel>
          <Select
            value={selectedQuestionType}
            onChange={(e) => {
              setSelectedQuestionType(e.target.value);
              if (e.target.value === 'MCQ (Multiple Choice Question)') {
                setOptions([
                  { OptionText: '', IsCorrect: true },
                  { OptionText: '', IsCorrect: false },
                ]);
              } else if (e.target.value === 'True/False') {
                setOptions([
                  { OptionText: 'True', IsCorrect: true },
                  { OptionText: 'False', IsCorrect: false },
                ]);
              } else {
                setOptions([]);
                setAnswerInput('');
              }
            }}
          >
            <MenuItem value="MCQ (Multiple Choice Question)">MCQ</MenuItem>
            <MenuItem value="Text (Short Answer or Long Answer)">Text</MenuItem>
            <MenuItem value="True/False">True/False</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* Question Text Input */}
      <Grid item xs={12}>
        <TextField
          label="Question Text"
          fullWidth
          multiline
          rows={2}
          value={questionInput}
          onChange={(e) => setQuestionInput(e.target.value)}
          error={!!formError.questionInput}
          helperText={formError.questionInput ? "Question text is required" : ""}
        />
      </Grid>

      {/* Conditional Answer Field for Text Questions */}
      {selectedQuestionType === 'Text (Short Answer or Long Answer)' && (
        <Grid item xs={12}>
          <TextField
            label="Answer"
            fullWidth
            multiline
            rows={1}
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            error={!!formError.answerInput}
            helperText={formError.answerInput ? "Answer is required" : ""}
          />
        </Grid>
      )}

      {/* MCQ Options Section */}
      {selectedQuestionType === 'MCQ (Multiple Choice Question)' && (
        <>
          {/* Options Count and Single/Multiple Correct Toggle */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={2}>
              <TextField
                label="Options"
                type="number"
                value={options.length}
                onChange={(e) => {
                  const newCount = Math.max(2, parseInt(e.target.value) || 2);
                  setOptions(
                    Array.from({ length: newCount }, (_, index) => ({
                      OptionText: options[index]?.OptionText || '',
                      IsCorrect: index === 0,
                    }))
                  );
                }}
                fullWidth
                size="small"
                inputProps={{ min: 2 }}
              />
            </Grid>
            <Grid item>
              <FormControl component="fieldset">
                <RadioGroup
                  row
                  value={isSingleCorrect ? 'single' : 'multiple'}
                  onChange={(e) => {
                    const isSingle = e.target.value === 'single';
                    setIsSingleCorrect(isSingle);
                    setOptions(
                      options.map((opt, index) => ({
                        ...opt,
                        IsCorrect: isSingle ? index === 0 : opt.IsCorrect,
                      }))
                    );
                  }}
                >
                  <FormControlLabel value="single" control={<Radio size="small" />} label="Single" />
                  <FormControlLabel value="multiple" control={<Radio size="small" />} label="Multiple" />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>

          {/* Options List for MCQ */}
          <Grid item xs={10}>
            {options.map((option, index) => (
              <Box key={index} display="flex" alignItems="center" gap={1} my={1}>
                {isSingleCorrect ? (
                  <Radio
                    checked={option.IsCorrect}
                    onChange={() =>
                      setOptions(
                        options.map((opt, i) => ({
                          ...opt,
                          IsCorrect: i === index,
                        }))
                      )
                    }
                    size="small"
                  />
                ) : (
                  <Checkbox
                    checked={option.IsCorrect}
                    onChange={() =>
                      setOptions(
                        options.map((opt, i) =>
                          i === index ? { ...opt, IsCorrect: !opt.IsCorrect } : opt
                        )
                      )
                    }
                    size="small"
                  />
                )}
                <TextField
                  label={`Option ${index + 1}`}
                  value={option.OptionText}
                  onChange={(e) =>
                    setOptions(
                      options.map((opt, i) =>
                        i === index ? { ...opt, OptionText: e.target.value } : opt
                      )
                    )
                  }
                  fullWidth
                  size="small"
                  error={!!formError.options && !option.OptionText.trim()}
                  helperText={
                    formError.options && !option.OptionText.trim()
                      ? "Option text is required"
                      : ""
                  }
                />
              </Box>
            ))}
          </Grid>
        </>
      )}

      {/* True/False Section */}
      {selectedQuestionType === 'True/False' && (
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Select the correct answer:
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              value={options.find(opt => opt.IsCorrect)?.OptionText || 'True'}
              onChange={(e) => {
                const newOptions = options.map(opt => ({
                  ...opt,
                  IsCorrect: opt.OptionText === e.target.value,
                }));
                setOptions(newOptions);
              }}
            >
              <FormControlLabel value="True" control={<Radio size="small" />} label="True" />
              <FormControlLabel value="False" control={<Radio size="small" />} label="False" />
            </RadioGroup>
          </FormControl>
        </Grid>
      )}
    </Grid>

    {/* Clear and Add Question Buttons */}
    <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
      <Button
        variant="outlined"
        onClick={() => {
          setQuestionInput('');
          setOptions([]);
          setSelectedQuestionType('');
          setAnswerInput('');
          setFormError({});
        }}
      >
        Clear
      </Button>
      <Button
        variant="contained"
        onClick={handleAddQuestion}
        sx={{ backgroundColor: '#1A005D', color: 'white' }}
        disabled={
          isEditing ||
          !questionInput.trim() ||
          (selectedQuestionType === 'Text (Short Answer or Long Answer)' && !answerInput.trim()) ||
          (selectedQuestionType === 'MCQ (Multiple Choice Question)' &&
            (options.length < 2 || options.some(opt => !opt.OptionText.trim()))) ||
          (selectedQuestionType === 'True/False' &&
            (options.length !== 2 || !options.some(opt => opt.IsCorrect)))
        }
      >
        Add Question
      </Button>
    </Box>

    {/* Added Questions List */}
    <Typography variant="h6" mt={3}>
      Added Questions ({questions.length})
    </Typography>
    {questions.length === 0 ? (
      <Typography variant="body2" color="text.secondary">
        No questions added yet.
      </Typography>
    ) : (
      <List>
        {questions.map((q, index) =>
          editQuestionIndex === index ? (
            // Edit Mode
            <ListItem key={index} divider>
              <Grid container spacing={1}>
                {/* Editable Question Text */}
                <Grid item xs={12}>
                  <TextField
                    label="Edit Question Text"
                    fullWidth
                    multiline
                    rows={2}
                    value={editedQuestionText}
                    onChange={(e) => setEditedQuestionText(e.target.value)}
                    error={!editedQuestionText.trim()}
                    helperText={!editedQuestionText.trim() ? "Question text is required" : ""}
                  />
                </Grid>

                {/* Display Question Type as Read-Only */}
                <Grid item xs={12}>
                  <TextField
                    label="Question Type"
                    fullWidth
                    value={editedQuestionType}
                    disabled
                  />
                </Grid>

                {/* Conditional Rendering for Text Questions */}
                {editedQuestionType === 'Text (Short Answer or Long Answer)' && (
              <Grid item xs={12}>
                <TextField
                  label="Answer"
                  fullWidth
                  multiline
                  rows={1}
                  value={editedAnswerInput}
                  onChange={(e) => setEditedAnswerInput(e.target.value)}
                  error={!!formError.answerInput}
                  helperText={formError.answerInput ? "Answer is required" : ""}
                />
              </Grid>
            )}

                {/* Conditional Rendering for MCQ Questions */}
                {editedQuestionType === 'MCQ (Multiple Choice Question)' && (
                  <Grid item xs={12}>
                    {editedOptions.map((option, idx) => (
                      <Box key={idx} display="flex" alignItems="center" gap={1} my={1}>
                        {isSingleCorrect ? (
                          <Radio
                            checked={option.IsCorrect}
                            onChange={() =>
                              setEditedOptions(
                                editedOptions.map((opt, i) => ({
                                  ...opt,
                                  IsCorrect: i === idx,
                                }))
                              )
                            }
                            size="small"
                          />
                        ) : (
                          <Checkbox
                            checked={option.IsCorrect}
                            onChange={() =>
                              setEditedOptions(
                                editedOptions.map((opt, i) =>
                                  i === idx ? { ...opt, IsCorrect: !opt.IsCorrect } : opt
                                )
                              )
                            }
                            size="small"
                          />
                        )}
                        <TextField
                          label={`Option ${idx + 1}`}
                          value={option.OptionText}
                          onChange={(e) =>
                            setEditedOptions(
                              editedOptions.map((opt, i) =>
                                i === idx ? { ...opt, OptionText: e.target.value } : opt
                              )
                            )
                          }
                          fullWidth
                          size="small"
                          error={!option.OptionText.trim()}
                          helperText={!option.OptionText.trim() ? "Option text is required" : ""}
                        />
                      </Box>
                    ))}
                  </Grid>
                )}

                {/* Conditional Rendering for True/False Questions */}
                {editedQuestionType === 'True/False' && (
                  <Grid item xs={12}>
                    <FormControl component="fieldset">
                      <RadioGroup
                        value={editedOptions.find(opt => opt.IsCorrect)?.OptionText || ''}
                        onChange={(e) => {
                          const newOptions = editedOptions.map(opt => ({
                            ...opt,
                            IsCorrect: opt.OptionText === e.target.value,
                          }));
                          setEditedOptions(newOptions);
                        }}
                      >
                        <FormControlLabel value="True" control={<Radio size="small" />} label="True" />
                        <FormControlLabel value="False" control={<Radio size="small" />} label="False" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                )}

                {/* Save and Cancel Buttons */}
                <Grid item xs={12} display="flex" justifyContent="flex-end" gap={1}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditQuestionIndex(null);
                      setEditedQuestionText('');
                      setEditedOptions([]);
                      setEditedAnswerInput('');
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handleEditSave(index)}
                    sx={{ backgroundColor: '#1A005D', color: 'white' }}
                    disabled={
                      !editedQuestionText.trim() ||
                      (editedQuestionType === 'Text (Short Answer or Long Answer)' && !editedAnswerInput.trim()) ||
                      (editedQuestionType === 'MCQ (Multiple Choice Question)' &&
                        (editedOptions.length < 2 || editedOptions.some(opt => !opt.OptionText.trim()))) ||
                      (editedQuestionType === 'True/False' &&
                        (editedOptions.length !== 2 || editedOptions.some(opt => !opt.OptionText.trim())))
                    }
                  >
                    Save
                  </Button>
                </Grid>
              </Grid>
            </ListItem>
          ) : (
            // View Mode
            <ListItem key={index} divider>
              <ListItemText
                primary={`${index + 1}: ${q.QuestionText}`}
                secondary={
                  q.selectedQuestionType === 'Text (Short Answer or Long Answer)' &&
                  `Answer: ${q.answer}`
                }
              />
              {index > 0 && (
                <Button
                  onClick={() => moveQuestion(index, 'up')}
                  sx={{ color: 'purple', minWidth: 'auto', mr: 1 }}
                  disabled={isEditing}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </Button>
              )}
              {index < questions.length - 1 && (
                <Button
                  onClick={() => moveQuestion(index, 'down')}
                  sx={{ color: 'purple', minWidth: 'auto', mr: 1 }}
                  disabled={isEditing}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </Button>
              )}
              <IconButton
                onClick={() => {
                  setEditQuestionIndex(index);
                  setEditedQuestionText(q.QuestionText);
                  setEditedQuestionType(q.selectedQuestionType);
                  setEditedOptions(q.options || []);
                  setEditedAnswerInput(q.answer || ''); // Set the answer for Text questions
                  setIsSingleCorrect(q.isSingleCorrect || true);
                  setIsEditing(true);
                }}
                sx={{ color: '#1976d2', mr: 1 }}
                disabled={isEditing}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={() => handleDeleteQuestion(index)}
                sx={{ color: '#d32f2f' }}
                disabled={isEditing}
              >
                <Trash2Icon fontSize="small" />
              </IconButton>
            </ListItem>
          )
        )}
      </List>
    )}
  </DialogContent>
  <DialogActions>
    <Button
      onClick={() => {
        setOpenEditDialog(false);
        resetForm();
      }}
    >
      Cancel
    </Button>
    <Button
      variant="contained"
      sx={{ backgroundColor: '#1A005D', color: 'white' }}
      onClick={handleUpdatePaper}
      disabled={!paperName.trim() || questions.length === 0}
    >
      Update Paper
    </Button>
  </DialogActions>
</Dialog>
          {/* Delete Confirmation Dialog */}
          <Dialog
  open={openDeleteDialog}
  onClose={() => setOpenDeleteDialog(false)}
>
  <DialogTitle>Confirm Delete</DialogTitle>
  <DialogContent>
    <Typography>Are you sure you want to delete this paper?</Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
    <Button 
      onClick={handleConfirmDelete} 
      color="error"
    >
      Delete
    </Button>
  </DialogActions>
</Dialog>
    
    {/*view paper Dialog */}
    <Dialog
      open={openViewDialog}
      onClose={() => setOpenViewDialog(false)}
      fullWidth
      maxWidth="md"
      sx={{
        marginTop: '40px', // Add top margin
        marginBottom: '0px', // Add bottom margin
        '& .MuiDialog-paper': {
          width: '100%', // Ensure the dialog takes the full width within the maxWidth constraint
        },
      }}
    >
  <DialogTitle sx={{ fontWeight: "bold", color: "#1A005D", textAlign: "center" }}>
    Quiz Paper
  </DialogTitle>
  <DialogContent>
    {viewPaperData && (
      <Paper elevation={3} sx={{ padding: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          <b>Paper Name:</b> {viewPaperData.PaperName}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          <b>Created By:</b> {viewPaperData.UserCreatedBy}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          <b>Created Date:</b> {viewPaperData.UserCreatedDateTime}
        </Typography>

        <Typography variant="h6" mt={3} gutterBottom>
          Questions ({viewPaperData.questions.length})
        </Typography>
        <List>
          {viewPaperData.questions.map((q, index) => (
            <Box key={index} sx={{ mb: 2, padding: 2, backgroundColor: "#f9f9f9", borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                {index + 1}. {q.QuestionText}
              </Typography>
              {q.QuestionType === "Text" ? (
                <Typography variant="body1" sx={{ mt: 1, fontStyle: "italic" }}>
                  Answer: {q.AnswerText}
                </Typography>
              ) : (
                <List>
                  {q.Options.map((opt, optIndex) => (
                    <ListItem key={optIndex} sx={{ pl: 3 }}>
                      <ListItemText
                        primary={`${opt.OptionText} ${opt.IsCorrect ? "✔️" : ""}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              <Divider sx={{ mt: 1 }} />
            </Box>
          ))}
        </List>
      </Paper>
    )}
  </DialogContent>
  <DialogActions>
    <Button
      onClick={() => setOpenViewDialog(false)}
      sx={{ backgroundColor: "#1A005D", color: "white", ":hover": { backgroundColor: "#320080" } }}
    >
      Close
    </Button>
  </DialogActions>
</Dialog>
 

<Snackbar
  open={successMessageOpen}
  autoHideDuration={6000}
  onClose={() => setSuccessMessageOpen(false)}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
>
  <Alert
    onClose={() => setSuccessMessageOpen(false)}
    severity={successMessageContent.includes("error") ? "error" : "success"}
    sx={{ width: '100%' }}
  >
    {successMessageContent}
  </Alert>
</Snackbar>
        </Box>
      </div>
        
    </div>
  );
}

export default TrainingQuizMaster;