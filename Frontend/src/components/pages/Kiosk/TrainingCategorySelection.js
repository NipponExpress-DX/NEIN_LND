import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../css/Admincss/TrainingCategorySelection.css";
import ProfileChip from "./ProfileChip";
import { useBlockBackNavigation } from "../../../hooks/useBlockBackNavigation";

const TrainingCategorySelection = () => {
  const navigate     = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  useBlockBackNavigation(true, () => false); // always block — same as other flow screens


  const [selectedCategory,   setSelectedCategory]   = useState(null);
  const [isLoading,          setIsLoading]           = useState(false);
  const [error,              setError]               = useState("");
  const [userType,           setUserType]            = useState(null);
  const [trainingCategories, setTrainingCategories]  = useState([]);
  const [loadingModules,     setLoadingModules]      = useState(true);

  // ── Guard + userType ─────────────────────────────────────
  useEffect(() => {
    const kioskState  = JSON.parse(sessionStorage.getItem("kioskFlowState"));
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));

    if (!kioskState || kioskState.inductionType !== "EHS_DIGITAL_INDUCTION") {
      navigate("/kiosk/inductiontype", { replace: true });
      return;
    }
    setUserType(userDetails?.loginType === "corporate" ? "corporate" : "kiosk");
  }, [navigate]);

  // ── Fetch modules once userType is known ─────────────────
  useEffect(() => {
    if (userType === null) return; // wait for guard effect to run first

    const kioskUserData = JSON.parse(sessionStorage.getItem("kioskUserData"));
    const workerType    = userType === "corporate"
      ? "Employee"
      : kioskUserData?.visitor_type || "";

    axios.get(`${API_BASE_URL}/ehs/training/modules`, {
      params: workerType ? { applicable_to: workerType } : {}
    })
      .then(({ data }) => setTrainingCategories(data))
      .catch(() => setError("Failed to load training modules. Please try again."))
      .finally(() => setLoadingModules(false));
  }, [userType, API_BASE_URL]); // depends on userType, not just API_BASE_URL

 // ── Continue handler ──────────────────────────────────────
// Takes the clicked category directly — selecting a card and
// continuing are now the same action, no second click needed.
// Shows the selected checkmark briefly before moving on.
const handleContinue = async (categoryId) => {
  if (!categoryId) return;
  setSelectedCategory(categoryId);
  setIsLoading(true);

  try {
    const userDetails    = JSON.parse(sessionStorage.getItem("userDetails"));
    const kioskState     = JSON.parse(sessionStorage.getItem("kioskFlowState"));
    const selectedModule = trainingCategories.find(c => c.id === categoryId);

    if (userType === "corporate") {
      axios.post(`${API_BASE_URL}/ehs/audit/log`, {
        emp_id:    userDetails?.emp_id,
        action:    "EHS_TRAINING_CATEGORY_SELECTED",
        loginType: "corporate",
        meta:      { training_id: categoryId },
      }).catch(e => console.warn("Audit log failed:", e));
    }

    kioskState.selectedCategory   = selectedModule?.training_name || "";
    kioskState.selectedTrainingId = categoryId;
    kioskState.passPercentage     = selectedModule?.pass_percentage || 80;
    delete kioskState.selectedLanguageId;
    delete kioskState.selectedLanguageName;
    sessionStorage.setItem("kioskFlowState", JSON.stringify(kioskState));

    // Let the checkmark show for a beat before leaving the page
    setTimeout(() => {
      navigate("/kiosk/language", { state: { trainingId: categoryId } });
    }, 800);
  } catch (err) {
    setError("Failed to select category. Please try again.");
    setIsLoading(false);
  }
};

  return (
    <div className="training-category-container">
<div className="category-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span className="its-org" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Nippon Express" style={{ height: 28, width: "auto" }} />
            NIPPON EXPRESS (INDIA) PRIVATE LIMITED
          </span>
          <ProfileChip />
        </div>

        <h2>Select Training Category</h2>
        <p>Choose the area you would like to receive training on:</p>

        {error && <p className="error-message">{error}</p>}

       {/* ── Single clean render — no duplicate block ── */}
        {loadingModules ? (
          <p className="loading-text">Loading training modules…</p>
        ) : trainingCategories.length === 0 ? (
          <p className="loading-text">No training modules available.</p>
        ) : (
          <div className="categories-grid">
            {trainingCategories.map(cat => (
              <div
                key={cat.id}
                className={`category-card ${selectedCategory === cat.id ? "selected" : ""} ${isLoading ? "disabled" : ""}`}
                onClick={() => !isLoading && handleContinue(cat.id)}
              >
                <h3>{cat.training_name}</h3>
                <p className="category-description">{cat.category}</p>
                <p className="category-duration">Pass: {cat.pass_percentage}%</p>
                {selectedCategory === cat.id && isLoading && (
                    <div className="selected-badge">✓</div>
                  )}
              </div>
            ))}
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default TrainingCategorySelection;