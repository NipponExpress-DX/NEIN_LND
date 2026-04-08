import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import '../../css/Admincss/AdminDashboard.css';
import '../../css/Admincss/AdminDashboardContent.css';
import '../../css/Admincss/Notifications.css';

function UserNotifications() {
  const notificationData = [
    { id: 1, message: 'New training session on React Basics scheduled for Jan 2024.' },
    { id: 2, message: 'Advanced Node.js training registration is open until Feb 10, 2024.' },
    { id: 3, message: 'Reminder: CSS Flexbox training on Mar 5, 2024.' },
   
  ];

  return (
    <div className="notification-content"> 
      <div className="notification-page">
      <h1 className="header-title" style={{ color: '#230372', fontVariant: 'petite-caps', textAlign: 'center', textDecoration: 'underline' }}>
        Notifications
      </h1>
      <TableContainer component={Paper}>
        <Table aria-label="notifications table">
          <TableHead>
            <TableRow>
              <TableCell align="left"><b>Notification ID</b></TableCell>
              <TableCell align="left"><b>Message</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notificationData.map((notification) => (
              <TableRow key={notification.id}>
                <TableCell>{notification.id}</TableCell>
                <TableCell>{notification.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
    </div>
  );
}

export default UserNotifications;
