import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo,
} from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, CircularProgress, Paper,
  Checkbox, Select, MenuItem, TextField, Tooltip,
  Alert, LinearProgress,
} from '@mui/material';
import SchoolIcon  from '@mui/icons-material/School';
import CancelIcon  from '@mui/icons-material/Cancel';
import SaveIcon    from '@mui/icons-material/Save';
import InfoIcon    from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROW_HEIGHT   = 56;   // px — every row is exactly this tall
const VISIBLE_ROWS = 9;    // how many rows visible before scroll
const OVERSCAN     = 3;    // extra rows rendered above/below viewport
const FETCH_TIMEOUT = 30000;

const HEADER_COLS = [
  { label: 'Sl No',                       width: 52  },
  { label: 'Employee Name',               width: 200 },
  { label: 'Department',                  width: 160 },
  { label: 'A',                           width: 52  },
  { label: 'B',                           width: 52  },
  { label: 'C',                           width: 52  },
  { label: 'Effectiveness (OK / Not OK)', width: 148 },
  { label: 'Retraining (Yes / No)',       width: 120 },
  { label: 'Remarks',                     width: -1  },
];

const OK_OPTIONS      = [{ value: 'OK',     label: 'OK',     color: '#2E7D32' }, { value: 'Not OK', label: 'Not OK', color: '#C62828' }];
const RETRAIN_OPTIONS = [{ value: 'No',     label: 'No',     color: '#555'    }, { value: 'Yes',    label: 'Yes',    color: '#F57C00' }];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildEmployee = (e) => ({
  id:            e.trainee_id,
  name:          e.trainee_name       || '',
  department:    e.trainee_department || '',
  effectiveness: [],
  okStatus:      'OK',
  retraining:    'No',
  remarks:       '',
});

// ─── Cell components — each manages its own state ────────────────────────────

const EffCheckbox = memo(({ empId, code, dataRef, onToggle }) => {
  const [checked, setChecked] = useState(
    () => dataRef.current[empId]?.effectiveness.includes(code) ?? false
  );

  useEffect(() => {
    if (!dataRef.subscribers) dataRef.subscribers = {};
    if (!dataRef.subscribers[empId]) dataRef.subscribers[empId] = {};
    dataRef.subscribers[empId][code] = setChecked;
    return () => { if (dataRef.subscribers?.[empId]) delete dataRef.subscribers[empId][code]; };
  }, [empId, code, dataRef]);

  return (
    <Checkbox
      size="small"
      checked={checked}
      onChange={() => onToggle(empId, code)}
      sx={{ color: '#1A005D', '&.Mui-checked': { color: '#1A005D' }, '& .MuiSvgIcon-root': { fontSize: 20 }, p: 0.5 }}
    />
  );
});

const EffSelect = memo(({ empId, field, options, dataRef, onUpdate }) => {
  const [val, setVal] = useState(() => dataRef.current[empId]?.[field] ?? options[0].value);

  useEffect(() => {
    if (!dataRef.subscribers) dataRef.subscribers = {};
    if (!dataRef.subscribers[empId]) dataRef.subscribers[empId] = {};
    dataRef.subscribers[empId][field] = setVal;
    return () => { if (dataRef.subscribers?.[empId]) delete dataRef.subscribers[empId][field]; };
  }, [empId, field, dataRef]);

  const handleChange = useCallback((e) => {
    const v = e.target.value;
    setVal(v);
    onUpdate(empId, field, v);
  }, [empId, field, onUpdate]);

  return (
    <Select value={val} onChange={handleChange} variant="outlined" size="small" fullWidth sx={{ fontSize: 13 }}>
      {options.map(o => (
        <MenuItem key={o.value} value={o.value} sx={{ color: o.color, fontWeight: 500 }}>{o.label}</MenuItem>
      ))}
    </Select>
  );
});

const EffRemarks = memo(({ empId, dataRef, onUpdate }) => {
  const [local, setLocal] = useState(() => dataRef.current[empId]?.remarks ?? '');
  const timer = useRef(null);

  const handleChange = useCallback((e) => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onUpdate(empId, 'remarks', v), 300);
  }, [empId, onUpdate]);

  return (
    <TextField size="small" fullWidth value={local} onChange={handleChange}
      sx={{
        '& .MuiOutlinedInput-root': { borderRadius: 1, fontSize: '0.875rem', '& fieldset': { borderColor: '#E0D6FF' } },
        '& .MuiInputBase-input': { py: 0.75 },
      }}
    />
  );
});

// ─── Single row — absolutely positioned by the virtual scroller ──────────────

const EffRow = memo(({ index, top, empId, emp, dataRef, onToggle, onUpdate }) => (
  <div
    style={{
      position:        'absolute',
      top,
      left:            0,
      right:           0,
      height:          ROW_HEIGHT,
      display:         'flex',
      alignItems:      'center',
      borderBottom:    '1px solid #E0D6FF',
      backgroundColor: index % 2 === 0 ? '#FBF9FF' : '#ffffff',
      padding:         '0 8px',
      boxSizing:       'border-box',
    }}
  >
    <div style={{ width: 52, textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#555', flexShrink: 0 }}>
      {index + 1}
    </div>
    <div style={{ width: 200, fontSize: 13, fontWeight: 600, color: '#1A005D', paddingRight: 8, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      <Tooltip title={emp.name} placement="top"><span>{emp.name}</span></Tooltip>
    </div>
    <div style={{ width: 160, fontSize: 13, paddingRight: 8, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#555' }}>
      <Tooltip title={emp.department} placement="top"><span>{emp.department}</span></Tooltip>
    </div>
    {['A', 'B', 'C'].map(code => (
      <div key={code} style={{ width: 52, textAlign: 'center', flexShrink: 0 }}>
        <EffCheckbox empId={empId} code={code} dataRef={dataRef} onToggle={onToggle} />
      </div>
    ))}
    <div style={{ width: 148, paddingRight: 8, flexShrink: 0 }}>
      <EffSelect empId={empId} field="okStatus" options={OK_OPTIONS} dataRef={dataRef} onUpdate={onUpdate} />
    </div>
    <div style={{ width: 120, paddingRight: 8, flexShrink: 0 }}>
      <EffSelect empId={empId} field="retraining" options={RETRAIN_OPTIONS} dataRef={dataRef} onUpdate={onUpdate} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <EffRemarks empId={empId} dataRef={dataRef} onUpdate={onUpdate} />
    </div>
  </div>
));

// ─── Virtual scroll container — no external library needed ───────────────────

function VirtualList({ ids, nameMap, dataRef, onToggle, onUpdate }) {
  const containerHeight = ROW_HEIGHT * Math.min(ids.length, VISIBLE_ROWS);
  const totalHeight     = ROW_HEIGHT * ids.length;

  const [scrollTop, setScrollTop] = useState(0);
  const onScroll = useCallback((e) => setScrollTop(e.currentTarget.scrollTop), []);

  // Compute the visible window with overscan
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex   = Math.min(
    ids.length - 1,
    Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN
  );

  const visibleRows = [];
  for (let i = startIndex; i <= endIndex; i++) {
    const empId = ids[i];
    const emp   = nameMap[empId];
    if (!emp) continue;
    visibleRows.push(
      <EffRow
        key={empId}
        index={i}
        top={i * ROW_HEIGHT}
        empId={empId}
        emp={emp}
        dataRef={dataRef}
        onToggle={onToggle}
        onUpdate={onUpdate}
      />
    );
  }

  return (
    <div
      onScroll={onScroll}
      style={{ height: containerHeight, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}
    >
      {/* Spacer that gives the scrollbar the correct total height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleRows}
      </div>
    </div>
  );
}

// ─── Select-all header row ────────────────────────────────────────────────────

const SelectAllRow = memo(({ onToggleAll, isAllChecked }) => (
  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F5F0FF', borderBottom: '1px solid #E0D6FF', padding: '4px 8px' }}>
    <div style={{ width: 52,  flexShrink: 0 }} />
    <div style={{ width: 200, flexShrink: 0 }} />
    <div style={{ width: 160, flexShrink: 0 }} />
    {['A', 'B', 'C'].map(code => (
      <div key={code} style={{ width: 52, textAlign: 'center', flexShrink: 0 }}>
        <Tooltip title={`Select all ${code}`} placement="top">
          <Checkbox
            size="small"
            checked={isAllChecked(code)}
            onChange={() => onToggleAll(code)}
            sx={{ color: '#1A005D', '&.Mui-checked': { color: '#1A005D' }, p: 0.5 }}
          />
        </Tooltip>
        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, lineHeight: 1, color: '#1A005D', fontSize: 10 }}>
          All {code}
        </Typography>
      </div>
    ))}
    <div style={{ width: 148, flexShrink: 0 }} />
    <div style={{ width: 120, flexShrink: 0 }} />
    <div style={{ flex: 1 }} />
  </div>
));

// ─── Footer ───────────────────────────────────────────────────────────────────

const Footer = memo(({ dataRef, ids, version }) => { // eslint-disable-line no-unused-vars
  const okCount = ids.filter(id => dataRef.current[id]?.okStatus   === 'OK').length;
  const reCount = ids.filter(id => dataRef.current[id]?.retraining === 'Yes').length;
  return (
    <Box sx={{ px: 2, py: 1, backgroundColor: '#F5F0FF', borderTop: '1px solid #E0D6FF', display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="caption" color="text.secondary">
        Showing all <strong>{ids.length}</strong> attendees — scroll to review
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Marked OK: <strong style={{ color: '#2E7D32' }}>{okCount}</strong>
        &nbsp;·&nbsp;
        Retraining: <strong style={{ color: '#F57C00' }}>{reCount}</strong>
      </Typography>
    </Box>
  );
});

// ─── Main Dialog ──────────────────────────────────────────────────────────────

function TrainingEffectivenessDialog({ open, onClose, selectedSession, API_BASE_URL, onSubmit }) {
  const [fetching,   setFetching]   = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [ids,        setIds]        = useState([]);
  const [nameMap,    setNameMap]    = useState({});
  const [version,    setVersion]    = useState(0);

  const dataRef            = useRef({});
  const abortControllerRef = useRef(null);

  // Ensure subscribers object always exists on the ref
  if (!dataRef.subscribers) dataRef.subscribers = {};

  const bumpVersion = useCallback(() => setVersion(v => v + 1), []);

  const resetData = useCallback(() => {
    dataRef.current     = {};
    dataRef.subscribers = {};
    setIds([]);
    setNameMap({});
    setVersion(0);
    setFetchError(null);
  }, []);

  // ── Fetch on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !selectedSession) return;
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    resetData();

    const load = async () => {
      setFetching(true);
      const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), FETCH_TIMEOUT);
      try {
        const res = await fetch(
          `${API_BASE_URL}/planning-route/PlanningSessionActiveAttendanceStatus/list`,
          {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              planing_id: selectedSession.planing_id,
              session_no: selectedSession.session_no,
            }),
            signal: abortControllerRef.current.signal,
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json     = await res.json();
        const attending = (json.coordinators || []).filter(e => e.attendance_status === 1);

        const newIds   = [];
        const newNames = {};
        attending.forEach(e => {
          const emp = buildEmployee(e);
          dataRef.current[emp.id] = emp;
          newIds.push(emp.id);
          newNames[emp.id] = { name: emp.name, department: emp.department };
        });

        setIds(newIds);
        setNameMap(newNames);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setFetchError(err.message || 'Failed to load data');
        }
      } finally {
        clearTimeout(timeoutId);
        setFetching(false);
      }
    };

    load();
    return () => abortControllerRef.current?.abort();
  }, [open, selectedSession, API_BASE_URL, resetData]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const onToggle = useCallback((empId, code) => {
    const emp = dataRef.current[empId];
    if (!emp) return;
    const has = emp.effectiveness.includes(code);
    emp.effectiveness = has
      ? emp.effectiveness.filter(c => c !== code)
      : [...emp.effectiveness, code];
    dataRef.subscribers?.[empId]?.[code]?.(prev => !prev);
  }, []);

  const onUpdate = useCallback((empId, field, value) => {
    if (dataRef.current[empId]) dataRef.current[empId][field] = value;
  }, []);

  const onToggleAll = useCallback((code) => {
    const allChecked = ids.every(id => dataRef.current[id]?.effectiveness.includes(code));
    ids.forEach(id => {
      const emp = dataRef.current[id];
      if (!emp) return;
      emp.effectiveness = allChecked
        ? emp.effectiveness.filter(c => c !== code)
        : emp.effectiveness.includes(code) ? emp.effectiveness : [...emp.effectiveness, code];
      dataRef.subscribers?.[id]?.[code]?.(!allChecked);
    });
    bumpVersion();
  }, [ids, bumpVersion]);

  const isAllChecked = useCallback((code) => {
    if (!ids.length) return false;
    return ids.every(id => dataRef.current[id]?.effectiveness.includes(code));
  }, [ids, version]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(async () => {
    if (!selectedSession) return;
    setSubmitting(true);
    try {
      const list = ids.map(id => ({ ...(dataRef.current[id] || {}) }));
      await onSubmit(selectedSession.planing_id, selectedSession.session_no, list);
      onClose();
    } catch (err) {
      console.error('[TrainingEffectivenessDialog] submit error:', err);
    } finally {
      setSubmitting(false);
    }
  }, [ids, selectedSession, onSubmit, onClose]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth
      PaperProps={{ elevation: 4, sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ background: 'linear-gradient(135deg, #1A005D 0%, #3A0075 100%)', color: '#FFFFFF', fontWeight: 700, py: 3, px: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <SchoolIcon sx={{ fontSize: 32, color: '#FFD700' }} />
        <Typography variant="h5" component="div" sx={{ letterSpacing: 0.5 }}>
          Training Attendance &amp; Effectiveness
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        {fetching ? (
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={400} gap={3}>
            <CircularProgress size={60} thickness={4} sx={{ color: '#1A005D' }} />
            <Typography variant="h6" fontWeight={600}>Loading attendance data…</Typography>
            <LinearProgress sx={{ width: 300, borderRadius: 2, height: 8, backgroundColor: '#E0D6FF', '& .MuiLinearProgress-bar': { backgroundColor: '#1A005D' } }} />
          </Box>
        ) : fetchError ? (
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={400} gap={2}>
            <WarningIcon sx={{ fontSize: 60, color: '#C62828' }} />
            <Alert severity="error" sx={{ maxWidth: 500 }}>{fetchError}</Alert>
            <Button variant="outlined" onClick={onClose} sx={{ mt: 2 }}>Close</Button>
          </Box>
        ) : (
          <Paper elevation={2} sx={{ overflow: 'hidden', mb: 2, borderRadius: 2, border: '1px solid #E0D6FF' }}>

            {/* Column header */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'linear-gradient(to bottom, #1A005D, #2A0068)', color: 'white', fontWeight: 700, fontSize: 13, padding: '10px 8px' }}>
              {HEADER_COLS.map(col => (
                <div
                  key={col.label}
                  style={{
                    ...(col.width === -1 ? { flex: 1 } : { width: col.width, flexShrink: 0 }),
                    textAlign: ['A', 'B', 'C'].includes(col.label) ? 'center' : 'left',
                    paddingRight: 8,
                  }}
                >
                  {col.label}
                </div>
              ))}
            </div>

            {/* Select-all row */}
            <SelectAllRow onToggleAll={onToggleAll} isAllChecked={isAllChecked} />

            {/* Virtual scroll — no external library */}
            {ids.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                <Typography>No attendance records found.</Typography>
              </Box>
            ) : (
              <VirtualList
                ids={ids}
                nameMap={nameMap}
                dataRef={dataRef}
                onToggle={onToggle}
                onUpdate={onUpdate}
              />
            )}

            <Footer dataRef={dataRef} ids={ids} version={version} />
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 4, borderTop: '1px solid #E0D6FF', justifyContent: 'flex-end', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 'auto' }}>
          <InfoIcon sx={{ color: '#1A005D', fontSize: 22 }} />
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#555' }}>
            A = Personnel Discussion &nbsp;·&nbsp; B = Demonstration / Test &nbsp;·&nbsp; C = On-the-job Assessment
          </Typography>
        </Box>
        <Button onClick={onClose} variant="outlined" startIcon={<CancelIcon />} disabled={submitting}
          sx={{ minWidth: 130, height: 44, borderRadius: 2, border: '2px solid #1A005D', color: '#1A005D', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button variant="contained"
          startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={submitting || fetching || ids.length === 0 || !!fetchError}
          sx={{ minWidth: 130, height: 44, borderRadius: 2, background: 'linear-gradient(135deg, #1A005D 0%, #3A0075 100%)', color: '#FFFFFF', fontWeight: 600, '&.Mui-disabled': { background: '#E0D6FF', color: '#9575CD' } }}>
          {submitting ? 'Saving…' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TrainingEffectivenessDialog;