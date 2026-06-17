const { hrmdb } = require('../../../configuration/db');

// ─── Helper: promisified query ─────────────────────────────────────────────
const query = (sql, params = []) => hrmdb.promise().query(sql, params).then(([rows]) => rows);


// ─── All Master Feedback Form Details list ─────────────────────────────────
exports.GetAllMasterFeedbackFormDetailsList = async (req, res) => {
  try {
    const results = await query(`SELECT * FROM feedback_form_question WHERE calDeleteStatus = 0`);
    return res.status(200).json({ topics: results });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};


// ─── All Trainee Feedback Form Details list ────────────────────────────────
exports.GetAllTraineeFeedbackFormDetailsList = async (req, res) => {
  try {
    const results = await query(
      `SELECT * FROM feedback_form_question WHERE calDeleteStatus = 0 AND feedback_form_type = 'trainee'`
    );
    return res.status(200).json({ topics: results });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};


// ─── All Trainer Feedback Form Details list ────────────────────────────────
exports.GetAllTrainerFeedbackFormDetailsList = async (req, res) => {
  try {
    const results = await query(
      `SELECT * FROM feedback_form_question WHERE calDeleteStatus = 0 AND feedback_form_type = 'trainer'`
    );
    return res.status(200).json({ topics: results });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};


// ─── Add or Update Feedback Form ───────────────────────────────────────────
exports.addOrUpdateFeedbackFormDetails = async (req, res) => {
  const { feedback_form_type, feedback_form_name, questions, user_created_by, user_name } = req.body;

  if (!feedback_form_type || !feedback_form_name || !questions || !user_created_by || !user_name) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  let questionsJson;
  try {
    questionsJson = JSON.stringify(questions);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid questions format. Must be a valid JSON object.' });
  }

  try {
    const existing = await query(
      `SELECT id FROM feedback_form_question WHERE feedback_form_name = ? AND feedback_form_type = ?`,
      [feedback_form_name, feedback_form_type]
    );

    if (existing.length > 0) {
      const result = await query(
        `UPDATE feedback_form_question
         SET calDeleteStatus = 0, questions = ?, user_created_by = ?, user_name = ?, user_created_time = NOW()
         WHERE feedback_form_name = ? AND feedback_form_type = ?`,
        [questionsJson, user_created_by, user_name, feedback_form_name, feedback_form_type]
      );
      return res.status(200).json({ message: 'Feedback form details successfully updated.', affectedRows: result.affectedRows });
    } else {
      const result = await query(
        `INSERT INTO feedback_form_question
           (calDeleteStatus, feedback_form_type, feedback_form_name, questions, user_created_by, user_name, user_created_time)
         VALUES (0, ?, ?, ?, ?, ?, NOW())`,
        [feedback_form_type, feedback_form_name, questionsJson, user_created_by, user_name]
      );
      return res.status(200).json({ message: 'Feedback form details successfully inserted.', insertedId: result.insertId });
    }
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};


// ─── Update Feedback Form ──────────────────────────────────────────────────
exports.UpdateFeedbackFormDetails = async (req, res) => {
  const { feedback_form_type, feedback_form_name, questions, user_created_by, user_name } = req.body;

  if (!feedback_form_type || !feedback_form_name || !questions || !user_created_by || !user_name) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  let questionsJson;
  try {
    questionsJson = JSON.stringify(questions);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid questions format. Must be a valid JSON object.' });
  }

  try {
    const existing = await query(
      `SELECT id FROM feedback_form_question WHERE feedback_form_name = ? AND feedback_form_type = ?`,
      [feedback_form_name, feedback_form_type]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Feedback form not found.' });
    }

    const result = await query(
      `UPDATE feedback_form_question
       SET calDeleteStatus = 0, questions = ?, user_created_by = ?, user_name = ?, user_created_time = NOW()
       WHERE feedback_form_name = ? AND feedback_form_type = ?`,
      [questionsJson, user_created_by, user_name, feedback_form_name, feedback_form_type]
    );
    return res.status(200).json({ message: 'Feedback form details successfully updated.', affectedRows: result.affectedRows });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};


// ─── Delete (soft) Feedback Form ───────────────────────────────────────────
exports.DeleteFeedbackFormDetails = async (req, res) => {
  const { feedback_form_type, feedback_form_name, user_created_by, user_name } = req.body;

  if (!feedback_form_type || !feedback_form_name || !user_created_by || !user_name) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const existing = await query(
      `SELECT id FROM feedback_form_question WHERE feedback_form_name = ? AND feedback_form_type = ?`,
      [feedback_form_name, feedback_form_type]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Feedback form not found.' });
    }

    const result = await query(
      `UPDATE feedback_form_question
       SET calDeleteStatus = 1, user_created_by = ?, user_name = ?, user_created_time = NOW()
       WHERE feedback_form_name = ? AND feedback_form_type = ?`,
      [user_created_by, user_name, feedback_form_name, feedback_form_type]
    );
    return res.status(200).json({ message: 'Feedback form successfully deleted.', affectedRows: result.affectedRows });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};


// ─── Assign Feedback Form to Trainee ───────────────────────────────────────
exports.AssigningFeedbackFormDetailsToTrainee = async (req, res) => {
  const { planing_id, session_no, feedback_form_Assign, feedback_form_Assign_final_submit_date, feedback_form_name, questions } = req.body;

  if (!planing_id || !session_no || !feedback_form_name || !questions || !feedback_form_Assign_final_submit_date) {
    return res.status(400).json({ error: 'Missing required fields: planing_id, session_no, feedback_form_name, feedback_form_Assign_final_submit_date and questions are mandatory.' });
  }

  let questionsJson;
  try {
    questionsJson = JSON.stringify(questions);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid questions format. Must be a valid JSON object.' });
  }

  try {
    const existing = await query(
      `SELECT id FROM planing_session_trainee_data WHERE planing_id = ? AND session_no = ? AND calDeleteStatus = 0`,
      [planing_id, session_no]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'No trainee records found for the given planing_id and session_no.' });
    }

    const result = await query(
      `UPDATE planing_session_trainee_data
      SET feedback_form_Assign_by = ?, feedback_form_Assign_final_submit_date = ?,
          feedback_form_name = ?, feedback_form_question = ?, date_created = NOW()
      WHERE planing_id = ? AND session_no = ? AND attendance_status = 1`,
      [feedback_form_Assign, feedback_form_Assign_final_submit_date, feedback_form_name, questionsJson, planing_id, session_no]
    );
    return res.status(200).json({ message: 'Feedback form details successfully updated.', affectedRows: result.affectedRows });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};


// ─── Submit Feedback Form for Particular Trainee ───────────────────────────
exports.SubmitFeedbackFormDetailsToParticularTrainee = async (req, res) => {
  const { planing_id, session_no, trainee_id } = req.body;

  if (!planing_id || !session_no || !trainee_id) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const results = await query(
      `SELECT feedback_form_question, feedback_form_answer, 
              feedback_form_comments_or_suggestions, feedback_form_submition_date
       FROM planing_session_trainee_data
       WHERE calDeleteStatus = 0 
         AND planing_id = ? 
         AND session_no = ? 
         AND trainee_id = ?
         AND feedback_form_answer IS NOT NULL`,  // ✅ only submitted records
      [planing_id, session_no, trainee_id]
    );
    return res.status(200).json({ topics: results });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};


// ─── Get Feedback Form for Particular Trainee ──────────────────────────────
exports.GetFeedbackFormDetailsToParticularTrainee = async (req, res) => {
  const { planing_id, session_no, trainee_id } = req.body;

  if (!planing_id || !session_no || !trainee_id) {
    return res.status(400).json({ error: 'Missing required fields: planing_id, session_no and trainee_id are mandatory.' });
  }

  try {
    const results = await query(
      `SELECT feedback_form_question, feedback_form_answer, feedback_form_comments_or_suggestions, feedback_form_submition_date
       FROM planing_session_trainee_data
       WHERE calDeleteStatus = 0 AND planing_id = ? AND session_no = ? AND trainee_id = ?`,
      [planing_id, session_no, trainee_id]
    );
    return res.status(200).json({ topics: results });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};


// ─── Get Feedback Form Count ───────────────────────────────────────────────
exports.GetAllFeedbackFormDetailsCountToTrainee = async (req, res) => {
  const { planing_id, session_no, CountInfo } = req.body;

  if (!CountInfo || !planing_id || !session_no) {
    return res.status(400).json({ error: 'Missing required field: CountInfo is mandatory.' });
  }

  const validColumns = ['feedback_form_question', 'feedback_form_answer'];
  if (!validColumns.includes(CountInfo)) {
    return res.status(400).json({ error: 'Invalid CountInfo value. Must be a valid column name.' });
  }

  try {
    const results = await query(
      `SELECT COUNT(*) AS count FROM planing_session_trainee_data
       WHERE calDeleteStatus = 0 AND ${CountInfo} IS NOT NULL AND planing_id = ? AND session_no = ?`,
      [planing_id, session_no]
    );
    return res.status(200).json({ count: results[0].count });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};


// ─── Get Full Feedback Form List ───────────────────────────────────────────
exports.GetAllFeedbackFormDetailsToTraineeList = async (req, res) => {
  const { planing_id, session_no } = req.body;

  if (!planing_id || !session_no) {
    return res.status(400).json({ error: 'Missing required field: planing_id and session_no are mandatory.' });
  }

  try {
    const results = await query(
      `SELECT planing_id, session_no, trainee_id, trainee_name, feedback_form_name,
              feedback_form_question, feedback_form_answer, feedback_form_comments_or_suggestions,
              feedback_form_submition_date
       FROM planing_session_trainee_data
       WHERE calDeleteStatus = 0 AND planing_id = ? AND session_no = ? AND attendance_status = 1`,
      [planing_id, session_no]
    );
    return res.status(200).json({ data: results });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};


// ─── Trainee: Get Feedback Form ────────────────────────────────────────────
exports.TraineeGetFeedbackFormDetails = async (req, res) => {
  const { planing_id, session_no, trainee_id } = req.body;

  if (!planing_id || !session_no || !trainee_id) {
    return res.status(400).json({ error: 'Missing required fields: planing_id, session_no and trainee_id are mandatory.' });
  }

  try {
    const results = await query(
      `SELECT planing_id, session_no, feedback_form_question, feedback_form_answer, feedback_form_comments_or_suggestions
       FROM planing_session_trainee_data
       WHERE calDeleteStatus = 0 AND planing_id = ? AND session_no = ? AND trainee_id = ?`,
      [planing_id, session_no, trainee_id]
    );
    return res.status(200).json({ topics: results });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};


// ─── Trainee: Submit Feedback Answers ─────────────────────────────────────
exports.TraineeUpdateFeedbackFormDetails = async (req, res) => {
  const { planing_id, session_no, trainee_id, feedback_form_answer, feedback_form_comments_or_suggestions } = req.body;

  if (!planing_id || !session_no || !trainee_id || !feedback_form_answer) {
    return res.status(400).json({ error: 'Missing required fields: planing_id, session_no, trainee_id and feedback_form_answer are mandatory.' });
  }

  let feedbackAnswerJson;
  try {
    feedbackAnswerJson = JSON.stringify(feedback_form_answer);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid feedback_form_answer format. Must be a valid JSON object.' });
  }

  try {
    const existing = await query(
      `SELECT id FROM planing_session_trainee_data WHERE planing_id = ? AND session_no = ? AND trainee_id = ?`,
      [planing_id, session_no, trainee_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Record not found for the provided planing_id, session_no, and trainee_id.' });
    }

    const result = await query(
      `UPDATE planing_session_trainee_data
       SET feedback_form_answer = ?, feedback_form_comments_or_suggestions = ?, feedback_form_submition_date = NOW()
       WHERE planing_id = ? AND session_no = ? AND trainee_id = ?`,
      [feedbackAnswerJson, feedback_form_comments_or_suggestions, planing_id, session_no, trainee_id]
    );
    return res.status(200).json({ message: 'Feedback form details successfully updated.', affectedRows: result.affectedRows });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};


// ─── Submitted / Pending Feedback Count ───────────────────────────────────
// FIX: attendance_status = 1 on BOTH lists → prevents cross-session leakage
// FIX: counts derived from array.length → always in sync with actual list
exports.GetAllSubmitedOrPendingFeedbackFormDetailsCountToTrainee = async (req, res) => {
  const { planing_id, session_no } = req.body;

  if (!planing_id || !session_no) {
    return res.status(400).json({ error: 'Missing required field: planing_id or session_no is mandatory.' });
  }

  const baseWhere = `
    WHERE calDeleteStatus = 0
    AND planing_id = ?
    AND session_no = ?
    AND attendance_status = 1
  `;

  try {
    const [submittedTrainees, pendingTrainees] = await Promise.all([
      query(
        `SELECT trainee_id, trainee_name, trainee_mail
         FROM planing_session_trainee_data
         ${baseWhere} AND feedback_form_answer IS NOT NULL`,
        [planing_id, session_no]
      ),
      query(
        `SELECT trainee_id, trainee_name, trainee_mail
         FROM planing_session_trainee_data
         ${baseWhere} AND feedback_form_answer IS NULL`,
        [planing_id, session_no]
      ),
    ]);

    return res.status(200).json({
      SubmitCount:       submittedTrainees.length,
      SubmittedTrainees: submittedTrainees,
      PendingCount:      pendingTrainees.length,
      PendingTrainees:   pendingTrainees,
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// ─── Get Feedback Form Deadline for Session ────────────────────────────────
exports.GetFeedbackDeadlineForSession = async (req, res) => {
  const { planing_id, session_no } = req.body;

  if (!planing_id || !session_no) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const results = await query(
      `SELECT feedback_form_Assign_final_submit_date, feedback_form_name
       FROM planing_session_trainee_data
       WHERE calDeleteStatus = 0 
         AND planing_id = ? 
         AND session_no = ?
         AND feedback_form_Assign_final_submit_date IS NOT NULL
       LIMIT 1`,
      [planing_id, session_no]
    );

    if (results.length === 0) {
      return res.status(200).json({ deadline: null, feedback_form_name: null });
    }

    return res.status(200).json({
      deadline: results[0].feedback_form_Assign_final_submit_date,
      feedback_form_name: results[0].feedback_form_name,
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};
// ─── Trainee Feedback Status ───────────────────────────────────────────────
exports.GetTraineeFeedbackStatus = async (req, res) => {
  const { planing_id, session_no } = req.body;

  if (!planing_id || !session_no) {
    return res.status(400).json({ error: 'Missing required fields: planing_id and session_no are mandatory.' });
  }

  try {
    const results = await query(
      `SELECT
         planing_id, session_no, trainee_id, trainee_name,
         CASE
           WHEN feedback_form_answer IS NOT NULL THEN 'Submitted'
           ELSE 'Not Submitted'
         END AS feedback_submit_status
       FROM planing_session_trainee_data
       WHERE calDeleteStatus = 0 AND planing_id = ? AND session_no = ? AND attendance_status = 1`,
      [planing_id, session_no]
    );
    return res.status(200).json({ trainees: results });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};


// ─── Assign Feedback Form to Trainer ──────────────────────────────────────
exports.AssigningFeedbackFormDetailsToTrainer = async (req, res) => {
  const { planing_id, session_no, feedback_form_Assign, feedback_form_Assign_final_submit_date, feedback_form_name, questions } = req.body;

  if (!planing_id || !session_no || !feedback_form_name || !questions || !feedback_form_Assign_final_submit_date) {
    return res.status(400).json({ error: 'Missing required fields: planing_id, session_no, feedback_form_name, feedback_form_Assign_final_submit_date and questions are mandatory.' });
  }

  let questionsJson;
  try {
    questionsJson = JSON.stringify(questions);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid questions format. Must be a valid JSON object.' });
  }

  try {
    const existing = await query(
      `SELECT id FROM planing_sessions WHERE planing_id = ? AND session_no = ?`,
      [planing_id, session_no]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'No session found for the given planing_id and session_no.' });
    }

    const result = await query(
      `UPDATE planing_sessions
       SET feedback_form_Assign_by = ?, feedback_form_Assign_final_submit_date = ?,
           feedback_form_name = ?, feedback_form_question = ?, date_created = NOW()
       WHERE planing_id = ? AND session_no = ?`,
      [feedback_form_Assign, feedback_form_Assign_final_submit_date, feedback_form_name, questionsJson, planing_id, session_no]
    );
    return res.status(200).json({ message: 'Feedback form details successfully updated.', affectedRows: result.affectedRows });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};


// ─── Get All Feedback Form Details for Trainer ────────────────────────────
exports.GetAllFeedbackFormDetailsToTrainer = async (req, res) => {
  const { planing_id, session_no } = req.body;

  if (!planing_id || !session_no) {
    return res.status(400).json({ error: 'Missing required fields: planing_id and session_no are mandatory.' });
  }

  try {
    const results = await query(
      `SELECT planing_id, session_no, trainer_name, feedback_form_question, feedback_form_answer,
              feedback_form_comments_or_suggestions, feedback_form_submition_date
       FROM planing_sessions
       WHERE calDeleteStatus = 0 AND planing_id = ? AND session_no = ?`,
      [planing_id, session_no]
    );
    return res.status(200).json({ topics: results });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// ─── Close session directly after attendance (no feedback required) ─────────
exports.CloseSessionAfterAttendance = async (req, res) => {
  const { planing_id, session_no, emp_id, user_name, user_email } = req.body;

  if (!planing_id || !session_no || !emp_id) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    // 1. Check session exists and is in a closeable state
    const sessions = await query(
      `SELECT PSstatus FROM planing_sessions 
       WHERE planing_id = ? AND session_no = ? AND calDeleteStatus = 0`,
      [planing_id, session_no]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const { PSstatus } = sessions[0];
    const closeableStatuses = ['Attendance Added', 'Training Effectiveness'];
    
    if (!closeableStatuses.includes(PSstatus)) {
      return res.status(400).json({ 
        error: `Session cannot be closed from status: ${PSstatus}. Must be in Attendance Added or Training Effectiveness.` 
      });
    }

    // 2. Close the session
    await query(
      `UPDATE planing_sessions 
       SET PSstatus = 'Session Closed'
       WHERE planing_id = ? AND session_no = ?`,
      [planing_id, session_no]
    );

    // 3. Check if ALL sessions for this training are now closed/cancelled
    const allSessions = await query(
      `SELECT PSstatus FROM planing_sessions 
       WHERE planing_id = ? AND calDeleteStatus = 0`,
      [planing_id]
    );

    const allDone = allSessions.every(s =>
      ['Session Closed', 'Final Submitted', 'Cancelled'].includes(s.PSstatus)
    );

    if (allDone) {
      await query(
        `UPDATE planning_training_table
        SET Status = 'Final Submitted', 
            emp_id = ?, user_name = ?, user_email = ?
        WHERE id = ?`,
        [emp_id, user_name, user_email, planing_id]
      );
      return res.status(200).json({ 
        message: 'Session closed and training marked as Final Submitted.',
        trainingFinalized: true 
      });
    }

    return res.status(200).json({ 
      message: 'Session closed successfully.',
      trainingFinalized: false 
    });

  } catch (err) {
    console.error('Error closing session:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};