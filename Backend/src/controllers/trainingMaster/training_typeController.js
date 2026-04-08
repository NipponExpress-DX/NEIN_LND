const { hrmdb } = require('../../../configuration/db');

// Helper function to log history
function logHistory(hrmdb, id, topic, scTopicType, userBy, status, callback) {
    const insertHistoryQuery = `
        INSERT INTO sc_topic_type_history (id, topic, sc_topic_type, user_by, user_modify_time, status) 
        VALUES (?, ?, ?, ?, NOW(), ?)`;

    hrmdb.query(insertHistoryQuery, [id, topic, scTopicType, userBy, status], callback);
}

// Function to insert training type
exports.addOrUpdatetrainingType = (req, res) => {
    const { topic, userid, userName } = req.body;
    const scTopicType = "training type"; // Static value for sc_topic_type

    if (!topic || !userid || !userName) {
        return res.status(400).json({ error: 'Missing required fields: topic, userid, or userName' });
    }

    const checkTopicQuery = `SELECT * FROM training_type WHERE training_type = ?`;
    hrmdb.query(checkTopicQuery, [topic], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }

        if (results.length > 0) {
            const existingType = results[0];
            if (existingType.calDeleteStatus === 0) {
                return res.status(409).json({ message: 'This training type already exists.' });
            } else {
                const updateQuery = `
                    UPDATE training_type 
                    SET training_type = ?,calDeleteStatus = 0, user_created_by = ?, user_created_time = NOW(), user_name = ? 
                    WHERE id = ?`;
                hrmdb.query(updateQuery, [topic,userid, userName, existingType.id], (updateErr) => {
                    if (updateErr) {
                        console.error('Failed to update training type:', updateErr);
                        return res.status(500).json({ error: 'Failed to update training type', details: updateErr });
                    }

                    logHistory(hrmdb, existingType.id, topic, scTopicType, userid, 'Re-activation', (logErr) => {
                        if (logErr) {
                            return res.status(500).json({ error: 'Failed to log history', details: logErr });
                        }
                        return res.status(200).json({ message: 'Training type reactivated successfully.' });
                    });
                });
            }
        } else {
            const insertQuery = `
                INSERT INTO training_type (calDeleteStatus, training_type, user_created_by, user_created_time, user_name) 
                VALUES (0, ?, ?, NOW(), ?)`;
            hrmdb.query(insertQuery, [topic, userid, userName], (insertErr) => {
                if (insertErr) {
                    console.error('Failed to insert topic:', insertErr);
                    return res.status(500).json({ error: 'Failed to insert topic', details: insertErr });
                }

                hrmdb.query(`SELECT LAST_INSERT_ID() AS id`, (idErr, idResults) => {
                    if (idErr) {
                        console.error('Failed to fetch last insert ID:', idErr);
                        return res.status(500).json({ error: 'Failed to fetch ID', details: idErr });
                    }

                    const id = idResults[0].id;
                    logHistory(hrmdb, id, topic, scTopicType, userid, 'Insert New Training Type', (logErr) => {
                        if (logErr) {
                            return res.status(500).json({ error: 'Failed to log history', details: logErr });
                        }
                        return res.status(201).json({ message: 'Training type added successfully.' });
                    });
                });
            });
        }
    });
};

// Function to get all traning type
exports.getAlltrainingTypes = (req, res) => {
    const getAllQuery = `SELECT * FROM training_type WHERE calDeleteStatus = 0 ORDER BY training_type ASC`;
    hrmdb.query(getAllQuery, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ topics: results });
    });
};

// Function to delete (mark as inactive) a training type
exports. deletetrainingType = (req, res) => {
    const { userid, topic } = req.body;
    const scTopicType = "training type"; // Static value for sc_topic_type

    if (!userid || !topic) {
        return res.status(400).json({ error: 'Missing required fields: userid or topic' });
    }

    const checkTopicQuery = `SELECT id FROM training_type WHERE training_type = ? AND calDeleteStatus = 0`;
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
            UPDATE training_type 
            SET calDeleteStatus = 1, user_created_by = ?, user_created_time = NOW() 
            WHERE training_type = ?`;
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
exports.UpdatetrainingType = (req, res) => {
    const { topic, updatedTopic, userid, userName } = req.body;
    const scTopicType = "training type"; // Static value for sc_topic_type

    // Validate input fields
    if (!topic || !updatedTopic || !userid || !userName) {
        return res.status(400).json({ error: 'Missing required fields: topic, updatedTopic, userid, or userName' });
    }

    // Query to check if the training type exists
    const checkTopicQuery = `SELECT * FROM training_type WHERE training_type = ?`;
    hrmdb.query(checkTopicQuery, [topic], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }

        // Check if the training type exists
        if (results.length === 0) {
            return res.status(404).json({ error: 'Training type not found.' });
        }

        const existingType = results[0]; // Get the existing training type record

        // Query to update the training type
        const updateQuery = `
            UPDATE training_type 
            SET training_type = ?, calDeleteStatus = 0, user_created_by = ?, user_created_time = NOW(), user_name = ? 
            WHERE id = ?`;
        hrmdb.query(updateQuery, [updatedTopic, userid, userName, existingType.id], (updateErr) => {
            if (updateErr) {
                console.error('Failed to update training type:', updateErr);
                return res.status(500).json({ error: 'Failed to update training type', details: updateErr });
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
