const { hrmdb ,leavemanagement} = require('../../../configuration/db');

// Wrap the hrmdb.query method in a promise wrapper
const queryPromise = (sql, params) => {
  return new Promise((resolve, reject) => {
    hrmdb.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.addQuestionPaper = async (req, res) => {
  try {
    console.log("Received Request Body:", req.body);
    const { PaperName, Questions, UserCreatedBy } = req.body;

    // Validate PaperName
    if (!PaperName || typeof PaperName !== "string") {
      return res.status(400).json({ error: "Invalid input. PaperName must be a string." });
    }

    // Validate Questions
    if (!Array.isArray(Questions)) {
      return res.status(400).json({ error: "Invalid input. Questions must be an array." });
    }

    // Check if PaperName already exists
    const existingPaper = await queryPromise('SELECT PaperID FROM q_questionpapers WHERE PaperName = ?', [PaperName]);
    if (existingPaper.length > 0) {
      return res.status(400).json({ error: "PaperName already exists", duplicatePaperName: PaperName });
    }

    // Validate each question in the Questions array
    for (let question of Questions) {
      const { QuestionText, QuestionType, Options, CorrectAnswer, IsMultipleChoice, AnswerText } = question;

      // Validate QuestionText and QuestionType
      if (!QuestionText || typeof QuestionText !== "string") {
        return res.status(400).json({ error: "Each question must have a valid QuestionText." });
      }
      if (!QuestionType || typeof QuestionType !== "string") {
        return res.status(400).json({ error: "Each question must have a valid QuestionType." });
      }

      // Handle True/False questions
      if (QuestionType === "True/False") {
        // Validate Options for True/False questions
        if (!Array.isArray(Options) || Options.length !== 2) {
          return res.status(400).json({ error: "True/False questions must have exactly two options: True and False." });
        }

        // Ensure the Options array contains "True" and "False"
        const validOptions = Options.every(opt => opt.OptionText === "True" || opt.OptionText === "False");
        if (!validOptions) {
          return res.status(400).json({ error: "True/False questions must have options: True and False." });
        }

        // Validate CorrectAnswer for True/False questions
        if (!Array.isArray(CorrectAnswer) || CorrectAnswer.length !== 1) {
          return res.status(400).json({ error: "True/False questions must have exactly one correct answer." });
        }

        // Ensure the CorrectAnswer is either "True" or "False"
        if (CorrectAnswer[0] !== "True" && CorrectAnswer[0] !== "False") {
          return res.status(400).json({ error: "CorrectAnswer for True/False questions must be either 'True' or 'False'." });
        }
      }
      // Handle MCQ (Multiple Choice Question) questions
      else if (QuestionType === "MCQ (Multiple Choice Question)") {
        if (!Array.isArray(Options) || Options.length === 0) {
          return res.status(400).json({ error: "MCQ questions must have a non-empty options array." });
        }
        if (!Array.isArray(CorrectAnswer) || CorrectAnswer.length === 0) {
          return res.status(400).json({ error: "MCQ questions must have a non-empty CorrectAnswer array." });
        }
      }
      // Handle Text (Short Answer or Long Answer) questions
      else if (QuestionType === "Text") {
        // Validate AnswerText for Text questions
        if (!AnswerText || typeof AnswerText !== "string") {
          return res.status(400).json({ error: "Text questions must have a valid AnswerText." });
        }
      }
      // Handle unknown question types
      else {
        return res.status(400).json({ error: `Unknown question type: ${QuestionType}` });
      }
    }

    // Start transaction
    await queryPromise('START TRANSACTION');

    // Insert Paper Name into q_questionpapers table
    const paperResult = await queryPromise(
      'INSERT INTO q_questionpapers (PaperName, UserCreatedBy, UserCreatedDateTime) VALUES (?, ?, NOW())',
      [PaperName, UserCreatedBy || "Unknown"]
    );
    const PaperID = paperResult.insertId;

    // Insert Questions into q_questionpaper_json table
    for (let question of Questions) {
      const { QuestionText, QuestionType, Options, CorrectAnswer, IsMultipleChoice, AnswerText } = question;

      // Prepare questionData object
      let questionData = {
        QuestionText,
        QuestionType,
      };

      // Handle True/False questions
      if (QuestionType === "True/False") {
        questionData.Options = Options;
        questionData.CorrectAnswer = CorrectAnswer;
        questionData.IsMultipleChoice = false; // True/False questions are always single-choice
      }
      // Handle MCQ (Multiple Choice Question) questions
      else if (QuestionType === "MCQ (Multiple Choice Question)") {
        questionData.Options = Options;
        questionData.CorrectAnswer = CorrectAnswer;
        questionData.IsMultipleChoice = !!IsMultipleChoice;
      }
      // Handle Text (Short Answer or Long Answer) questions
      else if (QuestionType === "Text") {
        questionData.AnswerText = AnswerText; // Use AnswerText for Text questions
      }

      // Insert the question into the database
      await queryPromise(
        'INSERT INTO q_questionpaper_json (PaperID, QuestionJSON) VALUES (?, ?)',
        [PaperID, JSON.stringify(questionData)]
      );
    }

    // Backup the new question paper
    await queryPromise(
      'INSERT INTO q_questionpapers_backup (PaperID, PaperName, UserCreatedBy, UserCreatedDateTime, BackupDateTime, QuestionsJSON) VALUES (?, ?, ?, NOW(), NOW(), ?)',
      [PaperID, PaperName, UserCreatedBy || "Unknown", JSON.stringify(Questions)]
    );

    // Commit transaction
    await queryPromise('COMMIT');

    return res.status(201).json({ message: "Question paper added successfully!", PaperID });
  } catch (error) {
    // Rollback transaction in case of error
    await queryPromise('ROLLBACK');
    return res.status(500).json({ error: "Failed to add question paper", details: error.message });
  }
};

exports.updateQuestionPaper = async (req, res) => {
  try {
    console.log("Received Request Body:", req.body);
    const { PaperID, PaperName, Questions, UserCreatedBy } = req.body;

    if (!PaperID || !PaperName || typeof PaperName !== "string") {
      return res.status(400).json({ error: "Invalid input. PaperID and PaperName are required." });
    }

    if (!Array.isArray(Questions)) {
      return res.status(400).json({ error: "Invalid input. Questions must be an array." });
    }

    // Check if PaperID exists
    const existingPaper = await queryPromise('SELECT * FROM q_questionpapers WHERE PaperID = ?', [PaperID]);
    if (!existingPaper.length) {
      return res.status(404).json({ error: "PaperID does not exist." });
    }

    // Check for duplicate PaperName
    const paperWithSameName = await queryPromise('SELECT PaperID FROM q_questionpapers WHERE PaperName = ?', [PaperName]);
    if (paperWithSameName.length && paperWithSameName[0].PaperID !== PaperID) {
      return res.status(400).json({ error: "PaperName already exists", duplicatePaperName: PaperName });
    }

    await queryPromise('START TRANSACTION');

    // Backup existing data including questions
    const oldQuestions = await queryPromise('SELECT QuestionJSON FROM q_questionpaper_json WHERE PaperID = ?', [PaperID]);
    const questionsBackup = oldQuestions.map(q => q.QuestionJSON);

    await queryPromise(
      'INSERT INTO q_questionpapers_backup (PaperID, PaperName, UserCreatedBy, UserCreatedDateTime, BackupDateTime, QuestionsJSON) VALUES (?, ?, ?, ?, NOW(), ?)',
      [
        existingPaper[0].PaperID,
        existingPaper[0].PaperName,
        existingPaper[0].UserCreatedBy || "Unknown",
        existingPaper[0].UserCreatedDateTime,
        JSON.stringify(questionsBackup)
      ]
    );

    // Update Paper Name in q_questionpapers table
    await queryPromise(
      'UPDATE q_questionpapers SET PaperName = ?, UserCreatedBy = ?, UserCreatedDateTime = NOW() WHERE PaperID = ?',
      [PaperName, UserCreatedBy || "Unknown", PaperID]
    );

    // Delete old questions
    await queryPromise('DELETE FROM q_questionpaper_json WHERE PaperID = ?', [PaperID]);

    // Insert updated Questions into q_questionpaper_json table
    for (let question of Questions) {
      await queryPromise(
        'INSERT INTO q_questionpaper_json (PaperID, QuestionJSON) VALUES (?, ?)',
        [PaperID, JSON.stringify(question)]
      );
    }

    await queryPromise('COMMIT');

    return res.status(200).json({ message: "Question paper updated successfully!", PaperID });
  } catch (error) {
    await queryPromise('ROLLBACK');
    return res.status(500).json({ error: "Failed to update question paper", details: error.message });
  }
};

// Delete a question paper

exports.deleteQuestionPaper = async (req, res) => {
  try {
    console.log("Received Request Body:", req.body);
    const { PaperID, UserCreatedBy } = req.body;

    if (!PaperID) {
      return res.status(400).json({ error: "Invalid input. PaperID is required." });
    }

    if (!UserCreatedBy) {
      return res.status(400).json({ error: "Invalid input. UserCreatedBy is required." });
    }

    // Check if PaperID exists
    const existingPaper = await queryPromise('SELECT * FROM q_questionpapers WHERE PaperID = ?', [PaperID]);
    if (!existingPaper.length) {
      return res.status(404).json({ error: "PaperID does not exist." });
    }

    await queryPromise('START TRANSACTION');

    // Get existing questions
    const oldQuestions = await queryPromise('SELECT QuestionJSON FROM q_questionpaper_json WHERE PaperID = ?', [PaperID]);
    const questionsBackup = oldQuestions.map(q => q.QuestionJSON);

    // Backup the question paper before deleting
    await queryPromise(
      'INSERT INTO q_questionpapers_backup (PaperID, PaperName, UserCreatedBy, UserCreatedDateTime, BackupDateTime, QuestionsJSON) VALUES (?, ?, ?, ?, NOW(), ?)',
      [
        existingPaper[0].PaperID,
        existingPaper[0].PaperName,
        UserCreatedBy, // Store who is deleting the paper
        existingPaper[0].UserCreatedDateTime,
        JSON.stringify(questionsBackup)
      ]
    );

    // Delete all related data before deleting the question paper
    await queryPromise('DELETE FROM q_questionpaper_json WHERE PaperID = ?', [PaperID]);
    await queryPromise('DELETE FROM q_questionpapers WHERE PaperID = ?', [PaperID]);

    await queryPromise('COMMIT');

    return res.status(200).json({ message: "Question paper deleted successfully!", PaperID });
  } catch (error) {
    await queryPromise('ROLLBACK');
    return res.status(500).json({ error: "Failed to delete question paper", details: error.message });
  }
};

// Get all question papers with questions

exports.getQuestionPaperslist = async (req, res) => {
  try {
    // Get all question papers
    const papers = await queryPromise(`
      SELECT qp.PaperID, qp.PaperName, u.full_name, qp.UserCreatedDateTime 
      FROM hrmdb.q_questionpapers qp 
      JOIN leavemanagement.user u ON u.emp_id = qp.UserCreatedBy;
    `);

    if (papers.length === 0) {
      return res.status(404).json({ message: "No question papers found." });
    }

    // Get all questions for the retrieved papers
    const paperIds = papers.map(paper => paper.PaperID);
    const placeholders = paperIds.map(() => '?').join(',');
    const questions = await queryPromise(
      `SELECT * FROM q_questionpaper_json WHERE PaperID IN (${placeholders})`,
      paperIds
    );

    // Group questions under their respective PaperName
    const paperMap = {}; // Initialize paperMap
    papers.forEach(paper => {
      paperMap[paper.PaperID] = {
        PaperID: paper.PaperID,
        PaperName: paper.PaperName,
        UserCreatedBy: paper.full_name, // Correctly mapped
        UserCreatedDateTime: paper.UserCreatedDateTime,
        Questions: [] // Initialize empty Questions array
      };
    });

    // Map questions to their respective papers
    questions.forEach(q => {
      if (paperMap[q.PaperID]) {
        paperMap[q.PaperID].Questions.push(JSON.parse(q.QuestionJSON));
      }
    });

    // Convert object to array
    const result = Object.values(paperMap);

    return res.status(200).json({ questionPapers: result });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch question papers", details: error.message });
  }
};

// Assigning Quiz Form Details to Trainee
exports.AssigningQuizFormDetailsToTrainee = (req, res) => {
  const {
      planing_id,
      session_no,
      quiz_form_Assign_by,
      quiz_form_Assign_final_submit_date,
      quiz_form_name,
      quiz_form_question
  } = req.body;

  // Validate required fields
  if (!planing_id || !session_no || !quiz_form_name || !quiz_form_question || !quiz_form_Assign_final_submit_date) {
      return res.status(400).json({ error: "Missing required fields: planing_id, session_no, quiz_form_name, quiz_form_Assign_final_submit_date, and quiz_form_question are mandatory." });
  }

  // Define the table name
  const tableName = "planing_session_trainee_data";

  // Convert quiz_form_question object into a JSON string
  let quizQuestionsJson;
  try {
      quizQuestionsJson = JSON.stringify(quiz_form_question);
  } catch (err) {
      console.error("Error converting quiz_form_question to JSON:", err);
      return res.status(400).json({ error: "Invalid quiz_form_question format. Must be a valid JSON object." });
  }

  // Query to check if the record for the given planing_id and session_no exists
  const checkRecordQuery = `
      SELECT id FROM ${tableName} 
      WHERE planing_id = ? AND session_no = ?
  `;

  hrmdb.query(checkRecordQuery, [planing_id, session_no], (err, results) => {
      if (err) {
          console.error("Error checking record existence:", err);
          return res.status(500).json({ error: "Failed to check record existence.", details: err });
      }

      if (results.length > 0) {
          // Record exists, update it
          const updateQuery = `
              UPDATE ${tableName}
              SET
                  quiz_form_Assign_by = ?,
                  quiz_form_Assign_final_submit_date = ?,
                  quiz_form_name = ?,
                  quiz_form_question = ?,
                  date_created = NOW()
              WHERE planing_id = ? AND session_no = ?
          `;

          const updateValues = [
              quiz_form_Assign_by,
              quiz_form_Assign_final_submit_date,
              quiz_form_name,
              quizQuestionsJson,
              planing_id,
              session_no
          ];

          hrmdb.query(updateQuery, updateValues, (updateErr, updateResult) => {
              if (updateErr) {
                  console.error("Error updating quiz form details:", updateErr);
                  return res.status(500).json({ error: "Failed to update quiz form details.", details: updateErr });
              }

              return res.status(200).json({
                  message: "Quiz form details successfully updated.",
                  affectedRows: updateResult.affectedRows
              });
          });
      } else {
          // Record does not exist
          return res.status(404).json({
              error: "Record not found for the provided planing_id and session_no."
          });
      }
  });
};


// Get All Quiz Form Details for Trainee
exports.GetAllQuizFormDetailsToTrainee = (req, res) => {
  const {
      planing_id,
      session_no
  } = req.body;

  // Validate required fields
  if (!planing_id || !session_no) {
      return res.status(400).json({ error: "Missing required fields: planing_id and session_no are mandatory." });
  }

  const getAllQuery = `
      SELECT planing_id, session_no, quiz_form_question, quiz_form_answer, quiz_form_submition_date 
      FROM planing_session_trainee_data 
      WHERE calDeleteStatus = 0 AND planing_id = ? AND session_no = ?
  `;

  hrmdb.query(getAllQuery, [planing_id, session_no], (err, results) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error', details: err });
      }
      return res.status(200).json({ topics: results });
  });
};



// Trainee Update Quiz Form Details
exports.TraineeUpdateQuizFormDetails = (req, res) => {
  const {
      planing_id,
      session_no,
      trainee_id,
      quiz_form_answer,
      quiz_form_submition_date
  } = req.body;

  // Validate required fields
  if (!planing_id || !session_no || !trainee_id || !quiz_form_answer) {
      return res.status(400).json({ error: "Missing required fields: planing_id, session_no, trainee_id, and quiz_form_answer are mandatory." });
  }

  // Define the table name
  const tableName = "planing_session_trainee_data";

  // Convert quiz_form_answer object into a JSON string
  let quizAnswerJson;
  try {
      quizAnswerJson = JSON.stringify(quiz_form_answer);
  } catch (err) {
      console.error("Error converting quiz_form_answer to JSON:", err);
      return res.status(400).json({ error: "Invalid quiz_form_answer format. Must be a valid JSON object." });
  }

  // Query to check if the record for the given planing_id, session_no, and trainee_id exists
  const checkRecordQuery = `
      SELECT id FROM ${tableName} 
      WHERE planing_id = ? AND session_no = ? AND trainee_id = ?
  `;

  hrmdb.query(checkRecordQuery, [planing_id, session_no, trainee_id], (err, results) => {
      if (err) {
          console.error("Error checking record existence:", err);
          return res.status(500).json({ error: "Failed to check record existence.", details: err });
      }

      if (results.length > 0) {
          // Record exists, update it
          const updateQuery = `
              UPDATE ${tableName}
              SET
                  quiz_form_answer = ?,
                  quiz_form_submition_date = ?
              WHERE planing_id = ? AND session_no = ? AND trainee_id = ?
          `;

          const updateValues = [
              quizAnswerJson,
              quiz_form_submition_date || new Date(), // Use current date if not provided
              planing_id,
              session_no,
              trainee_id
          ];

          hrmdb.query(updateQuery, updateValues, (updateErr, updateResult) => {
              if (updateErr) {
                  console.error("Error updating quiz form details:", updateErr);
                  return res.status(500).json({ error: "Failed to update quiz form details.", details: updateErr });
              }

              return res.status(200).json({
                  message: "Quiz form details successfully updated.",
                  affectedRows: updateResult.affectedRows
              });
          });
      } else {
          // Record does not exist
          return res.status(404).json({
              error: "Record not found for the provided planing_id, session_no, and trainee_id."
          });
      }
  });
};


// Validate Quiz Form
exports.ValidateQuizForm = (req, res) => {
  const {
      planing_id,
      session_no,
      trainee_id,
      quiz_form_validation_by,
      quiz_form_validation_result
  } = req.body;

  // Validate required fields
  if (!planing_id || !session_no || !trainee_id || !quiz_form_validation_by || !quiz_form_validation_result) {
      return res.status(400).json({ error: "Missing required fields: planing_id, session_no, trainee_id, quiz_form_validation_by, and quiz_form_validation_result are mandatory." });
  }

  // Define the table name
  const tableName = "planing_session_trainee_data";

  // Convert quiz_form_validation_result object into a JSON string
  let validationResultJson;
  try {
      validationResultJson = JSON.stringify(quiz_form_validation_result);
  } catch (err) {
      console.error("Error converting quiz_form_validation_result to JSON:", err);
      return res.status(400).json({ error: "Invalid quiz_form_validation_result format. Must be a valid JSON object." });
  }

  // Query to check if the record for the given planing_id, session_no, and trainee_id exists
  const checkRecordQuery = `
      SELECT id FROM ${tableName} 
      WHERE planing_id = ? AND session_no = ? AND trainee_id = ?
  `;

  hrmdb.query(checkRecordQuery, [planing_id, session_no, trainee_id], (err, results) => {
      if (err) {
          console.error("Error checking record existence:", err);
          return res.status(500).json({ error: "Failed to check record existence.", details: err });
      }

      if (results.length > 0) {
          // Record exists, update it
          const updateQuery = `
              UPDATE ${tableName}
              SET
                  quiz_form_validation_by = ?,
                  quiz_form_validation_result = ?,
                  quiz_form_validation_date = NOW()
              WHERE planing_id = ? AND session_no = ? AND trainee_id = ?
          `;

          const updateValues = [
              quiz_form_validation_by,
              validationResultJson,
              planing_id,
              session_no,
              trainee_id
          ];

          hrmdb.query(updateQuery, updateValues, (updateErr, updateResult) => {
              if (updateErr) {
                  console.error("Error validating quiz form:", updateErr);
                  return res.status(500).json({ error: "Failed to validate quiz form.", details: updateErr });
              }

              return res.status(200).json({
                  message: "Quiz form successfully validated.",
                  affectedRows: updateResult.affectedRows
              });
          });
      } else {
          // Record does not exist
          return res.status(404).json({
              error: "Record not found for the provided planing_id, session_no, and trainee_id."
          });
      }
  });
};



  
  
