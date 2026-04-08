import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Grid, Tooltip } from "@mui/material";
import RoleCreation from '../../../images/process.png';
import RoleMgmt from '../../../images/team-management.png';
import Users from '../../../images/people-together.png';
import StaffCategory from '../../../images/grouping.png';
import TrainerInfo from '../../../images/personal-trainer.png';
import formsInfo from '../../../images/checklist.png';
import QuizInfo from '../../../images/choose.png';
import TrainingTopic from '../../../images/conversation.png';

// Navigation Items
const mastersData = [
  {
    title: "Administration",
    items: [
      { name: "Roles creation", icon: RoleCreation, path: "/admindashboard/lnd/RoleMaster", permissionKey: "Roles creation" },
      { name: "Role Mgmt", icon: RoleMgmt, path: "/admindashboard/lnd/RoleManagement", permissionKey: "Role Mgmt" },
      { name: "Users", icon: Users, path: "/admindashboard/lnd/RoleAccess" },
    ],
  },
  {
    title: "L&D Masters",
    items: [
      { name: "Training Topic", icon: TrainingTopic, path: "/admindashboard/lnd/TraningTopicMaster", permissionKey: "Training Topic" },
      { name: "Staff Category", icon: StaffCategory, path: "/admindashboard/lnd/TrainingStaffCategory", permissionKey: "Staff Category" },
      { name: "Trainer Info", icon: TrainerInfo, path: "/admindashboard/lnd/TrainerInfoMaster", permissionKey: "Trainer Info" },
      { name: "Forms Info", icon: formsInfo, path: "/admindashboard/lnd/TrainingFormsMaster", permissionKey: "Forms Info" },
      { name: "Quiz Info", icon: QuizInfo, path: "/admindashboard/lnd/trainingquizmaster", permissionKey: "Quiz Info" },
    ],
  },
  
];

const MastersPage = () => {
  const navigate = useNavigate();
  const rolePermissions = JSON.parse(sessionStorage.getItem("rolePermissions")) || {};

  const hasPermission = (key) => {
    if (!key) return true; // Users menu does not need permission
    const permission = rolePermissions?.Masters?.[key];
    return permission && (permission.View === 1 || permission["View/Create/Edit"] === 1);
  };

  return (
    <div className="admin-dashboard-content">
      <div className="main-content">
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1, textAlign: "center", color: "#1A005D" }}>
          Masters
        </Typography>
        {mastersData.map((section, index) => (
          <Box key={index} mb={3}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1, color: "#8EC400" }}>
              {section.title}
            </Typography>
            <Grid container maxWidth="lg">
              {section.items.map((item, idx) => {
                const isEnabled = item.permissionKey ? hasPermission(item.permissionKey) : true;
                const tooltipText = isEnabled ? "Click to go" : `No access to "${item.name}"`;

                return (
                  <Grid item xs={3} sm={6} md={4} lg={3} key={idx} sx={{ padding: "20px" }}>
                    <Tooltip title={tooltipText} arrow>
                      <span>
                        <img
                          src={item.icon}
                          alt={item.name}
                          width="64px"
                          height="64px"
                          onClick={() => isEnabled && navigate(item.path)}
                          style={{
                            cursor: isEnabled ? "pointer" : "not-allowed",
                            opacity: isEnabled ? 1 : 0.5,
                          }}
                        />
                      </span>
                    </Tooltip>
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: "bold", color: "#1A005D" }}>
                      {item.name}
                    </Typography>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ))}
      </div>
    </div>
  );
};

export default MastersPage;
