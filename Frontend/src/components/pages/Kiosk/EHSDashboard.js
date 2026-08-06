  // src/components/Kiosk/EHS/EHSDashboard.jsx
  // Redesigned: self-contained inline styling (no external CSS dependency),
  // plus search/filter/sort of training history, a real-data breakdown bar,
  // CSV export, and a viewable/printable certificate. All additions are
  // client-side — no new backend endpoints required.
  import React, { useEffect, useMemo, useState } from "react";
  import { useNavigate, useParams } from "react-router-dom";
  import axios from "axios";
  import { useBlockBackNavigation } from "../../../hooks/useBlockBackNavigation";

  const NAVY   = "#1A005D";
  const NAVY2  = "#2A1B7A";
  const GREEN  = "#1A6B3C";
  const AMBER  = "#B9740A";
  const RED    = "#C0392B";
  const BG     = "#F4F6FB";
  const BORDER = "#E4E7F2";
  const MUTED  = "#6B7280";

  const fmt   = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const fmtDT = d => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  // One-time font + keyframe injection — headings get a bit more character
  // without touching the app's global stylesheet.
  function useDashboardStyles() {
    useEffect(() => {
      if (document.getElementById("ehsd-fonts")) return;
      const link = document.createElement("link");
      link.id = "ehsd-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&display=swap";
      document.head.appendChild(link);
    }, []);
  }

  const HEAD_FONT = "'Sora', 'Segoe UI', Arial, sans-serif";
  const BODY_FONT = "'Inter', 'Segoe UI', Arial, sans-serif";

  const EHSDashboard = ({ embedded = false }) => {
    useDashboardStyles();
    const navigate = useNavigate();
    const { visitor_id: urlVisitorId } = useParams();
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    useBlockBackNavigation(true, () => false); // always block — same as other flow screens

    let session = null;
    try { session = JSON.parse(sessionStorage.getItem("ehsWorkerSession")); }
    catch (e) { console.warn("[EHSDashboard] Failed to parse session:", e); }

    let adminSession = null;
    try { adminSession = JSON.parse(sessionStorage.getItem("ehsAdminSession")); }
    catch (e) { console.warn("[EHSDashboard] Failed to parse admin session:", e); }

    const hasAdminAccess = !!adminSession?.token;
    const handleSwitchToAdmin = () => navigate("/ehs/admin");

    const activeVisitorId = urlVisitorId || session?.visitor_id;
    const sessionToken = session?.token;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ── Withdraw consent state ──
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawError, setWithdrawError] = useState("");

    // ── Training history controls ──
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All"); // All | Passed | Failed | Verified | Submitted
    const [sortDir, setSortDir] = useState("desc"); // desc = newest first
    const [showSuperseded, setShowSuperseded] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
      if (!activeVisitorId) {
        console.warn("[EHSDashboard] No visitor_id found. Redirecting to login.");
        navigate("/ehs/login", { replace: true });
        return;
      }

      const fetchDashboard = async () => {
        try {
          setLoading(true);
          const headers = {};
          if (sessionToken) headers["x-ehs-token"] = sessionToken;

          const { data } = await axios.get(`${API_BASE_URL}/ehs/dashboard/${activeVisitorId}`, { headers });
          setData(data);
          setError("");
        } catch (err) {
          console.error("[EHSDashboard] Fetch error:", err);
          if (err.response?.status === 401) {
            setError("Session expired. Please log in again.");
            setTimeout(() => navigate("/ehs/login"), 2000);
          } else {
            setError("Failed to load dashboard data. Please try again.");
          }
        } finally {
          setLoading(false);
        }
      };

      fetchDashboard();
    }, [activeVisitorId, sessionToken, navigate, API_BASE_URL]);

    const worker = data?.worker;

    const handleStartNewTraining = () => {
      sessionStorage.setItem("kioskFlowState", JSON.stringify({
        inductionType: "EHS_DIGITAL_INDUCTION",
        entrySource: "returning_visitor",
        visitor_id: worker?.id || activeVisitorId,
        visitorPin: session?.pin || null,
      }));
      sessionStorage.setItem("kioskUserData", JSON.stringify({
        visitor_id: worker?.id || activeVisitorId,
        visitor_type: worker?.visitor_type || "",
        full_name: worker?.full_name || "",
        photo_path: worker?.photo_path || null,
        contact_number: worker?.contact_number || "",   // ← add this
      }));
      navigate("/kiosk/training-category");
    };

    const handleLogout = () => {
      let userType = "kiosk";
      try {
        const sess = JSON.parse(sessionStorage.getItem("ehsWorkerSession"));
        userType = sess?.user_type || "kiosk";
      } catch {}
      sessionStorage.removeItem("ehsWorkerSession");
      sessionStorage.removeItem("userDetails");
      sessionStorage.removeItem("kioskUserData");
      navigate(userType === "corporate" ? "/login" : "/kiosk/welcome");
    };

    const handleWithdrawConsent = async () => {
      if (!activeVisitorId) return;
      setWithdrawing(true);
      setWithdrawError("");
      try {
        const headers = {};
        if (sessionToken) headers["x-ehs-token"] = sessionToken;
        await axios.post(`${API_BASE_URL}/ehs/consent/withdraw`, { visitor_id: activeVisitorId }, { headers });
        sessionStorage.removeItem("ehsWorkerSession");
        sessionStorage.removeItem("userDetails");
        sessionStorage.removeItem("kioskUserData");
        sessionStorage.removeItem("kioskFlowState");
        navigate("/kiosk/welcome", { replace: true });
      } catch (err) {
        console.error("[EHSDashboard] withdraw consent error:", err);
        setWithdrawError(err.response?.data?.error || "Failed to withdraw consent. Please contact the safety officer.");
      } finally {
        setWithdrawing(false);
      }
    };

    // ── Derived data (hooks must run before any early return) ──
    const completions = data?.completions || [];
    const stats = data?.stats;

    const enrichedCompletions = useMemo(() => (completions || []).map((c, i, arr) => {
      if (c.passed) return { ...c, superseded: false };
      const laterPass = arr.some((other, j) =>
        j !== i &&
        other.training_name === c.training_name &&
        other.passed &&
        new Date(other.completed_at) > new Date(c.completed_at)
      );
      return { ...c, superseded: laterPass };
    }), [completions]);

    const supersededCount = useMemo(
      () => enrichedCompletions.filter(c => c.superseded).length,
      [enrichedCompletions]
    );

    const visibleCompletions = useMemo(() => {
      let list = enrichedCompletions;
      if (!showSuperseded) list = list.filter(c => !c.superseded);

      if (statusFilter === "Passed") list = list.filter(c => c.passed);
      else if (statusFilter === "Failed") list = list.filter(c => !c.passed);
      else if (statusFilter === "Verified") list = list.filter(c => c.verification_status === "Verified");
      else if (statusFilter === "Submitted") list = list.filter(c => c.passed && c.verification_status !== "Verified" && c.verification_status !== "Rejected");

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(c =>
          (c.training_name || c.category || "").toLowerCase().includes(q) ||
          (c.location_code || "").toLowerCase().includes(q)
        );
      }

      return [...list].sort((a, b) => {
        const diff = new Date(a.completed_at) - new Date(b.completed_at);
        return sortDir === "desc" ? -diff : diff;
      });
    }, [enrichedCompletions, showSuperseded, statusFilter, search, sortDir]);

    // Real breakdown of this worker's record — used as the hero's signature visual.
    const breakdown = useMemo(() => {
      const total = completions.length || 0;
      const verified = completions.filter(c => c.passed && c.verification_status === "Verified").length;
      const pending  = completions.filter(c => c.passed && c.verification_status !== "Verified" && c.verification_status !== "Rejected").length;
      const failed   = completions.filter(c => !c.passed).length;
      return { total, verified, pending, failed };
    }, [completions]);

    const handleExportCSV = () => {
      const header = ["#", "Module", "Location", "Result", "Completed", "Status"];
      const rows = visibleCompletions.map((c, i) => [
        i + 1,
        c.training_name || c.category || "—",
        c.location_code || "—",
        c.passed ? "Passed" : "Failed",
        fmtDT(c.completed_at),
        c.verification_status || "Submitted",
      ]);
      const csv = [header, ...rows]
        .map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(worker?.full_name || "training-history").replace(/\s+/g, "_")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    // Opens the certificate in a new tab for viewing. The user decides
    // whether to print/save it via the in-page "Download as PDF" button —
    // nothing happens automatically on open.
    const handleViewCertificate = (c) => {
      const win = window.open("", "_blank", "width=900,height=700");
      if (!win) return;

      const CERT_NAVY  = "#1A005D";
      const CERT_GREEN = "#8EC400";

      const workerName   = worker?.full_name || "Employee";
      const workerType   = worker?.visitor_type || "—";
      const workerId     = worker?.employee_id || "—";
      const mobile       = worker?.contact_number || "—";
      const location     = c.location_code || "—";
      const trainingName = c.training_name || c.category || "Safety Training";
      const language     = c.language_name || "English";
      const trainingDate = fmt(c.completed_at);
      const validFrom    = fmt(c.completed_at);
      const validTill    = fmt(c.valid_till);
      const certNo       = `TRN${String(c.cert_id || c.completion_id).padStart(6, "0")}`;
      const dateOfIssue  = fmt(new Date());
      const photoUrl     = worker?.photo_path ? `${API_BASE_URL}/${worker.photo_path}` : null;

      win.document.write(`
        <html>
          <head>
            <title>Certificate — ${workerName}</title>
            <style>
              * { box-sizing: border-box; }
              body {
                font-family: 'Segoe UI', Arial, sans-serif;
                margin: 0; padding: 30px;
                background: #eef0f5;
              }
              .cert {
                position: relative;
                max-width: 900px;
                margin: 0 auto;
                background: #fff;
                border: 2px solid ${CERT_NAVY};
                padding: 40px 50px;
              }

              /* ── Corner ribbon: solid navy triangle with a green stripe
                crossing the diagonal, tips extending past the edge ── */
              .corner-navy-tl {
                position: absolute; top: 0; left: 0;
                width: 0; height: 0;
                border-style: solid;
                border-width: 143px 143px 0 0;
                border-color: ${CERT_NAVY} transparent transparent transparent;
              }
              .corner-green-tl {
                  position: absolute;
                  top: 75px; left: 74px;
                  width: 206px; height: 9px;
                  background: ${CERT_GREEN};
                  transform: translate(-50%, -50%) rotate(-45deg);
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              .corner-navy-br {
                position: absolute; bottom: 0; right: 0;
                width: 0; height: 0;
                border-style: solid;
                border-width: 0 0 143px 143px;
                border-color: transparent transparent ${CERT_NAVY} transparent;
              }
              .corner-green-br {
                position: absolute;
                bottom: 75px; right: 74px;
                width: 206px; height: 9px;
                background: ${CERT_GREEN};
                transform: translate(50%, 50%) rotate(-45deg);
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .head { text-align: center; margin-bottom: 26px; }
              .head .rule-row { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 10px; }
              .head .rule { height: 2px; width: 140px; background: ${CERT_NAVY}; }
              .head .shield { font-size: 26px; }
              .head h1 { font-size: 30px; font-weight: 800; color: ${CERT_NAVY}; margin: 0; letter-spacing: 1px; }
              .head h2 { font-size: 30px; font-weight: 800; color: ${CERT_GREEN}; margin: 2px 0 0; letter-spacing: 1px; }

              .body-row { display: flex; gap: 30px; margin-top: 24px; }
              .photo-box {
                width: 130px; height: 150px; flex-shrink: 0;
                border: 2px dashed #c9ccd6; border-radius: 6px;
                display: flex; align-items: center; justify-content: center;
                overflow: hidden; background: #fafafa;
              }
              .photo-box img { width: 100%; height: 100%; object-fit: cover; }
              .photo-box .placeholder { font-size: 46px; color: #c9ccd6; }

              .fields { flex: 1; font-size: 14px; color: ${CERT_NAVY}; }
              .field-row { display: flex; align-items: baseline; padding: 5px 0; border-bottom: 1px solid #eee; }
              .field-row .label { width: 210px; font-weight: 700; flex-shrink: 0; }
              .field-row .colon { width: 16px; }
              .field-row .value { flex: 1; }

              .meta-strip {
                display: flex; justify-content: space-between;
                border-top: 1px solid #ddd; border-bottom: 1px solid #ddd;
                padding: 18px 0; margin: 28px 0; text-align: center;
              }
              .meta-item { flex: 1; font-size: 11px; font-weight: 700; color: ${CERT_NAVY}; }
              .meta-item .icon { font-size: 20px; margin-bottom: 6px; }
              .meta-item .val { font-weight: 400; font-size: 12px; color: #444; margin-top: 4px; }

              .certify { text-align: center; font-size: 15px; color: ${CERT_NAVY}; line-height: 1.7; margin-bottom: 30px; }
              .certify strong { color: ${CERT_GREEN}; }

              .footer-row {
                display: flex; justify-content: space-between;
                font-size: 12px; color: ${CERT_NAVY}; font-weight: 700;
                padding: 0 70px 16px 0;
              }

              .cert-actions {
                max-width: 900px;
                margin: 16px auto 0;
                text-align: center;
              }
              .cert-actions button {
                background: ${CERT_NAVY};
                color: #fff;
                border: none;
                border-radius: 8px;
                padding: 12px 26px;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
              }
              .cert-actions button:hover { opacity: 0.9; }

              @media print {
                .cert-actions { display: none; }
                body { background: #fff; padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="cert">
              <div class="corner-navy-tl"></div>
              <div class="corner-green-tl"></div>
              <div class="corner-navy-br"></div>
              <div class="corner-green-br"></div>

              <div class="head">
                <div class="rule-row">
                  <span class="rule"></span>
                  <span class="shield">🛡️✅</span>
                  <span class="rule"></span>
                </div>
                <h1>EHS INDUCTION TRAINING</h1>
                <h2>CERTIFICATE</h2>
              </div>

              <div class="body-row">
                <div class="photo-box">
                  ${photoUrl ? `<img src="${photoUrl}" alt="" />` : `<span class="placeholder">👤</span>`}
                </div>
                <div class="fields">
                  <div class="field-row"><span class="label">Employee / Worker Name</span><span class="colon">:</span><span class="value">${workerName}</span></div>
                  <div class="field-row"><span class="label">Worker Type</span><span class="colon">:</span><span class="value">${workerType}</span></div>
                  <div class="field-row"><span class="label">Employee / Contractor ID</span><span class="colon">:</span><span class="value">${workerId}</span></div>
                  <div class="field-row"><span class="label">Location</span><span class="colon">:</span><span class="value">${location}</span></div>
                  <div class="field-row"><span class="label">Mobile Number</span><span class="colon">:</span><span class="value">${mobile}</span></div>
                </div>
              </div>

              <div class="meta-strip">
                <div class="meta-item"><div class="icon">📋</div>CERTIFICATE NO.<div class="val">${certNo}</div></div>
                <div class="meta-item"><div class="icon">📖</div>TRAINING NAME<div class="val">${trainingName}</div></div>
                <div class="meta-item"><div class="icon">💬</div>LANGUAGE<div class="val">${language}</div></div>
                <div class="meta-item"><div class="icon">📅</div>TRAINING DATE<div class="val">${trainingDate}</div></div>
                <div class="meta-item"><div class="icon">🟢</div>VALID FROM<div class="val">${validFrom}</div></div>
                <div class="meta-item"><div class="icon">🔴</div>VALID TILL<div class="val">${validTill}</div></div>
              </div>

              <div class="certify">
                This certifies that the above individual has successfully completed<br/>
                the mandatory <strong>${trainingName}</strong>.
              </div>

              <div class="footer-row">
                <span>DATE OF ISSUE: ${dateOfIssue}</span>
                <span>PLACE: ${location}</span>
              </div>
            </div>

            <div class="cert-actions">
              <button onclick="window.print()">⬇ Download as PDF</button>
            </div>
          </body>
        </html>
      `);
      win.document.close();
    };

    const wrapStyle = { minHeight: "100vh", background: BG, fontFamily: BODY_FONT };

    // ── LOADING ──
    if (loading) return (
      <div style={{ ...wrapStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: MUTED }}>
          <div style={{
            width: 40, height: 40, margin: "0 auto 16px", borderRadius: "50%",
            border: `3px solid ${BORDER}`, borderTopColor: GREEN,
            animation: "ehsd-spin 0.8s linear infinite",
          }} />
          <style>{"@keyframes ehsd-spin { to { transform: rotate(360deg); } }"}</style>
          <p style={{ fontSize: 14 }}>Loading your training records…</p>
        </div>
      </div>
    );

    // ── ERROR / NO DATA ──
    if (error || !data) return (
      <div style={{ ...wrapStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
                      padding: "32px 40px", maxWidth: 380 }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>⚠️</div>
          <p style={{ color: RED, fontSize: 14, marginBottom: 18 }}>{error || "Unable to load dashboard. Please try again."}</p>
          <button onClick={() => navigate("/ehs/login")}
            style={{ background: NAVY, color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px",
                    fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            ← Back to Login
          </button>
        </div>
      </div>
    );

    const kpis = [
      { label: "Total Trainings", value: stats?.totalAttempts || 0, color: NAVY,  icon: "📋" },
      { label: "Passed",          value: stats?.totalPassed || 0,   color: GREEN, icon: "✅" },
      { label: "Failed",          value: stats?.totalFailed || 0,   color: RED,   icon: "❌" },
      { label: "Active Certs",    value: stats?.activeCerts || 0,   color: "#3D8B37", icon: "🏆" },
      { label: "Expiring (30d)",  value: stats?.expiringSoon || 0,  color: AMBER, icon: "⚠️" },
    ];

    const filterChips = ["All", "Passed", "Failed", "Verified", "Submitted"];

    return (
      <div style={wrapStyle}>
        <style>{`
          .ehsd-chip { transition: all .15s ease; }
          .ehsd-row:hover { background: #FAFBFF; }
          .ehsd-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0,0,0,0.18); }
          input[type="text"]:focus, select:focus { outline: 2px solid ${GREEN}55; outline-offset: 1px; }
          @media (max-width: 720px) {
            .ehsd-kpis { grid-template-columns: repeat(2, 1fr) !important; }
            .ehsd-hero { flex-direction: column !important; align-items: flex-start !important; gap: 18px !important; }
          }
        `}</style>

        {/* ── Top bar ── */}
        {!embedded && (
          <div style={{ background: NAVY, color: "#fff", padding: "14px 28px",
                        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 16, fontFamily: HEAD_FONT }}>🛡️ Nippon Express — EHS Portal</span>
            <div style={{ display: "flex", gap: 10 }}>
              {hasAdminAccess && (
                <button onClick={handleSwitchToAdmin}
                  style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
                          padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  {adminSession.role === "super_admin" ? "👥 Switch to Super Admin" : "👥 Switch to Admin"}
                </button>
              )}
              <button onClick={() => setShowWithdrawModal(true)}
                style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
                        padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
                Withdraw Consent
              </button>
              <button onClick={handleLogout}
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff",
                        padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                Sign Out
              </button>
            </div>
          </div>
        )}

        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "28px 20px 60px" }}>

          {/* ── Hero ── */}
          <div className="ehsd-hero" style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24,
            background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY2} 100%)`,
            borderRadius: 18, padding: "30px 32px", marginBottom: 22, color: "#fff",
            boxShadow: "0 10px 30px rgba(26,0,93,0.25)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {worker?.photo_path
                ? <img src={`${API_BASE_URL}/${worker.photo_path}`} alt=""
                      style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover",
                                border: "3px solid rgba(255,255,255,0.4)" }} />
                : <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(255,255,255,0.15)",
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>👷</div>
              }
              <div>
                <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 500 }}>Welcome back,</div>
                <h1 style={{ fontFamily: HEAD_FONT, fontSize: 26, fontWeight: 700, margin: "2px 0 8px" }}>
                  {worker?.full_name || "User"}
                </h1>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ background: "rgba(255,255,255,0.16)", padding: "3px 12px", borderRadius: 99,
                                fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
                    {worker?.visitor_type || "Visitor"}
                  </span>
                  {worker?.employee_id && (
                    <span style={{ fontSize: 12, opacity: 0.8 }}>ID: {worker.employee_id}</span>
                  )}
                  {worker?.created_at && (
                    <span style={{ fontSize: 12, opacity: 0.8 }}>Since {fmt(worker.created_at)}</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
              <button className="ehsd-cta" onClick={handleStartNewTraining}
                style={{ background: GREEN, color: "#fff", border: "none", borderRadius: 10,
                        padding: "12px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                        whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>
                + Start New Training
              </button>

              {/* Signature element: a real breakdown of this worker's record */}
              {breakdown.total > 0 && (
                <div style={{ width: 220 }}>
                  <div style={{ display: "flex", height: 8, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.15)" }}>
                    {breakdown.verified > 0 && <div style={{ width: `${(breakdown.verified / breakdown.total) * 100}%`, background: "#4ADE80" }} />}
                    {breakdown.pending > 0 && <div style={{ width: `${(breakdown.pending / breakdown.total) * 100}%`, background: "#FBBF24" }} />}
                    {breakdown.failed > 0 && <div style={{ width: `${(breakdown.failed / breakdown.total) * 100}%`, background: "#F87171" }} />}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 10, opacity: 0.85, justifyContent: "flex-end" }}>
                    <span>🟢 {breakdown.pending} Submitted</span>
                    {breakdown.failed > 0 && <span>🔴 {breakdown.failed} failed</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── KPI strip ── */}
          <div className="ehsd-kpis" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 22 }}>
            {kpis.map(k => (
              <div key={k.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px",
                                          border: `1px solid ${BORDER}`, borderTop: `3px solid ${k.color}` }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{k.icon}</div>
                <div style={{ fontFamily: HEAD_FONT, fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* ── Alerts ── */}
          {stats?.expiringSoon > 0 && (
            <div style={{ background: "#FFF8EC", border: "1px solid #F3D9A6", color: "#8A5A0A",
                          borderRadius: 10, padding: "12px 16px", fontSize: 13, marginBottom: 14 }}>
              ⚠️ {stats.expiringSoon} certificate{stats.expiringSoon > 1 ? "s" : ""} expiring within 30 days.
              Please retake the relevant training to stay compliant.
            </div>
          )}
          {stats?.activeCerts === 0 && stats?.totalAttempts > 0 && (
            <div style={{ background: "#FDECEC", border: "1px solid #F3B9B9", color: RED,
                          borderRadius: 10, padding: "12px 16px", fontSize: 13, marginBottom: 14 }}>
              ❌ You have no active certificates. Please complete your EHS induction.
            </div>
          )}

          {/* ── Training history ── */}
          <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            <div style={{ padding: "18px 20px", borderBottom: `1px solid ${BORDER}` }}>
              <h3 style={{ fontFamily: HEAD_FONT, margin: "0 0 14px", fontSize: 16, color: NAVY }}>📋 Training History</h3>

              {completions.length > 0 && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Search by module or location…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ flex: "1 1 200px", padding: "8px 12px", border: `1px solid ${BORDER}`,
                            borderRadius: 8, fontSize: 13 }}
                  />
                  {filterChips.map(s => (
                    <button key={s} className="ehsd-chip" onClick={() => setStatusFilter(s)}
                      style={{ padding: "7px 14px", borderRadius: 99, fontSize: 12, cursor: "pointer",
                              border: statusFilter === s ? `1.5px solid ${GREEN}` : `1px solid ${BORDER}`,
                              background: statusFilter === s ? "#EAF7EF" : "#fff",
                              color: statusFilter === s ? GREEN : "#444",
                              fontWeight: statusFilter === s ? 700 : 500 }}>
                      {s}
                    </button>
                  ))}
                  <select value={sortDir} onChange={e => setSortDir(e.target.value)}
                    style={{ padding: "8px 10px", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, color: "#444" }}>
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </select>
                  <button onClick={handleExportCSV}
                    style={{ padding: "8px 14px", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12,
                            background: "#fff", color: NAVY, fontWeight: 600, cursor: "pointer" }}>
                    ⬇ Export CSV
                  </button>
                </div>
              )}
            </div>

            {completions.length === 0 ? (
              <div style={{ padding: "48px 20px", textAlign: "center", color: MUTED }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>📭</div>
                <p style={{ marginBottom: 16 }}>No training records yet.</p>
                <button onClick={handleStartNewTraining}
                  style={{ background: GREEN, color: "#fff", border: "none", borderRadius: 8,
                          padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Start Your First Training →
                </button>
              </div>
            ) : visibleCompletions.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: MUTED, fontSize: 13 }}>
                No records match your search or filter.
              </div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F8F9FD" }}>
                        {["#", "Module", "Location", "Result", "Completed", "Status", ""].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: MUTED,
                                                fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCompletions.map((c, i) => (
                        <React.Fragment key={c.completion_id}>
                          <tr className="ehsd-row"
                            onClick={() => setExpandedId(expandedId === c.completion_id ? null : c.completion_id)}
                            style={{ borderTop: `1px solid ${BORDER}`, cursor: "pointer",
                                    opacity: c.superseded ? 0.55 : 1 }}>
                            <td style={{ padding: "12px 14px", color: MUTED }}>{i + 1}</td>
                            <td style={{ padding: "12px 14px", fontWeight: 600, color: NAVY }}>
                              {c.training_name || c.category || "—"}
                            </td>
                            <td style={{ padding: "12px 14px", color: "#444" }}>{c.location_code || "—"}</td>
                            <td style={{ padding: "12px 14px" }}>
                              {c.superseded ? (
                                <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, background: "#F0F0F0", color: "#888" }}>
                                  🔄 Retaken & Passed
                                </span>
                              ) : (
                                <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                                              background: c.passed ? "#EAF7EF" : "#FDECEC",
                                              color: c.passed ? GREEN : RED }}>
                                  {c.passed ? "✅ PASSED" : "❌ FAILED"}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "12px 14px", color: "#555" }}>{fmtDT(c.completed_at)}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                                            background: c.verification_status === "Verified" ? "#EAF7EF"
                                                      : c.verification_status === "Rejected" ? "#FDECEC" : "#FFF6E5",
                                            color: c.verification_status === "Verified" ? GREEN
                                                  : c.verification_status === "Rejected" ? RED : AMBER }}>
                                {c.verification_status === "Verified" ? "✓ Verified"
                                  : c.verification_status === "Rejected" ? "✕ Rejected"
                                  : "📝 Submitted"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", color: MUTED, fontSize: 11 }}>
                              {expandedId === c.completion_id ? "▲" : "▼"}
                            </td>
                          </tr>
                          {expandedId === c.completion_id && (
                            <tr style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFBFF" }}>
                              <td colSpan={7} style={{ padding: "14px 20px" }}>
                                <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center", fontSize: 12, color: "#555" }}>
                                  {c.score != null && <span><strong>Score:</strong> {c.score}%</span>}
                                  <span><strong>Completion ID:</strong> {c.completion_id}</span>
                                  {c.superseded && (
                                    <span style={{ color: "#888" }}>This attempt was superseded by a later pass and doesn't count toward your active certificate.</span>
                                  )}
                                  {c.passed && (
                                    <button onClick={(e) => { e.stopPropagation(); handleViewCertificate(c); }}
                                      style={{ marginLeft: "auto", background: NAVY, color: "#fff", border: "none",
                                              borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                      📄 View Certificate
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {!showSuperseded && supersededCount > 0 && (
                  <div style={{ padding: "10px 20px", borderTop: `1px solid ${BORDER}`, fontSize: 12, color: MUTED }}>
                    {supersededCount} earlier retaken attempt{supersededCount > 1 ? "s" : ""} hidden.{" "}
                    <button onClick={() => setShowSuperseded(true)}
                      style={{ background: "none", border: "none", color: GREEN, fontWeight: 600, cursor: "pointer", fontSize: 12 }}>
                      Show all
                    </button>
                  </div>
                )}
                {showSuperseded && (
                  <div style={{ padding: "10px 20px", borderTop: `1px solid ${BORDER}`, fontSize: 12, color: MUTED }}>
                    <button onClick={() => setShowSuperseded(false)}
                      style={{ background: "none", border: "none", color: GREEN, fontWeight: 600, cursor: "pointer", fontSize: 12 }}>
                      Hide retaken attempts
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Withdraw Consent Modal ── */}
        {showWithdrawModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
                        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: "2.5rem 2rem", maxWidth: 420, width: "90%",
                          textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⚠️</div>
              <h2 style={{ fontFamily: HEAD_FONT, fontSize: "1.2rem", fontWeight: 700, color: RED, margin: "0 0 8px" }}>
                Withdraw Consent &amp; Delete Account?
              </h2>
              <p style={{ fontSize: "0.85rem", color: MUTED, marginBottom: "1.25rem", lineHeight: 1.6 }}>
                This will permanently remove your personal details (name, mobile number, date of birth, and photo)
                and deactivate your account. You will no longer be able to log in. Your training completion records
                will be kept, fully anonymized, for compliance purposes only. This cannot be undone.
              </p>
              {withdrawError && <p style={{ color: RED, fontSize: 12, marginBottom: 14 }}>{withdrawError}</p>}
              <button onClick={handleWithdrawConsent} disabled={withdrawing}
                style={{ width: "100%", padding: "0.85rem", background: RED, color: "#fff", border: "none",
                        borderRadius: 10, fontSize: "0.95rem", fontWeight: 600, marginBottom: 10,
                        cursor: withdrawing ? "not-allowed" : "pointer", opacity: withdrawing ? 0.7 : 1 }}>
                {withdrawing ? "Processing…" : "Yes, Withdraw & Delete My Data"}
              </button>
              <button onClick={() => { setShowWithdrawModal(false); setWithdrawError(""); }} disabled={withdrawing}
                style={{ width: "100%", padding: "0.75rem", background: "transparent", color: NAVY,
                        border: "1.5px solid #d8dae8", borderRadius: 10, fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default EHSDashboard;