const express = require('express');
const router = express.Router();  // Create the router instance
const {
    addOrUpdatetrainingTopic,
    getAllTrainingTopics,
    deleteTrainingTopic,
    UpdatetrainingTopic
} = require('../controllers/trainingMaster/training_topicController');

const {
    addOrUpdateStaffCategory,
    getAllStaffCategories,
    deleteStaffCategory,
    UpdateStaffCategory
} = require('../controllers/trainingMaster/Staff_CategoryController');

const {
    addOrUpdatetrainingType,
    getAlltrainingTypes,
    deletetrainingType,
    UpdatetrainingType
} = require('../controllers/trainingMaster/training_typeController');
const {
    getAllBranchMaster ,
    getAllDepartment
 } = require('../controllers/trainingMaster/branch_dept_list');

 const {
    getAllRoleMaster
 } = require('../controllers/Roles/roles');


const {
    addOrUpdateExpenseList,
    getAllExpenseList,
    deleteExpenseList,
    UpdateExpenseList
} = require('../controllers/trainingMaster/Expense_ListController');

const {
    addQuestionPaper,
    updateQuestionPaper,
    deleteQuestionPaper,
    getQuestionPaperslist,
    AssigningQuizFormDetailsToTrainee,
    GetAllQuizFormDetailsToTrainee,
    TraineeUpdateQuizFormDetails,
    ValidateQuizForm

} = require('../controllers/trainingMaster/Quiz_QandA_controller');


const {
    addTrainerInformation ,
    getAllActiveTrainersList,
    getAllActiveTrainersInternal ,
    deleteTrainerInformation,
    updateTrainerInformationExternal
} = require('../controllers/trainingMaster/trainerInforController');
 


const {
    GetAllMasterFeedbackFormDetailsList,
    GetAllTraineeFeedbackFormDetailsList ,
    GetAllTrainerFeedbackFormDetailsList,

    addOrUpdateFeedbackFormDetails,
    UpdateFeedbackFormDetails ,
    DeleteFeedbackFormDetails,
    AssigningFeedbackFormDetailsToTrainee,
    GetAllFeedbackFormDetailsToTrainee,
    GetAllFeedbackFormDetailsCountToTrainee,
    GetAllFeedbackFormDetailsToTraineeList,
    SubmitFeedbackFormDetailsToParticularTrainee,
    GetAllSubmitedOrPendingFeedbackFormDetailsCountToTrainee,
    TraineeGetFeedbackFormDetails,
    TraineeUpdateFeedbackFormDetails,
    AssigningFeedbackFormDetailsToTrainer,
    GetAllFeedbackFormDetailsToTrainer,
    GetTraineeFeedbackStatus,
    CloseSessionAfterAttendance,
    GetFeedbackDeadlineForSession   
} = require('../controllers/trainingMaster/feedback_form');



// Route to add or update a trining topic
router.post('/topic/add', (req, res) => {
    console.log("Request Body for topic/add:", req.body);  // Log incoming request body
    addOrUpdatetrainingTopic(req, res);  // Pass to the controller
});

// Route to get all trining topic
router.get('/topic/list', (req, res) => {
    // res.json({ message: 'Branch master list endpoint is working!' }); 
    console.log("Request Body for topic /list:", req.body);  // Log incoming request body for GET
    getAllTrainingTopics(req, res);  // Pass to the controller
});

// Route to delete (mark as inactive) a trining topic
router.delete('/topic/delete', (req, res) => {
    console.log("Request Body for topic /delete:", req.body);  // Log incoming request body
    deleteTrainingTopic(req, res);  // Pass to the controller
});

// Route to update a trining topic
router.post('/topic/update', (req, res) => {
    console.log("Request Body for topic/add:", req.body);  // Log incoming request body
    UpdatetrainingTopic(req, res);  // Pass to the controller
});

// Route to add or update  staff category
router.post('/staff-category/add', (req, res) => {
    // res.json({ message: 'Branch master list endpoint is working!' }); 
    console.log("Request Body for staff-category /add:", req.body);  // Log incoming request body
    addOrUpdateStaffCategory(req, res);  // Pass to the controller
});

// Route to get all staff categories

router.get('/staff-category/list', (req, res) => {
    // res.json({ message: 'Branch master list endpoint is working!' }); 
    console.log("Request Body for staff-category /list:", req.body);  // Log incoming request body for GET
    getAllStaffCategories(req, res);  // Pass to the controller
});


// Route to delete (mark as inactive) a staff categories

router.delete('/staff-category/delete', (req, res) => {
    console.log("Request Body for staff-category /delete:", req.body);  // Log incoming request body
    deleteStaffCategory(req, res);  // Pass to the controller
});

// Route to Updating a staff categories

router.post('/staff-category/update', (req, res) => {
    console.log("Request Body for staff-category /delete:", req.body);  // Log incoming request body
    UpdateStaffCategory(req, res);  // Pass to the controller
});


// Route to add or update a training type
router.post('/type/add', (req, res) => {
    console.log("Request Body for type /add:", req.body);  // Log incoming request body
    addOrUpdatetrainingType(req, res);  // Pass to the controller
});


// Route to get all training type
router.get('/type/list', (req, res) => {
    console.log("Request Body for type /list:", req.body);  // Log incoming request body for GET
    getAlltrainingTypes(req, res);  // Pass to the controller
});
// Route to delete (mark as inactive) a training type
router.delete('/type/delete', (req, res) => {
    console.log("Request Body for type /delete:", req.body);  // Log incoming request body
    deletetrainingType(req, res);  // Pass to the controller
});

// Route to add  a training type
router.post('/type/update', (req, res) => {
    console.log("Request Body for type /Updating:", req.body);  // Log incoming request body
    UpdatetrainingType(req, res);  // Pass to the controller
});


//-----------------------------------


// Route to get all BranchMaster
router.get('/branchmaster/list', (req, res) => {
     //res.json({ message: 'Branch master list endpoint is working!' }); 
    console.log("Request Body for branchmaster /list:", req.body);  // Log incoming request body for GET
    getAllBranchMaster(req, res);  // Pass to the controller
});

// Route to get all training type
router.get('/department/list', (req, res) => {
    console.log("Request Body for department /list:", req.body);  // Log incoming request body for GET
    getAllDepartment(req, res);  // Pass to the controller
});


// Route to  get All Role Master
router.get('/rolemaster/list', (req, res) => {
    console.log("Request Body for department /list:", req.body);  // Log incoming request body for GET
    getAllRoleMaster(req, res);  // Pass to the controller
});

//-------------- Expense List Master ------------

// Route to add Expense List
router.post('/ExpenseList/add', (req, res) => {
    console.log("Request Body for ExpenseList /add:", req.body);  // Log incoming request body
    addOrUpdateExpenseList(req, res);  // Pass to the controller
});


// Route to get all Expense Lists
router.get('/ExpenseList/list', (req, res) => {
    // res.json({ message: 'Branch master list endpoint is working!' }); 
    console.log("Request Body for Expense Lists:", req.body);  // Log incoming request body for GET
    getAllExpenseList(req, res);  // Pass to the controller
});


// Route to delete (mark as inactive) a Expense List topic
router.delete('/ExpenseList/delete', (req, res) => {
    console.log("Request Body for Expense List topic /delete:", req.body);  // Log incoming request body
    deleteExpenseList(req, res);  // Pass to the controller
});


// Route to update a Expense List topic
router.post('/ExpenseList/update', (req, res) => {
    console.log("Request Body for ExpenseLis topic /update:", req.body);  // Log incoming request body
    UpdateExpenseList(req, res);  // Pass to the controller
});



//----------------------------------------

// Route to add or update a training type
router.post('/TrainerInfoMaster/add', (req, res) => {
    console.log("Request Body for TrainerInfoMaster /add:", req.body);  // Log incoming request body
    addTrainerInformation (req, res);  // Pass to the controller
});


// Route to get all External Trainer Info
router.post('/TrainerInfoMaster/list', (req, res) => {
     // Log incoming request body for GET
    getAllActiveTrainersList(req, res);  // Pass to the controller
});



// Route to delete (mark as inactive) a training type
router.post('/TrainerInfoMaster/delete', (req, res) => {
    console.log("Request Body for TrainerInfoMaster /delete:", req.body);  // Log incoming request body
    deleteTrainerInformation(req, res);  // Pass to the controller
});

// Route to update a Trainer Information External
router.post('/TrainerInfoMaster/update', (req, res) => {
    console.log("Request Body for Trainer Information External /update:", req.body);  // Log incoming request body
    updateTrainerInformationExternal(req, res);  // Pass to the controller
});


// Route to All Master feedback  questions  List
router.post('/AllMasterFeedbackFormQuestions/list', (req, res) => {
     GetAllMasterFeedbackFormDetailsList(req, res);  // Pass to the controller
});

router.post('/AllMasterFeedbackFormQuestions/listOfTrainee', (req, res) => {
    GetAllTraineeFeedbackFormDetailsList(req, res);  // Pass to the controller
});
router.post('/AllMasterFeedbackFormQuestions/listOfTrainer', (req, res) => {
    GetAllTrainerFeedbackFormDetailsList (req, res);  // Pass to the controller
});


// Route to add feedback  questions 
router.post('/AllMasterFeedbackFormQuestions/add', (req, res) => {
    console.log("Request Body for Feedback Form Details /add:", req.body);  // Log incoming request body
    addOrUpdateFeedbackFormDetails(req, res);  // Pass to the controller
});
// Route to add feedback  questions 
router.post('/AllMasterFeedbackFormQuestions/update', (req, res) => {
    console.log("Request Body for Feedback Form Details /add:", req.body);  // Log incoming request body
    UpdateFeedbackFormDetails(req, res);  // Pass to the controller
});

// Route to add feedback  questions 
router.post('/AllMasterFeedbackFormQuestions/delete', (req, res) => {
    console.log("Request Body for Feedback Form Details /add:", req.body);  // Log incoming request body
    DeleteFeedbackFormDetails(req, res);  // Pass to the controller
});


//------------------- to trainee -----------------------------------------//
// Route to assigning feedback  questions 
router.post('/FeedbackFormQuestions/assigningToTrainee', (req, res) => {
       AssigningFeedbackFormDetailsToTrainee(req, res);  // Pass to the controller
});

// Route to  get ALL Users  Feedback Form Details
router.post('/FeedbackFormQuestions/listToTrainee', (req, res) => {
       GetAllFeedbackFormDetailsToTrainee (req, res);  // Pass to the controller
});


// Route to  get ALL Users  Feedback Form Details count
router.post('/FeedbackFormQuestions/countToTrainee', (req, res) => {   
    GetAllFeedbackFormDetailsCountToTrainee(req, res);  // Pass to the controller
});


// Route to  get ALL Users  Feedback Form Details list
router.post('/FeedbackFormQuestions/GetAllFeedbackFormDetailsToTraineeList', (req, res) => {   
    GetAllFeedbackFormDetailsToTraineeList(req, res);  // Pass to the controller
});

// Route to  get ALL Users  Feedback Form Details count
router.post('/TraineeFeedbackFormQuestions/SubmitFeedbackFormDetailsToParticularTrainee', (req, res) => {   
    SubmitFeedbackFormDetailsToParticularTrainee(req, res);  // Pass to the controller
});


// Route to User(trainee) feedback  questions particular planning with session
router.post('/TraineeFeedbackFormQuestions/info', (req, res) => {
        TraineeGetFeedbackFormDetails(req, res);  // Pass to the controller
});


// Route to User(trainee) feedback  questions particular planning with session
router.post('/TraineeFeedbackFormQuestions/update', (req, res) => {
     TraineeUpdateFeedbackFormDetails(req, res);  // Pass to the controller
});

// Route to GetAllSubmitedOrPendingFeedbackFormDetailsCountToTraine particular planning with session
router.post('/TraineeFeedbackFormQuestions/GetAllSubmitedOrPendingFeedbackFormDetailsCountToTrainee', (req, res) => {
    GetAllSubmitedOrPendingFeedbackFormDetailsCountToTrainee(req, res);  // Pass to the controller
});

// Route to User(trainee)  pending and submit list feedback  questions particular planning with session
router.post('/TraineeFeedbackFormQuestions/GetTraineeFeedbackStatus', (req, res) => {
    GetTraineeFeedbackStatus(req, res);  // Pass to the controller
});

router.post('/FeedbackFormQuestions/closeSessionAfterAttendance', (req, res) => {
  CloseSessionAfterAttendance(req, res);
});
router.post('/FeedbackFormQuestions/getDeadline', (req, res) => {
  GetFeedbackDeadlineForSession(req, res);
});

//--------------------To Trainer --------------------------------//
// Route to assigning feedback  questions  to trainer 
router.post('/FeedbackFormQuestions/assigningToTrainer', (req, res) => {
    AssigningFeedbackFormDetailsToTrainer(req, res);  // Pass to the controller
});

router.post('/FeedbackFormQuestions/InforOfTrainer', (req, res) => {
       GetAllFeedbackFormDetailsToTrainer(req, res);  // Pass to the controller
});

//--------------------To Quiz  --------------------------------//
router.post('/Quiz_QandA_controller/addQuestionPaper', (req, res) => {
   
    addQuestionPaper(req, res);  // Pass to the controller
});

router.post('/Quiz_QandA_controller/updateQuestionPaper', (req, res) => {
    updateQuestionPaper(req, res);  // Pass to the controller
});
router.post('/Quiz_QandA_controller/deleteQuestionPaper', (req, res) => {
   
    deleteQuestionPaper(req, res);  // Pass to the controller
});

router.post('/Quiz_QandA_controller/getQuestionPaperslist', (req, res) => {
    getQuestionPaperslist(req, res);  // Pass to the controller
});

router.post('/Quiz_QandA_controller/AssigningQuizFormDetailsToTrainee', (req, res) => {
   
    AssigningQuizFormDetailsToTrainee(req, res);  // Pass to the controller
});
router.post('/Quiz_QandA_controller/GetAllQuizFormDetailsToTrainee', (req, res) => {
   
    GetAllQuizFormDetailsToTrainee(req, res);  // Pass to the controller
});


router.post('/Quiz_QandA_controller/TraineeUpdateQuizFormDetails', (req, res) => {
   
    TraineeUpdateQuizFormDetails(req, res);  // Pass to the controller
});

router.post('/Quiz_QandA_controller/ValidateQuizForm', (req, res) => {
   
    ValidateQuizForm(req, res);  // Pass to the controller
});

module.exports = router;  // Export the router