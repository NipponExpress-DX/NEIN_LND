const { hrmdb } = require('../../../configuration/db');

// Function to get all active session information
exports.getAllActiveSessions = (req, res) => {
    const { planing_id } = req.body;

    if (!planing_id) {
        return res.status(400).json({ error: 'Missing required fields: planing_id' });
    }

    const getAllQuery = `SELECT * FROM planing_sessions where planing_id=? AND calDeleteStatus = 0 ORDER BY session_no ASC`;
    hrmdb.query(getAllQuery,[planing_id],  (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ trainers: results });
    });
};

exports.getParticularPlanningSessions = (req, res) => {
    const { planing_id ,session_no} = req.body;

    if (!planing_id) {
        return res.status(400).json({ error: 'Missing required fields: planing_id or session_no' });
    }

    const getAllQuery = `SELECT * FROM planing_sessions where planing_id=? and session_no=? AND calDeleteStatus = 0 `;
    hrmdb.query(getAllQuery,[planing_id,session_no],  (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ trainers: results });
    });
};

// Function to insert session information
exports.addSessions = (req, res) => {
    const {
        planing_id, emp_id, user_name, user_email, session_no, session_code, session_description,
        session_date, count_of_trainees_expected, mode_of_training, training_cost,
        PO_number, PO_date, from_time, to_time, trainer_type, trainer_code,
        trainer_name, trainer_email
    } = req.body;

    if (!session_date) {
        console.error("Error: session_date is missing or undefined.");
        return res.status(400).json({ error: "session_date is missing or undefined" });
    }

    if (!planing_id || !emp_id || !user_name || !user_email || !session_no || !session_code || !trainer_type || !trainer_code || !trainer_name || !trainer_email) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    const checkExistingQuery = `SELECT * FROM planing_sessions WHERE planing_id = ? AND session_no = ? AND calDeleteStatus = 0`;
    hrmdb.query(checkExistingQuery, [planing_id, session_no], (err, results) => {
        if (err) {
            console.error("Error checking existing session:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }

        if (results.length > 0) {
            let updateQuery = `UPDATE planing_sessions SET emp_id = ?, user_name = ?, user_email = ?, session_code = ?, session_description = ?,
                session_date = ?, count_of_trainees_expected = ?, mode_of_training = ?, from_time = ?, to_time = ?, trainer_type = ?,
                trainer_code = ?, trainer_name = ?, trainer_email = ?, date_created = NOW()`;
            let updateValues = [
                emp_id, user_name, user_email, session_code, session_description, session_date,
                count_of_trainees_expected, mode_of_training, from_time, to_time, trainer_type,
                trainer_code, trainer_name, trainer_email
            ];

            if (training_cost !== null) {
                updateQuery += `, training_cost = ?`;
                updateValues.push(training_cost);
            }
            if (PO_number !== null) {
                updateQuery += `, PO_number = ?`;
                updateValues.push(PO_number);
            }
            if (PO_date !== null) {
                updateQuery += `, PO_date = ?`;
                updateValues.push(PO_date);
            }

            updateQuery += ` WHERE planing_id = ? AND session_no = ? AND calDeleteStatus = 0`;
            updateValues.push(planing_id, session_no);

            hrmdb.query(updateQuery, updateValues, (updateErr) => {
                if (updateErr) {
                    console.error("Failed to update session:", updateErr);
                    return res.status(500).json({ error: "Failed to update session", details: updateErr });
                }
                insertHistory(planing_id, emp_id, user_name, user_email, session_no, session_code, session_description, 
                    session_date, count_of_trainees_expected, mode_of_training, training_cost, 
                    PO_number, PO_date, from_time, to_time, trainer_type, trainer_code, trainer_name, trainer_email, res, "updated");
            });
        } else {
            const insertQuery = `INSERT INTO planing_sessions (calDeleteStatus, planing_id, emp_id, user_name, user_email, session_no, session_code, 
                session_description, session_date, count_of_trainees_expected, mode_of_training, training_cost, PO_number, PO_date, from_time, to_time, 
                trainer_type, trainer_code, trainer_name, trainer_email, PSstatus, date_created) 
                VALUES (0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Created', NOW())`;

            const insertValues = [
                planing_id, emp_id, user_name, user_email, session_no, session_code, session_description,
                session_date, count_of_trainees_expected, mode_of_training, training_cost,
                PO_number, PO_date, from_time, to_time, trainer_type, trainer_code,
                trainer_name, trainer_email
            ];

            hrmdb.query(insertQuery, insertValues, (insertErr) => {
                if (insertErr) {
                    console.error("Failed to insert session:", insertErr);
                    return res.status(500).json({ error: "Failed to insert session", details: insertErr });
                }
                insertHistory(planing_id, emp_id, user_name, user_email, session_no, session_code, session_description, 
                    session_date, count_of_trainees_expected, mode_of_training, training_cost, 
                    PO_number, PO_date, from_time, to_time, trainer_type, trainer_code, trainer_name, trainer_email, res, "inserted");
            });
        }
    });
};

function insertHistory(planing_id, emp_id, user_name, user_email, session_no, session_code, session_description, 
    session_date, count_of_trainees_expected, mode_of_training, training_cost, PO_number, PO_date, 
    from_time, to_time, trainer_type, trainer_code, trainer_name, trainer_email, res, action) {

    const insertHistoryQuery = `INSERT INTO planing_sessions_history (planing_id, emp_id, user_name, user_email, session_no, session_code, 
        session_description, session_date, count_of_trainees_expected, mode_of_training, training_cost, PO_number, 
        PO_date, from_time, to_time, trainer_type, trainer_code, trainer_name, trainer_email, PSstatus, date_created, session_history) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Created', NOW(), ?)`;

    const historyValues = [
        planing_id, emp_id, user_name, user_email, session_no, session_code, session_description,
        session_date, count_of_trainees_expected, mode_of_training, training_cost,
        PO_number, PO_date, from_time, to_time, trainer_type, trainer_code,
        trainer_name, trainer_email, action
    ];

    hrmdb.query(insertHistoryQuery, historyValues, (historyErr) => {
        if (historyErr) {
            console.error("Failed to insert session history:", historyErr);
            return res.status(500).json({ error: "Failed to insert session history", details: historyErr });
        }
        return res.status(action === "inserted" ? 201 : 200).json({ message: `Session ${action} successfully.` });
    });
}




// Function to update session information
exports.updateSessions = (req, res) => {
    const {
        planing_id,
        emp_id,
        user_name,
        user_email,
        session_no,
        session_code,
        session_description,
        session_date,
        count_of_trainees_expected,
        mode_of_training,
        training_cost,
        PO_number,
        PO_date,
        from_time,
        to_time,
        trainer_type,
        trainer_code,
        trainer_name,
        trainer_email,
    } = req.body;

    if (!planing_id || !session_no || !session_code) {
        return res.status(400).json({ error: "planing_id, session_no, and session_code are required." });
    }

    if (!session_date) {
        console.error("Error: session_date is missing or undefined.");
        return res.status(400).json({ error: "session_date is missing or undefined." });
    }

    const selectQuery = `
        SELECT * FROM planing_sessions 
        WHERE planing_id = ? AND session_no = ?  AND calDeleteStatus = 0
    `;

    hrmdb.query(selectQuery, [planing_id, session_no], (selectErr, results) => {
        if (selectErr) {
            console.error("Failed to select session information:", selectErr);
            return res.status(500).json({
                error: "Failed to retrieve session information",
                details: selectErr,
            });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Session not found." });
        }

        let updateFields = [];
        let updateValues = [];

        if (emp_id) { updateFields.push("emp_id = ?"); updateValues.push(emp_id); }
        if (user_name) { updateFields.push("user_name = ?"); updateValues.push(user_name); }
        if (user_email) { updateFields.push("user_email = ?"); updateValues.push(user_email); }
        if (session_description) { updateFields.push("session_description = ?"); updateValues.push(session_description); }
        if (session_date) { updateFields.push("session_date = ?"); updateValues.push(session_date); }
        if (count_of_trainees_expected) { updateFields.push("count_of_trainees_expected = ?"); updateValues.push(count_of_trainees_expected); }
        if (mode_of_training) { updateFields.push("mode_of_training = ?"); updateValues.push(mode_of_training); }
        if (training_cost !== null) { updateFields.push("training_cost = ?"); updateValues.push(training_cost); }
        if (PO_number !== null) { updateFields.push("PO_number = ?"); updateValues.push(PO_number); }
        if (PO_date !== null) { updateFields.push("PO_date = ?"); updateValues.push(PO_date); }
        if (from_time) { updateFields.push("from_time = ?"); updateValues.push(from_time); }
        if (to_time) { updateFields.push("to_time = ?"); updateValues.push(to_time); }
        if (trainer_type) { updateFields.push("trainer_type = ?"); updateValues.push(trainer_type); }
        if (trainer_code) { updateFields.push("trainer_code = ?"); updateValues.push(trainer_code); }
        if (trainer_name) { updateFields.push("trainer_name = ?"); updateValues.push(trainer_name); }
        if (trainer_email) { updateFields.push("trainer_email = ?"); updateValues.push(trainer_email); }
        updateFields.push("date_created = NOW()");

        if (updateFields.length === 0) {
            return res.status(400).json({ error: "No valid fields provided for update." });
        }

        const updateQuery = `
            UPDATE planing_sessions 
            SET ${updateFields.join(", ")}
            WHERE planing_id = ? AND session_no = ? AND session_code = ?
        `;

        updateValues.push(planing_id, session_no, session_code);

        hrmdb.query(updateQuery, updateValues, (updateErr) => {
            if (updateErr) {
                console.error("Failed to update session information:", updateErr);
                return res.status(500).json({
                    error: "Failed to update session information",
                    details: updateErr,
                });
            }

            console.log("Updated planing_sessions successfully.");

            const insertHistoryQuery = `
                INSERT INTO planing_sessions_history (
                    planing_id, emp_id, user_name, user_email, session_no, session_code, session_description,
                    session_date, count_of_trainees_expected, mode_of_training, training_cost,
                    PO_number, PO_date, from_time, to_time, trainer_type, trainer_code,
                    trainer_name, trainer_email, date_created, session_history
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
            `;

            hrmdb.query(
                insertHistoryQuery,
                [
                    planing_id, emp_id, user_name, user_email, session_no, session_code, session_description,
                    session_date, count_of_trainees_expected, mode_of_training, training_cost,
                    PO_number, PO_date, from_time, to_time, trainer_type, trainer_code,
                    trainer_name, trainer_email, "updated"
                ],
                (historyErr) => {
                    if (historyErr) {
                        console.error("Failed to insert session history:", historyErr);
                        return res.status(500).json({
                            error: "Failed to insert session history",
                            details: historyErr,
                        });
                    }

                    console.log("Inserted into planing_sessions_history.");
                    return res
                        .status(200)
                        .json({ message: "Session information updated successfully." });
                }
            );
        });
    });
};



// Function to update session Status
exports.updateSessionStatus = (req, res) => {
    const { planing_id, session_no, PSstatus } = req.body;

    // Validate required fields
    if (!planing_id || !session_no || !PSstatus) {
        return res.status(400).json({ error: "planing_id, session_no, and PSstatus are required." });
    }

    // Step 1: Select the row from planing_sessions
    const selectQuery = `
        SELECT * FROM planing_sessions 
        WHERE planing_id = ? AND session_no = ? AND calDeleteStatus = 0
    `;

    hrmdb.query(selectQuery, [planing_id, session_no], (selectErr, results) => {
        if (selectErr) {
            console.error("Failed to select session information:", selectErr);
            return res.status(500).json({
                error: "Failed to retrieve session information",
                details: selectErr,
            });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Session not found." });
        }

        // Extract the session information
        const session = results[0];

        // Step 2: Update the selected row
        const updateQuery = `
            UPDATE planing_sessions 
            SET PSstatus = ?
            WHERE planing_id = ? AND session_no = ? AND calDeleteStatus = 0
        `;

        hrmdb.query(updateQuery, [PSstatus, planing_id, session_no], (updateErr) => {
            if (updateErr) {
                console.error("Failed to update session information:", updateErr);
                return res.status(500).json({
                    error: "Failed to update session information",
                    details: updateErr,
                });
            }

            console.log("Updated planing_sessions status successfully.");

            // Step 3: Insert into planing_sessions_history
            const insertHistoryQuery = `
                INSERT INTO planing_sessions_history (
                    planing_id, emp_id, user_name, user_email, session_no, session_description,
                    session_date, count_of_trainees_expected, mode_of_training, training_cost,
                    PO_number, PO_date, from_time, to_time, trainer_type, trainer_code,
                    trainer_name, trainer_email, PSstatus, date_created, session_history
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
            `;

            const historyData = [
                session.planing_id,
                session.emp_id,
                session.user_name,
                session.user_email,
                session.session_no,
                session.session_description,
                session.session_date,
                session.count_of_trainees_expected,
                session.mode_of_training,
                session.training_cost,
                session.PO_number,
                session.PO_date,
                session.from_time,
                session.to_time,
                session.trainer_type,
                session.trainer_code,
                session.trainer_name,
                session.trainer_email,
                PSstatus, // Updated status
                "updated", // session_history field
            ];

            hrmdb.query(insertHistoryQuery, historyData, (historyErr) => {
                if (historyErr) {
                    console.error("Failed to insert session history:", historyErr);
                    return res.status(500).json({
                        error: "Failed to insert session history",
                        details: historyErr,
                    });
                }

                console.log("Inserted into planing_sessions_history successfully.");
                return res.status(200).json({
                    message: "Session information updated and history logged successfully.",
                });
            });
        });
    });
};

// Function to Postpone session 
exports.PostPoneSessionDate = (req, res) => {
    const { planing_id, session_no, emp_id, user_name, user_email, session_date, from_time, to_time, PSstatus, Remarks } = req.body;

    // Validate required fields
    if (!planing_id || !session_no || !PSstatus) {
        return res.status(400).json({ error: "planing_id, session_no, and PSstatus are required." });
    }

    // Step 1: Select the row from planing_sessions
    const selectQuery = `
        SELECT * FROM planing_sessions 
        WHERE planing_id = ? AND session_no = ? AND calDeleteStatus = 0
    `;

    hrmdb.query(selectQuery, [planing_id, session_no], (selectErr, results) => {
        if (selectErr) {
            console.error("Failed to select session information:", selectErr);
            return res.status(500).json({
                error: "Failed to retrieve session information",
                details: selectErr,
            });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Session not found." });
        }

        // Extract the session information
        const session = results[0];

        // Step 2: Update the selected row with Remarks
        const updateQuery = `
            UPDATE planing_sessions 
            SET emp_id = ?, user_name = ?, user_email = ?, session_date = ?, from_time = ?, to_time = ?, PSstatus = ?, Remarks = ?
            WHERE planing_id = ? AND session_no = ? AND calDeleteStatus = 0
        `;

        hrmdb.query(updateQuery, [emp_id, user_name, user_email, session_date, from_time, to_time, PSstatus, Remarks, planing_id, session_no], (updateErr) => {
            if (updateErr) {
                console.error("Failed to update session information:", updateErr);
                return res.status(500).json({
                    error: "Failed to update session information",
                    details: updateErr,
                });
            }

            console.log("Postpone planing sessions successfully.");

            // Step 3: Insert into planing_sessions_history with Remarks
            const insertHistoryQuery = `
                INSERT INTO planing_sessions_history (
                    planing_id, emp_id, user_name, user_email, session_no, session_description,
                    session_date, count_of_trainees_expected, mode_of_training, training_cost,
                    PO_number, PO_date, from_time, to_time, trainer_type, trainer_code,
                    trainer_name, trainer_email, PSstatus, date_created, session_history, Remarks
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
            `;

            const historyData = [
                planing_id,
                emp_id,
                user_name,
                user_email,
                session_no,
                session.session_description,
                session_date,
                session.count_of_trainees_expected,
                session.mode_of_training,
                session.training_cost,
                session.PO_number,
                session.PO_date,
                from_time,
                to_time,
                session.trainer_type,
                session.trainer_code,
                session.trainer_name,
                session.trainer_email,
                PSstatus, // Updated status
                "Postpone", // session_history field
                Remarks // Include Remarks
            ];

            hrmdb.query(insertHistoryQuery, historyData, (historyErr) => {
                if (historyErr) {
                    console.error("Failed to insert session history:", historyErr);
                    return res.status(500).json({
                        error: "Failed to insert session history",
                        details: historyErr,
                    });
                }

                console.log("Inserted into planing_sessions_history successfully.");
                return res.status(200).json({
                    message: "Session information updated and history logged successfully.",
                });
            });
        });
    });
};


// Function to delete session information
exports.deleteSessions = (req, res) => {
    const {
        planing_id,
        emp_id,
        user_name,
        user_email,
        session_no,
        Remarks,
    } = req.body;

    if (!planing_id || !session_no) {
        return res.status(400).json({ error: "planing_id and session_no are required." });
    }

    const selectQuery = `
        SELECT * FROM planing_sessions 
        WHERE planing_id = ? AND session_no = ?
    `;

    hrmdb.query(selectQuery, [planing_id, session_no], (selectErr, results) => {
        if (selectErr) {
            console.error("Failed to select session information:", selectErr);
            return res.status(500).json({
                error: "Failed to retrieve session information",
                details: selectErr,
            });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Session not found." });
        }

        const sessionData = results[0];

        const {
            session_code,
            session_description,
            session_date,
            count_of_trainees_expected,
            mode_of_training,
            training_cost,
            PO_number,
            PO_date,
            from_time,
            to_time,
            trainer_type,
            trainer_code,
            trainer_name,
            trainer_email,
            PSstatus,
        } = sessionData;

        const insertHistoryQuery = `
            INSERT INTO planing_sessions_history (
                planing_id, emp_id, user_name, user_email, session_no, session_code, session_description,
                session_date, count_of_trainees_expected, mode_of_training, training_cost,
                PO_number, PO_date, from_time, to_time, trainer_type, trainer_code,
                trainer_name, trainer_email, PSstatus, Remarks, date_created, session_history
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        `;

        const historyValues = [
            planing_id,
            emp_id,
            user_name,
            user_email,
            session_no,
            session_code, // ✅ Ensured session_code is passed correctly
            session_description,
            session_date,
            count_of_trainees_expected,
            mode_of_training,
            training_cost || null,
            PO_number || null,
            PO_date || null,
            from_time,
            to_time,
            trainer_type,
            trainer_code,
            trainer_name,
            trainer_email || null, 
            PSstatus,
            Remarks,
            "deleted",
        ];

        hrmdb.query(insertHistoryQuery, historyValues, (historyErr) => {
            if (historyErr) {
                console.error("Failed to insert session history:", historyErr);
                return res.status(500).json({
                    error: "Failed to insert session history",
                    details: historyErr,
                });
            }

            console.log("Inserted into planing_sessions_history.");

            const deleteQuery = `
               UPDATE planing_sessions 
               SET PSstatus = "cancelled", calDeleteStatus = 1
                WHERE planing_id = ? AND session_no = ? AND calDeleteStatus = 0
            `;

            hrmdb.query(deleteQuery, [planing_id, session_no], (deleteErr) => {
                if (deleteErr) {
                    console.error("Failed to delete session:", deleteErr);
                    return res.status(500).json({
                        error: "Failed to delete session",
                        details: deleteErr,
                    });
                }

                console.log("Deleted session from planing_sessions.");
                return res.status(200).json({ message: "Session deleted successfully." });
            });
        });
    });
};
