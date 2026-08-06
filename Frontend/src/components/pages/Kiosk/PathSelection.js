import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../css/Admincss/PathSelection.css";
import { Heading1 } from "lucide-react";
import { useBlockBackNavigation } from "../../../hooks/useBlockBackNavigation";

const PathSelection = () => {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  useBlockBackNavigation(true, () => false); // always block — same as other flow screens

  useEffect(() => {
  const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
  if (!userDetails) {
    navigate("/login", { replace: true });
    return;
  }

  // Came here via the HR notification email — skip the manual button
  // click and go straight into the combined EHS admin flow.
  if (sessionStorage.getItem("postLoginRedirect") === "ehs-admin") {
  sessionStorage.removeItem("postLoginRedirect");
  handleKioskPath(true);
}
}, [navigate]);


  const handleLNDPath = async () => {
    // LND path - redirect to dashboard directly
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
    
    try {
      await axios.post(`${API_BASE_URL}/login/logAudit`, {
        action: 'LND_PATH_SELECTED',
        empId: userDetails.emp_id
      });
    } catch (auditError) {
      console.warn("Audit log failed (non-critical)", auditError);
    }

    navigate("/admindashboard/dashboardcontent");
  };

const handleKioskPath = async (wantAdminTab = false) => {
  const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));

  try {
    axios.post(`${API_BASE_URL}/login/logAudit`, {
      action: 'KIOSK_PATH_SELECTED', empId: userDetails.emp_id
    }).catch(err => console.warn("Audit log failed (non-critical)", err));
  } catch {}

  const workerReq = axios.post(`${API_BASE_URL}/ehs/auth/corporate-session`, {
    emp_id:         userDetails.emp_id,
    full_name:      userDetails.empname,
    contact_number: userDetails.user_email || "",
    branch_code:    userDetails.user_branch,
  });

  const adminReq = axios.post(`${API_BASE_URL}/ehs/admin/corporate-session`, {
    emp_id: userDetails.emp_id,
  }).catch(() => null); // 404 = not an admin, not an error

  try {
    const [workerRes, adminRes] = await Promise.all([workerReq, adminReq]);
    const data = workerRes.data;

    sessionStorage.setItem("ehsWorkerSession", JSON.stringify({
      visitor_id: data.visitor_id, token: data.token, full_name: data.full_name,
      visitor_type: data.visitor_type, photo_path: data.photo_path,
      user_type: "corporate", created_at: new Date().toISOString(),
    }));

    if (adminRes?.data) {
      sessionStorage.setItem("ehsAdminSession", JSON.stringify(adminRes.data));
    } else {
      sessionStorage.removeItem("ehsAdminSession");
    }

    navigate(wantAdminTab && adminRes?.data ? "/ehs/workspace?tab=admin" : "/ehs/workspace");
  } catch (err) {
    console.error("[PathSelection] EHS session error:", err);
   sessionStorage.setItem("kioskFlowState", JSON.stringify({
  inductionType: "EHS_DIGITAL_INDUCTION", entrySource: "corporate",
}));
    navigate("/kiosk/inductiontype");
  }
};

  return (
    <div className="pathselection-container">
      <div className="pathselection-content">
        <h1>Welcome back! </h1>
        <h1>Choose the workspace you want to access.</h1>
        
        
        <div className="pathselection-buttons">
          <button 
            className="path-button lnd-button" 
            onClick={handleLNDPath}
          >
            <div className="button-icon">📊</div>
            <h3>LND</h3>
            <p>Learning & Development Portal</p>
          </button>

          <button 
                className="path-button kiosk-button" 
                onClick={() => handleKioskPath(false)}
              >
            <div className="button-icon">🖥️</div>
            <h3>Inductions</h3>
            <p>Digital Induction & Safety Training</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PathSelection;
