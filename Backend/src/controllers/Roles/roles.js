const { hrmdb } = require('../../../configuration/db');



exports.addRole = (req, res) => {
    const {
        roleDescription,
        roleName,
        roleCreatedBy
    } = req.body;

    // Validate required fields
    if (!roleCreatedBy || !roleDescription || !roleName) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    // Table name
    const tableName = "rolemaster";

    // Query to check if roleName already exists
    const checkRoleQuery = `SELECT role_id FROM ${tableName} WHERE roleName = ?`;

    hrmdb.query(checkRoleQuery, [roleName], (err, results) => {
        if (err) {
            console.error("Error checking roleName existence:", err);
            return res.status(500).json({ error: "Failed to check role existence.", details: err });
        }

        if (results.length > 0) {
            // Record exists, update it
            const role_id = results[0].role_id; // Get the role_id from the results
            const updateRoleQuery = `
                UPDATE ${tableName}
                SET
                    roleCreatedBy = ?,
                    roleCreatedOn = NOW(),
                    roleDeleteStatus = ?,
                    roleDescription = ?
                WHERE role_id = ? 
            `;

            const updateValues = [
                roleCreatedBy,
                0, // roleDeleteStatus (default to active)
                roleDescription,
                role_id
            ];

            hrmdb.query(updateRoleQuery, updateValues, (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Error updating role details:", updateErr);
                    return res.status(500).json({ error: "Failed to update role details.", details: updateErr });
                }

                return res.status(200).json({
                    message: "Role details successfully updated.",
                    affectedRows: updateResult.affectedRows
                });
            });
        } else {
            // Record does not exist, insert a new one
            const insertRoleQuery = `
                INSERT INTO ${tableName} (
                    roleCreatedBy,
                    roleCreatedOn,
                    roleDeleteStatus,
                    roleDescription,
                    roleName
                ) VALUES (?, NOW(), ?, ?, ?)
            `;

            const insertValues = [
                roleCreatedBy,
                0, // roleDeleteStatus (default to active)
                roleDescription,
                roleName
            ];

            hrmdb.query(insertRoleQuery, insertValues, (insertErr, insertResult) => {
                if (insertErr) {
                    console.error("Error inserting role details:", insertErr);
                    return res.status(500).json({ error: "Failed to insert role details.", details: insertErr });
                }

                return res.status(200).json({
                    message: "Role details successfully inserted.",
                    insertedId: insertResult.insertId
                });
            });
        }
    });
};




exports.deleteRole = (req, res) => {
    const {
        roleName,
        roleCreatedBy
    } = req.body;

    // Validate required fields
    if (!roleName || !roleCreatedBy) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    // Table name
    const tableName = "rolemaster";

    // Query to check if roleName exists
    const checkRoleQuery = `SELECT role_id FROM ${tableName} WHERE roleName = ?`;

    hrmdb.query(checkRoleQuery, [roleName], (err, results) => {
        if (err) {
            console.error("Error checking role existence:", err);
            return res.status(500).json({ error: "Failed to check role existence.", details: err });
        }

        if (results.length > 0) {
            const role_id = results[0].role_id; 
            // Record exists, update roleDeleteStatus to 1 (soft delete)
            const updateRoleQuery = `
                UPDATE ${tableName}
                SET
                    roleDeleteStatus = ?,
                    roleCreatedBy = ?,
                    roleCreatedOn = NOW()
                WHERE role_id = ?
            `;

            const updateValues = [
                1, // roleDeleteStatus (mark as deleted)
                roleCreatedBy,
                role_id
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


exports.listRole = (req, res) => {
    

    // Query to get active roles
    const checkRoleQuery = `
        SELECT 
            rm.role_id, 
            rm.roleName, 
            rm.roleDescription, 
            u.user_name AS roleCreatedBy, 
            rm.roleCreatedOn 
        FROM hrmdb.rolemaster rm
        JOIN leavemanagement.user u 
            ON rm.roleCreatedBy = u.emp_id
        WHERE rm.roleDeleteStatus = 0;

    `;

    hrmdb.query(checkRoleQuery, (err, results) => {
        if (err) {
            console.error("Error fetching roles:", err);
            return res.status(500).json({ error: "Failed to retrieve roles.", details: err });
        }

        return res.status(200).json({results });
    });
};

