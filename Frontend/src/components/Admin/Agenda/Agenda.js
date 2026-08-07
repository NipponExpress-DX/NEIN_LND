import React, { useCallback, useEffect, useState, useRef, useMemo } from "react";
import debounce from "lodash.debounce";
import { DatePicker } from "@mui/x-date-pickers";
import axios from "axios";
import RichEmailComposer from "./RichEmailComposer";

import {
  Tooltip, FormControlLabel, Switch, Tab, Tabs, InputAdornment,
  Autocomplete, Snackbar, Alert, Table, TableBody, TableContainer,
  TableCell, TableHead, TableRow, Paper, Box, FormControl, InputLabel,
  Select, Checkbox, ListItemText, Stepper, Step, StepLabel, Button,
  TextField, Grid, Typography, MenuItem, Modal, Chip, CircularProgress,
  IconButton, TablePagination, OutlinedInput,
} from "@mui/material";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import AddIcon from "@mui/icons-material/Add";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Assignment, School } from "@mui/icons-material";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { SiSession } from "react-icons/si";
import { styled } from "@mui/material/styles";
import { useAgenda } from "./AgendaContext";
import ExpandableTrainingSummary from "./ExpandableTrainingSummary";
import "../../../css/Admincss/Agenda.css";

dayjs.extend(isSameOrBefore);

// ─── Styled helpers ───────────────────────────────────────────────────────────
const StyledTextField = styled(TextField)(() => ({
  "& .MuiOutlinedInput-root": { height: "45px", fontSize: "14px" },
  "& .MuiInputLabel-root": { fontSize: "14px" },
}));
const StyledAutocomplete = styled(Autocomplete)(() => ({
  "& .MuiOutlinedInput-root": { height: "45px", fontSize: "14px" },
  "& .MuiInputLabel-root": { fontSize: "14px" },
}));

const getLabelColor = (value) => (value ? "#8EC400" : "#1A005D");
const feedbackTemplates = ["Template 1", "Template 2", "Template 3"];
const evaluationTemplates = ["Evaluation 1", "Evaluation 2", "Evaluation 3"];

// ─── Component ────────────────────────────────────────────────────────────────
function Agenda() {
  const { agendaData, setAgendaData } = useAgenda();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const location = useLocation();
  const navigate = useNavigate();
  const training = location.state?.training || {};
  const {
    id = "Default ID",
    emp_id: trainingCreatorEmpId = null,
    topic = "Default Topic",
    branch = "Default Branch",
    department = "Default Department",
    trainerType = "Default Trainer",
    date = "Default Trainer",
    status = "Default",
    staffCategory = "Default category",
  } = training;

  // ─── State ──────────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState({});
  const [isCoordinatorSelected, setIsCoordinatorSelected] = useState(true);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [sessionOptions, setSessionOptions] = useState([]);
  const [sessionOptionsDropdown, setSessionOptionsDropdown] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState(0);
  const [loggedInUser, setLoggedUser] = useState(null);
  const [isThirdStepVisible, setIsThirdStepVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [coordinatorList, setCoordinatorList] = useState([]);
  const [coordinatorInputValue, setCoordinatorInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // prevents double-submit on Submit button
  const [isSendingNotification, setIsSendingNotification] = useState(false); // prevents double-click on Compose & Notify

  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedTrainingId, setSelectedTrainingId] = useState(null);
  const [selectedSessionNo, setSelectedSessionNo] = useState(null);
  const [sessionNo, setSessionNo] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mappedCoordinators, setMappedCoordinators] = useState([]);
  const [planingId, setPlaningId] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isStepperExpanded, setIsStepperExpanded] = useState(true);
  const [traineeCount, setTraineeCount] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [showSubCoordinatorStep, setShowSubCoordinatorStep] = useState(false);
  const [subCoordinators, setSubCoordinators] = useState([]);
  const [availableBranch, setAvailableBranches] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [chosenSubCoordinator, setChosenSubCoordinator] = useState("");
  const [mappedSubCoordinators, setMappedSubCoordinators] = useState("");
  const [chosenBranch, setChosenBranch] = useState("");
  const [chosenDepartment, setChosenDepartment] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [mappedCandidates, setMappedCandidates] = useState([]);
  const [mappedCoorSubcoor, setMappedCoorSubcoor] = useState([]);
  const isEditingRef = useRef(false);
  const [subCoordinatorCode, setSubCoordinatorCode] = useState("");
  const [subCoordinatorName, setSubCoordinatorName] = useState("");
  const [subCoordinatorEmail, setSubCoordinatorEmail] = useState("");
  const [subCoordinatorInputValue, setSubCoordinatorInputValue] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selecteddepartment, setSelecteddepartment] = useState([]);
  const [selectedbranch, setSelectedbranch] = useState([]);
  const [branchMaster, setBranchMaster] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [selectedCoordinator, setSelectedCoordinator] = useState(null);
  const [traineeBranch, setTraineeBranch] = useState("");
  const [traineedepartment, setTraineeDepartment] = useState("");
  const [coordinatorId, setCoordinatorId] = useState("");
  const [filteredSubCoordinators, setFilteredSubCoordinators] = useState([]);
  const [filteredCoordinators, setFilteredCoordinators] = useState([]);
  const [filteredTrainees, setFilteredTrainees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);

  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [coordinatorData, setCoordinatorData] = useState(null);
  const [coordinatorType, setCoordinatorType] = useState("Multiple");
  const [coordinatorCode, setCoordinatorCode] = useState("");
  const [coordinatorName, setCoordinatorName] = useState("");
  const [coordinatorEmail, setCoordinatorEmail] = useState("");
  const [coordinatorTraineeCount, setCoordinatorTraineeCount] = useState("");
  const [savedData, setSavedData] = useState([]);
  const [isDataSaved, setIsDataSaved] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [assignedBranches, setAssignedBranches] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [trainerList, setTrainerList] = useState([]);
  const [editSessionId, setEditSessionId] = useState(null);
  const [draftTrainees, setDraftTrainees] = useState([]);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isSessionSubmitting, setIsSessionSubmitting] = useState(false);

  // ── CHANGE 2: track IDs that could not be added (no email) ──────────────────
  const [noEmailTraineeWarnings, setNoEmailTraineeWarnings] = useState([]);

  // ── Compose Notification modal (shown before Submit) ─────────────────────────
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [composeMessage, setComposeMessage]     = useState("");
  const [venueLocation, setVenueLocation]       = useState("");
  const [venueRoomName, setVenueRoomName]       = useState("");
  const [venueMapLink, setVenueMapLink]         = useState("");
  const [virtualLink, setVirtualLink]           = useState("");
  const [virtualPlatform, setVirtualPlatform]   = useState("");

  const [trainingData, setTrainingData] = useState({
    id, topic, date, description: "", branch, subbranch: "", department,
    trainer_type: trainerType, mode: "", count: "", category: staffCategory,
    cost: "", poNumber: "", poDate: "", status,
    feedbackTemplate: feedbackTemplates[0],
    evaluationTemplate: evaluationTemplates[0],
    feedbackTimeTrainee: "", feedbackTimeTrainer: "", trainerEmail: "",
  });
  const [trainees, setTrainees] = useState([{ empCode: "", name: "", request: "" }]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sessionData, setSessionData] = useState([]);
  const [sessions, setSessions] = useState({
    id, emp_id: "", user_name: "", planing_id: "", session_no: "",
    user_email: "", sessionNumber: 1, description: "", date: "", count: "",
    mode: "", cost: "", poNumber: "", poDate: "", fromTime: "", toTime: "",
    trainerType: trainerType || "", trainerCode: "", trainerName: "",
    trainerEmail: "", coordinatorCode: "", coordinatorEmail: "",
    coordinatorName: "", coordinatorType: "",
  });
  const [validationAttempted, setValidationAttempted] = useState(false);

  // ── NEW state for Mapping Trainees improvements ──
  const [bulkPasteInput, setBulkPasteInput] = useState("");
  const [bulkPasteError, setBulkPasteError] = useState("");
  const [draftViewTab, setDraftViewTab] = useState("drafted");
  const [draftRefreshKey, setDraftRefreshKey] = useState(0);
  const [notifiedTraineeIds, setNotifiedTraineeIds] = useState(new Set());

  // ── CHANGE 1: track whether trainees have been loaded for current branch+dept ─
  const [traineesLoaded, setTraineesLoaded] = useState(false);

  const prevBranches = useRef([]);
  const prevDepartments = useRef([]);
  const fetchAllCoordsRanRef = useRef(false);


  // ─── Derived ─────────────────────────────────────────────────────────────────
  const emp_id = loggedInUser?.emp_id || "";
  const user_br = loggedInUser?.user_branch || "";
  const userDetails = loggedInUser || JSON.parse(sessionStorage.getItem("userDetails") || "{}");
  const trainingId = selectedTrainingId || trainingData.id || sessions?.planing_id;

  const branches = branch.split(", ").map((b) => b.trim());
  const departments = department.split(", ").map((d) => d.trim());
  const availableBranches = branches.filter((b) => !assignedBranches?.includes(b)) || [];

  const formattedSubCoordinators = subCoordinators.map((sub) => ({
    id: sub.id,
    coordinator_emp_id: sub.sub_coordinator_emp_id,
    coordinator_name: sub.sub_coordinator_name + " (Sub-Coordinator)",
    coordinator_email: sub.sub_coordinator_email,
  }));
  const allCoordinators = [...filteredCoordinators, ...formattedSubCoordinators];

  const mappedCoordinator = useMemo(
    () => mappedCandidates.find(
      (c) => c.coordinator_emp_id === loggedInUser?.emp_id && c.session_no === sessionNo
    ),
    [mappedCandidates, loggedInUser, sessionNo]
  );

  const autoCoordinator = useMemo(() => {
    if (!loggedInUser?.emp_id || !mappedCoorSubcoor?.length) return null;
    return mappedCoorSubcoor.find(
      (c) => String(c.coordinator_emp_id) === String(loggedInUser.emp_id)
    ) || null;
  }, [loggedInUser?.emp_id, mappedCoorSubcoor]);

// ── True when the logged-in user is the training creator (emp_id matches planning_training_table.emp_id)
const isAdminOrCreator = useMemo(() => {
  if (!loggedInUser?.emp_id) return false;

  // ── Super admin / admin role check ──────────────────────────────────────
  // userRole "5" = Super Admin
  const adminRoleIds = ["5"];
  if (adminRoleIds.includes(String(loggedInUser?.userRole))) return true;

  // ── Training creator check ───────────────────────────────────────────────
  const creatorEmpId =
    training?.emp_id ||
    sessionData?.[0]?.emp_id ||
    null;
  return creatorEmpId
    ? String(loggedInUser.emp_id) === String(creatorEmpId)
    : false;
}, [loggedInUser?.emp_id, loggedInUser?.userRole, training?.emp_id, sessionData]);


  const draftedIds = useMemo(() => new Set(draftTrainees.map((t) => t.emp_id)), [draftTrainees]);
  const notDraftedTrainees = useMemo(
    () => filteredTrainees.filter((t) => !draftedIds.has(t.emp_id)),
    [filteredTrainees, draftedIds]
  );

  // ── CHANGE 2: sort drafted trainees ascending by full_name ───────────────────
  const sortedDraftTrainees = useMemo(
    () => [...draftTrainees].sort((a, b) =>
      (a.full_name || "").localeCompare(b.full_name || "", undefined, { sensitivity: "base" })
    ),
    [draftTrainees]
  );

  const traineesByBranch = useMemo(() => sortedDraftTrainees.reduce((acc, t) => {
    const b = t.branch_name || "N/A";
    if (!acc[b]) acc[b] = [];
    acc[b].push(t);
    return acc;
  }, {}), [sortedDraftTrainees]);
  const branchNames = Object.keys(traineesByBranch);

  const steps = ["Sessions", "Mapping Coordinator", "Mapping SubCoordinator", "Mapping Trainees"];
  const stepIcons = {
    0: <Assignment style={{ fontSize: "30px" }} />,
    1: <SiSession style={{ fontSize: "30px" }} />,
    2: <School style={{ fontSize: "30px" }} />,
    3: <School style={{ fontSize: "30px" }} />,
  };
  // ── Admin/creator: populate session dropdown from sessionData directly

useEffect(() => {
  if (!isAdminOrCreator) return;
  if (!sessionData?.length) return;

  const allSessions = sessionData.map((s) => ({
    session_no: s.session_no,
    branch:     branches.join(", "),
    department: departments.join(", "),
  }));
  setSessionOptionsDropdown(allSessions);

 
  if (allSessions.length >= 1) {
    setSelectedSession((prev) => {
      // Only update if not already set to a valid session in this dropdown
      const alreadyValid = prev && allSessions.some(
        (s) => String(s.session_no) === String(prev?.session_no)
      );
      return alreadyValid ? prev : allSessions[0];
    });
    setSelectedSessionNo((prev) =>
      prev && allSessions.some((s) => String(s.session_no) === String(prev))
        ? prev
        : allSessions[0].session_no
    );
  }

  // ── Set available branches/departments for admin from training record ──
  // (autoCoordinator effect is skipped for admin, so we do it here)
  const brs = branches.filter(Boolean);
  const dpts = departments.filter(Boolean);
  if (brs.length) setAvailableBranches(brs);
  if (dpts.length) setAvailableDepartments(dpts);

  // ── Fetch trainees immediately ──
  fetchTrainees();

}, [isAdminOrCreator, sessionData]); // eslint-disable-line
  // ─── API helpers ──────────────────────────────────────────────────────────────
  const fetchSessions = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/planning-route/session/list`, { planing_id: trainingData.id });
      if (res.status === 200) setSessionData(res.data.trainers || []);
    } catch (e) { console.error(e); }
  };

  const fetchTrainers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/training-master/TrainerInfoMaster/list`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
      });
      const data = await res.json();
      setTrainerList(data?.trainers || []);
    } catch (e) { setTrainerList([]); }
  };

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/training-master/branchmaster/list`);
      setBranchMaster(res.data.topics || []);
    } catch (e) { console.error(e); }
  };

  const fetchCoordinators = async (branchName = null, isEditMode = false) => {
    try {
      const res = await fetch(`${API_BASE_URL}/login/activeEmplList1`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
      });
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.employees) { setCoordinatorList([]); return []; }

      const normBranches = selectedBranches.flatMap((b) => b.split(",").map((x) => x.trim().toLowerCase()));
      const normBranchName = Array.isArray(branchName)
        ? branchName.map((b) => b.trim().toLowerCase())
        : typeof branchName === "string"
          ? branchName.split(",").map((b) => b.trim().toLowerCase())
          : null;

      const filtered = data.employees.filter((c) =>
        normBranchName
          ? normBranchName.some((n) => n === c.branch_name.trim().toLowerCase())
          : normBranches.some((n) => n === c.branch_name.trim().toLowerCase())
      );
      setCoordinatorList(filtered);

      if (isEditMode) {
        const existing = filtered.find((c) => c.emp_id === coordinatorCode);
        if (existing) {
          setCoordinatorCode(existing.emp_id);
          setCoordinatorName(existing.full_name);
          setCoordinatorEmail(existing.email);
        }
      }
      return filtered;
    } catch (e) { console.error(e); return []; }
  };

  const fetchTrainerData = async (tType, tCode) => {
    if (!tCode) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/training-master/TrainerInfoMaster/list`, { code: tCode });
      return res.data;
    } catch (e) { throw e; }
  };

  // ── fetchTrainees — fetches ALL trainees once; branch/dept filtering is done client-side ──
  const fetchTrainees = useCallback(async () => {
    // Only fetch once — if already loaded, skip
    if (fetchTrainees._loaded) return;
    fetchTrainees._loaded = true;

    try {
      const res = await fetch(`${API_BASE_URL}/login/activeEmplListTrainees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),  // No branch/dept — get everything
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("fetchTrainees error:", data);
        fetchTrainees._loaded = false; // allow retry
        return;
      }
      setAllEmployees(data.employees || []);

      setTraineesLoaded(true);
    } catch (e) {
      console.error("fetchTrainees network error:", e);
      fetchTrainees._loaded = false;
    }
  }, [API_BASE_URL]);

  // Client-side filter — trainees list is already fully loaded; just filter it
  const filterTraineesByBranchAndDept = (traineeList, branchArg, departmentArg) => {
    if (!traineeList?.length) { setFilteredTrainees([]); return; }
    const selBranch = typeof branchArg === "string" ? branchArg.trim().toUpperCase() : "";
    const selDept   = typeof departmentArg === "string" ? departmentArg.trim().toUpperCase() : "";
    setTraineeBranch(selBranch);
    setTraineeDepartment(selDept);
    // No filters → show everyone; branch only → filter by branch; both → filter by both
    let result = traineeList;
    if (selBranch) result = result.filter((t) => t.branch_name?.trim().toUpperCase() === selBranch);
    if (selDept)   result = result.filter((t) => t.department_name?.trim().toUpperCase() === selDept);
    setFilteredTrainees(result);
  };

  const filterSubCoordinators = useCallback(async (branchArg, departmentArg, mappedSubs, user) => {
    if (!branchArg && !departmentArg) return;
    if (!user) return;
    try {
      const empRes = await fetch(`${API_BASE_URL}/login/activeEmplList1`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
      });
      const empData = await empRes.json();
      if (!empData.employees?.length) return;
      const norm = (s) => s.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const filtered = empData.employees.filter((emp) => {
        const bm = branchArg ? norm(emp.branch_name) === norm(branchArg) : true;
        const dm = departmentArg ? norm(emp.department_name) === norm(departmentArg) : true;
        return bm && dm && emp.emp_id !== user.emp_id &&
          !mappedSubs.some((s) => s.sub_coordinator_emp_id === emp.emp_id);
      });
      setFilteredCandidates((prev) => JSON.stringify(prev) === JSON.stringify(filtered) ? prev : filtered);
    } catch (e) { console.error(e); }
  }, [setFilteredCandidates]);

  const fetchSubCoordinatorsAndFilter = useCallback(async (planningId, sNo, user) => {
    if (!user) return;
    setFilteredCandidates([]);
    try {
      const subRes = await fetch(`${API_BASE_URL}/planning-route/MappingSubCoordinator/list`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planing_id: planningId, session_no: sNo, coordinator_emp_id: user.emp_id }),
      });
      const subData = await subRes.json();
      const mappedSubs = subData.success ? subData.data : [];
      setMappedCandidates(mappedSubs);

      const coordRes = await fetch(`${API_BASE_URL}/planning-route/MappingCoordinator/view`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planing_id: planningId || trainingData.id }),
      });
      const coordData = await coordRes.json();
      if (!coordData.success || !coordData.data?.length) return;

      const loggedCoord = coordData.data.find((c) => c.coordinator_emp_id == user.emp_id);
      if (!loggedCoord) return;

      const bl = loggedCoord.branch.split(",").map((b) => b.trim());
      const dl = loggedCoord.department.split(",").map((d) => d.trim());
      setAvailableBranches(bl);
      setAvailableDepartments(dl);
      filterSubCoordinators(bl[0] || "", dl[0] || "", mappedSubs, user);
    } catch (e) { console.error(e); }
  }, [filterSubCoordinators]);

  const fetchMappedSessionForCoordinator = async (trainingIdArg, user) => {
    try {
      const res = await fetch(`${API_BASE_URL}/planning-route/MappingCoordinator/list`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planing_id: planingId || trainingData.id }),
      });
      const data = await res.json();
      if (!data.coordinators?.length) return [];
      return data.coordinators
        .filter((c) => c.coordinator_emp_id === String(user.emp_id))
        .map((c) => String(c.session_no));
    } catch (e) { console.error(e); return []; }
  };

  const fetchSubCoordinatorsForLoggedInCoordinator = async () => {
    try {
      const mappedSessions = await fetchMappedSessionForCoordinator(sessions.planing_id || trainingData.id, loggedInUser);
      if (!mappedSessions?.length) { setMappedSubCoordinators({}); return; }
      const results = await Promise.all(mappedSessions.map(async (sNo) => {
        const res = await fetch(`${API_BASE_URL}/planning-route/MappingSubCoordinator/list`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planing_id: sessions.planing_id || trainingData.id, session_no: sNo, coordinator_emp_id: loggedInUser.emp_id }),
        });
        const data = await res.json();
        if (!data.coordinators?.length) return { sNo, coordinators: [] };
        const seen = new Set();
        const unique = [];
        data.coordinators.forEach((c) => {
          if (c.sub_coordinator_emp_id && !seen.has(c.sub_coordinator_emp_id)) {
            seen.add(c.sub_coordinator_emp_id);
            unique.push({
              id: c.id, sub_coordinator_emp_id: c.sub_coordinator_emp_id,
              sub_coordinator_name: c.sub_coordinator_name?.trim() || `Sub-Coordinator (${c.sub_coordinator_emp_id})`,
              sub_coordinator_email: c.sub_coordinator_email, branch: c.branch, department: c.department,
            });
          }
        });
        return { sNo, coordinators: unique };
      }));
      const combined = results.reduce((acc, { sNo, coordinators }) => {
        if (coordinators.length) acc[sNo] = coordinators;
        return acc;
      }, {});
      setMappedSubCoordinators((prev) => JSON.stringify(prev) === JSON.stringify(combined) ? prev : combined);
    } catch (e) { console.error(e); }
  };

  const fetchSubCoordinators = async (planningId, user, allCoords = []) => {
    try {
      const pid = trainingData.id;
      const res = await fetch(`${API_BASE_URL}/planning-route/MappingSubCoordinator/PlanningMainTableList`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planing_id: pid }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const seen = new Set();
      const uniqueSubs = [];
      data.coordinators?.forEach((coord) => {
        const subIds = coord.sub_coordinator_emp_ids?.split(",") || [];
        const subNames = coord.sub_coordinator_names
          ? coord.sub_coordinator_names.match(/\((.*?)\)/g)?.map((n) => n.replace(/[()]/g, "").trim()) : [];
        const subEmails = coord.sub_coordinator_emails?.split(",") || [];
        subIds.forEach((subId, idx) => {
          if (subId && !seen.has(subId)) {
            seen.add(subId);
            uniqueSubs.push({
              id: `sub-${subId.trim()}`, coordinator_emp_id: subId.trim(),
              coordinator_name: subNames[idx] || "Unknown Sub-Coordinator",
              coordinator_email: subEmails[idx]?.trim() || "",
              branch: coord.branch, department: coord.dept, session_no: coord.session, type: "Sub-Coordinator",
            });
          }
        });
      });
      const merged = Array.isArray(allCoords) ? [...allCoords, ...uniqueSubs] : [...uniqueSubs];
      setMappedCandidates((prev) => JSON.stringify(prev) === JSON.stringify(merged) ? prev : [...merged]);

      if (user) {
        const userSessions = merged
          .filter((item) => item.coordinator_emp_id === user.emp_id && item.session_no)
          .map((item) => ({ session_no: item.session_no, branch: item.branch || "Unknown", department: item.department || "Unknown" }));
        const uniqueSessions = userSessions.filter((s, i, arr) =>
          i === arr.findIndex((x) => x.session_no === s.session_no && x.branch === s.branch && x.department === s.department)
        );
        setSessionOptions(uniqueSessions.length > 0 ? uniqueSessions : []);
      }
      return merged;
    } catch (e) { console.error(e); return Array.isArray(allCoords) ? allCoords : []; }
  };

  const fetchCoordinatorDetails = useCallback(async (planningId, user) => {
    if (!planningId || !user?.emp_id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/planning-route/MappingCoordinator/list`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planing_id: planningId || trainingData.id }),
      });
      const data = await res.json();
      const allCoords = data.coordinators?.map((c) => ({
        id: c.id, coordinator_emp_id: c.coordinator_emp_id, coordinator_name: c.coordinator_name,
        coordinator_email: c.coordinator_email, branch: c.branch, department: c.department,
        session_no: c.session_no, type: "Coordinator",
      })) || [];
      const loggedSessions = allCoords
        .filter((c) => c.coordinator_emp_id === user.emp_id)
        .map((c) => ({ session_no: c.session_no, branch: c.branch, department: c.department }));
      setSessionOptions(loggedSessions);
      setMappedCandidates(allCoords);
      fetchSubCoordinators(planningId, user, allCoords);
    } catch (e) { console.error(e); }
  }, []);

  const fetchAllCoordinators = useCallback(async (planningId, user) => {
    if (!planningId || !user?.emp_id) return;
    try {
      const [coordRes, subRes] = await Promise.all([
        fetch(`${API_BASE_URL}/planning-route/MappingCoordinator/list`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planing_id: planningId }),
        }),
        fetch(`${API_BASE_URL}/planning-route/MappingSubCoordinator/PlanningMainTableList`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planing_id: planningId }),
        }),
      ]);
      const coordData = await coordRes.json();
      const subData = await subRes.json();

      const allCoords = coordData.coordinators?.map((c) => ({
        id: c.id, coordinator_emp_id: c.coordinator_emp_id, coordinator_name: c.coordinator_name,
        coordinator_email: c.coordinator_email, branch: c.branch, department: c.department, session_no: c.session_no, type: "Coordinator",
      })) || [];

      const seen = new Set();
      const uniqueSubs = [];
      subData.coordinators?.forEach((coord) => {
        const ids = coord.sub_coordinator_emp_ids?.split(",") || [];
        const names = coord.sub_coordinator_names?.match(/\((.*?)\)/g)?.map((n) => n.replace(/[()]/g, "").trim()) || [];
        const emails = coord.sub_coordinator_emails?.split(",") || [];
        ids.forEach((sid, idx) => {
          if (sid && !seen.has(sid)) {
            seen.add(sid);
            uniqueSubs.push({
              id: `sub-${sid.trim()}`, coordinator_emp_id: sid.trim(),
              coordinator_name: names[idx] || "Unknown Sub-Coordinator",
              coordinator_email: emails[idx]?.trim() || "", branch: coord.branch,
              department: coord.dept, session_no: coord.session, type: "Sub-Coordinator",
            });
          }
        });
      });

      const merged = [...allCoords, ...uniqueSubs];
      setMappedCoorSubcoor(merged);

      const userSessions = merged
        .filter((item) => String(item.coordinator_emp_id) === String(user.emp_id) && item.session_no)
        .map((item) => ({ session_no: item.session_no, branch: item.branch || "Unknown", department: item.department || "Unknown" }));
      const unique = userSessions.filter((s, i, arr) =>
        i === arr.findIndex((x) => x.session_no === s.session_no && x.branch === s.branch && x.department === s.department)
      );
      setSessionOptionsDropdown(unique.length > 0 ? unique : []);

      // ── Load all trainees on session resolve; branch/dept are optional filters ──
      if (unique.length === 1) {
        const first = unique[0];
        setSelectedSession(first);
        setSelectedSessionNo(first.session_no);
        // Do NOT pre-fill branch/dept — user selects them optionally
        setSelectedbranch("");
        setSelecteddepartment("");
        // Fetch all trainees immediately with no filters
        fetchTrainees();
      } else if (unique.length === 0) {
       const creatorEmpId = training?.emp_id || null;
        const callerIsCreator = creatorEmpId
          ? String(user.emp_id) === String(creatorEmpId)
          : false;
        if (!callerIsCreator) {
          setSelectedSession(null);
          setSelectedSessionNo(null);
        }
       
      }
      return merged;
        } catch (e) { console.error(e); return []; }
  }, [fetchTrainees]);

  const fetchCoordinatorView = async (planningId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/planning-route/MappingCoordinator/view`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planing_id: planningId || trainingData.id }),
      });
      const data = await res.json();
      if (data?.success && data.data?.length) {
        setCoordinators([...data.data].sort((a, b) => a.session_no - b.session_no));
        setCoordinatorId("");
      } else { setCoordinators([]); setCoordinatorId(""); }
    } catch (e) { setCoordinators([]); setCoordinatorId(""); }
  };

  const fetchSavedData = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/planning-route/MappingCoordinator/list`, {
        planing_id: selectedTrainingId || sessions.planningId || trainingData.id,
      });
      const coords = res.data.coordinators || [];
      setSavedData(coords);
      setIsDataSaved(coords.length > 0);
    } catch (e) { console.error(e); }
  };

  const fetchDataCoord = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/planning-route/MappingCoordinator/list`, { planing_id: selectedTrainingId || trainingData.id });
      setSavedData(res.data.coordinators || []);
      setIsDataSaved(true);
    } catch (e) { console.error(e); }
  };

  const mapTraineeIdsAndEmails = (list) => {
    return list
      .filter((t) => t?.emp_id && t?.full_name)
      .reduce((acc, t) => {
        acc[t.emp_id] = [
          t.full_name,
          t.email || "",
          t.branch_name || "",
          t.department_name || t.department || "",
        ];
        return acc;
      }, {});
  };

  const fetchDraftList = async () => {
    try {
      const pid = Number(
        trainingData.id ||
        selectedTrainingId ||
        (sessions?.planing_id !== "" ? sessions?.planing_id : null) ||
        planingId ||
        0
      );
      if (!pid) { console.warn("fetchDraftList: pid is 0, skipping"); return; }

      const coordRes = await fetch(`${API_BASE_URL}/planning-route/MappingCoordinator/list`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planing_id: pid }),
      });
      if (!coordRes.ok) { console.warn("fetchDraftList: coordinator list fetch failed"); return; }
      const listData = await coordRes.json();
      const coords = listData.coordinators;
      if (!coords?.length) return;

      const loggedCoord = coords.find(
          (c) => String(c.coordinator_emp_id) === String(loggedInUser?.emp_id)
        );
        if (!loggedCoord) {
          // ── Admin bypass: skip the coordinator/sub-coordinator check ──
          if (isAdminOrCreator) {
            // fall through — admin can always fetch draft list
          } else {
            const subRes = await fetch(`${API_BASE_URL}/planning-route/MappingSubCoordinator/PlanningMainTableList`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ planing_id: pid }),
            });
            if (subRes.ok) {
              const subData = await subRes.json();
              const subs = subData.coordinators || [];
              const loggedSub = subs.find((c) =>
                c.sub_coordinator_emp_ids?.split(",").map((x) => x.trim()).includes(String(loggedInUser?.emp_id))
              );
              if (!loggedSub) return;   // ← only non-admins get blocked here
            }
          }
        }

      const draftPayload = { planing_id: pid };
      const sNo = Number(selectedSessionNo || 0);
      if (sNo > 0) draftPayload.session_no = sNo;

      let draftRecords = [];
      try {
        const draftRes = await axios.post(
          `${API_BASE_URL}/planning-route/PlanningSessionAsigningEmpMail/list`,
          draftPayload
        );
        draftRecords = draftRes.data?.records || [];
      } catch (listErr) {
        if (listErr?.response?.status === 400 && sNo > 0) {
          console.warn("fetchDraftList: retrying list without session_no");
          const retryRes = await axios.post(
            `${API_BASE_URL}/planning-route/PlanningSessionAsigningEmpMail/list`,
            { planing_id: pid }
          );
          draftRecords = retryRes.data?.records || [];
        } else {
          throw listErr;
        }
      }

      if (!draftRecords.length) {
        setDraftTrainees([]);
        setSelectedTrainees([]);
        setDraftRefreshKey((k) => k + 1);
        return;
      }

      const sessionFilteredRecords = sNo > 0
        ? draftRecords.filter((r) => Number(r.session_no) === sNo)
        : draftRecords;

      if (!sessionFilteredRecords.length) {
        setDraftTrainees([]);
        setSelectedTrainees([]);
        setDraftRefreshKey((k) => k + 1);
        return;
      }

      const traineeIds = sessionFilteredRecords.map((r) => r.trainee_id);
      let empMap = new Map();
      try {
        const empRes = await axios.post(`${API_BASE_URL}/login/activeEmplList1`, { emp_ids: traineeIds });
        (empRes.data?.employees || []).forEach((e) => empMap.set(String(e.emp_id), e));
      } catch { /* non-critical */ }

      const mapped = sessionFilteredRecords.map((r) => {
        const emp = empMap.get(String(r.trainee_id));
        return {
          emp_id: r.trainee_id,
          full_name: r.trainee_name,
          email: r.trainee_mail || emp?.email || "",
          department: r.trainee_department || emp?.department_name || "",
          branch_name: emp?.branch_name || r.branch || "N/A",
          branch_code: emp?.branch_code || "N/A",
          mobile_number: emp?.mobile_number || "N/A",
          session_no: r.session_no,
        };
      });

      setDraftTrainees(mapped);
      setSelectedTrainees([]);

      const storageKey = `draftTrainees_${pid}_${sNo > 0 ? sNo : "all"}`;
      localStorage.setItem(storageKey, JSON.stringify(mapped));
      setDraftRefreshKey((k) => k + 1);
    } catch (e) {
      console.error("fetchDraftList error:", e);
    }
  };
  useEffect(() => {
    if (selectedSessionNo) fetchDraftList();
  }, [selectedSessionNo]); // eslint-disable-line
  // ─── Session CRUD ─────────────────────────────────────────────────────────────
  const resetSessionForm = () => {
    setSessions({
      sessionNumber: sessionData.length + 1, description: "", date: "", count: "",
      mode: "", cost: "", poNumber: "", poDate: "", fromTime: "", toTime: "",
      trainerType: "", trainerCode: "", trainerName: "", trainerEmail: "",
    });
  };

  const handleSessionChange = async (field, value) => {
    const updatedSession = { ...sessions, [field]: value };
    setSessions((prev) => ({
      ...prev, [field]: value,
      session_code: `NEIN/${user_br}/S0${editSessionId ? sessions.session_no : sessionData.length + 1}`,
    }));
    let errorMsg = "";
    if ((field === "fromTime" || field === "toTime") && value) {
      const { fromTime, toTime } = updatedSession;
      if (fromTime && toTime) {
        const from = dayjs(fromTime, "HH:mm:ss");
        const to = dayjs(toTime, "HH:mm:ss");
        if (!from.isValid() || !to.isValid()) errorMsg = "Invalid time format";
        else if (to.isSameOrBefore(from)) errorMsg = "To Time must be after From Time";
      }
    }
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
    if (field === "trainerCode") {
      try { await fetchTrainerData(updatedSession.trainerType, value); } catch (e) { }
    }
  };

  const addOrUpdateSessionWithTrainee = async () => {
     if (isSessionSubmitting) return;   
    const currentCount = sessionData.length;
    let newErrors = {};
    if (!sessions.description) newErrors.description = "Session description is required";
    if (!sessions.count || isNaN(sessions.count) || parseInt(sessions.count) <= 0) newErrors.count = "Must be a valid positive number";
    if (!sessions.mode) newErrors.mode = "Mode of training is required";
    if (sessions.cost !== null && sessions.cost !== "" && (isNaN(sessions.cost) || parseFloat(sessions.cost) < 0)) newErrors.cost = "Must be a valid positive number or zero";
    if (!sessions.date) newErrors.date = "Session date is required";
    if (!sessions.fromTime) newErrors.fromTime = "From time is required";
    if (!sessions.toTime) newErrors.toTime = "To time is required";
    if (sessions.fromTime && sessions.toTime) {
      const from = dayjs(sessions.fromTime, "HH:mm:ss");
      const to = dayjs(sessions.toTime, "HH:mm:ss");
      if (!from.isValid() || !to.isValid()) { newErrors.fromTime = "Invalid time format"; newErrors.toTime = "Invalid time format"; }
      else if (to.isSameOrBefore(from)) newErrors.toTime = "To Time must be after From Time";
    }
    if (!sessions.trainerCode && !sessions.trainerName) newErrors.trainerCode = "Trainer selection is required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    const sessionNumber = editSessionId ? sessions.session_no : currentCount + 1;
    const payload = {
      planing_id: trainingData.id || 1, emp_id: loggedInUser?.emp_id || "",
      user_name: loggedInUser?.empname || "", user_email: loggedInUser?.user_email || "",
      session_no: sessionNumber, session_code: `NEIN/${user_br}/S0${editSessionId ? sessions.session_no : currentCount + 1}`,
      session_description: sessions.description || "",
      session_date: sessions.date ? dayjs(sessions.date).format("YYYY-MM-DD") : "",
      count_of_trainees_expected: sessions.count, mode_of_training: sessions.mode,
      from_time: sessions.fromTime, to_time: sessions.toTime,
      trainer_type: sessions.trainer_type || trainingData.trainer_type || sessions.trainerType || "External",
      trainer_code: sessions.trainerCode || "001", trainer_name: sessions.trainerName, trainer_email: sessions.trainerEmail,
    };
    if (sessions.cost !== "" && sessions.cost !== null) payload.training_cost = sessions.cost;
    if (sessions.poNumber !== "" && sessions.poNumber !== null) payload.PO_number = sessions.poNumber;
    if (sessions.poDate !== "" && sessions.poDate !== null) payload.PO_date = sessions.poDate;
    setIsSessionSubmitting(true);
    try {
      const url = editSessionId
        ? `${API_BASE_URL}/planning-route/session/update`
        : `${API_BASE_URL}/planning-route/session/add`;
      const res = await axios.post(url, payload);
      if (res.status === 200 || res.status === 201) {
        setAgendaData((prevData) => {
          const updated = [...prevData];
          const idx = updated.findIndex((item) => item.id === payload.planing_id);
          if (idx >= 0) {
            const agendas = updated[idx].agendas || [];
            updated[idx].agendas = editSessionId
              ? agendas.map((a) => a.id === editSessionId ? payload : a)
              : [...agendas, payload];
          } else {
            updated.push({ id: payload.planing_id, hasAgenda: true, agendas: [payload] });
          }
          return updated;
        });
        await fetchSessions();
        setSessions({ sessionNumber: currentCount + 2, description: "", date: "", count: "", mode: "", cost: "", poNumber: "", poDate: "", fromTime: "", toTime: "", trainerType: trainerType || "", trainerCode: "", trainerName: "", trainerEmail: "" });
        handleOpenSnackbar(editSessionId ? "Session updated successfully!" : "Session added successfully!", "success");
        if (editSessionId) setEditSessionId(null);
        setInputValue("");
        setErrors({});
      } else {
        handleOpenSnackbar("Failed to process session.", "error");
      }
    } catch (e) {
      handleOpenSnackbar('Error occurred while processing session.', 'error');
    } finally {
      setIsSessionSubmitting(false);
    }
  };

  const handleEditSession = (session) => {
    if (!trainerList.length) return;
    const trainer = trainerList.find((t) => String(t.emp_id) === String(session.trainer_code)) || null;
    setSessions({
      planing_id: session.planing_id || trainingData.id || 1,
      emp_id: session.emp_id || loggedInUser?.emp_id || "",
      user_name: session.user_name || loggedInUser?.empname || "",
      user_email: session.user_email || loggedInUser?.user_email || "",
      session_no: session.session_no || "", session_code: session.session_code || "",
      description: session.session_description || "",
      date: session.session_date ? dayjs(session.session_date).format("YYYY-MM-DD") : "",
      count: session.count_of_trainees_expected || "", mode: session.mode_of_training || "",
      cost: session.training_cost || "", poNumber: session.PO_number || "", poDate: session.PO_date || "",
      fromTime: session.from_time || "", toTime: session.to_time || "",
      trainerType: session.trainer_type || "", trainerCode: trainer?.emp_id || session.trainer_code || "",
      trainerName: trainer?.full_name || session.trainer_name || "",
      trainerEmail: session.trainer_email || trainer?.email || "",
    });
    setInputValue(trainer ? `${trainer.full_name} (${trainer.emp_id})` : session.trainer_name || "");
    setEditSessionId(session.session_no);
  };

  const handleDeleteSession = async (session_no) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/planning-route/session/delete`, {
        planing_id: trainingData.id, emp_id: loggedInUser.emp_id,
        user_name: loggedInUser.empname, user_email: loggedInUser.user_email, session_no,
      });
      if (res.status === 200 || res.status === 204) {
        handleOpenSnackbar("Session deleted successfully!", "success");
        setSessionData((prev) => prev.filter((s) => s.session_no !== session_no).map((s, i) => ({ ...s, session_no: i + 1 })));
      } else { handleOpenSnackbar("Failed to delete session.", "error"); }
    } catch (e) { handleOpenSnackbar("Error occurred while deleting session.", "error"); }
  };

  // ─── Coordinator CRUD ─────────────────────────────────────────────────────────
  const validateFields = () => {
    const newErrors = {};
    if (!coordinatorType) newErrors.coordinatorType = "Coordinator Type is required";
    if (!selectedBranches.length) newErrors.selectedBranches = "At least one branch is required";
    if (!selectedDepartments.length) newErrors.selectedDepartments = "At least one department is required";
    if (!coordinatorCode) newErrors.coordinatorCode = "Coordinator Name is required";
    if (!traineeCount[selectedBranches[0]]) newErrors.traineeCount = "Trainee Count is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveData = async () => {
    if (!validateFields() || !selectedBranches.length) return;
    // const isDuplicate = savedData.some((e) => e.coordinator_emp_id === coordinatorCode);
    // if (isDuplicate) { handleOpenSnackbar("This coordinator is already added.", "warning"); return; }
    const firstBranch = selectedBranches[0].trim();
    const countForBranch = traineeCount[firstBranch] || 0;
    // FIX: selectedSession holds the session_no VALUE (e.g. 1, 2),
    // NOT an array index — so find by matching session_no, not by position.
    const sNo = selectedSession
      ? (sessionData.find((s) => String(s.session_no) === String(selectedSession))?.session_no ?? selectedSession)
      : (selectedSessionNo || sessions.session_no || "");
    const requestData = {
      planing_id: selectedTrainingId || sessions.planningId || "",
      emp_id: loggedInUser?.emp_id || "", coordinator_type: coordinatorType || "Default",
      session_no: sNo || selectedSessionNo || sessions.session_no || "",
      branch: selectedBranches.join(", "), department: selectedDepartments.join(", "),
      coordinator_emp_id: coordinatorCode, coordinator_name: coordinatorName.trim(),
      coordinator_email: coordinatorEmail, mail_sending_status: 0, apprx_trainee_count: countForBranch,
    };
    try {
      const res = await axios.post(`${API_BASE_URL}/planning-route/MappingCoordinator/add`, requestData);
      if (res.status === 200 || res.status === 201) {
        handleOpenSnackbar("Coordinator saved successfully!", "success");
        setIsDataSaved(true);
        setSavedData((prev) => [...prev, requestData]);
        resetCoordinatorForm();
        fetchSavedData();
      } else { handleOpenSnackbar("Failed to save data.", "error"); }
    } catch (e) { handleOpenSnackbar(e.response?.data?.message || "Error saving coordinator.", "error"); }
  };

  const handleDeleteRow = async (indexToDelete) => {
    const row = savedData[indexToDelete];
    if (!row) return;
    const { id: rowId, planing_id: pId, session_no: sNo } = row;
    if (!rowId || !pId || !sNo) { handleOpenSnackbar("Missing required fields. Cannot delete.", "error"); return; }
    try {
      const res = await axios.post(`${API_BASE_URL}/planning-route/MappingCoordinator/delete`, { id: rowId, planing_id: pId, session_no: sNo });
      if (res.status === 200 || res.status === 201) {
        setSavedData(savedData.filter((_, i) => i !== indexToDelete));
        handleOpenSnackbar("Data deleted successfully!", "success");
      } else { handleOpenSnackbar("Failed to delete data.", "error"); }
    } catch (e) { handleOpenSnackbar("Error deleting data.", "error"); }
  };

  const handleEditRow = async (index, pId) => {
    isEditingRef.current = true;
    setEditingRowIndex(index);
    const row = savedData[index];
    setEditingIndex(index);
    // Do NOT block edit if sessionIdx is -1 — sessionData may not be loaded yet.
    // We still set selectedSession from row.session_no directly.
    setSelectedSession(row.session_no);
    setCoordinatorType(row.coordinator_type);
    setSelectedBranches([row.branch]);
    setSelectedDepartments(row.department.split(",").map((d) => d.trim()));
    setTraineeCount({ [row.branch]: row.apprx_trainee_count });
    setSelectedTrainingId(pId);
    setSelectedId(row.id);
    setCoordinatorCode(row.coordinator_emp_id);
    setCoordinatorName(row.coordinator_name);
    setCoordinatorEmail(row.coordinator_email || "");
    setCoordinatorInputValue(row.coordinator_name || "");
    try {
      const primaryBranch = row.branch.split(",")[0].trim();
      const fresh = await fetchCoordinators(primaryBranch);
      const matched = fresh.find((c) => String(c.emp_id) === String(row.coordinator_emp_id));
      if (matched) {
        setCoordinatorCode(matched.emp_id); setCoordinatorName(matched.full_name);
        setCoordinatorEmail(matched.email); setCoordinatorInputValue(matched.full_name);
      }
    } catch (e) { } finally { isEditingRef.current = false; }
  };

  const handleUpdate = async () => {
    // ── Key: read id/planing_id/original-session from savedData[editingIndex] ─
    // Never rely on selectedId state — React setState is async so it may be stale.
    const originalRow = editingIndex !== null ? savedData[editingIndex] : null;
    const rowId      = originalRow?.id;
    const rowPid     = originalRow?.planing_id || selectedTrainingId;
    // originalSno is the session stored in DB — used for the backend WHERE lookup
    // (the dropdown is disabled during edit so this always equals selectedSession)
    const originalSno = String(originalRow?.session_no || selectedSession || "");

    if (!rowId || !rowPid || !originalSno) {
      handleOpenSnackbar("Missing required data to update coordinator. Please try editing again.", "error");
      return;
    }

    // Payload: id + planing_id + session_no must match the DB record exactly
    // (backend SELECT WHERE planing_id=? AND session_no=? AND id=?)
    const updatedData = {
      id: rowId,
      planing_id: rowPid,
      emp_id: loggedInUser?.emp_id || "",
      coordinator_type: coordinatorType,
      session_no: originalSno,     // ← must match DB record for WHERE lookup
      branch: selectedBranches.join(", "),
      department: selectedDepartments.join(", "),
      coordinator_emp_id: coordinatorCode,
      coordinator_name: coordinatorName,
      coordinator_email: coordinatorEmail,
      mail_sending_status: 0,
      apprx_trainee_count: coordinatorTraineeCount || traineeCount[selectedBranches[0]] || 0,
    };

    // The backend WHERE clause is: planing_id = ? AND session_no = ? AND id = ?
    // It uses the originalSno to find the record, then updates with newSno.
    // We pass originalSno as the lookup key — but the backend actually uses `id`
    // as the primary key so sending newSno is fine here.
    try {
      const res = await axios.post(
        `${API_BASE_URL}/planning-route/MappingCoordinator/update`,
        updatedData
      );
      if (res.status === 200 || res.status === 201) {
        handleOpenSnackbar("Coordinator updated successfully!", "success");
        resetCoordinatorForm();
        fetchDataCoord();
      } else {
        handleOpenSnackbar("Failed to update coordinator.", "error");
      }
    } catch (e) {
      console.error("handleUpdate error:", e);
      handleOpenSnackbar(e.response?.data?.message || "Error updating coordinator.", "error");
    }
  };

  // ── Single source of truth for resetting all coordinator form fields ──────────
  const resetCoordinatorForm = () => {
    setEditingIndex(null);
    setEditingRowIndex(null);
    setSelectedId(null);
   
    setSelectedTrainingId(null);
    setCoordinatorType("Multiple");
    setSelectedBranches([]);
    setSelectedDepartments([]);
    setCoordinatorCode("");
    setCoordinatorName("");
    setCoordinatorEmail("");
    setCoordinatorInputValue("");
    setCoordinatorTraineeCount("");
    setTraineeCount({});
    setCoordinatorList([]);
    setErrors({});
  };

  const handleCancel = () => resetCoordinatorForm();

  const handleClearFields = () => resetCoordinatorForm();

  // ─── Sub-Coordinator ──────────────────────────────────────────────────────────
  const addSubCoordinator = async (planningId, sNo, user, subCoord) => {
    try {
      setValidationAttempted(true);
      if (!subCoord.emp_id) return;
      const coordRes = await fetch(`${API_BASE_URL}/planning-route/MappingCoordinator/view`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planing_id: planningId || trainingData.id }),
      });
      const coordData = await coordRes.json();
      if (!coordData.success || !coordData.data?.length) { setSnackbar({ open: true, message: "No coordinators found.", severity: "warning" }); return; }
      let coordinator = coordData.data.find((c) => c.coordinator_emp_id == user.emp_id);

        if (!coordinator && isAdminOrCreator) {
          // Admin: use the first available coordinator record as the host,
          // but override identity fields with admin's own emp_id/name/email
          const hostCoord = coordData.data[0];
          coordinator = {
            ...hostCoord,
            coordinator_emp_id: user.emp_id,
            coordinator_name:   user.empname || user.user_name || "",
            coordinator_email:  user.user_email || "",
          };
        }

        if (!coordinator) {
          setSnackbar({ open: true, message: "Access Denied: Not a coordinator.", severity: "error" });
          return;
        }
      const selBranch = chosenBranch || coordinator.branch;
      const selDept = chosenDepartment || coordinator.department;
      const addRes = await fetch(`${API_BASE_URL}/planning-route/MappingSubCoordinator/add`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          PMC_id: coordinator.id, planing_id: coordinator.planing_id, emp_id: coordinator.emp_id,
          session_no: coordinator.session_no, coordinator_type: coordinator.coordinator_type,
          branch: selBranch, department: selDept, coordinator_emp_id: coordinator.coordinator_emp_id,
          coordinator_name: coordinator.coordinator_name, coordinator_email: coordinator.coordinator_email,
          sub_coordinator_emp_id: subCoord.emp_id, sub_coordinator_name: subCoord.full_name,
          sub_coordinator_email: subCoord.email, apprx_trainee_count: coordinator.apprx_trainee_count,
        }),
      });
      const addData = await addRes.json();
      if (addData.success || addData.message?.includes("successfully")) {
        setSnackbar({ open: true, message: "Sub-Coordinator added successfully!", severity: "success" });
        await fetchSubCoordinatorsForLoggedInCoordinator();
        await fetchSubCoordinators(planningId, sNo, user);
      } else { setSnackbar({ open: true, message: `Failed: ${addData.message}`, severity: "error" }); }
    } catch (e) { setSnackbar({ open: true, message: "An error occurred.", severity: "error" }); }
  };

  const deleteSubCoordinator = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/planning-route/MappingSubCoordinator/delete`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success || data.message?.toLowerCase().includes("delete successfully")) {
        await fetchSubCoordinatorsForLoggedInCoordinator();
        setSubCoordinators((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (e) { console.error(e); }
  };

  // ─── Trainee mapping ──────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    setValidationAttempted(true);
    const draftSessionNo = selectedSessionNo;
    if (!draftSessionNo) { handleOpenSnackbar("Please select a session before saving.", "error"); return; }
    if (!selectedTrainees?.length) { handleOpenSnackbar("No trainees selected to map.", "error"); return; }
    try {
      const pid = Number(sessions?.planing_id || selectedTrainingId || trainingData.id || 0);
      if (!pid) { handleOpenSnackbar("Planning ID is missing.", "error"); return; }

      const resolvedBranch = (
        selectedCoordinator?.branch ||
        autoCoordinator?.branch ||
        selectedSession?.branch ||
        traineeBranch ||
        (isAdminOrCreator ? branches.join(", ") : "") ||   // ← admin fallback: training-level branches
        (typeof selectedbranch === "string" ? selectedbranch : "")
      ).toUpperCase().trim();

      const resolvedDept = (
        selectedCoordinator?.department ||
        autoCoordinator?.department ||
        selectedSession?.department ||
        traineedepartment ||
        (isAdminOrCreator ? departments.join(", ") : "") || // ← admin fallback: training-level departments
        (typeof selecteddepartment === "string" ? selecteddepartment : "")
      ).toUpperCase().trim();

      const coordRes = await fetch(`${API_BASE_URL}/planning-route/MappingCoordinator/list`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planing_id: pid }),
      });
      const listData = await coordRes.json();
      if (!listData.coordinators?.length) {
        handleOpenSnackbar("No coordinator mapped yet. Please complete Step 1 first.", "error");
        return;
      }

      const myCoordRecord = listData.coordinators.find(
        (c) => String(c.coordinator_emp_id) === String(loggedInUser?.emp_id)
      ) || listData.coordinators[0];

      const coordEmpId = selectedCoordinator?.coordinator_emp_id ||
        autoCoordinator?.coordinator_emp_id ||
        loggedInUser?.emp_id || "";
      const coordName = selectedCoordinator?.coordinator_name ||
        autoCoordinator?.coordinator_name ||
        loggedInUser?.empname || "";

      const mapped = mapTraineeIdsAndEmails(selectedTrainees);
      if (!Object.keys(mapped).length) {
        handleOpenSnackbar("No valid trainees to save (missing email/branch/department data).", "error");
        return;
      }

      const payload = {
        planing_id: pid,
        session_no: Number(draftSessionNo),
        coordinator_type: myCoordRecord?.coordinator_type || "coordinator",
        branch: resolvedBranch,
        department: resolvedDept,
        coordinator_emp_id: coordEmpId,
        coordinator_name: coordName,
        trainee_id_name_and_mail: mapped,
      };

      const res = await axios.post(`${API_BASE_URL}/planning-route/PlanningSessionAsigningEmpMail/add`, payload);
      if (res.status === 200 || res.status === 201) {
        handleOpenSnackbar("Draft saved successfully! Review the list below, then click Submit to finalise and notify.", "success");
        setIsDraftSaved(true);
        setSelectedTrainees([]);
        await fetchDraftList();
      } else { throw new Error("Failed to save draft."); }
    } catch (e) {
      console.error("Draft save error:", e);
      handleOpenSnackbar("Error saving draft. Please try again.", "error");
    }
  };

const handleMapTrainees = async () => {
  try {
    const traineesToSubmit = draftTrainees.length > 0 ? draftTrainees : selectedTrainees;
    if (!traineesToSubmit?.length) {
      handleOpenSnackbar(
        "No trainees to submit. Please Draft at least one trainee first.",
        "error"
      );
      return;
    }
 
    const pid = Number(
      trainingData.id || selectedTrainingId || sessions?.planing_id || 0
    );
    if (!pid) {
      handleOpenSnackbar("Planning ID is missing.", "error");
      return;
    }
 
    const resolvedSessionNo = Number(
      selectedSessionNo || traineesToSubmit[0]?.session_no || 0
    );
    if (!resolvedSessionNo) {
      handleOpenSnackbar("No session selected.", "error");
      return;
    }
 
    // ── Resolve coordinator identity ───────────────────────────────────────────
    const coordRes = await fetch(
      `${API_BASE_URL}/planning-route/MappingCoordinator/list`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planing_id: pid }),
      }
    );
    const listData = await coordRes.json();
    const coords = listData.coordinators || [];
 
    let loggedInSubCoordinator = null;
    let coordType = "coordinator";
    const loggedInCoordinator = coords.find(
      (c) => String(c.coordinator_emp_id) === String(loggedInUser?.emp_id)
    );
 
    if (!loggedInCoordinator) {
      const subRes = await fetch(
        `${API_BASE_URL}/planning-route/MappingSubCoordinator/PlanningMainTableList`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planing_id: pid }),
        }
      );
      if (subRes.ok) {
        const subList = await subRes.json();
        loggedInSubCoordinator = subList.coordinators?.find((s) =>
          s.sub_coordinator_emp_ids
            ?.split(",")
            .map((x) => x.trim())
            .includes(String(loggedInUser?.emp_id))
        );
        if (loggedInSubCoordinator) coordType = "sub-coordinator";
      }
    }
    if (!loggedInCoordinator && !loggedInSubCoordinator) {
      if (!isAdminOrCreator) {
        handleOpenSnackbar(
          "You are not mapped as a coordinator or sub-coordinator for this training.",
          "error"
        );
        return;
      }
      // Admin proceeds — identity is set from loggedInUser below
    }
    // ── Build trainee map ──────────────────────────────────────────────────────
    const finalMap = traineesToSubmit.reduce((acc, t) => {
      acc[t.emp_id] = [
        t.full_name || "",
        t.email || "",
        t.branch_name || "",
        t.department || t.department_name || "",
      ];
      return acc;
    }, {});
 
    if (!Object.keys(finalMap).length) {
      handleOpenSnackbar("No trainees found to submit.", "error");
      return;
    }
 
    let cEmpId =
      selectedCoordinator?.coordinator_emp_id ||
      autoCoordinator?.coordinator_emp_id ||
      loggedInUser?.emp_id ||
      "";
    let cName =
      selectedCoordinator?.coordinator_name ||
      autoCoordinator?.coordinator_name ||
      loggedInUser?.empname ||
      "";
 
    if (loggedInCoordinator) {
      cEmpId = loggedInCoordinator.coordinator_emp_id;
      cName = loggedInCoordinator.coordinator_name;
    } else if (loggedInSubCoordinator) {
      const ids = loggedInSubCoordinator.sub_coordinator_emp_ids?.split(",") || [];
      const names =
        loggedInSubCoordinator.sub_coordinator_names
          ?.split(")(")
          .map((n) => n.replace(/^\(|\)$/g, "")) || [];
      const idx2 = ids.findIndex((id) => id.trim() === String(loggedInUser?.emp_id));
      cEmpId = idx2 >= 0 ? loggedInUser.emp_id : ids[0] || cEmpId;
      cName = idx2 >= 0 ? names[idx2] || "" : names[0] || cName;
    } else if (isAdminOrCreator) {
      // Admin acts as coordinator — use their own identity
      cEmpId = loggedInUser?.emp_id || "";
      cName  = loggedInUser?.empname || "";
    }
 
    const resolvedBranch =
        loggedInCoordinator?.branch ||
        loggedInSubCoordinator?.branch ||
        selectedCoordinator?.branch ||
        autoCoordinator?.branch ||
        (isAdminOrCreator ? branches.join(", ") : "") || ""; // ← admin fallback

      const resolvedDept =
        loggedInCoordinator?.department ||
        loggedInSubCoordinator?.dept ||
        selectedCoordinator?.department ||
        autoCoordinator?.department ||
        (isAdminOrCreator ? departments.join(", ") : "") || ""; // ← admin fallback
 
    const payload = {
      planing_id: pid,
      session_no: resolvedSessionNo,
      coordinator_type: coordType,
      branch: resolvedBranch,
      department: resolvedDept,
      coordinator_emp_id: cEmpId,
      coordinator_name: cName,
      trainee_id_name_and_mail: finalMap,
    };
 
    // ── Save to DB ─────────────────────────────────────────────────────────────
    const res = await axios.post(
      `${API_BASE_URL}/planning-route/PlanningSessionAsigningEmpMail/add`,
      payload
    );
 
    if (res.status !== 200) {
      handleOpenSnackbar("Failed to map trainees.", "error");
      return;
    }
 
    // ── Update session status ──────────────────────────────────────────────────
    await fetch(`${API_BASE_URL}/planning-route/session/updateStatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planing_id: payload.planing_id,
        session_no: payload.session_no,
        PSstatus: "Trainee Mapped",
      }),
    });
 
    // ── KEY FIX: ALWAYS send notifications for ALL trainees in this submit ─────
    // Do NOT filter by notifiedTraineeIds here — the backend handles batching.
    // localStorage is updated AFTER send for the UI "New" badge only.
    const allSubmittedIds = Object.keys(finalMap);
 
    console.log(
      `📧 Sending trainee notifications for ${allSubmittedIds.length} trainees (session ${resolvedSessionNo})`
    );
 
    // Resolve venue/compose payload from compose modal state
    const actualSessionMode = (
      sessionData.find(
        (s) => String(s.session_no) === String(resolvedSessionNo)
      )?.mode_of_training || ""
    ).toLowerCase();
    const isVirtualSession = actualSessionMode === "virtual";
    const venuePayload = {};
    if (isVirtualSession) {
      if (virtualPlatform) venuePayload.platform    = virtualPlatform;
      if (virtualLink)     venuePayload.virtualLink = virtualLink;
    } else {
      if (venueLocation) venuePayload.location  = venueLocation;
      if (venueRoomName) venuePayload.roomName  = venueRoomName;
      if (venueMapLink)  venuePayload.mapLink   = venueMapLink;
    }
 
    await sendNotification(
      "sendTraineeNotification",
      {
        planing_id: payload.planing_id,
        session_no: payload.session_no,
        trainee_id_name_and_mail: finalMap,          // send ALL, backend batches
        ...(composeMessage.trim() && { customMessage: composeMessage.trim() }),
        ...(Object.keys(venuePayload).length && { venueDetails: venuePayload }),
      },
      `Trainee notification — ${allSubmittedIds.length} trainees (session ${resolvedSessionNo})`
    );
 
    // Update localStorage AFTER successful send (for UI badge only)
    const updatedNotified = new Set([
      ...notifiedTraineeIds,
      ...allSubmittedIds.map(String),
    ]);
    setNotifiedTraineeIds(updatedNotified);
    const notifyKey = `notifiedTrainees_${payload.planing_id}_${payload.session_no}`;
    localStorage.setItem(notifyKey, JSON.stringify([...updatedNotified]));
 
    handleOpenSnackbar(
      `✅ Submitted! Notifications sent to ${allSubmittedIds.length} trainee(s).`,
      "success"
    );
 
    setDraftTrainees([]);
    navigate("/admindashboard/dashboardcontent");
 
  } catch (e) {
    console.error("handleMapTrainees error:", e);
    handleOpenSnackbar("An error occurred while mapping trainees.", "error");
  }
};

  const handleDeleteTrainee = async (pId, traineeId) => {
    try {
      const numPid = Number(pId || trainingData.id);
      if (!numPid) { console.error("handleDeleteTrainee: missing planing_id"); return; }

      const traineeInState = draftTrainees.find(
        (t) => String(t.emp_id) === String(traineeId)
      );
      const sNo = Number(
        traineeInState?.session_no ||
        selectedSessionNo ||
        0
      );

      if (!sNo) {
        handleOpenSnackbar("Cannot delete: session number not found.", "error");
        return;
      }

      const deleteRes = await fetch(
        `${API_BASE_URL}/planning-route/PlanningSessionAsigningEmpMail/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planing_id: numPid, session_no: sNo, trainee_id: traineeId }),
        }
      );

      if (!deleteRes.ok) {
        const errText = await deleteRes.text();
        throw new Error(`Delete failed: ${deleteRes.status} — ${errText}`);
      }

      setDraftTrainees((prev) => {
        const updated = prev.filter((t) => String(t.emp_id) !== String(traineeId));
        localStorage.setItem(`draftTrainees_${numPid}_${sNo}`, JSON.stringify(updated));
        return updated;
      });
      setSelectedTrainees((prev) =>
        prev.filter((t) => String(t.emp_id) !== String(traineeId))
      );
      setDraftRefreshKey((k) => k + 1);
      handleOpenSnackbar("Trainee removed successfully.", "success");

      await fetchDraftList();
    } catch (e) {
      console.error("handleDeleteTrainee error:", e);
      handleOpenSnackbar("Failed to delete trainee. Please try again.", "error");
    }
  };

  // ── CHANGE 3: Email validation helper ─────────────────────────────────────────
  // Returns true if trainee has a valid email, false otherwise
  const hasValidEmail = (trainee) => {
    return !!(trainee?.email && String(trainee.email).trim() !== "" && String(trainee.email).includes("@"));
  };

  // ─── Bulk paste handler (CHANGE 3: skip no-email, CHANGE 2: warn on not found) ──
  const handleBulkPaste = () => {
    if (!bulkPasteInput.trim()) { setBulkPasteError("Please paste at least one Employee ID."); return; }
    const rawIds = bulkPasteInput.split(/[\s,;\n\r]+/).map((id) => id.trim()).filter(Boolean);
    if (!rawIds.length) { setBulkPasteError("No valid IDs found."); return; }

    const matched = [], notFound = [], noEmail = [];
    rawIds.forEach((id) => {
        const found = allEmployees.find((t) => String(t.emp_id).toLowerCase() === id.toLowerCase());

      if (!found) {
        notFound.push(id);
      } else if (!hasValidEmail(found)) {
        // CHANGE 3: trainee found but has no email — cannot be added
        noEmail.push(`${found.full_name || id} (${found.emp_id})`);
      } else {
        matched.push(found);
      }
    });

    if (!matched.length && !noEmail.length) {
      setBulkPasteError(`None of the ${rawIds.length} IDs matched any employee in the current filter.`);
      return;
    }

    const existingIds = new Set(selectedTrainees.map((t) => t.emp_id));
    const newOnes = matched.filter((t) => !existingIds.has(t.emp_id));
    setSelectedTrainees((prev) => [...prev, ...newOnes]);
    setBulkPasteInput("");

    // Build combined feedback message
    const parts = [];
    if (newOnes.length) parts.push(`✅ Added ${newOnes.length} trainee(s)`);
    if (matched.length - newOnes.length > 0) parts.push(`⚠️ ${matched.length - newOnes.length} already selected`);
    if (noEmail.length) parts.push(`🚫 No email — cannot add: ${noEmail.join(", ")}`);
    if (notFound.length) parts.push(`❌ Not found: ${notFound.join(", ")}`);
    setBulkPasteError(parts.join(" | "));
  };

  // ─── Submit (Schedule) ────────────────────────────────────────────────────────
  const sendNotification = async (endpoint, payload, label = endpoint) => {
    try {
      const res = await fetch(`${API_BASE_URL}/ListnesRoutes/notification/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.warn(`⚠️ ${label} failed (${res.status}): ${errText}`);
      }
    } catch (e) {
      console.warn(`⚠️ ${label} error (non-blocking):`, e.message);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;                          // block double-click
    const planningId =
      selectedTrainingId ||                                    // set when user picks a session in dropdown
      (sessions?.planing_id !== "" ? sessions?.planing_id : null) ||  // form state (skip if empty string)
      trainingData?.id ||                                      // ← the one that was always set from route state
      savedData?.[0]?.planing_id ||                           // from the coordinator list already saved
      sessionData?.[0]?.planing_id ||                         // from the session list already saved
      null;  
      if (!planningId) { handleOpenSnackbar("Planning ID is missing.", "error"); return; }
    setIsSubmitting(true);                             // lock button immediately
    const requestData = {
      id: planningId, emp_id: sessions?.emp_id || loggedInUser?.emp_id || "",
      user_name: sessions?.user_name || loggedInUser?.empname || "",
      user_email: sessions?.user_email || loggedInUser?.user_email || "", Status: "Training Scheduled",
    };
    try {
      const res = await fetch(`${API_BASE_URL}/planning-route/updateStatus`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestData),
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      if (!sessionData?.length) return;
      for (const session of sessionData) {
        const sessionRes = await fetch(`${API_BASE_URL}/planning-route/session/updateStatus`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planing_id: planningId, session_no: session.session_no, PSstatus: "Training Scheduled" }),
        });
        if (!sessionRes.ok) throw new Error(`Session update failed for ${session.session_no}`);

        await sendNotification(
          "sendCoordinatorNotification",
          { planing_id: planningId },
          `Coordinator notification (session ${session.session_no})`
        );

        await sendNotification(
          "sendTrainerNotification",
          { planing_id: planningId, session_no: session.session_no },
          `Trainer notification (session ${session.session_no})`
        );
      }
      localStorage.setItem(`isSubmitted_${planningId}`, "true");
      setIsSubmitted(true);
      setIsThirdStepVisible(true);
      setTrainingData((prev) => ({ ...prev, status: "Training Scheduled" }));
      handleOpenSnackbar("✅ Training Scheduled! Emails sent. Redirecting to Training Summary...", "success");
      handleClearFields();
      setTimeout(() => {
        navigate("/admindashboard/dashboardcontent");
      }, 2000);
    } catch (e) {
      handleOpenSnackbar("Failed to update status.", "error");
      setIsSubmitting(false);                          // unlock only on error so user can retry
    }
  };

  // ─── UI helpers ───────────────────────────────────────────────────────────────
  const handleOpenSnackbar = (message = "", severity = "info") => {
    if (!message) return;
    setSnackbarOpen(false);
    setTimeout(() => { setSnackbarMessage(message); setSnackbarSeverity(severity); setSnackbarOpen(true); }, 100);
  };

  const handleCoordinatorTypeChange = (e) => {
    const val = e.target.value;
    setCoordinatorType(val);
    if (val === "Single") { setSelectedBranches(availableBranches); setSelectedDepartments(departments); fetchCoordinators(availableBranches); }
    else { setSelectedBranches([]); setSelectedDepartments([]); setCoordinatorList([]); }
    setCoordinatorInputValue(""); setCoordinatorCode(""); setCoordinatorName(""); setCoordinatorEmail("");
  };

  const handleCountChange = (brs, value) => {
    const num = parseFloat(value);
    if (Array.isArray(brs) && brs.length) {
      setTraineeCount((prev) => { const updated = { ...prev }; brs.forEach((b) => { updated[b] = num; }); return updated; });
    }
  };

  const formatSelectedValues = (list) => list.length > 2 ? `${list[0]} ++` : list.join(", ");

  const handleNext = () => {
    if (!sessionData.length) { handleOpenSnackbar("Please add at least one session before proceeding.", "error"); return; }
    setActiveStep((prev) => {
      const next = prev + 1;
      if (next === 1 && sessions?.planing_id) fetchCoordinatorView(sessions.planing_id);
      return next;
    });
  };

  const handleStepClick = (step) => {
    setActiveStep(step);
    if (step === 1 && sessions?.planing_id) fetchCoordinatorView(sessions.planing_id);
  };

  const toggleExpand = () => setIsExpanded((prev) => !prev);
  const toggleStepperExpand = () => setIsStepperExpanded((prev) => !prev);
  const handleToggleSubCoordinatorStep = useCallback((e) => setShowSubCoordinatorStep(e.target.checked), []);

  const handleOpenDraftModal = async () => { await fetchDraftList(); setModalOpen(true); };

  const refreshDraft = async () => { await fetchDraftList(); setDraftRefreshKey((k) => k + 1); };

  // ─── Effects ─────────────────────────────────────────────────────────────────

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const stored = sessionStorage.getItem("userDetails");
    if (stored) {
      try { setLoggedUser({ ...JSON.parse(stored) }); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [API_BASE_URL, trainingData.id]); // eslint-disable-line

  useEffect(() => {
    if (sessionData?.length > 0) {
      setSessions((prev) => ({ ...prev, sessionNumber: sessionData.length + 1 }));
    } else {
      setSessions((prev) => ({ ...prev, sessionNumber: 1 }));
    }
  }, [sessionData]);

  useEffect(() => {
    if (activeStep !== 0 && editSessionId === null) resetSessionForm();
  }, [activeStep]); // eslint-disable-line

  useEffect(() => {
    return () => {
      if (location.pathname !== "/NEIN-LND/admindashboard/agenda") resetSessionForm();
    };
  }, [location.pathname]); // eslint-disable-line

  useEffect(() => { fetchTrainers(); }, [API_BASE_URL]); // eslint-disable-line

  useEffect(() => {
    fetchBranches(); // eslint-disable-line
    if (branch === "Pan India" || !branch?.trim()) setSelectedBranches([]);
  }, [branch]);

  useEffect(() => { fetchCoordinators(null, true); }, [selectedBranches, coordinatorType]); // eslint-disable-line

  useEffect(() => {
    if (selectedBranches.length > 0 && !isEditingRef.current) fetchCoordinators(selectedBranches); // eslint-disable-line
  }, [selectedBranches]);

  useEffect(() => {
    if (coordinatorCode && coordinatorList.length > 0) {
      const found = coordinatorList.find((c) => c.emp_id === coordinatorCode);
      if (found) setCoordinatorInputValue(found.full_name);
    }
  }, [coordinatorCode, coordinatorList]);

  useEffect(() => {
    if (
      coordinatorType === "Single" &&
      availableBranches.length > 0 &&
      departments.length > 0 &&
      (JSON.stringify(prevBranches.current) !== JSON.stringify(availableBranches) ||
        JSON.stringify(prevDepartments.current) !== JSON.stringify(departments))
    ) {
      setSelectedBranches([...availableBranches]);
      setSelectedDepartments([...departments]);
      prevBranches.current = [...availableBranches];
      prevDepartments.current = [...departments];
    }
  }, [coordinatorType, availableBranches, departments]);

  useEffect(() => {
    if (sessionData.length > 0 && selectedSession === null) {
      const first = sessionData[0];
      
      setSessions((prev) => ({ ...prev, planing_id: first.planing_id, session_no: first.session_no }));
      setSelectedTrainingId(first.planing_id);
      setSelectedSessionNo(first.session_no);
    }
  }, [sessionData]);

  useEffect(() => {
    if (!sessionData || sessionData.length === 0) return;
    const first = sessionData[0];
    if (!first?.planing_id) return;
    const tid = first.planing_id || trainingData.id;
    axios.post(`${API_BASE_URL}/planning-route/MappingCoordinator/list`, { planing_id: tid })
      .then((res) => {
        const coords = res.data.coordinators || [];
        setSavedData(coords);
        setIsDataSaved(coords.length > 0);
      }).catch(console.error);
  }, [sessionData]);

useEffect(() => {
  // Run whenever allEmployees is populated OR filters change
  if (!allEmployees.length) return;   // wait until data is loaded
  filterTraineesByBranchAndDept(allEmployees, selectedbranch || "", selecteddepartment || "");
}, [selectedbranch, selecteddepartment, allEmployees]);

  useEffect(() => {
    const effectiveBranch = chosenBranch || (availableBranch.length === 1 ? availableBranch[0] : null);
    const effectiveDept = chosenDepartment || (availableDepartments.length === 1 ? availableDepartments[0] : null);
    if (effectiveBranch || effectiveDept)
      filterSubCoordinators(effectiveBranch, effectiveDept, mappedCandidates, loggedInUser);
  }, [chosenBranch, chosenDepartment, mappedCandidates, availableBranch, loggedInUser, filterSubCoordinators]);

  useEffect(() => {
  // ── Guard: need either a mapped session (coordinator) OR admin identity ──
  if (!loggedInUser) return;
  if (!sessions.planing_id && !isAdminOrCreator) return;  

  if (isAdminOrCreator) {
    fetch(`${API_BASE_URL}/login/activeEmplList1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((r) => r.json())
      .then((data) => setFilteredCandidates(data.employees || []))
      .catch(console.error);
    return;
  }

  fetchSubCoordinatorsAndFilter(sessions.planing_id, sessions.session_no, loggedInUser);
}, [sessions.planing_id, sessions.session_no, loggedInUser, isAdminOrCreator, fetchSubCoordinatorsAndFilter]);

  useEffect(() => { fetchSubCoordinators(); }, [trainingData.id, loggedInUser]); // eslint-disable-line

  useEffect(() => {
    const run = async () => {
      try {
        const subs = await fetchSubCoordinators(trainingData.id, loggedInUser); // eslint-disable-line
        setMappedSubCoordinators(subs);
        if (loggedInUser) {
          const res = await fetch(`${API_BASE_URL}/planning-route/MappingSubCoordinator/PlanningToSessionAllSubCoordinatorActiveList`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planing_id: trainingData.id || selectedTrainingId }),
          });
          const data = await res.json();
          setSubCoordinators(data.coordinators || []);
        }
      } catch (e) { console.error(e); }
    };
    run();
  }, [trainingData.id, loggedInUser, selectedTrainingId]);

  useEffect(() => {
    if (!loggedInUser || !allCoordinators.length) return;
    const mc = allCoordinators.find((c) => c.coordinator_emp_id === loggedInUser.emp_id);
    if (mc) {
      const ab = mc.branch?.split(",").map((b) => b.trim()) || [];
      const ad = mc.department?.split(",").map((d) => d.trim()) || [];
      setFilteredBranches((prev) => JSON.stringify(prev) !== JSON.stringify(ab) ? ab : prev);
      setFilteredDepartments((prev) => JSON.stringify(prev) !== JSON.stringify(ad) ? ad : prev);
    }
  }, [loggedInUser, allCoordinators]);

  useEffect(() => {
    if (!traineeBranch || !traineedepartment) { setFilteredCoordinators(coordinators); return; }
    const filtered = coordinators.filter((c) => c.branch === traineeBranch && c.department === traineedepartment);
    setFilteredCoordinators((prev) => JSON.stringify(prev) !== JSON.stringify(filtered) ? filtered : prev);
  }, [traineeBranch, traineedepartment, coordinators]);

  useEffect(() => {
    if (trainingData.id && loggedInUser) fetchCoordinatorDetails(trainingData.id, loggedInUser);
  }, [trainingData.id, loggedInUser, fetchCoordinatorDetails]);

// ── Reset ref whenever training changes (must be declared BEFORE the guard effect) ──
useEffect(() => {
  fetchAllCoordsRanRef.current = false;
}, [trainingData?.id]);

useEffect(() => {
  if (isAdminOrCreator) return;
  if (!trainingData?.id || !loggedInUser?.emp_id) return;
  if (fetchAllCoordsRanRef.current) return;
  fetchAllCoordsRanRef.current = true;
  fetchAllCoordinators(trainingData.id, loggedInUser);
}, [trainingData?.id, loggedInUser?.emp_id, fetchAllCoordinators, isAdminOrCreator]);

useEffect(() => {
  if (trainingData.id && loggedInUser?.emp_id) fetchSubCoordinatorsForLoggedInCoordinator();
}, [trainingData.id, loggedInUser]);

useEffect(() => {
  const pid = selectedTrainingId || trainingData?.id;
  if (!pid) return;

  const alreadyScheduled = [
    "Training Scheduled",
    "Training Conducted", 
    "Feedback Assigned",
    "Final Submitted",
    "Attendance Added",
  ].includes(trainingData?.status);

  if (alreadyScheduled || localStorage.getItem(`isSubmitted_${pid}`) === "true") {
    setIsSubmitted(true);
    setIsThirdStepVisible(true);
    localStorage.setItem(`isSubmitted_${pid}`, "true");
  }
}, [selectedTrainingId, trainingData?.id, trainingData?.status]);

// // Add this useEffect
// useEffect(() => {
//   // If training is already scheduled, mark as submitted immediately
//   if (
//     trainingData?.status === "Training Scheduled" ||
//     trainingData?.status === "Training Conducted" ||
//     trainingData?.status === "Feedback Assigned" ||
//     trainingData?.status === "Final Submitted"
//   ) {
//     setIsSubmitted(true);
//     setIsThirdStepVisible(true);
//     // Also persist to localStorage so it survives re-renders
//     if (trainingData?.id) {
//       localStorage.setItem(`isSubmitted_${trainingData.id}`, "true");
//     }
//   }
// }, [trainingData?.status, trainingData?.id]);

  useEffect(() => {
    if (!userDetails?.emp_id || !trainingId) return;
    fetch(`${API_BASE_URL}/planning-route/CorOrSubViewPlaningDetails`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emp_id: userDetails.emp_id }),
    }).then((r) => r.json()).then((data) => {
      if (!data.records?.length) return;
      const filtered = data.records.filter((r) => r.id === trainingId);
      const mappedData = filtered.map((record) => ({
        emp_id: userDetails?.emp_id, name: userDetails?.empname,
        role_type: record.role_type, session_no: record.session_no,
        session_no1: record.Session_no1, branch: record.branch_names,
        department: record.department_names,
      }));
      setMappedCoordinators(mappedData);
    }).catch(console.error);
  }, [userDetails, trainingId]);

  useEffect(() => {
  if (!userDetails?.emp_id || !trainingData?.id) return;

  const knownScheduled = [
    "Training Scheduled", "Training Conducted",
    "Feedback Assigned", "Final Submitted", "Attendance Added",
  ].includes(trainingData?.status);

  if (knownScheduled) {
    setIsThirdStepVisible(true);
    setIsSubmitted(true);
    if (trainingData?.id) localStorage.setItem(`isSubmitted_${trainingData.id}`, "true");
    return;
  }

  // Only reach here when status is "Training Created" (not yet scheduled)
  setIsThirdStepVisible(false);


  const checkVisibility = async () => {
    try {
      const { department_code, branch_id } = userDetails;
      if (department_code && branch_id) {
        const planRes = await fetch(`${API_BASE_URL}/planning-route/viewPlaningInfo`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ department_code, branch_id }),
        });
        if (planRes.ok) {
          const planData = await planRes.json();
          const liveRecord = planData?.data?.find(
            (item) => String(item.id) === String(trainingData.id)
          );
          if (liveRecord && knownScheduled === false &&
              ["Training Scheduled","Training Conducted","Feedback Assigned","Final Submitted","Attendance Added"]
                .includes(liveRecord.Status)) {
            setTrainingData((prev) => ({ ...prev, status: liveRecord.Status }));
            setIsThirdStepVisible(true);
            setIsSubmitted(true);
            localStorage.setItem(`isSubmitted_${trainingData.id}`, "true");
            return;
          }
        }
      }

      const roleRes = await fetch(`${API_BASE_URL}/planning-route/CorOrSubViewPlaningDetails`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emp_id: userDetails.emp_id }),
      });
      if (!roleRes.ok) return;
      const result = await roleRes.json();
      const forThisTraining = (result.records || []).filter(
        (r) => String(r.training_id) === String(trainingData.id)
      );
      if (!forThisTraining.length) return;
      const validRecord = forThisTraining.find((r) =>
        ["coordinator", "sub_coordinator"].includes(r.role_type?.toLowerCase()) &&
        ["Training Scheduled","Training Conducted","Feedback Assigned","Final Submitted","Attendance Added"]
          .includes(r.status)
      );
      if (validRecord) {
        setIsThirdStepVisible(true);
        setIsSubmitted(true);
        localStorage.setItem(`isSubmitted_${trainingData.id}`, "true");
      }
    } catch (e) {
      console.error("Error checking step visibility:", e);
    }
  };

 checkVisibility();
}, [userDetails?.emp_id, trainingData.id, trainingData?.status, isAdminOrCreator]);

  // ── autoCoordinator effect — load all trainees immediately; branch/dept are optional filters ──
  useEffect(() => {
      if (isAdminOrCreator) return; 
    if (!autoCoordinator) return;
    if (selectedCoordinator?.coordinator_emp_id === autoCoordinator.coordinator_emp_id) return;
    setSelectedCoordinator(autoCoordinator);
    setCoordinatorId(autoCoordinator.coordinator_emp_id);
    const brs = autoCoordinator.branch?.split(",").map((b) => b.trim()) || [];
    setAvailableBranches(brs);

    if (brs.length === 1) setSelectedbranch(brs[0]);
    // Do NOT pre-fill selectedbranch — keep it empty so dropdowns start blank
   const dpts = autoCoordinator.department?.split(",").map((d) => d.trim()) || [];
    setAvailableDepartments(dpts);

      if (dpts.length === 1) setSelecteddepartment(dpts[0]);

    // Do NOT pre-fill selecteddepartment either
    if (autoCoordinator.session_no) setSessionNo(autoCoordinator.session_no);
    // Fetch all trainees with no filters — user can optionally narrow down
      fetchTrainees();

  }, [autoCoordinator, fetchTrainees, isAdminOrCreator]);

  useEffect(() => {
    fetchDraftList(); // eslint-disable-line

    if (trainingData.id && selectedSessionNo) {
      try {
        const key = `notifiedTrainees_${trainingData.id}_${selectedSessionNo}`;
        const stored = JSON.parse(localStorage.getItem(key) || "[]");
        setNotifiedTraineeIds(new Set(stored.map(String)));
      } catch { setNotifiedTraineeIds(new Set()); }
    }
  }, [trainingData.id, selectedSessionNo]);

  useEffect(() => { if (modalOpen) fetchDraftList(); }, [modalOpen]); // eslint-disable-line

  // ── Load all trainees when user reaches Step 3 (in case auto-coordinator didn't fire) ──
// ── Load all trainees when user reaches Step 3 ──
useEffect(() => {
  if (activeStep === 3) {
    fetchTrainees._loaded = false;  // ← always reset so fetch actually runs
    fetchTrainees();
  }
}, [activeStep, fetchTrainees]);

  // ─── Render step content ──────────────────────────────────────────────────────
  const renderStepContent = (step) => {
    switch (step) {

      // ── STEP 0: Sessions ──────────────────────────────────────────────────────
      case 0:
        return (
          <Box sx={{ p: 1 }}>
            <Typography variant="h6" sx={{ textAlign: "center", mb: 2, color: "#1A005D", fontWeight: "bold" }}>
              {editSessionId ? "Edit Session Details" : "Session Details"}
            </Typography>
            <Paper elevation={3} sx={{ p: 3, borderRadius: "12px" }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Session" disabled={isSubmitted}
                    value={`NEIN/${user_br}/S0${editSessionId ? sessions.session_no : sessionData.length + 1}`}
                    variant="outlined" InputProps={{ sx: { height: "40px" }, readOnly: true }}
                    InputLabelProps={{ sx: { color: "#8EC400", "&.Mui-focused": { color: "#8EC400" } } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Session Description" required disabled={isSubmitted}
                    value={sessions.description} variant="outlined" error={!!errors.description}
                    onChange={(e) => handleSessionChange("description", e.target.value)}
                    InputProps={{ sx: { height: "40px" } }}
                    InputLabelProps={{ shrink: Boolean(sessions.description), sx: { color: getLabelColor(sessions.description), "&.Mui-focused": { color: "#8EC400" } } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Count Of Trainees Expected" value={sessions.count} variant="outlined" required
                    error={!!errors.count} onChange={(e) => handleSessionChange("count", e.target.value.replace(/\D/g, ""))}
                    fullWidth size="small" disabled={isSubmitted} sx={{ height: "40px" }}
                    InputProps={{ sx: { height: "40px" }, inputMode: "numeric" }}
                    InputLabelProps={{ shrink: Boolean(sessions.count), sx: { color: getLabelColor(sessions.count), "&.Mui-focused": { color: "#8EC400" } } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Mode of Training" value={sessions.mode} onChange={(e) => handleSessionChange("mode", e.target.value)}
                    fullWidth required error={!!errors.mode} size="small" disabled={isSubmitted} select sx={{ height: "40px" }}
                    InputLabelProps={{ shrink: Boolean(sessions.mode), sx: { color: getLabelColor(sessions.mode), "&.Mui-focused": { color: "#8EC400" } } }}>
                    <MenuItem value="Virtual">Virtual</MenuItem>
                    <MenuItem value="Classroom">Classroom</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Approximate Training Cost" value={sessions.cost} error={!!errors.cost}
                    onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) handleSessionChange("cost", e.target.value); }}
                    fullWidth size="small" sx={{ height: "40px" }} InputProps={{ inputMode: "decimal" }}
                    InputLabelProps={{ shrink: Boolean(sessions.cost), sx: { color: getLabelColor(sessions.cost), "&.Mui-focused": { color: "#8EC400" } } }}
                    disabled={isSubmitted}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="PO Number" value={sessions.poNumber}
                    onChange={(e) => handleSessionChange("poNumber", e.target.value)}
                    fullWidth size="small" sx={{ height: "40px" }} InputProps={{ sx: { height: "40px" } }}
                    InputLabelProps={{ shrink: Boolean(sessions.poNumber), sx: { color: getLabelColor(sessions.poNumber), "&.Mui-focused": { color: "#8EC400" } } }}
                    disabled={isSubmitted}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker label="PO Date"
                    value={sessions.poDate && dayjs(sessions.poDate).isValid() ? dayjs(sessions.poDate) : null}
                    onChange={(v) => handleSessionChange("poDate", v ? v.format("YYYY-MM-DD") : "")}
                    minDate={dayjs().startOf("year")} maxDate={dayjs().endOf("year")}
                    slotProps={{ textField: { fullWidth: true, size: "small", sx: { height: "40px" }, error: !!sessions.poNumber && !sessions.poDate, InputLabelProps: { sx: { color: getLabelColor(sessions.poDate), "&.Mui-focused": { color: "#8EC400" } } } }, popper: { placement: "bottom-start" } }}
                    disablePortal={false} disabled={isSubmitted}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker label="Session Date *"
                    value={sessions.date && dayjs(sessions.date).isValid() ? dayjs(sessions.date) : null}
                    onChange={(v) => { const fd = v ? v.format("YYYY-MM-DD") : ""; handleSessionChange("date", fd); if (fd !== sessions.date) { handleSessionChange("fromTime", ""); handleSessionChange("toTime", ""); } }}
                    minDate={dayjs()}
                    slotProps={{ textField: { fullWidth: true, size: "small", sx: { height: "40px" }, error: !!errors.date, inputProps: { readOnly: true }, InputLabelProps: { sx: { color: getLabelColor(sessions.date), "&.Mui-focused": { color: "#8EC400" } } } }, popper: { placement: "bottom-start" } }}
                    disablePortal={false} disabled={isSubmitted}
                  />
                </Grid>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Grid item xs={12} sm={6}>
                    <TimePicker label="From Time *"
                      value={sessions.fromTime ? dayjs(sessions.fromTime, "HH:mm:ss") : null}
                      onChange={(v) => handleSessionChange("fromTime", v ? v.format("HH:mm:ss") : "")}
                      ampm format="hh:mm A"
                      slotProps={{ textField: { fullWidth: true, size: "small", sx: { height: "40px" }, error: !!errors.fromTime, InputLabelProps: { sx: { color: getLabelColor(sessions.fromTime), "&.Mui-focused": { color: "#8EC400" } } } } }}
                      disabled={isSubmitted}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TimePicker label="To Time *"
                      value={sessions.toTime ? dayjs(sessions.toTime, "HH:mm:ss") : null}
                      onChange={(v) => handleSessionChange("toTime", v ? v.format("HH:mm:ss") : "")}
                      ampm format="hh:mm A"
                      slotProps={{ textField: { fullWidth: true, size: "small", sx: { height: "40px" }, error: !!errors.toTime, helperText: errors.toTime, InputLabelProps: { sx: { color: getLabelColor(sessions.toTime), "&.Mui-focused": { color: "#8EC400" } } } } }}
                      disabled={isSubmitted}
                    />
                  </Grid>
                </LocalizationProvider>
                <Grid item xs={12} sm={6}>
                  <Autocomplete options={trainerList} getOptionLabel={(o) => `${o.full_name} (${o.emp_id})`}
                    isOptionEqualToValue={(o, v) => o.emp_id === v.emp_id}
                    value={trainerList.find((t) => t.emp_id ? t.emp_id === sessions.trainerCode : t.full_name === sessions.trainerName) || null}
                    inputValue={inputValue} onInputChange={(_, v) => setInputValue(v)}
                    onChange={(_, v) => setSessions((prev) => ({ ...prev, trainerCode: v?.emp_id || "", trainerEmail: v?.email || "", trainerName: v?.full_name || "" }))}
                    renderInput={(params) => (
                      <TextField {...params} label="Trainer Name" variant="outlined" size="small" required error={!!errors.trainerCode}
                        sx={{ height: "40px" }} InputLabelProps={{ sx: { color: getLabelColor(sessions.trainerCode), "&.Mui-focused": { color: "#8EC400" } } }}
                        InputProps={{ ...params.InputProps, sx: { height: "40px" }, endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setOpenDialog(true)} disabled={isSubmitted}><AddIcon sx={{ color: "#1A005D" }} /></IconButton>{params.InputProps.endAdornment}</InputAdornment>) }}
                        disabled={isSubmitted}
                      />
                    )}
                  />
                  <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                    <DialogTitle>Redirect Confirmation</DialogTitle>
                    <DialogContent>You are about to leave this page. All unsaved data will be cleared. Continue?</DialogContent>
                    <DialogActions>
                      <Button onClick={() => setOpenDialog(false)} color="secondary">Cancel</Button>
                      <Button onClick={() => { setOpenDialog(false); navigate("/admindashboard/lnd/TrainerInfoMaster"); }} color="primary" autoFocus>Yes, Proceed</Button>
                    </DialogActions>
                  </Dialog>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Trainer Email" value={sessions.trainerEmail} variant="outlined"
                    onChange={(e) => handleSessionChange("trainerEmail", e.target.value)} sx={{ height: "40px" }}
                    InputLabelProps={{ shrink: !!sessions.trainerEmail || undefined, sx: { color: getLabelColor(sessions.trainerEmail), "&.Mui-focused": { color: "#8EC400" } } }}
                    disabled={isSubmitted}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                    {!isSubmitted && (
                    <Button
                        variant="contained"
                        onClick={addOrUpdateSessionWithTrainee}
                        disabled={isSessionSubmitting}
                        sx={{ fontWeight: "bold", backgroundColor: "#1A005D", "&:hover": { backgroundColor: "#8EC400", color: "#1A005D" }, minWidth: "120px" }}>
                        {isSessionSubmitting ? 'Saving...' : (editSessionId ? 'Update Session' : 'Add Session')}
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {sessionData.length > 0 && (
              <Box sx={{ mt: 2, overflowX: "auto", maxHeight: "250px" }}>
                <Typography variant="body1" sx={{ textDecoration: "underline", fontWeight: "bold", color: "#1A005D" }}>Sessions Added:</Typography>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { fontWeight: "bold", color: "#f5f5f5", backgroundColor: "#1A005D" } }}>
                      <TableCell>Session</TableCell><TableCell>Trainer</TableCell><TableCell>Count</TableCell>
                      <TableCell>Date</TableCell><TableCell>From</TableCell><TableCell>To</TableCell>
                      {!isSubmitted && <TableCell>Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessionData.sort((a, b) => a.session_no - b.session_no).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((session, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{session.trainer_name}</TableCell>
                        <TableCell>{session.count_of_trainees_expected}</TableCell>
                         <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                            {dayjs(session.session_date).format("DD-MM-YYYY")}
                          </TableCell>

                          <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                            {dayjs(session.from_time, "HH:mm:ss").format("HH:mm")}
                          </TableCell>

                          <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                            {dayjs(session.to_time, "HH:mm:ss").format("HH:mm")}
                          </TableCell>

                          {!isSubmitted && (
                            <TableCell align="center">
                              <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                                <IconButton
                                  onClick={() => handleEditSession(session)}
                                  sx={{ color: "#1A005D", "&:hover": { color: "#8EC400" } }}
                                >
                                  <EditIcon />
                                </IconButton>

                                <IconButton
                                  onClick={() => handleDeleteSession(session.session_no)}
                                  disabled={editSessionId === session.session_no}
                                  sx={{ color: "#8EC400", "&:hover": { color: "#1A005D" } }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </TableCell>
                          )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination component="div" count={sessionData.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 4)); setPage(0); }} />
              </Box>
            )}
            <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
              <Button onClick={handleNext} variant="contained" sx={{ backgroundColor: "#8EC400", color: "white", px: 4, borderRadius: "30px", fontWeight: "bold" }}>Next</Button>
            </Box>
          </Box>
        );

      // ── STEP 1: Mapping Coordinator ───────────────────────────────────────────
      case 1:
        return (
          <Box sx={{ p: 1 }}>
            <Typography variant="h6" sx={{ textAlign: "center", mb: 2, color: "#1A005D", fontWeight: "bold" }}>Mapping Coordinator</Typography>
            <Paper elevation={3} sx={{ p: 3, borderRadius: "12px" }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField label="Select Session *" value={selectedSession || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const sd = sessionData.find((s) => String(s.session_no) === String(val));
                      if (sd) {
                        setSessions((prev) => ({ ...prev, planing_id: sd.planing_id, session_no: sd.session_no }));
                        setSelectedSession(sd.session_no); setSelectedTrainingId(sd.planing_id); setSelectedSessionNo(sd.session_no);
                      }
                    }}
                    select fullWidth size="small"
                    disabled={isSubmitted || editingIndex !== null}
                    variant="outlined"
                    helperText={editingIndex !== null ? "Session cannot be changed while editing" : ""}
                    InputLabelProps={{ shrink: true, sx: { color: "#8EC400", "&.Mui-focused": { color: "#8EC400" } } }}>
                    {sessionData.map((s) => <MenuItem key={s.session_no} value={s.session_no}>{`Session ${s.session_no} - ${s.session_description || "No Description"}`}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Coordinator Type *" value={coordinatorType} onChange={handleCoordinatorTypeChange}
                    fullWidth size="small" select disabled={isSubmitted} sx={{ height: "40px" }}
                    InputLabelProps={{ shrink: true, sx: { color: "#8EC400", "&.Mui-focused": { color: "#8EC400" } } }}>
                    <MenuItem value="Multiple">Multiple</MenuItem>
                    <MenuItem value="Single">Single</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" disabled={isSubmitted}>
                    <InputLabel sx={{ color: "#8EC400", "&.Mui-focused": { color: "#8EC400" } }}>Branch *</InputLabel>
                    <Tooltip title={selectedBranches.join(", ")} arrow disableHoverListener={selectedBranches.length <= 2}>
                      <Select multiple value={selectedBranches}
                        onChange={(e) => { const val = e.target.value; setSelectedBranches(coordinatorType === "Multiple" ? [val[val.length - 1]] : val); }}
                        input={<OutlinedInput label="Branch *" />} renderValue={() => formatSelectedValues(selectedBranches)}
                        disabled={coordinatorType === "Single" || isSubmitted}>
                        {availableBranches.map((b) => <MenuItem key={b} value={b}><Checkbox checked={selectedBranches.includes(b)} /><ListItemText primary={b} /></MenuItem>)}
                      </Select>
                    </Tooltip>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" disabled={isSubmitted}>
                    <InputLabel sx={{ color: "#8EC400", "&.Mui-focused": { color: "#8EC400" } }}>Department *</InputLabel>
                    <Tooltip title={selectedDepartments.join(", ")} arrow disableHoverListener={selectedDepartments.length <= 2}>
                      <Select multiple value={selectedDepartments}
                        onChange={(e) => { const val = e.target.value; if (val.includes("all")) setSelectedDepartments(selectedDepartments.length === departments.length ? [] : departments); else setSelectedDepartments(val); }}
                        input={<OutlinedInput label="Department *" />} renderValue={() => formatSelectedValues(selectedDepartments)}
                        disabled={coordinatorType === "Single" || isSubmitted}>
                        <MenuItem value="all"><Checkbox checked={selectedDepartments.length === departments.length} /><ListItemText primary="Select All" /></MenuItem>
                        {departments.map((d) => <MenuItem key={d} value={d}><Checkbox checked={selectedDepartments.includes(d)} /><ListItemText primary={d} /></MenuItem>)}
                      </Select>
                    </Tooltip>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete key={coordinatorType} options={coordinatorList}
                    getOptionLabel={(o) => (!o || typeof o === "string") ? "" : `${o.full_name} (${o.emp_id})`}
                    isOptionEqualToValue={(o, v) => o.emp_id === v.emp_id}
                    value={coordinatorList.find((c) => c.emp_id === coordinatorCode) || null}
                    inputValue={coordinatorInputValue}
                    onInputChange={(_, v) => { if (!isSubmitted) { setCoordinatorInputValue(v); if (!v) setSessions((prev) => ({ ...prev, coordinatorCode: "", coordinatorEmail: "", coordinatorName: "" })); } }}
                    onChange={(_, v) => {
                      if (!isSubmitted) {
                        if (v) {
                          setCoordinatorCode(v.emp_id);
                          setCoordinatorName(v.full_name);
                          setCoordinatorEmail(v.email);
                        }
                        else { setCoordinatorCode(""); setCoordinatorName(""); setCoordinatorEmail(""); }
                      }
                    }}
                    renderInput={(params) => <TextField {...params} label="Coordinator Name *" variant="outlined" size="small" error={!!errors.coordinatorCode} InputProps={{ ...params.InputProps, style: { height: "45px" }, readOnly: isSubmitted }} InputLabelProps={{ sx: { color: "#8EC400", "&.Mui-focused": { color: "#8EC400" } } }} />}
                    disabled={isSubmitted}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Apprx. Trainee Count *" type="number"
                    value={selectedBranches.length > 0 ? traineeCount[selectedBranches[0]] || "" : ""}
                    onChange={(e) => { if (!isSubmitted && selectedBranches.length > 0) handleCountChange(selectedBranches, e.target.value); }}
                    fullWidth size="small" error={!!errors.traineeCount}
                    InputLabelProps={{ shrink: true, sx: { color: "#8EC400", "&.Mui-focused": { color: "#8EC400" } } }}
                    disabled={selectedBranches.length === 0 || isSubmitted}
                  />
                </Grid>
                {!isSubmitted && (
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                      <Button variant="contained" onClick={editingIndex !== null ? handleUpdate : handleSaveData}
                        sx={{ fontWeight: "bold", backgroundColor: "#1A005D", "&:hover": { backgroundColor: "#8EC400", color: "#1A005D" }, minWidth: "120px" }}>
                        {editingIndex !== null ? "Update" : "Add"}
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {isDataSaved && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" sx={{ mb: 1, fontWeight: "bold", textDecoration: "underline", color: "#1A005D" }}>Assigned Coordinator:</Typography>
                {savedData.length === 0 ? <Typography sx={{ color: "#1A005D", fontStyle: "italic", mt: 1 }}>No data saved yet.</Typography> : (
                  <Box sx={{ overflowX: "auto", boxShadow: "0px 4px 8px rgba(0,0,0,0.1)", borderRadius: "8px" }}>
                    <TableContainer>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow sx={{ "& th": { fontWeight: "bold", color: "#f5f5f5", backgroundColor: "#1A005D" } }}>
                            <TableCell>Session</TableCell><TableCell>Branch</TableCell><TableCell>Department</TableCell>
                            <TableCell>Coordinator Name</TableCell><TableCell>Emp ID</TableCell><TableCell>Trainee Count</TableCell>
                            {!isSubmitted && <TableCell>Actions</TableCell>}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {savedData.map((data, index) => (
                            <TableRow key={index} hover>
                              <TableCell>{data.session_no}</TableCell>
                              <TableCell><Tooltip title={data.branch.includes(",") ? data.branch : ""}><span>{data.branch.split(",").length > 2 ? `${data.branch.split(",")[0]} ++` : data.branch}</span></Tooltip></TableCell>
                              <TableCell><Tooltip title={data.department.includes(",") ? data.department : ""}><span>{data.department.split(",").length > 2 ? `${data.department.split(",")[0]} ++` : data.department}</span></Tooltip></TableCell>
                              <TableCell>{data.coordinator_name}</TableCell>
                              <TableCell>{data.coordinator_emp_id}</TableCell>
                              <TableCell>{data.apprx_trainee_count}</TableCell>
                              {!isSubmitted && (
                              <TableCell align="center">
                                <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                                  
                                  <IconButton
                                    onClick={() => handleEditRow(index, data.planing_id)}
                                    sx={{
                                      color: "#1A005D",
                                      "&:hover": { color: "#8EC400" }
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>

                                  <IconButton
                                    onClick={() => handleDeleteRow(index)}
                                    disabled={editingRowIndex === index}
                                    sx={{
                                      color: "#8EC400",
                                      "&:hover": { color: "#1A005D" }
                                    }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>

                                </Box>
                              </TableCell>
                            )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                      {!(activeStep === 1 && !isThirdStepVisible) && activeStep !== steps.length - 1 && (
                        <Button onClick={handleNext} variant="contained" sx={{ backgroundColor: "#8EC400", color: "white", px: 4, borderRadius: "30px", fontWeight: "bold" }}>Next</Button>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

           {isDataSaved && !isSubmitted && trainingData?.status === "Training Created" && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                {editingIndex === null ? (
                  <Tooltip title={isSubmitting ? "Submitting… please wait" : "Click here to save and trigger notifications"} arrow>
                    <span>
                      <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={isSubmitting}
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: isSubmitting ? "#888" : "#1A005D",
                          "&:hover": { backgroundColor: "#8EC400", color: "#1A005D" },
                          minWidth: "150px",
                          pointerEvents: isSubmitting ? "none" : "auto",
                        }}
                      >
                        {isSubmitting ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <CircularProgress size={16} sx={{ color: "#fff" }} />
                            Submitting…
                          </Box>
                        ) : "Submit"}
                      </Button>
                    </span>
                  </Tooltip>
                ) : (
                  <Button onClick={handleCancel} variant="contained" sx={{ fontWeight: "bold", backgroundColor: "#1A005D", "&:hover": { backgroundColor: "#8EC400", color: "#1A005D" }, minWidth: "120px" }}>Cancel</Button>
                )}
              </Box>
            )}
          </Box>
        );

      // ── STEP 2: Mapping SubCoordinator ────────────────────────────────────────
      case 2:
        return (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Box sx={{ flexGrow: 1 }}>
              <FormControlLabel control={<Switch checked={showSubCoordinatorStep} onChange={handleToggleSubCoordinatorStep} />}
                label="Do you want to select a Sub-Coordinator?" labelPlacement="start" />
              {showSubCoordinatorStep && (
                <Box sx={{ p: 1 }}>
                  <Typography variant="h6" sx={{ textAlign: "center", mb: 2, color: "#1A005D", fontWeight: "bold" }}>Mapping SubCoordinator</Typography>
                  <Paper elevation={3} sx={{ p: 3, borderRadius: "12px" }}>
                    <Grid container spacing={2}>
                      {availableBranch.length > 1 && (
                        <Grid item xs={12} sm={6}>
                          <TextField select label="Select Branch *" value={chosenBranch} onChange={(e) => setChosenBranch(e.target.value)} fullWidth variant="outlined">
                            {availableBranch.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                          </TextField>
                        </Grid>
                      )}
                      {availableDepartments.length > 1 && (
                        <Grid item xs={12} sm={6}>
                          <TextField select label="Select Department *" value={chosenDepartment} onChange={(e) => setChosenDepartment(e.target.value)} fullWidth variant="outlined">
                            {availableDepartments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                          </TextField>
                        </Grid>
                      )}
                      <Grid item xs={12} sm={6}>
                        <Autocomplete options={filteredCandidates || []}
                          getOptionLabel={(o) => `${o.full_name} (${o.emp_id})`}
                          isOptionEqualToValue={(o, v) => o.emp_id === v.emp_id}
                          value={filteredCandidates.find((c) => c.emp_id === chosenSubCoordinator) || null}
                          inputValue={subCoordinatorInputValue} onInputChange={(_, v) => setSubCoordinatorInputValue(v)}
                          onChange={(_, v) => { if (v) { setChosenSubCoordinator(v.emp_id); setSubCoordinatorName(v.full_name); setSubCoordinatorEmail(v.email); } else { setChosenSubCoordinator(""); setSubCoordinatorName(""); setSubCoordinatorEmail(""); } }}
                          renderInput={(params) => <TextField {...params} label="Sub-Coordinator Name *" variant="outlined" error={validationAttempted && !chosenSubCoordinator} InputProps={{ ...params.InputProps, style: { height: "45px" } }} />}
                          noOptionsText="No sub-coordinators available"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Button variant="contained" color="primary" onClick={() => {
                            const loggedSession = mappedCoordinators.find(
                              (c) => c.emp_id === loggedInUser.emp_id && c.role_type === "coordinator"
                            )?.session_no;
                            const resolvedSession =
                              loggedSession ||
                              (isAdminOrCreator
                                ? selectedSessionNo || sessionData?.[0]?.session_no
                                : null);
                           if (!resolvedSession) {
                                  setSnackbar({ open: true, message: "No mapped session found.", severity: "error" });
                                  return;
                                }
                         addSubCoordinator(
                                planingId || trainingData.id,
                                resolvedSession,
                                loggedInUser,
                                { emp_id: chosenSubCoordinator, full_name: subCoordinatorName, email: subCoordinatorEmail }
                              );
                        }}>Add Sub-Coordinator</Button>
                      </Grid>
                    </Grid>
                    <Box mt={2}>
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>Sub-Coordinators List</Typography>
                      {Array.isArray(mappedSubCoordinators)
                        ? mappedSubCoordinators.length > 0
                          ? mappedSubCoordinators.map((sub) => (
                            <Box key={sub.id} display="flex" alignItems="center" justifyContent="space-between" p={1}>
                              <Typography>{sub.coordinator_name || sub.sub_coordinator_name} ({sub.coordinator_emp_id || sub.sub_coordinator_emp_id})</Typography>
                              <IconButton size="small" onClick={() => deleteSubCoordinator(sub.id)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                            </Box>
                          )) : <Typography>No Sub-Coordinators Added Yet</Typography>
                        : Object.values(mappedSubCoordinators).flat().length > 0
                          ? Object.values(mappedSubCoordinators).flat().map((sub) => (
                            <Box key={sub.id} display="flex" alignItems="center" justifyContent="space-between" p={1}>
                              <Typography>{sub.sub_coordinator_name || sub.coordinator_name} ({sub.sub_coordinator_emp_id || sub.coordinator_emp_id})</Typography>
                              <IconButton size="small" onClick={() => deleteSubCoordinator(sub.id)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                            </Box>
                          )) : <Typography>No Sub-Coordinators Added Yet</Typography>
                      }
                    </Box>
                  </Paper>
                  <Box mt={3} textAlign="center">
                    <Button
                      variant="contained"
                      color="success"
                      onClick={async () => {
                        const pid = sessions.planing_id || trainingData.id;
                        const sNo = selectedSessionNo;
                        if (!pid) {
                          setSnackbar({ open: true, message: "Planning ID is missing.", severity: "error" });
                          return;
                        }
                        await sendNotification(
                          "sendSubCoordinatorNotification",
                          {
                            planing_id: Number(pid),
                            session_no: Number(sNo),
                            coordinator_emp_id: loggedInUser?.emp_id,
                          },
                          "Sub-coordinator notification"
                        );
                        setSnackbar({ open: true, message: "Sub-coordinator notified successfully!", severity: "success" });
                      }}
                    >
                      Submit &amp; Notify
                    </Button>
                  </Box>
                </Box>
              )}
              <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
                <Button onClick={handleNext} variant="contained" sx={{ backgroundColor: "#8EC400", color: "white", px: 4, borderRadius: "30px", fontWeight: "bold" }}>Next</Button>
              </Box>
              <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ minWidth: "300px" }}>{snackbar.message}</Alert>
              </Snackbar>
            </Box>
          </Box>
        );

      // ── STEP 3: Mapping Trainees ──────────────────────────────────────────────
      case 3:
        return (
          <Box sx={{ p: 1 }}>
            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
                <CircularProgress size={60} /><Typography variant="h6" sx={{ ml: 2 }}>Loading...</Typography>
              </Box>
            ) : (
              <>
                <Typography variant="h6" sx={{ textAlign: "center", mb: 2, color: "#1A005D", fontWeight: "bold" }}>Mapping Trainees</Typography>
                <Paper elevation={3} sx={{ p: 3, borderRadius: "12px" }}>
                  <Grid container spacing={2}>

                    {/* Session dropdown */}
                    <Grid item xs={12} sm={6}>
                      <Autocomplete options={sessionOptionsDropdown || []}
                          getOptionLabel={(o) => o?.session_no ? `Session ${o.session_no}` : "Unknown Session"}
                          isOptionEqualToValue={(o, v) => String(o?.session_no) === String(v?.session_no)}
                          value={selectedSession || null}
                          onChange={(_, v) => {
                          if (v) {
                            setSelectedSession(v);
                            setSelectedSessionNo(v.session_no);
                             fetchTrainees._loaded = false;
                                setDraftRefreshKey(k => k + 1);
                          } else {
                            setSelectedSession(null);
                            setSelectedSessionNo(null);
                            setSelectedbranch("");
                            setSelecteddepartment("");
                            setFilteredTrainees([]);
                            setTraineesLoaded(false);
                          }
                        }}
                        renderInput={(params) => <TextField {...params} label="Select Session" variant="outlined" fullWidth size="small" />}
                      />
                    </Grid>

                    {/* Coordinator — auto-populated, read-only */}
                    <Grid item xs={12} sm={6}>
                      <TextField label="Coordinator / Sub-Coordinator"
                        value={autoCoordinator
                          ? `${autoCoordinator.coordinator_name} (${autoCoordinator.coordinator_emp_id})`
                          : selectedCoordinator
                            ? `${selectedCoordinator.coordinator_name} (${selectedCoordinator.coordinator_emp_id})`
                            : isAdminOrCreator
                              ? `${loggedInUser?.empname || ""} (${loggedInUser?.emp_id || ""}) — Creator`
                              : "Not assigned"}
                        fullWidth size="small" variant="outlined" InputProps={{ readOnly: true }}
                        InputLabelProps={{ shrink: true, sx: { color: "#8EC400", "&.Mui-focused": { color: "#8EC400" } } }}
                        sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "#f5f5f5" } }}
                        helperText={
                          isAdminOrCreator
                            ? "Acting as training creator — full coordinator access"
                            : "Auto-assigned based on your login"}
                      />
                    </Grid>

                    {/* Branch — optional filter */}
                    <Grid item xs={12} sm={6}>
                      {availableBranch.length > 1 ? (
                        <Autocomplete options={availableBranch} getOptionLabel={(o) => o} value={selectedbranch || null}
                          onChange={(_, v) => {
                            setSelectedbranch(v || "");
                            if (!v) setSelecteddepartment("");
                          }}
                          renderInput={(params) => (
                            <TextField {...params} label="Branch (optional)" variant="outlined" fullWidth size="small"
                              InputLabelProps={{ sx: { color: "#8EC400", "&.Mui-focused": { color: "#8EC400" } } }}
                              helperText="Filter employees by branch"
                            />
                          )}
                        />
                      ) : (
                        <TextField label="Branch" value={selectedbranch || ""} fullWidth size="small" variant="outlined"
                          InputProps={{ readOnly: true }} InputLabelProps={{ shrink: !!selectedbranch, sx: { color: "#8EC400" } }}
                          sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "#f5f5f5" } }}
                          helperText={selectedbranch ? "Branch auto-assigned" : ""}
                        />
                      )}
                    </Grid>

                    {/* Department — optional filter */}
                    <Grid item xs={12} sm={6}>
                      {availableDepartments.length > 1 ? (
                        <Autocomplete options={availableDepartments} getOptionLabel={(o) => o} value={selecteddepartment || null}
                          onChange={(_, v) => {
                            setSelecteddepartment(v || "");
                          }}
                          renderInput={(params) => (
                            <TextField {...params} label="Department (optional)" variant="outlined" fullWidth size="small"
                              InputLabelProps={{ sx: { color: "#8EC400", "&.Mui-focused": { color: "#8EC400" } } }}
                              helperText="Filter employees by department"
                            />
                          )}
                        />
                      ) : (
                        <TextField label="Department" value={selecteddepartment || ""} fullWidth size="small" variant="outlined"
                          InputProps={{ readOnly: true }} InputLabelProps={{ shrink: !!selecteddepartment, sx: { color: "#8EC400" } }}
                          sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "#f5f5f5" } }}
                          helperText={selecteddepartment ? "Department auto-assigned" : ""}
                        />
                      )}
                    </Grid>

                    {/* Individual multi-select — CHANGE 3: email validation */}
                    <Grid item xs={12}>
                      <Autocomplete multiple
                        options={
                          filteredTrainees.length > 0
                            ? [{ full_name: "Select All", emp_id: "select_all" }, ...filteredTrainees.filter((o) => o?.full_name)]
                            : []
                        }
                        getOptionLabel={(o) => `${o.full_name} (${o.emp_id})`}
                        value={selectedTrainees} isOptionEqualToValue={(o, v) => o.emp_id === v.emp_id}
                        onChange={(_, v) => {
                          if (v.find((o) => o.emp_id === "select_all")) {
                            if (selectedTrainees.length === filteredTrainees.length) {
                              setSelectedTrainees([]);
                            } else {
                              // CHANGE 3: only select trainees with valid emails
                              const withEmail = filteredTrainees.filter(hasValidEmail);
                              const noEmail = filteredTrainees.filter((t) => !hasValidEmail(t));
                              setSelectedTrainees([...withEmail]);
                              if (noEmail.length > 0) {
                                handleOpenSnackbar(
                                  `⚠️ ${noEmail.length} employee(s) skipped — no email address on file.`,
                                  "warning"
                                );
                              }
                            }
                          } else {
                            const updated = v.filter((o) => o.emp_id !== "select_all");
                            // CHANGE 3: validate email on individual select
                            const lastAdded = updated.find(
                              (o) => !selectedTrainees.some((t) => t.emp_id === o.emp_id)
                            );
                            if (lastAdded && !hasValidEmail(lastAdded)) {
                              handleOpenSnackbar(
                                `🚫 Cannot add ${lastAdded.full_name} (${lastAdded.emp_id}) — no email address on file.`,
                                "error"
                              );
                              // Remove the invalid one — keep only previously valid selection
                              setSelectedTrainees(updated.filter((o) => o.emp_id !== lastAdded.emp_id));
                              return;
                            }
                            setSelectedTrainees(updated);
                          }
                        }}
                        disableCloseOnSelect
                        // CHANGE 3: visually mark no-email options as disabled
                        getOptionDisabled={(option) =>
                          option.emp_id !== "select_all" && !hasValidEmail(option)
                        }
                        renderOption={(props, option, { selected }) => (
                          <li {...props} key={option.emp_id}>
                            <Checkbox
                              checked={option.emp_id === "select_all" ? selectedTrainees.length === filteredTrainees.filter(hasValidEmail).length : selected}
                              sx={{ mr: 1 }}
                            />
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, width: "100%" }}>
                              <span>{option.full_name || "Unknown"} ({option.emp_id || "N/A"})</span>
                              {option.emp_id !== "select_all" && !hasValidEmail(option) && (
                                <Chip
                                  label="No Email"
                                  size="small"
                                  sx={{
                                    backgroundColor: "#ffebee",
                                    color: "#c62828",
                                    fontSize: "10px",
                                    height: "16px",
                                    ml: "auto",
                                  }}
                                />
                              )}
                            </Box>
                          </li>
                        )}
                        renderTags={(value, getTagProps) =>
                          value.length > 3 ? (
                            <>{value.slice(0, 3).map((o, i) => <Chip key={i} label={`${o.full_name} (${o.emp_id})`} {...getTagProps({ index: i })} size="small" />)}<Button size="small" variant="text" onClick={() => setModalOpen(true)} sx={{ color: "#1A005D", fontWeight: "bold" }}>+{value.length - 3} more</Button></>
                          ) : value.map((o, i) => <Chip key={i} label={`${o.full_name} (${o.emp_id})`} {...getTagProps({ index: i })} size="small" />)
                        }
                        noOptionsText="No employees found"
                        renderInput={(params) => (
                          <TextField {...params}
                            label={
                              filteredTrainees.length > 0
                                ? `Select Trainees (${filteredTrainees.length} available, ${filteredTrainees.filter(hasValidEmail).length} with email)`
                                : "Select Trainees"
                            }
                            placeholder={`Selected: ${selectedTrainees?.length || 0}`}
                            variant="outlined" size="small"
                          />
                        )}
                      />
                    </Grid>

                    {/* ── Bulk paste — CHANGE 3: skips no-email employees ─── */}
                    <Grid item xs={12}>
                      <Box sx={{ border: "1px dashed #8EC400", borderRadius: "8px", p: 2, backgroundColor: "#fafff5" }}>
                        <Typography variant="body2" sx={{ fontWeight: "bold", color: "#1A005D", mb: 0.5 }}>📋 Bulk Add by Employee ID</Typography>
                        <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 1 }}>
                          Paste multiple IDs separated by commas, spaces, or newlines (Excel-friendly). Example: <code>1001, 1002, 1003</code>
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                          <TextField multiline minRows={2} maxRows={6} fullWidth size="small" variant="outlined"
                            placeholder={"1001, 1002, 1003\n1004\n1005"} value={bulkPasteInput}
                            onChange={(e) => { setBulkPasteInput(e.target.value); if (bulkPasteError) setBulkPasteError(""); }}
                            InputProps={{ sx: { fontFamily: "monospace", fontSize: "13px" } }}
                          />
                          <Button variant="contained" onClick={handleBulkPaste}
                            sx={{ backgroundColor: "#1A005D", whiteSpace: "nowrap", alignSelf: "flex-start", mt: 0.5, "&:hover": { backgroundColor: "#8EC400", color: "#1A005D" } }}>
                            Add IDs
                          </Button>
                        </Box>
                        {bulkPasteError && (
                          <Box sx={{ mt: 0.5 }}>
                            {bulkPasteError.split(" | ").map((part, i) => (
                              <Typography key={i} variant="caption" sx={{
                                display: "block",
                                color: part.startsWith("✅") ? "#2e7d32"
                                  : part.startsWith("⚠️") ? "#e65100"
                                  : part.startsWith("🚫") ? "#c62828"
                                  : "#d32f2f",
                                fontWeight: 500,
                                mb: 0.25,
                              }}>
                                {part}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Grid>

                    {/* ── Draft panel with tabs — CHANGE 2: sorted ascending ── */}
                    <Grid item xs={12}>
                      <Box sx={{ border: "1px solid #e0e0e0", borderRadius: "8px", overflow: "hidden" }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1A005D", px: 2, py: 0.5 }}>
                          <Tabs value={draftViewTab} onChange={(_, v) => setDraftViewTab(v)}
                            sx={{ "& .MuiTab-root": { color: "#ccc", fontSize: "13px", minHeight: "36px" }, "& .Mui-selected": { color: "#8EC400 !important" }, "& .MuiTabs-indicator": { backgroundColor: "#8EC400" } }}>
                            <Tab value="drafted" label={`Drafted (${
                              selectedSessionNo
                                ? sortedDraftTrainees.filter(t => String(t.session_no) === String(selectedSessionNo)).length
                                : sortedDraftTrainees.length
                            })`} />
                            <Tab value="not_drafted" label={`Not Yet Drafted (${notDraftedTrainees.length})`} />
                          </Tabs>
                          <Tooltip title="Refresh draft list" arrow>
                            <IconButton onClick={refreshDraft} size="small" sx={{ color: "#8EC400" }}>
                              <Typography sx={{ fontSize: "18px", lineHeight: 1 }}>↻</Typography>
                            </IconButton>
                          </Tooltip>
                        </Box>

                        {/* Drafted tab — CHANGE 2: uses sortedDraftTrainees */}
                        {draftViewTab === "drafted" && (
                          <Box key={`drafted-${draftRefreshKey}`} sx={{ maxHeight: "320px", overflowY: "auto" }}>
                            {branchNames.length > 1 && (
                              <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: "1px solid #e0e0e0" }}>
                                {branchNames.map((b, i) => <Tab key={i} label={b} />)}
                              </Tabs>
                            )}
                            <Box sx={{ px: 2, pt: 1 }}>
                              <TextField placeholder="Search drafted trainees…" size="small" fullWidth value={searchQuery} onChange={(e) => setSearchQuery(e.target.value.toLowerCase())} />
                            </Box>
                            {sortedDraftTrainees.length === 0 ? (
                              <Box sx={{ p: 3, textAlign: "center" }}>
                                <Typography variant="body2" color="text.secondary">No trainees drafted yet. Select trainees above and click <strong>Draft</strong>.</Typography>
                              </Box>
                            ) : (
                              <TableContainer>
                                <Table size="small" stickyHeader>
                                  <TableHead>
                                    <TableRow sx={{ "& th": { backgroundColor: "#f5f5f5", fontWeight: "bold" } }}>
                                      <TableCell>#</TableCell><TableCell>Name ↑</TableCell><TableCell>Emp ID</TableCell>
                                      <TableCell>Session</TableCell><TableCell>Department</TableCell><TableCell>Branch</TableCell>
                                      <TableCell align="center">Remove</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {sortedDraftTrainees
                                          .filter((t) => !selectedSessionNo || String(t.session_no) === String(selectedSessionNo))
                                          .filter((t) => {
                                            if (searchQuery) return true; // global search — ignore branch tab
                                            if (branchNames.length <= 1) return true;
                                            return t.branch_name === branchNames[selectedTab]; // no search — respect tab
                                          })
                                          .filter((t) =>
                                            !searchQuery ||
                                            t.full_name?.toLowerCase().includes(searchQuery) ||
                                            String(t.emp_id).includes(searchQuery)
                                          )
                                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                      .map((trainee, idx) => {
                                       const canDelete = isAdminOrCreator || mappedCoordinators?.some(
                                              (c) => trainee.session_no === c.session_no || 
                                                    (c.session_no1 && trainee.session_no === c.session_no1)
                                            );
                                        return (
                                          <TableRow key={trainee.emp_id} hover>
                                            <TableCell>{idx + 1 + page * rowsPerPage}</TableCell>
                                            <TableCell>
                                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                {trainee.full_name}
                                                {!notifiedTraineeIds.has(String(trainee.emp_id)) && (
                                                  <Chip
                                                    label="New"
                                                    size="small"
                                                    sx={{
                                                      backgroundColor: "#e8f5e9",
                                                      color: "#2e7d32",
                                                      fontWeight: "bold",
                                                      fontSize: "10px",
                                                      height: "18px",
                                                    }}
                                                  />
                                                )}
                                              </Box>
                                            </TableCell>
                                            <TableCell>{trainee.emp_id}</TableCell>
                                            <TableCell>{trainee.session_no ?? "—"}</TableCell>
                                            <TableCell>{trainee.department}</TableCell>
                                            <TableCell>{trainee.branch_name || "N/A"}</TableCell>
                                            <TableCell align="center">
                                              {canDelete && (
                                                <IconButton size="small" onClick={() => handleDeleteTrainee(planingId || trainingData.id, trainee.emp_id)} sx={{ color: "#E53E3E" }}>
                                                  <DeleteIcon fontSize="small" />
                                                </IconButton>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            )}
                            <TablePagination rowsPerPageOptions={[5, 10, 25, 50]} component="div" count={sortedDraftTrainees.length}
                              rowsPerPage={rowsPerPage} page={page} onPageChange={(_, p) => setPage(p)}
                              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
                          </Box>
                        )}

                        {/* Not-yet-drafted tab */}
                        {draftViewTab === "not_drafted" && (
                          <Box key={`not-drafted-${draftRefreshKey}`} sx={{ maxHeight: "320px", overflowY: "auto" }}>
                            <Box sx={{ px: 2, pt: 1 }}>
                              <TextField placeholder="Search trainees not yet drafted…" size="small" fullWidth value={searchQuery} onChange={(e) => setSearchQuery(e.target.value.toLowerCase())} />
                            </Box>
                            {notDraftedTrainees.length === 0 ? (
                              <Box sx={{ p: 3, textAlign: "center" }}>
                                <Typography variant="body2" color="success.main" fontWeight="bold">✅ All filtered trainees have been drafted!</Typography>
                              </Box>
                            ) : (
                              <>
                                <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    These employees are in the filtered pool but NOT drafted yet. Select them above or use bulk paste, then click <strong>Draft</strong>.
                                  </Typography>
                                </Box>
                                <TableContainer>
                                  <Table size="small" stickyHeader>
                                    <TableHead>
                                      <TableRow sx={{ "& th": { backgroundColor: "#fff3e0", fontWeight: "bold" } }}>
                                        <TableCell>#</TableCell><TableCell>Name</TableCell><TableCell>Emp ID</TableCell>
                                        <TableCell>Branch</TableCell><TableCell>Department</TableCell><TableCell align="center">Quick Add</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {notDraftedTrainees
                                        .filter((t) => !searchQuery || t.full_name?.toLowerCase().includes(searchQuery) || String(t.emp_id).includes(searchQuery))
                                        .map((trainee, idx) => (
                                          <TableRow key={trainee.emp_id} hover
                                            sx={!hasValidEmail(trainee) ? { backgroundColor: "#fff5f5" } : {}}>
                                            <TableCell>{idx + 1}</TableCell>
                                            <TableCell>
                                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                {trainee.full_name}
                                                {/* CHANGE 3: show no-email badge in not-drafted list */}
                                                {!hasValidEmail(trainee) && (
                                                  <Chip
                                                    label="No Email"
                                                    size="small"
                                                    sx={{ backgroundColor: "#ffebee", color: "#c62828", fontSize: "10px", height: "16px" }}
                                                  />
                                                )}
                                              </Box>
                                            </TableCell>
                                            <TableCell>{trainee.emp_id}</TableCell>
                                            <TableCell>{trainee.branch_name || "N/A"}</TableCell>
                                            <TableCell>{trainee.department_name || trainee.department || "N/A"}</TableCell>
                                            <TableCell align="center">
                                              {hasValidEmail(trainee) ? (
                                                <Button size="small" variant="outlined"
                                                  onClick={() => {
                                                    setSelectedTrainees((prev) => prev.find((t2) => t2.emp_id === trainee.emp_id) ? prev : [...prev, trainee]);
                                                  }}
                                                  sx={{ borderColor: "#8EC400", color: "#1A005D", fontSize: "11px", py: 0.3, "&:hover": { backgroundColor: "#8EC400", color: "#fff" } }}>
                                                  + Add
                                                </Button>
                                              ) : (
                                                // CHANGE 3: disabled add button with tooltip for no-email employees
                                                <Tooltip title="Cannot add — no email address on file" arrow>
                                                  <span>
                                                    <Button size="small" variant="outlined" disabled
                                                      sx={{ borderColor: "#ccc", color: "#999", fontSize: "11px", py: 0.3 }}>
                                                      + Add
                                                    </Button>
                                                  </span>
                                                </Tooltip>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Grid>

                    {/* Action buttons */}
                    <Grid item xs={12}>
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 1, flexWrap: "wrap" }}>
                        <Button
                          variant="contained"
                          onClick={async () => {
                            if (!selectedTrainees.length) {
                              handleOpenSnackbar("Please select at least one trainee to draft.", "error");
                              return;
                            }
                            await handleSaveDraft();
                            await refreshDraft();
                          }}
                          disabled={!selectedSessionNo || !selectedTrainees.length}
                          sx={{ fontWeight: "bold", backgroundColor: "#1A005D", minWidth: "130px", "&:hover": { backgroundColor: "#8EC400", color: "#1A005D" }, "&:disabled": { backgroundColor: "#ccc" } }}
                        >
                          {selectedTrainees.length > 0
                            ? `Draft (${selectedTrainees.length} selected)`
                            : `Draft (${sortedDraftTrainees.length} saved)`}
                        </Button>

                        {sortedDraftTrainees.length > 0 ? (
                          <Button
                            onClick={() => setComposeModalOpen(true)}
                            variant="contained"
                            disabled={!selectedSessionNo}
                            sx={{ fontWeight: "bold", backgroundColor: "#2e7d32", minWidth: "130px", "&:hover": { backgroundColor: "#8EC400", color: "#1A005D" }, "&:disabled": { backgroundColor: "#ccc" } }}
                          >
                            {(() => {
                              const newCount = sortedDraftTrainees.filter(
                                (t) => !notifiedTraineeIds.has(String(t.emp_id))
                              ).length;
                              return newCount > 0
                                ? `✉️ Compose & Notify (${newCount} new)`
                                : `Submit (${sortedDraftTrainees.length} — already notified)`;
                            })()}
                          </Button>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
                            Draft trainees first to enable Submit.
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                {/* ══ COMPOSE NOTIFICATION MODAL ══════════════════════════════ */}
                    <Modal
                      open={composeModalOpen}
                      onClose={() => { if (!isSendingNotification) setComposeModalOpen(false); }}
                    >                 
                    <Box sx={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: { xs: "92vw", sm: "640px" }, maxHeight: "90vh", overflowY: "auto",
                    backgroundColor: "#fff", borderRadius: "16px",
                    boxShadow: "0 8px 40px rgba(26,0,93,0.22)",
                  }}>
                    {/* Header */}
                    <Box sx={{
                      background: "linear-gradient(135deg, #1A005D 0%, #3a0099 60%, #8EC400 100%)",
                      borderRadius: "16px 16px 0 0", p: "20px 28px",
                    }}>
                      <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "18px", mb: 0.5 }}>
                        ✉️ Compose Notification
                      </Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "13px" }}>
                        Optionally add a personal message, venue or link — then send to{" "}
                        <b style={{ color: "#c6ff00" }}>
                          {sortedDraftTrainees.filter((t) => !notifiedTraineeIds.has(String(t.emp_id))).length} new trainee(s)
                        </b>
                      </Typography>
                    </Box>

                    <Box sx={{ p: "24px 28px 20px" }}>
                      <Grid container spacing={2}>

                        {/* Mode-aware venue section */}
                        {(() => {
                          const isVirtual =
                            (sessionData.find((s) => String(s.session_no) === String(selectedSessionNo))?.mode_of_training || "").toLowerCase() === "virtual";
                          return isVirtual ? (
                            <>
                              <Grid item xs={12}>
                                <Typography sx={{ fontWeight: 700, color: "#1A005D", fontSize: "14px", mb: 0.5 }}>
                                  💻 Virtual Session Details
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Platform (e.g. MS Teams, Zoom)"
                                  value={virtualPlatform} onChange={(e) => setVirtualPlatform(e.target.value)}
                                  InputLabelProps={{ sx: { color: "#8EC400" } }} />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Meeting Link (URL)"
                                  value={virtualLink} onChange={(e) => setVirtualLink(e.target.value)}
                                  InputLabelProps={{ sx: { color: "#8EC400" } }} />
                              </Grid>
                            </>
                          ) : (
                            <>
                              <Grid item xs={12}>
                                <Typography sx={{ fontWeight: 700, color: "#1A005D", fontSize: "14px", mb: 0.5 }}>
                                  📍 Venue Details
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Room / Hall Name"
                                  value={venueRoomName} onChange={(e) => setVenueRoomName(e.target.value)}
                                  InputLabelProps={{ sx: { color: "#8EC400" } }} />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Location / Building"
                                  value={venueLocation} onChange={(e) => setVenueLocation(e.target.value)}
                                  InputLabelProps={{ sx: { color: "#8EC400" } }} />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField fullWidth size="small" label="Google Maps / Direction Link (optional)"
                                  value={venueMapLink} onChange={(e) => setVenueMapLink(e.target.value)}
                                  InputLabelProps={{ sx: { color: "#8EC400" } }} />
                              </Grid>
                            </>
                          );
                        })()}

                        {/* Custom message */}
                        <Grid item xs={12}>
                            <Typography sx={{ fontWeight: 700, color: "#1A005D", fontSize: "14px", mb: 0.5 }}>
                              💬 Custom Message to Trainees{" "}
                              <Typography component="span" sx={{ color: "#999", fontSize: "12px", fontWeight: 400 }}>
                                (optional)
                              </Typography>
                            </Typography>
                            <RichEmailComposer value={composeMessage} onChange={setComposeMessage} />
                          </Grid>

                        {/* Preview note */}
                        <Grid item xs={12}>
                          <Box sx={{ p: 1.5, background: "#f9fff0", border: "1px solid #8EC400", borderRadius: "8px" }}>
                            <Typography variant="caption" sx={{ color: "#4a7a00", fontWeight: 600 }}>
                              ✅ The email will include: Training topic, date, time, mode, your custom message (if any), venue/link (if added), and a login button.
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Actions */}
                        <Grid item xs={12}>
                          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", flexWrap: "wrap" }}>
                            <Button
                              variant="outlined"
                              disabled={isSendingNotification}
                              onClick={() => { if (!isSendingNotification) setComposeModalOpen(false); }}
                              sx={{ borderColor: "#ccc", color: "#666", borderRadius: "8px" }}
                            >
                              Cancel
                            </Button>
                            <Button variant="contained"
                              disabled={isSendingNotification}
                                  onClick={async () => {
                                    if (isSendingNotification) return;
                                    setIsSendingNotification(true);      // lock immediately — modal stays open, spinner renders
                                    try {
                                      await handleMapTrainees();
                                      await refreshDraft();
                                    } finally {
                                      setIsSendingNotification(false);
                                      setComposeModalOpen(false);        // ← close AFTER work is done (or on error)
                                    }
                                  }}
                              sx={{
                                fontWeight: 700, borderRadius: "8px", minWidth: "160px",
                                background: isSendingNotification
                                  ? "linear-gradient(135deg,#888,#aaa)"
                                  : "linear-gradient(135deg,#1A005D,#3a0099)",
                                "&:hover": { background: "linear-gradient(135deg,#8EC400,#5a9e00)", color: "#1A005D" },
                                pointerEvents: isSendingNotification ? "none" : "auto",
                              }}>
                              {isSendingNotification ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <CircularProgress size={16} sx={{ color: "#fff" }} />
                                  Sending…
                                </Box>
                              ) : "🚀 Send & Notify"}
                            </Button>
                          </Box>
                        </Grid>

                      </Grid>
                    </Box>
                  </Box>
                </Modal>

                {/* Modal for viewing selected trainees */}
                <Modal open={modalOpen} onClose={() => { setModalOpen(false); setSearchQuery(""); }}>
                  <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", p: 2, backgroundColor: "white", width: "70vw", maxWidth: "1200px", height: "80vh", overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", textAlign: "center", color: "#1A005D" }}>Selected Trainees (Session {selectedSessionNo})</Typography>
                    {branchNames.length > 1 && (
                      <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
                        {branchNames.map((b, i) => <Tab key={i} label={b} />)}
                      </Tabs>
                    )}
                    <TextField placeholder="Search Trainees" variant="outlined" size="small" fullWidth value={searchQuery} onChange={(e) => setSearchQuery(e.target.value.toLowerCase())} sx={{ mb: 2 }} />
                    {branchNames.map((b, index) => (
                      <Box key={b} sx={{ display: selectedTab === index || branchNames.length === 1 ? "block" : "none" }}>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>#</TableCell><TableCell>Full Name ↑</TableCell><TableCell>Session</TableCell>
                                <TableCell>Employee ID ↑</TableCell><TableCell>Department</TableCell><TableCell>Branch</TableCell>
                                <TableCell align="center">Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {sortedDraftTrainees.length > 0 ? sortedDraftTrainees
                                .filter((t) => t.branch_name === b)
                                .filter((t) => t.session_no === (selectedSession?.session_no || selectedSessionNo))
                                .filter((t) => !searchQuery || t.full_name.toLowerCase().includes(searchQuery))
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((trainee, idx) => (
                                  <TableRow key={trainee.emp_id} hover>
                                    <TableCell>{idx + 1 + page * rowsPerPage}</TableCell>
                                    <TableCell>{trainee.full_name}</TableCell><TableCell>{trainee.session_no}</TableCell>
                                    <TableCell>{trainee.emp_id}</TableCell><TableCell>{trainee.department}</TableCell>
                                    <TableCell>{trainee.branch_name || "N/A"}</TableCell>
                                    <TableCell align="center">
                                      {(isAdminOrCreator || mappedCoordinators.some(
                                          (c) => trainee.session_no === c.session_no ||
                                                (c.session_no1 && trainee.session_no === c.session_no1)
                                        )) && (
                                          <IconButton size="small" onClick={() => handleDeleteTrainee(planingId || trainingData.id, trainee.emp_id)} sx={{ color: "#E53E3E" }}>
                                            <DeleteIcon />
                                          </IconButton>
                                        )}
                                    </TableCell>
                                  </TableRow>
                                )) : (
                                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="error">No trainees selected for this branch.</Typography></TableCell></TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    ))}
                    <TablePagination rowsPerPageOptions={[5, 10, 15]} component="div" count={sortedDraftTrainees.length}
                      rowsPerPage={rowsPerPage} page={page} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))} />
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                      <Button variant="contained" onClick={() => { setModalOpen(false); setSearchQuery(""); }}
                        sx={{ backgroundColor: "#1A73E8", color: "#fff", fontWeight: "bold", borderRadius: "8px" }}>Close</Button>
                    </Box>
                  </Box>
                </Modal>
              </>
            )}
          </Box>
        );

      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  // ─── Layout ───────────────────────────────────────────────────────────────────
  return (
    <div className="admin-dashboard-content">
      <div className="main-content">
        <Grid container spacing={2} sx={{ height: "100%" }}>
          {/* Sidebar Stepper */}
          <Grid item xs="auto" sx={{ width: isStepperExpanded ? "250px" : "80px", transition: "width 0.3s ease", flexShrink: 0 }}>
            <Paper elevation={3} style={{ flex: 1, height: "100%", width: isStepperExpanded ? "250px" : "80px", padding: "20px", borderRadius: "15px", border: "1px solid #e0e0e0", position: "relative", overflow: "hidden", transition: "width 0.3s ease", display: "flex", flexDirection: "column" }}>
              <IconButton onClick={toggleStepperExpand}
                sx={{ position: "absolute", top: "4%", left: isStepperExpanded ? "200px" : "0px", transform: "translateY(-50%)", transition: "all 0.3s ease", backgroundColor: "#e7deff", border: "1px solid #e0e0e0", zIndex: 1000, "&:hover": { backgroundColor: "#1A005D" } }}>
                {isStepperExpanded ? <KeyboardDoubleArrowRightIcon sx={{ fontSize: "20px", color: "#4caf50" }} /> : <KeyboardDoubleArrowLeftIcon sx={{ fontSize: "20px", color: "#4caf50" }} />}
              </IconButton>
              <Stepper activeStep={activeStep} orientation="vertical"
                sx={{ "& .MuiStep-root": { padding: isStepperExpanded ? "10px" : "5px", borderRadius: "10px", marginBottom: "10px", backgroundColor: "#f5f5f5" } }}>
                {steps.map((label, index) => {
                  if (!isThirdStepVisible && index > 1) return null;
                  return (
                    <Step key={label} onClick={() => handleStepClick(index)} sx={{ "&:hover": { backgroundColor: isStepperExpanded ? "#e3f2fd" : "transparent", cursor: "pointer" } }}>
                      <StepLabel
                        StepIconComponent={() => (
                          <div className={`MuiStepIcon-root ${index === activeStep ? "active" : ""}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {stepIcons[index]}
                          </div>
                        )}
                        sx={{ "& .MuiStepLabel-label": { fontWeight: "bold", fontSize: isStepperExpanded ? "16px" : "14px", display: isStepperExpanded ? "block" : "none" } }}>
                        {label}
                      </StepLabel>
                    </Step>
                  );
                })}
              </Stepper>
            </Paper>
          </Grid>

          {/* Main content */}
          <Grid item xs sx={{ flexGrow: 1, transition: "width 0.3s ease", overflow: "hidden" }}>
            <Box sx={{ display: "flex", flexDirection: "row", gap: 2, height: "100%" }}>
              <Paper elevation={3} style={{ flex: 2, padding: "10px", border: "1px solid #e0e0e0", position: "relative", width: "70%", height: "auto", margin: "0 auto", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <IconButton onClick={toggleExpand}
                  sx={{ position: "absolute", top: "4%", right: isExpanded ? "-50px" : "10px", transform: "translateY(-50%)", transition: "all 0.3s ease", backgroundColor: "#e7deff", border: "1px solid #e0e0e0", zIndex: 1000, "&:hover": { backgroundColor: "#1A005D" } }}>
                  {isExpanded ? <KeyboardDoubleArrowLeftIcon sx={{ fontSize: "20px", color: "#4caf50" }} /> : <KeyboardDoubleArrowRightIcon sx={{ fontSize: "20px", color: "#4caf50" }} />}
                </IconButton>
                <div style={{ flexGrow: 1 }}>{renderStepContent(activeStep)}</div>
              </Paper>

              {isExpanded && (
                <Box sx={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: 2, boxShadow: "0px 4px 10px rgba(0,0,0,0.1)", backgroundColor: "#F9FAFC", padding: "10px", height: "100%" }}>
                  <ExpandableTrainingSummary trainingData={trainingData} setTrainingData={setTrainingData} />
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Global Snackbar */}
        <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", width: "100vw", position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 1400 }}>
          <Alert severity={snackbarSeverity}
            style={{ background: snackbarSeverity === "success" ? "linear-gradient(45deg, rgb(0,185,0), rgb(0,192,10))" : "linear-gradient(45deg, rgb(255,69,58), rgb(255,99,71))", color: "white", padding: "14px 28px", fontWeight: "600", textAlign: "center", borderRadius: "12px", boxShadow: "0px 4px 20px rgba(0,0,0,0.2)", minWidth: "300px" }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
}

export default Agenda;