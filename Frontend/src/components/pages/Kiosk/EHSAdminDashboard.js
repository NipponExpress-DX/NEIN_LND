// src/pages/Kiosk/EHSAdminDashboard.jsx
// Read-only view of induction completions — no approval step.
// Every passed induction is auto-recorded as 'Submitted'; there's
// nothing for HR/super admin to approve or reject here.
// Calls GET /ehs/admin/dashboard using the ehs_admin_users session.
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useBlockBackNavigation } from "../../../hooks/useBlockBackNavigation";

const API = process.env.REACT_APP_API_BASE_URL;

const fmt = d => d ? new Date(d).toLocaleDateString("en-IN",
  { day: "2-digit", month: "short", year: "numeric" }) : "—";

function getSession() {
  try { return JSON.parse(sessionStorage.getItem("ehsAdminSession")); }
  catch { return null; }
}

export default function EHSAdminDashboard({ embedded = false }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("All"); // All | Employee | Customer | Associate | Driver | Others
  const [search, setSearch]   = useState("");
  useBlockBackNavigation(true, () => false); // always block — same as other flow screens

  useEffect(() => {
    const s = getSession();
    if (!s?.token) {
      navigate("/ehs/admin/login", { replace: true });
      return;
    }
    setSession(s);
    fetchRecords(s.token);
  }, [navigate]);

  const fetchRecords = async (token) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/ehs/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(data.completions || []);
    } catch (err) {
      console.error("[EHSAdmin] fetch error:", err);
      if (err.response?.status === 401) {
        sessionStorage.removeItem("ehsAdminSession");
        navigate("/ehs/admin/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  function getWorkerSession() {
    try { return JSON.parse(sessionStorage.getItem("ehsWorkerSession")); }
    catch { return null; }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("ehsAdminSession");
    navigate("/ehs/admin/login", { replace: true });
  };

  const filtered = records.filter(r => {
    const matchType = typeFilter === "All" || r.visitor_type === typeFilter;
    const matchSearch = !search ||
      r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.contact_number?.includes(search);
    return matchType && matchSearch;
  });

  const passedCount = records.filter(r => r.passed).length;
  const failedCount = records.length - passedCount;

  const isSuperAdmin = session?.role === "super_admin";
  const workerSession = getWorkerSession();
  const hasWorkerAccess = !!workerSession?.visitor_id;

  const handleSwitchToWorker = () => {
    navigate(`/ehs/dashboard/${workerSession.visitor_id}`);
  };

  return (
  <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "Arial, sans-serif" }}>

    {/* Top bar — standalone route only */}
    {!embedded && (
      <div style={{ background: "#1A6B3C", color: "#fff", padding: "14px 28px",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontWeight: "bold", fontSize: 16 }}>🛡️ EHS Admin — Induction Submissions</span>
          {session && (
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
                {session.full_name} · Super Admin — all warehouses
              </div>
            )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
            {hasWorkerAccess && (
              <button onClick={handleSwitchToWorker}
                style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
                        padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>
                👤 Switch to My Training
              </button>
            )}
            <button onClick={handleLogout}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
                      padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
              Sign Out
            </button>
          </div>
      </div>
    )}

    {/* Secondary admin nav — always rendered (standalone AND embedded).
        Super admins get the extra warehouse/HR/reports links; everyone
        with admin access gets Change Password here. */}
    <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "10px 16px",
                  display: "flex", gap: 10, flexWrap: "wrap" }}>
      {isSuperAdmin && (
        <>
          <button onClick={() => navigate("/ehs/admin/warehouses")}
            style={{ background: "#f4f6fb", border: "1px solid #ddd", color: "#1A005D",
                     padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>
            🏭 Warehouses &amp; Kiosks
          </button>
          <button onClick={() => navigate("/ehs/admin/users")}
            style={{ background: "#f4f6fb", border: "1px solid #ddd", color: "#1A005D",
                     padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>
              👥 Manage Admins
          </button>
          <button onClick={() => navigate("/ehs/admin/reports")}
            style={{ background: "#f4f6fb", border: "1px solid #ddd", color: "#1A005D",
                     padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>
            📊 Reports
          </button>
          <button onClick={() => navigate("/ehs/admin/training-content")}
              style={{ background: "#f4f6fb", border: "1px solid #ddd", color: "#1A005D",
                      padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>
              📚 Training Content
            </button>
        </>
      )}
      <button onClick={() => navigate("/ehs/admin/change-password")}
        style={{ background: "#f4f6fb", border: "1px solid #ddd", color: "#1A005D",
                 padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>
        🔑 Change Password
      </button>
    </div>

    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>

        {/* KPI strip */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Records", count: records.length, color: "#1A005D" },
            { label: "Passed",        count: passedCount,     color: "#1A6B3C" },
            { label: "Failed",        count: failedCount,     color: "#e05252" },
          ].map(k => (
            <div key={k.label} style={{ flex: 1, background: "#fff", border: `2px solid ${k.color}`,
                                        borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: "bold", color: k.color }}>{k.count}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px",
                      marginBottom: 16, display: "flex", gap: 12, alignItems: "center",
                      flexWrap: "wrap", border: "1px solid #e0e0e0" }}>
          <input
            placeholder="Search by name, emp ID, or mobile…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: "8px 12px", border: "1px solid #ddd",
                     borderRadius: 6, fontSize: 13 }}
          />
          {["All", "Employee", "Customer", "Associate", "Driver", "Others"].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              style={{ padding: "7px 16px", borderRadius: 6, fontSize: 13, cursor: "pointer",
                       border: typeFilter === t ? "2px solid #1A6B3C" : "1px solid #ddd",
                       background: typeFilter === t ? "#e8f7ee" : "#fff",
                       color: typeFilter === t ? "#1A6B3C" : "#444",
                       fontWeight: typeFilter === t ? "bold" : "normal" }}>
              {t}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading records…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
              No records found.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#1A005D", color: "#fff" }}>
                  {["#", "Worker", "Type", "Module", "Score", "Date", "Result"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: "bold" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                    <tr key={r.completion_id}
                      style={{ borderBottom: "1px solid #f0f0f0",
                               background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "12px 14px", color: "#888" }}>{i + 1}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: "bold", color: "#1A005D" }}>{r.full_name}</div>
                        <div style={{ fontSize: 11, color: "#888" }}>
                          {r.employee_id || r.contact_number || "—"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11,
                                       background: r.visitor_type === "Employee" ? "#e8f3ff" : "#f0f0f0",
                                       color: r.visitor_type === "Employee" ? "#1A005D" : "#555" }}>
                          {r.visitor_type || "Visitor"}
                        </span>
                      </td>
                     <td style={{ padding: "12px 14px", color: "#333" }}>{r.training_name || "—"}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontWeight: "bold",
                                       color: r.score >= 80 ? "#1A6B3C" : "#c0392b" }}>
                          {r.score != null ? `${r.score}%` : "—"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#555" }}>{fmt(r.completed_at)}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ padding: "4px 12px", borderRadius: 12, fontSize: 11, fontWeight: "bold",
                                       background: r.passed ? "#edf9f0" : "#fff0f0",
                                       color: r.passed ? "#1a6b3c" : "#912b2b" }}>
                          {r.passed ? "✓ Pass" : "✕ Fail"}
                        </span>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}