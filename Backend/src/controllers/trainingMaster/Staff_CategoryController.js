const { hrmdb } = require('../../../configuration/db');

// Helper function to log history
function logHistory(hrmdb, id, topic, scTopicType, userBy, status, callback) {
    const insertHistoryQuery = `
        INSERT INTO sc_topic_type_history (id, topic, sc_topic_type, user_by, user_modify_time, status) 
        VALUES (?, ?, ?, ?, NOW(), ?)`;

    hrmdb.query(insertHistoryQuery, [id, topic, scTopicType, userBy, status], callback);
}

// Function to insert or update staff category
exports.addOrUpdateStaffCategory = (req, res) => {
    const { topic, userid ,userName} = req.body;
    const scTopicType = "staff category"; // Static value for sc_topic_type

    if (!topic || !userid ||!userName) {
        return res.status(400).json({ error: 'Missing required fields: topic or userid' });
    }

    const checkTopicQuery = `SELECT * FROM staff_category WHERE staff_category = ?`;
    hrmdb.query(checkTopicQuery, [topic], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }

        if (results.length > 0) {
            const existingCategory = results[0];
            if (existingCategory.calDeleteStatus === 0) {
                return res.status(409).json({ message: 'This topic already exists.' });
            } else {
                const updateQuery = `
                    UPDATE staff_category 
                    SET calDeleteStatus = 0, user_created_by = ?,user_name=?, user_created_time = NOW() 
                    WHERE id = ?`;
                hrmdb.query(updateQuery, [userid,userName, existingCategory.id], (updateErr) => {
                    if (updateErr) {
                        console.error('Failed to update topic:', updateErr);
                        return res.status(500).json({ error: 'Failed to update staff category topic', details: updateErr });
                    }

                    logHistory(hrmdb, existingCategory.id, topic, scTopicType, userid, 'Re-activation', (logErr) => {
                        if (logErr) {
                            return res.status(500).json({ error: 'Failed to log history', details: logErr });
                        }
                        return res.status(200).json({ message: 'Topic reactivated successfully.' });
                    });
                });
            }
        } else {
            const insertQuery = `
                INSERT INTO staff_category (calDeleteStatus, staff_category, user_created_by, user_name, user_created_time) 
                VALUES (0, ?, ?, ?, NOW())`;
            hrmdb.query(insertQuery, [topic, userid,userName], (insertErr) => {
                if (insertErr) {
                    console.error('Failed to insert staff category topic:', insertErr);
                    return res.status(500).json({ error: 'Failed to insert staff category topic', details: insertErr });
                }

                hrmdb.query(`SELECT LAST_INSERT_ID() AS id`, (idErr, idResults) => {
                    if (idErr) {
                        console.error('Failed to fetch last insert ID:', idErr);
                        return res.status(500).json({ error: 'Failed to fetch ID', details: idErr });
                    }

                    const id = idResults[0].id;
                    logHistory(hrmdb, id, topic, scTopicType, userid, 'Insert New staff Category Topic', (logErr) => {
                        if (logErr) {
                            return res.status(500).json({ error: 'Failed to log history', details: logErr });
                        }
                        return res.status(201).json({ message: 'Topic added successfully.' });
                    });
                });
            });
        }
    });
};

// Function to get all topics
exports.getAllStaffCategories = (req, res) => {
    const getAllQuery = `SELECT * FROM staff_category WHERE calDeleteStatus = 0 ` ;
    hrmdb.query(getAllQuery, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ topics: results });
    });
};

// Function to delete (mark as inactive) a topic
exports. deleteStaffCategory = (req, res) => {
    const { userid, topic } = req.body;
    const scTopicType = "staff category"; // Static value for sc_topic_type

    if (!userid || !topic) {
        return res.status(400).json({ error: 'Missing required fields: userid or topic' });
    }

    const checkTopicQuery = `SELECT id FROM staff_category WHERE staff_category = ? AND calDeleteStatus = 0`;
    hrmdb.query(checkTopicQuery, [topic], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Topic not found or already deleted' });
        }

        const { id } = results[0];
        const updateDeleteQuery = `
            UPDATE staff_category 
            SET calDeleteStatus = 1, user_created_by = ?, user_created_time = NOW() 
            WHERE staff_category = ?`;
        hrmdb.query(updateDeleteQuery, [userid, topic], (updateErr) => {
            if (updateErr) {
                console.error('Failed to delete topic:', updateErr);
                return res.status(500).json({ error: 'Failed to delete topic', details: updateErr });
            }

            logHistory(hrmdb, id, topic, scTopicType, userid, 'De-activation', (logErr) => {
                if (logErr) {
                    return res.status(500).json({ error: 'Failed to log history', details: logErr });
                }
                return res.status(200).json({ message: 'Topic deleted successfully and history updated.' });
            });
        });
    });
};


// Function to update training type
exports.UpdateStaffCategory = (req, res) => {
    const { topic, updatedTopic, userid, userName } = req.body;
    const scTopicType = "training type"; // Static value for sc_topic_type

    // Validate input fields
    if (!topic || !updatedTopic || !userid || !userName) {
        return res.status(400).json({ error: 'Missing required fields: topic, updatedTopic, userid, or userName' });
    }

    // Query to check if the staff category exists
    const checkTopicQuery = `SELECT * FROM staff_category WHERE staff_category = ?`;
    hrmdb.query(checkTopicQuery, [topic], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }

        // Check if the staff category exists
        if (results.length === 0) {
            return res.status(404).json({ error: 'staff category not found.' });
        }

        const existingType = results[0]; // Get the existing staff category record

        // Query to update the staff category
        const updateQuery = `
            UPDATE staff_category 
            SET staff_category = ?, calDeleteStatus = 0, user_created_by = ?, user_created_time = NOW(), user_name = ? 
            WHERE id = ?`;
        hrmdb.query(updateQuery, [updatedTopic, userid, userName, existingType.id], (updateErr) => {
            if (updateErr) {
                console.error('Failed to update staff category:', updateErr);
                return res.status(500).json({ error: 'Failed to update staff category', details: updateErr });
            }

            // Log the history of the update
            logHistory(hrmdb, existingType.id, updatedTopic, scTopicType, userid, 'Updated', (logErr) => {
                if (logErr) {
                    return res.status(500).json({ error: 'Failed to log history', details: logErr });
                }
                return res.status(200).json({ message: 'Training type updated successfully.' });
            });
        });
    });
};

