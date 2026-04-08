import { useEffect, useState, useMemo } from "react";
import { 
  Box, Tabs, Tab, Grid, MenuItem, Select, TextField, Button,
  Card, CardContent, Typography, IconButton, Divider,
  Paper, Container, useTheme, useMediaQuery, Menu, Tooltip
} from "@mui/material";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  Tooltip as RechartsTooltip, Legend, LineChart, 
  Line, CartesianGrid, Area, AreaChart, ResponsiveContainer
} from "recharts";
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
  const [dataDepartmentTraining, setDataDepartmentTraining] = useState([]);
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

  const [trainingEffectiveness, setTrainingEffectiveness] = useState(null);

useEffect(() => {
  if (userId) {  
    fetchData();
    fetchDepartmentTraining();
    fetchUpcomingTraining();
    fetchLearningAnalytics();
    fetchTrainingEffectiveness(); // Add this new function call
  }
}, [userId]);

const fetchTrainingEffectiveness = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/dashboard/TrainingEffectivenessAllMeasures`,
      { userid: userId }
    );
    setTrainingEffectiveness(response.data);
  } catch (error) {
    console.error("Error fetching training effectiveness:", error);
    setTrainingEffectiveness(null);
  }
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

  useEffect(() => {
    if (userId) {  
      fetchData();
      fetchDepartmentTraining();
      fetchUpcomingTraining();
      fetchLearningAnalytics();
    }
  }, [userId]); 

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
    showDepartmentDashboard: hasDepartment,
    showBranchDashboard: hasBranch,
    // Show Admin tab only if user has ALL three dashboards
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

  const fetchDepartmentTraining = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/dashboard/department_assigned_to_user_attended`, {
        userid: userId
      });
  
      if (response.data) {
        setDataDepartmentTraining({
          department_conducted_count: Number(response.data.department_conducted_count) || 0,
          Assign_count: Number(response.data.Assign_count) || 0,
          present_count: Number(response.data.present_count) || 0,
          absent_count: Number(response.data.absent_count) || 0
        });
      }
    } catch (error) {
      console.error("API request failed:", error.message);
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
                {/* Summary Stats Row */}
                {/* Summary Stats Row - Modified for 4 cards in one row */}
        <Grid container spacing={1} sx={{ mb: 1 }}>
          {/* Each card now takes 3 columns (12/4=3) */}
          <Grid item xs={12} sm={6} md={3}>
            <div  style={{ cursor: 'pointer' }}>
              <StatCard 
                title="Assigned Trainings Count" 
                value={dataProgress.find(d => d.name === "Assigned Trainings")?.value || 0}
                icon={<TeachingIcon style={{ fill: COLORS.primary, width: 24, height: 10 }} />}
                color={COLORS.primary}
              />
            </div>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <div onClick={() => navigate('/admindashboard/dashboard')} style={{ cursor: 'pointer' }}>
              <StatCard 
                title="Attended Trainings Count" 
                value={dataProgress.find(d => d.name === "Present")?.value || 0}
                icon={<GraduateIcon style={{ fill: COLORS.quaternary, width: 24, height: 10 }} />}
                color={COLORS.secondary}
                // subtitle={`${dataDepartmentTraining.Assign_count > 0 
                //   ? ((dataDepartmentTraining.present_count / dataDepartmentTraining.Assign_count) * 100).toFixed(1)
                //   : 0}% Attendance Rate`}
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
                  transition: 'all 0.2s ease',
                }}
              >
                <StatCard 
                  title="Pending Feedbacks Count"    
                  value={dataProgress.find(d => d.name === "Pending Feedbacks")?.value || 0}
                  icon={<FeedbackIcon style={{ fill: COLORS.warning, width: 24, height: 10 }} />}
                  color={pendingFeedbackSessions.length > 0 ? COLORS.warning : COLORS.disabled}
                />
              </div>
            </Tooltip>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => handleMenuClose()}
              PaperProps={{
                style: {                         
                  width: '30ch',
                },
              }}
            >
              {pendingFeedbackSessions.map((session, index) => (
                <MenuItem 
                  key={index} 
                  onClick={() => handleMenuClose(session)}
                  sx={{
                    '&:hover': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                >
                  Feedback form {index + 1}
                </MenuItem>
              ))}
            </Menu>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <div onClick={() => navigate('/admindashboard/dashboard')} style={{ cursor: 'pointer' }}>
              <StatCard 
                title="Absent Trainings Count" 
                value={dataProgress.find(d => d.name === "Absent")?.value || 0}
                icon={<NoEntryIcon style={{ fill: COLORS.quaternary, width: 24, height: 10 }} />}
                color={COLORS.error}
              />
            </div>
          </Grid>
        </Grid>                       
                {/* Charts Row */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {/* Learning Progress Chart */}
                  <Grid item xs={12} md={7}>
                   
                      <DashboardCard 
                        title="Personal Learning Analytics"
                        subtitle="Training sessions and hours comparison"
                        icon={<TrendingUp sx={{ color: "#1A005D", fontSize: '1.2rem' }} />}
                        chart={
                          <ResponsiveContainer width="100%" height={260}>
                            <BarChart 
                              data={dataLearningComparison} 
                              margin={{top: 5, right: 15, left: 0, bottom: 5}}
                            >
                              <CartesianGrid 
                                strokeDasharray="2 2" 
                                vertical={false} 
                                stroke="#E0E0E0" 
                              />
                              
                              <XAxis 
                                dataKey="name" 
                                axisLine={{ stroke: "#E0E0E0" }} 
                                tick={{ fill: "#5A5A72", fontSize: 10 }}
                                tickLine={false}
                              />
                              
                              <YAxis 
                                yAxisId="left"
                                orientation="left"
                                tick={{ fill: "#5A5A72", fontSize: 10 }} 
                                axisLine={{ stroke: "#E0E0E0" }}
                                tickLine={false}
                                label={{ 
                                  value: 'Trainings', 
                                  angle: -90, 
                                  position: 'insideLeft',
                                  fill: "#5A5A72",
                                  fontSize: 12
                                }}
                              />
                              
                              <YAxis 
                                yAxisId="right"
                                orientation="right"
                                tick={{ fill: "#5A5A72", fontSize: 10 }} 
                                axisLine={{ stroke: "#E0E0E0" }}
                                tickLine={false}
                                label={{ 
                                  value: 'Hours', 
                                  angle: 90, 
                                  position: 'insideRight',
                                  fill: "#5A5A72",
                                  fontSize: 12
                                }}
                              />
                              
                              <RechartsTooltip 
                                contentStyle={{
                                  background: "#FFFFFF",
                                  border: "1px solid #E0E0E0",
                                  borderRadius: "6px",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                  color: "#1A005D",
                                  fontSize: "12px"
                                }} 
                              />
                              
                              <Legend 
                                wrapperStyle={{ 
                                  paddingTop: 10,
                                  paddingLeft: 10
                                }}
                                iconType="circle"
                                iconSize={8}
                                formatter={(value) => (
                                  <span style={{ color: "#5A5A72", fontSize: 11 }}>
                                    {value}
                                  </span>
                                )}
                              />
                              
                              <Bar 
                                yAxisId="left"
                                dataKey="Assigned" 
                                name="Assigned"
                                fill="#1A005D" 
                                radius={[6, 6, 0, 0]}
                                barSize={30}
                              />
                              
                              <Bar 
                                yAxisId="left"
                                dataKey="Attended" 
                                name="Attended"
                                fill="#8EC400" 
                                radius={[6, 6, 0, 0]}
                                barSize={30}
                              />
                              
                              <Line 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="Hours" 
                                name="Hours"
                                stroke="#FD76CB" 
                                strokeWidth={2}
                                dot={{ fill: "#FD76CB", strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        }
                      />
                  </Grid>
                  
                  {/* Department Training Summary */}
                  <Grid item xs={12} md={5}>
                    <DashboardCard 
                      title="My Department Insights"
                      subtitle="Training Summary (Department-wise) with My Attendance %"
                      icon={<Assessment sx={{ color: "#1A005D" }} />}
                      chart={
                        <Box sx={{ pt: 2 }}>
                          <Grid container spacing={2} sx={{ mb: 1 }}>
                            <Grid item xs={6}>
                              <Box sx={{ 
                                p: 2, 
                                borderRadius: 2, 
                                backgroundColor: "rgba(26, 0, 93, 0.05)",
                                textAlign: 'center',
                                borderLeft: "4px solid #1A005D",
                              }}>
                                <Typography variant="body2" sx={{ 
                                  color: "#5A5A72", 
                                  mb: 1,
                                  fontWeight: 500
                                }}>
                                  Department Conducted
                                </Typography>
                                <Typography variant="h4" sx={{ 
                                  color: "#1A005D",
                                  fontWeight: 700,
                                  fontSize: "1.75rem"
                                }}>
                                  {dataDepartmentTraining.department_conducted_count || 0}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ 
                                p: 2, 
                                borderRadius: 2, 
                                backgroundColor: "rgba(142, 196, 0, 0.05)",
                                textAlign: 'center',
                                borderLeft: "4px solid #8EC400",
                              }}>
                                <Typography variant="body2" sx={{ 
                                  color: "#5A5A72",
                                  mb: 1,
                                  fontWeight: 500
                                }}>
                                  Overall Attendance Rate
                                </Typography>
                                <Typography variant="h4" sx={{ 
                                  color: "#8EC400",
                                  fontWeight: 700,
                                  fontSize: "1.75rem"
                                }}>
                                  {dataDepartmentTraining.Assign_count > 0 
                                    ? `${((dataDepartmentTraining.present_count / dataDepartmentTraining.Assign_count) * 100).toFixed(0)}%` 
                                    : '0%'}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                          
                          <Box sx={{ mb: 3, px: 1 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              mb: 1.5,
                              alignItems: 'center'
                            }}>
                              <Typography variant="body2" sx={{ 
                                color: "#1A005D",
                                fontWeight: 500,
                                fontSize: "0.85rem"
                              }}>
                                Combined Attendance Overview
                              </Typography>
                              
                            </Box>
                            <Box sx={{ 
                              width: '100%', 
                              height: 10, 
                              backgroundColor: "rgba(26, 0, 93, 0.1)",
                              borderRadius: 5,
                              overflow: 'hidden',
                            }}>
                              <Box sx={{ 
                                width: dataDepartmentTraining.Assign_count > 0 
                                  ? `${(dataDepartmentTraining.present_count / dataDepartmentTraining.Assign_count * 100)}%` 
                                  : '0%',
                                height: '100%',
                                background: "linear-gradient(90deg, #1A005D 0%, #8EC400 100%)",
                                borderRadius: 5,
                              }} />
                            </Box>
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            gap: 3,
                            flexWrap: 'wrap'
                          }}>
                            {[
                              { label: 'Assigned', value: dataDepartmentTraining.Assign_count || 0, color: "#1A005D" },
                              { label: 'Present', value: dataDepartmentTraining.present_count || 0, color: "#8EC400" },
                              { label: 'Absent', value: dataDepartmentTraining.absent_count || 0, color: "#FF5252" }
                            ].map((item, index) => (
                              <Box key={index} sx={{ 
                                textAlign: 'center',
                                minWidth: 80,
                                px: 1.5,
                                py: 1,
                                borderRadius: 2,
                                backgroundColor: "rgba(26, 0, 93, 0.03)",
                              }}>
                                <Box sx={{ 
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 1,
                                  mb: 0.5
                                }}>
                                  <Box sx={{ 
                                    width: 10, 
                                    height: 10, 
                                    borderRadius: '50%', 
                                    backgroundColor: item.color,
                                  }} />
                                  <Typography variant="body2" sx={{ 
                                    color: "#5A5A72",
                                    fontWeight: 500,
                                    fontSize: "0.8rem"
                                  }}>
                                    {item.label}
                                  </Typography>
                                </Box>
                                <Typography variant="h6" sx={{ 
                                  color: item.color, 
                                  fontWeight: 700,
                                  fontSize: "1.25rem"
                                }}>
                                  {item.value}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                  </Grid>
                </Grid>
                
                {/* Bottom Row */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={5}>
                    <DashboardCard 
                      title="Upcoming Training Sessions"
                      subtitle="Overview of planned & assigned sessions"
                      icon={<CalendarToday sx={{ color: COLORS.quaternary }} />}
                      chart={
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie 
                              data={dataUpcoming} 
                              cx="50%" 
                              cy="50%" 
                              outerRadius={80}
                              innerRadius={50}
                              paddingAngle={3}
                              dataKey="value"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {dataUpcoming.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={index === 0 ? COLORS.primary : COLORS.quaternary} 
                                  stroke={COLORS.cardBackground}
                                  strokeWidth={2}
                                />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              contentStyle={{
                                backgroundColor: COLORS.cardBackground,
                                border: `1px solid ${COLORS.borderColor}`,
                                borderRadius: '8px',
                                boxShadow: `0 4px 12px ${COLORS.shadow}`,
                                padding: '8px 12px'
                              }} 
                              formatter={(value, name) => [`${value} Sessions`, name]}
                            />
                            <Legend 
                              verticalAlign="bottom" 
                              height={36} 
                              iconType="circle"
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      }
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={7}>
                      <DashboardCard 
                        title="Training Effectiveness"
                        subtitle="Detailed analysis of your training outcomes"
                        icon={<Assessment sx={{ color: "#1A005D", fontSize: '1.2rem' }} />}
                        chart={
                          <Box sx={{ width: '100%', height: 300 }}>
                            {trainingEffectiveness ? (
                              <Grid container spacing={2} sx={{ height: '100%', alignItems: 'stretch' }}>
                                {/* Total Trainings */}
                                <Grid item xs={12} sm={3}>
                                  <Paper elevation={0} sx={{ 
                                    height: '89%',
                                    p: 2,
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(26, 0, 93, 0.05)',
                                    borderLeft: '4px solid #1A005D',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center'
                                  }}>
                                    <Typography variant="h6" sx={{ 
                                      color: "#5A5A72",
                                      fontWeight: 500,
                                      mb: 1,
                                      textAlign: 'center'
                                    }}>
                                      Total Trainings
                                    </Typography>
                                    <Typography variant="h3" sx={{ 
                                      color: "#1A005D",
                                      fontWeight: 700,
                                      textAlign: 'center'
                                    }}>
                                      {trainingEffectiveness.total_trainings}
                                    </Typography>
                                  </Paper>
                                </Grid>

                                {/* Effectiveness Metrics */}
                                {[
                                  { 
                                    key: 'effectiveness_a',
                                    title: 'Personnel Discussion', 
                                    color: '#1A005D',
                                    icon: <Assessment sx={{ fontSize: 16 }} />
                                  },
                                  { 
                                    key: 'effectiveness_b',
                                    title: 'Demonstration / Test', 
                                    color: '#8EC400',
                                    icon: <Assessment sx={{ fontSize: 16 }} />
                                  },
                                  { 
                                    key: 'effectiveness_c',
                                    title: 'On-the-job Assessment', 
                                    color: '#FD76CB',
                                    icon: <Assessment sx={{ fontSize: 16 }} />
                                  }
                                ].map((item, index) => {
                                  const effData = trainingEffectiveness[item.key];
                                  return (
                                    <Grid item xs={12} sm={3} key={index}>
                                      <Paper elevation={0} sx={{ 
                                        height: '89%',
                                        p: 2,
                                        borderRadius: '12px',
                                        backgroundColor: `${item.color}08`,
                                        border: `1px solid ${item.color}30`,
                                        display: 'flex',
                                        flexDirection: 'column'
                                      }}>
                                        {/* Title and Icon */}
                                        <Box sx={{ 
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1,
                                          mb: 2
                                        }}>
                                          <Box sx={{ 
                                            backgroundColor: `${item.color}20`,
                                            borderRadius: '6px',
                                            p: 0.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}>
                                            {item.icon}
                                          </Box>
                                          <Typography variant="subtitle2" sx={{ 
                                            color: item.color,
                                            fontWeight: 600
                                          }}>
                                            {item.title}
                                          </Typography>
                                        </Box>

                                        {/* Main Percentage */}
                                        <Box sx={{ 
                                          textAlign: 'center',
                                          mb: 2,
                                          flexGrow: 1,
                                          display: 'flex',
                                          flexDirection: 'column',
                                          justifyContent: 'center'
                                        }}>
                                          <Typography variant="h3" sx={{ 
                                            color: item.color,
                                            fontWeight: 700,
                                            lineHeight: 1
                                          }}>
                                            {effData.percentage}%
                                          </Typography>
                                          <Typography variant="caption" sx={{ 
                                            color: "#5A5A72",
                                            fontWeight: 500
                                          }}>
                                            Success Rate
                                          </Typography>
                                        </Box>

                                        {/* Count Breakdown */}
                                        <Box sx={{ 
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          gap: 1,
                                          mt: 'auto'
                                        }}>
                                          {/* Positive Count */}
                                          <Box sx={{ 
                                            backgroundColor: `${item.color}15`,
                                            borderRadius: '8px',
                                            p: 1,
                                            flex: 1,
                                            textAlign: 'center'
                                          }}>
                                            <Typography variant="body1" sx={{ 
                                              color: item.color,
                                              fontWeight: 700,
                                              mb: 0.5
                                            }}>
                                              {effData.yes_count}
                                            </Typography>
                                            <Typography variant="caption" sx={{ 
                                              color: "#5A5A72",
                                              fontWeight: 500,
                                              fontSize: '0.7rem'
                                            }}>
                                              Positive
                                            </Typography>
                                          </Box>

                                          {/* Negative Count */}
                                          <Box sx={{ 
                                            backgroundColor: 'rgba(244, 94, 109, 0.1)',
                                            borderRadius: '8px',
                                            p: 1,
                                            flex: 1,
                                            textAlign: 'center'
                                          }}>
                                            <Typography variant="body1" sx={{ 
                                              color: '#F45E6D',
                                              fontWeight: 700,
                                              mb: 0.5
                                            }}>
                                              {effData.no_count}
                                            </Typography>
                                            <Typography variant="caption" sx={{ 
                                              color: "#5A5A72",
                                              fontWeight: 500,
                                              fontSize: '0.7rem'
                                            }}>
                                              Needs Work
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </Paper>
                                    </Grid>
                                  );
                                })}
                              </Grid>
                            ) : (
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                height: '100%',
                                color: "#5A5A72"
                              }}>
                                Loading effectiveness data...
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </Grid>
                </Grid>
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