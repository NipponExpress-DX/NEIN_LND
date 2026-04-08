import React, {useEffect,useMemo ,useContext , useState } from 'react';
import axios from 'axios';
import { Card,CardContent,Slide,Modal,Snackbar, Alert,Collapse, Tabs, Tab, Box,Popover, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Select, MenuItem, FormControl,FormLabel,FormControlLabel,RadioGroup,Radio,Checkbox, Breadcrumbs, Link, Typography, TablePagination, 
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, InputLabel, 
  Grid2} from '@mui/material';
  import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
  import CircleIcon from '@mui/icons-material/Circle';  
  import QuerySubmitModal from './QuerySubmitModal';
  import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import Grid from '@mui/material/Grid';
import CloseIcon from "@mui/icons-material/Close";
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import AddIcon from '@mui/icons-material/Add';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import '../../../css/Admincss/AdminDashboard.css';
import '../../../css/Admincss/AdminDashboardContent.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useNavigate } from 'react-router-dom';
import SearchFilter from './SearchFilter';
import DateFilter from './DateFilter';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Tooltip from '@mui/material/Tooltip';
import Autocomplete from '@mui/material/Autocomplete';
import '@fontsource/comfortaa'; 
import { useAgenda  } from '../Agenda/AgendaContext';
import CircularProgress from '@mui/material/CircularProgress';
import InfoIcon from '@mui/icons-material/Info';
import NextPlanIcon from '@mui/icons-material/NextPlan';
import ScheduleIcon  from '@mui/icons-material/Schedule';
import CancelIcon from '@mui/icons-material/Cancel';
import Menu from '@mui/material/Menu';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import Edit from '@mui/icons-material/Edit';
import MapIcon from '@mui/icons-material/Map';
import Visibility from '@mui/icons-material/Visibility';
import PostponeSession from './PostponeSession'; 

dayjs.extend(isBetween);


  function UserDashboardContent() {
    const { agendaData } = useAgenda();
    const [sessionsData, setSessionsData] = useState({});

    const [selectedTrainingId, setSelectedTrainingId] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const [activeTab, setActiveTab] = useState(0);
    const navigate = useNavigate();
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [otherOptions, setOtherOptions] = useState([]);
    const [trainingData, setTrainingData] = useState([]); // Initialize with empty array
    const [trainingPlanModalOpen, setTrainingPlanModalOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = React.useState(false);
    const [snackbarMessage, setSnackbarMessage] = React.useState('');
    const [snackbarSeverity, setSnackbarSeverity] = React.useState('success'); // 'success', 'error', 'info', 'warning'
    const [otherTrainees, setOtherTrainees] = useState([]);

    const [isBannerVisible, setIsBannerVisible] = useState(false);
    const [submittedQuery, setSubmittedQuery] = useState(null);
    const [selectedTrainningId, setSelectedTrainningId] = React.useState(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [planningData, setPlanningData] = React.useState({ success: false, data: [] });
    const [sessionListData, setSessionListData] = React.useState({ trainers: [] });
    const [mappingData, setMappingData] = React.useState({ success: false, data: [] });
    const [mappingTraineesData, setMappingTraineesData] = useState([]);

    
    const [trainees, setTrainees] = React.useState([]);
    const [selectedTrainees, setSelectedTrainees] = React.useState({}); 
    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);
    const handleSnackbarOpen = () => setSnackbarOpen(true);
    const handleSnackbarClose = () => setSnackbarOpen(false);
    const [error, setError] = useState(null); // Error state for API call
    const [anchorEl, setAnchorEl] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTraining, setSelectedTraining] = useState(null); 
    const [formType, setFormType] = useState('');
    const [dateFilter, setDateFilter] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState(null);
    const [customEndDate, setCustomEndDate] = useState(null);
    const [statusFilter, setStatusFilter] = useState([]); // Initialize as an empty array
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [expanded, setExpanded] = useState({});
    const [selectedStatus, setSelectedStatus] = useState('');
    const [actionMenuAnchor, setActionMenuAnchor] = React.useState(null);
    const [actionMenuSession, setActionMenuSession] = React.useState(null);

    const [topTab, setTopTab] = useState(0); // 0 for Admin View, 1 for User View
    const [nestedTab, setNestedTab] = useState(0); // 0 for Training List, 1 for Trainings with Agenda

    const [feedbackForms, setFeedbackForms] = useState([]); // To store feedback forms
    const [selectedFeedbackForm, setSelectedFeedbackForm] = useState(""); // Selected feedback form ID
    const [selectedFeedbackFormName, setSelectedFeedbackFormName] = useState(""); // Selected feedback form name
    const [feedbackQuestions, setFeedbackQuestions] = useState({}); // To store the questions
    const [openPostponeModal, setOpenPostponeModal] = useState(false);

    const [branchMaster, setBranchMaster] = useState([]);
    const [departmentMaster, setDepartmentMaster] = useState([]);
    const [staffCategories, setStaffCategories] = useState([]);
    const [trainingTopics, setTrainingTopics] = useState([]);
    const [trainingTypes, setTrainingTypes] = useState([]);
    
    const [openReasonDialog, setOpenReasonDialog] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");
    const [attendanceDialogOpen, setAttendanceDialogOpen] = React.useState(false);
    const [selectedSession, setSelectedSession] = React.useState(null);
    const [feedbackData, setFeedbackData] = useState({ submitted: 0, assigned: 0 });
    const [assignFeedbackDialogOpen, setAssignFeedbackDialogOpen] = useState(false);
    const [feedbackAwaitingDialogOpen, setFeedbackAwaitingDialogOpen] = useState(false);

    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [selectedPlaningId, setSelectedPlaningId] = useState(null);

    const [finalSubmitDate, setFinalSubmitDate] = useState(dayjs()); // Ensure it's initialized with a valid date

    

    const fetchOtherTrainees = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/login/activeEmplList1`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
    
        const data = await response.json();
        console.log("API Response:", data); // Debugging
    
        // Extract 'employees' array from response
        const trainees = data.employees || []; 
    
        if (!Array.isArray(trainees)) {
          throw new Error("Invalid response format: Expected an array.");
        }
    
        // Use `id` as a unique identifier instead of `label`
        setOtherTrainees(
          trainees.map((trainee) => ({
            label: trainee.full_name || "N/A",
            id: trainee.emp_id,  // Ensure unique ID is used
          }))
        );
        console.log("Other Trainees:", otherTrainees);
      } catch (error) {
        console.error("Error fetching other trainees:", error);
      }
    };
    
    

    const handleOpenSnackbar = (message, severity) => {
      setSnackbarMessage(message);
      setSnackbarSeverity(severity);
      setSnackbarOpen(true);
    }
    
    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
          const { emp_id: userId } = userDetails;

          console.log("User Details:", userDetails);
          console.log("userId:", userId);


          if (!userId) {
            throw new Error("User ID is missing in session storage.");
          }
         
          const response = await axios.post(`${API_BASE_URL}/planning-route/PlanningSessionActiveTrainees/UserViewListBasisBranch`, {
            branch_id: userDetails.user_branch , 
          });
          const data = response.data;
          console.log("API Response fetchUserData:",data);

          const formattedData = data.map((record) => ({
            id: record.id,
            branch: record.branch_id.includes("all")
              ? "Pan India"
              : formatMultiSelect(record.branch_id.split(","), branchMaster, "branch_id"),
            department: record.department_id.includes("all")
              ? "All Departments"
              : formatMultiSelect(record.department_id.split(","), departmentMaster, "department_id"),
            staffCategory: record.staff_category_id
              ? formatMultiSelect(record.staff_category_id.split(","), staffCategories, "id")
              : "N/A",
            topic: trainingTopics.find((topic) => String(topic.id) === String(record.training_topic_id))?.training_topic || "N/A",
            trainerType: trainingTypes.find((type) => String(type.id) === String(record.training_type_id))?.training_type || "N/A",
            date: record.planning_date ? dayjs(record.planning_date).format("YYYY-MM-DD") : "N/A",
            status: getStatusForUI(record.Status),
            remarks: record.remarks || "N/A",
            planningType: record.planning_type || "N/A",
            cancelReason: record.cancelled_reason || "N/A",
          }));
  
          setTrainingData(formattedData);
        } catch (error) {
          console.error("Error fetching training data:", error);
          setError("Failed to load data.");
        }
      };

      fetchUserData();
    }, []);
    
    const fetchTrainingData = async () => {
      try {
      
        const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
        if (!userDetails.emp_id) {
          throw new Error("User is not logged in. Please log in to proceed.");
        }
    
        const response = await axios.post(
          `${API_BASE_URL}/planning-route/details`,
          { userid: userDetails.emp_id }
        );
    
        console.log("API Response:", response.data);
    
        if (response.data && Array.isArray(response.data.records)) {
          // Set the training data directly with all fields, including `cancelled_reason`
          setTrainingData(response.data.records);
          setError(null); // Clear previous errors
        } else {
          throw new Error("Unexpected response format or no records found.");
        }
      } catch (err) {
        console.error("Error fetching training data:", err);
        setError(err.response?.data?.message || "Failed to fetch training data.");
      } 
    };
    
    
    const initialFormData = {
      branch: [],
      department: [],
      staffCategory: [],
      topic: '',
      trainerType: '',
      date: null,
      remarks: '',
      status: 'Training Created',
      isPlanned: '',
    };
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
      const fetchData = async () => {
        try {
          const [branchResponse, departmentResponse, staffResponse, topicsResponse, typesResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/training-master/branchmaster/list`),
            axios.get(`${API_BASE_URL}/training-master/department/list`),
            axios.get(`${API_BASE_URL}/training-master/staff-category/list`),
            axios.get(`${API_BASE_URL}/training-master/topic/list`),
            axios.get(`${API_BASE_URL}/training-master/type/list`),
          ]);
    
          const branches = branchResponse.data.topics || [];
          const departments = departmentResponse.data.topics || [];
    
          // Deduplication utility
          const deduplicateOptions = (options, key) => {
            const seen = new Set();
            return options.filter(option => {
              if (seen.has(option[key])) return false;
              seen.add(option[key]);
              return true;
            });
          };
    
          // Ensure "Pan India" and "All Departments" are added only once
          const branchOptions = deduplicateOptions(
            [{ branch_id: 'all', branch_name: 'Pan India' }, ...branches],
            'branch_id'
          );
    
          const departmentOptions = deduplicateOptions(
            [{ department_id: 'all', department_name: 'All Departments' }, ...departments],
            'department_id'
          );
    
          setBranchMaster(branchOptions);
          setDepartmentMaster(departmentOptions);
    
          setStaffCategories(staffResponse.data.topics || []);
          setTrainingTopics(topicsResponse.data.topics || []);
          setTrainingTypes(typesResponse.data.topics || []);
    
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
    
      fetchData();
    }, []);

    const handleExpandClick = async (trainingId) => {
      console.log('handleExpandClick called with trainingId:', trainingId);
    
      setExpanded((prev) => {
        // If the clicked training is already expanded, collapse it; otherwise, collapse all and expand the new one
        const isCurrentlyExpanded = prev[trainingId];
        return { [trainingId]: !isCurrentlyExpanded };
      });
    
      // Fetch sessions only if not already loaded
      if (!sessionsData[trainingId]) {
        console.log('Fetching sessions for trainingId:', trainingId);
        const sessions = await fetchSessionsForTraining(trainingId);
        console.log('Fetched sessions:', sessions);
    
        setSessionsData((prev) => ({
          ...prev,
          [trainingId]: sessions,
        }));
      }
    };
    
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};
const formatTime = (timeString) => {
  if (!timeString) return "N/A"; // Handle missing or undefined inputs

  // If the input is in "HH:mm:ss" format, extract hours and minutes
  const timeParts = timeString.split(":");
  if (timeParts.length !== 3) return "Invalid Time"; // Ensure the correct format

  const [hours, minutes] = timeParts;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const formatDateInfo = (dateString) => {
  const date = new Date(dateString);

  // Format the date as DD-MM-YYYY
  const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
  });

  // Format the time as HH:mm
  const formattedTime = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
  });

  return `${formattedDate} ${formattedTime}`;
}


const fetchSessionsForTraining = async (trainingId) => {
  try {
    console.log('API Request for planningId:', trainingId);
    const response = await axios.post(`${API_BASE_URL}/planning-route/session/list`, {
      planing_id: trainingId,
    });

    console.log('API Response for fetchSessionsForTraining:', response.data);
    if (response.status === 200) {
      return response.data.trainers || [];
    } else {
      console.error('Unexpected response:', response);
      return [];
    }
  } catch (error) {
    console.error('Error fetching session data:', error);
    handleOpenSnackbar('Failed to fetch session data. Please try again.', 'error');
    return [];
  }
};

useEffect(() => {
  console.log('Sessions Data fetchSessionsForTraining:', sessionsData); // Log to check if data is updated
}, [sessionsData]);

const handleTrainingClick = (trainingId) => {
  console.log("Training clicked:", trainingId); // Debug log
  setSelectedTrainingId(trainingId); // Update selected training ID
};

// Trigger session fetch on selectedTrainingId change
useEffect(() => {
  if (selectedTrainingId) {
    fetchSessionsForTraining(selectedTrainingId);  // Only fetch when selectedTrainingId is set
    console.log('Fetching sessions for training ID:', selectedTrainingId);
  }
}, [selectedTrainingId]);  




    const SNACKBAR_MESSAGES = {
      successSubmit: '🎉 Data successfully submitted!',
      successUpdate: '🎉 Data successfully updated!',
      error: '❌ An error occurred during submission. Please try again.',
      trainingNotFound:'❌ Error!!! Training not found',
      trainingCancel:'❌ Cancellation reason is required.',
      UsernotFound:'❌User is not logged in. Please log in to proceed.',
      BranchDepartmentAlert:"Please ensure both branch and department fields are selected.",
      DepartmentAlert:"Please select at least one department.",
      BranchAlert:"Please select at least one branch.",
      staffCategoryAlert:"Selected staff categories are invalid. Please choose valid categories.",
      TopicAlert:"Selected topic is invalid. Please choose a valid topic.",

    };
    
    
    const handleNestedTabChange = (event, newValue) => {
      setNestedTab(newValue);
      setExpanded({}); // Reset all expanded rows
    };
    
    const handleTopTabChange = (event, newValue) => {
      setTopTab(newValue);
      setExpanded({}); 
    };
      
      const handleFieldChange = (field, value) => {
        console.log(`Updating field: ${field}, with value:`, value);
      
        setFormData((prevState) => {
          if (field === 'branch' && value.some(option => option.branch_id === 'all')) {
            // Log all branches to the console
            console.log("Pan India selected. All branches:", branchMaster);
      
            return {
              ...prevState,
              branch: [{ branch_id: 'all', branch_name: 'Pan India' }],
            };
          } else if (field === 'department' && value.some(option => option.department_id === 'all')) {
            // Log all departments to the console
            console.log("All Departments selected. All departments:", departmentMaster);
      
            return {
              ...prevState,
              department: [{ department_id: 'all', department_name: 'All Departments' }], 
            };
          } else {
            // Default behavior for other cases
            return {
              ...prevState,
              [field]: value,
            };
          }
        });
      };
      
        
    const handleAddModalClose = () => {
      setFormData(initialFormData); // Reset the form data
      setFormType(''); // Reset the form type to default
      setIsAddModalOpen(false); // Close the modal
      setIsPlanned(''); // Reset the planned type
      setFilteredTopics([]); // Clear filtered topics
    };
    
 
  const handleSubmitQuery = ({ email, query, attachment }) => {
    const newQuery = {
      email,
      query,
      attachmentName: attachment ? attachment.name : 'No attachment',
    };

    setSubmittedQuery(newQuery);
    setIsModalOpen(false);
    setIsBannerVisible(true);

    // Automatically hide the banner after 3 seconds
    setTimeout(() => {
      setIsBannerVisible(false);
    }, 3000);
  };

  const [isPlanned, setIsPlanned] = useState('Planned'); 
  const handleClose = (id) => setAnchorEl((prev) => ({ ...prev, [id]: null }));
  const handleIconClick = (event, id) => setAnchorEl((prev) => ({ ...prev, [id]: event.currentTarget }));

  const handleViewTraining = (training) => {
    setSelectedTraining(training);
    setTrainingPlanModalOpen(true);
  };
  
  const handleCloseTrainingPlanModal = () => {
    setTrainingPlanModalOpen(false);
    setSelectedTraining(null);
  };
  
  
  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedTraining(null);
  };
 
  // State for filtered topics
  const [filteredTopics, setFilteredTopics] = React.useState(trainingTopics);

  const filterTopicsByDepartment = (selectedDepartments) => {
    console.log("filterTopicsByDepartment called with:", selectedDepartments);
  
    if (!Array.isArray(selectedDepartments)) {
      console.error("Expected an array for selectedDepartments, got:", selectedDepartments);
      return [];
    }
  
    if (selectedDepartments.some((dept) => dept.department_id === 'all')) {
      console.log("All Departments selected, returning all topics:", trainingTopics);
      return trainingTopics;
    }
  
    const departmentNames = selectedDepartments.map((dept) =>
      dept.department_name.trim().toLowerCase()
    );
  
    console.log("Filtering topics for department names:", departmentNames);
  
    const filtered = trainingTopics.filter((topic) =>
      departmentNames.includes(topic.department_name.trim().toLowerCase())
    );
  
    console.log("Filtered topics:", filtered);
    return filtered;
  };
  
  
  const handleDepartmentChange = (selectedDepartments) => {
    console.log("Selected Departments:", selectedDepartments);
  
    const updatedDepartments = Array.isArray(selectedDepartments) ? selectedDepartments : [];
  
    setFormData((prevFormData) => ({
      ...prevFormData,
      department: updatedDepartments,
    }));
  
    // If "All Departments" is selected, show all topics
    const updatedTopics = updatedDepartments.some(dept => dept.department_id === 'all')
      ? trainingTopics
      : filterTopicsByDepartment(updatedDepartments);
  
    setFilteredTopics(updatedTopics);
  
    const validTopic = updatedTopics.find(
      (topic) =>
        topic.training_topic.trim().toLowerCase() ===
        formData.topic.trim().toLowerCase()
    );
  
    setFormData((prevFormData) => ({
      ...prevFormData,
      topic: validTopic ? validTopic.training_topic : '',
    }));
  };
  
  const handleInfoClick = (id) => {
    setSelectedTrainningId(id);
    setMappingTraineesData([]); // Clear previous trainees
    setOpenModal(true);
  };
  


    

  function formatMultiSelect(ids, items, key) {
    if (!Array.isArray(ids)) {
      ids = ids.split(',').map((id) => id.trim()); 
    }
    return items
      .filter((item) => ids.includes(String(item[key]))) 
      .map((item) => item.staff_category || item.branch_name || item.department_name) 
      .join(', ') || 'N/A';
  }
  


// Map status for UI display
const getStatusForUI = (status) => {
  if (!status) return 'N/A';
  switch (status.toLowerCase()) {
    case 'training created':
      return 'Training Created';
    case 'training scheduled':
      return 'Training Scheduled';
    case 'training conducted':
      return 'Training Conducted';
    case 'feedback received':
      return 'Feedback Received';
      case 'final submitted':
      return 'Final Submitted';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'N/A';
  }
};




// Map the admin training data
const mappedTrainingData = useMemo(() => 
  trainingData.map((record) => {
    const branch = record.branch_id
      ? record.branch_id.includes('all') 
        ? 'Pan India' 
        : formatMultiSelect(record.branch_id.split(','), branchMaster, 'branch_id') 
      : 'N/A';

      const department = record.department_id
      ? record.department_id.includes('all') 
        ? 'All Departments' 
        : formatMultiSelect(record.department_id.split(','), departmentMaster, 'department_id') 
      : 'N/A';

    const staffCategory = record.staff_category_id
      ? formatMultiSelect(record.staff_category_id.split(','), staffCategories, 'id')
      : 'N/A';

    const topic = trainingTopics.find(
      (topic) => String(topic.id) === String(record.training_topic_id)
    )?.training_topic || 'N/A';

    const trainerType = trainingTypes.find(
      (type) => String(type.id) === String(record.training_type_id)
    )?.training_type || 'N/A';

    const status = getStatusForUI(record.Status);


    return {
      id: record.id,
      branch,
      department,
      staffCategory,
      topic,
      trainerType,
      date: record.planning_date ? dayjs(record.planning_date).format('YYYY-MM-DD') : 'N/A',
      status,
      remarks: record.remarks || 'N/A',
      planningType: record.planning_type || 'N/A',
      cancelReason:record.cancelled_reason,
    };
  })
, [trainingData, branchMaster, departmentMaster, staffCategories, trainingTopics, trainingTypes]);

const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
//user training data
const mappedUserTrainingData = useMemo(() => {
  if (!userDetails?.user_branch) return [];

  const userBranchIds = [userDetails.user_reporting_br].filter(Boolean);

  return trainingData
    .filter((record) => {
      const recordBranchIds = record.branch_id?.split(",") || [];

      // Check if training is for all branches or matches user's branch/reporting branch
      return recordBranchIds.includes("all") || recordBranchIds.some(branch => userBranchIds.includes(branch));
    })
    .map((record) => {
      const branch = record.branch_id.includes("all")
        ? "Pan India"
        : formatMultiSelect(record.branch_id.split(","), branchMaster, "branch_id");

      const department = record.department_id.includes("all")
        ? "All Departments"
        : formatMultiSelect(record.department_id.split(","), departmentMaster, "department_id");

      const staffCategory = record.staff_category_id
        ? formatMultiSelect(record.staff_category_id.split(","), staffCategories, "id")
        : "N/A";

      const topic = trainingTopics.find(
        (topic) => String(topic.id) === String(record.training_topic_id)
      )?.training_topic || "N/A";

      const trainerType = trainingTypes.find(
        (type) => String(type.id) === String(record.training_type_id)
      )?.training_type || "N/A";

      const status = getStatusForUI(record.Status);

      return {
        id: record.id,
        branch,
        department,
        staffCategory,
        topic,
        trainerType,
        date: record.planning_date ? dayjs(record.planning_date).format("YYYY-MM-DD") : "N/A",
        status,
        remarks: record.remarks || "N/A",
        planningType: record.planning_type || "N/A",
        cancelReason: record.cancelled_reason,
      };
    });
}, [trainingData, branchMaster, departmentMaster, staffCategories, trainingTopics, trainingTypes, userDetails]);


const [, forceUpdate] = useState();
useEffect(() => {
  forceUpdate({});
}, [trainingData]);

const filterOptions = useMemo(() => {
  const branches = [...new Set(mappedTrainingData.map((data) => data.branch))];
  const departments = [...new Set(mappedTrainingData.map((data) => data.department))];
  const statuses = [...new Set(mappedTrainingData.map((data) => data.status))];
  const planningTypes = [...new Set(mappedTrainingData.map((data) => data.planningType))];

  return {
    branches,
    departments,
    statuses,
    planningTypes,
  };
}, [mappedTrainingData]);

const [filters, setFilters] = useState({
  branch: '',
  department: '',
  status: '',
  planningType: '',
});

const handleFilterChange = (e) => {
  setFilters((prevFilters) => ({
    ...prevFilters,
    [e.target.name]: e.target.value,
  }));
};
  const filteredData = mappedTrainingData.filter((training) => {

    const trainingDate = dayjs(training.date || '');

    const today = dayjs(); // Current date
    const [startDate, endDate] = (() => {
      switch (dateFilter) {
        case 'thisWeek':
          return [today.startOf('week'), today.endOf('week')];
        case 'thisMonth':
          return [today.startOf('month'), today.endOf('month')];
        case 'thisYear':
          return [today.startOf('year'), today.endOf('year')];
        case 'custom':
          return [customStartDate, customEndDate];
        default:
          return [null, null];
      }
    })();
    

    const isWithinDateRange = startDate && endDate ? trainingDate.isBetween(startDate, endDate, 'day', '[]') : true;

    // Search logic
    const topicMatches = (training.topic || '').toLowerCase().includes(searchQuery.toLowerCase());
    const branchMatches = (training.branch || '').toLowerCase().includes(searchQuery.toLowerCase());
    const departmentMatches = (training.department || '').toLowerCase().includes(searchQuery.toLowerCase());
    const trainerTypeMatches = (training.trainerType || '').toLowerCase().includes(searchQuery.toLowerCase());

    const searchMatches = topicMatches || branchMatches || departmentMatches || trainerTypeMatches;

    // Filter logic
    const branchFilterMatches = filters.branch ? training.branch === filters.branch : true;
    const departmentFilterMatches = filters.department ? training.department === filters.department : true;
    const statusFilterMatches = statusFilter.length
      ? statusFilter.some(status => training.status?.toLowerCase() === status.toLowerCase())
      : training.status?.toLowerCase() !== 'cancelled';
    const planningTypeFilterMatches = filters.planningType ? training.planningType === filters.planningType : true;

    // Combine all filters
    return (
      // isAgendaCreated &&
      isWithinDateRange &&
      searchMatches &&
      branchFilterMatches &&
      departmentFilterMatches &&
      statusFilterMatches &&
      planningTypeFilterMatches
    );
  });

  const filteredUserTrainingData = mappedUserTrainingData.filter((training) => {
    const trainingDate = dayjs(training.date || '');
    const today = dayjs(); // Current date
  
    const [startDate, endDate] = (() => {
      switch (dateFilter) {
        case 'thisWeek':
          return [today.startOf('week'), today.endOf('week')];
        case 'thisMonth':
          return [today.startOf('month'), today.endOf('month')];
        case 'thisYear':
          return [today.startOf('year'), today.endOf('year')];
        case 'custom':
          return [customStartDate, customEndDate];
        default:
          return [null, null];
      }
    })();
  
    const isWithinDateRange =
      startDate && endDate ? trainingDate.isBetween(startDate, endDate, 'day', '[]') : true;
  
    // **Search Logic**
    const topicMatches = (training.topic || '').toLowerCase().includes(searchQuery.toLowerCase());
    const branchMatches = (training.branch || '').toLowerCase().includes(searchQuery.toLowerCase());
    const departmentMatches = (training.department || '').toLowerCase().includes(searchQuery.toLowerCase());
    const trainerTypeMatches = (training.trainerType || '').toLowerCase().includes(searchQuery.toLowerCase());
  
    const searchMatches = topicMatches || branchMatches || departmentMatches || trainerTypeMatches;
  
    // **Filter Logic**
    const branchFilterMatches = filters.branch ? training.branch === filters.branch : true;
    const departmentFilterMatches = filters.department ? training.department === filters.department : true;
    const statusFilterMatches = statusFilter.length
      ? statusFilter.some((status) => training.status?.toLowerCase() === status.toLowerCase())
      : training.status?.toLowerCase() !== 'cancelled';
    const planningTypeFilterMatches = filters.planningType ? training.planningType === filters.planningType : true;
  
    // **Ensure Filtering by User's Branch (Already Handled in mappedUserTrainingData)**
    return (
      isWithinDateRange &&
      searchMatches &&
      branchFilterMatches &&
      departmentFilterMatches &&
      statusFilterMatches &&
      planningTypeFilterMatches
    );
  });
  
  // Calculate totals using the mapped statuses card filter

  const totalCreated = mappedTrainingData.length;
  const totalScheduled = mappedTrainingData.filter((training) => training.status === 'Training Scheduled').length;
  const totalPending = mappedTrainingData.filter((training) => training.status === 'Training Created').length;
  const totalCancelled = mappedTrainingData.filter((training) => training.status === 'Cancelled').length;
  const totalConducted = mappedTrainingData.filter((training) => training.status === 'Training Conducted').length;
  const totalReceived = mappedTrainingData.filter((training) => training.status === 'Feedback Received').length;
  const totalFinished = mappedTrainingData.filter((training) => training.status === 'Final Submitted').length;

  const totalCreatedUser = mappedUserTrainingData.length;
  const totalScheduledUser = mappedUserTrainingData.filter((training) => training.status === 'Training Scheduled').length;
  const totalPendingUser = mappedUserTrainingData.filter((training) => training.status === 'Training Created').length;
  const totalCancelledUser = mappedUserTrainingData.filter((training) => training.status === 'Cancelled').length;
  const totalConductedUser = mappedUserTrainingData.filter((training) => training.status === 'Training Conducted').length;
  const totalReceivedUser = mappedUserTrainingData.filter((training) => training.status === 'Feedback Received').length;
  const totalFinishedUser = mappedUserTrainingData.filter((training) => training.status === 'Final Submitted').length;


  const handleStatusFilter = (status) => {
    if (status) {
      setStatusFilter([status]); // Apply the selected status as a filter
    } else {
      setStatusFilter([]); // Clear the filter
    }
    setPage(0); // Reset pagination to the first page
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage); // Update the page state when navigation occurs
  };

const handleChangeRowsPerPage = (event) => {
  setRowsPerPage(parseInt(event.target.value, 10)); // Update rows per page
  setPage(0); // Reset to the first page after changing rows per page
};

const displayedUserData  = filteredUserTrainingData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

const handleAddModalOpen = () => setIsAddModalOpen(true);



// Milestone definitions
const milestones = [
  "Training Created",
  "Training Scheduled",
  "Training Conducted",
  "Feedback Received",
  "Final Submitted"
];
const milestoneMapping = {
  "Training Created": 1, 
  "Training Scheduled": 2, 
  "Training Conducted": 3, 
  "Feedback Received": 4,
  "Final Submitted": 5,
  Cancelled: -1 
};

const getMilestoneProgress = (training) => {
  const { status, hasAgenda } = training;
  const progress = milestoneMapping[status];
  return typeof progress === "function" ? progress(hasAgenda) : progress || 0;
};

// Session-specific milestones
const sessionMilestones = [
  "Trainee Mapped",
  "Session Conducted",
  "Attendance Added",
];

const sessionMilestoneMapping = {
  "Trainee Mapped": 1,
  "postpone": 1,  // Keep "Trainee Mapped" if postponed
  "Session Conducted": 2,
  "Attendance Added": 3,
  Cancelled: -1, // Special case for cancelled sessions
};

// Function to calculate milestone progress for a session
const getSessionMilestoneProgress = (session) => {
  const { PSstatus, session_date } = session;
  const sessionDate = new Date(session_date);
  const now = new Date();

  // Check if the session is completed
  if (now >= sessionDate) {
    return 2; // "Session Conducted" milestone reached
  }

  // If session is postponed, retain "Trainee Mapped" progress
  if (PSstatus === "postpone") {
    return Math.max(sessionMilestoneMapping["Trainee Mapped"], sessionMilestoneMapping[PSstatus]);
  }

  return sessionMilestoneMapping[PSstatus] ?? 0; // Default to 0 if status is unknown
};



const handleMapTrainees = (sessionNo) => {
  navigate(`/admindashboard/agenda?stepIndex=3&sessionNo=${sessionNo}`);
}

const handleMarkAttendance = (sessionNo) => {
  console.log(`Marking session ${sessionNo} as conducted`);
  // Add logic for marking the session as conducted
};

const handleNextStep = (sessionNo) => {
  console.log(`Proceeding to the next step for session ${sessionNo}`);
  // Add logic for proceeding to the next step
};



const handlePostpone = (session) => {
  setSelectedSession(session);
  setOpenPostponeModal(true);
};

const handleCancel = (sessionNo) => {
  console.log(`Cancel clicked for session ${sessionNo}`);
  // Add logic to handle the "Cancelled" action
};


const renderSessions = (sessions) => {
  return sessions.map((session) => (
    <tr key={session.session_no}>
      <td>{session.session_no}</td>
      <td>{session.session_description}</td>
      <td>{session.session_date}</td>
      <td>{session.count_of_trainees_expected}</td>
      <td>{session.mode_of_training}</td>
      <td>{session.trainer_name}</td>
      <td>{session.from_time}</td>
      <td>{session.to_time}</td>
    </tr>
  ));
};

const [expandedRows, setExpandedRows] = useState({});

const handleExpandClickInfo = (sessionNo) => {
  setExpandedRows((prev) => ({
    ...prev,
    [sessionNo]: !prev[sessionNo],
  }));
};
const getMappingDataForSession = (sessionNo) => {
  // Check if mappingData is valid and mappingData.data is an array
  if (!mappingData || !Array.isArray(mappingData.data)) {
    console.warn('Mapping data is not available or invalid:', mappingData);
    return []; // Return an empty array if mappingData is not valid
  }
 
  // Filter data for the given session number
  return mappingData.data.filter((mapping) => mapping.session_no === sessionNo);
};

const getTraineesForSession = (sessionNo) =>
  mappingTraineesData.filter((trainee) => trainee.session_no === sessionNo);



  return (
   
<>
           
           
            
         
               
                 {/* user view table */}

          <TableContainer component={Paper}>
            <div style={{ overflowX: "auto" }}>
              <Table aria-label="training table">
                <TableHead>
                <TableRow className="table-row">
                    <TableCell align="left"><b>SlNo</b></TableCell>
                    <TableCell align="left"><b>Branch</b></TableCell>
                    <TableCell align="left"><b>Department</b></TableCell>
                    <TableCell align="left"><b>Topic</b></TableCell>
                    <TableCell align="left"><b>Staff Category</b></TableCell>
                    <TableCell align="left"><b>Trainer</b></TableCell>
                    <TableCell align="left"><b>Date</b></TableCell>
                    <TableCell align="left"><b>Status</b></TableCell>                
                  </TableRow>
                </TableHead>
                <TableBody
                  sx={{
                    '& .table-rowcontent': {      
                      textTransform: "uppercase",
                    },
                  }}
                >
                  {trainingData.map((training, index) => {
                    const milestoneProgress = getMilestoneProgress(training);
                    return (
                          <React.Fragment key={training.id}>
                            <TableRow className="table-rowcontent">
                            <TableCell>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                {index + 1}
                                {/* Show expand icon when the status is 'Training Scheduled' or session data is present for the session_no */}
                                {(training.status === 'Training Scheduled' ) && (
                                  <IconButton
                                    onClick={() => handleExpandClick(training.id)}
                                    size="small"
                                    style={{ marginLeft: '8px' }}
                                  >
                                    {expanded[training.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                  </IconButton>
                                )}
                              </div>
                            </TableCell>

                              <TableCell>{training.branch}</TableCell>
                              <TableCell>{training.department}</TableCell>
                              <TableCell>{training.topic}</TableCell>
                              <TableCell>{training.staffCategory}</TableCell>
                              <TableCell>{training.trainerType}</TableCell>
                              <TableCell>{training.date ? dayjs(training.date).format("DD-MM-YYYY") : "N/A"}</TableCell>
                              <TableCell>                                                                                            
                                <div style={{ display: "flex", alignItems: "center" }}>
                                  {milestones.map((milestone, idx) => {
                                    // Check if the training is cancelled
                                    if (training.status === "Cancelled") {
                                      return (
                                        <Tooltip key={idx} title="Training Cancelled">
                                          <IconButton size="small" disabled>
                                            <HighlightOffIcon style={{ color: "lightcoral" }} /> {/* Pale Red */}
                                          </IconButton>
                                        </Tooltip>
                                      );
                                    }

                                    // For other statuses, style based on completion progress
                                    const isCompleted = idx < milestoneProgress && milestoneProgress !== -1;
                                    const isLastMilestoneCompleted = milestone === "Final Submitted" && milestoneProgress === milestones.length;

                                    return (
                                        <Tooltip 
                                        key={idx} 
                                        title={` ${milestone}`} 
                                        componentsProps={{
                                          tooltip: {
                                            sx: {
                                              backgroundColor: "#1A005D", // Set tooltip background to blue
                                              color: "white", // Set tooltip text to white
                                              
                                            },
                                          },
                                        }}
                                      >
                                        <IconButton 
                                          size="small" 
                                          style={{ padding: '0px' }} // Set padding to 0px
                                        >
                                          {isCompleted ? (
                                            <CircleIcon 
                                              style={{ color: isLastMilestoneCompleted ? "green" : "orange" }} // Green if all completed, orange otherwise
                                            />
                                          ) : (
                                            <RadioButtonUncheckedIcon style={{ color: "orange" }} /> // Orange circle for incomplete milestones
                                          )}
                                        </IconButton>
                                      </Tooltip>
                                    );                                   
                                    
                                  })}
                                </div>
                              </TableCell>
                            
                          
                              {topTab === 1 && nestedTab === 0 ? null : (
                                <TableCell align="center">
                                  <IconButton onClick={() => handleExpandClick(training.id)}>
                                    {expanded[training.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                  </IconButton>
                                </TableCell>
                              )}
                            </TableRow>
                           
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
                              <Collapse in={expanded[training.id]} timeout="auto" unmountOnExit>
                                <Table size="small" aria-label="Session list">
                                  <TableHead>
                                  <TableRow sx={{ bgcolor: '#2E157A' }}> 
                                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>
                                        Session Title
                                        <Tooltip
                                          title="View detailed session information"
                                          componentsProps={{
                                            tooltip: {
                                              sx: {
                                                backgroundColor: '#1A005D', // Tooltip background
                                                color: 'white', // Tooltip text
                                              },
                                            },
                                          }}
                                        >
                                          <IconButton
                                            size="small"
                                            onClick={() => handleInfoClick(training.id)}
                                            sx={{ color: 'white' }}
                                          >
                                            <InfoIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </TableCell>
                                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Date</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Start Time</TableCell>                                      
                                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>End Time</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Trainer</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Mode</TableCell>
                                     
                                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Status</TableCell>
                                     
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {!sessionsData[training.id] && expanded[training.id] ? (
                                      <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                          <CircularProgress size={24} />
                                        </TableCell>
                                      </TableRow>
                                    ) : (sessionsData[training.id] || []).length > 0 ? (
                                      sessionsData[training.id].map((session) => (
                                        <TableRow
                                          key={session.session_no}
                                          sx={{
                                            '&:nth-of-type(odd)': { bgcolor: 'rgba(46, 21, 122, 0.1)' }, // Slightly transparent
                                            '&:nth-of-type(even)': { bgcolor: '#ffffff' },
                                          }}
                                        >
                                          <TableCell>{session.session_description}</TableCell>
                                          <TableCell>{formatDate(session.session_date)}</TableCell>
                                          <TableCell>{formatTime(session.from_time)}</TableCell>
                                          <TableCell>{formatTime(session.to_time)}</TableCell>
                                          <TableCell>{session.trainer_name}</TableCell>
                                          <TableCell>{session.mode_of_training}</TableCell>
                                         
                                          {/* Milestones Status */}
                                          <TableCell>
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                              {sessionMilestones.map((milestone, idx) => {
                                                // Handle Cancelled sessions
                                                if (session.status === "Cancelled") {
                                                  return (
                                                    <Tooltip key={idx} title="Session Cancelled">
                                                      <IconButton size="small" disabled>
                                                        <HighlightOffIcon style={{ color: "lightcoral" }} />
                                                      </IconButton>
                                                    </Tooltip>
                                                  );
                                                }

                                                // Milestone progress logic
                                                const milestoneProgress = getSessionMilestoneProgress(session);
                                                const isCompleted = idx < milestoneProgress && milestoneProgress !== -1;

                                                return (
                                                  <Tooltip 
                                                    key={idx} 
                                                    title={`${milestone}`} 
                                                    componentsProps={{
                                                      tooltip: {
                                                        sx: {
                                                          backgroundColor: "#1A005D", // Tooltip background
                                                          color: "white", // Tooltip text
                                                        },
                                                      },
                                                    }}
                                                  >
                                                    <IconButton size="small" style={{ padding: "0px" }}>
                                                      {isCompleted ? (
                                                        <CircleIcon style={{ color: "green" }} />
                                                      ) : (
                                                        <RadioButtonUncheckedIcon style={{ color: "orange" }} />
                                                      )}
                                                    </IconButton>
                                                  </Tooltip>
                                                );
                                              })}
                                            </div>
                                          </TableCell>                                          
                                        </TableRow>
                                      ))
                                    ) : (
                                      <TableRow>
                                        <TableCell colSpan={8} align="center">
                                          No sessions available for this training.
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        

                          </React.Fragment>
                        );
                      })}
                    {filteredData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          No Trainings Available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>

              </Table>
            </div>
      </TableContainer>
            
      <div>
  <Modal open={trainingPlanModalOpen} onClose={handleCloseTrainingPlanModal}>
    <Box
      sx={{
        width: '70%',
        margin: 'auto',
        mt: 7,
        p: 3,
        bgcolor: 'white',
        boxShadow: 24,
        maxHeight: '90vh',
        overflowY: 'auto',
        color: '#1A005D',
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 'bold',
          textAlign: 'center',
          borderBottom: '2px solid #1A005D',
          pb: 0.5,
        }}
      >
        Training Details Summary
      </Typography>

      {selectedTraining ? (
        <Box sx={{ mt: 2 }}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Branch</TableCell>
                <TableCell>{selectedTraining.branch || 'Not available'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                <TableCell>{selectedTraining.department || 'Not available'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Topic</TableCell>
                <TableCell>{selectedTraining.topic || 'Not available'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Staff Category</TableCell>
                <TableCell>{selectedTraining.staffCategory || 'Not available'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Trainer Type</TableCell>
                <TableCell>{selectedTraining.trainerType || 'Not available'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell>{selectedTraining.date || 'Not available'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell>{selectedTraining.status || 'Not available'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No details available.
        </Typography>
      )}
    </Box>
  </Modal>
</div>
  


      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          sx={{
            width: '70%',
            margin: 'auto',
            mt: 7,
            p: 2,
            bgcolor: 'white',
            boxShadow: 24,
            maxHeight: '90vh',
            overflowY: 'auto',
            color: '#1A005D',
          }}
        >
          <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                textAlign:"center",
                borderBottom: '2px solid #1A005D',
                pb: 0.5,
              }}>
            Training Details
          </Typography>

          {/* Planning Information */}
          <Box sx={{ mb:2 }}>
            <Typography
              variant="h7"
              sx={{
                fontWeight: 'bold',
                display: 'inline-block',
                pb: 0.5,
              }}
            >
              Planning Information
            </Typography>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#1A005D' }}>
                <TableCell sx={{ fontWeight: 'bold', color: 'white', py: 0.5 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'white', py: 0.5 }}>Planning Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'white', py: 0.5 }}>Remarks</TableCell>
                  </TableRow>
              </TableHead>
              <TableBody>
                {planningData?.data?.length > 0 ? (
                  planningData.data.map((row, index) => (
                    <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#1A005D20' } }}>
                      <TableCell sx={{ py: 0.5 }}>{row.Status || 'No status available'}</TableCell>
                      <TableCell sx={{ py: 0.5 }}>{row.planning_type || 'No type available'}</TableCell>
                      <TableCell sx={{ py: 0.5 }}>{row.remarks || 'No remarks available'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ py: 0.5 }}>No planning data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>

          {/* Session List */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h7"
              sx={{
                fontWeight: 'bold',
                display: 'inline-block',
                pb: 0.5,
              }}
            >
              Session Details
            </Typography>
           
            <Table>
      <TableHead>
        <TableRow sx={{ bgcolor: "#1A005D" }}>
          <TableCell sx={{ fontWeight: "bold", color: "white", py: 0.5 }}>
            Description
          </TableCell>
          <TableCell sx={{ fontWeight: "bold", color: "white", py: 0.5 }}>
            From Time
          </TableCell>
          <TableCell sx={{ fontWeight: "bold", color: "white", py: 0.5 }}>
            To Time
          </TableCell>
          <TableCell sx={{ fontWeight: "bold", color: "white", py: 0.5 }}>
            Trainer
          </TableCell>
          <TableCell sx={{ fontWeight: "bold", color: "white", py: 0.5 }}>
            Mode
          </TableCell>         
         
        </TableRow>
      </TableHead>
      
    </Table>
      </Box>


      </Box>
</Modal>


          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={handleSnackbarClose}
            sx={{
              position: 'fixed',
              top: 0, 
              width: '100%', 
              left: 0, 
              zIndex: 2000,
              display: 'flex', 
              justifyContent: 'center', 
            }}
            
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={snackbarSeverity}
              sx={{
                backgroundColor: snackbarSeverity === 'success' ? '#4caf50' : '#f44336',
                color: '#ffffff',
                fontWeight: 'bold',
                maxWidth: '800px',
                textAlign: 'center',
              }}
              action={
                <IconButton size="small" color="inherit" onClick={handleSnackbarClose}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
          
          {/* Query chatter */}
        <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
        }}
      >
        <IconButton
          onClick={handleOpenModal}
          sx={{
            bgcolor: '#1A005D',
            color: 'white',
            width: 64,
            height: 64,
            borderRadius: '50%',
            boxShadow: 4,
            '&:hover': {
              bgcolor: '#8EC400',
            },
            animation: 'bounce 1.5s infinite',
            '@keyframes bounce': {
              '0%, 20%, 50%, 80%, 100%': {
                transform: 'translateY(0)',
              },
              '40%': {
                transform: 'translateY(-10px)',
              },
              '60%': {
                transform: 'translateY(-5px)',
              },
            },
          }}
        >
          <ChatBubbleOutlineIcon fontSize="large" />
        </IconButton>
        <QuerySubmitModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitQuery}
        />
      </Box>

      {/* Temporary Banner */}
      <Slide direction="down" in={isBannerVisible} mountOnEnter unmountOnExit>
        <Paper
          sx={{
            position: 'fixed',
            top: '100px', 
            left: '400px',            
            bgcolor: 'success.main',
            color: 'white',
            padding: 1,
            textAlign: 'center',
            zIndex: 1500, 
            boxShadow: 4,
            width: '50%', 
            maxWidth: '600px',
            borderRadius: 2, 
          }}
        >
          <Typography variant="h6">
            Query Submitted Successfully!
          </Typography>
          <Typography variant="body2">
            Email: {submittedQuery?.email}, Query: {submittedQuery?.query}, Attachment: {submittedQuery?.attachmentName}
          </Typography>
        </Paper>
      </Slide>


        <div className="pagination-wrapper">
          <TablePagination
            component="div"
            count={filteredData.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </div>
        </>
  );
}

export default UserDashboardContent;
