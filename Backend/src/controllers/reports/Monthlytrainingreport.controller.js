const { hrmdb } = require('../../../configuration/db');

/**
 * Monthly Training Report
 * Returns per-session rows with full training details.
 * Trainings at ALL stages are included (Training Created → Session Closed).
 * Supports optional filters: branch_list, department_list, from_date, to_date, month, year
 */
exports.MonthlyTrainingReport = (req, res) => {
    let { branch_list, department_list, from_date, to_date, month, year } = req.body;

    if (typeof branch_list === 'string')     branch_list     = branch_list.split(',').map(s => s.trim()).filter(Boolean);
    if (typeof department_list === 'string') department_list = department_list.split(',').map(s => s.trim()).filter(Boolean);

    // Default year to current if nothing provided
    if (!year && !from_date && !to_date) {
        year = new Date().getFullYear();
    }

    const params = [];
    const ptConditions = [
        'pt.calDeleteStatus = 0',
        "pt.Status != 'Cancelled'",
    ];
    const dateConditions = [];

    // ✅ Each condition handles session_date NULL vs NOT NULL separately
    if (month && year) {
        dateConditions.push(`(
            (ps.session_date IS NOT NULL AND MONTH(ps.session_date) = ? AND YEAR(ps.session_date) = ?)
            OR
            (ps.session_date IS NULL AND MONTH(pt.planning_date) = ? AND YEAR(pt.planning_date) = ?)
        )`);
        params.push(parseInt(month), parseInt(year), parseInt(month), parseInt(year));
    } else if (year) {
        dateConditions.push(`(
            (ps.session_date IS NOT NULL AND YEAR(ps.session_date) = ?)
            OR
            (ps.session_date IS NULL AND YEAR(pt.planning_date) = ?)
        )`);
        params.push(parseInt(year), parseInt(year));
    }

    if (from_date) {
        dateConditions.push(`(
            (ps.session_date IS NOT NULL AND ps.session_date >= STR_TO_DATE(?, '%d-%m-%Y'))
            OR
            (ps.session_date IS NULL AND pt.planning_date >= STR_TO_DATE(?, '%d-%m-%Y'))
        )`);
        params.push(from_date, from_date);
    }
    if (to_date) {
        dateConditions.push(`(
            (ps.session_date IS NOT NULL AND ps.session_date <= STR_TO_DATE(?, '%d-%m-%Y'))
            OR
            (ps.session_date IS NULL AND pt.planning_date <= STR_TO_DATE(?, '%d-%m-%Y'))
        )`);
        params.push(to_date, to_date);
    }

    if (branch_list && branch_list.length > 0) {
        const branchCond = branch_list.map(() => `FIND_IN_SET(?, pt.branch_id) > 0`).join(' OR ');
        ptConditions.push(`(${branchCond})`);
        branch_list.forEach(b => params.push(b));
    }

    if (department_list && department_list.length > 0) {
        const deptCond = department_list.map(() => `FIND_IN_SET(?, pt.department_id) > 0`).join(' OR ');
        ptConditions.push(`(${deptCond})`);
        department_list.forEach(d => params.push(d));
    }

    // ✅ No wrapper needed — each dateCondition handles NULL internally
    const allConditions = [
        ...ptConditions,
        ...dateConditions,
    ];

    const whereClause = `WHERE ${allConditions.join(' AND ')}`;

    const query = `
        SELECT
            DATE_FORMAT(COALESCE(ps.session_date, pt.planning_date), '%d-%m-%Y') AS training_date,
            ps.session_code                                                        AS training_ref_no,

            CASE
                WHEN pt.branch_id IS NULL OR pt.branch_id = '' THEN 'PAN INDIA'
                WHEN (LENGTH(pt.branch_id) - LENGTH(REPLACE(pt.branch_id, ',', ''))) >= 10 THEN 'PAN INDIA'
                WHEN FIND_IN_SET('ALL', pt.branch_id) > 0 THEN 'PAN INDIA'
                ELSE (
                    SELECT GROUP_CONCAT(DISTINCT bm2.branch_name ORDER BY bm2.branch_id SEPARATOR ', ')
                    FROM leavemanagement.branchmaster bm2
                    WHERE FIND_IN_SET(bm2.branch_id, pt.branch_id) > 0
                )
            END                                                                    AS branch,

            (SELECT COUNT(*) FROM hrmdb.planing_sessions ps2
             WHERE ps2.planing_id = pt.id AND ps2.calDeleteStatus = 0)            AS no_of_sessions,

            tt.training_topic,
            tt.department_name                                                     AS department,
            ps.session_description                                                 AS session_title,
            ttype.training_type                                                    AS type_of_training,

            /* ── Trainer info ── */
            ps.trainer_type                                                        AS trainer_type,
            ps.trainer_name                                                        AS trainer,
            ps.trainer_code                                                        AS trainer_emp_id,

            /* ── Internal trainer: resolve full name from employee table ── */
            CASE
                WHEN ps.trainer_type = 'Internal'
                THEN COALESCE(emp.full_name, ps.trainer_name)
                ELSE ps.trainer_name
            END                                                                    AS trainer_display,

            /* ── Internal trainer department ── */
            CASE
                WHEN ps.trainer_type = 'Internal'
                THEN dept.department_name
                ELSE NULL
            END                                                                    AS trainer_department,

            ps.mode_of_training                                                    AS mode,

            /* ── Trainee counts ── */
            COUNT(DISTINCT pstd.trainee_id)                                        AS trainee_count,
            COUNT(DISTINCT CASE WHEN pstd.attendance_status = 1
                  THEN pstd.trainee_id END)                                        AS attended_count,

            pt.Status                                                              AS training_status,
            ps.PSstatus                                                            AS session_status,

            COUNT(DISTINCT CASE WHEN pstd.feedback_form_submition_date IS NOT NULL
                  THEN pstd.trainee_id END)                                        AS feedback_submitted,
            (COUNT(DISTINCT pstd.trainee_id) -
             COUNT(DISTINCT CASE WHEN pstd.feedback_form_submition_date IS NOT NULL
                  THEN pstd.trainee_id END))                                       AS feedback_pending,

            pt.emp_id                                                              AS created_by_emp_id,
            pt.user_name                                                           AS created_by,

            (SELECT GROUP_CONCAT(DISTINCT pmc2.coordinator_name ORDER BY pmc2.id SEPARATOR ', ')
             FROM hrmdb.planing_mapping_coordinator pmc2
             WHERE pmc2.planing_id = pt.id AND pmc2.session_no = ps.session_no)   AS coordinator_names,

            (SELECT GROUP_CONCAT(DISTINCT pmc3.coordinator_email ORDER BY pmc3.id SEPARATOR ', ')
             FROM hrmdb.planing_mapping_coordinator pmc3
             WHERE pmc3.planing_id = pt.id AND pmc3.session_no = ps.session_no)   AS coordinator_emails,

            pt.id                                                                  AS planing_id,
            ps.id                                                                  AS session_id,
            ps.session_no,
            sc.staff_category                                                      AS targeted_participants,
            ROUND(TIME_TO_SEC(TIMEDIFF(ps.to_time, ps.from_time)) / 3600, 1)      AS no_of_hours

        FROM hrmdb.planning_training_table pt
        LEFT JOIN hrmdb.training_topic tt
               ON pt.training_topic_id = tt.id AND tt.calDeleteStatus = 0
        LEFT JOIN hrmdb.staff_category sc
               ON pt.staff_category_id = sc.id
        LEFT JOIN hrmdb.training_type ttype
               ON pt.training_type_id = ttype.id
        LEFT JOIN hrmdb.planing_sessions ps
               ON pt.id = ps.planing_id AND ps.calDeleteStatus = 0
        LEFT JOIN hrmdb.planing_session_trainee_data pstd
               ON ps.planing_id = pstd.planing_id
              AND ps.session_no = pstd.session_no
              AND pstd.calDeleteStatus = 0

        /* ── Internal trainer lookup ── */
        LEFT JOIN leavemanagement.user emp
               ON ps.trainer_type = 'Internal'
              AND ps.trainer_code  = emp.emp_id

        LEFT JOIN leavemanagement.department dept
               ON emp.department_id = dept.department_id

        ${whereClause}
        GROUP BY pt.id, ps.id, tt.id, sc.id, ttype.id
        ORDER BY COALESCE(ps.session_date, pt.planning_date), tt.department_name, ps.session_no
    `;

    hrmdb.query(query, params, (err, results) => {
        if (err) {
            console.error('MonthlyTrainingReport DB error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }

        const stageCounts = {
            stage1_training_created:   0,
            stage2_training_scheduled: 0,
            stage3_training_conducted: 0,
            stage4_feedback_assigned:  0,
            stage5_submitted_closed:   0,
            total: results.length
        };

        results.forEach(r => {
            const s = (r.training_status || '').toLowerCase();
            if      (s === 'training created')                           stageCounts.stage1_training_created++;
            else if (s === 'training scheduled')                         stageCounts.stage2_training_scheduled++;
            else if (s === 'training conducted')                         stageCounts.stage3_training_conducted++;
            else if (s === 'feedback assigned')                          stageCounts.stage4_feedback_assigned++;
            else if (s === 'final submitted' || s === 'session closed')  stageCounts.stage5_submitted_closed++;
        });

        return res.status(200).json({ data: results, stageCounts });
    });
};

/**
 * Helper: distinct branch & department lists for filter dropdowns
 */
exports.MonthlyReportFilterOptions = (req, res) => {
    const branchQuery = `SELECT branch_id AS id, branch_name AS name FROM leavemanagement.branchmaster ORDER BY branch_name`;
    const deptQuery   = `SELECT department_id AS id, department_name AS name FROM leavemanagement.department ORDER BY department_name`;

    hrmdb.query(branchQuery, [], (err1, branches) => {
        if (err1) return res.status(500).json({ error: 'DB error (branches)', details: err1 });
        hrmdb.query(deptQuery, [], (err2, departments) => {
            if (err2) return res.status(500).json({ error: 'DB error (departments)', details: err2 });
            return res.status(200).json({ branches, departments });
        });
    });
};