const { hrmdb } = require('../../../configuration/db');

// Helper function to log history
function logHistory(hrmdb, id, topic, scTopicType, userBy, status, callback) {
    const insertHistoryQuery = `
        INSERT INTO sc_topic_type_history (id, topic, sc_topic_type, user_by, user_modify_time, status) 
        VALUES (?, ?, ?, ?, NOW(), ?)`;

    hrmdb.query(insertHistoryQuery, [id, topic, scTopicType, userBy, status], callback);
}

// Function to insert or update training topic
exports.addOrUpdatetrainingTopic = (req, res) => {
    const { topic, department_name, userid ,userName} = req.body;
    const scTopicType = "training topic"; // Static value for sc_topic_type

    if (!topic || !userid || !department_name || topic.trim() === '' || department_name.trim() === '') {
        return res.status(400).json({ error: 'Missing or invalid fields: topic, userid, or department_name' });
    }

    const checkTopicQuery = `SELECT id, calDeleteStatus FROM training_topic WHERE training_topic = ?`;
    hrmdb.query(checkTopicQuery, [topic], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }

        if (results.length > 0) {
            const existingTopic = results[0];
            if (existingTopic.calDeleteStatus === 0) {
                return res.status(409).json({ message: 'This training topic already exists.' });
            } else {
                const updateQuery = `
                    UPDATE training_topic 
                    SET calDeleteStatus = 0, department_name = ?, user_created_by = ?, user_created_time = NOW() 
                    WHERE id = ?`;
                hrmdb.query(updateQuery, [department_name, userid, existingTopic.id], (updateErr) => {
                    if (updateErr) {
                        console.error('Failed to update training topic:', updateErr);
                        return res.status(500).json({ error: 'Failed to update training topic', details: updateErr });
                    }

                    logHistory(hrmdb, existingTopic.id, topic, scTopicType, userid, 'Re-activation', (logErr) => {
                        if (logErr) {
                            return res.status(500).json({ error: 'Failed to log history', details: logErr });
                        }
                        return res.status(200).json({ message: 'Training topic reactivated successfully.' });
                    });
                });
            }
        } else {
            const insertQuery = `
                INSERT INTO training_topic (calDeleteStatus, department_name, training_topic, user_created_by, user_name,user_created_time) 
                VALUES (0, ?, ?, ?,?, NOW())`;
            hrmdb.query(insertQuery, [department_name, topic, userid,userName], (insertErr) => {
                if (insertErr) {
                    console.error('Failed to insert topic:', insertErr);
                    return res.status(500).json({ error: 'Failed to insert topic', details: insertErr });
                }

                hrmdb.query(`SELECT LAST_INSERT_ID() AS id`, (idErr, idResults) => {
                    if (idErr) {
                        console.error('Failed to fetch last insert ID:', idErr);
                        return res.status(500).json({ error: 'Failed to fetch ID', details: idErr });
                    }

                    const id = idResults && idResults.length > 0 ? idResults[0].id : null;
                    if (!id) {
                        return res.status(500).json({ error: 'Failed to fetch last insert ID' });
                    }

                    logHistory(hrmdb, id, topic, scTopicType, userid, 'Insert New Training Topic', (logErr) => {
                        if (logErr) {
                            return res.status(500).json({ error: 'Failed to log history', details: logErr });
                        }
                        return res.status(201).json({ message: 'Training topic added successfully.' });
                    });
                });
            });
        }
    });
};

// Function to get all topics
exports.getAllTrainingTopics = (req, res) => {
    const getAllQuery = `SELECT * FROM training_topic WHERE calDeleteStatus = 0 ORDER BY department_name ASC`;
    hrmdb.query(getAllQuery, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ topics: results });
    });
};

// Function to delete (mark as inactive) a topic
exports.deleteTrainingTopic = (req, res) => {
    const { userid, topic } = req.body;
    const scTopicType = "training topic"; // Static value for sc_topic_type

    if (!userid || !topic) {
        return res.status(400).json({ error: 'Missing required fields: userid or topic' });
    }

    const checkTopicQuery = `SELECT id FROM training_topic WHERE training_topic = ? AND calDeleteStatus = 0`;
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
            UPDATE training_topic 
            SET calDeleteStatus = 1, user_created_by = ?, user_created_time = NOW() 
            WHERE training_topic = ?`;
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




exports.UpdatetrainingTopic = (req, res) => {
    const { topic, updatedTopic, department_name, updatedDepartment_name, userid, userName } = req.body;
    const scTopicType = "training topic"; // Static value for sc_topic_type

    if (!topic || !updatedTopic || !userid || !department_name || !updatedDepartment_name || topic.trim() === '' || updatedTopic.trim() === '' || department_name.trim() === '' || updatedDepartment_name.trim() === '') {
        return res.status(400).json({ error: 'Missing or invalid fields: topic, userid, or department_name' });
    }

    const checkTopicQuery = `SELECT id, calDeleteStatus FROM training_topic WHERE training_topic = ?`;
    hrmdb.query(checkTopicQuery, [topic], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }

        if (results.length > 0) {
            const existingTopic = results[0];
            const updateQuery = `
                UPDATE training_topic 
                SET calDeleteStatus = 0, 
                    department_name = ?, 
                    training_topic = ?, 
                    user_created_by = ?, 
                    user_name = ?, 
                    user_created_time = NOW() 
                WHERE id = ?`;

            hrmdb.query(updateQuery, [updatedDepartment_name, updatedTopic, userid, userName, existingTopic.id], (updateErr) => {
                if (updateErr) {
                    console.error('Failed to update training topic:', updateErr);
                    return res.status(500).json({ error: 'Failed to update training topic', details: updateErr });
                }

                logHistory(hrmdb, existingTopic.id, topic, scTopicType, userid, 'Updated', (logErr) => {
                    if (logErr) {
                        return res.status(500).json({ error: 'Failed to log history', details: logErr });
                    }
                    return res.status(200).json({ message: 'Training topic updated successfully.' });
                });
            });
        } else {
            return res.status(404).json({ error: 'Topic not found' });
        }
    });
};