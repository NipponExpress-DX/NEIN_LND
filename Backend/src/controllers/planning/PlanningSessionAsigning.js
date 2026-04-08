const { hrmdb, leavemanagement } = require('../../../configuration/db');
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // temp location for uploaded files

const mime = require('mime-types'); // optional for getting MIME type







exports.servePreviewFile = async (req, res) => {
  const { token } = req.params;
  await handleFileRequest(token, res, 'inline');
};

exports.serveDownloadFile = async (req, res) => {
  const { token } = req.params;
  await handleFileRequest(token, res, 'attachment');
};







exports.addPSAssigingDetails = (req, res) => {
    const {
        planing_id,
        session_no,
        branch,
        department,
        coordinator_type,
        coordinator_emp_id,
        coordinator_name,
        trainee_id_name_and_mail
    } = req.body;

    if (!planing_id || !session_no || !branch || !department || !coordinator_emp_id || !coordinator_type|| !coordinator_name || !trainee_id_name_and_mail) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    const branchArray = branch.split(',');
    const departmentArray = department.split(',');

    const traineeData = Object.entries(trainee_id_name_and_mail).map(([trainee_id, details]) => ({
        trainee_id,
        trainee_name: details[0],
        trainee_mail: details[1],
        trainee_branch: details[2],
        trainee_department: details[3]
    }));

    const traineeIds = traineeData.map(trainee => trainee.trainee_id);

    const checkExistingQuery = `
        SELECT id, trainee_id, calDeleteStatus 
        FROM planing_session_trainee_data
        WHERE planing_id = ? AND session_no = ?`;

    hrmdb.query(checkExistingQuery, [planing_id, session_no], (checkErr, checkResult) => {
        if (checkErr) {
            console.error("Error checking existing trainees:", checkErr);
            return res.status(500).json({ error: "Error checking existing trainees", details: checkErr });
        }

        const existingTrainees = checkResult;
        const traineesToUpdate = existingTrainees.filter(trainee => traineeIds.includes(trainee.trainee_id));
        const traineesToDelete = existingTrainees.filter(trainee => !traineeIds.includes(trainee.trainee_id));

        if (traineesToUpdate.length > 0) {
            const traineeIdsToUpdate = traineesToUpdate.map(trainee => trainee.trainee_id);
            const updateDeleteStatusQuery = `
                UPDATE planing_session_trainee_data
                SET calDeleteStatus = 0
                WHERE planing_id = ? AND session_no = ? AND trainee_id IN (?)`;
            hrmdb.query(updateDeleteStatusQuery, [planing_id, session_no, traineeIdsToUpdate], (updateErr) => {
                if (updateErr) {
                    console.error("Error updating calDeleteStatus for existing trainees:", updateErr);
                    return res.status(500).json({ error: "Error updating calDeleteStatus for existing trainees", details: updateErr });
                }
            });
        }

        // if (traineesToDelete.length > 0) {
        //     const traineeIdsToDelete = traineesToDelete.map(trainee => trainee.trainee_id);
        //     const updateDeleteStatusQuery = `
        //         UPDATE planing_session_trainee_data
        //         SET calDeleteStatus = 1
        //         WHERE planing_id = ? AND session_no = ? AND trainee_id IN (?)`;
        //     hrmdb.query(updateDeleteStatusQuery, [planing_id, session_no, traineeIdsToDelete], (updateErr) => {
        //         if (updateErr) {
        //             console.error("Error updating calDeleteStatus for deleted trainees:", updateErr);
        //             return res.status(500).json({ error: "Error updating calDeleteStatus for deleted trainees", details: updateErr });
        //         }
        //     });
        // }

        const newTraineeData = traineeData.filter(trainee => !existingTrainees.some(row => row.trainee_id == trainee.trainee_id));

        if (newTraineeData.length > 0) {
            const insertCoordinatorQuery = `
                INSERT INTO planing_session_trainee_data (
                    calDeleteStatus, planing_id, session_no, branch, department, coordinator_type, coordinator_emp_id, coordinator_name, trainee_id, trainee_name, trainee_mail, trainee_branch, trainee_department, date_created
                ) VALUES ?
            `;
            const insertValues = newTraineeData.map(trainee => [
                0,
                planing_id,
                session_no,
                branch,
                department,
                coordinator_type,
                coordinator_emp_id,
                coordinator_name,
                trainee.trainee_id,
                trainee.trainee_name,
                trainee.trainee_mail,
                trainee.trainee_branch,
                trainee.trainee_department,
                new Date()
            ]);

            hrmdb.query(insertCoordinatorQuery, [insertValues], (insertErr, insertResult) => {
                if (insertErr) {
                    console.error("Failed to insert new trainee data:", insertErr);
                    return res.status(500).json({ error: "Failed to insert new trainee data", details: insertErr });
                }

                return res.status(200).json({
                    message: "Trainees successfully inserted and updated.",
                    insertedCount: insertResult.affectedRows
                });
            });
        } else {
            return res.status(200).json({
                message: "No new trainees to insert, but existing trainees' status updated."
            });
        }
    });
};




exports.deletePSAssigingDetails = (req, res) => {
    const {
        planing_id,
        session_no,
        trainee_id,
    } = req.body;

    // Validate required fields
    if (!planing_id || !session_no || !trainee_id) {
        return res.status(400).json({ error: "Missing required fields: planing_id, session_no, and trainee_id are required." });
    }

    // Query to check if the trainee exists in the database
    const checkExistingQuery = `
        SELECT id, trainee_id, calDeleteStatus 
        FROM planing_session_trainee_data
        WHERE planing_id = ? AND session_no = ? AND trainee_id = ?`;

    hrmdb.query(checkExistingQuery, [planing_id, session_no, trainee_id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error("Error checking existing trainee:", checkErr);
            return res.status(500).json({ error: "Error checking existing trainee", details: checkErr });
        }

        // If no matching trainee is found
        if (checkResult.length === 0) {
            return res.status(404).json({ error: "No matching trainee found for the given planing_id, session_no, and trainee_id." });
        }

        // Update the calDeleteStatus for the trainee
        const updateDeleteStatusQuery = `
            UPDATE planing_session_trainee_data
            SET calDeleteStatus = 1
            WHERE planing_id = ? AND session_no = ? AND trainee_id = ?`;

        hrmdb.query(updateDeleteStatusQuery, [planing_id, session_no, trainee_id], (updateErr, updateResult) => {
            if (updateErr) {
                console.error("Error updating calDeleteStatus for the trainee:", updateErr);
                return res.status(500).json({ error: "Error updating calDeleteStatus for the trainee", details: updateErr });
            }

            // Check if the update was successful
            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ error: "No rows were updated. Trainee may not exist." });
            }

            // Success response
            return res.status(200).json({ message: "Trainee calDeleteStatus updated successfully." });
        });
    });
};



//All Planning Session Asigning getting details
exports.getAllPSAssigingDetails = (req, res) => {
    const { planing_id,session_no} = req.body;
    
    // Validate the userid from the request body
    if (!planing_id || !session_no ) {
        return res.status(400).json({ error: 'Missing planing_id or session_no in request body' });
    }

    // Securely construct the SQL query with placeholders
    const getAllQuery = `SELECT session_no,coordinator_type,coordinator_name,trainee_id,trainee_name,trainee_branch,trainee_department,trainee_mail FROM planing_session_trainee_data WHERE calDeleteStatus = 0 and planing_id=?  and session_no = ? `;

    // Execute the query with parameterized values
    hrmdb.query(getAllQuery, [planing_id,session_no], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ records: results });
    });
};


//All Planning Session branch dept Asigning getting details
exports.getAllPSBDAssigingDetails = (req, res) => {
    const { planing_id,session_no,branch,department} = req.body;
    
    // Validate the userid from the request body
    if (!planing_id) {
        return res.status(400).json({ error: 'Missing planing_id in request body' });
    }

    // Securely construct the SQL query with placeholders
    const getAllQuery = `SELECT trainee_id,trainee_mail FROM planing_session_trainee_data WHERE calDeleteStatus = 0 and planing_id=? and session_no=? and branch=? and department=?`;

    // Execute the query with parameterized values
    hrmdb.query(getAllQuery, [planing_id,session_no,branch,department], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ records: results });
    });
};


//All Planning Session Asigning getting details
exports.getAllPSBDAssigingCompleteDetails = (req, res) => {
    const { planing_id} = req.body;
    
    // Validate the userid from the request body
    if (!planing_id) {
        return res.status(400).json({ error: 'Missing planing_id in request body' });
    }

    // Securely construct the SQL query with placeholders
    const getAllQuery = `SELECT coordinator_name,trainee_id,trainee_name,trainee_mail FROM planing_session_trainee_data WHERE calDeleteStatus = 0 and planing_id=?  `;

    // Execute the query with parameterized values
    hrmdb.query(getAllQuery, [planing_id,session_no], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json({ records: results });
    });
};
exports.FeedbackForm = (req, res) => {
    const { planing_id, session_no } = req.body;
   console.log("testing " ,req.body);

    
    if (!planing_id) {
        return res.status(400).send('<h1>Missing required parameter: planing_id</h1>');
    }

    // Fetch training details based on planing_id
    const trainingDetailsQuery = `
        SELECT trainer_name, session_date
        FROM planing_sessions
        WHERE planing_id = ? and session_no = ? `;

    hrmdb.query(trainingDetailsQuery, [planing_id,session_no], (err, rows) => {
        if (err) {
            console.error('Error fetching training details:', err);
            return res.status(500).send('<h1>Failed to load feedback form. Please try again later.</h1>');
        }

        if (!rows[0]) {
            return res.status(404).send('<h1>Training details not found for the given planing_id.</h1>');
        }

        const { trainer_name, session_date: training_date } = rows[0];

        // Example feedback questions (this can be fetched from a database or configuration)
        const feedbackQuestions = [
            { id: 1, question: 'How would you rate the overall quality of the training?' },
            { id: 2, question: 'How effective was the trainer?' },
            { id: 3, question: 'How useful were the training materials?' }
        ];

        // Render feedback form dynamically
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Training Feedback Form</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #333; }
                    label { font-weight: bold; margin-top: 10px; display: block; }
                    input, select, textarea { margin-bottom: 10px; width: 100%; padding: 10px; }
                    .btn-submit { background-color: #4CAF50; color: white; padding: 10px 20px; border: none; cursor: pointer; }
                    .btn-submit:hover { background-color: #45a049; }
                </style>
            </head>
            <body>
                <h1>Training Feedback Form</h1>
                <h2> - ${training_date}</h2>
                <p>Hi, Rajesh. When you submit this form, the owner will see your name and email address.</p>

                <form action="/submit-feedback" method="POST">
                    <input type="hidden" name="planing_id" value="${planing_id}" />
                    <input type="hidden" name="session_no" value="2" /> <!-- You can fetch session_no dynamically if needed -->

                    <label for="participant_name">Name of Employee (Participant):</label>
                    <input type="text" name="participant_name" id="participant_name" required />

                    <label for="training_date">Date of Training:</label>
                    <input type="text" name="training_date" id="training_date" value="${training_date}" readonly />

                    <label for="trainer_name">Trainer Name:</label>
                    <input type="text" name="trainer_name" id="trainer_name" value="${trainer_name}" readonly />

                    ${feedbackQuestions.map(q => `
                        <label for="question_${q.id}">${q.question}</label>
                        <select name="feedback_form_answer[${q.id}]" id="question_${q.id}">
                            <option>Excellent</option>
                            <option>Good</option>
                            <option>Average</option>
                            <option>Fair</option>
                            <option>Poor</option>
                        </select>
                    `).join('')}

                    <button type="submit" class="btn-submit">Submit</button>
                </form>
            </body>
            </html>
        `);
    });


};






// storing file  session basis 

// exports.StorePlanningFiles = async (req, res) => {
//   try {
//     if (!req.body.requestData) {
//       return res.status(400).json({ error: "Missing requestData" });
//     }

//     const parsedData = JSON.parse(req.body.requestData);
//     const { planing_id, session_no } = parsedData;

//     if (!planing_id || !session_no) {
//       return res.status(400).json({ error: "Planning ID and Session No are required" });
//     }

//     const baseFolder = "E:/neinSoft/files/Nippon-LND/Planning";
//     const targetFolder = path.join(baseFolder, String(planing_id), String(session_no));

//     if (!fs.existsSync(targetFolder)) {
//       fs.mkdirSync(targetFolder, { recursive: true });
//     }

//     const uploadedFilePaths = [];

//     if (req.files && req.files.length > 0) {
//       req.files.forEach((file) => {
//         const newPath = path.join(targetFolder, file.originalname);

//         // Copy file from temp upload location to target folder (works across drives)
//         fs.copyFileSync(file.path, newPath);

//         // Remove the original uploaded temp file
//         fs.unlinkSync(file.path);

//         uploadedFilePaths.push(newPath);
//       });
//     } else {
//       return res.status(400).json({ error: "No files uploaded." });
//     }

//     const filePathsJson = JSON.stringify(uploadedFilePaths);
//     const createdDate = new Date().toISOString().split("T")[0];

//     const updateQuery = `
//       UPDATE planing_sessions
//       SET file_paths = ?, files_created_date = ?
//       WHERE planing_id = ? AND session_no = ?
//     `;

//     const values = [filePathsJson, createdDate, planing_id, session_no];

//     hrmdb.query(updateQuery, values, (err, result) => {
//       if (err) {
//         console.error("Database update error:", err);
//         return res.status(500).json({ error: "Database error", details: err });
//       }

//       if (result.affectedRows === 0) {
//         return res.status(404).json({ error: "No matching record found to update." });
//       }

//       return res.status(200).json({ message: "Files uploaded successfully." });
//     });
//   } catch (error) {
//     console.error("❌ Error processing request:", error);
//     return res.status(500).json({ error: "Internal server error", details: error });
//   }
// };

exports.StorePlanningFiles = async (req, res) => {
  try {
    if (!req.body.requestData) {
      return res.status(400).json({ error: "Missing requestData" });
    }

    const parsedData = JSON.parse(req.body.requestData);
    const { planing_id, session_no } = parsedData;

    if (!planing_id || !session_no) {
      return res.status(400).json({ error: "Planning ID and Session No are required" });
    }

    const baseFolder = "E:/neinSoft/files/Nippon-LND/Planning";
    const targetFolder = path.join(baseFolder, String(planing_id), String(session_no));

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const uploadedFilePaths = [];

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        const newPath = path.join(targetFolder, file.originalname);

        // Copy file from temp upload location to target folder (works across drives)
        fs.copyFileSync(file.path, newPath);

        // Remove the original uploaded temp file
        fs.unlinkSync(file.path);

        uploadedFilePaths.push(newPath);
      });
    } else {
      return res.status(400).json({ error: "No files uploaded." });
    }

    const filePathsJson = JSON.stringify(uploadedFilePaths);
    const createdDate = new Date().toISOString().split("T")[0];

    const updateQuery = `
      UPDATE planing_sessions
      SET file_paths = ?, files_created_date = ?
      WHERE planing_id = ? AND session_no = ?
    `;

    const values = [filePathsJson, createdDate, planing_id, session_no];

    hrmdb.query(updateQuery, values, (err, result) => {
      if (err) {
        console.error("Database update error:", err);
        return res.status(500).json({ error: "Database error", details: err });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "No matching record found to update." });
      }

      return res.status(200).json({ message: "Files uploaded successfully." });
    });
  } catch (error) {
    console.error("❌ Error processing request:", error);
    return res.status(500).json({ error: "Internal server error", details: error });
  }
};






exports.getAllPlanningFiles = async (req, res) => {
  const { planing_id, session_no } = req.body;

  if (!planing_id || !session_no) {
    return res.status(400).json({ 
      error: 'Missing required fields: planing_id or session_no',
    });
  }

  try {
    const selectQuery = `
      SELECT file_paths, files_created_date
      FROM planing_sessions
      WHERE planing_id = ? AND session_no = ?
    `;

    const [results] = await hrmdb.promise().query(selectQuery, [planing_id, session_no]);

    if (!results.length) {
      return res.status(404).json({ 
        message: 'No records found',
      });
    }

    const baseFolder = "E:/neinSoft/files/Nippon-LND/Planning";
    const filePathsRaw = results[0].file_paths || '[]';
    const parsedFiles = JSON.parse(filePathsRaw) || [];

    const files = await Promise.all(
      parsedFiles.map(async (item) => {
        try {
          const fullPath = String(item).replace(/\\/g, '/');
          const relativePath = path.relative(baseFolder.replace(/\\/g, '/'), fullPath);

          if (!fs.existsSync(fullPath)) return null;

          const stats = fs.statSync(fullPath);
          const mimetype = mime.lookup(fullPath) || 'application/octet-stream';
          const filename = path.basename(fullPath);

          return {
            name: filename,
            path: relativePath,
            size: stats.size,
            mimetype,
            previewUrl: `/static/Nippon-LND/Planning/${planing_id}/${session_no}/${filename}`,
            downloadUrl: `/api/planning/files/download/${planing_id}/${session_no}/${filename}`,
            isImage: mimetype.startsWith('image/'),
            lastModified: stats.mtime
          };
        } catch (e) {
          console.error('Error processing file:', e);
          return null;
        }
      })
    );

    res.status(200).json({
      success: true,
      files: files.filter(Boolean),
      created_date: results[0].files_created_date,
    });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      details: err.message,
    });
  }
};


exports.downloadPlanningFile = (req, res) => {
  const { planing_id, session_no, filename } = req.params;

  if (!planing_id || !session_no || !filename) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const baseFolder = "E:/neinSoft/files/Nippon-LND/Planning";
  const filePath = path.join(baseFolder, String(planing_id), String(session_no), filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error("Download error:", err);
      res.status(500).json({ error: "Failed to download file" });
    }
  });
};


exports.viewPlanningFile = (req, res) => {
  const { planing_id, session_no, filename } = req.params;
  

  if (!planing_id || !session_no || !filename ) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  

  const baseFolder = "E:/neinSoft/files/Nippon-LND/Planning";
  const filePath = path.join(baseFolder, String(planing_id), String(session_no), filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const mimetype = mime.lookup(filePath) || 'application/octet-stream';

  const blockedTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.ms-excel'
  ];

  if (blockedTypes.includes(mimetype)) {
    return res.status(403).json({ error: "This file type is not viewable in browser" });
  }

  res.setHeader("Content-Type", mimetype);
  res.setHeader("Content-Disposition", "inline");
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
};




// exports.viewPlanningFile = (req, res) => {
//   const { planing_id, session_no, filename } = req.params;

//   if (!planing_id || !session_no || !filename) {
//     return res.status(400).json({ error: "Missing parameters" });
//   }

//   const baseFolder = "E:/neinSoft/files/Nippon-LND/Planning";
//   const filePath = path.join(baseFolder, String(planing_id), String(session_no), filename);

//   if (!fs.existsSync(filePath)) {
//     return res.status(404).json({ error: "File not found" });
//   }

//   const mimetype = mime.lookup(filePath) || 'application/octet-stream';

//   // Block editing type files from previewing
//   const blockedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
//                         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
//                         'application/msword',                                                       // .doc
//                         'application/vnd.ms-excel'];                                                // .xls

//   if (blockedTypes.includes(mimetype)) {
//     return res.status(403).json({ error: "This file type is not viewable in browser" });
//   }

//   res.setHeader("Content-Type", mimetype);
//   res.setHeader("Content-Disposition", "inline"); // Show in browser (not download)
//   const stream = fs.createReadStream(filePath);
//   stream.pipe(res);
// };




















