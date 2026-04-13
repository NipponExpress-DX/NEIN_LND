// AttendanceUploadDialog.js

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Tabs, Tab, Chip,
  Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, IconButton, Tooltip,
  TextField, Autocomplete, Checkbox, Divider,
  InputAdornment, Collapse, List, ListItem, ListItemAvatar,
  ListItemText, Avatar, Paper, Grid,
} from '@mui/material';
import CloseIcon             from '@mui/icons-material/Close';
import ContentPasteIcon      from '@mui/icons-material/ContentPaste';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import WarningAmberIcon      from '@mui/icons-material/WarningAmber';
import GroupIcon             from '@mui/icons-material/Group';
import EditNoteIcon          from '@mui/icons-material/EditNote';
import SearchIcon            from '@mui/icons-material/Search';
import ClearIcon             from '@mui/icons-material/Clear';
import PersonAddIcon         from '@mui/icons-material/PersonAdd';
import SaveIcon              from '@mui/icons-material/Save';
import SendIcon              from '@mui/icons-material/Send';
import PreviewIcon           from '@mui/icons-material/Preview';
import ErrorOutlineIcon      from '@mui/icons-material/ErrorOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon   from '@mui/icons-material/KeyboardArrowUp';
import PhoneAndroidIcon      from '@mui/icons-material/PhoneAndroid';
import BadgeIcon             from '@mui/icons-material/Badge';
import AddCircleIcon         from '@mui/icons-material/AddCircle';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  navy:   '#1A005D',
  navyLt: '#3a0075',
  green:  '#8EC400',
  red:    '#E53935',
  amber:  '#FB8C00',
  blue:   '#1565C0',
  teal:   '#00796B',
  border: '#E0E0E0',
  bg:     '#F4F6FB',
  draft:  '#0277BD',
};

function StatusChip({ status }) {
  const cfg = {
    present:     { label: 'Present',        color: C.green,   Icon: CheckCircleIcon },
    absent:      { label: 'Absent',         color: C.amber,   Icon: WarningAmberIcon },
    walkin:      { label: 'Walk-in',        color: C.blue,    Icon: PersonAddIcon },
    'emp-match': { label: 'Employee match', color: C.teal,    Icon: BadgeIcon },
    phone:       { label: 'Phone',          color: '#6A1B9A', Icon: PhoneAndroidIcon },
  }[status] || { label: status, color: '#888', Icon: GroupIcon };
  const { label, color, Icon } = cfg;
  return (
    <Chip
      size="small"
      icon={<Icon sx={{ fontSize: 12, color: `${color} !important` }} />}
      label={label}
      sx={{ backgroundColor: color + '22', color, border: `1px solid ${color}55`, fontWeight: 700, fontSize: 11 }}
    />
  );
}

function SectionHeader({ children }) {
  return (
    <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.navy, mb: 0.5 }}>
      {children}
    </Typography>
  );
}

// ─── Walk-in Form Modal ───────────────────────────────────────────────────────
function WalkInFormModal({ open, onClose, onSave, editingWalkIn }) {
  const [formData, setFormData] = useState({
    trainee_name: '', trainee_mail: '', trainee_branch: '', trainee_department: '', emp_id: null,
  });
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (open) {
      setFormData(editingWalkIn ? {
        trainee_name:       editingWalkIn.name       || '',
        trainee_mail:       editingWalkIn.email      || '',
        trainee_branch:     editingWalkIn.branch     || '',
        trainee_department: editingWalkIn.department || '',
        emp_id:             editingWalkIn.empId      || null,
      } : { trainee_name: '', trainee_mail: '', trainee_branch: '', trainee_department: '', emp_id: null });
      setErrors({});
    }
  }, [open, editingWalkIn]);

  const validate = () => {
    const e = {};
    if (!formData.trainee_name.trim())       e.trainee_name       = 'Name is required';
    if (!formData.trainee_mail.trim())       e.trainee_mail       = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.trainee_mail)) e.trainee_mail = 'Email is invalid';
    if (!formData.trainee_branch.trim())     e.trainee_branch     = 'Branch is required';
    if (!formData.trainee_department.trim()) e.trainee_department = 'Department is required';
    if (!formData.emp_id || !String(formData.emp_id).trim()) e.emp_id = 'Employee ID is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...formData, id: editingWalkIn?.id || `walkin_${Date.now()}_${Math.random()}` });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ background: `linear-gradient(135deg,${C.navy},${C.navyLt})`, color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon />
          <Typography fontWeight={700}>{editingWalkIn ? 'Edit Walk-in Attendee' : 'Add Walk-in Attendee'}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          All fields below are required to save the walk-in attendance record.
        </Typography>
        <Grid container spacing={2}>
          {[
            { key: 'trainee_name',       label: 'Full Name *',     type: 'text'  },
            { key: 'trainee_mail',       label: 'Email Address *', type: 'email',
              helper: errors.trainee_mail || 'Email will be used for future communication' },
            { key: 'trainee_branch',     label: 'Branch *',        type: 'text'  },
            { key: 'trainee_department', label: 'Department *',    type: 'text'  },
          ].map(({ key, label, type, helper }) => (
            <Grid item xs={12} key={key}>
              <TextField fullWidth label={label} type={type}
                value={formData[key]}
                onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                error={!!errors[key]}
                helperText={errors[key] || helper || ''}
                required
              />
            </Grid>
          ))}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Employee ID *"
              value={formData.emp_id || ''}
              onChange={e => setFormData(p => ({ ...p, emp_id: e.target.value || null }))}
              error={!!errors.emp_id}
              helperText={errors.emp_id || 'Employee ID is required for walk-in attendance'}
              required
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderColor: C.navy, color: C.navy }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: C.navy }}>
          {editingWalkIn ? 'Update' : 'Add to List'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Confirm-submit modal ─────────────────────────────────────────────────────
function ConfirmSubmitModal({ open, presentCount, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '14px' } }}>
      <DialogTitle sx={{ background: `linear-gradient(135deg,${C.navy},${C.navyLt})`, color: 'white', pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ErrorOutlineIcon sx={{ color: '#FFD740' }} />
          <Typography fontWeight={700}>Confirm Submission</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 2.5 }}>
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          You are about to submit attendance for{' '}
          <strong style={{ color: C.navy }}>{presentCount} attendee{presentCount !== 1 ? 's' : ''}</strong>.
        </Typography>
        <Box sx={{ p: 1.5, borderRadius: '8px', backgroundColor: '#FFF3E0', border: '1px solid #FFB74D' }}>
          <Typography variant="body2" color="#E65100" fontWeight={600}>
            ⚠️ This action cannot be undone. Once submitted, attendance is locked.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onCancel} variant="outlined" sx={{ borderRadius: '8px', textTransform: 'none', borderColor: C.navy, color: C.navy }}>Go Back</Button>
        <Button onClick={onConfirm} variant="contained"
          sx={{ borderRadius: '8px', textTransform: 'none', backgroundColor: C.navy, fontWeight: 700, minWidth: 140, '&:hover': { backgroundColor: '#14004a' } }}>
          Yes, Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Preview modal ────────────────────────────────────────────────────────────
function PreviewModal({ open, onClose, rows, isDraft, onDraft, onSubmit, saving }) {
  const present = rows.filter(r => r.status === 'Y');
  const absent  = rows.filter(r => r.status === 'N');
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '14px', maxHeight: '88vh' } }}>
      <DialogTitle sx={{ background: `linear-gradient(135deg,${C.navy},${C.navyLt})`, color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PreviewIcon />
            <Typography fontWeight={700}>Attendance Preview</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', gap: 1.5, px: 2.5, py: 1.5, backgroundColor: 'white', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
          <Chip label={`Total: ${rows.length}`}      size="small" sx={{ fontWeight: 700, backgroundColor: `${C.navy}18`,  color: C.navy  }} />
          <Chip label={`Present: ${present.length}`} size="small" sx={{ fontWeight: 700, backgroundColor: `${C.green}22`, color: C.green }} />
          <Chip label={`Absent: ${absent.length}`}   size="small" sx={{ fontWeight: 700, backgroundColor: `${C.amber}22`, color: C.amber }} />
          {isDraft && <Chip label="DRAFT" size="small" sx={{ fontWeight: 800, backgroundColor: `${C.draft}22`, color: C.draft, border: `1px dashed ${C.draft}` }} />}
        </Box>
        {present.length > 0 && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <SectionHeader>Present ({present.length})</SectionHeader>
            <List dense disablePadding>
              {present.map((r, i) => (
                <ListItem key={r.id} disablePadding sx={{ py: 0.25 }}>
                  <ListItemAvatar sx={{ minWidth: 34 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: 10, backgroundColor: C.green, color: 'white' }}>{i + 1}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={600}>{r.name}</Typography>}
                    secondary={r.tag && <StatusChip status={r.tag} />}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        <Divider />
        {absent.length > 0 && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <SectionHeader>Absent ({absent.length})</SectionHeader>
            <List dense disablePadding>
              {absent.map((r, i) => (
                <ListItem key={r.id} disablePadding sx={{ py: 0.25 }}>
                  <ListItemAvatar sx={{ minWidth: 34 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: 10, backgroundColor: '#bdbdbd', color: 'white' }}>{i + 1}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={<Typography variant="body2" color="text.secondary">{r.name}</Typography>} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${C.border}`, gap: 1, backgroundColor: 'white' }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: '8px', textTransform: 'none', borderColor: C.navy, color: C.navy }}>Edit</Button>
        <Button onClick={onDraft} variant="outlined" disabled={saving} startIcon={<SaveIcon />}
          sx={{ borderRadius: '8px', textTransform: 'none', borderColor: C.draft, color: C.draft, fontWeight: 700 }}>
          {saving ? 'Saving…' : 'Save Draft'}
        </Button>
        <Button onClick={onSubmit} variant="contained" disabled={saving || present.length === 0} startIcon={<SendIcon />}
          sx={{ borderRadius: '8px', textTransform: 'none', backgroundColor: C.navy, fontWeight: 700, '&:hover': { backgroundColor: '#14004a' } }}>
          {saving ? 'Submitting…' : `Submit (${present.length} Present)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AttendanceUploadDialog({
  open, onClose, session,
  mappedOptions = [], allEmployees = [], onConfirm,
  coordinatorContext = null,
  draftAttendanceMap = {},
  draftWalkIns = [],
}) {
  const [tab, setTab] = useState(0);
  const [walkInFormOpen, setWalkInFormOpen] = useState(false);
  const [editingWalkIn,  setEditingWalkIn]  = useState(null);

  // Tab 0
  const [rawText,    setRawText]    = useState('');
  const [matched,    setMatched]    = useState([]);
  const [parsed,     setParsed]     = useState(false);
  const [search,     setSearch]     = useState('');
  const [showExtra,  setShowExtra]  = useState(false);
  const [extraPhone, setExtraPhone] = useState([]);
  const [extraWalk,  setExtraWalk]  = useState([]);
  const [customWalkIns, setCustomWalkIns] = useState([]);

  // Tab 1
  // ── CHANGE: renamed from selectedMapped → absentMapped
  //    Tab 1 now starts with everyone present; you click to mark ABSENT.
  //    This means: present = realMapped minus absentMapped.
  const [absentMapped,   setAbsentMapped]   = useState([]);   // ← who you've marked absent
  const [selectedWalkIns, setSelectedWalkIns] = useState([]);

  // Shared
  const [saving,      setSaving]      = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setTab(0); setRawText(''); setMatched([]); setParsed(false);
    setSearch(''); setShowExtra(false); setExtraPhone([]); setExtraWalk([]);
    setAbsentMapped([]); setSelectedWalkIns([]); setCustomWalkIns([]);
    setShowPreview(false); setShowConfirm(false);
    onClose?.();
  }, [onClose]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const realMapped = useMemo(
    () => mappedOptions.filter(o => o.id !== 'ALL' && o.id !== 'Other'),
    [mappedOptions]
  );

  // ── FIXED: Draft restore now also populates Tab 1 (absentMapped) ──────────
  useEffect(() => {
    if (!open) return;
    if (!Object.keys(draftAttendanceMap).length && !draftWalkIns.length) return;
    if (parsed) return;

    const rows = [];

    realMapped.forEach(opt => {
      const isPresent = draftAttendanceMap[opt.id] === 'Y';
      rows.push({
        id:          opt.id,
        email:       opt.email || '',
        traineeId:   opt.id,
        traineeName: opt.label,
        status:      isPresent ? 'present' : 'absent',
        include:     isPresent,
        source:      'mapped',
        nameInput:   '',
      });
    });

    const restoredWalkIns = [];
    draftWalkIns.forEach(w => {
      if (!w.id || w.id === 'Other') return;
      const walkIn = {
        id: String(w.id), name: w.label || '', email: w.email || '',
        branch: '', department: '', empId: null, isComplete: true, source: 'custom_walkin',
      };
      restoredWalkIns.push(walkIn);
      rows.push({
        id: walkIn.id, email: walkIn.email, traineeId: null,
        traineeName: walkIn.name, traineeBranch: '', traineeDepartment: '',
        status: 'walkin', include: true, source: 'custom_walkin',
        nameInput: walkIn.name, isComplete: true,
      });
    });

    if (rows.length > 0) {
      setMatched(rows);
      setCustomWalkIns(restoredWalkIns);
      setParsed(true);

      // ── NEW: also restore Tab 1 absent state from the same draft map ──────
      // Anyone in the draft marked 'N' goes into absentMapped so Tab 1
      // immediately shows the correct present/absent split.
      const restoredAbsent = realMapped.filter(
        opt => draftAttendanceMap[opt.id] === 'N'
      );
      setAbsentMapped(restoredAbsent);
    }
  }, [open, draftAttendanceMap, draftWalkIns, realMapped, parsed]);

  const noEmailMapped = useMemo(() => realMapped.filter(o => !o.email), [realMapped]);

  const emailToMapped = useMemo(() => {
    const m = {};
    realMapped.forEach(o => { if (o.email) m[o.email.toLowerCase()] = o; });
    return m;
  }, [realMapped]);

  const emailToEmp = useMemo(() => {
    const m = {};
    allEmployees.forEach(e => { if (e.email) m[e.email.toLowerCase()] = e; });
    return m;
  }, [allEmployees]);

  const extractEmails = (text) => {
    const re = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    return [...new Set((text.match(re) || []).map(e => e.toLowerCase()))];
  };
  const detectedCount = useMemo(() => extractEmails(rawText).length, [rawText]);

  // ── Walk-in CRUD ───────────────────────────────────────────────────────────
  const handleAddWalkIn = useCallback((walkInData) => {
    const newWalkIn = {
    id:         walkInData.id || `walkin_${Date.now()}_${Math.random()}`,
    name:       walkInData.trainee_name,
    email:      walkInData.trainee_mail,
    branch:     walkInData.trainee_branch,
    department: walkInData.trainee_department,
    empId:      walkInData.emp_id ? String(walkInData.emp_id).trim() : null,  // ← preserve
    isComplete: true,
    source:     'custom_walkin',
  };

    if (editingWalkIn) {
      setCustomWalkIns(prev => prev.map(w => w.id === editingWalkIn.id ? newWalkIn : w));
      setMatched(prev => prev.map(r =>
        r.id === editingWalkIn.id ? {
          ...r,
          traineeName: newWalkIn.name, email: newWalkIn.email,
          traineeBranch: newWalkIn.branch, traineeDepartment: newWalkIn.department,
          traineeId: newWalkIn.empId || null, nameInput: newWalkIn.name, isComplete: true,
        } : r
      ));
    } else {
      setCustomWalkIns(prev => [...prev, newWalkIn]);
      if (parsed) {
        setMatched(prev => [...prev, {
          id: newWalkIn.id, email: newWalkIn.email, traineeId: newWalkIn.empId || null,
          traineeName: newWalkIn.name, traineeBranch: newWalkIn.branch,
          traineeDepartment: newWalkIn.department, status: 'walkin',
          include: true, source: 'custom_walkin', nameInput: newWalkIn.name, isComplete: true,
        }]);
      }
    }

    setEditingWalkIn(null);
    setWalkInFormOpen(false);
  }, [editingWalkIn, parsed]);

  const handleEditWalkIn   = useCallback((w) => { setEditingWalkIn(w); setWalkInFormOpen(true); }, []);
  const handleRemoveWalkIn = useCallback((id) => {
    setCustomWalkIns(prev => prev.filter(w => w.id !== id));
    setMatched(prev => prev.filter(r => r.id !== id));
  }, []);

  // ── Parse pasted text ──────────────────────────────────────────────────────
  const handleParse = useCallback(() => {
    const emails = extractEmails(rawText);
    if (!emails.length) return;

    const rows = [];
    emails.forEach(email => {
      const mappedOpt = emailToMapped[email];
      const empOpt    = !mappedOpt ? emailToEmp[email] : null;

      if (mappedOpt) {
        rows.push({ id: mappedOpt.id, email, traineeId: mappedOpt.id, traineeName: mappedOpt.label,
          status: 'present', include: true, source: 'mapped', nameInput: '' });
      // In handleParse — emp-match rows
          } else if (empOpt) {
              rows.push({ 
                  id:          String(empOpt.id),       // ✅ already string
                  email, 
                  traineeId:   String(empOpt.id),       // ✅ make sure this is String
                  traineeName: empOpt.label,
                  status:      'emp-match', 
                  include:     true, 
                  source:      'emp', 
                  nameInput:   '' 
              });
          } else {
        rows.push({ id: `pending_${email}`, email, traineeId: null, traineeName: '',
          status: 'walkin', include: false, source: 'unknown', nameInput: '', isComplete: false });
      }
    });

    customWalkIns.forEach(w => {
      if (!rows.some(r => r.email === w.email)) {
        rows.push({
          id: w.id, email: w.email, traineeId: w.empId || null,
          traineeName: w.name, traineeBranch: w.branch, traineeDepartment: w.department,
          status: 'walkin', include: true, source: 'custom_walkin',
          nameInput: w.name, isComplete: true,
        });
      }
    });

    const pastedIds = new Set(rows.filter(r => r.source === 'mapped').map(r => r.traineeId));
    realMapped.filter(o => !pastedIds.has(o.id)).forEach(opt => {
      rows.push({ id: opt.id, email: opt.email || '', traineeId: opt.id, traineeName: opt.label,
        status: 'absent', include: false, source: 'mapped', nameInput: '' });
    });

    setMatched(rows);
    setParsed(true);
    setShowExtra(false);
    setExtraPhone([]);
    setExtraWalk([]);
  }, [rawText, emailToMapped, emailToEmp, realMapped, customWalkIns]);

  // ── Toggle include (Tab 0) ─────────────────────────────────────────────────
  const toggleInclude = useCallback((idx) => {
    setMatched(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      if (!r.include && r.source === 'unknown' && !r.isComplete) {
        setEditingWalkIn({ id: r.id, name: r.nameInput || '', email: r.email, branch: '', department: '', empId: null });
        setWalkInFormOpen(true);
        return r;
      }
      return { ...r, include: !r.include };
    }));
  }, []);

  const handleOpenWalkInFormForRow = useCallback((row) => {
    setEditingWalkIn({ id: row.id, name: row.nameInput || row.traineeName || '', email: row.email,
      branch: row.traineeBranch || '', department: row.traineeDepartment || '', empId: row.traineeId || null });
    setWalkInFormOpen(true);
  }, []);

  // ── Tab 1 helpers ──────────────────────────────────────────────────────────
  // present in Tab 1 = realMapped minus absentMapped
  const absentMappedIds  = useMemo(() => new Set(absentMapped.map(o => o.id)), [absentMapped]);
  const tab1PresentMapped = useMemo(
    () => realMapped.filter(o => !absentMappedIds.has(o.id)),
    [realMapped, absentMappedIds]
  );

  const toggleAbsent = useCallback((opt) => {
    setAbsentMapped(prev =>
      prev.some(o => o.id === opt.id)
        ? prev.filter(o => o.id !== opt.id)   // was absent → make present
        : [...prev, opt]                        // was present → make absent
    );
  }, []);

  // ── Counts ─────────────────────────────────────────────────────────────────
  const presentCount = useMemo(() => {
    const fromMatched   = matched.filter(r => r.include && (r.traineeId || (r.source === 'custom_walkin' && r.isComplete))).length;
    const fromPhone     = extraPhone.length;
    const fromExtraWalk = extraWalk.length;
    const matchedWalkInIds = new Set(matched.filter(r => r.source === 'custom_walkin').map(r => r.id));
    const unmatchedWalkIns = customWalkIns.filter(w => w.isComplete && !matchedWalkInIds.has(w.id)).length;
    return fromMatched + fromPhone + fromExtraWalk + unmatchedWalkIns;
  }, [matched, extraPhone, extraWalk, customWalkIns]);

  const filteredRows = useMemo(() => {
    if (!search) return matched;
    const q = search.toLowerCase();
    return matched.filter(r =>
      r.email?.includes(q) || r.traineeName?.toLowerCase().includes(q) || r.nameInput?.toLowerCase().includes(q)
    );
  }, [matched, search]);

  // ── Build payload maps ─────────────────────────────────────────────────────
  const buildMapTab0 = useCallback(() => {
    const map = {};
    const walkInDetails = [];

    // ── Initialize ALL mapped trainees as absent first ──
    realMapped.forEach(o => { map[String(o.id)] = 'N'; });   // ✅ String()

    // In buildMapTab0 — matched.forEach section for custom_walkin/unknown
      matched.forEach(r => {
        if (!r.include) return;

        if (r.source === 'custom_walkin' || r.source === 'unknown') {
          if (r.isComplete) {
            walkInDetails.push({
              trainee_name:       (r.traineeName       || r.nameInput || '').trim(),
              trainee_mail:       (r.email             || '').trim().toLowerCase(),
              trainee_branch:     (r.traineeBranch     || '').trim(),
              trainee_department: (r.traineeDepartment || '').trim(),
              trainee_id:         r.traineeId ? String(r.traineeId).trim() : null,  // ← r.traineeId now has empId
              attendance_status:  1,
            });
          }
        } else if (r.traineeId) {
          map[String(r.traineeId)] = 'Y';
        }
      });

    customWalkIns.forEach(w => {
      const alreadyAdded = walkInDetails.some(d => d.trainee_mail === w.email.trim().toLowerCase());
      if (!alreadyAdded && w.isComplete) {
        walkInDetails.push({
          trainee_name:       (w.name       || '').trim(),
          trainee_mail:       (w.email      || '').trim().toLowerCase(),
          trainee_branch:     (w.branch     || '').trim(),
          trainee_department: (w.department || '').trim(),
          trainee_id:         w.empId ? String(w.empId).trim() : null,  // ← was always null
          attendance_status:  1,
        });
      }
    });

    extraPhone.forEach(o => { map[String(o.id)] = 'Y'; });
    extraWalk.forEach(o  => { map[String(o.id)] = 'Y'; });

    return { map, walkInDetails };
}, [realMapped, matched, extraPhone, extraWalk, customWalkIns]);

  // ── FIXED: Tab 1 now uses tab1PresentMapped (everyone minus absent) ────────
  const buildMapTab1 = useCallback(() => {
    const map = {};
    const walkInDetails = [];

    realMapped.forEach(o        => { map[String(o.id)] = 'N'; });   // ✅
    tab1PresentMapped.forEach(o => { map[String(o.id)] = 'Y'; });   // ✅

    customWalkIns.forEach(w => {
      if (!w.isComplete) return;
      walkInDetails.push({
        trainee_name:       (w.name       || '').trim(),
        trainee_mail:       (w.email      || '').trim().toLowerCase(),
        trainee_branch:     (w.branch     || '').trim(),
        trainee_department: (w.department || '').trim(),
        trainee_id:         w.empId ? String(w.empId).trim() : null,  // ← was always null
        attendance_status:  1,
      });
    });

    return { map, walkInDetails };
}, [realMapped, tab1PresentMapped, customWalkIns]);

  // ── Preview rows ───────────────────────────────────────────────────────────
  const buildPreviewRows = useCallback(({ map, walkInDetails }) => {
    const nameById = {};
    realMapped.forEach(o       => { nameById[o.id]         = o.label; });
    allEmployees.forEach(o     => { nameById[String(o.id)] = o.label; });
    extraPhone.forEach(o       => { nameById[String(o.id)] = o.label; });
    extraWalk.forEach(o        => { nameById[String(o.id)] = o.label; });
    selectedWalkIns.forEach(o  => { nameById[String(o.id)] = o.label; });

    const phoneIds     = new Set(extraPhone.map(o => String(o.id)));
    const extraWalkIds = new Set(extraWalk.map(o => String(o.id)));
    const walkIn1Ids   = new Set(selectedWalkIns.map(o => String(o.id)));
    const empMatchIds  = new Set(matched.filter(r => r.source === 'emp').map(r => String(r.traineeId)));

    const rows = [];
    Object.entries(map).forEach(([id, val]) => {
      rows.push({
        id,
        name:   nameById[id] || `ID: ${id}`,
        status: val,
        tag: phoneIds.has(id)     ? 'phone'     :
             extraWalkIds.has(id) ? 'walkin'    :
             walkIn1Ids.has(id)   ? 'walkin'    :
             empMatchIds.has(id)  ? 'emp-match' : undefined,
      });
    });

    walkInDetails.forEach(w => {
      const key = `walkin_${w.trainee_mail}`;
      if (!rows.some(r => r.id === key)) {
        rows.push({ id: key, name: w.trainee_name, status: 'Y', tag: 'walkin' });
      }
    });

    return rows;
  }, [realMapped, allEmployees, selectedWalkIns, extraPhone, extraWalk, matched]);

  // ── Save / Submit ──────────────────────────────────────────────────────────
  const handleOpenPreview = useCallback(() => {
    const data = tab === 0 ? buildMapTab0() : buildMapTab1();
    setPreviewRows(buildPreviewRows(data));
    setShowPreview(true);
  }, [tab, buildMapTab0, buildMapTab1, buildPreviewRows]);

  const doSave = useCallback(async (isDraft) => {
    if (!session || !onConfirm) return;
    const data = tab === 0 ? buildMapTab0() : buildMapTab1();
    setSaving(true);
    try {
      await onConfirm(
        session.planing_id, session.session_no,
        data.map, data.walkInDetails,
        { isDraft },
        coordinatorContext
      );
    } finally {
      setSaving(false);
      setShowPreview(false);
      setShowConfirm(false);
      if (!isDraft) handleClose();
    }
  }, [session, onConfirm, tab, buildMapTab0, buildMapTab1, handleClose, coordinatorContext]);

  const handleDraft           = useCallback(() => { setShowPreview(false); doSave(true);  }, [doSave]);
  const handleRequestSubmit   = useCallback(() => { setShowPreview(false); setShowConfirm(true); }, []);
  const handleConfirmedSubmit = useCallback(() => { setShowConfirm(false); doSave(false); }, [doSave]);
  const handleQuickDraft      = useCallback(() => doSave(true), [doSave]);

  // Tab 1 counters
  const tab1TotalLabel = tab1PresentMapped.length + customWalkIns.length;

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md"
        PaperProps={{ sx: { borderRadius: '16px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}>

        {/* Header */}
        <DialogTitle sx={{ background: `linear-gradient(135deg,${C.navy},${C.navyLt})`, color: 'white', px: 3, py: 2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <GroupIcon sx={{ color: C.green }} />
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>Mark Attendance</Typography>
              {session && <Typography variant="caption" sx={{ opacity: 0.7 }}>Session {session.session_no}</Typography>}
            </Box>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>

        {/* Tabs */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ flexShrink: 0, borderBottom: `1px solid ${C.border}`, backgroundColor: 'white', px: 2,
            '& .MuiTabs-indicator': { backgroundColor: C.navy },
            '& .Mui-selected': { color: `${C.navy} !important`, fontWeight: 700 } }}>
          <Tab icon={<ContentPasteIcon sx={{ fontSize: 17 }} />} iconPosition="start" label="Paste Emails"
            sx={{ textTransform: 'none', minHeight: 46, fontSize: 13 }} />
          <Tab icon={<EditNoteIcon sx={{ fontSize: 17 }} />} iconPosition="start"
            label={tab1TotalLabel > 0 ? `Manual Select (${tab1TotalLabel} present)` : 'Manual Select'}
            sx={{ textTransform: 'none', minHeight: 46, fontSize: 13 }} />
        </Tabs>

        {/* Content */}
        <DialogContent sx={{ p: 0, flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: C.bg }}>

          {/* ══ TAB 0: PASTE EMAILS ══ */}
          {tab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              {!parsed && (
                <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'auto' }}>
                  <Typography variant="body2" color="text.secondary">
                    Copy the attendee email list from <strong>Teams, Zoom, or any source</strong> and paste below.
                    Emails are extracted and matched automatically.
                  </Typography>
                  <TextField multiline minRows={9} maxRows={15} fullWidth
                    placeholder={'Paste emails here — any format works:\n\njohn.doe@company.com\njane.smith@company.com, raj.kumar@company.com'}
                    value={rawText} onChange={e => setRawText(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: 'white', fontSize: 13 }, '& textarea': { fontFamily: 'monospace' } }}
                    InputProps={{ endAdornment: rawText ? (
                      <InputAdornment position="end" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                        <Tooltip title="Clear"><IconButton size="small" onClick={() => setRawText('')}><ClearIcon fontSize="small" /></IconButton></Tooltip>
                      </InputAdornment>
                    ) : null }}
                  />
                  {rawText.trim() && (
                    <Typography variant="caption" color="text.secondary">
                      {detectedCount} unique email{detectedCount !== 1 ? 's' : ''} detected
                    </Typography>
                  )}
                </Box>
              )}

              {parsed && (
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', gap: 1.5, px: 2.5, py: 1.5, backgroundColor: 'white', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
                    {[
                      { l: 'Mapped present',  n: matched.filter(r => r.status === 'present').length,                    c: C.green },
                      { l: 'Employee match',  n: matched.filter(r => r.status === 'emp-match').length,                  c: C.teal  },
                      { l: 'Absent',          n: matched.filter(r => r.status === 'absent').length,                     c: C.amber },
                      { l: 'Pending details', n: matched.filter(r => r.status === 'walkin' && !r.isComplete).length,    c: C.blue  },
                    ].map(s => s.n > 0 && (
                      <Chip key={s.l} label={`${s.l}: ${s.n}`} size="small"
                        sx={{ backgroundColor: s.c + '22', color: s.c, border: `1px solid ${s.c}55`, fontWeight: 700, fontSize: 11 }} />
                    ))}
                    <Chip label={`Will mark Present: ${presentCount}`} size="small"
                      sx={{ backgroundColor: `${C.navy}18`, color: C.navy, fontWeight: 700, fontSize: 11 }} />
                    <Box sx={{ ml: 'auto' }}>
                      <Button size="small" variant="outlined"
                        onClick={() => { setParsed(false); setMatched([]); setSearch(''); setShowExtra(false); setExtraPhone([]); setExtraWalk([]); }}
                        sx={{ textTransform: 'none', borderColor: C.navy, color: C.navy, borderRadius: '8px', fontSize: 12 }}>
                        ← Re-paste
                      </Button>
                    </Box>
                  </Box>

                  <Box sx={{ px: 2.5, py: 0.75, backgroundColor: '#fffde7', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                    <Typography variant="caption" color="text.secondary">
                      <strong style={{ color: C.green }}>Mapped present</strong> — pre-registered trainee found by email.&nbsp;&nbsp;
                      <strong style={{ color: C.teal }}>Employee match</strong> — found in active employee list.&nbsp;&nbsp;
                      <strong style={{ color: C.blue }}>Pending details</strong> — unknown email; click "Add Details" to fill information.
                    </Typography>
                  </Box>

                  <Box sx={{ px: 2.5, py: 1, backgroundColor: 'white', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                    <TextField size="small" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)}
                      InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: C.navy }} /></InputAdornment> }}
                      sx={{ width: 300, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                  </Box>

                  <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          {['Mark', 'Email (from paste)', 'Attendee Name', 'Status', 'Actions'].map(h => (
                            <TableCell key={h} sx={{ backgroundColor: C.navy, color: 'white', fontWeight: 700, fontSize: 12, py: 1 }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredRows.map((row, idx) => {
                          const realIdx = matched.indexOf(row);
                          const rowBg =
                            row.status === 'absent'                    ? `${C.amber}11` :
                            row.status === 'emp-match'                 ? '#e0f2f1'      :
                            row.status === 'walkin' && !row.isComplete ? '#fff3e0'      :
                            row.include                                 ? `${C.green}11` : 'white';
                          const displayStatus =
                            row.isComplete === false                   ? 'pending-details' :
                            row.status === 'absent'                    ? 'absent'          :
                            row.status === 'emp-match'                 ? 'emp-match'       :
                            row.status === 'walkin'                    ? 'walkin'          :
                            row.include                                 ? 'present'         : 'absent';
                          const canMark = row.isComplete !== false;

                          return (
                            <TableRow key={row.id || idx} sx={{ backgroundColor: rowBg, '&:hover': { filter: 'brightness(0.97)' } }}>
                              <TableCell sx={{ width: 52, textAlign: 'center' }}>
                                {canMark ? (
                                  <Box onClick={() => toggleInclude(realIdx)}
                                    sx={{ width: 22, height: 22, borderRadius: '50%', mx: 'auto',
                                      border: `2px solid ${row.include ? C.green : C.border}`,
                                      backgroundColor: row.include ? C.green : 'transparent',
                                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                                    {row.include && <CheckCircleIcon sx={{ fontSize: 13, color: 'white' }} />}
                                  </Box>
                                ) : <Box sx={{ width: 22, height: 22, mx: 'auto' }} />}
                              </TableCell>
                              <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', color: 'text.secondary', maxWidth: 220, wordBreak: 'break-all' }}>
                                {row.email || '—'}
                              </TableCell>
                              <TableCell sx={{ fontSize: 12, maxWidth: 220 }}>
                                {row.traineeId ? (
                                  <Typography variant="body2" fontWeight={600} color={C.navy}>{row.traineeName}</Typography>
                                ) : row.isComplete ? (
                                  <Typography variant="body2" fontWeight={600} color={C.blue}>{row.traineeName || row.nameInput}</Typography>
                                ) : (
                                  <Button size="small" variant="outlined" onClick={() => handleOpenWalkInFormForRow(row)}
                                    startIcon={<PersonAddIcon />} sx={{ textTransform: 'none', fontSize: 11 }}>
                                    Add Details
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell>
                                {displayStatus === 'pending-details' ? (
                                  <Chip label="Pending Details" size="small" sx={{ backgroundColor: '#FF980022', color: '#FF9800', fontWeight: 700 }} />
                                ) : (
                                  <StatusChip status={displayStatus} />
                                )}
                              </TableCell>
                              <TableCell>
                                {row.isComplete && row.source === 'custom_walkin' && (<>
                                  <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => handleEditWalkIn(row)}><EditNoteIcon fontSize="small" /></IconButton>
                                  </Tooltip>
                                  <Tooltip title="Remove">
                                    <IconButton size="small" onClick={() => handleRemoveWalkIn(row.id)}><ClearIcon fontSize="small" /></IconButton>
                                  </Tooltip>
                                </>)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Extra/phone panel */}
                  <Box sx={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, backgroundColor: 'white' }}>
                    <Button fullWidth onClick={() => setShowExtra(v => !v)}
                      endIcon={showExtra ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      sx={{ justifyContent: 'space-between', textTransform: 'none', px: 2.5, py: 1,
                        color: '#6A1B9A', fontWeight: 700, fontSize: 12,
                        borderBottom: showExtra ? `1px solid ${C.border}` : 'none' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneAndroidIcon sx={{ fontSize: 15 }} />
                        Add attendees who joined by phone / have no email
                        {(extraPhone.length + extraWalk.length) > 0 && (
                          <Chip label={extraPhone.length + extraWalk.length} size="small"
                            sx={{ backgroundColor: '#6A1B9A22', color: '#6A1B9A', fontWeight: 800, fontSize: 11, height: 18 }} />
                        )}
                      </Box>
                    </Button>
                    <Collapse in={showExtra}>
                      <Box sx={{ px: 2.5, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {noEmailMapped.length > 0 && (
                          <Box>
                            <Typography variant="caption" fontWeight={700} color={C.navy} sx={{ display: 'block', mb: 0.5 }}>
                              Mapped trainees without email ({noEmailMapped.length})
                            </Typography>
                            <Autocomplete multiple size="small" options={noEmailMapped} getOptionLabel={o => o.label}
                              value={extraPhone} onChange={(_, v) => setExtraPhone(v)}
                              disableCloseOnSelect isOptionEqualToValue={(o, v) => o.id === v.id}
                              renderOption={(props, option, { selected }) => (
                                <li {...props}><Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                                  <Typography variant="body2">{option.label}</Typography>
                                  <PhoneAndroidIcon sx={{ ml: 'auto', fontSize: 14, color: '#6A1B9A', opacity: 0.6 }} />
                                </li>
                              )}
                              renderTags={(value, getTagProps) =>
                                value.length <= 2
                                  ? value.map((opt, i) => <Chip key={opt.id} label={opt.label} size="small" {...getTagProps({ index: i })} sx={{ fontSize: 11 }} />)
                                  : [<Chip key="s" label={`${value.length} selected`} size="small" sx={{ fontSize: 11, backgroundColor: '#6A1B9A22', color: '#6A1B9A', fontWeight: 700 }} />]
                              }
                              renderInput={params => (
                                <TextField {...params} placeholder="Select phone attendees…" size="small"
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: 'white' } }} />
                              )}
                            />
                          </Box>
                        )}
                        <Box>
                          <Typography variant="caption" fontWeight={700} color={C.navy} sx={{ display: 'block', mb: 0.5 }}>
                            Add new walk-in attendee
                          </Typography>
                          <Button variant="outlined" startIcon={<AddCircleIcon />}
                            onClick={() => { setEditingWalkIn(null); setWalkInFormOpen(true); }}
                            sx={{ textTransform: 'none', borderColor: C.blue, color: C.blue }}>
                            Add Walk-in Attendee
                          </Button>
                        </Box>
                      </Box>
                    </Collapse>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* ══ TAB 1: MANUAL SELECT ══  ─────────────────────────────────────
              CHANGED: everyone starts as Present.
              Click a name to mark them Absent. Click again to restore Present.
              This is the correct mental model — most people attend, you just
              flag who didn't show up.
          ──────────────────────────────────────────────────────────────────── */}
          {tab === 1 && (
            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5, overflow: 'auto' }}>

              {/* Instruction banner */}
              <Box sx={{ p: 1.5, borderRadius: '8px', backgroundColor: '#e8f5e9', border: `1px solid ${C.green}55` }}>
                <Typography variant="body2" color={C.navy} fontWeight={600} sx={{ mb: 0.25 }}>
                  All {realMapped.length} mapped trainees start as Present
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Click a trainee's name to mark them <strong>Absent</strong>. Click again to restore them to Present.
                  Add walk-ins below for anyone who attended but wasn't pre-mapped.
                </Typography>
              </Box>

              {/* Trainee list — click to toggle absent */}
              <Box>
                <SectionHeader>
                  Mapped Trainees — {tab1PresentMapped.length} Present / {absentMapped.length} Absent
                </SectionHeader>

                {/* Quick search */}
                <TextField size="small" placeholder="Search trainees…"
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: C.navy }} /></InputAdornment> }}
                  sx={{ mb: 1.5, width: 280, '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: 'white' } }}
                  onChange={e => {
                    // just a local state inline — no extra useState needed
                    const q = e.target.value.toLowerCase();
                    e.target._q = q;
                    e.target.closest('.tab1-list-wrap')
                      ?.querySelectorAll('[data-name]')
                      .forEach(el => {
                        el.style.display = el.dataset.name.toLowerCase().includes(q) ? '' : 'none';
                      });
                  }}
                />

                <Box className="tab1-list-wrap" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {realMapped.map(opt => {
                    const isAbsent = absentMappedIds.has(opt.id);
                    return (
                      <Chip
                        key={opt.id}
                        data-name={opt.label}
                        label={opt.label}
                        onClick={() => toggleAbsent(opt)}
                        deleteIcon={isAbsent ? <WarningAmberIcon sx={{ fontSize: '14px !important', color: `${C.amber} !important` }} /> : <CheckCircleIcon sx={{ fontSize: '14px !important', color: `${C.green} !important` }} />}
                        onDelete={() => toggleAbsent(opt)}   // makes the icon clickable too
                        sx={{
                          cursor: 'pointer',
                          fontWeight: isAbsent ? 400 : 600,
                          fontSize: 12,
                          backgroundColor: isAbsent ? `${C.amber}18` : `${C.green}18`,
                          color:           isAbsent ? C.amber          : C.navy,
                          border:          `1px solid ${isAbsent ? C.amber : C.green}55`,
                          textDecoration:  isAbsent ? 'line-through' : 'none',
                          transition: 'all .15s',
                          '&:hover': { opacity: 0.8 },
                        }}
                      />
                    );
                  })}
                </Box>

                {/* Quick actions */}
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button size="small" variant="text"
                    onClick={() => setAbsentMapped([])}
                    sx={{ textTransform: 'none', fontSize: 12, color: C.green, minWidth: 0 }}>
                    Mark all Present
                  </Button>
                  <Button size="small" variant="text"
                    onClick={() => setAbsentMapped([...realMapped])}
                    sx={{ textTransform: 'none', fontSize: 12, color: C.amber, minWidth: 0 }}>
                    Mark all Absent
                  </Button>
                </Box>
              </Box>

              <Divider />

              {/* Walk-ins */}
              <Box>
                <SectionHeader>Walk-in / Additional Attendees</SectionHeader>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Add anyone who attended but wasn't pre-mapped.
                </Typography>

                {customWalkIns.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Added Walk-ins ({customWalkIns.length}):</Typography>
                    {customWalkIns.map(w => (
                      <Paper key={w.id} sx={{ p: 1.5, mb: 1, backgroundColor: '#e3f2fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{w.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{w.email} | {w.branch} | {w.department}</Typography>
                        </Box>
                        <Box>
                          <IconButton size="small" onClick={() => handleEditWalkIn(w)}><EditNoteIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => handleRemoveWalkIn(w.id)}><ClearIcon fontSize="small" /></IconButton>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}

                <Button variant="outlined" startIcon={<AddCircleIcon />}
                  onClick={() => { setEditingWalkIn(null); setWalkInFormOpen(true); }}
                  sx={{ textTransform: 'none', borderColor: C.blue, color: C.blue }}>
                  Add Walk-in Attendee
                </Button>
              </Box>

              {/* Summary */}
              <Paper elevation={0} sx={{ p: 1.5, borderRadius: '10px', backgroundColor: `${C.green}18`, border: `1px solid ${C.green}44` }}>
                <Typography variant="body2" fontWeight={700} color={C.navy}>Summary</Typography>
                <Typography variant="caption" color="text.secondary">
                  {tab1PresentMapped.length} mapped present
                  {customWalkIns.length > 0 && ` + ${customWalkIns.length} walk-in${customWalkIns.length !== 1 ? 's' : ''}`}
                  {absentMapped.length > 0 && ` — ${absentMapped.length} absent`}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>

        {/* Footer */}
        <DialogActions sx={{ px: 3, py: 2, flexShrink: 0, borderTop: `1px solid ${C.border}`, backgroundColor: 'white', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: '8px', textTransform: 'none', borderColor: C.navy, color: C.navy }}>Cancel</Button>

          {tab === 0 && !parsed && (
            <Button onClick={handleParse} variant="contained" disabled={detectedCount === 0}
              sx={{ borderRadius: '8px', textTransform: 'none', backgroundColor: C.navy, fontWeight: 700, minWidth: 160, '&:hover': { backgroundColor: '#14004a' } }}>
              Preview Attendance
            </Button>
          )}

          {tab === 0 && parsed && (<>
            <Tooltip title="Save progress — you can edit again later">
              <Button onClick={handleQuickDraft} variant="outlined" disabled={saving} startIcon={<SaveIcon />}
                sx={{ borderRadius: '8px', textTransform: 'none', borderColor: C.draft, color: C.draft, fontWeight: 700 }}>
                {saving ? 'Saving…' : 'Save Draft'}
              </Button>
            </Tooltip>
            <Button onClick={handleOpenPreview} variant="outlined" disabled={presentCount === 0} startIcon={<PreviewIcon />}
              sx={{ borderRadius: '8px', textTransform: 'none', borderColor: C.green, color: C.green, fontWeight: 700 }}>
              Review & Submit
            </Button>
          </>)}

          {tab === 1 && (
            // Always show actions on Tab 1 — you always have the full list
            <>
              <Tooltip title="Save progress — you can edit again later">
                <Button onClick={handleQuickDraft} variant="outlined" disabled={saving} startIcon={<SaveIcon />}
                  sx={{ borderRadius: '8px', textTransform: 'none', borderColor: C.draft, color: C.draft, fontWeight: 700 }}>
                  {saving ? 'Saving…' : 'Save Draft'}
                </Button>
              </Tooltip>
              <Button onClick={handleOpenPreview} variant="outlined" startIcon={<PreviewIcon />}
                sx={{ borderRadius: '8px', textTransform: 'none', borderColor: C.green, color: C.green, fontWeight: 700 }}>
                Review & Submit
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <WalkInFormModal
        open={walkInFormOpen}
        onClose={() => { setWalkInFormOpen(false); setEditingWalkIn(null); }}
        onSave={handleAddWalkIn}
        editingWalkIn={editingWalkIn}
      />
      <PreviewModal open={showPreview} onClose={() => setShowPreview(false)}
        rows={previewRows} saving={saving} onDraft={handleDraft} onSubmit={handleRequestSubmit} />
      <ConfirmSubmitModal open={showConfirm}
        presentCount={previewRows.filter(r => r.status === 'Y').length}
        onConfirm={handleConfirmedSubmit} onCancel={() => setShowConfirm(false)} />
    </>
  );
}