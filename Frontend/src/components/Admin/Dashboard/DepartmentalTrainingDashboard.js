import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from "recharts";
// import './modernDashboard.css';
import '../../../css/Admincss/modernDashboard.css';

const DepartmentalTrainingDashboard = () => {
  // Function to get first and last day of current month
  


const year = new Date().getFullYear();

const [filters, setFilters] = useState({
  startDate: `${year}-01-01`,
  endDate: `${year}-12-31`,
  department: '',
  branch: '',
  courseCategory: '',
  employeeName: ''
});

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loadingDept, setLoadingDept] = useState(false);
  const [loadingBranch, setLoadingBranch] = useState(false);
  const [employeeProgressData, setEmployeeProgressData] = useState([]);
  const [employeeNameOptions, setEmployeeNameOptions] = useState([]);
  const [topN, setTopN] = useState(10);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);    
  const [metrics, setMetrics] = useState({
    avgTrainingsDone: '0',
    avgHoursSpent: '0',
    loading: false
  });
  const [departmentPerformanceData, setDepartmentPerformanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completionRateData, setCompletionRateData] = useState({
    total: 0,
    completedCount: 0,
    notCompletedCount: 0,
    completedPercentage: "0",
    notCompletedPercentage: "0"
  });

  const [showAllDepartments, setShowAllDepartments] = useState(false);
  const [showAllDepartmentsDialog, setShowAllDepartmentsDialog] = useState(false);


const AllDepartmentsDialog = ({ data, onClose }) => {
  // Sort data by attended count in descending order
  const sortedData = [...data].sort((a, b) => b.attended - a.attended);

  return (
    <div className="dialog-overlay">
      <div className="dialog-content" style={{ width: '90%', maxWidth: '1200px', height: '80vh' }}>
        <div className="dialog-header">
          <h3>All Departments Training Info</h3>
          <button className="dialog-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        
        <div className="dialog-body">
          <div className="dialog-legend">
            <span className="legend-item">
              <span className="color-indicator" style={{ backgroundColor: '#1A005D' }}></span>
              Total Assigned
            </span>
            <span className="legend-item">
              <span className="color-indicator" style={{ backgroundColor: '#FFC107' }}></span>
              Attended
            </span>
            <span className="legend-item">
              <span className="color-indicator" style={{ backgroundColor: '#3ccf4e' }}></span>
              Completed
            </span>
          </div>
          
          <div className="departments-scroll-container">
            <div className="departments-list-container">
              <div className="departments-list-scroll">
                {sortedData.map((dept, index) => (
                  <div key={index} className="department-item">
                    <div className="department-name">
                      {dept.department.length > 30 
                        ? `${dept.department.substring(0, 27)}...` 
                        : dept.department}
                    </div>
                    <div className="department-stats">
                      <div className="stat-bar">
                        <div 
                          className="stat-bar-assigned" 
                          style={{ width: `${(dept.assigned / Math.max(...data.map(d => d.assigned))) * 100}%` }}
                          title={`Assigned: ${dept.assigned}`}
                        ></div>
                        <span className="stat-value">{dept.assigned}</span>
                      </div>
                      
                      <div className="stat-bar">
                        <div 
                          className="stat-bar-attended" 
                          style={{ width: `${(dept.attended / Math.max(...data.map(d => d.attended)) * 100)}%` }}
                          title={`Attended: ${dept.attended}`}
                        ></div>
                        <span className="stat-value">{dept.attended}</span>
                      </div>
                      
                      <div className="stat-bar">
                        <div 
                          className="stat-bar-completed" 
                          style={{ width: `${(dept.completed / (Math.max(...data.map(d => d.completed)) || 1)) * 100}%` }}

                          title={`Completed: ${dept.completed}`}
                        ></div>
                        <span className="stat-value">{dept.completed}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="dialog-footer">
          <div className="dialog-summary">
            <span>Total Departments: {data.length}</span>
          </div>
          <button className="dialog-close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
  
  const COLORS = {
    primary: "#1A005D",
    secondary: "#8EC400",
    lightGray: "#f5f5f5",
    textLight: "#7B8A99",
    borderLight: "#e0e0e0",
    white: "#ffffff"
  };

  useEffect(() => {
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails") || "{}");
    if (userDetails) {
      setUserRole(userDetails.userRole ?? null);
    }
  }, []);

  // Fetch all departments and branches
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch all departments
        const deptResponse = await axios.get(`${API_BASE_URL}/training-master/department/list`);
        setAllDepartments(deptResponse.data.topics);
        
        // Fetch all branches
        const branchResponse = await axios.get(`${API_BASE_URL}/training-master/branchmaster/list`);
        setAllBranches(branchResponse.data.topics || []);
      } catch (error) {
        console.error('Error fetching department/branch data:', error);
      }
    };
    
    fetchAllData();
  }, []);

  useEffect(() => {
    if (userRole && allDepartments.length > 0 && allBranches.length > 0) {
      setLoadingDept(true);
      setLoadingBranch(true);
      
      fetch(`${API_BASE_URL}/roleRoutes/roleMaster/FunctionalityListforRoleManagement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userRole: userRole.toString() })
      })
      .then(response => response.json())
      .then(data => {
        // Process department options with names
        if (data['Department Assign']?.['Department Select']?.['Department List']) {
          const allowedDeptIds = data['Department Assign']['Department Select']['Department List'];
          const filteredDepts = allDepartments.filter(dept => 
            allowedDeptIds.includes(dept.department_id))
            .map(dept => ({
              value: dept.department_id.toString(),
              label: dept.department_name
            }));
          setDepartmentOptions(filteredDepts);
        }
        
        // Process branch options with names
        if (data['Branch Assign']?.['Branch Select']?.['Branch List']) {
          const allowedBranchIds = data['Branch Assign']['Branch Select']['Branch List'];
          const filteredBranches = allBranches.filter(branch => 
            allowedBranchIds.includes(branch.branch_id))
            .map(branch => ({
              value: branch.branch_id.toString(),
              label: branch.branch_name
            }));
          setBranchOptions(filteredBranches);
        }
      })
      .catch(error => console.error('Error:', error))
      .finally(() => {
        setLoadingDept(false);
        setLoadingBranch(false);
      });
    }
  }, [userRole, allDepartments, allBranches]);

  const fetchEmployeeNames = async () => {
    try {
      setIsLoadingEmployees(true);
      const response = await axios.post(`${API_BASE_URL}/login/activeEmplList1`);
      if (response.data && response.data.employees) {
        const options = response.data.employees.map(emp => ({
          value: emp.emp_id,
          label: `${emp.full_name} (${emp.emp_id})`
        }));
        setEmployeeNameOptions(options);
      }
    } catch (error) {
      console.error('Error fetching employee names:', error);
    } finally {
      setIsLoadingEmployees(false);
    }
  };
  
  useEffect(() => {
    fetchEmployeeNames();
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredProgressData = [...employeeProgressData]
  .filter(emp => {
    try {
      if (!filters.employeeName) return true;
      
      const searchTerm = (filters.employeeName || '').toString().toLowerCase();
      const empName = (emp?.name || '').toString().toLowerCase();
      const empId = (emp?.id || '').toString().toLowerCase();
      
      return empName.includes(searchTerm) || empId.includes(searchTerm);
    } catch (error) {
      console.error('Error filtering employees:', error);
      return true;
    }
  })
  .sort((a, b) => (b?.trainingsCompleted || 0) - (a?.trainingsCompleted || 0))
  .slice(0, topN);
  


  // Transform the employee data for the chart
  const transformEmployeeData = (userStats) => {
  if (!userStats || !userStats.length) return [];

  return userStats.map(emp => ({
    id: emp.trainee_id,
    name: emp.trainee_name,
    trainingsCompleted: parseInt(emp.trainings_completed) || 0,
    hoursSpent: parseFloat(emp.hours_spent) || 0,
    department: emp.department_name,
    branch: emp.branch_name,
    trainingsAssigned: parseInt(emp.trainings_assigned) || 0,
    trainingsAttended: parseInt(emp.Total_attended_count) || 0
  }));
};

  // Fetch metrics when filters change
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setMetrics(prev => ({...prev, loading: true}));
        setLoading(true);
        
        const userDetails = JSON.parse(sessionStorage.getItem("userDetails") || "{}");
        const roleResponse = await axios.post(
          `${API_BASE_URL}/roleRoutes/roleMaster/FunctionalityListforRoleManagement`,
          { userRole: userDetails.userRole?.toString() }
        );
        
        const params = {
          branch_id: filters.branch || 
                   (roleResponse.data['Branch Assign']?.['Branch Select']?.['Branch List']?.join(',') || ''),
          department_id: filters.department || 
                      (roleResponse.data['Department Assign']?.['Department Select']?.['Department List']?.join(',') || ''),
          from_date: filters.startDate ||'', 
          to_date: filters.endDate || '',
          emp_id: filters.employeeName || ''
        };
  
        if (params.branch_id || params.department_id) {
          const response = await axios.post(
            `${API_BASE_URL}/dashboard/Dept_and_branch_Training_Performance`,
            params 
          );
          
          console.log('API Response:', response.data); // Debug log
          
          // Handle department status data
          if (response.data.departmentStatus) {
            const transformedData = response.data.departmentStatus.map(dept => ({
              department: dept.department_name, // Using branch_name as department
              assigned: dept.Total_assigned_count,
              attended: parseInt(dept.Total_attended_count) || 0,
              completed: dept.Total_completed_count
            }));
            setDepartmentPerformanceData(transformedData);
          }
  
          // Handle user stats data
          if (response.data.userStats) {
  let employeeData = response.data.userStats.map(emp => ({
    id: emp.trainee_id,
    name: emp.trainee_name,
    trainingsCompleted: parseInt(emp.trainings_completed) || 0,
    hoursSpent: parseFloat(emp.hours_spent) || 0,
    department: emp.department_name,
    branch: emp.branch_name,
    trainingsAssigned: parseInt(emp.trainings_assigned) || 0,
    trainingsAttended: parseInt(emp.Total_attended_count) || 0
  }));
  
  // Map employee names from the options we fetched earlier
  employeeData = employeeData.map(emp => {
    const employeeOption = employeeNameOptions.find(o => o.value === emp.id);
    return {
      ...emp,
      name: employeeOption ? employeeOption.label : `${emp.name} (${emp.id})`
    };
  });
  
  setEmployeeProgressData(employeeData);
}
  
          // Handle completion rate data from overallStats
          if (response.data.overallStats) {
            setCompletionRateData({
              total: response.data.overallStats.total_trainings || 0,
              completedCount: response.data.overallStats.All_Branch_and_Dept_Total_assigned_count_completed || 0,
              notCompletedCount: response.data.overallStats.All_Branch_and_Dept_Total_assigned_count_Processing || 0,
              completedPercentage: response.data.overallStats.All_Branch_and_Dept_Total_assigned_count_completed_percentage || "0",
              notCompletedPercentage: response.data.overallStats.All_Branch_and_Dept_Total_assigned_count_Processing_percentage || "0"
            });
          }
          
          // Handle metrics
          setMetrics({
            avgTrainingsDone: response.data.overallStats.total_trainings || '0',
            avgHoursSpent: parseFloat(response.data.overallStats.All_Branch_and_Dept_Total_hours_spent || 0).toFixed(2),
            participationPercentage: response.data.overallStats.employee_participation_percentage || '0',
            loading: false,
            showingAll: !filters.branch && !filters.department,
            dateRange: `${new Date(filters.startDate || '').toLocaleDateString()} - ${new Date(filters.endDate || '').toLocaleDateString()}`
          });
        }
      } catch (error) {
        console.error('Error in fetchMetrics:', error);
        setMetrics(prev => ({...prev, loading: false}));
      } finally {
        setLoading(false);
      }
    };
  
    fetchMetrics();
  }, [filters, '', '', employeeNameOptions]);

  // Transform the completion rate data for the pie chart
  const getCompletionRateChartData = () => {
    return [
      { 
        name: 'Completed', 
        value: parseFloat(completionRateData.completedPercentage), 
        count: completionRateData.completedCount 
      },
      { 
        name: 'Not Completed', 
        value: parseFloat(completionRateData.notCompletedPercentage), 
        count: completionRateData.notCompletedCount 
      }
    ];
  };
  const handleSearch = () => {    
    setFilters({ ...filters });
  };
  const handleReset = () => {
    const year = new Date().getFullYear();
        setFilters({
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`,
          department: '',
          branch: '',
          courseCategory: '',
          employeeName: ''
        });
  };
    
  return (
<>
{/* Filter Section */}
  <div className="filters-section" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
  <h5 style={{ marginBottom: '10px' }}>Filter </h5>
  <input
    type="date"
    name="startDate"
    className="filter-input"
    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
    value={filters.startDate || ''}
    onChange={(e) => handleFilterChange('startDate', e.target.value)}
  />
  
  <span>to</span>
  
  <input
    type="date"
    name="endDate"
    className="filter-input"
    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
    value={filters.endDate || ''}
    onChange={(e) => handleFilterChange('endDate', e.target.value)}
  />
  
  <Select
    options={departmentOptions}
    isLoading={loadingDept}
    value={departmentOptions.find(opt => opt.value === filters.department) || null}
    onChange={selected => handleFilterChange('department', selected?.value || '')}
    placeholder="Select Department"
    isClearable
    styles={{
      container: (provided) => ({
        ...provided,
        width: '200px'
      })
    }}
  />
  
  <button 
    className="filter-search-btn" 
    onClick={handleSearch}
    style={{
      padding: '8px 16px',
      backgroundColor: '#1976d2',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontWeight: 600,
      cursor: 'pointer'
    }}
  >
    Search
  </button>
  
  <button 
    onClick={handleReset}
    style={{
      padding: '8px 16px',
      backgroundColor: '#f5f5f5',
      color: '#333',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontWeight: 600,
      cursor: 'pointer'
    }}
  >
    Reset
  </button>
</div>


      {/* Metrics Section */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-label">Total Trainings Completed</div>
          {metrics.loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              <div className="metric-value">{metrics.avgTrainingsDone}</div>
              <div className="metric-description">For selected date range and filters</div>
            </>
          )}
        </div>

        <div className="metric-card secondary">
          <div className="metric-label">Total Hours Spent on Training</div>
          {metrics.loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              <div className="metric-value">{metrics.avgHoursSpent}</div>
              <div className="metric-description">Hours per employee during selected period</div>
            </>
          )}
        </div>
        <div className="metric-card">
          <div className="metric-label">Average Employee Participation on Training</div>
          {metrics.loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              <div className="metric-value">{metrics.participationPercentage}</div>
              <div className="metric-description">Employee participation percentage</div>
            </>
          )}
        </div>
      </div>

      {/* Charts and Analysis Section */}
      <div className="chart-row">

        {/* Departmental Training Performance Card */}
<div className="chart-card">
  <div className="chart-title-container">
    <div>
      <h3 className="chart-title">Training Info by Department</h3>
      <div className="chart-subtitle">
      <span className="legend-item">
        <span className="color-indicator" style={{ backgroundColor: COLORS.primary }}></span>
        Total Assigned 
      </span>
      <span className="legend-item">
        <span className="color-indicator" style={{ backgroundColor: "#FFC107" }}></span>
        Attended
      </span>
      <span className="legend-item">
        <span className="color-indicator" style={{ backgroundColor: COLORS.secondary }}></span>
        Completed
      </span>
    </div>
  </div>
    
    {departmentPerformanceData.length > 3 && (
    <button 
      className="view-all-btn"
      onClick={() => setShowAllDepartmentsDialog(true)}
    >
      View All ({departmentPerformanceData.length})
    </button>
  )}
  </div>

  {loading ? (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  ) : departmentPerformanceData.length > 0 ? (
    <>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={departmentPerformanceData.slice(0, 3)}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
            barSize={30}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="department"
              type="category"
              tick={{ fill: COLORS.textLight, fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={70}
              tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 9)}...` : value}
            />
            <YAxis 
              type="number"
              tick={{ fill: COLORS.textLight, fontSize: 10 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: COLORS.white,
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '4px',
                padding: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              formatter={(value, name, props) => {
                let labelText = '';
                switch (props.dataKey) {
                  case "assigned":
                    labelText = `Assigned: ${value} ${value === 1 ? 'training' : 'trainings'}`;
                    break;
                  case "attended":
                    labelText = `Attended: ${value} ${value === 1 ? 'participant' : 'participants'}`;
                    break;
                  case "completed":
                    labelText = `Completed: ${value} ${value === 1 ? 'training' : 'trainings'}`;
                    break;
                  default:
                    labelText = `${name}: ${value}`;
                }
                return [labelText, ''];
              }}
              labelFormatter={(label) => `Department: ${label}`}
            />
            <Bar 
              dataKey="assigned" 
              name="Total Assigned" 
              fill={COLORS.primary}
              animationDuration={1000}
              radius={[3, 3, 0, 0]}
            />
            <Bar 
              dataKey="attended" 
              name="Attended" 
              fill="#FFC107"
              animationDuration={1000}
              radius={[3, 3, 0, 0]}
            />
            <Bar 
              dataKey="completed" 
              name="Completed" 
              fill={COLORS.secondary}
              animationDuration={1000}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Summary row - shown only when not viewing all departments */}
      {!showAllDepartmentsDialog && (
        <div className="chart-footer">
          <div className="chart-stat">
            <span className="color-indicator" style={{ backgroundColor: COLORS.primary }}></span>
            Total Assigned: {completionRateData.total} trainings
          </div>
          <div className="chart-stat">
            <span className="color-indicator" style={{ backgroundColor: COLORS.secondary }}></span>
            Total Completed: {completionRateData.completedCount} trainings
          </div>
        </div>
      )}
    </>
  ) : (
    <div className="empty-container">
      <div className="empty-message">No departmental data available for the selected filters</div>
    </div>
  )}
</div>


{showAllDepartmentsDialog && (
  <AllDepartmentsDialog 
    data={departmentPerformanceData} 
    onClose={() => setShowAllDepartmentsDialog(false)} 
  />
)}

        {/* Training Completion Rate Card */}
        <div className="chart-card">
          <div className="chart-title">Training Completion Rate by Department</div>
          <div className="chart-subtitle">Overall completion percentage for {completionRateData.total} total training assignments</div>
          
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : completionRateData.total > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getCompletionRateChartData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={2}
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell key="cell-completed" fill={COLORS.secondary} />
                    <Cell key="cell-not-completed" fill={COLORS.primary} />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: COLORS.white,
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: '4px',
                      padding: '10px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value, name, props) => [
                      `${props.payload.count} trainings (${props.payload.value}%)`,
                      name
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-container">
              <div className="empty-message">No completion data available for the selected filters</div>
            </div>
          )}

          {/* Summary with exact counts */}
          {!loading && completionRateData.total > 0 && (
            <div className="chart-footer">
              <div className="chart-stat">
                <span className="color-indicator" style={{ backgroundColor: COLORS.secondary }}></span>
                Completed: {completionRateData.completedCount}
              </div>
              <div className="chart-stat">
                <span className="color-indicator" style={{ backgroundColor: COLORS.primary }}></span>
                Not Completed: {completionRateData.notCompletedCount}
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Employee Progress Section */}
        <div className="chart-card">
  <div className="employee-header">
    <div className="chart-title">Employee Progress Tracking</div>
    <div className="search-controls">
      <input
        type="text"
        className="search-input"
        placeholder="Search by Name or ID"
        value={filters.employeeName || ''}
        onChange={(e) => handleFilterChange('employeeName', e.target.value)}
      />
      {!filters.employeeName && (
        <select
          className="filter-input filter-select top-select"
          value={topN}
          onChange={(e) => setTopN(e.target.value)}
        >
          {[10, 25, 50, 100].map(n => (
            <option key={n} value={n}>Top {n}</option>
          ))}
        </select>
      )}
      {filters.employeeName && (
        <button 
          className="clear-selection-btn"
          onClick={() => handleFilterChange('employeeName', '')}
        >
          Clear
        </button>
      )}
    </div>
  </div>
  
  {loading ? (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  ) : employeeProgressData.length > 0 ? (
    filters.employeeName ? (
      // Single Employee View (when searching)
      filteredProgressData.map((emp, index) => (
        <div key={index} className="single-employee-view">
          <div className="employee-profile-header">
            <h3 className="employee-name-id">{emp.name} </h3>
            <div className="employee-department-branch">
              Department: {emp.department || 'N/A'} | Branch: {emp.branch || 'N/A'}
            </div>
          </div>

          <div className="employee-stats-grid">
            <div className="stat-card">
              <div className="stat-value">{emp.trainingsAssigned}</div>
              <div className="stat-label">Trainings Assigned</div>
            </div>
            
            <div className="stat-card highlight">
              <div className="stat-value">{emp.trainingsCompleted}</div>
              <div className="stat-label">Trainings Completed</div>
            </div>
            <div className="stat-card highlight">
              <div className="stat-value">{emp.hoursSpent.toFixed(1)}</div>
              <div className="stat-label">Hours Spent</div>
            </div>
          </div>

        </div>
      ))
    ) : (
      // Default View (when not searching)
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={450}>
          <BarChart 
            data={filteredProgressData}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <Legend />
            <Bar 
              dataKey="trainingsCompleted"
              name="Trainings Completed"
              fill={COLORS.primary}
            />
            <Bar 
              dataKey="hoursSpent"
              name="Hours Spent"
              fill={COLORS.secondary}
            />
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  ) : (
    <div className="empty-container">
      <div className="empty-message">
        {filters.employeeName ? "No matching employees found" : "No employee data available"}
      </div>
    </div>
  )}
</div>
    </>
  );
};

export default DepartmentalTrainingDashboard;