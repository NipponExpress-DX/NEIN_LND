const { leavemanagement, hrmdb } = require('../../../configuration/db');

exports.branch_assigned_to_user_attended = (req, res) => {
    const { userid } = req.body;

    if (!userid) {
        return res.status(400).json({ message: "User ID is required" });
    }

    const branchQuery = `SELECT branch_id FROM leavemanagement.user WHERE emp_id = ?`;

    hrmdb.query(branchQuery, [userid], (err, branchResult) => {
        if (err) return res.status(500).json({ message: "Error fetching branch", error: err });
        if (!branchResult || branchResult.length === 0) {
            return res.status(404).json({ message: "No branch found for this user" });
        }

        const branchId = branchResult[0].branch_id;

        const attendanceQuery = `
                SELECT 
                    COUNT(*) AS Assign_count,
                    COUNT(DISTINCT CASE 
                        WHEN pst.attendance_status = 1 THEN CONCAT(pst.planing_id, '-', pst.session_no)
                    END) AS present_count,
                    COUNT(DISTINCT CASE 
                        WHEN pst.attendance_status = 0 THEN CONCAT(pst.planing_id, '-', pst.session_no)
                    END) AS absent_count 
                FROM hrmdb.planing_session_trainee_data pst
                WHERE pst.trainee_id = ?
                    AND pst.calDeleteStatus = 0 
                    AND pst.planing_id IN (
                        SELECT DISTINCT ps.planing_id  
                        FROM hrmdb.planning_training_table pt
                        LEFT JOIN leavemanagement.branchmaster bm 
                            ON FIND_IN_SET(bm.branch_id, pt.branch_id) > 0
                        LEFT JOIN hrmdb.planing_sessions ps 
                            ON pt.id = ps.planing_id
                        WHERE FIND_IN_SET(?, pt.branch_id) > 0
                            AND pt.calDeleteStatus = 0
                            AND ps.calDeleteStatus = 0
                            AND YEAR(ps.session_date) = YEAR(CURDATE())
                    )
            `;

        hrmdb.query(attendanceQuery, [userid, branchId], (err, attendanceResult) => {
            if (err) return res.status(500).json({ message: "Error fetching attendance", error: err });

            const branchConductedQuery = `
                SELECT COUNT(DISTINCT CONCAT(ps.planing_id, '-', ps.session_no)) AS branch_conducted_count
                FROM hrmdb.planning_training_table pt
                LEFT JOIN leavemanagement.branchmaster bm ON FIND_IN_SET(bm.branch_id, pt.branch_id) > 0
                LEFT JOIN hrmdb.planing_sessions ps ON pt.id = ps.planing_id
                WHERE FIND_IN_SET(?, pt.branch_id) > 0
                    AND pt.Status = 'Final Submitted' 
                    AND ps.calDeleteStatus = '0'
                    AND ps.PSstatus = 'Session Closed'
                    AND YEAR(ps.session_date) = YEAR(CURDATE())
            `;

            hrmdb.query(branchConductedQuery, [branchId], (err, branchConductedResult) => {
                if (err) return res.status(500).json({ message: "Error fetching branch conducted count", error: err });

                const branch_conducted_count = branchConductedResult?.[0]?.branch_conducted_count || 0;

                // ── SINGLE consolidated feedback query (removed the duplicate) ──
                const feedbackPendingSessionsQuery = `
                    SELECT pstd.planing_id, pstd.session_no
                    FROM hrmdb.planing_session_trainee_data pstd
                    JOIN hrmdb.planing_sessions ps 
                        ON ps.planing_id = pstd.planing_id 
                        AND ps.session_no = pstd.session_no
                    JOIN hrmdb.planning_training_table pt 
                        ON pt.id = ps.planing_id
                    WHERE pstd.trainee_id = ?
                        AND pstd.calDeleteStatus = 0 
                        AND pstd.attendance_status = 1
                        AND pstd.feedback_form_answer IS NULL
                        AND pstd.feedback_form_question IS NOT NULL
                        AND pstd.feedback_form_Assign_final_submit_date IS NOT NULL
                        AND pstd.feedback_form_Assign_final_submit_date > NOW()
                        AND ps.calDeleteStatus = 0
                        AND pt.calDeleteStatus = 0
                        AND ps.PSstatus != 'Session Closed'
                        AND pt.Status != 'Final Submitted'
                        AND pt.Status != 'Cancelled'
                        AND YEAR(ps.session_date) = YEAR(CURDATE())
                `;

                // ── Only filter by userid — removed the broken branch_name join ──
                hrmdb.query(feedbackPendingSessionsQuery, [userid], (err, feedbackPendingResult) => {
                    if (err) return res.status(500).json({ message: "Error fetching feedback pending sessions", error: err });

                    const pending_feedback_sessions = feedbackPendingResult.map(row => ({
                        planing_id: row.planing_id,
                        session_no: row.session_no
                    }));

                    res.json({
                        branch_conducted_count,
                        Assign_count: attendanceResult?.[0]?.Assign_count || 0,
                        present_count: attendanceResult?.[0]?.present_count || 0,
                        absent_count: attendanceResult?.[0]?.absent_count || 0,
                        branchFeedbackFormPendingCount: pending_feedback_sessions.length,
                        pending_feedback_sessions
                    });
                });
            });
        });
    });
};



exports.department_assigned_to_user_attended = (req, res) => {
    const { userid } = req.body;

    // Check if userid is provided
    if (!userid) {
        return res.status(400).json({ message: "User ID is required" });
    }

    // Query to fetch department_id
    const departmentQuery = "SELECT department_id FROM leavemanagement.user WHERE emp_id = ?";
    
    hrmdb.query(departmentQuery, [userid], (err, deptResult) => {
        if (err) {
            return res.status(500).json({ message: "An error occurred", error: err });
        }
        
        if (!deptResult || deptResult.length === 0 || !deptResult[0].department_id) {
            return res.status(404).json({ message: "No department found for this user" });
        }

        const departmentId = deptResult[0].department_id;

        // Query to fetch attendance counts based on department_id
        const attendanceQuery = `
           SELECT 
                    COUNT(pst.attendance_status) AS Assign_count,
                    SUM(CASE WHEN pst.attendance_status = 1 THEN 1 ELSE 0 END) AS present_count, 
                    SUM(CASE WHEN pst.attendance_status = 0 THEN 1 ELSE 0 END) AS absent_count 
                FROM hrmdb.planing_session_trainee_data pst
                WHERE pst.trainee_id = ?
                AND pst.calDeleteStatus = 0 
                AND pst.attendance_status IS NOT NULL
                AND pst.planing_id IN (
                    SELECT DISTINCT ps.planing_id  
                    FROM hrmdb.planning_training_table pt
                    LEFT JOIN leavemanagement.department dept 
                        ON FIND_IN_SET(dept.department_id, pt.department_id) > 0
                    LEFT JOIN hrmdb.planing_sessions ps 
                        ON pt.id = ps.planing_id
                    WHERE FIND_IN_SET(?, pt.department_id) > 0
                        AND pt.Status != 'Cancelled'
                        AND ps.calDeleteStatus = '0'
                        AND ps.session_date >= MAKEDATE(YEAR(CURDATE()), 1)
                        AND ps.session_date <  MAKEDATE(YEAR(CURDATE()) + 1, 1)
                );


        `;

        hrmdb.query(attendanceQuery, [userid,departmentId], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "An error occurred", error: err });
            }

            if (!result || result.length === 0 || result[0].present_count === null) {
                return res.status(404).json({ message: "No attendance data found for this user" });
            }

            // Query to fetch department_conducted_count
            const departmentConductedQuery = `
                SELECT 
                    COUNT(DISTINCT CONCAT(ps.planing_id, '-', ps.session_no)) 
                    AS department_conducted_count
                FROM hrmdb.planning_training_table pt
                LEFT JOIN leavemanagement.department dept 
                ON FIND_IN_SET(dept.department_id, pt.department_id) > 0
                LEFT JOIN hrmdb.planing_sessions ps 
                ON pt.id = ps.planing_id
                WHERE FIND_IN_SET(?, pt.department_id) > 0
                AND pt.Status != 'Cancelled'
                AND pt.Status = 'Final Submitted'
                AND ps.calDeleteStatus = '0'
                AND ps.PSstatus = 'Session Closed'
                AND ps.session_date >= MAKEDATE(YEAR(CURDATE()), 1)
                AND ps.session_date <  MAKEDATE(YEAR(CURDATE()) + 1, 1);

`;


            hrmdb.query(departmentConductedQuery, [departmentId], (err, departmentResult) => {
                if (err) {
                    return res.status(500).json({ message: "An error occurred", error: err });
                }
                
                const department_conducted_count = departmentResult && departmentResult.length > 0 ? departmentResult[0].department_conducted_count : 0;
                
                // Return attendance data with department_conducted_count
                res.json({
                    department_conducted_count: department_conducted_count,
                    Assign_count: result[0].Assign_count,
                    present_count: result[0].present_count,
                    absent_count: result[0].absent_count
                });
            });
        });
    });
};




exports.Planned_branch_and_assigned_to_user_Planning_Training_under_process = (req, res) => {
    const { userid } = req.body;

    if (!userid) {
        return res.status(400).json({ message: "User ID is required" });
    }

    const branchQuery = `SELECT branch_id FROM leavemanagement.user WHERE emp_id = ?`;

    hrmdb.query(branchQuery, [userid], (err, branchResult) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching branch", error: err });
        }

        if (!branchResult || branchResult.length === 0) {
            return res.status(404).json({ message: "No branch found for this user" });
        }

        const branchId = branchResult[0].branch_id;

        // Query to get Planned_branch_and_assigned_to_user_Count
        const plannedBranchAssignedQuery = `
            SELECT 
                    COUNT(pst.attendance_status) AS Planned_branch_and_assigned_to_user_Count 
                FROM hrmdb.planing_session_trainee_data pst
                WHERE pst.trainee_id = ? 
                AND pst.calDeleteStatus = 0 
                AND pst.planing_id IN (
                    SELECT planing_id FROM (
                        SELECT DISTINCT ps.planing_id  
                        FROM hrmdb.planning_training_table pt
                        LEFT JOIN leavemanagement.branchmaster bm 
                            ON FIND_IN_SET(bm.branch_id, pt.branch_id) > 0
                        LEFT JOIN hrmdb.planing_sessions ps 
                            ON pt.id = ps.planing_id
                        WHERE FIND_IN_SET(?, pt.branch_id) > 0
                            AND pt.Status NOT IN ('Cancelled', 'Final Submitted') 
                            AND ps.calDeleteStatus = '0'
                            AND ps.session_date >= MAKEDATE(YEAR(CURDATE()), 1)
                            AND ps.session_date <  MAKEDATE(YEAR(CURDATE()) + 1, 1)
                    ) AS subquery
                );

        `;

        hrmdb.query(plannedBranchAssignedQuery, [userid, branchId], (err, plannedBranchAssignedResult) => {
            if (err) {
                return res.status(500).json({ message: "Error fetching Planned_branch_and_assigned_to_user_Count", error: err });
            }

            const planned_branch_and_assigned_to_user_count = plannedBranchAssignedResult.length > 0 
                ? plannedBranchAssignedResult[0].Planned_branch_and_assigned_to_user_Count 
                : 0;

            // Query to get Planned_branch_count
            const plannedBranchQuery = `
                SELECT 
                    COUNT(DISTINCT CONCAT(ps.planing_id, '-', ps.session_no)) AS Planned_branch_count
                FROM hrmdb.planning_training_table pt 
                LEFT JOIN leavemanagement.branchmaster bm 
                ON FIND_IN_SET(bm.branch_id, pt.branch_id) > 0 
                LEFT JOIN hrmdb.planing_sessions ps 
                ON pt.id = ps.planing_id 
                WHERE FIND_IN_SET(?, pt.branch_id) > 0 
                AND pt.Status NOT IN ('Cancelled', 'Final Submitted') 
                AND ps.calDeleteStatus = '0'
                AND ps.session_date >= MAKEDATE(YEAR(CURDATE()), 1)
                AND ps.session_date <  MAKEDATE(YEAR(CURDATE()) + 1, 1);

            `;

            hrmdb.query(plannedBranchQuery, [branchId], (err, plannedBranchResult) => {
                if (err) {
                    return res.status(500).json({ message: "Error fetching Planned_branch_count", error: err });
                }

                const planned_branch_count = plannedBranchResult.length > 0 
                    ? plannedBranchResult[0].Planned_branch_count 
                    : 0;

                res.json({
                    Planned_branch_count: planned_branch_count,
                    Planned_branch_and_assigned_to_user_Count: planned_branch_and_assigned_to_user_count
                });
            });
        });
    });
};



exports.Assign_count_Assign_to_user_time_and_Assign_attadence_count_Assign_to_user_spend_time= (req, res) => {
    const { userid } = req.body;

    if (!userid) {
        return res.status(400).json({ message: "User ID is required" });
    }

    const assignQuery = `
    SELECT 
            COUNT(DISTINCT CONCAT(ps.planing_id, '-', ps.session_no)) AS Assign_to_user_count,
            COALESCE(
                SUM(TIME_TO_SEC(TIMEDIFF(ps.to_time, ps.from_time)) / 3600),
                0
            ) AS Assigned_hours
        FROM hrmdb.planing_session_trainee_data pst
        JOIN hrmdb.planing_sessions ps 
        ON pst.planing_id = ps.planing_id 
        AND pst.session_no = ps.session_no
        WHERE pst.trainee_id = ?
        AND pst.calDeleteStatus = 0
        AND ps.calDeleteStatus = 0
        AND ps.session_date >= MAKEDATE(YEAR(CURDATE()), 1)
        AND ps.session_date <  MAKEDATE(YEAR(CURDATE()) + 1, 1);

            
    `;


    hrmdb.query(assignQuery, [userid], (err, assignResult) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching assign count", error: err });
        }

        const assign_to_user_count = assignResult[0]?.Assign_to_user_count || 0;
        const assigned_hours = assignResult[0]?.Assigned_hours || 0;

        const attendanceQuery = `
           SELECT 
                COUNT(DISTINCT CONCAT(ps.planing_id, '-', ps.session_no)) AS Assign_attendance_count,
                COALESCE(
                    SUM(TIME_TO_SEC(TIMEDIFF(ps.to_time, ps.from_time)) / 3600),
                    0
                ) AS Assign_attendance_hours
            FROM hrmdb.planing_session_trainee_data pst
            JOIN hrmdb.planing_sessions ps 
            ON pst.planing_id = ps.planing_id 
            AND pst.session_no = ps.session_no
            WHERE pst.trainee_id = ?
            AND pst.calDeleteStatus = 0
            AND pst.attendance_status = '1'
            AND ps.calDeleteStatus = 0
            AND ps.session_date >= MAKEDATE(YEAR(CURDATE()), 1)
            AND ps.session_date <  MAKEDATE(YEAR(CURDATE()) + 1, 1);

        `;

        hrmdb.query(attendanceQuery, [userid], (err, attendanceResult) => {
            if (err) {
                return res.status(500).json({ message: "Error fetching attendance count", error: err });
            }

            const assign_attendance_count = attendanceResult[0]?.Assign_attendance_count || 0;
            const assign_attendance_hours = attendanceResult[0]?.Assign_attendance_hours || 0;

            res.json({
                Assign_to_user_count: assign_to_user_count,
                Assigned_hours: assigned_hours,
                Assign_attendance_count: assign_attendance_count,
                Assign_attendance_hours: assign_attendance_hours
            });
        });
    });
};




exports.TrainingEffectivenessAllMeasures = (req, res) => {
    const { userid } = req.body;

    if (!userid) {
        return res.status(400).json({ message: "User ID is required" });
    }

    const query = `
        SELECT 
            -- total = only rows where effectiveness was actually measured
            COUNT(DISTINCT CASE 
                WHEN pst.EffectivenessMeasuredA IS NOT NULL 
                  OR pst.EffectivenessMeasuredB IS NOT NULL 
                  OR pst.EffectivenessMeasuredC IS NOT NULL 
                THEN CONCAT(pst.planing_id, '-', pst.session_no) 
            END) AS total_trainings,

            -- Effectiveness A
            SUM(CASE WHEN pst.EffectivenessMeasuredA = 1 THEN 1 ELSE 0 END) AS effective_a_yes_Count,
            SUM(CASE WHEN pst.EffectivenessMeasuredA = 0 THEN 1 ELSE 0 END) AS effective_a_no_Count,
            COUNT(CASE WHEN pst.EffectivenessMeasuredA IS NOT NULL THEN 1 END) AS effective_a_total,

            -- Effectiveness B
            SUM(CASE WHEN pst.EffectivenessMeasuredB = 1 THEN 1 ELSE 0 END) AS effective_b_yes_Count,
            SUM(CASE WHEN pst.EffectivenessMeasuredB = 0 THEN 1 ELSE 0 END) AS effective_b_no_Count,
            COUNT(CASE WHEN pst.EffectivenessMeasuredB IS NOT NULL THEN 1 END) AS effective_b_total,

            -- Effectiveness C
            SUM(CASE WHEN pst.EffectivenessMeasuredC = 1 THEN 1 ELSE 0 END) AS effective_c_yes_Count,
            SUM(CASE WHEN pst.EffectivenessMeasuredC = 0 THEN 1 ELSE 0 END) AS effective_c_no_Count,
            COUNT(CASE WHEN pst.EffectivenessMeasuredC IS NOT NULL THEN 1 END) AS effective_c_total

        FROM hrmdb.planing_session_trainee_data pst
        JOIN hrmdb.planing_sessions ps 
            ON pst.planing_id = ps.planing_id 
            AND pst.session_no = ps.session_no  
        JOIN hrmdb.planning_training_table pt
            ON pt.id = ps.planing_id
        WHERE pst.trainee_id = ?
            AND pst.calDeleteStatus = 0
            AND ps.calDeleteStatus = 0
            AND pt.calDeleteStatus = 0
            AND pt.Status != 'Cancelled'
            AND YEAR(ps.session_date) = YEAR(CURDATE())
            -- Only rows where effectiveness was actually measured
            AND (
                pst.EffectivenessMeasuredA IS NOT NULL OR
                pst.EffectivenessMeasuredB IS NOT NULL OR
                pst.EffectivenessMeasuredC IS NOT NULL
            )
    `;

    hrmdb.query(query, [userid], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching effectiveness data", error: err });
        }

        const row = result[0] || {};
        const total_trainings = row.total_trainings || 0;

        // ── Percentage = yes / (yes + no) per measure, not yes / total_trainings ──
        const calcPct = (yes, total) => 
            total > 0 ? parseFloat((yes / total * 100).toFixed(1)) : 0;

        res.json({
            total_trainings,
            effectiveness_a: {
                yes_count: row.effective_a_yes_Count || 0,
                no_count:  row.effective_a_no_Count  || 0,
                percentage: calcPct(row.effective_a_yes_Count || 0, row.effective_a_total || 0)
            },
            effectiveness_b: {
                yes_count: row.effective_b_yes_Count || 0,
                no_count:  row.effective_b_no_Count  || 0,
                percentage: calcPct(row.effective_b_yes_Count || 0, row.effective_b_total || 0)
            },
            effectiveness_c: {
                yes_count: row.effective_c_yes_Count || 0,
                no_count:  row.effective_c_no_Count  || 0,
                percentage: calcPct(row.effective_c_yes_Count || 0, row.effective_c_total || 0)
            }
        });
    });
};


// Dpt. Head Dashboard API below 
    // exports.Departmental_Training_Performance = (req, res) => {
    //     let { branch_id, department_id } = req.body;

    //     if (!branch_id || !department_id) {
    //         return res.status(400).json({ message: "Branch ID and Department ID are required" });
    //     }

    //     // Convert branch_id and department_id into an array
    //     const branchArray = branch_id.split(',').map(id => `'${id.trim()}'`).join(',');
    //     const departmentArray = department_id.split(',').map(id => `'${id.trim()}'`).join(',');

    //     // Query to get total assigned training count, present count, and absent count
    //     const attendanceQuery = `
    //         SELECT 
    //             COUNT(DISTINCT pst.planing_id) AS Assign_count,
    //             SUM(CASE WHEN pst.attendance_status = 1 THEN 1 ELSE 0 END) AS present_count, 
    //             SUM(CASE WHEN pst.attendance_status = 0 THEN 1 ELSE 0 END) AS absent_count 
    //         FROM hrmdb.planing_session_trainee_data pst
    //         WHERE pst.calDeleteStatus = 0 
    //         AND pst.attendance_status IS NOT NULL
    //         AND pst.planing_id IN (
    //             SELECT DISTINCT ps.planing_id  
    //             FROM hrmdb.planning_training_table pt
    //             LEFT JOIN hrmdb.planing_sessions ps ON pt.id = ps.planing_id
    //             WHERE (
    //                 ${branchArray.split(',').map(b => `FIND_IN_SET(${b}, pt.branch_id) > 0`).join(" OR ")}
    //             )
    //             AND (
    //                 ${departmentArray.split(',').map(d => `FIND_IN_SET(${d}, pt.department_id) > 0`).join(" OR ")}
    //             )
    //             AND pt.Status = 'Final Submitted' 
    //             AND ps.calDeleteStatus = '0'
    //         );
    //     `;

    //     hrmdb.query(attendanceQuery, (err, attendanceResult) => {
    //         if (err) {
    //             return res.status(500).json({ message: "Error fetching attendance data", error: err });
    //         }

    //         const Departmental_Assign_count = attendanceResult[0]?.Assign_count || 0;
    //         const present_count = attendanceResult[0]?.present_count || 0;
    //         const absent_count = attendanceResult[0]?.absent_count || 0;

    //         res.json({
    //             Departmental_Assign_count,
    //             present_count,
    //             absent_count
    //         });
    //     });
    // };

    

    exports.Branch_Training_Performance = (req, res) => {
        let { branch_id, department_id, from_date, to_date } = req.body;
    
        if (!branch_id || !department_id) {
            return res.status(400).json({ message: "Branch ID and Department ID are required" });
        }
    
        const branchArray = branch_id.split(',').map(id => id.trim());
        const departmentArray = department_id.split(',').map(id => id.trim());
    
        let dateCondition = '';
        if (from_date && to_date) {
            dateCondition = ` AND ps.session_date BETWEEN '${from_date}' AND '${to_date}'`;
        }
    
        const userStatsQuery = `
            SELECT 
                COALESCE(pst.trainee_id, u.emp_id) AS trainee_id,
                COALESCE(pst.trainee_name, u.full_name) AS trainee_name,
                d.department_name,
                b.branch_name,
                COALESCE(COUNT(DISTINCT CASE 
                    WHEN pst.calDeleteStatus = 0
                         AND ps.calDeleteStatus = '0'
                         AND ps.PSstatus = 'Session Closed'
                         AND pt.Status = 'Final Submitted'
                         ${dateCondition}
                    THEN pst.session_no END), 0) AS trainings_assigned,
                COALESCE(COUNT(DISTINCT CASE 
                    WHEN pst.calDeleteStatus = 0
                         AND ps.calDeleteStatus = '0'
                         AND ps.PSstatus = 'Session Closed'
                         AND pt.Status = 'Final Submitted'
                         AND pst.attendance_status = 1
                         ${dateCondition}
                    THEN pst.session_no END), 0) AS trainings_completed,
                COALESCE(SUM(CASE 
                    WHEN pst.calDeleteStatus = 0
                         AND ps.calDeleteStatus = '0'
                         AND ps.PSstatus = 'Session Closed'
                         AND pt.Status = 'Final Submitted'
                         AND pst.attendance_status = 1
                         ${dateCondition}
                    THEN TIME_TO_SEC(TIMEDIFF(ps.to_time, ps.from_time)) / 3600 ELSE 0 END), 0) AS hours_spent
            FROM leavemanagement.user u
            JOIN leavemanagement.department d ON u.department_id = d.department_id
            JOIN leavemanagement.branchmaster b ON u.branch_id = b.branch_id
            LEFT JOIN hrmdb.planing_session_trainee_data pst ON pst.trainee_id = u.emp_id
            LEFT JOIN hrmdb.planing_sessions ps ON ps.planing_id = pst.planing_id
            LEFT JOIN hrmdb.planning_training_table pt ON pt.id = ps.planing_id
            WHERE FIND_IN_SET(u.branch_id, ?) > 0
              AND FIND_IN_SET(u.department_id, ?) > 0
            GROUP BY u.emp_id, d.department_name, b.branch_name
            HAVING trainings_assigned > 0
        `;
    
        const departmentStatusQuery = `
            SELECT 
            b.branch_name,
            COALESCE(dc.Total_assigned_count, 0) AS Total_assigned_count,
            COALESCE(dc.Total_attended_count, 0) AS Total_attended_count,
            COALESCE(dc.Total_completed_count, 0) AS Total_completed_count,
            COALESCE(dh.total_hours, 0) AS Total_hours_spent
        FROM leavemanagement.branchmaster b
        LEFT JOIN (
            SELECT 
                u.branch_id,
                COUNT(DISTINCT CASE 
                    WHEN pst.calDeleteStatus = 0 
                         AND ps.calDeleteStatus = '0'
                         AND ps.PSstatus = 'Session Closed'
                         AND pt.Status = 'Final Submitted'
                         ${dateCondition}
                    THEN CONCAT(pst.planing_id, '-', pst.session_no) 
                END) AS Total_assigned_count,
                COUNT(DISTINCT CASE 
                    WHEN pst.calDeleteStatus = 0 
                         AND ps.calDeleteStatus = '0'
                         AND ps.PSstatus = 'Session Closed'
                         AND pt.Status = 'Final Submitted'
                         AND pst.attendance_status IS NOT NULL
                         ${dateCondition}
                    THEN CONCAT(pst.planing_id, '-', pst.session_no) 
                END) AS Total_attended_count,
                COUNT(DISTINCT CASE 
                    WHEN pst.calDeleteStatus = 0 
                         AND ps.calDeleteStatus = '0'
                         AND ps.PSstatus = 'Session Closed'
                         AND pt.Status = 'Final Submitted'
                         AND pst.attendance_status = 1
                         ${dateCondition}
                    THEN CONCAT(pst.planing_id, '-', pst.session_no) 
                END) AS Total_completed_count
            FROM leavemanagement.user u
            LEFT JOIN hrmdb.planing_session_trainee_data pst ON pst.trainee_id = u.emp_id
            LEFT JOIN hrmdb.planing_sessions ps ON ps.planing_id = pst.planing_id
            LEFT JOIN hrmdb.planning_training_table pt ON pt.id = ps.planing_id
            WHERE u.branch_id IN (?)
              AND u.department_id IN (?) 
            GROUP BY u.branch_id
        ) dc ON dc.branch_id = b.branch_id
        LEFT JOIN (
            SELECT 
                t.branch_id,
                SUM(t.session_hours) AS total_hours
            FROM (
                SELECT 
                    u.branch_id,
                    CONCAT(pst.planing_id, '-', pst.session_no, '-', pst.trainee_id) AS unique_session,
                    TIME_TO_SEC(TIMEDIFF(ps.to_time, ps.from_time)) / 3600 AS session_hours
                FROM hrmdb.planing_session_trainee_data pst
                JOIN hrmdb.planing_sessions ps ON ps.planing_id = pst.planing_id
                JOIN hrmdb.planning_training_table pt ON pt.id = ps.planing_id
                JOIN leavemanagement.user u ON u.emp_id = pst.trainee_id
                WHERE pst.calDeleteStatus = 0 
                  AND ps.calDeleteStatus = '0'
                  AND ps.PSstatus = 'Session Closed'
                  AND pt.Status = 'Final Submitted'
                  AND pst.attendance_status = 1
                  AND u.branch_id IN (?)
                  AND u.department_id IN (?)
                  ${dateCondition}
                GROUP BY u.branch_id, unique_session
            ) t
            GROUP BY t.branch_id
        ) dh ON dh.branch_id = b.branch_id
        WHERE b.branch_id IN (?)
          AND EXISTS (
              SELECT 1 
              FROM leavemanagement.user u 
              WHERE u.branch_id = b.branch_id 
                AND u.department_id IN (?)
          )
            
        `;
    
        const overallStatsQuery = `
              
            SELECT 
                 COALESCE(COUNT(DISTINCT CASE
        WHEN pst.calDeleteStatus = 0 
             AND ps.calDeleteStatus = '0'
             AND ps.PSstatus = 'Session Closed'
             AND pt.Status = 'Final Submitted'
             ${dateCondition}
        THEN CONCAT(pst.planing_id, '-', pst.session_no)
    END), 0) AS All_Branch_and_Dept_Total_assigned_count_completed,
                COALESCE(COUNT(DISTINCT CASE
        WHEN pst.calDeleteStatus = 0 
             AND ps.calDeleteStatus = '0'
             AND ps.PSstatus != 'Session Closed'
             AND pt.Status != 'Final Submitted'
             AND pst.attendance_status != '1'
             ${dateCondition}
        THEN CONCAT(pst.planing_id, '-', pst.session_no)
    END), 0) AS All_Branch_and_Dept_Total_assigned_count_Processing,
                COALESCE(
    COUNT(DISTINCT 
        CASE 
            WHEN pst.calDeleteStatus = 0 
                 AND ps.calDeleteStatus = '0'
                 AND ps.PSstatus = 'Session Closed'
                 AND pt.Status = 'Final Submitted'
                 AND pst.attendance_status = '1'
                 ${dateCondition}
            THEN CONCAT(pst.planing_id, '-', pst.session_no,'-',pst.trainee_id)
        END
    ), 0
) AS All_Branch_and_Dept_Total_attended_count,
                   COALESCE(COUNT(DISTINCT CASE 
    WHEN pst.calDeleteStatus = 0 
         AND ps.calDeleteStatus = '0'
         AND ps.PSstatus = 'Session Closed'
         AND pt.Status = 'Final Submitted'
         AND pst.attendance_status != '1'
         ${dateCondition}
    THEN CONCAT(pst.planing_id, '-', pst.session_no, '-', pst.trainee_id)
END), 0) AS All_Branch_and_Dept_Total_absent_count
,
                                   
               (
    SELECT 
        COALESCE(SUM(duration), 0) 
    FROM (
        SELECT 
            DISTINCT CONCAT(pst.planing_id, '-', pst.session_no, '-', pst.trainee_id) AS unique_key,
            TIME_TO_SEC(TIMEDIFF(ps.to_time, ps.from_time)) / 3600 AS duration
        FROM hrmdb.planing_session_trainee_data pst
        JOIN hrmdb.planing_sessions ps ON ps.planing_id = pst.planing_id
        JOIN hrmdb.planning_training_table pt ON pt.id = ps.planing_id
        JOIN leavemanagement.user u2 ON pst.trainee_id = u2.emp_id
        WHERE pst.calDeleteStatus = 0 
          AND ps.calDeleteStatus = '0'
          AND ps.PSstatus = 'Session Closed'
          AND pt.Status = 'Final Submitted'
          AND pst.attendance_status = 1
          AND FIND_IN_SET(u2.branch_id, '${branchArray.join(",")}') > 0
          AND FIND_IN_SET(u2.department_id, '${departmentArray.join(",")}') > 0
          ${dateCondition}
    ) AS distinct_durations
) AS All_Branch_and_Dept_Total_hours_spent

                    FROM leavemanagement.user u
            JOIN leavemanagement.branchmaster b ON u.branch_id = b.branch_id
            LEFT JOIN hrmdb.planing_session_trainee_data pst ON pst.trainee_id = u.emp_id
            LEFT JOIN hrmdb.planing_sessions ps ON ps.planing_id = pst.planing_id
            LEFT JOIN hrmdb.planning_training_table pt ON pt.id = ps.planing_id
            WHERE FIND_IN_SET(u.branch_id, ?) > 0
              AND FIND_IN_SET(u.department_id, ?) > 0
        `;
    
        hrmdb.query(userStatsQuery, [branchArray.join(','), departmentArray.join(',')], (err, userStats) => {
            if (err) {
                return res.status(500).json({ message: "Error fetching user performance data", error: err });
            }
    
            hrmdb.query(departmentStatusQuery, [branchArray, departmentArray, branchArray, departmentArray, branchArray, departmentArray], (err, departmentStatus) => {
                if (err) {
                    return res.status(500).json({ message: "Error fetching department status data", error: err });
                }
    
                hrmdb.query(overallStatsQuery, [branchArray.join(','), departmentArray.join(',')], (err, overallStats) => {
                    if (err) {
                        return res.status(500).json({ message: "Error fetching overall totals", error: err });
                    }
    
                    const stats = overallStats[0];
                    const total_trainings = stats.All_Branch_and_Dept_Total_assigned_count_completed + stats.All_Branch_and_Dept_Total_assigned_count_Processing;
    
                    const getPercentage = (part, total) => total === 0 ? "0.00" : ((part / total) * 100).toFixed(2);
     

                    const uniqueTraineeIds = new Set(
    userStats
        .map(row => row.trainee_id)
        .filter(id => id !== null && id !== undefined)
);

                    const enrichedOverallStats = {
                        ...stats,
                        total_trainings,
                        All_Branch_and_Dept_Total_assigned_count_completed_percentage: getPercentage(stats.All_Branch_and_Dept_Total_assigned_count_completed, total_trainings),
                        All_Branch_and_Dept_Total_assigned_count_Processing_percentage: getPercentage(stats.All_Branch_and_Dept_Total_assigned_count_Processing, total_trainings),
                       
   
                       
                        total_employee_count: uniqueTraineeIds.size
                    };
    
                    return res.json({
                        userStats,
                        departmentStatus,
                        overallStats: enrichedOverallStats
                    });
                });
            });
        });
    };


// exports.Branch_Training_Performance = (req, res) => {
//     let { branch_id, department_id, from_date, to_date } = req.body;

//     if (!branch_id || !department_id) {
//         return res.status(400).json({ message: "Branch ID and Department ID are required" });
//     }

//     const branchArray = branch_id.split(',').map(id => id.trim());
//     const departmentArray = department_id.split(',').map(id => id.trim());

//     let dateCondition = '';
//     if (from_date && to_date) {
//         dateCondition = ` AND ps.session_date BETWEEN '${from_date}' AND '${to_date}'`;
//     }

//     const userStatsQuery = `
//         SELECT 
//             COALESCE(pst.trainee_id, u.emp_id) AS trainee_id,
//             COALESCE(pst.trainee_name, u.full_name) AS trainee_name,
//             d.department_name,
//             b.branch_name,
//             COALESCE(COUNT(DISTINCT CASE 
//                 WHEN pst.calDeleteStatus = 0
//                      AND ps.calDeleteStatus = '0'
//                      AND ps.PSstatus = 'Session Closed'
//                      AND pt.Status = 'Final Submitted'
//                      ${dateCondition}
//                 THEN CONCAT(pst.planing_id, '-', pst.session_no) END), 0) AS trainings_assigned,
//             COALESCE(COUNT(DISTINCT CASE 
//                 WHEN pst.calDeleteStatus = 0
//                      AND ps.calDeleteStatus = '0'
//                      AND ps.PSstatus = 'Session Closed'
//                      AND pt.Status = 'Final Submitted'
//                      AND pst.attendance_status = 1
//                      ${dateCondition}
//                 THEN CONCAT(pst.planing_id, '-', pst.session_no) END), 0) AS trainings_completed,
//             COALESCE(SUM(CASE 
//                 WHEN pst.calDeleteStatus = 0
//                      AND ps.calDeleteStatus = '0'
//                      AND ps.PSstatus = 'Session Closed'
//                      AND pt.Status = 'Final Submitted'
//                      AND pst.attendance_status = 1
//                      ${dateCondition}
//                 THEN TIME_TO_SEC(TIMEDIFF(ps.to_time, ps.from_time)) / 3600 ELSE 0 END), 0) AS hours_spent
//         FROM leavemanagement.user u
//         JOIN leavemanagement.department d ON u.department_id = d.department_id
//         JOIN leavemanagement.branchmaster b ON u.branch_id = b.branch_id
//         LEFT JOIN hrmdb.planing_session_trainee_data pst ON pst.trainee_id = u.emp_id
//         LEFT JOIN hrmdb.planing_sessions ps ON ps.planing_id = pst.planing_id
//         LEFT JOIN hrmdb.planning_training_table pt ON pt.id = ps.planing_id
//         WHERE FIND_IN_SET(u.branch_id, ?) > 0
//           AND FIND_IN_SET(u.department_id, ?) > 0
//         GROUP BY u.emp_id, d.department_name, b.branch_name
//         HAVING trainings_assigned > 0
//     `;

//     const branchStatusQuery = `
//         SELECT 
//             b.branch_name,
//             COALESCE(dc.Total_assigned_count, 0) AS Total_assigned_count,
//             COALESCE(dc.Total_attended_count, 0) AS Total_attended_count,
//             COALESCE(dc.Total_completed_count, 0) AS Total_completed_count,
//             COALESCE(dh.total_hours, 0) AS Total_hours_spent
//         FROM leavemanagement.branchmaster b
//         LEFT JOIN (
//             SELECT 
//                 u.branch_id,
//                 COUNT(DISTINCT CASE 
//                     WHEN pst.calDeleteStatus = 0 
//                          AND ps.calDeleteStatus = '0'
//                          AND ps.PSstatus = 'Session Closed'
//                          AND pt.Status = 'Final Submitted'
//                          ${dateCondition}
//                     THEN CONCAT(pst.planing_id, '-', pst.session_no) 
//                 END) AS Total_assigned_count,
//                 COUNT(DISTINCT CASE 
//                     WHEN pst.calDeleteStatus = 0 
//                          AND ps.calDeleteStatus = '0'
//                          AND ps.PSstatus = 'Session Closed'
//                          AND pt.Status = 'Final Submitted'
//                          AND pst.attendance_status IS NOT NULL
//                          ${dateCondition}
//                     THEN CONCAT(pst.planing_id, '-', pst.session_no) 
//                 END) AS Total_attended_count,
//                 COUNT(DISTINCT CASE 
//                     WHEN pst.calDeleteStatus = 0 
//                          AND ps.calDeleteStatus = '0'
//                          AND ps.PSstatus = 'Session Closed'
//                          AND pt.Status = 'Final Submitted'
//                          AND pst.attendance_status = 1
//                          ${dateCondition}
//                     THEN CONCAT(pst.planing_id, '-', pst.session_no) 
//                 END) AS Total_completed_count
//             FROM leavemanagement.user u
//             LEFT JOIN hrmdb.planing_session_trainee_data pst ON pst.trainee_id = u.emp_id
//             LEFT JOIN hrmdb.planing_sessions ps ON ps.planing_id = pst.planing_id
//             LEFT JOIN hrmdb.planning_training_table pt ON pt.id = ps.planing_id
//             WHERE u.branch_id IN (?)
//               AND u.department_id IN (?) 
//             GROUP BY u.branch_id
//         ) dc ON dc.branch_id = b.branch_id
//         LEFT JOIN (
//             SELECT 
//                 t.branch_id,
//                 SUM(t.session_hours) AS total_hours
//             FROM (
//                 SELECT 
//                     u.branch_id,
//                     CONCAT(pst.planing_id, '-', pst.session_no, '-', pst.trainee_id) AS unique_session,
//                     TIME_TO_SEC(TIMEDIFF(ps.to_time, ps.from_time)) / 3600 AS session_hours
//                 FROM hrmdb.planing_session_trainee_data pst
//                 JOIN hrmdb.planing_sessions ps ON ps.planing_id = pst.planing_id
//                 JOIN hrmdb.planning_training_table pt ON pt.id = ps.planing_id
//                 JOIN leavemanagement.user u ON u.emp_id = pst.trainee_id
//                 WHERE pst.calDeleteStatus = 0 
//                   AND ps.calDeleteStatus = '0'
//                   AND ps.PSstatus = 'Session Closed'
//                   AND pt.Status = 'Final Submitted'
//                   AND pst.attendance_status = 1
//                   AND u.branch_id IN (?)
//                   AND u.department_id IN (?)
//                   ${dateCondition}
//                 GROUP BY u.branch_id, unique_session
//             ) t
//             GROUP BY t.branch_id
//         ) dh ON dh.branch_id = b.branch_id
//         WHERE b.branch_id IN (?)
//           AND EXISTS (
//               SELECT 1 
//               FROM leavemanagement.user u 
//               WHERE u.branch_id = b.branch_id 
//                 AND u.department_id IN (?)
//           )
//     `;

//     const overallStatsQuery = `
//         SELECT 
//             COALESCE(COUNT(DISTINCT CASE
//                 WHEN pst.calDeleteStatus = 0 
//                      AND ps.calDeleteStatus = '0'
//                      AND ps.PSstatus = 'Session Closed'
//                      AND pt.Status = 'Final Submitted'
//                      ${dateCondition}
//                 THEN CONCAT(pst.planing_id, '-', pst.session_no)
//             END), 0) AS All_Branch_and_Dept_Total_assigned_count_completed,
//             COALESCE(COUNT(DISTINCT CASE
//                 WHEN pst.calDeleteStatus = 0 
//                      AND ps.calDeleteStatus = '0'
//                      AND ps.PSstatus != 'Session Closed'
//                      AND pt.Status != 'Final Submitted'
//                      AND pst.attendance_status != '1'
//                      ${dateCondition}
//                 THEN CONCAT(pst.planing_id, '-', pst.session_no)
//             END), 0) AS All_Branch_and_Dept_Total_assigned_count_Processing,
//             COALESCE(
//                 COUNT(DISTINCT 
//                     CASE 
//                         WHEN pst.calDeleteStatus = 0 
//                              AND ps.calDeleteStatus = '0'
//                              AND ps.PSstatus = 'Session Closed'
//                              AND pt.Status = 'Final Submitted'
//                              AND pst.attendance_status = '1'
//                              ${dateCondition}
//                         THEN CONCAT(pst.planing_id, '-', pst.session_no,'-',pst.trainee_id)
//                     END
//                 ), 0
//             ) AS All_Branch_and_Dept_Total_attended_count,
//             COALESCE(COUNT(DISTINCT CASE 
//                 WHEN pst.calDeleteStatus = 0 
//                      AND ps.calDeleteStatus = '0'
//                      AND ps.PSstatus = 'Session Closed'
//                      AND pt.Status = 'Final Submitted'
//                      AND pst.attendance_status != '1'
//                      ${dateCondition}
//                 THEN CONCAT(pst.planing_id, '-', pst.session_no, '-', pst.trainee_id)
//             END), 0) AS All_Branch_and_Dept_Total_absent_count,
//             (
//                 SELECT 
//                     COALESCE(SUM(duration), 0) 
//                 FROM (
//                     SELECT 
//                         DISTINCT CONCAT(pst.planing_id, '-', pst.session_no, '-', pst.trainee_id) AS unique_key,
//                         TIME_TO_SEC(TIMEDIFF(ps.to_time, ps.from_time)) / 3600 AS duration
//                     FROM hrmdb.planing_session_trainee_data pst
//                     JOIN hrmdb.planing_sessions ps ON ps.planing_id = pst.planing_id
//                     JOIN hrmdb.planning_training_table pt ON pt.id = ps.planing_id
//                     JOIN leavemanagement.user u2 ON pst.trainee_id = u2.emp_id
//                     WHERE pst.calDeleteStatus = 0 
//                       AND ps.calDeleteStatus = '0'
//                       AND ps.PSstatus = 'Session Closed'
//                       AND pt.Status = 'Final Submitted'
//                       AND pst.attendance_status = 1
//                       AND FIND_IN_SET(u2.branch_id, '${branchArray.join(",")}') > 0
//                       AND FIND_IN_SET(u2.department_id, '${departmentArray.join(",")}') > 0
//                       ${dateCondition}
//                 ) AS distinct_durations
//             ) AS All_Branch_and_Dept_Total_hours_spent
//         FROM leavemanagement.user u
//         JOIN leavemanagement.branchmaster b ON u.branch_id = b.branch_id
//         LEFT JOIN hrmdb.planing_session_trainee_data pst ON pst.trainee_id = u.emp_id
//         LEFT JOIN hrmdb.planing_sessions ps ON ps.planing_id = pst.planing_id
//         LEFT JOIN hrmdb.planning_training_table pt ON pt.id = ps.planing_id
//         WHERE FIND_IN_SET(u.branch_id, ?) > 0
//           AND FIND_IN_SET(u.department_id, ?) > 0
//     `;

//     // Execute queries
//     hrmdb.query(userStatsQuery, [branchArray.join(','), departmentArray.join(',')], (err, userStats) => {
//         if (err) {
//             return res.status(500).json({ message: "Error fetching user performance data", error: err });
//         }

//         hrmdb.query(branchStatusQuery, [branchArray, departmentArray, branchArray, departmentArray, branchArray, departmentArray], (err, branchStatus) => {
//             if (err) {
//                 return res.status(500).json({ message: "Error fetching branch status data", error: err });
//             }

//             hrmdb.query(overallStatsQuery, [branchArray.join(','), departmentArray.join(',')], (err, overallStats) => {
//                 if (err) {
//                     return res.status(500).json({ message: "Error fetching overall totals", error: err });
//                 }

//                 const stats = overallStats[0];
//                 const total_trainings = stats.All_Branch_and_Dept_Total_assigned_count_completed + stats.All_Branch_and_Dept_Total_assigned_count_Processing;

//                 const getPercentage = (part, total) => total === 0 ? "0.00" : ((part / total) * 100).toFixed(2);

//                 const uniqueTraineeIds = new Set(
//                     userStats.map(row => row.trainee_id).filter(id => id !== null && id !== undefined)
//                 );

//                 const enrichedOverallStats = {
//                     ...stats,
//                     total_trainings,
//                     All_Branch_and_Dept_Total_assigned_count_completed_percentage: getPercentage(stats.All_Branch_and_Dept_Total_assigned_count_completed, total_trainings),
//                     All_Branch_and_Dept_Total_assigned_count_Processing_percentage: getPercentage(stats.All_Branch_and_Dept_Total_assigned_count_Processing, total_trainings),
//                     total_employee_count: uniqueTraineeIds.size
//                 };

//                 return res.json({
//                     userStats,
//                     branchStatus,
//                     overallStats: enrichedOverallStats
//                 });
//             });
//         });
//     });
// };








    

    exports.Departmental_Training_Performance= (req, res) => {
        let { branch_id, department_id, from_date, to_date } = req.body;
    
        if (!branch_id || !department_id) {
            return res.status(400).json({ message: "Branch ID and Department ID are required" });
        }
    
        const branchArray = branch_id.split(',').map(id => id.trim());
        const departmentArray = department_id.split(',').map(id => id.trim());
    
        let dateCondition = '';
            if (from_date && to_date) {
                dateCondition = ` AND ps.session_date BETWEEN '${from_date}' AND '${to_date}'`;
            }

            let dateConditionHours = '';
            if (from_date && to_date) {
                dateConditionHours = ` AND ps2.session_date BETWEEN '${from_date}' AND '${to_date}'`;
            }

    console.log(branch_id, department_id, from_date, to_date);
        // Define all queries first
        const queries = {
            userStatsQuery: `
                SELECT 
                    COALESCE(pst.trainee_id, u.emp_id) AS trainee_id,
                    COALESCE(pst.trainee_name, u.full_name) AS trainee_name,
                    d.department_name,
                    b.branch_name,
                    COALESCE(COUNT(DISTINCT CASE 
                        WHEN pst.calDeleteStatus = 0
                             AND ps.calDeleteStatus = '0'
                             
                             ${dateCondition}
                        THEN CONCAT(pst.planing_id, '-', pst.session_no)  END), 0) AS trainings_assigned,
                  
                    COALESCE(COUNT(DISTINCT CASE 
                        WHEN pst.calDeleteStatus = 0
                             AND ps.calDeleteStatus = '0'
                             
                             AND pst.attendance_status = 1
                             ${dateCondition}
                        THEN CONCAT(pst.planing_id, '-', pst.session_no) END), 0) AS trainings_completed,
                    COALESCE(SUM(CASE 
                        WHEN pst.calDeleteStatus = 0
                             AND ps.calDeleteStatus = '0'
                             
                             AND pst.attendance_status = 1
                             ${dateCondition}
                        THEN TIME_TO_SEC(TIMEDIFF(ps.to_time, ps.from_time)) / 3600 ELSE 0 END), 0) AS hours_spent
                FROM leavemanagement.user u
                JOIN leavemanagement.department d ON u.department_id = d.department_id
                JOIN leavemanagement.branchmaster b ON u.branch_id = b.branch_id
                LEFT JOIN hrmdb.planing_session_trainee_data pst ON pst.trainee_id = u.emp_id
                LEFT JOIN hrmdb.planing_sessions ps ON ps.planing_id = pst.planing_id
                LEFT JOIN hrmdb.planning_training_table pt ON pt.id = ps.planing_id
                WHERE FIND_IN_SET(u.branch_id, ?) > 0
                  AND FIND_IN_SET(u.department_id, ?) > 0
                GROUP BY u.emp_id, d.department_name, b.branch_name
                HAVING trainings_assigned > 0
            `,
           departmentStatusQuery: `
    SELECT 
        d.department_name,
        COALESCE(dc.Total_assigned_count, 0) AS Total_assigned_count,
        COALESCE(dc.Total_attended_count, 0) AS Total_attended_count,
        COALESCE(dc.Total_completed_count, 0) AS Total_completed_count,
        COALESCE(dh.total_hours, 0) AS Total_hours_spent
    FROM leavemanagement.department d
    LEFT JOIN (
        SELECT 
            u.department_id,
            COUNT(DISTINCT CASE 
                WHEN pst.calDeleteStatus = 0 
                     AND ps.calDeleteStatus = '0'
                     
                     ${dateCondition}
                THEN CONCAT(pst.planing_id, '-', pst.session_no) 
            END) AS Total_assigned_count,
            COUNT(DISTINCT CASE 
                WHEN pst.calDeleteStatus = 0 
                     AND ps.calDeleteStatus = '0'
                     
                     AND pst.attendance_status IS NOT NULL
                     ${dateCondition}
                THEN CONCAT(pst.planing_id, '-', pst.session_no) 
            END) AS Total_attended_count,
            COUNT(DISTINCT CASE 
                WHEN pst.calDeleteStatus = 0 
                     AND ps.calDeleteStatus = '0'
                     
                     AND pst.attendance_status = 1
                     ${dateCondition}
                THEN CONCAT(pst.planing_id, '-', pst.session_no) 
            END) AS Total_completed_count
        FROM leavemanagement.user u
        LEFT JOIN hrmdb.planing_session_trainee_data pst ON pst.trainee_id = u.emp_id
        LEFT JOIN hrmdb.planing_sessions ps ON ps.planing_id = pst.planing_id
        LEFT JOIN hrmdb.planning_training_table pt ON pt.id = ps.planing_id
        WHERE u.branch_id IN (?)
          AND u.department_id IN (?) 
        GROUP BY u.department_id
    ) dc ON dc.department_id = d.department_id
    LEFT JOIN (
        SELECT 
            t.department_id,
            SUM(t.session_hours) AS total_hours
        FROM (
            SELECT 
                u.department_id,
                CONCAT(pst.planing_id, '-', pst.session_no, '-', pst.trainee_id) AS unique_session,
                TIME_TO_SEC(TIMEDIFF(ps.to_time, ps.from_time)) / 3600 AS session_hours
            FROM hrmdb.planing_session_trainee_data pst
            JOIN hrmdb.planing_sessions ps 
                 ON ps.planing_id = pst.planing_id
            JOIN hrmdb.planning_training_table pt 
                 ON pt.id = ps.planing_id
            JOIN leavemanagement.user u 
                 ON u.emp_id = pst.trainee_id
            WHERE pst.calDeleteStatus = 0 
              AND ps.calDeleteStatus = '0'
              
              AND pst.attendance_status = 1
              AND u.branch_id IN (?)
              AND u.department_id IN (?)
              ${dateCondition}
            GROUP BY u.department_id, unique_session
        ) t
        GROUP BY t.department_id
    ) dh ON dh.department_id = d.department_id
    WHERE d.department_id IN (?)
      AND EXISTS (
          SELECT 1 
          FROM leavemanagement.user u 
          WHERE u.department_id = d.department_id 
            AND u.branch_id IN (?)
      )
`


           ,
           overallStatsQuery: `
SELECT 
    /* ================= COMPLETED TRAININGS ================= */
    COALESCE(
        COUNT(DISTINCT CASE
            WHEN pst.calDeleteStatus = 0
                 AND ps.calDeleteStatus = '0'
                 AND pt.Status NOT IN ('Training Scheduled', 'Training Created')
                 ${dateCondition}
            THEN pst.planing_id
        END), 0
    ) AS All_Branch_and_Dept_Total_assigned_count_completed,

    /* ================= PROCESSING TRAININGS ================= */
    COALESCE(
        COUNT(DISTINCT CASE
            WHEN pst.calDeleteStatus = 0
                 AND ps.calDeleteStatus = '0'
                 AND pt.Status IN ('Training Scheduled', 'Training Created')
                 ${dateCondition}
            THEN pst.planing_id
        END), 0
    ) AS All_Branch_and_Dept_Total_assigned_count_Processing,

    /* ================= ATTENDED COUNT ================= */
    COALESCE(
        COUNT(DISTINCT CASE 
            WHEN pst.calDeleteStatus = 0
                 AND ps.calDeleteStatus = '0'
                 AND pst.attendance_status = 1
                 ${dateCondition}
            THEN CONCAT(pst.planing_id, '-', pst.session_no, '-', pst.trainee_id)
        END), 0
    ) AS All_Branch_and_Dept_Total_attended_count,

    /* ================= ABSENT COUNT ================= */
    COALESCE(
        COUNT(DISTINCT CASE 
            WHEN pst.calDeleteStatus = 0
                 AND ps.calDeleteStatus = '0'
                 AND pst.attendance_status != 1
                 ${dateCondition}
            THEN CONCAT(pst.planing_id, '-', pst.session_no, '-', pst.trainee_id)
        END), 0
    ) AS All_Branch_and_Dept_Total_absent_count,

    /* ================= TOTAL HOURS SPENT ================= */
    (
    SELECT COALESCE(SUM(duration), 0)
    FROM (
        SELECT DISTINCT
            CONCAT(pst2.planing_id, '-', pst2.session_no, '-', pst2.trainee_id),
            TIME_TO_SEC(TIMEDIFF(ps2.to_time, ps2.from_time)) / 3600 AS duration
        FROM hrmdb.planing_session_trainee_data pst2
        JOIN hrmdb.planing_sessions ps2 
             ON ps2.planing_id = pst2.planing_id
        JOIN hrmdb.planning_training_table pt2 
             ON pt2.id = ps2.planing_id
        JOIN leavemanagement.user u2 
             ON u2.emp_id = pst2.trainee_id
        WHERE pst2.calDeleteStatus = 0
          AND ps2.calDeleteStatus = '0'
          AND pst2.attendance_status = 1
          AND FIND_IN_SET(u2.branch_id, '${branchArray.join(",")}') > 0
          AND FIND_IN_SET(u2.department_id, '${departmentArray.join(",")}') > 0
          ${dateConditionHours}
    ) x
) AS All_Branch_and_Dept_Total_hours_spent


FROM leavemanagement.user u
LEFT JOIN hrmdb.planing_session_trainee_data pst 
       ON pst.trainee_id = u.emp_id
LEFT JOIN hrmdb.planing_sessions ps 
       ON ps.planing_id = pst.planing_id
LEFT JOIN hrmdb.planning_training_table pt 
       ON pt.id = ps.planing_id
WHERE FIND_IN_SET(u.branch_id, '${branchArray.join(",")}') > 0
  AND FIND_IN_SET(u.department_id, '${departmentArray.join(",")}') > 0
`

        };

        
       //  console.log("Final departmentStatusQuery:", departmentQueryFinal);

        let departmentQueryFinal = queries.departmentStatusQuery
    .replace('?', `'${branchArray.join(',')}'`)   // (1)
    .replace('?', `'${departmentArray.join(',')}'`) // (2)
    .replace('?', `'${branchArray.join(',')}'`)   // (3)
    .replace('?', `'${departmentArray.join(',')}'`) // (4)
    .replace('?', `'${departmentArray.join(',')}'`) // (5)
    .replace('?', `'${branchArray.join(',')}'`);    // (6)

// console.log("Final departmentStatusQuery:", departmentQueryFinal);







    
        // Execute queries in sequence
        hrmdb.query(queries.userStatsQuery, [branchArray.join(','), departmentArray.join(',')], (err, userStats) => {
            if (err) {
                return res.status(500).json({ message: "Error fetching user performance data", error: err });
            }
    
            const totalEmployeeCount = userStats.length;
    
            hrmdb.query(queries.departmentStatusQuery, [branchArray, departmentArray, branchArray, departmentArray, departmentArray, branchArray], (err, departmentStatus) => {
                if (err) {
                    return res.status(500).json({ message: "Error fetching department status data", error: err });
                }
    
                hrmdb.query(queries.overallStatsQuery, [branchArray.join(','), departmentArray.join(',')], (err, overallStats) => {
                    if (err) {
                        return res.status(500).json({ message: "Error fetching overall totals", error: err });
                    }
    
                    const stats = overallStats[0];
                    const total_trainings = stats.All_Branch_and_Dept_Total_assigned_count_completed + 
                                          stats.All_Branch_and_Dept_Total_assigned_count_Processing;
    
                    const getPercentage = (part, total) => total === 0 ? "0.00" : ((part / total) * 100).toFixed(2);
    
                    const enrichedOverallStats = {
                        ...stats,
                        total_employee_count: totalEmployeeCount,
                        total_trainings,
                        All_Branch_and_Dept_Total_assigned_count_completed_percentage: getPercentage(
                            stats.All_Branch_and_Dept_Total_assigned_count_completed, 
                            total_trainings
                        ),
                        All_Branch_and_Dept_Total_assigned_count_Processing_percentage: getPercentage(
                            stats.All_Branch_and_Dept_Total_assigned_count_Processing, 
                            total_trainings
                        ),
                        employee_participation_percentage: getPercentage(
                            stats.All_Branch_and_Dept_Total_attended_count, 
                            totalEmployeeCount
                        )
                    };
    
                    const userStatsWithTotal = userStats.map(stat => ({
                        ...stat,
                        total_employee_count: totalEmployeeCount
                    }));
    
                    return res.json({
                        userStats: userStatsWithTotal,
                        departmentStatus,
                        overallStats: enrichedOverallStats
                    });
                });
            });
        });
    };

   





    
    
    
    
    
    
    
    
    
    
    
    
    
    
    













