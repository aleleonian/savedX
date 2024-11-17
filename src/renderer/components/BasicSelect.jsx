import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export function BasicSelect({ tags, handleSelectChange }) {
  const [tag, setTag] = React.useState('');

  const handleChange = (event) => {
    setTag(event.target.value);
    handleSelectChange(event);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Choose Tag</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={tag}
          label="Age"
          onChange={handleChange}
        >
          <MenuItem
            value="Clean tag filter"
            key="Clean tag filter"
          >

          </MenuItem>
          {tags.map((tag) => (
            <MenuItem
              key={tag}
              value={tag}
            >
              {tag}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
