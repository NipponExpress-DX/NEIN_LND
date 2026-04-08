const { leavemanagement } = require('../../../configuration/db');
// Function to get all topics
exports.getAllBranchMaster = (req, res) => {
    const getAllQuery = `SELECT * FROM branchmaster `;
    leavemanagement.query(getAllQuery, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ topics: results });
    });
};

exports.getAllDepartment = (req, res) => {
    const getAllQuery = `SELECT * FROM department WHERE  not (department_code='Branch Head' or department_code='Management')`;
    leavemanagement.query(getAllQuery, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ topics: results });
    });
};