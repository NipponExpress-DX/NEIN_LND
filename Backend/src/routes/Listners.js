const express = require('express');
const router = express.Router(); // Create the router instance
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const {
    RaiseAQuerySendMailToNEINTeam,
    RaiseAQuerySendMailToNEINTeam11,
    sendTrainerNotification ,
    sendCoordinatorNotification,
    sendTraineeNotification,
    sendSubCoordinatorNotification,
    sendPlanningPostPoneCreatorNotification

    
} = require('../Listners/getEmailContent');
const dirname = 'E:/neinSoft/files/Nippon-ET/Query';

const uploadDir = path.join(dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
  
  const upload = multer({ storage });




// RaiseAQuerySendMailToNEINTeam
router.post(
    '/notification/RaiseAQuerySendMailToNEINTeam',
    upload.array("file", 10), // <-- Put the multer middleware here
    RaiseAQuerySendMailToNEINTeam
  );
  

// RaiseAQuerySendMailToNEINTeam
router.post('/notification/RaiseAQuerySendMailToNEINTeam11', (req, res) => {
    console.log("RaiseAQuerySendMailToNEINTeam Request Body for get  details :", req.body); 

    RaiseAQuerySendMailToNEINTeam11(req, res);
});



// sendTrainerNotification
router.post('/notification/sendTrainerNotification', (req, res) => {
    console.log("sendTrainerNotification Request Body for get  details :", req.body); 

    sendTrainerNotification(req, res);
});



// sendCoordinatorNotification
router.post('/notification/sendCoordinatorNotification', (req, res) => {
    console.log("sendCoordinatorNotification Request Body for get  details :", req.body); 

    sendCoordinatorNotification(req, res);
});


// send sub CoordinatorNotification
router.post('/notification/sendSubCoordinatorNotification', (req, res) => {
    console.log("sendSubCoordinatorNotification Request Body for get  details :", req.body); 

    sendSubCoordinatorNotification(req, res);
});


// sendTraineeNotification
router.post('/notification/sendTraineeNotification', (req, res) => {
  
    console.log("sendTraineeNotification Request Body for get  details :", req.body); 

    sendTraineeNotification(req, res);
});

// sendTraineeNotification
router.post('/notification/sendPlanningPostPoneCreatorNotification', (req, res) => {
  console.log("sendPlanningPostPoneCreatorNotification Request Body for get  details :", req.body); 

  sendPlanningPostPoneCreatorNotification(req, res);
});





module.exports = router;


