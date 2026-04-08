const express = require('express');
const router = express.Router(); // Create the router instance

const {
    ReportsTotalHoursSpend,
    ReportsAuditLogs,
    FeedBackReportsDataTable,
    FeedBackReportsCombined,
    TrainerFeedbackDetails,
    TraineeFeedbackDetails
    
} = require('../controllers/reports/reports');



// Route to get all training topics
router.post('/ReportsTotalHoursSpend', (req, res) => {
    console.log("Reports Total Hours Spend :", req.body); // Log incoming request body for debugging

    ReportsTotalHoursSpend(req, res);
});

// Route to get ReportsAuditLogs
router.post('/ReportsAuditLogs', (req, res) => {
    console.log("Reports Reports Audit Logs:", req.body);

    ReportsAuditLogs(req, res);
});


// Route to get FeedBackReportsDataTable
router.post('/FeedBackReportsDataTable', (req, res) => {
    console.log("FeedBack Reports DataTable:", req.body);

    FeedBackReportsDataTable(req, res);
});

// Route to get 
router.post('/FeedBackReportsCombined', (req, res) => {
    console.log("FeedBack Reports DataTable:", req.body);

    FeedBackReportsCombined(req, res);
});
// Route to get TrainerFeedbackDetails
router.post('/TrainerFeedbackDetails', (req, res) => {
    console.log("FeedBack info Trainer:", req.body);

    TrainerFeedbackDetails(req, res);
});
// Route to get TraineeFeedbackDetails
router.post('/TraineeFeedbackDetails', (req, res) => {
    console.log("FeedBack Reports Trainee:", req.body);

    TraineeFeedbackDetails(req, res);
});




module.exports = router;