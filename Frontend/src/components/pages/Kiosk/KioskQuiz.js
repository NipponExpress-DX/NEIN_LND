// ============================================================
// KioskQuiz.jsx  (updated — passes language_id to question fetch)
// ============================================================

import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../../../css/Admincss/KioskQuiz.css";
import kioskApi from "../../../utils/kioskApi";
import ProfileChip from "./ProfileChip";
import { useBlockBackNavigation } from "../../../hooks/useBlockBackNavigation";

const LABELS = ["A", "B", "C", "D"];

const KioskQuiz = () => {
  const navigate     = useNavigate();
  const location     = useLocation();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  useBlockBackNavigation(true, () => false); // always block — same as other flow screens

  const kioskState = JSON.parse(sessionStorage.getItem("kioskFlowState"));
  const trainingId = location.state?.trainingId || kioskState?.selectedTrainingId;
  const languageId = location.state?.languageId || kioskState?.selectedLanguageId || 1;

  const [questions,    setQuestions]    = useState([]);
  const [answers,      setAnswers]      = useState({});
  const [current,      setCurrent]      = useState(0);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState("");

  useEffect(() => {
    if (!kioskState || kioskState.inductionType !== "EHS_DIGITAL_INDUCTION") {
      navigate("/kiosk/inductiontype", { replace: true }); return;
    }
    if (!trainingId) {
      navigate("/kiosk/training-category", { replace: true });
    }
  }, []); // eslint-disable-line

  // Fetch questions filtered by language
  useEffect(() => {
    if (!trainingId) return;
    axios
      .get(`${API_BASE_URL}/ehs/quiz/questions`, {
        params: { training_id: trainingId, language_id: languageId },
      })
      .then(({ data }) => setQuestions(data.questions || []))
      .catch(() => setError("Failed to load quiz questions. Please try again."))
      .finally(() => setIsLoading(false));
  }, [trainingId, languageId, API_BASE_URL]);

  const handleAnswer = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
    setError("");
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length) {
      setError(`${unanswered.length} question${unanswered.length > 1 ? "s" : ""} still unanswered`);
      return;
    }
    setIsSubmitting(true);
    try {
      const answersArray = Object.entries(answers).map(([question_id, selected]) => ({
        question_id: Number(question_id), selected,
      }));

      if (!kioskState?.visitor_id && kioskState?.loginType !== "corporate") {
        setError("Your session expired. Please restart the induction from the beginning.");
        setIsSubmitting(false);
        return;
        }

     const { data } = await kioskApi.post(`${API_BASE_URL}/ehs/quiz/submit`, {
        training_id: trainingId,
        language_id: languageId,     // ← passed so transaction table can record it
        visitor_id:  kioskState?.visitor_id || null,
        emp_id:      kioskState?.loginType === "corporate"
                       ? JSON.parse(sessionStorage.getItem("userDetails"))?.emp_id
                       : null,
        answers: answersArray,
      });
      navigate("/kiosk/completion", { state: { score: data.score, passed: data.passed } });
    } catch (err) {
      console.error("[KioskQuiz] submit error:", err);
      setError("Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="kq-wrap">
        <div className="kq-card kq-loading">
          <svg className="kq-spinner" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
          </svg>
          <p>Loading questions…</p>
        </div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="kq-wrap">
        <div className="kq-card kq-loading">
          <p className="kq-error-msg">{error}</p>
          <button className="kq-btn" onClick={() => navigate("/kiosk/training-category")}>
            ← Back to categories
          </button>
        </div>
      </div>
    );
  }

  const q             = questions[current];
  const optValues     = [q?.option_a, q?.option_b, q?.option_c, q?.option_d];
  const answeredCount = Object.keys(answers).length;
  const progressPct   = Math.round((answeredCount / questions.length) * 100);
  const isLast        = current === questions.length - 1;
  const langName      = kioskState?.selectedLanguageName || "English";

  return (
    <div className="kq-wrap">
      <div className="kq-card">

        <div className="kq-topbar">
           <span className="kq-org" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Nippon Express" style={{ height: 28, width: "auto" }} />
            NIPPON EXPRESS (INDIA) PRIVATE LIMITED
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="kq-lang-pill">🌐 {langName}</span>
            <span className="kq-counter">Question {current + 1} of {questions.length}</span>
            <ProfileChip />
          </div>
        </div>

        <div className="kq-progress-track">
          <div className="kq-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="kq-body">
          <p className="kq-qnum">Q{current + 1} — {kioskState?.selectedCategory || "Safety"}</p>
          <p className="kq-qtext">{q?.question}</p>

          <div className="kq-options">
            {LABELS.map((label, i) =>
              optValues[i] ? (
                <button
                  key={label}
                  className={`kq-opt${answers[q.id] === label ? " selected" : ""}`}
                  onClick={() => handleAnswer(q.id, label)}
                >
                  <span className="kq-opt-badge">{label}</span>
                  <span className="kq-opt-text">{optValues[i]}</span>
                </button>
              ) : null
            )}
          </div>
        </div>

        <div className="kq-footer">
          <div className="kq-dots">
            {questions.map((ques, i) => (
              <span
                key={ques.id}
                className={`kq-dot${answers[ques.id] ? " answered" : ""}${i === current ? " active" : ""}`}
                onClick={() => setCurrent(i)}
                title={`Q${i + 1}${answers[ques.id] ? " ✓" : ""}`}
              />
            ))}
          </div>

          <p className="kq-answered-note">
            {answeredCount} of {questions.length} answered
          </p>

          {error && <p className="kq-error-msg">{error}</p>}

          <div className="kq-nav">
            <button
              className="kq-btn"
              onClick={() => setCurrent(c => c - 1)}
              disabled={current === 0}
            >
              ← Previous
            </button>

            {!isLast ? (
              <button
                className="kq-btn"
                onClick={() => setCurrent(c => c + 1)}
                disabled={!answers[q.id]}
              >
                Next →
              </button>
            ) : (
              <button
                className="kq-btn primary"
                onClick={handleSubmit}
                disabled={isSubmitting || answeredCount < questions.length}
              >
                {isSubmitting ? "Submitting…" : "Submit Quiz"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default KioskQuiz;