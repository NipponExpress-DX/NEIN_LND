// src/pages/Kiosk/EHSReports.jsx
// Route: /ehs/admin/reports — super_admin only (linked from
// EHSAdminDashboard's "📊 Reports" nav button).
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API   = process.env.REACT_APP_API_BASE_URL;
const NAVY  = "#1A005D";
const GREEN = "#1A6B3C";

function getSession() {
  try { return JSON.parse(sessionStorage.getItem("ehsAdminSession")); }
  catch { return null; }
}

const fmt = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function EHSReports() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [rows, setRows]       = useState([]);
  const [summary, setSummary] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    from: "", to: "", location_code: "", type: "", status: "", search: "",
  });

  useEffect(() => {
    const s = getSession();
    if (!s?.token || s.role !== "super_admin") {
      navigate("/ehs/admin", { replace: true });
      return;
    }
    setSession(s);
    axios.get(`${API}/ehs/admin/locations`, { headers: { Authorization: `Bearer ${s.token}` } })
      .then(({ data }) => setLocations(data))
      .catch(() => {});
    fetchReport(s.token, filters);
    // eslint-disable-next-line
  }, [navigate]);

  const fetchReport = async (token, f) => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
      const { data } = await axios.get(`${API}/ehs/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` }, params,
      });
      setRows(data.rows || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error("[EHSReports] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));
  const applyFilters = () => fetchReport(session.token, filters);
  const clearFilters = () => {
    const cleared = { from: "", to: "", location_code: "", type: "", status: "", search: "" };
    setFilters(cleared);
    fetchReport(session.token, cleared);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const res = await axios.get(`${API}/ehs/admin/reports/export`, {
        headers: { Authorization: `Bearer ${session.token}` },
        params, responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `EHS_Training_Register_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "Arial, sans-serif" }}>
      <div style={{ background: GREEN, color: "#fff", padding: "14px 28px",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: "bold", fontSize: 16 }}>📊 EHS Training Register — All Locations</span>
        <button onClick={() => navigate("/ehs/admin")}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
                   padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
          ← Back to Dashboard
        </button>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>

        {summary && (
          <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { label: "Total Records", v: summary.total, c: NAVY },
              { label: "Passed",        v: summary.passed, c: GREEN },
              { label: "Failed",        v: summary.failed, c: "#e05252" },
              { label: "Verified",      v: summary.verified, c: GREEN },
              { label: "Pending",       v: summary.pending, c: "#f0a843" },
              { label: "Rejected",      v: summary.rejected, c: "#e05252" },
            ].map(k => (
              <div key={k.label} style={{ flex: "1 1 140px", background: "#fff", border: `2px solid ${k.c}`,
                                          borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: "bold", color: k.c }}>{k.v ?? 0}</div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{k.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", marginBottom: 16,
                      border: "1px solid #e0e0e0", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 11, color: "#888", display: "block" }}>From</label>
            <input type="date" value={filters.from} onChange={e => handleFilterChange("from", e.target.value)}
              style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#888", display: "block" }}>To</label>
            <input type="date" value={filters.to} onChange={e => handleFilterChange("to", e.target.value)}
              style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#888", display: "block" }}>Location</label>
            <select value={filters.location_code} onChange={e => handleFilterChange("location_code", e.target.value)}
              style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}>
              <option value="">All</option>
              {locations.map(l => <option key={l.location_code} value={l.location_code}>{l.location_name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#888", display: "block" }}>Worker Type</label>
            <select value={filters.type} onChange={e => handleFilterChange("type", e.target.value)}
              style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}>
              <option value="">All</option>
              {["Employee", "Customer", "Associate", "Driver", "Others"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#888", display: "block" }}>Verification</label>
            <select value={filters.status} onChange={e => handleFilterChange("status", e.target.value)}
              style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}>
              <option value="">All</option>
              {["Submitted", "Verified", "Pending", "Rejected"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 11, color: "#888", display: "block" }}>Search</label>
            <input placeholder="Name, mobile, emp ID…" value={filters.search}
              onChange={e => handleFilterChange("search", e.target.value)}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6,
                       fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <button onClick={applyFilters}
            style={{ padding: "9px 18px", background: GREEN, color: "#fff", border: "none",
                     borderRadius: 6, fontSize: 13, fontWeight: "bold", cursor: "pointer" }}>
            Apply
          </button>
          <button onClick={clearFilters}
            style={{ padding: "9px 14px", background: "#fff", color: "#888", border: "1px solid #ddd",
                     borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
            Clear
          </button>
          <button onClick={handleExport} disabled={exporting}
            style={{ padding: "9px 18px", background: NAVY, color: "#fff", border: "none",
                     borderRadius: 6, fontSize: 13, fontWeight: "bold", cursor: exporting ? "not-allowed" : "pointer",
                     marginLeft: "auto" }}>
            {exporting ? "Exporting…" : "⬇ Export to Excel"}
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", overflow: "auto" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading records…</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>No records match these filters.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 1000 }}>
              <thead>
                <tr style={{ background: NAVY, color: "#fff" }}>
                  {["#", "Training ID", "Name", "Type", "Location", "Module", "Date", "Score", "Result", "Language"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.completion_id} style={{ borderBottom: "1px solid #f0f0f0",
                                                       background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "10px 12px", color: "#888" }}>{i + 1}</td>
                    <td style={{ padding: "10px 12px" }}>TRN{String(r.completion_id).padStart(6, "0")}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: "bold", color: NAVY }}>{r.full_name || "—"}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>{r.employee_id || r.contact_number || "—"}</div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>{r.visitor_type || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>{r.location_name || r.location_code || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>{r.training_name || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>{fmt(r.completed_at)}</td>
                    <td style={{ padding: "10px 12px", fontWeight: "bold", color: r.score >= 80 ? GREEN : "#c0392b" }}>
                      {r.score != null ? `${r.score}%` : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: r.passed ? GREEN : "#c0392b", fontWeight: "bold" }}>
                      {r.passed ? "Pass" : "Fail"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>{r.language_name || "—"}</td>
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