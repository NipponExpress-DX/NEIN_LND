const { hrmdb ,leavemanagement} = require('../../../configuration/db');
const autoSendMail = require('./../../controllers/planning/sendmail'); // Ensure this is implemented
const express = require('express');
const router = express.Router();
const path = require('path');



exports.sendFeedbackFormEmailTrainee = async () => {
    const planing_id = '2';
    const session_no = '1';

    console.log(`Processing feedback emails for Plan ID: ${planing_id}, Session: ${session_no}`);

    const getTraineeEmailsQuery = `
        SELECT trainee_mail 
        FROM planing_session_trainee_data 
        WHERE planing_id = ? AND session_no = ?`;

    hrmdb.query(getTraineeEmailsQuery, [planing_id, session_no], async (err, traineeEmails) => {
        if (err) {
            console.error("Error fetching trainee emails:", err);
            return;
        }

        if (traineeEmails.length === 0) {
            console.log('No trainees found for the given planing_id.');
            return;
        }

        const generateFeedbackFormLink = (planing_id, session_no) => {
            return `http://localhost:5000/planning-route/PlanningSessionActiveAttendanceStatus/feedback/${encodeURIComponent(planing_id)}/${encodeURIComponent(session_no)}`;
        };

        const emailPromises = traineeEmails.map(async (trainee) => {
            const { trainee_mail } = trainee;
            const feedbackFormLink = generateFeedbackFormLink(planing_id, session_no);
            const emailBody = `
                <p>Dear Trainee,</p>
                <p>You are requested to provide your feedback for the training session associated with Planning ID: <b>${planing_id}</b>.</p>
                <p><a href="${feedbackFormLink}" target="_blank">Click here to provide feedback</a></p>
                <p>Thank you for your participation!</p>
                <p>Regards,<br>Auto system generated</p>
                <p><b>Note:</b> This is a system-generated email, and you shouldn’t reply to this email.</p>
            `;

            const emailSubject = `Feedback Form for Training (Planning ID: ${planing_id})`;

            try {
                await autoSendMail(
                    'noreply.nein@nipponexpress.com', 
                    trainee_mail, 
                    '', 
                    emailBody, 
                    emailSubject
                );
                console.log(`Email sent successfully to: ${trainee_mail}`);
            } catch (emailError) {
                console.error(`Error sending email to ${trainee_mail}:`, emailError);
            }
        });

        await Promise.all(emailPromises);
        console.log('All emails processed.');
    });
};

// Schedule the function with a counter to stop after `maxRuns`
// const scheduleEmailSending = () => {
//     const cronExpression = '*/2 * * * *'; // Every 2 minutes
//     console.log(`Scheduler set to run every 2 minutes with max ${maxRuns} runs.`);

//     const job = schedule.scheduleJob(cronExpression, async () => {
//         try {
//             console.log('Job started at:', new Date());

//             const req = { body: { planing_id: '2', session_no: '1' } };
//             const res = {
//                 status: (code) => ({
//                     json: (data) => {
//                         console.log(`Response: ${code}`, data);
//                     },
//                 }),
//             };

//             // Execute the function
//             await exports.sendFeedbackFormEmailTrainee(req, res);

//             // Increment counter and stop the job after maxRuns
//             counter++;
//             if (counter >= maxRuns) {
//                 console.log('Stopping scheduler after', maxRuns, 'runs.');
//                 job.cancel();
//             }
//         } catch (error) {
//             console.error('Error in scheduled job:', error);
//         }
//     });
// };


// // Call the scheduler function
// scheduleEmailSending();
