import React, { useEffect,useRef, useMemo, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import CancelReasonModal from './CancelReasonModal';
import TableChartIcon from '@mui/icons-material/TableChart';
import AttendanceUploadDialog from './AttendanceUploadDialog';
import {
  Pagination, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText,
  Card, CardContent, Slide, Modal, Snackbar, Alert, Collapse, Tabs, Tab, Box, Popover,
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Select, MenuItem, FormControl, FormLabel, FormControlLabel, RadioGroup, Radio, Checkbox,
  Breadcrumbs, Link, Typography, TablePagination, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, InputLabel, Grid2,
} from '@mui/material';
import TrainingEffectivenessDialog from './Trainingeffectivenessdialog';

import { BiBlock } from "react-icons/bi";
import { useLocation } from 'react-router-dom';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import DownloadIcon from '@mui/icons-material/Download';
import FolderOffIcon from '@mui/icons-material/FolderOff';
import FolderIcon from '@mui/icons-material/Folder';
import { toast } from 'react-toastify';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
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
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import SearchFilter from './SearchFilter';
import DateFilter from './DateFilter';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Tooltip from '@mui/material/Tooltip';
import Autocomplete from '@mui/material/Autocomplete';
import '@fontsource/comfortaa';
import { useAgenda } from '../Agenda/AgendaContext';
import InfoIcon from '@mui/icons-material/Info';
import NextPlanIcon from '@mui/icons-material/NextPlan';
import ScheduleIcon from '@mui/icons-material/Schedule';
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
import TableSortLabel from "@mui/material/TableSortLabel";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import { CircularProgress, LinearProgress, ListItemIcon } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupIcon from '@mui/icons-material/Group';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CreateIcon from '@mui/icons-material/Create';
import SaveIcon from '@mui/icons-material/Save';

dayjs.extend(isBetween);

// ─── Constants ───────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 5;

const MILESTONES = [
  "Training Created",
  "Training Scheduled",
  "Training Conducted",
  "Feedback Assigned",
  "Final Submitted",
];

const MILESTONE_MAPPING = {
  "Training Created": 1,
  "Training Scheduled": 2,
  "Training Conducted": 3,
  "Feedback Assigned": 4,
  "Final Submitted": 5,
  Cancelled: -1,
};

const SESSION_MILESTONES = [
  "Trainee Mapped",
  "Session Conducted",
  "Attendance Added",
  "Training Effectiveness",
];

const SESSION_MILESTONE_MAPPING = {
  "Trainee Mapped": 1,
  "Session Conducted": 2,
  "Attendance Added": 3,
  "Training Effectiveness": 3,
  "Feedback Assigned": 4,
  "Session Closed": 4,
  "Final Submitted": 4,
  Cancelled: -1,
};

const SNACKBAR_MESSAGES = {
  successSubmit: '🎉 Data successfully submitted!',
  successUpdate: '🎉 Data successfully updated!',
  error: '❌ An error occurred during submission. Please try again.',
  trainingNotFound: '❌ Error!!! Training not found',
  trainingCancel: '❌ Cancellation reason is required.',
  UsernotFound: '❌User is not logged in. Please log in to proceed.',
  BranchDepartmentAlert: "Please ensure both branch and department fields are selected.",
  DepartmentAlert: "Please select at least one department.",
  BranchAlert: "Please select at least one branch.",
  staffCategoryAlert: "Selected staff categories are invalid. Please choose valid categories.",
  TopicAlert: "Selected topic is invalid. Please choose a valid topic.",
};

const FEEDBACK_RATING_MAP = {
  "5": "Excellent",
  "4": "Good",
  "3": "Average",
  "2": "Fair",
  "1": "Poor",
};

const INITIAL_FORM_DATA = {
  branch: [],
  department: [],
  staffCategory: [],
  topic: '',
  trainerType: 'Internal',
  date: null,
  remarks: '',
  status: 'Training Created',
  isPlanned: '',
};

// ─── Modal styles (stable references, defined outside component) ──────────────

const MODAL_STYLE = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 500 },
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
};

const MODAL_HEADER_STYLE = { fontWeight: 600, mb: 2, color: 'text.primary' };
const PAGINATION_STYLE = { mt: 2, display: 'flex', justifyContent: 'center' };
const CLOSE_BUTTON_STYLE = { mt: 2, alignSelf: 'flex-end' };

const listItemStyle = (borderColor, defaultBg, hoverBg) => ({
  px: 2, py: 1.5, mb: 1, borderRadius: 1,
  borderLeft: `3px solid ${borderColor}`,
  backgroundColor: defaultBg,
  '&:hover': { backgroundColor: hoverBg },
});

// ─── TabPanel ─────────────────────────────────────────────────────────────────

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatusForUI = (status) => {
  if (!status) return 'N/A';
  switch (status.toLowerCase()) {
    case 'training created':   return 'Training Created';
    case 'training scheduled': return 'Training Scheduled';
    case 'training conducted': return 'Training Conducted';
    case 'feedback assigned':  return 'Feedback Assigned';
    case 'final submitted':    return 'Final Submitted';
    case 'cancelled':          return 'Cancelled';
    default:                   return 'N/A';
  }
};

const formatDate = (dateString) => {
  const d = new Date(dateString);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  const parts = timeString.split(':');
  if (parts.length !== 3) return 'Invalid Time';
  return `${String(parts[0]).padStart(2, '0')}:${String(parts[1]).padStart(2, '0')}`;
};

const formatDateInfo = (dateString) => {
  const d = new Date(dateString);
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const generateRefNo = (trainingId) => {
  const year = new Date().getFullYear();
  return `NEIN/LND/${String(trainingId).padStart(4, '0')}/${year}`;
};

function formatMultiSelect(ids, items, key) {
  if (!Array.isArray(ids)) ids = ids.split(',').map((id) => id.trim());
  return items
    .filter((item) => ids.includes(String(item[key])))
    .map((item) => item.staff_category || item.branch_name || item.department_name)
    .join(', ') || 'N/A';
}

const getMilestoneProgress = (training) => {
  const status = training.status === 'N/A' ? 'Feedback Assigned' : training.status;
  const progress = MILESTONE_MAPPING[status];
  return typeof progress === 'function' ? progress(training.hasAgenda) : progress || 4;
};

const getSessionMilestoneProgress = (session) => {
  const { PSstatus, session_date } = session;
  const sessionDate = new Date(session_date);
  const now = new Date();
  if (now >= sessionDate) return 2;
  if (PSstatus === 'postpone') return Math.max(SESSION_MILESTONE_MAPPING['Trainee Mapped'], SESSION_MILESTONE_MAPPING[PSstatus]);
  if (now >= sessionDate && PSstatus !== 'cancelled') return SESSION_MILESTONE_MAPPING['Session Conducted'];
  return SESSION_MILESTONE_MAPPING[PSstatus] ?? 0;
};

const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf':  return <PictureAsPdfIcon color="error" />;
    case 'doc':
    case 'docx': return <DescriptionIcon color="primary" />;
    case 'xls':
    case 'xlsx': return <TableChartIcon color="success" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':  return <ImageIcon color="secondary" />;
    default:     return <InsertDriveFileIcon />;
  }
};

// ─── LoadingOverlay ────────────────────────────────────────────────────────────

const LoadingOverlay = ({ open }) => (
  <Dialog open={open} PaperProps={{ style: { backgroundColor: 'transparent', boxShadow: 'none', overflow: 'hidden' } }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, borderRadius: '12px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(5px)', boxShadow: '0 4px 30px rgba(0,0,0,0.2)' }}>
      <CircularProgress sx={{ color: '#4a148c', mb: 2 }} />
      <Typography variant="h6" sx={{ color: '#1a005d', fontWeight: 600 }}>Preparing Trainer Feedback Form</Typography>
      <Box sx={{ mt: 2, width: '100%', maxWidth: 300 }}>
        <LinearProgress color="secondary" sx={{ height: 8, borderRadius: 4, backgroundColor: '#e0e0e0', '& .MuiLinearProgress-bar': { borderRadius: 4, backgroundColor: '#4a148c' } }} />
      </Box>
      <Typography variant="body2" sx={{ mt: 2, color: '#555' }}>Please wait while we prepare the trainer feedback form...</Typography>
    </Box>
  </Dialog>
);


// ─── Main Component ───────────────────────────────────────────────────────────

function AdminDashboardContent() {
  const { agendaData } = useAgenda();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();
  const location = useLocation();

  // ── User / Auth ──
  const userDetails = useMemo(() => JSON.parse(sessionStorage.getItem('userDetails')), []);
  const rolePermissions = useMemo(() => JSON.parse(sessionStorage.getItem('rolePermissions')) || {}, []);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const hasAccess = useCallback((section, subSection, permissionType) => {
    if (!rolePermissions[section]?.[subSection]) return false;
    return rolePermissions[section][subSection][permissionType] === 1;
  }, [rolePermissions]);

  const loggedInUserId = userDetails?.emp_id;
  const [sessionCoordinatorContext, setSessionCoordinatorContext] = useState(null);
  const coordinatorContextRef = useRef(null);

  // ── Training data ──
  const [trainingData, setTrainingData] = useState([]);
  const [userTrainingData, setUserTrainingData] = useState([]);
  const [sessionsData, setSessionsData] = useState({});
  const [coordinatorData, setCoordinatorData] = useState([]);

  // ── Master data ──
  const [branchMaster, setBranchMaster] = useState([]);
  const [departmentMaster, setDepartmentMaster] = useState([]);
  const [staffCategories, setStaffCategories] = useState([]);
  const [trainingTopics, setTrainingTopics] = useState([]);
  const [trainingTypes, setTrainingTypes] = useState([]);

  // ── Modal / Dialog open states ──
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [trainingPlanModalOpen, setTrainingPlanModalOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [openPostponeModal, setOpenPostponeModal] = useState(false);
  const [openReasonDialog, setOpenReasonDialog] = useState(false);
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState(false);
  const [openFeedbackDetailsDialog, setOpenFeedbackDetailsDialog] = useState(false);
  const [openTrainerFeedbackDetailsDialog, setOpenTrainerFeedbackDetailsDialog] = useState(false);
  const [assignFeedbackDialogOpen, setAssignFeedbackDialogOpen] = useState(false);
  const [assignTrainerFeedbackDialogOpen, setAssignTrainerFeedbackDialogOpen] = useState(false);
  const [feedbackAwaitingDialogOpen, setFeedbackAwaitingDialogOpen] = useState(false);
  const [openFiles, setOpenFiles] = useState(false);
  const [open, setOpen] = useState(false); // effectiveness dialog
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openSubmittedModal, setOpenSubmittedModal] = useState(false);
  const [openPendingModal, setOpenPendingModal] = useState(false);
  const [openTrainerSubmittedModal, setOpenTrainerSubmittedModal] = useState(false);
  const [openTrainerPendingModal, setOpenTrainerPendingModal] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // ── Selection / active states ──
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [selectedTrainingId, setSelectedTrainingId] = useState(null);
  const [selectedTrainningId, setSelectedTrainningId] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedPlaningId, setSelectedPlaningId] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [otherOptions, setOtherOptions] = useState([]);
  const [selectedTrainees, setSelectedTrainees] = useState({});
  const [trainees, setTrainees] = useState([]);
  const [otherTrainees, setOtherTrainees] = useState([]);
  const [options, setOptions] = useState([]);

  // ── Form ──
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [formType, setFormType] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isPlanned, setIsPlanned] = useState('Planned');
  const [filteredTopics, setFilteredTopics] = useState([]);

  // ── Filters ──
  const [dateFilter, setDateFilter] = useState('thisMonth');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ branch: '', department: '', status: '', planningType: '' });
  const [multifilters, setmultiFilters] = useState({ branch: [], department: [], status: [], planningType: [] });
  const [filtersOptions, setFiltersOptions] = useState({ branches: [], departments: [], statuses: [], planningTypes: [] });

  // ── Pagination / Sorting ──
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('date');
  const [submittedPage, setSubmittedPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [submittedTrainerPage, setSubmittedTrainerPage] = useState(1);
  const [pendingTrainerPage, setPendingTrainerPage] = useState(1);
  const [traineePage, setTraineePage] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [expanded, setExpanded] = useState({});

  // ── Tabs ──
  const [topTab, setTopTab] = useState(0);
  const [nestedTab, setNestedTab] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  // ── Snackbar ──
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // ── Misc UI ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState({});
  const [actionMenuMap, setActionMenuMap] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [totalAssignedUser, setTotalAssignedUser] = useState(0);
  const [trainingDate, setTrainingDate] = useState('');
  
  const [createdDate, setCreatedDate] = useState(null);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [currentSessionNo, setCurrentSessionNo] = useState(null);
  const [downloadingFile, setDownloadingFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // ── Planning / mapping modal data ──
  const [planningData, setPlanningData] = useState({ success: false, data: [] });
  const [sessionListData, setSessionListData] = useState({ trainers: [] });
  const [mappingData, setMappingData] = useState({ success: false, data: [] });
  const [mappingTraineesData, setMappingTraineesData] = useState([]);
  const [formattedData1, setFormattedData1] = useState([]);
  const [formattedData2, setFormattedData2] = useState([]);

  // ── Feedback ──
  const [feedbackForms, setFeedbackForms] = useState([]);
  const [trainerFeedbackForms, setTrainerFeedbackForms] = useState([]);
  const [selectedFeedbackForm, setSelectedFeedbackForm] = useState('');
  const [selectedFeedbackFormName, setSelectedFeedbackFormName] = useState('');
  const [selectedTrainerFeedbackForm, setSelectedTrainerFeedbackForm] = useState(null);
  const [feedbackQuestions, setFeedbackQuestions] = useState({});
  const [feedbackData, setFeedbackData] = useState({ submitted: 0, assigned: 0 });
  const [traineeFeedback, setTraineeFeedback] = useState({ topics: [] });
  const [trainerFeedback, setTrainerFeedback] = useState(null);
  const [submittedTrainees, setSubmittedTrainees] = useState([]);
  const [pendingTrainees, setPendingTrainees] = useState([]);
  const [submittedTrainers, setSubmittedTrainers] = useState([]);
  const [pendingTrainers, setPendingTrainers] = useState([]);
  const [showSubmittedList, setShowSubmittedList] = useState(false);
  const [showPendingList, setShowPendingList] = useState(false);
  const [showTrainerSubmittedList, setShowTrainerSubmittedList] = useState(false);
  const [showTrainerPendingList, setShowTrainerPendingList] = useState(false);
  const [finalSubmitDate, setFinalSubmitDate] = useState(null);
  const [trainerFinalSubmitDate, setTrainerFinalSubmitDate] = useState(null);

  // ── Role ──
  const [roleMapping, setRoleMapping] = useState([]);
  const allowedBranchIds = useMemo(
    () => rolePermissions?.['Branch Assign']?.['Branch Select']?.['Branch List'] || [],
    [rolePermissions]
  );

  const filteredBranchOptions = useMemo(() => [
    { branch_id: 'all', branch_name: 'PAN INDIA' },
    ...branchMaster.filter(b => b.branch_id !== 'all' && allowedBranchIds.includes(b.branch_id)),
  ], [branchMaster, allowedBranchIds]);

  const allBranchIds = useMemo(() => branchMaster.map(b => b.branch_id).join(','), [branchMaster]);

  const isAdmin = useMemo(
    () => hasAccess('Training Summary', 'Training Admin View', 'View') || hasAccess('Training Summary', 'Training Admin View', 'View/Create/Edit'),
    [hasAccess]
  );

  // ─── Snackbar helpers ──────────────────────────────────────────────────────

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const handleCloseSnackbar = useCallback((event, reason) => {
    setSnackbarOpen(false);
  }, []);

  const handleOpenSnackbar = useCallback((message, severity) => showSnackbar(message, severity), [showSnackbar]);

  // ─── User setup ───────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = sessionStorage.getItem('userDetails');
    if (stored) {
      try { setLoggedInUser({ ...JSON.parse(stored) }); }
      catch (e) { console.error('Error parsing user details:', e); }
    }
  }, []);

  // ─── Navigation state ─────────────────────────────────────────────────────

  useEffect(() => {
    if (location.state?.activeTab !== undefined) {
      setTopTab(location.state.activeTab);
      setExpanded({});
    }
    if (location.state?.shouldOpenModal) setIsAddModalOpen(true);
    if (location.state?.filters) setFilters(prev => ({ ...prev, ...location.state.filters }));
    if (location.state?.shouldOpenModal || location.state?.filters) {
      navigate(location.pathname, { replace: true, state: { ...location.state, shouldOpenModal: false, filters: undefined } });
    }
  }, [location.state, navigate]);

  // ─── TrainerType default ──────────────────────────────────────────────────

  useEffect(() => {
    if (!formData.trainerType && trainingTypes.find(t => t.training_type === 'Internal')) {
      handleFieldChange('trainerType', 'Internal');
    }
  }, [trainingTypes]);

  // ─── Options for attendance autocomplete ──────────────────────────────────

  useEffect(() => {
    setOptions([
      { label: 'ALL', id: 'ALL' },
      { label: 'Other', id: 'Other' },
      ...trainees.map(t => ({ label: t.trainee_name || 'N/A', id: String(t.trainee_id) })),
    ]);
  }, [trainees]);

  // ─── Feedback dialog reopen after redirect ────────────────────────────────

  useEffect(() => {
    if (localStorage.getItem('returnToFeedbackDialog') === 'true') {
      handleOpenFeedbackDialog();
      localStorage.removeItem('returnToFeedbackDialog');
    }
  }, []);

  // ─── Fetch master data ────────────────────────────────────────────────────

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [branchRes, deptRes, staffRes, topicsRes, typesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/training-master/branchmaster/list`),
          axios.get(`${API_BASE_URL}/training-master/department/list`),
          axios.get(`${API_BASE_URL}/training-master/staff-category/list`),
          axios.get(`${API_BASE_URL}/training-master/topic/list`),
          axios.get(`${API_BASE_URL}/training-master/type/list`),
        ]);

        const dedup = (arr, key) => { const seen = new Set(); return arr.filter(o => { if (seen.has(o[key])) return false; seen.add(o[key]); return true; }); };

        setBranchMaster(dedup([{ branch_id: 'all', branch_name: 'Pan India' }, ...(branchRes.data.topics || [])], 'branch_id'));
        setDepartmentMaster(dedup([{ department_id: 'all', department_name: 'All Departments' }, ...(deptRes.data.topics || [])], 'department_id'));
        setStaffCategories(staffRes.data.topics || []);
        setTrainingTopics(topicsRes.data.topics || []);
        setTrainingTypes(typesRes.data.topics || []);
      } catch (e) { console.error('Error fetching master data:', e); }
    };
    fetchMasterData();
  }, [API_BASE_URL]);

  // ─── Fetch filter options (branches & departments for filter bar) ──────────

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/training-master/branchmaster/list`);
        const data = await res.json();
        if (data?.topics) setFiltersOptions(prev => ({ ...prev, branches: data.topics.map(i => i.branch_name) }));
      } catch (e) { console.error('Error fetching branches:', e); }
    };
    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/training-master/department/list`);
        const data = await res.json();
        if (data?.topics) setFiltersOptions(prev => ({ ...prev, departments: data.topics.map(i => i.department_name) }));
      } catch (e) { console.error('Error fetching departments:', e); }
    };
    fetchBranches();
    fetchDepartments();
  }, [API_BASE_URL]);

  // ─── Fetch admin training data ────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { emp_id: userId, userRole } = JSON.parse(sessionStorage.getItem('userDetails')) || {};
        if (!userId) throw new Error('User ID missing in session storage.');
        const roleRes = await axios.post(`${API_BASE_URL}/roleRoutes/roleMaster/FunctionalityListforRoleManagement`, { userRole });
        if (!roleRes.data?.['Branch Assign'] || !roleRes.data?.['Department Assign']) throw new Error('Invalid role response format.');
        const payload = {
          branch_list: roleRes.data['Branch Assign']['Branch Select']['Branch List'] || [],
          department_list: roleRes.data['Department Assign']['Department Select']['Department List'] || [],
        };
        const res = await axios.post(`${API_BASE_URL}/planning-route/viewPlaningInfo`, payload);
        if (res.data && Array.isArray(res.data.data)) { setTrainingData(res.data.data); setError(null); }
        else throw new Error('Unexpected response format.');
      } catch (e) { console.error('Error fetching training data:', e); setError(e.message); }
    };
    fetchData();
  }, [API_BASE_URL]);

  // ─── Fetch user training data ─────────────────────────────────────────────

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userDetails?.branch_id || !userDetails?.emp_id) return;
      try {
        const [res1, res2] = await Promise.all([
          fetch(`${API_BASE_URL}/planning-route/PlanningSessionActiveTrainees/UserViewListBasisBranch`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ branch_id: userDetails.branch_id, trainer_code: userDetails.emp_id }),
          }),
          fetch(`${API_BASE_URL}/planning-route/CorOrSubViewPlaningDetails`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emp_id: userDetails.emp_id }),
          }),
        ]);
        if (!res1.ok || !res2.ok) throw new Error('HTTP error fetching user data');
        const data1 = await res1.json();
        const { records: data2 } = await res2.json();

        const fmt1 = data1.map(r => ({
          id: r.id, branch: r.branch_names || 'N/A', department: r.department_names || 'N/A',
          staffCategory: r.staff_category || 'N/A', topic: r.training_topic || 'N/A',
          trainerType: r.training_type || 'N/A',
          date: r.planning_date ? dayjs(r.planning_date).format('YYYY-MM-DD') : 'N/A',
          status: getStatusForUI(r.status), remarks: r.remarks || 'N/A',
          planningType: r.planning_type || 'N/A', cancelReason: r.cancelled_reason || 'N/A',
          sessionNo: null, role_type: null, canPerformAction: false,
          isTrainer: r.emp_id === userDetails.emp_id.toString(),
        }));

        const fmt2 = data2.map(r => ({
          id: r.id, role_type: r.role_type?.toLowerCase() || 'no role',
          sessionNo: r.session_no || 'N/A', isTrainer: r.trainer === 'YES',
        }));

        const merged = fmt1.map(item => {
          const match = fmt2.find(s => s.id === item.id);
          const isTrainer = item.isTrainer || (match?.isTrainer ?? false);
          const roleType = match?.role_type || 'no role';
          return {
            ...item, sessionNo: match?.sessionNo || 'N/A', role_type: roleType, isTrainer,
            canPerformAction: ['coordinator', 'sub_coordinator'].includes(roleType) || isTrainer,
          };
        });

        setUserTrainingData(merged);
        setFormattedData1(fmt1);
        setFormattedData2(fmt2);
      } catch (e) { console.error('Error fetching user data:', e); setError('Error fetching data'); }
    };
    fetchUserData();
  }, [userDetails?.branch_id, userDetails?.emp_id, API_BASE_URL]);

  // ─── Fetch coordinator data ───────────────────────────────────────────────

  const fetchCoordinatorData = useCallback(async () => {
    if (!loggedInUser?.emp_id) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/planning-route/CorOrSubViewPlaningDetails`, { emp_id: loggedInUser.emp_id });
      setCoordinatorData(res.data.records || []);
    } catch (e) { console.error('Error fetching coordinator data:', e); }
    finally { setLoading(false); }
  }, [loggedInUser, API_BASE_URL]);

  useEffect(() => { fetchCoordinatorData(); }, [fetchCoordinatorData]);

  // ─── Fetch assigned users count ───────────────────────────────────────────

  useEffect(() => {
    const fetchAssignedUsers = async () => {
      if (!userDetails?.emp_id) return;
      try {
        const res = await axios.post(`${API_BASE_URL}/planning-route/PlanningSessionActiveTrainees/UserViewListBasisTrainee`, { trainee_id: userDetails.emp_id });
        if (res.status === 200 && Array.isArray(res.data)) setTotalAssignedUser(res.data.length);
      } catch (e) { console.error('Error fetching assigned users:', e); }
    };
    fetchAssignedUsers();
  }, [API_BASE_URL]);

  // ─── Feedback dialog reopen ───────────────────────────────────────────────

  useEffect(() => {
    if (assignFeedbackDialogOpen) fetchFeedbackForms();
  }, [assignFeedbackDialogOpen]);

  useEffect(() => {
    if (assignTrainerFeedbackDialogOpen) fetchTrainerFeedbackForms();
  }, [assignTrainerFeedbackDialogOpen]);


  

  // ─── Session fetch on training click ─────────────────────────────────────

  useEffect(() => {
    if (selectedTrainingId) fetchSessionsForTraining(selectedTrainingId);
  }, [selectedTrainingId]);

  // ─── Standard payload helper ──────────────────────────────────────────────

  const getStandardPayload = useCallback(async () => {
    const { emp_id: userId, userRole } = JSON.parse(sessionStorage.getItem('userDetails')) || {};
    if (!userId) throw new Error('User ID is missing in session storage.');
    let branch_list = [], department_list = [];
    if (userRole) {
      try {
        const res = await axios.post(`${API_BASE_URL}/roleRoutes/roleMaster/FunctionalityListforRoleManagement`, { userRole });
        if (res.data) {
          branch_list = res.data['Branch Assign']?.['Branch Select']?.['Branch List'] || [];
          department_list = res.data['Department Assign']?.['Department Select']?.['Department List'] || [];
        }
      } catch (e) { console.error('Error fetching role data:', e); }
    }
    return { branch_list, department_list };
  }, [API_BASE_URL]);

  // ─── Fetch training data (refresh) ───────────────────────────────────────

  const fetchTrainingData = useCallback(async () => {
    try {
      const payload = await getStandardPayload();
      const res = await axios.post(`${API_BASE_URL}/planning-route/viewPlaningInfo`, payload);
      if (res.data && Array.isArray(res.data.data)) { setTrainingData(res.data.data); setError(null); }
      else throw new Error('No training records found.');
    } catch (e) { console.error('Error fetching training data:', e); setError(e.response?.data?.message || 'Failed to fetch training data.'); }
  }, [getStandardPayload, API_BASE_URL]);

  // ─── Sessions ─────────────────────────────────────────────────────────────

  const fetchSessionsForTraining = useCallback(async (trainingId) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/planning-route/session/list`, { planing_id: trainingId });
      if (res.status === 200) return res.data.trainers || [];
      return [];
    } catch (e) { console.error('Error fetching session data:', e); handleOpenSnackbar('Failed to fetch session data.', 'error'); return []; }
  }, [API_BASE_URL]);

  const handleExpandClick = useCallback(async (trainingId) => {
    setExpanded(prev => ({ [trainingId]: !prev[trainingId] }));
    if (!sessionsData[trainingId]) {
      const sessions = await fetchSessionsForTraining(trainingId);
      setSessionsData(prev => ({ ...prev, [trainingId]: sessions }));
    }
  }, [sessionsData, fetchSessionsForTraining]);

  // ─── Planning data ────────────────────────────────────────────────────────

  const fetchPlanningData = useCallback(async (selectedId) => {
    try {
      const payload = await getStandardPayload();
      const ud = loggedInUser || JSON.parse(sessionStorage.getItem('userDetails') || '{}');
      let filteredData = [];
      if (ud?.userRole && ud.userRole !== '') {
        const res = await axios.post(`${API_BASE_URL}/planning-route/viewPlaningInfo`, payload);
        filteredData = res.data?.data?.filter(r => String(r.id) === String(selectedId)) || [];
      } else if (ud?.emp_id) {
        const res = await axios.post(`${API_BASE_URL}/planning-route/CorOrSubViewPlaningDetails`, { emp_id: ud.emp_id });
        filteredData = res.data?.records?.filter(r => String(r.id) === String(selectedId)) || [];
      }
      setPlanningData({ success: true, data: filteredData });
    } catch (e) { console.error('Error fetching planning data:', e); setPlanningData({ success: false, data: [], error: e.message }); }
  }, [getStandardPayload, loggedInUser, API_BASE_URL]);

  // ─── Mapping helpers ──────────────────────────────────────────────────────

  const fetchMappingData = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/planning-route/MappingCoordinator/view`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planing_id: id }) });
      setMappingData(await res.json());
    } catch (e) { console.error('Error fetching mapping data:', e); }
  }, [API_BASE_URL]);

  const fetchMappingTrainee = useCallback(async (id, sessionNo) => {
    try {
      const res = await fetch(`${API_BASE_URL}/planning-route/PlanningSessionAsigningEmpMail/list`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planing_id: id, session_no: sessionNo }) });
      const data = await res.json();
      return data.records || [];
    } catch (e) { console.error(`Error fetching mapping trainees for session ${sessionNo}:`, e); return []; }
  }, [API_BASE_URL]);

  const fetchSessionListAndMappingTrainees = useCallback(async (trainingId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/planning-route/session/list`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planing_id: trainingId }) });
      const sessionData = await res.json();
      setSessionListData(sessionData);
      if (sessionData?.trainers?.length > 0) {
        const allTrainees = [];
        await Promise.all(sessionData.trainers.map(async ({ session_no }) => {
          if (session_no) {
            const t = await fetchMappingTrainee(trainingId, session_no);
            t.forEach(trainee => allTrainees.push({ ...trainee, session_no }));
          }
        }));
        setMappingTraineesData(allTrainees);
      }
    } catch (e) { console.error('Error fetching session list and mapping trainees:', e); }
  }, [API_BASE_URL, fetchMappingTrainee]);

  // ─── Modal effect ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (openModal && selectedTrainningId) {
      fetchPlanningData(selectedTrainningId);
      fetchMappingData(selectedTrainningId);
      fetchSessionListAndMappingTrainees(selectedTrainningId);
    }
  }, [openModal, selectedTrainningId]);

  const getMappingDataForSession = useCallback((sessionNo) => {
    if (!mappingData || !Array.isArray(mappingData.data)) return [];
    return mappingData.data.filter(m => m.session_no === sessionNo);
  }, [mappingData]);

  const getTraineesForSession = useCallback((sessionNo) =>
    mappingTraineesData.filter(t => t.session_no === sessionNo), [mappingTraineesData]);

  // ─── Attendance ───────────────────────────────────────────────────────────

  const fetchMappedTrainees = useCallback(async (planingId, sessionNo) => {
    try {
      const res = await fetch(`${API_BASE_URL}/planning-route/PlanningSessionActiveAttendanceStatus/list`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planing_id: planingId, session_no: sessionNo }),
      });
      const data = JSON.parse(await res.text());
      if (data.coordinators) setTrainees(data.coordinators);
    } catch (e) { console.error('Error fetching trainees:', e); }
  }, [API_BASE_URL]);

  // Combined: fetch mapped trainees from original mapping API, then load draft
  const fetchMappedTraineesAndThenDraft = useCallback(async (planingId, sessionNo) => {
    try {
      const [attendanceRes, mappingRes] = await Promise.all([
        fetch(`${API_BASE_URL}/planning-route/PlanningSessionActiveAttendanceStatus/list`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planing_id: planingId, session_no: sessionNo }),
        }),
        fetch(`${API_BASE_URL}/planning-route/PlanningSessionAsigningEmpMail/list`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planing_id: planingId, session_no: sessionNo }),
        }),
      ]);

      const attendanceData = await attendanceRes.json();
      const mappingData = await mappingRes.json();
      const allRows = attendanceData.coordinators || [];
      const originalMappedIds = new Set((mappingData.records || []).map(r => String(r.trainee_id)));

      const mappedOptions = allRows
        .filter(r => originalMappedIds.has(String(r.trainee_id)))  // ✅ already correct
        .map(r => ({ 
          id: String(r.trainee_id),   // ✅ keep as string
          label: r.trainee_name 
        }));

      const walkInRows = allRows.filter(r => !originalMappedIds.has(String(r.trainee_id)) && r.attendance_status === 1);
      const walkInOptions = walkInRows.map(r => ({ id: String(r.trainee_id), label: r.trainee_name }));

      setOptions([{ label: 'ALL', id: 'ALL' }, { label: 'Other', id: 'Other' }, ...mappedOptions]);
      setTrainees(allRows);

      const presentMapped = mappedOptions.filter(opt =>
        allRows.find(r => String(r.trainee_id) === opt.id && r.attendance_status === 1)
      );

      const traineeAttendance = {};
        allRows.forEach(({ trainee_id, attendance_status }) => {
          traineeAttendance[String(trainee_id)] = attendance_status === 1 ? 'Y' : 'N';  // ✅
        });

      setTimeout(() => {
        setSelectedTrainees(traineeAttendance);
        setSelectedOptions(presentMapped);
        if (walkInOptions.length > 0) {
          setSelectedOptions(prev => prev.some(o => o.id === 'Other') ? prev : [...prev, { id: 'Other', label: 'Other' }]);
          setOtherOptions(walkInOptions);
        } else {
          setOtherOptions([]);
        }
      }, 100);
    } catch (e) { console.error('Error loading attendance dialog:', e); }
  }, [API_BASE_URL]);

  const fetchDraftAttendance = useCallback(async (planingId, sessionNo) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/planning-route/PlanningSessionActiveAttendanceStatus/list`, { planing_id: planingId, session_no: sessionNo });
      if (!res.data?.coordinators?.length) { setSelectedOptions([]); setSelectedTrainees({}); return; }

      const allPresent = res.data.coordinators.filter(t => t.attendance_status === 1);
      const mappedIds = new Set(options.filter(o => o.id !== 'ALL' && o.id !== 'Other').map(o => String(o.id)));
      const mappedPresent = allPresent.filter(t => mappedIds.has(String(t.trainee_id)));
      const otherPresent = allPresent.filter(t => !mappedIds.has(String(t.trainee_id)));

      const selectedMapped = mappedPresent.map(t => ({ id: String(t.trainee_id), label: t.trainee_name }));
      const selectedOther = otherPresent.map(t => ({ id: String(t.trainee_id), label: t.trainee_name }));

      const traineeAttendance = {};
      res.data.coordinators.forEach(({ trainee_id, attendance_status }) => {
        traineeAttendance[String(trainee_id)] = attendance_status === 1 ? 'Y' : 'N';
      });

      setSelectedTrainees(traineeAttendance);
      setTimeout(() => {
        setSelectedOptions(selectedMapped);
        if (selectedOther.length > 0) {
          setSelectedOptions(prev => prev.some(o => o.id === 'Other') ? prev : [...prev, { id: 'Other', label: 'Other' }]);
          setOtherOptions(selectedOther);
        } else {
          setOtherOptions([]);
        }
      }, 200);
    } catch (e) { console.error('Error fetching drafted attendance:', e); }
  }, [API_BASE_URL, options]);

// ── outside the component, at module level ──
function chunkObject(obj, size) {
  const entries = Object.entries(obj);
  const chunks = [];
  for (let i = 0; i < entries.length; i += size) {
    chunks.push(Object.fromEntries(entries.slice(i, i + size)));
  }
  return chunks;
}

  const handleBulkSave = useCallback(async (
    planingId,
    sessionNo,
    traineeMap,
    walkInDetails = [],
    { isDraft = false } = {},
    inlineCoordCtx = null
  ) => {
    const coordCtx = inlineCoordCtx
      || coordinatorContextRef.current
      || sessionCoordinatorContext
      || {};

    try {
      // ── 1. Build clean trainee map ──
      const cleanMap = {};
      if (traineeMap && typeof traineeMap === 'object') {
        Object.entries(traineeMap).forEach(([id, status]) => {
          const trimmedId = String(id).trim();
          if (!trimmedId || trimmedId === 'ALL' || trimmedId === 'Other') return;
          cleanMap[trimmedId] = status;
        });
      }

      // ── 2. Build walk-ins array ──
      const walkIns = Array.isArray(walkInDetails) && walkInDetails.length > 0
        ? walkInDetails.map(w => ({
            trainee_name:       (w.trainee_name       || '').trim(),
            trainee_mail:       (w.trainee_mail        || '').trim().toLowerCase(),
            trainee_branch:     (w.trainee_branch      || '').trim(),
            trainee_department: (w.trainee_department  || '').trim(),
            trainee_id:         null,
            attendance_status:  1,
            coordinator_emp_id: coordCtx.coordinator_emp_id ?? null,
            coordinator_name:   coordCtx.coordinator_name   ?? null,
            coordinator_type:   coordCtx.coordinator_type   ?? null,
          }))
        : [];

      if (Object.keys(cleanMap).length === 0 && walkIns.length === 0) {
        showSnackbar('⚠️ No attendance data to save.', 'warning');
        return;
      }

      // ── 3. Chunk into batches of 100 ──
      const BATCH_SIZE = 100;
      const traineeChunks = Object.keys(cleanMap).length > 0
        ? chunkObject(cleanMap, BATCH_SIZE)
        : [{}];   // at least one batch so walk-ins get sent

      console.log(`[handleBulkSave] ${Object.keys(cleanMap).length} trainees → ${traineeChunks.length} batch(es)`);

      for (let i = 0; i < traineeChunks.length; i++) {
        const batchPayload = {
          planing_id: planingId,
          session_no: sessionNo,
          ...(Object.keys(traineeChunks[i]).length > 0 && { trainee_id: traineeChunks[i] }),
          // Walk-ins only on first batch
          ...(i === 0 && walkIns.length > 0 && { walk_ins: walkIns }),
        };

        console.log(`[handleBulkSave] Batch ${i + 1}/${traineeChunks.length}`, Object.keys(traineeChunks[i]).length, 'trainees');

        const res = await axios.post(
          `${API_BASE_URL}/planning-route/PlanningSessionActiveAttendanceStatus/update`,
          batchPayload,
          { timeout: 60000 }
        );

        const msg = res.data?.message || '';
        if (!msg.toLowerCase().includes('successfully')) {
          showSnackbar(`❌ Batch ${i + 1} failed: ${msg}`, 'error');
          return;
        }
      }

      // ── 4. Post-save actions (same as before) ──
      if (!isDraft) {
        try {
          await axios.post(
            `${API_BASE_URL}/planning-route/session/updateStatus`,
            { planing_id: planingId, session_no: sessionNo, PSstatus: 'Attendance Added' }
          );
          await axios.post(
            `${API_BASE_URL}/planning-route/updateStatus`,
            {
              id:         planingId,
              emp_id:     loggedInUser.emp_id,
              user_name:  loggedInUser.empname,
              user_email: loggedInUser.user_email,
              Status:     'Training Conducted',
            }
          );

          // Walk-in confirmation emails (best-effort)
          if (walkIns.length > 0) {
            const walkInEmails = walkIns.filter(w => w.trainee_mail).map(w => w.trainee_mail);
            if (walkInEmails.length > 0) {
              try {
                await fetch(
                  `${API_BASE_URL}/planning-route/PlanningSessionActiveTrainees/sendWalkInAttendanceConfirmation`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      planing_id:     planingId,
                      session_no:     sessionNo,
                      walkin_emails:  walkInEmails,
                      walkin_details: walkIns,
                    }),
                  }
                );
              } catch (emailErr) {
                console.warn('[handleBulkSave] Walk-in email failed (non-critical):', emailErr);
              }
            }
          }
        } catch (statusErr) {
          console.error('[handleBulkSave] Status update failed:', statusErr);
          showSnackbar('⚠️ Attendance saved but status update failed.', 'warning');
        }

        const updatedSessions = await fetchSessionsForTraining(planingId);
        setSessionsData(prev => ({ ...prev, [planingId]: updatedSessions }));
        showSnackbar('✅ Attendance submitted successfully!');
      } else {
        const updatedSessions = await fetchSessionsForTraining(planingId);
        setSessionsData(prev => ({ ...prev, [planingId]: updatedSessions }));
        showSnackbar('📝 Draft saved — you can continue editing.');
      }

    } catch (err) {
      console.error('[handleBulkSave] Unexpected error:', err);
      showSnackbar(
        err.response?.data?.message || err.message || '❌ An unexpected error occurred.',
        'error'
      );
    }
  }, [API_BASE_URL, loggedInUser, sessionCoordinatorContext, showSnackbar, fetchSessionsForTraining]);

  const handleOpenAttendanceDialog = useCallback((session) => {
    setSelectedOptions([]);
    setOtherOptions([]);
    setSelectedSession(session);
    setAttendanceDialogOpen(true);
    fetchMappedTraineesAndThenDraft(session.planing_id, session.session_no);
  }, [fetchMappedTraineesAndThenDraft]);

  const handleCloseAttendanceDialog = useCallback(() => {
    setSelectedOptions([]);
    setOtherOptions([]);
    setAttendanceDialogOpen(false);
    setSelectedSession(null);
  }, []);

  const handleSaveDraftAttendance = useCallback(async (planingId, sessionNo) => {
    try {
      const traineeAttendance_draft = {};
      options.forEach(o => { if (o.id === 'ALL' || o.id === 'Other') return; traineeAttendance_draft[o.id] = selectedOptions.some(s => s.id === o.id) ? 'Y' : 'N'; });
      otherOptions.forEach(o => { if (o.id && o.id !== 'Other') traineeAttendance_draft[String(o.id)] = 'Y'; });

      const res = await axios.post(`${API_BASE_URL}/planning-route/PlanningSessionActiveAttendanceStatus/update`, { planing_id: planingId, session_no: sessionNo, trainee_id: traineeAttendance_draft });
      if (!res.data.message.includes('successfully')) throw new Error(res.data.message || 'Error saving attendance.');
      showSnackbar('Attendance draft saved successfully!');
    } catch (e) {
      console.error('Error saving draft attendance:', e);
      setTimeout(() => showSnackbar(e.response?.data?.message || e.message || 'An error occurred.', 'error'), 200);
    } finally { setAttendanceDialogOpen(false); }
  }, [API_BASE_URL, options, selectedOptions, otherOptions, showSnackbar]);

  const handleSaveAttendance = useCallback(() => setConfirmationDialogOpen(true), []);

  const handleConfirmAttendance = useCallback(async (planingId, sessionNo) => {
    try {
      const traineeAttendance = {};
      options.forEach(o => {
        if (o.id === 'ALL' || o.id === 'Other') return;
        traineeAttendance[o.id] = selectedTrainees[o.id] || 'N';
       
      });
      otherOptions.forEach(o => { if (o.id && o.id !== 'Other') traineeAttendance[String(o.id)] = 'Y'; });

      const attRes = await axios.post(`${API_BASE_URL}/planning-route/PlanningSessionActiveAttendanceStatus/update`, { planing_id: planingId, session_no: sessionNo, trainee_id: traineeAttendance });
      if (!attRes.data.message.includes('successfully')) throw new Error(attRes.data.message);

      const statusRes = await axios.post(`${API_BASE_URL}/planning-route/session/updateStatus`, { planing_id: planingId, session_no: sessionNo, PSstatus: 'Attendance Added' });
      if (statusRes.data.message !== 'Session information updated and history logged successfully.') throw new Error(statusRes.data.message);

      await axios.post(`${API_BASE_URL}/planning-route/updateStatus`, { id: planingId, emp_id: loggedInUser.emp_id, user_name: loggedInUser.empname, user_email: loggedInUser.user_email, Status: 'Training Conducted' });

      const updatedSessions = await fetchSessionsForTraining(planingId);
      setSessionsData(prev => ({ ...prev, [planingId]: updatedSessions }));
      setAttendanceDialogOpen(false);
      setConfirmationDialogOpen(false);
      setTimeout(() => showSnackbar('Attendance saved successfully!'), 200);
    } catch (e) {
      console.error('Error confirming attendance:', e);
      setTimeout(() => showSnackbar(e.response?.data?.message || e.message || 'An error occurred.', 'error'), 200);
    } finally { setAttendanceDialogOpen(false); setConfirmationDialogOpen(false); }
  }, [API_BASE_URL, options, selectedTrainees, otherOptions, loggedInUser, fetchSessionsForTraining, showSnackbar]);

  // ─── Attendance change handlers ────────────────────────────────────────────



  // ─── Other trainees fetch ─────────────────────────────────────────────────
    const fetchOtherTrainees = useCallback(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/login/activeEmplList1`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' } 
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        const list = data.employees || [];
        setOtherTrainees(
          list.map(t => ({
            label: t.full_name || 'N/A',
            id: String(t.emp_id),
            email: t.email_id || t.email || '',
          }))
        );
      } catch (e) { 
        console.error('Error fetching other trainees:', e); 
      }
    }, [API_BASE_URL]);

    // ─── Attendance change handlers ───────────────────────────────────────────
    // ✅ Now safe — fetchOtherTrainees is already initialized
    const handleChange = useCallback((event, value) => {
      if (value.some(o => o.id === 'ALL')) {
        const all = options.filter(t => t.id !== 'ALL' && t.id !== 'Other');
        setSelectedOptions(all);
        const attendance = {};
        all.forEach(t => { attendance[t.id] = 'Y'; });
        setSelectedTrainees(attendance);
        setOtherOptions([]);
      } else {
        setSelectedOptions(value);
        const selectedIds = new Set(value.map(o => o.id));
        const attendance = {};
        options
          .filter(o => o.id !== 'ALL' && o.id !== 'Other')
          .forEach(o => {
            attendance[o.id] = selectedIds.has(o.id) ? 'Y' : 'N';
          });
        setSelectedTrainees(attendance);
        if (value.some(o => o.id === 'Other')) fetchOtherTrainees();
        else setOtherOptions([]);
      }
    }, [options, fetchOtherTrainees]);

  const handleOtherChange = useCallback((event, value) => setOtherOptions(value), []);

  const handleSelectAll = useCallback((event) => {
    const checked = event.target.checked;
    const newSel = {};
    trainees.forEach(t => {
        newSel[String(t.trainee_id)] = checked ? 'Y' : 'N';  // ← ensure String()
      });
          
      setSelectedTrainees(newSel);
  }, [trainees]);

  const handleSelectTrainee = useCallback((traineeId, isChecked) => {
    setSelectedTrainees(prev => ({ ...prev, [traineeId]: isChecked ? 'Y' : 'N' }));
  }, []);

 

  // ─── Effectiveness ────────────────────────────────────────────────────────

const openEffectivenessDialog = useCallback((planingId, sessionNo) => {
  setSelectedSession({ planing_id: planingId, session_no: sessionNo });
  setOpen(true);
}, []);

  const handleTrainingClose = useCallback(() => { setOpen(false); setSelectedSession(null); }, []);

  const handleEffectivenessSubmit = useCallback(async (planing_id, session_no, empList) => {
  // Build payload
  const data = { planing_id, session_no, trainee_Effective_info: {} };
  empList.forEach(e => {
    data.trainee_Effective_info[e.id] = [
      e.effectiveness.includes('A') ? 1 : 0,
      e.effectiveness.includes('B') ? 1 : 0,
      e.effectiveness.includes('C') ? 1 : 0,
      e.okStatus    === 'OK'  ? 1 : 0,
      e.retraining  === 'Yes' ? 1 : 0,
      e.remarks || '',
    ];
  });

  const [statusRes, effectRes] = await Promise.all([
    axios.post(`${API_BASE_URL}/planning-route/session/updateStatus`,
      { planing_id, session_no, PSstatus: 'Training Effectiveness' }),
    axios.post(`${API_BASE_URL}/planning-route/updateTraineeEffectiveness/update`, data),
  ]);
  showSnackbar('Training effectiveness submitted successfully!');
  const updated = await fetchSessionsForTraining(planing_id);
  setSessionsData(prev => ({ ...prev, [planing_id]: updated }));
}, [API_BASE_URL, showSnackbar, fetchSessionsForTraining]);

  // ─── Feedback forms ───────────────────────────────────────────────────────

  const fetchFeedbackForms = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/training-master/AllMasterFeedbackFormQuestions/listOfTrainee`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (data?.topics && Array.isArray(data.topics)) setFeedbackForms(data.topics);
    } catch (e) { console.error('Error fetching feedback forms:', e); }
  }, [API_BASE_URL]);

  const fetchTrainerFeedbackForms = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/training-master/AllMasterFeedbackFormQuestions/listOfTrainer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (data?.topics && Array.isArray(data.topics)) setTrainerFeedbackForms(data.topics);
    } catch (e) { console.error('Error fetching trainer feedback forms:', e); }
  }, [API_BASE_URL]);

  const fetchTrainerFeedback = useCallback(async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/training-master/FeedbackFormQuestions/InforOfTrainer`, { planing_id: selectedPlaningId, session_no: selectedSessionId });
      if (res.data?.topics) {
        const data = res.data.topics.map(t => ({ id: t.planing_id, session_no: t.session_no, feedback_form_answer: t.feedback_form_answer, feedback_form_question: t.feedback_form_question ? JSON.parse(t.feedback_form_question) : {} }));
        setSubmittedTrainers(data.filter(t => t.feedback_form_answer !== null));
        setPendingTrainers(data.filter(t => t.feedback_form_answer === null));
      }
    } catch (e) { console.error('Error fetching trainer feedback:', e); }
  }, [API_BASE_URL, selectedPlaningId, selectedSessionId]);

  const handleOpenFeedbackDialog = useCallback((planingId, sessionNo) => {
    setSelectedSessionId(sessionNo);
    setSelectedPlaningId(planingId);
    setAssignFeedbackDialogOpen(true);
  }, []);

  const handleCloseFeedbackDialog = useCallback(() => { setAssignFeedbackDialogOpen(false); setFinalSubmitDate(null); }, []);
  const handleCloseTrainerFeedbackDialog = useCallback(() => { setAssignTrainerFeedbackDialogOpen(false); setSelectedSessionId(null); setTrainerFinalSubmitDate(null); }, []);

  const handleCheckboxChange = useCallback((id, name) => {
    if (selectedFeedbackForm === id) { setSelectedFeedbackForm(null); setSelectedFeedbackFormName(''); }
    else { setSelectedFeedbackForm(id); setSelectedFeedbackFormName(name); }
  }, [selectedFeedbackForm]);

  // ─── Assign feedback form to trainees ─────────────────────────────────────

  const handleAssignFeedbackForm = useCallback(async () => {
    if (!selectedFeedbackForm || !selectedSessionId || !selectedPlaningId) {
      showSnackbar('❌ Please select a feedback form before assigning.', 'error'); return;
    }
    try {
      const form = feedbackForms.find(f => f.id === selectedFeedbackForm);
      if (!form) { showSnackbar('❌ Selected feedback form not found.', 'error'); return; }

      const rawQ = form?.questions ? JSON.parse(form.questions) : {};
      const normalizedQ = Object.values(rawQ).reduce((acc, q, i) => { acc[i + 1] = q; return acc; }, {});

      const assignRes = await fetch(`${API_BASE_URL}/training-master/FeedbackFormQuestions/assigningToTrainee`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planing_id: selectedPlaningId, session_no: selectedSessionId, feedback_form_Assign: loggedInUser.emp_id, feedback_form_Assign_final_submit_date: finalSubmitDate ? finalSubmitDate.format('YYYY-MM-DD HH:mm') : '', feedback_form_name: form.feedback_form_name || '', questions: normalizedQ }),
      });
      const assignResult = JSON.parse(await assignRes.text());
      if (!assignRes.ok) { showSnackbar('❌ Failed to assign feedback form.', 'error'); return; }

      showSnackbar('✅ Feedback Form Assigned Successfully!');

      // Fetch attendance and send emails only to attendees
      let attendeeIds = [];
      try {
        const attRes = await axios.post(`${API_BASE_URL}/planning-route/PlanningSessionActiveAttendanceStatus/list`, { planing_id: selectedPlaningId, session_no: selectedSessionId });
        attendeeIds = (attRes.data?.coordinators || []).filter(t => t.attendance_status === 1).map(t => String(t.trainee_id));
        if (attendeeIds.length === 0) { showSnackbar('⚠️ No attendees found — feedback email not sent.', 'warning'); handleCloseFeedbackDialog(); return; }
      } catch (e) { console.warn('Could not fetch attendance list:', e); }

      const emailRes = await fetch(`${API_BASE_URL}/planning-route/PlanningSessionActiveTrainees/sending-feedback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planing_id: selectedPlaningId, session_no: selectedSessionId, ...(attendeeIds.length > 0 && { attendee_ids: attendeeIds }) }),
      });
      if (!emailRes.ok) { showSnackbar('❌ Failed to send email notification.', 'error'); return; }
      handleCloseFeedbackDialog();
    } catch (e) { console.error('Error:', e); showSnackbar('⚠️ An error occurred while assigning the feedback form.', 'error'); }
  }, [API_BASE_URL, selectedFeedbackForm, selectedSessionId, selectedPlaningId, feedbackForms, loggedInUser, finalSubmitDate, showSnackbar, handleCloseFeedbackDialog]);

  // ─── Assign trainer feedback ───────────────────────────────────────────────

  const handleAssignTrainerFeedbackForm = useCallback(async () => {
    if (!selectedTrainerFeedbackForm || !selectedSessionId || !selectedPlaningId) {
      showSnackbar('❌ Please select a trainer feedback form before assigning.', 'error'); return;
    }
    if (!trainerFinalSubmitDate) {
      showSnackbar('❌ Please select a trainer feedback submission deadline.', 'error'); return;
    }
    try {
      const form = trainerFeedbackForms.find(f => String(f.id) === String(selectedTrainerFeedbackForm));
      if (!form) { showSnackbar('❌ Selected trainer feedback form not found.', 'error'); return; }

      const rawQ = form?.questions ? JSON.parse(form.questions) : {};
      const normalizedQ = Object.values(rawQ).reduce((acc, q, i) => { acc[i + 1] = q; return acc; }, {});

      const assignRes = await fetch(`${API_BASE_URL}/training-master/FeedbackFormQuestions/assigningToTrainer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planing_id: selectedPlaningId, session_no: selectedSessionId, feedback_form_Assign: loggedInUser.emp_id, feedback_form_Assign_final_submit_date: dayjs(trainerFinalSubmitDate).format('YYYY-MM-DD HH:mm'), feedback_form_name: form.feedback_form_name || '', questions: normalizedQ }),
      });
      if (!assignRes.ok) { showSnackbar('❌ Failed to assign trainer feedback form.', 'error'); return; }
      showSnackbar('✅ Trainer Feedback Form Assigned Successfully!');

      // Update session status
      const statusRes = await fetch(`${API_BASE_URL}/planning-route/session/updateStatus`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planing_id: selectedPlaningId, session_no: selectedSessionId, PSstatus: 'Feedback Assigned' }) });
      if (!statusRes.ok) return;

      await fetch(`${API_BASE_URL}/planning-route/updateStatus`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedPlaningId, emp_id: loggedInUser.emp_id, user_name: loggedInUser.empname, user_email: loggedInUser.user_email, Status: 'Feedback Assigned' }) });

      const updatedSessions = await fetchSessionsForTraining(selectedPlaningId);
      setSessionsData(prev => ({ ...prev, [selectedPlaningId]: updatedSessions }));
      setAssignTrainerFeedbackDialogOpen(false);

      // Send email
      const emailRes = await fetch(`${API_BASE_URL}/planning-route/PlanningSessionActiveTrainer/sending-feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planing_id: selectedPlaningId, session_no: selectedSessionId }) });
      if (!emailRes.ok) { showSnackbar('❌ Failed to send trainer email notification.', 'error'); return; }
      showSnackbar('✅ Trainer Email Notification Sent Successfully!');
    } catch (e) { console.error('Error:', e); showSnackbar('⚠️ An error occurred while assigning the trainer feedback form.', 'error'); }
  }, [API_BASE_URL, selectedTrainerFeedbackForm, selectedSessionId, selectedPlaningId, trainerFeedbackForms, loggedInUser, trainerFinalSubmitDate, fetchSessionsForTraining, showSnackbar]);

  // ─── Awaiting feedback ────────────────────────────────────────────────────

  const HandleAwaitingFeedback = useCallback(async (planing_id, session_no) => {
  // ── Reset everything immediately so stale data never shows ──
  setSubmittedTrainees([]);
  setPendingTrainees([]);
  setSubmittedTrainers([]);
  setPendingTrainers([]);
  setActiveTab(0);
  setOpenFeedbackDialog(true);   // open dialog NOW showing empty/loading state
  setLoading(true);

  // ── Store in local vars AND state ──
  setSelectedPlaningId(planing_id);
  setSelectedSessionId(session_no);

  try {
    // ── 1. Fetch attendance for THIS specific session ──
    let attendeeIdSet = new Set();
    const attRes = await axios.post(
      `${API_BASE_URL}/planning-route/PlanningSessionActiveAttendanceStatus/list`,
      { planing_id, session_no }
    );
    const attendees = (attRes.data?.coordinators || []).filter(t => t.attendance_status === 1);
    
    if (attendees.length === 0) {
      // No attendees found — show zeros, don't show unrelated data
      setSubmittedTrainees([]);
      setPendingTrainees([]);
      setLoading(false);
      return;
    }
    
    attendees.forEach(t => attendeeIdSet.add(String(t.trainee_id)));

    // ── 2. Fetch trainee feedback for THIS planing_id + session_no ──
    const traineeRes = await fetch(
      `${API_BASE_URL}/training-master/TraineeFeedbackFormQuestions/GetAllSubmitedOrPendingFeedbackFormDetailsCountToTrainee`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planing_id, session_no })   // explicit local vars
      }
    );
    const traineeData = await traineeRes.json();

    // ── Filter strictly to THIS session's attendees only ──
    const submitted = (traineeData.SubmittedTrainees || []).filter(
      t => attendeeIdSet.has(String(t.trainee_id))
    );
    const pending = (traineeData.PendingTrainees || []).filter(
      t => attendeeIdSet.has(String(t.trainee_id))
    );

    setSubmittedTrainees(submitted);
    setPendingTrainees(pending);

    // ── 3. Fetch trainer feedback for THIS planing_id + session_no ──
    const trainerRes = await fetch(
      `${API_BASE_URL}/training-master/FeedbackFormQuestions/InforOfTrainer`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planing_id, session_no })   // explicit local vars
      }
    );
    const trainerData = await trainerRes.json();

    if (trainerData?.topics && Array.isArray(trainerData.topics)) {
      setSubmittedTrainers(
        trainerData.topics
          .filter(t => t.feedback_form_answer !== null && t.feedback_form_answer !== '')
          .map(t => ({
            trainer_id: t.trainer_id || t.planing_id,
            trainer_name: t.trainer_name || `Trainer #${t.planing_id}`
          }))
      );
      setPendingTrainers(
        trainerData.topics
          .filter(t => t.feedback_form_answer === null || t.feedback_form_answer === '')
          .map(t => ({
            trainer_id: t.trainer_id || t.planing_id,
            trainer_name: t.trainer_name || `Trainer #${t.planing_id}`
          }))
      );
    } else {
      setSubmittedTrainers([]);
      setPendingTrainers([]);
    }

  } catch (e) {
    console.error('Error fetching feedback data:', e);
    // On error, show zeros — never show stale data
    setSubmittedTrainees([]);
    setPendingTrainees([]);
    setSubmittedTrainers([]);
    setPendingTrainers([]);
  } finally {
    setLoading(false);
  }
}, [API_BASE_URL]);

  // ─── View feedback ─────────────────────────────────────────────────────────

  const handleViewFeedback = useCallback(async (trainee_id) => {
        setTraineeFeedback({ topics: [] }); // ← reset before fetch

    if (!selectedPlaningId || !selectedSessionId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/training-master/TraineeFeedbackFormQuestions/SubmitFeedbackFormDetailsToParticularTrainee`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planing_id: selectedPlaningId,   // ✅ use state set by HandleAwaitingFeedback
            session_no: selectedSessionId,    // ✅ not sessionsData
            trainee_id
          })
        }
      );
      const data = await res.json();
      if (data?.topics?.length > 0) {
        setTraineeFeedback(data);
        setOpenFeedbackDetailsDialog(true);
      }
    } catch (e) { console.error('Error fetching trainee feedback:', e); }
  }, [API_BASE_URL, selectedPlaningId, selectedSessionId]);  // ✅ correct deps


  const handleViewTrainerFeedback = useCallback(async (trainer_id) => {
        setTrainerFeedback(null); 

    if (!selectedPlaningId || !selectedSessionId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/training-master/FeedbackFormQuestions/InforOfTrainer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planing_id: selectedPlaningId,   // ✅ use state
            session_no: selectedSessionId,    // ✅ not sessionsData
            trainer_id
          })
        }
      );
      const data = await res.json();
      if (data?.topics?.length > 0) {
        setTrainerFeedback(data);
        setOpenTrainerFeedbackDetailsDialog(true);
      }
    } catch (e) { console.error('Error fetching trainer feedback:', e); }
  }, [API_BASE_URL, selectedPlaningId, selectedSessionId]);  // ✅ correct deps

  const handleSendReminder = useCallback(async (planingId, sessionNo, traineeId = null) => {
  if (!planingId || !sessionNo) return;
  try {
    const endpoint = traineeId
      ? 'sendFeedbackReminderToSingleTrainee'
      : 'sendFeedbackFormEmailTraineePendingParsonsOnly';

    const body = traineeId
      ? { planing_id: planingId, session_no: sessionNo, trainee_id: traineeId }
      : { planing_id: planingId, session_no: sessionNo };

    await fetch(`${API_BASE_URL}/planning-route/PlanningSessionActiveTrainees/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    showSnackbar(traineeId ? 'Reminder sent to trainee!' : 'Reminder sent to all pending trainees!');
  } catch (e) {
    console.error('Error sending reminder:', e);
  }
}, [API_BASE_URL, showSnackbar]);

const handleSendTrainerReminder = useCallback(async (planingId, sessionNo) => {
  if (!planingId || !sessionNo) return;
  try {
    await fetch(`${API_BASE_URL}/planning-route/PlanningSessionActiveTrainees/sendPendingRemainderFeedbackSubmissionEmailTrainer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planing_id: planingId, session_no: sessionNo })
    });
    showSnackbar('Trainer reminder sent successfully!');
  } catch (e) { console.error('Error sending trainer reminder:', e); }
}, [API_BASE_URL, showSnackbar]);
  // ─── Final submit ──────────────────────────────────────────────────────────

  const handleFinalSubmit = useCallback(() => setOpenConfirmDialog(true), []);

  // In handleConfirmSubmit — replace the current implementation
const handleConfirmSubmit = useCallback(async () => {
  setLoading(true);
  setOpenConfirmDialog(false);
  try {
    // 1. Close THIS session only
    const psRes = await fetch(
      `${API_BASE_URL}/planning-route/session/updateStatus`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planing_id: selectedPlaningId,
          session_no: selectedSessionId,
          PSstatus: 'Session Closed',
        }),
      }
    );
    if (!psRes.ok) {
      showSnackbar('❌ Failed to close session.', 'error');
      return;
    }

    // 2. Refresh sessions for this training
    const updatedSessions = await fetchSessionsForTraining(selectedPlaningId);
    setSessionsData(prev => ({ ...prev, [selectedPlaningId]: updatedSessions }));

    // 3. Only mark whole training as Final Submitted if ALL sessions are closed
    const allClosed = updatedSessions.every(
      s =>
        s.PSstatus === 'Session Closed' ||
        s.PSstatus === 'Final Submitted' ||
        s.PSstatus === 'Cancelled'
    );

    if (allClosed) {
      const statusRes = await fetch(
        `${API_BASE_URL}/planning-route/updateStatus`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedPlaningId,
            emp_id: loggedInUser.emp_id,
            user_name: loggedInUser.empname,
            user_email: loggedInUser.user_email,
            Status: 'Final Submitted',
          }),
        }
      );

      if (statusRes.ok) {
        // Update the training row in the table only when truly all done
        setTrainingData(prev =>
          prev.map(t =>
            String(t.id) === String(selectedPlaningId)
              ? { ...t, Status: 'Final Submitted' }
              : t
          )
        );
        showSnackbar('✅ All sessions closed — training marked as Final Submitted!');
      }
    } else {
      showSnackbar('✅ Session closed successfully!');
    }

    setOpenFeedbackDialog(false);
  } catch (e) {
    console.error('Error updating session status:', e);
    showSnackbar('⚠️ An error occurred while closing the session.', 'error');
  } finally {
    setLoading(false);
  }
}, [
  API_BASE_URL,
  selectedPlaningId,
  selectedSessionId,
  loggedInUser,
  fetchSessionsForTraining,
  showSnackbar,
]);

  // ─── Files ────────────────────────────────────────────────────────────────

  const handleFileSelection = useCallback((event) => setSelectedFiles(Array.from(event.target.files)), []);
  const handleRemoveSelectedFile = useCallback((index) => setSelectedFiles(prev => prev.filter((_, i) => i !== index)), []);
  const handleRemoveUploadedFile = useCallback((index) => setUploadedFiles(prev => prev.filter((_, i) => i !== index)), []);
  const handleFilesClose = useCallback(() => { setOpenFiles(false); setError(null); }, []);

  const handleUploadFiles = useCallback(async () => {
    if (!selectedFiles.length || !selectedPlaningId || !selectedSessionId) return;
    setIsUploading(true);
    setUploadProgress(0);
    const fd = new FormData();
    selectedFiles.forEach(f => fd.append('files', f));
    fd.append('requestData', JSON.stringify({ planing_id: selectedPlaningId, session_no: selectedSessionId, file_paths: '' }));
    try {
      const res = await axios.post(`${API_BASE_URL}/planning-route/PlanningSessionAsigningEmpMail/StorePlanningFiles`, fd, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress: (e) => { if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total)); } });
      if (res.status === 200 && res.data.message === 'Files uploaded successfully.') {
        setUploadedFiles(prev => [...prev, ...selectedFiles]);
        setSelectedFiles([]);
        showSnackbar('✅ Files uploaded successfully!');
      } else throw new Error('Unexpected response from server.');
    } catch (e) { showSnackbar(`Upload failed: ${e.response?.data?.error || e.message}`, 'error'); }
    finally { setIsUploading(false); setUploadProgress(0); }
  }, [selectedFiles, selectedPlaningId, selectedSessionId, API_BASE_URL, showSnackbar]);

  const HandleViewUploadedFiles = useCallback(async (planing_id, session_no) => {
    try {
      setLoading(true); setOpenFiles(true); setError(null);
      setCurrentPlanId(planing_id); setCurrentSessionNo(session_no);
      const res = await fetch(`${API_BASE_URL}/planning-route/PlanningSessionAsigningEmpMail/getAllPlanningFiles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planing_id: planing_id.toString(), session_no: session_no.toString() }) });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      const processed = (data.files || []).map(f => ({ name: f.name || 'unnamed_file', path: f.path || '', size: f.size || null, mimetype: f.mimetype || null, previewUrl: f.previewUrl || '', downloadUrl: f.downloadUrl || '' }));
      setFiles(processed);
      setCreatedDate(data.created_date ? new Date(data.created_date).toLocaleString() : null);
    } catch (e) { console.error('Error in HandleViewUploadedFiles:', e); setError(e.message || 'Failed to load files'); }
    finally { setLoading(false); }
  }, [API_BASE_URL]);

  const handleDownload = useCallback(async (fileName) => {
    if (!currentPlanId || !currentSessionNo) return;
    setDownloadingFile(fileName);
    try {
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}/planning-route/PlanningSessionAsigningEmpMail/downloadFile/${currentPlanId}/${currentSessionNo}/${encodeURIComponent(fileName)}`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) { console.error('Download failed:', e); }
    finally { setDownloadingFile(null); }
  }, [API_BASE_URL, currentPlanId, currentSessionNo]);

  // ─── Form handlers ─────────────────────────────────────────────────────────

  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.topic) errors.topic = 'Topic is required';
    if (!formData.trainerType) errors.trainerType = 'Trainer Type is required';
    if (!formData.date) errors.date = 'Date is required';
    if (!formData.branch.length) errors.branch = 'At least one branch is required';
    if (!formData.department.length) errors.department = 'At least one department is required';
    if (!formData.staffCategory) errors.staffCategory = 'At least one staff category is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => {
      if (field === 'branch' && Array.isArray(value) && value.some(o => o.branch_id === 'all')) return { ...prev, branch: [{ branch_id: 'all', branch_name: 'Pan India' }] };
      if (field === 'department' && Array.isArray(value) && value.some(o => o.department_id === 'all')) return { ...prev, department: [{ department_id: 'all', department_name: 'All Departments' }] };
      return { ...prev, [field]: value };
    });
  }, []);

  const filterTopicsByDepartment = useCallback((selectedDepts) => {
  if (!Array.isArray(selectedDepts)) return [];
  if (selectedDepts.some(d => d.department_id === 'all')) return trainingTopics;
  const names = selectedDepts.map(d => d.department_name.trim().toLowerCase());
  return trainingTopics.filter(t =>
    names.includes(t.department_name.trim().toLowerCase()) ||
    t.department_name.trim().toLowerCase() === 'all departments'  // ← always include
  );
}, [trainingTopics]);

  const handleDepartmentChange = useCallback((selectedDepts) => {
    const updated = Array.isArray(selectedDepts) ? selectedDepts : [];
    setFormData(prev => ({ ...prev, department: updated }));
    const updatedTopics = updated.some(d => d.department_id === 'all') ? trainingTopics : filterTopicsByDepartment(updated);
    setFilteredTopics(updatedTopics);
    const valid = updatedTopics.find(t => t.training_topic.trim().toLowerCase() === formData.topic.trim().toLowerCase());
    setFormData(prev => ({ ...prev, topic: valid ? valid.training_topic : '' }));
  }, [trainingTopics, filterTopicsByDepartment, formData.topic]);

  const handleAddModalClose = useCallback(() => {
    setIsPlanned('Planned');
    setFormData(INITIAL_FORM_DATA);
    setFormType('');
    setIsAddModalOpen(false);
    setFilteredTopics([]);
  }, []);

  const handleAddModalOpen = useCallback(() => setIsAddModalOpen(true), []);

  const handleModalSubmit = useCallback(async () => {
    if (!validateForm()) return;
    try {
      const ud = JSON.parse(sessionStorage.getItem('userDetails')) || {};
      if (!ud.emp_id) { handleOpenSnackbar(SNACKBAR_MESSAGES.UsernotFound, 'error'); return; }

      const branchIds = formData.branch.some(b => b.branch_id === 'all')
        ? branchMaster.filter(b => b.branch_id !== 'all').map(b => b.branch_id).join(',')
        : formData.branch.map(b => b.branch_id).join(',');

      const deptIds = formData.department.some(d => d.department_id === 'all')
        ? departmentMaster.filter(d => d.department_id !== 'all').map(d => d.department_id).join(',')
        : formData.department.map(d => d.department_id).join(',');

      const staffCategoryId = Array.isArray(formData.staffCategory) && formData.staffCategory.length > 0 ? formData.staffCategory.map(i => i.id).join(',') : '';
      const topicId = trainingTopics.find(t => t.training_topic === formData.topic)?.id;
      const trainerTypeId = trainingTypes.find(t => t.training_type === formData.trainerType)?.id || '';

      const payload = {
        ...(formData.id && { id: formData.id }),
        calDeleteStatus: formData.calDeleteStatus || '',
        emp_id: ud.emp_id, user_name: ud.empname || '', user_email: ud.user_email || '',
        branch_id: branchIds || '', department_id: deptIds || '',
        staff_category_id: staffCategoryId || '', training_topic_id: topicId || '',
        training_type_id: trainerTypeId || '', planning_type: isPlanned || '',
        planning_date: dayjs(formData.date).format('YYYY-MM-DD'),
        remarks: formData.remarks || '', status: 'Training Created',
      };

      const apiUrl = formData.id ? `${API_BASE_URL}/planning-route/update` : `${API_BASE_URL}/planning-route/insert`;
      const res = await axios.post(apiUrl, payload);

      if (res.status === 200 || res.status === 201) {
        const msg = formData.id ? SNACKBAR_MESSAGES.successUpdate : SNACKBAR_MESSAGES.successSubmit;
        showSnackbar(msg);
        fetchTrainingData();
        handleAddModalClose();
      } else throw new Error('Unexpected API response status');
    } catch (e) { console.error('Error during submission:', e); showSnackbar(e.response?.data?.message || SNACKBAR_MESSAGES.error, 'error'); }
  }, [validateForm, formData, branchMaster, departmentMaster, staffCategories, trainingTopics, trainingTypes, isPlanned, API_BASE_URL, showSnackbar, fetchTrainingData, handleAddModalClose, handleOpenSnackbar]);

  // ─── Mapped training data (admin) — must be declared before handleEditTraining ──

  const mappedTrainingData = useMemo(() => trainingData.map(record => {
    const branch = record.branch_id ? (record.branch_id.includes('all') ? 'Pan India' : formatMultiSelect(record.branch_id.split(','), branchMaster, 'branch_id')) : 'N/A';
    const department = record.department_id ? (record.department_id.includes('all') ? 'All Departments' : formatMultiSelect(record.department_id.split(','), departmentMaster, 'department_id')) : 'N/A';
    const staffCategory = record.staff_category_id ? formatMultiSelect(record.staff_category_id.split(','), staffCategories, 'id') : 'N/A';
    const topic = trainingTopics.find(t => String(t.id) === String(record.training_topic_id))?.training_topic || 'N/A';
    const trainerType = trainingTypes.find(t => String(t.id) === String(record.training_type_id))?.training_type || 'N/A';
    return { id: record.id, branch, department, staffCategory, topic, trainerType, date: record.planning_date ? dayjs(record.planning_date).format('YYYY-MM-DD') : 'N/A', status: getStatusForUI(record.Status), remarks: record.remarks || '', planningType: record.planning_type || 'N/A', cancelReason: record.cancelled_reason, user_name: record.user_name, emp_id: record.emp_id };
  }), [trainingData, branchMaster, departmentMaster, staffCategories, trainingTopics, trainingTypes]);

  // ─── Filter options ────────────────────────────────────────────────────────

  const filterOptions = useMemo(() => ({
    branches: [...new Set(mappedTrainingData.map(d => d.branch))],
    departments: [...new Set(mappedTrainingData.map(d => d.department))],
    statuses: [...new Set(mappedTrainingData.map(d => d.status))],
    planningTypes: [...new Set(mappedTrainingData.map(d => d.planningType))],
  }), [mappedTrainingData]);

  // ─── Training actions ─────────────────────────────────────────────────────

  const handleEditTraining = useCallback((trainingId) => {
    const t = mappedTrainingData.find(x => x.id === trainingId);
    if (!t) { showSnackbar('Unable to fetch training details. Please try again.', 'error'); return; }

    const branchArray = t.branch.includes('PAN INDIA') || t.branch.split(',').length === branchMaster.length - 1
      ? [{ branch_id: 'all', branch_name: 'PAN INDIA' }]
      : branchMaster.filter(b => t.branch.split(',').map(x => x.trim().toLowerCase()).includes(b.branch_name.trim().toLowerCase()));

    const deptArray = t.department.includes('All Departments') || t.department.split(',').length === departmentMaster.length - 1
      ? [{ department_id: 'all', department_name: 'All Departments' }]
      : departmentMaster.filter(d => t.department.split(',').map(x => x.trim().toLowerCase()).includes(d.department_name.trim().toLowerCase()));

    const staffArr = t.staffCategory ? staffCategories.filter(c => t.staffCategory.split(',').map(x => x.trim().toLowerCase()).includes(c.staff_category.trim().toLowerCase())) : [];

    const updatedTopics = filterTopicsByDepartment(deptArray);
    const selTopic = t.topic ? updatedTopics.find(tp => tp.training_topic.trim().toLowerCase() === t.topic.trim().toLowerCase()) || null : null;
    setFilteredTopics(updatedTopics);

    setFormData({ id: t.id, branch: branchArray, department: deptArray, staffCategory: staffArr, date: t.date ? dayjs(t.date).format('YYYY-MM-DD') : '', topic: selTopic ? selTopic.training_topic : '', trainerType: t.trainerType || '', planning_type: t.planningType || '', remarks: t.remarks === 'N/A' ? '' : t.remarks || '', status: 'Training Created' });
    setFormType('Edit Training');
    setIsPlanned(t.planningType || '');
    setIsAddModalOpen(true);
  }, [mappedTrainingData, branchMaster, departmentMaster, staffCategories, filterTopicsByDepartment, showSnackbar]);

  const handleCancelTrainingClick = useCallback((id) => { setSelectedTrainingId(id); setIsCancelModalOpen(true); }, []);

  const handleCancelConfirm = useCallback(async (reason) => {
    const id = selectedTrainingId;
    try {
      const training = trainingData.find(t => t.id === id);
      if (!training) { showSnackbar(SNACKBAR_MESSAGES.trainingNotFound, 'error'); return; }
      const ud = JSON.parse(sessionStorage.getItem('userDetails')) || {};
      if (!ud.emp_id) { showSnackbar(SNACKBAR_MESSAGES.UsernotFound, 'error'); return; }

      const res = await axios.post(`${API_BASE_URL}/planning-route/cancel`, { id: training.id, emp_id: ud.emp_id, user_name: ud.empname || 'Unknown User', user_email: ud.user_email || 'Unknown Email', cancelled_reason: reason });
      if (res.status === 200) {
        setTrainingData(prev => prev.map(t => t.id === id ? { ...t, status: 'Cancelled', calDeleteStatus: 0, cancelled_reason: reason } : t));
        showSnackbar('Training has been successfully cancelled.');
        fetchTrainingData();
      } else throw new Error('Failed to cancel the training.');
    } catch (e) { console.error('Error cancelling training:', e); showSnackbar('An error occurred while cancelling the training.', 'error'); }
    setIsCancelModalOpen(false);
  }, [selectedTrainingId, trainingData, API_BASE_URL, showSnackbar, fetchTrainingData]);

  const handleViewCancellationReason = useCallback((training) => {
    setCancellationReason(training.cancelReason?.trim() || 'No reason provided.');
    setOpenReasonDialog(true);
  }, []);

  const handleViewTraining = useCallback((training) => { setSelectedTraining(training); setTrainingPlanModalOpen(true); }, []);
  const handleCloseTrainingPlanModal = useCallback(() => { setTrainingPlanModalOpen(false); setSelectedTraining(null); }, []);
  const handleViewModalClose = useCallback(() => { setIsViewModalOpen(false); setSelectedTraining(null); }, []);

  const handleInfoClick = useCallback((id) => { setSelectedTrainningId(id); setMappingTraineesData([]); setOpenModal(true); }, []);

  const navigateToAgenda = useCallback((training) => navigate('/admindashboard/agenda', { state: { training, stepIndex: 3 } }), [navigate]);
  const handleEditClick = useCallback((training) => navigate('/admindashboard/agenda', { state: { training, mode: 'add' } }), [navigate]);

  const handleViewPDF = useCallback(() => { localStorage.setItem('returnToFeedbackDialog', 'true'); navigate('/admindashboard/lnd/TrainingFormsMaster'); }, [navigate]);
  const handleEditPDF = useCallback((id) => { localStorage.setItem('returnToFeedbackDialog', 'true'); navigate(`/admindashboard/lnd/TrainingFormsMaster?edit=${id}`); }, [navigate]);

  const handleSubmitQuery = useCallback(({ query }) => {
    setSubmittedQuery({ query });
    setIsModalOpen(false);
    setIsBannerVisible(true);
    showSnackbar('✅ Query Submitted Successfully!');
  }, [showSnackbar]);

  // ─── Menu / popover helpers ───────────────────────────────────────────────

  const handleClose = useCallback((id) => setAnchorEl(prev => ({ ...prev, [id]: null })), []);
  const handleIconClick = useCallback((event, id) => setAnchorEl(prev => ({ ...prev, [id]: event.currentTarget })), []);
    const handleActionMenuOpen = useCallback((event, session_no, training_id) => {
    const key = `${training_id}_${session_no}`;
    // Close all others first, then open only this one
    setActionMenuMap({ [key]: event.currentTarget });
  }, []);

  const handleActionMenuClose = useCallback((training_id, session_no) => {
    setActionMenuMap({});   // clear everything — only one menu open at a time
  }, []);
  const handlePostpone = useCallback((session) => { setSelectedSession(session); setOpenPostponeModal(true); }, []);
  const handleClosePostponeModal = useCallback(() => { setOpenPostponeModal(false); setSelectedSession(null); }, []);
  const handleCancel = useCallback((sessionNo) => { console.log(`Cancel clicked for session ${sessionNo}`); }, []);

  const handleExpandClickInfo = useCallback((sessionNo) => setExpandedRows(prev => ({ ...prev, [sessionNo]: !prev[sessionNo] })), []);

  const handlePageChange = useCallback((event, newPage, sessionNo) => setTraineePage(prev => ({ ...prev, [sessionNo]: newPage })), []);

  // ─── Pagination helpers ────────────────────────────────────────────────────

  const handleChangePage = useCallback((event, newPage) => setPage(newPage), []);
  const handleChangeRowsPerPage = useCallback((event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); }, []);

  // ─── Sort ──────────────────────────────────────────────────────────────────

  const handleSortRequest = useCallback((property) => {
    setOrderBy(property);
    setOrder(prev => (orderBy === property && prev === 'asc') ? 'desc' : 'asc');
  }, [orderBy]);

  // ─── Date helpers ─────────────────────────────────────────────────────────

  const handleFeedbackDateChange = useCallback((date) => { if (date) setFinalSubmitDate(date.hour(23).minute(59)); }, []);
  const handleTrainerDateChange = useCallback((date) => { if (date) setTrainerFinalSubmitDate(date.hour(23).minute(59)); }, []);
  const handleDateChange = useCallback((newValue) => setFinalSubmitDate(newValue), []);

  const handleStatusFilter = useCallback((status) => {
    if (status) { setStatusFilter([status]); setFilters(prev => ({ ...prev, status: [status] })); }
    else { setStatusFilter([]); setFilters(prev => ({ ...prev, status: undefined })); }
    setPage(0);
  }, []);

  const handleFilterChange = useCallback((e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })), []);
  const handleMultiSelectChange = useCallback((name, vals) => setmultiFilters(prev => ({ ...prev, [name]: vals })), []);

  // ─── Date range helper ─────────────────────────────────────────────────────

  const getDateRange = useCallback(() => {
    const today = dayjs();
    switch (dateFilter) {
      case 'thisWeek':  return [today.startOf('week'), today.endOf('week')];
      case 'thisMonth': return [today.startOf('month'), today.endOf('month')];
      case 'thisYear':  return [today.startOf('year'), today.endOf('year')];
      case 'custom':    return [customStartDate, customEndDate];
      default:          return [null, null];
    }
  }, [dateFilter, customStartDate, customEndDate]);

  const isWithinRange = useCallback((dateStr) => {
    const [start, end] = getDateRange();
    return start && end ? dayjs(dateStr || '').isBetween(start, end, 'day', '[]') : true;
  }, [getDateRange]);

  const matchesSearch = useCallback((training) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (training.topic || '').toLowerCase().includes(q) || (training.branch || '').toLowerCase().includes(q) || (training.department || '').toLowerCase().includes(q) || (training.trainerType || '').toLowerCase().includes(q) || generateRefNo(training.id).toLowerCase().includes(q);
  }, [searchQuery]);

  const matchesBranchFilter = useCallback((training) => {
    if (!multifilters.branch.length) return true;
    return multifilters.branch.some(b => {
      const brs = training.branch?.split(',').map(x => x.trim()) || [];
      return b.branch_id === 'all' ? brs.length === branchMaster.length - 1 : brs.includes(b.branch_name);
    });
  }, [multifilters.branch, branchMaster]);

  const matchesDeptFilter = useCallback((training) => {
    if (!multifilters.department.length) return true;
    return multifilters.department.some(d => {
      const depts = training.department?.split(',').map(x => x.trim()) || [];
      return d.department_id === 'all' ? depts.length === departmentMaster.length - 1 : depts.includes(d.department_name);
    });
  }, [multifilters.department, departmentMaster]);

  const matchesStatusFilter = useCallback((training) => {
    if (!filters.status) return training.status?.toLowerCase() !== 'cancelled';
    return [filters.status].flat().some(s => {
      const ts = training.status === 'N/A' ? 'Feedback Assigned' : training.status;
      return ts?.toLowerCase() === s.toLowerCase();
    });
  }, [filters.status]);

  // ─── Filtered data ─────────────────────────────────────────────────────────

  const filteredData = useMemo(() => mappedTrainingData.filter(t =>
    isWithinRange(t.date) && matchesSearch(t) && matchesBranchFilter(t) && matchesDeptFilter(t) && matchesStatusFilter(t) && (filters.planningType ? t.planningType === filters.planningType : true)
  ), [mappedTrainingData, isWithinRange, matchesSearch, matchesBranchFilter, matchesDeptFilter, matchesStatusFilter, filters.planningType]);

  const filteredUserTrainingData = useMemo(() => userTrainingData.filter(t =>
    isWithinRange(t.date) && matchesSearch(t) && matchesBranchFilter(t) && matchesDeptFilter(t) && matchesStatusFilter(t) && (filters.planningType ? t.planningType === filters.planningType : true)
  ), [userTrainingData, isWithinRange, matchesSearch, matchesBranchFilter, matchesDeptFilter, matchesStatusFilter, filters.planningType]);

  const filteredByDate = useMemo(() => mappedTrainingData.filter(t => isWithinRange(t.date)), [mappedTrainingData, isWithinRange]);
  const filteredByDateUser = useMemo(() => userTrainingData.filter(t => isWithinRange(t.date)), [userTrainingData, isWithinRange]);

  // ─── Counts ───────────────────────────────────────────────────────────────

  const totalCreated = filteredByDate.length;
  const totalScheduled = useMemo(() => filteredByDate.filter(t => t.status === 'Training Scheduled').length, [filteredByDate]);
  const totalPending = useMemo(() => filteredByDate.filter(t => t.status === 'Training Created').length, [filteredByDate]);
  const totalCancelled = useMemo(() => filteredByDate.filter(t => t.status === 'Cancelled').length, [filteredByDate]);
  const totalConducted = useMemo(() => filteredByDate.filter(t => t.status === 'Training Conducted').length, [filteredByDate]);
  const totalReceived = useMemo(() => filteredUserTrainingData.filter(t => t.status === 'Feedback Assigned' || t.status === 'N/A').length, [filteredUserTrainingData]);
  const totalFinished = useMemo(() => filteredByDate.filter(t => t.status === 'Final Submitted').length, [filteredByDate]);
  const totalCreatedUser = filteredByDateUser.length;
  const totalScheduledUser = useMemo(() => filteredByDateUser.filter(t => t.status === 'Training Scheduled').length, [filteredByDateUser]);
  const totalReceivedUser = useMemo(() => filteredByDateUser.filter(t => t.status === 'Feedback Assigned' || t.status === 'N/A').length, [filteredByDateUser]);
  const totalFinishedUser = useMemo(() => filteredByDateUser.filter(t => t.status === 'Final Submitted').length, [filteredByDateUser]);

  // ─── Sorted & paginated data ───────────────────────────────────────────────

  const sortFn = useCallback((a, b) => {
    let aVal = orderBy === 'date' ? dayjs(a.date).valueOf() : a[orderBy];
    let bVal = orderBy === 'date' ? dayjs(b.date).valueOf() : b[orderBy];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  }, [order, orderBy]);

  const displayedData = useMemo(() => {
    if (loading) return [];
    return [...filteredData].sort(sortFn).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredData, sortFn, page, rowsPerPage, loading]);

  const displayedUserData = useMemo(() => {
    if (loading) return [];
    return [...filteredUserTrainingData].sort(sortFn).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredUserTrainingData, sortFn, page, rowsPerPage, loading]);

  // ─── Paginated feedback lists ──────────────────────────────────────────────

  const submittedUsersToShow = useMemo(() => submittedTrainees.slice((submittedPage - 1) * ITEMS_PER_PAGE, submittedPage * ITEMS_PER_PAGE), [submittedTrainees, submittedPage]);
  const pendingUsersToShow = useMemo(() => pendingTrainees.slice((pendingPage - 1) * ITEMS_PER_PAGE, pendingPage * ITEMS_PER_PAGE), [pendingTrainees, pendingPage]);
  const submittedTrainersToShow = useMemo(() => submittedTrainers.slice((submittedTrainerPage - 1) * ITEMS_PER_PAGE, submittedTrainerPage * ITEMS_PER_PAGE), [submittedTrainers, submittedTrainerPage]);
  const pendingTrainersToShow = useMemo(() => pendingTrainers.slice((pendingTrainerPage - 1) * ITEMS_PER_PAGE, pendingTrainerPage * ITEMS_PER_PAGE), [pendingTrainers, pendingTrainerPage]);

  // ─── Training action helpers ───────────────────────────────────────────────

  const isTrainingActionDisabled = useCallback((training, userId) => {
    const status = training.status?.trim().toLowerCase();
    return training.emp_id !== userId || ['cancelled', 'training conducted', 'training scheduled', 'feedback assigned', 'final submitted'].includes(status);
  }, []);

  // ─── Milestone renders (shared logic) ─────────────────────────────────────

  const renderMilestones = useCallback((training) => {
    const milestoneProgress = getMilestoneProgress(training);
    return MILESTONES.map((milestone, idx) => {
      if (training.status === 'Cancelled') return (
        <Tooltip key={idx} title="Training Cancelled"><IconButton size="small" disabled><HighlightOffIcon style={{ color: 'lightcoral' }} /></IconButton></Tooltip>
      );
      const isCompleted = idx + 1 <= milestoneProgress && milestoneProgress !== -1;
      return (
        <Tooltip key={idx} title={milestone} componentsProps={{ tooltip: { sx: { backgroundColor: '#1A005D', color: 'white' } } }}>
          <IconButton size="small" style={{ padding: '0px' }}>
            {isCompleted ? <CircleIcon style={{ color: 'green' }} /> : <RadioButtonUncheckedIcon style={{ color: 'orange' }} />}
          </IconButton>
        </Tooltip>
      );
    });
  }, []);

  const renderSessionMilestones = useCallback((session) => {
    return SESSION_MILESTONES.map((milestone, idx) => {
      if (session.status === 'Cancelled') return (
        <Tooltip key={idx} title="Session Cancelled"><IconButton size="small" disabled><HighlightOffIcon style={{ color: 'lightcoral' }} /></IconButton></Tooltip>
      );
      const isCompleted = SESSION_MILESTONE_MAPPING[session.PSstatus] >= SESSION_MILESTONE_MAPPING[milestone];
      return (
        <Tooltip key={idx} title={milestone} componentsProps={{ tooltip: { sx: { backgroundColor: '#1A005D', color: 'white' } } }}>
          <IconButton size="small" style={{ padding: '0px' }}>
            {isCompleted ? <CircleIcon style={{ color: 'green' }} /> : <RadioButtonUncheckedIcon style={{ color: 'orange' }} />}
          </IconButton>
        </Tooltip>
      );
    });
  }, []);

  // ─── Session action menu items ─────────────────────────────────────────────

  const renderSessionActionItems = useCallback((session, training, matchingSession = null) => {
    const sessionDate = new Date(session.session_date);
    const [fh, fm, fs] = session.from_time.split(':').map(Number);
    sessionDate.setHours(fh, fm, fs, 0);
    const now = new Date();
    const sessionStarted = now >= sessionDate;
    const sessionReadyForAttendance = sessionStarted && (session.PSstatus === 'Trainee Mapped' || session.PSstatus === 'postpone');
    const noActionNeeded = sessionStarted && !['Trainee Mapped', 'postpone', 'Attendance Added', 'Training Effectiveness', 'Feedback Assigned'].includes(session.PSstatus);
    const roleType = matchingSession?.role_type?.toLowerCase();
  if (
    session.PSstatus === 'Session Closed' ||
    training.status === 'Final Submitted'  ||
    session.PSstatus === 'Final Submitted'
  ) {
    return (
      <MenuItem disabled>
        <CancelIcon sx={{ mr: 1, color: '#aaa' }} />
        <Typography color="textSecondary" fontSize="13px">Session Closed</Typography>
      </MenuItem>
    );
  }
    // Pre-session
    if ((session.PSstatus === 'Trainee Mapped' || session.PSstatus === 'postpone' || session.PSstatus === 'Training Scheduled') && !sessionStarted) {
      if (matchingSession && roleType === 'no role') return (
        <MenuItem disabled><Typography color="error" style={{ display: 'flex', alignItems: 'center' }}><BiBlock style={{ marginRight: 8 }} />No Action Permitted</Typography></MenuItem>
      );
      return (<MenuItem onClick={() => {
        setActionMenuMap({});                    // ← ADD THIS
        navigateToAgenda(training);
      }}><MapIcon color="primary" />Map/Edit Trainees</MenuItem>);
    }

    if (sessionStarted) {
      if (sessionReadyForAttendance) return (
        <MenuItem
          onClick={async () => {
            setActionMenuMap({});
            setSelectedSession(session);
            await fetchOtherTrainees();
            try {
              const res = await fetch(`${API_BASE_URL}/planning-route/PlanningSessionAsigningEmpMail/list`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planing_id: session.planing_id, session_no: session.session_no }),
              });
              const data = await res.json();
              const records = data.records || [];
        
              // ── Capture coordinator context from mapping records ──────────────
              if (records.length > 0) {
                const firstRecord = records[0];
                const ctx = {
                  coordinator_emp_id: firstRecord.coordinator_emp_id ?? null,
                  coordinator_name:   firstRecord.coordinator_name   ?? null,
                  coordinator_type:   firstRecord.coordinator_type   ?? null,
                };
                setSessionCoordinatorContext(ctx);
                coordinatorContextRef.current = ctx;   // ← add this line
              } else {
                setSessionCoordinatorContext(null);
                coordinatorContextRef.current = null;  // ← add this line
              }
        
              setOptions([
                { label: 'ALL', id: 'ALL' },
                { label: 'Other', id: 'Other' },
                ...records.map(r => ({
                  id:    String(r.trainee_id),
                  label: r.trainee_name,
                  email: r.trainee_mail,
                })),
              ]);
            } catch(e) {
              console.error(e);
            }
            setUploadDialogOpen(true);
          }}
        >
          <CheckCircleIcon color="warning" />Mark Attendance
        </MenuItem>
      );
      if (noActionNeeded) return (<MenuItem disabled><Typography color="error">No Action Taken</Typography></MenuItem>);
    }

    if (session.PSstatus === 'Attendance Added') return (<MenuItem onClick={() => {
      setActionMenuMap({});                      // ← ADD THIS
      openEffectivenessDialog(session.planing_id, session.session_no);
    }}><NextPlanIcon color="primary" />Training Effectiveness</MenuItem>);
    if (session.PSstatus === 'Training Effectiveness') return (<MenuItem onClick={() => {
      setActionMenuMap({});                      // ← ADD THIS
      handleOpenFeedbackDialog(session.planing_id, session.session_no);
    }}><NextPlanIcon color="primary" />Assign Feedback Form</MenuItem>);
    if (session.PSstatus === 'Feedback Assigned') return (
        <MenuItem onClick={() => {
      setActionMenuMap({});                      // ← ADD THIS
      HandleAwaitingFeedback(session.planing_id, session.session_no);
    }}>
          <NextPlanIcon color="primary" />Awaiting Feedback
        </MenuItem>
      );
    if (training.status === 'Final Submitted') return (<MenuItem disabled><CancelIcon color="primary" />Session closed</MenuItem>);
    return null;
  }, [navigateToAgenda, handleOpenAttendanceDialog, openEffectivenessDialog, handleOpenFeedbackDialog, HandleAwaitingFeedback]);

  // ─── Filters component ────────────────────────────────────────────────────

  const Filters = useCallback(({ isAdmin }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      {/* Branch Filter */}
      <Autocomplete multiple size="small" sx={{ minWidth: '180px', flexGrow: 1 }}
        options={[{ branch_id: 'all', branch_name: 'PAN INDIA' }, ...branchMaster.filter(b => b.branch_id !== 'all')]}
        value={Array.isArray(multifilters.branch) && multifilters.branch.length === branchMaster.length - 1 ? [{ branch_id: 'all', branch_name: 'PAN INDIA' }] : multifilters.branch || []}
        onChange={(e, newVals) => {
          if (newVals.some(b => b.branch_id === 'all')) handleMultiSelectChange('branch', [{ branch_id: 'all', branch_name: 'PAN INDIA' }]);
          else { const filtered = newVals.filter(b => b.branch_id !== 'all'); handleMultiSelectChange('branch', filtered.length === branchMaster.length - 1 ? [{ branch_id: 'all', branch_name: 'PAN INDIA' }] : filtered); }
        }}
        disableCloseOnSelect getOptionLabel={o => o?.branch_name || ''}
        renderOption={(props, option, { selected }) => (<li {...props}><Checkbox checked={selected} />{option.branch_name}</li>)}
        renderInput={params => (
          <TextField {...params} label="Branch" InputLabelProps={{ shrink: Boolean(multifilters.branch.length) }}
            InputProps={{ ...params.InputProps, startAdornment: (<Typography variant="body2" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px', fontSize: '12px' }}>{Array.isArray(multifilters.branch) && multifilters.branch.length > 0 ? (multifilters.branch.some(b => b.branch_id === 'all') ? 'PAN INDIA' : multifilters.branch.length === 1 ? multifilters.branch[0]?.branch_name : `${multifilters.branch[0]?.branch_name} (+${multifilters.branch.length - 1} More)`) : ''}</Typography>) }}
          />
        )}
      />
      {/* Department Filter */}
      <Autocomplete multiple size="small" sx={{ minWidth: '180px', flexGrow: 1 }}
        options={[{ department_id: 'all', department_name: 'All Departments' }, ...departmentMaster.filter(d => d.department_id !== 'all')]}
        value={Array.isArray(multifilters.department) && multifilters.department.length === departmentMaster.length - 1 ? [{ department_id: 'all', department_name: 'All Departments' }] : multifilters.department || []}
        onChange={(e, newVals) => {
          if (newVals.some(d => d.department_id === 'all')) handleMultiSelectChange('department', [{ department_id: 'all', department_name: 'All Departments' }]);
          else { const filtered = newVals.filter(d => d.department_id !== 'all'); handleMultiSelectChange('department', filtered.length === departmentMaster.length - 1 ? [{ department_id: 'all', department_name: 'All Departments' }] : filtered); }
        }}
        disableCloseOnSelect getOptionLabel={o => o.department_name || ''}
        renderOption={(props, option, { selected }) => (<li {...props}><Checkbox checked={selected} />{option.department_name}</li>)}
        renderInput={params => (
          <TextField {...params} label="Department" InputLabelProps={{ shrink: Boolean(multifilters.department.length) }}
            InputProps={{ ...params.InputProps, startAdornment: (<Typography variant="body2" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px', fontSize: '12px' }}>{Array.isArray(multifilters.department) && multifilters.department.length > 0 ? (multifilters.department.some(d => d.department_id === 'all') ? 'All Departments' : multifilters.department.length === 1 ? multifilters.department[0]?.department_name : `${multifilters.department[0]?.department_name} (+${multifilters.department.length - 1} More)`) : ''}</Typography>) }}
          />
        )}
      />
      {/* Status Filter */}
      <Autocomplete size="small" sx={{ minWidth: '180px', flexGrow: 1 }}
        options={[...new Set(filterOptions.statuses.includes('N/A') ? filterOptions.statuses.map(s => s === 'N/A' ? 'Feedback Assigned' : s) : filterOptions.statuses)].sort((a, b) => a.localeCompare(b))}
        value={Array.isArray(filters.status) ? (filters.status[0] === 'N/A' ? 'Feedback Assigned' : filters.status[0]) : (filters.status === 'N/A' ? 'Feedback Assigned' : filters.status)}
        onChange={(e, v) => { const val = v === 'Feedback Assigned' ? 'N/A' : v; setFilters(prev => ({ ...prev, status: val })); setStatusFilter(val ? [val] : []); setPage(0); }}
        renderInput={params => <TextField {...params} label="Status" />}
      />
      {isAdmin && topTab === 1 && (
        <Tooltip title="Add New Training" placement="top" componentsProps={{ tooltip: { sx: { backgroundColor: '#1A005D', color: 'white' } } }} arrow>
          <IconButton onClick={handleAddModalOpen} style={{ background: '#1A005D', color: 'white' }}><AddIcon style={{ color: 'white' }} /></IconButton>
        </Tooltip>
      )}
    </div>
  ), [branchMaster, departmentMaster, multifilters, filterOptions, filters, topTab, isAdmin, handleMultiSelectChange, handleAddModalOpen]);

  const FiltersUser = () => <div />;

  // ─── Shared table header for sort ─────────────────────────────────────────

  const SortableCell = ({ field, label }) => (
    <TableCell>
      <TableSortLabel active={orderBy === field} direction={orderBy === field ? order : 'asc'} onClick={() => handleSortRequest(field)}>
        {label}
      </TableSortLabel>
    </TableCell>
  );

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className="admin-dashboard-content">
      <div className="main-content">

        {/* ── Top Tabs ── */}
        <Tabs value={topTab} onChange={(e, v) => { setTopTab(v); setExpanded({}); }}
          sx={{ '& .MuiTabs-indicator': { backgroundColor: '#1A005D' }, '& .MuiTab-root': { color: '#8EC400' }, '& .Mui-selected': { color: '#1A005D !important' } }}>
          <Tab label="User View" />
          {(hasAccess('Training Summary', 'Training Admin View', 'View') || hasAccess('Training Summary', 'Training Admin View', 'View/Create/Edit')) && <Tab label="Admin View" />}
        </Tabs>

        {/* ── Search & Date Filters ── */}
        <div style={{ display: 'flex', alignItems: 'right', justifyContent: 'flex-end', gap: '16px' }}>
          <SearchFilter searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <DateFilter dateFilter={dateFilter} setDateFilter={setDateFilter} customStartDate={customStartDate} setCustomStartDate={setCustomStartDate} customEndDate={customEndDate} setCustomEndDate={setCustomEndDate} />
        </div>

        {/* ── Admin View: Add Training Dialog ── */}
        {topTab === 1 && (
          <>
            <Dialog open={isAddModalOpen} onClose={handleAddModalClose} fullWidth maxWidth="md"
              PaperProps={{ style: { maxHeight: '90vh', width: '100%', margin: 'auto', top: '3vh', padding: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.1)' } }}>
              <DialogTitle style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1A005D', textAlign: 'center' }}>{formType || 'Add Training'}</DialogTitle>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl component="fieldset" fullWidth>
                      <RadioGroup row value={isPlanned} onChange={e => setIsPlanned(e.target.value)}>
                        <FormControlLabel value="Planned" control={<Radio />} label="Planned" />
                        <FormControlLabel value="Unplanned" control={<Radio />} label="Unplanned" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                  {/* Branch */}
                  <Grid item xs={12} sm={6}>
                    <Autocomplete multiple options={filteredBranchOptions} getOptionLabel={o => o.branch_name || ''} value={Array.isArray(formData.branch) ? formData.branch : []}
                      onChange={(e, v) => { const isPan = v.some(o => o.branch_id === 'all'); if (isPan) handleFieldChange('branch', [{ branch_id: 'all', branch_name: 'PAN INDIA' }]); else { const f = v.filter(o => o.branch_id !== 'all'); handleFieldChange('branch', f.length === filteredBranchOptions.length - 1 ? [{ branch_id: 'all', branch_name: 'PAN INDIA' }] : f); } }}
                      renderOption={(props, o, { selected }) => (<li {...props} key={`branch-${o.branch_id}`} style={{ backgroundColor: selected ? '#d3d3d3' : 'white', fontWeight: selected ? 'bold' : 'normal' }}>{o.branch_name}</li>)}
                      renderInput={params => (<TextField {...params} label="For Which Branch" required fullWidth size="medium" className="custom-textfield" error={!!formErrors.branch} helperText={formErrors.branch || ''} InputProps={{ ...params.InputProps, startAdornment: formData.branch.length > 2 ? `${formData.branch.slice(0, 1).map(b => b.branch_name).join(', ')} (+${formData.branch.length - 1} more)` : params.InputProps.startAdornment }} InputLabelProps={{ shrink: formData.branch.length > 0 || undefined, sx: { color: '#82b100', '&.MuiInputLabel-root.Mui-focused': { color: '#82b100' } } }} />)} />
                  </Grid>
                  {/* Department */}
                  <Grid item xs={12} sm={6}>
                    <Autocomplete multiple options={[{ department_id: 'all', department_name: 'All Departments' }, ...departmentMaster.filter(d => d.department_id !== 'all')]} getOptionLabel={o => o.department_name || ''} value={Array.isArray(formData.department) ? formData.department : []}
                      onChange={(e, v) => { if (v.some(o => o.department_id === 'all')) { handleFieldChange('department', [{ department_id: 'all', department_name: 'All Departments' }]); handleDepartmentChange([{ department_id: 'all', department_name: 'All Departments' }]); } else { handleFieldChange('department', v); handleDepartmentChange(v); } }}
                      renderOption={(props, o, { selected }) => (<li {...props} key={`dept-${o.department_id}`} style={{ backgroundColor: selected ? '#d3d3d3' : 'white', fontWeight: selected ? 'bold' : 'normal' }}>{o.department_name}</li>)}
                      renderInput={params => (<TextField {...params} label="For Which Department" required fullWidth className="custom-textfield" error={!!formErrors.department} helperText={formErrors.department || ''} InputProps={{ ...params.InputProps, startAdornment: formData.department.length > 2 ? `${formData.department.slice(0, 1).map(b => b.department_name).join(', ')} (+${formData.department.length - 1} more)` : params.InputProps.startAdornment }} InputLabelProps={{ shrink: formData.department.length > 0 || undefined, sx: { color: '#82b100', '&.MuiInputLabel-root.Mui-focused': { color: '#82b100' } } }} />)} />
                  </Grid>
                  {/* Staff Category */}
                  <Grid item xs={12} sm={6}>
                    <Autocomplete multiple options={staffCategories || ''} getOptionLabel={o => o.staff_category || ''} onChange={(e, v) => handleFieldChange('staffCategory', v)} value={Array.isArray(formData.staffCategory) ? formData.staffCategory : []}
                      renderOption={(props, o, { selected }) => (<li {...props} style={{ backgroundColor: selected ? '#d3d3d3' : 'white', fontWeight: selected ? 'bold' : 'normal' }}>{o.staff_category}</li>)}
                      renderInput={params => (<TextField {...params} label="Staff Category" className="custom-textfield" error={!!formErrors.staffCategory} helperText={formErrors.staffCategory || ''} InputLabelProps={{ className: Array.isArray(formData.staffCategory) && formData.staffCategory.length > 0 ? 'MuiFormLabel-filled' : '' }} size="medium" required />)} />
                  </Grid>
                  {/* Topic */}
                  <Grid item xs={12} sm={6}>
                    <Autocomplete options={filteredTopics.filter(o => o.training_topic.toLowerCase().includes(formData.topic.toLowerCase()))} getOptionLabel={o => o.training_topic || ''} value={filteredTopics.find(t => t.training_topic.toLowerCase() === formData.topic.toLowerCase()) || null} inputValue={formData.topic || ''}
                      onChange={(e, v) => handleFieldChange('topic', v?.training_topic ?? '')} onInputChange={(e, v) => handleFieldChange('topic', v)}
                      onBlur={() => { if (!filteredTopics.some(t => t.training_topic.toLowerCase() === formData.topic.toLowerCase())) handleFieldChange('topic', ''); }}
                      isOptionEqualToValue={(o, v) => o.training_topic.toLowerCase() === (v?.training_topic || v).toLowerCase()} clearOnEscape autoHighlight selectOnFocus freeSolo
                      renderOption={(props, o, { selected }) => (<li {...props} style={{ backgroundColor: selected ? '#d3d3d3' : 'white', fontWeight: selected ? 'bold' : 'normal' }}>{o.training_topic}</li>)}
                      filterOptions={(opts, { inputValue }) => !inputValue?.trim() ? opts : opts.filter(o => o.training_topic.toLowerCase().includes(inputValue.toLowerCase().trim()))}
                      renderInput={params => (<TextField {...params} label="Topic" required fullWidth className="custom-textfield topic-field" error={!!formErrors.topic} helperText={formErrors.topic || ''} InputLabelProps={{ shrink: Boolean(formData.topic), sx: { color: formData.topic ? '#1A005D !important' : 'inherit !important', '&.Mui-focused': { color: '#8EC400 !important' }, '&.MuiFormLabel-filled': { color: '#1A005D !important' } } }} />)} />
                  </Grid>
                  {/* Trainer Type */}
                  <Grid item xs={12} sm={6}>
                    <TextField label="Trainer Type" required select value={formData.trainerType || ''} onChange={e => handleFieldChange('trainerType', e.target.value)} fullWidth className="custom-textfield" error={!!formErrors.trainerType} helperText={formErrors.trainerType || ''}>
                      {trainingTypes.map(t => (<MenuItem key={t.id} value={t.training_type} style={{ backgroundColor: formData.trainerType === t.training_type ? '#d3d3d3' : 'white', fontWeight: formData.trainerType === t.training_type ? 'bold' : 'normal' }}>{t.training_type}</MenuItem>))}
                    </TextField>
                  </Grid>
                  {/* Date */}
                  <Grid item xs={12} sm={6}>
                    <TextField required label="Date" value={formData.date} onChange={e => handleFieldChange('date', e.target.value)} fullWidth type="date" className="custom-textfield" error={!!formErrors.date} helperText={formErrors.date || ''} InputLabelProps={{ shrink: true }} inputProps={{ min: `${new Date().getFullYear()}-01-01` }} />
                  </Grid>
                  {/* Remarks */}
                  <Grid item xs={12}>
                    <TextField label="Remarks" value={formData.remarks || ''} onChange={e => handleFieldChange('remarks', e.target.value)} fullWidth className="custom-textfield" />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ justifyContent: 'center', padding: '12px' }}>
                <Button onClick={handleAddModalClose} sx={{ backgroundColor: 'orange', color: 'black', fontSize: '0.8rem', padding: '8px 14px', textTransform: 'none', borderRadius: 2, '&:hover': { backgroundColor: '#FFBF00' } }}>Cancel</Button>
                <Button onClick={handleModalSubmit} variant="contained" sx={{ backgroundColor: '#1A005D', color: 'white', fontSize: '0.8rem', padding: '8px 14px', textTransform: 'none', borderRadius: 2, '&:hover': { backgroundColor: '#1A005F' } }}>Submit</Button>
              </DialogActions>
            </Dialog>

            {/* ── Count Cards ── */}
            {(hasAccess('Training Summary', 'Training Admin View', 'View') || hasAccess('Training Summary', 'Training Admin View', 'View/Create/Edit')) ? (
              topTab === 1 ? (
                <div className="count-container">
                  <div className="count-card total" onClick={() => handleStatusFilter('')}><i className="fas fa-tasks" /> Total: {totalCreated}</div>
                  <div className="count-card pending" onClick={() => handleStatusFilter('Training Created')}><i className="fas fa-hourglass-half" /> Created: {totalPending}</div>
                  <div className="count-card completed" onClick={() => handleStatusFilter('Training Scheduled')}><i className="fas fa-check-circle" /> Scheduled: {totalScheduled}</div>
                  <div className="count-card training-completed" onClick={() => handleStatusFilter('Training Conducted')}><i className="fas fa-comment-dots" /> Conducted: {totalConducted}</div>
                  <div className="count-card feedback-received" onClick={() => handleStatusFilter('Feedback Assigned')}><i className="fas fa-comment-dots" /> Feedback: {totalReceived}</div>
                  <div className="count-card feedback-submitted" onClick={() => handleStatusFilter('Final Submitted')}><i className="fas fa-check-circle" /> Submitted: {totalFinished}</div>
                  <div className="count-card cancelled" onClick={() => handleStatusFilter('Cancelled')}><i className="fas fa-times-circle" /> Cancelled: {totalCancelled}</div>
                </div>
              ) : (
                <div className="count-container-user">
                  <div className="count-card total" onClick={() => handleStatusFilter('')}><i className="fas fa-tasks" /> Total: {totalCreatedUser}</div>
                  <div className="count-card pending" onClick={() => handleStatusFilter('Training Scheduled')}><i className="fas fa-hourglass-half" /> Assigned: {totalScheduledUser}</div>
                  <div className="count-card training-completed" onClick={() => handleStatusFilter('Feedback Assigned')}><i className="fas fa-comment-dots" /> Feedback Assigned: {totalReceivedUser}</div>
                  <div className="count-card feedback-submitted" onClick={() => handleStatusFilter('Final Submitted')}><i className="fas fa-check-circle" /> Submitted: {totalFinishedUser}</div>
                </div>
              )
            ) : (
              <div className="count-container-user">
                <div className="count-card total" onClick={() => handleStatusFilter('')}><i className="fas fa-tasks" /> Total: {totalCreatedUser}</div>
                <div className="count-card pending" onClick={() => handleStatusFilter('Training Scheduled')}><i className="fas fa-hourglass-half" /> Assigned: {totalScheduledUser}</div>
                <div className="count-card training-completed" onClick={() => handleStatusFilter('Feedback Assigned')}><i className="fas fa-comment-dots" /> Feedback Assigned: {totalReceivedUser}</div>
                <div className="count-card feedback-submitted" onClick={() => handleStatusFilter('Final Submitted')}><i className="fas fa-check-circle" /> Submitted: {totalFinishedUser}</div>
              </div>
            )}
          </>
        )}

        {/* ── User View Count Cards (topTab === 0) ── */}
        {topTab === 0 && (
          <div className="count-container-user">
            <div className="count-card total" onClick={() => handleStatusFilter('')}><i className="fas fa-tasks" /> Total: {totalCreatedUser}</div>
            <div className="count-card pending" onClick={() => handleStatusFilter('Training Scheduled')}><i className="fas fa-hourglass-half" /> Assigned: {totalScheduledUser}</div>
            <div className="count-card training-completed" onClick={() => handleStatusFilter('Feedback Assigned')}><i className="fas fa-comment-dots" /> Feedback Assigned: {totalReceivedUser}</div>
            <div className="count-card feedback-submitted" onClick={() => handleStatusFilter('Final Submitted')}><i className="fas fa-check-circle" /> Submitted: {totalFinishedUser}</div>
          </div>
        )}

        {/* ── Nested Tab + Filters row ── */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ flexShrink: 0 }}>
            <Tabs value={nestedTab} onChange={(e, v) => { setNestedTab(v); setExpanded({}); }}
              sx={{ '& .MuiTabs-indicator': { backgroundColor: '#1A005D' }, '& .MuiTab-root': { color: '#8EC400' }, '& .Mui-selected': { color: '#1A005D !important' } }}>
              <Tab label="Training List" />
            </Tabs>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end', flexGrow: 1 }}>
            {topTab === 1 ? <Filters isAdmin={isAdmin} /> : <FiltersUser />}
          </div>
        </div>

        {/* ── Admin Table ── */}
        {topTab === 1 && nestedTab === 0 && (
          <TableContainer component={Paper}>
            <div style={{ overflowX: 'auto' }}>
              <Table aria-label="training table">
                <TableHead>
                  <TableRow className="table-row">
                    <TableCell align="left"><b>SL NO.</b></TableCell>
                    <SortableCell field="id" label="Ref No" />
                    <SortableCell field="date" label="Planned Date" />
                    <SortableCell field="branch" label="Branch" />
                    <SortableCell field="department" label="Department" />
                    <SortableCell field="topic" label="Topic" />
                    <SortableCell field="trainerType" label="Trainer" />
                    <TableCell align="left"><b>Status</b></TableCell>
                    {topTab === 1 && (hasAccess('Training Summary', 'Training Admin View', 'View') || hasAccess('Training Summary', 'Training Admin View', 'View/Create/Edit')) && <TableCell align="center"><b>Actions</b></TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody sx={{ '& .table-rowcontent': { textTransform: 'uppercase' } }}>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                  ) : displayedData.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center">No Trainings Available</TableCell></TableRow>
                  ) : displayedData.map((training, index) => (
                    <React.Fragment key={training.id}>
                      <TableRow className="table-rowcontent">
                        <TableCell align="center">
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {index + 1}
                            {training.status !== 'Training Created' && (
                              <IconButton onClick={() => handleExpandClick(training.id)} size="small" style={{ marginLeft: '8px' }}>
                                {expanded[training.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            )}
                          </div>
                        </TableCell>
                        <TableCell align="left">{generateRefNo(training.id)}</TableCell>
                        <TableCell>{training.date ? dayjs(training.date).format('DD-MM-YYYY') : 'N/A'}</TableCell>
                        <TableCell><Tooltip title={training.branch}><span>{branchMaster.length > 0 && training.branch.split(', ').length === branchMaster.length - 1 ? 'PAN INDIA' : training.branch.split(', ')[0] + (training.branch.split(', ').length > 1 ? ' ++' : '')}</span></Tooltip></TableCell>
                        <TableCell><Tooltip title={training.department}><span>{departmentMaster.length > 0 && training.department.split(', ').length === departmentMaster.length - 1 ? 'All Departments' : training.department.split(', ')[0] + (training.department.split(', ').length > 1 ? ' ++' : '')}</span></Tooltip></TableCell>
                        <TableCell>{training.topic}</TableCell>
                        <TableCell>{training.trainerType}</TableCell>
                        <TableCell><div style={{ display: 'flex', alignItems: 'center' }}>{renderMilestones(training)}</div></TableCell>
                        {((topTab === 1 && nestedTab === 0) || (topTab === 1 && nestedTab === 1)) && (hasAccess('Training Summary', 'Training Admin View', 'View') || hasAccess('Training Summary', 'Training Admin View', 'View/Create/Edit')) && (
                          <TableCell align="center">
                            <IconButton onClick={e => { handleIconClick(e, training.id); }}><MoreHorizIcon /></IconButton>
                            <Popover open={Boolean(anchorEl[training.id])} anchorEl={anchorEl[training.id]} onClose={() => handleClose(training.id)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} transformOrigin={{ vertical: 'top', horizontal: 'center' }}>
                              {training.status === 'Cancelled' ? (
                                <Button onClick={() => handleViewCancellationReason(training)} variant="contained" color="secondary" startIcon={<InfoIcon />}>View Cancellation Reason</Button>
                              ) : (
                                <>
                                  <MenuItem onClick={() => handleCancelTrainingClick(training.id)} disabled={isTrainingActionDisabled(training, loggedInUserId)} title={`Created by: ${training.user_name}`}>
                                    <CancelIcon sx={{ marginRight: 1 }} /> Cancel <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#888' }}>{training.user_name}</span>
                                  </MenuItem>
                                  <CancelReasonModal open={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} onConfirm={handleCancelConfirm} />
                                  <MenuItem onClick={() => handleEditTraining(training.id)} disabled={isTrainingActionDisabled(training, loggedInUserId)} title={`Created by: ${training.user_name}`}>
                                    <EditIcon sx={{ marginRight: 1 }} /> Edit <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#888' }}>{training.user_name}</span>
                                  </MenuItem>
                                  {training.status === 'Training Created' && (
                                    <MenuItem onClick={() => navigateToAgenda(training)} disabled={training.emp_id !== loggedInUserId} title={`Created by: ${training.user_name}`}>
                                      <AddCircleIcon sx={{ marginRight: 1 }} /> Add Session <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#888' }}>{training.user_name}</span>
                                    </MenuItem>
                                  )}
                                </>
                              )}
                            </Popover>
                          </TableCell>
                        )}
                      </TableRow>

                      {/* ── Expanded Sessions Row (Admin) ── */}
                      {nestedTab === 0 && (
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
                            <Collapse in={expanded[training.id]} timeout="auto" unmountOnExit>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: '#2E157A' }}>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>
                                      Session Title
                                      <Tooltip title="View detailed session information" componentsProps={{ tooltip: { sx: { backgroundColor: '#1A005D', color: 'white' } } }}>
                                        <IconButton size="small" onClick={() => handleInfoClick(training.id)} sx={{ color: 'white' }}><InfoIcon fontSize="small" /></IconButton>
                                      </Tooltip>
                                    </TableCell>
                                    {['Scheduled Date', 'Start Time', 'End Time', 'Trainer', 'Mode', 'Status', 'Actions'].map(h => <TableCell key={h} sx={{ fontWeight: 'bold', color: 'white' }}>{h}</TableCell>)}
                                    <TableCell sx={{ fontWeight: 'bold', color: 'white', textAlign: 'center' }}><Tooltip title="Uploaded Documents"><FolderIcon sx={{ color: 'white' }} /></Tooltip></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {!sessionsData[training.id] && expanded[training.id] ? (
                                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                                  ) : (sessionsData[training.id] || []).length > 0 ? (
                                    sessionsData[training.id].map(session => (
                                      <TableRow key={session.session_no} sx={{ '&:nth-of-type(odd)': { bgcolor: 'rgba(46,21,122,0.1)' }, '&:nth-of-type(even)': { bgcolor: '#ffffff' } }}>
                                        <TableCell>{session.session_description}</TableCell>
                                        <TableCell>{formatDate(session.session_date)}</TableCell>
                                        <TableCell>{formatTime(session.from_time)}</TableCell>
                                        <TableCell>{formatTime(session.to_time)}</TableCell>
                                        <TableCell>{session.trainer_name}</TableCell>
                                        <TableCell>{session.mode_of_training}</TableCell>
                                        <TableCell><div style={{ display: 'flex', alignItems: 'center' }}>{renderSessionMilestones(session)}</div></TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                              size="small"
                                              onClick={e => handleActionMenuOpen(e, session.session_no, training.id)}
                                            >
                                              <MoreVertIcon />
                                            </IconButton>

                                            <Menu
                                              anchorEl={actionMenuMap[`${training.id}_${session.session_no}`] ?? null}
                                              open={Boolean(actionMenuMap[`${training.id}_${session.session_no}`])}
                                              onClose={() => handleActionMenuClose(training.id, session.session_no)}
                                              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                              // NO disablePortal — let MUI portal it to document.body
                                            >
                                                 {renderSessionActionItems(session, training)}
                                            {(() => {
                                              const sd = new Date(session.session_date);
                                              const [fh, fm, fs] = session.from_time.split(':').map(Number);
                                              sd.setHours(fh, fm, fs, 0);
                                              const started = new Date() >= sd;
                                              return !started && (
                                                <>
                                                  <MenuItem key={session.session_no} onClick={() => handlePostpone(session)}><ScheduleIcon color="warning" />Postpone</MenuItem>
                                                  <MenuItem onClick={() => handleCancel(session.session_no)}><CancelIcon color="error" />Cancel</MenuItem>
                                                </>
                                              );
                                            })()}
                                          </Menu>
                                        </TableCell>
                                        <TableCell align="center">
                                          <Tooltip title="View uploaded documents" componentsProps={{ tooltip: { sx: { backgroundColor: '#1A005D', color: 'white' } } }}>
                                            <IconButton size="small" onClick={() => HandleViewUploadedFiles(session.planing_id, session.session_no)} sx={{ color: '#1A005D' }}><DescriptionIcon fontSize="small" /></IconButton>
                                          </Tooltip>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow><TableCell colSpan={8} align="center">No sessions available for this training.</TableCell></TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TableContainer>
        )}

        {/* ── User Table ── */}
        {topTab === 0 && (
          <TableContainer component={Paper}>
            <div style={{ overflowX: 'auto' }}>
              <Table aria-label="training table">
                <TableHead>
                  <TableRow className="table-row">
                    <TableCell align="left"><b>SL NO.</b></TableCell>
                    <SortableCell field="id" label="Ref No" />
                    <SortableCell field="date" label="Planned Date" />
                    <SortableCell field="branch" label="Branch" />
                    <SortableCell field="department" label="Department" />
                    <SortableCell field="topic" label="Topic" />
                    <SortableCell field="trainerType" label="Trainer" />
                    <TableCell align="left"><b>Status</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody sx={{ '& .table-rowcontent': { textTransform: 'uppercase' } }}>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                  ) : displayedUserData.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center">No Trainings Available</TableCell></TableRow>
                  ) : displayedUserData.map((training, index) => (
                    <React.Fragment key={training.id}>
                      <TableRow className="table-rowcontent">
                        <TableCell>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {index + 1}
                            {training.status !== 'Training Created' && (
                              <IconButton onClick={() => handleExpandClick(training.id)} size="small" style={{ marginLeft: '8px' }}>
                                {expanded[training.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            )}
                          </div>
                        </TableCell>
                        <TableCell align="center">{generateRefNo(training.id)}</TableCell>
                        <TableCell>{training.date ? dayjs(training.date).format('DD-MM-YYYY') : 'N/A'}</TableCell>
                        <TableCell><Tooltip title={training.branch}><span>{branchMaster.length > 0 && training.branch.split(',').length === branchMaster.length - 1 ? 'PAN INDIA' : training.branch.split(',')[0] + (training.branch.split(',').length > 1 ? ' ++' : '')}</span></Tooltip></TableCell>
                        <TableCell><Tooltip title={training.department}><span>{departmentMaster.length > 0 && training.department.split(',').length === departmentMaster.length - 1 ? 'All Departments' : training.department.split(',')[0] + (training.department.split(',').length > 1 ? ' ++' : '')}</span></Tooltip></TableCell>
                        <TableCell>{training.topic}</TableCell>
                        <TableCell>{training.trainerType}</TableCell>
                        <TableCell><div style={{ display: 'flex', alignItems: 'center' }}>{renderMilestones(training)}</div></TableCell>
                      </TableRow>

                      {/* ── Expanded Sessions Row (User) ── */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
                          <Collapse in={expanded[training.id]} timeout="auto" unmountOnExit>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: '#2E157A' }}>
                                  <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>
                                    Session Title
                                    <Tooltip title="View detailed session information" componentsProps={{ tooltip: { sx: { backgroundColor: '#1A005D', color: 'white' } } }}>
                                      <IconButton size="small" onClick={() => handleInfoClick(training.id)} sx={{ color: 'white' }}><InfoIcon fontSize="small" /></IconButton>
                                    </Tooltip>
                                  </TableCell>
                                  {['Scheduled Date', 'Start Time', 'End Time', 'Trainer', 'Mode', 'Status'].map(h => <TableCell key={h} sx={{ fontWeight: 'bold', color: 'white' }}>{h}</TableCell>)}
                                  {(topTab === 0 || topTab === 1) && sessionsData[training.id] && (() => {
                                    const hasValid = (sessionsData[training.id] || []).some(s => {
                                      const m = formattedData2.find(x => x.sessionNo === s.session_no && x.id === training.id);
                                      return m && ['coordinator', 'sub_coordinator'].includes(m.role_type);
                                    });
                                    return hasValid ? <TableCell sx={{ fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Actions</TableCell> : null;
                                  })()}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {!sessionsData[training.id] && expanded[training.id] ? (
                                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                                ) : (sessionsData[training.id] || []).length > 0 ? (
                                  sessionsData[training.id].map(session => {
                                    const matchingSession = formattedData2.find(s => s.sessionNo === session.session_no && s.id === training.id);
                                    const canPerformAction = matchingSession && (['coordinator', 'sub_coordinator'].includes(matchingSession.role_type?.toLowerCase()) || matchingSession.isTrainer);
                                    return (
                                      <TableRow key={session.session_no} sx={{ '&:nth-of-type(odd)': { bgcolor: 'rgba(46,21,122,0.1)' }, '&:nth-of-type(even)': { bgcolor: '#ffffff' } }}>
                                        <TableCell>{session.session_description}</TableCell>
                                        <TableCell>{formatDate(session.session_date)}</TableCell>
                                        <TableCell>{formatTime(session.from_time)}</TableCell>
                                        <TableCell>{formatTime(session.to_time)}</TableCell>
                                        <TableCell>{session.trainer_name}</TableCell>
                                        <TableCell>{session.mode_of_training}</TableCell>
                                        <TableCell><div style={{ display: 'flex', alignItems: 'center' }}>{renderSessionMilestones(session)}</div></TableCell>
                                        {canPerformAction ? (
                                          <TableCell align="center">
                                              <IconButton
                                                size="small"
                                                onClick={e => handleActionMenuOpen(e, session.session_no, training.id)}
                                              >
                                                <MoreVertIcon />
                                              </IconButton>
                                                <Menu
                                                  anchorEl={actionMenuMap[`${training.id}_${session.session_no}`] ?? null}
                                                  open={Boolean(actionMenuMap[`${training.id}_${session.session_no}`])}
                                                  onClose={() => handleActionMenuClose(training.id, session.session_no)}
                                                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                                  // NO disablePortal — let MUI portal it to document.body
                                                >                                          
                                              {renderSessionActionItems(session, training, matchingSession)}
                                            </Menu>
                                          </TableCell>
                                        ) : (
                                          <TableCell align="center"><Typography variant="body2" color="textSecondary">No Action</Typography></TableCell>
                                        )}
                                      </TableRow>
                                    );
                                  })
                                ) : (
                                  <TableRow><TableCell colSpan={8} align="center">No sessions available</TableCell></TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TableContainer>
        )}

        {/* ── Training Details Modal ── */}
        <Modal open={trainingPlanModalOpen} onClose={handleCloseTrainingPlanModal}>
          <Box sx={{ width: '70%', margin: 'auto', mt: 7, p: 3, bgcolor: 'white', boxShadow: 24, maxHeight: '90vh', overflowY: 'auto', color: '#1A005D' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '2px solid #1A005D', pb: 0.5 }}>Training Details Summary</Typography>
            {selectedTraining ? (
              <Box sx={{ mt: 2 }}>
                <Table><TableBody>
                  {[['Branch', 'branch'], ['Department', 'department'], ['Topic', 'topic'], ['Staff Category', 'staffCategory'], ['Trainer Type', 'trainerType'], ['Date', 'date'], ['Status', 'status']].map(([label, key]) => (
                    <TableRow key={key}><TableCell sx={{ fontWeight: 'bold', width: '40%' }}>{label}</TableCell><TableCell>{selectedTraining[key] || 'Not available'}</TableCell></TableRow>
                  ))}
                </TableBody></Table>
              </Box>
            ) : <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>No details available.</Typography>}
          </Box>
        </Modal>

        {/* ── Attendance Dialog ──
        <Dialog open={attendanceDialogOpen} onClose={handleCloseAttendanceDialog} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.1)' } }}>
          <DialogTitle sx={{ padding: '16px 24px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontWeight: '600', color: '#1a005d', fontSize: '18px' }}>Add Trainee Attendance</Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ padding: '16px 24px' }}>
            {selectedSession && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Autocomplete multiple options={options} getOptionLabel={o => o.label} value={selectedOptions} onChange={handleChange} disableCloseOnSelect isOptionEqualToValue={(o, v) => o.id === v.id}
                    renderOption={(props, option, { selected }) => (<li {...props}><Checkbox size="small" checked={selected} sx={{ marginRight: 1 }} /><Typography variant="body2" sx={{ fontSize: '14px', color: '#333' }}>{option.label}</Typography></li>)}
                    renderInput={params => (<TextField {...params} variant="outlined" label="Select Trainees" size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} InputProps={{ ...params.InputProps, startAdornment: selectedOptions.length > 3 ? (<Typography variant="body2" sx={{ fontSize: '14px', color: '#666' }}>{selectedOptions.filter(o => o.id !== 'Other').length} trainees selected</Typography>) : params.InputProps.startAdornment }} />)} />
                </Grid>
                {selectedOptions.some(o => o.id === 'Other') && (
                  <Grid item xs={12} md={6}>
                    <Autocomplete multiple options={otherTrainees} getOptionLabel={o => o.label} value={otherOptions} onChange={handleOtherChange} disableCloseOnSelect isOptionEqualToValue={(o, v) => String(o.id) === String(v.id)}
                      renderOption={(props, option, { selected }) => (<li {...props} key={option.id}><Checkbox size="small" checked={selected} sx={{ marginRight: 1 }} /><Typography variant="body2" sx={{ fontSize: '14px', color: '#333' }}>{option.label}</Typography></li>)}
                      renderInput={params => (<TextField {...params} variant="outlined" label="Select Other Trainees" size="small" fullWidth InputProps={{ ...params.InputProps, startAdornment: otherOptions.length > 3 ? (<Typography variant="body2" sx={{ fontSize: '14px', color: '#666' }}>{otherOptions.length} other trainees selected</Typography>) : params.InputProps.startAdornment }} />)} />
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={() => handleSaveDraftAttendance(selectedSession?.planing_id, selectedSession?.session_no)} color="secondary" variant="outlined" sx={{ padding: '8px 16px', fontSize: '14px', borderRadius: '8px', textTransform: 'none' }}>Save as Draft</Button>
            <Button onClick={handleCloseAttendanceDialog} color="inherit" variant="outlined" sx={{ padding: '8px 16px', fontSize: '14px', borderRadius: '8px', textTransform: 'none', borderColor: '#1a005d', color: '#1a005d' }}>Cancel</Button>
            <Button onClick={() => handleSaveAttendance(selectedSession?.planing_id, selectedSession?.session_no)} color="primary" variant="contained" sx={{ padding: '8px 16px', fontSize: '14px', borderRadius: '8px', textTransform: 'none', backgroundColor: '#1a005d', '&:hover': { backgroundColor: '#14004a' } }}>Save Attendance</Button>
          </DialogActions>
        </Dialog> */}

      {/* ── Attendance Dialog*/}
         <AttendanceUploadDialog
            open={uploadDialogOpen}
            onClose={() => setUploadDialogOpen(false)}
            session={selectedSession}
            mappedOptions={options.filter(o => o.id !== 'ALL' && o.id !== 'Other')}
            allEmployees={otherTrainees}
            coordinatorContext={coordinatorContextRef.current}
            onConfirm={handleBulkSave}
            draftAttendanceMap={selectedTrainees}  
            draftWalkIns={otherOptions}         
          />
        {/* ── Confirmation Dialog ── */}
        <Dialog open={isConfirmationDialogOpen} onClose={() => setConfirmationDialogOpen(false)} PaperProps={{ sx: { borderRadius: '12px' } }}>
          <DialogTitle sx={{ padding: '16px 24px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontWeight: '600', color: '#1a005d' }}>Confirm Submission</Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ padding: '16px 24px' }}>
            <Typography variant="body1" sx={{ fontSize: '14px', color: '#333' }}>Are you sure you want to submit this attendance? Once submitted, it cannot be changed.</Typography>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button onClick={() => setConfirmationDialogOpen(false)} color="inherit" variant="outlined" sx={{ padding: '8px 16px', borderRadius: '8px', textTransform: 'none', borderColor: '#1a005d', color: '#1a005d' }}>Cancel</Button>
            <Button onClick={() => handleConfirmAttendance(selectedSession?.planing_id, selectedSession?.session_no)} color="primary" variant="contained" sx={{ padding: '8px 16px', borderRadius: '8px', textTransform: 'none', backgroundColor: '#1a005d', '&:hover': { backgroundColor: '#14004a' } }}>Confirm</Button>
          </DialogActions>
        </Dialog>

        {/* ── Training Effectiveness Dialog ── */}
          <TrainingEffectivenessDialog
          open={open}
          onClose={handleTrainingClose}
          selectedSession={selectedSession}
          API_BASE_URL={API_BASE_URL}
          onSubmit={handleEffectivenessSubmit}
        />

        {/* ── Assign Feedback Form (Trainee) Dialog ── */}
        <Dialog open={assignFeedbackDialogOpen} onClose={handleCloseFeedbackDialog} fullWidth maxWidth="md" sx={{ '& .MuiDialog-paper': { borderRadius: '16px', maxHeight: '80vh', overflowY: 'auto' } }}>
          <DialogTitle sx={{ padding: '16px 24px', background: 'linear-gradient(145deg, #1a005d, #4a148c)', borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontWeight: '600', color: '#ffffff', fontSize: '18px' }}>Assign Feedback Form for Trainees</Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ padding: '16px 24px', background: '#fafafa', maxHeight: '70vh', overflowY: 'auto' }}>
            <TableContainer sx={{ borderRadius: '12px', border: '1px solid #e0e0e0', background: '#ffffff' }}>
              <Table>
                <TableHead sx={{ background: '#ececff' }}>
                  <TableRow>
                    {['', 'Feedback Form', 'Form Type', 'Created By', 'User Name', 'Created Time', 'Actions'].map(h => <TableCell key={h} sx={{ fontWeight: '600', fontSize: '14px', py: '12px', color: '#1a005d' }}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {feedbackForms.map(form => (
                    <TableRow key={form.id} hover>
                      <TableCell padding="checkbox"><Checkbox checked={selectedFeedbackForm === form.id} onChange={() => handleCheckboxChange(form.id, form.feedback_form_name)} sx={{ color: '#1a005d', '&.Mui-checked': { color: '#673ab7' } }} /></TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#333' }}>{form.feedback_form_name}</TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#555' }}>{form.feedback_form_type}</TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#555' }}>{form.user_created_by}</TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#555' }}>{form.user_name}</TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#777' }}>{new Date(form.user_created_time).toLocaleString()}</TableCell>
                      <TableCell>
                        <Tooltip title="View"><IconButton color="primary" onClick={handleViewPDF} sx={{ color: '#1976d2' }}><Visibility /></IconButton></Tooltip>
                        <Tooltip title="Edit"><IconButton color="secondary" onClick={() => handleEditPDF(form.id)} sx={{ color: '#4d7c04' }}><Edit /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker label="Final Submission Deadline" value={finalSubmitDate} onChange={handleFeedbackDateChange} format="YYYY-MM-DD" minDate={dayjs()} maxDate={dayjs().add(10, 'day')} sx={{ mt: 3, width: '100%' }} slotProps={{ textField: { variant: 'outlined', fullWidth: true, size: 'small' } }} />
            </LocalizationProvider>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px', background: '#f5f5fa', borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={handleCloseFeedbackDialog} color="inherit" variant="outlined" sx={{ padding: '8px 16px', borderRadius: '8px', textTransform: 'none', borderColor: '#1a005d', color: '#1a005d' }}>Cancel</Button>
            <Button onClick={() => { if (!finalSubmitDate) { showSnackbar('❌Please select a final submission date.', 'error'); return; } setIsTransitioning(true); handleAssignFeedbackForm(); setAssignFeedbackDialogOpen(false); setTimeout(() => { setIsTransitioning(false); setAssignTrainerFeedbackDialogOpen(true); }, 5000); }}
              color="primary" variant="contained" sx={{ padding: '8px 16px', borderRadius: '8px', background: '#1A005D', '&:hover': { background: '#5e35b1' }, textTransform: 'none' }} disabled={!selectedFeedbackForm || isTransitioning}>
              {isTransitioning ? 'Processing...' : 'Assign Feedback Form'}
            </Button>
          </DialogActions>
        </Dialog>

        <LoadingOverlay open={isTransitioning} />

        {/* ── Assign Trainer Feedback Dialog ── */}
        <Dialog open={assignTrainerFeedbackDialogOpen} onClose={handleCloseTrainerFeedbackDialog} fullWidth maxWidth="md" sx={{ '& .MuiDialog-paper': { borderRadius: '16px', maxHeight: '80vh', overflowY: 'auto' } }}>
          <DialogTitle sx={{ padding: '16px 24px', background: 'linear-gradient(145deg, #1a005d, #4a148c)' }}>
            <Typography variant="h6" sx={{ fontWeight: '600', color: '#ffffff', fontSize: '18px' }}>Assign Trainer Feedback Form</Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ padding: '16px 24px', background: '#fafafa', maxHeight: '70vh', overflowY: 'auto' }}>
            <TableContainer sx={{ borderRadius: '12px', border: '1px solid #e0e0e0', background: '#ffffff' }}>
              <Table>
                <TableHead sx={{ background: '#ececff' }}>
                  <TableRow>{['Select', 'Feedback Form', 'Created By', 'Created Time'].map(h => <TableCell key={h} sx={{ fontWeight: '600', fontSize: '14px', py: '12px', color: '#1a005d' }}>{h}</TableCell>)}</TableRow>
                </TableHead>
                <TableBody>
                  {trainerFeedbackForms.map(form => (
                    <TableRow key={form.id} hover>
                      <TableCell padding="checkbox"><Checkbox checked={selectedTrainerFeedbackForm === form.id} onChange={() => setSelectedTrainerFeedbackForm(form.id)} sx={{ color: '#1a005d', '&.Mui-checked': { color: '#673ab7' } }} /></TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#333' }}>{form.feedback_form_name}</TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#555' }}>{form.user_name}</TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#777' }}>{new Date(form.user_created_time).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker label="Trainer Feedback Submission Deadline" value={trainerFinalSubmitDate ? dayjs(trainerFinalSubmitDate) : null} onChange={handleTrainerDateChange} format="YYYY-MM-DD" minDate={dayjs()} maxDate={dayjs().add(10, 'day')} sx={{ mt: 3, width: '100%' }} slotProps={{ textField: { variant: 'outlined', fullWidth: true, size: 'small' } }} />
            </LocalizationProvider>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px', background: '#f5f5fa', borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={handleCloseTrainerFeedbackDialog} color="inherit" variant="outlined" sx={{ padding: '8px 16px', borderRadius: '8px', textTransform: 'none', borderColor: '#1a005d', color: '#1a005d' }}>Cancel</Button>
            <Button onClick={handleAssignTrainerFeedbackForm}
              color="primary" variant="contained" sx={{ padding: '8px 16px', borderRadius: '8px', background: '#1A005D', '&:hover': { background: '#5e35b1' }, textTransform: 'none' }} disabled={!selectedTrainerFeedbackForm || !trainerFinalSubmitDate}>
              Assign Trainer Feedback
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Awaiting Feedback Dialog ── */}
        <Dialog open={openFeedbackDialog} onClose={() => setOpenFeedbackDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#1A005D', color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Awaiting Feedback</DialogTitle>
          <DialogContent sx={{ backgroundColor: '#F4F6F8', padding: '16px' }}>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100px"><CircularProgress /></Box>
            ) : (
              <>
                {/* ── File Upload Section ── */}
                <Box sx={{ mb: 1, p: 1, border: '1px dashed #1A005D', borderRadius: 2, backgroundColor: 'white' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display: 'none' }} id="session-documents-upload" multiple type="file" onChange={handleFileSelection} />
                    <label htmlFor="session-documents-upload">
                      <Button variant="contained" component="span" startIcon={<CloudUploadIcon />} sx={{ backgroundColor: '#1A005D', color: 'white', '&:hover': { backgroundColor: '#08233d' } }}>Select Documents</Button>
                    </label>
                    <Button variant="contained" color="success" startIcon={<SendIcon />} onClick={handleUploadFiles} disabled={selectedFiles.length === 0 || isUploading} sx={{ minWidth: 120 }}>
                      {isUploading ? 'Uploading...' : 'Upload Now'}
                    </Button>
                  </Box>
                  {selectedFiles.length > 0 && (
                    <Box sx={{ mt: 2, maxHeight: 150, overflow: 'auto' }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>Selected Files ({selectedFiles.length}):</Typography>
                      <List dense sx={{ p: 0 }}>
                        {selectedFiles.map((file, i) => (
                          <ListItem key={i} sx={{ py: 0.5, backgroundColor: i % 2 === 0 ? '#f5f5f5' : 'white' }}>
                            <ListItemIcon sx={{ minWidth: 30 }}><InsertDriveFileIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(2)} KB`} sx={{ my: 0 }} />
                            <IconButton edge="end" size="small" onClick={() => handleRemoveSelectedFile(i)} sx={{ color: '#d32f2f' }}><ClearIcon fontSize="small" /></IconButton>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  {isUploading && (<Box sx={{ mt: 2 }}><LinearProgress variant="determinate" value={uploadProgress} /><Typography variant="caption" display="block" textAlign="center" sx={{ mt: 1 }}>{uploadProgress}% uploaded</Typography></Box>)}
                  {uploadedFiles.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>Uploaded Documents ({uploadedFiles.length}):</Typography>
                      {uploadedFiles.slice(0, 1).map((file, i) => (
                        <ListItem key={i} sx={{ py: 0.5, backgroundColor: '#f0f7ff', borderRadius: 1, mb: 1 }}>
                          <ListItemIcon sx={{ minWidth: 30 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                          <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(2)} KB`} sx={{ my: 0 }} />
                          <IconButton edge="end" size="small" onClick={() => handleRemoveUploadedFile(i)} sx={{ color: '#d32f2f' }}><DeleteIcon fontSize="small" /></IconButton>
                        </ListItem>
                      ))}
                      {uploadedFiles.length > 1 && (
                        <Box sx={{ maxHeight: 120, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 0.5 }}>
                          <List dense sx={{ p: 0 }}>
                            {uploadedFiles.slice(1).map((file, i) => (
                              <ListItem key={i + 1} sx={{ py: 0.5, backgroundColor: i % 2 === 0 ? '#fafafa' : 'white' }}>
                                <ListItemIcon sx={{ minWidth: 30 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                                <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(2)} KB`} sx={{ my: 0 }} />
                                <IconButton edge="end" size="small" onClick={() => handleRemoveUploadedFile(i + 1)} sx={{ color: '#d32f2f' }}><DeleteIcon fontSize="small" /></IconButton>
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>

                {/* ── Trainee / Trainer Tabs ── */}
                <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
                  <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} centered>
                    <Tab label={`Trainees (${submittedTrainees.length + pendingTrainees.length})`} />
                    <Tab label={`Trainers (${submittedTrainers.length + pendingTrainers.length})`} />
                  </Tabs>

                  {/* Trainees Panel */}
                  <TabPanel value={activeTab} index={0}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Card onClick={() => setOpenSubmittedModal(true)} sx={{ cursor: 'pointer', textAlign: 'center', boxShadow: 2, borderRadius: 2, background: '#8EC400', color: 'white', padding: '8px', width: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3, backgroundColor: '#7CB300' } }}>
                        <CardContent><Typography variant="subtitle1" fontWeight="bold">Submitted</Typography><Typography variant="h5" fontWeight="bold">{submittedTrainees.length}</Typography></CardContent>
                      </Card>
                      <Modal open={openSubmittedModal} onClose={() => setOpenSubmittedModal(false)}>
                        <Box sx={MODAL_STYLE}>
                          <Typography variant="h6" sx={MODAL_HEADER_STYLE}>Submitted Trainees ({submittedTrainees.length})</Typography>
                          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                            {submittedUsersToShow.map(t => (
                              <ListItem button key={t.trainee_id} onClick={() => { handleViewFeedback(t.trainee_id); setOpenSubmittedModal(false); }} sx={listItemStyle('#8EC400', '#e9fde3', '#9ef485')}>
                                <ListItemText primary={<Typography variant="subtitle2" fontWeight={500}>{t.trainee_name}</Typography>} secondary={`ID: ${t.trainee_id}`} />
                                <ChevronRightIcon color="action" />
                              </ListItem>
                            ))}
                          </List>
                          {submittedTrainees.length > ITEMS_PER_PAGE && <Pagination count={Math.ceil(submittedTrainees.length / ITEMS_PER_PAGE)} page={submittedPage} onChange={(e, p) => setSubmittedPage(p)} size="small" sx={PAGINATION_STYLE} />}
                          <Button variant="outlined" onClick={() => setOpenSubmittedModal(false)} sx={CLOSE_BUTTON_STYLE}>Close</Button>
                        </Box>
                      </Modal>

                      <Card onClick={() => setOpenPendingModal(true)} sx={{ cursor: 'pointer', textAlign: 'center', boxShadow: 2, borderRadius: 2, background: '#e00d0d', color: 'white', padding: '8px', width: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)', backgroundColor: '#c00c0c' } }}>
                        <CardContent><Typography variant="subtitle1" fontWeight="bold">Pending</Typography><Typography variant="h5" fontWeight="bold">{pendingTrainees.length}</Typography></CardContent>
                      </Card>
                      <Modal open={openPendingModal} onClose={() => setOpenPendingModal(false)}>
                        <Box sx={MODAL_STYLE}>
                          <Typography variant="h6" sx={MODAL_HEADER_STYLE}>Pending Trainees ({pendingTrainees.length})</Typography>
                          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                            {pendingUsersToShow.map(t => (
                              <ListItem key={t.trainee_id} sx={listItemStyle('#e00d0d', '#FFCCBC', '#FFE0E0')}>
                                <ListItemText primary={<Typography variant="subtitle2" fontWeight={500}>{t.trainee_name}</Typography>} secondary={`ID: ${t.trainee_id}`} />
                                  <IconButton
                                    size="small"
                                    onClick={() => handleSendReminder(selectedPlaningId, selectedSessionId, t.trainee_id)}  // ✅ individual
                                    sx={{ color: '#e00d0d', '&:hover': { backgroundColor: 'rgba(224,13,13,0.1)' } }}
                                  >
                                    <SendIcon fontSize="small" />
                                  </IconButton>                          
                                     </ListItem>
                            ))}
                          </List>
                          {pendingTrainees.length > ITEMS_PER_PAGE && <Pagination count={Math.ceil(pendingTrainees.length / ITEMS_PER_PAGE)} page={pendingPage} onChange={(e, p) => setPendingPage(p)} size="small" sx={PAGINATION_STYLE} />}
                          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            <Button variant="outlined" onClick={() => setOpenPendingModal(false)} sx={CLOSE_BUTTON_STYLE}>Close</Button>
                              {pendingTrainees.length > 0 && (
                                <Button
                                  variant="contained"
                                  startIcon={<SendIcon />}
                                  onClick={() => handleSendReminder(selectedPlaningId, selectedSessionId)}  // ✅
                                  sx={{ flex: 1, backgroundColor: '#e00d0d', color: 'white', '&:hover': { backgroundColor: '#c00c0c' } }}
                                >
                                  Remind All
                                </Button>
                              )}                        
                                </Box>
                        </Box>
                      </Modal>
                    </Box>
                  </TabPanel>

                  {/* Trainers Panel */}
                  <TabPanel value={activeTab} index={1}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Card onClick={() => setOpenTrainerSubmittedModal(true)} sx={{ cursor: 'pointer', textAlign: 'center', boxShadow: 2, borderRadius: 2, background: '#4A90E2', color: 'white', padding: '8px', width: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)', backgroundColor: '#3A80D2' } }}>
                        <CardContent><Typography variant="subtitle1" fontWeight="bold">Submitted</Typography><Typography variant="h5" fontWeight="bold">{submittedTrainers.length}</Typography></CardContent>
                      </Card>
                      <Modal open={openTrainerSubmittedModal} onClose={() => setOpenTrainerSubmittedModal(false)}>
                        <Box sx={MODAL_STYLE}>
                          <Typography variant="h6" sx={MODAL_HEADER_STYLE}>Submitted Trainers ({submittedTrainers.length})</Typography>
                          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                            {submittedTrainers.map(t => (
                              <ListItem button key={t.trainer_id} onClick={() => { handleViewTrainerFeedback(t.trainer_id); setOpenTrainerSubmittedModal(false); }} sx={listItemStyle('#4A90E2', '#E3F2FD', '#90CAF9')}>
                                <ListItemText primary={<Typography variant="subtitle2" fontWeight={500}>{t.trainer_name}</Typography>} secondary={`ID: ${t.trainer_id}`} />
                                <ChevronRightIcon color="action" />
                              </ListItem>
                            ))}
                          </List>
                          <Button variant="outlined" onClick={() => setOpenTrainerSubmittedModal(false)} sx={CLOSE_BUTTON_STYLE}>Close</Button>
                        </Box>
                      </Modal>

                      <Card onClick={() => setOpenTrainerPendingModal(true)} sx={{ cursor: 'pointer', textAlign: 'center', boxShadow: 2, borderRadius: 2, background: '#FF9800', color: 'white', padding: '8px', width: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)', backgroundColor: '#E68A00' } }}>
                        <CardContent><Typography variant="subtitle1" fontWeight="bold">Pending</Typography><Typography variant="h5" fontWeight="bold">{pendingTrainers.length}</Typography></CardContent>
                      </Card>
                      <Modal open={openTrainerPendingModal} onClose={() => setOpenTrainerPendingModal(false)}>
                        <Box sx={MODAL_STYLE}>
                          <Typography variant="h6" sx={MODAL_HEADER_STYLE}>Pending Trainers ({pendingTrainers.length})</Typography>
                          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                            {pendingTrainers.map(t => (
                              <ListItem key={t.trainer_id} sx={listItemStyle('#FF9800', '#FFE0B2', '#FFD180')}>
                                <ListItemText primary={<Typography variant="subtitle2" fontWeight={500}>{t.trainer_name}</Typography>} secondary={`ID: ${t.trainer_id}`} />
                                <IconButton
                                  size="small"
                                  onClick={() => handleSendTrainerReminder(selectedPlaningId, selectedSessionId)}  // ✅
                                  sx={{ color: '#FF9800', '&:hover': { backgroundColor: 'rgba(255,152,0,0.1)' } }}
                                >
                                  <SendIcon fontSize="small" />
                                </IconButton>
                              </ListItem>
                            ))}
                          </List>
                          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            <Button variant="outlined" onClick={() => setOpenTrainerPendingModal(false)} sx={CLOSE_BUTTON_STYLE}>Close</Button>
                                {pendingTrainers.length > 0 && (
                                  <Button
                                    variant="contained"
                                    startIcon={<SendIcon />}
                                    onClick={() => handleSendTrainerReminder(selectedPlaningId, selectedSessionId)}  // ✅
                                    sx={{ flex: 1, backgroundColor: '#FF9800', color: 'white', '&:hover': { backgroundColor: '#E68A00' } }}
                                  >
                                    Remind All
                                  </Button>
                                )}                         
                                 </Box>
                        </Box>
                      </Modal>
                    </Box>
                  </TabPanel>
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ backgroundColor: '#E3F2FD', padding: '8px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Button onClick={() => setOpenFeedbackDialog(false)} sx={{ backgroundColor: '#1A005D', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'none', '&:hover': { backgroundColor: '#08233d' } }}>Cancel</Button>
            <Button onClick={handleFinalSubmit} disabled={loading} sx={{ backgroundColor: '#4CAF50', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'none', '&:hover': { backgroundColor: '#388E3C' } }}>
              {loading ? 'Processing...' : 'Close Session'}
            </Button>
            <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
              <DialogTitle>Confirm Completion</DialogTitle>
              <DialogContent>Are you sure you want to finalize and submit this training session?</DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenConfirmDialog(false)} sx={{ color: '#d32f2f' }}>Cancel</Button>
                <Button onClick={handleConfirmSubmit} sx={{ color: '#388E3C' }}>Yes, Confirm</Button>
              </DialogActions>
            </Dialog>
          </DialogActions>
        </Dialog>

        {/* ── Trainee Feedback Details ── */}
        <Dialog open={openFeedbackDetailsDialog} onClose={() => setOpenFeedbackDetailsDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#1A005D', color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', padding: '12px' }}>Feedback Details</DialogTitle>
          <DialogContent sx={{ backgroundColor: '#F4F6F8', padding: '16px' }}>
            {traineeFeedback?.topics?.length > 0 ? (
              <List>
                {traineeFeedback.topics.map((topic, topicIdx) => {
                  const questions = topic?.feedback_form_question ? JSON.parse(topic.feedback_form_question) : {};
                  const answers = topic?.feedback_form_answer ? JSON.parse(topic.feedback_form_answer) : {};
                  const questionEntries = Object.entries(questions);

                  // Only render questions that have an actual answer
                  const answeredEntries = questionEntries.filter(([key]) => {
                    const raw = answers[key];
                    return raw !== undefined && raw !== null && String(raw).trim() !== '';
                  });

                  return (
                    <React.Fragment key={topicIdx}>
                      {answeredEntries.map(([key, question], idx) => {
                        const raw = answers[key];
                        // Q1–Q11 are numeric ratings → map to label; Q12+ are free text
                        const qNum = parseInt(key, 10);
                        const displayAnswer = qNum <= 11
                          ? (FEEDBACK_RATING_MAP[String(raw)] ?? String(raw))
                          : String(raw);

                        return (
                          <ListItem key={key} sx={{ backgroundColor: 'white', mb: 1.5, p: 2, borderRadius: 2, boxShadow: 1, '&:hover': { backgroundColor: '#e6e8f4' }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <Typography fontWeight="bold" fontSize="0.95rem" color="#1A005D">
                              Q{idx + 1}. {question}
                            </Typography>
                            <Box sx={{ mt: 0.5, pl: 1 }}>
                              <Typography variant="body2">
                                <strong>Answer:</strong>{' '}
                                <span style={{ color: qNum <= 11 ? '#2E7D32' : '#333' }}>{displayAnswer}</span>
                              </Typography>
                            </Box>
                          </ListItem>
                        );
                      })}

                      {/* Show comments + submitted date once at the bottom, only if they exist */}
                      {(topic?.feedback_form_comments_or_suggestions || topic?.feedback_form_submition_date) && (
                        <ListItem sx={{ backgroundColor: '#EDE7F6', mb: 2, p: 2, borderRadius: 2, boxShadow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          {topic?.feedback_form_comments_or_suggestions && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Comments / Future Topics:</strong> {topic.feedback_form_comments_or_suggestions}
                            </Typography>
                          )}
                          {topic?.feedback_form_submition_date && (
                            <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#555' }}>
                              <strong>Submitted on:</strong> {dayjs(topic.feedback_form_submition_date).format('DD MMM YYYY, hh:mm A')}
                            </Typography>
                          )}
                        </ListItem>
                      )}
                    </React.Fragment>
                  );
                })}
              </List>
            ) : <Typography textAlign="center" fontWeight="bold" color="#D84315" fontSize="0.95rem">No feedback available</Typography>}
          </DialogContent>
          <DialogActions sx={{ backgroundColor: '#E3F2FD', padding: '8px' }}>
            <Button onClick={() => setOpenFeedbackDetailsDialog(false)} sx={{ backgroundColor: '#1A005D', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', '&:hover': { backgroundColor: '#08233d' } }}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* ── Trainer Feedback Details ── */}
        <Dialog open={openTrainerFeedbackDetailsDialog} onClose={() => setOpenTrainerFeedbackDetailsDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#1A005D', color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', padding: '12px' }}>Trainer Feedback Details</DialogTitle>
          <DialogContent sx={{ backgroundColor: '#F4F6F8', padding: '16px' }}>
            {trainerFeedback?.topics?.length > 0 ? (
              <List>
                {trainerFeedback.topics.map((topic, topicIdx) => {
                  const questions = topic?.feedback_form_question ? JSON.parse(topic.feedback_form_question) : {};
                  const answers = topic?.feedback_form_answer ? JSON.parse(topic.feedback_form_answer) : {};
                  const questionEntries = Object.entries(questions);

                  // Trainer answers are keyed as q1, q2, ... — only show answered ones
                  const answeredEntries = questionEntries.filter(([key]) => {
                    const raw = answers?.[`q${key}`];
                    return raw !== undefined && raw !== null && String(raw).trim() !== '';
                  });

                  return (
                    <React.Fragment key={topicIdx}>
                      {answeredEntries.map(([key, question], idx) => {
                        const raw = answers?.[`q${key}`] ?? '';
                        return (
                          <ListItem key={key} sx={{ backgroundColor: 'white', mb: 1.5, p: 2, borderRadius: 2, boxShadow: 1, '&:hover': { backgroundColor: '#e6e8f4' }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <Typography fontWeight="bold" fontSize="0.95rem" color="#1A005D">
                              Q{idx + 1}. {question}
                            </Typography>
                            <Box sx={{ mt: 0.5, pl: 1 }}>
                              <Typography variant="body2">
                                <strong>Answer:</strong> {String(raw)}
                              </Typography>
                            </Box>
                          </ListItem>
                        );
                      })}

                      {/* Show comments + submitted date once at the bottom */}
                      {(topic?.feedback_form_comments_or_suggestions || topic?.feedback_form_submition_date) && (
                        <ListItem sx={{ backgroundColor: '#EDE7F6', mb: 2, p: 2, borderRadius: 2, boxShadow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          {topic?.feedback_form_comments_or_suggestions && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Comments:</strong> {topic.feedback_form_comments_or_suggestions}
                            </Typography>
                          )}
                          {topic?.feedback_form_submition_date && (
                            <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#555' }}>
                              <strong>Submitted on:</strong> {dayjs(topic.feedback_form_submition_date).format('DD MMM YYYY, hh:mm A')}
                            </Typography>
                          )}
                        </ListItem>
                      )}
                    </React.Fragment>
                  );
                })}
              </List>
            ) : <Typography textAlign="center" fontWeight="bold" color="#D84315" fontSize="0.95rem">No feedback available</Typography>}
          </DialogContent>
          <DialogActions sx={{ backgroundColor: '#E3F2FD', padding: '8px' }}>
            <Button onClick={() => setOpenTrainerFeedbackDetailsDialog(false)} sx={{ backgroundColor: '#1A005D', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', '&:hover': { backgroundColor: '#08233d' } }}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* ── Postpone Modal ── */}
        <PostponeSession open={openPostponeModal} handleClose={handleClosePostponeModal} session={selectedSession} setSessionsData={setSessionsData} />

        {/* ── Cancellation Reason Dialog ── */}
        <Dialog open={openReasonDialog} onClose={() => setOpenReasonDialog(false)}>
          <DialogTitle>Cancellation Reason</DialogTitle>
          <DialogContent><Typography>{cancellationReason}</Typography></DialogContent>
          <DialogActions><Button onClick={() => setOpenReasonDialog(false)} color="primary">Close</Button></DialogActions>
        </Dialog>

        {/* ── Training Details Info Modal ── */}
        <Modal open={openModal} onClose={() => setOpenModal(false)}>
          <Box sx={{ width: '70%', margin: 'auto', mt: 7, p: 2, bgcolor: 'white', boxShadow: 24, maxHeight: '90vh', overflowY: 'auto', color: '#1A005D' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '2px solid #1A005D', pb: 0.5 }}>Training Details</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h7" sx={{ fontWeight: 'bold', display: 'inline-block', pb: 0.5 }}>Planning Information</Typography>
              <Table>
                <TableHead><TableRow sx={{ bgcolor: '#1A005D' }}>
                  {['Training Topic', 'Status', 'Planning Type', 'Remarks'].map(h => <TableCell key={h} sx={{ fontWeight: 'bold', color: 'white', py: 0.5 }}>{h}</TableCell>)}
                </TableRow></TableHead>
                <TableBody>
                  {planningData?.data?.length > 0 ? planningData.data.map((row, i) => (
                    <TableRow key={i} sx={{ '&:nth-of-type(odd)': { bgcolor: '#1A005D20' } }}>
                      <TableCell sx={{ py: 0.5 }}>{row.training_topic || 'No status available'}</TableCell>
                      <TableCell sx={{ py: 0.5 }}>{row.Status || 'No status available'}</TableCell>
                      <TableCell sx={{ py: 0.5 }}>{row.planning_type || 'No type available'}</TableCell>
                      <TableCell sx={{ py: 0.5 }}>{row.remarks || 'No remarks available'}</TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={3} sx={{ py: 0.5, textAlign: 'center' }}>No planning data available</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h7" sx={{ fontWeight: 'bold', display: 'inline-block', pb: 0.5 }}>Session Details</Typography>
              <Table>
                <TableHead><TableRow sx={{ bgcolor: '#1A005D' }}>
                  {['Description', 'From Time', 'To Time', 'Trainer', 'Mode', 'Actions'].map(h => <TableCell key={h} sx={{ fontWeight: 'bold', color: 'white', py: 0.5 }}>{h}</TableCell>)}
                </TableRow></TableHead>
                <TableBody>
                  {sessionListData?.trainers?.length > 0 ? sessionListData.trainers.map((session, i) => {
                    const isExp = expandedRows[session.session_no];
                    const sessionMappingData = getMappingDataForSession(session.session_no);
                    const sessionTrainees = getTraineesForSession(session.session_no).filter(t => t.session_no === session.session_no);
                    const currentPage = traineePage[session.session_no] || 0;
                    const traineesToShow = sessionTrainees.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage);
                    return (
                      <React.Fragment key={i}>
                        <TableRow sx={{ '&:nth-of-type(odd)': { bgcolor: '#1A005D20' }, py: 0.5 }}>
                          <TableCell sx={{ py: 0.5 }}>{session.session_description}</TableCell>
                          <TableCell sx={{ py: 0.5 }}>{session.from_time}</TableCell>
                          <TableCell sx={{ py: 0.5 }}>{session.to_time}</TableCell>
                          <TableCell sx={{ py: 0.5 }}>{session.trainer_name}</TableCell>
                          <TableCell sx={{ py: 0.5 }}>{session.mode_of_training}</TableCell>
                          <TableCell sx={{ py: 0.5 }}>
                            <IconButton onClick={() => handleExpandClickInfo(session.session_no)} size="small" sx={{ backgroundColor: '#1976d2', color: '#fff', '&:hover': { backgroundColor: '#1565c0' } }}>
                              {isExp ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={7} sx={{ p: 0 }}>
                            <Collapse in={isExp} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 2 }}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', pb: 1 }}>Coordinator Details</Typography>
                                <Table size="small">
                                  <TableHead><TableRow sx={{ bgcolor: '#37474F' }}>
                                    {['Coordinator', 'Branch', 'Department', 'Trainee Count', 'Date Assigned'].map(h => <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>)}
                                  </TableRow></TableHead>
                                  <TableBody>
                                    {sessionMappingData.length > 0 ? sessionMappingData.map((m, j) => (
                                      <TableRow key={j} sx={{ '&:nth-of-type(odd)': { bgcolor: '#1A005D20' } }}>
                                        <TableCell>{m.coordinator_name}</TableCell>
                                        <TableCell><Tooltip title={m.branch}><span>{m.branch.split(', ')[0]}{m.branch.split(', ').length > 1 ? ' ++' : ''}</span></Tooltip></TableCell>
                                        <TableCell><Tooltip title={m.department}><span>{m.department.split(', ')[0]}{m.department.split(', ').length > 1 ? ' ++' : ''}</span></Tooltip></TableCell>
                                        <TableCell>{m.apprx_trainee_count}</TableCell>
                                        <TableCell>{formatDateInfo(m.date_created)}</TableCell>
                                      </TableRow>
                                    )) : <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', bgcolor: '#F5F5F5' }}>No coordinator data available</TableCell></TableRow>}
                                  </TableBody>
                                </Table>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 2, pb: 1 }}>Trainee Details</Typography>
                                <Table size="small">
                                  <TableHead><TableRow sx={{ bgcolor: '#37474F' }}>
                                    {['Trainee Name', 'Employee ID', 'Branch', 'Department', 'Email', 'Session', 'Mapped By'].map(h => <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>)}
                                  </TableRow></TableHead>
                                  <TableBody>
                                    {traineesToShow.length > 0 ? traineesToShow.map((t, j) => (
                                      <TableRow key={j} sx={{ '&:nth-of-type(odd)': { bgcolor: '#1A005D20' } }}>
                                        <TableCell>{t.trainee_name}</TableCell><TableCell>{t.trainee_id}</TableCell><TableCell>{t.trainee_branch}</TableCell>
                                        <TableCell>{t.trainee_department}</TableCell><TableCell>{t.trainee_mail}</TableCell><TableCell>{t.session_no}</TableCell><TableCell>{t.coordinator_name}</TableCell>
                                      </TableRow>
                                    )) : <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', bgcolor: '#F5F5F5' }}>No trainee data available for this session</TableCell></TableRow>}
                                  </TableBody>
                                </Table>
                                <TablePagination rowsPerPageOptions={[rowsPerPage]} component="div" count={sessionTrainees.length} rowsPerPage={rowsPerPage} page={currentPage} onPageChange={(e, p) => handlePageChange(e, p, session.session_no)} />
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  }) : <TableRow><TableCell colSpan={7}>No sessions available</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Box>
          </Box>
        </Modal>

        {/* ── View Uploaded Documents Dialog ── */}
        <Dialog open={openFiles} onClose={handleFilesClose} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: '60vh', maxHeight: '90vh', borderRadius: '12px' } }}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1A005D', color: 'white', padding: '16px 24px' }}>
            <Box display="flex" alignItems="center"><DescriptionIcon sx={{ marginRight: '12px' }} /><Typography variant="h6" fontWeight="600">Uploaded Documents</Typography></Box>
            <IconButton aria-label="close" onClick={handleFilesClose} sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ padding: 0, display: 'flex', flexDirection: 'column', backgroundColor: (theme) => theme.palette.grey[50] }}>
            {/* Use a local loading guard — only show spinner while files are being fetched */}
            {openFiles && files.length === 0 && !error && loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, minHeight: '300px' }}><CircularProgress size={60} thickness={4} /></Box>
            ) : (
              <>
                {createdDate && (
                  <Box sx={{ padding: '16px 24px', backgroundColor: 'white', borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
                    <Typography variant="subtitle2" color="textSecondary"><Box component="span" fontWeight="600">Uploaded on:</Box> {createdDate}</Typography>
                  </Box>
                )}
                {files.length > 0 ? (
                  <List sx={{ padding: 0, flexGrow: 1, overflow: 'auto' }}>
                    {files.map((file, i) => {
                      const fileName = file.name || (file.path ? file.path.split('/').pop() : `file-${i}`);
                      const viewUrl = `${API_BASE_URL}/planning-route/generateViewLink/${currentPlanId}/${currentSessionNo}/${encodeURIComponent(fileName)}`;
                      const downloadUrl = `${API_BASE_URL}/planning-route/PlanningSessionAsigningEmpMail/downloadFile/${currentPlanId}/${currentSessionNo}/${encodeURIComponent(fileName)}`;
                      return (
                        <ListItem
                          key={i}
                          sx={{ padding: '12px 24px', borderBottom: (t) => `1px solid ${t.palette.divider}`, '&:hover': { backgroundColor: (t) => t.palette.action.hover } }}
                          secondaryAction={
                            // Always show buttons — do NOT gate on file.size or file.mimetype
                            <Box display="flex" gap={1} alignItems="center">
                              <Tooltip title="Download">
                                <IconButton
                                  edge="end"
                                  onClick={() => handleDownload(fileName)}
                                  disabled={downloadingFile === fileName}
                                  sx={{ '&:hover': { backgroundColor: (t) => t.palette.primary.light, color: '#1A005D' } }}
                                >
                                  {downloadingFile === fileName ? <CircularProgress size={20} /> : <DownloadIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={async () => {
                                  try {
                                    const r = await fetch(viewUrl);
                                    if (!r.ok) throw new Error('Failed to get view link');
                                    const d = await r.json();
                                    if (d.viewURL) window.open(d.viewURL, '_blank');
                                    else window.open(downloadUrl, '_blank'); // fallback: open download link
                                  } catch (e) {
                                    console.error('View error:', e);
                                    // Fallback: try opening download URL directly
                                    window.open(downloadUrl, '_blank');
                                  }
                                }}
                                startIcon={<VisibilityIcon />}
                                sx={{ textTransform: 'none', borderRadius: '6px', boxShadow: 'none', backgroundColor: '#1A005D', '&:hover': { backgroundColor: '#14004a' } }}
                              >
                                View
                              </Button>
                            </Box>
                          }
                        >
                          <ListItemIcon sx={{ minWidth: '40px' }}>{getFileIcon(fileName)}</ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body1" fontWeight="500" noWrap sx={{ maxWidth: '350px' }}>
                                {fileName}
                              </Typography>
                            }
                            secondary={
                              <>
                                {file.size ? (
                                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                    {formatFileSize(file.size)}
                                  </Typography>
                                ) : null}
                                {file.mimetype ? (
                                  <Typography variant="caption" color="textSecondary" noWrap sx={{ display: 'block', maxWidth: '350px', textOverflow: 'ellipsis' }}>
                                    {file.mimetype}
                                  </Typography>
                                ) : null}
                              </>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, minHeight: '300px', textAlign: 'center', padding: '40px' }}>
                    {error ? (
                      <>
                        <FolderOffIcon sx={{ fontSize: '60px', color: (t) => t.palette.error.light, marginBottom: '16px' }} />
                        <Typography variant="h6" color="error" gutterBottom>Failed to load files</Typography>
                        <Typography variant="body2" color="textSecondary">{error}</Typography>
                      </>
                    ) : (
                      <>
                        <FolderOffIcon sx={{ fontSize: '60px', color: (t) => t.palette.grey[400], marginBottom: '16px' }} />
                        <Typography variant="h6" color="textSecondary" gutterBottom>No Files Uploaded</Typography>
                        <Typography variant="body2" color="textSecondary">There are no files uploaded for this session.</Typography>
                      </>
                    )}
                  </Box>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px', backgroundColor: 'white', borderTop: (t) => `1px solid ${t.palette.divider}` }}>
            <Button onClick={handleFilesClose} variant="outlined" sx={{ borderRadius: '6px', padding: '8px 20px', textTransform: 'none', borderWidth: '2px', '&:hover': { borderWidth: '2px' } }}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* ── Snackbar ── */}
        <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 1400 }}>
          <Alert severity={snackbarSeverity} style={{ background: snackbarSeverity === 'success' ? 'linear-gradient(45deg, rgb(0,185,0), rgb(0,192,10))' : 'linear-gradient(45deg, rgb(255,69,58), rgb(255,99,71))', color: 'white', padding: '14px 28px', fontWeight: '600', textAlign: 'center', borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.2)', minWidth: '300px' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>

        {/* ── Query Chat Button ── */}
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1500 }}>
          <Tooltip title="Submit a Query" arrow>
            <IconButton onClick={() => setIsModalOpen(true)} sx={{ bgcolor: '#1A005D', color: 'white', width: 44, height: 44, borderRadius: '50%', boxShadow: '0px 4px 12px rgba(0,0,0,0.3)', transition: 'all 0.3s ease-in-out', '&:hover': { bgcolor: '#8EC400', transform: 'scale(1.1)' }, animation: 'bounce 1.8s infinite', '@keyframes bounce': { '0%,20%,50%,80%,100%': { transform: 'translateY(0)' }, '40%': { transform: 'translateY(-12px)' }, '60%': { transform: 'translateY(-6px)' } } }}>
              <ChatBubbleOutlineIcon fontSize="large" />
            </IconButton>
          </Tooltip>
          <QuerySubmitModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmitQuery} />
        </Box>

        {/* ── Pagination ── */}
        <div className="pagination-wrapper">
          <TablePagination component="div" count={filteredData.length} page={page} onPageChange={handleChangePage} rowsPerPage={rowsPerPage} onRowsPerPageChange={handleChangeRowsPerPage} />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardContent;