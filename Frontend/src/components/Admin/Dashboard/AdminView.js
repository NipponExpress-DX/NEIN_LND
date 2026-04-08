import {React, useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Grid, Card, CardContent, Typography, 
  Box, Paper, styled, useTheme, useMediaQuery, CircularProgress
} from '@mui/material';
import { CalendarToday as CalendarIcon } from '@mui/icons-material';
import SchoolIcon from '@mui/icons-material/School';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import axios from 'axios';

// Solid colors for cards that work with getContrastText
const cardColors = [
  '#f5f7fa', // Light blue-gray
  '#e0f7fa', // Light cyan
  '#e8f5e9', // Light green
  '#fff3e0', // Light orange
  '#f3e5f5', // Light purple
  '#e8eaf6', // Light indigo
  '#f1f8e9'  // Light lime
];

const DashboardCard = styled(Card)(({ theme, bgcolor }) => ({
  minHeight: '160px', 
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  borderRadius: '12px', 
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)', 
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  backgroundColor: bgcolor,
  border: '1px solid rgba(255, 255, 255, 0.3)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)', 
    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)', 
  },
  '& .MuiCardContent-root': {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    padding: '12px' 
  }
}));

const AdminView = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [userDetails, setUserDetails] = useState({});
  const [hoveredCard, setHoveredCard] = useState(null);
 
  useEffect(() => {
    const details = JSON.parse(sessionStorage.getItem("userDetails") || "{}");
    setUserDetails(details);
  }, []);

  const iconStyles = (color) => ({ 
    fontSize: 32, 
    color,
    transition: 'all 0.2s ease',
    transform: hoveredCard ? 'scale(1.05)' : 'scale(1)'
  });

  const createIconBox = (MainIcon, OverlayIcon) => (
    <Box sx={{ 
      position: 'relative',
      transition: 'all 0.2s ease',
      transform: hoveredCard ? 'rotate(3deg)' : 'rotate(0)' 
    }}>
      <MainIcon sx={{ 
        fontSize: 32, 
        color: theme.palette.info.main, 
        opacity: 0.9,
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
      }} />
      <Box
        sx={{
          position: 'absolute',
          bottom: -4, 
          right: -4, 
          backgroundColor: theme.palette.background.paper,
          borderRadius: '50%',
          p: '3px', 
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)', 
          transition: 'all 0.2s ease',
          transform: hoveredCard ? 'scale(1.1)' : 'scale(1)' 
        }}
      >
        <OverlayIcon color="info" sx={{ fontSize: 14 }} /> 
      </Box>
    </Box>
  );

  const widgets = [
    {
      title: 'Training Calendar',
      description: 'View training schedule',
      icon: createIconBox(CalendarMonthIcon, CalendarIcon),
      path: '/admindashboard/calendar',
      fetchData: async () => {
        try {
          const response = await axios.post(`${API_BASE_URL}/planning-route/details`, {
            userid: userDetails.emp_id,
          });
          const now = new Date();
          const records = response.data.records || [];
  
          return {
            total: records.length,
            upcoming: records.filter(event => new Date(event.planning_date) > now).length,
            past: records.filter(event => new Date(event.planning_date) <= now).length,
          };
        } catch (error) {
          console.error("Error fetching calendar data:", error);
          return { total: 0, upcoming: 0, past: 0 };
        }
      },
      
    },
    {
      title: 'Training Programs',
      description: 'Manage all training programs',
      icon: <SchoolIcon sx={iconStyles(theme.palette.secondary.dark)} />,
      path: '/admindashboard/dashboardcontent',
      tabIndex: 1,
    },
    {
      title: 'Created',
      description: 'Newly created trainings',
      icon: <NoteAddIcon sx={iconStyles(theme.palette.success.dark)} />,
      path: '/admindashboard/dashboardcontent',
      tabIndex: 1,
      filters: { status: 'Training Created' },
    },
    {
      title: 'Scheduled',
      description: 'View scheduled trainings',
      icon: <EventAvailableIcon sx={iconStyles(theme.palette.primary.dark)} />,
      path: '/admindashboard/dashboardcontent',
      tabIndex: 1,
      filters: { status: 'Training Scheduled' },
    },   
    {
      title: 'Conducted',
      description: 'Completed training sessions',
      icon: <DoneAllIcon sx={iconStyles(theme.palette.warning.dark)} />,
      path: '/admindashboard/dashboardcontent',
      tabIndex: 1,
      filters: { status: 'Training Conducted' },
    },
    {
      title: 'Feedback Assigned',
      description: 'Pending feedback tasks',
      icon: <AssignmentTurnedInIcon sx={iconStyles(theme.palette.error.dark)} />,
      path: '/admindashboard/dashboardcontent',
      tabIndex: 1,
      filters: { status: 'Feedback Assigned' },
    },
    {
      title: 'Submitted',
      description: 'Completed feedback forms',
      icon: <MarkEmailReadIcon sx={iconStyles(theme.palette.info.dark)} />,
      path: '/admindashboard/dashboardcontent',
      tabIndex: 1,
      filters: { status: 'Final Submitted' },
    },
   
  ];

  const handleCardClick = (path, tabIndex, filters = {}) => {
    navigate(path, { 
      state: { 
        activeTab: tabIndex,
        ...(Object.keys(filters).length > 0 && { filters })
      } 
    });
  };

  return (
    <Box sx={{ 
      p: isMobile ? 0.25 : 0.8,
      maxWidth: '1200px',
      margin: '0 auto'
    }}>           
      <Grid container spacing={2}>
        {widgets.map((widget, index) => (
          <Grid item xs={12} sm={6} md={2} lg={3} key={index}>
            <DashboardCard 
              bgcolor={cardColors[index % cardColors.length]}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleCardClick(widget.path, widget.tabIndex, widget.filters)}
              elevation={hoveredCard === index ? 6 : 2}
            >
              <CardContent>
                <Box sx={{ 
                  mb: 1,
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  margin: '0 auto',
                  transition: 'all 0.3s ease',
                  transform: hoveredCard === index ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}>
                  {widget.icon}
                </Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  mb: 1,
                  color: theme.palette.getContrastText(cardColors[index % cardColors.length]),
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  {widget.title}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.getContrastText(cardColors[index % cardColors.length]),
                  opacity: 0.8,
                  mb: 2
                }}>
                  {widget.description}
                </Typography>
                {widget.renderCount && widget.fetchData && (
                  <AsyncCountRenderer 
                    fetchData={widget.fetchData}
                    renderCount={widget.renderCount}
                  />
                )}
              </CardContent>
            </DashboardCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const AsyncCountRenderer = ({ fetchData, renderCount }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await fetchData();
        setData(result);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchData]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
      <CircularProgress size={24} />
    </Box>
  );
  
  if (!data) return null;
  return renderCount(data);
};

export default AdminView;