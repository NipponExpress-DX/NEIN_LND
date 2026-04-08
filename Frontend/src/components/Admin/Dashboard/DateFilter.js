import React from 'react';
import { FormControl, MenuItem, Select } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

const DateFilter = ({ dateFilter, setDateFilter, customStartDate, setCustomStartDate, customEndDate, setCustomEndDate }) => (
  <>
    {/* Date Filter Select */}
    <FormControl
      style={{
        marginRight: '5px',
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          height: '40px', 
          padding: '0 14px',
        },
      }}
    >
      <Select
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
        size="small" // Ensuring reduced height
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="thisWeek">This Week</MenuItem>
        <MenuItem value="thisMonth">This Month</MenuItem>
        <MenuItem value="thisYear">This Year</MenuItem>
        <MenuItem value="custom">Custom Range</MenuItem>
      </Select>
    </FormControl>

    {/* Custom Date Range Pickers */}
    {dateFilter === 'custom' && (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Start Date"
          value={customStartDate}
          onChange={(date) => setCustomStartDate(date)}
          slotProps={{
            textField: {
              size: 'small',
              sx: {
                height: '40px',
                marginRight: '5px',
              },
            },
          }}
        />
        <DatePicker
          label="End Date"
          value={customEndDate}
          onChange={(date) => setCustomEndDate(date)}
          slotProps={{
            textField: {
              size: 'small', 
              sx: {
                height: '40px',
                marginRight: '5px',
                
              },
            },
          }}
        />
      </LocalizationProvider>
    )}
  </>
);

export default DateFilter;
