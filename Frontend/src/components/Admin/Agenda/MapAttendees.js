import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Grid,
  Paper,
} from "@mui/material";

const branches = ["Delhi", "Mumbai", "Chennai", "Bangalore", "Hyderabad"];
const departments = ["IT", "HR", "Finance", "Operations"];
const trainees = ["Alice", "Bob", "Charlie", "Diana", "Eve"];

const MapAttendees = () => {
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [traineeCount, setTraineeCount] = useState("");
  const [selectedTrainees, setSelectedTrainees] = useState([]);

  const handleTraineesChange = (event) => {
    const { target: { value } } = event;
    setSelectedTrainees(typeof value === 'string' ? value.split(",") : value);
  };

  return (
     <Box sx={{ p: 1 }}>
                    {/* Heading */}
                    <Typography
                      variant="h6"
                      sx={{
                        textAlign: "center",
                        mb: 2,
                        color: "#1A005D",
                        fontWeight: "bold",
                      }}                
                    >
                  Mapping Attendees
                </Typography>
            <Paper elevation={3} sx={{ p: 3, borderRadius: "12px" }}>
                <Grid container spacing={3}>
                {/* Branch Selector */}
                <Grid item xs={12} sm={6}>
                    <FormControl
                        fullWidth
                        size="small"
                        sx={{
                        "& .MuiOutlinedInput-root": {
                            height: "45px",
                            fontSize: "14px",
                        },
                        "& .MuiSelect-select": {
                            height: "45px",
                            display: "flex",
                            alignItems: "center",
                        },
                        }}
                    >
                    <InputLabel id="branch-label">Branch</InputLabel>
                    <Select
                        labelId="branch-label"
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        label="Branch"
                        sx={{
                            color: "#1A005D",
                            "&.Mui-focused": { color: "#8EC400" },
                            lineHeight: "30px",
                        }}
                    >
                        {branches.map((branch) => (
                        <MenuItem key={branch} value={branch}>
                            {branch}
                        </MenuItem>
                        ))}
                    </Select>
                    </FormControl>
                </Grid>

                {/* Department Selector */}
                <Grid item xs={12} sm={6}>
                <FormControl
                        fullWidth
                        size="small"
                        sx={{
                        "& .MuiOutlinedInput-root": {
                            height: "45px",
                            fontSize: "14px",
                        },
                        "& .MuiSelect-select": {
                            height: "45px",
                            display: "flex",
                            alignItems: "center",
                        },
                        }}
                    >
                    <InputLabel id="department-label">Department</InputLabel>
                    <Select
                        labelId="department-label"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        label="Department"
                       
                    >
                        {departments.map((department) => (
                        <MenuItem key={department} value={department}>
                            {department}
                        </MenuItem>
                        ))}
                    </Select>
                    </FormControl>
                </Grid>

                {/* Trainee Count */}
                <Grid item xs={12} sm={6}>
                    <TextField
                    fullWidth
                    label="Trainee Count"
                    type="number"
                    value={traineeCount}
                    onChange={(e) => setTraineeCount(e.target.value)}
                    InputProps={{
                        style: {
                            height: "45px",
                            fontSize: "14px",
                            alignItems: "center",
                          },
                       
                    }}
                    sx={{ backgroundColor: "#FFF" }}
                    />
                </Grid>

                {/* Trainee Selector */}
                <Grid item xs={12}>
                     <FormControl
                        fullWidth
                        size="small"
                        sx={{
                        "& .MuiOutlinedInput-root": {
                            height: "45px",
                            fontSize: "14px",
                        },
                        "& .MuiSelect-select": {
                            height: "50px",
                            display: "flex",
                            alignItems: "center",
                        },
                        }}
                    >
                    <InputLabel id="trainees-label">Select Trainees</InputLabel>
                    <Select
                        labelId="trainees-label"
                        multiple
                        value={selectedTrainees}
                        onChange={handleTraineesChange}
                        input={<OutlinedInput label="Select Trainees" />}
                        renderValue={(selected) => selected.join(", ")}
                        MenuProps={{
                        PaperProps: {
                            sx: {
                            maxHeight: 200,
                            "& .MuiMenuItem-root": { fontSize: 14, fontWeight: 500 },
                            },
                        },
                        }}
                        sx={{  backgroundColor: "#FFF" }}
                    >
                        {trainees.map((trainee) => (
                        <MenuItem key={trainee} value={trainee}>
                            <Checkbox checked={selectedTrainees.indexOf(trainee) > -1} />
                            <ListItemText primary={trainee} />
                        </MenuItem>
                        ))}
                    </Select>
                    </FormControl>
                </Grid>
                </Grid>
            </Paper>
    </Box>
  );
};

export default MapAttendees;
