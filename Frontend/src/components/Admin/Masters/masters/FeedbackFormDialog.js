import React from 'react';
import { Dialog, DialogTitle, DialogContent, Button, DialogActions } from '@mui/material';

function FeedbackFormDialog({ open, onClose, questions, formName, formType }) {

  let parsedQuestions = {};
  try {
    parsedQuestions = JSON.parse(questions || '{}');
  } catch (error) {
    console.error('Error parsing questions:', error);
  }

  const isRatingQuestion = (index) => index < 11; // Q1–Q11 rating, Q12–Q14 text
  const questionList = Object.values(parsedQuestions);

const trainerStyles = {
  sectionNumber: {
    border: '1px solid #000',
    padding: '10px',
    textAlign: 'center',
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    verticalAlign: 'top'
  },
  sectionTitle: {
    border: '1px solid #000',
    padding: '10px',
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    verticalAlign: 'top'
  },
  emptyCell: {
    border: '1px solid #000',
    padding: '10px',
    width: '40px',
    backgroundColor: '#f9f9f9'
  },
  questionLabel: {
    border: '1px solid #000',
    padding: '10px',
    verticalAlign: 'top',
    width: '40%'
  },
  answerCell: {
    border: '1px solid #000',
    padding: '10px',
    verticalAlign: 'top',
    width: '60%'
  },
  textareaFull: {
    width: '100%',
    minHeight: '60px',
    border: 'none',
    outline: 'none',
    resize: 'vertical',
    fontSize: '14px',
    fontFamily: 'Arial'
  },
  inputFull: {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    fontFamily: 'Arial',
    padding: '5px 0'
  },
  footerLabel: {
    border: '1px solid #000',
    padding: '10px',
    fontWeight: 'bold',
    backgroundColor: '#f9f9f9'
  },
  footerInput: {
    border: '1px solid #000',
    padding: '10px'
  }
};

const traineeStyles = {
  th: { 
    border: '1px solid #000', 
    padding: 8, 
    fontSize: 14,
    textAlign: 'center'
  },
  td: { 
    border: '1px solid #000', 
    padding: 8, 
    fontSize: 14 
  },
  centerTd: { 
    border: '1px solid #000', 
    padding: 8, 
    textAlign: 'center' 
  },
  textarea: { 
    width: '100%', 
    height: 60, 
    border: '1px solid #ccc', 
    fontSize: 14,
    padding: '5px',
    resize: 'vertical'
  },
  labelTd: { 
    border: '1px solid #000', 
    padding: 8, 
    width: '30%', 
    fontSize: 14,
    fontWeight: 'bold'
  },
  input: { 
    width: '100%', 
    border: '1px solid #ccc', 
    outline: 'none', 
    fontSize: 14,
    padding: '5px'
  }
};

// Common styles for both forms
const commonStyles = {
  submitBtn: {
    background: '#4CAF50',
    color: '#fff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: 4,
    display: 'block',
    margin: '20px auto',
    cursor: 'pointer',
    fontSize: '16px'
  }
};

// Update the renderTrainerForm function to use trainerStyles
const renderTrainerForm = () => {
  const q = questionList;

  return (
    <>
      {/* Header Information */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: 20 }}>
        <tbody>
          <tr>
            <td style={{ width: '30%', padding: '5px', border: '1px solid #000', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold' }}>Training Title:</div>
            </td>
            <td style={{ width: '70%', padding: '5px', border: '1px solid #000' }}>
              <input style={trainerStyles.inputFull} />
            </td>
          </tr>
          <tr>
            <td style={{ padding: '5px', border: '1px solid #000', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold' }}>Trainer Name:</div>
            </td>
            <td style={{ padding: '5px', border: '1px solid #000' }}>
              <input style={trainerStyles.inputFull} />
            </td>
          </tr>
          <tr>
            <td style={{ padding: '5px', border: '1px solid #000', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold' }}>Date:</div>
            </td>
            <td style={{ padding: '5px', border: '1px solid #000' }}>
              <input style={trainerStyles.inputFull} />
            </td>
          </tr>
          <tr>
            <td style={{ padding: '5px', border: '1px solid #000', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold' }}>Time:</div>
            </td>
            <td style={{ padding: '5px', border: '1px solid #000' }}>
              <input style={trainerStyles.inputFull} />
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginBottom: 20, fontSize: '14px' }}>
        Please take a few moments to provide us with some important feedback about the training
      </p>

      {/* Feedback Form Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
        <tbody>
          {/* Section 1 */}
          <tr>
            <td style={{ ...trainerStyles.sectionNumber, width: '40px' }}>1</td>
            <td style={trainerStyles.sectionTitle} colSpan={3}>Overall, Session Feedback</td>
          </tr>
          <tr>
            <td style={trainerStyles.emptyCell}></td>
            <td style={trainerStyles.questionLabel} colSpan={2}>a. {q[0]}</td>
            <td style={trainerStyles.answerCell}><textarea style={trainerStyles.textareaFull} /></td>
          </tr>
          <tr>
            <td style={trainerStyles.emptyCell}></td>
            <td style={trainerStyles.questionLabel} colSpan={2}>b. {q[1]}</td>
            <td style={trainerStyles.answerCell}><textarea style={trainerStyles.textareaFull} /></td>
          </tr>

          {/* Section 2 */}
          <tr>
            <td style={trainerStyles.sectionNumber}>2</td>
            <td style={trainerStyles.sectionTitle} colSpan={3}>Interaction & Participation Insights</td>
          </tr>
          <tr>
            <td style={trainerStyles.emptyCell}></td>
            <td style={trainerStyles.questionLabel} colSpan={2}>a. {q[2]}</td>
            <td style={trainerStyles.answerCell}><textarea style={trainerStyles.textareaFull} /></td>
          </tr>
          <tr>
            <td style={trainerStyles.emptyCell}></td>
            <td style={trainerStyles.questionLabel} colSpan={2}>b. {q[3]}</td>
            <td style={trainerStyles.answerCell}><textarea style={trainerStyles.textareaFull} /></td>
          </tr>

          {/* Section 3 */}
          <tr>
            <td style={trainerStyles.sectionNumber}>3</td>
            <td style={trainerStyles.sectionTitle} colSpan={3}>Participant with Excellent Involvement</td>
          </tr>
          <tr>
            <td style={trainerStyles.emptyCell}></td>
            <td style={trainerStyles.questionLabel} colSpan={2}>a. {q[4]}</td>
            <td style={trainerStyles.answerCell}><textarea style={trainerStyles.textareaFull} /></td>
          </tr>
          <tr>
            <td style={trainerStyles.emptyCell}></td>
            <td style={trainerStyles.questionLabel} colSpan={2}>b. {q[5]}</td>
            <td style={trainerStyles.answerCell}><textarea style={trainerStyles.textareaFull} /></td>
          </tr>

          {/* Section 4 */}
          <tr>
            <td style={trainerStyles.sectionNumber}>4</td>
            <td style={trainerStyles.sectionTitle} colSpan={3}>Participant with Minimal Contribution</td>
          </tr>
          <tr>
            <td style={trainerStyles.emptyCell}></td>
            <td style={trainerStyles.questionLabel} colSpan={2}>a. {q[6]}</td>
            <td style={trainerStyles.answerCell}><textarea style={trainerStyles.textareaFull} /></td>
          </tr>
          <tr>
            <td style={trainerStyles.emptyCell}></td>
            <td style={trainerStyles.questionLabel} colSpan={2}>b. {q[7]}</td>
            <td style={trainerStyles.answerCell}><textarea style={trainerStyles.textareaFull} /></td>
          </tr>

          {/* Section 5 */}
          <tr>
            <td style={trainerStyles.sectionNumber}>5</td>
            <td style={trainerStyles.sectionTitle} colSpan={3}>Suggestions for Improvement</td>
          </tr>
          <tr>
            <td style={trainerStyles.emptyCell}></td>
            <td style={trainerStyles.questionLabel} colSpan={2}>a. {q[8]}</td>
            <td style={trainerStyles.answerCell}><textarea style={trainerStyles.textareaFull} /></td>
          </tr>
        </tbody>
      </table>

      {/* Footer Information */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginTop: 30 }}>
        <tbody>
          <tr>
            <td style={{ ...trainerStyles.footerLabel, width: '30%' }}>Name:</td>
            <td style={trainerStyles.footerInput}><input style={trainerStyles.inputFull} /></td>
          </tr>
          <tr>
            <td style={trainerStyles.footerLabel}>Employee No (If internal):</td>
            <td style={trainerStyles.footerInput}><input style={trainerStyles.inputFull} /></td>
          </tr>
          <tr>
            <td style={trainerStyles.footerLabel}>Dept. Name (If internal):</td>
            <td style={trainerStyles.footerInput}><input style={trainerStyles.inputFull} /></td>
          </tr>
          <tr>
            <td style={trainerStyles.footerLabel}>Date:</td>
            <td style={trainerStyles.footerInput}><input style={trainerStyles.inputFull} /></td>
          </tr>
          <tr>
            <td style={trainerStyles.footerLabel}>Sign:</td>
            <td style={trainerStyles.footerInput}><input style={trainerStyles.inputFull} /></td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

// Update renderTraineeForm to use traineeStyles
const renderTraineeForm = () => (
  <>
    {/* ===== Rating Questions ===== */}
    <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
      <thead>
        <tr>
          <th style={traineeStyles.th}>Points</th>
          {[5,4,3,2,1].map(v => <th key={v} style={traineeStyles.th}>{v}</th>)}
        </tr>
      </thead>

      <tbody>
        {Object.entries(parsedQuestions).map(([key, question], index) => (
          <tr key={key}>
            <td style={traineeStyles.td}>{index+1}. {question}</td>

            {isRatingQuestion(index) ? (
              [5,4,3,2,1].map(v => (
                <td key={v} style={traineeStyles.centerTd}>
                  <input type="radio" name={`feedback_form_answer[${key}]`} value={v} />
                </td>
              ))
            ) : (
              <td colSpan={5} style={traineeStyles.td}>
                <textarea
                  name={`feedback_form_answer[${key}]`}
                  placeholder="Enter your answer"
                  style={traineeStyles.textarea}
                />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>

    {/* ===== User Details ===== */}
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
      <tbody>
        {[
          'Name',
          'Employee No',
          'Dept. Name',
          'Date',
          'Sign',
          'What topics would you like to see covered in future training sessions'
        ].map(label => (
          <tr key={label}>
            <td style={traineeStyles.labelTd}>{label}:</td>
            <td style={traineeStyles.td}>
              <input 
                type="text" 
                name={label.replace(/\s+/g,'_').toLowerCase()} 
                style={traineeStyles.input}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </>
);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      sx={{ '& .MuiDialog-paper': { marginTop: '60px' } }}
    >
      <DialogTitle>{formName} Feedback Form</DialogTitle>

      <DialogContent>
        <div style={{ fontFamily: 'Arial', padding: 20, backgroundColor: '#f9f9f9' }}>
          <div style={{ maxWidth: 800, margin: 'auto', backgroundColor: '#fff', padding: 20, border: '1px solid #000' }}>

{formType !== 'trainer' && (
  <p><b>5 = Excellent | 4 = Good | 3 = Average | 2 = Fair | 1 = Poor</b></p>
)}

           
<form>
  {formType === 'trainer' ? renderTrainerForm() : renderTraineeForm()}
  <button type="submit" style={commonStyles.submitBtn}>Submit</button>
</form>

              

             
          </div>
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

const styles = {
  th: { border:'1px solid #000', padding:8, fontSize:14 },
  td: { border:'1px solid #000', padding:8, fontSize:14 },
  centerTd: { border:'1px solid #000', padding:8, textAlign:'center' },
  textarea: { width:'100%', height:60, border:'1px solid #000', fontSize:14 },
  labelTd: { border:'1px solid #000', padding:6, width:'30%', fontSize:14 },
  input: { width:'100%', border:'none', outline:'none', fontSize:14 },
  submitBtn: { background:'#4CAF50', color:'#fff', padding:'10px 20px', border:'none', borderRadius:4, display:'block', margin:'20px auto' }
};

export default FeedbackFormDialog;
