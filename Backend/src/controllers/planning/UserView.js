
const { hrmdb } = require('../../../configuration/db');


exports.UserViewListBasisBranch = (req, res) => {
    const {trainer_code, branch_id } = req.body;
    
    if (!branch_id || !trainer_code) {
        return res.status(400).json({ error: "Branch ID or trainer_code is required" });
    }

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
    MAX(ps.date_created) AS session_date_created  -- Using MAX to avoid grouping issues
FROM 
    hrmdb.planning_training_table pt
LEFT JOIN 
    hrmdb.training_topic tt 
    ON pt.training_topic_id = tt.id
LEFT JOIN 
    hrmdb.staff_category sc 
    ON pt.staff_category_id = sc.id
LEFT JOIN 
    hrmdb.training_type ttype 
    ON pt.training_type_id = ttype.id
LEFT JOIN 
    leavemanagement.branchmaster bm 
    ON FIND_IN_SET(bm.branch_id, pt.branch_id) > 0
LEFT JOIN 
    leavemanagement.department dept
    ON FIND_IN_SET(dept.department_id, pt.department_id) > 0
LEFT JOIN 
    hrmdb.planing_sessions ps 
    ON pt.id = ps.planing_id
WHERE 
    (ps.trainer_code = ? OR FIND_IN_SET(?, pt.branch_id) > 0)  -- Merge conditions
    AND pt.Status != 'Cancelled'  -- Exclude cancelled training
GROUP BY 
    pt.id, pt.emp_id, pt.user_name, pt.user_email, pt.planning_type, pt.planning_date, 
    pt.date_created, pt.remarks, pt.status, pt.cancelled_reason, 
    tt.training_topic, sc.staff_category, ttype.training_type
`;

    hrmdb.query(getAllQuery, [trainer_code,branch_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json(results);
    });
};


exports.UserViewListBasisTrainee = (req, res) => {
    const { trainee_id } = req.body;

    if (!trainee_id) {
        return res.status(400).json({ error: "trainee_idis required" });
    }

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
    ps.date_created AS session_date_created,
    pst.trainee_id,
    pst.trainee_name,
    pst.trainee_mail,
    pst.trainee_branch,
    pst.trainee_department,
    pst.attendance_status
FROM 
    hrmdb.planning_training_table pt
LEFT JOIN 
    hrmdb.training_topic tt 
    ON pt.training_topic_id = tt.id
LEFT JOIN 
    hrmdb.staff_category sc 
    ON pt.staff_category_id = sc.id
LEFT JOIN 
    hrmdb.training_type ttype 
    ON pt.training_type_id = ttype.id
LEFT JOIN 
    leavemanagement.branchmaster bm 
    ON FIND_IN_SET(bm.branch_id, pt.branch_id) > 0
LEFT JOIN 
    leavemanagement.department dept
    ON FIND_IN_SET(dept.department_id, pt.department_id) > 0
LEFT JOIN 
    hrmdb.planing_sessions ps 
    ON pt.id = ps.planing_id
LEFT JOIN 
    hrmdb.planing_session_trainee_data pst 
    ON pt.id = pst.planing_id 
    AND ps.session_no = pst.session_no 
    AND pst.calDeleteStatus = 0 -- Only active trainees
WHERE 
    pst.trainee_id = ? -- Filter by specific trainee
    AND pt.status != 'Cancelled'  -- Exclude cancelled training
GROUP BY 
    pt.id, pst.trainee_id
    
    
    `;

    hrmdb.query(getAllQuery, [trainee_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json(results);
    });
};

// exports.UserViewListBasisBranch = (req, res) => {
//     const { branch_id,department_id } = req.body;
    
//     if (!branch_id) {
//         return res.status(400).json({ error: "Branch ID is required" });
//     }

//     const getAllQuery = `
//     SELECT 
//     pt.id,
//     pt.emp_id,
//     pt.user_name,
//     pt.user_email,
//     pt.planning_type,
//     pt.planning_date,
//     pt.date_created,
//     pt.remarks,
//     pt.status,
//     pt.cancelled_reason,
//     tt.training_topic,
//     sc.staff_category,
//     ttype.training_type,
//     GROUP_CONCAT(DISTINCT bm.branch_name ORDER BY bm.branch_id) AS branch_names,
//     GROUP_CONCAT(DISTINCT dept.department_name ORDER BY dept.department_id) AS department_names,
//     ps.date_created AS session_date_created
// FROM 
//     (SELECT * FROM hrmdb.planning_training_table 
//      WHERE FIND_IN_SET(?, branch_id) > 0 
//      AND Status != 'Cancelled') AS pt -- First filter by branch_id
// LEFT JOIN 
//     hrmdb.training_topic tt 
//     ON pt.training_topic_id = tt.id
// LEFT JOIN 
//     hrmdb.staff_category sc 
//     ON pt.staff_category_id = sc.id
// LEFT JOIN 
//     hrmdb.training_type ttype 
//     ON pt.training_type_id = ttype.id
// LEFT JOIN 
//     leavemanagement.branchmaster bm 
//     ON FIND_IN_SET(bm.branch_id, pt.branch_id) > 0
// LEFT JOIN 
//     leavemanagement.department dept
//     ON FIND_IN_SET(dept.department_id, pt.department_id) > 0
// LEFT JOIN 
//     hrmdb.planing_sessions ps 
//     ON pt.id = ps.planing_id
// WHERE 
//     FIND_IN_SET(?, pt.department_id) > 0 -- Further filter by department_id
// GROUP BY 
//     pt.id;

// `;

//     hrmdb.query(getAllQuery, [branch_id,department_id], (err, results) => {
//         if (err) {
//             console.error('Database error:', err);
//             return res.status(500).json({ error: 'Database error', details: err });
//         }
//         return res.status(200).json(results);
//     });
// };