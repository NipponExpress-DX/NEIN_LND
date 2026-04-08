import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import { Search, Filter, ChevronDown, Calendar, Users, Book, Clock, Award, Briefcase, PieChart as PieChartIcon, BarChart2, Loader,ArrowLeft, ArrowRight } from 'lucide-react';
import axios from 'axios';
import Select from 'react-select';
import { CaretUp,ArrowsLeftRight,CheckCircle, UserList,  ClockCounterClockwise,  TrendUp, TrendDown, BookOpen } from '@phosphor-icons/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';



export default function BranchTrainingDashboard() {
  const [showAllDepartmentsDialog, setShowAllDepartmentsDialog] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for max to min, 'asc' for min to max

    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [departmentSummary, setDepartmentSummary] = useState([]);
    const [topCourses, setTopCourses] = useState([]);
    const [allDepartments, setAllDepartments] = useState([]);
    const [allBranches, setAllBranches] = useState([]);
    const [departmentOptions, setDepartmentOptions] = useState([]);
    const [branchOptions, setBranchOptions] = useState([]);
    const [employeeNameOptions, setEmployeeNameOptions] = useState([]);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
    const [loadingDept, setLoadingDept] = useState(false);
    const [loadingBranch, setLoadingBranch] = useState(false);
      const [userRole, setUserRole] = useState(null);
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
      const [showAllBranchesDialog, setShowAllBranchesDialog] = useState(false);

   // Add this near your monthOptions
const yearOptions = Array.from({length: 10}, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year.toString(), label: year.toString() };
});
const [yearSelection, setYearSelection] = useState(null);

const [metrics, setMetrics] = useState({
    avgTrainingsDone: '0',
    avgHoursSpent: '0',
    loading: false
  });
  const [departmentPerformanceData, setDepartmentPerformanceData] = useState([]);
  const [monthSelection, setMonthSelection] = useState(null);
  // Add this to your filter options
const monthOptions = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

// Update your handleFilterChange to handle month selection
const handleMonthChange = (selectedMonth) => {
  setMonthSelection(selectedMonth);
  
  if (selectedMonth) {
    const year = yearSelection ? parseInt(yearSelection.value) : new Date().getFullYear();
    const month = selectedMonth.value;
    const daysInMonth = new Date(year, month, 0).getDate();
    
    setFilters(prev => ({
      ...prev,
      dateRange: {
        start: `${year}-${month}-01`,
        end: `${year}-${month}-${daysInMonth}`
      }
    }));
  } else {
    // If month is cleared, reset date range
    setFilters(prev => ({
      ...prev,
      dateRange: {
        start: '',
        end: ''
      }
    }));
  }
};

// Add handler for year change
const handleYearChange = (selectedYear) => {
  setYearSelection(selectedYear);
  
  if (monthSelection && selectedYear) {
    const year = parseInt(selectedYear.value);
    const month = monthSelection.value;
    const daysInMonth = new Date(year, month, 0).getDate();
    
    setFilters(prev => ({
      ...prev,
      dateRange: {
        start: `${year}-${month}-01`,
        end: `${year}-${month}-${daysInMonth}`
      }
    }));
  }
};
  // Filter states
  const [filters, setFilters] = useState({
    branch: '',
    subBranch: '',
    department: '',
    courseCategory: '',
    employeeName: '',
    dateRange: {
      start: '',
      end: ''
    }
  });
  
  // Pagination state for employee table
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 10;

   const [trainingStats, setTrainingStats] = useState({
    assignedCompleted: 0,
    assignedProcessing: 0,
    attendedCount: 0,
    completedCount: 0,
    hoursSpent: 0,
    totalEmployees: 0,
    totalTrainings: 0,
    completedPercentage: 0,
    processingPercentage: 0,
    participationPercentage: 0
  });

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

  // Fetch department and branch options based on user role
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





  // Fetch metrics when filters change
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setMetrics(prev => ({...prev, loading: true}));
        setLoading(true);
        const currentYear = new Date().getFullYear();

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
          from_date: filters.startDate || `${currentYear}-01-01`,
          to_date: filters.endDate || `${currentYear}-12-31`,
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
  
         
        }
      } catch (error) {
        console.error('Error in fetchMetrics:', error);
        setMetrics(prev => ({...prev, loading: false}));
      } finally {
        setLoading(false);
      }
    };
  
    fetchMetrics();
  }, [filters, employeeNameOptions]);

  // Fetch employee names
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

  // Fetch dashboard data based on filters
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const currentYear = new Date().getFullYear();

        // Prepare request data
        const requestData = {
          branch_id: filters.branch || branchOptions.map(b => b.value).join(','),
          department_id: filters.department || departmentOptions.map(d => d.value).join(','),
          from_date: filters.dateRange.start || `${currentYear}-01-01`,
          to_date: filters.dateRange.end || `${currentYear}-12-31`
        };

        const response = await axios.post(
          `${API_BASE_URL}/dashboard/Branch_and_Dept_Training_Performance`,
          requestData
        );

        const data = response.data;

        // Transform API data to match our component structure
        if (data.userStats) {
          const employeeData = data.userStats.map(emp => ({
            id: emp.trainee_id,
            name: emp.trainee_name,
            department: emp.department_name,
            branch: emp.branch_name,
            completionRate: emp.trainings_assigned > 0 
              ? Math.round((emp.trainings_completed / emp.trainings_assigned) * 100)
              : 0,
            status: emp.trainings_completed === emp.trainings_assigned 
              ? 'Completed' 
              : emp.trainings_completed > 0 
                ? 'In Progress' 
                : 'Not Started',
            learningHours: parseFloat(emp.hours_spent),
            enrolledCourses: emp.trainings_assigned,
            completedCourses: emp.trainings_completed
          }));
          setEmployees(employeeData);
        }
if (data.departmentStatus) {
  const deptSummary = data.departmentStatus.map(dept => ({
    name: dept.branch_name,
    employeeCount: dept.Total_assigned_count,
    totalHours: parseFloat(dept.Total_hours_spent) || 0, // Changed from avgLearningHours to totalHours
    completionPercentage: dept.Total_assigned_count > 0
      ? Math.round((dept.Total_completed_count / dept.Total_assigned_count) * 100)
      : 0
  }));
  setDepartmentSummary(deptSummary);
}

        if (data.overallStats) {
            setOverallStats({
  totalEmployees: data.overallStats.total_employee_count,
  avgCompletionRate: parseFloat(data.overallStats.All_Branch_and_Dept_Total_assigned_count_completed_percentage) || 0,
  totalLearningHours: parseFloat((data.overallStats.All_Branch_and_Dept_Total_hours_spent) || 0).toFixed(2),
  completedTraining: data.overallStats.All_Branch_and_Dept_Total_assigned_count_completed || 0
});
  
            // Set the training stats
           
setTrainingStats({
  assignedCompleted: data.overallStats.All_Branch_and_Dept_Total_assigned_count_completed || 0,
  assignedProcessing: data.overallStats.All_Branch_and_Dept_Total_assigned_count_Processing || 0,
  attendedCount: data.overallStats.All_Branch_and_Dept_Total_attended_count || 0,
  absentCount: data.overallStats.All_Branch_and_Dept_Total_absent_count || 0,
  completedCount: data.overallStats.All_Branch_and_Dept_Total_completed_count || 0,
  hoursSpent: parseFloat(data.overallStats.All_Branch_and_Dept_Total_hours_spent) || 0,
  totalEmployees: data.overallStats.total_employee_count || 0,
  totalTrainings: data.overallStats.total_trainings || 0,
  completedPercentage: parseFloat(data.overallStats.All_Branch_and_Dept_Total_assigned_count_completed_percentage) || 0,
  processingPercentage: parseFloat(data.overallStats.All_Branch_and_Dept_Total_assigned_count_Processing_percentage) || 0,
  participationPercentage: data.overallStats.total_employee_count > 0 
    ? Math.round((data.overallStats.All_Branch_and_Dept_Total_attended_count / data.overallStats.total_employee_count) * 100)
    : 0           
});
          }
  
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        } finally {
          setLoading(false);
        }
      };
  
      if (departmentOptions.length > 0 && branchOptions.length > 0) {
        fetchDashboardData();
      }
    }, [filters, departmentOptions, branchOptions]);
    const filteredDepartmentSummary = departmentSummary.filter(dept => dept.avgLearningHours > 0);


  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Apply filters to data
  const filteredEmployees = employees.filter(employee => {
    return (
      (filters.branch === '' || employee.branch === filters.branch) &&
      (filters.department === '' || employee.department === filters.department) &&
      (filters.employeeName === '' || 
       employee.name.toLowerCase().includes(filters.employeeName.toLowerCase()) ||
       employee.id.toString().includes(filters.employeeName))
    );
  });
  
  // Get current employees for pagination
  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  
  // Overall stats state
  const [overallStats, setOverallStats] = useState({
    totalEmployees: 0,
    avgCompletionRate: 0,
    totalLearningHours: 0,
    completedTraining: 0
  });
  
  
  const paginationButtons = [];
  for (let i = 1; i <= Math.ceil(filteredEmployees.length / employeesPerPage); i++) {
    if (
      i === 1 || 
      i === Math.ceil(filteredEmployees.length / employeesPerPage) ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      paginationButtons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`pagination-button ${currentPage === i ? 'pagination-button-active' : 'pagination-button-inactive'}`}
        >
          {i}
        </button>
      );
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      paginationButtons.push(<span key={i} className="mx-1">...</span>);
    }
  } 
  const handleReset = () => {
  setFilters({
    dateRange: { start: '', end: '' },
    department: '',
    branch: '',
    employeeName: ''
  });
  setMonthSelection(null);
  setYearSelection(null);
};
  
  
  // Colors for charts
  const COLORS = {
    primary: '#1A005D',
    secondary: '#3ccf4e',
    accent: '#f72585',
    warning: '#fca311',
    info: '#4cc9f0',
    light: '#f8f9fa',
    dark: '#212529',
    textLight: '#6c757d',
    borderLight: '#dee2e6',
    white: '#ffffff',
    backgroundLight: '#f5f8ff'
};  
const colorArray = ['#4361ee', '#3ccf4e', '#f72585', '#fca311', '#4cc9f0', '#560bad'];

const [currentChartIndex, setCurrentChartIndex] = useState(0);
if (loading) {
  return (
      <div className="dashboard-loading">
          <div className="loading-icon">
              <Loader size={48} className="spinner" />
          </div>
          <h2>Loading Dashboard Data...</h2>
          <p>Please wait while we fetch the latest training performance metrics</p>
      </div>
  );
}

const charts = [
  
  "Training Completion Rate by Department",
  "Average Learning Hours per Branch",
  "Training Statistics Overview"
];

// Add these navigation functions
const nextChart = () => {
  setCurrentChartIndex((prev) => (prev + 1) % charts.length);
};

const prevChart = () => {
  setCurrentChartIndex((prev) => (prev - 1 + charts.length) % charts.length);
};

  return (
    <div className="dashboard">
        {/* Filters */}
      <div className="filters-section">
        <h3 className="filters-title">Filter Training Data</h3>

          <div className="filters-grid" style={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: '8px',
            justifyContent: 'space-between' 
          }}>
          <div style={{ display: 'flex', gap: '8px', flexGrow: 1 }}>
            
          
            {/* Branch */}
            <div className="filter-group" style={{ maxWidth: '250px', width: '100%' }}>
              <label className="filter-label">Branch</label>
              <Select
                options={branchOptions}
                isLoading={loadingBranch}
                value={branchOptions.find(opt => opt.value === filters.branch) || null}
                onChange={selected => handleFilterChange('branch', selected?.value || '')}
                placeholder="Select Branch"
                isClearable
              />
            </div>

            {/* Department */}
            <div className="filter-group" style={{ maxWidth: '250px', width: '100%' }}>
              <label className="filter-label">Department</label>
              <Select
                options={departmentOptions}
                isLoading={loadingDept}
                value={departmentOptions.find(opt => opt.value === filters.department) || null}
                onChange={selected => handleFilterChange('department', selected?.value || '')}
                placeholder="Select Department"
                isClearable
              />
            </div>
            



<div className="filter-group">
  <label className="filter-label">Date Range</label>
  <div className="date-range-container">
    <input
      type="date"
      className="date-input"
      value={filters.dateRange.start}
      onChange={(e) => {
        setMonthSelection(null); // Clear month selection when manually changing dates
        handleFilterChange('dateRange', {
          ...filters.dateRange,
          start: e.target.value
        });
      }}
    />
    <input
      type="date"
      className="date-input"
      value={filters.dateRange.end}
      onChange={(e) => {
        setMonthSelection(null); // Clear month selection when manually changing dates
        handleFilterChange('dateRange', {
          ...filters.dateRange,
          end: e.target.value
        });
      }}
    />
  </div>        
</div>
         <div className="filter-group" style={{ maxWidth: '250px', width: '80%' }}>
  <label className="filter-label">Select Month</label>
  <Select
    options={monthOptions}
    value={monthSelection}
    onChange={handleMonthChange}
    placeholder="Select Month"
    isClearable
  />
</div>

<div className="filter-group" style={{ maxWidth: '250px', width: '70%' }}>
  <label className="filter-label">Select Year</label>
  <Select
    options={yearOptions}
    value={yearSelection}
    onChange={handleYearChange}
    placeholder="Select Year"
    isClearable
    defaultValue={{ value: new Date().getFullYear().toString(), label: new Date().getFullYear().toString() }}
  />
</div>

          </div>
          
          <button 
            onClick={handleReset}
            style={{
              padding: '8px 8px 10px 10px',
              height: '38px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1.01rem',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '20px',
              marginLeft: '25px'
            }}
          >
            Reset
          </button>
        </div>         
      </div>
        {/* Summary Cards */}
        {/* Summary Cards */}
<section className="summary-cards-section">
  <div className="section-container">
    <div className="summary-cards-grid">
      {/* Total Employees Card */}
      <div className="summary-card">
        <div className="card-icon">
          <Users size={24} />
        </div>
        <div className="card-content">
          <h3>{overallStats.totalEmployees}</h3>
          <p>Total Employees</p>
        </div>
      </div>
      
      {/* Avg Completion Rate Card */}
      <div className="summary-card">
        <div className="card-icon green">
          <Award size={24} />
        </div>
        <div className="card-content">
          <h3>{overallStats.avgCompletionRate}%</h3>
          <p>Avg Completion Rate</p>
        </div>
      </div>
      
      {/* Total Learning Hours Card */}
      <div className="summary-card">
        <div className="card-icon amber">
          <Clock size={24} />
        </div>
        <div className="card-content">
          <h3>{overallStats.totalLearningHours}</h3>
          <p>Total Learning Hours</p>
        </div>
      </div>
      
      {/* Completed Training Card */}
      <div className="summary-card">
        <div className="card-icon purple">
          <Book size={24} />
        </div>
        <div className="card-content">
          <h3>{overallStats.completedTraining}</h3>
          <p>Completed Training</p>
        </div>
      </div>
    </div>
  </div>
</section>
        
        {/* Charts Row */}
        <section className="charts-section">
            <div className="section-container">
                
            
                
                  
                  
                 {currentChartIndex === 0 && (
  <div className="charts-grid">
    {/* Training Info by Department Card */}
    <div className="chart-card">
      <div className="chart-header">
        <button
          onClick={prevChart}
          className="nav-button previous"
          style={{
            padding: '8px 8px 10px 10px',
            height: '38px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1.01rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '20px',
            marginLeft: '25px'
          }}
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Previous</span>
        </button>
        
        <div className="chart-title-container">
          <div>
          <h3 style={{ marginRight: '16px' }}>Training Info by Department</h3>

          </div>
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

        <button
          onClick={nextChart}
          className="nav-button next"
          style={{
            padding: '8px 8px 10px 10px',
            height: '38px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1.01rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '20px',
            marginLeft: '25px'
          }}
        >
          <span className="text-sm font-medium">Next</span>
          <ArrowRight size={18} />
        </button>
      </div>
      
      {departmentPerformanceData.length > 5 && (
        <div style={{ textAlign: 'right', marginBottom: '10px' }}>
          <button 
            onClick={() => setShowAllDepartmentsDialog(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#1976d2',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            View All ({departmentPerformanceData.length})
          </button>
        </div>
      )}

      <div className="chart-body">
        {loading ? (
          <div className="loading-container">
            <Loader size={48} className="spinner" />
          </div>
        ) : departmentPerformanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart 
              data={departmentPerformanceData.slice(0, 5)}
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              barSize={20}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="department" 
                tick={{fill: '#6c757d', fontSize: 12}}
                tickLine={{stroke: '#f0f0f0'}}
                axisLine={{stroke: '#f0f0f0'}}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis 
                tick={{fill: '#6c757d', fontSize: 12}}
                tickLine={{stroke: '#f0f0f0'}}
                axisLine={{stroke: '#f0f0f0'}}
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
                  let label = '';
                  switch (props.dataKey) {
                    case "assigned":
                      label = `${value} ${value === 1 ? 'training' : 'trainings'}`;
                      return [label, 'Assigned'];
                    case "completed":
                      label = `${value} trainings`;
                      return [label, 'Completed'];
                    case "attended":
                      label = `${value} ${value === 1 ? 'participant' : 'participants'}`;
                      return [label, 'Attended'];
                    default:
                      return [value, name];
                  }
                }}
                labelFormatter={(label) => `Department: ${label}`}
              />
              <Legend 
                wrapperStyle={{
                  fontSize: '12px',
                  color: '#6c757d'
                }}
              />
              <Bar 
                dataKey="assigned" 
                name="Total Assigned" 
                fill="#1A005D" 
                radius={[4, 4, 0, 0]}
                animationDuration={1000}
              />
              <Bar 
                dataKey="attended" 
                name="Attended" 
                fill="#fca311" 
                radius={[4, 4, 0, 0]}
                animationDuration={1200}
              />
              <Bar 
                dataKey="completed" 
                name="Completed" 
                fill="#3ccf4e" 
                radius={[4, 4, 0, 0]}
                animationDuration={1400}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-message">No departmental data available for the selected filters</div>
        )}
      </div>
      
      <div className="chart-footer">
        <div className="chart-stat">
          <span className="stat-indicator" style={{backgroundColor: '#4361ee'}}></span>
          <span>Total Assigned: {trainingStats.totalTrainings}</span>
        </div>
        <div className="chart-stat">
          <span className="stat-indicator" style={{backgroundColor: '#3ccf4e'}}></span>
          <span>Total Completed: {trainingStats.assignedCompleted}</span>
        </div>
      </div>
    </div>
  </div>
  
)}
{showAllDepartmentsDialog && (
  <div className="dialog-overlay">
    <div className="dialog-content" style={{ width: '90%', maxWidth: '1200px', height: '80vh' }}>
      <div className="dialog-header">
        <h3>All Departments Training Info</h3>
        <button 
          className="dialog-close-btn" 
          onClick={() => setShowAllDepartmentsDialog(false)}
        >
          &times;
        </button>
      </div>
      
      <div className="dialog-body">
        <div className="dialog-legend">
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
        
        <div className="departments-scroll-container">
          <div className="departments-list-container">
            <div className="departments-list-scroll">
              {[...departmentPerformanceData]
                .sort((a, b) => b.attended - a.attended)
                .map((dept, index) => (
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
  style={{ width: `${(dept.assigned / Math.max(...departmentPerformanceData.map(d => d.assigned))) * 100}%` }}
  title={`Assigned: ${dept.assigned}`}
></div>
                        <span className="stat-value">{dept.assigned}</span>
                      </div>
                      
                      <div className="stat-bar">
                        <div 
                          className="stat-bar-attended" 
                          style={{ width: `${(dept.attended / Math.max(...departmentPerformanceData.map(d => d.attended)) * 100)}%` }}
                          title={`Attended: ${dept.attended}`}
                        ></div>
                        <span className="stat-value">{dept.attended}</span>
                      </div>
                      
                      <div className="stat-bar">
                        <div 
                          className="stat-bar-completed" 
                          style={{ width: `${(dept.completed / Math.max(...departmentPerformanceData.map(d => d.completed)) * 100)}%` }}
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
          <span>Total Departments: {departmentPerformanceData.length}</span>
        </div>
        <button 
          className="dialog-close-button" 
          onClick={() => setShowAllDepartmentsDialog(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
{currentChartIndex === 1 && (
  <div className="charts-grid">
    {/* Learning Hours per Branch */}
    <div className="chart-card">
      <div className="chart-header">
        <button
          onClick={prevChart}
          className="nav-button previous"
          style={{
            padding: '8px 8px 10px 10px',
            height: '38px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1.01rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '20px',
            marginLeft: '25px'
          }}
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Previous</span>
        </button>
        
        <div className="chart-title-container">
          <h3>Total Learning Hours by Branch</h3> {/* Updated title */}
        </div>
        
        <button
          onClick={nextChart}
          className="nav-button next"
          style={{
            padding: '8px 8px 10px 10px',
            height: '38px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1.01rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '20px',
            marginLeft: '25px'
          }}
        >
          <span className="text-sm font-medium">Next</span>
          <ArrowRight size={18} />
        </button>
      </div>
      
      {/* Show View All button if more than 5 branches */}
      {departmentSummary.filter(dept => dept.totalHours > 0).length > 5 && (
        <div style={{ textAlign: 'right', marginBottom: '10px' }}>
          <button 
            onClick={() => setShowAllBranchesDialog(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#1976d2',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            View All ({departmentSummary.filter(dept => dept.totalHours > 0).length})
          </button>
        </div>
      )}
      
      <div className="chart-body">
        {loading ? (
          <div className="loading-container">
            <Loader size={48} className="spinner" />
          </div>
        ) : departmentSummary.filter(dept => dept.totalHours > 0).length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart 
              data={[...departmentSummary]
                .filter(dept => dept.totalHours > 0)
                .sort((a, b) => b.totalHours - a.totalHours)
                .slice(0, 5)}
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                type="number"
                tick={{fill: '#6c757d', fontSize: 12}}
                tickLine={{stroke: '#f0f0f0'}}
                axisLine={{stroke: '#f0f0f0'}}
                label={{ value: 'Total Hours', position: 'bottom', offset: 0 }}
              />
              <YAxis 
                dataKey="name"
                type="category"
                width={100}
                tick={{fill: '#6c757d', fontSize: 12}}
                tickLine={{stroke: '#f0f0f0'}}
                axisLine={{stroke: '#f0f0f0'}}
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
                  return [`${value.toFixed(1)} hours`, 'Total Hours'];
                }}
                labelFormatter={(label) => `Branch: ${label}`}
              />
              <Bar 
                dataKey="totalHours" 
                name="Total Hours"
                radius={[0, 4, 4, 0]}
                animationDuration={1000}
              >
                {[...departmentSummary]
                  .filter(dept => dept.totalHours > 0)
                  .sort((a, b) => b.totalHours - a.totalHours)
                  .slice(0, 5)
                  .map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colorArray[index % colorArray.length]} 
                    />
                  ))}
                  <LabelList 
    dataKey="totalHours" 
    position="right" 
    formatter={(value) => `${value.toFixed(1)} hrs`}
    style={{
      fill: '#333',
      fontSize: '12px',
      fontWeight: 'bold'
    }}
  />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-message">No branch data available for the selected filters</div>
        )}
      </div>
    </div>
  </div>
)}
{showAllBranchesDialog && (
  <div className="dialog-overlay">
    <div className="dialog-content" style={{ width: '90%', maxWidth: '800px' }}>
      <div className="dialog-header">
        <h3>All Branches - Total Learning Hours</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => {
              setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#1A005D',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {sortOrder === 'desc' ? 'Max to Min ▼' : 'Min to Max ▲'}
          </button>
          <button 
            className="dialog-close-btn" 
            onClick={() => setShowAllBranchesDialog(false)}
          >
            &times;
          </button>
        </div>
      </div>
      
      <div className="dialog-body">
        <div className="branches-scroll-container">
          <div className="branches-list-container">
            {[...departmentSummary]
              .filter(dept => dept.totalHours > 0)
              .sort((a, b) => sortOrder === 'desc' 
                ? b.totalHours - a.totalHours 
                : a.totalHours - b.totalHours)
              .map((branch, index) => (
                <div key={index} className="branch-item">
                  <span className="branch-name">{branch.name}</span>
                  <div className="branch-stats">
                    <div 
  className="stat-bar-hours-container"
  style={{
    width: '100%',
    display: 'flex',
    alignItems: 'center'
  }}
>
  <div 
    className="stat-bar-hours"
    style={{
      width: `${(branch.totalHours / Math.max(...departmentSummary.map(d => d.totalHours))) * 100}%`,
      backgroundColor: colorArray[index % colorArray.length],
      height: '30px',
      borderRadius: '4px'
    }}
    title={`${branch.totalHours.toFixed(1)} hours`}
  ></div>

  {/* Show value at end of bar */}
  <span 
    className="branch-hours"
    style={{
      marginLeft: '8px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#333'
    }}
  >
    {branch.totalHours.toFixed(1)} hrs
  </span>
</div>

                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      
      <div className="dialog-footer">
        <div className="hours-scale">
          <span>0 hrs</span>
          <span>{Math.max(...departmentSummary.map(d => d.totalHours)).toFixed(1)} hrs</span>
        </div>
        <button 
          className="dialog-close-button" 
          onClick={() => setShowAllBranchesDialog(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

                  {currentChartIndex === 2 && (
  /* Training Statistics Summary */
  <div className="chart-card stats-summary-card">
    <div className="chart-header">
      <button
  onClick={prevChart}
  className="nav-button previous"
  style={{
    padding: '8px 8px 10px 10px',
    height: '38px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1.01rem',
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: '20px',
    marginLeft: '25px'
  }}
>
  <ArrowLeft size={18} />
  <span className="text-sm font-medium">Previous</span>
</button>
<div className="chart-title-container">
  <h3>{charts[currentChartIndex]}</h3>
</div>

<button
  onClick={nextChart}
  className="nav-button next"
  style={{
    padding: '8px 8px 10px 10px',
    height: '38px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1.01rem',
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: '20px',
    marginLeft: '25px'
  }}
>
  <span className="text-sm font-medium">Next</span>
  <ArrowRight size={18} />
</button>
    </div>
    
    <div className="stats-grid">
      {/* Total Trainings  */}
      <div className="stat-item">
        <div className="stat-icon">
          <Book size={18} weight="duotone" />
        </div>
        <div className="stat-content">
          <div className="stat-value">{trainingStats.totalTrainings}</div>
          <div className="stat-label">Total Trainings</div>
          <div className="stat-trend positive">
            <CaretUp size={14} /> {trainingStats.totalTrainings > 0 ? 
              Math.round((trainingStats.totalTrainings / (trainingStats.totalTrainings + trainingStats.assignedProcessing)) * 100) : 0}%
          </div>
        </div>
      </div>
      
      {/* Completed */}
      <div className="stat-item highlight">
        <div className="stat-icon">
          <CheckCircle size={18} weight="duotone" />
        </div>
        <div className="stat-content">
          <div className="stat-value">{trainingStats.assignedCompleted}</div>
          <div className="stat-label">Completed</div>
          <div className="stat-progress">
            <div 
              className="progress-bar" 
              style={{ width: `${trainingStats.completedPercentage}%` }}
            ></div>
          </div>
          <div className="stat-percentage">{trainingStats.completedPercentage}%</div>
        </div>
      </div>
      
      {/* In Progress */}
      <div className="stat-item">
        <div className="stat-icon">
          <ClockCounterClockwise size={18} weight="duotone" />
        </div>
        <div className="stat-content">
          <div className="stat-value">{trainingStats.assignedProcessing}</div>
          <div className="stat-label">In Progress</div>
          <div className="stat-trend warning">
            <CaretUp size={14} /> {trainingStats.processingPercentage}%
          </div>
        </div>
      </div>
      
      {/* Attended */}
      <div className="stat-item">
        <div className="stat-icon">
          <Users size={18} weight="duotone" />
        </div>
        <div className="stat-content">
          <div className="stat-value">{trainingStats.attendedCount}</div>
          <div className="stat-label">Attended</div>
          <div className="stat-trend positive">
            <CaretUp size={14} /> {trainingStats.participationPercentage}%
          </div>
        </div>
      </div>
      
      {/* Employees */}
      <div className="stat-item">
        <div className="stat-icon">
          <UserList size={18} weight="duotone" />
        </div>
        <div className="stat-content">
          <div className="stat-value">{trainingStats.totalEmployees}</div>
          <div className="stat-label">Total Employees</div>
          <div className="stat-trend neutral">
            <ArrowsLeftRight size={14} /> 100%
          </div>
        </div>
      </div>
      
      {/* Hours Spent */}
      <div className="stat-item highlight">
        <div className="stat-icon">
          <Clock size={18} weight="duotone" />
        </div>
        <div className="stat-content">
          <div className="stat-value">{trainingStats.hoursSpent.toFixed(1)}</div>
          <div className="stat-label">Hours Spent</div>
          <div className="stat-comparison">
            <span className="comparison-value positive">
              +{(trainingStats.hoursSpent / 30).toFixed(2)} hrs/day
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
                        
    </div>      
        </section>
        
        {/* Training Progress Bars */}
        <section className="progress-section">
  <div className="section-container">
    <div className="progress-card">
      <div className="progress-header">
        <div className="progress-title">
          <div className="icon-circle">
            <Award size={20} color="#4f46e5" weight="fill" />
          </div>
          <h3>Training Progress Overview</h3>
        </div>
        <div className="progress-summary">
          <span className="summary-item">
            <span className="dot completed"></span>
            {trainingStats.assignedCompleted} Completed
          </span>
          <span className="summary-item">
            <span className="dot in-progress"></span>
            {trainingStats.assignedProcessing} In Progress
          </span>
        </div>
      </div>
      
      <div className="progress-body">
        <div className="progress-item">
          <div className="progress-info">
            <div className="progress-label">
              <span className="label-icon">✓</span>
              Completed Trainings
            </div>
            <div className="progress-percentage">
              {trainingStats.completedPercentage}%
             
            </div>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar completed" 
              style={{ width: `${trainingStats.completedPercentage}%` }}
            >
              <div className="progress-bar-tooltip">
                {trainingStats.completedPercentage}% completed
              </div>
            </div>
          </div>
        </div>
        
        <div className="progress-item">
          <div className="progress-info">
            <div className="progress-label">
              <span className="label-icon">↻</span>
              Trainings In Progress
            </div>
            <div className="progress-percentage">
              {trainingStats.processingPercentage}%
             
            </div>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar in-progress" 
              style={{ width: `${trainingStats.processingPercentage}%` }}
            >
              <div className="progress-bar-tooltip">
                {trainingStats.processingPercentage}% in progress
              </div>
            </div>
          </div>
        </div>
        
      </div>
      
      <div className="progress-stats">
        <div className="stat-group">
          <div className="stat-header">
            <BookOpen size={18} color="#4f46e5" />
            <h4>Training Completion</h4>
          </div>
          <div className="stat-metrics">
            <div className="stat-box positive">
              <div className="stat-number">{trainingStats.assignedCompleted}</div>
              <div className="stat-text">Completed</div>
              <div className="stat-percentage">
                <div className="percentage-bar" style={{ width: `${trainingStats.completedPercentage}%` }}></div>
                {trainingStats.completedPercentage}%
              </div>
            </div>
            <div className="stat-box warning">
              <div className="stat-number">{trainingStats.assignedProcessing}</div>
              <div className="stat-text">In Progress</div>
              <div className="stat-percentage">
                <div className="percentage-bar" style={{ width: `${trainingStats.processingPercentage}%` }}></div>
                {trainingStats.processingPercentage}%
              </div>
            </div>
          </div>
        </div>
        
        <div className="stat-group">
          <div className="stat-header">
            <Users size={18} color="#4f46e5" />
            <h4>Employee Participation</h4>
          </div>
          <div className="stat-metrics">
            <div className="stat-box positive">
              <div className="stat-number">{trainingStats.attendedCount}</div>
              <div className="stat-text">Attended</div>
              <div className="stat-percentage">
                <div className="filter-text">Filter data</div>
              </div>
            </div>
            <div className="stat-box negative">
              <div className="stat-number">{trainingStats.absentCount}</div>
              <div className="stat-text">Absent</div>
              <div className="stat-percentage">
                <div className="filter-text">Filter data</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="stat-group">
          <div className="stat-header">
            <Clock size={18} color="#4f46e5" />
            <h4>Learning Hours</h4>
          </div>
          <div className="stat-metrics">
            <div className="stat-box highlight">
              <div className="stat-number">{trainingStats.hoursSpent.toFixed(1)}</div>
              <div className="stat-text">Total Hours</div>
              <div className="stat-description">Filter data</div>
            </div>
            <div className="stat-box highlight">
              <div className="stat-number">
                {trainingStats.totalEmployees > 0 
                  ? (trainingStats.hoursSpent / trainingStats.totalEmployees).toFixed(1) 
                  : 0}
              </div>
              <div className="stat-text">Avg Per Employee</div>
              <div className="stat-description">Filter data</div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
        
        <style jsx>{`
              :root {
                  --color-primary: #4361ee;
                  --color-primary-light: #4895ef;
                  --color-secondary: #3ccf4e;
                  --color-accent: #f72585;
                  --color-warning: #fca311;
                  --color-info: #4cc9f0;
                  --color-light: #f8f9fa;
                  --color-dark: #212529;
                  --color-text: #495057;
                  --color-text-light: #6c757d;
                  --color-border: #e9ecef;
                  --color-background: #f8f9fd;
                  --color-white: #ffffff;
                  --color-card-bg: #ffffff;
                  --shadow-sm: 0 2px 8px rgba(67, 97, 238, 0.07);
                  --shadow-md: 0 4px 12px rgba(67, 97, 238, 0.1);
                  --shadow-lg: 0 8px 24px rgba(67, 97, 238, 0.12);
                  --radius-sm: 6px;
                  --radius-md: 12px;
                  --radius-lg: 16px;
                  --transition: all 0.3s ease;
                  --font-main: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              }

              /* Dashboard Layout */
              .dashboard {
                  font-family: var(--font-main);
                  background-color: var(--color-background);
                  color: var(--color-text);
                  min-height: 100vh;
                  padding-bottom: 40px;
              }

              .dashboard-container {
                  min-height: 100vh;
                  background-color: #f9fafb;
                  padding-bottom: 40px;
              }

              .section-container {
                  max-width: 1280px;
                  margin: 0 auto;
                  padding: 0 24px;
              }

              .section-header {
                  margin-bottom: 20px;
              }

              .section-header h2 {
                  font-size: 20px;
                  font-weight: 600;
                  color: var(--color-dark);
                  margin: 0;
              }

              /* Header Styles */
              .header {
                  background-color: white;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }

              .header-content {
                  max-width: 1280px;
                  margin: 0 auto;
                  padding: 16px 24px;
              }

              .header-title {
                  font-size: 24px;
                  font-weight: bold;
                  color: #111827;
                  margin: 0;
              }

              .header-actions {
                  display: flex;
                  gap: 8px;
              }

              .export-button {
                  background-color: #2563eb;
                  color: white;
                  padding: 8px 16px;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 14px;
              }

              .export-button:hover {
                  background-color: #1d4ed8;
              }

              /* Loading Screen */
              .dashboard-loading {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  background-color: var(--color-background);
                  text-align: center;
                  padding: 24px;
              }

              .loading-spinner,
              .loading-icon {
                  margin-bottom: 24px;
                  animation: spin 1s linear infinite;
              }

              @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
              }

              .dashboard-loading h2,
              .loading-text {
                  font-size: 24px;
                  color: var(--color-dark);
                  margin-bottom: 12px;
              }

              .dashboard-loading p,
              .loading-subtext {
                  color: var(--color-text-light);
                  max-width: 400px;
                  margin: 0 auto;
              }

              /* Filters Section */
              .filters-section {
  background-color: var(--color-white);
  padding: 24px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  margin-bottom: 24px;
}

.filters-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-dark);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filters-title svg {
  width: 20px;
  height: 20px;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  align-items: flex-end;
}

.filter-group {
  margin-bottom: 0;
}

.filter-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--color-text);
}

              .date-range-container {
  display: flex;
  gap: 8px;
}

              .date-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  transition: var(--transition);
}
              .date-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.1);
}


.date-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.1);
}

.reset-button {
  padding: 10px 16px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}

.reset-button:hover {
  background-color: #1d4ed8;
}
              .select-container {
                  position: relative;
              }

              .select-input {
                  display: block;
                  width: 100%;
                  padding: 8px 40px 8px 12px;
                  font-size: 16px;
                  border: 1px solid #d1d5db;
                  border-radius: 6px;
                  appearance: none;
                  background-color: white;
              }

              .select-icon {
                  position: absolute;
                  right: 12px;
                  top: 10px;
                  width: 20px;
                  height: 20px;
                  color: #9ca3af;
                  pointer-events: none;
              }

              .filter-actions {
                  display: flex;
                  align-items: flex-end;
                  margin-bottom: 16px;
              }

              .btn-reset {
                  background-color: var(--color-light);
                  color: var(--color-text);
                  border: none;
                  padding: 10px 16px;
                  border-radius: var(--radius-sm);
                  font-size: 14px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: var(--transition);
              }

              .btn-reset:hover {
                  background-color: #e9ecef;
              }

              .search-container {
                  position: relative;
              }

              .search-input {
                  display: block;
                  width: 100%;
                  padding: 8px 40px 8px 40px;
                  font-size: 16px;
                  border: 1px solid #d1d5db;
                  border-radius: 6px;
              }

              .search-icon {
                  position: absolute;
                  left: 12px;
                  top: 10px;
                  width: 20px;
                  height: 20px;
                  color: #9ca3af;
              }

              /* Summary Cards */
              .summary-cards-section {
                  margin-bottom: 24px;
              }

              .summary-cards-container {
                  max-width: 1280px;
                  margin: 0 auto;
                  padding: 0 24px;
              }

              .summary-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

              .summary-card {
  background-color: var(--color-white);
  border-radius: var(--radius-md);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: 12px;
}


              .summary-card:hover {
                  transform: translateY(-2px);
                  box-shadow: var(--shadow-md);
              }

              .summary-card-content {
                  display: flex;
                  align-items: center;
              }

              .card-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(67, 97, 238, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

              .card-icon.green,
              .summary-icon-green {
                  background-color: rgba(60, 207, 78, 0.1);
                  color: var(--color-secondary);
              }

              .card-icon.amber,
              .summary-icon-yellow {
                  background-color: rgba(252, 163, 17, 0.1);
                  color: var(--color-warning);
              }

              .card-icon.purple,
              .summary-icon-purple {
                  background-color: rgba(247, 37, 133, 0.1);
                  color: var(--color-accent);
              }

              .summary-icon-blue {
                  color: #2563eb;
              }

              .card-content h3,
              .summary-stats-value {
                  font-size: 24px;
                  font-weight: 600;
                  margin: 0 0 4px;
                  color: var(--color-dark);
              }

              .card-content p,
              .summary-stats-label {
                  font-size: 14px;
                  color: var(--color-text-light);
                  margin: 0;
              }

              /* Charts Section */
              .charts-section {
  width: 100%;
  margin-bottom: 24px;
}

              .charts-container {
                  max-width: 1280px;
                  margin: 0 auto;
                  padding: 0 24px;
                  margin-bottom: 24px;
              }

              .charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  width: 100%;
}

              .chart-card {
  width: 100%;
  background-color: var(--color-white);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

              .chart-header {
                  margin-bottom: 20px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
              }

               .chart-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-dark);
    flex-grow: 1; /* Ensures title takes available space, pushing buttons to the right */
  }

              .chart-title h3 {
                  font-size: 16px;
                  font-weight: 600;
                  margin: 0;
                  color: var(--color-dark);
              }

              .chart-icon {
                  width: 20px;
                  height: 20px;
                  color: #6b7280;
                  margin-right: 8px;
              }

              .chart-subtitle {
                  font-size: 13px;
                  color: var(--color-text-light);
                  margin: 0;
              }

              .chart-body {
                  height: 280px;
              }

              .chart-container {
                  height: 256px;
              }

              .chart-footer {
                  display: flex;
                  gap: 20px;
                  margin-top: 16px;
                  padding-top: 16px;
                  border-top: 1px solid var(--color-border);
              }

              .chart-stat {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  font-size: 13px;
              }

              .stat-indicator {
                  width: 12px;
                  height: 12px;
                  border-radius: 2px;
                  display: inline-block;
              }

              .icon-wrapper {
                  width: 36px;
                  height: 36px;
                  border-radius: 10px;
                  background: #f0f7ff;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #1A005D;
              }

              .time-period {
                  font-size: 0.75rem;
                  background: #f3f4f6;
                  color: #6b7280;
                  padding: 0.25rem 0.75rem;
                  border-radius: 999px;
                  margin-left: auto;
              }

              /* Stats Summary Card */
              .stats-summary-card {
                  background: white;
                  border-radius: 16px;
                  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
                  padding: 0.5rem;
                  transition: transform 0.3s ease, box-shadow 0.3s ease;
              }

              .stats-summary-card:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.08);
              }

              .stats-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                  gap: 20px;
              }

              .stat-item {
                  text-align: center;
                  padding: 1px;
                  background-color: #f9fafc;
                  border-radius: 10px;
                  transition: background 0.3s ease;
              }

              .stat-item:hover {
                  background: #eef3f8;
                  transform: translateY(-2px);
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
              }

              .stat-item.highlight {
                  background: linear-gradient(135deg, #f0f7ff 0%, #e1effe 100%);
                  border: 1px solid #d9d0f0;
              }

              .stat-icon {
                  width: 36px;
                  height: 36px;
                  border-radius: 8px;
                  background: rgba(59, 130, 246, 0.1);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #1A005D;
                  margin-bottom: 0.75rem;
              }

              .stat-content {
                  display: flex;
                  flex-direction: column;
                  gap: 0.25rem;
              }

              .stat-value {
                  font-size: 24px;
                  font-weight: bold;
                  color: #1A005D;
                  margin-bottom: 6px;
              }

              .stat-label {
                  font-size: 14px;
                  color: #666;
              }

              .stat-trend {
                  font-size: 0.7rem;
                  display: flex;
                  align-items: center;
                  gap: 0.25rem;
                  margin-top: 0.5rem;
              }

              .stat-trend.positive {
                  color: #10b981;
              }

              .stat-trend.warning {
                  color: #f59e0b;
              }

              .stat-trend.negative {
                  color: #ef4444;
              }

              .stat-trend.neutral {
                  color: #6b7280;
              }

              .stat-progress {
                  height: 4px;
                  background: #e5e7eb;
                  border-radius: 999px;
                  margin-top: 0.75rem;
                  overflow: hidden;
              }

              /* Progress Section */
              .progress-section {
                  margin-bottom: 24px;
                  font-family: 'Inter', sans-serif;
                  padding: 1rem 0;
              }

              .progress-card {
                  background-color: var(--color-white);
                  border-radius: var(--radius-md);
                  padding: 20px;
                  box-shadow: var(--shadow-sm);
                  overflow: hidden;
              }

              .progress-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 20px;
              }

              .progress-title {
                  display: flex;
                  align-items: center;
                  gap: 8px;
              }

              .progress-title h3 {
                  font-size: 16px;
                  font-weight: 600;
                  margin: 0;
                  color: var(--color-dark);
              }

              .icon-circle {
                  width: 36px;
                  height: 36px;
                  border-radius: 50%;
                  background: #e0e7ff;
                  display: flex;
                  align-items: center;
                  justify-content: center;
              }

              .progress-summary {
                  display: flex;
                  gap: 1.5rem;
              }

              .summary-item {
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  font-size: 0.875rem;
                  color: #4b5563;
              }

              .dot {
                  width: 8px;
                  height: 8px;
                  border-radius: 50%;
              }

              .dot.completed {
                  background: #10b981;
              }

              .dot.in-progress {
                  background: #3b82f6;
              }

              .progress-body {
                  margin-bottom: 24px;
              }

              .progress-item {
                  margin-bottom: 16px;
              }

              .progress-info {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 8px;
              }

              .progress-label {
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  font-weight: 500;
                  color: #374151;
                  font-size: 14px;
              }

              .label-icon {
                  font-size: 0.9rem;
              }

              .progress-percentage {
                  font-size: 14px;
                  font-weight: 600;
                  color: var(--color-dark);
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
              }

              .percentage-change {
                  font-size: 0.75rem;
                  font-weight: 500;
                  padding: 0.15rem 0.5rem;
                  border-radius: 999px;
                  background: #f3f4f6;
                  display: flex;
                  align-items: center;
                  gap: 0.25rem;
              }

              .progress-bar-container {
                  background-color: var(--color-light);
                  border-radius: 4px;
                  overflow: hidden;
                  position: relative;
                  height: 8px;
              }

              .progress-bar {
                  height: 100%;
                  border-radius: 4px;
                  position: relative;
                  transition: width 0.6s ease;
              }

              .progress-bar.completed,
              .completed-bar {
                  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
              }

              .progress-bar.in-progress,
              .in-progress-bar {
                  background: linear-gradient(90deg, #1A005D 0%, #93c5fd 100%);
              }

              .progress-bar.participation,
              .participation-bar {
                  background: linear-gradient(90deg, #8b5cf6 0%, #c4b5fd 100%);
              }

              .progress-bar-tooltip {
                  position: absolute;
                  right: 0;
                  top: -30px;
                  background: #1A005D;
                  color: white;
                  padding: 0.25rem 0.5rem;
                  border-radius: 4px;
                  font-size: 0.75rem;
                  opacity: 0;
                  transition: opacity 0.2s;
                  pointer-events: none;
              }

              .progress-bar:hover .progress-bar-tooltip {
                  opacity: 1;
              }

              .progress-stats {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                  gap: 1.5rem;
              }

              .stat-group {
                  background: #f9fafb;
                  border-radius: 8px;
                  padding: 1.25rem;
              }

              .stat-header {
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  margin-bottom: 1rem;
              }

              .stat-header h4 {
                  font-size: 1rem;
                  font-weight: 600;
                  color: #1f2937;
                  margin: 0;
              }

              .stat-metrics {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 1rem;
              }

              .stat-box {
                  background: white;
                  border-radius: 8px;
                  padding: 1rem;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                  border-left: 4px solid transparent;
              }

              .stat-box.positive {
                  border-left-color: #10b981;
              }

              .stat-box.warning {
                  border-left-color: #f59e0b;
              }

              .stat-box.negative {
                  border-left-color: #ef4444;
              }

              .stat-box.highlight {
                  border-left-color: #1A005D;
              }

              .stat-number {
                  font-size: 1.5rem;
                  font-weight: 700;
                  color: #1f2937;
                  margin-bottom: 0.25rem;
              }

              .stat-text {
                  font-size: 0.875rem;
                  color: #6b7280;
                  margin-bottom: 0.5rem;
              }

              .stat-percentage {
                  font-size: 0.75rem;
                  color: #6b7280;
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
              }

              .percentage-bar {
                  height: 4px;
                  background: #e5e7eb;
                  border-radius: 999px;
                  overflow: hidden;
                  flex-grow: 1;
              }

              .percentage-bar::before {
                  content: '';
                  display: block;
                  height: 100%;
                  background: currentColor;
              }

              .stat-box.positive .percentage-bar::before {
                  background: #10b981;
              }

              .stat-box.warning .percentage-bar::before {
                  background: #f59e0b;
              }

              .stat-box.negative .percentage-bar::before {
                  background: #ef4444;
              }

              .stat-description {
                  font-size: 0.75rem;
                  color: #9ca3af;
              }

              /* Training Stats Section */
              .training-stats-container {
                  max-width: 1280px;
                  margin: 0 auto;
                  padding: 0 24px;
                  margin-bottom: 40px;
              }

              .training-stats-card {
                  background-color: white;
                  border-radius: 8px;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }

              .training-stats-header {
                  padding: 16px 24px;
                  border-bottom: 1px solid #e5e7eb;
              }

              .training-stats-header-content {
                  display: flex;
                  align-items: center;
              }

              .training-stats-icon {
                  width: 20px;
                  height: 20px;
                  color: #6b7280;
                  margin-right: 8px;
              }

              .training-stats-title {
                  font-size: 18px;
                  font-weight: 600;
                  color: #111827;
                  margin: 0;
              }

              .completion-stats {
                  background-color: #eff6ff;
              }

              .participation-stats {
                  background-color: #f5f3ff;
              }

              .hours-stats {
                  background-color: #ecfdf5;
              }

              .stat-title {
                  font-size: 16px;
                  font-weight: 600;
                  margin: 0 0 16px 0;
                  color: inherit;
              }

              .stat-content {
                  display: inline-block;
                  flex-direction: column;
                  gap: 16px;
              }

              .stat-row {
                  display: flex;
                  justify-content: space-between;
                  gap: 16px;
              }

              .stat-column {
                  flex: 1;
              }

              .stat-sub-value {
                  font-size: 20px;
                  font-weight: 600;
                  color: #111827;
                  margin: 0;
              }

              .stat-comparison {
                  margin-top: 0.5rem;
              }

              .comparison-value {
                  font-size: 0.7rem;
                  font-weight: 500;
                  padding: 0.2rem 0.5rem;
                  border-radius: 999px;
              }

              .comparison-value.positive {
                  background: #ecfdf5;
                  color: #10b981;
              }

              .comparison-value.negative {
                  background: #fef2f2;
                  color: #ef4444;
              }

              /* Pagination */
              .pagination-container {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  margin-top: 24px;
              }

              .pagination-info {
                  font-size: 14px;
                  color: #374151;
              }

              .pagination-buttons {
                  display: flex;
                  gap: 8px;
              }

              .pagination-button {
                  padding: 4px 12px;
                  border-radius: 6px;
                  border: none;
                  cursor: pointer;
                  font-size: 14px;
              }

              .pagination-button-active {
                  background-color: #2563eb;
                  color: white;
              }

              .pagination-button-inactive {
                  background-color: #e5e7eb;
                  color: #111827;
              }

              .pagination-button-disabled {
                  background-color: #f3f4f6;
                  color: #9ca3af;
                  cursor: not-allowed;
              }

              /* Responsive Adjustments */
              @media (max-width: 100px) {
                 
                  
                  .filters-grid {
                      grid-template-columns: 1fr 1fr;
                  }
              }

              @media (min-width: 1024px) {
                  
              }
     

              @media (max-width: 768px) {
                    .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-body {
    height: 500px;
  }
                  
                  .summary-cards-grid {
                      grid-template-columns: 1fr 1fr;
                  }
                  
                  .progress-stats {
                      grid-template-columns: 1fr;
                  }
                  
                  .stat-metrics {
                      flex-direction: column;
                      gap: 8px;
                  }
                     .chart-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
}
  .chart-title {
  flex: 1;
  text-align: center;
}

.chart-navigation-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
}
  .chart-navigation-buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 8px;
}

              @media (max-width: 768px) {
   .chart-navigation {
    flex-direction: row;
    align-items: center;
  }
  
  
  .nav-buttons-container {
    margin-right: auto;
  }



  .nav-button .text-sm {
  color: white;
}
  

}
              @media (min-width: 768px) {
                  .filters-grid {
                      grid-template-columns: repeat(3, 1fr);
                  }
                  
                  .summary-cards-grid {
                      grid-template-columns: repeat(2, 1fr);
                  }
                  
                  .stats-grid {
                      grid-template-columns: repeat(2, 1fr);
                  }
              }

              @media (min-width: 1024px) {
                  .summary-cards-grid {
                      grid-template-columns: repeat(4, 1fr);
                  }
                  
                  .stats-grid {
                      grid-template-columns: repeat(3, 1fr);
                  }
              }

              @media (max-width: 480px) {

                  .summary-cards-grid {
                      grid-template-columns: 1fr;
                  }
                  
                  .stats-grid {
                      grid-template-columns: 1fr 1fr;
                  }

                    .nav-button span.text-sm {
    display: none;
  }
  
  .nav-button {
    padding: 8px;
  }
  
 .chart-title-container h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-dark);
}

                  // Add this to your CSS:
.chart-navigation {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    position: relative;
    width: 100%;
  }

.chart-navigation h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-dark);
  flex-grow: 1;
  text-align: center;
}
.nav-button {
  padding: 8px 12px;
  background-color: #1A005D;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-button:hover {
  background-color: #2a00a0;
}

.nav-button svg {
  color: white;
  stroke: white;
}

.nav-button .text-sm {
  color: white;
}

 
.chart-title-container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  width: auto;
  max-width: 60%;
}

.chart-title-container h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-dark);
}
  
.nav-buttons-container {
  display: flex;
  gap: 8px;
  margin-left: auto; /* This pushes the buttons to the right */
}

/* If you want specific alignment for each button */
.nav-button.previous {
  margin-right: auto;
}

.nav-button.next {
  margin-left: auto;
}

.previous1 {
  padding-left: 2px;
}

.next1 {
  padding-right: 2px;
}
/* Dialog Styles */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
   min-height: 300px;
}

.dialog-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.dialog-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.dialog-body {
  padding: 20px;
  flex-grow: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-legend {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.color-indicator {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  display: inline-block;
}

.departments-scroll-container {
  flex-grow: 1;
  overflow: hidden;
}

.departments-list-container {
  height: 100%;
  overflow-y: auto;
}

.departments-list-scroll {
  padding-right: 8px;
}

.department-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.department-name {
  width: 200px;
  min-width: 200px;
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.department-stats {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-bar-assigned {
  height: 20px;
  background-color: #1A005D;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.stat-bar-attended {
  height: 20px;
  background-color: #FFC107;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.stat-bar-completed {
  height: 20px;
  background-color: #3ccf4e;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.stat-value {
  min-width: 40px;
  text-align: right;
  font-size: 13px;
  color: #666;
}

.dialog-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-summary {
  font-size: 14px;
  color: #666;
}

.dialog-close-button {
  padding: 8px 16px;
  background-color: #1A005D;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.dialog-close-button:hover {
  background-color: #2a00a0;
}

.empty-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #666;
  font-size: 16px;
}

.branches-scroll-container {
  max-height: 30vh; /* Fixed height for scrolling */
  overflow-y: auto; /* Enable vertical scrolling */
  margin-bottom: 16px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
}

.branches-summary {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
    font-size: 14px;
    color: #666;
  }
  
  .branches-list-container {

  }
    .branch-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    width: 100%;
  }
  .branch-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 16px;
}

.branch-name {
  width: 200px;
  min-width: 200px;
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.branch-stats {
  flex-grow: 1;
}

.branch-bar-container {
    flex-grow: 1;
    height: 30px;
    background-color: #f5f5f5;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    min-width: 100px;
  }

  .branch-bar {
    height: 100%;
    border-radius: 4px;
    position: relative;
    transition: width 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 8px;
  }

.branch-hours-container {
    flex-grow: 1;
    height: 30px;
    background-color: #f5f5f5;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

 .branch-hours-bar {
    height: 100%;
    border-radius: 4px;
    position: relative;
    transition: width 0.3s ease;
    min-width: 60px;
  }
.branch-hours-value {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    color: white;
    font-size: 12px;
    font-weight: 500;
    text-shadow: 0 1px 1px rgba(0,0,0,0.3);
  }
 .hours-scale {
    display: flex;
    justify-content: space-between;
    padding: 0 16px;
    font-size: 12px;
    color: #666;
    margin-top: 8px;
    margin-bottom: 16px;
  }
.stat-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
}

.stat-bar-hours {
  height: 30px;
  border-radius: 4px;
  position: relative;
  transition: width 0.3s ease;
  min-width: 60px; /* Ensure bar is visible even for small values */
}
.stat-bar-hours:hover::after {
  content: attr(title);
  position: absolute;
  top: -30px;
  right: 0;
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}

.stat-value {
  min-width: 60px;
  text-align: right;
  font-size: 14px;
  color: #666;
}


.dialog-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

/* Dialog Styles */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.dialog-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.dialog-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.dialog-body {
  padding: 20px;
  flex-grow: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.branches-list-container {
   // min-height: 50%;
  }


.branch-item {
    margin-bottom: 8px;
  }

.branch-name {
  width: 200px;
  min-width: 200px;
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.branch-hours {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: white;
  font-size: 12px;
  font-weight: 500;
  text-shadow: 0 1px 1px rgba(0,0,0,0.3);
}

.dialog-footer {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-summary {
  font-size: 14px;
  color: #666;
}

.dialog-close-button {
  padding: 8px 16px;
  background-color: #1A005D;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.dialog-close-button:hover {
  background-color: #2a00a0;
}

  

            `}</style>
        </div>
    );
}