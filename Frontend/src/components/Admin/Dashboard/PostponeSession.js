import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  TextField, 
  Button, 
  Grid, 
  Stack 
} from "@mui/material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from "dayjs";
import axios from "axios";
import { Snackbar, Alert } from "@mui/material";
import '../../../css/Admincss/AdminDashboardContent.css';
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrBefore);

const PostponeSession = ({ session, setSessionsData, open, handleClose }) => {
  const defaultSessionDate = session ? dayjs(session.session_date) : dayjs();
  const [sessionDate, setSessionDate] = useState(defaultSessionDate);
  const [fromTime, setFromTime] = useState(null);
  const [toTime, setToTime] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState({
    sessionDate: "",
    fromTime: "",
    toTime: "",
    remarks: "",
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    if (open && session) {
      setSessionDate(defaultSessionDate);
      setFromTime(session.from_time ? dayjs(session.from_time, "HH:mm:ss") : dayjs());
      setToTime(session.to_time ? dayjs(session.to_time, "HH:mm:ss") : dayjs().add(1, "hour"));
      setRemarks(session.Remarks || "");
      setErrors({ sessionDate: "", fromTime: "", toTime: "", remarks: "" });
    }
  }, [open, session]);

  const validateForm = () => {
    const newErrors = { 
      sessionDate: "", 
      fromTime: "", 
      toTime: "", 
      remarks: "" 
    };

    if (!sessionDate) {
      newErrors.sessionDate = "Session date is required";
    } else if (sessionDate.isBefore(defaultSessionDate, 'day')) {
      newErrors.sessionDate = "Cannot select a date before the default session date";
    }

    if (!fromTime || !dayjs.isDayjs(fromTime)) {
      newErrors.fromTime = "From time is required";
    }
    if (!toTime || !dayjs.isDayjs(toTime)) {
      newErrors.toTime = "To time is required";
    }

    if (fromTime && toTime && dayjs(toTime).isSameOrBefore(dayjs(fromTime))) {
      newErrors.toTime = "To Time must be after From Time";
    }

    if (!remarks || remarks.trim() === "") {
      newErrors.remarks = "Remarks are required";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(error => !error);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
  
    const payload = {
      planing_id: session.planing_id,
      session_no: session.session_no,
      emp_id: session.emp_id,
      user_name: session.user_name,
      user_email: session.user_email,
      session_date: sessionDate.format("YYYY-MM-DD"),
      from_time: fromTime.format("HH:mm:ss"),
      to_time: toTime.format("HH:mm:ss"),
      PSstatus: "postpone",
      Remarks: remarks,
    };
  
    try {
      // Step 1: Postpone the session
      await axios.post(`${API_BASE_URL}/planning-route/session/postpone`, payload);
  
      setSessionsData(prev => ({
        ...prev,
        [session.planing_id]: prev[session.planing_id].map(s => 
          s.session_no === session.session_no ? { 
            ...s, 
            ...payload,
            PSstatus: "postpone" 
          } : s
        )
      }));
  
      // Step 2: Send notification email
      const emailPayload = {
        planing_id: session.planing_id,
        session_no: session.session_no
      };
  
      await axios.post(`${API_BASE_URL}/ListnesRoutes/notification/sendPlanningPostPoneCreatorNotification`, emailPayload);
  
      setSnackbarMessage("Session postponed and email notification sent successfully!");
      setSnackbarSeverity("success");
  
      handleClose(); // Close the modal after successful submission
    } catch (error) {
      console.error("Error:", error);
      setSnackbarMessage("Failed to postpone session or send email. Please try again.");
      setSnackbarSeverity("error");
    } finally {
      setSnackbarOpen(true);
    }
  };
  

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          width: '1000px',
          maxWidth: '120vw',
          minHeight: '300px',
          borderRadius: '12px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      <DialogTitle sx={{ color: "#1A237E", fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' }}>
        Postpone Session
      </DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack spacing={3} sx={{ 
            mt: 3,
            width: '100%',
            '& .MuiFormHelperText-root': {
              minHeight: '24px'
            }
          }}>
            {/* Session Date */}
            <Grid container spacing={0} alignItems="flex-start">
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Session Date *"
                  value={sessionDate}
                  onChange={(newValue) => {
                    setSessionDate(newValue);
                    setErrors(prev => ({ ...prev, sessionDate: "" }));
                  }}
                  format="DD-MM-YYYY"
                  minDate={defaultSessionDate}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      error: !!errors.sessionDate,
                      helperText: errors.sessionDate,
                      InputLabelProps: {
                        sx: { 
                          color: sessionDate ? "#1A005D" : "inherit",
                          "&.Mui-focused": { 
                            color: "#8EC400" 
                          } 
                        }
                      },
                      sx: { 
                        '& .MuiInputBase-root': {
                          height: 56,
                          '& .MuiInputBase-input': {
                            paddingTop: '8px',
                            paddingBottom: '8px'
                          }
                        }
                      }
                    }
                  }}
                />
              </Grid>

              {/* Time Pickers */}
              <Grid item xs={12} sm={6}>
                <Grid container spacing={0}>
                  <Grid item xs={6}>
                    <TimePicker
                      label="From Time *"
                      value={fromTime}
                      onChange={(newValue) => {
                        setFromTime(newValue);
                        setErrors(prev => ({ ...prev, fromTime: "" }));
                      }}
                      ampm={false}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.fromTime,
                          helperText: errors.fromTime,
                          size: "small",
                          InputLabelProps: {
                            shrink: Boolean(fromTime),
                            sx: {
                              color: fromTime ? "#1A005D" : "inherit",
                              "&.Mui-focused": {
                                color: "#8EC400 !important",
                              },
                              "&.MuiFormLabel-filled": {
                                color: "#1A005D !important",
                              },
                            }
                          },
                          sx: { 
                            '& .MuiInputBase-root': {
                              height: 56,
                              '& .MuiInputBase-input': {
                                paddingTop: '8px',
                                paddingBottom: '8px'
                              }
                            }
                          }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <TimePicker
                      label="To Time *"
                      value={toTime}
                      onChange={(newValue) => {
                        setToTime(newValue);
                        setErrors(prev => ({ ...prev, toTime: "" }));
                      }}
                      ampm={false}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.toTime,
                          helperText: errors.toTime,
                          size: "small",
                          InputLabelProps: {
                            shrink: Boolean(toTime),
                            sx: {
                              color: toTime ? "#1A005D" : "inherit",
                              "&.Mui-focused": {
                                color: "#8EC400 !important",
                              },
                              "&.MuiFormLabel-filled": {
                                color: "#1A005D !important",
                              },
                            }
                          },
                          sx: { 
                            '& .MuiInputBase-root': {
                              height: 56,
                              '& .MuiInputBase-input': {
                                paddingTop: '8px',
                                paddingBottom: '8px'
                              }
                            }
                          }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Remarks */}
            <TextField
              label="Remarks *"
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                setErrors(prev => ({ ...prev, remarks: "" }));
              }}
              fullWidth
              margin="normal"
              className="topic-field"
              error={!!errors.remarks}
              helperText={errors.remarks}
              required
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                '& .MuiInputBase-root': {
                  height: '56px',
                  '& .MuiInputBase-input': {
                    paddingTop: '8px',
                    paddingBottom: '8px'
                  }
                }
              }}
            />
          </Stack>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', padding: '12px' }}>
      <Button
        onClick={handleClose}
        sx={{
          backgroundColor: 'orange',
          color: 'black',
          fontSize: '0.8rem',
          padding: '8px 14px',
          textTransform: 'none',
          borderRadius: 2,
          '&:hover': { backgroundColor: '#FFBF00' },
        }}
      >
        Cancel
      </Button>
      <Button
        onClick={handleSubmit}
        variant="contained"
        sx={{
          backgroundColor: '#1A005D',
          color: 'white',
          fontSize: '0.8rem',
          padding: '8px 14px',
          textTransform: 'none',
          borderRadius: 2,
          '&:hover': { backgroundColor: '#1A005F' },
        }}
      >
        Submit
      </Button>
    </DialogActions>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          top: "50% !important",
          transform: "translateY(-50%) !important",
        }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default PostponeSession;