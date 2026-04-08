import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  ArrowLeftIcon,
  DownloadIcon,
  Trash2Icon,
  EditIcon,
  ChevronLeftIcon
} from 'lucide-react';
import Checkbox from "@mui/material/Checkbox";
import ExcelJS from 'exceljs';
import {
  Typography,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Slide,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  CircularProgress,
  Autocomplete
} from "@mui/material";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../../../css/Admincss/Reports.css';
import logo from '../../../images/NEIN-Logo.jpg';
import { saveAs } from 'file-saver';

const Reports = () => {
  const [reportsData, setReportsData] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [successMessageOpen, setSuccessMessageOpen] = useState(false);
  const [successMessageContent, setSuccessMessageContent] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editReportData, setEditReportData] = useState({});
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [allowedBranchIds, setAllowedBranchIds] = useState([]);
  const [allowedDeptIds, setAllowedDeptIds] = useState([]);
  const [order, setOrder] = useState('asc');
const [orderBy, setOrderBy] = useState('Dept'); // Default sort by Department
const handleRequestSort = (property) => {
  const isAsc = orderBy === property && order === 'asc';
  setOrder(isAsc ? 'desc' : 'asc');
  setOrderBy(property);
};
const stableSort = (array, comparator) => {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
};

const getComparator = (order, orderBy) => {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
};

const descendingComparator = (a, b, orderBy) => {
  // Handle null/undefined values
  if (b[orderBy] == null && a[orderBy] == null) return 0;
  if (b[orderBy] == null) return -1;
  if (a[orderBy] == null) return 1;
  
  // Special handling for dates
  if (orderBy === 'Training Date') {
    const dateA = parseDdMmYyyy(a[orderBy]);
    const dateB = parseDdMmYyyy(b[orderBy]);
    if (dateB < dateA) return -1;
    if (dateB > dateA) return 1;
    return 0;
  }
  
  // Numeric comparison for numeric fields
  if (['No Of Hours', 'Total Training Hours', 'Participants'].includes(orderBy)) {
    return (b[orderBy] || 0) - (a[orderBy] || 0);
  }
  
  // Default string comparison
  if (String(b[orderBy]).toLowerCase() < String(a[orderBy]).toLowerCase()) return -1;
  if (String(b[orderBy]).toLowerCase() > String(a[orderBy]).toLowerCase()) return 1;
  return 0;
};
  
  
  
  const [multifilters, setMultiFilters] = useState({
    dept: [],
    trainingTopic: [],
    branch: [],
    fromDate: null,
    toDate: null
  });

  // Fetch reports data
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("==== Start Fetching Reports ====");
  
      // Get user details from sessionStorage
      const userDetails = JSON.parse(sessionStorage.getItem("userDetails")) || {};
      const { userRole } = userDetails || {};
      console.log("User Role:", userRole);
  
      // API Calls in Parallel
      console.log("Fetching data from APIs...");
      const [permissionsResponse, branchesResponse, departmentsResponse, reportsResponse] = await Promise.all([
        axios.post(`${API_BASE_URL}/roleRoutes/roleMaster/FunctionalityListforRoleManagement`, { userRole }),
        axios.get(`${API_BASE_URL}/training-master/branchmaster/list`),
        axios.get(`${API_BASE_URL}/training-master/department/list`),
        axios.post(`${API_BASE_URL}/reports/ReportsTotalHoursSpend`),
      ]);
  
      // Validate API Response
      if (!branchesResponse.data?.topics || !departmentsResponse.data?.topics || !reportsResponse.data) {
        throw new Error("Invalid API response structure");
      }
  
      // Extract Permission Data
      const permissionData = permissionsResponse.data || {};
      const allowedBranchIds = permissionData["Branch Assign"]?.["Branch Select"]?.["Branch List"]?.map(String) || [];
      const allowedDeptIds = permissionData["Department Assign"]?.["Department Select"]?.["Department List"]?.map(String) || [];
   //name 
      console.log("Allowed Branch IDs:", allowedBranchIds, "Allowed Department IDs:", allowedDeptIds);
  
      // Create normalized lookup maps (case-insensitive)
      const branchMap = new Map(
        branchesResponse.data.topics.map(b => [
          b.branch_name.toLowerCase(), 
          { id: String(b.branch_id), name: b.branch_name }
        ])
      );
      
      const deptMap = new Map(
        departmentsResponse.data.topics.map(d => [
          d.department_name.toLowerCase(), 
          { id: String(d.department_id), name: d.department_name }
        ])
      );
  
      // Format and filter the reports data
      const formattedData = reportsResponse.data
        .map((item, index) => {
          // Find department info
          const deptName = item.Dept?.toLowerCase();
          const deptInfo = deptName ? deptMap.get(deptName) : null;
          
          // Process branches
          let branchIds = [];
          if (item.Branch === "PAN INDIA") {
            branchIds = Array.from(branchMap.values()).map(b => b.id);
          } else if (item.Branch) {
            branchIds = item.Branch.split(/\s*,\s*/)
              .map(branchName => {
                const normalizedName = branchName.trim().toLowerCase();
                return branchMap.get(normalizedName)?.id;
              })
              .filter(Boolean);
          }
  
          return {
            ...item,
            SLNO: index + 1,
            department_id: deptInfo?.id || null,
            department_name: deptInfo?.name || item.Dept || "Unknown",
            branch_ids: branchIds,
            branch_names: branchIds.map(id => 
              Array.from(branchMap.values()).find(b => b.id === id)?.name || "Unknown"
            )
          };
        })
        // Apply role-based filtering
        .filter(item => {
          // If no restrictions, show all
          if (allowedBranchIds.length === 0 && allowedDeptIds.length === 0) {
            return true;
          }
  
          // Check department permission
          const deptAllowed = allowedDeptIds.length === 0 || 
            (item.department_id && allowedDeptIds.includes(item.department_id));
          
          // Check branch permission
          const branchAllowed = allowedBranchIds.length === 0 || 
            (item.branch_ids && item.branch_ids.some(branchId => allowedBranchIds.includes(branchId)));
  
          return deptAllowed && branchAllowed;
        });
  
      console.log("Filtered Reports Data:", {
        originalCount: reportsResponse.data.length,
        filteredCount: formattedData.length,
        sample: formattedData.slice(0, 3)
      });
  
      // Update State
      setReportsData(formattedData);
      setFilteredReports(formattedData);
    } catch (err) {
      console.error("Error Fetching Reports:", err);
      setError(err.response?.data?.message || err.message || "Failed to load reports");
    } finally {
      setLoading(false);
      console.log("==== Fetching Reports Completed ====");
    }
  };
  
  // Fetch Data on Component Mount (Only Once)
  useEffect(() => {
    fetchReports();
  }, []);

  // Special handling for composite branches
  const normalizeBranch = (branch) => {
    if (branch.includes("BENGALURU") || branch.includes("Bangaluru")) return "BENGALURU";
    return branch;
  };

  const extractBranches = (branchString) => {
    if (!branchString) return [];
    if (branchString === "PAN INDIA") return ["PAN INDIA"];
    return branchString.split(',').map(b => b.trim().replace("HEAD OFFICE,", "").trim());
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Return as-is in dd-mm-yyyy format
    return dateString;
  };

  const formatDateInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Add the new date parsing function here
const parseDdMmYyyy = (dateStr) => {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

  const handleMultiSelectChange = (field, newValue) => {
    setMultiFilters(prev => ({
      ...prev,
      [field]: newValue
    }));
  };

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const getUniqueBranches = (data) => {
    const allBranches = data.flatMap(report => 
      extractBranches(report.Branch)
    );
    const uniqueBranches = [...new Set(allBranches)].filter(Boolean);
    return uniqueBranches
      .filter(b => b !== "PAN INDIA")
      .map((branch, index) => ({
        id: `branch-${index}`,
        name: branch
      }));
  };

  const getFilteredUniqueValues = (key, currentFilters) => {
    if (key === 'Branch') {
      return getUniqueBranches(reportsData);
    }
    const filteredData = reportsData.filter(report => {
      const matchesBranch = key === 'Branch' || currentFilters.branch.length === 0 || 
        currentFilters.branch.some(filterBranch => {
          if (filterBranch?.id === "PAN INDIA" && report.Branch === "PAN INDIA") return true;
          const normalizedFilterBranch = filterBranch?.id;
          const normalizedReportBranch = normalizeBranch(report.Branch);
          return normalizedFilterBranch === normalizedReportBranch;
        });
  
      const matchesDept = key === 'Dept' || currentFilters.dept.length === 0 || 
        currentFilters.dept.some(filter => filter.name === report.Dept);
  
      const matchesTopic = key === 'Training Topic' || currentFilters.trainingTopic.length === 0 || 
        currentFilters.trainingTopic.some(filter => filter.name === report["Training Topic"]);
  
      return matchesBranch && matchesDept && matchesTopic;
    });
  
    const uniqueValues = [...new Set(filteredData.map(item => item[key]).filter(Boolean))]; // Added missing closing parenthesis here
    return uniqueValues.map((value, index) => ({
      id: `${key}-${index}`,
      name: value
    }));
  };

  // Filter reports based on search text and filters
  // Filter reports based on search text and filters
// Filter reports based on search text and filters
useEffect(() => {
  const results = reportsData.filter((report) => {
    if (!report) return false;
  
    // 1. Check search text match
    const searchMatch = searchText === "" || 
      Object.values(report).some(value => 
        value?.toString().toLowerCase().includes(searchText.toLowerCase())
      );
  
    // 2. Check department match
    const deptMatch = multifilters.dept.length === 0 || 
      multifilters.dept.some(filter => filter.name === report.Dept);
  
    // 3. Check training topic match
    const topicMatch = multifilters.trainingTopic.length === 0 || 
      multifilters.trainingTopic.some(filter => filter.name === report["Training Topic"]);
  
    // 4. Check branch match
    const branchMatch = multifilters.branch.length === 0 || 
      multifilters.branch.some(filterBranch => {
        const reportBranches = extractBranches(report.Branch);
        return reportBranches.some(reportBranch => 
          filterBranch?.id === "PAN INDIA" ? 
            reportBranch === "PAN INDIA" : 
            filterBranch?.name === reportBranch
        );
      });
  
    // 5. Check date range match
    const dateMatch = (() => {
      if (!report["Training Date"]) {
        return !multifilters.fromDate && !multifilters.toDate;
      }

      const reportDate = parseDdMmYyyy(report["Training Date"]);
      const fromDate = multifilters.fromDate ? parseDdMmYyyy(multifilters.fromDate) : null;
      const toDate = multifilters.toDate ? parseDdMmYyyy(multifilters.toDate) : null;

      if (fromDate && toDate) {
        return reportDate >= fromDate && reportDate <= toDate;
      }
      if (fromDate) {
        return reportDate >= fromDate;
      }
      if (toDate) {
        return reportDate <= toDate;
      }
      return true;
    })();
    
    return searchMatch && deptMatch && topicMatch && branchMatch && dateMatch;
  });
  
  setFilteredReports(results);
  setPage(0); // Reset to first page when filters change
}, [reportsData, searchText, multifilters]);

const exportData = async (fileName) => {
  try {
    setLoading(true);
    
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Training Report', {
      views: [{ showGridLines: false, showRowColHeaders: false }]
    });
    
    // Freeze header row (row 4) & apply view settings
    worksheet.views = [{ state: 'frozen', ySplit: 4, showGridLines: false, showRowColHeaders: false }];
    
    // Merge A1:B3 for Logo
    worksheet.mergeCells('A1:B3');
    
    // Insert Logo in A1
    try {
      const logoImage = await getLogoImage();
      if (logoImage) {
        const logoId = workbook.addImage({
          base64: logoImage,
          extension: 'jpeg',
        });
        worksheet.addImage(logoId, {
          tl: { col: 0, row: 0 },
          ext: { width: 160, height: 70 },
        });
      }
    } catch (error) {
      console.warn('Error loading logo:', error);
    }

    // Format date range text
    let dateRangeText = 'Training completed for the period';
    
    if (multifilters.fromDate || multifilters.toDate) {
      // If dates are selected in filters, use those
      const fromDateText = multifilters.fromDate || 'start';
      const toDateText = multifilters.toDate || 'end';
      dateRangeText = `Training completed for the period from ${fromDateText} to ${toDateText}`;
    } else {
      // If no dates selected, calculate min and max dates from the data
      if (filteredReports.length > 0) {
        const dates = filteredReports.map(report => {
          return report["Training Date"] ? parseDdMmYyyy(report["Training Date"]) : null;
        }).filter(date => date !== null);
        
        if (dates.length > 0) {
          const minDate = new Date(Math.min(...dates));
          const maxDate = new Date(Math.max(...dates));
          
          const formatForDisplay = (date) => {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
          };
          
          dateRangeText = `Training completed for the period from ${formatForDisplay(minDate)} to ${formatForDisplay(maxDate)}`;
        }
      }
    }

    // Merge and set headers
    worksheet.mergeCells('C1:M1');
    const titleCell = worksheet.getCell('C1');
    titleCell.value = 'Nippon Express (India) Pvt. Ltd.';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };
    titleCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    worksheet.mergeCells('C2:M2');
    const subtitleCell = worksheet.getCell('C2');
    subtitleCell.value = 'HUMAN RESOURCE DEVELOPMENT DEPARTMENT';
    subtitleCell.font = { bold: true, size: 14 };
    subtitleCell.alignment = { horizontal: 'center' };
    subtitleCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    worksheet.mergeCells('C3:M3');
    const dateRangeCell = worksheet.getCell('C3');
    dateRangeCell.value = dateRangeText;
    dateRangeCell.alignment = { horizontal: 'center' };
    dateRangeCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    // Define headers for row 4 (include all fields from API)
    const headers = [
      'Sr.No', 
      'Department', 
      'Training Topic', 
      'Targeted Participants',
      'Trainer Type',
      'Description',
      'Trainer Name',
      'No Of Hours', 
      'Total Training Hours',
      'Participants',
      'Date', 
      'Branch',
      'Mode of Training'
    ];

    const headerRow = worksheet.addRow(headers);

    // Style headers
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A005D' } // Dark Purple
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add data rows starting from row 5 (include all fields)
    filteredReports.forEach((item, index) => {
      const rowData = [
        item.SLNO,
        item.Dept,
        item["Training Topic"],
        item["Targeted Participants"],
        item["Trainer Type"],
        item.Description || "",
        item["Trainer Name"] || "",
        item["No Of Hours"] || 0,
        item["Total Training Hours"] || 0,
        item.Participants || 0,
        item["Training Date"] ? formatDate(item["Training Date"]) : "",
        item.Branch || "",
        item["Mode of Training"] || ""
      ];
      const row = worksheet.addRow(rowData);
      
      // Add borders to each cell in the row
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Set column widths
    worksheet.columns = [
      { width: 8 },   // Sr.No
      { width: 15 },  // Department
      { width: 25 },  // Training Topic
      { width: 20 },  // Targeted Participants
      { width: 15 },  // Trainer Type
      { width: 20 },  // Description
      { width: 20 },  // Trainer Name
      { width: 12 },  // No Of Hours
      { width: 18 },  // Total Training Hours
      { width: 12 },  // Participants
      { width: 15 },  // Date
      { width: 20 },  // Branch
      { width: 15 }   // Mode of Training
    ];

    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${fileName}.xlsx`);
    
    setSuccessMessageContent("Report exported successfully!");
    setSuccessMessageOpen(true);
  } catch (err) {
    console.error('Export error:', err);
    setError('Failed to export report: ' + err.message);
  } finally {
    setLoading(false);
  }
};


  // Helper function to get logo image (implement according to your needs)
  const getLogoImage = async () => {
    try {
      // Since you're importing the logo directly, we can convert it to base64
      const response = await fetch(logo);
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Remove the data URL prefix
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error processing logo:', error);
      return null;
    }
  };
  
  // Helper function to convert blob to base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
  };

  const addImageWithExcelJS = async (fileName, data, filtersInfo) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reports');
    
    // Add company header
    worksheet.mergeCells('A1:L1');
    worksheet.getCell('A1').value = 'Nippon Express (India) Pvt. Ltd.';
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    
    // Add department
    worksheet.mergeCells('A2:L2');
    worksheet.getCell('A2').value = 'HUMAN RESOURCE DEVELOPMENT DEPARTMENT';
    worksheet.getCell('A2').font = { bold: true, size: 14 };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    
    // Add period
    worksheet.mergeCells('A3:L3');
    worksheet.getCell('A3').value = 'Training completed for the period from date to To date';
    worksheet.getCell('A3').alignment = { horizontal: 'center' };
    
    // Add empty rows
    worksheet.addRow([]);
    worksheet.addRow([]);
    
    // Add headers
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);
    
    // Style headers
    headers.forEach((_, colIndex) => {
      const cell = worksheet.getRow(6).getCell(colIndex + 1);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A005D' }
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center' };
    });
    
    // Add data
    data.forEach(item => {
      worksheet.addRow(Object.values(item));
    });
    
    // Add image (you'll need the actual image buffer)
    /*
    const logo = workbook.addImage({
      buffer: await fetchLogoImage(), // You need to implement this
      extension: 'png',
    });
    
    worksheet.addImage(logo, {
      tl: { col: 0, row: 0 },
      ext: { width: 200, height: 50 },
      editAs: 'oneCell'
    });
    */
    
    // Set column widths
    worksheet.columns = [
      { width: 8 },  // Sr. No.
      { width: 15 }, // Dept
      { width: 25 }, // Training Topic
      { width: 20 }, // Targeted Participants
      { width: 15 }, // Trainer Type
      { width: 20 }, // Trainer Name
      { width: 15 }, // Mode of Training
      { width: 15 }, // Date
      { width: 12 }, // No Of Hours
      { width: 18 }, // Total Training Hours
      { width: 12 }, // Participants
      { width: 20 }  // Branch
    ];
    
    // Add filter info sheet
    const filterSheet = workbook.addWorksheet('Filter Info');
    filterSheet.addRow(['Filter', 'Value']);
    Object.entries(filtersInfo).forEach(([key, value]) => {
      filterSheet.addRow([key, value]);
    });
    
    // Write to file
    await workbook.xlsx.writeFile(`${fileName}.xlsx`);
  };

  return (
    <div className="admin-dashboard-content">
      <div className="reports">
      <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          mb={1} 
          sx={{
            backgroundColor: "#1A005D",
            padding: "10px 15px",
            marginBottom: "9px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: "white",
              fontWeight: "bold",
              textAlign: "center",
              width: "100%",  // Ensures full width for proper centering
            }}
          >
            Training Reports
          </Typography>

          <Tooltip title="Export to Excel">
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => exportData("Training_Reports")}
              sx={{
                backgroundColor: "#8EC400",
                "&:hover": { backgroundColor: "#7EB300" },
                borderRadius: "8px"
              }}
            >
              Export
            </Button>
          </Tooltip>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ 
          display: "flex", 
          gap: 2, 
          alignItems: "center",
          overflowX: "auto",
          pb: 1,
          "&::-webkit-scrollbar": {
            height: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: "3px",
          }
        }}>
  {/* Department Filter */}
      <Autocomplete
        multiple
        options={getFilteredUniqueValues("Dept", multifilters)}
        value={multifilters.dept || []}
        onChange={(event, newValue) => {
          const uniqueValues = newValue.filter(
            (item, index, self) => index === self.findIndex((t) => t.id === item.id)
          );
          handleMultiSelectChange("dept", uniqueValues);
        }}
        disableCloseOnSelect
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Checkbox checked={selected} />
            {option.name}
          </li>
        )}
        renderInput={(params) => {
          const hasValue = Boolean(multifilters.dept?.length);
          const isFocused = params.inputProps.ref.current === document.activeElement;
          
          return (
            <TextField
              {...params}
              label="Department"
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                width: 200,
                "& .MuiInputLabel-root": {
                  position: 'relative',
                  transform: 'none',
                  fontSize: '0.75rem',
                  marginLeft: '14px',
                  marginTop: '4px',
                  color: (theme) => theme.palette.text.primary,
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: (theme) => theme.palette.primary.main,
                }
              }}
              InputProps={{
                ...params.InputProps,
                sx: {
                  paddingTop: '18px',
                  paddingBottom: '8px',
                },
                startAdornment: (
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ 
                      overflow: "hidden", 
                      textOverflow: "ellipsis", 
                      maxWidth: "150px", 
                      fontSize: "12px",
                      color: !hasValue ? 'text.disabled' : 'text.primary',
                      ml: 0.5,
                      mt: '4px'
                    }}
                  >
                    {!hasValue
                      ? "Select department"
                      : multifilters.dept.length === 1
                        ? multifilters.dept[0].name
                        : `${multifilters.dept.length} Selected`}
                  </Typography>
                ),
              }}
            />
          );
        }}
        size="small"
        sx={{ 
          minWidth: 200,
        }}
      />

  {/* Branch Filter */}
  <Autocomplete
    multiple
    options={[
      { id: "PAN INDIA", name: "PAN INDIA" },
      ...getUniqueBranches(reportsData)
    ]}
    value={multifilters.branch || []}
    onChange={(event, newValues) => {
      if (!Array.isArray(newValues)) return;
      const uniqueValues = newValues.filter(
        (item, index, self) => index === self.findIndex((t) => t.id === item.id)
      );
      handleMultiSelectChange("branch", uniqueValues);
    }}
    disableCloseOnSelect
    getOptionLabel={(option) => option?.name || ""}
    isOptionEqualToValue={(option, value) => option.id === value.id}
    renderOption={(props, option, { selected }) => (
      <li {...props}>
        <Checkbox checked={selected} />
        {option.name}
      </li>
    )}
    renderInput={(params) => {
      const hasValue = Boolean(multifilters.branch?.length);
      const isFocused = params.inputProps.ref.current === document.activeElement;
      
      return (
        <TextField
          {...params}
          label="Branch"
          InputLabelProps={{
            shrink: true,
          }}
          sx={{
            width: 200,
            "& .MuiInputLabel-root": {
              position: 'relative',
              transform: 'none',
              fontSize: '0.75rem',
              marginLeft: '14px',
              marginTop: '4px',
              color: (theme) => theme.palette.text.primary,
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: (theme) => theme.palette.primary.main,
            }
          }}
          InputProps={{
            ...params.InputProps,
            sx: {
              paddingTop: '18px',
              paddingBottom: '8px',
            },
            startAdornment: (
              <Typography
                variant="body2"
                noWrap
                sx={{ 
                  overflow: "hidden", 
                  textOverflow: "ellipsis", 
                  maxWidth: "150px", 
                  fontSize: "12px",
                  color: !hasValue ? 'text.disabled' : 'text.primary',
                  ml: 0.5,
                  mt: '4px'
                }}
              >
                {!hasValue
                  ? "Select branch"
                  : multifilters.branch.length === 1
                    ? multifilters.branch[0].name
                    : `${multifilters.branch.length} Selected`}
              </Typography>
            ),
          }}
        />
      );
    }}
    size="small"
    sx={{ 
      minWidth: 200,
    }}
  />

      {/* // From Date */}
      <TextField
        type="date"
        size="small"
        label="From Date"
        value={multifilters.fromDate ? 
          multifilters.fromDate.split('-').reverse().join('-') : 
          ''}
        onChange={(e) => {
          const date = e.target.value;
          // Convert from yyyy-mm-dd to dd-mm-yyyy
          const formattedDate = date ? 
            date.split('-').reverse().join('-') : 
            null;
          handleMultiSelectChange("fromDate", formattedDate);
        }}
        InputLabelProps={{
          shrink: true,
        }}
        sx={{
          width: 180,
          "& .MuiOutlinedInput-root": {
            height: '40px',
          },
          "& .MuiInputLabel-root": {
            position: 'relative',
            transform: 'none',
            marginLeft: '14px',
            marginTop: '4px',
            fontSize: '0.75rem',
          }
        }}
      />

    {/* // To Date */}
    <TextField
      type="date"
      size="small"
      label="To Date"
      value={multifilters.toDate ? 
        multifilters.toDate.split('-').reverse().join('-') : 
        ''}
      onChange={(e) => {
        const date = e.target.value;
        // Convert from yyyy-mm-dd to dd-mm-yyyy
        const formattedDate = date ? 
          date.split('-').reverse().join('-') : 
          null;
        handleMultiSelectChange("toDate", formattedDate);
      }}
      InputLabelProps={{
        shrink: true,
      }}
      sx={{
        width: 180,
        "& .MuiOutlinedInput-root": {
          height: '40px',
        },
        "& .MuiInputLabel-root": {
          position: 'relative',
          transform: 'none',
          marginLeft: '14px',
          marginTop: '4px',
          fontSize: '0.75rem',
        }
      }}
    />

  {/* Search Reports */}
      <TextField
        label="Search Reports"
        variant="outlined"
        size="small"
        value={searchText}
        onChange={handleSearchChange}
        InputLabelProps={{
          shrink: true,
        }}
        sx={{ 
          width: 200,
          minWidth: 200,
          "& .MuiInputLabel-root": {
            position: 'relative',
            transform: 'none',
            marginLeft: '14px',
            marginTop: '4px',
            fontSize: '0.75rem',
          },
          "& .MuiOutlinedInput-root": {
            height: '40px',
          }
        }}
      />
    </Box>
        
        {/* Reports Table */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              padding:"10px",
              justifyContent: "center",
              alignItems: "center",
              height: "300px"
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : filteredReports.length > 0 ? (
          <>
            <TableContainer component={Paper} sx={{  boxShadow: '0 4px 12px rgba(0,0,0,0.1)' ,minWidth: '1200px' }}>
              <Table>
              <TableHead sx={{ backgroundColor: "#1A005D" }}>
  <TableRow>
    {[
      { id: 'SLNO', label: 'Sr. No:', sortable: false },
      { id: 'Dept', label: 'Department', sortable: true },
      { id: 'Training Topic', label: 'Training Topic', sortable: true },
      { id: 'Trainer Name', label: 'Trainer Name', sortable: true },
      { id: 'No Of Hours', label: 'No Of Hours', sortable: true },
      { id: 'Total Training Hours', label: 'Total Training Hours', sortable: true },
      { id: 'Participants', label: 'Participants', sortable: true },
      { id: 'Training Date', label: 'Date', sortable: true },
      { id: 'Branch', label: 'Branch', sortable: true }
    ].map((header) => (
      <TableCell 
        key={header.id}
        sx={{ 
          fontWeight: 'bold', 
          color: 'white', 
          textAlign: 'center',
          padding: '8px',
          fontSize: '0.87rem',
          whiteSpace: header.id === "Training Topic" ? "normal" : "nowrap",
          width: header.id === "Training Topic" ? "200px" : "auto",
          cursor: header.sortable ? 'pointer' : 'default'
        }}
        onClick={header.sortable ? () => handleRequestSort(header.id) : undefined}
      >
        <Box display="flex" alignItems="center" justifyContent="center">
          {header.label}
          {header.sortable && orderBy === header.id && (
            <Box component="span" ml={1}>
              {order === 'desc' ? '▼' : '▲'}
            </Box>
          )}
        </Box>
      </TableCell>
    ))}
  </TableRow>
</TableHead>
<TableBody>
  {stableSort(filteredReports, getComparator(order, orderBy))
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    .map((report, index) => (
      <TableRow
        key={report.SLNO}
        hover
        sx={{
          "&:nth-of-type(odd)": { backgroundColor: "#f8fafc" }
        }}
      >
        <TableCell sx={{ padding: '4px', fontSize: '0.9rem', textAlign: 'center' }}>{report.SLNO}</TableCell> 
        <TableCell sx={{ padding: '4px', fontSize: '0.9rem' }}>{report.Dept}</TableCell>
        <TableCell sx={{ padding: '4px', fontSize: '0.9rem' }}>{report["Training Topic"]}</TableCell>
        <TableCell sx={{ padding: '4px', fontSize: '0.9rem' }}>{report["Trainer Name"]}</TableCell>
        <TableCell sx={{ padding: '4px', fontSize: '0.9rem', textAlign: 'center' }}>{report["No Of Hours"]}</TableCell>
        <TableCell sx={{ padding: '4px', fontSize: '0.9rem', textAlign: 'center' }}>{report["Total Training Hours"]}</TableCell>
        <TableCell sx={{ padding: '4px', fontSize: '0.9rem', textAlign: 'center' }}>{report.Participants}</TableCell>
        <TableCell sx={{ padding: '4px', fontSize: '0.9rem', whiteSpace: 'nowrap', textAlign: 'center' }}>{report["Training Date"]}</TableCell>
        <TableCell sx={{ padding: '4px', fontSize: '0.9rem', textAlign: 'center' }}>{report.Branch}</TableCell>
      </TableRow>
    ))}
</TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={filteredReports.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        ) : (
          <Box
            sx={{
              height: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              textAlign: "center",
              gap: 2
            }}
          >
            <HourglassEmptyIcon sx={{ fontSize: 80, color: "#1A005D" }} />
            <Typography variant="h6" sx={{ color: "#1A005D" }}>
              No reports data available
            </Typography>
          </Box>
        )}
      </div>
    </div>
  );
};

export default Reports;