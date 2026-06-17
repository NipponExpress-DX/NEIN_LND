const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const {
    RaiseAQuerySendMailToNEINTeam,
    RaiseAQuerySendMailToNEINTeam11,
    sendTrainerNotification,
    sendCoordinatorNotification,
    sendTraineeNotification,
    sendSubCoordinatorNotification,
    sendPlanningPostPoneCreatorNotification,
    sendCertificates,
    getCertificateStatus 

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

// ── NEW: Certificate bulk-upload multer config ──────────────────────────
const certDirname = 'E:/neinSoft/files/Nippon-ET/Certificates';
if (!fs.existsSync(certDirname)) {
  fs.mkdirSync(certDirname, { recursive: true });
}

const certStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(
      certDirname,
      String(req.body.planing_id || 'temp'),
      String(req.body.session_no || '')
    );
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, file.originalname), // must be <trainee_id>.pdf
});

const uploadCertificates = multer({ storage: certStorage });
// ──────────────────────────────────────────────────────────────────────


// RaiseAQuerySendMailToNEINTeam
router.post(
    '/notification/RaiseAQuerySendMailToNEINTeam',
    upload.array("file", 10),
    RaiseAQuerySendMailToNEINTeam
  );
  

router.post('/notification/RaiseAQuerySendMailToNEINTeam11', (req, res) => {
    console.log("RaiseAQuerySendMailToNEINTeam Request Body for get  details :", req.body); 
    RaiseAQuerySendMailToNEINTeam11(req, res);
});


router.post('/notification/sendTrainerNotification', (req, res) => {
    console.log("sendTrainerNotification Request Body for get  details :", req.body); 
    sendTrainerNotification(req, res);
});


router.post('/notification/sendCoordinatorNotification', (req, res) => {
    console.log("sendCoordinatorNotification Request Body for get  details :", req.body); 
    sendCoordinatorNotification(req, res);
});


router.post('/notification/sendSubCoordinatorNotification', (req, res) => {
    console.log("sendSubCoordinatorNotification Request Body for get  details :", req.body); 
    sendSubCoordinatorNotification(req, res);
});


router.post('/notification/sendTraineeNotification', (req, res) => {
    console.log("sendTraineeNotification Request Body for get  details :", req.body); 
    sendTraineeNotification(req, res);
});


router.post('/notification/sendPlanningPostPoneCreatorNotification', (req, res) => {
  console.log("sendPlanningPostPoneCreatorNotification Request Body for get  details :", req.body); 
  sendPlanningPostPoneCreatorNotification(req, res);
});


// ── NEW: sendCertificates route ──────────────────────────────────────────
router.post(
  '/notification/sendCertificates',
  uploadCertificates.array('certificates'),
  (req, res) => {
    console.log("sendCertificates Request Body:", req.body, "Files:", req.files?.length);
    sendCertificates(req, res);
  }
);
// ──────────────────────────────────────────────────────────────────────
router.post('/notification/getCertificateStatus', (req, res) => {
  console.log("getCertificateStatus Request Body:", req.body);
  getCertificateStatus(req, res);
});

module.exports = router;