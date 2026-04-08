import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid,
  Box, Typography, Paper, 
  Button, IconButton, 
  Dialog, DialogTitle, 
  DialogContent, DialogActions,
  Tooltip, Chip, Avatar,
  Divider, Badge, alpha,
  useTheme, Fade, Zoom,
  Grow, Slide, Collapse,
  Fab, Skeleton
} from '@mui/material';
import {    
  ChevronLeft,
  ChevronRight,
  Today,
  Info,
  CalendarMonth,
  AccessTime,
  Person,
  Email,
  LocationOn,
  Work,
  Category,
  Comment,
  Flag,
  Star,
  Add,
  ExpandMore,
  ExpandLess,
  Celebration
} from '@mui/icons-material';
import CalendarToday from '@mui/icons-material/CalendarToday';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import Refresh from '@mui/icons-material/Refresh';
import Schedule from '@mui/icons-material/Schedule';
import Phone from '@mui/icons-material/Phone';
import Business from '@mui/icons-material/Business';
import MeetingRoom from '@mui/icons-material/MeetingRoom';
import School from '@mui/icons-material/School';
import Class from '@mui/icons-material/Class';
import EventAvailable from '@mui/icons-material/EventAvailable';
import Check from '@mui/icons-material/Check';

import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';

// Setup moment localizer
const localizer = momentLocalizer(moment);

const AdminCalendar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [expandedLegend, setExpandedLegend] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // Enhanced event colors with more vibrant options
  const eventColors = {
    planned: {
      main: '#6A1B9A', // Deep Purple
      light: '#E1BEE7',
      gradient: 'linear-gradient(135deg, #6A1B9A 0%, #9C27B0 100%)',
      icon: <Star sx={{ fontSize: '0.8rem' }} />
    },
    unplanned: {
      main: '#FF6D00', // Vibrant Orange
      light: '#FFE0B2',
      gradient: 'linear-gradient(135deg, #FF6D00 0%, #FFAB40 100%)',
      icon: <Add sx={{ fontSize: '0.8rem' }} />
    },
    feedback: {
      main: '#00BFA5', // Teal
      light: '#B2DFDB',
      gradient: 'linear-gradient(135deg, #00BFA5 0%, #64FFDA 100%)',
      icon: <Comment sx={{ fontSize: '0.8rem' }} />
    },
    cancelled: {
      main: '#D50000', // Bright Red
      light: '#FFCDD2',
      gradient: 'linear-gradient(135deg, #D50000 0%, #FF5252 100%)',
      icon: <Flag sx={{ fontSize: '0.8rem' }} />
    },
    highlight: {
      main: '#FFD600', // Gold
      light: '#FFF9C4',
      gradient: 'linear-gradient(135deg, #FFD600 0%, #FFFF00 100%)',
      icon: <Celebration sx={{ fontSize: '0.8rem' }} />
    }
  };

  // Get user details on component mount
  useEffect(() => {
    const storedUserDetails = JSON.parse(sessionStorage.getItem("userDetails") || "{}");
    setUserDetails(storedUserDetails);
  }, []);

  // Only fetch calendar events when userDetails is available
  useEffect(() => {   
      fetchCalendarEvents();
    
  }, [userDetails]);
  
  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/planning-route/LNDCalendarDetails`,
        {}, 
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
  
      console.log("API Response:", response.data);
  
      if (response.data && response.data.records) {
        const formattedEvents = response.data.records.map(event => {
          const startDateTime = moment(`${event.session_date.split('T')[0]}T${event.from_time}`);
          const endDateTime = moment(`${event.session_date.split('T')[0]}T${event.to_time}`);

          return {
            id: event.planing_id,
            title: `${event.training_topic}`,
            start: startDateTime.toDate(),
            end: endDateTime.toDate(),
            allDay: false,
            resource: {
              Session: event.session_no,
              userName: event.PlanningCreatedUser,
              email: event.trainer_email,
              branch: event.branch_names,
              department: event.department_names,
              staffCategory: event.staff_category,
              trainingTopic: event.training_topic,
              trainingType: event.training_type,
              CreatedUser: event.PlanningCreatedUser,
              status: event.PlanningStatus || event.PlaningSessionStatus,
              remarks: event.remarks,
              cancelledReason: '',
              priority: 'normal',
              sessionNo: event.session_no,
              sessionCode: event.session_code,
              sessionDescription: event.session_description,
              trainerName: event.trainer_name
            }
          };
        });

        setEvents(formattedEvents);
      } else {
        setEvents([]);
      }
  
      setLoading(false);
    } catch (err) {
      console.error("Error fetching calendar events:", err);
      setError(err.message || "Failed to fetch calendar events");
      setLoading(false);
    }
  };
  

  const pulseAnimation = {
    '@keyframes pulse': {
      '0%': { transform: 'scale(1)', opacity: 0.9 },
      '50%': { transform: 'scale(1.05)', opacity: 1 },
      '100%': { transform: 'scale(1)', opacity: 0.9 },
    }
  };
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleNavigate = (date, view) => {
    // Custom navigation logic can be added here
  };

  const CustomToolbar = ({ label, onNavigate }) => {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2,
        backgroundColor: 'white',
        borderRadius: '12px 12px 0 0',
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[1],
        background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700,
            background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            '& svg': {
              mr: 1,
              color: theme.palette.primary.main
            }
          }}
        >
          <CalendarMonth /> {label}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Previous" TransitionComponent={Zoom}>
            <IconButton 
              onClick={() => onNavigate('PREV')}
              sx={{ 
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ChevronLeft />
            </IconButton>
          </Tooltip>
          <Tooltip title="Today" TransitionComponent={Zoom}>
            <IconButton 
              onClick={() => onNavigate('TODAY')}
              sx={{ 
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <Today />
            </IconButton>
          </Tooltip>
          <Tooltip title="Next" TransitionComponent={Zoom}>
            <IconButton 
              onClick={() => onNavigate('NEXT')}
              sx={{ 
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ChevronRight />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  };

  const eventStyleGetter = (event, start, end, isSelected) => {
    let styleConfig = eventColors.planned;    
    if (event.resource.status === 'Feedback Assigned') {
      styleConfig = eventColors.feedback;
    } else if (event.resource.status === 'Cancelled') {
      styleConfig = eventColors.cancelled;
    } else if (event.resource.planningType === 'Unplanned') {
      styleConfig = eventColors.unplanned;
    }
    // const backgroundColor = event.resource?.status === 'completed' 
    // ? theme.palette.success.main 
    // : event.resource?.status === 'cancelled'
    //   ? theme.palette.error.main
    //   : theme.palette.primary.main;
      
    // Highlight today's events
    const isToday = moment().isSame(event.start, 'day');
    // Highlight hovered events
    const isHovered = hoveredEvent && hoveredEvent.id === event.id;
    // Highlight high priority events
    const isHighPriority = event.resource.priority === 'high';
  
    return {
      style: {
        backgroundImage: isHighPriority ? eventColors.highlight.gradient : styleConfig.gradient,
        borderRadius: '8px',
        opacity: isHovered ? 1 : 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        padding: '4px 2px',
        fontSize: '0.85rem',
        fontWeight: 500,
        boxShadow: isSelected ? '0 0 0 2px white, 0 0 0 4px ' + theme.palette.primary.main : 
                  isHovered ? '0 4px 8px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'none',
        borderLeft: isToday ? '4px solid white' : 'none'
      }
    };
  };

  const CustomEvent = ({ event, continuesPrior, continuesAfter, isAllDay, isMultiDay }) => {
    const [expanded, setExpanded] = useState(false);
    
    // If this is a "+X more" placeholder event
    if (event.isShowMore) {
      return (
        <Box 
          sx={{
            mt: '2px',
            px: 0.5,
            py: 0.3,
            fontSize: '0.65rem',
            fontWeight: 600,
            color: theme.palette.primary.main,
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline',
              backgroundColor: alpha(theme.palette.primary.main, 0.1)
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            event.onShowMore();
          }}
        >
          +{event.count} more
        </Box>
      );
    }
  
    // Regular event display
    return (
      <Box 
        sx={{
          width: '100%',
          mb: '2px',
          borderRadius: '4px',
          backgroundColor: alpha(event.color || theme.palette.primary.main, 0.15),
          borderLeft: `3px solid ${event.color || theme.palette.primary.main}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(event.color || theme.palette.primary.main, 0.25)
          }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Tooltip 
          title={event.title} 
          placement="top" 
          arrow
          disableHoverListener={expanded}
        >
          <Box sx={{ px: 0.5, py: 0.3 }}>
            <Typography 
              variant="caption" 
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: expanded ? 'unset' : 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontWeight: 600,
                lineHeight: 1.2,
                fontSize: '0.7rem',
                color: theme.palette.getContrastText(theme.palette.background.paper)
              }}
            >
              {event.title}
            </Typography>
            {event.resource?.trainingTopic && (
              <Typography 
                variant="caption" 
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: expanded ? 'unset' : 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontSize: '0.6rem',
                  lineHeight: 1.2,
                  opacity: 0.9,
                  mt: 0.2,
                  color: theme.palette.getContrastText(theme.palette.background.paper)
                }}
              >
                {event.resource.trainingTopic}
              </Typography>
            )}
          </Box>
        </Tooltip>
      </Box>
    );
  };
  const CustomMonthEventWrapper = ({ children, value, ...props }) => {
    const maxVisible = 1; // Show max 2 events before "+X more"
    const events = props.events || [];
    const [showAll, setShowAll] = useState(false);
  
    if (events.length <= maxVisible || showAll) {
      return children;
    }
  
    const visibleEvents = events.slice(0, maxVisible);
    const hiddenCount = events.length - maxVisible;
  
    return (
      <>
        {React.Children.map(children, (child, index) => {
          if (index < maxVisible) {
            return child;
          }
          return null;
        })}
        <CustomEvent 
          event={{
            isShowMore: true,
            count: hiddenCount,
            onShowMore: () => setShowAll(true)
          }}
        />
      </>
    );
  };

  
  const getStatusChip = (status) => {
    let color = 'primary';
    let icon = <Flag fontSize="small" />;
    
    switch(status) {
      case 'Feedback Assigned':
        color = 'success';
        icon = <Comment fontSize="small" />;
        break;
      case 'Cancelled':
        color = 'error';
        icon = <Flag fontSize="small" />;
        break;
      default:
        color = 'primary';
        icon = <CalendarMonth fontSize="small" />;
    }
    
    return (
      <Chip 
        icon={icon}
        label={status || 'Planned'} 
        color={color} 
        size="small" 
        sx={{ 
          fontWeight: 600,
          boxShadow: theme.shadows[1],
          '& .MuiChip-icon': {
            color: theme.palette[color].contrastText
          }
        }} 
      />
    );
  };

  const getTypeChip = (type) => {
    let color = 'primary';
    let icon = <CalendarMonth fontSize="small" />;
    
    switch(type) {
      case 'Unplanned':
        color = 'warning';
        icon = <Add fontSize="small" />;
        break;
      default:
        color = 'info';
        icon = <Star fontSize="small" />;
    }
    
    return (
      <Chip 
        icon={icon}
        label={type || 'Planned'} 
        color={color} 
        size="small" 
        variant="outlined"
        sx={{ 
          fontWeight: 600,
          '& .MuiChip-icon': {
            color: theme.palette[color].main
          }
        }} 
      />
    );
  };

  const CalendarSkeleton = () => (
    <Box sx={{ height: '70vh', p: 2 }}>
      <Skeleton variant="rectangular" width="100%" height={60} sx={{ mb: 2, borderRadius: 2 }} />
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={30} sx={{ borderRadius: 2 }} />
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {[...Array(35)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={80} sx={{ borderRadius: 2 }} />
        ))}
      </Box>
    </Box>
  );

  return (
    <Fade in={true} timeout={500}>
      <div className="admin-dashboard-content">
        <div className="main-content">
        <Box sx={{ p: 3 }}>
  {/* Animated Paper Container with refined glass morphism effect */}
  <Slide direction="up" in={true} mountOnEnter unmountOnExit>
    <Paper 
      elevation={0} 
      sx={{ 
        p: 0, 
        borderRadius: '20px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.2)',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.85)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`,
        backdropFilter: 'blur(12px)',
        position: 'relative',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          zIndex: 1
        },
        '&:after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.light, 0.1)} 0%, transparent 40%)`,
          pointerEvents: 'none'
        }
      }}
    >
      {/* Header with improved gradient and floating effect */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 3,
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 120,  // Set a minimum height for the header
        '&:before': {
          content: '""',
          position: 'absolute',
          top: -100,
          right: -100,
          width: 200,
          height: 200,
          background: `radial-gradient(circle, ${alpha('#fff', 0.15)} 0%, transparent 70%)`,
          borderRadius: '50%'
        },
        '&:after': {
          content: '""',
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: 150,
          height: 150,
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.light, 0.2)} 0%, transparent 70%)`,
          borderRadius: '50%'
        }
      }}>
        <Box sx={{ 
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',  
            height: '100%' 
          }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 700, 
            mb: 0.5,
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            Training Calendar
          </Typography>
          <Typography variant="body2" sx={{ 
            opacity: 0.9,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <CalendarToday fontSize="small" />
            {moment().format('MMMM YYYY')}
          </Typography>
        </Box>
        <Fab
          variant="extended"
          color="secondary"
          onClick={() => navigate('/admindashboard/dashboardcontent', { 
            state: { 
              activeTab: 1,            
              shouldOpenModal: true     
            }
          })}
          sx={{
            zIndex: 1,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            px: 3,
            '&:hover': {
              boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
            color: theme.palette.getContrastText(theme.palette.secondary.main)
          }}
        >
          <Add sx={{ mr: 1.5 }} />
          Schedule Training
        </Fab>
      </Box>

      {/* Calendar Container with refined spacing */}
      <Box sx={{ p: 1 }}>
        {loading ? (
          <CalendarSkeleton />
        ) : error ? (
          <Box sx={{ 
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '30vh',
            background: `linear-gradient(135deg, ${alpha(theme.palette.error.light, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
            borderRadius: '0 0 20px 20px'
          }}>
            <Box sx={{
              p: 1,
              bgcolor: alpha(theme.palette.error.light, 0.1),
              borderRadius: '16px',
              border: `1px solid ${alpha(theme.palette.error.light, 0.3)}`,
              maxWidth: 500,
              textAlign: 'center'
            }}>
              <ErrorOutline sx={{ 
                fontSize: 48,
                color: theme.palette.error.main,
                mb: 2
              }} />
              <Typography variant="h6" color="error" sx={{ mb: 1, fontWeight: 700 }}>
                Error loading calendar
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                {error}
              </Typography>
              <Button 
                variant="outlined" 
                color="error" 
                onClick={fetchCalendarEvents}
                startIcon={<Refresh />}
                sx={{ 
                  mt: 2,
                  borderRadius: '12px',
                  px: 3,
                  fontWeight: 600
                }}
              >
                Retry
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ 
            height: '70vh',
            '& .rbc-month-view': {
              height: '100%',
              '& .rbc-month-row': {
                minHeight: '60px', // Increased row height
              },
              '& .rbc-date-cell': {
                padding: '4px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              },
              '& .rbc-row-bg': {
                '& .rbc-day-bg': {
                  height: '100%',
                }
              }
            },
            '& .rbc-calendar': {
              fontFamily: theme.typography.fontFamily,
              borderRadius: '0 0 16px 16px',
              border: 'none',
              background: 'transparent'
            },
            '& .rbc-toolbar': {
              padding: '16px 24px',
              backgroundColor: 'transparent',
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              marginBottom: 0
            },
            '& .rbc-toolbar button': {
              backgroundColor: 'transparent',
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              color: theme.palette.text.secondary,
              borderRadius: '12px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              padding: '8px 16px',
              margin: '0 4px',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main
              }
            },
            '& .rbc-toolbar button.rbc-active': {
              backgroundColor: alpha(theme.palette.primary.main, 0.9),
              color: theme.palette.primary.contrastText,
              borderColor: theme.palette.primary.main,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            },
            '& .rbc-header': {
              backgroundColor: 'transparent',
              padding: '12px 8px',
              fontWeight: '600',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              letterSpacing: '0.8px',
              color: theme.palette.text.secondary,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`
            },
            '& .rbc-today': {
              backgroundColor: alpha(theme.palette.primary.light, 0.15),
              position: 'relative',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                background: theme.palette.primary.main
              }
            },
            '& .rbc-event': {
              padding: '4px 8px',
              borderRadius: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              fontSize: '0.85rem',
              border: 'none'
            },
            '& .rbc-day-bg + .rbc-day-bg': {
              borderLeft: `1px solid ${alpha(theme.palette.divider, 0.2)}`
            },
            '& .rbc-month-row + .rbc-month-row': {
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`
            },
            '& .rbc-date-cell': {
              padding: '8px',
              fontSize: '0.9rem',
              color: theme.palette.text.primary,
              '& a': {
                color: 'inherit',
                textDecoration: 'none',
                fontWeight: 500
              }
            },
            '& .rbc-off-range-bg': {
              backgroundColor: alpha(theme.palette.action.disabled, 0.05)
            },
            '& .rbc-off-range': {
              color: alpha(theme.palette.text.disabled, 0.5)
            },
            '& .rbc-show-more': {
              backgroundColor: 'transparent',
              color: theme.palette.primary.main,
              fontWeight: '600',
              fontSize: '0.8rem'
            },
            '& .rbc-current-time-indicator': {
              backgroundColor: theme.palette.error.main,
              height: 2
            }
          }}>
           <Calendar
            localizer={localizer}
            events={events.map(event => ({
              ...event,
              title: event.title || event.resource?.trainingName || 'Training Session' // Fallback title
            }))}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            onSelectEvent={handleSelectEvent}
            onNavigate={handleNavigate}
            defaultView={Views.MONTH}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            components={{
              eventWrapper: CustomMonthEventWrapper,
              toolbar: CustomToolbar,
              event: CustomEvent 
            }}
            eventPropGetter={eventStyleGetter}
            onShowMore={(events, date) => {
              setSelectedEvent(events[0]);
              setOpenDialog(true);
            }}
          />
          </Box>
        )}
      </Box>
    </Paper>
  </Slide>

  {/* Enhanced Event Details Dialog with layered design */}
  <Dialog 
    open={openDialog} 
    onClose={handleCloseDialog} 
    maxWidth="md" 
    fullWidth
    TransitionComponent={Slide}
    transitionDuration={350}
    PaperProps={{
      sx: { 
        borderRadius: '20px', 
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.default, 0.98)} 100%)`,
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
        }
      }
    }}
  >
    <DialogTitle 
      sx={{ 
        display: 'flex', 
        alignItems: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
        color: 'white',
        p: 3,
        position: 'relative',
        overflow: 'hidden',
        '&:after': {
          content: '""',
          position: 'absolute',
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          background: `radial-gradient(circle, ${alpha('#fff', 0.15)} 0%, transparent 70%)`,
          borderRadius: '50%'
        }
      }}
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: alpha('#fff', 0.2),
        borderRadius: '50%',
        p: 1,
        mr: 2
      }}>
        <Info sx={{ fontSize: 28 }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
        Training Session Details
      </Typography>
    </DialogTitle>
    
    <DialogContent sx={{ p: 0 }}>
      {selectedEvent && (
        <Box>
          {/* Enhanced header section */}
          <Box sx={{ 
            p: 3, 
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.08)} 0%, transparent 100%)`,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            position: 'relative',
            overflow: 'hidden',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -50,
              right: -50,
              width: 200,
              height: 200,
              background: `radial-gradient(circle, ${alpha(theme.palette.primary.light, 0.05)} 0%, transparent 70%)`,
              borderRadius: '50%'
            }
          }}>
            <Typography variant="h5" gutterBottom sx={{ 
              fontWeight: 700,
              color: theme.palette.primary.dark,
              position: 'relative',
              zIndex: 1
            }}>
              {selectedEvent.title}
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              flexWrap: 'wrap',
              position: 'relative',
              zIndex: 1
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                backgroundColor: alpha(theme.palette.primary.light, 0.1),
                borderRadius: '12px',
                px: 2,
                py: 1
              }}>
                <AccessTime fontSize="small" color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {moment(selectedEvent.start).format('dddd, MMMM D, YYYY')}
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                backgroundColor: alpha(theme.palette.secondary.light, 0.1),
                borderRadius: '12px',
                px: 2,
                py: 1
              }}>
                <Schedule fontSize="small" color="secondary" sx={{ mr: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {moment(selectedEvent.start).format('h:mm A')} - {moment(selectedEvent.end).format('h:mm A')}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {/* Content with improved grid layout */}
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Trainer Information */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  background: alpha(theme.palette.primary.light, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
                  height: '100%'
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    mb: 2,
                    fontWeight: 600,
                    color: theme.palette.primary.dark,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Person fontSize="small" /> Trainer Details
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ 
                      mr: 2, 
                      bgcolor: theme.palette.primary.main,
                      width: 48, 
                      height: 48,
                      boxShadow: theme.shadows[2]
                    }}>
                      {selectedEvent.resource.userName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedEvent.resource.trainerName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Trainer
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Email sx={{ 
                        mr: 2, 
                        color: theme.palette.secondary.main,
                        fontSize: '1.5rem' 
                      }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedEvent.resource.email}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Phone sx={{ 
                        mr: 2, 
                        color: theme.palette.info.main,
                        fontSize: '1.5rem' 
                      }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Contact</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedEvent.resource.phone || 'Not provided'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Location Information */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  background: alpha(theme.palette.info.light, 0.05),
                  border: `1px solid ${alpha(theme.palette.info.light, 0.2)}`,
                  height: '100%'
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    mb: 2,
                    fontWeight: 600,
                    color: theme.palette.info.dark,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <LocationOn fontSize="small" /> Location Details
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        p: 2,
                        borderRadius: '12px',
                        backgroundColor: alpha(theme.palette.info.light, 0.1),
                        height: '100%'
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          mb: 1
                        }}>
                          <Business sx={{ 
                            mr: 1.5, 
                            color: theme.palette.info.main,
                            fontSize: '1.5rem' 
                          }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Branch</Typography>
                        </Box>
                        <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                          {selectedEvent.resource.branch}
                        </Typography>

                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        p: 2,
                        borderRadius: '12px',
                        backgroundColor: alpha(theme.palette.success.light, 0.1),
                        height: '100%'
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          mb: 1
                        }}>
                          <Work sx={{ 
                            mr: 1.5, 
                            color: theme.palette.success.main,
                            fontSize: '1.5rem' 
                          }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Department</Typography>
                        </Box>
                        <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                          {selectedEvent.resource.department}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    {/* <Grid item xs={12}>
                      <Box sx={{ 
                        p: 2,
                        borderRadius: '12px',
                        backgroundColor: alpha(theme.palette.warning.light, 0.1),
                        mt: 1
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          mb: 1
                        }}>
                          <MeetingRoom sx={{ 
                            mr: 1.5, 
                            color: theme.palette.warning.main,
                            fontSize: '1.5rem' 
                          }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Training Room</Typography>
                        </Box>
                        <Typography variant="body1">
                          {selectedEvent.resource.location || 'Main Conference Room'}
                        </Typography>
                      </Box>
                    </Grid> */}
                  </Grid>
                </Paper>
              </Grid>
              
              {/* Training Information */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  background: alpha(theme.palette.warning.light, 0.05),
                  border: `1px solid ${alpha(theme.palette.warning.light, 0.2)}`
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    mb: 2,
                    fontWeight: 600,
                    color: theme.palette.warning.dark,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <School fontSize="small" /> Training Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 2,
                        borderRadius: '12px',
                        backgroundColor: alpha(theme.palette.warning.light, 0.1),
                        height: '100%'
                      }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600,
                          mb: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <Category fontSize="small" /> Training Topic
                        </Typography>
                        <Typography variant="body1">
                          {selectedEvent.resource.trainingTopic}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 2,
                        borderRadius: '12px',
                        backgroundColor: alpha(theme.palette.secondary.light, 0.1),
                        height: '100%'
                      }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600,
                          mb: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <Class fontSize="small" /> Training Type
                        </Typography>
                        <Typography variant="body1">
                          {selectedEvent.resource.trainingType}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 2,
                        borderRadius: '12px',
                        backgroundColor: alpha(theme.palette.primary.light, 0.1),
                        height: '100%'
                      }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600,
                          mb: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <Person fontSize="small" /> Organizer
                        </Typography>
                        <Typography variant="body1">
                          {selectedEvent.resource.CreatedUser}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 2,
                        borderRadius: '12px',
                        backgroundColor: alpha(theme.palette.error.light, 0.1),
                        height: '100%'
                      }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600,
                          mb: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <EventAvailable fontSize="small" /> Status
                        </Typography>
                        <Box>
                          {getStatusChip(selectedEvent.resource.status)}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              {/* Remarks Section */}
              {selectedEvent.resource.remarks && (
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{
                    p: 2.5,
                    borderRadius: '16px',
                    background: alpha(theme.palette.grey[200], 0.3),
                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`
                  }}>
                    <Typography variant="subtitle1" sx={{ 
                      mb: 2,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Comment fontSize="small" /> Additional Remarks
                    </Typography>
                    
                    <Box sx={{ 
                      p: 2.5,
                      backgroundColor: alpha(theme.palette.background.paper, 0.7),
                      borderRadius: '12px',
                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                      boxShadow: theme.shadows[1]
                    }}>
                      <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                        {selectedEvent.resource.remarks}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      )}
    </DialogContent>
    
    <DialogActions sx={{ 
      p: 3, 
      background: `linear-gradient(to top, ${alpha(theme.palette.grey[100], 0.7)} 0%, transparent 100%)`,
      borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`
    }}>
      <Button 
        onClick={handleCloseDialog}
        variant="contained"
        color="primary"
        sx={{ 
          borderRadius: '12px',
          px: 4,
          py: 1,
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
          },
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
        }}
        endIcon={<Check />}
      >
        Close
      </Button>
    </DialogActions>
  </Dialog>
</Box>
        </div>
      </div>
    </Fade>
  );
};

export default AdminCalendar;