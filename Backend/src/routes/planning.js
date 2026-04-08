const express = require('express');
const router = express.Router(); // Create the router instance
const multer = require('multer');



const {
    NotificationFrontEnd,
    markNotificationsAsRead
    
} = require('../controllers/planning/NotificationFronEnd');


const {
    sendTrainerNotification ,
    sendCoordinatorNotification,
    sendTraineeNotification,

    
} = require('../Listners/getEmailContent');



const {
    getAllPlanningDetails,
    addPlaningDetails,
    updatingPlaningDetails,
    cancellingPlaningDetails,
    updatingStatusPlaningDetails ,
    ViewPlaningDetails,
    CorOrSubViewPlaningDetails,
    CorOrSubViewPlaningDetailsStatus,
    TrainerViewPlaningDetailsStatus,
    LNDCalendarDetails
    
} = require('../controllers/planning/planningController');


const {
    getAllActiveSessions,
    getParticularPlanningSessions,
    addSessions,
    updateSessions,
    updateSessionStatus,
    PostPoneSessionDate ,
    deleteSessions,
    ViewSessionDetails
    
} = require('../controllers/planning/sessionController');

const {
    addMappingCoordinator,
    updateMappingCoordinator,
    getAllActiveMappingCoordinator,
    deleteMappingCoordinator,
    ViewMappingCoordinatorDetails,
    sendCoordinatorEmail ,
    testingEmail,
    CoordinatorSessionActiveList,
    CoordinatorSessionActiveListCount
    
} = require('../controllers/planning/MappingCoordinatorController');

const {
    addMappingSubCoordinator,
    updateMappingSubCoordinator,
    deleteMappingSubCoordinator ,
    SubCoordinatorSessionActiveList,
    PlanningMainTableList,
    PlanningToSessionAllSubCoordinatorActiveList

} = require('../controllers/planning/MappingSubCoordinatorController');


const {
    addPSAssigingDetails,
    deletePSAssigingDetails,
    getAllPSAssigingDetails,
    getAllPSBDAssigingCompleteDetails,
    StorePlanningFiles ,
    getAllPlanningFiles,
    downloadPlanningFile,
    viewPlanningFile

}=require('../controllers/planning/PlanningSessionAsigning');


const {
    getAllActiveAttendanceStatus,
    updateTraineeAttendance,
    updateTraineeEffectiveness,
    getAllTraineeEffectiveness,

}=require('../controllers/planning/attendance');

const {
    sendFeedbackFormEmailTrainee,
    sendFeedbackFormEmailTraineePendingParsonsOnly,
    sendFeedbackReminderToSingleTrainee,
    FeedbackFormTrainee,
    submitFeedbackTrainee,
    FeedbackTraineeDataCheckPoint ,
    FeedbackFormTraineeQandA ,
    sendFeedbackFormEmailTrainer,
    FeedbackFormTrainer,
    submitFeedbackTrainer,
    sendTrainerNotificationEmail,
    sendTraineeCollectionNotificationEmailToTrainer,
    sendTrainingSelectionEmailToTrainee ,
    sendPendingFeedbackSubmissionEmail,
    sendPendingStatusFeedbackSubmissionEmailTrainer,
    sendPendingRemainderFeedbackSubmissionEmailTrainer,
    sendPendingFeedbackSubmissionEmailTraineeReport
}=require('../controllers/planning/formsendingmail');

const {
    ValidateQuizForm,
    sendQuizFormEmailTrainee,
    submitQuizTrainee,
    QuizFormTrainee

}=require('../controllers/planning/quizformsendingmail');

const {
    UserViewListBasisBranch ,
    UserViewListBasisTrainee

}=require('../controllers/planning/UserView');



// Route to get all training topics
router.post('/details', (req, res) => {
    console.log("Request Body for get all planning details :", req.body); // Log incoming request body for debugging

    getAllPlanningDetails(req, res);
});

router.post('/insert', (req, res) => {
    console.log("Request Body for insert planning  details:", req.body); // Log incoming request body for debugging

    addPlaningDetails(req, res);
});

router.post('/update', (req, res) => {
    console.log("Request Body for update planning  details:", req.body); // Log incoming request body for debugging

    updatingPlaningDetails(req, res);
});
router.post('/updateStatus', (req, res) => {
    console.log("Request Body for updating status of planning  details:", req.body); // Log incoming request body for debugging
  
    updatingStatusPlaningDetails (req, res);
});

router.post('/cancel', (req, res) => {
    console.log("Request Body for cancelling planning  details:", req.body); // Log incoming request body for debugging

    cancellingPlaningDetails(req, res);
});

router.post('/viewPlaningInfo', (req, res) => {
    console.log("Request Body for view Planing Info 999:", req.body); // Log incoming request body for debugging

    ViewPlaningDetails(req, res);
});
router.post('/CorOrSubViewPlaningDetails', (req, res) => {
    console.log("Request Body for view Planing Info:", req.body); // Log incoming request body for debugging

    CorOrSubViewPlaningDetails(req, res);
});

router.post('/CorOrSubViewPlaningDetailsStatus', (req, res) => {
    console.log("Request Body for view Planing Info:", req.body); // Log incoming request body for debugging

    CorOrSubViewPlaningDetailsStatus(req, res);
});

router.post('/TrainerViewPlaningDetailsStatus', (req, res) => {
    console.log("Request Body for TrainerViewPlaningDetailsStatus view Planing Info:", req.body); // Log incoming request body for debugging

    TrainerViewPlaningDetailsStatus(req, res);
});
router.post('/LNDCalendarDetails', (req, res) => {
    console.log("Request Body for LNDCalendarDetails view Planing Info:", req.body); // Log incoming request body for debugging

    LNDCalendarDetails(req, res);
});






// Session Controller adding

router.post('/session/add', (req, res) => {
    console.log("Request Body for Seesion adding  details:", req.body); 
    addSessions(req, res);
});

// Session Controller update sessions

router.post('/session/update', (req, res) => {
    console.log("Request Body for Seesion update  details:", req.body); 
    updateSessions(req, res);
});


// Session Controller update session Status

router.post('/session/updateStatus', (req, res) => {
    console.log("Request Body for Seesion update status  details:", req.body); 
    updateSessionStatus(req, res);
});

// Session Controller update session Status

router.post('/session/postpone', (req, res) => {
    // console.log("Request Body for Seesion update status  details:", req.body); 
    PostPoneSessionDate(req, res);
});


// Session Controller delete sessions

router.post('/session/delete', (req, res) => {
    console.log("Request Body for Seesion deleting  details:", req.body); 
    deleteSessions(req, res);
});


// Session Controller List infor

router.post('/session/list', (req, res) => {
    console.log("Request Body for Planing Seesion information :", req.body); 
    getAllActiveSessions(req, res);
});




// Particular Session Controller List infor

router.post('/session/viewSessionInfo', (req, res) => {
    console.log("Request Body for particular Planing Seesion information :", req.body); 
    getParticularPlanningSessions(req, res);
});


// Session Controller List infor

router.post('/session/viewSessionInfo', (req, res) => {
    console.log("Request Body for View Planing Seesion information :", req.body); 
    ViewSessionDetails(req, res);
});



// Coordinator Session Active List

router.post('/MappingCoordinator/listCount', (req, res) => {
    console.log("Request Body for Coordinator Session Active List details:", req.body); 
    CoordinatorSessionActiveListCount(req, res);
});



// Coordinator Session Active List

router.post('/MappingCoordinator/list', (req, res) => {
    console.log("Request Body for Coordinator Session Active List details:", req.body); 
    CoordinatorSessionActiveList(req, res);
});

//--------MappingCoordinator ----//
// addMappingCoordinator adding

router.post('/MappingCoordinator/add', (req, res) => {
    console.log("Request Body for Mapping Coordinator adding  details:", req.body); 
    addMappingCoordinator(req, res);
});

router.post('/MappingCoordinator/update', (req, res) => {
    console.log("Request Body for update Mapping Coordinator update  details:", req.body); 
    updateMappingCoordinator(req, res);
});


router.post('/MappingCoordinator/delete', (req, res) => {
    console.log("Request Body for delete Mapping Coordinator update  details:", req.body); 
    deleteMappingCoordinator(req, res);
});

router.post('/MappingCoordinator/sendMail', (req, res) => {
    console.log("Request Body for sendin mail to Mapping Coordinator :", req.body); 
    sendCoordinatorEmail (req, res);
});

router.post('/MappingCoordinator/send', (req, res) => {
    console.log("Request Body for sample infor to mail sending  Mapping Coordinator update  details:", req.body); 
    testingEmail(req, res);
});

router.post('/MappingCoordinator/view', (req, res) => {
    console.log("Request Body for View Mapping Coordinator Info:", req.body); // Log incoming request body for debugging

    ViewMappingCoordinatorDetails(req, res);
});

//--------Mapping Sub Coordinator ----//

router.post('/MappingSubCoordinator/add', (req, res) => {
    console.log("Request Body for Mapping sub Coordinator adding  details:", req.body); 
    addMappingSubCoordinator(req, res);
});

router.post('/MappingSubCoordinator/update', (req, res) => {
    console.log("Request Body for Mapping Sub Coordinator  Update details:", req.body); 
    updateMappingSubCoordinator(req, res);
});



router.post('/MappingSubCoordinator/delete', (req, res) => {
    console.log("Request Body for Mapping Sub Coordinator delete  details:", req.body); 
    deleteMappingSubCoordinator (req, res);
});

router.post('/MappingSubCoordinator/list', (req, res) => {
    console.log("Request Body for Mapping Sub Coordinator delete  details:", req.body); 
    SubCoordinatorSessionActiveList(req, res);
});


router.post('/MappingSubCoordinator/PlanningMainTableList', (req, res) => {
    console.log("Request Body for Planning Main Table List  details:", req.body); 
    PlanningMainTableList(req, res);
});

router.post('/MappingSubCoordinator/PlanningToSessionAllSubCoordinatorActiveList', (req, res) => {
    console.log("Request Body for Planning Main Table List  details:", req.body); 
    PlanningToSessionAllSubCoordinatorActiveList(req, res);
});




//  PlanningSessionAsigning adding

router.post('/PlanningSessionAsigningEmpMail/add', (req, res) => {
    console.log("Request Body for Planning Session Asigning Emp Mail  adding:", req.body); 
    addPSAssigingDetails(req, res);

});
router.post('/PlanningSessionAsigningEmpMail/delete', (req, res) => {
    console.log("Request Body for Planning Session Asigning Emp Mail  adding:", req.body); 
    deletePSAssigingDetails(req, res);

});


// all PlanningSessionAsigning list
router.post('/PlanningSessionAsigningEmpMail/list', (req, res) => {
    console.log("Request Body for Planning Session Asigning Emp Mail details:", req.body); 
    getAllPSAssigingDetails(req, res);

});

// 1 .all PlanningSessionAsigning StorePlanningFiles
// router.post('/PlanningSessionAsigningEmpMail/StorePlanningFiles', (req, res) => {
//     console.log("Request Body for Planning Session Asigning Emp Store Planning Files details:", req.body); 
//     StorePlanningFiles(req, res);

// });



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

// ✅ Use multer middleware here
router.post(
  '/PlanningSessionAsigningEmpMail/StorePlanningFiles',
  upload.array('files'), // must match key used in formData.append('files', file)
  StorePlanningFiles
);



// 2. all PlanningSessionAsigning getAllPlanningFiles
router.post('/PlanningSessionAsigningEmpMail/getAllPlanningFiles', (req, res) => {
    console.log("Request Body for Planning Session Asigning Emp get All Planning Files details:", req.body); 
    getAllPlanningFiles(req, res);

});



// 3. Download file
router.get(
  '/PlanningSessionAsigningEmpMail/downloadFile/:planing_id/:session_no/:filename',
  (req, res) => {
    console.log("Download request:", req.params);
    downloadPlanningFile(req, res);
  }
);

// 4. View  file
router.get(
  '/PlanningSessionAsigningEmpMail/viewFile/:planing_id/:session_no/:filename',
  (req, res) => {
    console.log("View file request:", req.params);
    viewPlanningFile(req, res);
  }
);

// route to generate view URL
router.get('/generateViewLink/:planing_id/:session_no/:filename', (req, res) => {
  const { planing_id, session_no, filename } = req.params;
  const { generateToken } = require('../Utility/tokenUtils');
  const indexPath = require('../variable');
  const { token, expires } = generateToken(planing_id, session_no, filename, 15);

  const url = `${indexPath.hostvariable}/planning-route/PlanningSessionAsigningEmpMail/viewFile/${planing_id}/${session_no}/${filename}`;
  res.json({ viewURL: url });
});





// all Planning Asigning list complete information
router.post('/PlanningSessionBranchDeptAsigningEmpMail/Completelist', (req, res) => {
    console.log("Request Body for Planning Session Asigning Emp Mail details:", req.body); 
    getAllPSBDAssigingCompleteDetails(req, res);

});


// all Active Attendance Statuslist
router.post('/PlanningSessionActiveAttendanceStatus/list', (req, res) => {
    console.log("Request Body for Planning Session Asigning Emp Mail details:", req.body); 
    getAllActiveAttendanceStatus(req, res);

});


// all Active Attendance Status update
router.post('/PlanningSessionActiveAttendanceStatus/update', (req, res) => {
    console.log("Request Body for Planning Session Asigning Emp Mail details:", req.body); 
    updateTraineeAttendance(req, res);

});



// all Active Trainee Effectiveness update
router.post('/updateTraineeEffectiveness/update', (req, res) => {
    console.log("Request Body for Planning Session Asigning Emp Mail details:", req.body); 
    updateTraineeEffectiveness(req, res);

});

// all Active Trainee Effectiveness update
router.post('/updateTraineeEffectiveness/get', (req, res) => {
    console.log("Request Body for Planning Session Asigning Emp Mail details:", req.body); 
    getAllTraineeEffectiveness(req, res);
});










//---        Trainee API's ---------//

// all Active Feedback form sending to trainee
router.post('/PlanningSessionActiveTrainees/sending-feedback', (req, res) => {
    console.log("Request Body for send Feedback Form details:", req.body); 
    sendFeedbackFormEmailTrainee(req, res);
});


// pending  Feedback form sending to all trainee
router.post('/PlanningSessionActiveTrainees/sendFeedbackFormEmailTraineePendingParsonsOnly', (req, res) => {
    console.log("Request Body for sendFeedbackFormEmailTraineePendingParsonsOnly Form details:", req.body); 
    sendFeedbackFormEmailTraineePendingParsonsOnly(req, res);
});

// pending Feedback form sending to single specific trainee only
router.post('/PlanningSessionActiveTrainees/sendFeedbackReminderToSingleTrainee', (req, res) => {
    console.log("Request Body for sendFeedbackReminderToSingleTrainee Form details:", req.body); 
    sendFeedbackReminderToSingleTrainee(req, res);
});


// Updated route using path variables rainee
router.get('/PlanningSessionActiveAttendanceStatus/feedback/:planing_id/:session_no', (req, res) => {
    console.log("Request Body for Feedback Form details:", req.params); 
    const { planing_id, session_no} = req.params;
    FeedbackFormTrainee(req, res, planing_id, session_no);
});

// Updated route submit Feedback Trainee  Trainee
router.post('/PlanningSessionActiveTrainees/FeedbackTraineeDataCheckPoint', (req, res) => {
    console.log("Request Body for send Feedback Form details:", req.body); 
    FeedbackTraineeDataCheckPoint(req, res);
});


// Updated route submit Feedback Trainee  Trainee
router.post('/PlanningSessionActiveTrainees/submitFeedbackTrainee', (req, res) => {
    console.log("Request Body for submitFeedbackTrainee  Feedback Form details:", req.body); 
    submitFeedbackTrainee (req, res);
});


router.post('/PlanningSessionActiveTrainees/sendPendingFeedbackSubmissionTrainee', (req, res) => {
    console.log("Request Body for sendPendingFeedbackSubmissionTrainee Feedback Form details:", req.body); 
    sendPendingFeedbackSubmissionTrainee(req, res);
});
// Updated route submit Feedback Trainee  Trainee
router.post('/PlanningSessionActiveTrainees/FeedbackFormTraineeQandA/:planing_id/:session_no/:trainee_id', (req, res) => {
    console.log("Request Body for send FeedbackFormTraineeQandA Form details:", req.body); 
    const { planing_id, session_no,trainee_id} = req.params;
    FeedbackFormTraineeQandA(req, res,planing_id, session_no,trainee_id);
});


//---             Trainer API's ----//
// all Active Feedback form sending to trainer
router.post('/PlanningSessionActiveTrainer/sending-feedback', (req, res) => {
    console.log("Request Body for sending-feedback Form details:", req.body); 
    sendFeedbackFormEmailTrainer(req, res);
});

// Updated route using path variables rainee
router.get('/PlanningSessionTrainer/feedback/:planing_id/:session_no', (req, res) => {
    console.log("Request Body for Feedback Form details 11:", req.params); 
    const { planing_id, session_no} = req.params;
    FeedbackFormTrainer(req, res, planing_id, session_no);
});

// Updated route submit Feedback Trainer
router.post('/PlanningSessionActiveTrainer/submitFeedbackTrainer', (req, res) => {
    console.log("Request Body for submit Feedback Trainer Form details:", req.body); 
    submitFeedbackTrainer (req, res);
});


//--------------------


// all Active Feedback form sending to trainee
router.post('/PlanningSessionActiveTrainees/sending-mail-to-trainer', (req, res) => {
    console.log("Request Body for send Feedback Form details:", req.body); 
    sendTrainerNotificationEmail(req, res);
});

// all Active Feedback form sending to trainee
router.post('/PlanningSessionActiveTrainees/sendTraineeCollectionNotificationEmailToTrainer', (req, res) => {
    console.log("Request Body for send Feedback Form details:", req.body); 
    
    sendTraineeCollectionNotificationEmailToTrainer(req, res);
});

// all Active Feedback form sending to trainee
router.post('/PlanningSessionActiveTrainees/sendTrainingSelectionEmailToTrainee', (req, res) => {
    console.log("Request Body for send Feedback Form details:", req.body); 
    sendTrainingSelectionEmailToTrainee (req, res);
});
//----------user view 

// user view branch relative planing information

router.post('/PlanningSessionActiveTrainees/UserViewListBasisBranch', (req, res) => {
    console.log("Request Body for send user view branch relative planing information:", req.body); 
    UserViewListBasisBranch(req, res);
});


router.post('/PlanningSessionActiveTrainees/UserViewListBasisTrainee', (req, res) => {
    console.log("Request Body for send user view branch relative planing information:", req.body); 
    UserViewListBasisTrainee  (req, res);
});

router.post('/PlanningSessionActiveTrainees/sendPendingFeedbackSubmissionEmailTraineeReport', (req, res) => {
    console.log("sendPendingFeedbackSubmissionEmailTraineeReport planing information:", req.body); 
    sendPendingFeedbackSubmissionEmailTraineeReport(req, res);
});

router.post('/PlanningSessionActiveTrainees/sendPendingStatusFeedbackSubmissionEmailTrainer', (req, res) => {
    console.log("sendPendingStatusFeedbackSubmissionEmailTrainer planing information:", req.body); 
    sendPendingStatusFeedbackSubmissionEmailTrainer(req, res);
});


router.post('/PlanningSessionActiveTrainees/sendPendingRemainderFeedbackSubmissionEmailTrainer', (req, res) => {
    console.log("sendPendingRemainderFeedbackSubmissionEmailTrainerplaning information:", req.body); 
    sendPendingRemainderFeedbackSubmissionEmailTrainer(req, res);
});
//----




//----------quiz form  sending API's


// Updated route submit Feedback Trainee  Trainee
router.post('/PlanningSessionActiveTrainees/sendQuizFormEmailTrainee', (req, res) => {
    console.log("Request Body for submitFeedbackTrainee  Feedback Form details:", req.body); 
    sendQuizFormEmailTrainee(req, res);
});

router.post('/PlanningSessionActiveTrainees/submitQuizTrainee ', (req, res) => {
    console.log("Request Body for submitFeedbackTrainee  Feedback Form details:", req.body); 
    submitQuizTrainee(req, res);
});

router.post('/PlanningSessionActiveTrainees/QuizFormTrainee ', (req, res) => {
    console.log("Request Body for submitFeedbackTrainee  Feedback Form details:", req.body); 
    QuizFormTrainee(req, res);
});

// Updated route submit Feedback Trainee  Trainee
router.post('/PlanningSessionActiveTrainees/quiz/:planing_id/:session_no/:trainee_id', (req, res) => {
    console.log("Request Body for send FeedbackFormTraineeQandA Form details:", req.body); 
    const { planing_id, session_no,trainee_id} = req.params;
    QuizFormTrainee(req, res,planing_id, session_no,trainee_id);
});

// sendTrainerNotification
router.post('/notification/sendTrainerNotification', (req, res) => {
    console.log("sendTrainerNotification Request Body for get  details :", req.body); 

    sendTrainerNotification(req, res);
});





//-----notidfication frontent------///


router.post('/notification/frontend', (req, res) => {
    console.log("Fronend Notification API details :", req.body); 

    NotificationFrontEnd(req, res);
});


router.post('/notification/markNotificationsAsRead', (req, res) => {
    console.log("Fronend Notification API details :", req.body); 

    markNotificationsAsRead(req, res);
});




module.exports = router;



