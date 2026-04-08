const jwt = require('jsonwebtoken');
const { leavemanagement, hrmdb } = require('../../../configuration/db');

// Function to get user data and generate token if active
exports.getAllData = (req, res) => {
    const { userid, password } = req.body;

    // Check if both userid and password are provided
    if (!userid || !password) {
        return res.status(400).json('User ID and Password are required');
    }

    const query = `
        SELECT u.full_name AS full_name, 
       u.email AS email, 
       u.emp_id AS emp_id,  
       u.mobile_number AS mobile_number, 
       u.reporting_branch_lta AS reporting_branch_lta, 
       u.employee_status AS employee_status, 
       u.department_id AS department_id, 
       d.department_code AS department_code, 
       bm.branch_name AS branch_name, 
       bm.branch_code AS branch_code, 
       bm.branch_type_code AS branch_type_code ,
       bm.branch_id AS 	branch_id
        FROM leavemanagement.user u 
        JOIN leavemanagement.branchmaster bm ON u.branch_id = bm.branch_id 
        JOIN leavemanagement.department d ON d.department_id = u.department_id 
        WHERE u.emp_id = ? AND u.password = ?;

    `;

    // Query to fetch user details
    leavemanagement.query(query, [userid, password], (err, result) => {
        if (err) {
            return res.status(500).json("The server is experiencing an issue");
        }
        if (result.length === 0) {
            return res.status(404).json("No information is available for this employee ID. Please verify the details or contact your local Branch IT representative.");
        }

        const user = result[0];

        // Check if the employee is active
        if (user.employee_status === 'yes') {
            let lndQuery = "SELECT * FROM assignuserrole WHERE empId=? AND userRoleDeleteStatus <> 1";
            hrmdb.query(lndQuery, [user.emp_id], (err, result1) => {
                if (err) {
                    return res.status(500).json({ message: "An error occurred", error: err });
                }

                const lndUser = result1[0] || {}; // Ensure an empty object if no data

                let userRole = lndUser.empAssignedRole || ""; // Set userRole to empty string if null
                let activeStatus = lndUser.activeStatus;

                if (activeStatus === null || activeStatus == 1) {
                    return res.status(403).json({ message: "Please contact your local Branch IT representative." });
                }

                // Generate JWT token
                const token = jwt.sign({ empid: user.emp_id }, 'NEIN_HRM', { expiresIn: '30m' });

                // Return user details along with token
                res.json({
                    userDetails: user,
                    userRole: userRole,
                    activeStat: activeStatus,
                    token: token,
                    message: "The employee is currently active.",
                });
            });

        } else {
            // If the employee is inactive, return a message
            res.status(403).json({
                message: "This employee is currently not active."
            });
        }
    });
};


exports.getAllData01 = (req, res) => {
    const { userid} = req.body;

    // Check if both userid and password are provided
    if (!userid ) {
        return res.status(400).json('User ID and Password are required');
    }

    const query = `
        SELECT u.full_name AS full_name, 
       u.email AS email, 
       u.emp_id AS emp_id,  
       u.mobile_number AS mobile_number, 
       u.reporting_branch_lta AS reporting_branch_lta, 
       u.employee_status AS employee_status, 
       u.department_id AS department_id, 
       d.department_code AS department_code, 
       bm.branch_name AS branch_name, 
       bm.branch_code AS branch_code, 
       bm.branch_type_code AS branch_type_code ,
       bm.branch_id AS 	branch_id
        FROM leavemanagement.user u 
        JOIN leavemanagement.branchmaster bm ON u.branch_id = bm.branch_id 
        JOIN leavemanagement.department d ON d.department_id = u.department_id 
        WHERE u.emp_id = ? ;

    `;

    // Query to fetch user details
    leavemanagement.query(query, [userid], (err, result) => {
        if (err) {
            return res.status(500).json("The server is experiencing an issue");
        }
        if (result.length === 0) {
            return res.status(404).json("No information is available for this employee ID. Please verify the details or contact your local Branch IT representative.");
        }

        const user = result[0];

        // Check if the employee is active
        if (user.employee_status === 'yes') {
            let lndQuery = "SELECT * FROM assignuserrole WHERE empId=? AND userRoleDeleteStatus <> 1";
            hrmdb.query(lndQuery, [user.emp_id], (err, result1) => {
                if (err) {
                    return res.status(500).json({ message: "An error occurred", error: err });
                }

                const lndUser = result1[0] || {}; // Ensure an empty object if no data

                let userRole = lndUser.empAssignedRole || ""; // Set userRole to empty string if null
                let activeStatus = lndUser.activeStatus;

                if (activeStatus === null || activeStatus == 1) {
                    return res.status(403).json({ message: "Please contact your local Branch IT representative." });
                }

                // Generate JWT token
                const token = jwt.sign({ empid: user.emp_id }, 'NEIN_HRM', { expiresIn: '30m' });

                // Return user details along with token
                res.json({
                    userDetails: user,
                    userRole: userRole,
                    activeStat: activeStatus,
                    token: token,
                    message: "The employee is currently active.",
                });
            });

        } else {
            // If the employee is inactive, return a message
            res.status(403).json({
                message: "This employee is currently not active."
            });
        }
    });
};


// Function to authenticate user and generate token
exports.authenticate = (req, res) => {
    const { empid, psw } = req.query;
    if (empid && psw) {
        const token = jwt.sign({ empid, psw }, 'NEIN_HRM', { expiresIn: '30m' });
        res.redirect(`https://yourdomain.com/login?token=${token}`);
    } else {
        res.status(400).send('Invalid credentials');
    }
};


// fuction   Active Empl List
exports.activeEmplList = (req, res) => {
    const query = "SELECT emp_id AS emp_id, full_name FROM `user` WHERE employee_status = 'yes'";

    // Query to fetch user details
    leavemanagement.query(query, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "An error occurred", error: err });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "No data found" });
        }

        // Return all active employees
        res.json({
            employees: result,
            message: "Active employees retrieved successfully"
        });
    });

};




exports.activeEmplList1 = (req, res) => {
    const query = `
    SELECT 
    u.user_id,
    u.emp_id, 
    u.full_name, 
    u.email, 
    u.mobile_number, 
    u.department_id, 
    d.department_name,  
    u.reporting_branch_lta, 
    u.branch_id,
    bm.branch_name, 
    bm.branch_code, 
    bm.branch_type_code 
FROM user u 
JOIN (
    SELECT DISTINCT ur.user_id
    FROM user_role ur
    WHERE ur.role_id NOT IN (26, 2, 3, 4, 13, 15, 18, 19, 20, 24, 25)
) filtered_users ON u.user_id = filtered_users.user_id
JOIN branchmaster bm ON u.branch_id = bm.branch_id
JOIN department d ON u.department_id = d.department_id  
WHERE u.employee_status = 'yes';

`;

    // Query to fetch user details
    leavemanagement.query(query, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "An error occurred", error: err });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "No data found" });
        }

        // Return all active employees
        res.json({
            employees: result,
            message: "Active employees retrieved successfully"
        });
    });

};

exports.activeEmplListTrainees = (req, res) => {
    const { branch, department } = req.body;

    console.log("🔍 activeEmplListTrainees called with:", { branch, department });

    // Split comma-separated strings into arrays and trim whitespace
    const branchList = branch
        ? branch.split(",").map(b => b.trim()).filter(Boolean)
        : [];
    const deptList = department
        ? department.split(",").map(d => d.trim()).filter(Boolean)
        : [];

    console.log("📋 Branch list:", branchList);
    console.log("📋 Dept list:", deptList);

    let query = `
        SELECT 
            u.user_id,
            u.emp_id, 
            u.full_name, 
            u.email, 
            u.mobile_number, 
            u.department_id, 
            d.department_name,  
            u.reporting_branch_lta, 
            u.branch_id,
            bm.branch_name, 
            bm.branch_code, 
            bm.branch_type_code 
        FROM leavemanagement.user u 
        JOIN leavemanagement.branchmaster bm ON u.branch_id = bm.branch_id
        JOIN leavemanagement.department d ON u.department_id = d.department_id  
        WHERE u.employee_status = 'yes'
    `;

    const params = [];

    if (branchList.length > 0) {
        const placeholders = branchList.map(() => "?").join(", ");
        query += ` AND UPPER(bm.branch_name) IN (${placeholders})`;
        branchList.forEach(b => params.push(b.toUpperCase()));
    }

    if (deptList.length > 0) {
        const placeholders = deptList.map(() => "?").join(", ");
        query += ` AND UPPER(d.department_name) IN (${placeholders})`;
        deptList.forEach(d => params.push(d.toUpperCase()));
    }

    console.log("📋 Final query:", query);
    console.log("📋 Params count:", params.length);

    leavemanagement.query(query, params, (err, result) => {
        if (err) {
            console.error("❌ activeEmplListTrainees DB error:", {
                message: err.message,
                code: err.code,
                sqlState: err.sqlState,
            });
            return res.status(500).json({ 
                message: "An error occurred", 
                error: err.message,
                code: err.code 
            });
        }

        console.log(`✅ Found ${result.length} employees`);

        return res.status(200).json({ 
            employees: result || [],
            message: result.length > 0 
                ? "Active employees retrieved successfully" 
                : "No employees found for this branch/department"
        });
    });
};

// loginAuditController.js

exports.Log_Audit = (req, res) => {
    const { action, empId } = req.body;
    
    // Validate input fields
    if (!action || !empId ) {
        return res.status(400).json({ error: 'Missing required fields: action, empId, systemIP' });
    }

    // Query to insert login action
    const insertQuery = `
        INSERT INTO Login_actions (action, empId, systemIP, date)
        VALUES (?, ?, ?, NOW())
    `;
    
    hrmdb.query(insertQuery, [action, empId, req.ip], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to log login action', details: err });
        }
        
        return res.status(200).json({ 
            message: 'Login action logged successfully',
            logId: results.insertId 
        });
    });
};

// Utility function to be called during login/logout
// exports.logLoginAction = (action, empId, systemIP, callback) => {
//     if (!action || !empId ) {
//         if (callback) callback(new Error('Missing required parameters'));
//         return;
//     }

//     const insertQuery = `
//         INSERT INTO Login_actions (action, empId, systemIP, date)
//         VALUES (?, ?, ?, NOW())
//     `;
    
//     hrmdb.query(insertQuery, [action, empId, req.ip], (err, results) => {
//         if (err) {
//             console.error('Failed to log login action:', err);
//             if (callback) callback(err);
//             return;
//         }
//         if (callback) callback(null, results.insertId);
//     });
// };
exports.logLoginAction = (action, empId, details, systemIP, callback) => {
    if (!action || !empId) {
        if (callback) callback(new Error('Missing required parameters'));
        return;
    }

    // Debug: Log all received parameters
    console.log('Received parameters:', {
        action,
        empId,
        details,
        systemIP,
        callbackExists: !!callback
    });

    // Handle parameter overloading more safely
    if (typeof callback === 'undefined') {
        if (typeof systemIP === 'function') {
            callback = systemIP;
            systemIP = null;
        } else if (typeof details === 'function') {
            callback = details;
            details = null;
        }
    }

    const ipToUse = systemIP || (typeof req !== 'undefined' ? req.ip : null);

    console.log('Final parameters for insertion:', {
        action,
        empId,
        systemIP: ipToUse,
        details
    });

    const insertQuery = `
        INSERT INTO login_actions (action, empId, systemIP, details, date)
        VALUES (?, ?, ?, ?, NOW())
    `;
    
    hrmdb.query(insertQuery, [action, empId, ipToUse, details || null], (err, results) => {
        if (err) {
            console.error('Database error:', err.message);
            console.error('Full error object:', err);
            if (callback) callback(err);
            return;
        }
        console.log('Insert successful, insertId:', results.insertId);
        if (callback) callback(null, results.insertId);
    });
};


// trainee (user alert  information detaions)

exports.activeEmplList16666 = (req, res) => {
    const query = `SELECT 
    u.emp_id, 
    u.full_name, 
    u.email, 
    u.mobile_number, 
    u.department_id, 
    d.department_name,  
    u.reporting_branch_lta, 
    u.branch_id,  -- Added comma here
    bm.branch_name, 
    bm.branch_code, 
    bm.branch_type_code 
FROM user u 
JOIN branchmaster bm ON u.branch_id = bm.branch_id
JOIN department d ON u.department_id = d.department_id  
WHERE u.employee_status = 'yes' 
`;

    // Query to fetch user details
    leavemanagement.query(query, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "An error occurred", error: err });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "No data found" });
        }

        // Return all active employees
        res.json({
            employees: result,
            message: "Active employees retrieved successfully"
        });
    });

};
