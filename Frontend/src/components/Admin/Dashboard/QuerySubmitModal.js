import React, { useState, useEffect } from "react";
import { Button, Box, Modal, TextField, Typography, Snackbar, Alert, Slide } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const QuerySubmitModal = ({ open, onClose, onSubmit }) => {
  const [query, setQuery] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [addFile, setAddFile] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const storedUserDetails = sessionStorage.getItem("userDetails");
    if (storedUserDetails) {
      try {
        setLoggedInUser(JSON.parse(storedUserDetails));
      } catch (error) {
        console.error("Error parsing user details from sessionStorage:", error);
      }
    }
  }, []);
  const handleSubmit = async () => {
    if (!query.trim()) {
      toast.error("Please enter your issue.");
      return;
    }
    if (!loggedInUser?.emp_id) {
      toast.error("Employee ID is missing. Please check your login details.");
      return;
    }
  
    const formData = new FormData();
    if (addFile?.uploadedFile) {
      formData.append("file", addFile.uploadedFile);
      formData.append("fileName", addFile.fileName);
    }
    formData.append("requestData", JSON.stringify({ emp_id: loggedInUser.emp_id, YourIssue: query }));
  
    try {
      const response = await axios.post(
        `${API_BASE_URL}/ListnesRoutes/notification/RaiseAQuerySendMailToNEINTeam`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
  
      console.log("Backend Response:", response.data);  // Debugging log
  
      if (response.status === 200 && response.data.message === "Query submitted successfully." && response.data.trackingId) {
        // setSnackbar({
        //   open: true,
        //   message: `Your query has been submitted successfully. Tracking ID: ${response.data.trackingId}`,
        //   severity: "success",
        // });
  
        onSubmit({ query });
        handleClose();
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Error submitting query:", error);
      setSnackbar({
        open: true,
        message: "Failed to submit the query. Try again later.",
        severity: "error",
      });
    }
  };
  

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAddFile({ uploadedFile: file, fileName: file.name });
    }
  };

  const handleClose = () => {
    setQuery("");
    setAddFile(null);
    onClose();
  };

  return (
    <>
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            width: { xs: "90%", sm: 420 },
            p: 4,
            bgcolor: "white",
            borderRadius: 3,
            boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.2)",
            margin: "auto",
            mt: "10%",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            textAlign: "center",
          }}
        >
          <Typography variant="h5" fontWeight="bold">📨 Raise a Query</Typography>

          <TextField fullWidth label="Your Email" value={loggedInUser?.user_email || ""} disabled margin="dense" variant="outlined" />
          <TextField fullWidth label="Your Query" value={query} onChange={(e) => setQuery(e.target.value)} margin="dense" multiline rows={4} variant="outlined" />
          <input type="file" onChange={handleFile} />

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={handleClose} sx={{ borderColor: "#d32f2f", color: "#d32f2f" }}>Cancel</Button>
            <Button variant="contained" endIcon={<SendIcon />} onClick={handleSubmit} sx={{ bgcolor: "#1A005D" }}>Submit</Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        TransitionComponent={(props) => <Slide {...props} direction="up" />}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default QuerySubmitModal;
