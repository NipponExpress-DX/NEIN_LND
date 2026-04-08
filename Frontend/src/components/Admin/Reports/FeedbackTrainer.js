import React, { useState, useEffect } from "react";
import {
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  CircularProgress,
  Button,
  Tooltip
} from "@mui/material";
import { DownloadIcon } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import axios from "axios";
import '../../../css/Admincss/Reports.css';
import logo from '../../../images/NEIN-Logo.jpg';

const AuditLogsReport = () => {
  const [logsData, setLogsData] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  
  // Date range filter state
  const [dateRange, setDateRange] = useState({
    fromDate: null,
    toDate: null
  });

  // Format date to display in the table
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Parse date from string to Date object
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr);
  };

  // Fetch audit logs data
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/reports/ReportsAuditLogs`);
      // console.log(`${API_BASE_URL}/reports/ReportsAuditLogs`);
      const formattedData = response.data.map((item, index) => ({
        ...item,
        SLNO: index + 1,
        date: formatDateTime(item.login_date),
        originalDate: item.login_date, // Keep original date for filtering
        empId: item.full_name, // Using full_name as employee identifier
        action: item.login_action,
        systemIP: item.system_ip,
        department: item.department_code,
        branch: item.branch_name
      }));
      setLogsData(formattedData);
      setFilteredLogs(formattedData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Filter logs based on search text and date range
  useEffect(() => {
    const results = logsData.filter((log) => {
      if (!log) return false;
      
      // 1. Check search text match
      const searchMatch = searchText === "" || 
        Object.values(log).some(value => 
          value?.toString().toLowerCase().includes(searchText.toLowerCase())
        );
      
      // 2. Check date range match
      const dateMatch = (() => {
        if (!log.originalDate) {
          return !dateRange.fromDate && !dateRange.toDate;
        }

        const logDate = parseDate(log.originalDate);
        const fromDate = dateRange.fromDate ? parseDate(dateRange.fromDate) : null;
        const toDate = dateRange.toDate ? parseDate(dateRange.toDate) : null;

        if (fromDate && toDate) {
          return logDate >= fromDate && logDate <= toDate;
        }
        if (fromDate) {
          return logDate >= fromDate;
        }
        if (toDate) {
          return logDate <= toDate;
        }
        return true;
      })();
      
      return searchMatch && dateMatch;
    });
    
    setFilteredLogs(results);
    setPage(0); // Reset to first page when filters change
  }, [logsData, searchText, dateRange]);

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  // Export to Excel function
  const exportAuditLogs = async () => {
    try {
      setLoading(true);
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Audit Logs', {
        views: [{ showGridLines: false, showRowColHeaders: false }]
      });
      
      worksheet.views = [{ state: 'frozen', ySplit: 4, showGridLines: false, showRowColHeaders: false }];
      worksheet.mergeCells('A1:B3');
      
      // Insert Logo
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

      // Format date range text for header
      let dateRangeText = 'User activity logs';
      if (dateRange.fromDate || dateRange.toDate) {
        const fromText = dateRange.fromDate || 'start';
        const toText = dateRange.toDate || 'end';
        dateRangeText = `User activity logs from ${fromText} to ${toText}`;
      }

      // Set headers
      worksheet.mergeCells('C1:E1');
      worksheet.getCell('C1').value = 'Nippon Express (India) Pvt. Ltd.';
      worksheet.getCell('C1').font = { bold: true, size: 16 };
      worksheet.getCell('C1').alignment = { horizontal: 'center' };

      worksheet.mergeCells('C2:E2');
      worksheet.getCell('C2').value = 'AUDIT LOGS REPORT';
      worksheet.getCell('C2').font = { bold: true, size: 14 };
      worksheet.getCell('C2').alignment = { horizontal: 'center' };

      worksheet.mergeCells('C3:E3');
      worksheet.getCell('C3').value = dateRangeText;
      worksheet.getCell('C3').alignment = { horizontal: 'center' };

      // Table headers
      const headers = ['Sr. No', 'Employee Name', 'Department', 'Branch', 'Action', 'System IP', 'Date & Time'];
      const headerRow = worksheet.addRow(headers);

      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1A005D' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });

      // Add data
      filteredLogs.forEach((item) => {
        worksheet.addRow([
          item.SLNO,
          item.empId,
          item.department,
          item.branch,
          item.action,
          item.systemIP,
          item.date
        ]);
      });

      // Set column widths
      worksheet.columns = [
        { width: 10 },   // Sr. No
        { width: 25 },   // Employee Name
        { width: 15 },   // Department
        { width: 15 },   // Branch
        { width: 15 },   // Action
        { width: 20 },   // System IP
        { width: 25 }    // Date & Time
      ];

      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Audit_Logs_Report.xlsx`);
      
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get logo image
  const getLogoImage = async () => {
    try {
      const response = await fetch(logo);
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
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
              width: "100%",
            }}
          >
            Audit Logs Report
          </Typography>

          <Tooltip title="Export to Excel">
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={exportAuditLogs}
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

        {/* Search and Date Filters */}
        <Box sx={{ 
          display: "flex", 
          gap: 2, 
          alignItems: "center",
          pb: 1,
          flexWrap: 'wrap'
        }}>
          {/* From Date */}
          <TextField
            type="date"
            size="small"
            label="From Date"
            value={dateRange.fromDate || ''}
            onChange={(e) => handleDateChange('fromDate', e.target.value)}
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

          {/* To Date */}
          <TextField
            type="date"
            size="small"
            label="To Date"
            value={dateRange.toDate || ''}
            onChange={(e) => handleDateChange('toDate', e.target.value)}
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

          {/* Search */}
          <TextField
            label="Search Logs"
            variant="outlined"
            size="small"
            value={searchText}
            onChange={handleSearchChange}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ 
              width: 300,
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
        
        {/* Audit Logs Table */}
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
        ) : filteredLogs.length > 0 ? (
          <>
            <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <Table>
                <TableHead sx={{ backgroundColor: "#1A005D" }}>
                  <TableRow>
                    {[
                      "Sr. No",
                      "Employee Name",
                      "Department",
                      "Branch",
                      "Action",
                      "System IP",
                      "Date & Time"
                    ].map((header) => (
                      <TableCell key={header} sx={{ 
                        fontWeight: 'bold', 
                        color: 'white', 
                        textAlign: 'center',
                        padding: '8px',
                        fontSize: '0.87rem',
                      }}>
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogs
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((log) => (
                      <TableRow
                        key={log.login_action_id}
                        hover
                        sx={{
                          "&:nth-of-type(odd)": { backgroundColor: "#f8fafc" }
                        }}
                      >
                        <TableCell sx={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}>{log.SLNO}</TableCell>
                        <TableCell sx={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}>{log.empId}</TableCell>
                        <TableCell sx={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}>{log.department}</TableCell>
                        <TableCell sx={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}>{log.branch}</TableCell>
                        <TableCell sx={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}>{log.action}</TableCell>
                        <TableCell sx={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}>{log.systemIP}</TableCell>
                        <TableCell sx={{ padding: '8px', fontSize: '0.9rem', textAlign: 'center' }}>{log.date}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={filteredLogs.length}
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
              No audit logs available
            </Typography>
          </Box>
        )}
      </div>
    </div>
  );
};

export default AuditLogsReport;