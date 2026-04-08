const { hrmdb } = require('../../../configuration/db');

// Function to insert Mapping Sub-Coordinator information into the planing_mapping_sub_coordinator table
exports.addMappingSubCoordinator = (req, res) => {
    const {
        PMC_id,
        planing_id,
        emp_id,
        session_no,
        coordinator_type,
        branch,
        department,
        coordinator_emp_id,
        coordinator_name,
        coordinator_email,
        sub_coordinator_emp_id,
        sub_coordinator_name,
        sub_coordinator_email,
        apprx_trainee_count
    } = req.body;

    if (!PMC_id || !planing_id || !emp_id || !session_no || !sub_coordinator_emp_id || !sub_coordinator_name) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    const insertQuery = `
        INSERT INTO planing_mapping_sub_coordinator (
            PMC_id, planing_id, emp_id, session_no, coordinator_type, branch, department,
            coordinator_emp_id, coordinator_name, coordinator_email,
            sub_coordinator_emp_id, sub_coordinator_name, sub_coordinator_email, apprx_trainee_count, date_created
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    hrmdb.query(
        insertQuery,
        [PMC_id, planing_id, emp_id, session_no, coordinator_type, branch, department,
        coordinator_emp_id, coordinator_name, coordinator_email,
        sub_coordinator_emp_id, sub_coordinator_name, sub_coordinator_email, apprx_trainee_count],
        (insertErr, insertResult) => {
            if (insertErr) {
                return res.status(500).json({ error: "Failed to insert sub-coordinator information", details: insertErr });
            }
            const PMSC_id = insertResult.insertId;

            const insertHistoryQuery = `
                INSERT INTO planing_mapping_sub_coordinator_history (
                    PMC_id, PMSC_id, planing_id, emp_id, session_no, coordinator_type, branch, department,
                    coordinator_emp_id, coordinator_name, coordinator_email,
                    sub_coordinator_emp_id, sub_coordinator_name, sub_coordinator_email, apprx_trainee_count, date_created, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
            `;

            hrmdb.query(
                insertHistoryQuery,
                [PMC_id, PMSC_id, planing_id, emp_id, session_no, coordinator_type, branch, department,
                coordinator_emp_id, coordinator_name, coordinator_email,
                sub_coordinator_emp_id, sub_coordinator_name, sub_coordinator_email, apprx_trainee_count, "insert"],
                (historyErr) => {
                    if (historyErr) {
                        return res.status(500).json({ error: "Failed to insert sub-coordinator history", details: historyErr });
                    }
                    return res.status(201).json({ message: "Sub-coordinator information added successfully." });
                }
            );
        }
    );
};


exports.updateMappingSubCoordinator = (req, res) => {
    const {
        id,
        PMC_id,
        planing_id,
        emp_id,
        session_no,
        coordinator_type,
        branch,
        department,
        coordinator_emp_id,
        coordinator_name,
        coordinator_email,
        sub_coordinator_emp_id,
        sub_coordinator_name,
        sub_coordinator_email,
        apprx_trainee_count
    } = req.body;

    if (!id ||!PMC_id || !planing_id || !emp_id || !session_no || !sub_coordinator_emp_id || !sub_coordinator_name) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    const updateQuery = `
        UPDATE planing_mapping_sub_coordinator
        SET 
            coordinator_type = ?, 
            branch = ?, 
            department = ?, 
            coordinator_emp_id = ?, 
            coordinator_name = ?, 
            coordinator_email = ?, 
            sub_coordinator_emp_id = ?, 
            sub_coordinator_name = ?, 
            sub_coordinator_email = ?, 
            apprx_trainee_count = ?, 
            date_created = NOW(),
            PMC_id = ? ,
            planing_id = ?,
            session_no = ?
        WHERE id=?
    `;

    hrmdb.query(
        updateQuery,
        [coordinator_type, branch, department, coordinator_emp_id, coordinator_name, coordinator_email,
            sub_coordinator_emp_id, sub_coordinator_name, sub_coordinator_email, apprx_trainee_count, PMC_id, planing_id, session_no,id],
        (insertErr, insertResult) => {
            if (insertErr) {
                return res.status(500).json({ error: "Failed to insert sub-coordinator information", details: insertErr });
            }
            const PMSC_id = insertResult.insertId;

            const insertHistoryQuery = `
                INSERT INTO planing_mapping_sub_coordinator_history (
                    PMC_id, PMSC_id, planing_id, emp_id, session_no, coordinator_type, branch, department,
                    coordinator_emp_id, coordinator_name, coordinator_email,
                    sub_coordinator_emp_id, sub_coordinator_name, sub_coordinator_email, apprx_trainee_count, date_created, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
            `;

            hrmdb.query(
                insertHistoryQuery,
                [PMC_id, PMSC_id, planing_id, emp_id, session_no, coordinator_type, branch, department,
                coordinator_emp_id, coordinator_name, coordinator_email,
                sub_coordinator_emp_id, sub_coordinator_name, sub_coordinator_email, apprx_trainee_count, "update"],
                (historyErr) => {
                    if (historyErr) {
                        return res.status(500).json({ error: "Failed to insert sub-coordinator history", details: historyErr });
                    }
                    return res.status(201).json({ message: "Sub-coordinator information update successfully." });
                }
            );
        }
    );

    
};



exports.updateMappingSubCoordinator = (req, res) => {
    const {
        id,
        PMC_id,
        planing_id,
        emp_id,
        session_no,
        coordinator_type,
        branch,
        department,
        coordinator_emp_id,
        coordinator_name,
        coordinator_email,
        sub_coordinator_emp_id,
        sub_coordinator_name,
        sub_coordinator_email,
        apprx_trainee_count
    } = req.body;

    if (!id ||!PMC_id || !planing_id || !emp_id || !session_no || !sub_coordinator_emp_id || !sub_coordinator_name) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    const updateQuery = `
        UPDATE planing_mapping_sub_coordinator
        SET 
            coordinator_type = ?, 
            branch = ?, 
            department = ?, 
            coordinator_emp_id = ?, 
            coordinator_name = ?, 
            coordinator_email = ?, 
            sub_coordinator_emp_id = ?, 
            sub_coordinator_name = ?, 
            sub_coordinator_email = ?, 
            apprx_trainee_count = ?, 
            date_created = NOW(),
            PMC_id = ? ,
            planing_id = ?,
            session_no = ?
        WHERE id=?
    `;

    hrmdb.query(
        updateQuery,
        [coordinator_type, branch, department, coordinator_emp_id, coordinator_name, coordinator_email,
            sub_coordinator_emp_id, sub_coordinator_name, sub_coordinator_email, apprx_trainee_count, PMC_id, planing_id, session_no,id],
        (insertErr, insertResult) => {
            if (insertErr) {
                return res.status(500).json({ error: "Failed to insert sub-coordinator information", details: insertErr });
            }
            

            const insertHistoryQuery = `
                INSERT INTO planing_mapping_sub_coordinator_history (
                    PMC_id, PMSC_id, planing_id, emp_id, session_no, coordinator_type, branch, department,
                    coordinator_emp_id, coordinator_name, coordinator_email,
                    sub_coordinator_emp_id, sub_coordinator_name, sub_coordinator_email, apprx_trainee_count, date_created, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
            `;

            hrmdb.query(
                insertHistoryQuery,
                [PMC_id, id, planing_id, emp_id, session_no, coordinator_type, branch, department,
                coordinator_emp_id, coordinator_name, coordinator_email,
                sub_coordinator_emp_id, sub_coordinator_name, sub_coordinator_email, apprx_trainee_count, "update"],
                (historyErr) => {
                    if (historyErr) {
                        return res.status(500).json({ error: "Failed to insert sub-coordinator history", details: historyErr });
                    }
                    return res.status(201).json({ message: "Sub-coordinator information update successfully." });
                }
            );
        }
    );

    
};


exports.deleteMappingSubCoordinator = (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Missing required field: id." });
    }

    // Fetch the existing record to insert it into history before deleting
    const selectQuery = `
        SELECT 
            PMC_id, planing_id, emp_id, session_no, coordinator_type, branch, department,
            coordinator_emp_id, coordinator_name, coordinator_email,
            sub_coordinator_emp_id, sub_coordinator_name, sub_coordinator_email, apprx_trainee_count
        FROM planing_mapping_sub_coordinator
        WHERE id = ?
    `;

    hrmdb.query(selectQuery, [id], (selectErr, selectResult) => {
        if (selectErr) {
            return res.status(500).json({ error: "Failed to fetch record", details: selectErr });
        }
        if (selectResult.length === 0) {
            return res.status(404).json({ error: "Record not found with the given id." });
        }

        const {
            PMC_id,
            planing_id,
            emp_id,
            session_no,
            coordinator_type,
            branch,
            department,
            coordinator_emp_id,
            coordinator_name,
            coordinator_email,
            sub_coordinator_emp_id,
            sub_coordinator_name,
            sub_coordinator_email,
            apprx_trainee_count
        } = selectResult[0];

        // Delete the record from the main table
        const deleteQuery = `
            DELETE FROM planing_mapping_sub_coordinator
            WHERE id = ?
        `;

        hrmdb.query(
            deleteQuery,
            [id],
            (insertErr, insertResult) => {
                if (insertErr) {
                    return res.status(500).json({ error: "Failed to insert sub-coordinator information", details: insertErr });
                }
                
    
                const insertHistoryQuery = `
                    INSERT INTO planing_mapping_sub_coordinator_history (
                        PMC_id, PMSC_id, planing_id, emp_id, session_no, coordinator_type, branch, department,
                        coordinator_emp_id, coordinator_name, coordinator_email,
                        sub_coordinator_emp_id, sub_coordinator_name, sub_coordinator_email, apprx_trainee_count, date_created, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
                `;
    
                hrmdb.query(
                    insertHistoryQuery,
                    [PMC_id, id, planing_id, emp_id, session_no, coordinator_type, branch, department,
                    coordinator_emp_id, coordinator_name, coordinator_email,
                    sub_coordinator_emp_id, sub_coordinator_name, sub_coordinator_email, apprx_trainee_count, "delete"],
                    (historyErr) => {
                        if (historyErr) {
                            return res.status(500).json({ error: "Failed to insert sub-coordinator history", details: historyErr });
                        }
                        return res.status(201).json({ message: "Sub-coordinator information delete successfully." });
                    }
                );
            }
        );
    });
};

// coordinator with session SubCoordinatorSessionActiveList

exports.SubCoordinatorSessionActiveList= (req, res) => {
    const { planing_id ,session_no,coordinator_emp_id} = req.body;

    if (!planing_id || !session_no || !coordinator_emp_id) {
        return res.status(400).json({ error: 'Missing required fields: planing_id' });
    }

    const getAllQuery = `SELECT DISTINCT 
                        pmsc.sub_coordinator_emp_id AS sub_cc_id,
                        pmsc.*
                    FROM planing_mapping_sub_coordinator pmsc
                    LEFT JOIN planing_mapping_coordinator pmc 
                        ON pmsc.planing_id = pmc.planing_id 
                        AND pmsc.session_no = pmc.session_no 
                        AND pmsc.coordinator_emp_id = pmc.coordinator_emp_id
                    WHERE pmsc.planing_id = ?  
                    AND pmsc.session_no = ? 
                    AND pmsc.coordinator_emp_id = ? ;
                    `;
    hrmdb.query(getAllQuery, [planing_id,session_no,coordinator_emp_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ coordinators: results });
    });
};

//if planing id to get all SubCoordinator Session Active List
exports.PlanningToSessionAllSubCoordinatorActiveList= (req, res) => {
    const { planing_id } = req.body;

    if (!planing_id  ) {
        return res.status(400).json({ error: 'Missing required fields: planing_id' });
    }

    const getAllQuery = `SELECT
    pmsc.id,
    pmsc.planing_id,
    pmsc.session_no,
    pmsc.coordinator_emp_id,
    pmsc.coordinator_name,
    pmsc.coordinator_email,
    pmsc.sub_coordinator_emp_id,
    pmsc.sub_coordinator_name,
    pmsc.sub_coordinator_email,
    pmsc.apprx_trainee_count,
    pmsc.date_created
FROM planing_mapping_sub_coordinator pmsc
LEFT JOIN planing_mapping_coordinator pmc
    ON pmsc.planing_id = pmc.planing_id
    AND pmsc.session_no = pmc.session_no
WHERE pmsc.planing_id = ?
ORDER BY pmsc.session_no ASC;

                    `;
    hrmdb.query(getAllQuery, [planing_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ coordinators: results });
    });
};
exports.PlanningMainTableList= (req, res) => {
    const { planing_id } = req.body;

    if (!planing_id ) {
        return res.status(400).json({ error: 'Missing required fields: planing_id' });
    }

    const getAllQuery = `SELECT 
    pmsc.session_no AS session,
    GROUP_CONCAT(DISTINCT pmsc.department ORDER BY pmsc.department SEPARATOR ',') AS dept,
    pmsc.branch,
    pmsc.coordinator_emp_id AS coordinator_emp_id,
    pmsc.coordinator_name AS coordinator_name,
    pmsc.coordinator_email AS coordinator_email,
    pmc.apprx_trainee_count AS 'ex pcount',
    CONCAT('(', GROUP_CONCAT(DISTINCT pmsc.sub_coordinator_name ORDER BY pmsc.sub_coordinator_name SEPARATOR ')('), ')') AS 'sub_coordinator_names',
    GROUP_CONCAT(DISTINCT pmsc.sub_coordinator_emp_id ORDER BY pmsc.sub_coordinator_emp_id SEPARATOR ', ') AS sub_coordinator_emp_ids,
    GROUP_CONCAT(DISTINCT pmsc.sub_coordinator_email ORDER BY pmsc.sub_coordinator_email SEPARATOR ', ') AS sub_coordinator_emails,
    COUNT(pst.trainee_id) AS trainee_count,
    ps.PSstatus AS session_status -- Added PSstatus from planing_sessions
FROM 
    planing_mapping_sub_coordinator pmsc
LEFT JOIN 
    planing_mapping_coordinator pmc 
    ON pmsc.planing_id = pmc.planing_id 
    AND pmsc.session_no = pmc.session_no 
    AND pmsc.coordinator_emp_id = pmc.coordinator_emp_id
LEFT JOIN 
    planing_session_trainee_data pst
    ON pmsc.planing_id = pst.planing_id
    AND pmsc.session_no = pst.session_no
    AND FIND_IN_SET(pst.branch, REPLACE(pmsc.branch, ', ', ',')) > 0
    AND FIND_IN_SET(pst.department, REPLACE(pmsc.department, ', ', ',')) > 0
LEFT JOIN 
    planing_sessions ps -- Join with planing_sessions table
    ON pmsc.planing_id = ps.planing_id
    AND pmsc.session_no = ps.session_no
LEFT JOIN 
    planning_training_table ptt -- Join with planning_training_table
    ON pmsc.planing_id = ptt.id
WHERE 
    pmsc.planing_id = ?
    AND ps.calDeleteStatus = 0 -- Filter for calDeleteStatus = 0 in planing_sessions
    AND ptt.calDeleteStatus = 0 -- Filter for calDeleteStatus = 0 in planning_training_table
GROUP BY 
    pmsc.session_no, 
    pmsc.branch, 
    pmsc.coordinator_emp_id, 
    pmc.apprx_trainee_count,
    ps.PSstatus -- Include PSstatus in GROUP BY
ORDER BY 
    pmsc.session_no, 
    pmsc.branch;
                    `;
    hrmdb.query(getAllQuery, [planing_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ coordinators: results });
    });
};





