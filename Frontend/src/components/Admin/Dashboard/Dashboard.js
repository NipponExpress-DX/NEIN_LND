import { useEffect, useState, useMemo } from "react";
import { 
  Box, Tabs, Tab, Grid, MenuItem, Select, TextField, Button,
  Card, CardContent, Typography, IconButton, Divider,
  Paper, Container, useTheme, useMediaQuery, Menu, Tooltip,
  Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, CircularProgress
} from "@mui/material";

import { AutoAwesome, ArrowForward, Event } from "@mui/icons-material";

import { Chip } from "@mui/material";
import { CheckCircle, Cancel, Schedule } from "@mui/icons-material";
import { Close } from "@mui/icons-material";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  Tooltip as RechartsTooltip, Legend, LineChart, 
  Line, CartesianGrid, Area, AreaChart, ResponsiveContainer
} from "recharts";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Bolt, AccessTime, Insights } from "@mui/icons-material";

import axios from "axios";
import { 
  CalendarToday, FileCopy, TrendingUp, 
  Person, Business, LocationCity, Assessment, AdminPanelSettings,
} from "@mui/icons-material";
import DepartmentalTrainingDashboard from "./DepartmentalTrainingDashboard";
import AdminView from "./AdminView";
import BranchTrainingDashboard from "./BranchTrainingDashboard";
import { useNavigate } from 'react-router-dom';
import { ReactComponent as BookIcon } from '../../../images/books.svg';
import { ReactComponent as TeachingIcon } from '../../../images/teaching.svg';
import { ReactComponent as GraduateIcon } from '../../../images/graduation.svg';
import { ReactComponent as NoEntryIcon } from '../../../images/noentry.svg';
import { ReactComponent as FeedbackIcon } from '../../../images/feedback.svg';
import '../../../css/Admincss/Dashboard/Loader.css'; 

const Dashboard = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [dataProgress, setDataProgress] = useState([]);
  const [dataUpcoming, setDataUpcoming] = useState([]);
  const [dataLearningComparison, setDataLearningComparison] = useState(null);
  const [userRole, setUserRole] = useState(null);  
  const [empName, setEmpName] = useState(null);
  const [deptName, setDeptName] = useState(null);
  const [branchName, setBranchName] = useState(null);
  const navigate = useNavigate();
  const [pendingFeedbackSessions, setPendingFeedbackSessions] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const [userId, setUserId] = useState("");
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [filter, setFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const rolePermissions = JSON.parse(sessionStorage.getItem("rolePermissions")) || {};
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsTitle, setDetailsTitle] = useState('');
  const [detailsData, setDetailsData] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [upcomingPreview, setUpcomingPreview] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);

 const fetchTrainingDetails = async (type, title) => {
    setDetailsTitle(title);
    setDetailsModalOpen(true);
    setDetailsLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/dashboard/trainee_training_details`,
        { userid: userId, type }
      );
      setDetailsData(response.data.trainings || []);
    } catch (error) {
      console.error("Error fetching training details:", error);
      setDetailsData([]);
    } finally {
      setDetailsLoading(false);
    }
  };
// Helper: normalize to local midnight, then diff in whole days — avoids
// time-of-day/timezone rounding errors that were causing wrong "Today" labels
const getDaysAway = (dateStr) => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
};

const getDayChipLabel = (daysAway) => {
  if (daysAway === null) return 'Upcoming';
  if (daysAway < 0) return `Overdue ${Math.abs(daysAway)}d`;
  if (daysAway === 0) return 'Today';
  if (daysAway === 1) return 'Tomorrow';
  return `In ${daysAway}d`;
};


const fetchUpcomingPreview = async () => {
  setUpcomingLoading(true);
  try {
    const response = await axios.post(
      `${API_BASE_URL}/dashboard/trainee_training_details`,
      { userid: userId, type: 'assigned' }
    );
    const trainings = response.data.trainings || [];
    // Drop sessions whose date has already passed — "assigned" should only mean upcoming
    const notOverdue = trainings.filter(t => {
      if (!t.session_date) return true; // keep date-TBD sessions
      const daysAway = getDaysAway(t.session_date);
      return daysAway === null || daysAway >= 0;
    });
    setUpcomingPreview(notOverdue);
  } catch (error) {
    console.error("Error fetching upcoming preview:", error);
    setUpcomingPreview([]);
  } finally {
    setUpcomingLoading(false);
  }
};
const sortedUpcoming = [...upcomingPreview].sort((a, b) => {
  if (!a.session_date) return 1;
  if (!b.session_date) return -1;
  return new Date(a.session_date) - new Date(b.session_date);
});

useEffect(() => {
  if (userId) {
    fetchData();
    fetchUpcomingTraining();
    fetchLearningAnalytics();
    fetchUpcomingPreview();
  }
}, [userId]);


const getInsightMessage = () => {
  const attended = dataProgress.find(d => d.name === "Present")?.value || 0;
  const absent = dataProgress.find(d => d.name === "Absent")?.value || 0;
  const upcoming = dataProgress.find(d => d.name === "Assigned Trainings")?.value || 0;
  const total = attended + absent;
  const rate = total > 0 ? Math.round((attended / total) * 100) : null;

  if (upcoming > 0 && rate !== null) {
    return `You've completed ${rate}% of your past trainings, with ${upcoming} more coming up.`;
  }
  if (upcoming > 0) {
    return `You have ${upcoming} upcoming training${upcoming > 1 ? 's' : ''} on your calendar.`;
  }
  if (rate !== null) {
    return `You've completed ${rate}% of your assigned trainings so far.`;
  }
  return `No training activity yet — check back soon.`;
};

const getNextSessionCountdown = () => {
  const dated = [...upcomingPreview]
    .filter(t => t.session_date)
    .sort((a, b) => new Date(a.session_date) - new Date(b.session_date));
  if (dated.length === 0) return null;
  const next = dated[0];
  return { training: next, diffDays: getDaysAway(next.session_date) };
};


const getCompletionRate = () => {
  const attended = dataProgress.find(d => d.name === "Present")?.value || 0;
  const absent = dataProgress.find(d => d.name === "Absent")?.value || 0;
  const total = attended + absent;
  return total > 0 ? Math.round((attended / total) * 100) : 0;
};

const getStatusChip = (item) => {
  if (item.attendance_status === 1) {
    return <Chip icon={<CheckCircle sx={{ fontSize: 16 }} />} label="Attended" size="small" sx={{ backgroundColor: 'rgba(142,196,0,0.15)', color: '#5a8000', fontWeight: 600 }} />;
  }
  if (item.attendance_status === 0) {
    return <Chip icon={<Cancel sx={{ fontSize: 16 }} />} label="Absent" size="small" sx={{ backgroundColor: 'rgba(244,94,109,0.15)', color: '#F45E6D', fontWeight: 600 }} />;
  }
  return <Chip icon={<Schedule sx={{ fontSize: 16 }} />} label="Upcoming" size="small" sx={{ backgroundColor: 'rgba(67,97,238,0.15)', color: '#4361EE', fontWeight: 600 }} />;
};

  const hasAccess = (section, subSection, permissionType) => {
    if (!rolePermissions[section] || !rolePermissions[section][subSection]) return false;
    return rolePermissions[section][subSection][permissionType] === 1;
  };

  const [filters, setFilters] = useState({
    branch: "",
    subBranch: "",
    startDate: "",
    endDate: "",
    department: "",
    courseCategory: "",
    employeeName: "",  
  });

  const resetFilters = () => {
    setFilters({
      branch: "",
      subBranch: "",
      startDate: "",
      endDate: "",
      department: "",
      courseCategory: "",
      employeeName: "",
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  useEffect(() => {
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails") || "{}");
    if (userDetails) {
      setUserRole(userDetails.userRole ?? null);
      setUserId(userDetails.emp_id ?? null);
      setEmpName(userDetails.empname ?? null);
      setDeptName(userDetails.department_code ?? null);
      setBranchName(userDetails.user_branch ?? null);
    }
  }, []);



//   const checkDashboardPermissions = (permissions) => {
//   if (!permissions || !permissions.Dashboard) return {
//     showUserDashboard: true,
//     showAdminDashboard: false,
//     showBranchDashboard: false,
//     showDepartmentDashboard: false
//   };

//   const hasDepartment = permissions.Dashboard['Deparatment-Dashboard']?.View === 1;
//   const hasBranch = permissions.Dashboard['Branch-Dashboard']?.View === 1;
//   const hasUser = permissions.Dashboard['User-Dashboard']?.View === 1;

//   return {
//     showUserDashboard: hasUser,
//     showDepartmentDashboard: hasDepartment,
//     showBranchDashboard: hasBranch,
//     // Show Admin tab only if user has ALL three dashboards
//     showAdminDashboard: hasUser && hasDepartment && hasBranch
//   };
// };
  const checkDashboardPermissions = (permissions) => {
  if (!permissions || !permissions.Dashboard) return {
    showUserDashboard: true,
    showAdminDashboard: false,
    showBranchDashboard: false,
    showDepartmentDashboard: false
  };

  const hasDepartment = permissions.Dashboard['Deparatment-Dashboard']?.View === 1;
  const hasBranch = permissions.Dashboard['Branch-Dashboard']?.View === 1;
  const hasUser = permissions.Dashboard['User-Dashboard']?.View === 1;

  return {
    showUserDashboard: hasUser,
    showDepartmentDashboard: false, // hidden for everyone
    showBranchDashboard: false,     // hidden for everyone
    // Admin tab logic unchanged — still gated on the underlying (real) permissions,
    // not the display flags above, so Admin visibility doesn't break
    showAdminDashboard: hasUser && hasDepartment && hasBranch
  };
};
  const [dashboardPermissions, setDashboardPermissions] = useState({
    showUserDashboard: true,
    showAdminDashboard: false,
    showBranchDashboard: false,
    showDepartmentDashboard: false
  });
  
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/roleRoutes/roleMaster/FunctionalityListforRoleManagement`,
          { userRole: userRole.toString() }
        );
        const permissions = checkDashboardPermissions(response.data);
        setDashboardPermissions(permissions);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setDashboardPermissions({
          showUserDashboard: true,
          showAdminDashboard: false,
          showBranchDashboard: false,
          showDepartmentDashboard: false
        });
      }
    };
  
    if (userRole !== null) {
      fetchPermissions();
    }
  }, [userRole]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  // Modern color palette
  const COLORS = {
    primary: "#4361EE",
    secondary: "#3DD598",
    tertiary: "#FD76CB",
    quaternary: "#FFD166",
    error: "#F45E6D",
    warning: "#FF9800",
    disabled: "#9E9E9E",
    background: "#F7F9FC",
    cardBackground: "#FFFFFF",
    textDark: "#2D3748",
    textMedium: "#718096",
    textLight: "#A0AEC0",
    borderColor: "#E2E8F0",
    shadow: "rgba(67, 97, 238, 0.1)",
  };

  const fetchData = async () => {
    try {
      console.log("branch_assigned_to_user_attended userId",userId);
      const response = await axios.post(
        `${API_BASE_URL}/dashboard/branch_assigned_to_user_attended`,
        { userid: userId },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        setDataProgress([
          { name: "Training Events", value: response.data.branch_conducted_count || 0 },
          { name: "Assigned Trainings", value: response.data.Assign_count || 0 },
          { name: "Present", value: Number(response.data.present_count) || 0 },
          { name: "Absent", value: Number(response.data.absent_count) || 0 },
          { name: "Pending Feedbacks", value: response.data.branchFeedbackFormPendingCount || 0 }
        ]);
        
        setPendingFeedbackSessions(response.data.pending_feedback_sessions || []);
      }
    } catch (error) {
      console.error("API request failed:", error);
      setDataProgress([
        { name: "Training Events", value: 0 },
        { name: "Assigned Trainings", value: 0 },
        { name: "Present", value: 0 },
        { name: "Absent", value: 0 },
        { name: "Pending Feedbacks", value: 0 }
      ]);
      setPendingFeedbackSessions([]);
    }
  };

  const handleFeedbackClick = (event) => {
    if (pendingFeedbackSessions.length === 0) return;
    
    if (pendingFeedbackSessions.length === 1) {
      const session = pendingFeedbackSessions[0];
      window.open(
        `${API_BASE_URL}/planning-route/PlanningSessionActiveAttendanceStatus/feedback/${session.planing_id}/${session.session_no}`,
        '_blank'
      );
    } else {
      // Show menu if multiple feedbacks pending
      setAnchorEl(event.currentTarget);
    }
  };
  
  const handleMenuClose = (session = null) => {
    setAnchorEl(null);
    if (session) {
      window.open(
        `${API_BASE_URL}/planning-route/PlanningSessionActiveAttendanceStatus/feedback/${session.planing_id}/${session.session_no}`,
        '_blank'
      );
    }
  };


  const fetchUpcomingTraining = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/dashboard/Planned_branch_and_assigned_to_user_Planning_Training_under_process`, 
        { userid: userId }
      );
  
      if (response.data) {
        setDataUpcoming([
          { name: "Planned", value: Number(response.data.Planned_branch_count) || 0 },
          { name: "Assigned", value: Number(response.data.Planned_branch_and_assigned_to_user_Count) || 0 }
        ]);
      }
    } catch (error) {
      console.error("API request failed:", error.message);
    }
  };
  
  const fetchLearningAnalytics = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/dashboard/Assign_count_Assign_to_user_time_and_Assign_attadence_count_Assign_to_user_spend_time`, {
        userid: userId
      });

      if (response.data) {
        setDataLearningComparison([
          { name: "Trainings", Assigned: Number(response.data.Assign_to_user_count) || 0, Attended: Number(response.data.Assign_attendance_count) || 0 },
          { name: "Hours", Assigned: Number(response.data.Assigned_hours) || 0, Attended: Number(response.data.Assign_attendance_hours) || 0 }
        ]);
      }
    } catch (error) {
      console.error("API request failed:", error.message);
    }
  };

  const CustomBar = (props) => {
    const { fill, x, y, width, height } = props;
    return (
      <g>
        <rect 
          x={x} 
          y={y} 
          width={width} 
          height={height} 
          fill={fill}
          rx={6}
          ry={6}
        />
      </g>
    );
  };

  const DashboardCard = ({ title, subtitle, icon, chart, height = 325 }) => (
    <Paper elevation={0} sx={{ 
      backgroundColor: COLORS.cardBackground,
      boxShadow: `0 4px 20px ${COLORS.shadow}`,
      borderRadius: '16px',
      height: height || '100%',
      overflow: 'hidden',
      width: '100%',
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 30px ${COLORS.shadow}`,
      }
    }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 1.5,
          justifyContent: 'space-between' 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon && (
              <Box sx={{ 
                mr: 1.5,
                backgroundColor: `${COLORS.primary}15`,
                borderRadius: '12px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36
              }}>
                {icon}
              </Box>
            )}
            <Box>
              <Typography variant="h6" sx={{ 
                color: '#1A005D',
                fontWeight: 600,
                fontSize: '1rem',
                lineHeight: 1.2
              }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" sx={{ 
                  color: '#8EC400',
                  fontSize: '0.8rem'
                }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        {chart}
      </Box>
    </Paper>
  );

  const StatCard = ({ title, value, icon, color, subtitle, height = 110 }) => (
    <Paper elevation={0} sx={{ 
      backgroundColor: COLORS.cardBackground,
      boxShadow: `0 4px 20px ${COLORS.shadow}`,
      borderRadius: '16px',
      p: 0.5,
      height: height || '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 30px ${COLORS.shadow}`,
      }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              fontSize: '1.1rem',
              color: color || COLORS.textDark,
              mb: 0,
            }}
          >
            {title}
          </Typography>

          <Typography variant="h4" sx={{ 
            color: '#1A005D',
            fontWeight: 600,
            fontSize: {xs: '1.5rem', md: '2rem'}
          }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ color: '#8EC400', mt: 1 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ 
          backgroundColor: `${color || COLORS.primary}15`,
          borderRadius: '12px', 
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </Box>
      </Box>
    </Paper>
  );

  return (
    <div className="admin-dashboard-content">
      <div className="main-content">
      <Box sx={{ 
  backgroundColor: COLORS.background,
  minHeight: '100vh', 
  pt: 1,  // Reduced from pt: 2
  pb: 1,  // Reduced from pb: 2
  backgroundImage: 'linear-gradient(120deg, rgba(244,246,249,1) 0%, rgba(237,242,247,1) 100%)',
}}>
  <Container maxWidth="xl">
    <Box sx={{ 
      mb: 1,  // Reduced from mb: 5
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      justifyContent: 'space-between',
      alignItems: { xs: 'flex-start', md: 'center' },
    }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: 0.25, 
        width: '100%' 
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap',
          gap: 1, 
        }}>
          <Typography variant="h3" sx={{ 
            color: '#1A005D',
            fontWeight: 800,
            fontSize: { xs: '1.6rem', md: '2rem' },  // Slightly reduced font size
            letterSpacing: '-0.5px',
            mb: 0.5  // Added small bottom margin
          }}>
            Growth Hub
          </Typography>
          
          
          {[0, 1, 2, 3].includes(tabIndex) && (
            <Box sx={{ 
              backgroundColor: 'rgba(26, 0, 93, 0.05)',
              borderRadius: '12px',
              px: 1.5,  // Reduced from px: 2
              py: 0.5,  // Reduced from py: 1
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,  // Reduced from gap: 1
              borderLeft: tabIndex === 1 ? '3px solid #8EC400' :
                          tabIndex === 2 ? '3px solid #d808c7' : 
                          tabIndex === 3 ? '3px solid #FF5722' : 
                          '3px solid #1A005D',
              marginLeft: 'auto' 
            }}>
              {tabIndex === 0 && <Person sx={{ color: '#1A005D', fontSize: '1.1rem' }} />}  
              
              {tabIndex === 1 && <Business sx={{ color: '#1A005D', fontSize: '1.1rem' }} />}
              {tabIndex === 2 && <LocationCity sx={{ color: '#1A005D', fontSize: '1.1rem' }} />}
              {tabIndex === 3 && <AdminPanelSettings sx={{ color: '#1A005D', fontSize: '1.1rem' }} />}
              
              <Typography variant="subtitle1" sx={{ 
                color: '#1A005D',
                fontWeight: 600,
                fontSize: '1rem',  // Reduced from 1.1rem
                whiteSpace: 'nowrap'
              }}>
                {tabIndex === 0 ? empName : 
                    tabIndex === 1 ? deptName : 
                    tabIndex === 2 ? branchName : 
                    "Admin"} {/* Admin Activities */}
                  </Typography>
            </Box>
          )}
        </Box>
        
        <Typography variant="h6" sx={{ 
          color: '#8EC400',
          fontWeight: 600,
          fontSize: { xs: '0.9rem', md: '1rem' },  // Reduced font size
          mb: 0.5  // Added small bottom margin
        }}>
          Welcome to your training progress monitor for this year!!
        </Typography>
      </Box>
      <div class="loader">
           <div class="loader__bar"></div>
           <div class="loader__bar"></div>
           <div class="loader__bar"></div>
           <div class="loader__bar"></div>
           <div class="loader__bar"></div>
           <div class="loader__ball"></div>
          </div>
    </Box>
      



            {/* Tabs Navigation */}
            <Paper sx={{ 
              borderRadius: '20px',
              mb: 3, 
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(26, 0, 93, 0.1)',
              position: 'relative',
              background: 'linear-gradient(to bottom, #FFFFFF 0%, #F8F9FF 100%)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px', 
                background: 'linear-gradient(90deg, #1A005D 0%, #8EC400 100%)',
                zIndex: 1,
              }
            }}>
              <Tabs 
                value={tabIndex} 
                onChange={handleTabChange} 
                sx={{
                  padding: '8px 14px',
                  "& .MuiTab-root": {
                    textTransform: 'none',
                    fontSize: '0.95rem', 
                    fontWeight: 500,
                    color: '#5A5A72',
                    minHeight: "48px", 
                    padding: '12px 16px', 
                    borderRadius: '10px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    margin: '0 3px', 
                    "&.Mui-selected": {
                      color: '#1A005D',
                      fontWeight: 600,
                      backgroundColor: 'rgba(142, 196, 0, 0.1)',
                      borderBottom: '2px solid #8EC400', 
                    },
                    "&:hover": {
                      backgroundColor: 'rgba(26, 0, 93, 0.05)',
                      color: '#1A005D',
                      transform: 'translateY(-1px)', 
                    }
                  },
                  "& .MuiTabs-indicator": {
                    display: 'none',
                  }
                }}
              >
                <Tab 
                  label="My Learning" 
                  icon={
                    <Box sx={{ 
                      backgroundColor: tabIndex === 0 ? '#1A005D' : 'rgba(26, 0, 93, 0.1)',
                      borderRadius: '6px',
                      width: '28px', 
                      height: '28px', 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s',
                    }}>
                      <Person fontSize="small" sx={{ color: tabIndex === 0 ? '#FFFFFF' : '#1A005D' }} />
                    </Box>
                  } 
                  iconPosition="start" 
                />
                
                
                  {dashboardPermissions.showDepartmentDashboard && (
                  <Tab 
                    label="Department Journey" 
                    icon={
                      <Box sx={{ 
                        backgroundColor: tabIndex === 1 ? '#1A005D' : 'rgba(26, 0, 93, 0.1)',
                        borderRadius: '6px',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s',
                      }}>
                        <Assessment fontSize="small" sx={{ color: tabIndex === 2 ? '#FFFFFF' : '#1A005D' }} />
                      </Box>
                    } 
                    iconPosition="start" 
                  />)
                }
                
                {dashboardPermissions.showBranchDashboard && (

                  <Tab 
                    label="Branch Insights" 
                    icon={
                      <Box sx={{ 
                        backgroundColor: tabIndex === 2 ? '#1A005D' : 'rgba(26, 0, 93, 0.1)',
                        borderRadius: '6px',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s',
                      }}>
                        <LocationCity fontSize="small" sx={{ color: tabIndex === 3 ? '#FFFFFF' : '#1A005D' }} />
                      </Box>
                    } 
                    iconPosition="start" 
                  />)
                }
                {dashboardPermissions.showAdminDashboard && (

                  <Tab 
                    label="Admin Activities" 
                    icon={
                      <Box sx={{ 
                        backgroundColor: tabIndex === 3 ? '#1A005D' : 'rgba(26, 0, 93, 0.1)',
                        borderRadius: '6px',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s',
                      }}>
                        <AdminPanelSettings fontSize="small" sx={{ color: tabIndex === 1 ? '#FFFFFF' : '#1A005D' }} />
                      </Box>
                    } 
                    iconPosition="start" 
                  />)
                }
                
              </Tabs>
            </Paper>
            {/* User View */}
         {tabIndex === 0 && (
            <Box>
              {/* Hero: AI Insight + Completion Ring */}
              <Paper elevation={0} sx={{
                mb: 3, p: { xs: 2.5, md: 3.5 }, borderRadius: '24px',
                background: 'linear-gradient(135deg, #0F0140 0%, #1A005D 35%, #4361EE 75%, #6C63FF 100%)',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(67,97,238,0.3)',
              }}>
                {/* decorative glow blobs */}
                <Box sx={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(142,196,0,0.25)', filter: 'blur(50px)' }} />
                <Box sx={{ position: 'absolute', bottom: -80, left: 100, width: 220, height: 220, borderRadius: '50%', background: 'rgba(253,118,203,0.2)', filter: 'blur(60px)' }} />

                <Grid container spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Box sx={{
                        backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '10px',
                        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <AutoAwesome sx={{ color: '#8EC400', fontSize: 18 }} />
                      </Box>
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                        AI Learning Insight
                      </Typography>
                    </Box>

                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: { xs: '1.15rem', md: '1.4rem' }, lineHeight: 1.4, mb: 2 }}>
                      {getInsightMessage()}
                    </Typography>

                    {(() => {
                      const countdown = getNextSessionCountdown();
                      return countdown ? (
                        <Box sx={{
                          display: 'inline-flex', alignItems: 'center', gap: 1,
                          backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '30px',
                          px: 2, py: 0.8, backdropFilter: 'blur(10px)'
                        }}>
                          <AccessTime sx={{ color: '#FFD166', fontSize: 18 }} />
                          <Typography sx={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>
                            {countdown.diffDays <= 0 ? 'Training today' : `Next up in ${countdown.diffDays} day${countdown.diffDays > 1 ? 's' : ''}`}
                            {' — '}{countdown.training.training_name || `Session ${countdown.training.session_no}`}
                          </Typography>
                        </Box>
                      ) : null;
                    })()}
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <Box sx={{ position: 'relative', width: 110, height: 110 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart 
                            innerRadius="70%" outerRadius="100%" 
                            data={[{ value: getCompletionRate(), fill: '#8EC400' }]} 
                            startAngle={90} endAngle={-270}
                          >
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar background={{ fill: 'rgba(255,255,255,0.15)' }} dataKey="value" cornerRadius={20} />
                          </RadialBarChart>
                        </ResponsiveContainer>
                        <Box sx={{
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.4rem', lineHeight: 1 }}>
                            {getCompletionRate()}%
                          </Typography>
                          <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 600 }}>
                            COMPLETION
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Summary Stats Row */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <div onClick={() => fetchTrainingDetails('assigned', 'Assigned Trainings')} style={{ cursor: 'pointer' }}>
                    <StatCard 
                      title="Assigned Trainings" 
                      value={dataProgress.find(d => d.name === "Assigned Trainings")?.value || 0}
                      icon={<TeachingIcon style={{ fill: COLORS.primary, width: 24, height: 10 }} />}
                      color={COLORS.primary}
                      subtitle="Upcoming • Click to view"
                    />
                  </div>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <div onClick={() => fetchTrainingDetails('attended', 'Attended Trainings')} style={{ cursor: 'pointer' }}>
                    <StatCard 
                      title="Attended Trainings" 
                      value={dataProgress.find(d => d.name === "Present")?.value || 0}
                      icon={<GraduateIcon style={{ fill: COLORS.quaternary, width: 24, height: 10 }} />}
                      color={COLORS.secondary}
                      subtitle="Completed • Click to view"
                    />
                  </div>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Tooltip 
                    title={
                      pendingFeedbackSessions.length === 0 
                        ? "No pending feedbacks" 
                        : `Click to complete ${pendingFeedbackSessions.length} pending feedback${pendingFeedbackSessions.length > 1 ? 's' : ''}`
                    }
                  >
                    <div 
                      onClick={handleFeedbackClick} 
                      style={{ 
                        cursor: pendingFeedbackSessions.length > 0 ? 'pointer' : 'default',
                        opacity: pendingFeedbackSessions.length > 0 ? 1 : 0.7,
                      }}
                    >
                      <StatCard 
                        title="Pending Feedbacks"    
                        value={dataProgress.find(d => d.name === "Pending Feedbacks")?.value || 0}
                        icon={<FeedbackIcon style={{ fill: COLORS.warning, width: 24, height: 10 }} />}
                        color={pendingFeedbackSessions.length > 0 ? COLORS.warning : COLORS.disabled}
                        subtitle={pendingFeedbackSessions.length > 0 ? "Action needed" : "All caught up"}
                      />
                    </div>
                  </Tooltip>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => handleMenuClose()}
                    PaperProps={{ style: { width: '30ch' } }}
                  >
                    {pendingFeedbackSessions.map((session, index) => (
                      <MenuItem 
                        key={index} 
                        onClick={() => handleMenuClose(session)}
                        sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}
                      >
                        Feedback form {index + 1}
                      </MenuItem>
                    ))}
                  </Menu>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <div onClick={() => fetchTrainingDetails('absent', 'Absent Trainings')} style={{ cursor: 'pointer' }}>
                    <StatCard 
                      title="Absent Trainings" 
                      value={dataProgress.find(d => d.name === "Absent")?.value || 0}
                      icon={<NoEntryIcon style={{ fill: COLORS.quaternary, width: 24, height: 10 }} />}
                      color={COLORS.error}
                      subtitle="Missed • Click to view"
                    />
                  </div>
                </Grid>
              </Grid>

              {/* Upcoming Sessions - horizontal scroll cards */}
              <Paper elevation={0} sx={{
                mb: 3, borderRadius: '20px', p: 2.5,
                backgroundColor: COLORS.cardBackground,
                boxShadow: `0 4px 20px ${COLORS.shadow}`,
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      background: 'linear-gradient(135deg, #4361EE, #8EC400)', borderRadius: '12px',
                      width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Event sx={{ color: '#fff', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ color: '#1A005D', fontWeight: 700, fontSize: '1.05rem' }}>
                        Upcoming Sessions
                      </Typography>
                      <Typography sx={{ color: '#8EC400', fontSize: '0.8rem' }}>
                        {upcomingPreview.length} on your calendar
                      </Typography>
                    </Box>
                  </Box>
                  {upcomingPreview.length > 0 && (
                    <Button 
                      size="small" 
                      endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                      onClick={() => fetchTrainingDetails('assigned', 'Assigned Trainings')}
                      sx={{ color: COLORS.primary, textTransform: 'none', fontWeight: 600 }}
                    >
                      View all
                    </Button>
                  )}
                </Box>

                {upcomingLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={28} sx={{ color: COLORS.primary }} />
                  </Box>
                ) : upcomingPreview.length === 0 ? (
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography sx={{ color: COLORS.textLight }}>No upcoming trainings right now.</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#E2E8F0', borderRadius: 3 } }}>
                   {sortedUpcoming.map((item, idx) => {
                      const daysAway = getDaysAway(item.session_date);
                      const isOverdue = daysAway !== null && daysAway < 0;
                      return (
                        <Paper key={idx} elevation={0} sx={{
                          p: 2, borderRadius: '16px', minWidth: 240, flexShrink: 0,
                          border: `1px solid ${COLORS.borderColor}`,
                          background: idx === 0 && !isOverdue
                            ? 'linear-gradient(135deg, rgba(67,97,238,0.08) 0%, rgba(142,196,0,0.08) 100%)' 
                            : '#fff',
                          opacity: isOverdue ? 0.7 : 1,
                          transition: 'transform 0.2s',
                          '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 6px 16px ${COLORS.shadow}` }
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Chip 
                              label={getDayChipLabel(daysAway)} 
                              size="small" 
                              sx={{ 
                                backgroundColor: isOverdue ? 'rgba(244,94,109,0.15)' : (idx === 0 ? '#4361EE' : 'rgba(67,97,238,0.12)'), 
                                color: isOverdue ? COLORS.error : (idx === 0 ? '#fff' : COLORS.primary), 
                                fontWeight: 700 
                              }} 
                            />
                            {idx === 0 && !isOverdue && <Bolt sx={{ color: '#FFD166', fontSize: 18 }} />}
                          </Box>
                          <Typography sx={{ fontWeight: 700, color: '#1A005D', fontSize: '0.92rem', mb: 0.5 }}>
                            {item.training_name || `Training #${item.planing_id}`}
                          </Typography>
                          <Typography variant="body2" sx={{ color: COLORS.textMedium }}>
                            {item.session_date ? new Date(item.session_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD'}
                            {item.from_time && ` • ${item.from_time.slice(0,5)}`}
                          </Typography>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </Paper>

              {/* Charts Row - redesigned */}
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    {/* Attendance Breakdown Donut */}
                    <Grid item xs={12} md={6}>
                      <DashboardCard 
                        title="Attendance Breakdown"
                        subtitle="Click a segment to see those trainings"
                        icon={<Insights sx={{ color: "#1A005D", fontSize: '1.2rem' }} />}
                        chart={
                          (() => {
                            const attended = dataProgress.find(d => d.name === "Present")?.value || 0;
                            const absent = dataProgress.find(d => d.name === "Absent")?.value || 0;
                            const upcoming = dataProgress.find(d => d.name === "Assigned Trainings")?.value || 0;
                            const total = attended + absent + upcoming;
                            const breakdownData = [
                              { name: 'Attended', value: attended, color: COLORS.secondary, type: 'attended' },
                              { name: 'Absent', value: absent, color: COLORS.error, type: 'absent' },
                              { name: 'Upcoming', value: upcoming, color: COLORS.primary, type: 'assigned' },
                            ].filter(d => d.value > 0);

                            return total === 0 ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
                                <Typography sx={{ color: COLORS.textLight }}>No training data yet</Typography>
                              </Box>
                            ) : (
                              <Box sx={{ position: 'relative' }}>
                                <ResponsiveContainer width="100%" height={260}>
                                  <PieChart>
                                    <Pie 
                                      data={breakdownData} 
                                      cx="50%" cy="50%" 
                                      outerRadius={95} innerRadius={65}
                                      paddingAngle={4}
                                      dataKey="value"
                                      cursor="pointer"
                                      onClick={(entry) => fetchTrainingDetails(entry.type, `${entry.name} Trainings`)}
                                    >
                                      {breakdownData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke={COLORS.cardBackground} strokeWidth={3} />
                                      ))}
                                    </Pie>
                                    <RechartsTooltip 
                                      contentStyle={{ backgroundColor: COLORS.cardBackground, border: `1px solid ${COLORS.borderColor}`, borderRadius: '8px', boxShadow: `0 4px 12px ${COLORS.shadow}`, padding: '8px 12px' }}
                                      formatter={(value, name) => [`${value} • click to view`, name]}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                                <Box sx={{
                                  position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%, -50%)',
                                  textAlign: 'center', pointerEvents: 'none'
                                }}>
                                  <Typography sx={{ color: '#1A005D', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1 }}>
                                    {total}
                                  </Typography>
                                  <Typography sx={{ color: COLORS.textLight, fontSize: '0.7rem', fontWeight: 600 }}>
                                    TOTAL
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2.5, mt: 1, flexWrap: 'wrap' }}>
                                  {breakdownData.map((d, i) => (
                                    <Box key={i} onClick={() => fetchTrainingDetails(d.type, `${d.name} Trainings`)} sx={{ display: 'flex', alignItems: 'center', gap: 0.7, cursor: 'pointer' }}>
                                      <Box sx={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: d.color }} />
                                      <Typography sx={{ fontSize: '0.78rem', color: COLORS.textMedium, fontWeight: 600 }}>
                                        {d.name} <span style={{ color: d.color, fontWeight: 700 }}>{d.value}</span>
                                      </Typography>
                                    </Box>
                                  ))}
                                </Box>
                              </Box>
                            );
                          })()
                        }
                      />
                    </Grid>

                    {/* Hours Invested Panel */}
                    <Grid item xs={12} md={6}>
                      <DashboardCard 
                        title="Hours Invested"
                        subtitle="Assigned vs. hours actually attended"
                        icon={<AccessTime sx={{ color: "#1A005D", fontSize: '1.2rem' }} />}
                        chart={
                          (() => {
                            const hoursRow = dataLearningComparison?.find(d => d.name === 'Hours');
                            const assignedHrs = hoursRow?.Assigned || 0;
                            const attendedHrs = hoursRow?.Attended || 0;
                            const pct = assignedHrs > 0 ? Math.min(100, Math.round((attendedHrs / assignedHrs) * 100)) : 0;

                            return (
                              <Box sx={{ py: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                                  <Typography sx={{ fontWeight: 800, fontSize: '2.2rem', color: '#1A005D', lineHeight: 1 }}>
                                    {attendedHrs.toFixed(1)}
                                  </Typography>
                                  <Typography sx={{ color: COLORS.textMedium, fontSize: '0.95rem' }}>
                                    / {assignedHrs.toFixed(1)} hrs attended
                                  </Typography>
                                </Box>

                                <Box sx={{ 
                                  width: '100%', height: 12, borderRadius: 6, 
                                  backgroundColor: 'rgba(67,97,238,0.1)', overflow: 'hidden', mb: 3, mt: 2
                                }}>
                                  <Box sx={{ 
                                    width: `${pct}%`, height: '100%', borderRadius: 6,
                                    background: 'linear-gradient(90deg, #4361EE, #8EC400)',
                                    transition: 'width 0.6s ease'
                                  }} />
                                </Box>

                                <Grid container spacing={2}>
                                  <Grid item xs={6}>
                                    <Box sx={{ 
                                      p: 2, borderRadius: '14px', textAlign: 'center',
                                      background: 'linear-gradient(135deg, rgba(67,97,238,0.06), rgba(67,97,238,0.02))',
                                      border: `1px solid ${COLORS.borderColor}`
                                    }}>
                                      <Typography sx={{ color: COLORS.primary, fontWeight: 800, fontSize: '1.5rem' }}>
                                        {assignedHrs.toFixed(1)}
                                      </Typography>
                                      <Typography sx={{ color: COLORS.textMedium, fontSize: '0.75rem', fontWeight: 600 }}>
                                        HOURS ASSIGNED
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Box sx={{ 
                                      p: 2, borderRadius: '14px', textAlign: 'center',
                                      background: 'linear-gradient(135deg, rgba(142,196,0,0.08), rgba(142,196,0,0.02))',
                                      border: `1px solid ${COLORS.borderColor}`
                                    }}>
                                      <Typography sx={{ color: '#5a8000', fontWeight: 800, fontSize: '1.5rem' }}>
                                        {pct}%
                                      </Typography>
                                      <Typography sx={{ color: COLORS.textMedium, fontSize: '0.75rem', fontWeight: 600 }}>
                                        UTILIZATION
                                      </Typography>
                                    </Box>
                                  </Grid>
                                </Grid>

                                <Typography sx={{ mt: 2, color: COLORS.textLight, fontSize: '0.78rem', textAlign: 'center' }}>
                                  {pct >= 80 ? "Great follow-through on your assigned training time." 
                                    : pct >= 50 ? "You're attending a good chunk of your assigned hours."
                                    : "There's a gap between assigned and attended hours worth closing."}
                                </Typography>
                              </Box>
                            );
                          })()
                        }
                      />
                    </Grid>
                  </Grid>

              <Dialog 
                open={detailsModalOpen} 
                onClose={() => setDetailsModalOpen(false)}
                maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}
              >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1A005D', fontWeight: 700, borderBottom: '1px solid #E2E8F0' }}>
                  {detailsTitle}
                  <IconButton onClick={() => setDetailsModalOpen(false)} size="small"><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0, backgroundColor: '#F7F9FC' }}>
                  {detailsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#1A005D' }} /></Box>
                  ) : detailsData.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}><Typography sx={{ color: '#718096' }}>No trainings found.</Typography></Box>
                  ) : (
                    <List sx={{ p: 2 }}>
                      {detailsData.map((item, idx) => (
                        <Paper key={idx} elevation={0} sx={{ mb: 1.5, p: 2, borderRadius: '12px', border: '1px solid #E2E8F0', '&:hover': { boxShadow: '0 4px 12px rgba(67,97,238,0.08)' } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography sx={{ fontWeight: 600, color: '#1A005D', fontSize: '0.95rem' }}>
                              {item.training_name || `Training #${item.planing_id}`}
                              <Typography component="span" sx={{ color: '#A0AEC0', fontSize: '0.75rem', ml: 1 }}>
                                (Session {item.session_no})
                              </Typography>
                            </Typography>
                            {getStatusChip(item)}
                          </Box>
                          <Typography variant="body2" sx={{ color: '#5A5A72' }}>
                            {item.session_date ? new Date(item.session_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD'}
                            {item.from_time && ` • ${item.from_time.slice(0,5)} - ${item.to_time?.slice(0,5)}`}
                          </Typography>
                        </Paper>
                      ))}
                    </List>
                  )}
                </DialogContent>
              </Dialog>
            </Box>
          )}
            
            
            
            {/* Department Head View */}
            {tabIndex === 1 && userRole !== null && dashboardPermissions.showDepartmentDashboard && (
              <DepartmentalTrainingDashboard />
            )}
            
            {/* Branch Head View */}
            {tabIndex === 2 && userRole !== null && dashboardPermissions.showBranchDashboard && (
              <BranchTrainingDashboard />
            )}

            {/* Admin View */}
            {tabIndex === 3 && userRole !== null && dashboardPermissions.showAdminDashboard && (
              <AdminView />
            )}
          </Container>
        </Box>
      </div>
    </div>
  );
};

export default Dashboard;