import React, { useState, useEffect } from "react";
import {
  Typography,
  Alert,
  Snackbar,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TablePagination,
  Box,
  Chip,
  CircularProgress,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Rating,
  Grid,
// Icons (now from icons-material)
} from "@mui/material";
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SchoolIcon from '@mui/icons-material/School';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import HelpIcon from '@mui/icons-material/Help';
import Avatar from '@mui/material/Avatar';
import {
  Close as CloseIcon,
  Block as BlockIcon,
  Message as MessageIcon,
  PictureAsPdf as PictureAsPdfIcon,
  InfoOutlined as InfoOutlinedIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { DownloadIcon, FileTextIcon } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import axios from "axios";
import logo from '../../../images/NEIN-Logo.jpg';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';


const FeedbackReports = () => {
  const [sessions, setSessions] = useState([]);
const [wordExportLoading, setWordExportLoading] = useState(false);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedSession, setSelectedSession] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [trainerFeedback, setTrainerFeedback] = useState(null);
  const [traineeFeedbacks, setTraineeFeedbacks] = useState([]);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
const [mainTab, setMainTab] = useState(0);
const [exportLoading, setExportLoading] = useState(false);
const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [effectivenessData, setEffectivenessData] = useState(null);
const [effectivenessLoading, setEffectivenessLoading] = useState(false);



const [order, setOrder] = useState('asc');
const [orderBy, setOrderBy] = useState('Training Topic'); // Default sort by Training Topic
// Sorting functions
const handleRequestSort = (property) => {
  const isAsc = orderBy === property && order === 'asc';
  setOrder(isAsc ? 'desc' : 'asc');
  setOrderBy(property);
};

const stableSort = (array, comparator) => {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
};

const getComparator = (order, orderBy) => {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
};

const descendingComparator = (a, b, orderBy) => {
  // Handle null/undefined values
  if (b[orderBy] == null && a[orderBy] == null) return 0;
  if (b[orderBy] == null) return -1;
  if (a[orderBy] == null) return 1;
  
  // Special handling for dates
  if (orderBy === 'Training Date') {
  try {
    const parseDate = (dateStr) => {
      const [day, month, year] = dateStr.split(/[/-]/);
      return new Date(`${year}-${month}-${day}`);
    };
    
    const dateA = parseDate(a[orderBy]);
    const dateB = parseDate(b[orderBy]);
    
    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
      return String(a[orderBy]).localeCompare(String(b[orderBy]));
    }
    
    if (dateB < dateA) return -1;
    if (dateB > dateA) return 1;
    return 0;
  } catch (e) {
    return String(a[orderBy]).localeCompare(String(b[orderBy]));
  }
}
  
  // Numeric comparison for numeric fields
  if (['Participants', 'Trainee Feedbacks'].includes(orderBy)) {
    return (b[orderBy] || 0) - (a[orderBy] || 0);
  }
  
  // Default string comparison
  if (String(b[orderBy]).toLowerCase() < String(a[orderBy]).toLowerCase()) return -1;
  if (String(b[orderBy]).toLowerCase() > String(a[orderBy]).toLowerCase()) return 1;
  return 0;
};
  // Fetch training sessions
// const fetchTrainingSessions = async () => {
//   try {
//     setLoading(true);
//     setError(null);
//     console.log("==== Start Fetching Reports ====");

//     // Get user details
//     const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
//     const { userRole, branch_id, department_id } = userDetails || {};
    
//     // Fetch permissions
//     const permissionsResponse = await axios.post(
//       `${API_BASE_URL}/roleRoutes/roleMaster/FunctionalityListforRoleManagement`,
//       { userRole }
//     );
// console.log("userRole",userRole);

//     const permissionData = permissionsResponse.data || {};
//     let allowedBranchIds = permissionData["Branch Assign"]?.["Branch Select"]?.["Branch List"]?.map(String) || [];
//     let allowedDeptIds = permissionData["Department Assign"]?.["Department Select"]?.["Department List"]?.map(String) || [];
// console.log("allowedBranchIds",allowedBranchIds.join(","));
// console.log("allowedDeptIds",allowedDeptIds.join(","));

//     if (branch_id) allowedBranchIds = [String(branch_id)];
//     if (department_id) allowedDeptIds = [String(department_id)];

//     // Fetch reports - with proper error handling
//     const reportsResponse = await axios.post(`${API_BASE_URL}/reports/FeedBackReportsCombined`, {
//       branch_list: allowedBranchIds.join(","),
//       department_list: allowedDeptIds.join(","),
      
//     });

//     // ✅ SAFE DATA HANDLING - 3 layers of protection
//     const rawData = reportsResponse?.data;
//     let reportsData = [];
    
//     if (Array.isArray(rawData)) {
//       reportsData = rawData; // Direct array
//     } 
//     else if (rawData && typeof rawData === 'object') {
//       // Check for common nested patterns
//       reportsData = rawData.data || rawData.items || rawData.results || [];
//     }
// console.log("reportsData",reportsData);

//     // Format data only if array exists
//     const formattedData = reportsData.map((item, index) => ({
//       ...item,
//       SLNO: index + 1,
//     }));
// console.log("formattedData",formattedData );
//     setSessions(formattedData);
//     setFilteredSessions(formattedData);

//   } catch (err) {
//     console.error("Error Fetching Reports:", err);
//     setError(err.response?.data?.message || err.message || "Failed to load reports");
//     // Reset to empty arrays to prevent render errors
//     setSessions([]);
//     setFilteredSessions([]);
//   } finally {
//     setLoading(false);
//     console.log("==== Fetching Reports Completed ====");
//   }
// };

const fetchTrainingSessions = async () => {
  try {
    console.log("======================================");
    console.log("🚀 FETCH TRAINING SESSIONS - START");
    console.log("======================================");

    setLoading(true);
    setError(null);

    /* ----------------------------------
       1️⃣ USER DETAILS (FOR ROLE ONLY)
    ---------------------------------- */
    const userDetailsRaw = sessionStorage.getItem("userDetails");
    console.log("📦 sessionStorage userDetails (raw):", userDetailsRaw);

    const userDetails = JSON.parse(userDetailsRaw) || {};
    const { userRole } = userDetails || {};

    console.log("👤 userRole:", userRole);

    /* ----------------------------------
       2️⃣ FETCH PERMISSIONS
    ---------------------------------- */
    console.log("🔐 Fetching permissions for role:", userRole);

    const permissionsResponse = await axios.post(
      `${API_BASE_URL}/roleRoutes/roleMaster/FunctionalityListforRoleManagement`,
      { userRole }
    );

    console.log("✅ permissionsResponse.data:", permissionsResponse.data);

    const permissionData = permissionsResponse.data || {};

    /* ----------------------------------
       3️⃣ EXTRACT ALLOWED IDS (SOURCE OF TRUTH)
    ---------------------------------- */
    const allowedBranchIds =
      permissionData?.["Branch Assign"]?.["Branch Select"]?.["Branch List"]?.map(String) || [];

    const allowedDeptIds =
      permissionData?.["Department Assign"]?.["Department Select"]?.["Department List"]?.map(String) || [];

    console.log("✅ allowedBranchIds (permission-based):", allowedBranchIds);
    console.log("✅ allowedDeptIds (permission-based):", allowedDeptIds);

    /* ----------------------------------
       4️⃣ REPORT API PAYLOAD (NO OVERWRITE)
    ---------------------------------- */
    const payload = {
      branch_list: allowedBranchIds.join(","),
      department_list: allowedDeptIds.join(","),
    };

    console.log("🚀 REPORTS API PAYLOAD:", payload);
    console.log("branch_list:", payload.branch_list);
    console.log("department_list:", payload.department_list);

    /* ----------------------------------
       5️⃣ FETCH REPORTS
    ---------------------------------- */
    const reportsResponse = await axios.post(
      `${API_BASE_URL}/reports/FeedBackReportsCombined`,
      payload
    );

    console.log("📊 reportsResponse.data:", reportsResponse.data);

    /* ----------------------------------
       6️⃣ SAFE DATA EXTRACTION
    ---------------------------------- */
    const rawData = reportsResponse?.data;
    let reportsData = [];

    if (Array.isArray(rawData)) {
      reportsData = rawData;
    } else if (rawData && typeof rawData === "object") {
      reportsData = rawData.data || rawData.items || rawData.results || [];
    }

    console.log("📑 Final reportsData:", reportsData);

    /* ----------------------------------
       7️⃣ FORMAT DATA
    ---------------------------------- */
    const formattedData = reportsData.map((item, index) => ({
      ...item,
      SLNO: index + 1,
    }));

    setSessions(formattedData);
    setFilteredSessions(formattedData);

    console.log("✅ FETCH SUCCESS");
  } catch (err) {
    console.error("❌ ERROR FETCHING REPORTS:", err);

    setError(
      err?.response?.data?.message ||
      err?.message ||
      "Failed to load reports"
    );

    setSessions([]);
    setFilteredSessions([]);
  } finally {
    setLoading(false);
    console.log("======================================");
    console.log("🏁 FETCH TRAINING SESSIONS - END");
    console.log("======================================");
  }
};

const fetchFeedbackDetails = async (planing_id, session_no) => {
  try {
    setLoading(true);

    // Fetch all three in parallel
    const [trainerResponse, trainerDetailsRes, traineeResponse] = await Promise.all([
      axios.post(`${API_BASE_URL}/reports/TrainerFeedbackDetails`, {
        planing_id: planing_id,
        session_no: session_no.toString()
      }),
      axios.post(`${API_BASE_URL}/planning-route/session/list`, {
        planing_id: planing_id
      }),
      axios.post(`${API_BASE_URL}/reports/TraineeFeedbackDetails`, {
        planing_id: planing_id,
        session_no: session_no.toString()
      })
    ]);

    console.log("Trainer feedback response:", trainerResponse.data);
    console.log("Trainee feedbacks response:", traineeResponse.data);

    const isTrainerFeedbackSubmitted = trainerResponse.data &&
      trainerResponse.data !== "no" &&
      trainerResponse.data.feedback_form_answer !== null;

    // Find matching session to get trainer_code
      const sessionMatch = (trainerDetailsRes.data?.trainers || [])
        .find(s => String(s.session_no) === String(session_no));

      // ── Fetch department using trainer_code from leavemanagement ──
      let trainer_department = '';
      if (sessionMatch?.trainer_code) {
        try {
          const empRes = await axios.post(`${API_BASE_URL}/login/activeEmplList1`);
          const empList = empRes.data?.employees || [];
          const match = empList.find(e => 
            String(e.emp_id) === String(sessionMatch.trainer_code)
          );
          if (match) {
            trainer_department = match.department_name || '';
          }
        } catch (e) {
          console.warn('Could not fetch trainer department:', e);
        }
      }
      // ─────────────────────────────────────────────────────────────

      // ── Single setTrainerFeedback call with everything merged ──
      setTrainerFeedback(isTrainerFeedbackSubmitted ? {
        ...trainerResponse.data,
        trainer_code: sessionMatch?.trainer_code || '',
        trainer_department: trainer_department              // ← now populated
      } : null);

    setTraineeFeedbacks(
      traineeResponse.data === "no" || traineeResponse.data.length === 0
        ? []
        : traineeResponse.data
    );

    setLoading(false);
  } catch (err) {
    console.error('Error fetching feedback details:', {
      message: err.message,
      response: err.response?.data,
      config: err.config
    });
    setError(err.response?.data?.message || err.message);
    setLoading(false);
  }
};
  useEffect(() => {
    fetchTrainingSessions();
  }, []);

  const RATING_QUESTION_KEYS = ['1','2','3','4','5','6','7','8','9','10','11'];
const TEXT_QUESTION_KEYS   = ['12','13','14'];

  const trainerQuestions = trainerFeedback?.feedback_form_question
  ? JSON.parse(trainerFeedback.feedback_form_question)
  : {};

const trainerAnswers = trainerFeedback?.feedback_form_answer
  ? JSON.parse(trainerFeedback.feedback_form_answer)
  : {};

  // Filter sessions based on search text
// Update the filtering useEffect with this corrected date handling
useEffect(() => {
  const results = sessions.filter((session) => {
    const matchesSearch = searchText === "" || 
      Object.values(session).some(value => 
        value?.toString().toLowerCase().includes(searchText.toLowerCase())
      );

    // Date filtering logic
    const sessionDateStr = session['Training Date'];
    const [day, month, year] = sessionDateStr.split(/[/-]/); // Handle both DD/MM/YYYY and YYYY-MM-DD formats
    const sessionDate = new Date(`${year}-${month}-${day}`);
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    // Reset time components for accurate comparison
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
    sessionDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    let matchesDate = true;
    if (start && sessionDate < start) matchesDate = false;
    if (end && sessionDate > end) matchesDate = false;

    return matchesSearch && matchesDate;
  });

  setFilteredSessions(results);
  setPage(0);
}, [sessions, searchText, startDate, endDate]);
  
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

  const handleSessionClick = async (session) => {
    console.log("Selected session object:", session);
    setSelectedSession(session);
    await fetchFeedbackDetails(session.planing_id, session.session_no);
    await fetchEffectivenessData(session.planing_id, session.session_no);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSession(null);
    setTrainerFeedback(null); 
    setTraineeFeedbacks([]);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Export to PDF
  const exportToPDF = async (type) => {
    try {
      setLoading(true);
      
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([650, 850]);
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Add logo
      try {
        const logoImage = await fetch(logo).then(res => res.arrayBuffer());
        const image = await pdfDoc.embedJpg(logoImage);
        const imageSize = image.scale(0.5);
        page.drawImage(image, {
          x: 30,
          y: height - 100,
          width: imageSize.width,
          height: imageSize.height,
        });
      } catch (error) {
        console.warn('Error adding logo:', error);
      }
        let yPosition = height - 150;
        if (type !== 'trainer') {

      // Add title
      page.drawText('NIPPON EXPRESS (INDIA) PVT. LTD.', {
        x: 200,
        y: height - 70,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      page.drawText('TRAINING FEEDBACK REPORT', {
        x: 200,
        y: height - 100,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      // Add training details
    
      
      page.drawText(`Training Title: ${selectedSession['Training Topic']}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
      });
      yPosition -= 30;
      
      page.drawText(`Trainer Name: ${selectedSession['Trainer Name']}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
      });
      yPosition -= 30;
      
      page.drawText(`Date: ${selectedSession['Training Date']}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
      });
      yPosition -= 30;
      
      page.drawText(`Department: ${selectedSession.Dept}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
      });
      yPosition -= 40;
    }
      const drawWrappedText = (page, text, x, y, maxWidth, font, size) => {
  const words = text.split(' ');
  let line = '';
  const lines = [];

  words.forEach(word => {
    const testLine = line + word + ' ';
    const width = font.widthOfTextAtSize(testLine, size);
    if (width > maxWidth) {
      lines.push(line);
      line = word + ' ';
    } else {
      line = testLine;
    }
  });

  lines.push(line);

  lines.forEach((l, i) => {
    page.drawText(l, {
      x,
      y: y - i * (size + 4),
      size,
      font,
    });
  });

  return y - lines.length * (size + 6);
};

   // Replace the entire trainer section in your exportToPDF function with this:

if (type === 'trainer' && trainerFeedback) {
  // Helper function to wrap text
  const wrapText = (text, maxWidth, fontSize, font) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  // Add logo (if available)
  // try {
  //   const logoImage = await fetch(logo).then(res => res.arrayBuffer());
  //   const image = await pdfDoc.embedJpg(logoImage);
  //   const imageSize = image.scale(0.45);
  //   page.drawImage(image, {
  //     x: 20,
  //     y: height - 90,
  //     width: imageSize.width,
  //     height: imageSize.height,
  //   });
  // } catch (error) {
  //   console.warn('Error adding logo:', error);
  // }

  // HEADER TABLE
  const headerTableX = 130;
  const headerTableY = height - 30;
  const headerColWidths = [250, 120, 90];

  page.drawRectangle({
    x: headerTableX,
    y: headerTableY - 80,
    width: headerColWidths.reduce((a, b) => a + b),
    height: 80,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // Vertical lines
  let currentHeaderX = headerTableX;
  headerColWidths.slice(0, -1).forEach(width => {
    currentHeaderX += width;
    page.drawLine({
      start: { x: currentHeaderX, y: headerTableY },
      end: { x: currentHeaderX, y: headerTableY - 80 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
  });

  // Horizontal lines
  for (let i = 0; i <= 4; i++) {
    page.drawLine({
      start: { x: headerTableX, y: headerTableY - i * 20 },
      end: { x: headerTableX + headerColWidths.reduce((a, b) => a + b), y: headerTableY - i * 20 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
  }

  // Company info
  page.drawText('NIPPON EXPRESS (INDIA)PVT. LTD.', {
    x: headerTableX + 5,
    y: headerTableY - 15,
    size: 10,
    font: boldFont,
  });
  page.drawText('HUMAN RESOURCE DEVELOPMENT', {
    x: headerTableX + 5,
    y: headerTableY - 35,
    size: 10,
    font: boldFont,
  });
  page.drawText("TRAINER'S FEEDBACK FORM", {
    x: headerTableX + 5,
    y: headerTableY - 55,
    size: 10,
    font: boldFont,
  });

  // Metadata
  const metaCol1X = headerTableX + headerColWidths[0] + 5;
  const metaCol2X = headerTableX + headerColWidths[0] + headerColWidths[1] + 5;

  page.drawText('Doc Ref', { x: metaCol1X, y: headerTableY - 15, size: 9, font: boldFont });
  page.drawText('NEIN/HRD/F/08', { x: metaCol2X, y: headerTableY - 15, size: 9, font: font });

  page.drawText('Effective Date', { x: metaCol1X, y: headerTableY - 35, size: 9, font: boldFont });
  page.drawText('01-01-2026', { x: metaCol2X, y: headerTableY - 35, size: 9, font: font });

  page.drawText('Rev No. & Date', { x: metaCol1X, y: headerTableY - 55, size: 9, font: boldFont });
  page.drawText('00', { x: metaCol2X, y: headerTableY - 55, size: 9, font: font });
  page.drawText('01/01/2026', { x: metaCol2X + 30, y: headerTableY - 55, size: 9, font: font });

  page.drawText('Page No.', { x: metaCol1X, y: headerTableY - 75, size: 9, font: boldFont });
  page.drawText('1 OF 1', { x: metaCol2X, y: headerTableY - 75, size: 9, font: font });

  // TRAINING INFO TABLE
  let yPosition = height - 120;
  const tableX = 20;
  const tableWidth = 572;

  // Training Title row
  page.drawRectangle({
    x: tableX,
    y: yPosition - 20,
    width: tableWidth,
    height: 20,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  page.drawLine({
    start: { x: tableX + 100, y: yPosition },
    end: { x: tableX + 100, y: yPosition - 20 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  page.drawLine({
    start: { x: tableX + 472, y: yPosition },
    end: { x: tableX + 472, y: yPosition - 20 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  page.drawText('Training Title:', { x: tableX + 5, y: yPosition - 14, size: 9, font: boldFont });
  page.drawText(selectedSession['Training Topic'] || '', { x: tableX + 105, y: yPosition - 14, size: 9, font: font, maxWidth: 360 });
  page.drawText('Date:', { x: tableX + 477, y: yPosition - 14, size: 9, font: boldFont });

  yPosition -= 20;

  // Trainer Name row
  page.drawRectangle({
    x: tableX,
    y: yPosition - 20,
    width: tableWidth,
    height: 20,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  page.drawLine({
    start: { x: tableX + 100, y: yPosition },
    end: { x: tableX + 100, y: yPosition - 20 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  page.drawLine({
    start: { x: tableX + 472, y: yPosition },
    end: { x: tableX + 472, y: yPosition - 20 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  page.drawText('Trainer Name:', { x: tableX + 5, y: yPosition - 14, size: 9, font: boldFont });
  page.drawText(selectedSession['Trainer Name'] || '', { x: tableX + 105, y: yPosition - 14, size: 9, font: font, maxWidth: 360 });
  page.drawText('Time:', { x: tableX + 477, y: yPosition - 14, size: 9, font: boldFont });

  yPosition -= 20;

  // Instruction text
  page.drawRectangle({
    x: tableX,
    y: yPosition - 18,
    width: tableWidth,
    height: 18,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  page.drawText('Please take a few moments to provide us with some important feedback about the training', {
    x: tableX + 5,
    y: yPosition - 13,
    size: 9,
    font: font,
  });

  yPosition -= 18;

  // FEEDBACK SECTIONS
  const questions = JSON.parse(trainerFeedback.feedback_form_question || '{}');
  const answers = JSON.parse(trainerFeedback.feedback_form_answer || '{}');

  const sections = [
    { num: '1', title: 'Overall, Session Feedback', keys: ['1', '2'] },
    { num: '2', title: 'Interaction & Participation Insights', keys: ['3', '4'] },
    { num: '3', title: 'Participant with Excellent Involvement', keys: ['5', '6'] },
    { num: '4', title: 'Participant with Minimal Contribution', keys: ['7', '8'] },
    { num: '5', title: 'Suggestions for Improvement', keys: ['9'] },
  ];

  const alphabet = ['a', 'b'];

  sections.forEach(section => {
    // Section header row
    page.drawRectangle({
      x: tableX,
      y: yPosition - 20,
      width: tableWidth,
      height: 20,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    page.drawLine({
      start: { x: tableX + 30, y: yPosition },
      end: { x: tableX + 30, y: yPosition - 20 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    page.drawText(section.num, { x: tableX + 12, y: yPosition - 14, size: 10, font: boldFont });
    page.drawText(section.title, { x: tableX + 35, y: yPosition - 14, size: 10, font: boldFont });

    yPosition -= 20;

    // Question/Answer rows
    section.keys.forEach((key, index) => {
      const questionText = questions[key] || '';
      const answerKey = `q${key}`;
      const answerText = answers[answerKey] || '';

      const rowHeight = 50;

      page.drawRectangle({
        x: tableX,
        y: yPosition - rowHeight,
        width: tableWidth,
        height: rowHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      page.drawLine({
        start: { x: tableX + 30, y: yPosition },
        end: { x: tableX + 30, y: yPosition - rowHeight },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      page.drawLine({
        start: { x: tableX + 50, y: yPosition },
        end: { x: tableX + 50, y: yPosition - rowHeight },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      page.drawText(`${alphabet[index]}.`, { x: tableX + 35, y: yPosition - 14, size: 9, font: font });

      const questionLines = wrapText(questionText, 520, 9, font);
      questionLines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: tableX + 55,
          y: yPosition - 14 - (lineIndex * 11),
          size: 9,
          font: font,
        });
      });

      if (answerText) {
        const answerLines = wrapText(answerText, 520, 9, font);
        const startY = yPosition - 14 - (questionLines.length * 11) - 3;
        answerLines.forEach((line, lineIndex) => {
          page.drawText(line, {
            x: tableX + 55,
            y: startY - (lineIndex * 11),
            size: 9,
            font: font,
          });
        });
      }

      yPosition -= rowHeight;
    });
  });

  // FOOTER SECTION
  yPosition -= 5;
  const footerRowHeight = 14;

  const trainerFooterData = [
      { label: 'Name:', value: selectedSession?.['Trainer Name'] || '' },
      { label: 'Employee No (If internal):', value: trainerFeedback?.trainer_code || '' },
      { label: 'Dept. Name (If internal):', value: trainerFeedback?.trainer_department || '' },
      { label: 'Date:', value: new Date(trainerFeedback?.feedback_form_submition_date || Date.now()).toLocaleDateString() },
      { label: 'Sign:', value: selectedSession?.['Trainer Name'] || '' },
    ];

    trainerFooterData.forEach(({ label, value }) => {
      page.drawRectangle({
        x: tableX,
        y: yPosition - footerRowHeight,
        width: tableWidth,
        height: footerRowHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      page.drawText(label, { x: tableX + 5, y: yPosition - 13, size: 9, font: boldFont });
      page.drawText(String(value), { x: tableX + 180, y: yPosition - 13, size: 9, font: font });  // ← value added
      yPosition -= footerRowHeight;
    });
}

 else if (type === 'trainee' && traineeFeedbacks.length > 0) {
  page.drawText('Trainee Feedback Summary:', {
    x: 50,
    y: yPosition,
    size: 14,
    font: boldFont,
  });
  yPosition -= 30;

  /* ---------- AVERAGE RATINGS (ONLY Q1–Q11) ---------- */
const questions = JSON.parse(traineeFeedbacks[0]?.feedback_form_question || '{}');

const totals = {};
const counts = {};

RATING_QUESTION_KEYS.forEach(k => {
  totals[k] = 0;
  counts[k] = 0;
});

traineeFeedbacks.forEach(fb => {
  if (!fb.feedback_form_answer || fb.feedback_form_answer === '{}') return;
  const answers = JSON.parse(fb.feedback_form_answer);

  RATING_QUESTION_KEYS.forEach(k => {
    const val = Number(answers[k]);
    if (!Number.isNaN(val)) {
      totals[k] += val;
      counts[k]++;
    }
  });
});

RATING_QUESTION_KEYS.forEach(k => {
  if (!questions[k]) return;

  const avg = counts[k] > 0 ? (totals[k] / counts[k]).toFixed(1) : 'N/A';

  page.drawText(`${questions[k]}`, {
    x: 50,
    y: yPosition,
    size: 10,
    font,
  });

  page.drawText(`${avg}/5`, {
    x: 480,
    y: yPosition,
    size: 10,
    font,
  });

  yPosition -= 18;
});

  /* ---------- TEXT RESPONSES (Q12–Q14) ---------- */
  yPosition -= 10;
page.drawText('Qualitative Feedback', {
  x: 50,
  y: yPosition,
  size: 12,
  font: boldFont,
});
yPosition -= 20;

TEXT_QUESTION_KEYS.forEach(k => {
  if (!questions[k]) return;

  page.drawText(questions[k], {
    x: 50,
    y: yPosition,
    size: 10,
    font: boldFont,
  });

  yPosition -= 14;

  traineeFeedbacks.forEach(fb => {
    const answers = JSON.parse(fb.feedback_form_answer || '{}');
    if (answers[k]) {
      yPosition = drawWrappedText(
        page,
        `• ${answers[k]}`,
        65,
        yPosition,
        460,
        font,
        10
      );
      yPosition -= 6;
    }
  });

  yPosition -= 12;
});

}
 else {
        // No feedback available message
        page.drawText(`No ${type} feedback available for this session`, {
          x: 50,
          y: yPosition,
          size: 12,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
      
      const pdfBytes = await pdfDoc.save();
      saveAs(new Blob([pdfBytes]), `${selectedSession['Training Topic']}_${type}_feedback.pdf`);
      
    } catch (err) {
      console.error('PDF export error:', err);
      setError('Failed to export PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  // Export to Excel
  const exportToExcel = async () => {
    try {
      setLoading(true);
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Feedback Report');
      
      // Add headers
      worksheet.addRow(['Training Feedback Report']);
      worksheet.addRow(['NIPPON EXPRESS (INDIA) PVT. LTD.']);
      worksheet.addRow([]);
      
      // Add training details
      worksheet.addRow(['Training Title:', selectedSession['Training Topic']]);
      worksheet.addRow(['Trainer Name:', selectedSession['Trainer Name']]);
      worksheet.addRow(['Date:', selectedSession['Training Date']]);
      worksheet.addRow(['Department:', selectedSession.Dept]);
      worksheet.addRow([]);
      
      if (trainerFeedback) {
        // Add trainer feedback
        worksheet.addRow(['Trainer Feedback:']);
        // Inside the Trainer Feedback section of the DialogContent
        const questions = JSON.parse(trainerFeedback.feedback_form_question || '{}');
        const answers = JSON.parse(trainerFeedback.feedback_form_answer || '{}');
        
        worksheet.addRow(['Question', 'Rating']);
        Object.keys(questions).forEach((key) => {
          worksheet.addRow([questions[key], answers[key]]);
        });
        
        if (trainerFeedback.feedback_form_comments_or_suggestions) {
          worksheet.addRow([]);
          worksheet.addRow(['Comments:', trainerFeedback.feedback_form_comments_or_suggestions]);
        }
        
        worksheet.addRow([]);
      } else {
        worksheet.addRow(['Trainer Feedback: Not Available']);
        worksheet.addRow([]);
      }
      
      if (traineeFeedbacks.length > 0) {
        // Add trainee feedback
        worksheet.addRow(['Trainee Feedback Summary:']);
        // Inside the Trainee Feedback Summary section
        const questions = JSON.parse(traineeFeedbacks[0]?.feedback_form_question || '{}');
        const questionKeys = Object.keys(questions);
        
        // Calculate averages
        const averages = {};
        questionKeys.forEach(key => {
          averages[key] = 0;
        });
        
        let feedbackCount = 0;
        traineeFeedbacks.forEach(feedback => {
          if (feedback.feedback_form_answer && feedback.feedback_form_answer !== '{}') {
            const answers = JSON.parse(feedback.feedback_form_answer);
            questionKeys.forEach(key => {
              if (answers[key]) {
                averages[key] += parseInt(answers[key]);
              }
            });
            feedbackCount++;
          }
        });
        
        questionKeys.forEach(key => {
          averages[key] = feedbackCount > 0 ? (averages[key] / feedbackCount).toFixed(1) : 'N/A';
        });
        
        // Add averages
        worksheet.addRow(['Question', 'Average Rating']);
        questionKeys.forEach((key) => {
          worksheet.addRow([questions[key], averages[key]]);
        });
        
        // Add individual feedbacks
        worksheet.addRow([]);
        worksheet.addRow(['Individual Trainee Feedback:']);
        worksheet.addRow(['Name', 'Department', 'Branch', 'Overall Rating', 'Comments']);
        
        traineeFeedbacks.forEach(feedback => {
          const overallRating = feedback.feedback_form_answer && feedback.feedback_form_answer !== '{}' ? 
            JSON.parse(feedback.feedback_form_answer)['8'] || 'N/A' : 'Not submitted';
            
          worksheet.addRow([
            feedback.trainee_name,
            feedback.trainee_department,
            feedback.trainee_branch,
            overallRating,
            feedback.feedback_form_comments_or_suggestions || '-'
          ]);
        });
      } else {
        worksheet.addRow(['Trainee Feedback: Not Available']);
      }
      
      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `${selectedSession['Training Topic']}_feedback_report.xlsx`);
      
    } catch (err) {
      console.error('Excel export error:', err);
      setError('Failed to export Excel: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


 const exportIndividualFeedback = async (feedback) => {
  try {
    setLoading(true);
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    
    // Helper function to wrap text
    const wrapText = (text, maxWidth, fontSize, font) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines;
    };
    
    // Add full page border with margin
    page.drawRectangle({
      x: 10,
      y: 10,
      width: width - 20,
      height: height - 20,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Add logo (if available)
    try {
      const logoImage = await fetch(logo).then(res => res.arrayBuffer());
      const image = await pdfDoc.embedJpg(logoImage);
      const imageSize = image.scale(0.45);
      page.drawImage(image, {
        x: 20,
        y: height - 90,
        width: imageSize.width,
        height: imageSize.height,
      });
    } catch (error) {
      console.warn('Error adding logo:', error);
    }

    // HEADER SECTION
    const headerTableX = 130;
    const headerTableY = height - 30;
    const headerColWidths = [250, 120, 90];

    // Draw the header table borders
    page.drawRectangle({
      x: headerTableX,
      y: headerTableY - 80,
      width: headerColWidths.reduce((a, b) => a + b),
      height: 80,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Vertical lines for header table
    let currentHeaderX = headerTableX;
    headerColWidths.slice(0, -1).forEach(width => {
      currentHeaderX += width;
      page.drawLine({
        start: { x: currentHeaderX, y: headerTableY },
        end: { x: currentHeaderX, y: headerTableY - 80 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    });

    // Horizontal lines (4 lines for 5 rows including Page No)
    for (let i = 0; i <= 4; i++) {
      page.drawLine({
        start: { x: headerTableX, y: headerTableY - i * 20 },
        end: { x: headerTableX + headerColWidths.reduce((a, b) => a + b), y: headerTableY - i * 20 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }

    // Left Column - Company info
    page.drawText('NIPPON EXPRESS (INDIA) PVT. LTD.', {
      x: headerTableX + 5,
      y: headerTableY - 15,
      size: 11,
      font: boldFont,
    });
    page.drawText('HUMAN RESOURCE DEVELOPMENT', {
      x: headerTableX + 5,
      y: headerTableY - 35,
      size: 11,
      font: boldFont,
    });
    page.drawText('TRAINING FEEDBACK FORM', {
      x: headerTableX + 5,
      y: headerTableY - 55,
      size: 11,
      font: boldFont,
    });

    // Right Columns - Document Metadata
    const metaCol1X = headerTableX + headerColWidths[0] + 5;
    page.drawText('Doc Ref', {
      x: metaCol1X,
      y: headerTableY - 15,
      size: 10,
      font: boldFont,
    });
    page.drawText('Effective Date', {
      x: metaCol1X,
      y: headerTableY - 35,
      size: 10,
      font: boldFont,
    });
    page.drawText('Rev No. &Date', {
      x: metaCol1X,
      y: headerTableY - 55,
      size: 10,
      font: boldFont,
    });
    page.drawText('Page No.', {
      x: metaCol1X,
      y: headerTableY - 75,
      size: 10,
      font: boldFont,
    });

    const metaCol2X = headerTableX + headerColWidths[0] + headerColWidths[1] + 5;
    page.drawText('NEIN/HRD/F/03', {
      x: metaCol2X,
      y: headerTableY - 15,
      size: 10,
      font: font,
    });
    page.drawText('01-12-2021', {
      x: metaCol2X,
      y: headerTableY - 35,
      size: 10,
      font: font,
    });
    page.drawText('01-01-2026', {
      x: metaCol2X,
      y: headerTableY - 55,
      size: 10,
      font: font,
    });
    page.drawText('1 OF 1', {
      x: metaCol2X,
      y: headerTableY - 75,
      size: 10,
      font: font,
    });

    // TRAINING DETAILS SECTION
    let yPosition = height - 130; // Reduced from 130
    const trainingDetailsColWidths = [80, 340, 50, 100];
    const trainingDetailsTableX = 20;

    page.drawRectangle({
      x: trainingDetailsTableX,
      y: yPosition - 40,
      width: trainingDetailsColWidths.reduce((a, b) => a + b),
      height: 40,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    let currentTrainingX = trainingDetailsTableX;
    trainingDetailsColWidths.slice(0, -1).forEach(width => {
      currentTrainingX += width;
      page.drawLine({
        start: { x: currentTrainingX, y: yPosition },
        end: { x: currentTrainingX, y: yPosition - 40 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    });

    page.drawLine({
      start: { x: trainingDetailsTableX, y: yPosition - 20 },
      end: { x: trainingDetailsTableX + trainingDetailsColWidths.reduce((a, b) => a + b), y: yPosition - 20 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    page.drawText('Training Title:', {
      x: trainingDetailsTableX + 5,
      y: yPosition - 15,
      size: 10,
      font: font,
    });
    page.drawText(selectedSession['Training Topic'] || '', {
      x: trainingDetailsTableX + trainingDetailsColWidths[0] + 5,
      y: yPosition - 15,
      size: 10,
      font: font,
      maxWidth: trainingDetailsColWidths[1] - 10,
    });

    page.drawText('Date:', {
      x: trainingDetailsTableX + trainingDetailsColWidths[0] + trainingDetailsColWidths[1] + 5,
      y: yPosition - 15,
      size: 10,
      font: font,
    });
    page.drawText(selectedSession['Training Date'] || '', {
      x: trainingDetailsTableX + trainingDetailsColWidths[0] + trainingDetailsColWidths[1] + trainingDetailsColWidths[2] + 5,
      y: yPosition - 15,
      size: 10,
      font: font,
    });

    page.drawText('Trainer Name:', {
      x: trainingDetailsTableX + 5,
      y: yPosition - 35,
      size: 10,
      font: font,
    });
    page.drawText(selectedSession['Trainer Name'] || '', {
      x: trainingDetailsTableX + trainingDetailsColWidths[0] + 5,
      y: yPosition - 35,
      size: 10,
      font: font,
      maxWidth: trainingDetailsColWidths[1] - 10,
    });

    page.drawText('Time:', {
      x: trainingDetailsTableX + trainingDetailsColWidths[0] + trainingDetailsColWidths[1] + 5,
      y: yPosition - 35,
      size: 10,
      font: font,
    });
    page.drawText(`${selectedSession.from_time || ''} - ${selectedSession.to_time || ''}`, {
      x: trainingDetailsTableX + trainingDetailsColWidths[0] + trainingDetailsColWidths[1] + trainingDetailsColWidths[2] + 5,
      y: yPosition - 35,
      size: 10,
      font: font,
    });

    yPosition -= 50; // Reduced from 50

    // INSTRUCTIONS SECTION
    page.drawText('Please take a few moments to provide us with some important feedback about the training', {
      x: 20,
      y: yPosition,
      size: 10,
      font: font,
    });

    yPosition -= 13; // Reduced from 15
    page.drawText('Please select () the rating for each section based on the following criteria:', {
      x: 20,
      y: yPosition,
      size: 10,
      font: font,
    });

    yPosition -= 18; // Reduced from 20
    page.drawText('5 = Excellent      4 = Good      3 = Average      2 = Fair      1 = Poor', {
      x: 60,
      y: yPosition,
      size: 11,
      font: boldFont,
    });

    // FEEDBACK TABLE SECTION
    yPosition -= 13; // Reduced from 15
    const questions = JSON.parse(feedback.feedback_form_question || '{}');
    const answers = JSON.parse(feedback.feedback_form_answer || '{}');
    
    // Separate rating questions (1-11) and text questions (12-14)
    const ratingQuestions = {};
    const textQuestions = {};
    
    Object.keys(questions).forEach(key => {
      if (Number(key) <= 11) {
        ratingQuestions[key] = questions[key];
      } else {
        textQuestions[key] = questions[key];
      }
    });

    // Rating questions table
    const feedbackColWidths = [40, 355, 35, 35, 35, 35, 35];
    const feedbackTableX = 20;
    const ratingRowCount = Object.keys(ratingQuestions).length + 1;
    const rowHeight = 23; // Reduced from 25

    page.drawRectangle({
      x: feedbackTableX,
      y: yPosition - rowHeight * ratingRowCount,
      width: feedbackColWidths.reduce((a, b) => a + b),
      height: rowHeight * ratingRowCount,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Vertical lines
    let currentX = feedbackTableX;
    feedbackColWidths.slice(0, -1).forEach(width => {
      currentX += width;
      page.drawLine({
        start: { x: currentX, y: yPosition },
        end: { x: currentX, y: yPosition - rowHeight * ratingRowCount },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    });

    // Horizontal lines
    for (let i = 0; i <= ratingRowCount; i++) {
      page.drawLine({
        start: { x: feedbackTableX, y: yPosition - i * rowHeight },
        end: { x: feedbackTableX + feedbackColWidths.reduce((a, b) => a + b), y: yPosition - i * rowHeight },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }

    // Header Row
    page.drawText('Points', {
      x: feedbackTableX + 5,
      y: yPosition - 18,
      size: 10,
      font: boldFont,
    });

    ['5', '4', '3', '2', '1'].forEach((val, i) => {
      page.drawText(val, {
        x: feedbackTableX + feedbackColWidths[0] + feedbackColWidths[1] + i * feedbackColWidths[2 + i] + 15,
        y: yPosition - 18,
        size: 10,
        font: boldFont,
      });
    });

    // Rating Questions Rows
    Object.keys(ratingQuestions).forEach((key, index) => {
      const currentY = yPosition - (index + 1) * rowHeight;

      page.drawText(`${key})`, {
        x: feedbackTableX + 5,
        y: currentY - 18,
        size: 10,
        font: font,
      });

      page.drawText(ratingQuestions[key], {
        x: feedbackTableX + feedbackColWidths[0] + 5,
        y: currentY - 18,
        size: 10,
        font: font,
        maxWidth: feedbackColWidths[1] - 10,
      });

      const answer = answers[key];
      if (answer && !isNaN(Number(answer))) {
        const rating = Number(answer);
        const colIndex = 5 - rating;
        page.drawText('YES', {
          x: feedbackTableX + feedbackColWidths[0] + feedbackColWidths[1] + colIndex * feedbackColWidths[2] + 10,
          y: currentY - 18,
          size: 9,
          font: boldFont,
        });
      }
    });

    // Text Questions (12-14) with separate question and answer columns
    yPosition = yPosition - rowHeight * ratingRowCount - 3; // Reduced from 5
    const textRowHeight = 32; // Reduced from 35
    const textQuestionCount = Object.keys(textQuestions).length;

    if (textQuestionCount > 0) {
      const textQuestionColWidths = [40, 270, 260]; // Number, Question, Answer
      
      page.drawRectangle({
        x: feedbackTableX,
        y: yPosition - textRowHeight * textQuestionCount,
        width: textQuestionColWidths.reduce((a, b) => a + b),
        height: textRowHeight * textQuestionCount,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      // Horizontal lines for text questions
      for (let i = 0; i <= textQuestionCount; i++) {
        page.drawLine({
          start: { x: feedbackTableX, y: yPosition - i * textRowHeight },
          end: { x: feedbackTableX + textQuestionColWidths.reduce((a, b) => a + b), y: yPosition - i * textRowHeight },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
      }

      // Vertical line after question number
      page.drawLine({
        start: { x: feedbackTableX + textQuestionColWidths[0], y: yPosition },
        end: { x: feedbackTableX + textQuestionColWidths[0], y: yPosition - textRowHeight * textQuestionCount },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Vertical line after question text (before answer column)
      page.drawLine({
        start: { x: feedbackTableX + textQuestionColWidths[0] + textQuestionColWidths[1], y: yPosition },
        end: { x: feedbackTableX + textQuestionColWidths[0] + textQuestionColWidths[1], y: yPosition - textRowHeight * textQuestionCount },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      Object.keys(textQuestions).forEach((key, index) => {
        const currentY = yPosition - index * textRowHeight;

        // Question number
        page.drawText(`${key})`, {
          x: feedbackTableX + 5,
          y: currentY - 18,
          size: 10,
          font: font,
        });

        // Question text with wrapping
        const questionText = textQuestions[key];
        const questionLines = wrapText(questionText, textQuestionColWidths[1] - 10, 10, font);
        questionLines.forEach((line, lineIndex) => {
          page.drawText(line, {
            x: feedbackTableX + textQuestionColWidths[0] + 5,
            y: currentY - 18 - (lineIndex * 12),
            size: 10,
            font: font,
          });
        });

        // Answer text (in separate column) with wrapping
        const answer = answers[key] || '';
        if (answer) {
          const answerLines = wrapText(answer, textQuestionColWidths[2] - 10, 10, font);
          answerLines.forEach((line, lineIndex) => {
            page.drawText(line, {
              x: feedbackTableX + textQuestionColWidths[0] + textQuestionColWidths[1] + 5,
              y: currentY - 18 - (lineIndex * 12),
              size: 10,
              font: font,
            });
          });
        }
      });

      yPosition -= textRowHeight * textQuestionCount;
    }

     // TRAINEE DETAILS SECTION - 5 rows
    yPosition -= 8; // Reduced from 10
    const detailsRowHeight = 18; // Reduced from 20
    const traineeDetailsWidth = feedbackColWidths.reduce((a, b) => a + b);

    page.drawRectangle({
      x: 20,
      y: yPosition - detailsRowHeight * 5,
      width: traineeDetailsWidth,
      height: detailsRowHeight * 5,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Horizontal lines for 5 rows
    for (let i = 0; i <= 5; i++) {
      page.drawLine({
        start: { x: 20, y: yPosition - i * detailsRowHeight },
        end: { x: 20 + traineeDetailsWidth, y: yPosition - i * detailsRowHeight },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }

    // Row 1 - Name
    page.drawText('Name:', {
      x: 25,
      y: yPosition - 13,
      size: 10,
      font: font,
    });
    page.drawText(feedback.trainee_name || '', {
      x: 150,
      y: yPosition - 13,
      size: 10,
      font: font,
    });

    // Row 2 - Employee No
    page.drawText('Employee No:', {
      x: 25,
      y: yPosition - 31,
      size: 10,
      font: font,
    });
    page.drawText(String(feedback.trainee_id || ''), {
      x: 150,
      y: yPosition - 31,
      size: 10,
      font: font,
    });

    // Row 3 - Dept Name
    page.drawText('Dept. Name:', {
      x: 25,
      y: yPosition - 49,
      size: 10,
      font: font,
    });
    page.drawText(feedback.trainee_department || '', {
      x: 150,
      y: yPosition - 49,
      size: 10,
      font: font,
    });

    // Row 4 - Date
    page.drawText('Date:', {
      x: 25,
      y: yPosition - 67,
      size: 10,
      font: font,
    });
    page.drawText(new Date(feedback.feedback_form_submition_date).toLocaleDateString() || '', {
      x: 150,
      y: yPosition - 67,
      size: 10,
      font: font,
    });

   // Row 5 - Sign
    page.drawText('Sign:', {
      x: 25,
      y: yPosition - 85,
      size: 10,
      font: font,
    });
    page.drawText(feedback.trainee_name || '', {   // ← ADD THIS
      x: 150,
      y: yPosition - 85,
      size: 10,
      font: font,
    });

    yPosition -= detailsRowHeight * 5 + 8; // Reduced from 10

    // FUTURE TOPICS SECTION
    page.drawText('What topics would you like to see covered in future training sessions:', {
      x: 20,
      y: yPosition,
      size: 10,
      font: font,
    });

    const futureTopicsHeight = 35; // Reduced from 40
    page.drawRectangle({
      x: 20,
      y: yPosition - futureTopicsHeight - 5,
      width: traineeDetailsWidth,
      height: futureTopicsHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    if (feedback.feedback_form_comments_or_suggestions) {
      page.drawText(feedback.feedback_form_comments_or_suggestions, {
        x: 25,
        y: yPosition - 20,
        size: 10,
        font: font,
        maxWidth: traineeDetailsWidth - 10,
        lineHeight: 12,
      });
    }

    // Save and download the PDF
    const pdfBytes = await pdfDoc.save();
    saveAs(new Blob([pdfBytes]), `${feedback.trainee_name}_feedback.pdf`);
  } catch (err) {
    console.error('PDF export error:', err);
    setError('Failed to export PDF: ' + err.message);
  } finally {
    setLoading(false);
  }
};
 

 const exportAllIndividualFeedbacks = async () => {
  try {
    setLoading(true);
    const zip = new JSZip();
    
    // Filter out feedbacks that don't have answers
    const validFeedbacks = traineeFeedbacks.filter(
      feedback => feedback.feedback_form_answer && feedback.feedback_form_answer !== '{}'
    );

    if (validFeedbacks.length === 0) {
      setError('No feedbacks with answers available to export');
      return;
    }

    // Helper function to wrap text
    const wrapText = (text, maxWidth, fontSize, font) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines;
    };

    // Generate all PDFs in parallel
    const pdfPromises = validFeedbacks.map(async (feedback) => {
      try {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([612, 792]); // Letter size
        const { width, height } = page.getSize();
        
        // Add full page border with margin
        page.drawRectangle({
          x: 10,
          y: 10,
          width: width - 20,
          height: height - 20,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        // Add logo (if available)
        try {
          const logoImage = await fetch(logo).then(res => res.arrayBuffer());
          const image = await pdfDoc.embedJpg(logoImage);
          const imageSize = image.scale(0.45);
          page.drawImage(image, {
            x: 20,
            y: height - 90,
            width: imageSize.width,
            height: imageSize.height,
          });
        } catch (error) {
          console.warn('Error adding logo:', error);
        }

        // HEADER SECTION
        const headerTableX = 130;
        const headerTableY = height - 30;
        const headerColWidths = [250, 120, 90];

        // Draw the header table borders
        page.drawRectangle({
          x: headerTableX,
          y: headerTableY - 80,
          width: headerColWidths.reduce((a, b) => a + b),
          height: 80,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        // Vertical lines for header table
        let currentHeaderX = headerTableX;
        headerColWidths.slice(0, -1).forEach(width => {
          currentHeaderX += width;
          page.drawLine({
            start: { x: currentHeaderX, y: headerTableY },
            end: { x: currentHeaderX, y: headerTableY - 80 },
            thickness: 1,
            color: rgb(0, 0, 0),
          });
        });

        // Horizontal lines (4 lines for 5 rows including Page No)
        for (let i = 0; i <= 4; i++) {
          page.drawLine({
            start: { x: headerTableX, y: headerTableY - i * 20 },
            end: { x: headerTableX + headerColWidths.reduce((a, b) => a + b), y: headerTableY - i * 20 },
            thickness: 1,
            color: rgb(0, 0, 0),
          });
        }

        // Left Column - Company info
        page.drawText('NIPPON EXPRESS (INDIA) PVT. LTD.', {
          x: headerTableX + 5,
          y: headerTableY - 15,
          size: 11,
          font: boldFont,
        });
        page.drawText('HUMAN RESOURCE DEVELOPMENT', {
          x: headerTableX + 5,
          y: headerTableY - 35,
          size: 11,
          font: boldFont,
        });
        page.drawText('TRAINING FEEDBACK FORM', {
          x: headerTableX + 5,
          y: headerTableY - 55,
          size: 11,
          font: boldFont,
        });

        // Right Columns - Document Metadata
        const metaCol1X = headerTableX + headerColWidths[0] + 5;
        page.drawText('Doc Ref', {
          x: metaCol1X,
          y: headerTableY - 15,
          size: 10,
          font: boldFont,
        });
        page.drawText('Effective Date', {
          x: metaCol1X,
          y: headerTableY - 35,
          size: 10,
          font: boldFont,
        });
        page.drawText('Rev No. &Date', {
          x: metaCol1X,
          y: headerTableY - 55,
          size: 10,
          font: boldFont,
        });
        page.drawText('Page No.', {
          x: metaCol1X,
          y: headerTableY - 75,
          size: 10,
          font: boldFont,
        });

        const metaCol2X = headerTableX + headerColWidths[0] + headerColWidths[1] + 5;
        page.drawText('NEIN/HRD/F/03', {
          x: metaCol2X,
          y: headerTableY - 15,
          size: 10,
          font: font,
        });
        page.drawText('01-12-2021', {
          x: metaCol2X,
          y: headerTableY - 35,
          size: 10,
          font: font,
        });
        page.drawText('01-01-2026', {
          x: metaCol2X,
          y: headerTableY - 55,
          size: 10,
          font: font,
        });
        page.drawText('1 OF 1', {
          x: metaCol2X,
          y: headerTableY - 75,
          size: 10,
          font: font,
        });

       
    // TRAINING DETAILS SECTION
    let yPosition = height - 130; // Reduced from 130
    const trainingDetailsColWidths = [80, 340, 50, 100];
    const trainingDetailsTableX = 20;

    page.drawRectangle({
      x: trainingDetailsTableX,
      y: yPosition - 40,
      width: trainingDetailsColWidths.reduce((a, b) => a + b),
      height: 40,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    let currentTrainingX = trainingDetailsTableX;
    trainingDetailsColWidths.slice(0, -1).forEach(width => {
      currentTrainingX += width;
      page.drawLine({
        start: { x: currentTrainingX, y: yPosition },
        end: { x: currentTrainingX, y: yPosition - 40 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    });

    page.drawLine({
      start: { x: trainingDetailsTableX, y: yPosition - 20 },
      end: { x: trainingDetailsTableX + trainingDetailsColWidths.reduce((a, b) => a + b), y: yPosition - 20 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    page.drawText('Training Title:', {
      x: trainingDetailsTableX + 5,
      y: yPosition - 15,
      size: 10,
      font: font,
    });
    page.drawText(selectedSession['Training Topic'] || '', {
      x: trainingDetailsTableX + trainingDetailsColWidths[0] + 5,
      y: yPosition - 15,
      size: 10,
      font: font,
      maxWidth: trainingDetailsColWidths[1] - 10,
    });

    page.drawText('Date:', {
      x: trainingDetailsTableX + trainingDetailsColWidths[0] + trainingDetailsColWidths[1] + 5,
      y: yPosition - 15,
      size: 10,
      font: font,
    });
    page.drawText(selectedSession['Training Date'] || '', {
      x: trainingDetailsTableX + trainingDetailsColWidths[0] + trainingDetailsColWidths[1] + trainingDetailsColWidths[2] + 5,
      y: yPosition - 15,
      size: 10,
      font: font,
    });

    page.drawText('Trainer Name:', {
      x: trainingDetailsTableX + 5,
      y: yPosition - 35,
      size: 10,
      font: font,
    });
    page.drawText(selectedSession['Trainer Name'] || '', {
      x: trainingDetailsTableX + trainingDetailsColWidths[0] + 5,
      y: yPosition - 35,
      size: 10,
      font: font,
      maxWidth: trainingDetailsColWidths[1] - 10,
    });

    page.drawText('Time:', {
      x: trainingDetailsTableX + trainingDetailsColWidths[0] + trainingDetailsColWidths[1] + 5,
      y: yPosition - 35,
      size: 10,
      font: font,
    });
    page.drawText(`${selectedSession.from_time || ''} - ${selectedSession.to_time || ''}`, {
      x: trainingDetailsTableX + trainingDetailsColWidths[0] + trainingDetailsColWidths[1] + trainingDetailsColWidths[2] + 5,
      y: yPosition - 35,
      size: 10,
      font: font,
    });

    yPosition -= 50; // Reduced from 50

    // INSTRUCTIONS SECTION
    page.drawText('Please take a few moments to provide us with some important feedback about the training', {
      x: 20,
      y: yPosition,
      size: 10,
      font: font,
    });

    yPosition -= 13; // Reduced from 15
    page.drawText('Please select () the rating for each section based on the following criteria:', {
      x: 20,
      y: yPosition,
      size: 10,
      font: font,
    });

    yPosition -= 18; // Reduced from 20
    page.drawText('5 = Excellent      4 = Good      3 = Average      2 = Fair      1 = Poor', {
      x: 60,
      y: yPosition,
      size: 11,
      font: boldFont,
    });

        // FEEDBACK TABLE SECTION
        yPosition -= 13;
        const questions = JSON.parse(feedback.feedback_form_question || '{}');
        const answers = JSON.parse(feedback.feedback_form_answer || '{}');
        
        // Separate rating questions (1-11) and text questions (12-14)
        const ratingQuestions = {};
        const textQuestions = {};
        
        Object.keys(questions).forEach(key => {
          if (Number(key) <= 11) {
            ratingQuestions[key] = questions[key];
          } else {
            textQuestions[key] = questions[key];
          }
        });

        // Rating questions table
        const feedbackColWidths = [40, 355, 35, 35, 35, 35, 35];
        const feedbackTableX = 20;
        const ratingRowCount = Object.keys(ratingQuestions).length + 1;
        const rowHeight = 23;

        page.drawRectangle({
          x: feedbackTableX,
          y: yPosition - rowHeight * ratingRowCount,
          width: feedbackColWidths.reduce((a, b) => a + b),
          height: rowHeight * ratingRowCount,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        // Vertical lines
        let currentX = feedbackTableX;
        feedbackColWidths.slice(0, -1).forEach(width => {
          currentX += width;
          page.drawLine({
            start: { x: currentX, y: yPosition },
            end: { x: currentX, y: yPosition - rowHeight * ratingRowCount },
            thickness: 1,
            color: rgb(0, 0, 0),
          });
        });

        // Horizontal lines
        for (let i = 0; i <= ratingRowCount; i++) {
          page.drawLine({
            start: { x: feedbackTableX, y: yPosition - i * rowHeight },
            end: { x: feedbackTableX + feedbackColWidths.reduce((a, b) => a + b), y: yPosition - i * rowHeight },
            thickness: 1,
            color: rgb(0, 0, 0),
          });
        }

        // Header Row
        page.drawText('Points', {
          x: feedbackTableX + 5,
          y: yPosition - 18,
          size: 10,
          font: boldFont,
        });

        ['5', '4', '3', '2', '1'].forEach((val, i) => {
          page.drawText(val, {
            x: feedbackTableX + feedbackColWidths[0] + feedbackColWidths[1] + i * feedbackColWidths[2 + i] + 15,
            y: yPosition - 18,
            size: 10,
            font: boldFont,
          });
        });

        // Rating Questions Rows
        Object.keys(ratingQuestions).forEach((key, index) => {
          const currentY = yPosition - (index + 1) * rowHeight;

          page.drawText(`${key})`, {
            x: feedbackTableX + 5,
            y: currentY - 18,
            size: 10,
            font: font,
          });

          page.drawText(ratingQuestions[key], {
            x: feedbackTableX + feedbackColWidths[0] + 5,
            y: currentY - 18,
            size: 10,
            font: font,
            maxWidth: feedbackColWidths[1] - 10,
          });

          const answer = answers[key];
          if (answer && !isNaN(Number(answer))) {
            const rating = Number(answer);
            const colIndex = 5 - rating;
            page.drawText('YES', {
              x: feedbackTableX + feedbackColWidths[0] + feedbackColWidths[1] + colIndex * feedbackColWidths[2] + 10,
              y: currentY - 18,
              size: 9,
              font: boldFont,
            });
          }
        });

        // Text Questions (12-14) with separate question and answer columns
        yPosition = yPosition - rowHeight * ratingRowCount - 3;
        const textRowHeight = 32;
        const textQuestionCount = Object.keys(textQuestions).length;

        if (textQuestionCount > 0) {
          const textQuestionColWidths = [40, 270, 260];
          
          page.drawRectangle({
            x: feedbackTableX,
            y: yPosition - textRowHeight * textQuestionCount,
            width: textQuestionColWidths.reduce((a, b) => a + b),
            height: textRowHeight * textQuestionCount,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
          });

          // Horizontal lines for text questions
          for (let i = 0; i <= textQuestionCount; i++) {
            page.drawLine({
              start: { x: feedbackTableX, y: yPosition - i * textRowHeight },
              end: { x: feedbackTableX + textQuestionColWidths.reduce((a, b) => a + b), y: yPosition - i * textRowHeight },
              thickness: 1,
              color: rgb(0, 0, 0),
            });
          }

          // Vertical line after question number
          page.drawLine({
            start: { x: feedbackTableX + textQuestionColWidths[0], y: yPosition },
            end: { x: feedbackTableX + textQuestionColWidths[0], y: yPosition - textRowHeight * textQuestionCount },
            thickness: 1,
            color: rgb(0, 0, 0),
          });

          // Vertical line after question text (before answer column)
          page.drawLine({
            start: { x: feedbackTableX + textQuestionColWidths[0] + textQuestionColWidths[1], y: yPosition },
            end: { x: feedbackTableX + textQuestionColWidths[0] + textQuestionColWidths[1], y: yPosition - textRowHeight * textQuestionCount },
            thickness: 1,
            color: rgb(0, 0, 0),
          });

          Object.keys(textQuestions).forEach((key, index) => {
            const currentY = yPosition - index * textRowHeight;

            // Question number
            page.drawText(`${key})`, {
              x: feedbackTableX + 5,
              y: currentY - 18,
              size: 10,
              font: font,
            });

            // Question text with wrapping
            const questionText = textQuestions[key];
            const questionLines = wrapText(questionText, textQuestionColWidths[1] - 10, 10, font);
            questionLines.forEach((line, lineIndex) => {
              page.drawText(line, {
                x: feedbackTableX + textQuestionColWidths[0] + 5,
                y: currentY - 18 - (lineIndex * 12),
                size: 10,
                font: font,
              });
            });

            // Answer text (in separate column) with wrapping
            const answer = answers[key] || '';
            if (answer) {
              const answerLines = wrapText(answer, textQuestionColWidths[2] - 10, 10, font);
              answerLines.forEach((line, lineIndex) => {
                page.drawText(line, {
                  x: feedbackTableX + textQuestionColWidths[0] + textQuestionColWidths[1] + 5,
                  y: currentY - 18 - (lineIndex * 12),
                  size: 10,
                  font: font,
                });
              });
            }
          });

          yPosition -= textRowHeight * textQuestionCount;
        }

        // TRAINEE DETAILS SECTION - 5 rows
        yPosition -= 8;
        const detailsRowHeight = 18;
        const traineeDetailsWidth = feedbackColWidths.reduce((a, b) => a + b);

        page.drawRectangle({
          x: 20,
          y: yPosition - detailsRowHeight * 5,
          width: traineeDetailsWidth,
          height: detailsRowHeight * 5,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        // Horizontal lines for 5 rows
        for (let i = 0; i <= 5; i++) {
          page.drawLine({
            start: { x: 20, y: yPosition - i * detailsRowHeight },
            end: { x: 20 + traineeDetailsWidth, y: yPosition - i * detailsRowHeight },
            thickness: 1,
            color: rgb(0, 0, 0),
          });
        }

        // Row 1 - Name
        page.drawText('Name:', {
          x: 25,
          y: yPosition - 13,
          size: 10,
          font: font,
        });
        page.drawText(feedback.trainee_name || '', {
          x: 150,
          y: yPosition - 13,
          size: 10,
          font: font,
        });

        // Row 2 - Employee No
        page.drawText('Employee No:', {
          x: 25,
          y: yPosition - 31,
          size: 10,
          font: font,
        });
        page.drawText(String(feedback.trainee_id || ''), {
          x: 150,
          y: yPosition - 31,
          size: 10,
          font: font,
        });

        // Row 3 - Dept Name
        page.drawText('Dept. Name:', {
          x: 25,
          y: yPosition - 49,
          size: 10,
          font: font,
        });
        page.drawText(feedback.trainee_department || '', {
          x: 150,
          y: yPosition - 49,
          size: 10,
          font: font,
        });

        // Row 4 - Date
        page.drawText('Date:', {
          x: 25,
          y: yPosition - 67,
          size: 10,
          font: font,
        });
        page.drawText(new Date(feedback.feedback_form_submition_date).toLocaleDateString() || '', {
          x: 150,
          y: yPosition - 67,
          size: 10,
          font: font,
        });

        // Row 5 - Sign
      page.drawText('Sign:', {
        x: 25,
        y: yPosition - 85,
        size: 10,
        font: font,
      });
      page.drawText(feedback.trainee_name || '', {   // ← ADD THIS
        x: 150,
        y: yPosition - 85,
        size: 10,
        font: font,
      });

        yPosition -= detailsRowHeight * 5 + 8;

        // FUTURE TOPICS SECTION
        page.drawText('What topics would you like to see covered in future training sessions:', {
          x: 20,
          y: yPosition,
          size: 10,
          font: font,
        });

        const futureTopicsHeight = 35;
        page.drawRectangle({
          x: 20,
          y: yPosition - futureTopicsHeight - 5,
          width: traineeDetailsWidth,
          height: futureTopicsHeight,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        if (feedback.feedback_form_comments_or_suggestions) {
          page.drawText(feedback.feedback_form_comments_or_suggestions, {
            x: 25,
            y: yPosition - 20,
            size: 10,
            font: font,
            maxWidth: traineeDetailsWidth - 10,
            lineHeight: 12,
          });
        }

        const pdfBytes = await pdfDoc.save();
        return {
          name: `${feedback.trainee_name}_feedback.pdf`,
          data: pdfBytes
        };
      } catch (err) {
        console.error(`Error generating PDF for ${feedback.trainee_name}:`, err);
        return null;
      }
    });

    // Wait for all PDFs to be generated
    const pdfResults = await Promise.all(pdfPromises);
    
    // Add valid PDFs to ZIP
    pdfResults.forEach(result => {
      if (result) {
        zip.file(result.name, result.data);
      }
    });

    // Generate and download ZIP
    const zipContent = await zip.generateAsync({ type: 'blob' });
    saveAs(
      zipContent, 
      `${selectedSession['Training Topic']}_individual_feedbacks_${new Date().toISOString().slice(0, 10)}.zip`
    );
    
  } catch (err) {
    console.error('Error exporting all individual feedbacks:', err);
    setError('Failed to export feedbacks: ' + err.message);
  } finally {
    setLoading(false);
  }
};
  
  const generateIndividualFeedbackPDF = async (feedback) => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]);
      // ... (include ALL the PDF generation code from exportIndividualFeedback here)
      // ... (keep all the drawing operations, styling, and layout code)
      
      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: "application/pdf" });
    } catch (err) {
      console.error('PDF generation error:', err);
      throw err;
    }
  };

  
// Fetch effectiveness data for a session
const fetchEffectivenessData = async (planing_id, session_no) => {
  try {
    setEffectivenessLoading(true);
    console.log("API Request Data for Effectiveness:", {
      planing_id: planing_id,
      session_no: session_no
    });

    // Fetch effectiveness data
    const response = await axios.post(`${API_BASE_URL}/planning-route/updateTraineeEffectiveness/get`, {
      planing_id: planing_id,
      session_no: session_no
    });
    
    console.log("Effectiveness data response:", response.data);
    
    setEffectivenessData(response.data === "no" || !response.data.AllTraineeffectiveness ? null : response.data);
    setEffectivenessLoading(false);
  } catch (err) {
    console.error('Error fetching effectiveness data:', {
      message: err.message,
      response: err.response?.data,
      config: err.config
    });
    setError(err.response?.data?.message || err.message);
    setEffectivenessLoading(false);
  }
};

// Update your useEffect to call this when needed
useEffect(() => {
  if (selectedSession && mainTab === 1 && !effectivenessData) {
    fetchEffectivenessData(selectedSession.Planning_ID, selectedSession.Session_No);
  }
}, [mainTab, selectedSession]);

// Also call it when the dialog opens if needed
useEffect(() => {
  if (openDialog && selectedSession && mainTab === 1 && !effectivenessData) {
    fetchEffectivenessData(selectedSession.Planning_ID, selectedSession.Session_No);
  }
}, [openDialog]);

useEffect(() => {
  if (mainTab === 1 && !effectivenessData) {
    fetchEffectivenessData();
  }
}, [mainTab, selectedSession]);




const exportEffectivenessToExcel = async (effectivenessData, selectedSession) => {
  if (!effectivenessData?.AllTraineeffectiveness) {
    alert('No effectiveness data available to export');
    return;
  }

  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NIPPON EXPRESS (INDIA) PVT. LTD.';
  workbook.created = new Date();

  // Add a worksheet for Summary
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.state = 'visible';

  // Add a worksheet for Detailed Data
  const detailedSheet = workbook.addWorksheet('Participants');
  detailedSheet.state = 'visible';

  // Styling configuration (matches UI colors)
  const styles = {
    header: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F3FF' } },
      font: { bold: true, color: { argb: '1A005D' } },
      border: { top: { style: 'thin', color: { argb: '1A005D' } }, bottom: { style: 'thin', color: { argb: '1A005D' } } },
      alignment: { horizontal: 'center' }
    },
    totalCard: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E7FF' } },
      border: { left: { style: 'medium', color: { argb: '1A005D' } } },
      font: { bold: true, color: { argb: '4F46E5' } }
    },
    effectiveCard: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFDF5' } },
      border: { left: { style: 'medium', color: { argb: '10B981' } } },
      font: { bold: true, color: { argb: '059669' } }
    },
    retrainingCard: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } },
      border: { left: { style: 'medium', color: { argb: 'EF4444' } } },
      font: { bold: true, color: { argb: 'DC2626' } }
    },
    pass: { font: { color: { argb: '10B981' }, bold: true } },
    fail: { font: { color: { argb: 'EF4444' }, bold: true } },
    pending: { font: { color: { argb: '6B7280' } } }
  };

  // ===== SUMMARY SHEET =====
  // Add company name and title
  summarySheet.mergeCells('A1:F1');
  summarySheet.getCell('A1').value = 'NIPPON EXPRESS (INDIA) PRIVATE LIMITED';
  summarySheet.getCell('A1').font = { bold: true, size: 16, color: { argb: '1A005D' } };
  summarySheet.getCell('A1').alignment = { horizontal: 'center' };

  summarySheet.mergeCells('A2:F2');
  summarySheet.getCell('A2').value = 'TRAINING EFFECTIVENESS ANALYSIS';
  summarySheet.getCell('A2').font = { bold: true, size: 14, color: { argb: '1A005D' } };
  summarySheet.getCell('A2').alignment = { horizontal: 'center' };

  // Training Information
  summarySheet.mergeCells('A4:F4');
  summarySheet.getCell('A4').value = 'Training Information';
  summarySheet.getCell('A4').font = { bold: true, color: { argb: '1A005D' } };
  summarySheet.getCell('A4').fill = styles.header.fill;

  summarySheet.getCell('A5').value = 'Training Topic:';
  summarySheet.getCell('B5').value = selectedSession?.['Training Topic'] || 'N/A';
  summarySheet.getCell('A6').value = 'Date:';
  summarySheet.getCell('B6').value = selectedSession?.['Training Date'] || 'N/A';
  summarySheet.getCell('A7').value = 'Trainer:';
  summarySheet.getCell('B7').value = selectedSession?.['Trainer Name'] || 'N/A';

  // Summary Statistics (Cards)
  summarySheet.mergeCells('A9:F9');
  summarySheet.getCell('A9').value = 'Summary Statistics';
  summarySheet.getCell('A9').font = { bold: true, color: { argb: '1A005D' } };
  summarySheet.getCell('A9').fill = styles.header.fill;

  // Total Participants Card (Blue)
  summarySheet.getCell('A11').value = 'Total Participants Assessed';
  summarySheet.getCell('A11').style = styles.totalCard;
  summarySheet.getCell('B11').value = effectivenessData.AllTraineeffectiveness.length;
  summarySheet.getCell('B11').font = { bold: true, size: 14, color: { argb: '4F46E5' } };

  summarySheet.getCell('A12').value = `${effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessStatus === 1).length} marked effective`;
  summarySheet.getCell('A12').font = { color: { argb: '4F46E5' } };
  summarySheet.getCell('A12').fill = styles.totalCard.fill;

  // Effective Training Card (Green)
  summarySheet.getCell('A14').value = 'Effective Training';
  summarySheet.getCell('A14').style = styles.effectiveCard;
  const effectivePercentage = Math.round((effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessStatus === 1).length / effectivenessData.AllTraineeffectiveness.length) * 100) || 0;
  summarySheet.getCell('B14').value = `${effectivePercentage}%`;
  summarySheet.getCell('B14').font = { bold: true, size: 14, color: { argb: '059669' } };

  summarySheet.getCell('A15').value = `${effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessStatus === 1).length} participants`;
  summarySheet.getCell('A15').font = { color: { argb: '059669' } };
  summarySheet.getCell('A15').fill = styles.effectiveCard.fill;

  // Needs Retraining Card (Red)
  summarySheet.getCell('A17').value = 'Needs Retraining';
  summarySheet.getCell('A17').style = styles.retrainingCard;
  const retrainingCount = effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessRetrainingRequired === 1).length;
  const retrainingPercentage = Math.round((retrainingCount / effectivenessData.AllTraineeffectiveness.length) * 100) || 0;
  summarySheet.getCell('B17').value = retrainingCount;
  summarySheet.getCell('B17').font = { bold: true, size: 14, color: { argb: 'DC2626' } };

  summarySheet.getCell('A18').value = `${retrainingPercentage}% of participants`;
  summarySheet.getCell('A18').font = { color: { argb: 'DC2626' } };
  summarySheet.getCell('A18').fill = styles.retrainingCard.fill;

  // Measurement Breakdown (Text representation instead of chart)
  summarySheet.mergeCells('A20:F20');
  summarySheet.getCell('A20').value = 'Effectiveness Measurement Breakdown';
  summarySheet.getCell('A20').font = { bold: true, color: { argb: '1A005D' } };
  summarySheet.getCell('A20').fill = styles.header.fill;

  // Add measurement data as text tables
  const measurementA = effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessMeasuredA === 1).length;
  const measurementB = effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessMeasuredB === 1).length;
  const measurementC = effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessMeasuredC === 1).length;
  const total = effectivenessData.AllTraineeffectiveness.length;

  summarySheet.getCell('A22').value = 'Measurement A (Pre/Post Test)';
  summarySheet.getCell('B22').value = `${measurementA} passed (${Math.round((measurementA / total) * 100)}%)`;
  summarySheet.getCell('B22').font = styles.pass;

  summarySheet.getCell('A23').value = 'Measurement B (Observation)';
  summarySheet.getCell('B23').value = `${measurementB} passed (${Math.round((measurementB / total) * 100)}%)`;
  summarySheet.getCell('B23').font = styles.pass;

  summarySheet.getCell('A24').value = 'Measurement C (Performance)';
  summarySheet.getCell('B24').value = `${measurementC} passed (${Math.round((measurementC / total) * 100)}%)`;
  summarySheet.getCell('B24').font = styles.pass;

  // ===== DETAILED SHEET =====
  // Add headers
  detailedSheet.columns = [
    { header: 'Trainee', width: 25 },
    { header: 'Measurement A', width: 15 },
    { header: 'Measurement B', width: 15 },
    { header: 'Measurement C', width: 15 },
    { header: 'Status', width: 15 },
    { header: 'Retraining', width: 15 },
    { header: 'Remarks', width: 30 }
  ];

  // Style headers
  detailedSheet.getRow(1).eachCell((cell) => {
    cell.style = styles.header;
  });

  // Add data rows
  effectivenessData.AllTraineeffectiveness.forEach((trainee, index) => {
    const row = detailedSheet.addRow([
      trainee.trainee_name,
      trainee.EffectivenessMeasuredA === 1 ? '✓' : trainee.EffectivenessMeasuredA === 0 ? '✗' : '?',
      trainee.EffectivenessMeasuredB === 1 ? '✓' : trainee.EffectivenessMeasuredB === 0 ? '✗' : '?',
      trainee.EffectivenessMeasuredC === 1 ? '✓' : trainee.EffectivenessMeasuredC === 0 ? '✗' : '?',
      trainee.EffectivenessStatus === 1 ? 'Effective' : trainee.EffectivenessStatus === 0 ? 'Not Effective' : 'Pending',
      trainee.EffectivenessRetrainingRequired === 1 ? 'Required' : trainee.EffectivenessRetrainingRequired === 0 ? 'Not Required' : 'To be Reviewed',
      trainee.EffectivenessRemarks || 'No remarks'
    ]);

    // Alternate row colors
    if (index % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FAFAFA' } };
    }

    // Style measurement columns
    ['B', 'C', 'D'].forEach((col) => {
      const cell = row.getCell(col);
      if (cell.value === '✓') cell.style = styles.pass;
      else if (cell.value === '✗') cell.style = styles.fail;
      else cell.style = styles.pending;
    });

    // Style status column
    const statusCell = row.getCell('E');
    if (statusCell.value === 'Effective') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFDF5' } };
      statusCell.font = { color: { argb: '059669' }, bold: true };
    } else if (statusCell.value === 'Not Effective') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
      statusCell.font = { color: { argb: 'DC2626' }, bold: true };
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
      statusCell.font = { color: { argb: 'B45309' }, bold: true };
    }

    // Style retraining column
    const retrainingCell = row.getCell('F');
    if (retrainingCell.value === 'Required') {
      retrainingCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDD5' } };
      retrainingCell.font = { color: { argb: 'EA580C' }, bold: true };
    } else if (retrainingCell.value === 'Not Required') {
      retrainingCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFDF5' } };
      retrainingCell.font = { color: { argb: '059669' }, bold: true };
    } else {
      retrainingCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0F2FE' } };
      retrainingCell.font = { color: { argb: '0284C7' }, bold: true };
    }
  });

  // Generate filename
  const trainingTopic = selectedSession?.['Training Topic']?.replace(/[^a-zA-Z0-9]/g, '_') || 'Report';
  const trainingDate = selectedSession?.['Training Date']?.replace(/\//g, '-') || '';
  const filename = `Training_Effectiveness_${trainingTopic}_${trainingDate}.xlsx`;

  // Write to file
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), filename);
};

const exportEffectivenessToWord = async (effectivenessData, selectedSession) => {
  if (!effectivenessData?.AllTraineeffectiveness) {
    alert('No effectiveness data available to export');
    return;
  }
 // Convert logo image to base64
  let base64Logo = '';
  try {
  
    const response = await fetch(logo);
    const blob = await response.blob();
    base64Logo = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Could not load logo, using text fallback', error);
    base64Logo = ''; 
  }

  const rows = effectivenessData.AllTraineeffectiveness;
  const totalRows = rows.length;

  const allRows = rows.map((trainee, i) => {
    return `
    <tr>
      <!-- Attendance Columns -->
      <td style="width:5%;text-align:center;">${i + 1}</td>
      <td style="width:25%;">${trainee.trainee_name || ''}</td>
      <td style="width:20%;"></td>

      <!-- Effectiveness Columns -->
      <td style="width:15%;">${trainee.EffectivenessDate || ''}</td>
      <td style="width:5%;text-align:center;">${trainee.EffectivenessMeasuredA === 1 ? '✓' : ''}</td>
      <td style="width:5%;text-align:center;">${trainee.EffectivenessMeasuredB === 1 ? '✓' : ''}</td>
      <td style="width:5%;text-align:center;">${trainee.EffectivenessMeasuredC === 1 ? '✓' : ''}</td>
      <td style="width:10%;text-align:center;">${trainee.EffectivenessStatus === 1 ? 'OK' : trainee.EffectivenessStatus === 0 ? 'Not OK' : ''}</td>
      <td style="width:10%;text-align:center;">${trainee.EffectivenessRetrainingRequired === 1 ? 'Yes' : trainee.EffectivenessRetrainingRequired === 0 ? 'No' : ''}</td>
      <td style="width:20%;">${trainee.EffectivenessRemarks || ''}</td>
    </tr>`;
  }).join('');

   const logoContent = base64Logo 
    ? `<img src="${base64Logo}" style="max-width: 90px; height: auto;" alt="NEX Logo" />`
    : `<div style="font-weight: bold; font-size: 10pt;">NEX<br>NIPPON<br>EXPRESS</div>`;


 const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>Training Attendance and Effectiveness</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      margin: 0.2in;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      table-layout: fixed;
    }

    td, th {
      border: 1pt solid black;
      padding: 3pt;
      vertical-align: middle;
      font-size: 9pt;
    }

    th {
      background-color: #f9f9f9;
      font-weight: bold;
      text-align: center;
    }

    .logo {
      font-size: 10pt;
      font-weight: bold;
      text-align: center;
      line-height: 1.2;
    }

    .legend {
      margin-top: 10px;
      font-size: 8pt;
    }

    .signature {
      margin-top: 20px;
      text-align: right;
      font-size: 9pt;
    }
  </style>
</head>
<body>

<!-- Header Table -->
<table style="width: 100%; border-collapse: collapse;">
  <tr>
    <td rowspan="4" style="width: 15%; border: 1pt solid black; text-align: center; vertical-align: middle;">
      ${logoContent}
    </td>

    <td colspan="4" style="border: 1pt solid black; text-align: center; font-weight: bold; font-size: 12pt;">
      NIPPON EXPRESS (INDIA) PVT. LTD.
    </td>
    <td style="border: 1pt solid black; width: 10%;">Doc No.</td>
    <td style="border: 1pt solid black; width: 15%;">NEIN/HRD/F/02</td>
  </tr>
  <tr>
    <td colspan="4" style="border: 1pt solid black; text-align: center; font-size: 10pt;">
      HUMAN RESOURCE DEVELOPMENT
    </td>
    <td style="border: 1pt solid black;">Effective Date</td>
    <td style="border: 1pt solid black;">01/12/2021</td>
  </tr>
  <tr>
    <td colspan="4" style="border: 1pt solid black; text-align: center; font-weight: bold;">
      TRAINING ATTENDANCE AND TRAINING EFFECTIVENESS MEASUREMENT
    </td>
    <td style="border: 1pt solid black;">Rev No & Date</td>
    <td style="border: 1pt solid black;">04/12/2022</td>
  </tr>
  <tr>
    <td colspan="4" style="border: 1pt solid black;"></td>
    <td style="border: 1pt solid black;">Page No</td>
    <td style="border: 1pt solid black;">1 of 1</td>
  </tr>
</table>

<!-- Training Info -->
<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
  <tr>
    <td style="border: 1pt solid black; width: 15%;"><strong>Training Topic:</strong></td>
    <td style="border: 1pt solid black; width: 25%;">${selectedSession?.['Training Topic'] || ''}</td>
    <td style="border: 1pt solid black; width: 15%;"><strong>Trainer Name:</strong></td>
    <td style="border: 1pt solid black; width: 20%;">${selectedSession?.['Trainer Name'] || ''}</td>
    <td style="border: 1pt solid black; width: 10%;"><strong>Type:</strong></td>
    <td style="border: 1pt solid black; width: 15%;">${selectedSession?.['Trainer Type'] || ''}</td>
  </tr>
  <tr>
    <td style="border: 1pt solid black;"><strong>Training Date:</strong></td>
    <td colspan="5" style="border: 1pt solid black;">${selectedSession?.['Training Date'] || ''}</td>
  </tr>
</table>

<!-- Main Table -->
<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
  <thead>
    <tr>
      <th colspan="3" style="border: 1pt solid black;">TRAINING ATTENDANCE DETAILS</th>
      <th colspan="7" style="border: 1pt solid black;">TRAINING EFFECTIVENESS DETAILS</th>
    </tr>
    <tr>
      <th style="width:5%; border: 1pt solid black;">Sl No</th>
      <th style="width:25%; border: 1pt solid black;">Name of the Employee</th>
      <th style="width:20%; border: 1pt solid black;">Signature of Employee</th>
      <th style="width:15%; border: 1pt solid black;">Effectiveness measured on (Date)</th>
      <th colspan="3" style="width:15%; border: 1pt solid black;">Effectiveness measured through</th>
      <th style="width:10%; border: 1pt solid black;">Effectiveness (OK/Not OK)</th>
      <th style="width:10%; border: 1pt solid black;">Retraining Required (Yes/No)</th>
      <th style="width:20%; border: 1pt solid black;">Remarks</th>
    </tr>
    <tr>
      <td colspan="3" style="border: 1pt solid black;"></td>
      <td style="border: 1pt solid black;"></td>
      <th style="width:5%; border: 1pt solid black;">A</th>
      <th style="width:5%; border: 1pt solid black;">B</th>
      <th style="width:5%; border: 1pt solid black;">C</th>
      <td colspan="3" style="border: 1pt solid black;"></td>
    </tr>
  </thead>
  <tbody>
    ${allRows}
  </tbody>
</table>

<div class="legend">
  <strong>Legend:</strong> A = Personnel Discussion, B = Demonstration/Test, C = On-the-job Assessment
</div>

<div class="signature">
  <div style="border-top: 1pt solid black; width: 200px; display: inline-block;">FACULTY SIGNATURE</div>
</div>

</body>
</html>
`;

  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const topic = (selectedSession?.['Training Topic'] || 'Training').replace(/[^a-zA-Z0-9]/g, '_');
  const date = (selectedSession?.['Training Date'] || new Date().toISOString().split('T')[0]).replace(/\//g, '-');

  link.href = url;
  link.download = `02-NEIN-HRD-F-02_Training_Attendance_${topic}_${date}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};
const exportEffectivenessReport = async () => {
  try {
    setExportLoading(true);
    await exportEffectivenessToExcel(effectivenessData, selectedSession);
    await exportEffectivenessToWord (effectivenessData, selectedSession);
  } catch (error) {
    console.error('Error exporting report:', error);
    alert('Failed to export report');
  } finally {
    setExportLoading(false);
  }
};

const SnackbarNotification = () => (
  <Snackbar
    open={snackbar.open}
    autoHideDuration={4000}
    onClose={() => setSnackbar({ ...snackbar, open: false })}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  >
    <Alert 
      onClose={() => setSnackbar({ ...snackbar, open: false })} 
      severity={snackbar.severity}
      sx={{ width: '100%' }}
    >
      {snackbar.message}
    </Alert>
  </Snackbar>
);
  
  
  
  

  return (
    <div className="admin-dashboard-content">
      <div className="reports">
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={1} 
          sx={{
            backgroundColor: "#1A005D",
            padding: "10px 15px",
            marginBottom: "9px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: "white",
              fontWeight: "bold",
              textAlign: "center",
              width: "100%",
            }}
          >
            Training Feedback Reports
          </Typography>
          
<Tooltip title="Export to Excel">
  <Button
    variant="contained"
    startIcon={<DownloadIcon />}
    onClick={exportToExcel}
    sx={{
      backgroundColor: "#8EC400",
      "&:hover": { backgroundColor: "#7EB300" },
      borderRadius: "8px"
    }}
  >
    Export
  </Button>
</Tooltip>
        </Box>

        {/* Search and Date Filters */}
        <Box sx={{ 
          display: "flex", 
          gap: 2, 
          justifyContent: "flex-end",
          alignItems: "center",
          pb: 1,
          flexWrap: 'wrap'
        }}>
          <TextField
            label="From Date"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            sx={{ width: 180 }}
          />
          <TextField
            label="To Date"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            sx={{ width: 180 }}
          />
          <TextField
            label="Search Training Sessions"
            variant="outlined"
            size="small"
            value={searchText}
            onChange={handleSearchChange}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 300 }}
          />
        </Box>
        
        {/* Training Sessions Table */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              padding:"10px",
              justifyContent: "center",
              alignItems: "center",
              height: "300px"
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
  <Typography color="error">{error}</Typography>
) : Array.isArray(filteredSessions) && filteredSessions.length > 0 ? (
  <>
    <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <Table>
                <TableHead sx={{ backgroundColor: "#1A005D" }}>
  <TableRow>
    {[
      { id: 'SLNO', label: 'Sr. No', sortable: false },
      { id: 'Training Topic', label: 'Training Topic', sortable: true },
      { id: 'Trainer Name', label: 'Trainer', sortable: true },
      { id: 'Training Date', label: 'Date', sortable: true },
      { id: 'from_time', label: 'Time', sortable: true },
      { id: 'Dept', label: 'Department', sortable: true },
      { id: 'Participants', label: 'Participants', sortable: true },
      { id: 'Trainee Feedbacks', label: 'Trainee Feedbacks', sortable: true },
      { id: 'Trainer Feedback Submitted', label: 'Trainer Feedback', sortable: true },
      { id: 'actions', label: 'Actions', sortable: false }
    ].map((header) => (
      <TableCell 
        key={header.id}
        sx={{ 
          fontWeight: 'bold', 
          color: 'white', 
          textAlign: 'center',
          padding: '8px',
          fontSize: '0.87rem',
          cursor: header.sortable ? 'pointer' : 'default'
        }}
        onClick={header.sortable ? () => handleRequestSort(header.id) : undefined}
      >
        <Box display="flex" alignItems="center" justifyContent="center">
          {header.label}
          {header.sortable && orderBy === header.id && (
            <Box component="span" ml={1}>
              {order === 'desc' ? '▼' : '▲'}
            </Box>
          )}
        </Box>
      </TableCell>
    ))}
  </TableRow>
</TableHead>
                <TableBody>
  {stableSort(filteredSessions, getComparator(order, orderBy))
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    .map((session, index) => (
      <TableRow
        key={`${session.planing_id}-${session.session_id}`}
        hover
        sx={{
          "&:nth-of-type(odd)": { backgroundColor: "#f8fafc" }
        }}
      >
        <TableCell sx={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
          {page * rowsPerPage + index + 1}
        </TableCell>
        <TableCell sx={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
          {session['Training Topic']}
        </TableCell>
        <TableCell sx={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
          {session['Trainer Name']}
        </TableCell>
        <TableCell sx={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
          {session['Training Date']}
        </TableCell>
        <TableCell sx={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
          {`${session.from_time} - ${session.to_time}`}
        </TableCell>
        <TableCell sx={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
          {session.Dept}
        </TableCell>
        <TableCell sx={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
          {session.Participants}
        </TableCell>
        <TableCell sx={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
          {session['Trainee Feedbacks']}
        </TableCell>
        <TableCell sx={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
          {session['Trainer Feedback Submitted']}
        </TableCell>
        <TableCell sx={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => handleSessionClick(session)}
          >
            View
          </Button>
        </TableCell>
      </TableRow>
    ))}
</TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={filteredSessions.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        ) : (
          <Box
            sx={{
              height: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              textAlign: "center",
              gap: 2
            }}
          >
           <Typography variant="h6" sx={{ color: "#1A005D" }}>
        {error ? "Error loading sessions" : "No training sessions available"}
      </Typography>
      {error && (
        <Button variant="outlined" onClick={fetchTrainingSessions}>
          Retry
        </Button>
      )}
    </Box>
        )}

      {/* Feedback Details Dialog */}
<Dialog 
  open={openDialog} 
  onClose={handleCloseDialog}
  maxWidth="lg"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: '12px',
      boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.2)',
      minHeight: '600px',
      background: 'linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)',
      overflow: 'hidden'
    }
  }}
>
  {/* Enhanced Header with gradient */}
  <DialogTitle sx={{
    background: 'linear-gradient(135deg, #1A005D 0%, #1A005D 100%)',
    color: 'white',
    py: 2,
    px: 3,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }}>
    <Box display="flex" alignItems="center">
      <AssignmentIcon sx={{ mr: 1.5, fontSize: '1.5rem' }} />
      <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
        Training Feedback Details
      </Typography>
    </Box>
    <IconButton
      edge="end"
      color="inherit"
      onClick={handleCloseDialog}
      aria-label="close"
      sx={{
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'rotate(90deg)',
          backgroundColor: 'rgba(255,255,255,0.15)'
        }
      }}
    >
      <CloseIcon />
    </IconButton>
  </DialogTitle>

  {/* Enhanced Main Tabs */}
  <Tabs
    value={mainTab}
    onChange={(e, newValue) => setMainTab(newValue)}
    sx={{
      px: 3,
      backgroundColor: 'transparent',
      borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
      '& .MuiTabs-indicator': {
        height: 3,
        borderRadius: '3px 3px 0 0',
        background: 'linear-gradient(90deg, #1A005D 0%, #1A005D 100%)'
      }
    }}
  >
    <Tab 
      label={`Feedback for ${selectedSession?.['Training Topic']}`} 
      sx={{
        minHeight: 48,
        fontWeight: 600,
        fontSize: '0.875rem',
        color: mainTab === 0 ? '#1A005D' : 'text.secondary',
        textTransform: 'none',
        padding: '12px 20px',
        '&:hover': {
          color: '#1A005D',
          backgroundColor: 'rgba(25, 118, 210, 0.04)'
        }
      }}
    />
    <Tab 
      label="Training Effectiveness" 
      sx={{
        minHeight: 48,
        fontWeight: 600,
        fontSize: '0.875rem',
        color: mainTab === 1 ? '#1A005D' : 'text.secondary',
        textTransform: 'none',
        padding: '12px 20px',
        '&:hover': {
          color: '#1A005D',
          backgroundColor: 'rgba(25, 118, 210, 0.04)'
        }
      }}
    />
  </Tabs>

  <DialogContent sx={{ p: 0 }}>
    {loading ? (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress 
          size={60} 
          thickness={4} 
          sx={{ 
            color: '#1A005D',
            '& circle': {
              strokeLinecap: 'round'
            }
          }} 
        />
      </Box>
    ) : (
      <>
        {mainTab === 0 && (
          <>
            {/* Enhanced Sub Tabs */}
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{
                px: 3,
                pt: 1,
                backgroundColor: 'transparent',
                borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                '& .MuiTabs-indicator': {
                  height: 2,
                  background: 'linear-gradient(90deg, #1A005D 0%, #1A005D 100%)'
                }
              }}
            >
              <Tab 
                label="Trainer Feedback" 
                 disabled={!trainerFeedback?.feedback_form_answer} 
                 icon={!trainerFeedback?.feedback_form_answer ? <BlockIcon fontSize="small" color="error" /> : null}
                iconPosition="end"
                sx={{
                  minHeight: 40,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: tabValue === 0 ? '#1A005D' : '1A005D',
                  textTransform: 'none',
                  padding: '8px 20px',
                  '&:hover': {
                    color: '#1A005D',
                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                  }
                }}
              />
              <Tab 
                label="Trainee Feedback" 
                disabled={traineeFeedbacks.length === 0} 
                icon={traineeFeedbacks.length === 0 ? <BlockIcon fontSize="small" color="error" /> : null}
                iconPosition="end"
                sx={{
                  minHeight: 40,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: tabValue === 1 ? '#1A005D' : '1A005D',
                  textTransform: 'none',
                  padding: '8px 20px',
                  '&:hover': {
                    color: '#1A005D',
                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                  }
                }}
              />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <>
                  {trainerFeedback ? (
                    <>
                      {/* Enhanced Info Card */}
                      <Box sx={{ 
                        background: 'linear-gradient(to right, #f5f9ff 0%, #e3f2fd 100%)',
                        p: 2.5, 
                        borderRadius: '8px',
                        mb: 3,
                        borderLeft: '4px solid #1A005D',
                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)'
                      }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                              <PersonOutlineIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: '1rem' }} />
                              Trainer
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {trainerFeedback.trainer_name}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                              <CalendarTodayIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: '1rem' }} />
                              Date
                            </Typography>
                            <Typography variant="body1">
                              {trainerFeedback.session_date}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                              <AccessTimeIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: '1rem' }} />
                              Time
                            </Typography>
                            <Typography variant="body1">
                              {trainerFeedback.from_time} - {trainerFeedback.to_time}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                      
                      {/* Enhanced Feedback Table */}
                      <Paper elevation={0} sx={{ 
                        border: '1px solid rgba(0, 0, 0, 0.08)', 
                        borderRadius: '8px',
                        overflow: 'hidden',
                        mb: 3,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                      }}>
                        <TableContainer>
                          <Table>
                            <TableHead sx={{ 
                              backgroundColor: '#f5f9ff',
                              '& th': {
                                fontWeight: 600,
                                color: '#1A005D'
                              }
                            }}>
                              <TableRow>
                                <TableCell align="center">Question</TableCell>
                                <TableCell align="center" sx={{ width: '180px' }}>Answer</TableCell>
                              </TableRow>
                            </TableHead>
                           <TableBody>
                                {Object.entries(trainerQuestions).map(([key, question]) => {
                                  const answerKey = `q${key}`;
                                  const answerText = trainerAnswers[answerKey] || "—";

                                  return (
                                    <TableRow key={key}>
                                      {/* Question */}
                                      <TableCell
                                        sx={{
                                          borderBottomColor: 'rgba(0, 0, 0, 0.04)',
                                          width: '35%'
                                        }}
                                      >
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {question}
                                        </Typography>
                                      </TableCell>

                                      {/* Answer */}
                                      <TableCell sx={{ borderBottomColor: 'rgba(0, 0, 0, 0.04)' }}>
                                        <Box
                                          sx={{
                                            backgroundColor: '#f8fafc',
                                            p: 1.5,
                                            borderRadius: '6px',
                                            border: '1px solid rgba(0,0,0,0.06)',
                                          }}
                                        >
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              whiteSpace: 'pre-wrap',
                                              lineHeight: 1.6,
                                              color:
                                                answerText === "—"
                                                  ? 'text.secondary'
                                                  : 'text.primary'
                                            }}
                                          >
                                            {answerText}
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>

                          </Table>
                        </TableContainer>
                      </Paper>
                      
                      {trainerFeedback.feedback_form_comments_or_suggestions && (
                        <Paper elevation={0} sx={{ 
                          p: 2.5, 
                          border: '1px solid rgba(0, 0, 0, 0.08)', 
                          borderRadius: '8px',
                          mb: 3,
                          backgroundColor: '#f8fafc',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                        }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ 
                            fontWeight: 600,
                            color: '#1976d2',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <MessageIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
                            Comments & Suggestions
                          </Typography>
                          <Box sx={{
                            p: 2,
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            border: '1px solid rgba(0, 0, 0, 0.04)'
                          }}>
                            <Typography variant="body1" sx={{ 
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.6
                            }}>
                              {trainerFeedback.feedback_form_comments_or_suggestions}
                            </Typography>
                          </Box>
                        </Paper>
                      )}
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        mt: 3,
                        '& button': {
                          borderRadius: '6px',
                          textTransform: 'none',
                          fontWeight: 600,
                          letterSpacing: '0.5px'
                        }
                      }}>
                        <Button 
                          variant="outlined"
                          startIcon={<PictureAsPdfIcon />}
                          onClick={() => exportToPDF('trainer')}
                          sx={{ 
                            mr: 2,
                            borderWidth: '2px',
                            '&:hover': {
                              borderWidth: '2px'
                            }
                          }}
                        >
                          Export PDF
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <Box 
                      display="flex" 
                      flexDirection="column"
                      justifyContent="center" 
                      alignItems="center" 
                      minHeight="300px"
                      textAlign="center"
                      sx={{
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: '8px',
                        border: '1px dashed rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      <InfoOutlinedIcon sx={{ 
                        fontSize: 48, 
                        color: '#bdbdbd', 
                        mb: 2,
                        opacity: 0.6
                      }} />
                      <Typography variant="h6" color="textSecondary" gutterBottom sx={{ fontWeight: 500 }}>
                        No Trainer Feedback Available
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ maxWidth: '400px' }}>
                        The trainer has not submitted feedback for this session yet.
                      </Typography>
                    </Box>
                  )}
                </>
              )}
              
              {tabValue === 1 && (
                <>
                  {traineeFeedbacks.length > 0 ? (
                    <>
                      {/* Enhanced Stats Card */}
                      <Box sx={{ 
                        background: 'linear-gradient(to right, #f0fdf4 0%, #dcfce7 100%)',
                        p: 2.5, 
                        borderRadius: '8px',
                        mb: 3,
                        borderLeft: '4px solid #1A005D',
                        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.08)'
                      }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                              <GroupIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: '1rem' }} />
                              Total Trainees
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {selectedSession?.Participants}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                              <AssignmentTurnedInIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: '1rem' }} />
                              Feedback Submitted
                            </Typography>
                            <Typography variant="body1">
                              {traineeFeedbacks.filter(f => f.feedback_form_answer && f.feedback_form_answer !== '{}').length}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                              <TrendingUpIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: '1rem' }} />
                              Response Rate
                            </Typography>
                            <Typography variant="body1">
                              <Box component="span" sx={{ 
                                fontWeight: 600,
                                color: (traineeFeedbacks.filter(f => f.feedback_form_answer && f.feedback_form_answer !== '{}').length / (selectedSession?.Participants || 1)) > 0.7 ? '#22c55e' : 
                                      (traineeFeedbacks.filter(f => f.feedback_form_answer && f.feedback_form_answer !== '{}').length / (selectedSession?.Participants || 1)) > 0.4 ? '#f59e0b' : '#ef4444'
                              }}>
                                {Math.round(
                                  (traineeFeedbacks.filter(f => f.feedback_form_answer && f.feedback_form_answer !== '{}').length / 
                                  (selectedSession?.Participants || 1)) * 100
                                ) || 0}%
                              </Box>
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                      
                      <Typography variant="subtitle1" gutterBottom sx={{ 
                        fontWeight: 600,
                        color: '#1A005D',
                        display: 'flex',
                        alignItems: 'center',
                        mb: 2
                      }}>
                        <AssessmentIcon sx={{ mr: 1, color: '#1A005D' }} />
                        Average Ratings
                      </Typography>
                      
                      <Paper elevation={0} sx={{ 
                        border: '1px solid rgba(0, 0, 0, 0.08)', 
                        borderRadius: '8px',
                        overflow: 'hidden',
                        mb: 4,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                      }}>
                        <TableContainer>
                          <Table>
                            <TableHead sx={{ 
                              backgroundColor: '#f0fdf4',
                              '& th': {
                                fontWeight: 600,
                                color: '#1A005D'
                              }
                            }}>
                              <TableRow>
                                <TableCell>Question</TableCell>
                                <TableCell align="right" sx={{ width: '200px' }}>Average Rating</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(() => {
                                const questions = JSON.parse(traineeFeedbacks[0]?.feedback_form_question || '{}');
                                  const questionKeys = Object.keys(questions);

                                  const averages = {};
                                  const counts = {};

                                  questionKeys.forEach(key => {
                                    averages[key] = 0;
                                    counts[key] = 0;
                                  });

                                  traineeFeedbacks.forEach(feedback => {
                                    if (!feedback.feedback_form_answer || feedback.feedback_form_answer === '{}') return;

                                    const answers = JSON.parse(feedback.feedback_form_answer);

                                    questionKeys.forEach(key => {
                                      const value = answers[key];

                                      // ✅ ONLY numeric answers (1–5)
                                      if (!isNaN(value) && value !== '' && Number(value) >= 1 && Number(value) <= 5) {
                                        averages[key] += Number(value);
                                        counts[key] += 1;
                                      }
                                    });
                                  });

                                                        
                                                                  
                                      questionKeys.forEach(key => {
                                      averages[key] = counts[key] > 0
                                        ? (averages[key] / counts[key])
                                        : null;
                                    });



                                
                                return questionKeys.map((key) => (
                                  <TableRow 
                                    key={key} 
                                    hover
                                    sx={{
                                      '&:nth-of-type(odd)': {
                                        backgroundColor: 'rgba(34, 197, 94, 0.02)'
                                      }
                                    }}
                                  >
                                    <TableCell sx={{ borderBottomColor: 'rgba(0, 0, 0, 0.04)' }}>
                                      {questions[key]}
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderBottomColor: 'rgba(0, 0, 0, 0.04)' }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                       {averages[key] !== null ? (
                                            <>
                                              <Rating
                                                value={averages[key]}
                                                readOnly
                                                precision={0.1}
                                                max={5}
                                              />
                                              <Typography sx={{ ml: 1 }}>
                                                {averages[key].toFixed(1)}/5
                                              </Typography>
                                            </>
                                          ) : (
                                            <Typography variant="body2" color="text.secondary">
                                              Not Applicable
                                            </Typography>
                                          )}


                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                ));
                              })()}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                      
                      <Typography variant="subtitle1" gutterBottom sx={{ 
                        fontWeight: 600,
                        color: '#1A005D',
                        display: 'flex',
                        alignItems: 'center',
                        mb: 2
                      }}>
                        <ListAltIcon sx={{ mr: 1, color: '#1A005D' }} />
                        Individual Feedback
                      </Typography>
                      
                      <Paper elevation={0} sx={{ 
                        border: '1px solid rgba(0, 0, 0, 0.08)', 
                        borderRadius: '8px',
                        overflow: 'hidden',
                        mb: 3,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                      }}>
                        <TableContainer>
                          <Table>
                            <TableHead sx={{ 
                              backgroundColor: '#f0fdf4',
                              '& th': {
                                fontWeight: 600,
                                color: '#1A005D'
                              }
                            }}>
                              <TableRow>
                                <TableCell>Trainee</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Branch</TableCell>
                                <TableCell>Overall</TableCell>
                                <TableCell>Comments</TableCell>
                                <TableCell>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {traineeFeedbacks.map((feedback) => (
                                <TableRow 
                                  key={feedback.id} 
                                  hover
                                  sx={{
                                    '&:nth-of-type(odd)': {
                                      backgroundColor: 'rgba(34, 197, 94, 0.02)'
                                    }
                                  }}
                                >
                                  <TableCell sx={{ borderBottomColor: 'rgba(0, 0, 0, 0.04)' }}>
                                    <Box display="flex" alignItems="center">
                                      <Avatar 
                                        sx={{ 
                                          width: 28, 
                                          height: 28, 
                                          mr: 1.5,
                                          fontSize: '0.75rem',
                                          backgroundColor: '#bbf7d0',
                                          color: '#1A005D'
                                        }}
                                      >
                                        {/* {feedback.trainee_name.split(' ').map(n => n[0]).join('')} */}
                                        {feedback.trainee_name ? feedback.trainee_name.split(' ').map(n => n[0]).join('') : '--'}
                                      </Avatar>
                                      {feedback.trainee_name}
                                    </Box>
                                  </TableCell>
                                  <TableCell sx={{ borderBottomColor: 'rgba(0, 0, 0, 0.04)' }}>
                                    {feedback.trainee_department}
                                  </TableCell>
                                  <TableCell sx={{ borderBottomColor: 'rgba(0, 0, 0, 0.04)' }}>
                                    {feedback.trainee_branch}
                                  </TableCell>
                                  <TableCell sx={{ borderBottomColor: 'rgba(0, 0, 0, 0.04)' }}>
  {feedback.feedback_form_answer && feedback.feedback_form_answer !== '{}' ? (
    (() => {
      const answers = JSON.parse(feedback.feedback_form_answer);

      // Only rating questions (Q1–Q12)
      const ratingKeys = Object.keys(answers).filter(
        key => Number(key) <= 12 && answers[key]
      );

      if (ratingKeys.length === 0) {
        return '-';
      }

      const avg =
        ratingKeys.reduce((sum, k) => sum + Number(answers[k]), 0) /
        ratingKeys.length;

      return (
        <Rating
          value={avg}
          readOnly
          max={5}
          precision={0.1}
          size="small"
          sx={{
            '& .MuiRating-iconFilled': {
              color: '#ffef0a'
            }
          }}
        />
      );
    })()
  ) : (
    <Chip
      label="Not submitted"
      size="small"
      variant="outlined"
      color="default"
      sx={{
        backgroundColor: '#ffef0a',
        borderColor: '#ffef0a'
      }}
    />
  )}
</TableCell>

                                  <TableCell sx={{ 
                                    maxWidth: '200px',
                                    borderBottomColor: 'rgba(0, 0, 0, 0.04)'
                                  }}>
                                    {feedback.feedback_form_comments_or_suggestions ? (
                                      <Tooltip 
                                        title={feedback.feedback_form_comments_or_suggestions}
                                        placement="top"
                                        arrow
                                      >
                                        <Typography 
                                          variant="body2" 
                                          sx={{
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            backgroundColor: feedback.feedback_form_comments_or_suggestions ? '#f8fafc' : 'transparent',
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: '4px'
                                          }}
                                        >
                                          {feedback.feedback_form_comments_or_suggestions}
                                        </Typography>
                                      </Tooltip>
                                    ) : '-'}
                                  </TableCell>
                                  <TableCell sx={{ borderBottomColor: 'rgba(0, 0, 0, 0.04)' }}>
                                    {feedback.feedback_form_answer && feedback.feedback_form_answer !== '{}' ? (
                                      <Tooltip title="Download feedback" arrow>
                                        <IconButton 
                                          size="small"
                                          onClick={() => exportIndividualFeedback(feedback)}
                                          sx={{
                                            color: '#1A005D',
                                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                            '&:hover': {
                                              backgroundColor: 'rgba(34, 197, 94, 0.2)'
                                            }
                                          }}
                                        >
                                          <DownloadIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    ) : null}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        mt: 3,
                        '& button': {
                          borderRadius: '6px',
                          textTransform: 'none',
                          fontWeight: 600,
                          letterSpacing: '0.5px'
                        }
                      }}>
                        <Button 
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={exportAllIndividualFeedbacks}
                          disabled={traineeFeedbacks.filter(f => f.feedback_form_answer && f.feedback_form_answer !== '{}').length === 0}
                          sx={{ 
                            mr: 2,
                            borderWidth: '2px',
                            '&:hover': {
                              borderWidth: '2px'
                            }
                          }}
                        >
                          Export All (ZIP)
                        </Button>
                        
                        <Box>
                          <Button 
                            variant="outlined"
                            startIcon={<PictureAsPdfIcon />}
                            onClick={() => exportToPDF('trainee')}
                            sx={{ 
                              mr: 2,
                              borderWidth: '2px',
                              '&:hover': {
                                borderWidth: '2px'
                              }
                            }}
                          >
                            Summary PDF
                          </Button>
                          <Button 
                            variant="contained"
                            startIcon={<DescriptionIcon />}
                            onClick={exportToExcel}
                            sx={{
                              background: 'linear-gradient(to right, #1A005D 0%, #1A005D 100%)',
                              boxShadow: '#1A005D',
                              '&:hover': {
                                background: 'linear-gradient(to right, #1A005D 0%, #1A005D 100%)',
                                boxShadow: '#1A005D'
                              }
                            }}
                          >
                            Full Excel Report
                          </Button>
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <Box 
                      display="flex" 
                      flexDirection="column"
                      justifyContent="center" 
                      alignItems="center" 
                      minHeight="300px"
                      textAlign="center"
                      sx={{
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: '8px',
                        border: '1px dashed rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      <InfoOutlinedIcon sx={{ 
                        fontSize: 48, 
                        color: '#bdbdbd', 
                        mb: 2,
                        opacity: 0.6
                      }} />
                      <Typography variant="h6" color="textSecondary" gutterBottom sx={{ fontWeight: 500 }}>
                        No Trainee Feedback Available
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ maxWidth: '400px' }}>
                        No trainees have submitted feedback for this session yet.
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </>
        )}
        
        {mainTab === 1 && (
  <Box sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom sx={{ 
      fontWeight: 600,
      color: '#1e293b',
      display: 'flex',
      alignItems: 'center',
      mb: 3
    }}>
      <AnalyticsIcon sx={{ mr: 1, color: '#6366f1' }} />
      Training Effectiveness Analysis
    </Typography>
    
    {loading ? (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress 
          size={60} 
          thickness={4} 
          sx={{ 
            color: '#6366f1',
            '& circle': {
              strokeLinecap: 'round'
            }
          }} 
        />
      </Box>
    ) : effectivenessData ? (
      <>
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{
              p: 2.5,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
              borderLeft: '4px solid #1A005D',
              height: '100%'
            }}>
              <Typography variant="subtitle2" color="#4f46e5" sx={{ fontWeight: 600, mb: 1 }}>
                Total Participants Assessed
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#4f46e5' }}>
                {effectivenessData.AllTraineeffectiveness.length}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ color: '#10b981', mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  {effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessStatus === 1).length} marked effective
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{
              p: 2.5,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              borderLeft: '4px solid #10b981',
              height: '100%'
            }}>
              <Typography variant="subtitle2" color="#059669" sx={{ fontWeight: 600, mb: 1 }}>
                Effective Training
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669' }}>
                {Math.round(
                  (effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessStatus === 1).length / 
                  effectivenessData.AllTraineeffectiveness.length) * 100
                ) || 0}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <AssessmentIcon sx={{ color: '#10b981', mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  {effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessStatus === 1).length} participants
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{
              p: 2.5,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              borderLeft: '4px solid #ef4444',
              height: '100%'
            }}>
              <Typography variant="subtitle2" color="#dc2626" sx={{ fontWeight: 600, mb: 1 }}>
                Needs Retraining
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc2626' }}>
                {effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessRetrainingRequired === 1).length}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <WarningIcon sx={{ color: '#ef4444', mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  {Math.round(
                    (effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessRetrainingRequired === 1).length / 
                    effectivenessData.AllTraineeffectiveness.length) * 100
                  ) || 0}% of participants
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Effectiveness Measurement Breakdown */}
        <Paper elevation={0} sx={{ 
          p: 3, 
          mb: 3,
          borderRadius: '12px',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
        }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#1e293b' }}>
            Effectiveness Measurement Breakdown
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Measurement A (Pre/Post Test)
                </Typography>
                <CircularProgress
                  variant="determinate"
                  value={
                    (effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessMeasuredA === 1).length / 
                    effectivenessData.AllTraineeffectiveness.length) * 100
                  }
                  size={120}
                  thickness={4}
                  sx={{
                    '& circle': {
                      strokeLinecap: 'round'
                    },
                    '& .MuiCircularProgress-circle': {
                      stroke: '#6366f1'
                    }
                  }}
                />
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessMeasuredA === 1).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Passed this measurement
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Measurement B (Observation)
                </Typography>
                <CircularProgress
                  variant="determinate"
                  value={
                    (effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessMeasuredB === 1).length / 
                    effectivenessData.AllTraineeffectiveness.length) * 100
                  }
                  size={120}
                  thickness={4}
                  sx={{
                    '& circle': {
                      strokeLinecap: 'round'
                    },
                    '& .MuiCircularProgress-circle': {
                      stroke: '#10b981'
                    }
                  }}
                />
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessMeasuredB === 1).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Passed this measurement
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Measurement C (Performance)
                </Typography>
                <CircularProgress
                  variant="determinate"
                  value={
                    (effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessMeasuredC === 1).length / 
                    effectivenessData.AllTraineeffectiveness.length) * 100
                  }
                  size={120}
                  thickness={4}
                  sx={{
                    '& circle': {
                      strokeLinecap: 'round'
                    },
                    '& .MuiCircularProgress-circle': {
                      stroke: '#3b82f6'
                    }
                  }}
                />
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {effectivenessData.AllTraineeffectiveness.filter(t => t.EffectivenessMeasuredC === 1).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Passed this measurement
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Detailed Effectiveness Data */}
        <Paper elevation={0} sx={{ 
          p: 0,
          mb: 3,
          borderRadius: '12px',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
        }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ 
                backgroundColor: '#f5f3ff',
                '& th': {
                  fontWeight: 600,
                  color: '#1A005D'
                }
              }}>
                <TableRow>
                  <TableCell>Trainee</TableCell>
                  <TableCell align="center">Measurement A</TableCell>
                  <TableCell align="center">Measurement B</TableCell>
                  <TableCell align="center">Measurement C</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Retraining</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {effectivenessData.AllTraineeffectiveness.map((trainee, index) => (
                  <TableRow 
                    key={index}
                    hover
                    sx={{
                      '&:nth-of-type(odd)': {
                        backgroundColor: 'rgba(99, 102, 241, 0.02)'
                      }
                    }}
                  >
                    <TableCell sx={{ borderBottomColor: 'rgba(0, 0, 0, 0.04)' }}>
                      <Typography variant="body2">{trainee.trainee_name}</Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottomColor: 'rgba(0, 0, 0, 0.04)' }}>
                      {trainee.EffectivenessMeasuredA === 1 ? (
                        <CheckCircleIcon sx={{ color: '#10b981' }} />
                      ) : trainee.EffectivenessMeasuredA === 0 ? (
                        <CancelIcon sx={{ color: '#ef4444' }} />
                      ) : (
                        <HelpIcon sx={{ color: '#6b7280' }} />
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottomColor: 'rgba(0, 0, 0, 0.04)' }}>
                      {trainee.EffectivenessMeasuredB === 1 ? (
                        <CheckCircleIcon sx={{ color: '#10b981' }} />
                      ) : trainee.EffectivenessMeasuredB === 0 ? (
                        <CancelIcon sx={{ color: '#ef4444' }} />
                      ) : (
                        <HelpIcon sx={{ color: '#6b7280' }} />
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottomColor: 'rgba(0, 0, 0, 0.04)' }}>
                      {trainee.EffectivenessMeasuredC === 1 ? (
                        <CheckCircleIcon sx={{ color: '#10b981' }} />
                      ) : trainee.EffectivenessMeasuredC === 0 ? (
                        <CancelIcon sx={{ color: '#ef4444' }} />
                      ) : (
                        <HelpIcon sx={{ color: '#6b7280' }} />
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottomColor: 'rgba(0, 0, 0, 0.04)' }}>
                      {trainee.EffectivenessStatus === 1 ? (
                        <Chip 
                          label="Effective" 
                          size="small" 
                          sx={{ backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 500 }} 
                        />
                      ) : trainee.EffectivenessStatus === 0 ? (
                        <Chip 
                          label="Not Effective" 
                          size="small" 
                          sx={{ backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 500 }} 
                        />
                      ) : (
                        <Chip 
                          label="Pending" 
                          size="small" 
                          sx={{ backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 500 }} 
                        />
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottomColor: 'rgba(0, 0, 0, 0.04)' }}>
                      {trainee.EffectivenessRetrainingRequired === 1 ? (
                        <Chip 
                          label="Required" 
                          size="small" 
                          sx={{ backgroundColor: '#ffedd5', color: '#ea580c', fontWeight: 500 }} 
                        />
                      ) : trainee.EffectivenessRetrainingRequired === 0 ? (
                        <Chip 
                          label="Not Required" 
                          size="small" 
                          sx={{ backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 500 }} 
                        />
                      ) : (
                        <Chip 
                          label="To be Reviewed" 
                          size="small" 
                          sx={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontWeight: 500 }} 
                        />
                      )}

                    </TableCell>
                    <TableCell sx={{ borderBottomColor: 'rgba(0, 0, 0, 0.04)' }}>
                      <Typography variant="body2">
                        {trainee.EffectivenessRemarks || 'No remarks'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        
      {/* Export Options */}
<Box sx={{ 
  display: 'flex', 
  justifyContent: 'flex-end',
  gap: 2,
  '& button': {
    borderRadius: '8px',
    textTransform: 'none',
    fontWeight: 600,
    letterSpacing: '0.5px',
    px: 3,
    py: 1.5
  }
}}>
  {/* Excel Export Button */}
  <Button 
    variant="contained"
    startIcon={exportLoading ? <CircularProgress size={20} color="inherit" /> : <AssessmentIcon />}
    onClick={() => {
      setExportLoading(true);
      exportEffectivenessReport(); // Your existing Excel export function
      setTimeout(() => setExportLoading(false), 1000);
    }}
    disabled={exportLoading || !effectivenessData}
    sx={{
      background: 'linear-gradient(to right, #059669 0%, #10B981 100%)',
      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
      '&:hover': {
        background: 'linear-gradient(to right, #047857 0%, #059669 100%)',
        boxShadow: '0 4px 8px rgba(16, 185, 129, 0.4)'
      },
      '&.Mui-disabled': {
        background: '#e2e8f0',
        color: '#64748b'
      }
    }}
  >
    {exportLoading ? 'Exporting...' : 'Export to Excel'}
  </Button>

 <Button 
  variant="contained"
  startIcon={wordExportLoading ? <CircularProgress size={20} color="inherit" /> : <DescriptionIcon />}
  onClick={async () => {
  try {
    setWordExportLoading(true);
    await exportEffectivenessToWord(effectivenessData, selectedSession);
  } catch (err) {
    console.error('Export failed:', err);
    alert('Export to Word failed.');
  } finally {
    setWordExportLoading(false);
  }
}}

  disabled={wordExportLoading || !effectivenessData}
  sx={{
    background: 'linear-gradient(to right, #1D4ED8 0%, #3B82F6 100%)',
    boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)',
    '&:hover': {
      background: 'linear-gradient(to right, #1E40AF 0%, #1D4ED8 100%)',
      boxShadow: '0 4px 8px rgba(59, 130, 246, 0.4)'
    },
    '&.Mui-disabled': {
      background: '#e2e8f0',
      color: '#64748b'
    }
  }}
>
  {wordExportLoading ? 'Exporting...' : 'Export to Word'}
</Button>
</Box>
      </>
    ) : (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="300px"
        textAlign="center"
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          borderRadius: '8px',
          border: '1px dashed rgba(0, 0, 0, 0.08)'
        }}
      >
        <InfoOutlinedIcon sx={{ 
          fontSize: 48, 
          color: '#bdbdbd', 
          mb: 2,
          opacity: 0.6
        }} />
        <Typography variant="h6" color="textSecondary" gutterBottom sx={{ fontWeight: 500 }}>
          No Effectiveness Data Available
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ maxWidth: '400px' }}>
          Effectiveness measurements have not been recorded for this training session.
        </Typography>
      </Box>
    )}
  </Box>
)}
          </>
    )}
  </DialogContent>
</Dialog>
      </div>
    </div>
  );
};

export default FeedbackReports;



