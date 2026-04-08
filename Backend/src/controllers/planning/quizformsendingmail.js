const { hrmdb, leavemanagement } = require('../../../configuration/db');


exports.ValidateQuizForm = async (req, res) => {
    const { planing_id, session_no, trainee_id, quiz_form_validation_by, quiz_form_validation_result } = req.body;

    // Validate required fields
    if (!planing_id || !session_no || !trainee_id || !quiz_form_validation_by || !quiz_form_validation_result) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    const validateQuizFormQuery = `
        UPDATE planing_session_trainee_data 
        SET quiz_form_validation_by = ?,
            quiz_form_validation_result = ?,
            quiz_form_validation_date = NOW()
        WHERE planing_id = ? AND session_no = ? AND trainee_id = ?;
    `;

    hrmdb.query(validateQuizFormQuery, [quiz_form_validation_by, JSON.stringify(quiz_form_validation_result), planing_id, session_no, trainee_id], (err, result) => {
        if (err) {
            console.error("Error validating quiz form:", err);
            return res.status(500).json({ error: "Database error while validating quiz form." });
        }

        return res.status(200).json({ message: "Quiz form validated successfully." });
    });
};


exports.sendQuizFormEmailTrainee = async (req, res) => {
    const { planing_id, session_no } = req.body;

    // Define the base URL for your application
    const baseUrl = 'http://localhost:5000'; // Replace with your actual base URL or use environment variable

    // Validate required fields
    if (!planing_id || !session_no) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    const getTraineeEmailsQuery = `
        SELECT trainee_name, trainee_mail 
        FROM planing_session_trainee_data 
        WHERE planing_id = ? AND session_no = ?;
    `;

    hrmdb.query(getTraineeEmailsQuery, [planing_id, session_no], async (err, traineeEmails) => {
        if (err) {
            console.error("Error fetching trainee emails:", err);
            return res.status(500).json({ error: "Error fetching trainee emails", details: err });
        }

        if (traineeEmails.length === 0) {
            return res.status(404).json({ error: 'No trainees found for the given planing_id.' });
        }

        // Query to fetch the training topic
        const getTrainingTopicQuery = `
            SELECT tt.training_topic
            FROM training_topic tt
            JOIN planning_training_table pt ON tt.id = pt.training_topic_id
            WHERE pt.id = ?;
        `;

        hrmdb.query(getTrainingTopicQuery, [planing_id], async (err, trainingTopicResult) => {
            if (err) {
                console.error("Error fetching training topic:", err);
                return res.status(500).json({ error: "Error fetching training topic", details: err });
            }

            if (trainingTopicResult.length === 0) {
                return res.status(404).json({ error: 'No training topic found for the given planing_id.' });
            }

            const training_topic = trainingTopicResult[0].training_topic;

            // Simplified query to fetch the session details
            const getSessionDetailsQuery = `
                SELECT session_date, from_time, to_time, trainer_name
                FROM planing_sessions
                WHERE planing_id = ? AND session_no = ?;
            `;

            hrmdb.query(getSessionDetailsQuery, [planing_id, session_no], async (err, sessionDetails) => {
                if (err) {
                    console.error("Error fetching session details:", err);
                    return res.status(500).json({ error: "Error fetching session details", details: err });
                }

                if (sessionDetails.length === 0) {
                    return res.status(404).json({ error: 'No session details found for the given planing_id and session_no.' });
                }

                const { session_date, from_time, to_time, trainer_name } = sessionDetails[0];

                // Format the session date
                const formattedSessionDate = new Date(session_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                // Format the time (remove seconds)
                const formattedFromTime = new Date(`1970-01-01T${from_time}Z`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const formattedToTime = new Date(`1970-01-01T${to_time}Z`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                // Construct the quiz form link using the base URL
                const quizFormLink = `${baseUrl}/planning-route/PlanningSessionActiveAttendanceStatus/quiz/${encodeURIComponent(planing_id)}/${encodeURIComponent(session_no)}`;

                const emailPromises = traineeEmails.map(async (trainee) => {
                    const { trainee_name, trainee_mail } = trainee;

                    const emailBody = `
                        <p>Dear ${trainee_name},</p>
                        <p>We hope this message finds you well. As part of our training program, we kindly request you to complete the quiz for the recent training session associated with the following details:</p>
                        <p><b>Training Session Details:</b></p>
                        <ul>
                            <li><b>Title:</b> ${training_topic}</li>
                            <li><b>Planning ID:</b> ${planing_id}</li>
                            <li><b>Date:</b> ${formattedSessionDate} from ${formattedFromTime} to ${formattedToTime}</li>
                            <li><b>Trainer:</b> ${trainer_name}</li>
                        </ul>
                        <p>To complete the quiz, please click the link below:</p>
                        <p><a href="${quizFormLink}" target="_blank">Click here to complete the quiz</a></p>
                        <p>Your participation is essential for the success of our training program. We appreciate your time and effort.</p>
                        <p>Regards,<br>Auto System Generated (Nippon Express (India) Private Limited)</p>
                        <p><b>Note:</b> This is a system-generated email. Please do not reply to this email. For any clarifications, kindly contact the NEIN-DX Team.</p>
                    `;

                    const emailSubject = `NEIN - Quiz Form for Training Session - ${training_topic}`;

                    try {
                        await autoSendMail(
                            '', // From email is optional now, default will be used
                            trainee_mail, // To
                            '', // CC (Empty)
                            emailBody, // Body (HTML)
                            emailSubject // Subject
                        );
                    } catch (emailError) {
                        throw new Error(`Failed to send email to ${trainee_mail}`);
                    }
                });

                // Handle all email sending attempts
                try {
                    const results = await Promise.allSettled(emailPromises);
                    const failedEmails = results.filter(r => r.status === 'rejected');

                    if (failedEmails.length > 0) {
                        console.error('Some emails failed:', failedEmails);
                        return res.status(500).json({ 
                            error: 'Some emails failed to send', 
                            failedCount: failedEmails.length,
                            details: failedEmails.map(f => f.reason.message)
                        });
                    }

                    return res.status(200).json({ message: 'Emails sent successfully to all trainees.' });
                } catch (error) {
                    console.error('Unexpected error:', error);
                    return res.status(500).json({ error: 'Unexpected error while sending emails', details: error.message });
                }
            });
        });
    });
};



exports.QuizFormTrainee = (req, res, planing_id, session_no) => {
    console.log("Received parameters:", planing_id, session_no);

    if (!planing_id || !session_no) {
        return res.status(400).send('<h1>Missing required parameters: planing_id, session_no</h1>');
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

        const checkQuizQuery = `
            SELECT trainee_id, quiz_form_Assign_final_submit_date, quiz_form_question, quiz_form_answer
            FROM planing_session_trainee_data
            WHERE planing_id = ? AND session_no = ?;
        `;

        hrmdb.query(checkQuizQuery, [planing_id, session_no], (err, rows) => {
            if (err) {
                console.error('Error checking trainee quiz:', err);
                return res.status(500).send('<h1>Error checking quiz status. Please try again later.</h1>');
            }

            if (rows.length === 0) {
                return res.status(404).send('<h1>No quiz form available.</h1>');
            }

            const traineeData = rows[0];
            const { quiz_form_Assign_final_submit_date, quiz_form_question, quiz_form_answer } = traineeData;

            const now = new Date();
            const finalSubmitDate = new Date(quiz_form_Assign_final_submit_date);

            if (now > finalSubmitDate) {
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
                        The quiz form is now officially closed.
                    </h1>
                `);
            }

            const remainingTime = Math.floor((finalSubmitDate - now) / 1000); // Remaining time in seconds
            const days = Math.floor(remainingTime / (24 * 3600)); // Calculate days
            const hours = Math.floor((remainingTime % (24 * 3600)) / 3600); // Remaining hours after removing days
            const minutes = Math.floor((remainingTime % 3600) / 60); // Remaining minutes after removing hours

            // Display the time in "X days, Y hours, Z minutes" format
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
                    return res.status(500).send('<h1>Failed to load quiz form. Please try again later.</h1>');
                }

                if (trainingRows.length === 0) {
                    return res.status(404).send('<h1>No quiz form available.</h1>');
                }

                const { trainer_name, session_date: rawDate, from_time: rawFromTime, to_time: rawToTime } = trainingRows[0];

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

                // Parse quiz questions
                const quizQuestions = JSON.parse(traineeData.quiz_form_question);

                res.send(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Training Trainee Quiz Form</title>
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
                                text-align: center;
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
                            textarea {
                                width: 100%;
                                height: 100px;
                                margin-top: 1px;
                                padding: 10px;
                                font-size: 14px;
                                border: 1px solid #000;
                                border-radius: 4px;
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
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <img src="/images/logo.png" alt="Nippon Express Logo">
                                <div class="title">
                                    <h1>Training Session Trainee Quiz Form</h1>
                                    <h1>- Human Resource Development</h1>
                                </div>
                                <div class="details">
                                    <label for="emp_id"><strong>Employee ID:</strong></label>
                                    <input type="text" id="emp_id" name="emp_id" placeholder="Enter Employee ID">
                                    <p id="empIdStatus" style="color: red;">Please enter Employee ID</p>
                                </div>
                            </div>
                            <div class="training-details">
                                <p><strong>Training Title:</strong> ${trainingTopic}</p>
                                <p><strong>Trainer Name:</strong> ${trainer_name}</p>
                                <p><strong>Date:</strong> ${training_date}</p>
                                <p><strong>Time:</strong> ${from_time} to ${to_time}</p>
                                <p>Please take a few moments to complete the quiz for the training session.</p>
                                <p><b>Note:</b> The quiz will close in ${formattedRemainingTime}.</p>
                            </div>
                            <form id="quizForm">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Question</th>
                                            <th>Options</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${Object.entries(quizQuestions)
                                            .map(
                                                ([id, question], index) => `
                                                <tr>
                                                    <td>${index + 1}. ${question.question}</td>
                                                    <td>
                                                        ${question.options.map((option, i) => `
                                                            <input type="radio" name="quiz_form_answer[${id}]" data-id="${id}" value="${option}"> ${option}
                                                        `).join('<br>')}
                                                    </td>
                                                </tr>
                                            `
                                            )
                                            .join("")}
                                    </tbody>
                                </table>
                                <br>
                                <p>Please share with us any additional comments or suggestions:</p>
                                <textarea id="comments" name="comments" placeholder="Enter your comments or suggestions"></textarea>
                                <button type="submit" class="btn-submit">Submit</button>
                            </form>
                            <p id="responseMessage" style="text-align: center; font-size: 16px; margin-top: 10px;"></p>
                        </div>

                        <script>
                            // Employee ID validation on input change
                            document.getElementById("emp_id").addEventListener("input", async function () {
                                const emp_id = document.getElementById("emp_id").value.trim();
                                const empIdStatus = document.getElementById("empIdStatus");

                                if (emp_id === "") {
                                    empIdStatus.innerText = "Employee ID is pending";
                                    empIdStatus.style.color = "black";
                                } else {
                                    try {
                                        const validationResponse = await fetch("/planning-route/PlanningSessionActiveTrainees/QuizTraineeDataCheckPoint", {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                            },
                                            body: JSON.stringify({ emp_id }),
                                        });

                                        const validationResult = await validationResponse.json();

                                        if (validationResult.message === "You can enter details of your quiz" || validationResult.message === "Quiz form already submitted.") {
                                            empIdStatus.innerText = validationResult.message;
                                            empIdStatus.style.color = "green";
                                        } else if (!validationResponse.ok || !validationResult.isValid) {
                                            empIdStatus.innerText = validationResult.message || "Invalid Employee ID!";
                                            empIdStatus.style.color = "red";
                                        } else {
                                            empIdStatus.innerText = validationResult.message;
                                            empIdStatus.style.color = "black";
                                        }
                                    } catch (error) {
                                        console.error("Error during emp_id validation:", error);
                                        empIdStatus.innerText = "Failed to validate Employee ID. Please try again.";
                                        empIdStatus.style.color = "red";
                                    }
                                }
                            });

                            document.getElementById("quizForm").addEventListener("submit", async function (event) {
                                event.preventDefault(); // Prevent form submission

                                const emp_id = document.getElementById("emp_id").value.trim();
                                const comments = document.getElementById("comments").value.trim();
                                const quiz = {};
                                let missingAnswers = []; // Array to store the question IDs of unanswered questions

                                // Iterate over all quiz questions to ensure every question is included in the quiz
                                document.querySelectorAll("input[type='radio']").forEach((input) => {
                                    const questionId = input.getAttribute("data-id"); // Get the question ID using data-id
                                    if (input.checked) {
                                        quiz[questionId] = input.value; // Store the value if the radio button is selected
                                    } else if (!quiz[questionId]) {
                                        quiz[questionId] = ""; // Ensure every question has an entry, even if not answered
                                        missingAnswers.push(questionId); // Add the unanswered question to the list
                                    }
                                });

                                // Log quiz to the console for debugging
                                console.log("Quiz Form Answer:", quiz);

                                // Validate inputs
                                const responseMessage = document.getElementById("responseMessage");
                                if (!emp_id) {
                                    responseMessage.innerText = "Employee ID is required!";
                                    responseMessage.style.color = "red";
                                    return;
                                }

                                // If there are missing answers, show an error message
                                if (missingAnswers.length > 0) {
                                    responseMessage.innerText = "Please provide answers to all the questions.";
                                    responseMessage.style.color = "red";
                                    return;
                                }

                                // Step 2: Proceed to submit quiz only after validating emp_id and ensuring all questions are answered
                                try {
                                    const response = await fetch("/planning-route/PlanningSessionActiveTrainees/submitQuizTrainee", {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                            emp_id: emp_id,
                                            quiz_form_answer: quiz, // quiz contains question IDs and their corresponding answers
                                            quiz_form_comments_or_suggestions: comments
                                        }),
                                    });

                                    const result = await response.json();

                                    // Display response message based on submission result
                                    if (response.ok) {
                                        responseMessage.innerText = result.message || "Quiz submitted successfully!";
                                        responseMessage.style.color = "green";

                                        // Reset form values after successful submission
                                        document.getElementById("emp_id").value = "";
                                        document.getElementById("comments").value = "";
                                        document.querySelectorAll("input[type='radio']").forEach((input) => {
                                            input.checked = false;
                                        });

                                        // Reset employee ID status message
                                        document.getElementById("empIdStatus").innerText = "Employee ID is pending";
                                        document.getElementById("empIdStatus").style.color = "red";
                                    } else {
                                        responseMessage.innerText = result.message || "An error occurred while submitting quiz.";
                                        responseMessage.style.color = "red";
                                    }
                                } catch (error) {
                                    console.error("Error:", error);
                                    responseMessage.innerText = "Failed to submit quiz. Please try again.";
                                    responseMessage.style.color = "red";
                                }
                            });
                        </script>
                    </body>
                    </html>
                `);
            });
        });
    });
};

exports.submitQuizTrainee = (req, res) => {
    const { emp_id, quiz_form_answer, quiz_form_comments_or_suggestions } = req.body;

    // Validate required fields
    if (!emp_id || !quiz_form_answer) {
        return res.status(400).json({ error: "Missing Employee ID or quiz answers." });
    }

    // Query to check if emp_id exists in the database
    const checkEmpIdQuery = `SELECT * FROM planing_session_trainee_data WHERE trainee_id = ?`;

    hrmdb.query(checkEmpIdQuery, [emp_id], (err, empResults) => {
        if (err) {
            console.error("Error checking Employee ID existence:", err);
            return res.status(500).json({ error: "Database error while checking Employee ID." });
        }

        if (empResults.length === 0) {
            // Employee ID not found
            return res.status(404).json({ message: "Your Employee ID is not assigned to this training session. Kindly verify the details with your trainer." });
        }

        // Employee ID exists, check if quiz_form_answer already exists
        const existingQuiz = empResults[0].quiz_form_answer;

        if (existingQuiz) {
            // Quiz already submitted
            return res.status(400).json({ message: "Quiz form already submitted." });
        }

        // Update the quiz_form_answer field with the provided quiz answers
        const updateQuizQuery = `
            UPDATE planing_session_trainee_data 
            SET quiz_form_answer = ?,
                quiz_form_comments_or_suggestions = ?,
                quiz_form_submition_date = NOW() 
            WHERE trainee_id = ?
        `;

        const quizJson = JSON.stringify(quiz_form_answer);

        hrmdb.query(updateQuizQuery, [quizJson, quiz_form_comments_or_suggestions, emp_id], (updateErr, updateResult) => {
            if (updateErr) {
                console.error("Error updating quiz data:", updateErr);
                return res.status(500).json({ error: "Database error while updating quiz data." });
            }

            return res.status(200).json({ message: "Quiz form successfully submitted." });
        });
    });
};

