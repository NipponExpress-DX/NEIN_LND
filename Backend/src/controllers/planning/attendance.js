const { hrmdb, leavemanagement } = require('../../../configuration/db');

// Function to get all Active Attendance Status information
exports.getAllActiveAttendanceStatus = (req, res) => {
    const { planing_id ,session_no } = req.body;

    if (!planing_id || !session_no ) {
        return res.status(400).json({ error: 'Missing required fields: planing_id or session_no' });
    }

    const getAllQuery = `SELECT planing_id,session_no,trainee_id,trainee_name,trainee_department,	trainee_branch,trainee_mail ,attendance_status
                         FROM planing_session_trainee_data
                         WHERE planing_id = ? and session_no = ? and calDeleteStatus = '0'
                         ORDER BY trainee_id ASC`;
    hrmdb.query(getAllQuery, [planing_id,session_no ], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ coordinators: results });
    });
};



// Function to update planning session trainee data
// In your backend controller - update updateTraineeAttendance function

exports.updateTraineeAttendance = (req, res) => {
    const { planing_id, session_no, trainee_id, walk_ins } = req.body;
 
    if (!planing_id || !session_no) {
        return res.status(400).json({ error: "planing_id and session_no are required." });
    }
 
    if ((!trainee_id || typeof trainee_id !== "object") && (!walk_ins || !Array.isArray(walk_ins))) {
        return res.status(400).json({ error: "Either trainee_id object or walk_ins array is required." });
    }
 
    // ── Step 1: Try fetching session metadata from existing trainee rows ──────
    const fetchSessionMetaQuery = `
        SELECT 
            branch, department, 
            coordinator_type, coordinator_emp_id, coordinator_name
        FROM planing_session_trainee_data
        WHERE planing_id = ? AND session_no = ? AND calDeleteStatus = '0'
        LIMIT 1`;
 
        hrmdb.query(fetchSessionMetaQuery, [planing_id, parseInt(session_no, 10)], (metaErr, metaResults) => {
        if (metaErr) {
            console.error('Error fetching session meta:', metaErr);
            return res.status(500).json({ error: 'Failed to fetch session metadata', details: metaErr });
        }
 
        if (metaResults.length > 0) {
            // ── Rows already exist — use them directly (original behaviour) ──
            console.log('📋 Session meta from trainee data:', metaResults[0]);
            return processAttendance(metaResults[0]);
        }
 
        // ── No trainee rows yet (walk-in-only scenario) ──────────────────────
        // Fall back to the coordinator mapping table to get coordinator context.
        // This table is populated during the Agenda / mapping stage, so it always
        // has the correct coordinator even before any attendance is saved.
        const fetchMappingMetaQuery = `
            SELECT 
                coordinator_type,
                coordinator_emp_id,
                coordinator_name,
                branch,
                department
            FROM planing_session_mapping_data
            WHERE planing_id = ? AND session_no = CAST(? AS UNSIGNED)
            LIMIT 1`;
 
        hrmdb.query(fetchMappingMetaQuery, [planing_id, parseInt(session_no, 10)], (mapErr, mapResults) => {
            if (mapErr) {
                console.warn('⚠️ Could not fetch mapping meta, proceeding with nulls:', mapErr.message);
            }
 
            const sessionMeta = (mapResults && mapResults.length > 0) ? mapResults[0] : {
                branch:             null,
                department:         null,
                coordinator_type:   null,
                coordinator_emp_id: null,
                coordinator_name:   null,
            };
 
            console.log('📋 Session meta from mapping data (walk-in-only fallback):', sessionMeta);
            return processAttendance(sessionMeta);
        });
    });
 
    // ── All the original logic, now in a named function ───────────────────────
   function processAttendance(sessionMeta) {
    const updates = [];

    if (trainee_id && typeof trainee_id === "object") {
        const regularUpdates = Object.entries(trainee_id).map(([id, status]) => {
            return new Promise((resolve, reject) => {
                
                const trimmedId = String(id).trim();

                // ── Skip only truly empty/invalid values ──
                if (!trimmedId || trimmedId === 'ALL' || trimmedId === 'Other') {
                    console.warn(`⚠️ Skipping invalid trainee_id: "${id}"`);
                    return resolve({ id, status: "skipped", reason: "invalid_id" });
                }

                const attendanceValue = status === "Y" ? 1 : 0;

                // ── Check if row already exists ──
                const selectQuery = `
                    SELECT id 
                    FROM planing_session_trainee_data 
                    WHERE planing_id = ? AND session_no = ? AND trainee_id = ?`;

                hrmdb.query(selectQuery, [planing_id, session_no, trimmedId], (selectErr, results) => {
                    if (selectErr) return reject(selectErr);

                    if (results.length > 0) {
                        // ── Row exists — just update attendance ──
                        const updateQuery = `
                            UPDATE planing_session_trainee_data 
                            SET attendance_status = ?, date_created = NOW() 
                            WHERE planing_id = ? AND session_no = ? AND trainee_id = ?`;

                        hrmdb.query(updateQuery, [attendanceValue, planing_id, session_no, trimmedId], (updateErr) => {
                            if (updateErr) return reject(updateErr);
                            resolve({ id: trimmedId, status: "updated", type: "regular" });
                        });

                    } else {
                        // ── Row doesn't exist — try to fetch employee details ──
                        // Try numeric lookup first, then string lookup
                        const numericId = parseInt(trimmedId, 10);
                        const lookupId = !isNaN(numericId) && String(numericId) === trimmedId 
                            ? numericId    // pure numeric like 1234
                            : trimmedId;   // alphanumeric like T-091

                        const fetchEmpQuery = `
                            SELECT 
                                u.emp_id, u.full_name,
                                d.department_name, bm.branch_name, u.email
                            FROM leavemanagement.user u
                            JOIN leavemanagement.branchmaster bm ON u.branch_id = bm.branch_id
                            JOIN leavemanagement.department d ON u.department_id = d.department_id
                            WHERE u.emp_id = ? LIMIT 1`;

                        leavemanagement.query(fetchEmpQuery, [lookupId], (empErr, empResults) => {
                            if (empErr) console.warn(`⚠️ Could not fetch employee ${trimmedId}:`, empErr.message);

                            const emp = (!empErr && empResults?.length > 0) ? empResults[0] : null;

                            if (!emp) {
                                console.warn(`⚠️ Employee ${trimmedId} not found — skipping insert`);
                                return resolve({ id: trimmedId, status: "skipped", reason: "employee_not_found" });
                            }

                            const insertQuery = `
                                INSERT INTO planing_session_trainee_data 
                                    (calDeleteStatus, planing_id, session_no,
                                     branch, department,
                                     coordinator_type, coordinator_emp_id, coordinator_name,
                                     trainee_id, trainee_name, trainee_mail,
                                     trainee_branch, trainee_department,
                                     attendance_status, date_created)
                                VALUES ('0', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                                ON DUPLICATE KEY UPDATE
                                    attendance_status  = VALUES(attendance_status),
                                    trainee_name       = VALUES(trainee_name),
                                    trainee_department = VALUES(trainee_department),
                                    trainee_branch     = VALUES(trainee_branch),
                                    trainee_mail       = VALUES(trainee_mail),
                                    date_created       = NOW()`;

                            const insertValues = [
                                planing_id, session_no,
                                sessionMeta.branch, sessionMeta.department,
                                sessionMeta.coordinator_type, sessionMeta.coordinator_emp_id, sessionMeta.coordinator_name,
                                trimmedId,          // ← use trimmedId not numericId
                                emp.full_name, emp.email,
                                emp.branch_name, emp.department_name,
                                attendanceValue,
                            ];

                            hrmdb.query(insertQuery, insertValues, (insertErr) => {
                                if (insertErr) return reject(insertErr);
                                console.log(`✅ Employee walk-in inserted: ${emp.full_name} (${trimmedId})`);
                                resolve({ id: trimmedId, status: "inserted", type: "employee-walkin" });
                            });
                        });
                    }
                });
            });
        });
        updates.push(...regularUpdates);
    }
 
        // Process complete walk-ins (no emp_id — all details provided by user)
        if (walk_ins && Array.isArray(walk_ins) && walk_ins.length > 0) {
            const walkInUpdates = walk_ins.map((walkIn, index) => {
                return new Promise((resolve, reject) => {
                    const {
                        trainee_name, trainee_mail, trainee_branch, trainee_department,
                        attendance_status = 1,
                        // ── These come from the frontend (captured from mapping records) ──
                        coordinator_emp_id: wi_coord_emp_id,
                        coordinator_name:   wi_coord_name,
                        coordinator_type:   wi_coord_type,
                    } = walkIn;
 
                    if (!trainee_name?.trim()) return reject(new Error(`Walk-in ${index + 1} missing name`));
                    if (!trainee_mail?.trim()) return reject(new Error(`Walk-in ${index + 1} missing email`));
                    if (!trainee_branch?.trim()) return reject(new Error(`Walk-in ${index + 1} missing branch`));
                    if (!trainee_department?.trim()) return reject(new Error(`Walk-in ${index + 1} missing department`));
 
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(trainee_mail)) return reject(new Error(`Walk-in ${index + 1} invalid email: ${trainee_mail}`));
 
                    // ── Resolve coordinator: prefer sessionMeta (from existing rows or
                    //    mapping table), fall back to values sent by the frontend ──────
                    const finalCoordEmpId   = sessionMeta.coordinator_emp_id ?? wi_coord_emp_id   ?? null;
                    const finalCoordName    = sessionMeta.coordinator_name   ?? wi_coord_name     ?? null;
                    const finalCoordType    = sessionMeta.coordinator_type   ?? wi_coord_type     ?? null;
                    const finalBranch       = sessionMeta.branch             ?? null;
                    const finalDepartment   = sessionMeta.department         ?? null;
 
                    const checkExistingQuery = `
                        SELECT id FROM planing_session_trainee_data 
                        WHERE planing_id = ? AND session_no = ? AND trainee_mail = ?
                        LIMIT 1`;
 
                    hrmdb.query(checkExistingQuery, [planing_id, session_no, trainee_mail], (checkErr, checkResults) => {
                        if (checkErr) return reject(checkErr);
 
                        const attendanceValue = attendance_status === 1 ? 1 : 0;
 
                        if (checkResults.length > 0) {
                            const updateQuery = `
                                UPDATE planing_session_trainee_data 
                                SET 
                                    attendance_status  = ?,
                                    trainee_name       = ?,
                                    trainee_mail       = ?,
                                    trainee_branch     = ?,
                                    trainee_department = ?,
                                    date_created       = NOW()
                                WHERE planing_id = ? AND session_no = ? 
                                AND (trainee_mail = ? OR trainee_name = ?)`;
 
                            hrmdb.query(updateQuery, [
                                attendanceValue, trainee_name, trainee_mail, trainee_branch, trainee_department,
                                planing_id, session_no, trainee_mail, trainee_name
                            ], (updateErr) => {
                                if (updateErr) return reject(updateErr);
                                console.log(`✅ Walk-in updated: ${trainee_name} (${trainee_mail})`);
                                resolve({ name: trainee_name, email: trainee_mail, status: "updated", type: "complete-walkin" });
                            });
                        } else {
                            const insertQuery = `
                                INSERT INTO planing_session_trainee_data 
                                    (calDeleteStatus, planing_id, session_no,
                                     branch, department,
                                     coordinator_type, coordinator_emp_id, coordinator_name,
                                     trainee_id, trainee_name, trainee_mail,
                                     trainee_branch, trainee_department,
                                     attendance_status, date_created)
                                VALUES ('0', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
 
                            const insertValues = [
                                planing_id, session_no,
                                finalBranch, finalDepartment,
                                finalCoordType, finalCoordEmpId, finalCoordName,
                                null,  // trainee_id is NULL for manual walk-ins
                                trainee_name.trim(),
                                trainee_mail.trim().toLowerCase(),
                                trainee_branch.trim(),
                                trainee_department.trim(),
                                attendanceValue,
                            ];
 
                            hrmdb.query(insertQuery, insertValues, (insertErr) => {
                                if (insertErr) return reject(insertErr);
                                console.log(`✅ Walk-in inserted: ${trainee_name} (${trainee_mail}) | coord: ${finalCoordName}`);
                                resolve({ name: trainee_name, email: trainee_mail, status: "inserted", type: "complete-walkin" });
                            });
                        }
                    });
                });
            });
            updates.push(...walkInUpdates);
        }
 
        Promise.all(updates)
            .then((results) => {
                const inserted = results.filter(r => r.status === "inserted").length;
                const updated  = results.filter(r => r.status === "updated").length;
                const skipped  = results.filter(r => r.status === "skipped").length;
 
                console.log(`✅ Attendance saved — updated: ${updated}, inserted: ${inserted}, skipped: ${skipped}`);
 
                res.status(200).json({
                    message: "Trainee attendance updated successfully.",
                    summary: { updated, inserted, skipped },
                    results,
                });
            })
            .catch((err) => {
                console.error("❌ Error updating trainee attendance:", err);
                res.status(500).json({ error: "Failed to update trainee attendance", details: err.message });
            });
    }
};


exports.updateTraineeEffectiveness = (req, res) => {
  const { planing_id, session_no, trainee_Effective_info } = req.body;

  if (!planing_id || !session_no || !trainee_Effective_info || typeof trainee_Effective_info !== 'object') {
    return res.status(400).json({ error: "Missing or invalid required fields." });
  }

  const entries = Object.entries(trainee_Effective_info);
  if (entries.length === 0) {
    return res.status(400).json({ error: "No effectiveness data provided." });
  }

  const now = new Date();

  // ── Build CASE WHEN blocks for each column ────────────────────────────────
  const escapeStr = (val) => {
    if (val === null || val === undefined || val === '') return 'NULL';
    return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  };

  const buildCase = (colIndex) =>
            'CASE trainee_id ' +
            entries.map(([id, data]) =>
                // ── Use quoted string for alphanumeric IDs ──
                `WHEN '${String(id).trim()}' THEN ${
                    data[colIndex] !== undefined && data[colIndex] !== null
                        ? `'${data[colIndex]}'`
                        : 'NULL'
                }`
            ).join(' ') +
            ' ELSE NULL END';

        const buildRemarks = () =>
            'CASE trainee_id ' +
            entries.map(([id, data]) =>
                `WHEN '${String(id).trim()}' THEN ${escapeStr(data[5])}`
            ).join(' ') +
            ' ELSE NULL END';

        // ── Don't filter to numeric only — accept all IDs ──
        const ids = entries
            .map(([id]) => String(id).trim())
            .filter(id => id && id !== 'ALL' && id !== 'Other');

        if (ids.length === 0) {
            return res.status(400).json({ error: "No valid trainee IDs provided." });
        }


  const bulkQuery = `
    UPDATE planing_session_trainee_data
    SET
      EffectivenessMeasuredA          = ${buildCase(0)},
      EffectivenessMeasuredB          = ${buildCase(1)},
      EffectivenessMeasuredC          = ${buildCase(2)},
      EffectivenessStatus             = ${buildCase(3)},
      EffectivenessRetrainingRequired = ${buildCase(4)},
      EffectivenessRemarks            = ${buildRemarks()},
      TEUpdatedDateAndTime            = ?
     WHERE planing_id = ?
      AND session_no = ?
      AND trainee_id IN (${ids.map(id => `'${id}'`).join(',')})
`;

  console.log(`[updateTraineeEffectiveness] Bulk updating ${ids.length} trainees for planing_id=${planing_id} session=${session_no}`);

  hrmdb.query(bulkQuery, [now, planing_id, session_no], (err, result) => {
    if (err) {
      console.error('Bulk effectiveness update failed:', err);
      return res.status(500).json({ error: 'Update failed', details: err.message });
    }

    console.log(`✅ Effectiveness updated — ${result.affectedRows} rows affected`);
    res.status(200).json({
      message: "Trainee effectiveness data updated successfully.",
      updatedCount: result.affectedRows,
    });
  });
};


exports.getAllTraineeEffectiveness = (req, res) => {
    const { planing_id ,session_no } = req.body;

    if (!planing_id || !session_no ) {
        return res.status(400).json({ error: 'Missing required fields: planing_id or session_no' });
    }

    const getAllQuery = `SELECT trainee_id,trainee_name,trainee_mail,EffectivenessMeasuredA,EffectivenessMeasuredB,EffectivenessMeasuredC,EffectivenessStatus,EffectivenessRetrainingRequired,EffectivenessRemarks 
                        FROM planing_session_trainee_data where planing_id= ? and session_no= ? and attendance_status ='1'`;
    hrmdb.query(getAllQuery, [planing_id,session_no ], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ AllTraineeffectiveness: results });
    });
};










