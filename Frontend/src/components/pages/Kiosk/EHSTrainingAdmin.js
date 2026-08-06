// src/pages/Kiosk/EHSTrainingAdmin.jsx
// Super-admin only. Manage training modules, quiz questions, and
// per-language training videos entirely from the UI — no more
// phpMyAdmin edits to ehs_training_modules / ehs_questions /
// ehs_training_videos.
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useBlockBackNavigation } from "../../../hooks/useBlockBackNavigation";

const API = process.env.REACT_APP_API_BASE_URL;
const NAVY  = "#1A005D";
const GREEN = "#1A6B3C";
const WORKER_TYPES = ["Employee", "Contractor", "Visitor", "Driver", "Customer", "Associate", "Others"];

function getSession() {
  try { return JSON.parse(sessionStorage.getItem("ehsAdminSession")); }
  catch { return null; }
}
function authHeaders(extra = {}) {
  const s = getSession();
  return { Authorization: `Bearer ${s?.token}`, ...extra };
}

const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1px solid #ddd",
  borderRadius: 6, fontSize: 13, boxSizing: "border-box",
};
const labelStyle = { fontSize: 12, fontWeight: "bold", color: "#555", display: "block", marginBottom: 5 };
const btnPrimary = {
  padding: "9px 18px", background: GREEN, color: "#fff", border: "none",
  borderRadius: 6, fontSize: 13, fontWeight: "bold", cursor: "pointer",
};
const btnGhost = {
  padding: "9px 18px", background: "#fff", color: "#555", border: "1px solid #ddd",
  borderRadius: 6, fontSize: 13, cursor: "pointer",
};

export default function EHSTrainingAdmin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("modules"); // modules | questions | videos
  const [modules, setModules] = useState([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState(null);
  useBlockBackNavigation(true, () => false); // always block — same as other flow screens

  useEffect(() => {
    const session = getSession();
    if (!session?.token) { navigate("/ehs/admin/login", { replace: true }); return; }
    if (session.role !== "super_admin") { navigate("/ehs/admin", { replace: true }); return; }
    loadModules();
  }, [navigate]);

  const loadModules = async () => {
    try {
      const { data } = await axios.get(`${API}/ehs/admin/training-modules`, { headers: authHeaders() });
      setModules(data);
      if (data.length && !selectedTrainingId) setSelectedTrainingId(data[0].id);
    } catch (err) {
      console.error("[EHSTrainingAdmin] loadModules error:", err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "Arial, sans-serif" }}>
      <div style={{ background: GREEN, color: "#fff", padding: "14px 28px",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: "bold", fontSize: 16 }}>📚 EHS Admin — Training Content</span>
        <button onClick={() => navigate("/ehs/admin")}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
                   padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
          ← Back to Dashboard
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[
            { key: "modules",   label: "🗂️ Training Modules" },
            { key: "questions", label: "❓ Quiz Questions" },
            { key: "videos",    label: "🎬 Training Videos" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                       border: tab === t.key ? `2px solid ${GREEN}` : "1px solid #ddd",
                       background: tab === t.key ? "#e8f7ee" : "#fff",
                       color: tab === t.key ? GREEN : "#444",
                       fontWeight: tab === t.key ? "bold" : "normal" }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "modules" && <ModulesPanel modules={modules} reload={loadModules} />}
        {tab === "questions" && (
          <QuestionsPanel modules={modules} selectedTrainingId={selectedTrainingId}
                           setSelectedTrainingId={setSelectedTrainingId} />
        )}
        {tab === "videos" && (
          <VideosPanel modules={modules} selectedTrainingId={selectedTrainingId}
                        setSelectedTrainingId={setSelectedTrainingId} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// Training Modules panel
// ============================================================
function ModulesPanel({ modules, reload }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    training_name: "", category: "", applicable_to: [], pass_percentage: 80,
    num_questions: 10, validity_days: 365, video: null,
  });

  const resetForm = () => {
    setForm({ training_name: "", category: "", applicable_to: [], pass_percentage: 80,
               num_questions: 10, validity_days: 365, video: null });
    setEditingId(null); setShowForm(false); setError("");
  };

  const startEdit = (m) => {
    setForm({
      training_name: m.training_name, category: m.category,
      applicable_to: m.applicable_to ? m.applicable_to.split(",") : [],
      pass_percentage: m.pass_percentage, num_questions: m.num_questions,
      validity_days: m.validity_days, video: null,
    });
    setEditingId(m.id);
    setShowForm(true);
  };

  const toggleWorkerType = (t) => {
    setForm(f => ({
      ...f,
      applicable_to: f.applicable_to.includes(t)
        ? f.applicable_to.filter(x => x !== t)
        : [...f.applicable_to, t],
    }));
  };

  const handleSubmit = async () => {
    if (!form.training_name.trim() || !form.category.trim() || !form.applicable_to.length) {
      setError("Name, category and at least one worker type are required."); return;
    }
    setSaving(true); setError("");
    try {
      const payload = new FormData();
      payload.append("training_name", form.training_name.trim());
      payload.append("category", form.category.trim());
      payload.append("applicable_to", form.applicable_to.join(","));
      payload.append("pass_percentage", form.pass_percentage);
      payload.append("num_questions", form.num_questions);
      payload.append("validity_days", form.validity_days);
      if (form.video) payload.append("video", form.video);

      if (editingId) {
        await axios.patch(`${API}/ehs/admin/training-modules/${editingId}`, payload,
          { headers: authHeaders({ "Content-Type": "multipart/form-data" }) });
      } else {
        await axios.post(`${API}/ehs/admin/training-modules`, payload,
          { headers: authHeaders({ "Content-Type": "multipart/form-data" }) });
      }
      resetForm();
      reload();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save training module.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (m) => {
    try {
      await axios.patch(`${API}/ehs/admin/training-modules/${m.id}`,
        { status: m.status === "Active" ? "Inactive" : "Active" }, { headers: authHeaders() });
      reload();
    } catch { alert("Failed to update status."); }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, color: NAVY, fontSize: 15 }}>Training Modules</h3>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
            Each module can carry a default video (English) — add per-language videos in the Videos tab.
          </p>
        </div>
        {!showForm && <button style={btnPrimary} onClick={() => setShowForm(true)}>+ Add Module</button>}
      </div>

      {showForm && (
        <div style={{ padding: "18px 20px", background: "#f9fafc", borderBottom: "1px solid #eee" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Training Name</label>
              <input style={inputStyle} placeholder="e.g. Fire Safety" value={form.training_name}
                onChange={e => setForm(f => ({ ...f, training_name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <input style={inputStyle} placeholder="e.g. Induction, Specialized, Refresher" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Pass Percentage</label>
              <input type="number" style={inputStyle} value={form.pass_percentage}
                onChange={e => setForm(f => ({ ...f, pass_percentage: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Number of Quiz Questions</label>
              <input type="number" style={inputStyle} value={form.num_questions}
                onChange={e => setForm(f => ({ ...f, num_questions: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Validity (days)</label>
              <input type="number" style={inputStyle} value={form.validity_days}
                onChange={e => setForm(f => ({ ...f, validity_days: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Default Video {editingId && "(leave blank to keep existing)"}</label>
              <input type="file" accept="video/*" style={inputStyle}
                onChange={e => setForm(f => ({ ...f, video: e.target.files[0] }))} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Applicable To</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {WORKER_TYPES.map(t => (
                <button key={t} type="button" onClick={() => toggleWorkerType(t)}
                  style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                           border: form.applicable_to.includes(t) ? `2px solid ${GREEN}` : "1px solid #ddd",
                           background: form.applicable_to.includes(t) ? "#e8f7ee" : "#fff",
                           color: form.applicable_to.includes(t) ? GREEN : "#555" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {error && <p style={{ color: "#c0392b", fontSize: 12, marginBottom: 10 }}>{error}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button style={btnPrimary} onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Module"}
            </button>
            <button style={btnGhost} onClick={resetForm} disabled={saving}>Cancel</button>
          </div>
        </div>
      )}

      {modules.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>No training modules yet.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: NAVY, color: "#fff" }}>
              {["Name", "Category", "Pass %", "Questions", "Validity", "Video", "Status", ""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((m, i) => (
              <tr key={m.id} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 ? "#fafafa" : "#fff" }}>
                <td style={{ padding: "10px 14px", fontWeight: "bold", color: NAVY }}>{m.training_name}</td>
                <td style={{ padding: "10px 14px" }}>{m.category}</td>
                <td style={{ padding: "10px 14px" }}>{m.pass_percentage}%</td>
                <td style={{ padding: "10px 14px" }}>{m.num_questions}</td>
                <td style={{ padding: "10px 14px" }}>{m.validity_days}d</td>
                <td style={{ padding: "10px 14px" }}>{m.video_path ? "✓" : "—"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: "bold",
                                 background: m.status === "Active" ? "#edf9f0" : "#fff0f0",
                                 color: m.status === "Active" ? GREEN : "#912b2b" }}>
                    {m.status}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", display: "flex", gap: 8 }}>
                  <button onClick={() => startEdit(m)} style={{ ...btnGhost, padding: "5px 12px" }}>Edit</button>
                  <button onClick={() => toggleStatus(m)}
                    style={{ ...btnGhost, padding: "5px 12px", color: m.status === "Active" ? "#c0392b" : GREEN }}>
                    {m.status === "Active" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ============================================================
// Quiz Questions panel
// ============================================================
function QuestionsPanel({ modules, selectedTrainingId, setSelectedTrainingId }) {
  const [languages, setLanguages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    language_id: "", question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_ans: "A",
  });

  useEffect(() => {
    axios.get(`${API}/ehs/languages`, { headers: authHeaders() }).then(({ data }) => setLanguages(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedTrainingId) loadQuestions();
  }, [selectedTrainingId]); // eslint-disable-line

  const loadQuestions = async () => {
    try {
      const { data } = await axios.get(`${API}/ehs/admin/questions`,
        { params: { training_id: selectedTrainingId }, headers: authHeaders() });
      setQuestions(data);
    } catch (err) { console.error("[QuestionsPanel] load error:", err); }
  };

  const resetForm = () => {
    setForm({ language_id: "", question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_ans: "A" });
    setEditingId(null); setShowForm(false); setError("");
  };

  const startEdit = (q) => {
    setForm({
      language_id: q.language_id || "", question: q.question,
      option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d,
      correct_ans: q.correct_ans,
    });
    setEditingId(q.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.question.trim() || !form.option_a.trim() || !form.option_b.trim() || !form.option_c.trim() || !form.option_d.trim()) {
      setError("Question and all four options are required."); return;
    }
    setSaving(true); setError("");
    try {
      const payload = { ...form, training_id: selectedTrainingId, language_id: form.language_id || null };
      if (editingId) {
        await axios.patch(`${API}/ehs/admin/questions/${editingId}`, payload, { headers: authHeaders() });
      } else {
        await axios.post(`${API}/ehs/admin/questions`, payload, { headers: authHeaders() });
      }
      resetForm();
      loadQuestions();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save question.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (q) => {
    if (!window.confirm("Delete this question permanently?")) return;
    try {
      await axios.delete(`${API}/ehs/admin/questions/${q.id}`, { headers: authHeaders() });
      loadQuestions();
    } catch { alert("Failed to delete question."); }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee",
                    display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, color: NAVY, fontSize: 15 }}>Quiz Questions</h3>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
            Leave language blank to show a question for every language (fallback).
          </p>
        </div>
        <select style={{ ...inputStyle, width: 220 }} value={selectedTrainingId || ""}
          onChange={e => setSelectedTrainingId(Number(e.target.value))}>
          {modules.map(m => <option key={m.id} value={m.id}>{m.training_name}</option>)}
        </select>
        {!showForm && <button style={btnPrimary} onClick={() => setShowForm(true)}>+ Add Question</button>}
      </div>

      {showForm && (
        <div style={{ padding: "18px 20px", background: "#f9fafc", borderBottom: "1px solid #eee" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Language (optional — blank = all languages)</label>
            <select style={inputStyle} value={form.language_id}
              onChange={e => setForm(f => ({ ...f, language_id: e.target.value }))}>
              <option value="">All languages</option>
              {languages.map(l => <option key={l.id} value={l.id}>{l.language_name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Question</label>
            <input style={inputStyle} value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {["A", "B", "C", "D"].map(letter => (
              <div key={letter}>
                <label style={labelStyle}>Option {letter}</label>
                <input style={inputStyle} value={form[`option_${letter.toLowerCase()}`]}
                  onChange={e => setForm(f => ({ ...f, [`option_${letter.toLowerCase()}`]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Correct Answer</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["A", "B", "C", "D"].map(letter => (
                <button key={letter} type="button" onClick={() => setForm(f => ({ ...f, correct_ans: letter }))}
                  style={{ width: 36, height: 36, borderRadius: 6, cursor: "pointer", fontWeight: "bold",
                           border: form.correct_ans === letter ? `2px solid ${GREEN}` : "1px solid #ddd",
                           background: form.correct_ans === letter ? "#e8f7ee" : "#fff",
                           color: form.correct_ans === letter ? GREEN : "#555" }}>
                  {letter}
                </button>
              ))}
            </div>
          </div>
          {error && <p style={{ color: "#c0392b", fontSize: 12, marginBottom: 10 }}>{error}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button style={btnPrimary} onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save Changes" : "Add Question"}
            </button>
            <button style={btnGhost} onClick={resetForm} disabled={saving}>Cancel</button>
          </div>
        </div>
      )}

      {questions.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>No questions yet for this module.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: NAVY, color: "#fff" }}>
              {["Language", "Question", "Correct", "Status", ""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {questions.map((q, i) => (
              <tr key={q.id} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 ? "#fafafa" : "#fff" }}>
                <td style={{ padding: "10px 14px" }}>{q.language_name || "All"}</td>
                <td style={{ padding: "10px 14px", maxWidth: 400 }}>{q.question}</td>
                <td style={{ padding: "10px 14px", fontWeight: "bold" }}>{q.correct_ans}</td>
                <td style={{ padding: "10px 14px" }}>{q.status}</td>
                <td style={{ padding: "10px 14px", display: "flex", gap: 8 }}>
                  <button onClick={() => startEdit(q)} style={{ ...btnGhost, padding: "5px 12px" }}>Edit</button>
                  <button onClick={() => handleDelete(q)} style={{ ...btnGhost, padding: "5px 12px", color: "#c0392b" }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ============================================================
// Training Videos panel (per language)
// ============================================================
function VideosPanel({ modules, selectedTrainingId, setSelectedTrainingId }) {
  const [languages, setLanguages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [uploadingLang, setUploadingLang] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`${API}/ehs/languages`, { headers: authHeaders() }).then(({ data }) => setLanguages(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedTrainingId) loadVideos();
  }, [selectedTrainingId]); // eslint-disable-line

  const loadVideos = async () => {
    try {
      const { data } = await axios.get(`${API}/ehs/admin/training-videos`,
        { params: { training_id: selectedTrainingId }, headers: authHeaders() });
      setVideos(data);
    } catch (err) { console.error("[VideosPanel] load error:", err); }
  };

  const videoForLang = (langId) => videos.find(v => v.language_id === langId);

  const handleUpload = async (langId, file) => {
    if (!file) return;
    setUploadingLang(langId); setError("");
    try {
      const payload = new FormData();
      payload.append("training_id", selectedTrainingId);
      payload.append("language_id", langId);
      payload.append("video", file);
      await axios.post(`${API}/ehs/admin/training-videos`, payload,
        { headers: authHeaders({ "Content-Type": "multipart/form-data" }) });
      loadVideos();
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed.");
    } finally {
      setUploadingLang(null);
    }
  };

  const handleDelete = async (v) => {
    if (!window.confirm(`Remove the ${v.language_name} video for this module?`)) return;
    try {
      await axios.delete(`${API}/ehs/admin/training-videos/${v.id}`, { headers: authHeaders() });
      loadVideos();
    } catch { alert("Failed to delete video."); }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee",
                    display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, color: NAVY, fontSize: 15 }}>Training Videos</h3>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
            Upload one video per language for this module. Languages without a video here fall back to English.
          </p>
        </div>
        <select style={{ ...inputStyle, width: 220 }} value={selectedTrainingId || ""}
          onChange={e => setSelectedTrainingId(Number(e.target.value))}>
          {modules.map(m => <option key={m.id} value={m.id}>{m.training_name}</option>)}
        </select>
      </div>

      {error && <p style={{ color: "#c0392b", fontSize: 12, padding: "10px 20px" }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: NAVY, color: "#fff" }}>
            {["Language", "Video", ""].map(h => (
              <th key={h} style={{ padding: "10px 14px", textAlign: "left" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {languages.map((l, i) => {
            const v = videoForLang(l.id);
            return (
              <tr key={l.id} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 ? "#fafafa" : "#fff" }}>
                <td style={{ padding: "10px 14px", fontWeight: "bold", color: NAVY }}>{l.language_name}</td>
                <td style={{ padding: "10px 14px" }}>
                  {v ? <span style={{ color: GREEN, fontSize: 12 }}>✓ {v.video_path.split("/").pop()}</span>
                     : <span style={{ color: "#aaa", fontSize: 12 }}>No video uploaded</span>}
                </td>
                <td style={{ padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{ ...btnGhost, padding: "5px 12px", cursor: uploadingLang === l.id ? "not-allowed" : "pointer" }}>
                    {uploadingLang === l.id ? "Uploading…" : v ? "Replace" : "Upload"}
                    <input type="file" accept="video/*" style={{ display: "none" }}
                      disabled={uploadingLang === l.id}
                      onChange={e => handleUpload(l.id, e.target.files[0])} />
                  </label>
                  {v && (
                    <button onClick={() => handleDelete(v)} style={{ ...btnGhost, padding: "5px 12px", color: "#c0392b" }}>
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}