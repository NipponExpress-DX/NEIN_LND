const { hrmdb,leavemanagement } = require('../../../configuration/db');
const { listRole } = require('../Roles/roles');

// Helper function to log history
function logHistory(hrmdb, empId, trainer_type, trainerName, phoneNumber, mailId, companyName, vendor_code, location, specialization, userBy, user_name, status, callback) {
    if (isNaN(empId)) {
        console.error("empId must be a number");
        return callback(new Error("Invalid empId type"));
    }

    const insertHistoryQuery = `
        INSERT INTO trainer_information_history 
        (emp_id, trainer_type, full_name, mobile_number, email, company_name, vendor_code, location, specialization, user_created_by, user_name, user_created_time, Status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
    `;

    hrmdb.query(insertHistoryQuery, [
        empId, trainer_type, trainerName, phoneNumber, mailId, companyName, vendor_code, location, specialization, userBy, user_name, status
    ], callback);
}



// Function to insert or update trainer information
exports.addTrainerInformation = (req, res) => {
    const {
        emp_id,
        trainer_type,
        trainerName,
        phoneNumber,
        mailId,
        companyName,
        location,
        vendor_code,
        specialization,
        user_created_by,
        user_name
    } = req.body;

    // Check required fields
    if (!trainer_type || !trainerName || !mailId || !user_created_by) {
        return res.status(400).json({ error: "Missing required fields: trainer_type, trainerName, mailId, or user_created_by" });
    }

    let checkTrainerQuery, checkTrainerParam;
    if (trainer_type === "internal") {
        checkTrainerQuery = "SELECT * FROM trainer_information WHERE emp_id = ?";
        checkTrainerParam = [emp_id];
    } else {
        checkTrainerQuery = "SELECT * FROM trainer_information WHERE email = ?";
        checkTrainerParam = [mailId];
    }

    hrmdb.query(checkTrainerQuery, checkTrainerParam, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }

        if (results.length > 0) {
            // Trainer exists -> Update the record
            const updateQuery = trainer_type === "internal"
                ? `UPDATE trainer_information 
                   SET trainer_type = ?, full_name = ?, mobile_number = ?, company_name = ?, vendor_code = ?, 
                       location = ?, specialization = ?, calDeleteStatus = 0, user_created_by = ?, user_name = ?, 
                       user_created_time = NOW() 
                   WHERE emp_id = ?`
                : `UPDATE trainer_information 
                   SET trainer_type = ?, full_name = ?, mobile_number = ?, company_name = ?, vendor_code = ?, 
                       location = ?, specialization = ?, calDeleteStatus = 0, user_created_by = ?, user_name = ?, 
                       user_created_time = NOW() 
                   WHERE email = ?`;

            const updateParams = trainer_type === "internal"
                ? [trainer_type, trainerName, phoneNumber, companyName, vendor_code, location, specialization, user_created_by, user_name, emp_id]
                : [trainer_type, trainerName, phoneNumber, companyName, vendor_code, location, specialization, user_created_by, user_name, mailId];

            hrmdb.query(updateQuery, updateParams, (updateErr) => {
                if (updateErr) {
                    console.error("Failed to update trainer information:", updateErr);
                    return res.status(500).json({ error: "Failed to update trainer information", details: updateErr });
                }
                return res.status(200).json({ message: "Trainer information updated successfully." });
            });
        } else {
            // Trainer does not exist -> Insert new record
            const insertQuery = `INSERT INTO trainer_information 
                (calDeleteStatus, emp_id, trainer_type, full_name, mobile_number, email, company_name, vendor_code, 
                 location, specialization, user_created_by, user_name, user_created_time) 
                VALUES (0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

            const insertParams = trainer_type === "internal"
                ? [emp_id, trainer_type, trainerName, phoneNumber, mailId, companyName, null, location, specialization, user_created_by, user_name]
                : [null, trainer_type, trainerName, phoneNumber, mailId, companyName, vendor_code, location, specialization, user_created_by, user_name];

            hrmdb.query(insertQuery, insertParams, (insertErr) => {
                if (insertErr) {
                    console.error("Failed to insert trainer information:", insertErr);
                    return res.status(500).json({ error: "Failed to insert trainer information", details: insertErr });
                }
                return res.status(201).json({ message: "Trainer information added successfully." });
            });
        }
    });
};


// Function to update trainer information
exports.updateTrainerInformationExternal = (req, res) => {
    const {
        trinfo_id,
        emp_id,
        trainer_type,
        trainerName,
        phoneNumber,
        mailId,
        companyName,
        location,
        vendor_code,
        specialization,
        user_created_by,
        user_name
    } = req.body;

    // Check required fields
    if (!trinfo_id || !trainer_type || !trainerName || !mailId || !user_created_by) {
        return res.status(400).json({ error: "Missing required fields: trinfo_id, trainer_type, trainerName, mailId, or user_created_by" });
    }

    // Check if the trainer exists
    const checkTrainerQuery = "SELECT * FROM trainer_information WHERE trinfo_id = ?";
    
    hrmdb.query(checkTrainerQuery, [trinfo_id], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }

        if (results.length > 0) {
            // Trainer exists -> Update the record
            const updateQuery = `UPDATE trainer_information 
                   SET trainer_type = ?, full_name = ?, mobile_number = ?, email = ?, company_name = ?, 
                       vendor_code = ?, location = ?, specialization = ?, calDeleteStatus = 0, 
                       user_created_by = ?, user_name = ?, user_created_time = NOW() 
                   WHERE trinfo_id = ?`;

            const updateParams = [trainer_type, trainerName, phoneNumber, mailId, companyName, 
                                  vendor_code, location, specialization, user_created_by, user_name, trinfo_id];

            hrmdb.query(updateQuery, updateParams, (updateErr) => {
                if (updateErr) {
                    console.error("Failed to update trainer information:", updateErr);
                    return res.status(500).json({ error: "Failed to update trainer information", details: updateErr });
                }
                return res.status(200).json({ message: "Trainer information updated successfully." });
            });
        } else {
            return res.status(404).json({ error: "Trainer not found with provided trinfo_id" });
        }
    });
};



// Function to delete (mark as inactive) a trainer
exports.deleteTrainerInformation = (req, res) => {
    const {
        trinfo_id,
        user_created_by,
        user_name
    } = req.body;
  console.log(req.body);
  
    // Check required fields
    if (!trinfo_id || !user_created_by) {
        return res.status(400).json({ error: "Missing required fields: trinfo_id or user_created_by" });
    }

    // Check if the trainer exists
    const checkTrainerQuery = "SELECT * FROM trainer_information WHERE trinfo_id = ?";
    
    hrmdb.query(checkTrainerQuery, [trinfo_id], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }

        if (results.length > 0) {
            // Trainer exists -> Update the record
            const updateQuery = `UPDATE trainer_information 
                   SET  calDeleteStatus = 1, 
                       user_created_by = ?, user_name = ?, user_created_time = NOW() 
                   WHERE trinfo_id = ?`;

            const updateParams = [ user_created_by, user_name, trinfo_id];

            hrmdb.query(updateQuery, updateParams, (updateErr) => {
                if (updateErr) {
                    console.error("Failed to update trainer information:", updateErr);
                    return res.status(500).json({ error: "Failed to update trainer information", details: updateErr });
                }
                return res.status(200).json({ message: "Trainer information de-activated successfully." });
            });
        } else {
            return res.status(404).json({ error: "Trainer not found with provided trinfo_id" });
        }
    });
};



// Function to get all active trainers External trainers information and all headers
exports.getAllActiveTrainersList = (req, res) => {

    const getAllQuery = `SELECT 	trinfo_id,emp_id,full_name,trainer_type,mobile_number,email,vendor_code,company_name,location,specialization,user_created_by,	user_name,user_created_time FROM trainer_information  WHERE calDeleteStatus = 0  ORDER BY specialization ASC`; // Changed '0' to integer
    hrmdb.query(getAllQuery, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ trainers: results });
    });
};








// // Function to get all active trainers External trainers information
// exports.getAllActiveTrainersExternal = (req, res) => {
//     const getAllQuery = `SELECT emp_id,	full_name,mobile_number,email,company_name,location,specialization FROM trainer_information `; // Changed '0' to integer
//     hrmdb.query(getAllQuery, (err, results) => {
//         if (err) {
//             console.error('Database error:', err);
//             return res.status(500).json({ error: 'Database error', details: err });
//         }
//         return res.status(200).json({ trainers: results });
//     });
// };

// // Function to get all active coor Internal trainers information
exports.getActiveEmpList = (req, res) => {
    const getAllQuery = `SELECT u.emp_id, u.full_name, u.email, u.reporting_branch_lta, bm.branch_name, bm.branch_code, bm.branch_type_code FROM user u JOIN branchmaster bm ON u.branch_id = bm.branch_id
     WHERE 	employee_status = 'yes' `; // Changed '0' to integer
    leavemanagement.query(getAllQuery, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ trainers: results });
    });
};





