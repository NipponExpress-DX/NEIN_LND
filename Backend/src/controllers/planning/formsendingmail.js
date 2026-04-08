const { hrmdb, leavemanagement } = require('../../../configuration/db');
const autoSendMail = require('./../../controllers/planning/sendmail'); // Ensure this is implemented
const express = require('express');
const router = express.Router();
const path = require('path');
const indexPath = require('../../variable');



function buildBrandedEmail({ icon, headingColor = '#1A005D', heading, subheading, bodyHtml, footerDivision = 'L&amp;D &mdash; Learning &amp; Development' }) {
  return `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
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
        <p style="margin:0 0 14px 0;font-size:40px;line-height:1;">${icon}</p>
        <p style="margin:0 0 8px 0;font-family:Arial,sans-serif;font-size:26px;font-weight:bold;color:${headingColor};line-height:1.25;">${heading}</p>
        <p style="margin:0 0 20px 0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.5;">${subheading}</p>
      </td></tr>
      <tr><td style="background-color:#ffffff;padding:0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="background-color:#e8ebf0;height:1px;font-size:0;">&nbsp;</td></tr>
        </table>
      </td></tr>
      <tr><td style="background-color:#ffffff;padding:28px 40px 24px;">
        ${bodyHtml}
      </td></tr>
      <tr><td style="background-color:#f4f6fb;padding:22px 40px;text-align:center;border-top:3px solid #8EC400;">
        <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">Nippon Express (India) Private Limited</p>
        <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:11px;color:#888888;">${footerDivision}</p>
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
}
 
// ─────────────────────────────────────────────────────────────────────────────
// CTA button snippet (reusable)
// ─────────────────────────────────────────────────────────────────────────────
const ctaButton = `
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
</td></tr>`;
 
// ─────────────────────────────────────────────────────────────────────────────
// Shared: session details table rows helper
// ─────────────────────────────────────────────────────────────────────────────
function sessionDetailsTable(rows) {
  const rowsHtml = rows.map(([label, value, valueStyle = '']) => `
    <tr>
      <td width="36%" style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;">
        <span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">${label}</span>
      </td>
      <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;">
        <span style="font-family:Arial,sans-serif;font-size:13px;color:#222222;${valueStyle}">${value}</span>
      </td>
    </tr>`).join('');
 
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
      <tr><td colspan="2" style="background-color:#8EC400;padding:10px 16px;">
        <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#1A005D;text-transform:uppercase;letter-spacing:1px;">&#128203; Training Session Details</span>
      </td></tr>
      ${rowsHtml}
    </table>`;
}
 
// ─────────────────────────────────────────────────────────────────────────────
// Shared: admin report table helper
// ─────────────────────────────────────────────────────────────────────────────
function adminReportTable(headerColor, headers, rows) {
  const thCells = headers.map(h => `<th style="padding:10px 14px;text-align:left;background-color:${headerColor};color:#ffffff;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;">${h}</th>`).join('');
  const trRows = rows.map(cells => `<tr>${cells.map((c, i) => `<td style="padding:10px 14px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;color:#222222;background-color:#ffffff;${i === 0 ? 'font-weight:bold;color:#1A005D;background-color:#f7f8ff;width:36%;' : ''}">${c}</td>`).join('')}</tr>`).join('');
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
      <tr>${thCells}</tr>${trRows}
    </table>`;
}



exports.sendFeedbackFormEmailTrainee = async (req, res) => {
  const { planing_id, session_no } = req.body;
 
  if (!planing_id || !session_no) {
    return res.status(400).json({ error: "Missing required fields", details: "planing_id and session_no are required" });
  }
 
  try {
    const [traineeEmails] = await hrmdb.promise().query(`
      SELECT trainee_name, trainee_mail
      FROM planing_session_trainee_data
      WHERE planing_id = ? AND session_no = ? AND calDeleteStatus = 0 AND attendance_status = 1
        AND trainee_mail IS NOT NULL AND trainee_mail != ''`, [planing_id, session_no]);
 
    if (!traineeEmails || traineeEmails.length === 0) {
      return res.status(404).json({ error: 'No valid trainees found' });
    }
 
    const [trainingDetails] = await hrmdb.promise().query(`
      SELECT tt.training_topic, ps.session_date, ps.from_time, ps.to_time, ps.trainer_name
      FROM planning_training_table pt
      JOIN training_topic tt ON pt.training_topic_id = tt.id
      JOIN planing_sessions ps ON pt.id = ps.planing_id
      WHERE pt.id = ? AND ps.session_no = ?`, [planing_id, session_no]);
 
    if (!trainingDetails || trainingDetails.length === 0) {
      return res.status(404).json({ error: 'No training details found' });
    }
 
    const { training_topic, session_date, from_time, to_time, trainer_name } = trainingDetails[0];
 
    const formattedDate = new Date(session_date).toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
    const fTime = from_time.substring(0, 5);
    const tTime = to_time.substring(0, 5);
 
    const feedbackLink = `${indexPath.hostvariable}/planning-route/PlanningSessionActiveAttendanceStatus/feedback/${encodeURIComponent(planing_id)}/${encodeURIComponent(session_no)}`;
 
    const bodyHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding-bottom:20px;">
          <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:15px;color:#222222;line-height:1.7;">Dear <b style="color:#1A005D;">Participant,</b></p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.8;">We hope this message finds you well. Your feedback on the recent training session is <b style="color:#1A005D;">very important</b> to us. Please take a moment to fill in the feedback form using the button below.</p>
        </td></tr>
        <tr><td style="padding-bottom:20px;">
          ${sessionDetailsTable([
            ['&#127919; Topic', `<b>${training_topic}</b>`, 'font-weight:bold;'],
            ['&#128197; Date', formattedDate],
            ['&#128336; Time', `<b>${fTime} &mdash; ${tTime}</b>`, 'font-weight:bold;'],
            ['&#127941; Trainer', trainer_name],
          ])}
        </td></tr>
        <tr><td align="center" style="padding-bottom:24px;">
          <a href="${feedbackLink}" target="_blank"
             style="display:inline-block;padding:14px 40px;background-color:#8EC400;color:#1A005D;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;border:2px solid #8EC400;">
            &#128203; Submit Your Feedback
          </a>
        </td></tr>
        ${ctaButton}
      </table>`;
 
    const emailBody = buildBrandedEmail({
      icon: '&#128203;',
      heading: 'Share Your Feedback!',
      subheading: `Training Feedback Form &mdash; <b style="color:#8EC400;">${training_topic}</b>`,
      bodyHtml,
    });
 
    const recipientEmails = traineeEmails.map(t => t.trainee_mail).join(',');

        await autoSendMail(
        'noreply.nein@nipponexpress.com',  // from
        'noreply.nein@nipponexpress.com',                                 // to   → required by Graph API
        '',                                // cc   → empty
        emailBody,                         // body
        `NEIN - Feedback Form for Training Session - ${training_topic}`,  // subject
        [],                                // attachments → empty
        recipientEmails                    // bcc  ✅ → all trainees, hidden
        );

        return res.status(200).json({
        message: 'Feedback form email sent successfully to all trainees',
        recipientCount: traineeEmails.length,
        });
  } catch (error) {
    console.error('Unexpected error in sendFeedbackFormEmailTrainee:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
exports.sendFeedbackFormEmailTraineePendingParsonsOnly = async (req, res) => {
  const { planing_id, session_no } = req.body;
 
  if (!planing_id || !session_no) {
    return res.status(400).json({ error: "Missing required fields", details: "Both planing_id and session_no are required" });
  }
 
  try {
    const [traineeEmails] = await hrmdb.promise().query(`
      SELECT trainee_name, trainee_mail
      FROM planing_session_trainee_data
      WHERE planing_id = ? AND session_no = ? AND feedback_form_answer IS NULL
        AND trainee_mail IS NOT NULL AND trainee_mail != ''`, [planing_id, session_no]);
 
    if (traineeEmails.length === 0) {
      return res.status(404).json({ error: 'No pending trainees found' });
    }
 
    const [trainingDetails] = await hrmdb.promise().query(`
      SELECT tt.training_topic, ps.session_date, ps.from_time, ps.to_time, ps.trainer_name
      FROM planning_training_table pt
      JOIN training_topic tt ON pt.training_topic_id = tt.id
      JOIN planing_sessions ps ON pt.id = ps.planing_id
      WHERE pt.id = ? AND ps.session_no = ?`, [planing_id, session_no]);
 
    if (!trainingDetails || trainingDetails.length === 0) {
      return res.status(404).json({ error: 'Training session not found' });
    }
 
    const { training_topic, session_date, from_time, to_time, trainer_name } = trainingDetails[0];
 
    const formattedDate = new Date(session_date).toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
    const fTime = from_time.substring(0, 5);
    const tTime = to_time.substring(0, 5);
 
    const feedbackLink = `${indexPath.hostvariable}/planning-route/PlanningSessionActiveAttendanceStatus/feedback/${encodeURIComponent(planing_id)}/${encodeURIComponent(session_no)}`;
 
    const bodyHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding-bottom:20px;">
          <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:15px;color:#222222;line-height:1.7;">Dear <b style="color:#1A005D;">Participant,</b></p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.8;">We noticed that you haven't yet submitted your feedback for the recent training session. Your input is <b style="color:#1A005D;">crucial</b> to help us improve future programs. Please take a moment to complete it.</p>
        </td></tr>
        <tr><td style="padding-bottom:20px;">
          ${sessionDetailsTable([
            ['&#127919; Topic', `<b>${training_topic}</b>`, 'font-weight:bold;'],
            ['&#128197; Date', formattedDate],
            ['&#128336; Time', `<b>${fTime} &mdash; ${tTime}</b>`, 'font-weight:bold;'],
            ['&#127941; Trainer', trainer_name],
          ])}
        </td></tr>
        <tr><td style="padding-bottom:20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e67e22;">
            <tr><td style="background-color:#e67e22;padding:10px 16px;">
              <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">&#9888; Friendly Reminder</span>
            </td></tr>
            <tr><td style="background-color:#fff8f0;padding:14px 16px;border-left:4px solid #e67e22;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#7d4900;line-height:1.7;">Your feedback has <b>not yet been submitted</b>. Please complete the form at the earliest to help us serve you better in future sessions.</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding-bottom:24px;">
          <a href="${feedbackLink}" target="_blank"
             style="display:inline-block;padding:14px 40px;background-color:#e67e22;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;border:2px solid #e67e22;">
            &#128203; Submit Pending Feedback
          </a>
        </td></tr>
        ${ctaButton}
      </table>`;
 
    const emailBody = buildBrandedEmail({
      icon: '&#9888;',
      headingColor: '#e67e22',
      heading: 'Feedback Pending — Reminder',
      subheading: `Training Feedback Reminder &mdash; <b style="color:#8EC400;">${training_topic}</b>`,
      bodyHtml,
    });
 
  
  const BATCH_SIZE = 50;
  const allEmails = traineeEmails.map(t => t.trainee_mail).filter(Boolean);

  // Split into batches
  const batches = [];
  for (let i = 0; i < allEmails.length; i += BATCH_SIZE) {
    batches.push(allEmails.slice(i, i + BATCH_SIZE));
  }

  console.log(`📧 Sending reminder to ${allEmails.length} trainees in ${batches.length} batch(es)`);

  // Send each batch sequentially to avoid rate limiting
  for (let i = 0; i < batches.length; i++) {
    const batchEmails = batches[i].join(',');
    try {
      await autoSendMail(
        'noreply.nein@nipponexpress.com',
        'noreply.nein@nipponexpress.com',
        '',
        emailBody,
        `NEIN - Feedback Form for Training Session - ${training_topic}`,
        [],
        batchEmails
      );
      console.log(`✅ Batch ${i + 1}/${batches.length} sent (${batches[i].length} recipients)`);

      // Small delay between batches to respect Graph API rate limits
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (batchErr) {
      console.error(`❌ Batch ${i + 1} failed:`, batchErr.message);
      // Continue with remaining batches even if one fails
    }
  }

  return res.status(200).json({
    message: 'Feedback reminder emails sent successfully',
    recipientCount: allEmails.length,
    batchCount: batches.length,
  });
  } catch (error) {
    console.error('Unexpected error in sendFeedbackFormEmailTraineePendingParsonsOnly:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

exports.sendFeedbackReminderToSingleTrainee = async (req, res) => {
  const { planing_id, session_no, trainee_id } = req.body;

  if (!planing_id || !session_no || !trainee_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [traineeResult] = await hrmdb.promise().query(`
      SELECT trainee_name, trainee_mail
      FROM planing_session_trainee_data
      WHERE planing_id = ? AND session_no = ? AND trainee_id = ?
        AND feedback_form_answer IS NULL
        AND trainee_mail IS NOT NULL AND trainee_mail != ''`,
      [planing_id, session_no, trainee_id]
    );

    if (traineeResult.length === 0) {
      return res.status(404).json({ error: 'Trainee not found or already submitted feedback' });
    }

    const [trainingDetails] = await hrmdb.promise().query(`
      SELECT tt.training_topic, ps.session_date, ps.from_time, ps.to_time, ps.trainer_name
      FROM planning_training_table pt
      JOIN training_topic tt ON pt.training_topic_id = tt.id
      JOIN planing_sessions ps ON pt.id = ps.planing_id
      WHERE pt.id = ? AND ps.session_no = ?`, [planing_id, session_no]);

    if (!trainingDetails || trainingDetails.length === 0) {
      return res.status(404).json({ error: 'Training session not found' });
    }

    const { training_topic, session_date, from_time, to_time, trainer_name } = trainingDetails[0];

    const formattedDate = new Date(session_date).toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
    const fTime = from_time.substring(0, 5);
    const tTime = to_time.substring(0, 5);

    const feedbackLink = `${indexPath.hostvariable}/planning-route/PlanningSessionActiveAttendanceStatus/feedback/${encodeURIComponent(planing_id)}/${encodeURIComponent(session_no)}`;

    const bodyHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding-bottom:20px;">
          <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:15px;color:#222222;line-height:1.7;">Dear <b style="color:#1A005D;">${traineeResult[0].trainee_name},</b></p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.8;">We noticed that you haven't yet submitted your feedback. Please take a moment to complete it.</p>
        </td></tr>
        <tr><td style="padding-bottom:20px;">
          ${sessionDetailsTable([
            ['&#127919; Topic', `<b>${training_topic}</b>`, 'font-weight:bold;'],
            ['&#128197; Date', formattedDate],
            ['&#128336; Time', `<b>${fTime} &mdash; ${tTime}</b>`, 'font-weight:bold;'],
            ['&#127941; Trainer', trainer_name],
          ])}
        </td></tr>
        <tr><td align="center" style="padding-bottom:24px;">
          <a href="${feedbackLink}" target="_blank"
             style="display:inline-block;padding:14px 40px;background-color:#e67e22;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;border:2px solid #e67e22;">
            &#128203; Submit Pending Feedback
          </a>
        </td></tr>
        ${ctaButton}
      </table>`;

    const emailBody = buildBrandedEmail({
      icon: '&#9888;',
      headingColor: '#e67e22',
      heading: 'Feedback Pending — Reminder',
      subheading: `Training Feedback Reminder &mdash; <b style="color:#8EC400;">${training_topic}</b>`,
      bodyHtml,
    });

    await autoSendMail(
      'noreply.nein@nipponexpress.com',
      traineeResult[0].trainee_mail,
      '', emailBody,
      `NEIN - Feedback Reminder for Training Session - ${training_topic}`,
      [], ''
    );

    return res.status(200).json({ message: 'Reminder sent successfully' });

  } catch (error) {
    console.error('Error in sendFeedbackReminderToSingleTrainee:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};


exports.FeedbackFormTrainee = (req, res, planing_id, session_no) => {
    console.log("Received parameters:", planing_id, session_no);

    if (!planing_id || !session_no) {
        return res.status(400).send('<h1>Missing required parameters: planing_id, session_no, </h1>');
    }

    const getTrainingTopicQuery = `
        SELECT tt.training_topic
        FROM planning_training_table pt
        JOIN training_topic tt ON pt.training_topic_id = tt.id
        WHERE pt.id = ?;
    `;

    // First, get the training topic
    hrmdb.query(getTrainingTopicQuery, [planing_id], (err, topicRows) => {
        if (err) {
            console.error('Error fetching training topic:', err);
            return res.status(500).send('<h1>Error fetching training topic. Please try again later.</h1>');
        }
        console.log("topicRows", topicRows);
        if (topicRows.length === 0) {
            return res.status(404).send('<h1>No training topic found.</h1>');
        }

        const trainingTopic = topicRows[0].training_topic;

        const checkFeedbackQuery = `
        SELECT trainee_id, feedback_form_Assign_final_submit_date, feedback_form_question, feedback_form_answer
        FROM planing_session_trainee_data
        WHERE planing_id = ? AND session_no = ? AND attendance_status=1 ;
    `;

        hrmdb.query(checkFeedbackQuery, [planing_id, session_no], (err, rows) => {
            if (err) {
                console.error('Error checking trainee feedback:', err);
                return res.status(500).send('<h1>Error checking feedback status. Please try again later.</h1>');
            }

            if (rows.length === 0) {
                return res.status(404).send('<h1>No feedback form available.</h1>');
            }
            //-------

            const traineeData = rows[0];
            const { feedback_form_Assign_final_submit_date, feedback_form_question, feedback_form_answer } = traineeData;

            // Check if feedback_form_Assign_final_submit_date is NULL or invalid
            if (!feedback_form_Assign_final_submit_date) {
                return res.status(400).send('<h1>Feedback submission date is not set.</h1>');
            }

            const finalSubmitDate = new Date(feedback_form_Assign_final_submit_date);

            if (isNaN(finalSubmitDate.getTime())) {
                return res.status(400).send('<h1>Invalid feedback submission date.</h1>');
            }

            const now = new Date();

            console.log('Now:', now);
            console.log('Final Submit Date:', finalSubmitDate);

            if (now > finalSubmitDate) {
                return res.send(`<h1 style="
                        text-align: center; 
                        font-size: 18px; 
                        color: #FF0000; 
                        background-color: #FFE6E6; 
                        padding: 20px; 
                        border: 2px solid #FF0000; 
                        border-radius: 8px; 
                        margin: 20px auto; 
                        max-width: 600px;">
                         The form is now officially closed.
                    </h1>
                    `);
            }

            const remainingTime = Math.floor((finalSubmitDate - now) / 1000); // Remaining time in seconds
            const days = Math.floor(remainingTime / (24 * 3600)); // Calculate days
            const hours = Math.floor((remainingTime % (24 * 3600)) / 3600); // Remaining hours after removing days
            const minutes = Math.floor((remainingTime % 3600) / 60); // Remaining minutes after removing hours
            const seconds = remainingTime % 60; // Remaining seconds after removing minutes

            // Display the time in "X days, Y hours, Z minutes, and W seconds" format
            const formattedRemainingTime = `
            ${days} day${days !== 1 ? 's' : ''}, 
            ${hours} hour${hours !== 1 ? 's' : ''}, 
            ${minutes} minute${minutes !== 1 ? 's' : ''}`;

            const trainingDetailsQuery = `
                SELECT trainer_name, session_date, from_time, to_time
                FROM planing_sessions
                WHERE planing_id = ? AND session_no = ?;
            `;

            hrmdb.query(trainingDetailsQuery, [planing_id, session_no], (err, trainingRows) => {
                if (err) {
                    console.error('Error fetching training details:', err);
                    return res.status(500).send('<h1>Failed to load feedback form. Please try again later.</h1>');
                }

                if (trainingRows.length === 0) {
                    return res.status(404).send('<h1>No feedback form available.</h1>');
                }

                const { trainer_name, session_date: rawDate, from_time: rawFromTime, to_time: rawToTime, training_topic } = trainingRows[0];

                // Handle session_date (rawDate) formatting
                let training_date;
                if (rawDate instanceof Date) {
                    const day = String(rawDate.getDate()).padStart(2, '0');
                    const month = String(rawDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
                    const year = rawDate.getFullYear();
                    training_date = `${day}/${month}/${year}`;
                } else if (typeof rawDate === 'string') {
                    const [year, month, day] = rawDate.split('-');
                    training_date = `${day}/${month}/${year}`;
                } else {
                    training_date = 'N/A';
                }

                // Format time (from_time and to_time)
                const formatTime = (time) => {
                    const [hours, minutes] = time.split(':');
                    return `${hours}:${minutes}`;
                };
                const from_time = formatTime(rawFromTime);
                const to_time = formatTime(rawToTime);

                // Parse feedback questions
                const feedbackQuestions = JSON.parse(traineeData.feedback_form_question);

                // Replace the section after the feedback table in the form with this:

res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Training trainee Feedback Form</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f9f9f9;
            }
            .container {
                max-width: 800px;
                background: #fff;
                padding: 20px;
                margin: auto;
                border: 1px solid #000;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
            }
            .header img {
                max-width: 150px;
            }
            .header .details {
                flex: 1;
                margin-left: 20px;
            }
            .header .title {
                text-align: center;
                flex: 2;
            }
            .header .details p {
                margin: 5px 0;
                font-size: 14px;
            }
            h1 {
                text-align: center;
                font-size: 18px;
                margin: 10px 0;
            }
            .training-details {
                margin-top: 20px;
                font-size: 14px;
            }
            .training-details p {
                margin: 5px 0;
            }
            #emp_id {
                width: 100%;
                padding: 8px;
                font-size: 17px;
                border: 1px solid #000;
                border-radius: 4px;
                margin-top: 5px;
                box-sizing: border-box;
            }
            .details label {
                display: block;
                font-size: 18px;
                font-weight: bold;
                padding: 10px 5px 4px 38px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            table, th, td {
                border: 1px solid #000;
            }
            th, td {
                text-align: left;
                padding: 8px;
                font-size: 14px;
            }
            .left-align td {
                text-align: left;
            }
            
            /* Trainee details table styles */
            .trainee-details-table {
                margin-top: 20px;
                width: 100%;
                border-collapse: collapse;
            }
            .trainee-details-table td {
                padding: 10px;
                border: 1px solid #000;
            }
            .trainee-details-table td:first-child {
                font-weight: bold;
                width: 150px;
            }
            
            /* Future topics section */
            .future-topics-section {
                margin-top: 20px;
            }
            .future-topics-section p {
                font-size: 14px;
                margin-bottom: 10px;
            }
            
            textarea {
                width: 100%;
                height: 80px;
                margin-top: 5px;
                padding: 10px;
                font-size: 14px;
                border: 1px solid #000;
                border-radius: 4px;
                box-sizing: border-box;
            }
            .btn-submit {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 10px 20px;
                font-size: 16px;
                border-radius: 4px;
                cursor: pointer;
                display: block;
                margin: 20px auto;
            }
            .btn-validate {
                background-color: #2196F3;
                color: white;
                border: none;
                padding: 10px 20px;
                font-size: 16px;
                border-radius: 4px;
                cursor: pointer;
                display: block;
                margin: 10px auto;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="/images/logo.png" alt="Nippon Express Logo">
                <div class="title">
                    <h1>Training Session Trainee Feedback Form</h1>
                    <h1>- Human Resource Development</h1>
                </div>
                <div class="details">
                    <label for="emp_id"><strong>Enter Below Employee ID:</strong></label>
                    <input type="text" id="emp_id" name="emp_id" placeholder="Enter Employee ID">
                    <p id="empIdStatus" style="color: red;">Please enter Employee ID</p>
                </div>
            </div>
            <div class="training-details">
                <p><strong>Training Title:</strong> ${trainingTopic}</p>
                <p><strong>Trainer Name:</strong> ${trainer_name}</p>
                <p><strong>Date:</strong> ${training_date}</p>
                <p><strong>Time:</strong> ${from_time} to ${to_time}</p>
                <p>Please take a few moments to provide us with some important feedback about the training<br>Please select (✓) the rating for each section based on the following criteria:</p>
                <br><p><b>5 = Excellent 4 = Good 3 = Average 2 = Fair 1 = Poor</b></p>
            </div>
            <form id="feedbackForm">
                <table>
                    <thead>
                        <tr>
                            <th>Points</th>
                            <th>5</th>
                            <th>4</th>
                            <th>3</th>
                            <th>2</th>
                            <th>1</th>
                        </tr>
                    </thead>
                    <tbody id="feedbackTableBody">
                        ${Object.entries(feedbackQuestions).map(([id, question], index) =>
                            index < 11
                                ? `
                                <tr class="rating-question" data-question-id="${id}">
                                    <td><strong>Q${index + 1}.</strong> ${question}</td>
                                    ${[5, 4, 3, 2, 1].map(v => `
                                        <td style="text-align:center">
                                            <input type="radio" 
                                                   name="feedback_form_answer[${id}]" 
                                                   data-id="${id}" 
                                                   value="${v}" required>
                                        </td>
                                    `).join("")}
                                </tr>
                            `
                                : `
                                <tr class="textarea-question" data-question-id="${id}">
                                    <td><strong>Q${index + 1}.</strong> ${question}</td>
                                    <td colspan="5">
                                        <textarea 
                                            name="feedback_form_answer[${id}]"
                                            data-id="${id}"
                                            class="textarea-answer"
                                            placeholder="Please provide your answer here..."
                                            style="width:95%;height:60px;border:1px solid #000;font-size:14px"
                                            required></textarea>
                                    </td>
                                </tr>
                            `
                        ).join("")}
                    </tbody>
                </table>
                
                <!-- Trainee Details Section -->
                <table class="trainee-details-table">
                    <tr>
                        <td>Name:</td>
                        <td id="trainee-name">Will be filled automatically</td>
                    </tr>
                    <tr>
                        <td>Employee No:</td>
                        <td id="trainee-empno">Will be filled automatically</td>
                    </tr>
                    <tr>
                        <td>Dept. Name:</td>
                        <td id="trainee-dept">Will be filled automatically</td>
                    </tr>
                    <tr>
                        <td>Date:</td>
                        <td id="trainee-date">${new Date().toLocaleDateString()}</td>
                    </tr>
                    <tr>
                        <td>Sign:</td>
                        <td id="trainee-sign">Will be filled automatically</td>
                    </tr>
                </table>
                
                <!-- Future Topics Section -->
                <div class="future-topics-section">
                    <p>
                        <strong>What topics would you like to see covered in future training sessions:</strong>
                        <span style="color: red; margin-left: 4px;" title="Required">*</span>
                    </p>
                    <textarea 
                        id="futureTopics" 
                        name="futureTopics" 
                        placeholder="Enter your suggestions for future training topics (required)"
                        required
                        style="border: 1px solid #000;"
                    ></textarea>
                </div>
                
                 <button type="submit" class="btn-submit">Submit Feedback</button>  
              <!--    <button type="button" id="validateBtn" class="btn-validate">Validate Form</button>-->
            </form>
            
            <!-- Validation summary container -->
            <div id="validationSummary" style="display: none; margin-top: 20px; padding: 15px; border: 1px solid #ff9800; background-color: #fff3cd; border-radius: 5px;">
                <h4 style="margin-top: 0; color: #856404;">Validation Issues:</h4>
                <ul id="validationIssues" style="color: #856404;"></ul>
            </div>
            
            <p id="responseMessage" style="text-align: center; font-size: 16px; margin-top: 10px;"></p>
        </div>

        <script>
            // Employee ID validation on input change
            document.getElementById("emp_id").addEventListener("input", async function () {
                const emp_id = document.getElementById("emp_id").value.trim();
                const empIdStatus = document.getElementById("empIdStatus");

                if (emp_id === "") {
                    empIdStatus.innerText = "Please enter Employee ID";
                    empIdStatus.style.color = "red";
                    // Clear trainee details
                    document.getElementById("trainee-name").innerText = "Will be filled automatically";
                    document.getElementById("trainee-empno").innerText = "Will be filled automatically";
                    document.getElementById("trainee-dept").innerText = "Will be filled automatically";
                    return;
                }

                try {
                    const validationResponse = await fetch("/planning-route/PlanningSessionActiveTrainees/FeedbackTraineeDataCheckPoint", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ 
                            emp_id: emp_id,
                            planing_id: ${planing_id},
                            session_no: ${session_no}
                        }),
                    });

                    const validationResult = await validationResponse.json();
                    
                    if (validationResponse.ok) {
                        if (validationResult.message === "Please share your thoughts in the space provided below.") {
                            empIdStatus.innerText = validationResult.message;
                            empIdStatus.style.color = "green";
                            
                            // Fill in trainee details if provided
                            if (validationResult.trainee_data) {
                                document.getElementById("trainee-name").innerText = validationResult.trainee_data.trainee_name || "";
                                document.getElementById("trainee-empno").innerText = emp_id;
                                document.getElementById("trainee-dept").innerText = validationResult.trainee_data.trainee_department || "";
                                document.getElementById("trainee-sign").innerText = validationResult.trainee_data.trainee_name || "";  // ← Sign = Name
                            }
                        } else {
                            empIdStatus.innerText = validationResult.message;
                            empIdStatus.style.color = "red";
                            // Clear trainee details on error
                            document.getElementById("trainee-name").innerText = "Will be filled automatically";
                            document.getElementById("trainee-empno").innerText = "Will be filled automatically";
                            document.getElementById("trainee-dept").innerText = "Will be filled automatically";
                            document.getElementById("trainee-sign").innerText = "Will be filled automatically";  // ← ADD THIS

                        }
                    } else {
                        empIdStatus.innerText = validationResult.message || "Invalid Employee ID";
                        empIdStatus.style.color = "red";
                        // Clear trainee details
                        document.getElementById("trainee-name").innerText = "Will be filled automatically";
                        document.getElementById("trainee-empno").innerText = "Will be filled automatically";
                        document.getElementById("trainee-dept").innerText = "Will be filled automatically";
                    }
                } catch (error) {
                    console.error("Error during emp_id validation:", error);
                    empIdStatus.innerText = "Error validating Employee ID. Please try again.";
                    empIdStatus.style.color = "red";
                }
            });

            // Function to validate all questions
            function validateAllQuestions() {
                const issues = [];
                const feedback = {};

                // 1. Validate rating questions (Q1-Q11)
                const ratingRows = document.querySelectorAll('tr.rating-question');
                ratingRows.forEach(function(row) {
                    const questionId = row.getAttribute('data-question-id');
                    const questionNumber = row.querySelector('td strong').textContent.replace('Q', '').replace('.', '');
                    const radioName = "feedback_form_answer[" + questionId + "]";
                    const selectedRadio = document.querySelector('input[name="' + radioName + '"]:checked');

                    if (!selectedRadio) {
                        issues.push("Question " + questionNumber + ": Please select a rating");
                    } else {
                        feedback[questionId] = selectedRadio.value;
                    }
                });

                // 2. Validate textarea questions (Q12+)
                const textareaRows = document.querySelectorAll('tr.textarea-question');
                textareaRows.forEach(function(row) {
                    const questionId = row.getAttribute('data-question-id');
                    const questionNumber = row.querySelector('td strong').textContent.replace('Q', '').replace('.', '');
                    const textarea = row.querySelector('textarea');
                    const answer = textarea.value.trim();

                    if (!answer) {
                        issues.push("Question " + questionNumber + ": Please provide an answer");
                    } else if (answer.length < 5) {
                        issues.push("Question " + questionNumber + ": Answer is too short (minimum 5 characters)");
                    } else {
                        feedback[questionId] = answer;
                    }
                });

                // 3. Validate future topics (MANDATORY - minimum 10 characters)
                    const futureTopics = document.getElementById("futureTopics").value.trim();
                    if (!futureTopics) {
                        issues.push("Future Topics: This field is required — please share topics for future sessions");
                    } else if (futureTopics.length < 10) {
                        issues.push("Future Topics: Answer is too short (minimum 10 characters)");
                    }

                    return {
                        isValid: issues.length === 0,
                        issues: issues,
                        feedbackData: feedback,
                        futureTopics: futureTopics
                    };
            }

            // Function to show validation issues
            function showValidationIssues(issues) {
                const summaryDiv = document.getElementById("validationSummary");
                const issuesList = document.getElementById("validationIssues");
                
                issuesList.innerHTML = '';
                issues.forEach(issue => {
                    const li = document.createElement('li');
                    li.textContent = issue;
                    issuesList.appendChild(li);
                });
                
                summaryDiv.style.display = 'block';
                showResponseMessage("Please fix the validation issues above.", "red");
                
                // Scroll to validation summary
                summaryDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            // Function to show response messages
            function showResponseMessage(message, color) {
                const responseMessage = document.getElementById("responseMessage");
                responseMessage.innerText = message;
                responseMessage.style.color = color;
            }

            // Function to reset form after successful submission
            function resetForm() {
                // Clear employee ID
                document.getElementById("emp_id").value = "";
                document.getElementById("empIdStatus").innerText = "Please enter Employee ID";
                document.getElementById("empIdStatus").style.color = "red";
                
                // Clear all radio buttons
                document.querySelectorAll('input[type="radio"]').forEach(radio => {
                    radio.checked = false;
                });
                
                // Clear all textareas
                document.querySelectorAll('textarea').forEach(textarea => {
                    textarea.value = "";
                });
                
                // Clear trainee details
                document.getElementById("trainee-name").innerText = "Will be filled automatically";
                document.getElementById("trainee-empno").innerText = "Will be filled automatically";
                document.getElementById("trainee-dept").innerText = "Will be filled automatically";
                
                // Hide validation summary
                document.getElementById("validationSummary").style.display = 'none';
            }

            // Function to validate form without submitting (for Validate button)
            function validateForm() {
                const validationResult = validateAllQuestions();
                
                if (validationResult.isValid) {
                    showResponseMessage("✓ All questions are properly answered!", "green");
                    document.getElementById("validationSummary").style.display = 'none';
                } else {
                    showValidationIssues(validationResult.issues);
                }
            }

            // Function to submit the feedback form
            async function submitFeedbackForm(emp_id, validationResult) {
                const responseMessage = document.getElementById("responseMessage");
                const validationSummary = document.getElementById("validationSummary");
                
                try {
                    // Hide validation summary
                    validationSummary.style.display = 'none';
                    
                    const response = await fetch("/planning-route/PlanningSessionActiveTrainees/submitFeedbackTrainee", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            emp_id: emp_id,
                            planing_id: ${planing_id},
                            session_no: ${session_no},
                            feedback_form_answer: validationResult.feedbackData,
                            feedback_form_comments_or_suggestions: validationResult.futureTopics
                        })
                    });

                    const result = await response.json();

                    // Display response message based on submission result
                    if (response.ok) {
                        responseMessage.innerText = result.message || "Feedback submitted successfully!";
                        responseMessage.style.color = "green";
                        
                        // Reset form after successful submission
                        resetForm();
                    } else {
                        responseMessage.innerText = result.message || "An error occurred while submitting feedback.";
                        responseMessage.style.color = "red";
                    }
                } catch (error) {
                    console.error("Error:", error);
                    responseMessage.innerText = "Failed to submit feedback. Please try again.";
                    responseMessage.style.color = "red";
                }
            }

            // Form validation and submission
            document.getElementById("feedbackForm").addEventListener("submit", async function (event) {
                event.preventDefault();
                
                // Validate employee ID first
                const emp_id = document.getElementById("emp_id").value.trim();
                if (!emp_id) {
                    showResponseMessage("Employee ID is required!", "red");
                    return;
                }
                
                // Validate all questions
                const validationResult = validateAllQuestions();
                if (!validationResult.isValid) {
                    showValidationIssues(validationResult.issues);
                    return;
                }

                await submitFeedbackForm(emp_id, validationResult);
            });
            
            // Validation button click handler
            document.getElementById("validateBtn").addEventListener("click", function() {
                validateForm();
            });
            
            // Real-time validation for textarea questions
            document.querySelectorAll('.textarea-answer').forEach(textarea => {
                textarea.addEventListener('input', function() {
                    const questionRow = this.closest('tr');
                    const questionNumber = questionRow.querySelector('td strong').textContent.replace('Q', '').replace('.', '');
                    
                    if (this.value.trim().length > 0 && this.value.trim().length < 10) {
                        this.style.borderColor = '#ff9800';
                        this.title = 'Answer for Q' + questionNumber + ' is too short (minimum 10 characters)';
                    } else {
                        this.style.borderColor = '#000';
                        this.title = '';
                    }
                });
            });
        </script>
    </body>
    </html>
`);
            });
        });
    });
};



exports.FeedbackTraineeDataCheckPoint = (req, res) => {
    // Destructure with default values to prevent undefined errors
    const { emp_id, planing_id, session_no } = req.body;

    // Validate all required parameters are present
    if (!emp_id || !planing_id || !session_no) {
        return res.status(400).json({ 
            error: "Missing required parameters",
            message: "Employee ID, planning ID, and session number are all required"
        });
    }

    // Query to check if emp_id exists and get trainee details
    const checkEmpIdQuery = `
        SELECT 
            pstd.trainee_id, 
            pstd.trainee_name,
            pstd.trainee_department,
            pstd.feedback_form_answer, 
            pstd.attendance_status 
        FROM planing_session_trainee_data pstd
        WHERE pstd.trainee_id = ? AND pstd.planing_id = ? AND pstd.session_no = ?`;

    hrmdb.query(checkEmpIdQuery, [emp_id, planing_id, session_no], (err, empResults) => {
        if (err) {
            console.error("Error checking Employee ID existence:", err);
            return res.status(500).json({ error: "Database error while checking Employee ID." });
        }

        if (empResults.length === 0) {
            return res.status(404).json({ message: "This training session is not associated with your employee ID." });
        }

        const { 
            trainee_name,
            trainee_department,
            feedback_form_answer, 
            attendance_status 
        } = empResults[0];

        // Optional: Check attendance status if needed
        // if (attendance_status !== 1) {
        //     return res.status(404).json({ message: "Your Employee ID has not been recorded as attended for this training session." });
        // }

        if (feedback_form_answer) {
            return res.status(400).json({ message: "Feedback form already submitted." });
        }

        // Return success with trainee data for auto-filling
        return res.status(200).json({ 
            message: "Please share your thoughts in the space provided below.",
            trainee_data: {
                trainee_name: trainee_name,
                trainee_department: trainee_department
            }
        });
    });
};

exports.submitFeedbackTrainee = (req, res) => {
    const { emp_id, planing_id, session_no, feedback_form_answer, feedback_form_comments_or_suggestions } = req.body;

    if (!emp_id || !feedback_form_answer) {
        return res.status(400).json({ error: "Missing Employee ID or feedback answers." });
    }

    const checkEmpIdQuery = `
        SELECT trainee_id, feedback_form_answer, attendance_status 
        FROM planing_session_trainee_data 
        WHERE trainee_id = ? AND planing_id = ? AND session_no = ?`;

    hrmdb.query(checkEmpIdQuery, [emp_id, planing_id, session_no], (err, empResults) => {
        if (err) {
            console.error("Error checking Employee ID existence:", err);
            return res.status(500).json({ error: "Database error while checking Employee ID." });
        }

        if (empResults.length === 0) {
            return res.status(404).json({ message: "You do not have access to this session." });
        }

        const { feedback_form_answer: existingFeedback, attendance_status } = empResults[0];

        if (attendance_status !== 1) {
            return res.status(404).json({ message: "Your Employee ID has not been recorded as attended for this training session." });
        }

        if (existingFeedback) {
            return res.status(400).json({ message: "Feedback form already submitted." });
        }

        // ── FIX: Added planing_id AND session_no to WHERE clause ──
        const updateFeedbackQuery = `
            UPDATE planing_session_trainee_data 
            SET feedback_form_answer = ?, 
                feedback_form_comments_or_suggestions = ?, 
                feedback_form_submition_date = NOW() 
            WHERE trainee_id = ? 
              AND planing_id = ? 
              AND session_no = ?`;

        const feedbackJson = JSON.stringify(feedback_form_answer);

        hrmdb.query(
            updateFeedbackQuery,
            [feedbackJson, feedback_form_comments_or_suggestions, emp_id, planing_id, session_no],
            (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Error updating feedback data:", updateErr);
                    return res.status(500).json({ error: "Database error while updating feedback data." });
                }
                return res.status(200).json({ message: "The feedback form was successfully submitted." });
            }
        );
    });
};


// ─────────────────────────────────────────────────────────────────────────────
exports.sendPendingFeedbackSubmissionEmailTraineeReport = async (req, res) => {
  const { planing_id, session_no } = req.body;
 
  if (!planing_id || !session_no) {
    return res.status(400).json({ error: "Missing required fields: planing_id or session_no." });
  }
 
  hrmdb.query(`SELECT user_name AS adminName, user_email AS adminEmail FROM planning_training_table WHERE id = ?`, [planing_id], (err, adminResult) => {
    if (err) return res.status(500).json({ error: "Error fetching admin details", details: err });
    if (adminResult.length === 0) return res.status(404).json({ error: "No admin details found." });
 
    const { adminName, adminEmail } = adminResult[0];
 
    hrmdb.query(`SELECT tt.training_topic FROM training_topic tt JOIN planning_training_table pt ON tt.id = pt.training_topic_id WHERE pt.id = ?`, [planing_id], (err, topicResult) => {
      if (err) return res.status(500).json({ error: "Error fetching training topic", details: err });
      if (topicResult.length === 0) return res.status(404).json({ error: "No training topic found." });
 
      const training_topic = topicResult[0].training_topic;
 
      hrmdb.query(`SELECT session_date, trainer_name FROM planing_sessions WHERE planing_id = ? AND session_no = ?`, [planing_id, session_no], (err, sessionResult) => {
        if (err) return res.status(500).json({ error: "Error fetching session details", details: err });
        if (sessionResult.length === 0) return res.status(404).json({ error: "No session details found." });
 
        const { session_date, trainer_name } = sessionResult[0];
        const formattedDate = new Date(session_date).toLocaleDateString('en-IN', {
          weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
        });
 
        hrmdb.query(`SELECT COUNT(feedback_form_answer) AS submittedCount, COUNT(*) AS totalTrainees FROM planing_session_trainee_data WHERE planing_id = ? AND session_no = ?`, [planing_id, session_no], async (err, feedbackResult) => {
          if (err) return res.status(500).json({ error: "Error fetching feedback data", details: err });
 
          const submittedCount = feedbackResult[0].submittedCount || 0;
          const totalTrainees = feedbackResult[0].totalTrainees;
          const pendingCount = totalTrainees - submittedCount;
          const completionPct = totalTrainees > 0 ? Math.round((submittedCount / totalTrainees) * 100) : 0;
 
          const bodyHtml = `
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding-bottom:20px;">
                <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:15px;color:#222222;line-height:1.7;">Dear <b style="color:#1A005D;">${adminName},</b></p>
                <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.8;">Please find below the feedback submission status report for the training session <b style="color:#1A005D;">${training_topic}</b>.</p>
              </td></tr>
              <tr><td style="padding-bottom:20px;">
                ${sessionDetailsTable([
                  ['&#127919; Topic', `<b>${training_topic}</b>`, 'font-weight:bold;'],
                  ['&#128197; Date', formattedDate],
                  ['&#127941; Trainer', trainer_name],
                  ['&#128203; Planning ID', String(planing_id)],
                ])}
              </td></tr>
              <tr><td style="padding-bottom:20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
                  <tr><td colspan="2" style="background-color:#1A005D;padding:10px 16px;">
                    <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">&#128202; Feedback Submission Report</span>
                  </td></tr>
                  <tr>
                    <td style="background-color:#f7f8ff;padding:14px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;width:36%;">Total Trainees</td>
                    <td style="background-color:#ffffff;padding:14px 16px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:20px;font-weight:bold;color:#1A005D;">${totalTrainees}</td>
                  </tr>
                  <tr>
                    <td style="background-color:#f7f8ff;padding:14px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#5A8A00;">&#9989; Completed</td>
                    <td style="background-color:#ffffff;padding:14px 16px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:20px;font-weight:bold;color:#5A8A00;">${submittedCount}</td>
                  </tr>
                  <tr>
                    <td style="background-color:#f7f8ff;padding:14px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#C0392B;">&#9888; Pending</td>
                    <td style="background-color:#ffffff;padding:14px 16px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:20px;font-weight:bold;color:#C0392B;">${pendingCount}</td>
                  </tr>
                  <tr>
                    <td style="background-color:#f7f8ff;padding:14px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128200; Completion</td>
                    <td style="background-color:#ffffff;padding:14px 16px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:20px;font-weight:bold;color:#1A005D;">${completionPct}%</td>
                  </tr>
                </table>
              </td></tr>
              ${pendingCount > 0 ? `
              <tr><td style="padding-bottom:20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #C0392B;">
                  <tr><td style="background-color:#C0392B;padding:10px 16px;">
                    <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">&#9888; Action Required</span>
                  </td></tr>
                  <tr><td style="background-color:#fff5f5;padding:14px 16px;border-left:4px solid #C0392B;">
                    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#922B21;line-height:1.7;"><b>${pendingCount} trainee(s)</b> have not yet submitted their feedback. Please follow up or send a reminder to ensure full completion.</p>
                  </td></tr>
                </table>
              </td></tr>` : `
              <tr><td style="padding-bottom:20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #5A8A00;">
                  <tr><td style="background-color:#5A8A00;padding:10px 16px;">
                    <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">&#9989; All Feedback Collected</span>
                  </td></tr>
                  <tr><td style="background-color:#f4fbea;padding:14px 16px;border-left:4px solid #5A8A00;">
                    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#3d6b00;line-height:1.7;">All trainees have submitted their feedback. No further action required.</p>
                  </td></tr>
                </table>
              </td></tr>`}
              ${ctaButton}
            </table>`;
 
          const emailBody = buildBrandedEmail({
            icon: '&#128202;',
            heading: 'Trainee Feedback Report',
            subheading: `Submission Status &mdash; <b style="color:#8EC400;">${training_topic}</b>`,
            bodyHtml,
          });
 
          try {
            await autoSendMail('', adminEmail, '', emailBody, `NEIN - Pending Feedback Submission Report for Training Session - ${training_topic}`);
            return res.status(200).json({ message: "Pending feedback submission report email sent successfully to admin." });
          } catch (emailError) {
            console.error("Failed to send email to admin:", emailError);
            return res.status(500).json({ error: "Failed to send email to admin", details: emailError.message });
          }
        });
      });
    });
  });
};


// Send feedback form emails to trainer
exports.sendFeedbackFormEmailTrainer = async (req, res) => {
  const { planing_id, session_no } = req.body;
 
  if (!planing_id || !session_no) {
    return res.status(400).json({ error: "Missing required fields..." });
  }
 
  try {
    const [topicResult] = await hrmdb.promise().query(`SELECT tt.training_topic FROM training_topic tt JOIN planning_training_table pt ON tt.id = pt.training_topic_id WHERE pt.id = ?`, [planing_id]);
    if (topicResult.length === 0) return res.status(404).json({ error: 'No training topic found.' });
    const training_topic = topicResult[0].training_topic;
 
    const [trainerResult] = await hrmdb.promise().query(`SELECT session_date, from_time, to_time, trainer_name, trainer_email, feedback_form_Assign_final_submit_date FROM planing_sessions WHERE planing_id = ? AND session_no = ?`, [planing_id, session_no]);
    if (trainerResult.length === 0) return res.status(404).json({ error: 'No trainer details found.' });
 
    const { session_date, from_time, to_time, trainer_name, trainer_email, feedback_form_Assign_final_submit_date } = trainerResult[0];
 
    const [traineesResult] = await hrmdb.promise().query(`SELECT COUNT(*) AS traineeCount FROM planing_session_trainee_data WHERE planing_id = ? AND session_no = ? AND calDeleteStatus = 0 AND attendance_status = 1`, [planing_id, session_no]);
    const traineeCount = traineesResult[0].traineeCount;
 
    const formattedDate = new Date(session_date).toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
    const fTime = from_time.substring(0, 5);
    const tTime = to_time.substring(0, 5);
 
    const finalDate = new Date(feedback_form_Assign_final_submit_date);
    const formattedDeadline = finalDate.toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    }) + ' ' + String(finalDate.getHours()).padStart(2, '0') + ':' + String(finalDate.getMinutes()).padStart(2, '0');
 
    const feedbackLink = `${indexPath.hostvariable}/planning-route/PlanningSessionTrainer/feedback/${encodeURIComponent(planing_id)}/${encodeURIComponent(session_no)}`;
 
    const bodyHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding-bottom:20px;">
          <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:15px;color:#222222;line-height:1.7;">Dear <b style="color:#1A005D;">${trainer_name},</b></p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.8;">As part of our commitment to continuous improvement, we kindly request your <b style="color:#1A005D;">valuable feedback</b> on the training session you recently conducted. Please take a few minutes to share your insights.</p>
        </td></tr>
        <tr><td style="padding-bottom:20px;">
          ${sessionDetailsTable([
            ['&#127919; Topic', `<b>${training_topic}</b>`, 'font-weight:bold;'],
            ['&#128197; Date', formattedDate],
            ['&#128336; Time', `<b>${fTime} &mdash; ${tTime}</b>`, 'font-weight:bold;'],
            ['&#128101; Trainees Attended', String(traineeCount)],
            ['&#9201; Feedback Deadline', `<b style="color:#C0392B;">${formattedDeadline}</b>`, 'font-weight:bold;color:#C0392B;'],
          ])}
        </td></tr>
        <tr><td align="center" style="padding-bottom:24px;">
          <a href="${feedbackLink}" target="_blank"
             style="display:inline-block;padding:14px 40px;background-color:#8EC400;color:#1A005D;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;border:2px solid #8EC400;">
            &#128203; Submit Trainer Feedback
          </a>
        </td></tr>
        ${ctaButton}
      </table>`;
 
    const emailBody = buildBrandedEmail({
      icon: '&#127941;',
      heading: 'Trainer Feedback Request',
      subheading: `Please share your session feedback &mdash; <b style="color:#8EC400;">${training_topic}</b>`,
      bodyHtml,
    });
 
    await autoSendMail('', trainer_email, '', emailBody, `NEIN - Feedback Form for Training Session: ${training_topic}`);
    return res.status(200).json({ message: 'Feedback form email sent successfully.' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
 


exports.FeedbackFormTrainer = (req, res, planing_id, session_no) => {
    console.log("Received parameters:", planing_id, session_no);

    if (!planing_id || !session_no) {
        return res.status(400).send('<h1>Missing required parameters: planing_id, session_no.</h1>');
    }

    const getTrainingTopicQuery = `
        SELECT tt.training_topic
        FROM planning_training_table pt
        JOIN training_topic tt ON pt.training_topic_id = tt.id
        WHERE pt.id = ?;
    `;

    // First, get the training topic
    hrmdb.query(getTrainingTopicQuery, [planing_id], (err, topicRows) => {
        if (err) {
            console.error('Error fetching training topic:', err);
            return res.status(500).send('<h1>Error fetching training topic. Please try again later.</h1>');
        }

        if (topicRows.length === 0) {
            return res.status(404).send('<h1>No training topic found.</h1>');
        }

        const trainingTopic = topicRows[0].training_topic;

        const checkFeedbackQuery = `
            SELECT feedback_form_Assign_final_submit_date, feedback_form_question, feedback_form_answer
            FROM planing_sessions
            WHERE planing_id = ? AND session_no = ? ;
        `;

        hrmdb.query(checkFeedbackQuery, [planing_id, session_no], (err, rows) => {
            if (err) {
                console.error('Error checking trainee feedback:', err);
                return res.status(500).send('<h1>Error checking feedback status. Please try again later.</h1>');
            }

            if (rows.length === 0) {
                return res.status(404).send('<h1>No feedback form available.</h1>');
            }

            const traineeData = rows[0];
            const { feedback_form_Assign_final_submit_date, feedback_form_question, feedback_form_answer } = traineeData;

            const now = new Date();
            const finalSubmitDate = new Date(feedback_form_Assign_final_submit_date);
            console.log("final date ", feedback_form_Assign_final_submit_date);
            console.log("now date ", now);

            if (now > finalSubmitDate) {
                return res.send(`
                    <h1 style="text-align: center; font-size: 18px; color: #FF0000; background-color: #FFE6E6; padding: 20px; border: 2px solid #FF0000; border-radius: 8px; margin: 20px auto; max-width: 600px;">
                        The form is now officially closed.
                    </h1>
                `);
            }

            let feedback_form_answer1 = feedback_form_answer ? feedback_form_answer.trim() : "";

            if (feedback_form_answer1 !== "") {
                return res.send(`
                    <h1 style="
                        text-align: center; 
                        font-size: 18px; 
                        color: #FF0000; 
                        background-color: #FFE6E6; 
                        padding: 20px; 
                        border: 2px solid #FF0000; 
                        border-radius: 8px; 
                        margin: 20px auto; 
                        max-width: 600px;">
                        Feedback form has already been submitted for this training session.
                    </h1>
                `);
            }

            const remainingTime = Math.floor((finalSubmitDate - now) / 1000);
            const days = Math.floor(remainingTime / (24 * 3600));
            const hours = Math.floor((remainingTime % (24 * 3600)) / 3600);
            const minutes = Math.floor((remainingTime % 3600) / 60);

            const formattedRemainingTime = `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;

            const trainingDetailsQuery = `
                    SELECT 
                        ps.trainer_name, 
                        ps.trainer_email, 
                        ps.trainer_code,
                        ps.session_date, 
                        ps.from_time, 
                        ps.to_time,
                        u.emp_id AS trainer_emp_id,
                        d.department_name AS trainer_department
                    FROM planing_sessions ps
                    LEFT JOIN leavemanagement.user u ON u.emp_id = ps.trainer_code
                    LEFT JOIN leavemanagement.department d ON d.department_id = u.department_id
                    WHERE ps.planing_id = ? AND ps.session_no = ?;
                `;

            hrmdb.query(trainingDetailsQuery, [planing_id, session_no], (err, trainingRows) => {
                if (err) {
                    console.error('Error fetching training details:', err);
                    return res.status(500).send('<h1>Failed to load feedback form. Please try again later.</h1>');
                }

                if (trainingRows.length === 0) {
                    return res.status(404).send('<h1>No feedback form available.</h1>');
                }

                const { 
                    trainer_name, trainer_email, trainer_code,
                    trainer_emp_id, trainer_department,
                    session_date: rawDate, from_time: rawFromTime, to_time: rawToTime 
                } = trainingRows[0];

                let training_date;
                if (rawDate instanceof Date) {
                    const day = String(rawDate.getDate()).padStart(2, '0');
                    const month = String(rawDate.getMonth() + 1).padStart(2, '0');
                    const year = rawDate.getFullYear();
                    training_date = `${day}/${month}/${year}`;
                } else if (typeof rawDate === 'string') {
                    const [year, month, day] = rawDate.split('-');
                    training_date = `${day}/${month}/${year}`;
                } else {
                    training_date = 'N/A';
                }

                const formatTime = (time) => {
                    const [hours, minutes] = time.split(':');
                    return `${hours}:${minutes}`;
                };
                const from_time = formatTime(rawFromTime);
                const to_time = formatTime(rawToTime);

                const feedbackQuestions = JSON.parse(traineeData.feedback_form_question);
                const questionList = Object.values(feedbackQuestions);

                res.send(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Trainer Feedback Form</title>
                        <style>
                            body { 
                                font-family: Arial, sans-serif; 
                                margin: 20px;
                                background-color: white;
                                font-size: 12px;
                            }
                            
                            .form-container {
                                width: 100%;
                                max-width: 8.5in;
                                margin: 0 auto;
                            }
                            
                            table {
                                border-collapse: collapse;
                                width: 100%;
                                border: 1px solid black;
                            }
                            
                            td {
                                border: 1px solid black;
                                padding: 5px;
                                vertical-align: top;
                            }
                            
                            /* Header specific styles */
                            .header-table {
                                margin-bottom: 20px;
                            }
                            
                            .header-table td {
                                padding: 4px;
                                border: 1px solid black;
                            }
                            
                            .logo-cell {
                                width: 20%;
                                text-align: center;
                                vertical-align: middle;
                            }
                            
                            .logo-cell img {
                                max-width: 100%;
                                max-height: 60px;
                            }
                            
                            .company-cell {
                                width: 20%;
                                font-weight: bold;
                                font-size: 16px;
                                 text-align: center;
                            }
                            
                            .form-title-cell {
                                width: 30%;
                                text-align: center;
                                vertical-align: middle;
                                font-size: 12px;
                                padding: 0;
                            }
                            
                                                        
                            .form-title-top {
                                border-bottom: 1px solid black;
                                padding: 6px;
                                font-weight: bold;
                            }

                            .form-title-bottom {
                                padding: 6px;
                                font-size: 15px;
                                font-weight: bold;
                            }
                            .form-title-main {
                                font-size: 16px;
                                font-weight: bold;
                                margin-top: 5px;
                            }
                            
                            .doc-info-cell {
                                width: 20%;
                                font-size: 11px;
                            }
                            
                            .doc-info-row {
                                display: flex;
                                justify-content: space-between;
                                margin-bottom: 3px;
                            }
                            
                            .doc-label {
                                font-weight: bold;
                            }
                            
                            /* Training info table */
                            .training-table {
                                width: 100%;
                                margin: 15px 0;
                                border: none !important;
                            }
                            
                            .training-table td {
                                border: none;
                                padding: 2px 5px;
                                vertical-align: bottom;
                            }
                            
                            .training-label {
                                font-weight: bold;
                                width: 120px;
                                padding-right: 10px;
                            }
                            
                            .training-content {
                                border-bottom: 1px solid black;
                                flex-grow: 1;
                                min-width: 300px;
                                padding-bottom: 3px;
                                margin-right: 20px;
                            }
                            
                            .training-time-label {
                                font-weight: bold;
                                width: 50px;
                                padding-right: 10px;
                            }
                            
                            .training-time {
                                border-bottom: 1px solid black;
                                width: 100px;
                                padding-bottom: 3px;
                            }
                            
                            .instruction {
                                font-style: italic;
                                margin: 10px 0;
                                font-size: 12px;
                            }
                            
                            /* Feedback table */
                            .feedback-table {
                                margin-top: 15px;
                            }
                            
                            .section-number {
                                width: 40px;
                                text-align: center;
                                font-weight: bold;
                                background-color: #f0f0f0;
                            }
                            
                            .section-title {
                                font-weight: bold;
                                background-color: #f0f0f0;
                                padding-left: 10px;
                            }
                            
                            .empty-cell {
                                width: 40px;
                                background-color: white;
                            }
                            
                            .question-cell {
                                padding-left: 30px !important;
                                width: 45%;
                            }
                            
                            .answer-cell {
                                padding: 0 !important;
                                width: 55%;
                            }
                            
                            .answer-cell textarea {
                                width: 100%;
                                min-height: 50px;
                                border: none;
                                outline: none;
                                resize: vertical;
                                font-family: Arial;
                                font-size: 12px;
                                padding: 8px;
                                box-sizing: border-box;
                            }
                            
                            /* Footer table */
                            .footer-table {
                                margin-top: 20px;
                            }
                            
                            .footer-label {
                                width: 30%;
                                font-weight: bold;
                                background-color: #f9f9f9;
                            }
                                .header-table{
                                    table-layout: fixed;
                                }

                                .logo-cell{ width: 18%; }
                                .center-title-cell{ width: 54%; }
                                .doc-info-cell{ width: 28%; }

                            
                            .footer-input {
                                padding: 0 !important;
                            }
                                .center-title-cell{
                                text-align:center;
                                font-weight:bold;
                                font-size:15px;
                            }

                            
                            .footer-input input {
                                width: 100%;
                                border: none;
                                outline: none;
                                font-size: 12px;
                                font-family: Arial;
                                padding: 8px;
                                box-sizing: border-box;
                                background: transparent;
                            }
                            
                            /* Submit button */
                            .btn-submit {
                                background-color: #4CAF50;
                                color: white;
                                border: none;
                                padding: 12px 24px;
                                font-size: 14px;
                                border-radius: 4px;
                                cursor: pointer;
                                display: block;
                                margin: 20px auto;
                                font-weight: bold;
                            }
                            
                            .response-message {
                                text-align: center;
                                font-size: 14px;
                                margin-top: 10px;
                                padding: 10px;
                                border-radius: 4px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="form-container">
                            <!-- Header Table - Exact match to image -->
                          <table class="header-table">
                                <tr>
                                    <!-- LOGO -->
                                    <td class="logo-cell" rowspan="3">
                                        <img src="/images/logo.png" alt="Nippon Express Logo">
                                    </td>

                                    <!-- CENTER BLOCK : COMPANY NAME -->
                                    <td class="center-title-cell">
                                        NIPPON EXPRESS (INDIA) PVT. LTD.
                                    </td>

                                    <!-- DOC INFO -->
                                    <td class="doc-info-cell" rowspan="3" style="padding:0;">
                                        <table style="width:100%; border-collapse:collapse; font-size:12px; table-layout:fixed;">
                                            <colgroup>
                                                <col style="width:50%">
                                                <col style="width:20%">
                                                <col style="width:30%">
                                            </colgroup>

                                            <tr>
                                                <td style="border:1px solid black;font-weight:bold;">Doc Ref</td>
                                                <td style="border:1px solid black;" colspan="2">NEIN/HRD/F/08</td>
                                            </tr>

                                            <tr>
                                                <td style="border:1px solid black;font-weight:bold;">Effective Date</td>
                                                <td style="border:1px solid black;" colspan="2">01-01-2026</td>
                                            </tr>

                                            <tr>
                                                <td style="border:1px solid black;font-weight:bold;">Rev No. & Date</td>
                                                <td style="border:1px solid black; text-align:center;">00</td>
                                                <td style="border:1px solid black;">01/01/2026</td>
                                            </tr>

                                            <tr>
                                                <td style="border:1px solid black;font-weight:bold;">Page No.</td>
                                                <td style="border:1px solid black;" colspan="2">1 OF 1</td>
                                            </tr>
                                        </table>

                                    </td>
                                </tr>

                                <tr>
                                    <!-- HRD TITLE -->
                                    <td class="center-title-cell" style="border-top:none;border-bottom:none;">
                                        HUMAN RESOURCE DEVELOPMENT
                                    </td>
                                </tr>

                                <tr>
                                    <!-- FORM TITLE -->
                                    <td class="center-title-cell">
                                        TRAINER'S FEEDBACK FORM
                                    </td>
                                </tr>
                            </table>



                            <!-- Training Information - Exactly like image -->
                            <table class="feedback-table">
                                <tr>
                                    <td class="training-label">Training Title:</td>
                                    <td class="training-content">${trainingTopic}</td>
                                    <td class="training-time-label">Date:</td>
                                    <td class="training-time">${training_date}</td>
                                </tr>
                                <tr>
                                    <td class="training-label">Trainer Name:</td>
                                    <td class="training-content">${trainer_name}</td>
                                    <td class="training-time-label">Time:</td>
                                    <td class="training-time">${from_time} - ${to_time}</td>
                                </tr>
                            </table>

                            <div class="instruction">
                                Please take a few moments to provide us with some important feedback about the training
                            </div>

                            <form id="feedbackForm">
                                <!-- Main Feedback Table -->
                                <table class="feedback-table">
                                    <tbody>
                                        <!-- Section 1 -->
                                        <tr>
                                            <td class="section-number">1</td>
                                            <td class="section-title" colspan="2">Overall, Session Feedback</td>
                                        </tr>
                                        <tr>
                                            <td class="empty-cell"></td>
                                            <td class="question-cell">a. ${questionList[0] || 'What went well during the session?'}</td>
                                            <td class="answer-cell">
                                                <textarea name="feedback_form_answer[q1]" data-id="q1" placeholder="Enter your answer here..."></textarea>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="empty-cell"></td>
                                            <td class="question-cell">b. ${questionList[1] || 'What could be improved in future sessions?'}</td>
                                            <td class="answer-cell">
                                                <textarea name="feedback_form_answer[q2]" data-id="q2" placeholder="Enter your answer here..."></textarea>
                                            </td>
                                        </tr>

                                        <!-- Section 2 -->
                                        <tr>
                                            <td class="section-number">2</td>
                                            <td class="section-title" colspan="2">Interaction & Participation Insights</td>
                                        </tr>
                                        <tr>
                                            <td class="empty-cell"></td>
                                            <td class="question-cell">a. ${questionList[2] || 'Did any participant take initiative or lead group interactions? If yes name them'}</td>
                                            <td class="answer-cell">
                                                <textarea name="feedback_form_answer[q3]" data-id="q3" placeholder="Enter your answer here..."></textarea>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="empty-cell"></td>
                                            <td class="question-cell">b. ${questionList[3] || 'Did you observe any barriers to participation (e.g., hesitation, lack of confidence, distractions)? If yes name them'}</td>
                                            <td class="answer-cell">
                                                <textarea name="feedback_form_answer[q4]" data-id="q4" placeholder="Enter your answer here..."></textarea>
                                            </td>
                                        </tr>

                                        <!-- Section 3 -->
                                        <tr>
                                            <td class="section-number">3</td>
                                            <td class="section-title" colspan="2">Participant with Excellent Involvement</td>
                                        </tr>
                                        <tr>
                                            <td class="empty-cell"></td>
                                            <td class="question-cell">a. ${questionList[4] || 'Who do you consider the best participant in this session? (Any 3 Names)'}</td>
                                            <td class="answer-cell">
                                                <textarea name="feedback_form_answer[q5]" data-id="q5" placeholder="Enter your answer here..."></textarea>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="empty-cell"></td>
                                            <td class="question-cell">b. ${questionList[5] || 'What qualities or actions made them stand out?'}</td>
                                            <td class="answer-cell">
                                                <textarea name="feedback_form_answer[q6]" data-id="q6" placeholder="Enter your answer here..."></textarea>
                                            </td>
                                        </tr>

                                        <!-- Section 4 -->
                                        <tr>
                                            <td class="section-number">4</td>
                                            <td class="section-title" colspan="2">Participant with Minimal Contribution</td>
                                        </tr>
                                        <tr>
                                            <td class="empty-cell"></td>
                                            <td class="question-cell">a. ${questionList[6] || 'Who do you consider the least engaged or Minimal Contributor in this session? (Any 3 Names).'}</td>
                                            <td class="answer-cell">
                                                <textarea name="feedback_form_answer[q7]" data-id="q7" placeholder="Enter your answer here..."></textarea>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="empty-cell"></td>
                                            <td class="question-cell">b. ${questionList[7] || 'What were the challenges faced with this participant?'}</td>
                                            <td class="answer-cell">
                                                <textarea name="feedback_form_answer[q8]" data-id="q8" placeholder="Enter your answer here..."></textarea>
                                            </td>
                                        </tr>

                                        <!-- Section 5 -->
                                        <tr>
                                            <td class="section-number">5</td>
                                            <td class="section-title" colspan="2">Suggestions for Improvement</td>
                                        </tr>
                                        <tr>
                                            <td class="empty-cell"></td>
                                            <td class="question-cell">a. ${questionList[8] || 'Are there any topics you suggest adding in future sessions?'}</td>
                                            <td class="answer-cell">
                                                <textarea name="feedback_form_answer[q9]" data-id="q9" placeholder="Enter your answer here..."></textarea>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                <!-- Footer Table -->
                                    <table class="footer-table">
                                        <tbody>
                                            <tr>
                                                <td class="footer-label">Name:</td>
                                                <td class="footer-input">
                                                    <input type="text" name="trainer_full_name" value="${trainer_name || ''}" readonly 
                                                        style="background:#f5f5f5; font-weight:bold;" />
                                                </td>
                                            </tr>
                                           <tr>
                                                <td class="footer-label">Employee No (If internal):</td>
                                                <td class="footer-input">
                                                    <input type="text" name="employee_no" 
                                                        value="${trainer_emp_id || trainer_code || ''}" 
                                                        readonly style="background:#f5f5f5; font-weight:bold;" />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="footer-label">Dept. Name (If internal):</td>
                                                <td class="footer-input">
                                                    <input type="text" name="department_name" 
                                                        value="${trainer_department || ''}" 
                                                        readonly style="background:#f5f5f5; font-weight:bold;" />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="footer-label">Date:</td>
                                                <td class="footer-input">
                                                    <input type="text" name="submission_date" value="${new Date().toLocaleDateString()}" readonly 
                                                        style="background:#f5f5f5; font-weight:bold;" />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="footer-label">Sign:</td>
                                                <td class="footer-input">
                                                    <input type="text" name="signature" value="${trainer_name || ''}" readonly 
                                                        style="background:#f5f5f5; font-weight:bold;" />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>

                                <button type="submit" class="btn-submit">Submit Feedback</button>
                                <div id="responseMessage" class="response-message"></div>
                            </form>
                        </div>

                        <script>
                            document.addEventListener("DOMContentLoaded", function () {
                                const planing_id = "${planing_id}";
                                const session_no = "${session_no}";

                                document.getElementById("feedbackForm").addEventListener("submit", async function (event) {
                                    event.preventDefault();

                                    const formData = {
                                        planing_id: planing_id,
                                        session_no: session_no,
                                        feedback_form_answer: {},
                                        trainer_details: {}
                                    };

                                    // Collect feedback answers
                                    const textareas = document.querySelectorAll('textarea[name^="feedback_form_answer"]');
                                    textareas.forEach(textarea => {
                                        const questionId = textarea.getAttribute('data-id');
                                        formData.feedback_form_answer[questionId] = textarea.value.trim();
                                    });

                                    // Collect trainer details
                                    formData.trainer_details = {
                                        trainer_name: document.querySelector('input[name="trainer_full_name"]').value,
                                        employee_no: document.querySelector('input[name="employee_no"]').value,
                                        department_name: document.querySelector('input[name="department_name"]').value,
                                        submission_date: document.querySelector('input[name="submission_date"]').value,
                                        signature: document.querySelector('input[name="signature"]').value
                                    };

                                    // Validate required fields
                                    const responseMessage = document.getElementById("responseMessage");
                                    let validationErrors = [];

                                    // Check if all textareas are filled
                                    textareas.forEach(textarea => {
                                        if (!textarea.value.trim()) {
                                            const questionId = textarea.getAttribute('data-id');
                                            validationErrors.push(\`Question \${questionId} is required\`);
                                        }
                                    });

                                    // Check signature
                                    if (!formData.trainer_details.signature) {
                                        validationErrors.push("Signature is required");
                                    }

                                    if (validationErrors.length > 0) {
                                        responseMessage.innerText = "Please fill in all required fields: " + validationErrors.join(", ");
                                        responseMessage.style.color = "red";
                                        responseMessage.style.backgroundColor = "#FFE6E6";
                                        responseMessage.style.display = "block";
                                        return;
                                    }

                                    try {
                                        const response = await fetch("/planning-route/PlanningSessionActiveTrainer/submitFeedbackTrainer", {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                            },
                                            body: JSON.stringify(formData),
                                        });

                                        const result = await response.json();
                                        console.log("API Result:", result);

                                        if (response.ok) {
                                            responseMessage.innerText = result.message || "Feedback submitted successfully!";
                                            responseMessage.style.color = "green";
                                            responseMessage.style.backgroundColor = "#E6FFE6";
                                            responseMessage.style.display = "block";

                                            // Reset form values after successful submission
                                            document.querySelectorAll('textarea').forEach(textarea => {
                                                textarea.value = "";
                                            });
                                            document.querySelectorAll('input[type="text"]:not([readonly])').forEach(input => {
                                                input.value = "";
                                            });
                                        } else {
                                            responseMessage.innerText = result.message || "An error occurred while submitting feedback.";
                                            responseMessage.style.color = "red";
                                            responseMessage.style.backgroundColor = "#FFE6E6";
                                            responseMessage.style.display = "block";
                                        }
                                    } catch (error) {
                                        console.error("Error submitting feedback:", error);
                                        responseMessage.innerText = "Failed to submit feedback. Please try again.";
                                        responseMessage.style.color = "red";
                                        responseMessage.style.backgroundColor = "#FFE6E6";
                                        responseMessage.style.display = "block";
                                    }
                                });
                            });
                        </script>
                    </body>
                    </html>
                `);
            });
        });
    });
};




exports.submitFeedbackTrainer = (req, res) => {
    const { planing_id, session_no, feedback_form_answer, feedback_form_comments_or_suggestions } = req.body;

    // Validate required fields
    if (!planing_id || !session_no || !feedback_form_answer) {
        return res.status(400).json({ error: "Missing required fields: Planing ID, Session No, or Feedback Answers." });
    }

    // Query to check if planing_id and session_no exist in the database
    const checkSessionQuery = `SELECT * FROM planing_sessions WHERE planing_id = ? AND session_no = ?`;

    hrmdb.query(checkSessionQuery, [planing_id, session_no], (err, sessionResults) => {
        if (err) {
            console.error("Error checking session existence:", err);
            return res.status(500).json({ error: "Database error while checking session details." });
        }

        if (sessionResults.length === 0) {
            // No session found with the provided planing_id and session_no
            return res.status(404).json({ message: "No session found for the given Planing ID and Session No." });
        }

        // Check if feedback has already been submitted for the given session
        const existingFeedback = sessionResults[0].feedback_form_answer;

        if (existingFeedback) {
            // Feedback already submitted for this session
            return res.status(400).json({ message: "Feedback form has already been submitted for this session." });
        }

        // Update the feedback_form_answer and feedback_form_comments_or_suggestions fields
        const updateFeedbackQuery = `
            UPDATE planing_sessions 
            SET feedback_form_answer = ?, 
                feedback_form_comments_or_suggestions = ?, 
                feedback_form_submition_date =  (NOW() )
            WHERE planing_id = ? AND session_no = ?
        `;

        const feedbackJson = JSON.stringify(feedback_form_answer);

        hrmdb.query(updateFeedbackQuery, [feedbackJson, feedback_form_comments_or_suggestions, planing_id, session_no], (updateErr, updateResult) => {
            if (updateErr) {
                console.error("Error updating feedback data:", updateErr);
                return res.status(500).json({ error: "Database error while updating feedback data." });
            }

            return res.status(200).json({ message: "Feedback submitted successfully!" });
        });
    });
};

// ─────────────────────────────────────────────────────────────────────────────
exports.sendPendingStatusFeedbackSubmissionEmailTrainer = async (req, res) => {
  const { planing_id, session_no } = req.body;
 
  if (!planing_id || !session_no) {
    return res.status(400).json({ error: "Missing required fields: planing_id or session_no." });
  }
 
  hrmdb.query(`SELECT user_name AS adminName, user_email AS adminEmail FROM planning_training_table WHERE id = ?`, [planing_id], (err, adminResult) => {
    if (err) return res.status(500).json({ error: "Error fetching admin details", details: err });
    if (adminResult.length === 0) return res.status(404).json({ error: "No admin details found." });
 
    const { adminName, adminEmail } = adminResult[0];
 
    hrmdb.query(`SELECT tt.training_topic FROM training_topic tt JOIN planning_training_table pt ON tt.id = pt.training_topic_id WHERE pt.id = ?`, [planing_id], (err, topicResult) => {
      if (err) return res.status(500).json({ error: "Error fetching training topic", details: err });
      if (topicResult.length === 0) return res.status(404).json({ error: "No training topic found." });
 
      const training_topic = topicResult[0].training_topic;
 
      hrmdb.query(`SELECT session_date, trainer_name FROM planing_sessions WHERE planing_id = ? AND session_no = ?`, [planing_id, session_no], (err, sessionResult) => {
        if (err) return res.status(500).json({ error: "Error fetching session details", details: err });
        if (sessionResult.length === 0) return res.status(404).json({ error: "No session details found." });
 
        const { session_date, trainer_name } = sessionResult[0];
        const formattedDate = new Date(session_date).toLocaleDateString('en-IN', {
          weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
        });
 
        hrmdb.query(`SELECT COUNT(*) AS submittedCount FROM planing_sessions WHERE feedback_form_answer IS NOT NULL AND planing_id = ? AND session_no = ?`, [planing_id, session_no], async (err, feedbackResult) => {
          if (err) return res.status(500).json({ error: "Error fetching feedback status", details: err });
 
          const submittedCount = feedbackResult[0].submittedCount || 0;
          const feedbackStatus = submittedCount === 0 ? 'Pending' : 'Completed';
          const statusColor = submittedCount === 0 ? '#C0392B' : '#5A8A00';
 
          const bodyHtml = `
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding-bottom:20px;">
                <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:15px;color:#222222;line-height:1.7;">Dear <b style="color:#1A005D;">${adminName},</b></p>
                <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.8;">Below is the trainer feedback submission status report for the training session <b style="color:#1A005D;">${training_topic}</b>.</p>
              </td></tr>
              <tr><td style="padding-bottom:20px;">
                ${sessionDetailsTable([
                  ['&#127919; Topic', `<b>${training_topic}</b>`, 'font-weight:bold;'],
                  ['&#128197; Date', formattedDate],
                  ['&#127941; Trainer', trainer_name],
                  ['&#128203; Planning ID', String(planing_id)],
                ])}
              </td></tr>
              <tr><td style="padding-bottom:20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
                  <tr><td colspan="2" style="background-color:#1A005D;padding:10px 16px;">
                    <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">&#128202; Trainer Feedback Status</span>
                  </td></tr>
                  <tr>
                    <td style="background-color:#f7f8ff;padding:14px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;width:36%;">&#127941; Trainer Name</td>
                    <td style="background-color:#ffffff;padding:14px 16px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;color:#222222;">${trainer_name}</td>
                  </tr>
                  <tr>
                    <td style="background-color:#f7f8ff;padding:14px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128203; Submission Status</td>
                    <td style="background-color:#ffffff;padding:14px 16px;border-top:1px solid #eaecf4;">
                      <table cellpadding="0" cellspacing="0" border="0"><tr>
                        <td style="background-color:${statusColor};padding:5px 18px;">
                          <span style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#ffffff;">${feedbackStatus}</span>
                        </td>
                      </tr></table>
                    </td>
                  </tr>
                </table>
              </td></tr>
              ${submittedCount === 0 ? `
              <tr><td style="padding-bottom:20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #C0392B;">
                  <tr><td style="background-color:#C0392B;padding:10px 16px;">
                    <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">&#9888; Action Required</span>
                  </td></tr>
                  <tr><td style="background-color:#fff5f5;padding:14px 16px;border-left:4px solid #C0392B;">
                    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#922B21;line-height:1.7;">The trainer has <b>not yet submitted</b> their feedback. Please follow up or send a reminder at the earliest.</p>
                  </td></tr>
                </table>
              </td></tr>` : ''}
              ${ctaButton}
            </table>`;
 
          const emailBody = buildBrandedEmail({
            icon: '&#128202;',
            heading: 'Trainer Feedback Status Report',
            subheading: `Submission Status &mdash; <b style="color:#8EC400;">${training_topic}</b>`,
            bodyHtml,
          });
 
          try {
            await autoSendMail('', adminEmail, '', emailBody, `NEIN - Pending Feedback Submission Report for Trainer - ${training_topic}`);
            return res.status(200).json({ message: "Pending feedback submission report email sent successfully to admin." });
          } catch (emailError) {
            console.error("Failed to send email to admin:", emailError);
            return res.status(500).json({ error: "Failed to send email to admin", details: emailError.message });
          }
        });
      });
    });
  });
};



// ─────────────────────────────────────────────────────────────────────────────
exports.sendPendingRemainderFeedbackSubmissionEmailTrainer = async (req, res) => {
  const { planing_id, session_no } = req.body;
 
  if (!planing_id || !session_no) {
    return res.status(400).json({ error: "Missing required fields..." });
  }
 
  try {
    const [topicResult] = await hrmdb.promise().query(`SELECT tt.training_topic FROM training_topic tt JOIN planning_training_table pt ON tt.id = pt.training_topic_id WHERE pt.id = ?`, [planing_id]);
    if (topicResult.length === 0) return res.status(404).json({ error: 'No training topic found.' });
    const training_topic = topicResult[0].training_topic;
 
    const [trainerResult] = await hrmdb.promise().query(`SELECT session_date, from_time, to_time, trainer_name, trainer_email, feedback_form_Assign_final_submit_date FROM planing_sessions WHERE planing_id = ? AND session_no = ?`, [planing_id, session_no]);
    if (trainerResult.length === 0) return res.status(404).json({ error: 'No trainer details found.' });
 
    const { session_date, from_time, to_time, trainer_name, trainer_email, feedback_form_Assign_final_submit_date } = trainerResult[0];
 
    const [traineesResult] = await hrmdb.promise().query(`SELECT COUNT(*) AS traineeCount FROM planing_session_trainee_data WHERE planing_id = ? AND session_no = ?`, [planing_id, session_no]);
    const traineeCount = traineesResult[0].traineeCount;
 
    const formattedDate = new Date(session_date).toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
    const fTime = from_time.substring(0, 5);
    const tTime = to_time.substring(0, 5);
 
    const finalDate = new Date(feedback_form_Assign_final_submit_date);
    const formattedDeadline = finalDate.toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    }) + ' ' + String(finalDate.getHours()).padStart(2, '0') + ':' + String(finalDate.getMinutes()).padStart(2, '0');
 
    const feedbackLink = `${indexPath.hostvariable}/planning-route/PlanningSessionTrainer/feedback/${encodeURIComponent(planing_id)}/${encodeURIComponent(session_no)}`;
 
    const bodyHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding-bottom:20px;">
          <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:15px;color:#222222;line-height:1.7;">Dear <b style="color:#1A005D;">${trainer_name},</b></p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.8;">We noticed that your feedback for the recent training session has <b style="color:#C0392B;">not yet been submitted</b>. Your insights are very valuable — please complete the form before the deadline.</p>
        </td></tr>
        <tr><td style="padding-bottom:20px;">
          ${sessionDetailsTable([
            ['&#127919; Topic', `<b>${training_topic}</b>`, 'font-weight:bold;'],
            ['&#128197; Date', formattedDate],
            ['&#128336; Time', `<b>${fTime} &mdash; ${tTime}</b>`, 'font-weight:bold;'],
            ['&#128101; Trainees', String(traineeCount)],
            ['&#9201; Deadline', `<b style="color:#C0392B;">${formattedDeadline}</b>`, 'font-weight:bold;color:#C0392B;'],
          ])}
        </td></tr>
        <tr><td style="padding-bottom:20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e67e22;">
            <tr><td style="background-color:#e67e22;padding:10px 16px;">
              <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">&#9888; Friendly Reminder</span>
            </td></tr>
            <tr><td style="background-color:#fff8f0;padding:14px 16px;border-left:4px solid #e67e22;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#7d4900;line-height:1.7;">Your feedback is still <b>pending</b>. Please submit before the deadline to ensure your valuable input is captured.</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding-bottom:24px;">
          <a href="${feedbackLink}" target="_blank"
             style="display:inline-block;padding:14px 40px;background-color:#e67e22;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;border:2px solid #e67e22;">
            &#128203; Submit Feedback Now
          </a>
        </td></tr>
        ${ctaButton}
      </table>`;
 
    const emailBody = buildBrandedEmail({
      icon: '&#9888;',
      headingColor: '#e67e22',
      heading: 'Trainer Feedback Pending — Reminder',
      subheading: `Feedback Reminder &mdash; <b style="color:#8EC400;">${training_topic}</b>`,
      bodyHtml,
    });
 
    await autoSendMail('', trainer_email, '', emailBody, `NEIN - Reminder: Feedback Form for Training Session: ${training_topic}`);
    return res.status(200).json({ message: 'Feedback reminder email sent successfully.' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};




// ─────────────────────────────────────────────────────────────────────────────
exports.sendTrainerNotificationEmail = (req, res) => {
  const { trainer_name, trainer_email, session_title, training_date, start_time, end_time, time_zone, location, duration, agenda } = req.body;
 
  if (!trainer_name || !trainer_email || !session_title || !training_date || !start_time || !end_time || !time_zone || !location || !duration || !agenda) {
    return res.status(400).json({ error: "Missing required fields for trainer notification email." });
  }
 
  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding-bottom:20px;">
        <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:15px;color:#222222;line-height:1.7;">Dear <b style="color:#1A005D;">${trainer_name},</b></p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.8;">We are pleased to inform you that you have been <b style="color:#1A005D;">selected as the Trainer</b> for the upcoming training session. Please find the details below and confirm your availability.</p>
      </td></tr>
      <tr><td style="padding-bottom:20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
          <tr><td colspan="2" style="background-color:#8EC400;padding:10px 16px;">
            <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#1A005D;text-transform:uppercase;letter-spacing:1px;">&#128203; Session Details</span>
          </td></tr>
          <tr>
            <td width="36%" style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#127919; Title</td>
            <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#222222;">${session_title}</td>
          </tr>
          <tr>
            <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128197; Date</td>
            <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;color:#222222;">${training_date}</td>
          </tr>
          <tr>
            <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128336; Time</td>
            <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#222222;">${start_time} &mdash; ${end_time} (${time_zone})</td>
          </tr>
          <tr>
            <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#127979; Location</td>
            <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;color:#222222;">${location}</td>
          </tr>
          <tr>
            <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#9202; Duration</td>
            <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;color:#222222;">${duration}</td>
          </tr>
          <tr>
            <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128203; Agenda</td>
            <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;color:#444444;line-height:1.6;">${agenda}</td>
          </tr>
        </table>
      </td></tr>
      ${ctaButton}
    </table>`;
 
  const emailBody = buildBrandedEmail({
    icon: '&#127941;',
    heading: "You've Been Selected as Trainer!",
    subheading: `Training Session Confirmation &mdash; <b style="color:#8EC400;">${session_title}</b>`,
    bodyHtml,
  });
 
  autoSendMail('', trainer_email, '', emailBody, `NEIN - L&D Training Session Confirmation - ${session_title}`)
    .then(() => res.status(200).json({ message: 'Trainer notification email sent successfully.' }))
    .catch((error) => res.status(500).json({ error: 'Failed to send trainer notification email', details: error.message }));
};


exports.sendTraineeCollectionNotificationEmailToTrainer = (req, res) => {
  const { coordinator_name, coordinator_email, trainer_name, session_title, training_date, training_time, location, branches } = req.body;
 
  if (!coordinator_name || !coordinator_email || !trainer_name || !session_title || !training_date || !training_time || !location || !branches) {
    return res.status(400).json({ error: "Missing required fields for trainee collection notification email." });
  }
 
  let totalCount = 0;
  let branchTableRows = branches.map((branch, index) => {
    totalCount += branch.trainee_count || 0;
    return `
      <tr>
        <td style="padding:10px 14px;text-align:center;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;color:#555555;background-color:#ffffff;">${index + 1}</td>
        <td style="padding:10px 14px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;color:#222222;background-color:#ffffff;">${branch.branch_name}</td>
        <td style="padding:10px 14px;text-align:center;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;background-color:#ffffff;">${branch.trainee_count || 0}</td>
      </tr>`;
  }).join('');
 
  branchTableRows += `
    <tr>
      <td colspan="2" style="padding:10px 14px;text-align:right;border-top:2px solid #1A005D;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;background-color:#f7f8ff;">Total Trainees:</td>
      <td style="padding:10px 14px;text-align:center;border-top:2px solid #1A005D;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;background-color:#1A005D;">${totalCount}</td>
    </tr>`;
 
  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding-bottom:20px;">
        <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:15px;color:#222222;line-height:1.7;">Dear <b style="color:#1A005D;">${coordinator_name},</b></p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.8;"><b style="color:#1A005D;">${trainer_name}</b> has selected you to <b style="color:#1A005D;">coordinate the trainee collection</b> for the upcoming training session. Please find the details and branch allocation below.</p>
      </td></tr>
      <tr><td style="padding-bottom:20px;">
        ${sessionDetailsTable([
          ['&#127919; Title', `<b>${session_title}</b>`, 'font-weight:bold;'],
          ['&#128197; Date', training_date],
          ['&#128336; Time', training_time],
          ['&#127979; Location', location],
        ])}
      </td></tr>
      <tr><td style="padding-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
          <tr><td colspan="3" style="background-color:#1A005D;padding:10px 16px;">
            <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">&#128101; Branch &amp; Trainee Allocation</span>
          </td></tr>
          <tr>
            <td style="background-color:#2a1070;padding:9px 14px;text-align:center;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">Sr.No</td>
            <td style="background-color:#2a1070;padding:9px 14px;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">Branch</td>
            <td style="background-color:#2a1070;padding:9px 14px;text-align:center;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">Tentative Count</td>
          </tr>
          ${branchTableRows}
        </table>
      </td></tr>
      ${ctaButton}
    </table>`;
 
  const emailBody = buildBrandedEmail({
    icon: '&#128203;',
    heading: 'Trainee Collection Assignment!',
    subheading: `Coordination Assignment &mdash; <b style="color:#8EC400;">${session_title}</b>`,
    bodyHtml,
  });
 
  autoSendMail('', coordinator_email, '', emailBody, `NEIN - L&D Notification of Trainee Collection Assignment`)
    .then(() => res.status(200).json({ message: 'Trainee collection notification email sent successfully.' }))
    .catch((error) => res.status(500).json({ error: 'Failed to send trainee collection notification email', details: error.message }));
};
 


exports.sendTrainingSelectionEmailToTrainee = (req, res) => {
  const { trainee_name, trainee_email, training_topic, training_date, start_time, end_time, training_type, coordinator_name, contact_email } = req.body;
 
  if (!trainee_name || !trainee_email || !training_topic || !training_date || !start_time || !end_time || !training_type || !coordinator_name || !contact_email) {
    return res.status(400).json({ error: "Missing required fields for training selection email." });
  }
 
  const isVirtual = training_type === 'Virtual';
 
  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding-bottom:20px;">
        <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:15px;color:#222222;line-height:1.7;">Dear <b style="color:#1A005D;">${trainee_name},</b></p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.8;">We are pleased to inform you that you have been <b style="color:#1A005D;">selected to participate</b> in the upcoming training session. Please mark your calendar and ensure your availability!</p>
      </td></tr>
      <tr><td style="padding-bottom:20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #dde0e8;">
          <tr><td colspan="2" style="background-color:#8EC400;padding:10px 16px;">
            <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#1A005D;text-transform:uppercase;letter-spacing:1px;">&#128203; Training Details</span>
          </td></tr>
          <tr>
            <td width="36%" style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#127919; Topic</td>
            <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#222222;">${training_topic}</td>
          </tr>
          <tr>
            <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128197; Date</td>
            <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;color:#222222;">${training_date}</td>
          </tr>
          <tr>
            <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">&#128336; Time</td>
            <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#222222;">${start_time} &mdash; ${end_time}</td>
          </tr>
          <tr>
            <td style="background-color:#f7f8ff;padding:11px 16px;border-top:1px solid #eaecf4;border-right:1px solid #eaecf4;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1A005D;">${isVirtual ? '&#128187;' : '&#127979;'} Mode</td>
            <td style="background-color:#ffffff;padding:11px 16px;border-top:1px solid #eaecf4;">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="background-color:${isVirtual ? '#005BAC' : '#5A8A00'};padding:4px 16px;">
                  <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">${training_type}</span>
                </td>
              </tr></table>
            </td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="padding-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #dde0e8;">
          <tr>
            <td width="5" style="background-color:#8EC400;font-size:0;">&nbsp;</td>
            <td style="background-color:#f7f8ff;padding:14px 18px;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#555555;line-height:1.7;">
                For queries, reach out to your coordinator:<br>
                <b style="color:#1A005D;">${coordinator_name}</b> &mdash;
                <a href="mailto:${contact_email}" style="color:#1A005D;font-weight:bold;text-decoration:none;">${contact_email}</a>
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
      ${ctaButton}
    </table>`;
 
  const emailBody = buildBrandedEmail({
    icon: '&#127891;',
    heading: "You've Been Nominated!",
    subheading: `Training Session Invitation &mdash; <b style="color:#8EC400;">${training_topic}</b>`,
    bodyHtml,
  });
 
  autoSendMail('', trainee_email, '', emailBody, `NEIN - L&D Selected for Training: ${training_topic}`)
    .then(() => res.status(200).json({ message: 'Training selection email sent successfully.' }))
    .catch((error) => res.status(500).json({ error: 'Failed to send training selection email', details: error.message }));
};









