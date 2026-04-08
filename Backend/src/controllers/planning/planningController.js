const { hrmdb, leavemanagement } = require('../../../configuration/db');

// Helper function to log history
function logHistory(
    hrmdb,
    id,
    emp_id,
    user_name,
    user_email,
    branch_id,
    department_id,
    staff_category_id,
    training_topic_id,
    training_type_id,
    planning_type,
    planning_date,
    date_created,
    remarks,
    status,
    callback
) {
    const insertHistoryQuery = `
        INSERT INTO planning_training_table_history 
        (id, emp_id, user_name, user_email, branch_id, department_id, staff_category_id, 
       training_topic_id , training_type_id, planning_type, planning_date, date_created, 
        remarks, status, user_modify_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

    hrmdb.query(
        insertHistoryQuery,
        [
            id,
            emp_id,
            user_name,
            user_email,
            branch_id,
            department_id,
            staff_category_id,
            training_topic_id,
            training_type_id,
            planning_type,
            planning_date,
            date_created,
            remarks,
            status,
        ],
        callback
    );
}

// Function to add planning details
exports.addPlaningDetails = (req, res) => {
    const {
        emp_id,
        user_name,
        user_email,
        branch_id,
        department_id,
        staff_category_id,
        training_topic_id,
        training_type_id,
        planning_type,
        planning_date,
        remarks,
        status,
    } = req.body;

    // Check for required fields
    if (
        !emp_id ||
        !user_name ||
        !user_email ||
        !branch_id ||
        !department_id ||
        !staff_category_id ||
        !training_topic_id ||
        !training_type_id ||
        !planning_type ||
        !planning_date
    ) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const insertQuery = `
        INSERT INTO planning_training_table
        (calDeleteStatus, emp_id, user_name, user_email, branch_id, department_id, 
        staff_category_id, training_topic_id, training_type_id, planning_type, 
        planning_date, date_created, remarks, Status) 
        VALUES (0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`;

    hrmdb.query(
        insertQuery,
        [
            emp_id,
            user_name,
            user_email,
            branch_id,
            department_id,
            staff_category_id,
            training_topic_id,
            training_type_id,
            planning_type,
            planning_date,
            remarks,
            status,
        ],
        (insertErr, insertResults) => {
            if (insertErr) {
                console.error('Failed to insert record:', insertErr);
                return res
                    .status(500)
                    .json({ error: 'Failed to insert record', details: insertErr });
            }

            const insertedId = insertResults.insertId;

            // Log the history for the inserted record
            logHistory(
                hrmdb,
                insertedId,
                emp_id,
                user_name,
                user_email,
                branch_id,
                department_id,
                staff_category_id,
                training_topic_id,
                training_type_id,
                planning_type,
                planning_date,
                new Date(), // Use current date for date_created
                remarks,
                "creating",
                (logErr) => {
                    if (logErr) {
                        console.error('Failed to log history:', logErr);
                        return res.status(500).json({ error: 'Failed to log history', details: logErr });
                    }
                    return res
                        .status(201)
                        .json({ message: 'Record added and history logged successfully.' });
                }
            );
        }
    );
};


//Planning information getting
// exports.getAllPlanningDetails = (req, res) => {
//     const { userid ,emp_id} = req.body;
//     console.log("Userid Backend",emp_id);
//     // Validate the userid from the request body
//     if (!userid) {
//         return res.status(400).json({ error: 'Missing userid in request body' });
//     }

//     // Securely construct the SQL query with placeholders
//     const getAllQuery = `S
//     SELECT 
//             pt.id,
//             pt.emp_id,
//             pt.user_name,
//             pt.user_email,
//             pt.planning_type,
//             pt.planning_date,
//             pt.date_created,
//             pt.remarks,
//             pt.status,
//             pt.cancelled_reason,
//             tt.training_topic,
//             sc.staff_category,
//             ttype.training_type,
//             GROUP_CONCAT(DISTINCT bm.branch_name ORDER BY bm.branch_id) AS branch_names,
//             GROUP_CONCAT(DISTINCT dept.department_name ORDER BY dept.department_id) AS department_names,
//             MAX(ps.date_created) AS session_date_created
//         FROM 
//             hrmdb.planning_training_table pt
//         LEFT JOIN 
//             hrmdb.training_topic tt ON pt.training_topic_id = tt.id
//         LEFT JOIN 
//             hrmdb.staff_category sc ON pt.staff_category_id = sc.id
//         LEFT JOIN 
//             hrmdb.training_type ttype ON pt.training_type_id = ttype.id
//         LEFT JOIN 
//             leavemanagement.branchmaster bm ON FIND_IN_SET(bm.branch_id, pt.branch_id) > 0
//         LEFT JOIN 
//             leavemanagement.department dept ON FIND_IN_SET(dept.department_id, pt.department_id) > 0
//         LEFT JOIN 
//             hrmdb.planing_sessions ps ON pt.id = ps.planing_id
//         WHERE 
//             pt.calDeleteStatus = 0
//             AND pt.emp_id = ?
//             AND pt.status != 'Cancelled'
//         GROUP BY 
//             pt.id, pt.emp_id, pt.user_name, pt.user_email, pt.planning_type, pt.planning_date, 
//             pt.date_created, pt.remarks, pt.status, pt.cancelled_reason, 
//             tt.training_topic, sc.staff_category, ttype.training_type
    
    
//     `;

//     // Execute the query with parameterized values
//     hrmdb.query(getAllQuery, [userid], (err, results) => {
//         if (err) {
//             console.error('Database error:', err);
//             return res.status(500).json({ error: 'Database error', details: err });
//         }
//         return res.status(200).json({ records: results });
//     });
// };


exports.getAllPlanningDetails = (req, res) => {
    const { userid } = req.body;
    

    // Validate input
    if (!userid ) {
        return res.status(400).json({ error: 'Missing userid  in request body' });
    }

    // Updated complex query with joins and filtering
    const getAllQuery = `
        SELECT 
            pt.id,
            pt.emp_id,
            pt.user_name,
            pt.user_email,
            pt.planning_type,
            pt.planning_date,
            pt.date_created,
            pt.remarks,
            pt.status,
            pt.cancelled_reason,
            tt.training_topic,
            sc.staff_category,
            ttype.training_type,
            GROUP_CONCAT(DISTINCT bm.branch_name ORDER BY bm.branch_id) AS branch_names,
            GROUP_CONCAT(DISTINCT dept.department_name ORDER BY dept.department_id) AS department_names,
            MAX(ps.date_created) AS session_date_created
        FROM 
            hrmdb.planning_training_table pt
        LEFT JOIN 
            hrmdb.training_topic tt ON pt.training_topic_id = tt.id
        LEFT JOIN 
            hrmdb.staff_category sc ON pt.staff_category_id = sc.id
        LEFT JOIN 
            hrmdb.training_type ttype ON pt.training_type_id = ttype.id
        LEFT JOIN 
            leavemanagement.branchmaster bm ON FIND_IN_SET(bm.branch_id, pt.branch_id) > 0
        LEFT JOIN 
            leavemanagement.department dept ON FIND_IN_SET(dept.department_id, pt.department_id) > 0
        LEFT JOIN 
            hrmdb.planing_sessions ps ON pt.id = ps.planing_id
        WHERE 
            pt.calDeleteStatus = 0
            AND pt.emp_id = ?
            AND pt.status != 'Cancelled'
        GROUP BY 
            pt.id, pt.emp_id, pt.user_name, pt.user_email, pt.planning_type, pt.planning_date, 
            pt.date_created, pt.remarks, pt.status, pt.cancelled_reason, 
            tt.training_topic, sc.staff_category, ttype.training_type
    `;

    // Execute query securely using placeholders
    hrmdb.query(getAllQuery, [userid], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'No records found.' });
        }

        return res.status(200).json({ success: true, data: results });
    });
};




//Planning data updating
exports.updatingPlaningDetails = (req, res) => {
    const {
        id,
        emp_id,
        user_name,
        user_email,
        branch_id,
        department_id,
        staff_category_id,
        training_topic_id,
        training_type_id,
        planning_type,
        planning_date,
        remarks,
        status,
    } = req.body;

    // Check for required fields
    if (
        !id ||
        !emp_id ||
        !user_name ||
        !user_email ||
        !branch_id ||
        !department_id ||
        !staff_category_id ||
        !training_topic_id ||
        !planning_type ||
        !planning_date
    ) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Query to check if the record exists
    const checkQuery = `SELECT * FROM planning_training_table WHERE id = ? `;

    hrmdb.query(checkQuery, [id], (checkErr, results) => {
        if (checkErr) {
            console.error('Database error:', checkErr);
            return res.status(500).json({ error: 'Database error', details: checkErr });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Record with the given ID not found.' });
        }

        // Update the existing record
        const updateQuery = `
            UPDATE planning_training_table 
            SET branch_id = ?, 
                department_id = ?, 
                staff_category_id = ?, 
                training_topic_id = ?, 
                training_type_id = ?, 
                planning_type = ?, 
                planning_date = ?, 
                remarks = ?, 
                Status = ?
            WHERE id = ?`;

        hrmdb.query(
            updateQuery,
            [
                branch_id,
                department_id,
                staff_category_id,
                training_topic_id,
                training_type_id,
                planning_type,
                planning_date,
                remarks,
                status,
                id,
            ],
            (updateErr) => {
                if (updateErr) {
                    console.error('Failed to update record:', updateErr);
                    return res.status(500).json({ error: 'Failed to update record', details: updateErr });
                }

                // Log the updated record in the history table
                logHistory(
                    hrmdb,
                    id,
                    emp_id,
                    user_name,
                    user_email,
                    branch_id,
                    department_id,
                    staff_category_id,
                    training_topic_id,
                    training_type_id,
                    planning_type,
                    planning_date,
                    new Date(), // Log the current timestamp as date_created
                    remarks,
                    "updated",
                    (logErr) => {
                        if (logErr) {
                            console.error('Failed to log history:', logErr);
                            return res.status(500).json({ error: 'Failed to log history', details: logErr });
                        }
                        return res.status(200).json({ message: 'Record updated and history logged successfully.' });
                    }
                );
            }
        );
    });
};

// planing cancelling
exports.cancellingPlaningDetails = (req, res) => {
    const { id, emp_id, user_name, user_email, cancelled_reason } = req.body;
    

    // Check for required fields
    if (!id || !emp_id || !user_name || !user_email || !cancelled_reason ) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Query to check if the record exists
    const checkQuery = `SELECT * FROM planning_training_table WHERE id = ?`;

    hrmdb.query(checkQuery, [id], (checkErr, results) => {
        if (checkErr) {
            console.error('Database error:', checkErr);
            return res.status(500).json({ error: 'Database error', details: checkErr });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Record with the given ID not found.' });
        }

        // Record exists, proceed to update
        const updateQuery = `
            UPDATE planning_training_table
            SET Status = "Cancelled",
                cancelled_reason = ?
            WHERE id = ?`;

        hrmdb.query(updateQuery, [cancelled_reason, id], (updateErr) => {
            if (updateErr) {
                console.error(`Failed to update record with ID ${id}:`, updateErr);
                return res.status(500).json({ error: 'Failed to update record', details: updateErr });
            }

            // Log the updated record in the history table
            const record = results[0];
            if (!record) {
                return res.status(404).json({ error: 'No matching record found for logging history.' });
            }

            logHistory(
                hrmdb,
                record.id,
                emp_id,
                user_name,
                user_email,
                record.branch_id,
                record.department_id,
                record.staff_category_id,
                record.training_topic_id,
                record.training_type_id,
                record.planning_type,
                record.planning_date,
                new Date(), // Current timestamp for history
                record.remarks || "No remarks",
                "Cancelled",
                (logErr) => {
                    if (logErr) {
                        console.error('Failed to log history:', logErr);
                        return res.status(500).json({ error: 'Failed to log history', details: logErr });
                    }

                    // Return success response
                    return res.status(200).json({ message: 'Status updated successfully and history logged.' });

                        
                }
            );
        });
    });
};

// planing status updating

exports.updatingStatusPlaningDetails = (req, res) => {
    const { id, emp_id, user_name, user_email, 	Status } = req.body;
    

    // Check for required fields
    if (!id || !emp_id || !user_name || !user_email || !Status ) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Query to check if the record exists
    const checkQuery = `SELECT * FROM planning_training_table WHERE id = ?`;

    hrmdb.query(checkQuery, [id], (checkErr, results) => {
        if (checkErr) {
            console.error('Database error:', checkErr);
            return res.status(500).json({ error: 'Database error', details: checkErr });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Record with the given ID not found.' });
        }

        // Record exists, proceed to update
        const updateQuery = `
            UPDATE planning_training_table
            SET Status = ?
            WHERE id = ?`;

        hrmdb.query(updateQuery, [Status, id], (updateErr) => {
            if (updateErr) {
                console.error(`Failed to update record with ID ${id}:`, updateErr);
                return res.status(500).json({ error: 'Failed to update record', details: updateErr });
            }

            // Log the updated record in the history table
            const record = results[0];
            if (!record) {
                return res.status(404).json({ error: 'No matching record found for logging history.' });
            }

            logHistory(
                hrmdb,
                record.id,
                emp_id,
                user_name,
                user_email,
                record.branch_id,
                record.department_id,
                record.staff_category_id,
                record.training_topic_id,
                record.training_type_id,
                record.planning_type,
                record.planning_date,
                new Date(), // Current timestamp for history
                record.remarks || "No remarks",
                Status,
                (logErr) => {
                    if (logErr) {
                        console.error('Failed to log history:', logErr);
                        return res.status(500).json({ error: 'Failed to log history', details: logErr });
                    }

                    // Return success response
                    return res.status(200).json({ message: 'Status updated successfully and history logged.' });

                        
                }
            );
        });
    });
};


// Admin  View Planing Details    sample test
//sample testing AA

exports.ViewPlaningDetails = (req, res) => {
    const { branch_list, department_list } = req.body;

    // Validate input
    if (!branch_list || !department_list || branch_list.length === 0 || department_list.length === 0) {
        return res.status(400).json({ error: 'At least one branch and one department are required.' });
    }

    // Convert branch and department lists into SQL conditions
    const branchCondition = branch_list.map(b => `FIND_IN_SET(${b}, branch_id) > 0`).join(" OR ");
    const departmentCondition = department_list.map(d => `FIND_IN_SET(${d}, department_id) > 0`).join(" OR ");

    // SQL Query using optimized filtering
    const query = `
        SELECT 
            pt.*, 
            t.training_topic 
        FROM hrmdb.planning_training_table pt
        JOIN hrmdb.training_topic t ON pt.training_topic_id = t.id
        WHERE pt.id IN (
            SELECT id 
            FROM hrmdb.planning_training_table
            WHERE (${branchCondition})
        )
        AND (${departmentCondition});
    `;

    // Execute query
    hrmdb.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'No records found.' });
        }

        return res.status(200).json({ success: true, data: results });
    });
};





// exports.ViewPlaningDetails = (req, res) => {
//     const { department_code, branch_type_code } = req.body;

//     // Check for required fields
//     if (!department_code || !branch_type_code) {
//         return res.status(400).json({ error: 'Missing required fields' });
//     }

//     let getIdRelativeInfo;
//     let queryParams = [];

//     // Determine the query based on department_code and branch_type_code
//     if (department_code === 'HR & Admin' && branch_type_code === "90") {
//         getIdRelativeInfo = `SELECT 
//                                     p.*, 
//                                     t.training_topic 
//                                 FROM hrmdb.planning_training_table p
//                                 JOIN hrmdb.training_topic t 
//                                     ON p.training_topic_id = t.id`;  // Ensure database reference
//     } 
//     else if (department_code !== 'HR & Admin' && branch_type_code === "90") {
//         getIdRelativeInfo = `SELECT 
//                                     pt.*, 
//                                     t.training_topic 
//                                 FROM hrmdb.planning_training_table pt
//                                 JOIN hrmdb.training_topic t 
//                                     ON pt.training_topic_id = t.id
//                                 JOIN leavemanagement.user u 
//                                     ON pt.emp_id = u.emp_id
//                                 JOIN leavemanagement.department d 
//                                     ON u.department_id = d.department_id
//                                 WHERE d.department_code = ?`;
//         queryParams = [department_code];
//     } 
//     else if (department_code === 'HR & Admin' && branch_type_code !== "90") {
//         getIdRelativeInfo = `SELECT pt.* ,t.training_topic 
//                              FROM hrmdb.planning_training_table pt
//                              JOIN hrmdb.training_topic t  ON pt.training_topic_id = t.id
//                              JOIN leavemanagement.user u ON pt.emp_id = u.emp_id
//                              JOIN leavemanagement.branchmaster b ON u.branch_id = b.branch_id
//                              WHERE b.branch_type_code = ?`;
//         queryParams = [branch_type_code];
//     } 
//     else {
//         getIdRelativeInfo = `SELECT pt.*  ,t.training_topic 
//                              FROM hrmdb.planning_training_table pt  
//                              JOIN hrmdb.training_topic t  ON pt.training_topic_id = t.id
//                              JOIN leavemanagement.user u ON pt.emp_id = u.emp_id  
//                              JOIN leavemanagement.department d ON u.department_id = d.department_id  
//                              JOIN leavemanagement.branchmaster b ON u.branch_id = b.branch_id  
//                              WHERE d.department_code = ? AND b.branch_type_code = ?`;
//         queryParams = [department_code, branch_type_code];
//     }

//     // Execute the query
//     hrmdb.query(getIdRelativeInfo, queryParams, (checkErr, results) => {
//         if (checkErr) {
//             console.error('Database error:', checkErr);
//             return res.status(500).json({ error: 'Database error', details: checkErr });
//         }

//         // Check if no records were found
//         if (results.length === 0) {
//             return res.status(404).json({ error: 'No records found.' });
//         }

//         // Log and send the results
//         console.log('Query Results:', results);
//         return res.status(200).json({ success: true, data: results });
//     });
// };


// cordinator or sub -coorinatoer  View Planing Details 

exports.CorOrSubViewPlaningDetails = (req, res) => {
    const { emp_id } = req.body;

    if (!emp_id) {
        return res.status(400).json({ error: 'Missing emp_id  in request body' });
    }

    const getAllQuery = `
        SELECT 
            pt.*,
            pt.id AS planing_id,
            ps.session_no,
            pmsc.session_no as Session_no1,
            tt.training_topic, 
            sc.staff_category, 
            ttype.training_type, 
            GROUP_CONCAT(DISTINCT bm.branch_name ORDER BY bm.branch_id) AS branch_names, 
            GROUP_CONCAT(DISTINCT dept.department_name ORDER BY dept.department_id) AS department_names,
            CASE 
                WHEN pmc.planing_id IS NOT NULL AND pmc.session_no = ps.session_no THEN 'coordinator'
                WHEN pmsc.planing_id IS NOT NULL AND pmsc.session_no = ps.session_no THEN 'sub_coordinator'
                ELSE 'no role'
            END AS role_type,
            CASE 
                WHEN ps.trainer_code = ? THEN 'YES'
                ELSE 'NO'
            END AS trainer
        FROM hrmdb.planning_training_table pt
        JOIN hrmdb.planing_sessions ps 
            ON pt.id = ps.planing_id
        LEFT JOIN hrmdb.planing_mapping_coordinator pmc 
            ON ps.planing_id = pmc.planing_id 
            AND ps.session_no = pmc.session_no
            AND pmc.coordinator_emp_id = ?
        LEFT JOIN hrmdb.planing_mapping_sub_coordinator pmsc
            ON ps.planing_id = pmsc.planing_id 
            AND ps.session_no = pmsc.session_no
            AND pmsc.sub_coordinator_emp_id = ?
        LEFT JOIN hrmdb.training_topic tt 
            ON pt.training_topic_id = tt.id
        LEFT JOIN hrmdb.staff_category sc 
            ON pt.staff_category_id = sc.id
        LEFT JOIN hrmdb.training_type ttype 
            ON pt.training_type_id = ttype.id
        LEFT JOIN leavemanagement.branchmaster bm 
            ON FIND_IN_SET(bm.branch_id, pt.branch_id)
        LEFT JOIN leavemanagement.department dept
            ON FIND_IN_SET(dept.department_id, pt.department_id)
        GROUP BY ps.planing_id, ps.session_no, pmc.planing_id, pmsc.planing_id
        ORDER BY ps.planing_id, ps.session_no
    `;

    // Execute the query with parameterized values
    hrmdb.query(getAllQuery, [emp_id, emp_id, emp_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ records: results });
    });
};


exports.CorOrSubViewPlaningDetailsStatus = (req, res) => {
    const { emp_id } = req.body;

    if (!emp_id) {
        return res.status(400).json({ error: 'Missing emp_id in request body' });
    }

    const getAllQuery = `
        SELECT 
    pt.id AS planning_id,
    COALESCE(pmc.session_no, pmsc.session_no) AS session_no,
    CASE 
        WHEN pmc.planing_id IS NOT NULL THEN 'coordinator' 
        WHEN pmsc.planing_id IS NOT NULL THEN 'sub_coordinator' 
    END AS role_type
FROM hrmdb.planning_training_table pt
LEFT JOIN hrmdb.planing_mapping_coordinator pmc 
    ON pt.id = pmc.planing_id 
    AND pmc.coordinator_emp_id = 2774
LEFT JOIN hrmdb.planing_mapping_sub_coordinator pmsc
    ON pt.id = pmsc.planing_id 
    AND pmsc.sub_coordinator_emp_id = 2774
LEFT JOIN hrmdb.training_topic tt 
    ON pt.training_topic_id = tt.id
LEFT JOIN hrmdb.staff_category sc 
    ON pt.staff_category_id = sc.id
LEFT JOIN hrmdb.training_type ttype 
    ON pt.training_type_id = ttype.id
LEFT JOIN leavemanagement.branchmaster bm 
    ON FIND_IN_SET(bm.branch_id, pt.branch_id)
LEFT JOIN leavemanagement.department dept
    ON FIND_IN_SET(dept.department_id, pt.department_id)
WHERE pmc.planing_id IS NOT NULL 
   OR pmsc.planing_id IS NOT NULL
GROUP BY pt.id, session_no
    `;

    // Execute the query with parameterized values
    hrmdb.query(getAllQuery, [emp_id, emp_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ records: results });
    });
};



exports.TrainerViewPlaningDetailsStatus = (req, res) => {
    const { emp_id } = req.body;

    if (!emp_id) {
        return res.status(400).json({ error: 'Missing emp_id in request body' });
    }

    const getAllQuery = `
        SELECT pt.*, 
       pmc.session_no,
       tt.training_topic, 
       sc.staff_category, 
       ttype.training_type, 
       GROUP_CONCAT(DISTINCT bm.branch_name ORDER BY bm.branch_id) AS branch_names, -- Unique branch names
       GROUP_CONCAT(DISTINCT dept.department_name ORDER BY dept.department_id) AS department_names, -- Unique department names
       CASE 
           WHEN ps.planing_id IS NOT NULL THEN 'trainer' 
       END AS role_type
FROM hrmdb.planning_training_table pt
LEFT JOIN hrmdb.planing_mapping_coordinator pmc 
       ON pt.id = pmc.planing_id 
LEFT JOIN hrmdb.planing_sessions ps 
       ON pt.id = ps.planing_id 
       AND ps.trainer_code = ?
LEFT JOIN hrmdb.training_topic tt 
       ON pt.training_topic_id = tt.id
LEFT JOIN hrmdb.staff_category sc 
       ON pt.staff_category_id = sc.id
LEFT JOIN hrmdb.training_type ttype 
       ON pt.training_type_id = ttype.id
LEFT JOIN leavemanagement.branchmaster bm 
       ON FIND_IN_SET(bm.branch_id, pt.branch_id) -- Match multiple branch IDs
LEFT JOIN leavemanagement.department dept
       ON FIND_IN_SET(dept.department_id, pt.department_id) -- Match multiple department IDs
WHERE ps.planing_id IS NOT NULL
GROUP BY pt.id
    `;

    // Execute the query with parameterized values
    hrmdb.query(getAllQuery, [emp_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ records: results });
    });
};

exports.LNDCalendarDetails = (req, res) => {
    
    const getAllQuery = `
        SELECT 
            pt.id AS planing_id,
            ps.session_no,
            ps.session_code,
            ps.session_description,
            ps.session_date,
            ps.from_time,
            ps.to_time,
            GROUP_CONCAT(DISTINCT bm.branch_name ORDER BY bm.branch_id) AS branch_names, 
            GROUP_CONCAT(DISTINCT dept.department_name ORDER BY dept.department_id) AS department_names,
            tt.training_topic, 
            sc.staff_category, 
            ttype.training_type, 
            pt.user_name AS PlanningCreatedUser,
            pt.planning_date,
            pt.remarks,
            pt.Status as PlanningStatus,  
            ps.PSstatus As PlaningSessionStatus  , 
            ps.trainer_type,
            ps.trainer_name,
            ps.trainer_email
                      
            
            
        FROM hrmdb.planning_training_table pt
        JOIN hrmdb.planing_sessions ps 
            ON pt.id = ps.planing_id
        LEFT JOIN hrmdb.planing_mapping_coordinator pmc 
            ON ps.planing_id = pmc.planing_id          
            
        LEFT JOIN hrmdb.planing_mapping_sub_coordinator pmsc
            ON ps.planing_id = pmsc.planing_id 
            AND ps.session_no = pmsc.session_no
            
        LEFT JOIN hrmdb.training_topic tt 
            ON pt.training_topic_id = tt.id
        LEFT JOIN hrmdb.staff_category sc 
            ON pt.staff_category_id = sc.id
        LEFT JOIN hrmdb.training_type ttype 
            ON pt.training_type_id = ttype.id
        LEFT JOIN leavemanagement.branchmaster bm 
            ON FIND_IN_SET(bm.branch_id, pt.branch_id)
        LEFT JOIN leavemanagement.department dept
            ON FIND_IN_SET(dept.department_id, pt.department_id)
        GROUP BY ps.planing_id, ps.session_no, pmc.planing_id, pmsc.planing_id
        ORDER BY ps.planing_id, ps.session_no
    `;

    // Execute the query with parameterized values
    hrmdb.query(getAllQuery, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ records: results });
    });
};