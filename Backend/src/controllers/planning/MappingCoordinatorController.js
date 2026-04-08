const { hrmdb } = require('../../../configuration/db');
const autoSendMail = require('./sendmail');
const nodemailer = require('nodemailer');



// Function to get Coordinator Session Active List count
exports.CoordinatorSessionActiveListCount= (req, res) => {
    const { planing_id ,session_no,coordinator_emp_id,branch,department} = req.body;

    if (!planing_id) {
        return res.status(400).json({ error: 'Missing required fields: planing_id' });
    }

    const getAllQuery = `SELECT count(*) As Coordinator_added_count
                         FROM planing_session_trainee_data
                         WHERE planing_id = ? and session_no = ? and coordinator_emp_id = ? and branch = ? and department = ?
                         ORDER BY id ASC`;
    hrmdb.query(getAllQuery, [planing_id,session_no,coordinator_emp_id,branch,department], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ coordinators: results });
    });
};

// Function to get all Coordinator Session Active List
exports.CoordinatorSessionActiveList= (req, res) => {
    const { planing_id } = req.body;

    if (!planing_id) {
        return res.status(400).json({ error: 'Missing required fields: planing_id' });
    }

    const getAllQuery = `SELECT *
                         FROM planing_mapping_coordinator 
                         WHERE planing_id = ? 
                         ORDER BY id ASC`;
    hrmdb.query(getAllQuery, [planing_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ coordinators: results });
    });
};


// Function to insert Mapping Coordinator information into the planing_mapping_coordinator table
exports.addMappingCoordinator = (req, res) => {
    const {
        planing_id,
        emp_id,
        coordinator_type,
        session_no,
        branch,
        department,
        coordinator_emp_id,
        coordinator_name,
        coordinator_email,
        mail_sending_status,
        apprx_trainee_count,
    } = req.body;

    console.log("body in add coordinator",req.body);

    // Validate required fields
    if (
        !planing_id || !emp_id || !coordinator_type || !session_no ||
        !coordinator_name || typeof apprx_trainee_count === 'undefined'
    ) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    // Query to insert into planing_mapping_coordinator
    const insertCoordinatorQuery = `
        INSERT INTO planing_mapping_coordinator (
            planing_id, emp_id, coordinator_type, session_no, branch, department,
            coordinator_emp_id, coordinator_name, coordinator_email, mail_sending_status, apprx_trainee_count, date_created
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    hrmdb.query(
        insertCoordinatorQuery,
        [
            planing_id, emp_id, coordinator_type, session_no, branch, department,
            coordinator_emp_id, coordinator_name, coordinator_email, mail_sending_status, apprx_trainee_count
        ],
        (insertErr, insertResult) => {
            if (insertErr) {
                console.error("Failed to insert session information:", insertErr);
                return res.status(500).json({ error: "Failed to insert planing mapping coordinator information", details: insertErr });
            }

            // Get the `id` of the inserted record
            const PMC_Id = insertResult.insertId;

            // Query to insert into planing_mapping_coordinator_history
            const insertHistoryQuery = `
                INSERT INTO planing_mapping_coordinator_history (
                    id, planing_id, emp_id, coordinator_type, session_no, branch, department,
                    coordinator_emp_id, coordinator_name, coordinator_email, mail_sending_status, apprx_trainee_count, date_created, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
            `;

            hrmdb.query(
                insertHistoryQuery,
                [
                    PMC_Id, planing_id, emp_id, coordinator_type, session_no, branch, department,
                    coordinator_emp_id, coordinator_name, coordinator_email, mail_sending_status, apprx_trainee_count, "insert"
                ],
                (historyErr) => {
                    if (historyErr) {
                        console.error("Failed to insert planing mapping coordinator history:", historyErr);
                        return res.status(500).json({ error: "Failed to insert planing mapping coordinator history", details: historyErr });
                    }

                    return res.status(201).json({ message: "planing mapping coordinator information added successfully." });
                }
            );
        }
    );
};

// Function to update Mapping Coordinator information
exports.updateMappingCoordinator = (req, res) => {
    const {
        id,
        planing_id,
        emp_id,
        coordinator_type,
        session_no,
        branch,
        department,
        coordinator_emp_id,
        coordinator_name,
        coordinator_email,
        mail_sending_status,
        apprx_trainee_count,
    } = req.body;

    // Validate required fields
    if (!id ||!planing_id || !session_no) {
        return res.status(400).json({ error: "ID,planing_id and session_no are required." });
    }

    // Select the existing record to verify it exists
    const selectQuery = `SELECT id FROM planing_mapping_coordinator WHERE planing_id = ? AND session_no = ? AND id=?`;

    hrmdb.query(selectQuery, [planing_id, session_no,id], (selectErr, results) => {
        if (selectErr) {
            console.error("Failed to retrieve planing mapping coordinator information:", selectErr);
            return res.status(500).json({ error: "Failed to retrieve planing mapping coordinator information", details: selectErr });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "planing mapping coordinator id not found." });
        }

        // Extract the session ID
        const PMC_Id = results[0].id;

        // Update the `planing_mapping_coordinator` table
        const updateQuery = `
            UPDATE planing_mapping_coordinator 
            SET emp_id = ?, coordinator_type = ?, branch = ?, department = ?,
                coordinator_emp_id = ?, coordinator_name = ?, coordinator_email = ?, 
                mail_sending_status = ?, apprx_trainee_count = ?, date_created = NOW()
            WHERE planing_id = ? AND session_no = ? AND id=?
        `;

        hrmdb.query(
            updateQuery,
            [
                emp_id, coordinator_type, branch, department, coordinator_emp_id, coordinator_name,
                coordinator_email, mail_sending_status, apprx_trainee_count, planing_id, session_no,id
            ],
            (updateErr) => {
                if (updateErr) {
                    console.error("Failed to update planing mapping coordinator information:", updateErr);
                    return res.status(500).json({ error: "Failed to update planing mapping coordinator information", details: updateErr });
                }

                // Insert the updated record into the `planing_mapping_coordinator_history` table
                const insertHistoryQuery = `
                    INSERT INTO planing_mapping_coordinator_history (
                        id, planing_id, emp_id, coordinator_type, session_no, branch, department,
                        coordinator_emp_id, coordinator_name, coordinator_email, mail_sending_status, apprx_trainee_count, date_created, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
                `;

                hrmdb.query(
                    insertHistoryQuery,
                    [
                        PMC_Id, planing_id, emp_id, coordinator_type, session_no, branch, department,
                        coordinator_emp_id, coordinator_name, coordinator_email, mail_sending_status, apprx_trainee_count, "updated"
                    ],
                    (historyErr) => {
                        if (historyErr) {
                            console.error("Failed to insert planing mapping coordinator history:", historyErr);
                            return res.status(500).json({ error: "Failed to insert planing mapping coordinator history", details: historyErr });
                        }

                        return res.status(200).json({ message: "planing mapping coordinator information updated successfully." });
                    }
                );
            }
        );
    });
};

// Function to delete Mapping Coordinator information
exports.deleteMappingCoordinator = (req, res) => {
    const {id, planing_id, session_no } = req.body;

    // Validate required fields
    if (!planing_id || !session_no) {
        return res.status(400).json({ error: "id,planing_id and session_no are required." });
    }

    // Query to check if the session exists
    const selectQuery = `SELECT * FROM planing_mapping_coordinator WHERE planing_id = ? AND session_no = ? AND id=?`;

    hrmdb.query(selectQuery, [planing_id, session_no,id], (selectErr, results) => {
        if (selectErr) {
            console.error("Failed to select planing mapping coordinator information:", selectErr);
            return res.status(500).json({ error: "Failed to retrieve planing mapping coordinator information", details: selectErr });
        }

        // If no session is found
        if (results.length === 0) {
            return res.status(404).json({ error: "planing mapping coordinator id not found." });
        }

        // Extract the session data
        const sessionData = results[0];
        const {
            id, // Include the session ID for history
            emp_id,
            coordinator_type,
            branch,
            department,
            coordinator_emp_id,
            coordinator_name,
            coordinator_email,
            mail_sending_status,
            apprx_trainee_count,
        } = sessionData;

        // Insert the session data into the history table
        const insertHistoryQuery = `
            INSERT INTO planing_mapping_coordinator_history (
                id, planing_id, emp_id, coordinator_type, session_no, branch, department,
                coordinator_emp_id, coordinator_name, coordinator_email, mail_sending_status, apprx_trainee_count, date_created, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        `;

        hrmdb.query(
            insertHistoryQuery,
            [
                id, planing_id, emp_id, coordinator_type, session_no, branch, department,
                coordinator_emp_id, coordinator_name, coordinator_email, mail_sending_status,
                apprx_trainee_count, "deleted"
            ],
            (historyErr) => {
                if (historyErr) {
                    console.error("Failed to insert planing mapping coordinator history:", historyErr);
                    return res.status(500).json({ error: "Failed to insert planing mapping coordinator history", details: historyErr });
                }

                // Proceed to delete the session record
                const deleteQuery = `DELETE FROM planing_mapping_coordinator WHERE planing_id = ? AND session_no = ? AND id=?`;

                hrmdb.query(deleteQuery, [planing_id, session_no,id], (deleteErr) => {
                    if (deleteErr) {
                        console.error("Failed to delete planing mapping coordinator information:", deleteErr);
                        return res.status(500).json({ error: "Failed to delete planing mapping coordinator information", details: deleteErr });
                    }

                    return res.status(200).json({ message: "planing mapping coordinator deleted successfully." });
                });
            }
        );
    });
};




// View session Details  with planing id

exports.ViewMappingCoordinatorDetails = (req, res) => {
    const { planing_id } = req.body;

    // Check for required fields
    if (!planing_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Query to check if the record exists
    const getIdRelativeInfo = `SELECT  *
                         FROM planing_mapping_coordinator 
                         WHERE planing_id = ? 
                         ORDER BY id ASC`;

    hrmdb.query(getIdRelativeInfo, [planing_id], (checkErr, results) => {
        if (checkErr) {
            console.error('Database error:', checkErr);
            return res.status(500).json({ error: 'Database error', details: checkErr });
        }

        // Check if no records were found
        if (results.length === 0) {
            return res.status(404).json({ error: 'Record with the given ID not found.' });
        }

        // Log and send the results
        console.log('Query Results:', results); // For debugging
        return res.status(200).json({ success: true, data: results });
    });
};





// Function to send email after inserting mapping coordinator
exports.sendCoordinatorEmail = async (req, res) => {
    const { planing_id } = req.body;

    if (!planing_id) {
        return res.status(400).json({ error: 'Missing required field: planing_id' });
    }

    const getAllQuery = `SELECT planing_id, session_no, coordinator_name, coordinator_email, apprx_trainee_count
                         FROM planing_mapping_coordinator
                         WHERE planing_id = ?
                         ORDER BY session_no ASC`;

    try {
        // Query the database using a promise wrapper for `hrmdb.query`
        const results = await new Promise((resolve, reject) => {
            hrmdb.query(getAllQuery, [planing_id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        if (results.length === 0) {
            return res.status(404).json({ error: 'No records found for the given planing_id.' });
        }

        // Group data by coordinator_email and include coordinator_name
        const groupedByEmail = results.reduce((acc, row) => {
            if (!acc[row.coordinator_email]) {
                acc[row.coordinator_email] = { coordinator_name: row.coordinator_name, sessions: [] };
            }
            acc[row.coordinator_email].sessions.push({
                session_no: row.session_no,
                apprx_trainee_count: row.apprx_trainee_count,
            });
            return acc;
        }, {});

        // Function to generate the email body
        const generateEmailBody = (coordinator_name, sessions) => `
            <p>Dear Mr./Mrs. ${coordinator_name},</p>
            
            <p>Please find the details of Planing ID: <b>${planing_id}</b> sessions below:</p>
            <table border="1" cellpadding="1" cellspacing="0" style="border-collapse: collapse; width: 40%; text-align: center;">
            <thead>
                        <tr>
                             <th style="background-color: #1A005D; color: white;">Session No</th>
                             <th style="    background-color: #1A005D; color: white;">Approx. Trainee Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sessions
                            .map(
                                (session) =>
                                    `<tr>
                                        <td>${session.session_no}</td>
                                        <td>${session.apprx_trainee_count}</td>
                                    </tr>`
                            )
                            .join('')}
                    </tbody>
                </table>
            <p>Please assign the session of approximate trainees.</p>
            <p>Regards,<br>Auto system generated</p>
            <p><b>Note</b>: This is a system-generated email, and you shouldn’t reply to this email. For any clarification, please contact the NEIN-DX Team.</p>
        `;

        // Send emails in parallel (limit concurrency if needed)
        const emailPromises = Object.entries(groupedByEmail).map(async ([email, { coordinator_name, sessions }]) => {
            const emailBody = generateEmailBody(coordinator_name, sessions);
            const emailSubject = `Planning ${planing_id} trainee need to mapping `;

            try {
                await autoSendMail(
                    'noreply.nein@nipponexpress.com', // From
                    email, // To
                    '', // CC
                    emailBody, // Body (HTML)
                    emailSubject // Subject
                );
                console.log(`Email sent successfully to: ${email}`);
            } catch (emailError) {
                console.error(`Error sending email to ${email}:`, emailError);
                throw new Error(`Failed to send email to ${email}`);
            }
        });

        // Wait for all emails to be sent
        await Promise.all(emailPromises);

        return res.status(200).json({ message: 'Emails sent successfully to all coordinators.' });
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'Failed to process request.', details: error.message });
    }
};






// Call the function with the required arguments
exports.testingEmail = async () => {
    console.log('inside testing 1');
    const from = "noreply.nein@nipponexpress.com";
    const to = "bandarla.rajesh@nipponexpress.com";
    const cc = "bandarla.rajesh@nipponexpress.com";
    const body = "<p>This is a test email sent using NodeMailer.</p>";
    const subject = "Test Email";

    try {
        console.log('inside testing 2');
        await autoSendMail(from, to, cc, body, subject);
        console.log('inside testing 3');
    } catch (err) {
        console.error("Error while sending email:", err);
    }
};
