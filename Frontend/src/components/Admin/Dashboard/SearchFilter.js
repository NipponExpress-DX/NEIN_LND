import React from 'react';
import TextField from '@mui/material/TextField';
import SearchIcon from '@mui/icons-material/Search';

const SearchFilter = ({ searchQuery, setSearchQuery }) => (
  <TextField
    variant="outlined"
    placeholder="Search..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    InputProps={{
      startAdornment: <SearchIcon position="start" />,
      style: {
        height: "40px",
        padding: "0 14px", 
      },
    }}
    style={{
      marginRight: "5px",
      height: "40px", 
    }}
  />
);

export default SearchFilter;
