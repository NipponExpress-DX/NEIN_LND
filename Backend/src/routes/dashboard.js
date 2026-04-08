const express = require('express');
const router = express.Router(); // Create the router instance

const {
    branch_assigned_to_user_attended,
    department_assigned_to_user_attended ,
    Planned_branch_and_assigned_to_user_Planning_Training_under_process,
    Assign_count_Assign_to_user_time_and_Assign_attadence_count_Assign_to_user_spend_time,
    Departmental_Training_Performance,
    Branch_Training_Performance ,
    TrainingEffectivenessAllMeasures
    
} = require('../controllers/dashboard/UserDashboard');


// Routes branch_assigned_to_user_attended

router.post('/branch_assigned_to_user_attended', (req, res) => {
  
    branch_assigned_to_user_attended(req, res);
});
// Routes department_assigned_to_user_attended 

router.post('/department_assigned_to_user_attended', (req, res) => {
    department_assigned_to_user_attended (req, res);
});


// Routes Planned_branch_and_assigned_to_user_Planning_Training_under_process

router.post('/Planned_branch_and_assigned_to_user_Planning_Training_under_process', (req, res) => {
     console.log("TESTING ", req.body); 
    Planned_branch_and_assigned_to_user_Planning_Training_under_process(req, res);
});


// Routes Assign_count_Assign_to_user_time_and_Assign_attadence_count_Assign_to_user_spend_time

router.post('/Assign_count_Assign_to_user_time_and_Assign_attadence_count_Assign_to_user_spend_time', (req, res) => {
    console.log("TESTING ", req.body); 
    Assign_count_Assign_to_user_time_and_Assign_attadence_count_Assign_to_user_spend_time(req, res);
});

router.post('/TrainingEffectivenessAllMeasures', (req, res) => {
    console.log("TESTING ", req.body); 
    TrainingEffectivenessAllMeasures(req, res);
});

//   Departmental_Training_Performance

router.post('/Dept_and_branch_Training_Performance', (req, res) => {
    Departmental_Training_Performance(req, res);
});



//   Branch_Training_Performancev

router.post('/Branch_and_Dept_Training_Performance', (req, res) => {
    console.log("TESTING ", req.body); 
    Branch_Training_Performance(req, res);
});

module.exports = router;
