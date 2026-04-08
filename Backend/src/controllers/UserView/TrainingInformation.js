const { hrmdb } = require('../../../configuration/db');



//Planning information getting to trainee information 

exports.getUserAllPlanningDetails = (req, res) => {
    const { trainee_id } = req.body;
    
    // Validate the trainee_id from the request body
    if (!trainee_id) {
        return res.status(400).json({ error: 'Missing trainee_id in request body' });
    }

    // Securely construct the SQL query with placeholders
    const getAllQuery = `SELECT 
                            pstd.*
                        FROM 
                            planing_session_trainee_data pstd
                        INNER JOIN 
                            planing_sessions ps ON pstd.planing_id = ps.planing_id AND pstd.session_no = ps.session_no
                        INNER JOIN 
                            planning_training_table ptt ON ps.planing_id = ptt.id
                        WHERE 
                            pstd.trainee_id = ? 
                            AND pstd.calDeleteStatus = 0
                            AND ps.calDeleteStatus = 0
                            AND ptt.calDeleteStatus = 0`;

    // Execute the query with parameterized values
    hrmdb.query(getAllQuery, [trainee_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ records: results });
    });
};



