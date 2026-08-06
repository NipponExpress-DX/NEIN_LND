// ============================================================
// LanguageSelection.jsx
// Inserted between TrainingCategorySelection → VideoTraining
// Route: /kiosk/language
// Fetches available languages for the selected training module
// and stores selectedLanguageId in kioskFlowState.
// ============================================================

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../css/Admincss/LanguageSelection.css";
import ProfileChip from "./ProfileChip";
import { useBlockBackNavigation } from "../../../hooks/useBlockBackNavigation";

// Short badge codes — safer than flag emoji, which render as raw
// "GB"/"IN" text on Windows (no color-emoji font support in most
// browsers there), which is exactly the bug this replaces.
const LANG_CODE = {
  English:   "EN",
  Hindi:     "HI",
  Tamil:     "TA",
  Telugu:    "TE",
  Kannada:   "KA",
  Malayalam: "ML",
};

// Badge color per language, for quick visual distinction
const LANG_COLOR = {
  English:   "#185fa5",
  Hindi:     "#1A6B3C",
  Tamil:     "#a3341a",
  Telugu:    "#854f0b",
  Kannada:   "#6a1a9e",
  Malayalam: "#0a7a72",
};

// Native script labels
const LANG_NATIVE = {
  English:   "English",
  Hindi:     "हिन्दी",
  Tamil:     "தமிழ்",
  Telugu:    "తెలుగు",
  Kannada:   "ಕನ್ನಡ",
  Malayalam: "മലയാളം",
};

const LanguageSelection = () => {
  const navigate     = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  useBlockBackNavigation(true, () => false); // always block — same as other flow screens

  const [languages,   setLanguages]   = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [isSubmitting,setIsSubmitting]= useState(false);
  const [error,       setError]       = useState("");

  // ── Guard ───────────────────────────────────────────────
  const kioskState = JSON.parse(sessionStorage.getItem("kioskFlowState"));

  useEffect(() => {
    if (!kioskState || kioskState.inductionType !== "EHS_DIGITAL_INDUCTION") {
      navigate("/kiosk/inductiontype", { replace: true });
      return;
    }
    if (!kioskState.selectedTrainingId) {
      navigate("/kiosk/training-category", { replace: true });
      return;
    }
  }, [navigate]); // eslint-disable-line

  // ── Fetch available languages for this module ───────────
  useEffect(() => {
    if (!kioskState?.selectedTrainingId) return;

    // Replace the axios call in LanguageSelection.jsx useEffect:
axios
  .get(`${API_BASE_URL}/ehs/training/languages`, {
    params: { training_id: kioskState.selectedTrainingId },
  })
  .then(({ data }) => {
    setLanguages(data);
    const english = data.find(l => l.language_name === "English");
    if (english) setSelected(english.id);

    // Only one real language available for this module — no actual
    // choice to make, so skip straight to the video instead of forcing
    // a click on a single tile.
    if (data.length === 1) {
      const updated = {
        ...kioskState,
        selectedLanguageId:   data[0].id,
        selectedLanguageName: data[0].language_name,
      };
      sessionStorage.setItem("kioskFlowState", JSON.stringify(updated));
      navigate("/kiosk/video", { state: { trainingId: kioskState.selectedTrainingId }, replace: true });
    }
  })
  .catch((err) => {
    console.error("[LanguageSelection] fetch error:", err);
    setError("Failed to load available languages. Please try again.");
  })
  .finally(() => setIsLoading(false));
  }, [API_BASE_URL]); // eslint-disable-line


  const handleSelectLanguage = (langId) => {
  if (isSubmitting) return; // guard against double-taps during the pause

  setSelected(langId);
  setError("");
  setIsSubmitting(true);

  const selectedLang = languages.find(l => l.id === langId);
  const updated = {
    ...kioskState,
    selectedLanguageId:   langId,
    selectedLanguageName: selectedLang?.language_name || "English",
  };
  sessionStorage.setItem("kioskFlowState", JSON.stringify(updated));

  // Let the checkmark show for a beat before leaving the page
  setTimeout(() => {
    navigate("/kiosk/video", { state: { trainingId: kioskState.selectedTrainingId } });
  }, 800);
};


  const handleContinue = () => {
    if (!selected) { setError("Please select a language to continue."); return; }

    setIsSubmitting(true);
    const selectedLang = languages.find(l => l.id === selected);

    const updated = {
      ...kioskState,
      selectedLanguageId:   selected,
      selectedLanguageName: selectedLang?.language_name || "English",
    };
    sessionStorage.setItem("kioskFlowState", JSON.stringify(updated));

    navigate("/kiosk/video", {
      state: { trainingId: kioskState.selectedTrainingId },
    });
  };

  // ── Loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="ls-wrap">
        <div className="ls-card ls-loading">
          <svg className="ls-spinner" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
          </svg>
          <p>Loading available languages…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ls-wrap">
      <div className="ls-card">

       {/* Top bar */}
       <div className="ls-topbar">
          <span className="its-org" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Nippon Express" style={{ height: 28, width: "auto" }} />
            NIPPON EXPRESS (INDIA) PRIVATE LIMITED
          </span>
          <ProfileChip />
        </div>
        {/* Header */}
        <div className="ls-header">
          <div className="ls-icon-ring">🌐</div>
          <h1 className="ls-title">Choose Your Language</h1>
           <p className="ls-subtitle">
            The training video and quiz will be shown in your selected language.
          </p>
          {languages.length > 1 && (
            <p className="ls-subtitle-native">
              {languages
                .map(l => LANG_NATIVE[l.language_name] || l.language_name)
                .join(" · ")}
            </p>
          )}
        </div>

        {error && <p className="ls-error">{error}</p>}

        {/* Language grid */}
        {languages.length === 0 ? (
          <div className="ls-empty">
            <p>No language options available for this module.</p>
            <p>Please contact the safety officer.</p>
          </div>
        ) : (
          <div className="ls-grid">
            {languages.map(lang => (
              <button
                      key={lang.id}
                      className={`ls-tile ${selected === lang.id ? "selected" : ""} ${isSubmitting ? "disabled" : ""}`}
                      onClick={() => handleSelectLanguage(lang.id)}
                      disabled={isSubmitting}
                    >
                <span
                  className="ls-flag"
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 40, height: 40, borderRadius: "50%",
                    background: LANG_COLOR[lang.language_name] || "#666",
                    color: "#fff", fontSize: 14, fontWeight: "bold", letterSpacing: 0.5,
                  }}
                >
                  {LANG_CODE[lang.language_name] || lang.language_name.slice(0, 2).toUpperCase()}
                </span>
                <span className="ls-lang-en">{lang.language_name}</span>
                <span className="ls-lang-native">
                  {LANG_NATIVE[lang.language_name] || lang.language_name}
                </span>
                {selected === lang.id && (
                  <span className="ls-check">✓</span>
                )}
              </button>
            ))}
          </div>
        )}

      
      </div>
    </div>
  );
};

export default LanguageSelection;