const { hrmdb, leavemanagement } = require('../../configuration/db');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const autoSendMail = require('../controllers/planning/sendmail');

// Setup Multer for file uploads
const dirname = 'E:/neinSoft/files/Nippon-LND/Query';
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

const upload = multer({ storage: storage });
exports.upload = upload;

function moveFile(oldPath, newPath) {
  try {
    fs.renameSync(oldPath, newPath);
  } catch (error) {
    console.error("Error moving file:", error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
exports.RaiseAQuerySendMailToNEINTeam = async (req, res) => {
  try {
    if (!req.body.requestData) {
      return res.status(400).json({ error: "Missing requestData" });
    }
 
    const parsedData = JSON.parse(req.body.requestData);
    const { emp_id, YourIssue } = parsedData;
 
    if (!emp_id || !YourIssue) {
      return res.status(400).json({ error: "emp_id and YourIssue are required" });
    }
 
    const finalFolder = "E:/neinSoft/files/Nippon-LND/Query";
    if (!fs.existsSync(finalFolder)) {
      fs.mkdirSync(finalFolder, { recursive: true });
    }
 
    const uploadedFilePaths = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (file && file.path) {
          const newFilePath = path.join(finalFolder, file.filename);
          fs.renameSync(file.path, newFilePath);
          uploadedFilePaths.push(newFilePath);
        }
      });
    }
 
    const attachments = uploadedFilePaths.map((filePath) => ({
      filename: path.basename(filePath),
      path: filePath,
    }));
 
    const getUserDetailsQuery = "SELECT full_name, email FROM user WHERE employee_status = 'yes' AND emp_id = ?";
 
    leavemanagement.query(getUserDetailsQuery, [emp_id], async (err, userDetails) => {
      if (err) return res.status(500).json({ error: "Error fetching user details", details: err });
      if (userDetails.length === 0) return res.status(404).json({ error: "No active user found for the given emp_id." });
 
      const { full_name, email } = userDetails[0];
      const createdDate = new Date().toISOString().split("T")[0];
      const filePathsJson = JSON.stringify(uploadedFilePaths);
 
      const insertChangeRequestQuery = `
        INSERT INTO changerequest (requestType, applicationName, description, craetedID, createdName, createdMail, createDate, status, statusFlag, queryType, fileattachment)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = ["0", "NEIN-LND", YourIssue, emp_id, full_name, email, createdDate, "Raise", 0, 2, filePathsJson];
 
      leavemanagement.query(insertChangeRequestQuery, values, async (err, result) => {
        if (err) return res.status(500).json({ error: "Error inserting into changerequest table", details: err });
 
        const changeRequestId = result.insertId;
        const trackerNumber = `NEIN-DX/${new Date().getFullYear()}/REF-${changeRequestId}`;
        const updateTrackerQuery = "UPDATE changerequest SET trackerNumber = ? WHERE id = ?";
 
        leavemanagement.query(updateTrackerQuery, [trackerNumber, changeRequestId], async (err) => {
          if (err) return res.status(500).json({ error: "Error updating trackerNumber", details: err });
 
          const emailBody = `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <title>Query Submitted - ${trackerNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6fb;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6fb;">
  <tr><td align="center" style="padding:28px 12px;background-color:#f4f6fb;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:1px solid #dde0e8;">
 
      <!-- TOP STRIPE -->
      <tr><td style="padding:0;background-color:#ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="background-color:#8EC400;height:6px;font-size:0;">&nbsp;</td>
            <td width="50%" style="background-color:#1A005D;height:6px;font-size:0;">&nbsp;</td>
          </tr>
        </table>
      </td></tr>
 
      <!-- HEADER -->
      <tr><td style="background-color:#ffffff;padding:36px 40px 28px;text-align:center;">
        <p style="margin:0 0 14px 0;font-size:40px;line-height:1;">&#128221;</p>
        <p style="margin:0 0 8px 0;font-family:Arial,sans-serif;font-size:26px;font-weight:bold;color:#1A005D;line-height:1.25;">Query Submitted Successfully!</p>
        <p style="margin:0 0 20px 0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.5;">NEIN DX Support &mdash; <b style="color:#8EC400;">Tracking ID: ${trackerNumber}</b></p>
      </td></tr>
 
      <!-- DIVIDER -->
      <tr><td style="background-color:#ffffff;padding:0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="background-color:#e8ebf0;height:1px;font-size:0;">&nbsp;</td></tr>
        </table>
      </td></tr>
 
      <!-- BODY -->
      <tr><td style="background-color:#ffffff;padding:28px 40px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
 
          <!-- Greeting -->
          <tr><td style="padding-bottom:20px;">
            <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:15px;color:#222222;line-height:1.7;">Dear <b style="color:#1A005D;">${full_name},</b></p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.8;">Thank you for reaching out to the NEIN DX Support Team. Your query has been <b style="color:#1A005D;">successfully submitted</b> and our team will respond as soon as possible.</p>
          </td></tr>
 
          <!-- QUERY DETAILS TABLE -->
          <tr><td style="padding-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
              <tr><td colspan="2" style="background-color:#8EC400;padding:10px 16px;">
                <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#1A005D;text-transform:uppercase;letter-spacing:1px;">&#128203; Query Details</span>
              </td></tr>
              <tr>
                <td width="36%" style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128273; Tracking ID</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#8EC400;">${trackerNumber}</span></td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128187; Application</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#222222;">NEIN-L&amp;D</span></td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128197; Submitted On</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#222222;">${createdDate}</span></td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128172; Description</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#444444;line-height:1.6;">${YourIssue}</span></td>
              </tr>
            </table>
          </td></tr>
 
          <!-- WHAT HAPPENS NEXT -->
          <tr><td style="padding-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
              <tr><td style="background-color:#f7f8ff;padding:10px 16px;border-bottom:1px solid #eaecf4;">
                <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#1A005D;text-transform:uppercase;letter-spacing:1px;">&#10024; What Happens Next?</span>
              </td></tr>
              <tr><td style="background-color:#ffffff;padding:16px 18px;">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="28" valign="top" style="font-size:16px;padding:4px 0;">&#128269;</td>
                    <td style="font-family:Arial,sans-serif;font-size:13px;color:#444444;padding:4px 0;line-height:1.6;">Our team will review your query and analyse the issue</td>
                  </tr>
                  <tr>
                    <td valign="top" style="font-size:16px;padding:4px 0;">&#9201;</td>
                    <td style="font-family:Arial,sans-serif;font-size:13px;color:#444444;padding:4px 0;line-height:1.6;">You will receive a response within the expected resolution time</td>
                  </tr>
                  <tr>
                    <td valign="top" style="font-size:16px;padding:4px 0;">&#128231;</td>
                    <td style="font-family:Arial,sans-serif;font-size:13px;color:#444444;padding:4px 0;line-height:1.6;">Updates will be communicated via email to <b>${email}</b></td>
                  </tr>
                  <tr>
                    <td valign="top" style="font-size:16px;padding:4px 0;">&#128222;</td>
                    <td style="font-family:Arial,sans-serif;font-size:13px;color:#444444;padding:4px 0;line-height:1.6;">For urgent matters, contact us at <b>neinsoft.support@nipponexpress.com</b></td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </td></tr>
 
          <!-- CTA BUTTON -->
          <tr><td align="center" style="padding-bottom:28px;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
              href="https://neinsoft.nittsu.co.in:8185/NEIN/"
              style="height:46px;v-text-anchor:middle;width:230px;" arcsize="0%"
              fillcolor="#1A005D" strokecolor="#1A005D">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">Login to Application</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="https://neinsoft.nittsu.co.in:8185/NEIN/"
               style="display:inline-block;padding:14px 40px;background-color:#1A005D;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;border:2px solid #1A005D;">
              &#128273; Login to Application
            </a>
            <!--<![endif]-->
          </td></tr>
 
        </table>
      </td></tr>
 
      <!-- FOOTER -->
      <tr><td style="background-color:#f4f6fb;padding:22px 40px;text-align:center;border-top:3px solid #8EC400;">
        <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">Nippon Express (India) Private Limited</p>
        <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:11px;color:#888888;">NEIN DX Support Team</p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#aaaaaa;line-height:1.6;">
          This is a system-generated email. Please do not reply.<br>
          For support: <a href="mailto:neinsoft.support@nipponexpress.com" style="color:#5A8A00;text-decoration:none;font-weight:bold;">neinsoft.support@nipponexpress.com</a>
        </p>
      </td></tr>
 
      <!-- BOTTOM STRIPE -->
      <tr><td style="padding:0;background-color:#ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="background-color:#1A005D;height:6px;font-size:0;">&nbsp;</td>
            <td width="50%" style="background-color:#8EC400;height:6px;font-size:0;">&nbsp;</td>
          </tr>
        </table>
      </td></tr>
 
    </table>
  </td></tr>
</table>
</body>
</html>`;
 
          const emailSubject = `NEIN - DX Support Query - ${trackerNumber}`;
 
          try {
            await autoSendMail("", email, "bandarla.rajesh@nipponexpress.com", emailBody, emailSubject, attachments);
            uploadedFilePaths.forEach((filePath) => {
              try { fs.unlinkSync(filePath); } catch (err) { console.error(`Error deleting file: ${filePath}`, err); }
            });
            return res.status(200).json({ message: "Query submitted successfully.", trackingId: trackerNumber });
          } catch (error) {
            console.error("Error sending email:", error);
            return res.status(500).json({ error: "Error sending email", details: error });
          }
        });
      });
    });
  } catch (parseError) {
    console.error("Error parsing requestData:", parseError);
    return res.status(400).json({ error: "Invalid requestData format" });
  }
};
 

// ─────────────────────────────────────────────────────────────────────────────
// sendTrainerNotification — modern Outlook-safe branded email
// ─────────────────────────────────────────────────────────────────────────────
exports.sendTrainerNotification = async (req, res) => {
  const { planing_id, session_no } = req.body;

  if (!planing_id || !session_no) {
    return res.status(400).json({ error: "Missing required fields: planing_id and session_no are required." });
  }

  const getTrainingDetailsQuery = `
    SELECT
      pt.training_topic_id,
      pt.planning_date,
      pt.planning_type,
      pt.user_name as coordinator_name,
      pt.user_email as coordinator_email,
      ps.trainer_name,
      ps.trainer_email,
      ps.session_date,
      TIME_FORMAT(ps.from_time, '%H:%i') AS from_time,
      TIME_FORMAT(ps.to_time, '%H:%i') AS to_time,
      ps.mode_of_training
    FROM planning_training_table pt
    JOIN planing_mapping_coordinator pmc ON pt.id = pmc.planing_id
    JOIN planing_sessions ps ON pt.id = ps.planing_id
    WHERE pt.id = ? AND ps.session_no = ? AND ps.calDeleteStatus = 0
    GROUP BY pt.training_topic_id`;

  hrmdb.query(getTrainingDetailsQuery, [planing_id, session_no], async (err, trainingDetails) => {
    if (err) return res.status(500).json({ error: "Error fetching training details", details: err });
    if (trainingDetails.length === 0) return res.status(404).json({ error: 'No training details found.' });

    const {
      training_topic_id, coordinator_name, coordinator_email,
      trainer_name, trainer_email, session_date, from_time, to_time, mode_of_training
    } = trainingDetails[0];

    hrmdb.query(`SELECT training_topic FROM training_topic WHERE id = ?`, [training_topic_id], async (err, topicResult) => {
      if (err) return res.status(500).json({ error: "Error fetching training topic", details: err });
      if (topicResult.length === 0) return res.status(404).json({ error: 'No training topic found.' });

      const training_topic = topicResult[0].training_topic;
      const isVirtual = mode_of_training === 'Virtual';

      const formattedDate = new Date(session_date).toLocaleDateString('en-IN', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
      });

      const emailBody = `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <title>Trainer Assignment - ${training_topic}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6fb;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6fb;">
  <tr><td align="center" style="padding:28px 12px;background-color:#f4f6fb;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:1px solid #dde0e8;">

      <!-- TOP STRIPE -->
      <tr><td style="padding:0;background-color:#ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="background-color:#8EC400;height:6px;font-size:0;">&nbsp;</td>
            <td width="50%" style="background-color:#1A005D;height:6px;font-size:0;">&nbsp;</td>
          </tr>
        </table>
      </td></tr>

      <!-- HEADER -->
      <tr><td style="background-color:#ffffff;padding:36px 40px 28px;text-align:center;">
        <p style="margin:0 0 14px 0;font-size:40px;line-height:1;">&#127941;</p>
        <p style="margin:0 0 8px 0;font-family:Arial,sans-serif;font-size:26px;font-weight:bold;color:#1A005D;line-height:1.25;">You've Been Selected as Trainer!</p>
        <p style="margin:0 0 20px 0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.5;">Training Session Assignment &mdash; <b style="color:#8EC400;">${training_topic}</b></p>
      </td></tr>

      <!-- DIVIDER -->
      <tr><td style="background-color:#ffffff;padding:0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="background-color:#e8ebf0;height:1px;font-size:0;">&nbsp;</td></tr>
        </table>
      </td></tr>

      <!-- BODY -->
      <tr><td style="background-color:#ffffff;padding:28px 40px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">

          <!-- Greeting -->
          <tr><td style="padding-bottom:20px;">
            <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:15px;color:#222222;line-height:1.7;">Dear <b style="color:#1A005D;">${trainer_name},</b></p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.8;">We are pleased to inform you that you have been <b style="color:#1A005D;">selected as the Trainer</b> for the upcoming training session. Please find the session details below and mark your calendar!</p>
          </td></tr>

          <!-- SESSION DETAILS TABLE -->
          <tr><td style="padding-bottom:20px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
              <tr><td colspan="2" style="background-color:#8EC400;padding:10px 16px;">
                <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#1A005D;text-transform:uppercase;letter-spacing:1px;">&#128203; Training Session Details</span>
              </td></tr>
              <tr>
                <td width="36%" style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#127919; Topic</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#222222;">${training_topic}</span></td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128197; Date</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#222222;">${formattedDate}</span></td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128336; Time</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#222222;">${from_time} &mdash; ${to_time}</span></td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">${isVirtual ? '&#128187;' : '&#127979;'} Mode</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;">
                  <table cellpadding="0" cellspacing="0" border="0"><tr>
                    <td style="background-color:${isVirtual ? '#005BAC' : '#5A8A00'};padding:4px 16px;">
                      <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">${mode_of_training}</span>
                    </td>
                  </tr></table>
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- TRAINER RESPONSIBILITY BLOCK -->
          <tr><td style="padding-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
              <tr><td style="background-color:#f7f8ff;padding:10px 16px;border-bottom:1px solid #eaecf4;">
                <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#1A005D;text-transform:uppercase;letter-spacing:1px;">&#10024; Your Responsibilities as Trainer</span>
              </td></tr>
              <tr><td style="background-color:#ffffff;padding:16px 18px;">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="28" valign="top" style="font-size:16px;padding:4px 0;">&#128218;</td>
                    <td style="font-family:Arial,sans-serif;font-size:13px;color:#444444;padding:4px 0;line-height:1.6;">Prepare training material and content in advance</td>
                  </tr>
                  <tr>
                    <td valign="top" style="font-size:16px;padding:4px 0;">&#128101;</td>
                    <td style="font-family:Arial,sans-serif;font-size:13px;color:#444444;padding:4px 0;line-height:1.6;">Engage all participants with interactive discussion</td>
                  </tr>
                  <tr>
                    <td valign="top" style="font-size:16px;padding:4px 0;">&#128202;</td>
                    <td style="font-family:Arial,sans-serif;font-size:13px;color:#444444;padding:4px 0;line-height:1.6;">Ensure key learning outcomes are clearly communicated</td>
                  </tr>
                  <tr>
                    <td valign="top" style="font-size:16px;padding:4px 0;">&#128276;</td>
                    <td style="font-family:Arial,sans-serif;font-size:13px;color:#444444;padding:4px 0;line-height:1.6;">Confirm attendance and report post-session feedback</td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </td></tr>

          <!-- CTA BUTTON -->
          <tr><td align="center" style="padding-bottom:28px;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
              href="https://neinsoft.nittsu.co.in:8185/NEIN/"
              style="height:46px;v-text-anchor:middle;width:230px;" arcsize="0%"
              fillcolor="#1A005D" strokecolor="#1A005D">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">Login to Application</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="https://neinsoft.nittsu.co.in:8185/NEIN/"
               style="display:inline-block;padding:14px 40px;background-color:#1A005D;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;border:2px solid #1A005D;">
              &#128273; Login to Application
            </a>
            <!--<![endif]-->
          </td></tr>

          <!-- CONTACT STRIP -->
          <tr><td>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #dde0e8;">
              <tr>
                <td width="5" style="background-color:#8EC400;font-size:0;">&nbsp;</td>
                <td style="background-color:#f7f8ff;padding:14px 18px;">
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#555555;line-height:1.7;">
                    For queries, reach out to your coordinator:<br>
                    <b style="color:#1A005D;">${coordinator_name}</b> &mdash;
                    <a href="mailto:${coordinator_email}" style="color:#1A005D;font-weight:bold;text-decoration:none;">${coordinator_email}</a>
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>

        </table>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background-color:#f4f6fb;padding:22px 40px;text-align:center;border-top:3px solid #8EC400;">
        <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">Nippon Express (India) Private Limited</p>
        <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:11px;color:#888888;">L&amp;D &mdash; Learning &amp; Development</p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#aaaaaa;line-height:1.6;">
          This is a system-generated email. Please do not reply.<br>
          For support: <a href="mailto:neinsoft.support@nipponexpress.com" style="color:#5A8A00;text-decoration:none;font-weight:bold;">neinsoft.support@nipponexpress.com</a>
        </p>
      </td></tr>

      <!-- BOTTOM STRIPE -->
      <tr><td style="padding:0;background-color:#ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="background-color:#1A005D;height:6px;font-size:0;">&nbsp;</td>
            <td width="50%" style="background-color:#8EC400;height:6px;font-size:0;">&nbsp;</td>
          </tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

      try {
        await autoSendMail('noreply.nein@nipponexpress.com', trainer_email, '', emailBody, `NEIN L&D | Trainer Assignment: ${training_topic} | ${formattedDate}`);
        return res.status(200).json({ message: 'Trainer notification sent successfully.' });
      } catch (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ error: "Error sending email", details: error });
      }
    });
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// sendCoordinatorNotification — modern Outlook-safe branded email
// ─────────────────────────────────────────────────────────────────────────────
exports.sendCoordinatorNotification = async (req, res) => {
  const { planing_id } = req.body;

  if (!planing_id) {
    return res.status(400).json({ error: "Missing required field: planing_id is required." });
  }

  try {
    const [coordinators] = await hrmdb.promise().query(`
      SELECT DISTINCT coordinator_emp_id, coordinator_name, coordinator_email, session_no
      FROM planing_mapping_coordinator
      WHERE planing_id = ? AND mail_sending_status = 0
    `, [planing_id]);

    if (!coordinators.length) {
      return res.status(404).json({ error: "No coordinators found for the given planing_id." });
    }

    const [trainingDetails] = await hrmdb.promise().query(`
      SELECT pt.training_topic_id, pt.user_name, pt.user_email,
             ps.session_no, ps.session_date,
             TIME_FORMAT(ps.from_time, '%H:%i') AS from_time,
             TIME_FORMAT(ps.to_time, '%H:%i') AS to_time,
             ps.mode_of_training, ps.trainer_name
      FROM planning_training_table pt
      JOIN planing_sessions ps ON pt.id = ps.planing_id
      WHERE pt.id = ?
    `, [planing_id]);

    if (!trainingDetails.length) {
      return res.status(404).json({ error: "No training details found for the given planing_id." });
    }

    const [[topicRow]] = await hrmdb.promise().query(`SELECT training_topic FROM training_topic WHERE id = ?`, [trainingDetails[0].training_topic_id]);
    const training_topic = topicRow.training_topic;

    for (const coordinator of coordinators) {
      const { coordinator_name, coordinator_email, coordinator_emp_id, session_no } = coordinator;
      const session = trainingDetails.find(td => Number(td.session_no) === Number(session_no));
      if (!session) continue;

      const { trainer_name, user_name, user_email, session_date, from_time, to_time, mode_of_training } = session;
      const isVirtual = mode_of_training === 'Virtual';

      const formattedDate = new Date(session_date).toLocaleDateString('en-IN', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
      });

      const [branchDetails] = await hrmdb.promise().query(`
        SELECT session_no, branch, department, apprx_trainee_count
        FROM planing_mapping_coordinator
        WHERE coordinator_emp_id = ? AND planing_id = ? AND session_no = ?
      `, [coordinator_emp_id, planing_id, session_no]);

      let totalTrainees = 0;
      let branchTableRows = branchDetails.map((branch, index) => {
        totalTrainees += branch.apprx_trainee_count;
        return `
          <tr>
            <td style="padding:10px 14px;text-align:center;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;color:#555555;background-color:#ffffff;">${index + 1}</td>
            <td style="padding:10px 14px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;color:#222222;background-color:#ffffff;">${branch.session_no}</td>
            <td style="padding:10px 14px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;color:#222222;background-color:#ffffff;">${branch.branch}</td>
            <td style="padding:10px 14px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;color:#222222;background-color:#ffffff;">${branch.department}</td>
            <td style="padding:10px 14px;text-align:center;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;background-color:#ffffff;">${branch.apprx_trainee_count}</td>
          </tr>`;
      }).join('');

      if (!branchTableRows) {
        branchTableRows = `<tr><td colspan="5" style="padding:14px;text-align:center;font-family:Arial,sans-serif;font-size:13px;color:#888888;border-top:1px solid #eaecf4;">No branch details available.</td></tr>`;
      }

      // Total row
      branchTableRows += `
        <tr>
          <td colspan="4" style="padding:10px 14px;text-align:right;border-top:2px solid #1A005D;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;background-color:#f7f8ff;">Total Trainees:</td>
          <td style="padding:10px 14px;text-align:center;border-top:2px solid #1A005D;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;background-color:#1A005D;">${totalTrainees}</td>
        </tr>`;

      const emailBody = `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <title>Coordinator Assignment - ${training_topic}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6fb;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6fb;">
  <tr><td align="center" style="padding:28px 12px;background-color:#f4f6fb;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:1px solid #dde0e8;">

      <!-- TOP STRIPE -->
      <tr><td style="padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="background-color:#8EC400;height:6px;font-size:0;">&nbsp;</td>
            <td width="50%" style="background-color:#1A005D;height:6px;font-size:0;">&nbsp;</td>
          </tr>
        </table>
      </td></tr>

      <!-- HEADER -->
      <tr><td style="background-color:#ffffff;padding:36px 40px 28px;text-align:center;">
        <p style="margin:0 0 14px 0;font-size:40px;line-height:1;">&#128203;</p>
        <p style="margin:0 0 8px 0;font-family:Arial,sans-serif;font-size:26px;font-weight:bold;color:#1A005D;line-height:1.25;">Coordination Assignment!</p>
        <p style="margin:0 0 20px 0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.5;">Trainee Collection Assignment &mdash; <b style="color:#8EC400;">${training_topic}</b></p>
      </td></tr>

      <!-- DIVIDER -->
      <tr><td style="background-color:#ffffff;padding:0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="background-color:#e8ebf0;height:1px;font-size:0;">&nbsp;</td></tr>
        </table>
      </td></tr>

      <!-- BODY -->
      <tr><td style="background-color:#ffffff;padding:28px 40px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">

          <!-- Greeting -->
          <tr><td style="padding-bottom:20px;">
            <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:15px;color:#222222;line-height:1.7;">Dear <b style="color:#1A005D;">${coordinator_name},</b></p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.8;">We are pleased to inform you that <b style="color:#1A005D;">${user_name}</b> has selected you to <b style="color:#1A005D;">coordinate the trainee collection</b> for the upcoming training session. Please find the details below.</p>
          </td></tr>

          <!-- SESSION DETAILS TABLE -->
          <tr><td style="padding-bottom:20px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
              <tr><td colspan="2" style="background-color:#8EC400;padding:10px 16px;">
                <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#1A005D;text-transform:uppercase;letter-spacing:1px;">&#128203; Training Session Details</span>
              </td></tr>
              <tr>
                <td width="36%" style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#127919; Topic</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#222222;">${training_topic}</span></td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128366; Session No</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#222222;">${session_no}</span></td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128197; Date</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#222222;">${formattedDate}</span></td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128336; Time</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#222222;">${from_time} &mdash; ${to_time}</span></td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">${isVirtual ? '&#128187;' : '&#127979;'} Mode</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;">
                  <table cellpadding="0" cellspacing="0" border="0"><tr>
                    <td style="background-color:${isVirtual ? '#005BAC' : '#5A8A00'};padding:4px 16px;">
                      <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">${mode_of_training}</span>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#127941; Trainer</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#222222;">${trainer_name}</span></td>
              </tr>
            </table>
          </td></tr>

          <!-- BRANCH / DEPARTMENT TABLE -->
          <tr><td style="padding-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
              <tr><td colspan="5" style="background-color:#1A005D;padding:10px 16px;">
                <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">&#128101; Branch &amp; Department Allocation</span>
              </td></tr>
              <tr>
                <td style="background-color:#2a1070;padding:9px 14px;text-align:center;"><span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">Sr.No</span></td>
                <td style="background-color:#2a1070;padding:9px 14px;"><span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">Session No</span></td>
                <td style="background-color:#2a1070;padding:9px 14px;"><span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">Branch</span></td>
                <td style="background-color:#2a1070;padding:9px 14px;"><span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">Department</span></td>
                <td style="background-color:#2a1070;padding:9px 14px;text-align:center;"><span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">Trainee Count</span></td>
              </tr>
              ${branchTableRows}
            </table>
          </td></tr>

          <!-- CTA BUTTON -->
          <tr><td align="center" style="padding-bottom:28px;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
              href="https://neinsoft.nittsu.co.in:8185/NEIN/"
              style="height:46px;v-text-anchor:middle;width:230px;" arcsize="0%"
              fillcolor="#1A005D" strokecolor="#1A005D">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">Login to Application</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="https://neinsoft.nittsu.co.in:8185/NEIN/"
               style="display:inline-block;padding:14px 40px;background-color:#1A005D;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;border:2px solid #1A005D;">
              &#128273; Login to Application
            </a>
            <!--<![endif]-->
          </td></tr>

          <!-- CONTACT STRIP -->
          <tr><td>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #dde0e8;">
              <tr>
                <td width="5" style="background-color:#8EC400;font-size:0;">&nbsp;</td>
                <td style="background-color:#f7f8ff;padding:14px 18px;">
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#555555;line-height:1.7;">
                    For queries, reach out to the planner:<br>
                    <b style="color:#1A005D;">${user_name}</b> &mdash;
                    <a href="mailto:${user_email}" style="color:#1A005D;font-weight:bold;text-decoration:none;">${user_email}</a>
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>

        </table>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background-color:#f4f6fb;padding:22px 40px;text-align:center;border-top:3px solid #8EC400;">
        <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">Nippon Express (India) Private Limited</p>
        <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:11px;color:#888888;">L&amp;D &mdash; Learning &amp; Development</p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#aaaaaa;line-height:1.6;">
          This is a system-generated email. Please do not reply.<br>
          For support: <a href="mailto:neinsoft.support@nipponexpress.com" style="color:#5A8A00;text-decoration:none;font-weight:bold;">neinsoft.support@nipponexpress.com</a>
        </p>
      </td></tr>

      <!-- BOTTOM STRIPE -->
      <tr><td style="padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="background-color:#1A005D;height:6px;font-size:0;">&nbsp;</td>
            <td width="50%" style="background-color:#8EC400;height:6px;font-size:0;">&nbsp;</td>
          </tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

      await autoSendMail('', coordinator_email, '', emailBody, `NEIN L&D | Coordination Assignment: ${training_topic} | ${formattedDate}`);
      await hrmdb.promise().query(`
        UPDATE planing_mapping_coordinator SET mail_sending_status = 1
        WHERE planing_id = ? AND coordinator_emp_id = ? AND session_no = ?
      `, [planing_id, coordinator_emp_id, session_no]);
    }

    return res.status(200).json({ message: "Coordinator notifications sent successfully." });
  } catch (error) {
    console.error("Coordinator notification error:", error);
    return res.status(500).json({ error: "Failed to send coordinator notifications" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
exports.sendSubCoordinatorNotification = async (req, res) => {
  const { planing_id, session_no, coordinator_emp_id } = req.body;

  if (!planing_id || !session_no || !coordinator_emp_id) {
    return res.status(400).json({ error: "Missing required fields: planing_id, session_no, and coordinator_emp_id are required." });
  }

  hrmdb.query(
    `SELECT DISTINCT sub_coordinator_name, sub_coordinator_email, coordinator_name, coordinator_email
     FROM planing_mapping_sub_coordinator
     WHERE planing_id = ? AND session_no = ? AND coordinator_emp_id = ?`,
    [planing_id, session_no, coordinator_emp_id],
    async (err, coordinators) => {
      if (err) return res.status(500).json({ error: "Error fetching coordinators", details: err });
      if (coordinators.length === 0) return res.status(404).json({ error: "No sub-coordinators found." });

      hrmdb.query(
        `SELECT pt.training_topic_id, ps.session_no, ps.session_date,
                TIME_FORMAT(ps.from_time, '%H:%i') AS from_time,
                TIME_FORMAT(ps.to_time, '%H:%i') AS to_time, ps.mode_of_training
         FROM planning_training_table pt
         JOIN planing_sessions ps ON pt.id = ps.planing_id
         WHERE pt.id = ?`,
        [planing_id],
        async (err, trainingDetails) => {
          if (err) return res.status(500).json({ error: "Error fetching training details", details: err });
          if (trainingDetails.length === 0) return res.status(404).json({ error: "No training details found." });

          const { training_topic_id, session_date, from_time, to_time, mode_of_training } = trainingDetails[0];

          hrmdb.query(`SELECT training_topic FROM training_topic WHERE id = ?`, [training_topic_id], async (err, topicResult) => {
            if (err) return res.status(500).json({ error: "Error fetching training topic", details: err });
            if (topicResult.length === 0) return res.status(404).json({ error: "No training topic found." });

            const training_topic = topicResult[0].training_topic;
            const isVirtual = mode_of_training === 'Virtual';
            const formattedDate = new Date(session_date).toLocaleDateString('en-IN', {
              weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
            });

            for (const coordinator of coordinators) {
              const { sub_coordinator_name, sub_coordinator_email, coordinator_name, coordinator_email } = coordinator;

              hrmdb.query(
                `SELECT session_no, branch, department, apprx_trainee_count
                 FROM planing_mapping_sub_coordinator
                 WHERE planing_id = ? AND session_no = ?`,
                [planing_id, session_no],
                async (err, branchDetails) => {
                  if (err) return;

                  let totalTrainees = 0;
                  let branchTableRows = branchDetails.map((branch, index) => {
                    totalTrainees += branch.apprx_trainee_count;
                    return `
                      <tr>
                        <td style="padding:10px 14px;text-align:center;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;color:#555555;background-color:#ffffff;">${index + 1}</td>
                        <td style="padding:10px 14px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;color:#222222;background-color:#ffffff;">${branch.session_no}</td>
                        <td style="padding:10px 14px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;color:#222222;background-color:#ffffff;">${branch.branch}</td>
                        <td style="padding:10px 14px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;color:#222222;background-color:#ffffff;">${branch.department}</td>
                        <td style="padding:10px 14px;text-align:center;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;background-color:#ffffff;">${branch.apprx_trainee_count}</td>
                      </tr>`;
                  }).join('');

                  if (!branchTableRows) {
                    branchTableRows = `<tr><td colspan="5" style="padding:14px;text-align:center;font-family:Arial,sans-serif;font-size:13px;color:#888888;border-top:1px solid #eaecf4;">No branch details available.</td></tr>`;
                  }
                  branchTableRows += `
                    <tr>
                      <td colspan="4" style="padding:10px 14px;text-align:right;border-top:2px solid #1A005D;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;background-color:#f7f8ff;">Total Trainees:</td>
                      <td style="padding:10px 14px;text-align:center;border-top:2px solid #1A005D;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;background-color:#1A005D;">${totalTrainees}</td>
                    </tr>`;

                  const emailBody = `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <title>Sub-Coordinator Assignment - ${training_topic}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6fb;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6fb;">
  <tr><td align="center" style="padding:28px 12px;background-color:#f4f6fb;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:1px solid #dde0e8;">

      <!-- TOP STRIPE -->
      <tr><td style="padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="background-color:#8EC400;height:6px;font-size:0;">&nbsp;</td>
            <td width="50%" style="background-color:#1A005D;height:6px;font-size:0;">&nbsp;</td>
          </tr>
        </table>
      </td></tr>

      <!-- HEADER -->
      <tr><td style="background-color:#ffffff;padding:36px 40px 28px;text-align:center;">
        <p style="margin:0 0 14px 0;font-size:40px;line-height:1;">&#128101;</p>
        <p style="margin:0 0 8px 0;font-family:Arial,sans-serif;font-size:26px;font-weight:bold;color:#1A005D;line-height:1.25;">Sub-Coordinator Assignment!</p>
        <p style="margin:0 0 20px 0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.5;">Trainee Collection Assignment &mdash; <b style="color:#8EC400;">${training_topic}</b></p>
      </td></tr>

      <!-- DIVIDER -->
      <tr><td style="background-color:#ffffff;padding:0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="background-color:#e8ebf0;height:1px;font-size:0;">&nbsp;</td></tr>
        </table>
      </td></tr>

      <!-- BODY -->
      <tr><td style="background-color:#ffffff;padding:28px 40px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">

          <!-- Greeting -->
          <tr><td style="padding-bottom:20px;">
            <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:15px;color:#222222;line-height:1.7;">Dear <b style="color:#1A005D;">${sub_coordinator_name},</b></p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.8;">We are pleased to inform you that <b style="color:#1A005D;">${coordinator_name}</b> has selected you to <b style="color:#1A005D;">sub-coordinate the trainee collection</b> for the upcoming training session. Please find the details below.</p>
          </td></tr>

          <!-- SESSION DETAILS TABLE -->
          <tr><td style="padding-bottom:20px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
              <tr><td colspan="2" style="background-color:#8EC400;padding:10px 16px;">
                <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#1A005D;text-transform:uppercase;letter-spacing:1px;">&#128203; Training Session Details</span>
              </td></tr>
              <tr>
                <td width="36%" style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#127919; Topic</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#222222;">${training_topic}</span></td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128197; Date</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#222222;">${formattedDate}</span></td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128336; Time</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#222222;">${from_time} &mdash; ${to_time}</span></td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">${isVirtual ? '&#128187;' : '&#127979;'} Mode</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;">
                  <table cellpadding="0" cellspacing="0" border="0"><tr>
                    <td style="background-color:${isVirtual ? '#005BAC' : '#5A8A00'};padding:4px 16px;">
                      <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">${mode_of_training}</span>
                    </td>
                  </tr></table>
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- BRANCH TABLE -->
          <tr><td style="padding-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
              <tr><td colspan="5" style="background-color:#1A005D;padding:10px 16px;">
                <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">&#128101; Branch &amp; Department Allocation</span>
              </td></tr>
              <tr>
                <td style="background-color:#2a1070;padding:9px 14px;text-align:center;"><span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">Sr.No</span></td>
                <td style="background-color:#2a1070;padding:9px 14px;"><span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">Session No</span></td>
                <td style="background-color:#2a1070;padding:9px 14px;"><span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">Branch</span></td>
                <td style="background-color:#2a1070;padding:9px 14px;"><span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">Department</span></td>
                <td style="background-color:#2a1070;padding:9px 14px;text-align:center;"><span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">Tentative Count</span></td>
              </tr>
              ${branchTableRows}
            </table>
          </td></tr>

          <!-- CTA BUTTON -->
          <tr><td align="center" style="padding-bottom:28px;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
              href="https://neinsoft.nittsu.co.in:8185/NEIN/"
              style="height:46px;v-text-anchor:middle;width:230px;" arcsize="0%"
              fillcolor="#1A005D" strokecolor="#1A005D">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">Login to Application</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="https://neinsoft.nittsu.co.in:8185/NEIN/"
               style="display:inline-block;padding:14px 40px;background-color:#1A005D;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;border:2px solid #1A005D;">
              &#128273; Login to Application
            </a>
            <!--<![endif]-->
          </td></tr>

          <!-- CONTACT STRIP -->
          <tr><td>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #dde0e8;">
              <tr>
                <td width="5" style="background-color:#8EC400;font-size:0;">&nbsp;</td>
                <td style="background-color:#f7f8ff;padding:14px 18px;">
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#555555;line-height:1.7;">
                    For queries, reach out to your coordinator:<br>
                    <b style="color:#1A005D;">${coordinator_name}</b> &mdash;
                    <a href="mailto:${coordinator_email}" style="color:#1A005D;font-weight:bold;text-decoration:none;">${coordinator_email}</a>
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>

        </table>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background-color:#f4f6fb;padding:22px 40px;text-align:center;border-top:3px solid #8EC400;">
        <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">Nippon Express (India) Private Limited</p>
        <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:11px;color:#888888;">L&amp;D &mdash; Learning &amp; Development</p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#aaaaaa;line-height:1.6;">
          This is a system-generated email. Please do not reply.<br>
          For support: <a href="mailto:neinsoft.support@nipponexpress.com" style="color:#5A8A00;text-decoration:none;font-weight:bold;">neinsoft.support@nipponexpress.com</a>
        </p>
      </td></tr>

      <!-- BOTTOM STRIPE -->
      <tr><td style="padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="background-color:#1A005D;height:6px;font-size:0;">&nbsp;</td>
            <td width="50%" style="background-color:#8EC400;height:6px;font-size:0;">&nbsp;</td>
          </tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

                  try {
                    await autoSendMail('', sub_coordinator_email, '', emailBody, `NEIN L&D | Sub-Coordinator Assignment: ${training_topic} | ${formattedDate}`);
                  } catch (error) {
                    console.error("Error sending email to:", sub_coordinator_email, error);
                  }
                }
              );
            }

            return res.status(200).json({ message: 'Sub-Coordinator notifications sent successfully.' });
          });
        }
      );
    }
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// sendTraineeNotification
// ─────────────────────────────────────────────────────────────────────────────
exports.sendTraineeNotification = async (req, res) => {
  console.log('🚀 sendTraineeNotification CALLED with:', JSON.stringify({
    planing_id: req.body.planing_id,
    session_no: req.body.session_no,
    has_trainee_map: !!req.body.trainee_id_name_and_mail,
    trainee_map_count: req.body.trainee_id_name_and_mail
      ? Object.keys(req.body.trainee_id_name_and_mail).length
      : 0,
  }, null, 2));
 
  const {
    planing_id,
    session_no,
    new_trainee_ids,
    trainee_id_name_and_mail,
    customMessage,
    venueDetails,
  } = req.body;
 
  if (!planing_id || !session_no) {
    return res.status(400).json({ error: "Missing required fields: planing_id and session_no are required." });
  }
 
  try {
    // ── 1. Fetch training details ──────────────────────────────────────────────
    const [trainingDetails] = await hrmdb.promise().query(`
      SELECT
        pt.training_topic_id,
        pmc.coordinator_name,
        pmc.coordinator_email,
        ps.session_date,
        TIME_FORMAT(ps.from_time, '%H:%i') AS from_time,
        TIME_FORMAT(ps.to_time, '%H:%i') AS to_time,
        ps.mode_of_training,
        tt.training_topic
      FROM planning_training_table pt
      JOIN planing_sessions ps ON pt.id = ps.planing_id AND ps.session_no = ?
      LEFT JOIN planing_mapping_coordinator pmc ON pt.id = pmc.planing_id AND pmc.session_no = ps.session_no
      JOIN training_topic tt ON pt.training_topic_id = tt.id
      WHERE pt.id = ?
      LIMIT 1
    `, [session_no, planing_id]);
 
    if (!trainingDetails || trainingDetails.length === 0) {
      return res.status(404).json({ error: 'No training details found.' });
    }
 
    const {
      coordinator_name,
      coordinator_email,
      session_date,
      from_time,
      to_time,
      mode_of_training,
      training_topic,
    } = trainingDetails[0];
 
    // ── 2. Resolve trainee list ────────────────────────────────────────────────
    let traineesToNotify = [];
 
    if (
      trainee_id_name_and_mail &&
      typeof trainee_id_name_and_mail === 'object' &&
      Object.keys(trainee_id_name_and_mail).length > 0
    ) {
      traineesToNotify = Object.entries(trainee_id_name_and_mail)
        .map(([, details]) => ({
          trainee_name: Array.isArray(details) ? (details[0] || '') : '',
          trainee_mail: Array.isArray(details) ? (details[1] || '') : '',
        }))
        .filter(
          t =>
            t.trainee_mail &&
            typeof t.trainee_mail === 'string' &&
            t.trainee_mail.includes('@')
        );
 
    } else if (new_trainee_ids && Array.isArray(new_trainee_ids) && new_trainee_ids.length > 0) {
      const placeholders = new_trainee_ids.map(() => '?').join(', ');
      const [rows] = await hrmdb.promise().query(
        `SELECT trainee_name, trainee_mail FROM planing_session_trainee_data
         WHERE planing_id = ? AND session_no = ?
           AND trainee_mail IS NOT NULL AND trainee_mail != ''
           AND trainee_id IN (${placeholders})`,
        [planing_id, session_no, ...new_trainee_ids.map(String)]
      );
      traineesToNotify = rows;
 
    } else {
      const [rows] = await hrmdb.promise().query(
        `SELECT trainee_name, trainee_mail FROM planing_session_trainee_data
         WHERE planing_id = ? AND session_no = ?
           AND trainee_mail IS NOT NULL AND trainee_mail != ''`,
        [planing_id, session_no]
      );
      traineesToNotify = rows;
    }
 
    if (!traineesToNotify || traineesToNotify.length === 0) {
      return res.status(404).json({ error: 'No valid trainees to notify.' });
    }
 
    // ── 3. Deduplicate & validate emails ──────────────────────────────────────
    const seen = new Set();
    const validEmails = traineesToNotify
      .map(t => (t.trainee_mail || '').trim().toLowerCase())
      .filter(mail => {
        if (!mail || !mail.includes('@')) return false;
        if (seen.has(mail)) return false;
        seen.add(mail);
        return true;
      });
 
    console.log(`📧 Total valid unique emails: ${validEmails.length}`);
 
    if (validEmails.length === 0) {
      return res.status(404).json({ error: 'No valid trainee emails found.' });
    }
 
    // ── 4. Build email body ───────────────────────────────────────────────────
    const formattedDate = new Date(session_date).toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
    const isVirtual = mode_of_training === 'Virtual';
 
    // Venue block
    let venueBlock = '';
    if (venueDetails) {
      const { location, roomName, mapLink, virtualLink, platform } = venueDetails;
      if (isVirtual && (virtualLink || platform)) {
        venueBlock = `
        <tr><td style="padding:0 0 16px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #005BAC;">
            <tr><td style="background-color:#005BAC;padding:8px 12px;">
              <span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#ffffff;">Virtual Session Details</span>
            </td></tr>
            <tr><td style="background-color:#EBF4FF;padding:12px 14px;border-left:4px solid #005BAC;">
              ${platform ? `<p style="margin:0 0 8px 0;font-family:Arial,sans-serif;font-size:13px;color:#333333;"><b>Platform:</b> ${platform}</p>` : ''}
              ${virtualLink ? `<p style="margin:6px 0 0 0;"><a href="${virtualLink}" style="display:inline-block;padding:9px 24px;background-color:#005BAC;color:#ffffff;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;text-decoration:none;">Join Meeting</a></p>` : ''}
            </td></tr>
          </table>
        </td></tr>`;
      } else if (location || roomName) {
        venueBlock = `
        <tr><td style="padding:0 0 16px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #5A8A00;">
            <tr><td style="background-color:#5A8A00;padding:8px 12px;">
              <span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#ffffff;">Venue Details</span>
            </td></tr>
            <tr><td style="background-color:#F4FBE6;padding:12px 14px;border-left:4px solid #5A8A00;">
              ${roomName ? `<p style="margin:0 0 6px 0;font-family:Arial,sans-serif;font-size:13px;color:#333333;"><b>Room / Hall:</b> ${roomName}</p>` : ''}
              ${location  ? `<p style="margin:0 0 6px 0;font-family:Arial,sans-serif;font-size:13px;color:#333333;"><b>Location:</b> ${location}</p>` : ''}
              ${mapLink   ? `<p style="margin:6px 0 0 0;"><a href="${mapLink}" style="font-family:Arial,sans-serif;font-size:13px;color:#1A005D;font-weight:bold;">View on Map &rarr;</a></p>` : ''}
            </td></tr>
          </table>
        </td></tr>`;
      }
    }
 
    // Custom message block
    const customMessageBlock = customMessage ? `
        <tr><td style="padding:0 0 16px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #9B7FD4;">
            <tr><td style="background-color:#1A005D;padding:8px 12px;">
              <span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#ffffff;">Message from the Coordinator</span>
            </td></tr>
            <tr><td style="background-color:#F5F0FF;padding:14px 16px;border-left:4px solid #1A005D;font-family:Arial,sans-serif;font-size:13px;color:#333333;line-height:1.7;">${customMessage}</td></tr>
          </table>
        </td></tr>` : '';
 
    const emailBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${training_topic}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6fb;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6fb;">
  <tr><td align="center" style="padding:28px 12px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:1px solid #dde0e8;">
 
      <tr><td style="padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="background-color:#8EC400;height:6px;font-size:0;">&nbsp;</td>
            <td width="50%" style="background-color:#1A005D;height:6px;font-size:0;">&nbsp;</td>
          </tr>
        </table>
      </td></tr>
 
      <tr><td style="background-color:#ffffff;padding:36px 40px 28px;text-align:center;">
        <p style="margin:0 0 14px 0;font-size:40px;line-height:1;">&#127891;</p>
        <p style="margin:0 0 8px 0;font-family:Arial,sans-serif;font-size:26px;font-weight:bold;color:#1A005D;">You've Been Nominated!</p>
        <p style="margin:0 0 20px 0;font-family:Arial,sans-serif;font-size:14px;color:#555555;">Training Session Invitation &mdash; <b style="color:#8EC400;">${training_topic}</b></p>
      </td></tr>
 
      <tr><td style="padding:0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="background-color:#e8ebf0;height:1px;font-size:0;">&nbsp;</td></tr>
        </table>
      </td></tr>
 
      <tr><td style="padding:28px 40px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding-bottom:20px;">
            <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:15px;color:#222222;">Dear <b style="color:#1A005D;">Participant,</b></p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.8;">You have been <b style="color:#1A005D;">nominated</b> in an upcoming training session. Please find the details below.</p>
          </td></tr>
 
          <tr><td style="padding-bottom:20px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
              <tr><td colspan="2" style="background-color:#8EC400;padding:10px 16px;">
                <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#1A005D;text-transform:uppercase;letter-spacing:1px;">&#128203; Training Session Details</span>
              </td></tr>
              <tr>
                <td width="36%" style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;">
                  <span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#127919; Topic</span>
                </td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;">
                  <span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#222222;">${training_topic}</span>
                </td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;">
                  <span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128197; Date</span>
                </td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;">
                  <span style="font-family:Arial,sans-serif;font-size:13px;color:#222222;">${formattedDate}</span>
                </td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;">
                  <span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128336; Time</span>
                </td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;">
                  <span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#222222;">${from_time} &mdash; ${to_time}</span>
                </td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;">
                  <span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">${isVirtual ? '&#128187;' : '&#127979;'} Mode</span>
                </td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;">
                  <table cellpadding="0" cellspacing="0" border="0"><tr>
                    <td style="background-color:${isVirtual ? '#005BAC' : '#5A8A00'};padding:4px 16px;">
                      <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">${mode_of_training}</span>
                    </td>
                  </tr></table>
                </td>
              </tr>
            </table>
          </td></tr>
 
          ${venueBlock}
          ${customMessageBlock}
 
          <tr><td style="padding-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
              <tr><td style="background-color:#f7f8ff;padding:10px 16px;border-bottom:1px solid #eaecf4;">
                <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#1A005D;text-transform:uppercase;letter-spacing:1px;">&#10024; Why Attend This Session?</span>
              </td></tr>
              <tr><td style="padding:16px 18px;">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr><td width="28" valign="top" style="font-size:16px;padding:4px 0;">&#128640;</td><td style="font-family:Arial,sans-serif;font-size:13px;color:#444444;padding:4px 0;line-height:1.6;">Gain new skills &amp; knowledge relevant to your role</td></tr>
                  <tr><td valign="top" style="font-size:16px;padding:4px 0;">&#129309;</td><td style="font-family:Arial,sans-serif;font-size:13px;color:#444444;padding:4px 0;line-height:1.6;">Connect with colleagues &amp; leaders</td></tr>
                  <tr><td valign="top" style="font-size:16px;padding:4px 0;">&#127919;</td><td style="font-family:Arial,sans-serif;font-size:13px;color:#444444;padding:4px 0;line-height:1.6;">Interactive Q&amp;A sessions and activities</td></tr>
                  <tr><td valign="top" style="font-size:16px;padding:4px 0;">&#128161;</td><td style="font-family:Arial,sans-serif;font-size:13px;color:#444444;padding:4px 0;line-height:1.6;">Share your ideas and shape our future</td></tr>
                </table>
              </td></tr>
            </table>
          </td></tr>
 
          <tr><td align="center" style="padding-bottom:28px;">
            <a href="https://neinsoft.nittsu.co.in:8185/NEIN/"
               style="display:inline-block;padding:14px 40px;background-color:#1A005D;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;border:2px solid #1A005D;">
              &#128273; Login to Application
            </a>
          </td></tr>
 
          <tr><td>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #dde0e8;">
              <tr>
                <td width="5" style="background-color:#8EC400;font-size:0;">&nbsp;</td>
                <td style="background-color:#f7f8ff;padding:14px 18px;">
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#555555;line-height:1.7;">
                    For queries, reach out to your coordinator:<br>
                    <b style="color:#1A005D;">${coordinator_name || 'L&D Team'}</b> &mdash;
                    <a href="mailto:${coordinator_email || 'neinsoft.support@nipponexpress.com'}" style="color:#1A005D;font-weight:bold;text-decoration:none;">${coordinator_email || 'neinsoft.support@nipponexpress.com'}</a>
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
 
      <tr><td style="background-color:#f4f6fb;padding:22px 40px;text-align:center;border-top:3px solid #8EC400;">
        <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">Nippon Express (India) Private Limited</p>
        <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:11px;color:#888888;">L&amp;D &mdash; Learning &amp; Development</p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#aaaaaa;line-height:1.6;">
          This is a system-generated email. Please do not reply.<br>
          For support: <a href="mailto:neinsoft.support@nipponexpress.com" style="color:#5A8A00;text-decoration:none;font-weight:bold;">neinsoft.support@nipponexpress.com</a>
        </p>
      </td></tr>
 
      <tr><td style="padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="background-color:#1A005D;height:6px;font-size:0;">&nbsp;</td>
            <td width="50%" style="background-color:#8EC400;height:6px;font-size:0;">&nbsp;</td>
          </tr>
        </table>
      </td></tr>
 
    </table>
  </td></tr>
</table>
</body>
</html>`;
 
    const emailSubject = `NEIN L&D | Training Invitation: ${training_topic} | ${formattedDate}`;
 
    // ── 5. KEY FIX: Batch BCC sends — Graph API max is 500 recipients per call ─
    const BATCH_SIZE = 490; // safe margin under the 500 limit
    const batches = [];
    for (let i = 0; i < validEmails.length; i += BATCH_SIZE) {
      batches.push(validEmails.slice(i, i + BATCH_SIZE));
    }
 
    console.log(`📦 Splitting ${validEmails.length} emails into ${batches.length} batch(es) of max ${BATCH_SIZE}`);
 
    const toAddress = coordinator_email || 'noreply.nein@nipponexpress.com';
    let successCount = 0;
    let failedCount = 0;
 
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const bccList = batch.join(',');
      console.log(`📬 Sending batch ${i + 1}/${batches.length} — ${batch.length} recipients`);
 
      try {
        await autoSendMail(
          'noreply.nein@nipponexpress.com',
          toAddress,      // TO: coordinator (visible sender anchor)
          '',             // CC: none
          emailBody,
          emailSubject,
          [],             // attachments
          bccList         // BCC: this batch of trainees
        );
        successCount += batch.length;
        console.log(`✅ Batch ${i + 1} sent successfully`);
 
        // Small delay between batches to avoid Graph API throttling
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (batchError) {
        failedCount += batch.length;
        console.error(`❌ Batch ${i + 1} failed:`, batchError?.response?.data || batchError.message);
        // Continue with remaining batches even if one fails
      }
    }
 
    console.log(`📊 Final result: ${successCount} sent, ${failedCount} failed out of ${validEmails.length} total`);
 
    return res.status(200).json({
      message: `Notification sent to ${successCount} trainee(s) via BCC across ${batches.length} batch(es).`,
      successCount,
      failedCount,
      totalEmails: validEmails.length,
      batchCount: batches.length,
    });
 
  } catch (error) {
    console.error('Unexpected error in sendTraineeNotification:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
// ─────────────────────────────────────────────────────────────────────────────
exports.sendPlanningPostPoneCreatorNotification = async (req, res) => {
  try {
    const { planing_id, session_no } = req.body;
 
    if (!planing_id || !session_no) {
      return res.status(400).json({ error: "Missing required fields: planing_id and session_no are required." });
    }
 
    hrmdb.query(`
      SELECT pt.training_topic_id, pt.user_email, pmc.coordinator_email, pmsc.sub_coordinator_email,
             GROUP_CONCAT(DISTINCT pst.trainee_mail) AS trainee_mails,
             ps.session_date,
             TIME_FORMAT(ps.from_time, '%H:%i') AS from_time,
             TIME_FORMAT(ps.to_time, '%H:%i') AS to_time,
             ps.mode_of_training, ps.Remarks
      FROM planning_training_table pt
      JOIN planing_sessions ps ON pt.id = ps.planing_id AND ps.session_no = ?
      JOIN planing_mapping_coordinator pmc ON pt.id = pmc.planing_id AND pmc.session_no = ps.session_no
      LEFT JOIN planing_session_trainee_data pst ON pt.id = pst.planing_id AND ps.session_no = pst.session_no
      LEFT JOIN planing_mapping_sub_coordinator pmsc ON pt.id = pmsc.planing_id AND ps.session_no = pmsc.session_no
      WHERE pt.id = ?
      GROUP BY pt.id
    `, [session_no, planing_id], async (err, trainingDetails) => {
      if (err) return res.status(500).json({ error: "Database query failed", details: err.message });
      if (!trainingDetails || trainingDetails.length === 0) return res.status(404).json({ error: "No training details found." });
 
      const { training_topic_id, user_email, coordinator_email, sub_coordinator_email, trainee_mails, session_date, from_time, to_time, mode_of_training, Remarks } = trainingDetails[0];
      if (!user_email) return res.status(400).json({ error: "User email is missing." });
 
      hrmdb.query(`SELECT training_topic FROM training_topic WHERE id = ?`, [training_topic_id], async (err, topicResult) => {
        if (err) return res.status(500).json({ error: "Database query failed", details: err.message });
        if (!topicResult || topicResult.length === 0) return res.status(404).json({ error: "No training topic found." });
 
        const training_topic = topicResult[0].training_topic;
        const ccEmails = new Set();
        if (coordinator_email) ccEmails.add(coordinator_email.trim());
        if (sub_coordinator_email) ccEmails.add(sub_coordinator_email.trim());
        if (trainee_mails) trainee_mails.split(',').forEach(e => ccEmails.add(e.trim()));
        ccEmails.delete(user_email);
 
        const formattedDate = new Date(session_date).toLocaleDateString('en-IN', {
          weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
        });
 
        const isVirtual = mode_of_training === 'Virtual';
 
        const emailBody = `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <title>Session Postponed - ${training_topic}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6fb;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6fb;">
  <tr><td align="center" style="padding:28px 12px;background-color:#f4f6fb;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:1px solid #dde0e8;">
 
      <!-- TOP STRIPE -->
      <tr><td style="padding:0;background-color:#ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="background-color:#8EC400;height:6px;font-size:0;">&nbsp;</td>
            <td width="50%" style="background-color:#1A005D;height:6px;font-size:0;">&nbsp;</td>
          </tr>
        </table>
      </td></tr>
 
      <!-- HEADER -->
      <tr><td style="background-color:#ffffff;padding:36px 40px 28px;text-align:center;">
        <p style="margin:0 0 14px 0;font-size:40px;line-height:1;">&#128680;</p>
        <p style="margin:0 0 8px 0;font-family:Arial,sans-serif;font-size:26px;font-weight:bold;color:#C0392B;line-height:1.25;">Training Session Postponed</p>
        <p style="margin:0 0 20px 0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.5;">Important Notice &mdash; <b style="color:#8EC400;">${training_topic}</b></p>
      </td></tr>
 
      <!-- DIVIDER -->
      <tr><td style="background-color:#ffffff;padding:0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="background-color:#e8ebf0;height:1px;font-size:0;">&nbsp;</td></tr>
        </table>
      </td></tr>
 
      <!-- BODY -->
      <tr><td style="background-color:#ffffff;padding:28px 40px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
 
          <!-- Greeting -->
          <tr><td style="padding-bottom:20px;">
            <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:15px;color:#222222;line-height:1.7;">Dear <b style="color:#1A005D;">Team,</b></p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.8;">We regret to inform you that the upcoming training session for <b style="color:#1A005D;">${training_topic}</b> has been <b style="color:#C0392B;">postponed</b>. Please find the details below.</p>
          </td></tr>
 
          <!-- POSTPONEMENT DETAILS TABLE -->
          <tr><td style="padding-bottom:20px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
              <tr><td colspan="2" style="background-color:#C0392B;padding:10px 16px;">
                <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">&#128680; Postponement Details</span>
              </td></tr>
              <tr>
                <td width="36%" style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#127919; Topic</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#222222;">${training_topic}</span></td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128197; Scheduled Date</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#222222;">${formattedDate}</span></td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128336; Scheduled Time</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#222222;">${from_time} &mdash; ${to_time}</span></td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">${isVirtual ? '&#128187;' : '&#127979;'} Mode</span></td>
                <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;">
                  <table cellpadding="0" cellspacing="0" border="0"><tr>
                    <td style="background-color:${isVirtual ? '#005BAC' : '#5A8A00'};padding:4px 16px;">
                      <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">${mode_of_training}</span>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#C0392B;">&#128172; Reason</span></td>
                <td style="background-color:#fff5f5;padding:11px 16px;border-top:1px solid #eaecf4;"><span style="font-family:Arial,sans-serif;font-size:13px;color:#C0392B;font-weight:bold;">${Remarks}</span></td>
              </tr>
            </table>
          </td></tr>
 
          <!-- CTA BUTTON -->
          <tr><td align="center" style="padding-bottom:28px;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
              href="https://neinsoft.nittsu.co.in:8185/NEIN/"
              style="height:46px;v-text-anchor:middle;width:230px;" arcsize="0%"
              fillcolor="#1A005D" strokecolor="#1A005D">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">Login to Application</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="https://neinsoft.nittsu.co.in:8185/NEIN/"
               style="display:inline-block;padding:14px 40px;background-color:#1A005D;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;border:2px solid #1A005D;">
              &#128273; Login to Application
            </a>
            <!--<![endif]-->
          </td></tr>
 
        </table>
      </td></tr>
 
      <!-- FOOTER -->
      <tr><td style="background-color:#f4f6fb;padding:22px 40px;text-align:center;border-top:3px solid #8EC400;">
        <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">Nippon Express (India) Private Limited</p>
        <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:11px;color:#888888;">L&amp;D &mdash; Learning &amp; Development</p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#aaaaaa;line-height:1.6;">
          This is a system-generated email. Please do not reply.<br>
          For support: <a href="mailto:neinsoft.support@nipponexpress.com" style="color:#5A8A00;text-decoration:none;font-weight:bold;">neinsoft.support@nipponexpress.com</a>
        </p>
      </td></tr>
 
      <!-- BOTTOM STRIPE -->
      <tr><td style="padding:0;background-color:#ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="background-color:#1A005D;height:6px;font-size:0;">&nbsp;</td>
            <td width="50%" style="background-color:#8EC400;height:6px;font-size:0;">&nbsp;</td>
          </tr>
        </table>
      </td></tr>
 
    </table>
  </td></tr>
</table>
</body>
</html>`;
 
        await autoSendMail("", user_email, [...ccEmails].join(","), emailBody, `NEIN - L&D Training Session Postponed - ${training_topic}`);
        return res.status(200).json({ message: "Postponement notification sent successfully." });
      });
    });
  } catch (error) {
    console.error("Error sending postponement notification:", error);
    return res.status(500).json({ error: "Failed to send postponement notification", details: error.message });
  }
};
 