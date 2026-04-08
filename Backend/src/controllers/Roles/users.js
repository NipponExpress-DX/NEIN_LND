const { hrmdb } = require('../../../configuration/db');

exports.addUserRole = (req, res) => {
    const {
        createdBy,
        empAssignedRole,
        empId
    } = req.body;

    // Validate required fields
    if (!createdBy || !empAssignedRole || !empId) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    // Table name
    const tableName = "assignuserrole";

    // Query to check if empId already exists
    const checkRoleQuery = `SELECT ra_id FROM ${tableName} WHERE empId = ?`;

    hrmdb.query(checkRoleQuery, [empId], (err, results) => {
        if (err) {
            console.error("Error checking empId existence:", err);
            return res.status(500).json({ error: "Failed to check user role existence.", details: err });
        }

        if (results.length > 0) {
            // Record exists, update it
            const ra_id = results[0].ra_id; // Get the ra_id from the results
            const updateRoleQuery = `
                UPDATE ${tableName}
                SET
                    activeStatus = ?, 
                    createdBy = ?, 
                    createdOn = NOW(),
                    empAssignedRole = ?, 
                    userRoleDeleteStatus = ?
                WHERE ra_id = ? 
            `;

            const updateValues = [
                0, // activeStatus (default to active)
                createdBy,
                empAssignedRole,
                0, // userRoleDeleteStatus (default to active)
                ra_id
            ];

            hrmdb.query(updateRoleQuery, updateValues, (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Error updating user role details:", updateErr);
                    return res.status(500).json({ error: "Failed to update user role details.", details: updateErr });
                }

                return res.status(200).json({
                    message: "User role details successfully updated.",
                    affectedRows: updateResult.affectedRows
                });
            });
        } else {
            // Record does not exist, insert a new one
            const insertRoleQuery = `
                INSERT INTO ${tableName} (
                    activeStatus, 
                    createdBy, 
                    createdOn, 
                    empAssignedRole, 
                    empId, 
                    userRoleDeleteStatus
                ) VALUES (?, ?,NOW(), ?, ?, ?)
            `;

            const insertValues = [
                0, // activeStatus (default to active)
                createdBy, 
                empAssignedRole,
                empId,
                0 // userRoleDeleteStatus (default to active)
            ];

            hrmdb.query(insertRoleQuery, insertValues, (insertErr, insertResult) => {
                if (insertErr) {
                    console.error("Error inserting user role details:", insertErr);
                    return res.status(500).json({ error: "Failed to insert user role details.", details: insertErr });
                }

                return res.status(200).json({
                    message: "User role details successfully inserted.",
                    insertedId: insertResult.insertId
                });
            });
        }
    });
};



exports.deletUsereRole = (req, res) => {
    const {
        createdBy,
        empId,
           } = req.body;

    // Validate required fields
    if (!createdBy || !empId) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    // Table name
    const tableName = "assignuserrole";

    // Query to check if roleName exists
    const checkRoleQuery = `SELECT ra_id FROM ${tableName} WHERE empId= ?`;

    hrmdb.query(checkRoleQuery, [empId], (err, results) => {
        if (err) {
            console.error("Error checking role existence:", err);
            return res.status(500).json({ error: "Failed to check role existence.", details: err });
        }

        if (results.length > 0) {

            const ra_id = results[0].ra_id; 
            // Record exists, update roleDeleteStatus to 1 (soft delete)
            const updateRoleQuery = `
                UPDATE ${tableName}
                SET
                    
                    createdBy = ?,  
                    createdOn = NOW(),
                    userRoleDeleteStatus = ?
                WHERE ra_id = ? 
            `;

            const updateValues = [
                
                createdBy,
                 1, // userRoleDeleteStatus (de-active)
                ra_id
            ];


            hrmdb.query(updateRoleQuery, updateValues, (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Error updating role details:", updateErr);
                    return res.status(500).json({ error: "Failed to update role details.", details: updateErr });
                }

                return res.status(200).json({
                    message: "Role successfully deleted.",
                    affectedRows: updateResult.affectedRows
                });
            });
        } else {
            return res.status(404).json({ error: "Role not found." });
        }
    });
};


exports.UpdateUserRole = (req, res) => {
    const {
        createdBy,
        empAssignedRole,
        empId
    } = req.body;

    // Validate required fields
    if (!createdBy || !empAssignedRole || !empId) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    // Table name
    const tableName = "assignuserrole";

    // Query to check if empId already exists
    const checkRoleQuery = `SELECT ra_id FROM ${tableName} WHERE empId = ?`;

    hrmdb.query(checkRoleQuery, [empId], (err, results) => {
        if (err) {
            console.error("Error checking empId existence:", err);
            return res.status(500).json({ error: "Failed to check user role existence.", details: err });
        }

        if (results.length > 0) {
            // Record exists, update it
            const ra_id = results[0].ra_id; // Get the ra_id from the results
            const updateRoleQuery = `
                UPDATE ${tableName}
                SET
                     createdBy = ?, 
                    createdOn = NOW(),
                    empAssignedRole = ?
                    WHERE ra_id = ? 
            `;

            const updateValues = [
             
                createdBy,
                empAssignedRole,
                ra_id
            ];

            hrmdb.query(updateRoleQuery, updateValues, (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Error updating user role details:", updateErr);
                    return res.status(500).json({ error: "Failed to update user role details.", details: updateErr });
                }

                return res.status(200).json({
                    message: "User role details successfully updated.",
                    affectedRows: updateResult.affectedRows
                });
            });
        }
    });
};



exports.activeStatusUserRole = (req, res) => {
    const {
        createdBy,
        empId,
        activeStatus
    } = req.body;
console.log("im here");
console.log(req.body);
console.log("im not here");

    // Validate required fields
    if (!createdBy || !empId) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    // Table name
    const tableName = "assignuserrole";

    // Query to check if empId already exists
    const checkRoleQuery = `SELECT ra_id, activeStatus FROM ${tableName} WHERE empId = ?`;

    hrmdb.query(checkRoleQuery, [empId], (err, results) => {
        if (err) {
            console.error("Error checking empId existence:", err);
            return res.status(500).json({ error: "Failed to check user role existence.", details: err });
        }

        if (results.length > 0) {
            // Record exists, toggle activeStatus
            const ra_id = results[0].ra_id; // Get the ra_id from the results
            const currentStatus = results[0].activeStatus;
            const newStatus = currentStatus === 1 ? 0 : 1;

            const updateRoleQuery = `
                UPDATE ${tableName}
                SET createdBy = ?, createdOn = NOW(), activeStatus = ?
                WHERE ra_id = ? 
            `;

            const updateValues = [createdBy, newStatus, ra_id];

            hrmdb.query(updateRoleQuery, updateValues, (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Error updating user role details:", updateErr);
                    return res.status(500).json({ error: "Failed to update user role details.", details: updateErr });
                }

                return res.status(200).json({
                    message: "User role status successfully updated.",
                    newActiveStatus: newStatus,
                    affectedRows: updateResult.affectedRows
                });
            });
        } else {
            return res.status(404).json({ error: "User role not found." });
        }
    });
};


exports.activeListUserRole = (req, res) => {
   
   

    // Query to fetch active user roles
    const checkRoleQuery = `SELECT 
            a.ra_id,
            a.empId, 
            u1.user_name AS empName,  -- user_name for empId
             (
                SELECT GROUP_CONCAT(r.roleName ORDER BY r.role_id SEPARATOR ',') 
                FROM hrmdb.rolemaster r 
                WHERE FIND_IN_SET(r.role_id, a.empAssignedRole)
            ) AS empAssignedRoleNames, -- Converts role IDs to role names
            u2.user_name AS createdByName,  -- user_name for createdBy
            a.createdOn,
            a.activeStatus
        FROM hrmdb.assignuserrole a
        LEFT JOIN leavemanagement.user u1 ON a.empId = u1.emp_id
        LEFT JOIN leavemanagement.user u2 ON a.createdBy = u2.emp_id
        WHERE a.userRoleDeleteStatus = 0;
        `;

    hrmdb.query(checkRoleQuery, (err, results) => {
        if (err) {
            console.error("Error fetching active user roles:", err);
            return res.status(500).json({ error: "Failed to fetch active user roles.", details: err });
        }

        return res.status(200).json({
            message: "Active user roles retrieved successfully.",
            data: results
        });
    });
};


exports.activeListUserRoleToEMPOnly = (req, res) => {
    const {
        empId
    } = req.body;
  
    // Validate required fields
    if ( !empId) {
        return res.status(400).json({ error: "Missing required fields." });
    }
   
   

    // Query to fetch active user roles
    const checkRoleQuery = `SELECT 
            
            a.empId, 
            u1.user_name AS empName,  -- user_name for empId
             (
                SELECT GROUP_CONCAT(r.roleName ORDER BY r.role_id SEPARATOR ',') 
                FROM hrmdb.rolemaster r 
                WHERE FIND_IN_SET(r.role_id, a.empAssignedRole)
            ) AS empAssignedRoleNames 
                      
        FROM hrmdb.assignuserrole a
        LEFT JOIN leavemanagement.user u1 ON a.empId = u1.emp_id
        LEFT JOIN leavemanagement.user u2 ON a.createdBy = u2.emp_id
        WHERE a.userRoleDeleteStatus = 0 and empId = ?;
        `;

    hrmdb.query(checkRoleQuery,[empId], (err, results) => {
        if (err) {
            console.error("Error fetching active user roles:", err);
            return res.status(500).json({ error: "Failed to fetch active user roles.", details: err });
        }

        return res.status(200).json({
               data: results
        });
    });
};



