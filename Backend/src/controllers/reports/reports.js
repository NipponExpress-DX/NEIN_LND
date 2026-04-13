const { hrmdb } = require('../../../configuration/db');


exports.ReportsTotalHoursSpend= (req, res) => {
    
    
    

    const getAllQuery = `
    SELECT 
    tt.department_name AS "Dept",
    tt.training_topic AS "Training Topic",
    sc.staff_category AS "Targeted Participants",
    ttype.training_type AS "Trainer Type",
    ps.session_description AS "Description",
    ps.trainer_name AS "Trainer Name",
    ps.trainer_type,
    DATE_FORMAT(ps.session_date, '%d-%m-%Y') AS "Training Date",
    ROUND(TIME_TO_SEC(TIMEDIFF(ps.to_time, ps.from_time)) / 3600, 1) AS "No Of Hours",
    ROUND(TIME_TO_SEC(TIMEDIFF(ps.to_time, ps.from_time)) / 3600 * COUNT(DISTINCT pstd.trainee_id), 1) AS "Total Training Hours",
    CASE 
        WHEN FIND_IN_SET('ALL', COALESCE(pt.branch_id, '')) > 0 OR COUNT(DISTINCT bm.branch_id) > 10
        THEN 'PAN INDIA' 
        ELSE GROUP_CONCAT(DISTINCT bm.branch_name ORDER BY bm.branch_id SEPARATOR ', ') 
    END AS "Branch",
    ps.mode_of_training AS "Mode of Training",
    COUNT(DISTINCT pstd.trainee_id) AS "Participants"
FROM 
    (SELECT @row_number:=0) AS temp,
    hrmdb.planning_training_table pt
LEFT JOIN 
    hrmdb.training_topic tt ON pt.training_topic_id = tt.id
LEFT JOIN 
    hrmdb.staff_category sc ON pt.staff_category_id = sc.id
LEFT JOIN 
    hrmdb.training_type ttype ON pt.training_type_id = ttype.id
LEFT JOIN 
    leavemanagement.branchmaster bm ON FIND_IN_SET(bm.branch_id, COALESCE(pt.branch_id, '')) > 0
LEFT JOIN 
    hrmdb.planing_sessions ps ON pt.id = ps.planing_id
LEFT JOIN 
    hrmdb.planing_session_trainee_data pstd ON ps.planing_id = pstd.planing_id AND ps.session_no = pstd.session_no AND pstd.calDeleteStatus = 0
WHERE 
    pt.Status != 'Cancelled' 
    AND pt.calDeleteStatus = 0
    AND ps.calDeleteStatus = 0
    AND ps.PSstatus='Session Closed'
   
    AND tt.calDeleteStatus = 0
    AND sc.calDeleteStatus = 0
    AND ttype.calDeleteStatus = 0
GROUP BY 
    pt.id, ps.id, tt.id, sc.id, ttype.id
ORDER BY 
    ps.session_date, tt.department_name

`;
// AND attendance_status = 1 AND  pt.Status='Final Submitted' AND ps.PSstatus='Session Closed'
    hrmdb.query(getAllQuery, [], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json(results);
    });
};

exports.ReportsAuditLogs= (req, res) => {
    const {trainer_code, branch_id } = req.body;
    
    

    const getAllQuery = `
    SELECT 
    la.id AS login_action_id,
     u.full_name AS full_name,
      d.department_code AS department_code,
    bm.branch_name AS branch_name,
    la.action AS login_action,
    la.systemIP AS system_ip,
    la.date AS login_date
   
   
FROM 
    hrmdb.login_actions la
JOIN 
    leavemanagement.user u ON la.empId = u.emp_id
JOIN 
    leavemanagement.branchmaster bm ON u.branch_id = bm.branch_id
JOIN 
    leavemanagement.department d ON d.department_id = u.department_id

`;
// AND attendance_status = 1 AND  pt.Status='Final Submitted' AND ps.PSstatus='Session Closed'
    hrmdb.query(getAllQuery, [], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json(results);
    });
};




exports.FeedBackReportsCombined123= (req, res) => {


    const query = `
        SELECT 
            ps.planing_id,
            ps.session_no,
            ps.session_code,
            tt.department_name AS "Dept",
            tt.training_topic AS "Training Topic",
            sc.staff_category AS "Targeted Participants",
            ttype.training_type AS "Trainer Type",
            ps.session_description AS "Description",
            ps.trainer_name AS "Trainer Name",
            ps.trainer_type,
            DATE_FORMAT(ps.session_date, '%d-%m-%Y') AS "Training Date",
            DATE_FORMAT(ps.from_time, '%h:%i %p') AS from_time,
           DATE_FORMAT(ps.to_time, '%h:%i %p') AS to_time,

         CASE 
                WHEN FIND_IN_SET('ALL', COALESCE(pt.branch_id, '')) > 0 OR COUNT(DISTINCT bm.branch_id) > 10
                THEN 'PAN INDIA' 
                ELSE GROUP_CONCAT(DISTINCT bm.branch_name ORDER BY bm.branch_id SEPARATOR ', ') 
            END AS "Branch",
            ps.mode_of_training AS "Mode of Training",
            COUNT(DISTINCT pstd.trainee_id) AS "Participants",
            pt.id AS planing_id,
            ps.id AS session_id,
            pstd.trainee_department,
            pstd.feedback_form_submition_date,
            COUNT(DISTINCT CASE WHEN pstd.feedback_form_submition_date IS NOT NULL THEN pstd.trainee_id END) AS "Trainee Feedbacks",
            CASE WHEN ps.feedback_form_submition_date IS NOT NULL THEN 'Yes' ELSE 'No' END AS "Trainer Feedback Submitted"
        FROM 
            hrmdb.planning_training_table pt
        LEFT JOIN 
            hrmdb.training_topic tt ON pt.training_topic_id = tt.id
        LEFT JOIN 
            hrmdb.staff_category sc ON pt.staff_category_id = sc.id
        LEFT JOIN 
            hrmdb.training_type ttype ON pt.training_type_id = ttype.id
        LEFT JOIN 
            leavemanagement.branchmaster bm ON FIND_IN_SET(bm.branch_id, COALESCE(pt.branch_id, '')) > 0
        LEFT JOIN 
            hrmdb.planing_sessions ps ON pt.id = ps.planing_id
        LEFT JOIN 
            hrmdb.planing_session_trainee_data pstd ON ps.planing_id = pstd.planing_id 
                AND ps.session_no = pstd.session_no 
                AND pstd.calDeleteStatus = 0
        WHERE 
            pt.Status = 'Final Submitted'
            AND pt.calDeleteStatus = 0
            AND ps.calDeleteStatus = 0
            AND ps.PSstatus = 'Session Closed'
            AND tt.calDeleteStatus = 0
            AND sc.calDeleteStatus = 0
            AND ttype.calDeleteStatus = 0
           
           
        GROUP BY 
            pt.id, ps.id, tt.id, sc.id, ttype.id
        ORDER BY 
            ps.session_date, tt.department_name
    `;

    // console.log('Final SQL query:', query);

    hrmdb.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        
        console.log('Query results:', results);
        
        if (results.length === 0) {
            return res.status(200).json({ message: 'No records found matching the criteria' });
        }
        
        return res.status(200).json(results);
    });
};

// In reports controller — FeedBackReportsCombined
exports.FeedBackReportsCombined = (req, res) => {

    let { branch_list, department_list } = req.body;
    console.log("FeedBack Reports DataTable:", req.body);

    if (typeof branch_list === 'string') {
        branch_list = branch_list.split(',').map(id => id.trim());
    }
    if (typeof department_list === 'string') {
        department_list = department_list.split(',').map(id => id.trim());
    }

    if (!branch_list || !department_list || branch_list.length === 0 || department_list.length === 0) {
        return res.status(400).json({ error: 'At least one branch and one department are required.' });
    }

    const branchCondition = branch_list.map(b => `FIND_IN_SET(${b}, pt.branch_id) > 0`).join(" OR ");
    const departmentCondition = department_list.map(d => `FIND_IN_SET(${d}, pt.department_id) > 0`).join(" OR ");

    const query = `
        SELECT 
            ps.planing_id,
            ps.session_no,
            ps.session_code,
            tt.department_name AS Dept,
            tt.training_topic AS \`Training Topic\`,
            sc.staff_category AS \`Targeted Participants\`,
            ttype.training_type AS \`Trainer Type\`,
            ps.session_description AS Description,
            ps.trainer_name AS \`Trainer Name\`,
            ps.trainer_type,
            DATE_FORMAT(ps.session_date, '%d-%m-%Y') AS \`Training Date\`,
            DATE_FORMAT(ps.from_time, '%h:%i %p') AS from_time,
            DATE_FORMAT(ps.to_time, '%h:%i %p') AS to_time,
            CASE 
                WHEN FIND_IN_SET('ALL', COALESCE(pt.branch_id, '')) > 0 
                     OR COUNT(DISTINCT bm.branch_id) > 10
                THEN 'PAN INDIA' 
                ELSE GROUP_CONCAT(DISTINCT bm.branch_name ORDER BY bm.branch_id SEPARATOR ', ') 
            END AS Branch,
            ps.mode_of_training AS \`Mode of Training\`,
            COUNT(DISTINCT pstd.trainee_id) AS Participants,
            pt.id AS planing_id,
            ps.id AS session_id,
            pstd.trainee_department,
            pstd.feedback_form_submition_date,
            pstd.feedback_form_Assign_final_submit_date,
            COUNT(DISTINCT CASE WHEN pstd.feedback_form_submition_date IS NOT NULL THEN pstd.trainee_id END) AS \`Trainee Feedbacks\`,
            CASE WHEN ps.feedback_form_submition_date IS NOT NULL THEN 'Yes' ELSE 'No' END AS \`Trainer Feedback Submitted\`
        FROM 
            hrmdb.planning_training_table pt
        LEFT JOIN 
            hrmdb.training_topic tt ON pt.training_topic_id = tt.id
        LEFT JOIN 
            hrmdb.staff_category sc ON pt.staff_category_id = sc.id
        LEFT JOIN 
            hrmdb.training_type ttype ON pt.training_type_id = ttype.id
        LEFT JOIN 
            leavemanagement.branchmaster bm ON FIND_IN_SET(bm.branch_id, COALESCE(pt.branch_id, '')) > 0
        LEFT JOIN 
            hrmdb.planing_sessions ps ON pt.id = ps.planing_id
        LEFT JOIN 
            hrmdb.planing_session_trainee_data pstd 
                ON ps.planing_id = pstd.planing_id 
                AND ps.session_no = pstd.session_no 
                AND pstd.calDeleteStatus = 0
        WHERE 
            pt.calDeleteStatus = 0
            AND ps.calDeleteStatus = 0
            AND ps.PSstatus = 'Session Closed'
            AND tt.calDeleteStatus = 0
            AND sc.calDeleteStatus = 0
            AND ttype.calDeleteStatus = 0
            AND pt.Status NOT IN ('Cancelled', 'Training Created')
            AND (${branchCondition})
            AND (${departmentCondition})
        GROUP BY 
            pt.id, ps.id, tt.id, sc.id, ttype.id
        ORDER BY 
            ps.session_date, tt.department_name
    `;

    hrmdb.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json(results.length > 0 ? results : []);
    });
};



exports.TrainerFeedbackDetails = (req, res) => {
    const { planing_id, session_no } = req.body;

    if (!planing_id || !session_no) {
        return res.status(400).json({ error: 'planing_id and session_no are required' });
    }

    const query = `
        SELECT 
            ps.id AS session_id,
            pt.id AS planing_id,
            ps.trainer_name,
            ps.trainer_email,
            ps.trainer_type,
            ps.feedback_form_name,
            ps.feedback_form_question,
            ps.feedback_form_answer,
            ps.feedback_form_comments_or_suggestions,
            ps.feedback_form_submition_date,
            DATE_FORMAT(ps.session_date, '%d-%m-%Y') AS session_date,
            ps.from_time,
            ps.to_time,
            tt.training_topic,
            sc.staff_category,
            ttype.training_type
        FROM 
            hrmdb.planing_sessions ps
        JOIN 
            hrmdb.planning_training_table pt ON ps.planing_id = pt.id
        LEFT JOIN 
            hrmdb.training_topic tt ON pt.training_topic_id = tt.id
        LEFT JOIN 
            hrmdb.staff_category sc ON pt.staff_category_id = sc.id
        LEFT JOIN 
            hrmdb.training_type ttype ON pt.training_type_id = ttype.id
        WHERE 
            pt.id = ?
            AND ps.session_no = ?
            AND pt.calDeleteStatus = 0
            AND ps.calDeleteStatus = 0
            AND ps.PSstatus = 'Session Closed'
    `;

    hrmdb.query(query, [planing_id, session_no], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json(results[0] || {});
    });
};



exports.TraineeFeedbackDetails = (req, res) => {
    const { planing_id, session_no } = req.body;

    if (!planing_id || !session_no) {
        return res.status(400).json({ error: 'planing_id and session_no are required' });
    }

    const query = `
        SELECT 
            pstd.id,
            pstd.trainee_id,
            pstd.trainee_name,
            pstd.trainee_mail,
            pstd.trainee_branch,
            pstd.trainee_department,
            pstd.attendance_status,
            pstd.feedback_form_name,
            pstd.feedback_form_question,
            pstd.feedback_form_answer,
            pstd.feedback_form_comments_or_suggestions,
            pstd.feedback_form_submition_date
        FROM 
            hrmdb.planing_session_trainee_data pstd
        LEFT JOIN 
            leavemanagement.branchmaster bm ON pstd.trainee_branch = bm.branch_id
        LEFT JOIN 
            leavemanagement.department  dm ON pstd.trainee_department = dm.department_id
        WHERE 
            pstd.planing_id = ?
            AND pstd.session_no = ?
            AND pstd.calDeleteStatus = 0
            AND pstd.feedback_form_submition_date IS NOT NULL
        ORDER BY 
            pstd.trainee_name
    `;

    hrmdb.query(query, [planing_id, session_no], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json(results);
    });
};




