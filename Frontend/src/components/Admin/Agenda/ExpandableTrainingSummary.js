import React from "react";
import { Grid, Box, Typography, Divider, Tooltip, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import LocationOn from "@mui/icons-material/LocationOn";
import Business from "@mui/icons-material/Business";
import Group from "@mui/icons-material/Group";
import Event from "@mui/icons-material/Event";
import DirectionsRun from "@mui/icons-material/DirectionsRun";
import Person from "@mui/icons-material/Person";
import TopicIcon from "@mui/icons-material/Topic";

const ExpandableTrainingSummary = ({ trainingData }) => {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // Function to extract the first value and check if more than 2 exist
  const formatDisplayValue = (value) => {
    if (!value || value.length === 0) return "N/A"; // Handle empty case

    // If value is an array, take first element and split it
    const items = Array.isArray(value) ? value[0].split(",") : String(value).split(",");

    return items.length > 1 ? `${items[0]} ++` : items[0];
  };

   // Handle navigation
   const handleNavigate = () => {
    navigate('/admindashboard/dashboardcontent')
  };
  
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 3,
            py: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              textAlign: "center",
              color: "#1A005D",
              fontWeight: "bold",
            }}
          >
            Training Summary
          </Typography>
          {/* Button to navigate */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleNavigate}
            sx={{
              backgroundColor: "#1A005D",
              "&:hover": { backgroundColor: "#12003D" },
              fontSize: "0.75rem",
              padding: "4px 12px",
              textTransform: "none",
              borderRadius: "8px",
            }}
          >
            Home
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
      </Grid>

      {/* Row 1 */}
      <Grid container item xs={12} sx={{ mb: 1 }}>
        <Grid item xs={12}>
          <Typography sx={{ display: "flex", gap: 1, fontSize: "0.875rem" }}>
            <TopicIcon sx={{ color: "#f3213e", fontSize: "1rem" }} />
            <strong>Topic:</strong> {trainingData.topic || "N/A"}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Tooltip title={trainingData.branch || "N/A"}>
            <Typography sx={{ display: "flex", gap: 1, fontSize: "0.875rem" }}>
              <LocationOn sx={{ color: "#2196f3", fontSize: "1rem" }} />
              <strong>Branch:</strong> {formatDisplayValue(trainingData.branch)}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid item xs={12}>
          <Tooltip title={trainingData.department || "N/A"}>
            <Typography sx={{ display: "flex", gap: 1, fontSize: "0.875rem" }}>
              <Business sx={{ color: "#ff9800", fontSize: "1rem" }} />
              <strong>Department:</strong> {formatDisplayValue(trainingData.department)}
            </Typography>
          </Tooltip>
        </Grid>
      </Grid>

      {/* Row 2 */}
      <Grid container item xs={12} sx={{ mb: 1 }}>
        <Grid item xs={12}>
          <Typography sx={{ display: "flex", gap: 1, fontSize: "0.875rem" }}>
            <Group sx={{ color: "#9c27b0", fontSize: "1rem" }} />
            <strong>Category:</strong> {trainingData.category || "N/A"}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography sx={{ display: "flex", gap: 1, fontSize: "0.875rem" }}>
            <Event sx={{ color: "#3f51b5", fontSize: "1rem" }} />
            <strong>Date:</strong> {trainingData.date || "N/A"}
          </Typography>
        </Grid>
      </Grid>

      {/* Row 3 */}
      <Grid container item xs={12} sx={{ mb: 1 }}>
        <Grid item xs={12}>
          <Typography sx={{ display: "flex", gap: 1, fontSize: "0.875rem" }}>
            <DirectionsRun sx={{ color: "#ff5722", fontSize: "1rem" }} />
            <strong>Status:</strong> {trainingData.status || "N/A"}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "0.875rem" }}>
            <Person sx={{ color: "#607d8b", fontSize: "1rem" }} />
            <strong>Trainer:</strong> {trainingData.trainer_type || "N/A"}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ExpandableTrainingSummary;
