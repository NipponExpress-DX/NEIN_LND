const { hrmdb } = require('../../../configuration/db');


// Function to fetch trainer notifications

// Function to fetch trainer notifications
exports.NotificationFrontEnd = (req, res) => {
    const { emp_id } = req.body;

    if (!emp_id) {
        return res.status(400).json({ error: 'Missing emp_id in request body' });
    }

    const query = `
        -- Trainer
        SELECT 
            ps.planing_id,
            ps.session_no,
            ps.isRead_Trainer,
            tt.training_topic,
            ps.session_date,
            ps.from_time,
            ps.to_time,
            'trainer' AS role_type
        FROM 
            planing_sessions ps
        LEFT JOIN 
            hrmdb.planning_training_table pt ON ps.planing_id = pt.id
        LEFT JOIN 
            hrmdb.training_topic tt ON pt.training_topic_id = tt.id
        WHERE 
            ps.trainer_code = ? AND
            ps.calDeleteStatus = 0 AND
            pt.Status != 'Final Submitted' AND
            pt.Status != 'Cancelled' AND
            ps.PSstatus != 'Session Closed' AND
            pt.calDeleteStatus = 0

        UNION

        -- Coordinator
        SELECT 
            pmc.planing_id,
            ps.session_no,
            pmc.isRead_coordinator,
            tt.training_topic,
            ps.session_date,
            ps.from_time,
            ps.to_time,
            'coordinator' AS role_type
        FROM 
            planing_mapping_coordinator pmc
        LEFT JOIN 
            hrmdb.planing_sessions ps ON pmc.planing_id = ps.planing_id
        LEFT JOIN 
            hrmdb.planning_training_table pt ON ps.planing_id = pt.id
        LEFT JOIN 
            hrmdb.training_topic tt ON pt.training_topic_id = tt.id
        WHERE 
            pmc.coordinator_emp_id = ? AND
            ps.calDeleteStatus = 0 AND
            pt.Status != 'Final Submitted' AND
            pt.Status != 'Cancelled' AND
            ps.PSstatus != 'Session Closed' AND
            pt.calDeleteStatus = 0

        UNION

        -- Sub Coordinator
        SELECT 
            pmsc.planing_id,
            ps.session_no,
            pmsc.isRead_sub_coordinator,
            tt.training_topic,
            ps.session_date,
            ps.from_time,
            ps.to_time,
            'sub_coordinator' AS role_type
        FROM 
            planing_mapping_sub_coordinator pmsc
        LEFT JOIN 
            hrmdb.planing_sessions ps ON pmsc.planing_id = ps.planing_id
        LEFT JOIN 
            hrmdb.planning_training_table pt ON ps.planing_id = pt.id
        LEFT JOIN 
            hrmdb.training_topic tt ON pt.training_topic_id = tt.id
        WHERE 
            pmsc.sub_coordinator_emp_id = ? AND
            ps.calDeleteStatus = 0 AND
            pt.Status != 'Final Submitted' AND
            pt.Status != 'Cancelled' AND
            ps.PSstatus != 'Session Closed' AND
            pt.calDeleteStatus = 0

        UNION

        -- Trainee / Participant
        SELECT 
            pst.planing_id,
            pst.session_no,
            pst.isRead_trainee,
            tt.training_topic,
            ps.session_date,
            ps.from_time,
            ps.to_time,
            'participant' AS role_type
        FROM 
            planing_session_trainee_data pst
        LEFT JOIN 
            hrmdb.planning_training_table pt ON pst.planing_id = pt.id
        LEFT JOIN 
            hrmdb.planing_sessions ps ON pst.planing_id = ps.planing_id
        LEFT JOIN 
            hrmdb.training_topic tt ON pt.training_topic_id = tt.id
        WHERE 
            pst.trainee_id = ? AND
            pst.calDeleteStatus = 0 AND
            pt.Status != 'Final Submitted' AND
            pt.Status != 'Cancelled' AND
            ps.PSstatus != 'Session Closed' AND
            pt.calDeleteStatus = 0 AND
            ps.calDeleteStatus = 0;
    `;

    hrmdb.query(query, [emp_id, emp_id, emp_id, emp_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }

        const unreadCount = results.filter(notification => 
            notification.isRead_Trainer === 0 || 
            notification.isRead_coordinator === 0 || 
            notification.isRead_sub_coordinator === 0 || 
            notification.isRead_trainee === 0
        ).length;

        return res.status(200).json({ notifications: results, unreadCount });
    });
};




exports.markNotificationsAsRead = (req, res) => {
    const { emp_id, planing_id, session_no, role_type } = req.body;

    if (!emp_id || !planing_id || !session_no || !role_type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    let updateQuery = '';
    let queryParams = [];

    switch (role_type) {
        case 'trainer':
            updateQuery = `
                UPDATE planing_sessions 
                SET isRead_Trainer = 1 
                WHERE planing_id = ? AND session_no = ? AND trainer_code = ?
            `;
            queryParams = [planing_id, session_no, emp_id];
            break;

        case 'participant':
            updateQuery = `
                UPDATE planing_session_trainee_data 
                SET isRead_trainee = 1 
                WHERE planing_id = ? AND session_no = ? AND trainee_id = ?
            `;
            queryParams = [planing_id, session_no, emp_id];
            break;

        case 'coordinator':
            updateQuery = `
                UPDATE planing_mapping_coordinator 
                SET isRead_coordinator = 1 
                WHERE planing_id = ? AND coordinator_emp_id = ? AND session_no = ?
            `;
            queryParams = [planing_id, emp_id, session_no];
            break;

        case 'sub_coordinator':
            updateQuery = `
                UPDATE planing_mapping_sub_coordinator 
                SET isRead_sub_coordinator = 1 
                WHERE planing_id = ? AND sub_coordinator_emp_id = ? AND session_no = ?
            `;
            queryParams = [planing_id, emp_id, session_no];
            break;

        default:
            return res.status(400).json({ error: 'Invalid role_type' });
    }

    hrmdb.query(updateQuery, queryParams, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }

        return res.status(200).json({ message: 'Notification marked as read successfully' });
    });
};


