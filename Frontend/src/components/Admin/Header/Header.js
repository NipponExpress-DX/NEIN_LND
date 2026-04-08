import React, { useState, useEffect, useCallback } from "react";
import Logo from '../../../images/nippon.svg';
import Collapse from '@mui/material/Collapse';
import '../../../css/Admincss/Header.css';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  MenuItem, 
  IconButton, 
  Badge, 
  Typography, 
  Tooltip, 
  Divider, 
  ListItemIcon,
  ListItemText
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { FaPowerOff } from "react-icons/fa6";
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import axios from 'axios';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Box } from '@mui/material';

function Header() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState({
    user: false,
    trainer: false,
    coordinator: false,
    sub_coordinator: false
  });
  
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const storedUser = sessionStorage.getItem('userDetails');
  const userDetails = storedUser ? JSON.parse(storedUser) : null;
  const emp_id = userDetails?.emp_id;
  const employeeName = userDetails?.empname || '';
  const department_code = userDetails?.department_code || '';
  const initial = employeeName.charAt(0) || '';

  // Toggle user menu
 // Updated toggleUserMenu function
 const toggleUserMenu = (event) => {
  event.stopPropagation();
  setAnchorEl(anchorEl ? null : event.currentTarget);
  // Close notification menu if it's open
  if (notifAnchorEl) {
    setNotifAnchorEl(null);
  }
};

  // Toggle notification menu
  const toggleNotifMenu = (event) => {
    event.stopPropagation();
    setNotifAnchorEl(notifAnchorEl ? null : event.currentTarget);
    // Close user menu if it's open
    if (anchorEl) {
      setAnchorEl(null);
    }
    if (!notifAnchorEl) {
      setExpandedGroups({
        user: false,
        trainer: false,
        coordinator: false,
        sub_coordinator: false
      });
    }
  };

  // Close all menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (anchorEl) setAnchorEl(null);
      if (notifAnchorEl) setNotifAnchorEl(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [anchorEl, notifAnchorEl]);

  // Session management
  const clearSession = useCallback(() => {
    sessionStorage.removeItem('userDetails');
    sessionStorage.removeItem('rolePermissions');
    sessionStorage.removeItem('token');
    const intervalId = sessionStorage.getItem("sessionCheckInterval");
    if (intervalId) clearInterval(parseInt(intervalId));
    sessionStorage.removeItem("sessionCheckInterval");
  }, []);

  const logAuditAction = useCallback(async (action, empId) => {
    try {
      await axios.post(`${API_BASE_URL}/login/logAudit`, {
        action,
        empId,
        systemIP: window.location.hostname || 'unknown'
      });
    } catch (error) {
      console.error("Audit log error:", error);
    }
  }, [API_BASE_URL]);

  const handleLogout = useCallback(async () => {
    try {
      if (emp_id) {
        await logAuditAction('LOGOUT', emp_id);
      }
    } catch (error) {
      console.error("Error during logout audit:", error);
    } finally {
      clearSession();
      navigate('/login', { replace: true });
    }
  }, [emp_id, logAuditAction, clearSession, navigate]);


  
  // Notification functions

    const formatTimeToAMPM = (time) => {
      if (!time) return "";

      const [hours, minutes] = time.split(":");
      const h = parseInt(hours, 10);

      const ampm = h >= 12 ? "PM" : "AM";
      const formattedHour = h % 12 || 12;

      return `${formattedHour}:${minutes} ${ampm}`;
    };


  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

      const fetchNotifications = useCallback(async () => {
        if (!emp_id) return;

        try {
          const response = await axios.post(
            `${API_BASE_URL}/planning-route/notification/frontend`,
            { emp_id }
          );

          const processedNotifications = response.data.notifications.map(notification => {
            const year = new Date(notification.session_date).getFullYear();
            const paddedPlaningId = notification.planing_id
              .toString()
              .padStart(4, "0");

            const sessionDate = formatDate(notification.session_date); 
            //const timeRange = `${notification.from_time} - ${notification.to_time}`;
            const fromTime = formatTimeToAMPM(notification.from_time);
            const toTime = formatTimeToAMPM(notification.to_time);


            return {
              id: `${notification.planing_id}-${notification.session_no}-${notification.role_type}`,
              planing_id: notification.planing_id,
              session_no: notification.session_no,
              role_type: notification.role_type,
              type: notification.role_type === 'participant' ? 'user' : notification.role_type,

              message: [
                  `Ref No:NEIN/LND/${paddedPlaningId}/${year}`,
                  `Topic: "${notification.training_topic}"`,
                  `Scheduled on ${sessionDate}`,
                  `Time: ${fromTime} - ${toTime}`
                ].join('\n'),

              isRead: notification.isRead_Trainer === 1,
              date_created: notification.date_created || new Date().toISOString()
            };
          });

          setNotifications(processedNotifications);
          setUnreadCount(response.data.unreadCount);
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      }, [emp_id, API_BASE_URL, formatDate]);



  const handleNotificationClick = useCallback(async (notification) => {
    try {
      if (!notification.isRead) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        await axios.post(
          `${API_BASE_URL}/planning-route/notification/markNotificationsAsRead`,
          {
            emp_id,
            planing_id: notification.planing_id,
            session_no: notification.session_no,
            role_type: notification.role_type
          }
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, [emp_id, API_BASE_URL]);

  // Fetch notifications on mount and setup interval
  useEffect(() => {
    if (emp_id) {
      fetchNotifications();
      const intervalId = setInterval(fetchNotifications, 5 * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [emp_id, fetchNotifications]);

  const toggleGroup = (groupType) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupType]: !prev[groupType]
    }));
  };

  // Notification grouping
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const type = notification.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(notification);
    return acc;
  }, {});

  const notificationGroups = [
    { type: 'user', label: 'User Alerts' },
    { type: 'trainer', label: 'Trainer Alerts' },
    { type: 'coordinator', label: 'Coordinator Alerts' },
    { type: 'sub_coordinator', label: 'Sub-Coordinator Alerts' }
  ];

  return (
   
    <header>
       {userDetails && (
      <div id="header1">
      
        <div className="navbar">
          
          
          
            
            <img 
            src={Logo} 
            alt="Logo" 
            style={{ width: '120px', height: '40px', cursor: 'pointer' }}
            onClick={() => navigate('/admindashboard/dashboardcontent')} 
          />
          
            <div className="user-actions">
              {/* Notifications */}
              <Tooltip title="Notifications">
                <IconButton 
                  onClick={toggleNotifMenu}
                  style={{ color: '#1A005D' }}
                  aria-label="notifications"
                >
                  <Badge badgeContent={unreadCount} color="error" max={99}>
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={notifAnchorEl}
                open={Boolean(notifAnchorEl)}
                onClose={() => setNotifAnchorEl(null)}
                className="custom-notification-menu"
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  style: {
                    maxHeight: '400px',
                    width: '350px',
                  },
                }}
              >
                {notifications.length > 0 ? (
                  notificationGroups.map((group) => {
                    const groupNotifications = groupedNotifications[group.type] || [];
                    if (groupNotifications.length === 0) return null;
                    
                    const isExpanded = expandedGroups[group.type];
                    const unreadInGroup = groupNotifications.filter(n => !n.isRead).length;

                    return (
                      <React.Fragment key={group.type}>
                        <MenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroup(group.type);
                          }}
                          sx={{ 
                            backgroundColor: 'background.paper',
                            '&:hover': { backgroundColor: 'action.hover' }
                          }}
                        >
                          <ListItemText 
                            primary={
                              <Typography variant="subtitle2" fontWeight="bold">
                                {group.label}
                              </Typography>
                            } 
                          />
                          <ListItemIcon sx={{ minWidth: 'unset', ml: 1 }}>
                            {unreadInGroup > 0 && (
                              <Badge 
                                badgeContent={unreadInGroup} 
                                color="error" 
                                max={99}
                                sx={{ mr: 1 }}
                              />
                            )}
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                          </ListItemIcon>
                        </MenuItem>
                        
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          {groupNotifications.map((notification) => (
                            <MenuItem 
                              key={notification.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification);
                              }}
                              className="custom-notification-item"
                              sx={{ 
                                opacity: notification.isRead ? 0.6 : 1,
                                whiteSpace: 'normal',
                                py: 1.5,
                                pl: 3
                              }}
                            >
                              <Typography variant="body2" className="notification-title">
                                {notification.message.split('\n').map((line, i) => (
                                  <React.Fragment key={i}>
                                    {line}
                                    <br />
                                  </React.Fragment>
                                ))}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                {formatDate(notification.date_created)}
                              </Typography>
                            </MenuItem>
                          ))}
                        </Collapse>
                        <Divider />
                      </React.Fragment>
                    );
                  })
                ) : (
                  <MenuItem disabled>
                    <Typography variant="body2">No new notifications</Typography>
                  </MenuItem>
                )}
              </Menu>
            {/* Combined User Profile and Logout Menu */}
             {/* Combined User Profile Menu */}
             <IconButton 
  onClick={toggleUserMenu}
  sx={{
    '&:hover': { backgroundColor: 'rgba(26, 0, 93, 0.08)' }
  }}
>
  <AccountCircleIcon sx={{ color: '#1A005D', fontSize: '28px' }} />
</IconButton>

<Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={() => setAnchorEl(null)}
  anchorOrigin={{
    vertical: 'bottom',
    horizontal: 'right',
  }}
  transformOrigin={{
    vertical: 'top',
    horizontal: 'right',
  }}
  PaperProps={{
    style: {
      width: '220px',
      padding: '8px 0',
      borderRadius: '8px',
      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
      border: '1px solid #f0f0f0'
    },
  }}
>
  {/* User Details - Centered with solid blue */}
  <MenuItem 
  sx={{ 
    py: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    '&.Mui-disabled': {
      opacity: 1, // Ensure full opacity even when disabled
    }
  }}
  disabled
>
  <Typography 
    sx={{
      fontWeight: 600,
      color: '#1A005D',
      borderBottom: '2px solid #1A005D',
      paddingBottom: '4px',
      width: '100%',
      fontSize: '1rem',
      '&.Mui-disabled': {
        color: '#1A005D', // Explicitly set color for disabled state
      }
    }}
  >
    {employeeName}
  </Typography>
  <Typography 
    sx={{
      fontWeight: 500,
      color: '#1A005D',

      mt: 1,
      fontSize: '0.875rem',
      '&.Mui-disabled': {
        color: '#1A005D', // Explicitly set color for disabled state
      }
    }}
  >
    {department_code}
  </Typography>
</MenuItem>

  {/* Logout Option - Centered */}
  <MenuItem 
    onClick={(e) => {
      e.stopPropagation();
      handleLogout();
    }} 
    sx={{
      py: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      '&:hover': {
        backgroundColor: 'rgba(255, 0, 0, 0.04)'
      }
    }}
  >
    <Box display="flex" alignItems="center">
      <FaPowerOff style={{ 
        marginRight: '12px', 
        color: '#ff0303',
        fontSize: '16px'
      }} />
      <Typography 
        sx={{
          fontWeight: 500,
          color: '#ff0303'
        }}
      >
        Logout
      </Typography>
    </Box>
  </MenuItem>
</Menu>
                    </div>
          
        </div>
      </div>
      )}
    </header>
  
  );
}

export default Header;