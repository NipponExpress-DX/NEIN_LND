const { hrmdb } = require('../../../configuration/db');


exports.getFunctionsList = (req, res) => {
    const getAllQuery = `SELECT * FROM rolefunctiontable `;
    hrmdb.query(getAllQuery, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ topics: results });
    });
};




exports.addRoleManagement = (req, res) => {
    const { role, function_list, createdBy } = req.body;

    // Validate required fields
    if (!role || !function_list || !createdBy) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    // Table name
    const tableName = "rolemanagementtable";

    // Query to check if role already exists
    const checkRoleQuery = `SELECT rmt_id FROM ${tableName} WHERE role = ?`;

    hrmdb.query(checkRoleQuery, [role], (err, results) => {
        if (err) {
            console.error("Error checking role existence:", err);
            return res.status(500).json({ error: "Failed to check role existence.", details: err });
        }

        if (results.length > 0) {
            // Role exists, update it
            const rmt_id = results[0].rmt_id; // Get the primary key

            const updateRoleQuery = `
                UPDATE ${tableName}
                SET
                    createdBy = ?,
                    createdOn = NOW(),
                    function_list = ?,
                    roleDeleteStatus = ?
                WHERE rmt_id = ? 
            `;

            const updateValues = [
                createdBy,
                JSON.stringify(function_list), // Convert function_list to JSON string
                0, // roleDeleteStatus
                rmt_id
            ];

            hrmdb.query(updateRoleQuery, updateValues, (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Error updating role details:", updateErr);
                    return res.status(500).json({ error: "Failed to update role details.", details: updateErr });
                }

                return res.status(200).json({
                    message: "Role management details successfully updated.",
                    affectedRows: updateResult.affectedRows
                });
            });
        } else {
            // Role does not exist, insert new one
            const insertRoleQuery = `
                INSERT INTO ${tableName} (
                    createdBy,
                    createdOn,
                    roleDeleteStatus,
                    role,
                    function_list
                ) VALUES (?, NOW(), ?, ?, ?)
            `;

            const insertValues = [
                createdBy,
                0, // roleDeleteStatus (default to active)
                role,
                JSON.stringify(function_list) // Convert function_list to JSON string
            ];

            hrmdb.query(insertRoleQuery, insertValues, (insertErr, insertResult) => {
                if (insertErr) {
                    console.error("Error inserting role details:", insertErr);
                    return res.status(500).json({ error: "Failed to insert role details.", details: insertErr });
                }

                return res.status(200).json({
                    message: "Role management details successfully inserted.",
                    insertedId: insertResult.insertId
                });
            });
        }
    });
};

exports.UpdateRoleManagement = (req, res) => {
    const { role, function_list, createdBy } = req.body;

    // Validate required fields
    if (!role || !function_list || !createdBy) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    // Table name
    const tableName = "rolemanagementtable";

    // Query to check if role already exists
    const checkRoleQuery = `SELECT rmt_id FROM ${tableName} WHERE role = ?`;

    hrmdb.query(checkRoleQuery, [role], (err, results) => {
        if (err) {
            console.error("Error checking role existence:", err);
            return res.status(500).json({ error: "Failed to check role existence.", details: err });
        }

        if (results.length > 0) {
            // Role exists, update it
            const rmt_id = results[0].rmt_id; // Get the primary key

            const updateRoleQuery = `
                UPDATE ${tableName}
                SET
                    createdBy = ?,
                    createdOn = NOW(),
                    function_list = ?,
                    roleDeleteStatus = ?
                WHERE rmt_id = ? 
            `;

            const updateValues = [
                createdBy,
                JSON.stringify(function_list), // Convert function_list to JSON string
                0, // roleDeleteStatus
                rmt_id
            ];

            hrmdb.query(updateRoleQuery, updateValues, (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Error updating role details:", updateErr);
                    return res.status(500).json({ error: "Failed to update role details.", details: updateErr });
                }

                return res.status(200).json({
                    message: "Role management details successfully updated.",
                    affectedRows: updateResult.affectedRows
                });
            });
        } else {
            // Role does not exist, insert new one
            return res.status(404).json({ error: "Role does not exist." });
        }
    });
};


exports.DeleteRoleManagement = (req, res) => {
    const { role,  createdBy } = req.body;

    // Validate required fields
    if (!role  || !createdBy) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    // Table name
    const tableName = "rolemanagementtable";

    // Query to check if role already exists
    const checkRoleQuery = `SELECT rmt_id FROM ${tableName} WHERE role = ?`;

    hrmdb.query(checkRoleQuery, [role], (err, results) => {
        if (err) {
            console.error("Error checking role existence:", err);
            return res.status(500).json({ error: "Failed to check role existence.", details: err });
        }

        if (results.length > 0) {
            // Role exists, update it
            const rmt_id = results[0].rmt_id; // Get the primary key

            const updateRoleQuery = `
                UPDATE ${tableName}
                SET
                    createdBy = ?,
                    createdOn = NOW(),
                    roleDeleteStatus = ?
                WHERE rmt_id = ? 
            `;

            const updateValues = [
                createdBy,
                1, // roleDeleteStatus
                rmt_id
            ];

            hrmdb.query(updateRoleQuery, updateValues, (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Error updating role details:", updateErr);
                    return res.status(500).json({ error: "Failed to update role details.", details: updateErr });
                }

                return res.status(200).json({
                    message: "Role management details  successfully Deleted.",
                    affectedRows: updateResult.affectedRows
                });
            });
        } else {
            // Role does not exist, insert new one
            return res.status(404).json({ error: "Role does not exist." });
        }
    });
};



exports.ListRoleManagement = (req, res) => {
    const getAllQuery = `SELECT 
            rm.rmt_id, 
            rm.role, 
            rm.	function_list, 
            u.user_name AS createdBy, 
            rm.createdOn
        FROM hrmdb.rolemanagementtable rm
        JOIN leavemanagement.user u 
            ON rm.createdBy = u.emp_id
        WHERE rm.roleDeleteStatus = 0;

 `;
    hrmdb.query(getAllQuery, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json( results );
    });
};


// exports.FunctionalityListforRoleManagement = (req, res) => {
//     let { userRole } = req.body;

//     if (!userRole || userRole.trim() === "") {
//         // Default permissions when no role is provided
//         return res.status(200).json({
//             "Training Summary": {
//                 "Training user View": { "View": 1, "View/Create/Edit": 1 }
//             },
//             "Dashboard": {
//                 "User-Dashboard": {
//                    "View": 1, "View/Create/Edit": 1 
//                 }
//             }
//         });
//     }

//     let roleIds = userRole.split(',').map(id => id.trim());

//     const getRoleNamesQuery = `SELECT roleName FROM rolemaster WHERE role_id IN (${roleIds.map(() => '?').join(',')})`;

//     hrmdb.query(getRoleNamesQuery, roleIds, (err, roleResults) => {
//         if (err) {
//             console.error('Database error:', err);
//             return res.status(500).json({ error: 'Database error', details: err });
//         }

//         if (roleResults.length === 0) {
//             roleIds = [""]; // If no valid roles exist, use a default role
//         } else {
//             roleIds = roleResults.map(row => row.roleName);
//         }

//         const getAllQuery = `SELECT rmt.role, rmt.function_list FROM rolemanagementtable rmt
//                              WHERE rmt.role IN (${roleIds.map(() => '?').join(',')}) AND rmt.roleDeleteStatus = 0`;

//         hrmdb.query(getAllQuery, roleIds, (err, results) => {
//             if (err) {
//                 console.error('Database error:', err);
//                 return res.status(500).json({ error: 'Database error', details: err });
//             }

//             let finalPermissions = {};
//             let uniqueBranches = new Set();
//             let uniqueDepartments = new Set();

//             results.forEach(row => {
//                 let functionList;

//                 try {
//                     if (typeof row.function_list === "string") {
//                         functionList = JSON.parse(row.function_list);
//                     } else if (typeof row.function_list === "object") {
//                         functionList = row.function_list;
//                     } else {
//                         functionList = {};
//                     }
//                 } catch (error) {
//                     console.error("Invalid JSON in function_list:", row.function_list, error);
//                     functionList = {};
//                 }

//                 Object.keys(functionList).forEach(category => {
//                     if (!finalPermissions[category]) {
//                         finalPermissions[category] = {};
//                     }

//                     Object.keys(functionList[category]).forEach(subCategory => {
//                         if (!finalPermissions[category][subCategory]) {
//                             finalPermissions[category][subCategory] = { "View": 0, "View/Create/Edit": 0 };
//                         }

//                         if (functionList[category][subCategory]["View"]) {
//                             finalPermissions[category][subCategory]["View"] = 1;
//                         }
//                         if (functionList[category][subCategory]["View/Create/Edit"]) {
//                             finalPermissions[category][subCategory]["View/Create/Edit"] = 1;
//                         }
//                     });
//                 });

//                 if (functionList["Branch Assign"] && functionList["Branch Assign"]["Branch Select"] && functionList["Branch Assign"]["Branch Select"]["Branch List"]) {
//                     functionList["Branch Assign"]["Branch Select"]["Branch List"].forEach(branch => uniqueBranches.add(branch));
//                 }

//                 if (functionList["Department Assign"] && functionList["Department Assign"]["Department Select"] && functionList["Department Assign"]["Department Select"]["Department List"]) {
//                     functionList["Department Assign"]["Department Select"]["Department List"].forEach(department => uniqueDepartments.add(department));
//                 }
//             });

//             finalPermissions["Branch Assign"] = { "Branch Select": { "Branch List": Array.from(uniqueBranches) } };
//             finalPermissions["Department Assign"] = { "Department Select": { "Department List": Array.from(uniqueDepartments) } };

//             return res.status(200).json(finalPermissions);
//         });
//     });
// };


exports.FunctionalityListforRoleManagement = (req, res) => {
    let { userRole } = req.body;

    if (!userRole || userRole.trim() === "") {
        // Default permissions when no role is provided
        return res.status(200).json({
            "Training Summary": {
                "Training user View": { "View": 1, "View/Create/Edit": 1 }
            },
            "Dashboard": {
                "User-Dashboard": {
                    "View": 1, "View/Create/Edit": 1
                }
            }
        });
    }

    let roleIds = userRole.split(',').map(id => id.trim());

    const getRoleNamesQuery = `SELECT roleName FROM rolemaster WHERE role_id IN (${roleIds.map(() => '?').join(',')})`;

    hrmdb.query(getRoleNamesQuery, roleIds, (err, roleResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }

        if (roleResults.length === 0) {
            roleIds = [""]; // If no valid roles exist, use a default role
        } else {
            roleIds = roleResults.map(row => row.roleName);
        }

        const getAllQuery = `SELECT rmt.role, rmt.function_list FROM rolemanagementtable rmt
                             WHERE rmt.role IN (${roleIds.map(() => '?').join(',')}) AND rmt.roleDeleteStatus = 0`;

        hrmdb.query(getAllQuery, roleIds, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error', details: err });
            }

            let finalPermissions = {};
            let uniqueBranches = new Set();
            let uniqueDepartments = new Set();

            results.forEach(row => {
                let functionList;

                try {
                    if (typeof row.function_list === "string") {
                        functionList = JSON.parse(row.function_list);
                    } else if (typeof row.function_list === "object") {
                        functionList = row.function_list;
                    } else {
                        functionList = {};
                    }
                } catch (error) {
                    console.error("Invalid JSON in function_list:", row.function_list, error);
                    functionList = {};
                }

                Object.keys(functionList).forEach(category => {
                    if (!finalPermissions[category]) {
                        finalPermissions[category] = {};
                    }

                    Object.keys(functionList[category]).forEach(subCategory => {
                        if (!finalPermissions[category][subCategory]) {
                            finalPermissions[category][subCategory] = { "View": 0, "View/Create/Edit": 0 };
                        }

                        if (functionList[category][subCategory]["View"]) {
                            finalPermissions[category][subCategory]["View"] = 1;
                        }
                        if (functionList[category][subCategory]["View/Create/Edit"]) {
                            finalPermissions[category][subCategory]["View/Create/Edit"] = 1;
                        }
                    });
                });

                if (functionList["Branch Assign"] && functionList["Branch Assign"]["Branch Select"] && functionList["Branch Assign"]["Branch Select"]["Branch List"]) {
                    functionList["Branch Assign"]["Branch Select"]["Branch List"].forEach(branch => uniqueBranches.add(branch));
                }

                if (functionList["Department Assign"] && functionList["Department Assign"]["Department Select"] && functionList["Department Assign"]["Department Select"]["Department List"]) {
                    functionList["Department Assign"]["Department Select"]["Department List"].forEach(department => uniqueDepartments.add(department));
                }
            });

            // Ensure default modules are present
            const defaultModules = {
                "Training Summary": {
                    "Training user View": { "View": 1, "View/Create/Edit": 1 }
                },
                "Dashboard": {
                    "User-Dashboard": { "View": 1, "View/Create/Edit": 1 }
                }
            };

            Object.entries(defaultModules).forEach(([module, submodules]) => {
                if (!finalPermissions[module]) {
                    finalPermissions[module] = {};
                }
                Object.entries(submodules).forEach(([submodule, actions]) => {
                    if (!finalPermissions[module][submodule]) {
                        finalPermissions[module][submodule] = actions;
                    }
                });
            });

            // Add branch and department lists
            finalPermissions["Branch Assign"] = {
                "Branch Select": {
                    "Branch List": Array.from(uniqueBranches)
                }
            };

            finalPermissions["Department Assign"] = {
                "Department Select": {
                    "Department List": Array.from(uniqueDepartments)
                }
            };

            return res.status(200).json(finalPermissions);
        });
    });
};



// exports.FunctionalityListforRoleManagement = (req, res) => {
//     let { userRole } = req.body;

//     if (!userRole || userRole.trim() === "") {
//         userRole = ""; // Default role if no role is provided
//     }

//     let roleIds = userRole.split(',').map(id => id.trim());

//     const getRoleNamesQuery = `SELECT roleName FROM rolemaster WHERE role_id IN (${roleIds.map(() => '?').join(',')})`;

//     hrmdb.query(getRoleNamesQuery, roleIds, (err, roleResults) => {
//         if (err) {
//             console.error('Database error:', err);
//             return res.status(500).json({ error: 'Database error', details: err });
//         }

//         if (roleResults.length === 0) {
//             roleIds = [""]; // If no valid roles exist, default to role 5
//         } else {
//             roleIds = roleResults.map(row => row.roleName);
//         }

//         const getAllQuery = `SELECT rmt.role, rmt.function_list FROM rolemanagementtable rmt
//                              WHERE rmt.role IN (${roleIds.map(() => '?').join(',')}) AND rmt.roleDeleteStatus = 0`;

//         hrmdb.query(getAllQuery, roleIds, (err, results) => {
//             if (err) {
//                 console.error('Database error:', err);
//                 return res.status(500).json({ error: 'Database error', details: err });
//             }

//             let finalPermissions = {
//                 "Training Summary": {
//                     "Training user View": { "View": 1, "View/Create/Edit": 1 },
//                 }
//             };

//             results.forEach(row => {
//                 let functionList;

//                 try {
//                     // 🛠 Ensure `function_list` is a string before parsing
//                     if (typeof row.function_list === "string") {
//                         functionList = JSON.parse(row.function_list);
//                     } else if (typeof row.function_list === "object") {
//                         functionList = row.function_list; // Already an object
//                     } else {
//                         functionList = {}; // Default empty object if null or invalid
//                     }
//                 } catch (error) {
//                     console.error("Invalid JSON in function_list:", row.function_list, error);
//                     functionList = {}; // Default empty object if parsing fails
//                 }

//                 Object.keys(functionList).forEach(category => {
//                     if (!finalPermissions[category]) {
//                         finalPermissions[category] = {};
//                     }

//                     Object.keys(functionList[category]).forEach(subCategory => {
//                         if (!finalPermissions[category][subCategory]) {
//                             finalPermissions[category][subCategory] = { "View": 0, "View/Create/Edit": 0 };
//                         }

//                         finalPermissions[category][subCategory]["View"] |= functionList[category][subCategory]["View"];
//                         finalPermissions[category][subCategory]["View/Create/Edit"] |= functionList[category][subCategory]["View/Create/Edit"];
//                     });
//                 });
//             });

//             return res.status(200).json(finalPermissions);
//         });
//     });
// };



