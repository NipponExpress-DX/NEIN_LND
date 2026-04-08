import React from 'react'
import { Link, Outlet } from 'react-router-dom';
import { Breadcrumbs,  Typography } from '@mui/material';


function DashboardContent() {
  return (
    <div className="admin-dashboard-content">
    <div className="main-content">
    
        {/* Breadcrumb */}
        <Breadcrumbs
          aria-label="breadcrumb"
          style={{ color: '#230372', fontVariant: 'all-small-caps', textAlign: 'left', marginBottom: '20px' }}
        >
          <Link underline="hover" color="inherit" href="dashboard">
            Dashboard
          </Link>
          <Typography color="textPrimary" style={{ textDecoration: 'underline' }}>
            Dashboard
          </Typography>
        </Breadcrumbs>
      </div>
      <Outlet />
      </div>
  )
}

export default DashboardContent
