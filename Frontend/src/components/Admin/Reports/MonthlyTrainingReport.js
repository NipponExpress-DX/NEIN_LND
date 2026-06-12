import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import '../../../css/Admincss/Reports.css';

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress,
  Autocomplete,
  Checkbox,
  Chip,
  Tooltip,
  Divider,
  IconButton,
  TableSortLabel,
} from "@mui/material";
import { DownloadIcon, RefreshCwIcon, XIcon } from "lucide-react";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import axios from "axios";
import logo from "../../../images/NEIN-Logo.jpg";

// ─── helpers ─────────────────────────────────────────────────────────────────
const MONTHS = [
  { id: 1,  name: "January"   }, { id: 2,  name: "February" },
  { id: 3,  name: "March"     }, { id: 4,  name: "April"    },
  { id: 5,  name: "May"       }, { id: 6,  name: "June"     },
  { id: 7,  name: "July"      }, { id: 8,  name: "August"   },
  { id: 9,  name: "September" }, { id: 10, name: "October"  },
  { id: 11, name: "November"  }, { id: 12, name: "December" },
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => ({
  id: currentYear - 2 + i,
  name: String(currentYear - 2 + i),
}));

const statusColor = (status = "") => {
  const s = status.toLowerCase();
  if (s === "training created")   return "#FF9800";
  if (s === "training scheduled") return "#2196F3";
  if (s === "training conducted") return "#9C27B0";
  if (s === "feedback assigned")  return "#00BCD4";
  if (s === "final submitted" || s === "session closed") return "#4CAF50";
  return "#757575";
};

const toInputDate   = (dmy) => { if (!dmy) return ""; const [d, m, y] = dmy.split("-"); return `${y}-${m}-${d}`; };
const fromInputDate = (iso) => { if (!iso) return ""; const [y, m, d] = iso.split("-"); return `${d}-${m}-${y}`; };

// Parse dd-mm-yyyy to a Date for sorting
const parseDMY = (dmy) => {
  if (!dmy) return new Date(0);
  const [d, m, y] = dmy.split("-");
  return new Date(`${y}-${m}-${d}`);
};

// Generic comparator
const compareValues = (a, b, orderBy) => {
  const av = a[orderBy] ?? "";
  const bv = b[orderBy] ?? "";

  // Numeric fields
  const numericFields = ["no_of_sessions", "trainee_count", "attended_count", "feedback_submitted", "feedback_pending", "no_of_hours"];
  if (numericFields.includes(orderBy)) {
    return Number(av) - Number(bv);
  }

  // Date fields
  if (orderBy === "training_date") {
    return parseDMY(av) - parseDMY(bv);
  }

  // String
  return String(av).toLowerCase().localeCompare(String(bv).toLowerCase());
};

const stableSort = (array, comparator) => {
  const indexed = array.map((el, idx) => [el, idx]);
  indexed.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    return order !== 0 ? order : a[1] - b[1];
  });
  return indexed.map((el) => el[0]);
};

const getComparator = (order, orderBy) =>
  order === "desc"
    ? (a, b) => -compareValues(a, b, orderBy)
    : (a, b) =>  compareValues(a, b, orderBy);

// ─── Stage summary box ────────────────────────────────────────────────────────
const StageBox = ({ label, count, color }) => (
  <Box sx={{
    border: `2px solid ${color}`,
    borderRadius: 1,
    p: 1.5,
    textAlign: "center",
    minWidth: 120,
    flex: "1 1 120px",
  }}>
    <Typography variant="caption" sx={{ color: "#555", display: "block" }}>{label}</Typography>
    <Typography variant="h5" sx={{ fontWeight: "bold", color }}>{count}</Typography>
  </Box>
);

// ─── Sortable header cell ─────────────────────────────────────────────────────
const SortableCell = ({ col, order, orderBy, onSort }) => (
  <TableCell
    align={col.align}
    sortDirection={orderBy === col.id ? order : false}
    sx={{
      bgcolor: "#1A005D",
      color: "#fff",
      fontWeight: "bold",
      fontSize: "0.78rem",
      whiteSpace: "nowrap",
      py: 1,
      minWidth: col.minW,
      "& .MuiTableSortLabel-root": { color: "#fff !important" },
      "& .MuiTableSortLabel-root:hover": { color: "#8EC400 !important" },
      "& .MuiTableSortLabel-root.Mui-active": { color: "#8EC400 !important" },
      "& .MuiTableSortLabel-icon": { color: "#8EC400 !important" },
    }}
  >
    <TableSortLabel
      active={orderBy === col.id}
      direction={orderBy === col.id ? order : "asc"}
      onClick={() => onSort(col.id)}
    >
      {col.label}
    </TableSortLabel>
  </TableCell>
);

// ─── Table column definitions ─────────────────────────────────────────────────
const TABLE_COLS = [
  { id: "training_date",      label: "Training Date",   align: "center", minW: 110 },
  { id: "training_ref_no",    label: "Ref No",          align: "left",   minW: 110 },
  { id: "department",         label: "Department",      align: "left",   minW: 140 },
  { id: "branch",             label: "Branch",          align: "left",   minW: 100 },
  { id: "no_of_sessions",     label: "Sessions",        align: "center", minW: 80  },
  { id: "training_topic",     label: "Training Topic",  align: "left",   minW: 150 },
  { id: "session_title",      label: "Session Title",   align: "left",   minW: 160 },
  { id: "type_of_training",   label: "Type",            align: "center", minW: 100 },
  { id: "mode",               label: "Mode",            align: "center", minW: 90  },
  { id: "trainer_display",    label: "Trainer",         align: "left",   minW: 180 }, // ← name + Internal/External badge + dept
 
  { id: "trainee_count",      label: "Enrolled",        align: "center", minW: 80  },
  { id: "attended_count",     label: "Attended",        align: "center", minW: 80  },
  { id: "training_status",    label: "Status",          align: "center", minW: 140 },
  { id: "feedback_submitted", label: "Feedback ✓",      align: "center", minW: 100 },
  { id: "feedback_pending",   label: "Feedback ⏳",     align: "center", minW: 100 },
  { id: "created_by",         label: "Created By",      align: "left",   minW: 130 },
  { id: "coordinator_names",  label: "Coordinator(s)",  align: "left",   minW: 150 },
  { id: "no_of_hours",        label: "Hours",           align: "center", minW: 70  },
];

// ═══════════════════════════════════════════════════════════════════════════════
const MonthlyTrainingReport = () => {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const { isSidebarCollapsed } = useOutletContext() || {};

  const [rows,         setRows]         = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [branches,     setBranches]     = useState([]);
  const [departments,  setDepartments]  = useState([]);

  const currentMonth = new Date().getMonth() + 1;

  const [filters, setFilters] = useState({
    month: MONTHS.find(m => m.id === currentMonth) ?? null,  // ← default to current month
    year:  YEARS.find(y => y.id === currentYear) ?? null,
    fromDate: "", toDate: "",
    branch: [], department: [],
    search: "",
  });

  const [page,        setPage]        = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── sorting state ───────────────────────────────────────────────────────────
  const [order,   setOrder]   = useState("asc");
  const [orderBy, setOrderBy] = useState("training_date");

  const handleSort = (colId) => {
    const isAsc = orderBy === colId && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(colId);
    setPage(0);
  };

  // ── filter options ──────────────────────────────────────────────────────────
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/reports/monthly-training-report/filter-options`)
      .then((r) => { setBranches(r.data.branches || []); setDepartments(r.data.departments || []); })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── stable deps for fetchData ───────────────────────────────────────────────
  const monthId       = filters.month?.id  ?? null;
  const yearId        = filters.year?.id   ?? null;
  const fromDate      = filters.fromDate;
  const toDate        = filters.toDate;
  const branchIds     = JSON.stringify(filters.branch.map((b) => b.id));
  const departmentIds = JSON.stringify(filters.department.map((d) => d.id));

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = {};

      if (monthId)  payload.month = monthId;

      // ✅ Always send year — fallback to current year if user cleared it
      payload.year = yearId ?? new Date().getFullYear();

      if (fromDate) payload.from_date = fromDate;
      if (toDate)   payload.to_date   = toDate;

      const bIds = JSON.parse(branchIds);
      const dIds = JSON.parse(departmentIds);
      if (bIds.length) payload.branch_list     = bIds.join(",");
      if (dIds.length) payload.department_list = dIds.join(",");

      const res = await axios.post(`${API_BASE_URL}/reports/monthly-training-report`, payload);
      setRows(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [monthId, yearId, fromDate, toDate, branchIds, departmentIds, API_BASE_URL]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── client-side search ──────────────────────────────────────────────────────
  useEffect(() => {
    const q = filters.search.trim().toLowerCase();
    setFilteredRows(
      q ? rows.filter((r) => Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q)))
        : rows
    );
    setPage(0);
  }, [rows, filters.search]);

  // ── sorted rows (applied on top of filteredRows) ────────────────────────────
  const sortedRows = stableSort(filteredRows, getComparator(order, orderBy));

  // ── stage counts ────────────────────────────────────────────────────────────
  const computedStage = filteredRows.reduce(
    (acc, r) => {
      const s = (r.training_status || "").toLowerCase();
      if      (s === "training created")                              acc.s1++;
      else if (s === "training scheduled")                            acc.s2++;
      else if (s === "training conducted")                            acc.s3++;
      else if (s === "feedback assigned")                             acc.s4++;
      else if (s === "final submitted" || s === "session closed")     acc.s5++;
      return acc;
    },
    { s1: 0, s2: 0, s3: 0, s4: 0, s5: 0 }
  );

  const setF = (key, val) => setFilters((p) => ({ ...p, [key]: val }));
  const clearFilters = () => setFilters({
      month: null,
      year: YEARS.find(y => y.id === currentYear) ?? null,  
      fromDate: "", toDate: "",
      branch: [], department: [],
      search: "",
  });
  const hasFilters = filters.month || filters.year || filters.fromDate || filters.toDate ||
    filters.branch.length || filters.department.length || filters.search;

  // ── Excel export ────────────────────────────────────────────────────────────
  const exportToExcel = async () => {
    try {
      setLoading(true);
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Monthly Training Report", {
        views: [{ state: "frozen", ySplit: 6, showGridLines: false }],
      });
      const colDefs = [
        { key: "training_date",      header: "Training Date",      width: 14 },
        { key: "department",         header: "Department",         width: 22 },
        { key: "branch",             header: "Branch",             width: 22 },
        { key: "no_of_sessions",     header: "No Of Sessions",     width: 13 },
        { key: "training_topic",     header: "Training Topic",     width: 24 },
        { key: "session_title",      header: "Session Title",      width: 28 },
        { key: "type_of_training",   header: "Type Of Training",   width: 16 },
        { key: "mode",               header: "Mode",               width: 12 },
        { key: "trainer_display",    header: "Trainer",            width: 22 }, // ← updated key
        { key: "trainer_type",       header: "Trainer Type",       width: 14 }, // ← Internal/External
        { key: "trainer_department", header: "Trainer Dept",       width: 22 }, // ← new
       
        { key: "trainee_count",      header: "Enrolled",           width: 12 },
        { key: "attended_count",     header: "Attended",           width: 12 },
        { key: "training_status",    header: "Training Status",    width: 20 },
        { key: "feedback_submitted", header: "Feedback Submitted", width: 18 },
        { key: "feedback_pending",   header: "Feedback Pending",   width: 16 },
        { key: "created_by",         header: "Created By",         width: 18 },
        { key: "coordinator_names",  header: "Coordinator(s)",     width: 24 },
        { key: "no_of_hours",        header: "No Of Hours",        width: 12 },
      ];
      ws.columns = colDefs.map((c) => ({ key: c.key, width: c.width }));

      // ── Logo row ──
      ws.getRow(1).height = 50;
      try {
        const resp = await fetch(logo);
        const blob = await resp.blob();
        const b64  = await new Promise((res) => { const fr = new FileReader(); fr.onloadend = () => res(fr.result.split(",")[1]); fr.readAsDataURL(blob); });
        ws.addImage(wb.addImage({ base64: b64, extension: "jpeg" }), { tl: { col: 0, row: 0 }, ext: { width: 120, height: 46 } });
      } catch (_) {}

      const totalCols = colDefs.length;
      const lastColLetter = String.fromCharCode(64 + totalCols);

      ws.mergeCells(`B1:${lastColLetter}1`);
      Object.assign(ws.getCell("B1"), {
        value: "Nippon Express (India) Pvt. Ltd.",
        font: { bold: true, size: 16, name: "Arial" },
        alignment: { horizontal: "center", vertical: "middle" },
      });

      ws.getRow(2).height = 22;
      ws.mergeCells(`A2:${lastColLetter}2`);
      Object.assign(ws.getCell("A2"), {
        value: "HUMAN RESOURCE DEVELOPMENT DEPARTMENT",
        font: { bold: true, size: 13, name: "Arial" },
        alignment: { horizontal: "center", vertical: "middle" },
      });

      ws.getRow(3).height = 20;
      const periodLabel = (() => {
        if (filters.month && filters.year) return `Monthly Training Report – ${filters.month.name} ${filters.year.name}`;
        if (filters.fromDate && filters.toDate) return `Training Report: ${filters.fromDate} to ${filters.toDate}`;
        if (filters.month) return `Monthly Training Report – ${filters.month.name}`;
        if (filters.year)  return `Training Report – ${filters.year.name}`;
        return "Monthly Training Report";
      })();
      ws.mergeCells(`A3:${lastColLetter}3`);
      Object.assign(ws.getCell("A3"), {
        value: periodLabel,
        font: { size: 11, name: "Arial" },
        alignment: { horizontal: "center", vertical: "middle" },
      });

      ws.getRow(4).height = 22;
      ws.mergeCells(`A4:${lastColLetter}4`);
      Object.assign(ws.getCell("A4"), {
        value: periodLabel,
        font: { bold: true, size: 12, color: { argb: "FFFFFFFF" }, name: "Arial" },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A005D" } },
        alignment: { horizontal: "center", vertical: "middle" },
      });

      ws.getRow(5).height = 4;

      // ── Header row ──
      const hdrRow = ws.addRow(colDefs.map((c) => c.header));
      hdrRow.height = 30;
      hdrRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A005D" } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10, name: "Arial" };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      });

      const centerColKeys = new Set(["training_date", "no_of_sessions", "mode", "trainee_count", "attended_count",
        "type_of_training", "feedback_submitted", "feedback_pending", "no_of_hours"]);

      // Export the currently-sorted data
      const exportRows = stableSort(filteredRows, getComparator(order, orderBy));
      exportRows.forEach((item, idx) => {
        const row = ws.addRow(colDefs.map((c) => item[c.key] ?? ""));
        row.eachCell((cell, colNo) => {
          cell.font = { name: "Arial", size: 10 };
          cell.alignment = { vertical: "middle", wrapText: true };
          if (idx % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F4FF" } };
          cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
          const key = colDefs[colNo - 1]?.key;
          if (centerColKeys.has(key)) cell.alignment = { horizontal: "center", vertical: "middle" };
        });
      });

      // ── Stage summary footer ──
      ws.addRow([]);
      const stageLabels = [
        { label: "Total Training",              val: filteredRows.length },
        { label: "Stage 1\nTraining Created",   val: computedStage.s1 },
        { label: "Stage 2\nTraining Scheduled", val: computedStage.s2 },
        { label: "Stage 3\nTraining Conducted", val: computedStage.s3 },
        { label: "Stage 4\nFeedback Assigned",  val: computedStage.s4 },
        { label: "Stage 5\nSubmitted/Closed",   val: computedStage.s5 },
      ];
      const labelRow = ws.addRow(["", ...stageLabels.map((s) => s.label)]);
      labelRow.height = 30;
      stageLabels.forEach((_, i) => {
        const c = labelRow.getCell(i + 2);
        c.font = { bold: true, size: 10, name: "Arial" };
        c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EAF6" } };
        c.border = { top: { style: "medium" }, left: { style: "medium" }, bottom: { style: "thin" }, right: { style: "medium" } };
      });
      const valRow = ws.addRow(["", ...stageLabels.map((s) => s.val)]);
      valRow.height = 28;
      stageLabels.forEach((s, i) => {
        const c = valRow.getCell(i + 2);
        c.value = s.val;
        c.font = { bold: true, size: 16, name: "Arial", color: { argb: "FF1A005D" } };
        c.alignment = { horizontal: "center", vertical: "middle" };
        c.border = { top: { style: "thin" }, left: { style: "medium" }, bottom: { style: "medium" }, right: { style: "medium" } };
      });

      saveAs(new Blob([await wb.xlsx.writeBuffer()]), `${periodLabel.replace(/[^a-z0-9]/gi, "_")}.xlsx`);
    } catch (e) {
      console.error("Export error:", e);
      setError("Export failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="admin-dashboard-content">
      <div className="reports">

        {/* ── Top Bar ── */}
        <Box sx={{
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
          bgcolor: "#1A005D", px: 2, py: 1,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "9px",
        }}>
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: "bold", textAlign: "center", width: "100%" }}>
            Monthly Training Report
          </Typography>
          <Box sx={{ display: "flex", gap: 1, position: "absolute", right: 16 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchData} size="small" sx={{ color: "#fff" }}>
                <RefreshCwIcon size={18} />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained" size="small"
              startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon size={16} />}
              onClick={exportToExcel}
              disabled={loading || filteredRows.length === 0}
              sx={{ bgcolor: "#8EC400", "&:hover": { bgcolor: "#7EB300" }, textTransform: "none" }}
            >
              Export Excel
            </Button>
          </Box>
        </Box>

        {/* ── Filters Row ── */}
        <Box sx={{
          display: "flex", flexWrap: "wrap", gap: 1.5,
          alignItems: "center", mb: 2, p: 1.5,
          bgcolor: "#f5f5f5", borderRadius: 1, border: "1px solid #e0e0e0",
        }}>
          <Autocomplete size="small" options={MONTHS} value={filters.month}
            onChange={(_, v) => setF("month", v)} getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(p) => <TextField {...p} label="Month" sx={{ width: 150 }} />}
          />
          <Autocomplete size="small" options={YEARS} value={filters.year}
            onChange={(_, v) => setF("year", v)} getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(p) => <TextField {...p} label="Year" sx={{ width: 110 }} />}
          />
          <Divider orientation="vertical" flexItem />
          <TextField type="date" size="small" label="From Date" InputLabelProps={{ shrink: true }}
            value={toInputDate(filters.fromDate)} onChange={(e) => setF("fromDate", fromInputDate(e.target.value))}
            sx={{ width: 160 }}
          />
          <TextField type="date" size="small" label="To Date" InputLabelProps={{ shrink: true }}
            value={toInputDate(filters.toDate)} onChange={(e) => setF("toDate", fromInputDate(e.target.value))}
            sx={{ width: 160 }}
          />
          <Divider orientation="vertical" flexItem />
          <Autocomplete multiple size="small" options={branches} value={filters.branch}
            onChange={(_, v) => setF("branch", v)} disableCloseOnSelect
            getOptionLabel={(o) => o.name} isOptionEqualToValue={(a, b) => a.id === b.id}
            renderOption={(props, option, { selected }) => (<li {...props}><Checkbox size="small" checked={selected} />{option.name}</li>)}
            renderTags={(val) => val.length === 1 ? <Chip size="small" label={val[0].name} /> : <Chip size="small" label={`${val.length} branches`} />}
            renderInput={(p) => <TextField {...p} label="Branch" placeholder={filters.branch.length ? "" : "All"} />}
            sx={{ minWidth: 180 }}
          />
          <Autocomplete multiple size="small" options={departments} value={filters.department}
            onChange={(_, v) => setF("department", v)} disableCloseOnSelect
            getOptionLabel={(o) => o.name} isOptionEqualToValue={(a, b) => a.id === b.id}
            renderOption={(props, option, { selected }) => (<li {...props}><Checkbox size="small" checked={selected} />{option.name}</li>)}
            renderTags={(val) => val.length === 1 ? <Chip size="small" label={val[0].name} /> : <Chip size="small" label={`${val.length} depts`} />}
            renderInput={(p) => <TextField {...p} label="Department" placeholder={filters.department.length ? "" : "All"} />}
            sx={{ minWidth: 180 }}
          />
          <Divider orientation="vertical" flexItem />
          <TextField size="small" label="Search" value={filters.search}
            onChange={(e) => setF("search", e.target.value)} sx={{ width: 200 }}
            InputProps={{
              endAdornment: filters.search ? (
                <IconButton size="small" onClick={() => setF("search", "")}><XIcon size={14} /></IconButton>
              ) : null,
            }}
          />
          {hasFilters && (
            <Button size="small" variant="outlined" color="error" onClick={clearFilters}
              startIcon={<XIcon size={14} />} sx={{ textTransform: "none", height: 36 }}>
              Clear Filters
            </Button>
          )}
        </Box>

        {/* ── Record count badge ── */}
        {!loading && !error && (
          <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={`${filteredRows.length} training${filteredRows.length !== 1 ? "s" : ""} found`}
              size="small"
              sx={{ bgcolor: "#1A005D", color: "#fff", fontWeight: "bold" }}
            />
            {filteredRows.length !== rows.length && (
              <Typography variant="caption" color="text.secondary">
                (filtered from {rows.length} total)
              </Typography>
            )}
          </Box>
        )}
          {/* ── Stage Summary ── */}
            <Box sx={{ mt: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 1, bgcolor: "#fafafa" }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: "bold", color: "#1A005D" }}>
                Training Stage Summary
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "stretch" }}>
                <StageBox label="Total Training"               count={filteredRows.length} color="#1A005D" />
                <StageBox label="Stage 1 – Training Created"   count={computedStage.s1}   color="#FF9800" />
                <StageBox label="Stage 2 – Training Scheduled" count={computedStage.s2}   color="#2196F3" />
                <StageBox label="Stage 3 – Training Conducted" count={computedStage.s3}   color="#9C27B0" />
                <StageBox label="Stage 4 – Feedback Assigned"  count={computedStage.s4}   color="#00BCD4" />
                <StageBox label="Stage 5 – Submitted/Closed"   count={computedStage.s5}   color="#4CAF50" />
              </Box>
            </Box>

        {/* ── Content ── */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ p: 2 }}>{error}</Typography>
        ) : filteredRows.length === 0 ? (
          <Box sx={{ height: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
            <HourglassEmptyIcon sx={{ fontSize: 70, color: "#1A005D" }} />
            <Typography variant="h6" color="#1A005D">No training records found</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <TableContainer component={Paper} sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)", mb: 2 }}>
                <Table size="small" stickyHeader sx={{ minWidth: 1400 }}>
                  <TableHead>
                    <TableRow>
                      {/* Serial # — not sortable */}
                      <TableCell sx={{
                        bgcolor: "#1A005D", color: "#fff", fontWeight: "bold",
                        fontSize: "0.78rem", textAlign: "center", whiteSpace: "nowrap",
                        position: "sticky", left: 0, zIndex: 3,
                      }}>
                        #
                      </TableCell>
                      {TABLE_COLS.map((col) => (
                        <SortableCell
                          key={col.id}
                          col={col}
                          order={order}
                          orderBy={orderBy}
                          onSort={handleSort}
                        />
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedRows
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row, idx) => (
                        <TableRow
                          key={`${row.planing_id}-${row.session_no ?? "ns"}`}
                          hover
                          sx={{ "&:nth-of-type(odd)": { bgcolor: "#f8fafc" } }}
                        >
                          {/* Serial # */}
                          <TableCell align="center" sx={{
                            fontSize: "0.8rem", py: 0.5, color: "#555",
                            position: "sticky", left: 0, zIndex: 1,
                            bgcolor: idx % 2 === 0 ? "#f8fafc" : "#fff",
                          }}>
                            {page * rowsPerPage + idx + 1}
                          </TableCell>

                          {TABLE_COLS.map((col) => (
                            <TableCell key={col.id} align={col.align} sx={{ fontSize: "0.8rem", py: 0.5 }}>

                              {col.id === "training_status" ? (
                                <Chip
                                  label={row.training_status || "—"}
                                  size="small"
                                  sx={{ bgcolor: statusColor(row.training_status), color: "#fff", fontSize: "0.7rem", height: 22 }}
                                />

                              ) : col.id === "trainer_display" ? (
                                // ── Trainer cell: name + Internal/External badge + dept (if internal) ──
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
                                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 500, lineHeight: 1.3 }}>
                                    {row.trainer_display || "—"}
                                  </Typography>
                                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                    {/* Internal / External badge */}
                                    <Chip
                                      label={row.trainer_type || "—"}
                                      size="small"
                                      sx={{
                                        fontSize: "0.65rem", height: 18,
                                        bgcolor: row.trainer_type === "Internal" ? "#E3F2FD" : "#FFF3E0",
                                        color:   row.trainer_type === "Internal" ? "#1565C0" : "#E65100",
                                        border:  `1px solid ${row.trainer_type === "Internal" ? "#90CAF9" : "#FFCC80"}`,
                                      }}
                                    />
                                    {/* Department — only for internal */}
                                    {row.trainer_type === "Internal" && row.trainer_department && (
                                      <Chip
                                        label={row.trainer_department}
                                        size="small"
                                        sx={{
                                          fontSize: "0.65rem", height: 18,
                                          bgcolor: "#E8F5E9", color: "#2e7d32",
                                          border: "1px solid #A5D6A7",
                                        }}
                                      />
                                    )}
                                  </Box>
                                </Box>

                              )  : col.id === "feedback_pending" && row.feedback_pending > 0 ? (
                                <Typography component="span" sx={{ color: "#e53935", fontWeight: "bold", fontSize: "0.8rem" }}>
                                  {row.feedback_pending}
                                </Typography>

                              ) : col.id === "attended_count" ? (
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                  <Typography component="span" sx={{
                                    fontSize: "0.8rem",
                                    color: row.attended_count > 0 ? "#2e7d32" : "#9e9e9e",
                                    fontWeight: row.attended_count > 0 ? "bold" : "normal",
                                  }}>
                                    {row.attended_count ?? 0}
                                  </Typography>
                                  {row.trainee_count > 0 && (
                                    <Typography component="span" sx={{ fontSize: "0.7rem", color: "#888" }}>
                                      /{row.trainee_count}
                                    </Typography>
                                  )}
                                </Box>

                              ) : col.id === "coordinator_names" ? (
                                <span>{row.coordinator_names || "—"}</span>

                              ) : (
                                row[col.id] ?? "—"
                              )}

                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredRows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            />

           
          </>
        )}

      </div>
    </div>
  );
};

export default MonthlyTrainingReport;