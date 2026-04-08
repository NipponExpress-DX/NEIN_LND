import React from 'react';
import { Breadcrumbs, Link, Typography, Grid, Card, CardContent, CardActionArea, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import BarChartIcon from '@mui/icons-material/BarChart';
import FeedbackIcon from '@mui/icons-material/Feedback';

function UserTrainingSummary() {
  const navigate = useNavigate();

  const cardDetails = [
    { 
      title: 'Mandatory Trainings', 
      navigateTo: '/mandatory-trainings', 
      bgColor: '#FFEBEE', 
      icon: <SchoolIcon style={{ fontSize: 50, color: '#D32F2F' }} /> 
    },
    { 
      title: 'Going to Happen', 
      navigateTo: '/upcoming-events', 
      bgColor: '#E3F2FD', 
      icon: <EventIcon style={{ fontSize: 50, color: '#1976D2' }} /> 
    },
    { 
      title: 'Your Performance', 
      navigateTo: '/performance', 
      bgColor: '#E8F5E9', 
      icon: <BarChartIcon style={{ fontSize: 50, color: '#388E3C' }} /> 
    },
    { 
      title: 'Feedback and Questionnaire', 
      navigateTo: '/feedback', 
      bgColor: '#FFF3E0', 
      icon: <FeedbackIcon style={{ fontSize: 50, color: '#F57C00' }} /> 
    },
  ];

  return (
    <div className="admin-dashboard-content">
      <div className="main-content">
        {/* Breadcrumb */}
        <Breadcrumbs
          aria-label="breadcrumb"
          style={{ color: '#230372', fontVariant: 'all-small-caps', textAlign: 'left', marginBottom: '20px' }}
        >
          <Link underline="hover" color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Typography color="textPrimary" style={{ textDecoration: 'underline' }}>
            Training Summary
          </Typography>
        </Breadcrumbs>

        {/* Cards */}
        <Grid container spacing={4} justifyContent="center">
          {cardDetails.map((card, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card
                style={{
                  backgroundColor: card.bgColor,
                  borderRadius: '15px',
                  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0px 8px 20px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0px 4px 10px rgba(0, 0, 0, 0.1)';
                }}
              >
                <CardActionArea onClick={() => navigate(card.navigateTo)}>
                  <CardContent style={{ textAlign: 'center', padding: '30px 20px' }}>
                    <Box style={{ marginBottom: '15px' }}>
                      {card.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      component="div"
                      style={{
                        fontWeight: 'bold',
                        color: '#230372',
                        fontSize: '18px',
                      }}
                    >
                      {card.title}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </div>
    </div>
  );
}

export default UserTrainingSummary;
